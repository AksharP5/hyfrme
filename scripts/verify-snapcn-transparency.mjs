import { createServer } from "node:http";
import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  writeFile,
} from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import { snapcnSources } from "./run-snapcn.mjs";

const root = resolve(import.meta.dirname, "..");
const slugs = ["snapcn-card-rail", "snapcn-orbit-gallery"];
const source = (await snapcnSources()).find(({ slugs: available }) =>
  slugs.every((slug) => available.includes(slug)),
);
if (!source)
  throw new Error(
    "Transparent fixtures require their recorded source checkout",
  );
process.env.SNAPCN_SOURCE = source.directory;
process.env.HYPERFRAMES_NO_TELEMETRY = "1";
const {
  run,
  selectFixtures,
  renderReferences,
  verificationBrowser,
  hyperframesVersion,
  remotionVersion,
  referenceGl,
} = await import("./generate-snapcn-reference.mjs");
const { compareAlphaFrames, normalizeSnapshotFrames } =
  await import("./snapcn-alpha.mjs");
const fixtures = await selectFixtures(["--only", slugs.join(",")]);
const workspace = await mkdtemp(
  resolve(root, ".work/verify-snapcn-transparency-"),
);
const browserPath =
  process.env.HYFRME_BROWSER_EXECUTABLE ??
  (
    await run("npx", [
      "--yes",
      `hyperframes@${hyperframesVersion}`,
      "browser",
      "path",
    ])
  ).output
    .trim()
    .split("\n")
    .at(-1);
