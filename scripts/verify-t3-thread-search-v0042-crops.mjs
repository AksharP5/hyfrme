import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const theme = process.argv[2];
if (theme !== "dark" && theme !== "light") throw new Error("Pass dark or light");
const work = resolve(root, `.work/t3-thread-search-v0042-${theme}-verify`);
const fixture = JSON.parse(await readFile(resolve(root, `assets/t3-code/v0.0.42/thread-search-${theme}-fixture.json`), "utf8"));
const regions = [
  { name: "search-field", box: { x: 0, y: 45, width: 256, height: 52 }, start: fixture.events.focus, count: fixture.events.select - fixture.events.focus, threshold: 0.97 },
  { name: "first-results", box: { x: 0, y: 90, width: 256, height: 125 }, start: fixture.events.firstQuery, count: fixture.events.clear - fixture.events.firstQuery, threshold: 0.97 },
  { name: "keyboard-highlight", box: { x: 0, y: 90, width: 256, height: 125 }, start: fixture.events.arrowDown, count: fixture.events.arrowUp - fixture.events.arrowDown, threshold: 0.97 },
  { name: "selected-result", box: { x: 0, y: 90, width: 256, height: 70 }, start: 106, count: fixture.events.select - 106, threshold: 0.97 },
  { name: "selected-sidebar", box: { x: 0, y: 0, width: 268, height: 659 }, start: fixture.events.select, count: 120 - fixture.events.select, threshold: 0.97 },
  { name: "selected-conversation", box: { x: 300, y: 55, width: 820, height: 310 }, start: fixture.events.select, count: 120 - fixture.events.select, threshold: 0.97 },
];
const scores = {};
for (const { name, box, start, count, threshold } of regions) {
  const stats = resolve(work, `${name}-crop-ssim.txt`);
  const run = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-framerate", "30", "-start_number", String(start), "-i", resolve(work, "native/frame-%04d.png"), "-framerate", "30", "-start_number", String(start + 1), "-i", resolve(work, "hyperframes/frame_%06d.png"), "-filter_complex", `[0:v]crop=${box.width}:${box.height}:${box.x}:${box.y}[a];[1:v]crop=${box.width}:${box.height}:${box.x}:${box.y}[b];[a][b]ssim=stats_file=${stats}`, "-frames:v", String(count), "-f", "null", "-"], { encoding: "utf8" });
  if (run.status !== 0) throw new Error(`${name} comparison failed: ${run.stderr}`);
  const values = [...(await readFile(stats, "utf8")).matchAll(/^n:\d+ .*?All:([\d.]+)/gm)].map((match) => Number(match[1])).slice(0, count);
  if (values.length !== count) throw new Error(`${name} expected ${count} frames, got ${values.length}`);
  const minSsim = Math.min(...values);
  scores[name] = { box, frameCount: count, meanSsim: values.reduce((sum, value) => sum + value, 0) / count, minSsim, worstFrame: start + values.indexOf(minSsim), threshold };
}
const pass = Object.values(scores).every(({ minSsim, threshold }) => minSsim >= threshold);
await writeFile(resolve(work, "crops.json"), JSON.stringify({ theme, scores, pass }, null, 2) + "\n");
console.log(`${theme} Thread Search crops: ${Object.entries(scores).map(([name, result]) => `${name} ${result.meanSsim.toFixed(6)}/${result.minSsim.toFixed(6)}`).join(", ")}; pass=${pass}`);
if (!pass) throw new Error("Focused search, result, selection, or conversation parity missed");
