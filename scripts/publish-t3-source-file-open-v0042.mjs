import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFile, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-source-file-open";
const source = resolve(root, "assets/t3-code/v0.0.42");
const candidate = resolve(root, `.work/${name}-v0042-candidate`);
const preview = resolve(root, "public/previews", name);
const diff = resolve(root, "parity", `${name}-diff`);
const manifestPath = resolve(root, "parity", `${name}.json`);
const hash = async (path) => createHash("sha256").update(await readFile(path)).digest("hex");
const check = async (path) => {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw.slice(raw.indexOf("{")));
};
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr.slice(-3000)}`);
};

const previous = JSON.parse(await readFile(manifestPath, "utf8"));
if (previous.origin.commit !== "f925d639421844f02b3166d29281905dbba6d529" || previous.themes?.light) {
  throw new Error("Expected the existing v0.0.35 block");
}
const compositionSha256 = await hash(resolve(candidate, `${name}.html`));
const themes = {};
for (const theme of ["dark", "light"]) {
  const suffix = theme === "light" ? "-light" : "";
  const fixture = JSON.parse(await readFile(resolve(source, `source-file-open${suffix}-fixture.json`), "utf8"));
  const work = resolve(root, `.work/${name}-v0042-${theme}-verify`);
  const verification = JSON.parse(await readFile(resolve(work, "result.json"), "utf8"));
  const crops = JSON.parse(await readFile(resolve(work, "crops.json"), "utf8"));
  const native = resolve(root, `parity/${name}-v0042${suffix}-reference.mkv`);
  if (fixture.sourceCommit !== "719a76ca1dbf5490f1aa33ffb9966301e02be9a9" ||
      fixture.sourceMode !== "The native HTML file defaults to rendered preview; this capture clicks Show HTML source immediately after opening it." ||
      fixture.rowAnimations.opened?.[0]?.duration !== 150 ||
      await hash(native) !== fixture.referenceSha256 ||
      verification.fixture.compositionSha256 !== compositionSha256 ||
      verification.result.frameCount !== 120 || !verification.result.pass || !crops.pass ||
      !(await check(resolve(work, "hyperframes-check-raw.json"))).ok ||
      !(await check(resolve(root, `.work/${name}-v0042-custom-${theme}/check.json`))).ok ||
      !(await check(resolve(root, `.work/${name}-v0042-cli/${theme}/check.json`))).ok) {
    throw new Error(`${theme} native, parity, custom, or CLI-installed proof failed`);
  }
  const themeDiff = resolve(diff, theme);
  await mkdir(themeDiff, { recursive: true });
  for (const [from, to] of [
    ["ssim.txt", "ssim.txt"],
    ["hyperframes-check-raw.json", "hyperframes-check.json"],
    ["crops.json", "crops.json"],
  ]) await copyFile(resolve(work, from), resolve(themeDiff, to));
  await copyFile(resolve(root, `.work/${name}-v0042-cli/${theme}/check.json`), resolve(themeDiff, "installed-check.json"));
  const worst = verification.result.worstFrame;
  run("ffmpeg", ["-v", "error", "-y", "-i", resolve(work, `native/frame-${String(worst).padStart(4, "0")}.png`),
    "-i", resolve(work, `hyperframes/frame_${String(worst + 1).padStart(6, "0")}.png`),
    "-filter_complex", "[0:v][1:v]hstack=inputs=2[v]", "-map", "[v]", "-frames:v", "1", resolve(themeDiff, "worst-frame.png")]);
  const scores = [...(await readFile(resolve(work, "ssim.txt"), "utf8")).matchAll(/^n:\d+ .*?All:([\d.]+)/gm)]
    .map((match) => Number(match[1])).sort((a, b) => a - b);
  if (scores.length !== 120) throw new Error(`${theme} has incomplete frame scores`);
  themes[theme] = {
    referenceSha256: fixture.referenceSha256,
    themeSha256: await hash(resolve(source, `${theme}-theme.json`)),
    sourceMode: fixture.sourceMode,
    rowAnimations: fixture.rowAnimations.opened,
    result: { ...verification.result, p05Ssim: scores[6], p95Ssim: scores[114] },
    artifacts: {
      referenceVideo: `public/previews/${name}/reference${suffix}.mp4`,
      hyperframesVideo: `public/previews/${name}/hyperframes${suffix}.mp4`,
      frameSsim: `parity/${name}-diff/${theme}/ssim.txt`,
      hyperframesCheck: `parity/${name}-diff/${theme}/hyperframes-check.json`,
      controlCrops: `parity/${name}-diff/${theme}/crops.json`,
      installedCheck: `parity/${name}-diff/${theme}/installed-check.json`,
      worstFrame: `parity/${name}-diff/${theme}/worst-frame.png`,
    },
  };
}

await mkdir(resolve(root, "parity/legacy"), { recursive: true });
await copyFile(manifestPath, resolve(root, `parity/legacy/${name}-v0035.json`));
await cp(resolve(root, "registry/blocks", name), resolve(root, `parity/legacy/${name}-v0035-block`), { recursive: true });
await cp(preview, resolve(root, `parity/legacy/${name}-v0035-preview`), { recursive: true });
await cp(candidate, resolve(root, "registry/blocks", name), { recursive: true, force: true });
for (const theme of ["dark", "light"]) {
  const suffix = theme === "light" ? "-light" : "";
  const work = resolve(root, `.work/${name}-v0042-${theme}-verify`);
  run("ffmpeg", ["-v", "error", "-y", "-i", resolve(root, `parity/${name}-v0042${suffix}-reference.mkv`),
    "-vf", `pad=1200:660:0:0:${theme === "light" ? "white" : "black"}`,
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-an", resolve(preview, `reference${suffix}.mp4`)]);
  run("ffmpeg", ["-v", "error", "-y", "-framerate", "30", "-start_number", "1", "-i", resolve(work, "hyperframes/frame_%06d.png"),
    "-vf", `pad=1200:660:0:0:${theme === "light" ? "white" : "black"}`,
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-an", resolve(preview, `hyperframes${suffix}.mp4`)]);
  await copyFile(resolve(work, "hyperframes/frame_000101.png"), resolve(preview, `thumbnail${suffix}.png`));
  await copyFile(resolve(root, `.work/${name}-v0042-custom-${theme}/render/frame_000106.png`), resolve(preview, `customized${suffix}.png`));
  run("magick", [resolve(preview, `thumbnail${suffix}.png`), "-quality", "85", resolve(preview, `thumbnail${suffix}.webp`)]);
}
const fixture = JSON.parse(await readFile(resolve(source, "source-file-open-fixture.json"), "utf8"));
const parity = {
  ...previous,
  origin: { ...previous.origin, commit: fixture.sourceCommit },
  fixture: {
    ...previous.fixture,
    props: { sourceFile: fixture.sourceFile, ...fixture.events },
    sourceHashes: fixture.sourceHashes,
    domSha256: fixture.sourceDomHashes,
    shadowSha256: fixture.shadowHashes,
    sourceFileSha256: fixture.sourceFileSha256,
    referenceSha256: fixture.referenceSha256,
    compositionSha256,
  },
  result: themes.dark.result,
  themes,
  checks: {
    ...previous.checks,
    hyperframes: "full check and strict 120-frame render passed in both themes",
    motionCoverage: "Native file tree expansion and 150 ms source-view indentation sampled at 30 fps in both themes",
    customVariables: "dark and light project, tree, source text, and event timing passed full checks and visible snapshots",
    installedThroughCli: true,
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
console.log(`Published ${name} v0.0.42 in dark and light with native source-view motion.`);
