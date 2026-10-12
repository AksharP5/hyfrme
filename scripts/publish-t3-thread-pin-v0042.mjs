import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFile, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-thread-pin";
const fixture = JSON.parse(await readFile(resolve(root, "assets/t3-code/v0.0.42/thread-pin-fixture.json"), "utf8"));
const lightFixture = JSON.parse(await readFile(resolve(root, "assets/t3-code/v0.0.42/thread-pin-light-fixture.json"), "utf8"));
const verification = JSON.parse(await readFile(resolve(root, ".work/t3-thread-pin-v0042-verify/result.json"), "utf8"));
const lightVerification = JSON.parse(await readFile(resolve(root, ".work/t3-thread-pin-v0042-light-verify/result.json"), "utf8"));
const customCheck = JSON.parse(await readFile(resolve(root, ".work/t3-thread-pin-v0042-custom/check.json"), "utf8"));
const lightCustomCheck = JSON.parse(await readFile(resolve(root, ".work/t3-thread-pin-v0042-light-custom/check.json"), "utf8"));
const cliDarkCheck = JSON.parse(await readFile(resolve(root, ".work/t3-thread-pin-v0042-cli-installed-dark/check.json"), "utf8"));
const cliLightCheck = JSON.parse(await readFile(resolve(root, ".work/t3-thread-pin-v0042-cli-installed/check.json"), "utf8"));
const seam = JSON.parse(await readFile(resolve(root, ".work/t3-thread-pin-v0042-seam-verify/result.json"), "utf8"));
const hash = async (path) => createHash("sha256").update(await readFile(path)).digest("hex");
const candidate = resolve(root, ".work/t3-thread-pin-v0042-candidate");
const reference = resolve(root, "parity/t3-thread-pin-v0042-reference.mkv");
const lightReference = resolve(root, "parity/t3-thread-pin-v0042-light-reference.mkv");
const frames = resolve(root, ".work/t3-thread-pin-v0042-verify/hyperframes");
const native = resolve(root, ".work/t3-thread-pin-v0042-verify/native");
const lightFrames = resolve(root, ".work/t3-thread-pin-v0042-light-verify/hyperframes");
const lightNative = resolve(root, ".work/t3-thread-pin-v0042-light-verify/native");
const preview = resolve(root, "public/previews", name);
const diff = resolve(root, "parity", `${name}-diff`);
const lightDiff = resolve(root, "parity", `${name}-light-diff`);
const previousParity = JSON.parse(await readFile(resolve(root, `parity/${name}.json`), "utf8"));

if (!verification.result.pass || verification.result.frameCount !== 120 || !customCheck.ok || !cliDarkCheck.ok ||
    !lightVerification.result.pass || lightVerification.result.frameCount !== 120 || !lightCustomCheck.ok || !cliLightCheck.ok) {
  throw new Error("Dark or light default/custom/CLI-installed HyperFrames verification failed");
}
if (fixture.motion?.length !== 2 || lightFixture.motion?.length !== 2 ||
    fixture.motion.some(({ durationMs }) => durationMs !== 150) ||
    lightFixture.motion.some(({ durationMs }) => durationMs !== 150)) {
  throw new Error("Both native fixtures must include the 150ms sidebar row transition");
}
if (previousParity.origin.commit !== "f925d639421844f02b3166d29281905dbba6d529") throw new Error("The v0.0.35 block has already been replaced");
if (await hash(reference) !== fixture.referenceSha256) throw new Error("Native recording changed");
if (await hash(lightReference) !== lightFixture.referenceSha256) throw new Error("Native light recording changed");
if (await hash(resolve(candidate, `${name}.html`)) !== verification.fixture.compositionSha256) throw new Error("Verified candidate changed");
if (verification.fixture.compositionSha256 !== lightVerification.fixture.compositionSha256) throw new Error("Dark and light verifiers used different compositions");
if (!seam.pass || seam.candidateSha256 !== verification.fixture.compositionSha256 ||
    await hash(resolve(root, seam.themes.dark.unpinNativeFrame)) !== seam.themes.dark.unpinNativeSha256 ||
    await hash(resolve(root, seam.themes.light.unpinNativeFrame)) !== seam.themes.light.unpinNativeSha256) {
  throw new Error("Pin→Unpin cut proof is missing or stale");
}

