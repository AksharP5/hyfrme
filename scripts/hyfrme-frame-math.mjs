// Hyfrme-owned, framework-neutral frame math used by generated ports.
// The implementations are intentionally small and derived from the public
// definitions of linear interpolation and cubic Bézier curves—not bundled
// from Remotion. Remotion remains the reference renderer in the parity bench.

export const remocnMitBanner = `/*!
 * This generated port contains source derived from Remocn.
 * Source attribution and the pinned commit are recorded in registry-item.json
 * and the matching parity manifest.
 *
 * MIT License
 * Copyright (c) 2026 Remocn
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */`;

export const interpolationSource = `
const hyfrmeNormalizeInput = (input, start, end, mode) => {
  if (mode === "identity") return {identity: true, value: input};
  if (mode === "clamp") return {identity: false, value: Math.min(end, Math.max(start, input))};
  if (mode === "wrap") {
    const width = end - start;
    return {identity: false, value: width === 0 ? start : ((input - start) % width + width) % width + start};
  }
  return {identity: false, value: input};
};

const interpolate = (input, inputRange, outputRange, options = {}) => {
  if (inputRange.length !== outputRange.length || inputRange.length < 2) {
    throw new Error("Hyfrme interpolate() requires matching ranges with at least two values");
  }
  const first = inputRange[0];
  const last = inputRange[inputRange.length - 1];
  const normalized = input < first
    ? hyfrmeNormalizeInput(input, first, last, options.extrapolateLeft ?? "extend")
    : input > last
      ? hyfrmeNormalizeInput(input, first, last, options.extrapolateRight ?? "extend")
      : {identity: false, value: input};
  if (normalized.identity) return normalized.value;
  const value = normalized.value;
  let segment = inputRange.length - 2;
  for (let index = 0; index < inputRange.length - 1; index += 1) {
    if (value < inputRange[index + 1]) {
      segment = index;
      break;
    }
  }
  const inputStart = inputRange[segment];
  const inputEnd = inputRange[segment + 1];
  const outputStart = outputRange[segment];
  const outputEnd = outputRange[segment + 1];
  const rawProgress = inputEnd === inputStart ? 1 : (value - inputStart) / (inputEnd - inputStart);
  const progress = options.easing ? options.easing(rawProgress) : rawProgress;
  return outputStart + (outputEnd - outputStart) * progress;
};
`;

export const frameMathSource = `${interpolationSource}
const hyfrmeCubicCoordinate = (time, firstControl, secondControl) => {
  const inverse = 1 - time;
  return 3 * inverse * inverse * time * firstControl +
    3 * inverse * time * time * secondControl +
    time * time * time;
};

const hyfrmeBezier = (x1, y1, x2, y2) => (input) => {
  const progress = Math.min(1, Math.max(0, input));
  if (progress === 0 || progress === 1) return progress;
  let lower = 0;
  let upper = 1;
  for (let iteration = 0; iteration < 36; iteration += 1) {
    const time = (lower + upper) / 2;
    if (hyfrmeCubicCoordinate(time, x1, x2) < progress) lower = time;
    else upper = time;
  }
  return hyfrmeCubicCoordinate((lower + upper) / 2, y1, y2);
};

class Easing {
  static step0(value) { return value > 0 ? 1 : 0; }
  static step1(value) { return value >= 1 ? 1 : 0; }
  static linear(value) { return value; }
  static cubic(value) { return value * value * value; }
  static in(easing) { return easing; }
  static out(easing) { return (value) => 1 - easing(1 - value); }
  static inOut(easing) {
    return (value) => value < 0.5
      ? easing(value * 2) / 2
      : 1 - easing((1 - value) * 2) / 2;
  }
  static bezier(x1, y1, x2, y2) { return hyfrmeBezier(x1, y1, x2, y2); }
}

const hyfrmeParseColor = (color) => {
  const value = String(color).trim();
  if (value.startsWith("#")) {
    const hex = value.slice(1);
    const expanded = hex.length <= 4
      ? [...hex].map((character) => character + character).join("")
      : hex;
    const opaque = expanded.length === 6 ? expanded + "ff" : expanded;
    return [
      Number.parseInt(opaque.slice(0, 2), 16),
      Number.parseInt(opaque.slice(2, 4), 16),
      Number.parseInt(opaque.slice(4, 6), 16),
      Number.parseInt(opaque.slice(6, 8), 16) / 255,
    ];
  }
  const channels = value.match(/[\\d.]+/g)?.map(Number);
  if (!channels || channels.length < 3) throw new Error(\`Unsupported Hyfrme color: \${color}\`);
  return [channels[0], channels[1], channels[2], channels[3] ?? 1];
};

const interpolateColors = (input, inputRange, outputRange) => {
  const colors = outputRange.map(hyfrmeParseColor);
  const red = Math.round(interpolate(input, inputRange, colors.map((color) => color[0]), {extrapolateLeft: "clamp", extrapolateRight: "clamp"}));
  const green = Math.round(interpolate(input, inputRange, colors.map((color) => color[1]), {extrapolateLeft: "clamp", extrapolateRight: "clamp"}));
  const blue = Math.round(interpolate(input, inputRange, colors.map((color) => color[2]), {extrapolateLeft: "clamp", extrapolateRight: "clamp"}));
  const alpha = interpolate(input, inputRange, colors.map((color) => color[3]), {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return \`rgba(\${red}, \${green}, \${blue}, \${alpha})\`;
};

const hyfrmeSpringUnit = (frame, fps, config = {}) => {
  if (frame <= 0) return 0;
  const stiffness = config.stiffness ?? 100;
  const damping = config.damping ?? 10;
  const mass = config.mass ?? 1;
  const velocity = config.velocity ?? 0;
  const time = frame / fps;
  const naturalFrequency = Math.sqrt(stiffness / mass);
  const dampingRatio = damping / (2 * Math.sqrt(stiffness * mass));
  let value;

  if (dampingRatio >= 1) {
    const envelope = Math.exp(-naturalFrequency * time);
    value = 1 - envelope * (1 + (naturalFrequency - velocity) * time);
  } else {
    const dampedFrequency = naturalFrequency * Math.sqrt(1 - dampingRatio * dampingRatio);
    const envelope = Math.exp(-dampingRatio * naturalFrequency * time);
    value = 1 - envelope * (
      Math.cos(dampedFrequency * time) +
      ((dampingRatio * naturalFrequency - velocity) / dampedFrequency) *
        Math.sin(dampedFrequency * time)
    );
  }

  return config.overshootClamping
    ? Math.min(1, Math.max(0, value))
    : value;
};

const hyfrmeMeasureSpring = (fps, config, threshold) => {
  let lastUnsettledFrame = -1;
  for (let frame = 0; frame <= fps * 20; frame += 1) {
    if (Math.abs(1 - hyfrmeSpringUnit(frame, fps, config)) >= threshold) {
      lastUnsettledFrame = frame;
    }
  }
  return lastUnsettledFrame + 1;
};

const spring = ({
  frame,
  fps,
  config = {},
  from = 0,
  to = 1,
  durationInFrames,
  durationRestThreshold = 0.005,
}) => {
  const scaledFrame = durationInFrames === undefined
    ? frame
    : frame * hyfrmeMeasureSpring(fps, config, durationRestThreshold) / durationInFrames;
  const progress = hyfrmeSpringUnit(scaledFrame, fps, config);
  return from + (to - from) * progress;
};
`;
