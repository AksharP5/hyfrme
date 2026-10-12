import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const reportPath = resolve(root, "parity/t3-message-rewind-v0042-atlas.json");
const previous = await readFile(reportPath, "utf8").then(JSON.parse).catch((error) => {
  if (error.code !== "ENOENT") throw error;
  return null;
});
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const run = (args) => {
  const result = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", ...args], { encoding: "utf8", maxBuffer: 1024 * 1024 });
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout;
};
const rgbaHashes = (args) => run([...args, "-frames:v", "120", "-pix_fmt", "rgba", "-f", "framemd5", "-hash", "sha256", "-"])
  .split("\n").filter((line) => line && !line.startsWith("#")).map((line) => line.split(",").at(-1).trim());
const historicalAtlasPath = "assets/t3-code/v0.0.42/message-rewind-v0042-original-atlas.json";
const historicalAtlas = JSON.parse(await readFile(resolve(root, historicalAtlasPath), "utf8"));
const report = {
  sourceTag: "v0.0.42", sourceCommit: "719a76ca1dbf5490f1aa33ffb9966301e02be9a9", slug: "t3-message-rewind",
  atlas: { width: 1200, height: 659, frames: 120, fps: 30, encoding: "deduplicated authoritative PNG frames" },
  historicalAtlas: { path: historicalAtlasPath, sha256: hash(await readFile(resolve(root, historicalAtlasPath))) },
  themes: {},
};
for (const theme of ["dark", "light"]) {
  const fixturePath = resolve(source, `message-rewind-v0042-${theme}-fixture.json`);
  const fixtureBytes = await readFile(fixturePath);
  const fixture = JSON.parse(fixtureBytes);
  const referencePath = `parity/t3-message-rewind-v0042-${theme}-reference.mkv`;
  const reference = resolve(root, referencePath);
  if (fixture.sourceTag !== report.sourceTag || fixture.sourceCommit !== report.sourceCommit || fixture.theme !== theme ||
      fixture.frames !== 120 || fixture.fps !== 30 || fixture.viewport.width !== 1200 || fixture.viewport.height !== 659 ||
      fixture.referenceSha256 !== hash(await readFile(reference))) throw new Error(`${theme} native capture pin changed`);
  const sourceCapture = previous?.themes[theme].sourceCapture ?? {
    fixtureSha256: hash(fixtureBytes), fixture: JSON.parse(fixtureBytes),
    referencePath, referenceSha256: fixture.referenceSha256,
    originalCapturePath: `.work/t3-message-rewind-v0042-${theme}-reference`,
    pngOrigin: "Decoded from the unchanged pinned native FFV1 recording; original browser PNG scratch files are not required.",
  };
  delete sourceCapture.fixture.captureFrameImageIndices;
  sourceCapture.fixture.captureSpriteSha256 = historicalAtlas.themes[theme].sha256;
  if (hash(Buffer.from(`${JSON.stringify(sourceCapture.fixture, null, 2)}\n`)) !== sourceCapture.fixtureSha256)
    throw new Error(`${theme} original serialized capture fixture changed`);
  if (sourceCapture.referenceSha256 !== fixture.referenceSha256 ||
      JSON.stringify(sourceCapture.fixture.sourceDomHashes) !== JSON.stringify(fixture.sourceDomHashes))
    throw new Error(`${theme} original native provenance changed`);
  const frames = resolve(root, `.work/t3-message-rewind-v0042-${theme}-derived-frames`);
  await mkdir(frames, { recursive: true });
  run(["-y", "-i", reference, "-frames:v", "120", "-pix_fmt", "rgba", "-start_number", "0", resolve(frames, "frame-%04d.png")]);
  const nativeHashes = rgbaHashes(["-i", reference]);
  const decodedHashes = rgbaHashes(["-framerate", "30", "-i", resolve(frames, "frame-%04d.png")]);
  if (nativeHashes.length !== 120 || JSON.stringify(nativeHashes) !== JSON.stringify(decodedHashes))
    throw new Error(`${theme} decoded PNG frames changed native RGBA pixels`);
  const sourcePngSha256 = await Promise.all(Array.from({ length: 120 }, async (_, frame) =>
    hash(await readFile(resolve(frames, `frame-${String(frame).padStart(4, "0")}.png`)))));
  const uniqueHashes = [...new Set(nativeHashes)];
  if (uniqueHashes.length !== (theme === "dark" ? 10 : 11)) throw new Error(`${theme} native unique-frame count changed`);
  const frameImageIndices = nativeHashes.map((value) => uniqueHashes.indexOf(value));
  const imageHashes = {};
  for (const [index, value] of uniqueHashes.entries()) {
    const frame = nativeHashes.indexOf(value);
    const suffix = String(index).padStart(2, "0");
    const asset = resolve(source, `message-rewind-v0042-${theme}-frame-${suffix}.png`);
    await copyFile(resolve(frames, `frame-${String(frame).padStart(4, "0")}.png`), asset);
    imageHashes[suffix] = hash(await readFile(asset));
  }
  const reconstructed = resolve(root, `.work/t3-message-rewind-v0042-${theme}-dedup-roundtrip`);
  await mkdir(reconstructed, { recursive: true });
  for (const [frame, index] of frameImageIndices.entries()) await copyFile(
    resolve(source, `message-rewind-v0042-${theme}-frame-${String(index).padStart(2, "0")}.png`),
    resolve(reconstructed, `frame-${String(frame).padStart(4, "0")}.png`));
  const mappedHashes = rgbaHashes(["-framerate", "30", "-i", resolve(reconstructed, "frame-%04d.png")]);
  if (JSON.stringify(nativeHashes) !== JSON.stringify(mappedHashes)) throw new Error(`${theme} image lookup changed native pixels`);
  fixture.captureSpriteSha256 = imageHashes;
  fixture.captureSpriteFrameCount = 120;
  fixture.captureFrameImageIndices = frameImageIndices;
  await writeFile(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
  report.themes[theme] = { sourceCapture, referenceSha256: fixture.referenceSha256, sourcePngSha256,
    rgbaSha256: nativeHashes, sha256: imageHashes, frameImageIndices, uniqueFrames: uniqueHashes.length,
    frameCount: 120, exactRgbaFrames: 120, historicalMeasurement: historicalAtlas.themes[theme] };
}
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log("Message Rewind unique native PNG mapping preserves all 240 reference RGBA frames.");
