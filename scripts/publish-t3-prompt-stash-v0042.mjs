import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFile, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-prompt-stash";
const candidate = resolve(root, `.work/${name}-v0042-candidate`);
const source = resolve(root, "assets/t3-code/v0.0.42");
const block = resolve(root, "registry/blocks", name);
const preview = resolve(root, "public/previews", name);
const diff = resolve(root, `parity/${name}-diff`);
const manifestPath = resolve(root, `parity/${name}.json`);
const hash = async (path) => createHash("sha256").update(await readFile(path)).digest("hex");
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr.slice(-3000)}`);
};
const old = await readJson(manifestPath);
if (old.origin.commit !== "f925d639421844f02b3166d29281905dbba6d529") {
  throw new Error("Expected pinned v0.0.35 source before publication");
}
const candidateHash = await hash(resolve(candidate, `${name}.html`));
const registryItem = await readJson(resolve(candidate, "registry-item.json"));
if (registryItem.files.some((file) => /\.(png|jpe?g|webp)$/i.test(file.path))) {
  throw new Error("Prompt Stash drawer must remain an editable source-DOM port");
}
const cli = await readJson(resolve(root, `.work/${name}-v0042-cli/proof.json`));
if (!cli.installedThroughCli || cli.compositionSha256 !== candidateHash || cli.themes.join(",") !== "dark,light") {
  throw new Error("Candidate CLI installation proof is incomplete");
}
const dark = await readJson(resolve(source, "prompt-stash-v0042-dark-fixture.json"));
for (const [key, file] of [["index", "index.html"], ["css", "t3.css"], ["js", "index.js"]]) {
  if (await hash(resolve(source, file)) !== dark.sourceHashes[key]) {
    throw new Error(`${file} differs from the pinned v0.0.42 release`);
  }
}
const themes = {};
for (const theme of ["dark", "light"]) {
  const fixture = await readJson(resolve(source, `prompt-stash-v0042-${theme}-fixture.json`));
  const work = resolve(root, `.work/${name}-v0042-${theme}-verify`);
  const verification = await readJson(resolve(work, "result.json"));
  const check = await readJson(resolve(work, "hyperframes-check-raw.json"));
  const installedCheck = await readJson(resolve(root, `.work/${name}-v0042-cli/${theme}/check.json`));
  const custom = await readJson(resolve(root, `.work/${name}-v0042-${theme}-custom/proof.json`));
  const customCheck = await readJson(resolve(root, `.work/${name}-v0042-${theme}-custom/check.json`));
  const reference = resolve(root, `parity/${name}-v0042-${theme}-reference.mkv`);
  const anchored = ["menu", "persisted-menu"].every((phase) => {
    const rect = fixture.observed[phase]?.drawerRect;
    return rect?.x === 366 && rect?.y === 407 && rect?.width === 724 && rect?.height === 73;
  });
  const editedAnchored = ["menu", "persisted-menu"].every((phase) => {
    const rect = custom.popupGeometry?.[phase];
    return rect && Math.abs(rect.x - 366) <= 0.5 && Math.abs(rect.y - 407) <= 0.5 &&
      Math.abs(rect.width - 724) <= 0.5 && Math.abs(rect.height - 73) <= 0.5;
  });
  if (fixture.sourceCommit !== "719a76ca1dbf5490f1aa33ffb9966301e02be9a9" ||
      fixture.sourceCommit !== dark.sourceCommit || await hash(reference) !== fixture.referenceSha256 ||
      verification.fixture.compositionSha256 !== candidateHash || !verification.result.pass ||
      verification.result.frameCount !== 120 ||
      !Number.isFinite(verification.result.meanSsim) || verification.result.meanSsim < 0.985 ||
      !Number.isFinite(verification.result.minSsim) || verification.result.minSsim < 0.980 ||
      Object.keys(verification.result.crops).length !== 7 ||
      Object.values(verification.result.crops).some((crop) =>
        !Number.isFinite(crop.ssim) || crop.ssim < crop.minimumSsim) || !anchored || !editedAnchored ||
      !check.ok || !installedCheck.ok || !customCheck.ok || custom.theme !== theme ||
      custom.compositionSha256 !== candidateHash || !custom.popupGeometrySource ||
      !custom.fullCheck || custom.strictRenderFrames !== 120 ||
      await hash(resolve(root, `.work/${name}-v0042-${theme}-custom/compositions/${name}.html`)) !== candidateHash) {
    throw new Error(`${theme} native, port, custom-input, or installed proof is incomplete`);
  }
  for (const [phase, expected] of Object.entries(fixture.sourceDomHashes)) {
    if (await hash(resolve(source, `prompt-stash-v0042-${theme}-${phase}.html`)) !== expected) {
      throw new Error(`${theme} ${phase} official DOM changed`);
    }
  }
  for (const [phase, expected] of Object.entries(fixture.portalHashes)) {
    if (await hash(resolve(source, `prompt-stash-v0042-${theme}-${phase}-portal.html`)) !== expected) {
      throw new Error(`${theme} ${phase} official drawer portal changed`);
    }
  }
  const themeDir = resolve(diff, theme);
  await mkdir(themeDir, { recursive: true });
  const criticalStates = [];
  for (const [phase, evidence] of Object.entries(verification.result.crops)) {
    const native = resolve(themeDir, `${phase}-native.png`);
    const hyperframes = resolve(themeDir, `${phase}-hyperframes.png`);
    const nativeFrame = resolve(work, `native/frame-${String(evidence.frame).padStart(4, "0")}.png`);
    const renderedFrame = resolve(work, `hyperframes/frame_${String(evidence.frame + 1).padStart(6, "0")}.png`);
    if (await hash(nativeFrame) !== evidence.nativeSha256 || await hash(renderedFrame) !== evidence.hyperframesSha256) {
      throw new Error(`${theme} ${phase} focused source frame changed`);
    }
    run("ffmpeg", ["-v", "error", "-y", "-i", nativeFrame, "-vf", `crop=${evidence.region}`, "-frames:v", "1", native]);
    run("ffmpeg", ["-v", "error", "-y", "-i", renderedFrame, "-vf", `crop=${evidence.region}`, "-frames:v", "1", hyperframes]);
    criticalStates.push({ name: `${theme} ${phase}`, frame: evidence.frame, native: `parity/${name}-diff/${theme}/${phase}-native.png`,
      hyperframes: `parity/${name}-diff/${theme}/${phase}-hyperframes.png`, nativeSha256: await hash(native),
      hyperframesSha256: await hash(hyperframes), ssim: evidence.ssim, minimumSsim: evidence.minimumSsim });
  }
  await copyFile(resolve(work, "ssim.txt"), resolve(themeDir, "ssim.txt"));
  await copyFile(resolve(work, "hyperframes-check-raw.json"), resolve(themeDir, "hyperframes-check.json"));
  await copyFile(resolve(root, `.work/${name}-v0042-cli/${theme}/check.json`), resolve(themeDir, "installed-check.json"));
  await copyFile(resolve(root, `.work/${name}-v0042-${theme}-custom/check.json`), resolve(themeDir, "custom-check.json"));
  await copyFile(resolve(root, `.work/${name}-v0042-${theme}-custom/render/frame_000046.png`), resolve(themeDir, "customized-stash.png"));
  const scores = [...(await readFile(resolve(work, "ssim.txt"), "utf8")).matchAll(/^n:\d+ .*?All:([\d.]+)/gm)]
    .map((match) => Number(match[1])).sort((a, b) => a - b);
  if (scores.length !== 120) throw new Error(`${theme} score count changed`);
  const suffix = theme === "light" ? "-light" : "";
  themes[theme] = {
    referenceSha256: fixture.referenceSha256, sourceDomHashes: fixture.sourceDomHashes, portalHashes: fixture.portalHashes,
    themeSha256: await hash(resolve(source, `${theme}-theme.json`)),
    result: { ...verification.result, p05Ssim: scores[6], p95Ssim: scores[114], criticalStates },
    observed: fixture.observed,
    artifacts: { nativeRecording: `parity/${name}-v0042-${theme}-reference.mkv`,
      referenceVideo: `public/previews/${name}/reference${suffix}.mp4`,
      hyperframesVideo: `public/previews/${name}/hyperframes${suffix}.mp4`,
      frameSsim: `parity/${name}-diff/${theme}/ssim.txt`,
      hyperframesCheck: `parity/${name}-diff/${theme}/hyperframes-check.json`,
      installedCheck: `parity/${name}-diff/${theme}/installed-check.json`,
      customCheck: `parity/${name}-diff/${theme}/custom-check.json`,
      customized: `parity/${name}-diff/${theme}/customized-stash.png` },
  };
}
await mkdir(resolve(root, "parity/legacy"), { recursive: true });
await copyFile(manifestPath, resolve(root, `parity/legacy/${name}-v0035.json`));
await cp(block, resolve(root, `parity/legacy/${name}-v0035-block`), { recursive: true });
await cp(preview, resolve(root, `parity/legacy/${name}-v0035-preview`), { recursive: true });
await rm(block, { recursive: true });
await cp(candidate, block, { recursive: true, force: true });
for (const theme of ["dark", "light"]) {
  const suffix = theme === "light" ? "-light" : "";
  const work = resolve(root, `.work/${name}-v0042-${theme}-verify`);
  const reference = resolve(root, `parity/${name}-v0042-${theme}-reference.mkv`);
  run("ffmpeg", ["-v", "error", "-y", "-i", reference, "-vf", `pad=1200:660:0:0:${theme === "light" ? "white" : "black"}`,
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-an", resolve(preview, `reference${suffix}.mp4`)]);
  run("ffmpeg", ["-v", "error", "-y", "-framerate", "30", "-start_number", "1", "-i", resolve(work, "hyperframes/frame_%06d.png"),
    "-vf", `pad=1200:660:0:0:${theme === "light" ? "white" : "black"}`,
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-an", resolve(preview, `hyperframes${suffix}.mp4`)]);
  await copyFile(resolve(work, "hyperframes/frame_000046.png"), resolve(preview, `thumbnail${suffix}.png`));
  run("magick", [resolve(preview, `thumbnail${suffix}.png`), "-quality", "85", resolve(preview, `thumbnail${suffix}.webp`)]);
}
const manifest = {
  slug: name,
  origin: { repository: "https://github.com/pingdotgg/t3code", commit: dark.sourceCommit,
    source: "apps/web/src/components/chat/ChatComposer.tsx", license: "MIT" },
  fixture: { width: dark.viewport.width, height: dark.viewport.height, fps: dark.fps, durationInFrames: dark.frames,
    props: { theme: "dark", projectName: "hyfrme", prompt: dark.prompt, ...dark.events },
    sourceHashes: dark.sourceHashes, sourceDomHashes: dark.sourceDomHashes, portalHashes: dark.portalHashes,
    referenceSha256: dark.referenceSha256, compositionSha256: candidateHash },
  providerState: "The Hyfrme project and completed conversation are seeded. Native stash, reload persistence, drawer restore, and direct single-entry Ctrl+S restore execute locally; no AI provider or GitHub account runs.",
  interaction: "Ctrl+S stashes a Hyfrme draft, the badge opens a drawer at x=366,y=407, reload retains it, and Restore consumes it. With exactly one entry, Ctrl+S on an empty composer restores directly.",
  classification: "source-dom-port", measurement: "lossless-png", status: "verified",
  thresholds: { meanSsim: 0.985, minSsim: 0.980, focusedStashCrop: 0.97 },
  result: themes.dark.result, themes,
  checks: { hyperframes: "full checks and strict 120-frame renders passed in both themes",
    hyperframesVersion: "0.8.75", sourceBrowser: "Chrome Headless Shell 152.0.7977.30",
    installedThroughCli: true, customVariables: "Changed project, thread and conversation copy, prompt, stash label and age, theme and event frames passed full checks, strict renders and OCR in both themes" },
  artifacts: { ...themes.dark.artifacts, thumbnail: `public/previews/${name}/thumbnail.png`,
    lightThumbnail: `public/previews/${name}/thumbnail-light.png` },
};
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`Published ${name} v0.0.42 dark/light mean ${themes.dark.result.meanSsim.toFixed(6)} / ${themes.light.result.meanSsim.toFixed(6)}`);
