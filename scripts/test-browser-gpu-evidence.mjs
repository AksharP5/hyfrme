import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  assertHardwareGpuProbe,
  browserGpuProbeEvidence,
} from "./browser-gpu-evidence.mjs";

const hardware = '[hyperframes] browserGpuMode probe → hardware (WebGL renderer vendor="Google Inc. (NVIDIA Corporation)" renderer="ANGLE (NVIDIA Corporation, NVIDIA GeForce RTX 5060/PCIe/SSE2, OpenGL ES 3.2)")\n';

test("hardware probe evidence binds the retained log without claiming a capture backend", () => {
  const evidence = browserGpuProbeEvidence(hardware);
  assertHardwareGpuProbe(evidence, "render");
  assert.equal(evidence.observations[0].mode, "hardware");
  assert.equal(evidence.logSha256, createHash("sha256").update(hardware).digest("hex"));
  assert.equal(evidence.captureBackend, undefined);
});

test("unavailable WebGL cannot pass a requested hardware stage", () => {
  const output = "[hyperframes] browserGpuMode probe → software (WebGL unavailable)\nHardware was requested. Honouring the explicit request anyway.\n";
  const evidence = browserGpuProbeEvidence(output);
  assert.throws(() => assertHardwareGpuProbe(evidence, "snapshot"), /snapshot: hardware was requested/);
  assert.equal(evidence.observations[0].detail, "WebGL unavailable");
  assert.equal(evidence.logSha256, createHash("sha256").update(output).digest("hex"));
});

test("missing or duplicate stage probes cannot pass hardware verification", () => {
  for (const output of ["Strict render passed\n", hardware + hardware])
    assert.throws(() => assertHardwareGpuProbe(browserGpuProbeEvidence(output), "debug"));
});

test("a software request with no SDK probe does not invent an observation", () => {
  assert.deepEqual(browserGpuProbeEvidence("Strict software render passed\n").observations, []);
});
