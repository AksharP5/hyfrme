import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { assertT3CaptureImages } from "./t3-capture-images.mjs";
import { t3CatalogPublicationRecord } from "./publish-t3-catalog-parity.mjs";

test("fresh default proofs preserve historical measurements across publication", () => {
  const historical = {
    meanSsim: 0.99,
    criticalStates: [{ name: "customized popup", ssim: 0.99 }],
  };
  const historicalFixture = { compositionSha256: "previous-source" };
  const entry = {
    slug: "t3-example",
    defaultTheme: "dark",
    defaultMode: "pixel-verified",
    composition: { path: "t3-example.html" },
    previous: {
      result: historical,
      fixture: historicalFixture,
      customLabel: "Historical customized source",
      themes: Object.fromEntries(
        ["dark", "light"].map((theme) => [
          theme,
          {
            result: historical,
            fixture: historicalFixture,
            customLabel: "Historical customized source",
          },
        ]),
      ),
    },
    entries: ["dark", "light"].map((theme) => ({
      theme,
      defaultMode: theme === "dark" ? "pixel-verified" : "source DOM",
      inputHashes: {},
      artifactHashes: {},
      themeSha256: "current-theme",
      native: { sourceHashes: {} },
      proof: {
        result: { meanSsim: 1, minSsim: 1, exactRgba: true, frameCount: 120 },
        values: { theme },
        fixture: { width: 1200, height: 659, fps: 30, durationInFrames: 120 },
        filesSha256: { "t3-example.html": "current-source" },
        referenceSha256: "current-reference",
        tools: { browserVersion: "current-browser" },
      },
    })),
  };
  const first = t3CatalogPublicationRecord(entry, {});
  const repeated = t3CatalogPublicationRecord(
    { ...entry, previous: first },
    {},
  );
  for (const published of [first, repeated]) {
    assert.equal(published.defaultMode, "pixel-verified");
    assert.equal(published.themes.dark.defaultMode, "pixel-verified");
    assert.equal(published.themes.light.defaultMode, "source DOM");
    for (const record of [published, ...Object.values(published.themes)]) {
      assert.deepEqual(
        record.historicalCustomizationEvidence.result,
        historical,
      );
      assert.deepEqual(
        record.historicalCustomizationEvidence.fixture,
        historicalFixture,
      );
      assert.equal(record.result.meanSsim, 1);
      assert.equal(record.result.exactRgba, true);
      assert.equal(
        record.historicalCustomizationEvidence.fields.customLabel,
        "Historical customized source",
      );
      assert.equal(
        record.historicalCustomizationEvidence.fields
          ?.historicalCustomizationEvidence,
        undefined,
      );
    }
  }
});

test("deduplicated native images preserve a complete immutable frame mapping", async () => {
  const atlas = JSON.parse(
    await readFile(
      new URL("../parity/t3-thread-pin-v0042-atlas.json", import.meta.url),
      "utf8",
    ),
  );
  const native = JSON.parse(
    await readFile(
      new URL(
        "../assets/t3-code/v0.0.42/thread-pin-fixture.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  assertT3CaptureImages(atlas, native, "dark");
  for (const mutate of [
    (value) => value.themes.dark.frameImageIndices.pop(),
    (value) => (value.themes.dark.frameImageIndices[0] = -1),
    (value) => (value.themes.dark.frameImageIndices[0] = 0.5),
    (value) =>
      (value.themes.dark.frameImageIndices[0] = value.themes.dark.uniqueFrames),
    (value) => value.themes.dark.frameImageIndices.fill(0),
    (value) => (value.themes.dark.uniqueFrames += 1),
    (value) =>
      delete value.themes.dark.sha256[Object.keys(value.themes.dark.sha256)[0]],
    (value) => value.themes.dark.rgbaSha256.pop(),
    (value) => (value.themes.dark.sourcePngSha256[0] = "invalid"),
  ]) {
    const changed = structuredClone(atlas);
    mutate(changed);
    assert.throws(
      () => assertT3CaptureImages(changed, native, "dark"),
      /capture images are incomplete/,
    );
  }
  const changedNative = structuredClone(native);
  changedNative.captureFrameImageIndices[0] = 1;
  assert.throws(
    () => assertT3CaptureImages(atlas, changedNative, "dark"),
    /capture images are incomplete/,
  );
  const stripNative = {
    ...native,
    captureFrameImageIndices: undefined,
    captureSpriteSha256: Object.fromEntries(
      Object.entries(native.captureSpriteSha256).slice(0, 10),
    ),
  };
  const strips = {
    sourceCommit: native.sourceCommit,
    atlas: {
      width: 14400,
      height: 659,
      columns: 12,
      rows: 10,
      frames: 120,
      fps: 30,
    },
    themes: {
      dark: { frameCount: 120, sha256: stripNative.captureSpriteSha256 },
    },
  };
  assert.throws(
    () => assertT3CaptureImages(strips, native, "dark"),
    /capture images are incomplete/,
  );
  assertT3CaptureImages(strips, stripNative, "dark");
  strips.atlas.rows = 9;
  assert.throws(
    () => assertT3CaptureImages(strips, stripNative, "dark"),
    /capture images are incomplete/,
  );
});
