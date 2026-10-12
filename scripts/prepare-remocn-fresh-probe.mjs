import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  stat,
  writeFile,
} from "node:fs/promises";
import { homedir } from "node:os";
import { relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import {
  hyperframesVersion,
  referenceFingerprint,
  root,
  run,
  selectFixtures,
  upstream,
  verificationBrowser,
  workbench,
} from "./remocn-lossless-reference.mjs";
import { hashBlockFiles } from "./parity-evidence.mjs";

const args = process.argv.slice(2);
if (args.includes("--help")) {
  console.log(
    "Usage: REMOCN_SOURCE=<pristine pinned checkout> node scripts/prepare-remocn-fresh-probe.mjs --only slug\nPrepares diagnostic inputs through the existing native builder and actual CLI installer/compiler. Both render jobs are deliberately interrupted after their inputs are complete; this is not a full check or render proof.",
  );
  process.exit(0);
}
assert(
  args.length === 2 && args[0] === "--only" && !args[1].includes(","),
  "Select one fixture with --only slug",
);
const [entry] = await selectFixtures(args);
const browser = await verificationBrowser();
const referenceInput = await referenceFingerprint(entry);
const base = resolve(root, ".work/prepare-remocn-fresh-probe", entry.slug);
await mkdir(base, { recursive: true });
const output = await mkdtemp(resolve(base, "run-"));
const env = {
  ...process.env,
  REMOCN_SOURCE: upstream,
  HYPERFRAMES_NO_TELEMETRY: "1",
  npm_config_offline: "true",
  HYFRME_BROWSER_EXECUTABLE: browser.path,
  HYPERFRAMES_BROWSER_PATH: browser.path,
};
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function hashes(directory) {
  const result = {};
  async function visit(path) {
    for (const item of (await readdir(path, { withFileTypes: true })).sort(
      (a, b) => a.name.localeCompare(b.name),
    )) {
      const child = resolve(path, item.name);
      if (item.isDirectory()) await visit(child);
      else {
        assert(item.isFile(), `Unexpected input ${child}`);
        result[relative(directory, child)] = hash(await readFile(child));
      }
    }
  }
  await visit(directory);
  return result;
}
const save = (path, value) =>
  writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
const manifest = JSON.parse(
  await readFile(
    resolve(root, "registry/blocks", entry.slug, "registry-item.json"),
    "utf8",
  ),
);
const initialBlockHashes = await hashBlockFiles(
  resolve(root, "registry/blocks", entry.slug),
  manifest,
);
let sdk;
for (const name of (await readdir(resolve(homedir(), ".npm/_npx"))).sort()) {
  const candidate = resolve(
    homedir(),
    ".npm/_npx",
    name,
    "node_modules/hyperframes",
  );
  const metadata = await readFile(resolve(candidate, "package.json"), "utf8")
    .then(JSON.parse)
    .catch(() => null);
  if (metadata?.version === hyperframesVersion) {
    sdk = candidate;
    break;
  }
}
assert(sdk, "Pinned CLI is not cached; installation is disabled");
async function authorityHashes() {
  return {
    sdk: await hashes(resolve(sdk, "dist")),
    cli: hash(await readFile(resolve(sdk, "bin/hyperframes.mjs"))),
    browser: hash(await readFile(browser.path)),
    preparer: hash(await readFile(import.meta.filename)),
    builder: hash(
      await readFile(resolve(root, "scripts/remocn-lossless-reference.mjs")),
    ),
    installer: hash(await readFile(resolve(root, "cli/bin/hyfrme.mjs"))),
  };
}
const authorities = await authorityHashes();
await save(resolve(output, "initial-inputs.json"), {
  source: entry.origin,
  fixture: entry.fixture,
  referenceFingerprint: referenceInput,
  blockHashes: initialBlockHashes,
  authorities,
  builderSha256: hash(
    await readFile(resolve(root, "scripts/remocn-lossless-reference.mjs")),
  ),
  installerSha256: hash(await readFile(resolve(root, "cli/bin/hyfrme.mjs"))),
});
const pause = (ms) => new Promise((accept) => setTimeout(accept, ms));
async function identity(pid) {
  const status = await readFile(`/proc/${pid}/stat`, "utf8").catch(() => null);
  if (!status) return null;
  const fields = status.slice(status.lastIndexOf(") ") + 2).split(" ");
  return {
    pid,
    state: fields[0],
    group: Number(fields[2]),
    started: fields[19],
  };
}
async function ownedBrowsers(pid) {
  const browsers = [];
  async function visit(parent) {
    const children = await readFile(
      `/proc/${parent}/task/${parent}/children`,
      "utf8",
    ).catch(() => "");
    for (const child of children
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(Number)) {
      const command = await readFile(`/proc/${child}/cmdline`, "utf8").catch(
        () => "",
      );
      if (
        command.includes("chrome-headless-shell") &&
        !command.includes("--type=")
      ) {
        const process = await identity(child);
        if (process)
          browsers.push({
            ...process,
            command: command.split("\0").filter(Boolean),
          });
      }
      await visit(child);
    }
  }
  await visit(pid);
  return browsers;
}
const jobs = [];
async function untilPrepared(label, command, arguments_, cwd, ready) {
  const started = Date.now();
  const child = spawn(command, arguments_, {
    cwd,
    env,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert(Number.isInteger(child.pid));
  const chunks = [];
  child.stdout.on("data", (chunk) => chunks.push(chunk));
  child.stderr.on("data", (chunk) => chunks.push(chunk));
  let outcome;
  let failure;
  child.on("error", (error) => {
    failure = error;
  });
  const exited = new Promise((accept) =>
    child.on("exit", (code, signal) => {
      outcome = { code, signal };
      accept(outcome);
    }),
  );
  const job = {
    label,
    pid: child.pid,
    command,
    arguments: arguments_,
    cwd,
    deliberateInterruption: false,
  };
  jobs.push(job);
  try {
    while (!outcome && !failure && Date.now() - started < 120000) {
      const prepared = await ready(started).catch((error) => {
        if (error.code === "ENOENT") return null;
        throw error;
      });
      if (prepared) {
        job.prepared = prepared;
        job.deliberateInterruption = true;
        break;
      }
      await pause(100);
    }
    assert(!failure, failure?.message);
    assert(
      job.deliberateInterruption,
      `${label} exited or timed out before complete diagnostic inputs`,
    );
  } finally {
    job.ownedBrowsers = await ownedBrowsers(child.pid);
    // Stop the job group; Remotion may launch Chrome in a separate group.
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch (error) {
      if (error.code !== "ESRCH") throw error;
    }
    await Promise.race([exited, pause(3000)]);
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch (error) {
      if (error.code !== "ESRCH") throw error;
    }
    if (!outcome) await exited;
    for (const browser of job.ownedBrowsers) {
      const current = await identity(browser.pid);
      if (
        current &&
        current.started === browser.started &&
        current.state !== "Z"
      ) {
        assert.equal(current.group, browser.group);
        process.kill(-browser.group, "SIGTERM");
        await pause(100);
        const remaining = await identity(browser.pid);
        if (
          remaining &&
          remaining.started === browser.started &&
          remaining.state !== "Z"
        )
          process.kill(-browser.group, "SIGKILL");
      }
    }
    job.browserCleanupConfirmed = (
      await Promise.all(
        job.ownedBrowsers.map(async (browser) => {
          const current = await identity(browser.pid);
          return (
            !current ||
            current.started !== browser.started ||
            current.state === "Z"
          );
        }),
      )
    ).every(Boolean);
    assert(
      job.browserCleanupConfirmed,
      "Owned diagnostic browser remains active",
    );
    job.exit = outcome;
    await writeFile(resolve(output, `${label}.log`), Buffer.concat(chunks));
    await save(resolve(output, "jobs.json"), jobs);
  }
  return job.prepared;
}
const native = resolve(workbench, entry.slug);
const bundle = resolve(native, "bundle");
await untilPrepared(
  "native-build",
  process.execPath,
  [
    "--input-type=module",
    "-e",
    `const m=await import(${JSON.stringify(pathToFileURL(resolve(root, "scripts/remocn-lossless-reference.mjs")).href)});await m.renderReferences(await m.selectFixtures(["--only",${JSON.stringify(entry.slug)}]));`,
  ],
  root,
  async (started) => {
    if ((await stat(resolve(bundle, "index.html"))).mtimeMs < started)
      return null;
    const publicAssets = await hashes(resolve(native, "public/assets"));
    const bundleAssets = await hashes(resolve(bundle, "assets"));
    if (JSON.stringify(publicAssets) !== JSON.stringify(bundleAssets))
      return null;
    return {
      stage:
        "native bundle and frozen assets complete; reference capture interrupted",
      bundleHashes: await hashes(bundle),
      rootSha256: hash(await readFile(resolve(native, "root.tsx"))),
    };
  },
);

const project = resolve(output, "installed");
await mkdir(project);
await save(resolve(project, "hyperframes.json"), {
  $schema: "https://hyperframes.heygen.com/schema/hyperframes.json",
  paths: {
    blocks: "compositions",
    components: "compositions/components",
    assets: "assets",
  },
});
await save(resolve(project, "package.json"), {
  private: true,
  type: "module",
  scripts: {
    check: `npx --yes hyperframes@${hyperframesVersion} check`,
    render: `npx --yes hyperframes@${hyperframesVersion} render`,
  },
});
await save(resolve(project, "meta.json"), {
  id: `probe-${entry.slug}`,
  name: `Probe ${entry.title}`,
});
const registry = resolve(root, "registry");
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", "http://localhost");
    const path = resolve(registry, `.${decodeURIComponent(url.pathname)}`);
    assert(path.startsWith(`${registry}${sep}`));
    response.end(await readFile(path));
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});
await new Promise((accept) => server.listen(0, "127.0.0.1", accept));
try {
  const installed = await run(
    process.execPath,
    [resolve(root, "cli/bin/hyfrme.mjs"), "add", entry.slug, "--dir", project],
    {
      env: {
        ...env,
        HYFRME_REGISTRY_URL: `http://127.0.0.1:${server.address().port}`,
      },
    },
  );
  await writeFile(resolve(output, "install.log"), installed.output);
} finally {
  await new Promise((accept) => server.close(accept));
}
const canonicalRootPath = resolve(
  root,
  ".work/verify-remocn-lossless",
  entry.slug,
  "installed/index.html",
);
const canonicalRoot = await readFile(canonicalRootPath, "utf8");
for (const attribute of [
  `data-composition-id="verify-${entry.slug}"`,
  `data-composition-src="compositions/${entry.slug}.html"`,
  `data-width="${entry.fixture.width}"`,
  `data-height="${entry.fixture.height}"`,
  `data-fps="${entry.fixture.fps}"`,
  `data-duration="${entry.fixture.durationInFrames / entry.fixture.fps}"`,
])
  assert(
    canonicalRoot.includes(attribute),
    `Canonical root is missing ${attribute}`,
  );
await writeFile(resolve(project, "index.html"), canonicalRoot);
env.PRODUCER_RENDERS_DIR = resolve(output, "renders");
const compilerInputs = await hashes(project);
const compiledDir = await untilPrepared(
  "cli-compile",
  process.execPath,
  [
    resolve(sdk, "bin/hyperframes.mjs"),
    "render",
    "--format",
    "png-sequence",
    "--quality",
    "high",
    "--video-frame-format",
    "png",
    "--output",
    resolve(output, "interrupted-frames"),
    "--strict-all",
    "--workers",
    "1",
    "--browser-gpu",
    "--debug",
  ],
  project,
  async () => {
    const runs = await readdir(resolve(output, ".debug"));
    if (runs.length === 0) return null;
    assert.equal(runs.length, 1);
    const compiled = resolve(output, ".debug", runs[0], "compiled");
    const summary = JSON.parse(
      await readFile(resolve(compiled, "summary.json"), "utf8"),
    );
    for (const key of ["width", "height"])
      assert.equal(summary[key], entry.fixture[key]);
    assert.equal(
      summary.staticDuration,
      entry.fixture.durationInFrames / entry.fixture.fps,
    );
    assert(summary.subCompositions.includes(`compositions/${entry.slug}.html`));
    await readFile(resolve(compiled, "index.html"));
    for (const composition of summary.subCompositions)
      await readFile(resolve(compiled, composition));
    return compiled;
  },
);
assert.equal(
  await referenceFingerprint(entry),
  referenceInput,
  "Native inputs changed during preparation",
);
assert.deepEqual(
  await hashes(project),
  compilerInputs,
  "Installed compiler inputs changed",
);
assert.deepEqual(
  await hashBlockFiles(resolve(root, "registry/blocks", entry.slug), manifest),
  initialBlockHashes,
  "Block inputs changed during preparation",
);
assert.deepEqual(
  await hashes(bundle),
  jobs[0].prepared.bundleHashes,
  "Native bundle changed after preparation",
);
assert.deepEqual(
  await authorityHashes(),
  authorities,
  "Compiler/browser/preparer authority changed",
);
const prepared = {
  diagnosticOnly: true,
  fullCheckOrRenderProof: false,
  slug: entry.slug,
  source: entry.origin,
  fixture: entry.fixture,
  project,
  compiledDir,
  bundle,
  referenceFingerprint: referenceInput,
  canonicalRoot: { path: canonicalRootPath, sha256: hash(canonicalRoot) },
  jobs,
  hashes: {
    installed: await hashes(project),
    compiled: await hashes(compiledDir),
    nativeBundle: await hashes(bundle),
    sdk: await hashes(resolve(sdk, "dist")),
    block: await hashBlockFiles(
      resolve(root, "registry/blocks", entry.slug),
      manifest,
    ),
    browser: hash(await readFile(browser.path)),
    preparer: hash(await readFile(import.meta.filename)),
  },
};
await save(resolve(output, "prepared.json"), prepared);
console.log(
  JSON.stringify({
    slug: entry.slug,
    project,
    compiledDir,
    bundle,
    evidence: resolve(output, "prepared.json"),
    diagnosticOnly: true,
  }),
);
