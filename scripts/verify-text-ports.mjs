import { spawn } from "node:child_process";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const workbench = resolve(root, ".work", "verify-text");
const fixtureFiles = [
  "text-fixtures.json",
  "core-fixtures.json",
  "primitive-fixtures.json",
];
const fixtures = (
  await Promise.all(
    fixtureFiles.map((file) =>
      readFile(resolve(root, "catalog", file), "utf8")
        .then(JSON.parse)
        .catch(() => []),
    ),
  )
).flat();
const familyIndex = process.argv.indexOf("--family");
const family = familyIndex === -1 ? null : process.argv[familyIndex + 1];
const familyFixtures = family
  ? fixtures.filter((entry) => entry.catalogFamily === family)
  : fixtures;
const onlyIndex = process.argv.indexOf("--only");
const requested =
  onlyIndex === -1 ? null : new Set(process.argv[onlyIndex + 1].split(","));
const selected = requested
  ? familyFixtures.filter((entry) => requested.has(entry.slug))
  : familyFixtures;
const fullCheckIndex = process.argv.indexOf("--full-check");
const fullCheck =
  fullCheckIndex === -1
    ? new Set()
    : new Set(process.argv[fullCheckIndex + 1].split(","));
const reuseReference = process.argv.includes("--reuse-reference");

if (requested && selected.length !== requested.size) {
  throw new Error(
    `Expected ${requested.size} fixtures, found ${selected.length}`,
  );
}

const run = (command, args, options = {}) =>
  new Promise((accept, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? root,
      env: { ...process.env, ...options.env },
      stdio: options.quiet ? "pipe" : "inherit",
    });
    let output = "";
    if (options.quiet) {
      child.stdout.on("data", (chunk) => (output += chunk));
      child.stderr.on("data", (chunk) => (output += chunk));
    }
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) accept(output);
      else reject(new Error(`${command} exited ${code}\n${output}`));
    });
  });

if (!reuseReference) {
  await run("node", ["scripts/generate-text-reference.mjs"]);
  await run(
    "bun",
    [
      "scripts/hyfrme-render-text.mts",
      "--only",
      selected.map((entry) => entry.slug).join(","),
    ],
    { cwd: resolve(root, ".work", "remocn") },
  );
}

await mkdir(resolve(workbench, "assets", "fonts"), { recursive: true });
await copyFile(
  resolve(root, "registry", "blocks", "soft-blur-in", "Geist-SemiBold.woff2"),
  resolve(workbench, "assets", "fonts", "Geist-SemiBold.woff2"),
);
await writeFile(
  resolve(workbench, "package.json"),
  `${JSON.stringify(
    {
      name: "hyfrme-text-verification",
      private: true,
      type: "module",
      scripts: {
        check: "npx --yes hyperframes@0.7.64 check",
        render: "npx --yes hyperframes@0.7.64 render",
      },
    },
    null,
    2,
  )}\n`,
);
await writeFile(
  resolve(workbench, "hyperframes.json"),
  `${JSON.stringify(
    {
      $schema: "https://hyperframes.heygen.com/schema/hyperframes.json",
      registry:
        "https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry",
      paths: {
        blocks: "compositions",
        components: "compositions/components",
        assets: "assets",
      },
      media: { autoProxy: true },
    },
    null,
    2,
  )}\n`,
);
await writeFile(
  resolve(workbench, "meta.json"),
  '{"id":"hyfrme-text-verification","name":"Hyfrme text verification"}\n',
);

const diffScript = resolve(
  "/Users/aksharpatel/.agents/skills/remotion-to-hyperframes/scripts/render_diff.sh",
);
const failures = [];

