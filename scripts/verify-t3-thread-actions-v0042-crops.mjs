import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const theme = process.argv[2];
if (theme !== "dark" && theme !== "light") throw new Error("Pass dark or light");
const fixture = JSON.parse(await readFile(resolve(root, `assets/t3-code/v0.0.42/thread-actions-${theme}-fixture.json`), "utf8"));
const work = resolve(root, `.work/t3-thread-actions-v0042-${theme === "dark" ? "" : "light-"}verify`);
const native = resolve(work, "native/frame-%04d.png");
const hyperframes = resolve(work, "hyperframes/frame_%06d.png");
const regions = [
  { name: "row", box: fixture.rowBox, start: 0, count: 120, minThreshold: 0.97 },
  { name: "menu", box: fixture.menuBox, start: fixture.events.open, count: fixture.events.submenu - fixture.events.open, minThreshold: 0.97 },
  { name: "submenu", box: fixture.submenuBox, start: fixture.events.submenu, count: fixture.events.close - fixture.events.submenu, minThreshold: 0.96 },
];
const results = {};
for (const { name, box, start, count, minThreshold } of regions) {
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
  results[name] = { box: { x, y, width, height }, frameCount: count, meanSsim: scores.reduce((sum, score) => sum + score, 0) / count, minSsim: Math.min(...scores), minThreshold, worstFrame: start + scores.indexOf(Math.min(...scores)) };
}
const pass = Object.values(results).every(({ minSsim, minThreshold }) => minSsim >= minThreshold);
await writeFile(resolve(work, "crops.json"), JSON.stringify({ theme, regions: results, pass }, null, 2) + "\n");
console.log(`${theme} Thread Actions focused crops: ${Object.entries(results).map(([name, result]) => `${name} ${result.meanSsim.toFixed(6)}/${result.minSsim.toFixed(6)}`).join(", ")}; pass=${pass}`);
if (!pass) throw new Error("Native menu or sidebar detail differs from HyperFrames");
