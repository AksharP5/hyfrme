import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFile, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-visual-context-shelf";
const candidate = resolve(root, ".work/t3-visual-context-v0042-candidate");
const source = resolve(root, "assets/t3-code/v0.0.42");
const preview = resolve(root, "public/previews", name);
const diff = resolve(root, "parity", `${name}-diff`);
const hash = async (path) => createHash("sha256").update(await readFile(path)).digest("hex");
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command}: ${result.stderr.slice(-3000)}`);
};
const fixture = JSON.parse(await readFile(resolve(source, "visual-context-v0042-dark-fixture.json"), "utf8"));
for (const [key, file] of [["index", "index.html"], ["css", "t3.css"], ["js", "index.js"]]) {
  if (await hash(resolve(source, file)) !== fixture.sourceHashes[key]) throw new Error(`Official ${file} changed`);
}
const oldManifestPath = resolve(root, `parity/${name}.json`);
const oldManifest = JSON.parse(await readFile(oldManifestPath, "utf8"));
if (!["f925d639421844f02b3166d29281905dbba6d529", fixture.sourceCommit].includes(oldManifest.origin.commit)) {
  throw new Error("Unexpected existing block source commit");
}
const candidateHash = await hash(resolve(candidate, `${name}.html`));
if (await hash(resolve(candidate, "t3-visual-context-logo-enter.png")) !== fixture.imageSha256) {
  throw new Error("Candidate pasted image changed from its official capture");
}
const cliProof = JSON.parse(await readFile(resolve(root, ".work/t3-visual-context-v0042-cli/proof.json"), "utf8"));
if (!cliProof.installedThroughCli || cliProof.themes.join(",") !== "dark,light" ||
    cliProof.compositionSha256 !== candidateHash) throw new Error("Missing final-source CLI installation proof");

const themes = {};
for (const theme of ["dark", "light"]) {
  const suffix = theme === "light" ? "-light" : "";
  const nativeFixture = JSON.parse(await readFile(resolve(source, `visual-context-v0042-${theme}-fixture.json`), "utf8"));
  const reference = resolve(root, `parity/${name}-v0042-${theme}-reference.mkv`);
  const work = resolve(root, `.work/t3-visual-context-v0042-${theme}-verify`);
  const verification = JSON.parse(await readFile(resolve(work, "result.json"), "utf8"));
  const check = JSON.parse((await readFile(resolve(work, "hyperframes-check-raw.json"), "utf8")).replace(/^[^{]*/, ""));
  const installedCheck = JSON.parse((await readFile(resolve(root, `.work/t3-visual-context-v0042-cli/${theme}/check.json`), "utf8")).replace(/^[^{]*/, ""));
  const custom = JSON.parse(await readFile(resolve(root, `.work/t3-visual-context-v0042-${theme}-custom/proof.json`), "utf8"));
  const customCheck = JSON.parse(await readFile(resolve(root, `.work/t3-visual-context-v0042-${theme}-custom/check.json`), "utf8"));
  const fontProofPath = resolve(root, `.work/t3-visual-context-v0042-${theme}-font-proof.json`);
  const fontProof = JSON.parse(await readFile(fontProofPath, "utf8"));
  for (const part of ["chip", "label", "prompt"]) {
    if (JSON.stringify(fontProof.official[part]) !== JSON.stringify(fontProof.port[part])) {
      throw new Error(`${theme} official/port ${part} computed style or bounds differ`);
    }
  }
  const regions = verification.result.crops;
  if (!verification.result.pass || verification.result.frameCount !== 120 || !check.ok || !installedCheck.ok ||
      !customCheck.ok || custom.theme !== theme || !custom.fullCheck || custom.strictFrames !== 120 ||
      custom.compositionSha256 !== candidateHash ||
      Object.values(regions).some((region) => !region.pass)) {
    throw new Error(`${theme} verification incomplete`);
  }
  if (verification.fixture.compositionSha256 !== candidateHash) throw new Error(`${theme} source differs from verified candidate`);
  if (await hash(reference) !== nativeFixture.referenceSha256) throw new Error(`${theme} native recording changed`);
  if (nativeFixture.sourceCommit !== fixture.sourceCommit || nativeFixture.theme !== theme ||
      nativeFixture.imageSha256 !== fixture.imageSha256) {
    throw new Error(`${theme} source build, theme, or pasted image differs`);
  }
  for (const [phase, expected] of Object.entries(nativeFixture.sourceDomHashes)) {
    if (await hash(resolve(source, `visual-context-v0042-${theme}-${phase}.html`)) !== expected) {
      throw new Error(`${theme} ${phase} native DOM changed`);
    }
  }
  const themeDir = resolve(diff, theme);
  await mkdir(themeDir, { recursive: true });
  await copyFile(resolve(work, "ssim.txt"), resolve(themeDir, "ssim.txt"));
  await copyFile(resolve(work, "hyperframes-check-raw.json"), resolve(themeDir, "hyperframes-check.json"));
  await copyFile(resolve(root, `.work/t3-visual-context-v0042-cli/${theme}/check.json`), resolve(themeDir, "installed-check.json"));
  await copyFile(resolve(root, `.work/t3-visual-context-v0042-${theme}-custom/check.json`), resolve(themeDir, "custom-check.json"));
  await copyFile(fontProofPath, resolve(themeDir, "font-and-bounds-proof.json"));
  await copyFile(resolve(root, `.work/t3-visual-context-v0042-${theme}-custom/render/frame_000106.png`), resolve(themeDir, "customized.png"));
  for (const region of Object.keys(regions)) {
    await copyFile(resolve(work, `${region}-ssim.txt`), resolve(themeDir, `${region}-ssim.txt`));
  }
  const worst = verification.result.worstFrame;
  run("ffmpeg", ["-v", "error", "-y", "-i", resolve(work, `native/frame-${String(worst).padStart(4, "0")}.png`),
    "-i", resolve(work, `hyperframes/frame_${String(worst + 1).padStart(6, "0")}.png`),
    "-filter_complex", "[0:v][1:v]hstack=inputs=2[v]", "-map", "[v]", "-frames:v", "1", resolve(themeDir, "worst-frame.png")]);
  const scores = [...(await readFile(resolve(work, "ssim.txt"), "utf8")).matchAll(/^n:\d+ .*?All:([\d.]+)/gm)]
    .map((match) => Number(match[1])).sort((a, b) => a - b);
  if (scores.length !== 120) throw new Error(`${theme} frame score count changed`);
  themes[theme] = {
    referenceSha256: nativeFixture.referenceSha256,
    themeSha256: await hash(resolve(source, `${theme}-theme.json`)),
    result: { ...verification.result, p05Ssim: scores[6], p95Ssim: scores[114] },
    regions,
    motion: nativeFixture.motion,
    attachmentBlobUrls: nativeFixture.attachmentBlobUrls,
    thumbnailSha256: nativeFixture.thumbnailSha256,
    artifacts: {
      referenceVideo: `public/previews/${name}/reference${suffix}.mp4`,
      hyperframesVideo: `public/previews/${name}/hyperframes${suffix}.mp4`,
      frameSsim: `parity/${name}-diff/${theme}/ssim.txt`,
      regionSsim: Object.fromEntries(Object.keys(regions).map((region) => [region, `parity/${name}-diff/${theme}/${region}-ssim.txt`])),
      hyperframesCheck: `parity/${name}-diff/${theme}/hyperframes-check.json`,
      installedCheck: `parity/${name}-diff/${theme}/installed-check.json`,
      customCheck: `parity/${name}-diff/${theme}/custom-check.json`,
      computedStyleAndBounds: `parity/${name}-diff/${theme}/font-and-bounds-proof.json`,
      worstFrame: `parity/${name}-diff/${theme}/worst-frame.png`,
      customized: `parity/${name}-diff/${theme}/customized.png`,
    },
  };
}

if (oldManifest.origin.commit !== fixture.sourceCommit) {
  await mkdir(resolve(root, "parity/legacy"), { recursive: true });
  await copyFile(oldManifestPath, resolve(root, `parity/legacy/${name}-v0035.json`));
  await cp(resolve(root, "registry/blocks", name), resolve(root, `parity/legacy/${name}-v0035-block`), { recursive: true });
  await cp(preview, resolve(root, `parity/legacy/${name}-v0035-preview`), { recursive: true });
}
await cp(candidate, resolve(root, "registry/blocks", name), { recursive: true, force: true });
await mkdir(preview, { recursive: true });

for (const theme of ["dark", "light"]) {
  const suffix = theme === "light" ? "-light" : "";
  const work = resolve(root, `.work/t3-visual-context-v0042-${theme}-verify`);
  const reference = resolve(root, `parity/${name}-v0042-${theme}-reference.mkv`);
  run("ffmpeg", ["-v", "error", "-y", "-i", reference, "-vf", `pad=1200:660:0:0:${theme === "light" ? "white" : "black"}`,
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-an", resolve(preview, `reference${suffix}.mp4`)]);
  run("ffmpeg", ["-v", "error", "-y", "-framerate", "30", "-start_number", "1", "-i", resolve(work, "hyperframes/frame_%06d.png"),
    "-vf", `pad=1200:660:0:0:${theme === "light" ? "white" : "black"}`,
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-an", resolve(preview, `hyperframes${suffix}.mp4`)]);
  await copyFile(resolve(work, "hyperframes/frame_000100.png"), resolve(preview, `thumbnail${suffix}.png`));
  run("magick", [resolve(preview, `thumbnail${suffix}.png`), "-quality", "85", resolve(preview, `thumbnail${suffix}.webp`)]);
}

const parity = {
  slug: name,
  origin: { repository: "https://github.com/pingdotgg/t3code", commit: fixture.sourceCommit,
    source: "apps/web/src/components/chat/ChatComposer.tsx", license: "MIT" },
  fixture: { width: fixture.viewport.width, height: fixture.viewport.height, fps: fixture.fps,
    durationInFrames: fixture.frames, props: { projectName: "hyfrme", contextPrompt: fixture.promptBefore,
      finalInstruction: fixture.promptAfter.slice(fixture.promptBefore.length + 1),
      imageName: fixture.imageName, imageSrc: "compositions/t3-visual-context-logo-enter.png",
      pasteFrame: fixture.pasteFrame, instructionFrame: fixture.instructionFrame, theme: "dark" },
    sourceHashes: fixture.sourceHashes, sourceDomHashes: fixture.sourceDomHashes,
    referenceSha256: fixture.referenceSha256, compositionSha256: candidateHash },
  providerState: fixture.providerState,
  interaction: "Paste the verified Hyfrme Logo Enter image into an existing T3 Code thread, then add a final-frame instruction without removing its shelf tile or inline chip.",
  imageSource: fixture.imageSource,
  imageSha256: fixture.imageSha256,
  nativeMotion: "The inline image chip has six 150 ms color transitions. Both themes are sampled at 30 fps from the official v0.0.42 app and reproduced through deterministic frame seeking.",
  measuredLimitations: "The compact image-chip text is not pixel-identical in either theme. Official and Hyfrme computed fonts, colors, and subpixel bounding boxes match exactly; rasterized glyph pixels differ. See each theme's attached/edited chip crop scores and computed-style proof.",
  classification: "source-dom-port", measurement: "lossless-png", status: "verified",
  thresholds: { meanSsim: 0.989, minSsim: 0.985,
    regions: Object.fromEntries(Object.entries(themes.dark.regions).map(([label, region]) => [label, region.minGate])) },
  result: themes.dark.result,
  themes,
  checks: { hyperframes: "full check and strict 120-frame render passed in both themes",
    hyperframesVersion: "0.8.75", sourceBrowser: "Chrome Headless Shell 152.0.7977.30",
    installedThroughCli: true, customVariables: "Dark and light edited thread history, prompt, image, filename, size label, and action frames passed full check, strict 120-frame render, and visible state assertions." },
  artifacts: { ...themes.dark.artifacts, thumbnail: `public/previews/${name}/thumbnail.png`,
    lightThumbnail: `public/previews/${name}/thumbnail-light.png` },
};
await writeFile(oldManifestPath, JSON.stringify(parity, null, 2) + "\n");
console.log(`Published ${name} v0.0.42 in dark and light; means ${themes.dark.result.meanSsim.toFixed(6)} / ${themes.light.result.meanSsim.toFixed(6)}.`);
