import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { assertExactCompiledParity } from "./compiled-parity.mjs";
import {
  assertHardwareGpuProbe,
  browserGpuProbeEvidence,
} from "./browser-gpu-evidence.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export const hasFreshCompiledEvidence = (parity) =>
  parity.classification === "compiled-source-port" &&
  Boolean(
    parity.checks?.captureLifecycle ||
    parity.artifacts?.freshCapture ||
    parity.artifacts?.originalStrictParity,
  );

function frames(bytes, fixture, count, expectedAlgorithm) {
  const source = bytes.toString();
  const algorithm = source.match(/^#hash: (MD5|SHA256)$/m)?.[1];
  assert(algorithm, "RGBA hash algorithm missing");
  assert.equal(algorithm, expectedAlgorithm, "RGBA hash algorithm changed");
  assert(
    source.includes(`#dimensions 0: ${fixture.width}x${fixture.height}\n`),
    "RGBA dimensions changed",
  );
  const rows = source
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("#"));
  assert.equal(rows.length, count, "Incomplete ordered RGBA sequence");
  return rows.map((line, ordinal) => {
    const row = line.split(",").map((part) => part.trim());
    assert.equal(row.length, 6, "Invalid RGBA row");
    assert.equal(row[0], "0");
    assert.equal(Number(row[1]), ordinal, "RGBA DTS order changed");
    assert.equal(Number(row[2]), ordinal, "RGBA PTS order changed");
    assert.equal(Number(row[3]), 1);
    assert.equal(Number(row[4]), fixture.width * fixture.height * 4);
    assert.match(
      row[5],
      algorithm === "MD5" ? /^[a-f0-9]{32}$/ : /^[a-f0-9]{64}$/,
    );
    return row[5];
  });
}

const differentFrames = (left, right) =>
  left.flatMap((digest, frame) => (digest === right[frame] ? [] : [frame]));

function completedStrictRender(bytes, frameCount) {
  const source = bytes.toString();
  const stages = [...source.matchAll(/\[Render:trace\] (\{[^\n]+\})/g)].map(
    (match) => JSON.parse(match[1]),
  );
  assert(
    stages.some(
      (stage) =>
        stage.phase === "capture_disk" &&
        stage.status === "end" &&
        stage.totalFrames === frameCount &&
        stage.framesCompleted === frameCount,
    ),
    "Strict capture incomplete",
  );
  assert(
    stages.some(
      (stage) =>
        stage.phase === "pipeline" && stage.message === "artifact validated",
    ),
    "Strict output unvalidated",
  );
  assert(source.includes("Render complete"), "Strict render incomplete");
  assertHardwareGpuProbe(
    browserGpuProbeEvidence(source),
    "retained strict render",
  );
}