const wrapper = resolve(workspace, "browser");
// CPU rasterization removes rounded-edge jitter; GPU compositing and GL remain enabled.
await writeFile(
  wrapper,
  `#!/bin/sh\nexec '${browserPath.replaceAll("'", "'\\''")}' "$@" --disable-gpu-rasterization\n`,
  { mode: 0o755 },
);
process.env.HYFRME_BROWSER_EXECUTABLE = wrapper;
const browser = await verificationBrowser();
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const fileHash = async (path) => sha256(await readFile(path));
const scriptSha256 = await fileHash(import.meta.filename);
const registry = resolve(root, "registry");
const server = createServer(async (request, response) => {
  try {
    const path = resolve(
      registry,
      `.${decodeURIComponent(new URL(request.url, "http://localhost").pathname)}`,
    );
    if (!path.startsWith(registry + sep))
      throw new Error("Unsafe registry path");
    response.end(await readFile(path));
  } catch {
    response.writeHead(404);
    response.end("Missing registry file");
  }
});
await new Promise((accept) => server.listen(0, "127.0.0.1", accept));
const results = [];
try {
  for (const entry of fixtures) {
    const { slug } = entry;
    const settings =
      slug === "snapcn-orbit-gallery" ? { background: "transparent" } : {};
    const api = { theme: { background: "transparent" } };
    const fixture = {
      ...entry.fixture,
      background: "transparent",
      props: { ...entry.fixture.props, ...settings, ...api },
    };
    const input = { ...entry, fixture };
    const directory = resolve(workspace, slug);
    const project = resolve(directory, "installed");
    const referenceWorkspace = resolve(directory, "reference");
    const repeatWorkspace = resolve(directory, "reference-repeat");
    const reference = resolve(
      referenceWorkspace,
      "renders",
      slug,
      "reference-frames",
    );
    const repeat = resolve(
      repeatWorkspace,
      "renders",
      slug,
      "reference-frames",
    );
    const port = resolve(directory, "hyperframes-frames");
    const sourceDiff = resolve(directory, "source-repeat-diff");
    const diff = resolve(directory, "diff");
    await Promise.all(
      [project, sourceDiff, diff].map((path) =>
        mkdir(path, { recursive: true }),
      ),
    );
    console.log(
      `${slug}: ${fixture.durationInFrames} frames, repeated source and fresh CLI installation`,
    );
    await renderReferences([input], { workspace: referenceWorkspace });
    await renderReferences([input], { workspace: repeatWorkspace });
    const sourceRepeat = await compareAlphaFrames(
      reference,
      repeat,
      fixture.durationInFrames,
      sourceDiff,
    );
    if (!sourceRepeat.pass)
      throw new Error(
        `${slug}: source alpha is unstable at frames ${sourceRepeat.mismatchedFrames.join(",")}`,
      );
    await writeFile(
      resolve(project, "hyperframes.json"),
      JSON.stringify({
        paths: {
          blocks: "compositions",
          components: "compositions/components",
          assets: "assets",
        },
      }),
    );
    const install = await run(
      process.execPath,
      [
        resolve(root, "cli/bin/hyfrme.mjs"),
        "add",
        slug,
        "--dir",
        project,
        ...Object.entries(settings).flatMap(([key, value]) => [
          "--set",
          `${key}=${value}`,
        ]),
      ],
      {
        env: {
          HYFRME_REGISTRY_URL: `http://127.0.0.1:${server.address().port}`,
        },
      },
    );
    await writeFile(resolve(directory, "install.log"), install.output);
    const htmlPath = resolve(project, "compositions", `${slug}.html`);
    const installedHtml = await readFile(htmlPath, "utf8");
    // Theme tokens are an isolated source API fixture, not a published CLI control.
    const needle = `window.__hyfrmeVariables[${JSON.stringify(slug)}] = window.__hyperframes.getVariables();`;
    if (installedHtml.split(needle).length !== 2)
      throw new Error(`${slug}: variable bootstrap missing or repeated`);
    await writeFile(
      htmlPath,
      installedHtml.replace(
        needle,
        `window.__hyfrmeVariables[${JSON.stringify(slug)}] = {...window.__hyperframes.getVariables(), ...${JSON.stringify(api)}};`,
      ),
    );
    const duration = fixture.durationInFrames / fixture.fps;
    // Match Remotion's document paint bounds. The screenshot clip supplies the canvas boundary.
    await writeFile(
      resolve(project, "index.html"),
      `<!doctype html><html lang="en"><head><meta charset="UTF-8"><script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script><style>html,body{margin:0;width:${fixture.width}px;height:${fixture.height}px}html,body,#root{overflow:visible!important}#root,#scene{position:absolute;inset:0}</style></head><body><div id="root" data-composition-id="transparent-${slug}" data-no-timeline data-start="0" data-duration="${duration}" data-width="${fixture.width}" data-height="${fixture.height}" data-fps="${fixture.fps}"><div id="scene" data-composition-id="${slug}" data-composition-src="compositions/${slug}.html" data-start="0" data-duration="${duration}" data-track-index="1" data-width="${fixture.width}" data-height="${fixture.height}"></div></div></body></html>\n`,
    );
    const installedFiles = await Promise.all(
      [
        "index.html",
        `compositions/${slug}.html`,
        `compositions/${slug}.runtime.js`,
      ].map(async (path) => ({
        path,
        sha256: await fileHash(resolve(project, path)),
      })),
    );
    const registryFiles = await Promise.all(
      [`${slug}.html`, `${slug}.runtime.js`, "registry-item.json"].map(
        async (name) => {
          const path = `registry/blocks/${slug}/${name}`;
          return { path, sha256: await fileHash(resolve(root, path)) };
        },
      ),
    );
    const env = { HYPERFRAMES_BROWSER_PATH: wrapper };
    const check = await run(
      "npx",
      ["--yes", `hyperframes@${hyperframesVersion}`, "check", "--json"],
      { cwd: project, env, allowFailure: true },
    );
    await writeFile(
      resolve(diff, "hyperframes-check.log"),
      check.output.replaceAll(root, "<project>"),
    );
    const checkStart = check.output.indexOf("{");
    if (checkStart === -1)
      throw new Error(`${slug}: check returned no report\n${check.output}`);
    const checks = JSON.parse(check.output.slice(checkStart));
    if (check.code !== 0 || !checks.ok)
      throw new Error(`${slug}: full HyperFrames check failed`);
    const captureArguments = [
      "snapshot",
      "--at",
      Array.from(
        { length: fixture.durationInFrames },
        (_, frame) => frame / fixture.fps,
      ).join(","),
      "--no-end",
      "--describe=false",
      "--browser-gpu",
      "--zoom",
      `0,0,${fixture.width},${fixture.height}`,
      "--zoom-scale",
      "1",
      "--output",
      port,
    ];
    const capture = await run(
      "npx",
      ["--yes", `hyperframes@${hyperframesVersion}`, ...captureArguments],
      { cwd: project, env },
    );
    await writeFile(resolve(diff, "hyperframes-snapshot.log"), capture.output);
    await normalizeSnapshotFrames(port, fixture.durationInFrames);
    await run(
      "ffmpeg",
      [
        "-v",
        "error",
        "-pattern_type",
        "glob",
        "-i",
        resolve(reference, "*.png"),
        "-pattern_type",
        "glob",
        "-i",
        resolve(port, "*.png"),
        "-lavfi",
        "[0:v]format=gbrp[a];[1:v]format=gbrp[b];[a][b]ssim=stats_file=ssim.log",
        "-f",
        "null",
        "-",
      ],
      { cwd: diff },
    );
    const samples = [
      ...(await readFile(resolve(diff, "ssim.log"), "utf8")).matchAll(
        /All:([\d.]+)/g,
      ),
    ].map((match) => Number(match[1]));
    if (samples.length !== fixture.durationInFrames)
      throw new Error(`${slug}: incomplete RGB comparison`);
    const alpha = await compareAlphaFrames(
      reference,
      port,
      fixture.durationInFrames,
      diff,
    );
    const meanSsim =
      samples.reduce((sum, value) => sum + value, 0) / samples.length;
    const minSsim = Math.min(...samples);
    for (const file of installedFiles)
      if ((await fileHash(resolve(project, file.path))) !== file.sha256)
        throw new Error(`${slug}: installed input changed during capture`);
    for (const file of registryFiles)
      if ((await fileHash(resolve(root, file.path))) !== file.sha256)
        throw new Error(`${slug}: registry input changed during capture`);
    await selectFixtures(["--only", slug]);
    const result = {
      name: slug.replace("snapcn-", "") + "-transparent",
      slug,
      sourcePin: entry.origin,
      fixture,
      settings,
      api,
      installedFiles,
      registryFiles,
      installedHtmlBeforeApiSha256: sha256(installedHtml),
      sourceFiles: await Promise.all(
        [
          ...new Set(
            [
              entry.origin.entry,
              entry.origin.source,
              entry.origin.config,
            ].filter(Boolean),
          ),
        ].map(async (path) => ({
          path,
          sha256: await fileHash(resolve(source.directory, path)),
        })),
      ),
      sourceRepeat,
      frameCount: samples.length,
      meanSsim,
      minSsim,
      alpha,
      checks: {
        ok: checks.ok,
        lintErrors: checks.lint.errorCount,
        runtimeErrors: checks.runtime.errorCount,
        layoutErrors: checks.layout.errorCount,
        contrastErrors: checks.contrast.errorCount,
      },
      pass: meanSsim >= 0.99 && minSsim >= 0.95 && alpha.pass,
    };
    const artifacts = resolve(root, "parity/snapcn-variants", result.name);
    await mkdir(artifacts, { recursive: true });
    for (const file of [
      "ssim.log",
      "reference-alpha.framemd5",
      "hyperframes-alpha.framemd5",
      "hyperframes-check.log",
    ])
      await copyFile(resolve(diff, file), resolve(artifacts, file));
    for (const file of [
      "reference-alpha.framemd5",
      "hyperframes-alpha.framemd5",
    ])
      await copyFile(
        resolve(sourceDiff, file),
        resolve(artifacts, `source-repeat-${file}`),
      );
    results.push(result);
    console.log(
      JSON.stringify({
        name: result.name,
        frameCount: result.frameCount,
        meanSsim,
        minSsim,
        exactAlpha: alpha.pass,
        pass: result.pass,
      }),
    );
  }
  if ((await fileHash(import.meta.filename)) !== scriptSha256) {
    throw new Error("Transparency verifier changed during capture");
  }
  const report = {
    scope:
      "Full-duration transparent source API fixtures. Original component source and exact-alpha thresholds are unchanged. Canonical default reports remain separate.",
    capture: {
      browserVersion: browser.version,
      remotionVersion,
      hyperframesVersion,
      referenceGl,
      browserGpuMode: "hardware",
      rasterization: "cpu",
      browserArguments: ["--disable-gpu-rasterization"],
      documentOverflow: "visible",
      explicitFullCanvasClip: true,
      referenceRepeated: true,
      fixtureInstallation: "hyfrme CLI",
      cliSha256: await fileHash(resolve(root, "cli/bin/hyfrme.mjs")),
      referenceCssSha256: await fileHash(
        resolve(root, "fixtures/snapcn/preview.css"),
      ),
      scriptSha256,
      workspace: relative(root, workspace),
    },
    thresholds: { meanSsim: 0.99, minSsim: 0.95, exactAlpha: true },
    cases: results,
    pass: results.every(({ pass }) => pass),
  };
  await writeFile(
    resolve(root, "parity/snapcn-variants/transparent-full-duration.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  if (!report.pass) process.exitCode = 1;
} finally {
  server.close();
}
