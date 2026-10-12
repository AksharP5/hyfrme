import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { frameMathSource } from "./hyfrme-frame-math.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const bundle = (exportName) =>
  build({
    stdin: {
      contents: `${frameMathSource}\nexport {${exportName}};`,
      resolveDir: root,
      sourcefile: "hyfrme-frame-math.js",
    },
    bundle: true,
    format: "esm",
    write: false,
    metafile: true,
  });
const [colorModule, numericModule] = await Promise.all([
  bundle("interpolateColors"),
  bundle("interpolate,Easing,spring"),
]);
const { interpolateColors } = await import(
  `data:text/javascript;base64,${Buffer.from(colorModule.outputFiles[0].contents).toString("base64")}`
);
const { interpolate, Easing, spring } = await import(
  `data:text/javascript;base64,${Buffer.from(numericModule.outputFiles[0].contents).toString("base64")}`
);

assert.equal(Easing.bezier(0.42, 0, 0.58, 1)(0.5), 0.5);
assert.equal(Easing.bezier(0, 0, 1, 1)(0.5), 0.5);

// Values captured from all three pinned reference versions (.473/.481/.513).
// Flat slopes exercise subdivision; the ordinary curve exercises Newton steps.
for (const [curve, input, expected] of [
  [[0.4, 0, 0.2, 1], 0.23333333333333334, 0.19846205948855705],
  [[0, 0.2, 0, 0.8], 0.0001, 0.03033425519242883],
  [[1, 0.2, 1, 0.8], 0.9999, 0.9696657448075712],
])
  assert.equal(Easing.bezier(...curve)(input), expected);
assert.throws(() => Easing.bezier(-0.1, 0, 1, 1));

for (const [params, expected] of [
  [
    { frame: 3, fps: 30, config: { damping: 13, stiffness: 170, mass: 0.7 } },
    0.5976414005119413,
  ],
  [{ frame: 12.2, fps: 30, durationInFrames: 87 }, 0.5068703244825342],
  [{ frame: 45, fps: 30, durationInFrames: 30 }, 1],
  [{ frame: 3.25, fps: 15, config: { damping: 200 } }, 0.5719076705793775],
  [
    { frame: 5, fps: 30, delay: 2, reverse: true, durationInFrames: 30 },
    0.9845451519290561,
  ],
]) {
  assert.equal(spring(params), expected);
  assert.equal(
    spring(params),
    expected,
    "Cached frame evaluation preserves the result",
  );
}

assert.equal(
  interpolate(9, [0, 9, 30], [1.42, 0.985, 0.97], {
    easing: Easing.out(Easing.exp),
  }),
  0.9854248046875,
  "An exact interior keyframe uses the incoming segment's easing endpoint",
);

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

for (const [value, expected] of [
  ["navy", "rgba(0, 0, 128, 1)"],
  [" ReBeCcApUrPlE ", "rgba(102, 51, 153, 1)"],
  ["hsl(240, 100%, 50%)", "rgba(0, 0, 255, 1)"],
  ["hsla(-120, 50%, 25%, 0.3)", "rgba(32, 32, 96, 0.302)"],
  ["rgba(200, 100, 50, 0.3)", "rgba(200, 100, 50, 0.302)"],
  ["rgb(12.8, 100.7, 50.2)", "rgba(12, 100, 50, 1)"],
  ["rgb(.5, -20, 300)", "rgba(0, 0, 255, 1)"],
  ["hwb(240deg 0% 0% / 30%)", "rgba(0, 0, 255, 0.302)"],
  ["oklab(60% 0.1 -0.1 / 0.3)", "rgba(159, 99, 186, 0.302)"],
  ["oklch(60% 0.15 270deg / 30%)", "rgba(94, 120, 217, 0.302)"],
  ["lab(60% 20 -30 / 0.3)", "rgba(153, 135, 197, 0.302)"],
  ["lch(60% 30 270deg / 0.3)", "rgba(108, 147, 197, 0.302)"],
  ["oklab(none none none / none)", "rgba(0, 0, 0, 1)"],
]) {
  assert.equal(interpolateColors(0, [0, 1], [value, "transparent"]), expected);
}
assert.equal(
  interpolateColors(0.5, [0, 1], ["navy", "white"]),
  "rgba(128, 128, 192, 1)",
);
assert.equal(
  interpolateColors(0.5, [0, 1], ["hsl(240, 100%, 50%)", "hsl(0, 100%, 50%)"]),
  "rgba(128, 0, 128, 1)",
);
assert.equal(
  interpolateColors(0.5, [0, 1], ["rgba(200, 100, 50, 0.3)", "transparent"]),
  "rgba(100, 50, 25, 0.151)",
);
assert.equal(
  interpolateColors(0.5, [0, 1], ["#f008", "transparent"]),
  "rgba(128, 0, 0, 0.267)",
);
assert.equal(
  interpolateColors(0.5, [0, 1], ["#0A0A0A", "#E7E7E7"]),
  "rgba(121, 121, 121, 1)",
);
for (const value of ["#12", "#ffffffzz", "invalid-color", "rgba(1, 2)"]) {
  assert.throws(() => interpolateColors(0, [0, 1], [value, "transparent"]), {
    message: `Unsupported Hyfrme color: ${value}`,
  });
}
const emittedInputs = Object.values(numericModule.metafile.outputs).flatMap(
  (output) => Object.entries(output.inputs),
);
assert.equal(
  emittedInputs
    .filter(([path]) => path.includes("/culori/"))
    .reduce((bytes, [, input]) => bytes + input.bytesInOutput, 0),
  0,
  "Ports without color interpolation must not bundle the CSS parser",
);

console.log(
  "Frame math preserves reference easing and springs, CSS color quantization, and unused parser tree-shaking.",
);
