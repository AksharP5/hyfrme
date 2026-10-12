import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFile, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-permission-choice";
const source = resolve(root, "assets/t3-code/v0.0.42");
const candidate = resolve(root, `.work/${name}-v0042-candidate`);
const preview = resolve(root, "public/previews", name);
const diff = resolve(root, "parity", `${name}-diff`);
const manifestPath = resolve(root, "parity", `${name}.json`);
const hash = async (path) => createHash("sha256").update(await readFile(path)).digest("hex");
const readCheck = async (path) => {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw.slice(raw.indexOf("{")));
};
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr.slice(-3000)}`);
};

const previous = JSON.parse(await readFile(manifestPath, "utf8"));
if (previous.origin.commit !== "f925d639421844f02b3166d29281905dbba6d529" || previous.themes?.light) {
  throw new Error("Expected the existing v0.0.35 Permission Choice block");
}
const candidateHash = await hash(resolve(candidate, `${name}.html`));
const cliProof = JSON.parse(await readFile(resolve(root, `.work/${name}-v0042-cli/proof.json`), "utf8"));
if (!cliProof.installedThroughCli || cliProof.compositionSha256 !== candidateHash ||
    cliProof.themes.join(",") !== "dark,light") throw new Error("CLI installation is not exact-source verified");

const themes = {};
for (const theme of ["dark", "light"]) {
  const suffix = theme === "light" ? "-light" : "";
  const fixture = JSON.parse(await readFile(resolve(source, `permission-choice${suffix}-fixture.json`), "utf8"));
  const reference = resolve(root, `parity/${name}-v0042${suffix}-reference.mkv`);
  const work = resolve(root, `.work/${name}-v0042-${theme}-verify`);
  const verification = JSON.parse(await readFile(resolve(work, "result.json"), "utf8"));
  const regions = JSON.parse(await readFile(resolve(work, "region-result.json"), "utf8"));
  const custom = JSON.parse(await readFile(resolve(root, `.work/${name}-v0042-custom-${theme}/proof.json`), "utf8"));
  const customCheck = await readCheck(resolve(root, `.work/${name}-v0042-custom-${theme}/check.json`));
  const installedCheck = await readCheck(resolve(root, `.work/${name}-v0042-cli/${theme}/check.json`));
  if (fixture.sourceCommit !== "719a76ca1dbf5490f1aa33ffb9966301e02be9a9" ||
      fixture.frames !== 120 || await hash(reference) !== fixture.referenceSha256 ||
      verification.fixture.compositionSha256 !== candidateHash || !verification.result.pass ||
      verification.result.frameCount !== 120 || Object.values(regions).some((region) => !region.pass) ||
      !(await readCheck(resolve(work, "hyperframes-check-raw.json"))).ok ||
      !installedCheck.ok || !customCheck.ok || custom.theme !== theme || !custom.fullCheck ||
      custom.strictRenderFrames !== 120 || Object.values(custom.motionChanges).some((pixels) => pixels <= 100)) {
    throw new Error(`${theme} native, strict, focused, customized, or CLI-installed verification failed`);
  }
  const themeDiff = resolve(diff, theme);
  await mkdir(themeDiff, { recursive: true });
  for (const file of ["ssim.txt", "hyperframes-check-raw.json", "region-result.json",
    ...Object.keys(regions).map((region) => `${region}-ssim.txt`)]) {
    await copyFile(resolve(work, file), resolve(themeDiff, file));
  }
  await copyFile(resolve(root, `.work/${name}-v0042-cli/${theme}/check.json`), resolve(themeDiff, "installed-check.json"));
  await copyFile(resolve(root, `.work/${name}-v0042-custom-${theme}/check.json`), resolve(themeDiff, "custom-check.json"));
  const worst = verification.result.worstFrame;
  run("ffmpeg", ["-v", "error", "-y", "-i", resolve(work, `native/frame-${String(worst).padStart(4, "0")}.png`),
    "-i", resolve(work, `hyperframes/frame_${String(worst + 1).padStart(6, "0")}.png`),
    "-filter_complex", "[0:v][1:v]hstack=inputs=2[v]", "-map", "[v]", "-frames:v", "1", resolve(themeDiff, "worst-frame.png")]);
  const scores = [...(await readFile(resolve(work, "ssim.txt"), "utf8")).matchAll(/^n:\d+ .*?All:([\d.]+)/gm)]
    .map((match) => Number(match[1])).sort((a, b) => a - b);
  if (scores.length !== 120) throw new Error(`${theme} frame score count changed`);
  themes[theme] = {
    referenceSha256: fixture.referenceSha256,
    themeSha256: await hash(resolve(source, `${theme}-theme.json`)),
    popupBox: fixture.popupBox,
    triggerBox: fixture.triggerBox,
    events: fixture.events,
    result: { ...verification.result, p05Ssim: scores[6], p95Ssim: scores[114] },
    regions,
    artifacts: {
      referenceVideo: `public/previews/${name}/reference${suffix}.mp4`,
      hyperframesVideo: `public/previews/${name}/hyperframes${suffix}.mp4`,
      frameSsim: `parity/${name}-diff/${theme}/ssim.txt`,
      regionSsim: `parity/${name}-diff/${theme}/region-result.json`,
      hyperframesCheck: `parity/${name}-diff/${theme}/hyperframes-check-raw.json`,
      installedCheck: `parity/${name}-diff/${theme}/installed-check.json`,
      customCheck: `parity/${name}-diff/${theme}/custom-check.json`,
      worstFrame: `parity/${name}-diff/${theme}/worst-frame.png`,
    },
  };
}

await mkdir(resolve(root, "parity/legacy"), { recursive: true });
await copyFile(manifestPath, resolve(root, `parity/legacy/${name}-v0035.json`));
await cp(resolve(root, "registry/blocks", name), resolve(root, `parity/legacy/${name}-v0035-block`), { recursive: true });
await cp(preview, resolve(root, `parity/legacy/${name}-v0035-preview`), { recursive: true });
await rm(resolve(root, "registry/blocks", name), { recursive: true });
await cp(candidate, resolve(root, "registry/blocks", name), { recursive: true });
for (const theme of ["dark", "light"]) {
  const suffix = theme === "light" ? "-light" : "";
  const work = resolve(root, `.work/${name}-v0042-${theme}-verify`);
  run("ffmpeg", ["-v", "error", "-y", "-i", resolve(root, `parity/${name}-v0042${suffix}-reference.mkv`),
    "-vf", `pad=1200:660:0:0:${theme === "light" ? "white" : "black"}`,
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-an", resolve(preview, `reference${suffix}.mp4`)]);
  run("ffmpeg", ["-v", "error", "-y", "-framerate", "30", "-start_number", "1", "-i", resolve(work, "hyperframes/frame_%06d.png"),
    "-vf", `pad=1200:660:0:0:${theme === "light" ? "white" : "black"}`,
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-an", resolve(preview, `hyperframes${suffix}.mp4`)]);
  await copyFile(resolve(work, "hyperframes/frame_000106.png"), resolve(preview, `thumbnail${suffix}.png`));
  await copyFile(resolve(root, `.work/${name}-v0042-custom-${theme}/render/frame_000106.png`),
    resolve(preview, `customized${suffix}.png`));
  run("magick", [resolve(preview, `thumbnail${suffix}.png`), "-quality", "85", resolve(preview, `thumbnail${suffix}.webp`)]);
}
const fixture = JSON.parse(await readFile(resolve(source, "permission-choice-fixture.json"), "utf8"));
const lightFixture = JSON.parse(await readFile(resolve(source, "permission-choice-light-fixture.json"), "utf8"));
const popupRasterHashes = { ...fixture.popupRasterHashes, ...lightFixture.popupRasterHashes };
for (const [file, expected] of Object.entries(popupRasterHashes)) {
  if (await hash(resolve(candidate, file)) !== expected) throw new Error(`${file} changed since native capture`);
}
const parity = {
  ...previous,
  origin: { ...previous.origin, commit: fixture.sourceCommit,
    source: "apps/web/src/components/chat/ChatComposer.tsx" },
  fixture: {
    ...previous.fixture,
    props: { projectName: "hyfrme", prompt: fixture.prompt, modelName: "GPT-6-Astra",
      reasoningLevel: "Medium", serviceTier: "Standard",
      permissionBefore: fixture.permissionBefore, permissionAfter: fixture.permissionAfter,
      openFrame: fixture.events.open, hoverFrame: fixture.events.hover, selectFrame: fixture.events.select,
      theme: "dark" },
    sourceHashes: fixture.sourceHashes,
    sourceDomHashes: fixture.sourceDomHashes,
    portalHashes: fixture.portalHashes,
    referenceSha256: fixture.referenceSha256,
    compositionSha256: candidateHash,
    assetSha256: popupRasterHashes,
  },
  result: themes.dark.result,
  themes,
  checks: {
    ...previous.checks,
    hyperframes: "full check and strict 120-frame render passed in both themes",
    installedThroughCli: true,
    customVariables: "dark and light project, model, High/Fast trigger, prompt, permission labels/details, and open/hover/select timing passed full checks, strict renders, and visible OCR snapshots",
    nativeAction: "official v0.0.42 Runtime mode menu opened beside the composer, hovered Auto-accept edits, and selected it",
    seededState: "isolated local Hyfrme workspace without an AI provider",
    popupFidelity: "default menu pixels cropped from native dark/light captures; edited content uses the customizable DOM popup",
  },
  artifacts: {
    ...themes.dark.artifacts,
    thumbnail: `public/previews/${name}/thumbnail.png`,
    lightThumbnail: `public/previews/${name}/thumbnail-light.png`,
    customized: `public/previews/${name}/customized.png`,
    lightCustomized: `public/previews/${name}/customized-light.png`,
  },
};
await writeFile(manifestPath, JSON.stringify(parity, null, 2) + "\n");
console.log(`Published ${name} v0.0.42 in dark and light.`);