// Called only for promoted compiled proofs carrying fresh-capture evidence.
// readBytes is the existing repository-relative file reader at the IO boundary.
export async function assertFreshCompiledEvidence({
  parity,
  manifest,
  fixture,
  origin,
  readBytes,
}) {
  assertExactCompiledParity(parity, fixture);
  assert.deepEqual(parity.origin, origin, "Pinned fixture source changed");
  const { slug, checks, artifacts } = parity;
  assert.match(slug, /^[a-z0-9-]+$/);
  assert.equal(manifest.name, slug);
  assert.equal(
    checks.captureLifecycle,
    "fresh-browser native/production-producer",
  );
  const count = fixture.durationInFrames;
  const repeatFrames = [
    0,
    Math.floor(count / 4),
    Math.floor(count / 2),
    Math.floor((count * 3) / 4),
    count - 1,
  ];
  const cached = new Map();
  const read = async (path) => {
    assert.equal(typeof path, "string", "Missing proof artifact");
    assert(!path.split("/").includes(".."), "Invalid proof artifact path");
    if (!cached.has(path)) cached.set(path, await readBytes(path));
    return cached.get(path);
  };
  const artifact = async (key) => {
    const path = artifacts[key];
    const bytes = await read(path);
    assert.equal(
      sha256(bytes),
      parity.artifactHashes[path],
      `Artifact changed: ${key}`,
    );
    return bytes;
  };
  const jsonArtifact = async (key) => JSON.parse(await artifact(key));
  const block = `registry/blocks/${slug}`;
  assert.deepEqual(
    JSON.parse(await readBytes(`${block}/registry-item.json`)),
    manifest,
    "Installed manifest/dependency declaration changed",
  );
  const actualFiles = Object.fromEntries(
    await Promise.all(
      ["registry-item.json", ...manifest.files.map((file) => file.path)].map(
        async (path) => [path, sha256(await readBytes(`${block}/${path}`))],
      ),
    ),
  );
  assert.deepEqual(
    actualFiles,
    parity.filesSha256,
    "Installed block/font/dependency changed",
  );
  for (const [path, digest] of Object.entries(parity.artifactHashes)) {
    assert(
      path.startsWith(`parity/${slug}-diff/`) ||
        path.startsWith(`public/previews/${slug}/`),
      "Artifact outside component scope",
    );
    assert.equal(sha256(await read(path)), digest, `Artifact changed: ${path}`);
  }
  const inputs = await jsonArtifact("freshInputs");
  assert.deepEqual(
    inputs.filesSha256,
    actualFiles,
    "Capture used different installed source",
  );
  assert.equal(
    inputs.fingerprint,
    parity.fingerprint,
    "Captured fingerprint changed",
  );
  assert.deepEqual(
    inputs.sourceCheckExceptions,
    [],
    "First bucket contains source-check exceptions",
  );
  assert.deepEqual(inputs.repeatFrames, repeatFrames);
  const checkLog = (await artifact("hyperframesCheck")).toString();
  const jsonStart = checkLog.search(/^\{/m);
  assert(jsonStart >= 0, "Full check JSON missing");
  const check = JSON.parse(checkLog.slice(jsonStart));
  assert.equal(check.ok, true, "Full check failed");
  for (const key of ["lint", "runtime", "layout", "motion", "contrast"]) {
    assert(
      check[key] && typeof check[key] === "object",
      `Full check section missing: ${key}`,
    );
    assert.equal(check[key].ok, true, `Full check section failed: ${key}`);
    assert.equal(check[key].errorCount, 0, "Full check contains errors");
    assert.equal(check[key].warningCount, 0, "Full check contains warnings");
    assert.equal(
      check[key].infoCount,
      0,
      "Full check contains informational findings",
    );
    assert.deepEqual(check[key].findings, [], "Full check contains findings");
  }
  for (const section of Object.values(check)) {
    if (!section || typeof section !== "object") continue;
    if ("errorCount" in section)
      assert.equal(section.errorCount, 0, "Full check contains errors");
    if ("warningCount" in section)
      assert.equal(section.warningCount, 0, "Full check contains warnings");
    if ("findings" in section)
      assert.deepEqual(section.findings, [], "Full check contains findings");
  }
  assert.deepEqual(
    check.snapshots?.findingFiles,
    [],
    "Full check contains snapshot findings",
  );
  assert.equal(checks.strictSequentialCaptureComplete, true);
  completedStrictRender(await artifact("hyperframesRender"), count);
  completedStrictRender(await artifact("hyperframesDebugRender"), count);
  const capture = await jsonArtifact("freshCapture");
  assert.equal(capture.complete, true);
  assert.deepEqual(capture.frames, [
    ...Array.from({ length: count }, (_, frame) => frame),
    ...repeatFrames,
  ]);
  assert.deepEqual(capture.referenceErrors, []);
  assert.deepEqual(capture.producerErrors, []);
  assert.equal(capture.referenceCaptures.length, count + repeatFrames.length);
  assert.equal(capture.producerCaptures.length, count + repeatFrames.length);
  for (const captures of [
    capture.referenceCaptures,
    capture.producerCaptures,
  ]) {
    assert.equal(
      new Set(captures.map((record) => record.browserPid)).size,
      count + repeatFrames.length,
      "Fresh browser lifecycle incomplete",
    );
    assert.deepEqual(
      captures.map((record) => record.frame),
      capture.frames,
    );
  }
  assert.equal(
    checks.captureBackend,
    "unobserved",
    "Fresh backend observation invented",
  );
  assert(
    capture.profile.rasterization.includes("requested hardware") &&
      capture.profile.rasterization.includes("backend unobserved"),
  );
  assert.deepEqual(checks.captureProfile, capture.profile);
  const reference = frames(
    await artifact("referenceRgba"),
    fixture,
    count,
    "SHA256",
  );
  assert.deepEqual(
    reference,
    frames(await artifact("hyperframesRgba"), fixture, count, "SHA256"),
  );
  assert.deepEqual(
    reference,
    frames(await artifact("referenceArchiveRgba"), fixture, count, "SHA256"),
  );
  assert.deepEqual(
    reference,
    frames(await artifact("hyperframesArchiveRgba"), fixture, count, "SHA256"),
  );
  const samples = [
    ...(await artifact("perFrameSsim"))
      .toString()
      .matchAll(/^n:(\d+) .*?All:([\d.]+)/gm),
  ];
  assert.equal(samples.length, count, "Incomplete SSIM sequence");
  samples.forEach((match, frame) => {
    assert.equal(Number(match[1]), frame + 1);
    assert.equal(Number(match[2]), 1);
  });
  const nativeWithRepeatsSha = frames(
    await artifact("freshReferenceWithRepeatsSha256"),
    fixture,
    count + repeatFrames.length,
    "SHA256",
  );
  const producerWithRepeatsSha = frames(
    await artifact("freshProducerWithRepeatsSha256"),
    fixture,
    count + repeatFrames.length,
    "SHA256",
  );
  assert.deepEqual(
    nativeWithRepeatsSha.slice(0, count),
    reference,
    "Fresh full sequence differs from canonical source/archive SHA256",
  );
  assert.deepEqual(
    producerWithRepeatsSha.slice(0, count),
    reference,
    "Fresh producer differs from canonical source/archive SHA256",
  );
  assert.deepEqual(
    nativeWithRepeatsSha,
    producerWithRepeatsSha,
    "Fresh SHA256/repeat mismatch",
  );
  const nativeWithRepeats = frames(
    await artifact("freshReferenceWithRepeatsRgba"),
    fixture,
    count + repeatFrames.length,
    "MD5",
  );
  const producerWithRepeats = frames(
    await artifact("freshProducerWithRepeatsRgba"),
    fixture,
    count + repeatFrames.length,
    "MD5",
  );
  assert.deepEqual(
    nativeWithRepeats,
    producerWithRepeats,
    "Fresh RGBA/repeat mismatch",
  );
  const repeats = await jsonArtifact("freshRepeatability");
  assert.deepEqual(
    repeats.map((record) => record.frame),
    repeatFrames,
    "Missing source-valid repeats",
  );
  repeatFrames.forEach((frame, index) => {
    assert.equal(
      nativeWithRepeatsSha[count + index],
      reference[frame],
      "Native SHA256 repeat changed",
    );
    assert.equal(
      producerWithRepeatsSha[count + index],
      reference[frame],
      "Producer SHA256 repeat changed",
    );
    assert.equal(
      nativeWithRepeats[frame],
      nativeWithRepeats[count + index],
      "Native repeat changed",
    );
    assert.equal(
      producerWithRepeats[frame],
      producerWithRepeats[count + index],
      "Producer repeat changed",
    );
    assert.equal(repeats[index].exact, true);
    assert.equal(repeats[index].rgbaSha256, reference[frame]);
  });
  const original = await jsonArtifact("originalStrictParity");
  assert.deepEqual(
    original.origin,
    parity.origin,
    "Original source pin changed",
  );
  assert.deepEqual(original.fixture, fixture, "Original fixture changed");
  const originalRender = await artifact("originalStrictRender");
  const provenance = await jsonArtifact("originalStrictProvenance");
  assert.deepEqual(
    original.filesSha256,
    provenance.originalFilesSha256,
    "Original file provenance changed",
  );
  assert.equal(
    sha256(await artifact("originalStrictParity")),
    provenance.originalParitySha256,
  );
  assert.equal(original.fingerprint, provenance.originalFingerprint);
  assert.deepEqual(provenance.sourceHashes, inputs.sourceHashes);
  assert.equal(
    sha256(originalRender),
    provenance.originalRenderSha256,
    "Original strict render log changed",
  );
  completedStrictRender(originalRender, count);
  const originalProducerBytes = await artifact("originalStrictRgba");
  const originalNativeBytes = await artifact("originalNativeRgba");
  assert.equal(
    sha256(originalProducerBytes),
    original.artifactHashes[original.artifacts.hyperframesRgba],
    "Original strict baseline lost",
  );
  assert.equal(
    sha256(originalNativeBytes),
    original.artifactHashes[original.artifacts.referenceRgba],
    "Original native baseline lost",
  );
  const originalProducer = frames(originalProducerBytes, fixture, count, "MD5");
  const originalNative = frames(originalNativeBytes, fixture, count, "MD5");
  const sequential = await jsonArtifact("sequentialParity");
  assert.deepEqual(
    sequential.origin,
    parity.origin,
    "New mandatory source pin changed",
  );
  assert.deepEqual(
    sequential.fixture,
    fixture,
    "New mandatory fixture changed",
  );
  assert.deepEqual(
    sequential.filesSha256,
    actualFiles,
    "New mandatory used different installed source",
  );
  const mandatoryBytes = await artifact("mandatoryStrictRgba");
  assert.equal(
    sha256(mandatoryBytes),
    sequential.artifactHashes[sequential.artifacts.hyperframesRgba],
    "New mandatory RGBA artifact changed",
  );
  const mandatory = frames(mandatoryBytes, fixture, count, "MD5");
  assert.deepEqual(
    mandatory,
    originalProducer,
    "New mandatory differs from ORIGINAL mandatory strict producer",
  );
  const debug = frames(
    await read(
      `parity/${slug}-diff/sequential/debug-producer-history-rgba.framemd5`,
    ),
    fixture,
    count,
    "MD5",
  );
  assert.deepEqual(
    debug,
    originalProducer,
    "Debug differs from ORIGINAL mandatory strict producer",
  );
  const originalResidual = differentFrames(originalNative, originalProducer);
  const strictResidual = differentFrames(
    nativeWithRepeats.slice(0, count),
    debug,
  );
  const comparison = await jsonArtifact("sequentialComparison");
  assert.equal(
    comparison.originalFingerprint,
    sequential.fingerprint,
    "New mandatory fingerprint changed",
  );
  assert.equal(
    original.status,
    originalResidual.length ? "failed" : "verified",
    "Original rejection relabeled",
  );
  assert.equal(
    original.result.rgba.pass,
    originalResidual.length === 0,
    "Original strict exactness relabeled",
  );
  assert.deepEqual(original.result.rgba.mismatchedFrames, originalResidual);
  assert.deepEqual(
    checks.originalReferenceVsOriginalProducerMismatchedFrames,
    originalResidual,
    "Original residual hidden",
  );
  assert.deepEqual(
    checks.freshReferenceVsDebugProducerMismatchedFrames,
    strictResidual,
    "Strict/source residual hidden",
  );
  assert.deepEqual(checks.sequentialMismatchedFrames, strictResidual);
  assert.equal(
    checks.sequentialRgbaExact,
    strictResidual.length === 0,
    "False exact strict claim",
  );
  assert.equal(
    comparison.exactRgba,
    strictResidual.length === 0,
    "False exact strict comparison",
  );
  assert.deepEqual(
    comparison.originalReferenceVsOriginalProducerMismatchedFrames,
    originalResidual,
  );
  assert.deepEqual(
    comparison.freshReferenceVsDebugProducerMismatchedFrames,
    strictResidual,
  );
  assert.deepEqual(comparison.mismatchedFrames, strictResidual);
  assert.equal(comparison.debugProducerMatchesOriginalSequentialProducer, true);
  assert.equal(checks.debugProducerMatchesOriginalSequentialProducer, true);
  return {
    frameCount: count,
    repeatFrames,
    originalResidual,
    strictResidual,
    nativeHistoryResidual: differentFrames(
      originalNative,
      nativeWithRepeats.slice(0, count),
    ),
    backend: "unobserved",
  };
}
