import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "parity/t3-brief-worktree-v0042-seam");
const hash = async (path) => createHash("sha256").update(await readFile(path)).digest("hex");
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr.slice(-1000)}`);
  return result.stderr;
};
const extract = (source, frame, target) => run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y",
  "-i", source, "-vf", `select=eq(n\\,${frame})`, "-frames:v", "1", target]);
const ssim = (left, right) => {
  const log = run("ffmpeg", ["-hide_banner", "-i", left, "-i", right, "-lavfi", "ssim", "-f", "null", "-"]);
  const score = Number(log.match(/All:([\d.]+)/)?.[1]);
  if (!Number.isFinite(score)) throw new Error("Missing seam SSIM");
  return score;
};
await mkdir(output, { recursive: true });
const themes = {};
for (const theme of ["dark", "light"]) {
  const suffix = theme === "light" ? "-light" : "";
  const nativeBrief = resolve(output, `${theme}-brief-final-native.png`);
  const nativeWorktree = resolve(output, `${theme}-worktree-first-native.png`);
  const hfBrief = resolve(output, `${theme}-brief-final-hyperframes.png`);
  const hfWorktree = resolve(output, `${theme}-worktree-first-hyperframes.png`);
  extract(resolve(root, `parity/t3-brief-to-prompt-v0042${suffix}-reference.mkv`), 119, nativeBrief);
  extract(resolve(root, `parity/t3-new-worktree-choice-v0042-${theme}-reference.mkv`), 0, nativeWorktree);
  await copyFile(resolve(root, `.work/t3-brief-v0042-${theme}-verify/hyperframes/frame_000120.png`), hfBrief);
  await copyFile(resolve(root, `.work/t3-new-worktree-choice-v0042-${theme}-verify/hyperframes/frame_000001.png`), hfWorktree);
  const nativeSsim = ssim(nativeBrief, nativeWorktree);
  const hyperframesSsim = ssim(hfBrief, hfWorktree);
  if (nativeSsim < 0.9999 || hyperframesSsim < 0.9999) {
    throw new Error(`${theme} Brief to Worktree seam is visibly discontinuous`);
  }
  themes[theme] = {
    nativeSsim, hyperframesSsim,
    frames: Object.fromEntries(await Promise.all([nativeBrief, nativeWorktree, hfBrief, hfWorktree].map(async (path) => [
      path.slice(output.length + 1), await hash(path),
    ]))),
  };
}
await writeFile(resolve(root, "parity/t3-brief-worktree-v0042-seam.json"), JSON.stringify({
  sourceCommit: "719a76ca1dbf5490f1aa33ffb9966301e02be9a9",
  fps: 30, width: 1200, height: 659,
  cut: "Brief to Prompt final frame → New Worktree Choice first frame",
  themes,
}, null, 2) + "\n");
console.log(`Brief → New Worktree seam: native ${themes.dark.nativeSsim}/${themes.light.nativeSsim}, HyperFrames ${themes.dark.hyperframesSsim}/${themes.light.hyperframesSsim}`);
