import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const hash = async (path) => createHash("sha256").update(await readFile(path)).digest("hex");
const ssim = (left, right) => {
  const result = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "info", "-i", left, "-i", right, "-lavfi", "ssim", "-f", "null", "-"], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr.slice(-2000));
  const score = Number(result.stderr.match(/All:([\d.]+)/)?.[1]);
  if (!Number.isFinite(score)) throw new Error("Missing seam SSIM");
  return score;
};
const themes = {};
for (const theme of ["dark", "light"]) {
  const suffix = theme === "light" ? "-light" : "";
  const fileSurface = resolve(root, `.work/t3-file-surface-v0042${suffix}-verify`);
  const sourceOpen = resolve(root, `.work/t3-source-file-open-v0042-${theme}-verify`);
  const nativeEnd = resolve(fileSurface, "native/frame-0119.png");
  const nativeStart = resolve(sourceOpen, "native/frame-0000.png");
  const portEnd = resolve(fileSurface, "hyperframes/frame_000120.png");
  const portStart = resolve(sourceOpen, "hyperframes/frame_000001.png");
  themes[theme] = {
    nativeSsim: ssim(nativeEnd, nativeStart),
    hyperframesSsim: ssim(portEnd, portStart),
    frames: [nativeEnd, nativeStart, portEnd, portStart].map((path) => relative(root, path)),
    hashes: await Promise.all([nativeEnd, nativeStart, portEnd, portStart].map(hash)),
  };
}
const pass = Object.values(themes).every(({ nativeSsim, hyperframesSsim }) => nativeSsim >= 0.999 && hyperframesSsim >= 0.999);
await writeFile(resolve(root, "parity/t3-file-surface-source-open-seam.json"), JSON.stringify({ themes, pass }, null, 2) + "\n");
console.log(`File Surface → Source File Open: dark ${themes.dark.hyperframesSsim.toFixed(6)}, light ${themes.light.hyperframesSsim.toFixed(6)}; pass=${pass}`);
if (!pass) throw new Error("The two T3 Code blocks cannot be joined seamlessly");
