import assert from "node:assert/strict";
import { assertExactCompiledParity } from "./compiled-parity.mjs";
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
  compareRgbaFrames,
  normalizeSnapshotFrames,
} from "./snapcn-alpha.mjs";
import { run } from "./generate-snapcn-reference.mjs";
import {
  assertExactFrameHashes,
  assertVerifiedBlockFiles,
  hashBlockFiles,
} from "./parity-evidence.mjs";

const directory = await mkdtemp(resolve(tmpdir(), "hyfrme-alpha-"));
try {
  const compiled = {
    slug: "fixture",
    classification: "compiled-source-port",
    status: "verified",
    measurement: "lossless-png",
    fixture: { width: 2, height: 2, durationInFrames: 1 },
    thresholds: { exactRgba: true, meanSsim: 1, minSsim: 1 },
    result: {
      pass: true,
      frameCount: 1,
      meanSsim: 1,
      minSsim: 1,
      rgba: { pass: true, frameCount: 1, mismatchedFrames: [] },
    },
    checks: { installedThroughCli: true },
  };
  assertExactCompiledParity(compiled);
  for (const invalid of [
    { ...compiled, classification: undefined },
    { ...compiled, result: { ...compiled.result, pass: false } },
    { ...compiled, result: { ...compiled.result, minSsim: 0.5 } },
    {
      ...compiled,
      result: {
        ...compiled.result,
        rgba: { ...compiled.result.rgba, pass: false },
      },
    },
  ])
    assert.throws(() => assertExactCompiledParity(invalid), /incomplete/);
  assert.throws(
    () =>
      assertExactCompiledParity(compiled, { ...compiled.fixture, width: 3 }),
    /incomplete/,
  );
  const paths = ["opaque", "invisible", "changed-color"].map((name) =>
    resolve(directory, name),
  );
  for (const [index, path] of paths.entries()) {
    await mkdir(path);
    const raw = resolve(path, "frame.rgba");
    await writeFile(
      raw,
      Buffer.from(
        Array(4)
          .fill([index === 2 ? 21 : 20, 30, 40, index === 1 ? 0 : 255])
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
  assert.equal(
    (await compareAlphaFrames(paths[0], paths[2], 1, directory)).pass,
    true,
  );
  assert.deepEqual(await compareRgbaFrames(paths[0], paths[0], 1, directory), {
    frameCount: 1,
    mismatchedFrames: [],
    pass: true,
  });
  const referenceHashes = resolve(directory, "reference-rgba.framemd5");
  const portHashes = resolve(directory, "hyperframes-rgba.framemd5");
  const fixture = { width: 2, height: 2, frameCount: 1 };
  await assertExactFrameHashes(referenceHashes, portHashes, fixture);
  await assert.rejects(
    assertExactFrameHashes(referenceHashes, portHashes, {
      ...fixture,
      frameCount: 2,
    }),
    /incomplete or invalid RGBA/,
  );
  for (const path of paths.slice(1)) {
    assert.deepEqual(await compareRgbaFrames(paths[0], path, 1, directory), {
      frameCount: 1,
      mismatchedFrames: [0],
      pass: false,
    });
    await assert.rejects(
      assertExactFrameHashes(referenceHashes, portHashes, fixture),
      /RGBA frames differ/,
    );
  }
  const block = resolve(directory, "block");
  await mkdir(block);
  const manifest = { name: "fixture", files: [{ path: "runtime.js" }] };
  await writeFile(
    resolve(block, "registry-item.json"),
    JSON.stringify(manifest),
  );
  await writeFile(resolve(block, "runtime.js"), "verified runtime");
  const recorded = await hashBlockFiles(block, manifest);
  await assertVerifiedBlockFiles(block, manifest, recorded);
  await writeFile(resolve(block, "runtime.js"), "changed runtime");
  await assert.rejects(
    assertVerifiedBlockFiles(block, manifest, recorded),
    /source changed after verification/,
  );
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
    "Pixel proofs reject invisible or one-channel differences, missing frames, and stale installed source.",
  );
} finally {
  await rm(directory, { recursive: true, force: true });
}
