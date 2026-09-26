import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, ".work/t3-file-mention-reference");
const clips = resolve(root, "parity/t3-gallery/t3-clips");
const stills = resolve(root, "parity/t3-gallery/t3-frames");
await mkdir(clips, { recursive: true });
await mkdir(stills, { recursive: true });
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr}`);
};
const hash = async (path) => createHash("sha256").update(await readFile(path)).digest("hex");
const clip = resolve(clips, "44.mp4");
run("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y", "-framerate", "30",
  "-i", resolve(source, "frame-%04d.png"), "-vf", "pad=1200:660:0:0:black",
  "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv440p",
  "-movflags", "+faststart", "-an", clip,
]);
console.log(`44.mp4 ${await hash(clip)} from native frames 0–119`);
for (const [step, frame] of [["a", 0], ["b", 35], ["c", 85]]) {
  const png = resolve(source, `frame-${String(frame).padStart(4, "0")}.png`);
  const webp = resolve(stills, `44-${step}.webp`);
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", png,
    "-c:v", "libwebp", "-lossless", "1", webp]);
  console.log(`44-${step}.webp ${await hash(webp)} from frame ${frame} (${await hash(png)})`);
}
