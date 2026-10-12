import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { transform } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { frameMathSource } from "./hyfrme-frame-math.mjs";
import { sourcePaintShim } from "./remocn-source-paint.mjs";

const root = resolve(import.meta.dirname, "..");
const generator = await readFile(
  resolve(root, process.argv[2] ?? "scripts/generate-text-ports.mjs"),
  "utf8",
);
const plugin = generator.slice(
  generator.indexOf("const remotionPlugin ="),
  generator.indexOf("const transitionsPlugin ="),
);
const template = plugin.match(/contents: `([\s\S]*?)`,\n    }\)\);/)[1];
const source = runInNewContext("`" + template + "`", {
  frameMathSource,
  sourcePaintShim,
});
const paints = [];
const listeners = new Map();
const window = {
  __HF_VIRTUAL_TIME__: {
    originalRequestAnimationFrame(callback) {
      paints.push(callback);
      return paints.length;
    },
  },
  requestAnimationFrame() {
    throw new Error("Mount readiness stalled on the virtual animation clock");
  },
  addEventListener(name, callback) {
    listeners.set(name, callback);
  },
};
const module = { exports: {} };
runInNewContext(
  (await transform(source, { loader: "js", format: "cjs" })).code,
  {
    require: createRequire(import.meta.url),
    module,
    exports: module.exports,
    window,
  },
);
const shim = module.exports;
const handle = shim.delayRender("shader mount");
shim.__sourcePaintFrame(() =>
  shim.__sourcePaintFrame(() => shim.continueRender(handle)),
);
let sourceReady = false;
const readiness = shim.__waitForSource().then(() => (sourceReady = true));
const seekWaits = [];
listeners.get("hf-seek")({
  detail: { waitUntil: (promise) => seekWaits.push(promise) },
});
await Promise.resolve();
assert.equal(sourceReady, false);
assert.equal(paints.length, 1);
paints.shift()(0);
await Promise.resolve();
assert.equal(sourceReady, false);
assert.equal(paints.length, 1);
paints.shift()(0);
await Promise.all([readiness, ...seekWaits]);
assert.equal(sourceReady, true);
assert.equal(paints.length, 0);
const config = { fps: 30, width: 1280, height: 720, durationInFrames: 270 };
const element = React.createElement;

function render(frame, props, nested) {
  shim.__setHyfrmeFrame(frame, config);
  let observed;
  function Probe() {
    const video = shim.useVideoConfig();
    observed = [
      shim.useCurrentFrame(),
      video.durationInFrames,
      video.width,
      video.height,
      video.fps,
    ];
    return element("span", null, "Sequence content");
  }
  let child = element(Probe);
  if (nested)
    child = element(shim.Sequence, { layout: "none", ...nested }, child);
  const html = renderToStaticMarkup(element(shim.Sequence, props, child));
  return { observed, html };
}

// Expected values were compared with actual Remotion 4.0.513 React SSR.
for (const [frame, props, nested, expected] of [
  [253, { from: 166 }, null, [87, 104, 1280, 720, 30]],
  [200, { from: 150 }, null, [50, 120, 1280, 720, 30]],
  [269, { from: 250, durationInFrames: 100 }, null, [19, 20, 1280, 720, 30]],
  [
    60,
    { from: 20, durationInFrames: 70, width: 640, height: 360 },
    { from: 30, durationInFrames: 100 },
    [10, 40, 640, 360, 30],
  ],
  [
    60,
    { from: 20, durationInFrames: 70, width: 640, height: 360 },
    { from: 30, width: 320 },
    [10, 40, 320, 360, 30],
  ],
  [0, { from: -10 }, null, [10, 280, 1280, 720, 30]],
  [
    40,
    { from: 20, durationInFrames: 70 },
    { from: -5 },
    [25, 75, 1280, 720, 30],
  ],
  [20, { from: 21 }, null, undefined],
  [29, { from: 20, durationInFrames: 10 }, null, [9, 10, 1280, 720, 30]],
  [30, { from: 20, durationInFrames: 10 }, null, undefined],
]) {
  const result = render(frame, { layout: "none", ...props }, nested);
  assert.deepEqual(result.observed, expected);
  assert.equal(result.html, expected ? "<span>Sequence content</span>" : "");
}

const defaultStyle = {
  position: "absolute",
  top: "0",
  left: "0",
  right: "0",
  bottom: "0",
  width: "100%",
  height: "100%",
  display: "flex",
};
for (const [props, dimensions, style] of [
  [{}, [1280, 720], defaultStyle],
  [
    { width: 640, height: 360 },
    [640, 360],
    { ...defaultStyle, width: "640px", height: "360px" },
  ],
  [{ width: 0, height: 0 }, [0, 0], defaultStyle],
  [
    {
      width: 640,
      height: 360,
      style: { display: "grid", width: 300, flexDirection: "row" },
    },
    [640, 360],
    {
      ...defaultStyle,
      display: "grid",
      width: "300px",
      height: "360px",
      "flex-direction": "row",
    },
  ],
]) {
  const result = render(20, { from: 10, ...props });
  assert.deepEqual(result.observed, [10, 260, ...dimensions, 30]);
  const actualStyle = Object.fromEntries(
    result.html
      .match(/style="([^"]*)"/)[1]
      .split(";")
      .map((entry) => entry.split(":")),
  );
  if (actualStyle.inset !== undefined) {
    for (const edge of ["top", "left", "right", "bottom"])
      actualStyle[edge] = actualStyle.inset;
    delete actualStyle.inset;
  }
  assert.deepEqual(actualStyle, style);
}
console.log("Remocn Sequence context and layout tests passed.");
