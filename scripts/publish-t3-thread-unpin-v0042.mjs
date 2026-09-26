import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFile, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-thread-unpin";
const fixture = JSON.parse(await readFile(resolve(root, "assets/t3-code/v0.0.42/thread-unpin-fixture.json"), "utf8"));
const verification = JSON.parse(await readFile(resolve(root, ".work/t3-thread-unpin-v0042-verify/result.json"), "utf8"));
const customCheck = JSON.parse(await readFile(resolve(root, ".work/t3-thread-unpin-v0042-custom/check.json"), "utf8"));
const hash = async (path) => createHash("sha256").update(await readFile(path)).digest("hex");
const candidate = resolve(root, ".work/t3-thread-unpin-v0042-candidate");
const reference = resolve(root, "parity/t3-thread-unpin-v0042-reference.mkv");
const frames = resolve(root, ".work/t3-thread-unpin-v0042-verify/hyperframes");
const native = resolve(root, ".work/t3-thread-unpin-v0042-verify/native");
const preview = resolve(root, "public/previews", name);
const diff = resolve(root, "parity", `${name}-diff`);
const previousParity = JSON.parse(await readFile(resolve(root, `parity/${name}.json`), "utf8"));

if (!verification.result.pass || verification.result.frameCount !== 120 || !customCheck.ok) throw new Error("Default or custom HyperFrames verification failed");
if (previousParity.origin.commit !== "f925d639421844f02b3166d29281905dbba6d529") throw new Error("The v0.0.35 block has already been replaced");
if (await hash(reference) !== fixture.referenceSha256) throw new Error("Native recording changed");
if (await hash(resolve(candidate, `${name}.html`)) !== verification.fixture.compositionSha256) throw new Error("Verified candidate changed");

const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr.slice(-3000)}`);
};

await mkdir(resolve(root, "parity/legacy"), { recursive: true });
await copyFile(resolve(root, `parity/${name}.json`), resolve(root, `parity/legacy/${name}-v0035.json`));
await cp(preview, resolve(root, `parity/legacy/${name}-v0035-preview`), { recursive: true });
await cp(diff, resolve(root, `parity/legacy/${name}-v0035-diff`), { recursive: true });
await cp(candidate, resolve(root, "registry/blocks", name), { recursive: true, force: true });

run("ffmpeg", ["-v", "error", "-y", "-i", reference, "-vf", "pad=1200:660:0:0:black", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-an", resolve(preview, "reference.mp4")]);
run("ffmpeg", ["-v", "error", "-y", "-framerate", "30", "-start_number", "1", "-i", resolve(frames, "frame_%06d.png"), "-vf", "pad=1200:660:0:0:black", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-an", resolve(preview, "hyperframes.mp4")]);
await copyFile(resolve(frames, "frame_000086.png"), resolve(preview, "thumbnail.png"));
await copyFile(resolve(root, ".work/t3-thread-unpin-v0042-verify/ssim.txt"), resolve(diff, "ssim.txt"));
await copyFile(resolve(root, ".work/t3-thread-unpin-v0042-verify/hyperframes-check-raw.json"), resolve(diff, "hyperframes-check.json"));
const worst = verification.result.worstFrame;
run("ffmpeg", ["-v", "error", "-y", "-i", resolve(native, `frame-${String(worst).padStart(4, "0")}.png`), "-i", resolve(frames, `frame_${String(worst + 1).padStart(6, "0")}.png`), "-filter_complex", "[0:v][1:v]hstack=inputs=2[v]", "-map", "[v]", "-frames:v", "1", resolve(diff, "worst-frame.png")]);

const sorted = [...(await readFile(resolve(diff, "ssim.txt"), "utf8")).matchAll(/^n:\d+ .*?All:([\d.]+)/gm)]
  .map((match) => Number(match[1])).sort((a, b) => a - b);
const parity = {
  slug: name,
  origin: { repository: "https://github.com/pingdotgg/t3code", commit: fixture.sourceCommit, source: "apps/web/src/components/Sidebar.tsx", license: "MIT" },
  fixture: { width: fixture.viewport.width, height: fixture.viewport.height, fps: fixture.fps, durationInFrames: fixture.frames, props: fixture.events, sourceHashes: fixture.sourceHashes, domSha256: fixture.sourceDomHashes, portalSha256: fixture.portalHashes, menuBox: fixture.menuBox, referenceSha256: fixture.referenceSha256, compositionSha256: verification.fixture.compositionSha256 },
  classification: "source-dom-port", measurement: "lossless-png", status: "verified",
  thresholds: { meanSsim: 0.989, minSsim: 0.985 },
  result: { ...verification.result, p05Ssim: sorted[6], p95Ssim: sorted[114] },
  checks: { hyperframes: "full check passed with no errors; strict render passed", sourceBrowser: "Chrome Headless Shell 152", customization: "changed text, project avatar, and all three beat times passed full check and four snapshots", installedThroughCli: false },
  artifacts: { referenceVideo: `public/previews/${name}/reference.mp4`, hyperframesVideo: `public/previews/${name}/hyperframes.mp4`, thumbnail: `public/previews/${name}/thumbnail.png`, frameSsim: `parity/${name}-diff/ssim.txt`, hyperframesCheck: `parity/${name}-diff/hyperframes-check.json`, worstFrame: `parity/${name}-diff/worst-frame.png` },
};
await writeFile(resolve(root, `parity/${name}.json`), JSON.stringify(parity, null, 2) + "\n");
console.log(`Published ${name} v0.0.42; ${verification.result.frameCount} frames, mean ${verification.result.meanSsim.toFixed(6)}, min ${verification.result.minSsim.toFixed(6)}.`);
