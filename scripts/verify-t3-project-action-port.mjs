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
const variant = "project-action";
const name = "t3-project-action";
const thresholds = { meanSsim: 0.989, minSsim: 0.985 };
const block = resolve(root, "registry/blocks/t3-project-action");
const reference = resolve(root, `parity/${name}-reference.mkv`);
const source = resolve(root, "assets/t3-code/v0.0.35");
const fixture = JSON.parse(
  await readFile(resolve(source, "project-action-fixture.json"), "utf8"),
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

const captureFiles = Object.entries(fixture.sourceDomHashes).map(([phase, sha256]) => [
  `${variant}-${phase}.html`, sha256,
]);
const portalFiles = Object.entries(fixture.portalHashes).map(([phase, sha256]) => [
  `${variant}-${phase}-portals.json`, sha256,
]);
const themeFixture = JSON.parse(await readFile(resolve(source, "brief-fixture.json"), "utf8"));
for (const [file, expected] of [
  ...captureFiles,
  ...portalFiles,
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
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:#0a0a0a}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-project-action-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-project-action-fixture']=gsap.timeline({paused:true});</script></body></html>`,
);

const checkRun = spawnSync("npx", ["hyperframes", "check", project, "--json"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
await writeFile(resolve(root, ".work/t3-project-action-check.json"), checkRun.stdout);
if (checkRun.status !== 0) throw new Error(`HyperFrames full check failed. Inspect .work/t3-project-action-check.json. ${checkRun.stderr.slice(-1000)}`);
const check = JSON.parse(checkRun.stdout);
if (!check.ok)
  throw new Error(
    `HyperFrames full check failed: ${JSON.stringify(check).slice(0, 3000)}`,
  );
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
  result.meanSsim >= thresholds.meanSsim &&
  result.minSsim >= thresholds.minSsim;
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
  resolve(outputFrames, "frame_000101.png"),
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
        props: { projectName: "hyfrme", selectedThread: "Build a logo intro", actionName: "Verify Hyfrme", actionCommand: "npm run check", keybinding: "mod+shift+v", ...Object.fromEntries(Object.entries(fixture.events).map(([phase, frame]) => [`${phase}Frame`, frame])) },
        sourceHashes: fixture.sourceHashes,
        domSha256: fixture.sourceDomHashes,
        portalSha256: fixture.portalHashes,
        referenceSha256: fixture.referenceSha256,
        compositionSha256: await fileHash(resolve(block, `${name}.html`)),
      },
      classification: "source-dom-port",
      measurement: "lossless-png",
      status: "verified",
      thresholds,
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
