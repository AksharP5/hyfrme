import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFile, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-thread-search";
const source = resolve(root, "assets/t3-code/v0.0.42");
const candidate = resolve(root, `.work/${name}-v0042-candidate`);
const preview = resolve(root, "public/previews", name);
const diff = resolve(root, "parity", `${name}-diff`);
const manifestPath = resolve(root, "parity", `${name}.json`);
const hash = async (path) => createHash("sha256").update(await readFile(path)).digest("hex");
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr.slice(-3000)}`);
};
const old = JSON.parse(await readFile(manifestPath, "utf8"));
if (old.origin.commit !== "f925d639421844f02b3166d29281905dbba6d529" || old.themes?.light) throw new Error("Expected the frozen v0.0.35 Thread Search block");
if (await hash(resolve(root, "registry/blocks", name, `${name}.html`)) !== old.fixture.compositionSha256) throw new Error("Frozen v0.0.35 Thread Search block changed");
const compositionSha256 = await hash(resolve(candidate, `${name}.html`));
const cli = JSON.parse(await readFile(resolve(root, `.work/${name}-v0042-cli/proof.json`), "utf8"));
if (!cli.installedThroughCli || cli.compositionSha256 !== compositionSha256 || JSON.stringify(cli.themes) !== '["dark","light"]') throw new Error("CLI installation proof missing");
const themes = {};
for (const theme of ["dark", "light"]) {
  const suffix = theme === "light" ? "-light" : "";
  const fixture = JSON.parse(await readFile(resolve(source, `thread-search-${theme}-fixture.json`), "utf8"));
  const work = resolve(root, `.work/${name}-v0042-${theme}-verify`);
  const verification = JSON.parse(await readFile(resolve(work, "result.json"), "utf8"));
  const crops = JSON.parse(await readFile(resolve(work, "crops.json"), "utf8"));
  const custom = JSON.parse(await readFile(resolve(root, `.work/${name}-v0042-${theme}-custom/result.json`), "utf8"));
  const installed = JSON.parse(await readFile(resolve(root, `.work/${name}-v0042-cli/${theme}/check.json`), "utf8"));
  const checkRaw = await readFile(resolve(work, "hyperframes-check-raw.json"), "utf8");
  const checked = JSON.parse(checkRaw.slice(checkRaw.indexOf("{")));
  const reference = resolve(root, `parity/${name}-v0042${suffix}-reference.mkv`);
  if (fixture.sourceCommit !== "719a76ca1dbf5490f1aa33ffb9966301e02be9a9" ||
      fixture.provenance?.data !== "seeded local Hyfrme project and conversation; provider unavailable" ||
      fixture.viewport.width !== 1200 || fixture.viewport.height !== 659 || fixture.fps !== 30 || fixture.frames !== 120 ||
      fixture.states.selected.route !== fixture.selectedRoute || fixture.states.reloaded.route !== fixture.selectedRoute ||
      fixture.states.reloaded.query !== "" || !fixture.persisted.selectedRoute || fixture.persisted.query ||
      fixture.boxes.input?.x !== 40 || fixture.boxes.results?.x !== 9 || fixture.boxes.selectedResult?.width !== 238 ||
      !verification.result.pass || verification.result.frameCount !== 120 || verification.compositionSha256 !== compositionSha256 ||
      !crops.pass || custom.compositionSha256 !== compositionSha256 || custom.visibleSnapshots !== 6 ||
      !checked.ok || !installed.ok || await hash(reference) !== fixture.referenceSha256) {
    throw new Error(`${theme} native search, parity, focused crop, edited-input, or installed proof failed`);
  }
  const themeDiff = resolve(diff, theme);
  await mkdir(themeDiff, { recursive: true });
  for (const [from, to] of [
    [resolve(work, "ssim.txt"), "ssim.txt"], [resolve(work, "hyperframes-check-raw.json"), "hyperframes-check.json"],
    [resolve(work, "crops.json"), "crops.json"], [resolve(root, `.work/${name}-v0042-cli/${theme}/check.json`), "installed-check.json"],
  ]) await copyFile(from, resolve(themeDiff, to));
  const worst = verification.result.worstFrame;
  run("ffmpeg", ["-v", "error", "-y", "-i", resolve(work, `native/frame-${String(worst).padStart(4, "0")}.png`), "-i", resolve(work, `hyperframes/frame_${String(worst + 1).padStart(6, "0")}.png`), "-filter_complex", "[0:v][1:v]hstack=inputs=2[v]", "-map", "[v]", "-frames:v", "1", resolve(themeDiff, "worst-frame.png")]);
  const scores = [...(await readFile(resolve(work, "ssim.txt"), "utf8")).matchAll(/^n:\d+ .*?All:([\d.]+)/gm)].map((match) => Number(match[1])).sort((a, b) => a - b);
  if (scores.length !== 120) throw new Error(`${theme} lacks 120 frame scores`);
  const artifacts = {
    referenceVideo: `public/previews/${name}/reference${suffix}.mp4`, hyperframesVideo: `public/previews/${name}/hyperframes${suffix}.mp4`,
    thumbnail: `public/previews/${name}/thumbnail${suffix}.png`, frameSsim: `parity/${name}-diff/${theme}/ssim.txt`,
    hyperframesCheck: `parity/${name}-diff/${theme}/hyperframes-check.json`, controlCrops: `parity/${name}-diff/${theme}/crops.json`,
    installedCheck: `parity/${name}-diff/${theme}/installed-check.json`, worstFrame: `parity/${name}-diff/${theme}/worst-frame.png`,
  };
  themes[theme] = {
    referenceSha256: fixture.referenceSha256, themeSha256: await hash(resolve(source, `${theme}-theme.json`)),
    boxes: fixture.boxes, selectedRoute: fixture.selectedRoute, persisted: fixture.persisted,
    result: { ...verification.result, p05Ssim: scores[6], p95Ssim: scores[114] }, crops: crops.scores, artifacts,
  };
}
await mkdir(resolve(root, "parity/legacy"), { recursive: true });
await copyFile(manifestPath, resolve(root, `parity/legacy/${name}-v0035.json`));
await cp(resolve(root, "registry/blocks", name), resolve(root, `parity/legacy/${name}-v0035-block`), { recursive: true });
await cp(preview, resolve(root, `parity/legacy/${name}-v0035-preview`), { recursive: true });
await cp(candidate, resolve(root, "registry/blocks", name), { recursive: true, force: true });
await mkdir(preview, { recursive: true });
for (const theme of ["dark", "light"]) {
  const suffix = theme === "light" ? "-light" : "";
  const work = resolve(root, `.work/${name}-v0042-${theme}-verify`);
  const pad = `pad=1200:660:0:0:${theme === "light" ? "white" : "black"}`;
  run("ffmpeg", ["-v", "error", "-y", "-i", resolve(root, `parity/${name}-v0042${suffix}-reference.mkv`), "-vf", pad, "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-an", resolve(preview, `reference${suffix}.mp4`)]);
  run("ffmpeg", ["-v", "error", "-y", "-framerate", "30", "-start_number", "1", "-i", resolve(work, "hyperframes/frame_%06d.png"), "-vf", pad, "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-an", resolve(preview, `hyperframes${suffix}.mp4`)]);
  await copyFile(resolve(work, "hyperframes/frame_000107.png"), resolve(preview, `thumbnail${suffix}.png`));
  run("magick", [resolve(preview, `thumbnail${suffix}.png`), "-quality", "85", resolve(preview, `thumbnail${suffix}.webp`)]);
}
const dark = JSON.parse(await readFile(resolve(source, "thread-search-dark-fixture.json"), "utf8"));
await writeFile(manifestPath, JSON.stringify({
  ...old,
  origin: { ...old.origin, commit: dark.sourceCommit, source: "apps/web/src/components/Sidebar.tsx" },
  fixture: { ...old.fixture, props: { ...dark.events, firstQuery: "logo", finalQuery: "grouped logo" }, sourceHashes: dark.sourceHashes,
    domSha256: Object.fromEntries(Object.entries(dark.states).map(([key, state]) => [key, state.sha256])),
    boxes: dark.boxes, provenance: dark.provenance, selectedRoute: dark.selectedRoute, persisted: dark.persisted,
    referenceSha256: dark.referenceSha256, compositionSha256 },
  thresholds: { meanSsim: 0.989, minSsim: 0.985, controlCrops: 0.97 },
  result: themes.dark.result, themes,
  checks: { ...old.checks, hyperframes: "full check and strict 120-frame render passed in both desktop themes",
    motionCoverage: "native query typing, ArrowDown/ArrowUp result highlight, Clear, Enter selection, and route reload at frame precision",
    customVariables: "dark and light edited titles, ages, queries, copy, and timing passed full checks and visible snapshots",
    installedThroughCli: true },
  artifacts: { ...themes.dark.artifacts, lightThumbnail: themes.light.artifacts.thumbnail },
}, null, 2) + "\n");
console.log(`Published ${name} v0.0.42 with both desktop themes and search route persistence.`);
