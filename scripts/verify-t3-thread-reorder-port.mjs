import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-thread-reorder";
const source = resolve(root, "assets/t3-code/v0.0.35");
const block = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, `registry/blocks/${name}`));
const fixture = JSON.parse(await readFile(resolve(source, "thread-reorder-fixture.json"), "utf8"));
const reference = resolve(root, `parity/${name}-reference.mkv`);
const work = resolve(root, ".work/t3-thread-reorder-verify");
const project = resolve(work, "project");
const nativeFrames = resolve(work, "native");
const outputFrames = resolve(work, "hyperframes");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const fileHash = async (path) => hash(await readFile(path));
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...options,
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed:\n${result.stderr.slice(-4000)}\n${result.stdout.slice(-2000)}`);
  }
  return result;
};

for (const [phase, sha256] of Object.entries(fixture.sourceDomHashes)) {
  if ((await fileHash(resolve(source, `thread-reorder-${phase}.html`))) !== sha256) {
    throw new Error(`Captured T3 DOM changed for ${phase}`);
  }
}
for (const [file, expected] of [
  ["t3.css", fixture.sourceHashes.css],
]) {
  if ((await fileHash(resolve(source, file))) !== expected) throw new Error(`${file} differs from pinned T3 source`);
}
if ((await fileHash(reference)) !== fixture.referenceSha256) throw new Error("Native reference changed since capture");

await rm(work, { recursive: true, force: true });
await mkdir(resolve(project, "compositions"), { recursive: true });
await mkdir(nativeFrames, { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js"]) {
  await copyFile(resolve(block, file), resolve(project, "compositions", file));
}
await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:#0a0a0a}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-thread-reorder-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-thread-reorder-fixture']=gsap.timeline({paused:true});</script></body></html>`);

const checkProcess = spawnSync("npx", ["hyperframes", "check", project, "--json"], {
  encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
});
const checkOutput = checkProcess.stdout;
await writeFile(resolve(work, "hyperframes-check-raw.json"), checkOutput);
const check = JSON.parse(checkOutput.slice(checkOutput.indexOf("{")));
if (checkProcess.status !== 0 || !check.ok) {
  throw new Error(`Full HyperFrames check failed: ${JSON.stringify(check.layout?.findings ?? check).slice(0, 5000)}`);
}
run("npx", ["hyperframes", "render", project, "--format=png-sequence", "-o", outputFrames, "--strict", "--workers=2"]);
run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", reference, "-start_number", "0", resolve(nativeFrames, "frame-%04d.png")]);

const rendered = (await readdir(outputFrames)).filter((file) => file.endsWith(".png"));
const native = (await readdir(nativeFrames)).filter((file) => file.endsWith(".png"));
if (rendered.length !== fixture.frames || native.length !== fixture.frames) {
  throw new Error(`Expected ${fixture.frames} frames; got native=${native.length}, HyperFrames=${rendered.length}`);
}
const stats = resolve(work, "ssim.txt");
run("ffmpeg", [
  "-hide_banner", "-loglevel", "error",
  "-framerate", String(fixture.fps), "-start_number", "0", "-i", resolve(nativeFrames, "frame-%04d.png"),
  "-framerate", String(fixture.fps), "-start_number", "1", "-i", resolve(outputFrames, "frame_%06d.png"),
  "-lavfi", `ssim=stats_file=${stats}`, "-f", "null", "-",
]);
const scores = [...(await readFile(stats, "utf8")).matchAll(/^n:\d+ .*?All:([\d.]+)/gm)]
  .map((match) => Number(match[1]));
if (scores.length !== fixture.frames) throw new Error(`Expected ${fixture.frames} SSIM scores, got ${scores.length}`);
const sorted = [...scores].sort((a, b) => a - b);
const result = {
  frameCount: scores.length,
  meanSsim: scores.reduce((sum, score) => sum + score, 0) / scores.length,
  minSsim: sorted[0],
  p05Ssim: sorted[Math.floor(scores.length * 0.05)],
  p95Ssim: sorted[Math.floor(scores.length * 0.95)],
  worstFrame: scores.indexOf(sorted[0]),
};
const thresholds = { meanSsim: 0.989, minSsim: 0.985 };
result.pass = result.meanSsim >= thresholds.meanSsim && result.minSsim >= thresholds.minSsim;
console.log(`${name}: ${scores.length} frames, mean=${result.meanSsim.toFixed(6)}, min=${result.minSsim.toFixed(6)}, worst=${result.worstFrame}, pass=${result.pass}`);
if (!result.pass) throw new Error("Native T3 Code parity did not pass");

const previews = resolve(root, "public/previews", name);
const parityDiff = resolve(root, "parity", `${name}-diff`);
await mkdir(previews, { recursive: true });
await mkdir(parityDiff, { recursive: true });
run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", reference, "-vf", "pad=1200:660:0:0:black", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-an", resolve(previews, "reference.mp4")]);
run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fixture.fps), "-start_number", "1", "-i", resolve(outputFrames, "frame_%06d.png"), "-vf", "pad=1200:660:0:0:black", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-an", resolve(previews, "hyperframes.mp4")]);
await copyFile(resolve(outputFrames, "frame_000096.png"), resolve(previews, "thumbnail.png"));
await copyFile(stats, resolve(parityDiff, "ssim.txt"));
await writeFile(resolve(parityDiff, "hyperframes-check.json"), `${JSON.stringify(check, null, 2)}\n`);
run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", resolve(nativeFrames, `frame-${String(result.worstFrame).padStart(4, "0")}.png`), "-i", resolve(outputFrames, `frame_${String(result.worstFrame + 1).padStart(6, "0")}.png`), "-filter_complex", "[0:v][1:v]hstack=inputs=2[v]", "-map", "[v]", "-frames:v", "1", resolve(parityDiff, "worst-frame.png")]);
await writeFile(resolve(root, "parity", `${name}.json`), `${JSON.stringify({
  slug: name,
  origin: { repository: "https://github.com/pingdotgg/t3code", commit: fixture.sourceCommit, source: "apps/web/src/components/Sidebar.tsx, apps/web/src/components/Sidebar.logic.ts, and apps/web/src/state/entities.ts", license: "MIT; @pierre/trees and @pierre/diffs Apache-2.0" },
  fixture: { width: fixture.viewport.width, height: fixture.viewport.height, fps: fixture.fps, durationInFrames: fixture.frames, props: fixture.events, sourceHashes: fixture.sourceHashes, domSha256: fixture.sourceDomHashes, orderBefore: fixture.orderBefore, orderAfter: fixture.orderAfter, keysBefore: fixture.keysBefore, keysAfter: fixture.keysAfter, referenceSha256: fixture.referenceSha256, compositionSha256: await fileHash(resolve(block, `${name}.html`)) },
  classification: "source-dom-port", measurement: "lossless-png", status: "verified", thresholds, result,
  checks: { hyperframes: "full check passed with no errors; strict render passed", sourceBrowser: fixture.captureBrowser.version, sourceBrowserFlags: fixture.captureBrowser.flags, installedThroughCli: false },
  artifacts: { referenceVideo: `public/previews/${name}/reference.mp4`, hyperframesVideo: `public/previews/${name}/hyperframes.mp4`, thumbnail: `public/previews/${name}/thumbnail.png`, frameSsim: `parity/${name}-diff/ssim.txt`, hyperframesCheck: `parity/${name}-diff/hyperframes-check.json`, worstFrame: `parity/${name}-diff/worst-frame.png` },
}, null, 2)}\n`);
