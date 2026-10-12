import { isDeepStrictEqual } from "node:util";

export function assertExactCompiledParity(parity, fixture = parity?.fixture) {
  if (
    parity?.classification !== "compiled-source-port" ||
    parity.status !== "verified" ||
    parity.measurement !== "lossless-png" ||
    !fixture ||
    ![fixture.width, fixture.height, fixture.durationInFrames].every(
      (value) => Number.isInteger(value) && value > 0,
    ) ||
    !isDeepStrictEqual(parity.fixture, fixture) ||
    parity.thresholds?.exactRgba !== true ||
    parity.thresholds.meanSsim !== 1 ||
    parity.thresholds.minSsim !== 1 ||
    parity.result?.pass !== true ||
    parity.result.frameCount !== fixture.durationInFrames ||
    parity.result.meanSsim !== 1 ||
    parity.result.minSsim !== 1 ||
    parity.result.rgba?.pass !== true ||
    parity.result.rgba.frameCount !== fixture.durationInFrames ||
    !Array.isArray(parity.result.rgba.mismatchedFrames) ||
    parity.result.rgba.mismatchedFrames.length !== 0 ||
    parity.checks?.installedThroughCli !== true
  )
    throw new Error(
      `${parity?.slug ?? "Component"}: exact lossless parity evidence is incomplete`,
    );
}
