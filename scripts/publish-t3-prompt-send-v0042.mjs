import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFile, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-prompt-send";
const source = resolve(root, "assets/t3-code/v0.0.42");
const candidate = resolve(root, `.work/${name}-v0042-candidate`);
const block = resolve(root, "registry/blocks", name);
const previews = resolve(root, "public/previews", name);
const diff = resolve(root, `parity/${name}-diff`);
const manifestPath = resolve(root, `parity/${name}.json`);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stderr.slice(-3000)}\n${result.stdout.slice(-1000)}`);
  return result.stdout;
};

const legacy = await readJson(manifestPath);
if (legacy.origin.commit !== "f925d639421844f02b3166d29281905dbba6d529") {
  throw new Error("Expected the pinned v0.0.35 manifest before Prompt Send publication");
}
const candidateHash = await hash(await readFile(resolve(candidate, `${name}.html`)));
const cli = await readJson(resolve(root, `.work/${name}-v0042-cli/proof.json`));
const atlas = await readJson(resolve(root, `parity/${name}-v0042-atlas.json`));
if (cli.name !== name || !cli.installedThroughCli || cli.compositionSha256 !== candidateHash ||
    cli.themes.join(",") !== "dark,light" || atlas.sourceCommit !== "719a76ca1dbf5490f1aa33ffb9966301e02be9a9") {
  throw new Error("Prompt Send CLI or capture-atlas proof is incomplete");
}
const themes = {};
for (const theme of ["dark", "light"]) {
  const prefix = `prompt-send-v0042-${theme}`;
  const fixture = await readJson(resolve(source, `${prefix}-fixture.json`));
  const work = resolve(root, `.work/${name}-v0042-${theme}-verify`);
  const custom = await readJson(resolve(root, `.work/${name}-v0042-custom/${theme}/proof.json`));
  const installedCheck = await readJson(resolve(root, `.work/${name}-v0042-cli/${theme}/check.json`));
  const customCheck = await readJson(resolve(root, `.work/${name}-v0042-custom/${theme}/check.json`));
  const verification = await readJson(resolve(work, "result.json"));
  const check = await readJson(resolve(work, "hyperframes-check-raw.json"));
  const reference = resolve(root, `parity/${name}-v0042-${theme}-reference.mkv`);
  const expectedThresholds = { mean: 0.985, minimum: 0.980 };
  if (fixture.sourceTag !== "v0.0.42" || fixture.sourceCommit !== "719a76ca1dbf5490f1aa33ffb9966301e02be9a9" ||
      fixture.theme !== theme || fixture.frames !== 120 || fixture.fps !== 30 ||
      await hash(await readFile(reference)) !== fixture.referenceSha256 ||
      verification.fixture.compositionSha256 !== candidateHash || !verification.result.pass ||
      verification.result.frameCount !== 120 || verification.result.meanSsim < expectedThresholds.mean ||
      verification.result.minSsim < expectedThresholds.minimum || !check.ok || !installedCheck.ok || !customCheck.ok ||
      custom.theme !== theme || custom.compositionSha256 !== candidateHash || custom.renderMode !== "editable DOM" ||
      custom.strictRenderFrames !== 120 || !custom.promptOcr.includes("Hyfrme")) {
    throw new Error(`${theme} native parity, custom-variable, or installed check is incomplete`);
  }
  for (const [row, expected] of Object.entries(fixture.captureSpriteSha256)) {
    const asset = resolve(source, `${prefix}-capture-${row}.webp`);
    if (await hash(await readFile(asset)) !== expected) throw new Error(`${theme} capture strip ${row} changed`);
  }

  const themeDiff = resolve(diff, theme);
  await mkdir(themeDiff, { recursive: true });
  await copyFile(resolve(work, "ssim.txt"), resolve(themeDiff, "ssim.txt"));
  await copyFile(resolve(work, "hyperframes-check-raw.json"), resolve(themeDiff, "hyperframes-check.json"));
  await copyFile(resolve(root, `.work/${name}-v0042-cli/${theme}/check.json`), resolve(themeDiff, "installed-check.json"));
  await copyFile(resolve(root, `.work/${name}-v0042-custom/${theme}/check.json`), resolve(themeDiff, "custom-check.json"));
  await copyFile(resolve(root, `.work/${name}-v0042-custom/${theme}/render/frame_000011.png`), resolve(themeDiff, "customized-prompt.png"));
  const scores = [...(await readFile(resolve(work, "ssim.txt"), "utf8")).matchAll(/^n:\d+ .*?All:([\d.]+)/gm)]
    .map((match) => Number(match[1])).sort((a, b) => a - b);
  if (scores.length !== 120) throw new Error(`${theme} SSIM report does not contain 120 frame scores`);
  const suffix = theme === "light" ? "-light" : "";
  themes[theme] = {
    sourceCommit: fixture.sourceCommit,
    referenceSha256: fixture.referenceSha256,
    sourceHashes: fixture.sourceHashes,
    sourceDomHashes: fixture.sourceDomHashes,
    themeSha256: await hash(await readFile(resolve(source, `${theme}-theme.json`))),
    result: { ...verification.result, p05Ssim: scores[6], p95Ssim: scores[114] },
    providerState: fixture.providerState,
    events: fixture.events,
    artifacts: {
      nativeRecording: `parity/${name}-v0042-${theme}-reference.mkv`,
      referenceVideo: `public/previews/${name}/reference${suffix}.mp4`,
      hyperframesVideo: `public/previews/${name}/hyperframes${suffix}.mp4`,
      frameSsim: `parity/${name}-diff/${theme}/ssim.txt`,
      hyperframesCheck: `parity/${name}-diff/${theme}/hyperframes-check.json`,
      installedCheck: `parity/${name}-diff/${theme}/installed-check.json`,
      customCheck: `parity/${name}-diff/${theme}/custom-check.json`,
      customized: `parity/${name}-diff/${theme}/customized-prompt.png`,
    },
  };
}

await mkdir(resolve(root, "parity/legacy"), { recursive: true });
await copyFile(manifestPath, resolve(root, `parity/legacy/${name}-v0035.json`));
await cp(block, resolve(root, `parity/legacy/${name}-v0035-block`), { recursive: true });
await cp(previews, resolve(root, `parity/legacy/${name}-v0035-preview`), { recursive: true });
await rm(block, { recursive: true, force: true });
await cp(candidate, block, { recursive: true });

for (const theme of ["dark", "light"]) {
  const suffix = theme === "light" ? "-light" : "";
  const work = resolve(root, `.work/${name}-v0042-${theme}-verify`);
  const reference = resolve(root, `parity/${name}-v0042-${theme}-reference.mkv`);
  const output = resolve(previews);
  run("ffmpeg", ["-v", "error", "-y", "-i", reference,
    "-vf", `pad=1200:660:0:0:${theme === "light" ? "white" : "black"}`,
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-an",
    resolve(output, `reference${suffix}.mp4`)]);
  run("ffmpeg", ["-v", "error", "-y", "-framerate", "30", "-start_number", "1", "-i",
    resolve(work, "hyperframes/frame_%06d.png"),
    "-vf", `pad=1200:660:0:0:${theme === "light" ? "white" : "black"}`,
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-an",
    resolve(output, `hyperframes${suffix}.mp4`)]);
  await copyFile(resolve(work, "hyperframes/frame_000046.png"), resolve(output, `thumbnail${suffix}.png`));
  run("magick", [resolve(output, `thumbnail${suffix}.png`), "-quality", "85", resolve(output, `thumbnail${suffix}.webp`)]);
}

const dark = await readJson(resolve(source, "prompt-send-v0042-dark-fixture.json"));
const manifest = {
  slug: name,
  origin: { repository: "https://github.com/pingdotgg/t3code", commit: dark.sourceCommit,
    source: "apps/web/src/components/chat/ChatComposer.tsx", license: "MIT" },
  fixture: { width: dark.viewport.width, height: dark.viewport.height, fps: dark.fps,
    durationInFrames: dark.frames, props: { prompt: dark.prompt, theme: "dark", ...dark.events },
    sourceHashes: dark.sourceHashes, captureAtlas: "parity/t3-prompt-send-v0042-atlas.json",
    compositionSha256: candidateHash },
  interaction: "The real T3 composer sends a Hyfrme request, creates the thread, and enters Thinking. The provider is live, but no answer arrived during the four-second capture window.",
  providerState: dark.providerState,
  classification: "source-dom-port with lossless native-frame default",
  measurement: "lossless PNG; every native capture strip round-trips at SSIM 1.0",
  status: "verified",
  thresholds: { meanSsim: 0.985, minSsim: 0.980 },
  result: themes.dark.result,
  themes,
  checks: { hyperframes: "full checks and strict 120-frame renders passed in dark and light",
    hyperframesVersion: "0.8.75", sourceBrowser: "Google Chrome for Testing 152.0.7977.30",
    installedThroughCli: true,
    customVariables: "Edited-DOM mode changed Hyfrme project, prompt, branch, thread title and send/complete timing in both themes; strict renders and visible-text assertions passed." },
  artifacts: { ...themes.dark.artifacts, thumbnail: `public/previews/${name}/thumbnail.png`,
    lightThumbnail: `public/previews/${name}/thumbnail-light.png` },
};
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

const ideasPath = resolve(root, "parity/t3-gallery/data.js");
let ideasSource = await readFile(ideasPath, "utf8");
if (ideasSource.includes("  [31, {")) throw new Error("Prompt Send already has release metadata");
const insertAt = ideasSource.indexOf("  [34, {");
if (insertAt < 0) throw new Error("Could not find the T3 v0.0.42 release metadata insertion point");
ideasSource = ideasSource.slice(0, insertAt) +
  `  [31, { themes: ["dark", "light"], coverage: "frame parity (live Codex provider; response pending)", capture: "Native T3 Code v0.0.42 sends a Hyfrme prompt through the live Codex provider, creates the thread, and remains in Thinking because no answer arrived in the four-second capture. The follow-up response is not claimed here. Dark and light native frames round-trip exactly; editable-DOM mode exposes project, branch, prompt, thread, theme, and send/complete timing." }],\n` +
  ideasSource.slice(insertAt);
await writeFile(ideasPath, ideasSource);

const galleryPath = resolve(root, "parity/t3code-ideas.json");
const gallery = await readJson(galleryPath);
for (const frame of gallery.frames.filter((entry) => entry.idea === 31)) {
  frame.sourceVideo = `parity/${name}-v0042-dark-reference.mkv`;
}
const recording = gallery.recordings.find((entry) => entry.idea === 31);
if (!recording) throw new Error("Prompt Send gallery recording is missing");
recording.sourceVideo = `parity/${name}-v0042-dark-reference.mkv`;
await writeFile(galleryPath, JSON.stringify(gallery, null, 2) + "\n");

const coveragePath = resolve(root, "docs/T3_CODE_COVERAGE.md");
let coverage = await readFile(coveragePath, "utf8");
coverage = coverage.replace("except Brief to Prompt,", "except Prompt Send, Brief to Prompt,");
coverage = coverage.replace(
  /^\| Prompt Send\s+\| 31\s+\| `t3-prompt-send` \|[^\n]*$/m,
  "| Prompt Send (v0.0.42, dark + light) | 31 | `t3-prompt-send` | dark mean/min 0.999913/0.996025; light 0.999982/0.997834, 120 frames each; live Codex send, response pending |");
await writeFile(coveragePath, coverage);

run(process.execPath, [resolve(root, "scripts/sync-t3-gallery-fixtures.mjs"), "31"]);
console.log(`Published ${name} v0.0.42 dark/light; old v0.0.35 files are archived under parity/legacy.`);
