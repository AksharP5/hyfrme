import { isDeepStrictEqual } from "node:util";

export const validFrameImageMapping = (mapping, imageCount, frameCount = 120) =>
  Array.isArray(mapping) &&
  mapping.length === frameCount &&
  imageCount > 0 &&
  mapping.every(
    (index) => Number.isInteger(index) && index >= 0 && index < imageCount,
  ) &&
  new Set(mapping).size === imageCount;

export function assertT3CaptureImages(atlas, native, theme) {
  const recorded = atlas.themes?.[theme];
  const mapped =
    atlas.atlas?.encoding === "deduplicated authoritative PNG frames";
  const expectedHashes = Object.values(native.captureSpriteSha256 ?? {});
  const complete = mapped
    ? atlas.atlas.width === native.viewport.width &&
      validFrameImageMapping(
        recorded?.frameImageIndices,
        recorded?.uniqueFrames,
        native.frames,
      ) &&
      recorded.uniqueFrames === Object.keys(recorded.sha256 ?? {}).length &&
      isDeepStrictEqual(
        recorded.frameImageIndices,
        native.captureFrameImageIndices,
      ) &&
      [recorded.sourcePngSha256, recorded.rgbaSha256].every(
        (hashes) =>
          Array.isArray(hashes) &&
          hashes.length === native.frames &&
          hashes.every((value) => /^[a-f0-9]{64}$/.test(value)),
      )
    : native.captureFrameImageIndices === undefined &&
      expectedHashes.length === 10 &&
      atlas.atlas?.width === native.viewport.width * 12 &&
      atlas.atlas.columns === 12 &&
      atlas.atlas.rows === 10;
  if (
    atlas.sourceCommit !== native.sourceCommit ||
    !complete ||
    !isDeepStrictEqual(Object.values(recorded?.sha256 ?? {}), expectedHashes) ||
    atlas.atlas.height !== native.viewport.height ||
    atlas.atlas.frames !== native.frames ||
    atlas.atlas.fps !== native.fps ||
    recorded?.frameCount !== native.frames
  ) {
    throw new Error(`T3 ${theme}: immutable capture images are incomplete`);
  }
}
