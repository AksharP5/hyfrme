import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  assertHardwareGpuProbe,
  browserGpuProbeEvidence,
} from "./browser-gpu-evidence.mjs";

const root = resolve(import.meta.dirname, "..");
const bytes = (path) => readFile(resolve(root, path));
const json = async (path) => JSON.parse(await bytes(path));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const archive = "parity/upstream-oct11-producer";
const producer = await json(`${archive}/manifest.json`);
for (const [path, expected] of Object.entries(producer.files))
  assert.equal(sha256(await bytes(`${archive}/${path}`)), expected, path);
const original = Object.fromEntries(
  await Promise.all(
    Object.keys(producer.files).map(async (path) => [
      path,
      await bytes(`${archive}/${path}`),
    ]),
  ),
);
const additions = await json(
  "assets/remocn-additions-2026-10-11/manifest.json",
);
const names = new Set([
  ...Object.keys(additions.components),
  "snapcn-font-shuffle",
]);
const fixtures = (
  await Promise.all(
    ["text", "core", "snapcn"].map((family) =>
      json(`catalog/${family}-fixtures.json`),
    ),
  )
)
  .flat()
  .filter((entry) => names.has(entry.slug));
assert.equal(fixtures.length, names.size);
const remocnAssets = JSON.parse(original["remocn-reference-assets.json"]);
const snapcnAssets = JSON.parse(original["snapcn-reference-assets.json"]);
const exceptions = await json("catalog/remocn-check-exceptions.json");
const geist = await bytes("assets/fonts/Geist-Latin.woff2");
const lock = await bytes("fixtures/remocn-2026-10-11/package-lock.json");
let frameCount = 0;
let shaderFrames = 0;

for (const entry of fixtures) {
  const parity = await json(`parity/${entry.slug}.json`);
  const snapcn = entry.catalogFamily === "snapcn";
  const reference = createHash("sha256");
  if (snapcn) {
    reference
      .update(
        JSON.stringify({
          slug: entry.slug,
          componentName: entry.componentName,
          origin: entry.origin,
          fixture: entry.fixture,
        }),
      )
      .update(JSON.stringify(snapcnAssets))
      .update(original["snapcn-reference.mjs"])
      .update(original["snapcn-preview.css"])
      .update("4.0.473");
  } else {
    reference
      .update(JSON.stringify(entry))
      .update(JSON.stringify(remocnAssets))
      .update(geist)
      .update(original["remocn-reference.mjs"])
      .update(lock)
      .update("4.0.530");
  }
  reference.update(producer.browserVersion);
  const fingerprint = createHash("sha256")
    .update(reference.digest("hex"))
    .update(producer.hyperframesVersion)
    .update(JSON.stringify({ browserGpu: producer.hardwareRequested }))
    .update(original["verifier.mjs"])
    .update(original["alpha.mjs"])
    .update(original["cli.mjs"])
    .update(
      JSON.stringify(
        snapcn
          ? []
          : exceptions.filter((finding) => finding.slug === entry.slug),
      ),
    );
  const manifest = await json(
    `registry/blocks/${entry.slug}/registry-item.json`,
  );
  fingerprint.update(JSON.stringify(manifest));
  for (const file of manifest.files)
    fingerprint.update(
      await bytes(`registry/blocks/${entry.slug}/${file.path}`),
    );
  assert.equal(
    fingerprint.digest("hex"),
    parity.fingerprint,
    `${entry.slug}: historical verification inputs changed`,
  );
  assert.equal(parity.status, "verified", entry.slug);
  assert.equal(parity.result.pass, true, entry.slug);
  const scores = [
    ...(await bytes(parity.artifacts.perFrameSsim))
      .toString()
      .matchAll(/^n:\d+ .*?All:([\d.]+)/gm),
  ].map((match) => Number(match[1]));
  assert.equal(scores.length, entry.fixture.durationInFrames, entry.slug);
  assert.equal(scores.length, parity.result.frameCount, entry.slug);
  const mean =
    scores.reduce((total, score) => total + score, 0) / scores.length;
  assert.ok(Math.abs(mean - parity.result.meanSsim) < 1e-8, entry.slug);
  assert.ok(
    Math.abs(Math.min(...scores) - parity.result.minSsim) < 1e-8,
    entry.slug,
  );
  assert.ok(
    mean >= parity.thresholds.meanSsim &&
      Math.min(...scores) >= parity.thresholds.minSsim,
    entry.slug,
  );
  const alpha = await Promise.all(
    [parity.artifacts.referenceAlpha, parity.artifacts.hyperframesAlpha].map(
      async (path) =>
        (await bytes(path))
          .toString()
          .split("\n")
          .filter((line) => line && !line.startsWith("#"))
          .map((line) => line.split(",").at(-1).trim()),
    ),
  );
  assert.deepEqual(alpha[0], alpha[1], entry.slug);
  assert.equal(alpha[0].length, scores.length, entry.slug);
  const log = await bytes(`parity/${entry.slug}-diff/hyperframes-render.log`);
  const evidence = browserGpuProbeEvidence(log.toString());
  assertHardwareGpuProbe(evidence, entry.slug);
  assert.equal(
    parity.checks.historicalRenderProbe.logSha256,
    evidence.logSha256,
    entry.slug,
  );
  assert.equal(parity.checks.captureBackend, "unobserved", entry.slug);
  if (entry.slug.startsWith("shader-")) {
    assert.ok(
      (await bytes(parity.artifacts.referenceVideo)).equals(
        await bytes(parity.artifacts.hyperframesVideo),
      ),
      entry.slug,
    );
    shaderFrames += scores.length;
  }
  frameCount += scores.length;
}
console.log(
  `Authenticated ${fixtures.length} archived ports across ${frameCount} frames, including ${shaderFrames} shader frames; capture backend remains unobserved.`,
);
