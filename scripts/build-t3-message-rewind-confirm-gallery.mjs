import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const reference = resolve(root, "parity/t3-message-rewind-confirm-reference.mkv");
const source = resolve(root, ".work/t3-message-rewind-confirm-gallery-native");
const clips = resolve(root, "public/ideas/t3-clips");
const stills = resolve(root, "public/ideas/t3-frames");
await mkdir(clips, { recursive: true });
await mkdir(stills, { recursive: true });
await mkdir(source, { recursive: true });
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr}`);
};
const clip = resolve(clips, "53.mp4");
run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", reference,
  "-start_number", "0", resolve(source, "frame-%04d.png")]);
run("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y", "-i", reference,
  "-vf", "pad=1200:660:0:0:black",
  "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p",
  "-movflags", "+faststart", "-an", clip,
]);
const hash = async (path) => createHash("sha256").update(await readFile(path)).digest("hex");
console.log(`53.mp4 ${await hash(clip)} from frames 0–119`);
for (const [step, frame] of [["a", 0], ["b", 70], ["c", 95]]) {
  const png = resolve(source, `frame-${String(frame).padStart(4, "0")}.png`);
  const webp = resolve(stills, `53-${step}.webp`);
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", png,
    "-c:v", "libwebp", "-lossless", "1", webp]);
  console.log(`53-${step}.webp ${await hash(webp)} from ${png} (${await hash(png)})`);
}
