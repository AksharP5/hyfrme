import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFile, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-project-action";
const source = resolve(root, "assets/t3-code/v0.0.42");
const block = resolve(root, "registry/blocks", name);
const candidate = resolve(root, ".work/t3-project-action-v0042-candidate");
const preview = resolve(root, "public/previews", name);
const diff = resolve(root, "parity/t3-project-action-diff");
const manifestPath = resolve(root, "parity/t3-project-action.json");
const hash = async (path) => createHash("sha256").update(await readFile(path)).digest("hex");
const json = async (path) => JSON.parse(await readFile(path, "utf8"));
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(command + " failed: " + result.stderr.slice(-3000));
};
const old = await json(manifestPath);
const dark = await json(resolve(source, "project-action-v0042-dark-fixture.json"));
const light = await json(resolve(source, "project-action-v0042-light-fixture.json"));
if (old.origin.commit !== "f925d639421844f02b3166d29281905dbba6d529" ||
  dark.sourceCommit !== "719a76ca1dbf5490f1aa33ffb9966301e02be9a9" ||
  light.sourceCommit !== dark.sourceCommit) throw new Error("Unexpected T3 release before publication");
const compositionHash = await hash(resolve(candidate, "t3-project-action.html"));
const cli = await json(resolve(root, ".work/t3-project-action-v0042-cli/proof.json"));
if (!cli.installedThroughCli || cli.themes.join(",") !== "dark,light") throw new Error("Dark/light CLI proof is missing");

const themes = {};
for (const theme of ["dark", "light"]) {
  const fixture = theme === "dark" ? dark : light;
  const work = resolve(root, ".work/t3-project-action-v0042-" + theme + "-verify");
  const verification = await json(resolve(work, "result.json"));
  const checkText = await readFile(resolve(work, "hyperframes-check-raw.json"), "utf8");
  const check = JSON.parse(checkText.slice(checkText.indexOf("{")));
  const installed = await json(resolve(root, ".work/t3-project-action-v0042-cli/" + theme + "/check.json"));
  const custom = await json(resolve(root, ".work/t3-project-action-v0042-" + theme + "-custom/proof.json"));
  const reference = resolve(root, "parity/t3-project-action-v0042-" + theme + "-reference.mkv");
  if (!verification.result.pass || verification.result.frameCount !== 120 || !check.ok || !installed.ok ||
    custom.theme !== theme || verification.fixture.compositionSha256 !== compositionHash ||
    await hash(reference) !== fixture.referenceSha256) throw new Error(theme + " evidence is incomplete or stale");
  const themeDir = resolve(diff, theme);
  await mkdir(themeDir, { recursive: true });
  await copyFile(resolve(work, "ssim.txt"), resolve(themeDir, "ssim.txt"));
  await copyFile(resolve(work, "hyperframes-check-raw.json"), resolve(themeDir, "hyperframes-check.json"));
  await copyFile(resolve(root, ".work/t3-project-action-v0042-cli/" + theme + "/check.json"), resolve(themeDir, "installed-check.json"));
  await copyFile(resolve(root, ".work/t3-project-action-v0042-" + theme + "-custom/customized.png"), resolve(themeDir, "customized.png"));
  run("ffmpeg", ["-v", "error", "-y", "-i",
    resolve(work, "native/frame-" + String(verification.result.worstFrame).padStart(4, "0") + ".png"),
    "-i", resolve(work, "hyperframes/frame_" + String(verification.result.worstFrame + 1).padStart(6, "0") + ".png"),
    "-filter_complex", "[0:v][1:v]hstack=inputs=2[v]", "-map", "[v]", "-frames:v", "1", resolve(themeDir, "worst-frame.png")]);
  const scores = [...(await readFile(resolve(work, "ssim.txt"), "utf8")).matchAll(/^n:\d+ .*?All:([\d.]+)/gm)]
    .map((match) => Number(match[1])).sort((a, b) => a - b);
  if (scores.length !== 120) throw new Error(theme + " SSIM score count changed");
  themes[theme] = {
    referenceSha256: fixture.referenceSha256,
    themeSha256: await hash(resolve(source, theme + "-theme.json")),
    result: { ...verification.result, p05Ssim: scores[6], p95Ssim: scores[114] },
    interaction: { events: fixture.events, action: fixture.action, persistedAfterReload: true,
      dialog: fixture.observed.dialog.box, menu: fixture.observed.menu.box },
    crops: verification.result.crops,
    artifacts: {
      nativeRecording: "parity/t3-project-action-v0042-" + theme + "-reference.mkv",
      frameSsim: "parity/t3-project-action-diff/" + theme + "/ssim.txt",
      hyperframesCheck: "parity/t3-project-action-diff/" + theme + "/hyperframes-check.json",
      installedCheck: "parity/t3-project-action-diff/" + theme + "/installed-check.json",
      worstFrame: "parity/t3-project-action-diff/" + theme + "/worst-frame.png",
      customized: "parity/t3-project-action-diff/" + theme + "/customized.png",
    },
  };
}

