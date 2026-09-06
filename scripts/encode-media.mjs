import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { shouldEncodeMedia } from "./media.mjs";

const exec = promisify(execFile);

async function videoInfo(filename) {
  const { stdout } = await exec("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height,nb_frames,r_frame_rate,duration",
    "-of",
    "json",
    filename,
  ]);
  const { streams } = JSON.parse(stdout);
  if (!streams?.[0]?.nb_frames)
    throw new Error(`Missing video frames: ${filename}`);
  return streams[0];
}

export async function mediaContent(file) {
  const original = await readFile(file.filename);
  if (!shouldEncodeMedia(file)) return original;

  const directory = await mkdtemp(join(tmpdir(), "hyfrme-encode-"));
  try {
    const output = join(directory, "preview.mp4");
    // Bump encodingVersion in media.mjs when changing the delivery recipe.
    await exec("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      file.filename,
      "-map",
      "0:v:0",
      "-map",
      "0:a?",
      "-c:v",
      "libx264",
      "-threads",
      "4",
      "-preset",
      "slow",
      "-crf",
      "16",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "copy",
      "-movflags",
      "+faststart",
      output,
    ]);
    const [sourceInfo, encodedInfo] = await Promise.all([
      videoInfo(file.filename),
      videoInfo(output),
    ]);
    if (JSON.stringify(sourceInfo) !== JSON.stringify(encodedInfo)) {
      throw new Error(
        `Encoding changed video dimensions or timing: ${file.path}`,
      );
    }
    const { stderr } = await exec("ffmpeg", [
      "-hide_banner",
      "-nostats",
      "-i",
      file.filename,
      "-i",
      output,
      "-lavfi",
      "ssim",
      "-f",
      "null",
      "-",
    ]);
    const score = Number(stderr.match(/All:([\d.]+)/)?.[1]);
    if (!Number.isFinite(score))
      throw new Error(`Missing SSIM score: ${file.path}`);
    const encoded = await readFile(output);
    if (score < 0.98 || encoded.byteLength > original.byteLength * 0.9) {
      console.log(
        `Kept original ${file.path}: SSIM ${score}, ${encoded.byteLength} encoded bytes`,
      );
      return original;
    }
    console.log(
      `Compressed ${file.path}: ${original.byteLength} -> ${encoded.byteLength} bytes, SSIM ${score}`,
    );
    return encoded;
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
