import assert from "node:assert/strict";
import { frameMathSource } from "./hyfrme-frame-math.mjs";

const interpolateColors = new Function(
  `${frameMathSource}\nreturn interpolateColors;`,
)();

assert.equal(
  interpolateColors(0, [0, 1], [" transparent ", "#ffffff"]),
  "rgba(0, 0, 0, 0)",
);
assert.equal(
  interpolateColors(0.5, [0, 1], ["TRANSPARENT", "rgba(200, 100, 50, 0.8)"]),
  "rgba(100, 50, 25, 0.4)",
);
assert.equal(
  interpolateColors(1, [0, 1], ["#fff", "transparent"]),
  "rgba(0, 0, 0, 0)",
);
assert.equal(
  interpolateColors(0.5, [0, 1], ["transparent", "transparent"]),
  "rgba(0, 0, 0, 0)",
);

console.log("Color interpolation preserves transparent endpoints and alpha.");