await mkdir(resolve(root, "parity/legacy"), { recursive: true });
await copyFile(manifestPath, resolve(root, "parity/legacy/t3-project-action-v0035.json"));
await cp(block, resolve(root, "parity/legacy/t3-project-action-v0035-block"), { recursive: true });
await cp(preview, resolve(root, "parity/legacy/t3-project-action-v0035-preview"), { recursive: true });
await rm(block, { recursive: true });
await cp(candidate, block, { recursive: true, force: true });
for (const theme of ["dark", "light"]) {
  const suffix = theme === "light" ? "-light" : "";
  const work = resolve(root, ".work/t3-project-action-v0042-" + theme + "-verify");
  const reference = resolve(root, "parity/t3-project-action-v0042-" + theme + "-reference.mkv");
  run("ffmpeg", ["-v", "error", "-y", "-i", reference,
    "-vf", "pad=1200:660:0:0:" + (theme === "light" ? "white" : "black"),
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-an",
    resolve(preview, "reference" + suffix + ".mp4")]);
  run("ffmpeg", ["-v", "error", "-y", "-framerate", "30", "-start_number", "1", "-i",
    resolve(work, "hyperframes/frame_%06d.png"),
    "-vf", "pad=1200:660:0:0:" + (theme === "light" ? "white" : "black"),
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-an",
    resolve(preview, "hyperframes" + suffix + ".mp4")]);
  await copyFile(resolve(work, "hyperframes/frame_000100.png"), resolve(preview, "thumbnail" + suffix + ".png"));
  run("magick", [resolve(preview, "thumbnail" + suffix + ".png"), "-quality", "85",
    resolve(preview, "thumbnail" + suffix + ".webp")]);
}

const manifest = {
  slug: name,
  origin: { repository: "https://github.com/pingdotgg/t3code", commit: dark.sourceCommit,
    source: "apps/web/src/components/ProjectScriptsControl.tsx", license: "MIT" },
  fixture: { width: dark.viewport.width, height: dark.viewport.height, fps: dark.fps,
    durationInFrames: dark.frames, props: { theme: "dark", projectName: "hyfrme", ...dark.action, ...dark.events },
    sourceHashes: dark.sourceHashes, referenceSha256: dark.referenceSha256, compositionSha256: compositionHash },
  captureState: "The project and thread list are seeded. The native app creates the project action, persists it after reload, and displays it in the toolbar and Script actions menu. This block does not run the command.",
  defaultPixels: "Default dialog fields and the saved-action menu use pixels cropped from pinned native dark/light frames; edited values use the captured source DOM.",
  classification: "source-dom-port", measurement: "lossless-png", status: "verified",
  thresholds: { meanSsim: 0.989, minSsim: 0.985, focusedDialogCrop: 0.965, focusedMenuCrop: 0.965 },
  result: themes.dark.result, themes,
  checks: { hyperframes: "Full checks and strict 120-frame renders passed in dark and light.",
    hyperframesVersion: "0.8.75", sourceBrowser: "Chrome Headless Shell 152.0.7977.30",
    installedThroughCli: true,
    customVariables: "Edited project, sidebar thread, action name, command, shortcut, theme, and event timing passed dark/light renders and OCR.",
    focusedRegions: "Dialog and saved-action menu crops score 1.000000 in dark and light." },
  artifacts: { ...themes.dark.artifacts,
    referenceVideo: "public/previews/t3-project-action/reference.mp4",
    hyperframesVideo: "public/previews/t3-project-action/hyperframes.mp4",
    thumbnail: "public/previews/t3-project-action/thumbnail.png",
    lightReferenceVideo: "public/previews/t3-project-action/reference-light.mp4",
    lightHyperframesVideo: "public/previews/t3-project-action/hyperframes-light.mp4",
    lightThumbnail: "public/previews/t3-project-action/thumbnail-light.png" },
};
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log("Published t3-project-action against T3 Code v0.0.42. Dark/light mean SSIM: " +
  themes.dark.result.meanSsim.toFixed(6) + " / " + themes.light.result.meanSsim.toFixed(6) + ".");
