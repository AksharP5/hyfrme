import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const currentManifest = JSON.parse(await readFile(resolve(root, "parity/t3-project-source-picker.json"), "utf8"));
if (currentManifest.origin.commit !== "f925d639421844f02b3166d29281905dbba6d529") {
  throw new Error("This verifier only applies to the archived v0.0.35 Project Source Picker port");
}
const variant = "project-source-picker";
const ports = {
  "project-source-picker": {
    name: "t3-project-source-picker",
    fixtureFile: "project-source-picker-fixture.json",
    thresholds: { meanSsim: 0.989, minSsim: 0.985 },
    props: (fixture) => ({
      projectName: "hyfrme",
      branchName: "main",
      sourcesTitle: "Sources",
      localTitle: "Local folder",
      gitUrlTitle: "Git URL",
      githubTitle: "GitHub repository",
      setupRequired: "Setup Required",
      openFrame: fixture.openFrame,
      closeFrame: fixture.closeFrame,
    }),
  },
};
const port = ports[variant];
if (!port) throw new Error(`Unknown T3 Code port: ${variant}`);
const { name } = port;
const block = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, "registry/blocks", name));
const reference = resolve(root, `parity/${name}-reference.mkv`);
const source = resolve(root, "assets/t3-code/v0.0.35");
const fixture = JSON.parse(
  await readFile(resolve(source, port.fixtureFile), "utf8"),
);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const fileHash = async (path) => hash(await readFile(path));
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    ...options,
  });
  if (result.status !== 0)
    throw new Error(
      `${command} ${args.join(" ")} failed:\n${result.stderr.slice(-4000)}\n${result.stdout.slice(-2000)}`,
    );
  return result;
};

const captureFiles =
  variant === "brief"
    ? [
        ["brief-base.html", fixture.domSha256],
        ["brief-shell.html", fixture.shellSha256],
      ]
    : Object.entries(fixture.sourceDomHashes).map(([phase, sha256]) => [
        `${variant}-${phase}.html`,
        sha256,
      ]);
const themeFixture =
  variant === "brief"
    ? fixture
    : JSON.parse(await readFile(resolve(source, "brief-fixture.json"), "utf8"));
for (const [file, expected] of [
  ...captureFiles,
  ["dark-theme.json", themeFixture.themeSha256],
  ["t3.css", fixture.sourceHashes.css],
]) {
  if ((await fileHash(resolve(source, file))) !== expected)
    throw new Error(`${file} differs from its pinned T3 Code capture`);
}
if ((await fileHash(reference)) !== fixture.referenceSha256)
  throw new Error("Native T3 Code reference changed since capture");

const work = await mkdtemp(join(tmpdir(), `hyfrme-${name}-`));
const project = resolve(work, "project");
const compositions = resolve(project, "compositions");
const nativeFrames = resolve(work, "native");
const outputFrames = resolve(work, "hyperframes");
await mkdir(compositions, { recursive: true });
await mkdir(nativeFrames);
for (const file of [`${name}.html`, "t3-code-gsap.min.js"]) {
  await copyFile(resolve(block, file), resolve(compositions, file));
}
await writeFile(
  resolve(project, "index.html"),
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:#0a0a0a}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-brief-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-brief-fixture']=gsap.timeline({paused:true});</script></body></html>`,
);

const checkProcess = spawnSync("npx", ["hyperframes", "check", project, "--json"], {
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});
const check = JSON.parse(checkProcess.stdout);
if (checkProcess.status !== 0 || !check.ok) {
  const findings = [
    ...check.runtime.findings,
    ...check.layout.findings,
    ...check.motion.findings,
    ...check.contrast.findings,
  ];
  const unique = [...new Map(findings.map(
    ({ code, selector, message, containerSelector }) => [
      `${code}:${selector}:${containerSelector}`,
      { code, selector, message, containerSelector },
    ],
  )).values()];
  throw new Error(`HyperFrames full check failed: ${JSON.stringify(unique)}`);
}
run("npx", [
  "hyperframes",
  "render",
  project,
  "--format=png-sequence",
  "-o",
  outputFrames,
  "--strict",
  "--workers=2",
]);
run("ffmpeg", [
  "-hide_banner",
  "-loglevel",
  "error",
  "-i",
  reference,
  resolve(nativeFrames, "frame-%04d.png"),
]);

const renderedFiles = (await readdir(outputFrames)).filter((file) =>
  file.endsWith(".png"),
);
if (renderedFiles.length !== fixture.frames)
  throw new Error(
    `Expected ${fixture.frames} rendered frames; got ${renderedFiles.length}`,
  );