const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr.slice(-3000)}`);
};

await mkdir(resolve(root, "parity/legacy"), { recursive: true });
await copyFile(resolve(root, `parity/${name}.json`), resolve(root, `parity/legacy/${name}-v0035.json`));
await cp(preview, resolve(root, `parity/legacy/${name}-v0035-preview`), { recursive: true });
await cp(diff, resolve(root, `parity/legacy/${name}-v0035-diff`), { recursive: true });
await cp(candidate, resolve(root, "registry/blocks", name), { recursive: true, force: true });
await mkdir(lightDiff, { recursive: true });

run("ffmpeg", ["-v", "error", "-y", "-i", reference, "-vf", "pad=1200:660:0:0:black", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-an", resolve(preview, "reference.mp4")]);
run("ffmpeg", ["-v", "error", "-y", "-framerate", "30", "-start_number", "1", "-i", resolve(frames, "frame_%06d.png"), "-vf", "pad=1200:660:0:0:black", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-an", resolve(preview, "hyperframes.mp4")]);
run("ffmpeg", ["-v", "error", "-y", "-i", lightReference, "-vf", "pad=1200:660:0:0:black", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-an", resolve(preview, "reference-light.mp4")]);
run("ffmpeg", ["-v", "error", "-y", "-framerate", "30", "-start_number", "1", "-i", resolve(lightFrames, "frame_%06d.png"), "-vf", "pad=1200:660:0:0:black", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-an", resolve(preview, "hyperframes-light.mp4")]);
await copyFile(resolve(frames, "frame_000086.png"), resolve(preview, "thumbnail.png"));
await copyFile(resolve(lightFrames, "frame_000086.png"), resolve(preview, "thumbnail-light.png"));
await copyFile(resolve(root, ".work/t3-thread-pin-v0042-verify/ssim.txt"), resolve(diff, "ssim.txt"));
await copyFile(resolve(root, ".work/t3-thread-pin-v0042-verify/hyperframes-check-raw.json"), resolve(diff, "hyperframes-check.json"));
await copyFile(resolve(root, ".work/t3-thread-pin-v0042-cli-installed-dark/check.json"), resolve(diff, "cli-installed-check.json"));
await copyFile(resolve(root, ".work/t3-thread-pin-v0042-seam-verify/result.json"), resolve(diff, "seam-to-unpin.json"));
await copyFile(resolve(root, seam.themes.dark.hyperframesFrame), resolve(diff, "seam-to-unpin.png"));
await copyFile(resolve(root, ".work/t3-thread-pin-v0042-light-verify/ssim.txt"), resolve(lightDiff, "ssim.txt"));
await copyFile(resolve(root, ".work/t3-thread-pin-v0042-light-verify/hyperframes-check-raw.json"), resolve(lightDiff, "hyperframes-check.json"));
await copyFile(resolve(root, ".work/t3-thread-pin-v0042-cli-installed/check.json"), resolve(lightDiff, "cli-installed-check.json"));
await copyFile(resolve(root, seam.themes.light.hyperframesFrame), resolve(lightDiff, "seam-to-unpin.png"));
const worst = verification.result.worstFrame;
run("ffmpeg", ["-v", "error", "-y", "-i", resolve(native, `frame-${String(worst).padStart(4, "0")}.png`), "-i", resolve(frames, `frame_${String(worst + 1).padStart(6, "0")}.png`), "-filter_complex", "[0:v][1:v]hstack=inputs=2[v]", "-map", "[v]", "-frames:v", "1", resolve(diff, "worst-frame.png")]);
const lightWorst = lightVerification.result.worstFrame;
run("ffmpeg", ["-v", "error", "-y", "-i", resolve(lightNative, `frame-${String(lightWorst).padStart(4, "0")}.png`), "-i", resolve(lightFrames, `frame_${String(lightWorst + 1).padStart(6, "0")}.png`), "-filter_complex", "[0:v][1:v]hstack=inputs=2[v]", "-map", "[v]", "-frames:v", "1", resolve(lightDiff, "worst-frame.png")]);

const sorted = [...(await readFile(resolve(diff, "ssim.txt"), "utf8")).matchAll(/^n:\d+ .*?All:([\d.]+)/gm)]
  .map((match) => Number(match[1])).sort((a, b) => a - b);
const lightSorted = [...(await readFile(resolve(lightDiff, "ssim.txt"), "utf8")).matchAll(/^n:\d+ .*?All:([\d.]+)/gm)]
  .map((match) => Number(match[1])).sort((a, b) => a - b);
const parity = {
  slug: name,
  origin: { repository: "https://github.com/pingdotgg/t3code", commit: fixture.sourceCommit, source: "apps/web/src/components/Sidebar.tsx", license: "MIT" },
  fixture: { width: fixture.viewport.width, height: fixture.viewport.height, fps: fixture.fps, durationInFrames: fixture.frames, props: fixture.events, sourceHashes: fixture.sourceHashes, domSha256: fixture.sourceDomHashes, portalSha256: fixture.portalHashes, menuBox: fixture.menuBox, motion: fixture.motion, referenceSha256: fixture.referenceSha256, compositionSha256: verification.fixture.compositionSha256 },
  classification: "source-dom-port", measurement: "lossless-png", status: "verified",
  thresholds: { meanSsim: 0.989, minSsim: 0.985 },
  result: { ...verification.result, p05Ssim: sorted[6], p95Ssim: sorted[114] },
  continuity: { to: "t3-thread-unpin", variables: { unpinMenuFrame: 120, seamToUnpin: 1 }, darkCutSsim: seam.themes.dark.ssim, lightCutSsim: seam.themes.light.ssim },
  themes: {
    dark: {
      referenceSha256: fixture.referenceSha256,
      themeSha256: await hash(resolve(root, "assets/t3-code/v0.0.42/dark-theme.json")),
      motion: fixture.motion,
      result: { ...verification.result, p05Ssim: sorted[6], p95Ssim: sorted[114] },
      artifacts: { referenceVideo: `public/previews/${name}/reference.mp4`, hyperframesVideo: `public/previews/${name}/hyperframes.mp4`, thumbnail: `public/previews/${name}/thumbnail.png`, frameSsim: `parity/${name}-diff/ssim.txt`, hyperframesCheck: `parity/${name}-diff/hyperframes-check.json`, cliInstalledCheck: `parity/${name}-diff/cli-installed-check.json`, seamFrame: `parity/${name}-diff/seam-to-unpin.png`, seamCheck: `parity/${name}-diff/seam-to-unpin.json`, worstFrame: `parity/${name}-diff/worst-frame.png` },
    },
    light: {
      fixture: { width: lightFixture.viewport.width, height: lightFixture.viewport.height, fps: lightFixture.fps, durationInFrames: lightFixture.frames, props: lightFixture.events, sourceHashes: lightFixture.sourceHashes, domSha256: lightFixture.sourceDomHashes, portalSha256: lightFixture.portalHashes, menuBox: lightFixture.menuBox, motion: lightFixture.motion, referenceSha256: lightFixture.referenceSha256 },
      referenceSha256: lightFixture.referenceSha256,
      themeSha256: await hash(resolve(root, "assets/t3-code/v0.0.42/thread-pin-light-theme.json")),
      motion: lightFixture.motion,
      result: { ...lightVerification.result, p05Ssim: lightSorted[6], p95Ssim: lightSorted[114] },
      artifacts: { referenceVideo: `public/previews/${name}/reference-light.mp4`, hyperframesVideo: `public/previews/${name}/hyperframes-light.mp4`, thumbnail: `public/previews/${name}/thumbnail-light.png`, frameSsim: `parity/${name}-light-diff/ssim.txt`, hyperframesCheck: `parity/${name}-light-diff/hyperframes-check.json`, cliInstalledCheck: `parity/${name}-light-diff/cli-installed-check.json`, seamFrame: `parity/${name}-light-diff/seam-to-unpin.png`, worstFrame: `parity/${name}-light-diff/worst-frame.png` },
    },
  },
  checks: { hyperframes: "full check and strict render passed in desktop dark and light", sourceBrowser: "Chrome Headless Shell 152", motion: "native 150 ms sidebar row travel sampled every frame at 30 fps and matched by HyperFrames", customization: "changed text, project avatar, theme, and all three beat times passed full check and four snapshots per theme", installedThroughCli: true, continuity: "opt-in final frame compared with native Thread Unpin opening frame in both themes" },
  artifacts: { referenceVideo: `public/previews/${name}/reference.mp4`, hyperframesVideo: `public/previews/${name}/hyperframes.mp4`, thumbnail: `public/previews/${name}/thumbnail.png`, frameSsim: `parity/${name}-diff/ssim.txt`, hyperframesCheck: `parity/${name}-diff/hyperframes-check.json`, cliInstalledCheck: `parity/${name}-diff/cli-installed-check.json`, seamFrame: `parity/${name}-diff/seam-to-unpin.png`, seamCheck: `parity/${name}-diff/seam-to-unpin.json`, worstFrame: `parity/${name}-diff/worst-frame.png` },
};
await writeFile(resolve(root, `parity/${name}.json`), JSON.stringify(parity, null, 2) + "\n");
console.log(`Published ${name} v0.0.42; dark ${verification.result.meanSsim.toFixed(6)}/${verification.result.minSsim.toFixed(6)}, light ${lightVerification.result.meanSsim.toFixed(6)}/${lightVerification.result.minSsim.toFixed(6)} mean/min SSIM.`);
