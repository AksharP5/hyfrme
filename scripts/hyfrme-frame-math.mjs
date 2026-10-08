// Hyfrme-owned, framework-neutral frame math used by generated ports.
// The implementations are intentionally small and derived from the public
// definitions of linear interpolation and cubic Bézier curves—not bundled
// from Remotion. Remotion remains the reference renderer in the parity bench.

export const remocnMitBanner = `/*!
 * This generated port contains source derived from Remocn.
 * Source attribution and the pinned commit are recorded in the matching
 * parity manifest in the Hyfrme repository.
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

export const bezierMitNotice = `/*!
 * Cubic Bézier evaluation adapted from Gaëtan Renaudeau's bezier-easing
 * and the React Native implementation. Copyright (c) 2014-2015 Gaëtan
 * Renaudeau. Portions copyright (c) Facebook, Inc. and its affiliates.
 * MIT License
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
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
    if (value <= inputRange[index + 1]) {
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
import {
  converter as hyfrmeColorConverter,
  getMode as hyfrmeColorMode,
  modeHsl,
  modeHwb,
  modeLab,
  modeLab65,
  modeLch,
  modeLch65,
  modeOklab,
  modeOklch,
  modeRgb,
  parse as hyfrmeCssColor,
  useMode as hyfrmeUseColorMode,
} from "culori/fn";

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
  static quad(value) { return value * value; }
  static cubic(value) { return value * value * value; }
  static ease(value) { return hyfrmeBezier(0.42, 0, 1, 1)(value); }
  static elastic(bounciness = 1) {
    const period = bounciness * Math.PI;
    return (value) => 1 - Math.cos(value * Math.PI / 2) ** 3 * Math.cos(value * period);
  }
  static sin(value) { return 1 - Math.cos(value * Math.PI / 2); }
  static circle(value) {
    const clamped = Math.min(1, Math.max(0, value));
    return 1 - Math.sqrt(1 - clamped * clamped);
  }
  static exp(value) { return 2 ** (10 * (value - 1)); }
  static poly(power) { return (value) => value ** power; }
  static back(overshoot = 1.70158) {
    return (value) => value * value * ((overshoot + 1) * value - overshoot);
  }
  static spring({allowTail = false, durationRestThreshold, ...config} = {}) {
    const easing = (value) => {
      if (value <= 0) return 0;
      if (!allowTail && value >= 1) return 1;
      if (allowTail) {
        return spring({
          fps: 30,
          frame: value * hyfrmeMeasureSpring(30, config, durationRestThreshold ?? 0.005),
          config,
        });
      }
      return spring({
        fps: 30,
        frame: value * 30,
        config,
        durationInFrames: 30,
        durationRestThreshold,
      });
    };
    easing.remotionShouldExtendRight = allowTail;
    return easing;
  }
  static bounce(value) {
    const clamped = Math.min(1, Math.max(0, value));
    if (clamped < 1 / 2.75) return 7.5625 * clamped * clamped;
    if (clamped < 2 / 2.75) {
      const shifted = clamped - 1.5 / 2.75;
      return 7.5625 * shifted * shifted + 0.75;
    }
    if (clamped < 2.5 / 2.75) {
      const shifted = clamped - 2.25 / 2.75;
      return 7.5625 * shifted * shifted + 0.9375;
    }
    const shifted = clamped - 2.625 / 2.75;
    return 7.5625 * shifted * shifted + 0.984375;
  }
  static in(easing) { return easing; }
  static out(easing) { return (value) => 1 - easing(1 - value); }
  static inOut(easing) {
    return (value) => value < 0.5
      ? easing(value * 2) / 2
      : 1 - easing((1 - value) * 2) / 2;
  }
  static bezier(x1, y1, x2, y2) { return hyfrmeBezier(x1, y1, x2, y2); }
}

const hyfrmeColors = /* @__PURE__ */ (() => {
  [modeRgb, modeHsl, modeHwb, modeLab, modeLab65, modeLch, modeLch65, modeOklab, modeOklch].forEach(hyfrmeUseColorMode);
  return {parse: hyfrmeCssColor, mode: hyfrmeColorMode, toRgb: hyfrmeColorConverter("rgb"), cache: new Map()};
})();

const hyfrmeParseColor = (color) => {
  const value = String(color).trim().toLowerCase();
  const cached = hyfrmeColors.cache.get(value);
  if (cached) return cached;
  const parsed = hyfrmeColors.parse(value);
  if (!parsed) throw new Error(\`Unsupported Hyfrme color: \${color}\`);
  const normalized = {...parsed};
  for (const channel of hyfrmeColors.mode(parsed.mode).channels) {
    normalized[channel] ??= channel === "alpha" ? 1 : 0;
  }
  // Match the pinned source's D65 interpretation of Lab/LCH.
  if (parsed.mode === "lab") normalized.mode = "lab65";
  if (parsed.mode === "lch") normalized.mode = "lch65";
  const rgb = hyfrmeColors.toRgb(normalized);
  const byte = (channel) => Math.round(Math.max(0, Math.min(1, channel)) * 255);
  const channels = [byte(rgb.r), byte(rgb.g), byte(rgb.b), byte(rgb.alpha) / 255];
  const legacy = /^rgba?\\(/.test(value) && value.includes(",")
    ? value.slice(value.indexOf("(") + 1, -1).split(",").slice(0, 3)
    : [];
  // The pinned source truncates numeric channels in comma-separated RGB.
  if (legacy.length === 3 && legacy.every((channel) => /^[-+]?\\d*\\.?\\d+$/.test(channel.trim()))) {
    for (let index = 0; index < 3; index += 1) {
      channels[index] = Math.max(0, Math.min(255, Number.parseInt(legacy[index], 10) || 0));
    }
  }
  hyfrmeColors.cache.set(value, channels);
  return channels;
};

const interpolateColors = (input, inputRange, outputRange) => {
  const colors = outputRange.map(hyfrmeParseColor);
  const red = Math.round(interpolate(input, inputRange, colors.map((color) => color[0]), {extrapolateLeft: "clamp", extrapolateRight: "clamp"}));
  const green = Math.round(interpolate(input, inputRange, colors.map((color) => color[1]), {extrapolateLeft: "clamp", extrapolateRight: "clamp"}));
  const blue = Math.round(interpolate(input, inputRange, colors.map((color) => color[2]), {extrapolateLeft: "clamp", extrapolateRight: "clamp"}));
  const alpha = Number(interpolate(input, inputRange, colors.map((color) => color[3]), {extrapolateLeft: "clamp", extrapolateRight: "clamp"}).toFixed(3));
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

const hyfrmeMulberry32 = (seed) => {
  let value = seed + 0x6d2b79f5;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
};

const hyfrmeHashCode = (input) => {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return hash;
};

const random = (seed) => {
  if (seed === null) return Math.random();
  if (typeof seed === "string") return hyfrmeMulberry32(hyfrmeHashCode(seed));
  if (typeof seed === "number") return hyfrmeMulberry32(seed * 10000000000);
  throw new Error("Hyfrme random() requires a number or string seed");
};
`;
