import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import {
  compareAlphaFrames,
  normalizeSnapshotFrames,
} from "./snapcn-alpha.mjs";
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
  const snapshots = resolve(directory, "snapshots");
  await mkdir(snapshots);
  await Promise.all(
    Array.from({ length: 101 }, (_, frame) =>
      writeFile(
        resolve(
          snapshots,
          `frame-${String(frame).padStart(2, "0")}-at-${frame}s.png`,
        ),
        String(frame),
      ),
    ),
  );
  await normalizeSnapshotFrames(snapshots, 101);
  const ordered = (await readdir(snapshots)).sort();
  for (const frame of [9, 10, 99, 100])
    assert.equal(
      await readFile(resolve(snapshots, ordered[frame]), "utf8"),
      String(frame),
    );
  const missing = resolve(directory, "missing-snapshots");
  await mkdir(missing);
  await writeFile(resolve(missing, "frame-01-at-1s.png"), "1");
  await assert.rejects(
    normalizeSnapshotFrames(missing, 1),
    /consecutive snapshot frames/,
  );
  assert.deepEqual(await readdir(missing), ["frame-01-at-1s.png"]);
  console.log(
    "Alpha verification rejects an invisible frame with unchanged RGB.",
  );
} finally {
  await rm(directory, { recursive: true, force: true });
}
