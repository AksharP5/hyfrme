import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { assertExactFrameHashes } from "./parity-evidence.mjs";

await mkdir(".work", { recursive: true });
const directory = await mkdtemp(resolve(".work", "debug-producer-history-test-"));
const fixture = { width: 1, height: 1, frameCount: 3 };
const frames = [
  Buffer.from([255, 0, 0, 255]),
  Buffer.from([0, 255, 0, 255]),
  Buffer.from([0, 0, 255, 255]),
];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function record(name, values) {
  const path = resolve(directory, name);
  await writeFile(
    path,
    `#hash: SHA256\n${values.map((bytes, frame) => `0, ${frame}, ${frame}, 1, 4, ${hash(bytes)}`).join("\n")}\n`,
  );
  return path;
}
const originalProducer = await record("original-producer.framemd5", frames);

test("changed native reference does not change identical debug producer history", async () => {
  const oldReference = await record("old-reference.framemd5", frames);
  const newReference = await record("new-reference.framemd5", [
    frames[0], frames[2], frames[2],
  ]);
  const debugProducer = await record("unchanged-debug.framemd5", frames);
  await assert.rejects(assertExactFrameHashes(oldReference, newReference, fixture));
  await assertExactFrameHashes(originalProducer, debugProducer, fixture);
});

test("altered debug producer frame fails", async () => {
  const debugProducer = await record("altered-debug.framemd5", [
    frames[0], Buffer.from([0, 254, 0, 255]), frames[2],
  ]);
  await assert.rejects(assertExactFrameHashes(originalProducer, debugProducer, fixture));
});

test("reordered debug producer frames fail", async () => {
  const debugProducer = await record("reordered-debug.framemd5", [
    frames[1], frames[0], frames[2],
  ]);
  await assert.rejects(assertExactFrameHashes(originalProducer, debugProducer, fixture));
});

test("missing debug producer frame fails", async () => {
  const debugProducer = await record("missing-debug.framemd5", frames.slice(0, 2));
  await assert.rejects(
    assertExactFrameHashes(originalProducer, debugProducer, fixture),
    /incomplete or invalid RGBA frame hashes/,
  );
});