const stats = resolve(work, "ssim.txt");
run("ffmpeg", [
  "-hide_banner",
  "-loglevel",
  "error",
  "-framerate",
  String(fixture.fps),
  "-start_number",
  "0",
  "-i",
  resolve(nativeFrames, "frame-%04d.png"),
  "-framerate",
  String(fixture.fps),
  "-start_number",
  "1",
  "-i",
  resolve(outputFrames, "frame_%06d.png"),
  "-lavfi",
  `ssim=stats_file=${stats}`,
  "-f",
  "null",
  "-",
]);
const frameScores = [
  ...(await readFile(stats, "utf8")).matchAll(/^n:\d+ .*?All:([\d.]+)/gm),
].map((match) => Number(match[1]));
if (frameScores.length !== fixture.frames)
  throw new Error(
    `Expected ${fixture.frames} SSIM scores; got ${frameScores.length}`,
  );
const sorted = [...frameScores].sort((a, b) => a - b);
const result = {
  frameCount: frameScores.length,
  meanSsim:
    frameScores.reduce((sum, score) => sum + score, 0) / frameScores.length,
  minSsim: sorted[0],
  p05Ssim: sorted[Math.floor(sorted.length * 0.05)],
  p95Ssim: sorted[Math.floor(sorted.length * 0.95)],
};
result.pass =
  result.meanSsim >= port.thresholds.meanSsim &&
  result.minSsim >= port.thresholds.minSsim;
if (!result.pass)
  throw new Error(`T3 Code parity failed: ${JSON.stringify(result)}`);

const previews = resolve(root, "public/previews", name);
await mkdir(previews, { recursive: true });
run("ffmpeg", [
  "-hide_banner",
  "-loglevel",
  "error",
  "-y",
  "-i",
  reference,
  "-vf",
  "pad=1200:660:0:0:black",
  "-c:v",
  "libx264",
  "-preset",
  "slow",
  "-crf",
  "18",
  "-pix_fmt",
  "yuv420p",
  "-an",
  resolve(previews, "reference.mp4"),
]);
run("ffmpeg", [
  "-hide_banner",
  "-loglevel",
  "error",
  "-y",
  "-framerate",
  String(fixture.fps),
  "-start_number",
  "1",
  "-i",
  resolve(outputFrames, "frame_%06d.png"),
  "-vf",
  "pad=1200:660:0:0:black",
  "-c:v",
  "libx264",
  "-preset",
  "slow",
  "-crf",
  "18",
  "-pix_fmt",
  "yuv420p",
  "-an",
  resolve(previews, "hyperframes.mp4"),
]);
await copyFile(
  resolve(outputFrames, "frame_000061.png"),
  resolve(previews, "thumbnail.png"),
);
await copyFile(stats, resolve(root, `parity/${name}-ssim.txt`));
await writeFile(
  resolve(root, `parity/${name}.json`),
  `${JSON.stringify(
    {
      slug: name,
      origin: {
        repository: "https://github.com/pingdotgg/t3code",
        commit: fixture.sourceCommit,
        source: "apps/web",
        license: "MIT",
      },
      fixture: {
        width: fixture.viewport.width,
        height: fixture.viewport.height,
        fps: fixture.fps,
        durationInFrames: fixture.frames,
        props: port.props(fixture),
        sourceHashes: fixture.sourceHashes,
        domSha256: fixture.domSha256 ?? fixture.sourceDomHashes,
        referenceSha256: fixture.referenceSha256,
        compositionSha256: await fileHash(resolve(block, `${name}.html`)),
      },
      classification: "source-dom-port",
      measurement: "lossless-png",
      status: "verified",
      thresholds: port.thresholds,
      result,
      checks: {
        hyperframes: "full check passed with no errors; strict render passed",
        hyperframesVersion: "0.8.75",
        sourceBrowser: "Chrome Headless Shell 152.0.7977.30",
        browserGpuMode: "hardware",
        installedThroughCli: false,
      },
      artifacts: {
        referenceVideo: `public/previews/${name}/reference.mp4`,
        hyperframesVideo: `public/previews/${name}/hyperframes.mp4`,
        thumbnail: `public/previews/${name}/thumbnail.png`,
        frameSsim: `parity/${name}-ssim.txt`,
      },
    },
    null,
    2,
  )}\n`,
);
console.log(
  `${name}: ${result.frameCount} frames, mean SSIM ${result.meanSsim.toFixed(6)}, min ${result.minSsim.toFixed(6)}. Work: ${work}`,
);
