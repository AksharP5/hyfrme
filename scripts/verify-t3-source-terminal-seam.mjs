import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const hash = async (path) => createHash("sha256").update(await readFile(path)).digest("hex");
const ssim = (left, right) => {
  const result = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "info", "-i", left, "-i", right,
    "-lavfi", "ssim", "-f", "null", "-"], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr.slice(-2000));
  const score = Number(result.stderr.match(/All:([\d.]+)/)?.[1]);
  if (!Number.isFinite(score)) throw new Error("Missing seam SSIM");
  return score;
};
const themes = {};
for (const theme of ["dark", "light"]) {
  const source = resolve(root, `.work/t3-source-file-open-v0042-${theme}-verify`);
  const terminal = resolve(root, `.work/t3-terminal-check-v0042-${theme}-verify`);
  const frames = [
    resolve(source, "native/frame-0119.png"),
    resolve(terminal, "native/frame-0000.png"),
    resolve(source, "hyperframes/frame_000120.png"),
    resolve(terminal, "hyperframes/frame_000001.png"),
  ];
  themes[theme] = {
    nativeSsim: ssim(frames[0], frames[1]),
    hyperframesSsim: ssim(frames[2], frames[3]),
    frames: frames.map((path) => relative(root, path)),
    hashes: await Promise.all(frames.map(hash)),
  };
}
const pass = Object.values(themes).every(({ nativeSsim, hyperframesSsim }) => nativeSsim >= 0.999 && hyperframesSsim >= 0.999);
await writeFile(resolve(root, "parity/t3-source-file-open-terminal-seam.json"), JSON.stringify({ themes, pass }, null, 2) + "\n");
console.log(`Source File Open → Terminal Check: dark ${themes.dark.hyperframesSsim.toFixed(6)}, light ${themes.light.hyperframesSsim.toFixed(6)}; pass=${pass}`);
if (!pass) throw new Error("T3 Code source and terminal blocks do not join seamlessly");
