import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { run } from "./generate-snapcn-reference.mjs";

export async function compareAlphaFrames(reference, port, frameCount, output) {
  const files = ["reference-alpha.framemd5", "hyperframes-alpha.framemd5"];
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
    "[0:v]format=rgba,alphaextract[a];[1:v]format=rgba,alphaextract[b]",
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
          `${file}: expected ${frameCount} alpha frames, found ${frames.length}`,
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