for (const [index, entry] of selected.entries()) {
  const label = `[${index + 1}/${selected.length}] ${entry.slug}`;
  const renderDirectory = resolve(root, ".work", "renders", "text", entry.slug);
  const sourceHtml = await readFile(
    resolve(root, "registry", "blocks", entry.slug, `${entry.slug}.html`),
    "utf8",
  );
  await writeFile(
    resolve(workbench, "index.html"),
    sourceHtml.replaceAll("../assets/fonts/", "./assets/fonts/"),
  );
  await copyFile(
    resolve(root, "registry", "blocks", entry.slug, `${entry.slug}.runtime.js`),
    resolve(workbench, `${entry.slug}.runtime.js`),
  );

  if (fullCheck.has(entry.slug)) {
    process.stdout.write(`${label} HyperFrames check… `);
    await run("npm", ["run", "check"], { cwd: workbench, quiet: true });
    process.stdout.write("passed; ");
  } else {
    process.stdout.write(`${label} `);
  }

  await mkdir(renderDirectory, { recursive: true });
  process.stdout.write("render… ");
  await run(
    "npm",
    [
      "run",
      "render",
      "--",
      "--output",
      resolve(renderDirectory, "hyperframes.mp4"),
      "--quality",
      "high",
      "--strict-all",
      "--workers",
      "4",
      "--quiet",
    ],
    { cwd: workbench, quiet: true },
  );
  process.stdout.write("compare… ");
  const diffDirectory = resolve(renderDirectory, "diff");
  await run(
    diffScript,
    [
      resolve(renderDirectory, "remocn.mp4"),
      resolve(renderDirectory, "hyperframes.mp4"),
      diffDirectory,
    ],
    { env: { R2HF_SSIM_THRESHOLD: "0.95" }, quiet: true },
  );
  const summary = JSON.parse(
    await readFile(resolve(diffDirectory, "summary.json"), "utf8"),
  );

  if (!summary.pass) {
    failures.push({ slug: entry.slug, summary });
    process.stdout.write(`FAILED ${summary.mean.toFixed(6)}\n`);
    continue;
  }

  const previewDirectory = resolve(root, "public", "previews", entry.slug);
  const parityDiffDirectory = resolve(root, "parity", `${entry.slug}-diff`);
  await mkdir(previewDirectory, { recursive: true });
  await mkdir(parityDiffDirectory, { recursive: true });
  await copyFile(
    resolve(renderDirectory, "remocn.mp4"),
    resolve(previewDirectory, "remocn.mp4"),
  );
  await copyFile(
    resolve(renderDirectory, "hyperframes.mp4"),
    resolve(previewDirectory, "hyperframes.mp4"),
  );
  await copyFile(
    resolve(diffDirectory, "summary.json"),
    resolve(parityDiffDirectory, "summary.json"),
  );
  await writeFile(
    resolve(root, "parity", `${entry.slug}.json`),
    `${JSON.stringify(
      {
        slug: entry.slug,
        origin: entry.origin,
        fixture: entry.fixture,
        classification: "compiled-source-port",
        status: "verified",
        thresholds: { meanSsim: 0.95 },
        result: {
          frameCount: summary.frame_count,
          meanSsim: summary.mean,
          minSsim: summary.min,
          p05Ssim: summary.p05,
          p95Ssim: summary.p95,
          pass: summary.pass,
        },
        checks: {
          hyperframes: fullCheck.has(entry.slug)
            ? "0 errors, 0 warnings; runtime and layout passed"
            : "strict render passed",
        },
        artifacts: {
          remocnVideo: `public/previews/${entry.slug}/remocn.mp4`,
          hyperframesVideo: `public/previews/${entry.slug}/hyperframes.mp4`,
          summary: `parity/${entry.slug}-diff/summary.json`,
        },
      },
      null,
      2,
    )}\n`,
  );
  process.stdout.write(`passed ${summary.mean.toFixed(6)}\n`);
}

if (failures.length > 0) {
  console.error(JSON.stringify({ failures }, null, 2));
  process.exit(1);
}

console.log(
  `Verified ${selected.length} compiled ${family ?? "mixed"} port(s).`,
);
