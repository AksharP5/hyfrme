import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const theme = process.argv[2] ?? "dark";
if (theme !== "dark" && theme !== "light") throw new Error("Expected dark or light theme");
const root = resolve(import.meta.dirname, "..");
const work = resolve(root, `.work/t3-source-file-open-v0042-${theme}-verify`);
const native = resolve(work, "native/frame-%04d.png");
const hyperframes = resolve(work, "hyperframes/frame_%06d.png");
const regions = [
  { name: "tree", x: 944, y: 91, width: 256, height: 260, first: 0, count: 120, minimum: 0.97 },
  { name: "file-code", x: 660, y: 91, width: 285, height: 260, first: 80, count: 40, minimum: 0.96 },
  { name: "file-breadcrumb", x: 660, y: 42, width: 540, height: 49, first: 80, count: 40, minimum: 0.97 },
  { name: "selected-row", x: 960, y: 143, width: 225, height: 40, first: 80, count: 40, minimum: 0.97 },
];
const results = {};
for (const { name, x, y, width, height, first, count, minimum } of regions) {
  const stats = resolve(work, `${name}-crop-ssim.txt`);
  const comparison = spawnSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-framerate", "30", "-start_number", String(first), "-i", native,
    "-framerate", "30", "-start_number", String(first + 1), "-i", hyperframes,
    "-filter_complex", `[0:v]crop=${width}:${height}:${x}:${y}[a];[1:v]crop=${width}:${height}:${x}:${y}[b];[a][b]ssim=stats_file=${stats}`,
    "-frames:v", String(count), "-f", "null", "-",
  ], { encoding: "utf8" });
  if (comparison.status !== 0) throw new Error(`${theme} ${name} crop failed: ${comparison.stderr}`);
  const captured = [...(await readFile(stats, "utf8")).matchAll(/^n:\d+ .*?All:([\d.]+)/gm)].map((match) => Number(match[1]));
  if (captured.length < count || captured.length > count + 1) throw new Error(`${name} expected ${count} frames; got ${captured.length}`);
  const scores = captured.slice(0, count);
  const minSsim = Math.min(...scores);
  results[name] = {
    box: { x, y, width, height }, frameCount: count,
    meanSsim: scores.reduce((sum, score) => sum + score, 0) / count,
    minSsim, minThreshold: minimum, worstFrame: first + scores.indexOf(minSsim),
  };
}
const pass = Object.values(results).every(({ minSsim, minThreshold }) => minSsim >= minThreshold);
await writeFile(resolve(work, "crops.json"), JSON.stringify({ theme, regions: results, pass }, null, 2) + "\n");
console.log(`${theme} Source File Open crops: ${Object.entries(results).map(([name, result]) => `${name} ${result.meanSsim.toFixed(6)}/${result.minSsim.toFixed(6)}`).join(", ")}; pass=${pass}`);
if (!pass) throw new Error("Native file tree or source viewer differs from HyperFrames");
