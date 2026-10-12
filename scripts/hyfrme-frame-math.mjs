// Hyfrme-owned, framework-neutral frame math used by generated ports.
// Preserve the pinned reference's arithmetic order without shipping its runtime.
// The Bézier evaluator carries the original MIT attribution below.

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

/*!
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
 */
const hyfrmeCubicCoordinate = (time, first, second) =>
  (((1 - 3 * second + 3 * first) * time + (3 * second - 6 * first)) * time + 3 * first) * time;
const hyfrmeCubicSlope = (time, first, second) =>
  3 * (1 - 3 * second + 3 * first) * time * time + 2 * (3 * second - 6 * first) * time + 3 * first;

const hyfrmeBezier = (x1, y1, x2, y2) => {
  if (!(x1 >= 0 && x1 <= 1 && x2 >= 0 && x2 <= 1)) {
    throw new Error("bezier x values must be in [0, 1] range");
  }
  const samples = new Float32Array(11);
  const step = 1 / 10;
  const linear = x1 === y1 && x2 === y2;
  if (!linear) {
    for (let index = 0; index < samples.length; index += 1) {
      samples[index] = hyfrmeCubicCoordinate(index * step, x1, x2);
    }
  }
  return (input) => {
    const progress = Math.min(1, Math.max(0, input));
    if (linear || progress === 0 || progress === 1) return progress;
    let start = 0;
    let index = 1;
    while (index !== 10 && samples[index] <= progress) {
      start += step;
      index += 1;
    }
    index -= 1;
    const fraction = (progress - samples[index]) / (samples[index + 1] - samples[index]);
    let time = start + fraction * step;
    const slope = hyfrmeCubicSlope(time, x1, x2);
    if (slope >= 0.001) {
      for (let iteration = 0; iteration < 4; iteration += 1) {
        const currentSlope = hyfrmeCubicSlope(time, x1, x2);
        if (currentSlope === 0) break;
        time -= (hyfrmeCubicCoordinate(time, x1, x2) - progress) / currentSlope;
      }
    } else if (slope !== 0) {
      let end = start + step;
      let difference;
      let iteration = 0;
      do {
        time = start + (end - start) / 2;
        difference = hyfrmeCubicCoordinate(time, x1, x2) - progress;
        if (difference > 0) end = time;
        else start = time;
      } while (Math.abs(difference) > 0.0000001 && ++iteration < 10);
    }
    return hyfrmeCubicCoordinate(time, y1, y2);
  };
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

const hyfrmeSpringStates = new Map();
const hyfrmeSpringDurations = new Map();

// Advance the oscillator at frame timestamps. Evaluating once at total elapsed
// time is algebraically equivalent, but changes the source's floating-point result.
const hyfrmeSpringAdvance = (state, milliseconds, stiffness, damping, mass) => {
  const time = Math.min(milliseconds - state.milliseconds, 64) / 1000;
  const displacement = 1 - state.position;
  const initialVelocity = -state.velocity;
  const ratio = damping / (2 * Math.sqrt(stiffness * mass));
  const frequency = Math.sqrt(stiffness / mass);
  let position;
  let velocity;
  if (ratio < 1) {
    const dampedFrequency = frequency * Math.sqrt(1 - ratio ** 2);
    const sine = Math.sin(dampedFrequency * time);
    const cosine = Math.cos(dampedFrequency * time);
    const envelope = Math.exp(-ratio * frequency * time);
    const offset = envelope * (sine * ((initialVelocity + ratio * frequency * displacement) / dampedFrequency) + displacement * cosine);
    position = 1 - offset;
    velocity = ratio * frequency * offset - envelope * (cosine * (initialVelocity + ratio * frequency * displacement) - dampedFrequency * displacement * sine);
  } else {
    const envelope = Math.exp(-frequency * time);
    position = 1 - envelope * (displacement + (initialVelocity + frequency * displacement) * time);
    velocity = envelope * (initialVelocity * (time * frequency - 1) + time * displacement * frequency * frequency);
  }
  return {position, velocity, milliseconds};
};

const hyfrmeSpringUnit = (frame, fps, config = {}) => {
  const stiffness = config.stiffness ?? 100;
  const damping = config.damping ?? 10;
  const mass = config.mass ?? 1;
  if (damping <= 0) throw new Error("Spring damping must be greater than 0");
  const key = [fps, stiffness, damping, mass].join(":");
  let states = hyfrmeSpringStates.get(key);
  if (!states) {
    states = [{position: 0, velocity: 0, milliseconds: 0}];
    hyfrmeSpringStates.set(key, states);
  }
  const clamped = Math.max(0, frame);
  const whole = Math.floor(clamped);
  const fractional = clamped % 1;
  const lastWhole = fractional === 0 ? whole : Math.max(0, whole - 1);
  for (let index = states.length; index <= lastWhole; index += 1) {
    states.push(hyfrmeSpringAdvance(states[index - 1], (index / fps) * 1000, stiffness, damping, mass));
  }
  if (fractional === 0) return states[whole].position;
  return hyfrmeSpringAdvance(states[lastWhole], (clamped / fps) * 1000, stiffness, damping, mass).position;
};

const hyfrmeMeasureSpring = (fps, config, threshold) => {
  if (threshold === 0) return Infinity;
  if (threshold === 1) return 0;
  if (!Number.isFinite(threshold) || threshold < 0) throw new Error("Invalid spring rest threshold");
  const key = [fps, config.stiffness ?? 100, config.damping ?? 10, config.mass ?? 1, threshold].join(":");
  if (hyfrmeSpringDurations.has(key)) return hyfrmeSpringDurations.get(key);
  let frame = 0;
  while (Math.abs(1 - hyfrmeSpringUnit(frame, fps, config)) >= threshold) frame += 1;
  let duration = frame;
  for (let settled = 0; settled < 20; settled += 1) {
    frame += 1;
    if (Math.abs(1 - hyfrmeSpringUnit(frame, fps, config)) >= threshold) {
      settled = 0;
      duration = frame + 1;
    }
  }
  hyfrmeSpringDurations.set(key, duration);
  return duration;
};

const spring = ({frame, fps, config = {}, from = 0, to = 1, durationInFrames, durationRestThreshold = 0.005, delay = 0, reverse = false}) => {
  const naturalDuration = reverse || durationInFrames !== undefined
    ? hyfrmeMeasureSpring(fps, config, durationRestThreshold)
    : undefined;
  const reversed = reverse ? (durationInFrames ?? naturalDuration) - frame : frame;
  const delayed = reversed + (reverse ? delay : -delay);
  const scaled = durationInFrames === undefined ? delayed : delayed / (durationInFrames / naturalDuration);
  if (durationInFrames && delayed > durationInFrames) return to;
  const position = hyfrmeSpringUnit(scaled, fps, config);
  const progress = config.overshootClamping
    ? to >= from ? Math.min(position, to) : Math.max(position, to)
    : position;
  return from === 0 && to === 1 ? progress : interpolate(progress, [0, 1], [from, to]);
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
