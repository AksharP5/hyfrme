import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const commit = "719a76ca1dbf5490f1aa33ffb9966301e02be9a9";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const run = (args) => {
  const result = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", ...args], {
    encoding: "utf8", maxBuffer: 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout;
};
const rgbaHashes = (args) => run([...args, "-frames:v", "120", "-pix_fmt", "rgba", "-f", "framemd5", "-hash", "sha256", "-"])
  .split("\n").filter((line) => line && !line.startsWith("#"))
  .map((line) => line.split(",").at(-1).trim());
const report = {
  sourceTag: "v0.0.42", sourceCommit: commit, slug: "t3-thread-pin",
  atlas: { width: 1200, height: 659, frames: 120, fps: 30, encoding: "deduplicated authoritative PNG frames" },
  themes: {},
};

for (const theme of ["dark", "light"]) {
  const prefix = `thread-pin${theme === "light" ? "-light" : ""}`;
  const fixturePath = resolve(source, `${prefix}-fixture.json`);
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
  const capture = resolve(root, `.work/full-parity-audit/t3-row-clock/hover-portal-pin-${theme}-1`);
  const reference = resolve(root, `parity/t3-thread-pin-v0042${theme === "light" ? "-light" : ""}-reference.mkv`);
  const recording = JSON.parse(await readFile(resolve(capture, "frames/capture.json"), "utf8"));
  if (fixture.sourceTag !== report.sourceTag || fixture.sourceCommit !== commit || fixture.theme !== theme ||
      fixture.frames !== 120 || fixture.fps !== 30 || fixture.viewport.width !== 1200 || fixture.viewport.height !== 659 ||
      fixture.referenceSha256 !== hash(await readFile(reference)) || fixture.referenceSha256 !== hash(await readFile(resolve(capture, "reference.mkv"))))
    throw new Error(`${theme} native Pin capture provenance changed`);
  const pngHashes = await Promise.all(Array.from({ length: 120 }, async (_, frame) =>
    hash(await readFile(resolve(capture, "frames", `frame-${String(frame).padStart(4, "0")}.png`)))));
  if (JSON.stringify(pngHashes) !== JSON.stringify(recording.frameHashes))
    throw new Error(`${theme} authoritative native PNG frames changed`);
  const nativeHashes = rgbaHashes(["-framerate", "30", "-i", resolve(capture, "frames/frame-%04d.png")]);
  const referenceHashes = rgbaHashes(["-i", reference]);
  if (nativeHashes.length !== 120 || JSON.stringify(nativeHashes) !== JSON.stringify(referenceHashes))
    throw new Error(`${theme} native PNGs differ from the pinned lossless recording`);
  const uniqueHashes = [...new Set(nativeHashes)];
  const frameImageIndices = nativeHashes.map((value) => uniqueHashes.indexOf(value));
  const spriteHashes = {};
  const roundTrip = resolve(root, `.work/t3-thread-pin-v0042-${theme}-unique-roundtrip`);
  await mkdir(roundTrip, { recursive: true });
  for (const [index, rgbaHash] of uniqueHashes.entries()) {
    const frame = nativeHashes.indexOf(rgbaHash);
    const suffix = String(index).padStart(2, "0");
    const asset = resolve(source, `thread-pin-v0042-${theme}-capture-${suffix}.png`);
    await copyFile(resolve(capture, "frames", `frame-${String(frame).padStart(4, "0")}.png`), asset);
    spriteHashes[suffix] = hash(await readFile(asset));
  }
  for (const [frame, image] of frameImageIndices.entries()) {
    await copyFile(resolve(source, `thread-pin-v0042-${theme}-capture-${String(image).padStart(2, "0")}.png`),
      resolve(roundTrip, `frame-${String(frame).padStart(4, "0")}.png`));
  }
  const decodedHashes = rgbaHashes(["-framerate", "30", "-i", resolve(roundTrip, "frame-%04d.png")]);
  if (JSON.stringify(nativeHashes) !== JSON.stringify(decodedHashes))
    throw new Error(`${theme} unique native PNG mapping changed RGBA pixels`);
  fixture.captureSpriteSha256 = spriteHashes;
  fixture.captureSpriteFrameCount = 120;
  fixture.captureFrameImageIndices = frameImageIndices;
  await writeFile(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
  report.themes[theme] = { referenceSha256: fixture.referenceSha256, sourcePngSha256: pngHashes,
    rgbaSha256: nativeHashes, sha256: spriteHashes, frameImageIndices, uniqueFrames: uniqueHashes.length, frameCount: 120, exactRgbaFrames: 120 };
}
await writeFile(resolve(root, "parity/t3-thread-pin-v0042-atlas.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log("Built deduplicated native Pin PNG frames; all 240 decoded RGBA frames match authoritative source.");
