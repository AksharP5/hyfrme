import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const theme = process.argv[2];
if (theme !== "dark" && theme !== "light") throw new Error("Pass dark or light");
const fixture = JSON.parse(await readFile(resolve(root, `assets/t3-code/v0.0.42/settle-thread-${theme}-fixture.json`), "utf8"));
const work = resolve(root, `.work/t3-settle-thread-v0042-${theme}-verify`);
const native = resolve(work, "native/frame-%04d.png");
const hyperframes = resolve(work, "hyperframes/frame_%06d.png");
const regions = [
  { name: "row", box: fixture.boxes.row, start: 0, count: fixture.events.settle, minThreshold: 0.97 },
  { name: "details-motion", box: { x: 0, y: 0, width: 375, height: 315 }, start: fixture.events.details, count: 6, minThreshold: 0.97 },
  { name: "details", box: { x: 250, y: 181, width: 116, height: 132 }, start: fixture.events.details + 5, count: fixture.events.tooltip - fixture.events.details - 5, minThreshold: 0.96 },
  { name: "tooltip", box: fixture.boxes.tooltip, start: fixture.events.tooltip, count: fixture.events.settle - fixture.events.tooltip, minThreshold: 0.96 },
  { name: "row-motion", box: { x: 0, y: 145, width: 255, height: 320 }, start: fixture.events.settle, count: 6, minThreshold: 0.97 },
  { name: "shelf", box: { x: 9, y: 500, width: 238, height: 120 }, start: fixture.events.settle, count: 120 - fixture.events.settle, minThreshold: 0.96 },
  { name: "settled-row", box: fixture.boxes.settledRow, start: fixture.events.expand, count: fixture.events.collapse - fixture.events.expand, minThreshold: 0.95 },
];
const results = {};
for (const { name, box, start, count, minThreshold } of regions) {
  if (!box) throw new Error(`Native ${name} crop box missing`);
  const x = Math.max(0, Math.floor(box.x) - 8);
  const y = Math.max(0, Math.floor(box.y) - 8);
  const width = Math.min(1200 - x, Math.ceil(box.width) + 16);
  const height = Math.min(659 - y, Math.ceil(box.height) + 16);
  const stats = resolve(work, `${name}-crop-ssim.txt`);
  const command = spawnSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-framerate", "30", "-start_number", String(start), "-i", native,
    "-framerate", "30", "-start_number", String(start + 1), "-i", hyperframes,
    "-filter_complex", `[0:v]crop=${width}:${height}:${x}:${y}[a];[1:v]crop=${width}:${height}:${x}:${y}[b];[a][b]ssim=stats_file=${stats}`,
    "-frames:v", String(count), "-f", "null", "-",
  ], { encoding: "utf8" });
  if (command.status !== 0) throw new Error(`${name} crop comparison failed: ${command.stderr}`);
  const captured = [...(await readFile(stats, "utf8")).matchAll(/^n:\d+ .*?All:([\d.]+)/gm)].map((match) => Number(match[1]));
  if (captured.length < count || captured.length > count + 1) throw new Error(`${name} crop expected ${count} frames, got ${captured.length}`);
  const scores = captured.slice(0, count);
  results[name] = {
    box: { x, y, width, height }, frameCount: count,
    meanSsim: scores.reduce((sum, score) => sum + score, 0) / count,
    minSsim: Math.min(...scores), minThreshold,
    worstFrame: start + scores.indexOf(Math.min(...scores)),
  };
}
const pass = Object.values(results).every(({ minSsim, minThreshold }) => minSsim >= minThreshold);
await writeFile(resolve(work, "crops.json"), JSON.stringify({ theme, regions: results, pass }, null, 2) + "\n");
console.log(`${theme} Settle focused crops: ${Object.entries(results).map(([name, result]) => `${name} ${result.meanSsim.toFixed(6)}/${result.minSsim.toFixed(6)}`).join(", ")}; pass=${pass}`);
if (!pass) throw new Error("Native Settle row, tooltip, or shelf detail differs from HyperFrames");
