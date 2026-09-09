import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { compareAlphaFrames } from "./snapcn-alpha.mjs";
import { run } from "./generate-snapcn-reference.mjs";

const directory = await mkdtemp(resolve(tmpdir(), "hyfrme-alpha-"));
try {
  const paths = ["opaque", "invisible"].map((name) => resolve(directory, name));
  for (const [index, path] of paths.entries()) {
    await mkdir(path);
    const raw = resolve(path, "frame.rgba");
    await writeFile(
      raw,
      Buffer.from(
        Array(4)
          .fill([20, 30, 40, index === 0 ? 255 : 0])
          .flat(),
      ),
    );
    await run("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "rawvideo",
      "-pixel_format",
      "rgba",
      "-video_size",
      "2x2",
      "-i",
      raw,
      "-frames:v",
      "1",
      resolve(path, "frame.png"),
    ]);
  }
  assert.deepEqual(await compareAlphaFrames(paths[0], paths[0], 1, directory), {
    frameCount: 1,
    mismatchedFrames: [],
    pass: true,
  });
  assert.deepEqual(await compareAlphaFrames(paths[0], paths[1], 1, directory), {
    frameCount: 1,
    mismatchedFrames: [0],
    pass: false,
  });
  console.log(
    "Alpha verification rejects an invisible frame with unchanged RGB.",
  );
} finally {
  await rm(directory, { recursive: true, force: true });
}
