import { createHash } from "node:crypto";

// The SDK probes a separate browser before capture; this is not the capture backend.
export function browserGpuProbeEvidence(output) {
  return {
    logSha256: createHash("sha256").update(output).digest("hex"),
    observations: Array.from(
      output.matchAll(
        /^\[hyperframes\] browserGpuMode probe → (hardware|software) \(([^\r\n]*)\)\s*$/gm,
      ),
      ([, mode, detail]) => ({ mode, detail }),
    ),
  };
}

export function assertHardwareGpuProbe(evidence, stage) {
  if (
    evidence.observations.length === 1 &&
    evidence.observations[0].mode === "hardware"
  )
    return;
  throw new Error(
    `${stage}: hardware was requested, but the SDK log must contain exactly one hardware probe; observed ${JSON.stringify(evidence.observations)}. Capture backend remains unobserved; preserve the first output and log.`,
  );
}
