import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const theme = process.argv[2];
if (theme !== "dark" && theme !== "light") throw new Error("Pass dark or light");
const fixture = JSON.parse(await readFile(resolve(root, `assets/t3-code/v0.0.42/thread-snooze-${theme}-fixture.json`), "utf8"));
const work = resolve(root, `.work/t3-thread-snooze-v0042-${theme}-verify`);
const native = resolve(work, "native/frame-%04d.png");
const hyperframes = resolve(work, "hyperframes/frame_%06d.png");
const regions = [
  { name: "row", box: fixture.boxes.row, start: 0, count: fixture.events.snooze, minThreshold: 0.96 },
  { name: "menu", box: fixture.boxes.menu, start: fixture.events.menu, count: fixture.events.snooze - fixture.events.menu, minThreshold: 0.96 },
  { name: "submenu", box: fixture.boxes.submenu, start: fixture.events.submenu, count: fixture.events.snooze - fixture.events.submenu, minThreshold: 0.95 },
  { name: "row-motion", box: { x: 0, y: 145, width: 255, height: 350 }, start: fixture.events.snooze, count: 6, minThreshold: 0.96 },
  { name: "toast", box: { x: 780, y: 65, width: 420, height: 120 }, start: fixture.events.snooze, count: fixture.events.toastClosed - fixture.events.snooze, minThreshold: 0.95 },
  { name: "shelf", box: { x: 9, y: 465, width: 238, height: 155 }, start: fixture.events.snooze, count: fixture.events.openThread - fixture.events.snooze, minThreshold: 0.95 },
  { name: "snoozed-row", box: fixture.boxes.snoozedRow, start: fixture.events.expand, count: fixture.events.openThread - fixture.events.expand, minThreshold: 0.95 },
  { name: "banner", box: { x: 310, y: 350, width: 650, height: 90 }, start: fixture.events.openThread, count: 120 - fixture.events.openThread, minThreshold: 0.95 },
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
console.log(`${theme} Snooze focused crops: ${Object.entries(results).map(([name, result]) => `${name} ${result.meanSsim.toFixed(6)}/${result.minSsim.toFixed(6)}`).join(", ")}; pass=${pass}`);
if (!pass) throw new Error("Native Snooze row, menu, toast, shelf, or banner detail differs from HyperFrames");
