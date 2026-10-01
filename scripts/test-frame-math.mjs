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
  bundle("interpolate"),
]);
const { interpolateColors } = await import(
  `data:text/javascript;base64,${Buffer.from(colorModule.outputFiles[0].contents).toString("base64")}`
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
  "Color interpolation supports CSS colors, matches reference quantization, and tree-shakes when unused.",
);
