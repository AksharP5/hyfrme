import { readFile, readdir, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { run } from "./generate-snapcn-reference.mjs";

export async function normalizeSnapshotFrames(directory, frameCount) {
  const files = (await readdir(directory)).filter((file) =>
    file.endsWith(".png"),
  );
  const frames = files
    .map((file) => {
      const match = file.match(/^frame-(\d+)-at-.+\.png$/);
      if (!match) throw new Error(`Unexpected snapshot frame: ${file}`);
      return { file, frame: Number(match[1]) };
    })
    .sort((a, b) => a.frame - b.frame);
  if (
    frames.length !== frameCount ||
    frames.some(({ frame }, index) => frame !== index)
  ) {
    throw new Error(
      `Expected ${frameCount} consecutive snapshot frames from zero`,
    );
  }
  // Snapshot indices have a two-digit minimum, so lexical order breaks at 100.
  for (const { file, frame } of frames) {
    await rename(
      resolve(directory, file),
      resolve(directory, `frame_${String(frame).padStart(6, "0")}.png`),
    );
  }
}

export async function compareAlphaFrames(reference, port, frameCount, output) {
  return compareFrameHashes(reference, port, frameCount, output, "alpha");
}

export async function compareRgbaFrames(reference, port, frameCount, output) {
  return compareFrameHashes(reference, port, frameCount, output, "rgba");
}

async function compareFrameHashes(
  reference,
  port,
  frameCount,
  output,
  channel,
) {
  const files = [
    `reference-${channel}.framemd5`,
    `hyperframes-${channel}.framemd5`,
  ];
  const format =
    channel === "alpha" ? "format=rgba,alphaextract" : "format=rgba";
  await run("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-pattern_type",
    "glob",
    "-i",
    resolve(reference, "*.png"),
    "-pattern_type",
    "glob",
    "-i",
    resolve(port, "*.png"),
    "-filter_complex",
    `[0:v]${format}[a];[1:v]${format}[b]`,
    "-map",
    "[a]",
    "-f",
    "framemd5",
    resolve(output, files[0]),
    "-map",
    "[b]",
    "-f",
    "framemd5",
    resolve(output, files[1]),
  ]);
  const hashes = await Promise.all(
    files.map(async (file) => {
      const log = await readFile(resolve(output, file), "utf8");
      const frames = log
        .split("\n")
        .filter((line) => line && !line.startsWith("#"));
      if (frames.length !== frameCount) {
        throw new Error(
          `${file}: expected ${frameCount} ${channel} frames, found ${frames.length}`,
        );
      }
      return frames.map((line) => line.split(",").at(-1).trim());
    }),
  );
  const mismatchedFrames = hashes[0].flatMap((hash, frame) =>
    hash === hashes[1][frame] ? [] : [frame],
  );
  return { frameCount, mismatchedFrames, pass: mismatchedFrames.length === 0 };
}
