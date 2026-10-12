import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = process.argv[2];
const regions = {
  "t3-thread-unpin": [
    { label: "row-menu", frame: 30, box: [100, 110, 230, 400] },
    ...[55, 56, 57, 58, 59].map((frame) => ({ label: `moving-sidebar-${frame}`, frame, box: [0, 80, 260, 320] })),
    { label: "restored-pin-menu", frame: 90, box: [100, 150, 230, 400] },
  ],
  "t3-file-surface": [
    { label: "chooser", frame: 30, box: [660, 0, 540, 659] },
    ...[60, 61, 62, 63, 64].map((frame) => ({ label: `files-hover-${frame}`, frame, box: [760, 265, 340, 60] })),
    { label: "file-tree", frame: 100, box: [660, 0, 540, 659] },
  ],
};
if (!regions[name]) throw new Error("Expected t3-thread-unpin or t3-file-surface");

for (const theme of ["dark", "light"]) {
  const suffix = theme === "light" ? "-light" : "";
  const work = resolve(root, `.work/${name}-v0042${suffix}-verify`);
  const defaultResult = JSON.parse(await readFile(resolve(work, "result.json"), "utf8"));
  if (!defaultResult.result.pass) throw new Error(`${theme} full-frame parity did not pass`);
  const scores = [];
  for (const region of regions[name]) {
    const [x, y, width, height] = region.box;
    const native = resolve(work, `native/frame-${String(region.frame).padStart(4, "0")}.png`);
    const hyperframes = resolve(work, `hyperframes/frame_${String(region.frame + 1).padStart(6, "0")}.png`);
    const result = spawnSync("ffmpeg", ["-hide_banner", "-i", native, "-i", hyperframes,
      "-filter_complex", `[0:v]crop=${width}:${height}:${x}:${y}[a];[1:v]crop=${width}:${height}:${x}:${y}[b];[a][b]ssim`,
      "-f", "null", "-"], { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 });
    const ssim = Number([...result.stderr.matchAll(/All:([\d.]+)/g)].at(-1)?.[1]);
    if (result.status !== 0 || !Number.isFinite(ssim)) throw new Error(`Could not measure ${theme} ${region.label}`);
    scores.push({ ...region, ssim });
  }
  const proof = { name, theme, threshold: 0.95, regions: scores, pass: scores.every(({ ssim }) => ssim >= 0.95) };
  await writeFile(resolve(work, "crops.json"), JSON.stringify(proof, null, 2) + "\n");
  console.log(`${name} ${theme} region SSIM: ${scores.map(({ label, ssim }) => `${label}=${ssim.toFixed(6)}`).join(", ")}`);
  if (!proof.pass) throw new Error(`${name} ${theme} control-region parity failed`);
}
