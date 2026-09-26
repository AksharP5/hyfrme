import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const block = process.argv[2];
const theme = process.argv[3];
if (!["brief", "model-swap", "reasoning", "fast-tier", "permission"].includes(block) || !["dark", "light"].includes(theme)) {
  throw new Error("Usage: node scripts/score-t3-v0042-regions.mjs <brief|model-swap|reasoning|fast-tier|permission> <dark|light>");
}
const work = resolve(root, `.work/t3-${block === "permission" ? "permission-choice" : block}-v0042-${theme}-verify`);
const source = resolve(root, "assets/t3-code/v0.0.42");
const regions = [
  { name: "composer", x: 344, y: 259, width: 768, height: 143, first: 0, last: 119 },
  { name: "composer-controls", x: 354, y: 347, width: 745, height: 47, first: 0, last: 119 },
];
if (block === "model-swap") {
  const fixture = JSON.parse(await readFile(resolve(source, `model-swap-v0042-${theme}-fixture.json`), "utf8"));
  const bounds = fixture.popupBox;
  const x = Math.max(0, Math.floor(bounds.x));
  const y = Math.max(0, Math.floor(bounds.y));
  regions.push({ name: "model-picker", x, y,
    width: Math.min(1200 - x, Math.ceil(bounds.width)),
    height: Math.min(659 - y, Math.ceil(bounds.height)),
    first: fixture.openFrame, last: fixture.selectFrame - 1 });
  regions.push({ name: "model-hover-row", x: x + 52, y: y + 99,
    width: 304, height: 58,
    first: fixture.hoverFrame, last: fixture.selectFrame - 1 });
}
if (block === "reasoning") {
  const fixture = JSON.parse(await readFile(resolve(source, `reasoning-v0042-${theme}-fixture.json`), "utf8"));
  const bounds = fixture.popupBox;
  const x = Math.floor(bounds.x);
  const y = Math.floor(bounds.y);
  regions.push({ name: "reasoning-menu", x, y, width: Math.ceil(bounds.width), height: Math.ceil(bounds.height),
    first: fixture.openFrame, last: fixture.selectFrame - 1 });
  regions.push({ name: "reasoning-hover-row", x: x + 5, y: y + 86, width: 160, height: 28,
    first: fixture.hoverFrame, last: fixture.selectFrame - 1 });
}
if (block === "fast-tier") {
  const fixture = JSON.parse(await readFile(resolve(source, `fast-tier-v0042-${theme}-fixture.json`), "utf8"));
  const bounds = fixture.popupBox;
  const x = Math.floor(bounds.x);
  const y = Math.floor(bounds.y);
  regions.push({ name: "service-menu", x, y, width: Math.ceil(bounds.width), height: Math.ceil(bounds.height),
    first: fixture.openFrame, last: fixture.selectFrame - 1 });
  regions.push({ name: "service-hover-row", x: x + 5, y: y + 262, width: 160, height: 44,
    first: fixture.hoverFrame, last: fixture.selectFrame - 1 });
}
if (block === "permission") {
  const suffix = theme === "light" ? "-light" : "";
  const fixture = JSON.parse(await readFile(resolve(source, `permission-choice${suffix}-fixture.json`), "utf8"));
  const bounds = fixture.popupBox;
  const x = Math.floor(bounds.x);
  const y = Math.floor(bounds.y);
  regions.push({ name: "permission-menu", x, y, width: Math.ceil(bounds.width), height: Math.ceil(bounds.height),
    first: fixture.events.open, last: fixture.events.select - 1 });
  regions.push({ name: "permission-hover-row", x: x + 5, y: y + 59, width: 338, height: 54,
    first: fixture.events.hover, last: fixture.events.select - 1 });
}
const results = {};
const thresholds = {
  composer: { meanSsim: 0.985, minSsim: 0.98 },
  "composer-controls": { meanSsim: 0.985, minSsim: 0.97 },
  "model-picker": { meanSsim: 0.98, minSsim: 0.96 },
  "model-hover-row": { meanSsim: 0.97, minSsim: 0.97 },
  "reasoning-menu": { meanSsim: 0.97, minSsim: 0.96 },
  "reasoning-hover-row": { meanSsim: 0.97, minSsim: 0.96 },
  "service-menu": { meanSsim: 0.97, minSsim: 0.96 },
  "service-hover-row": { meanSsim: 0.97, minSsim: 0.96 },
  "permission-menu": { meanSsim: 0.97, minSsim: 0.96 },
  "permission-hover-row": { meanSsim: 0.97, minSsim: 0.96 },
};
for (const region of regions) {
  const crop = `crop=${region.width}:${region.height}:${region.x}:${region.y}`;
  const select = `select='between(n,${region.first},${region.last})',setpts=PTS-STARTPTS`;
  const stats = resolve(work, `${region.name}-ssim.txt`);
  const command = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y",
    "-framerate", "30", "-start_number", "0", "-i", resolve(work, "native/frame-%04d.png"),
    "-framerate", "30", "-start_number", "1", "-i", resolve(work, "hyperframes/frame_%06d.png"),
    "-filter_complex", `[0:v]${crop},${select}[native];[1:v]${crop},${select}[port];[native][port]ssim=stats_file=${stats}`,
    "-f", "null", "-"], { encoding: "utf8" });
  if (command.status !== 0) throw new Error(command.stderr);
  const scores = [...(await readFile(stats, "utf8")).matchAll(/^n:\d+ .*?All:([\d.]+)/gm)].map((match) => Number(match[1]));
  if (scores.length !== region.last - region.first + 1) throw new Error(`${region.name} frame count mismatch`);
  const meanSsim = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const minSsim = Math.min(...scores);
  const threshold = thresholds[region.name];
  results[region.name] = { crop: region, frameCount: scores.length, meanSsim, minSsim,
    worstFrame: region.first + scores.indexOf(minSsim), thresholds: threshold,
    pass: meanSsim >= threshold.meanSsim && minSsim >= threshold.minSsim };
}
await writeFile(resolve(work, "region-result.json"), JSON.stringify(results, null, 2) + "\n");
console.log(JSON.stringify({ block, theme, results }));
if (Object.values(results).some((region) => !region.pass)) throw new Error(`${block} ${theme} focused region parity failed`);
