import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { build } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { snapcnRuntimeSource } from "./snapcn-runtime.mjs";

const result = await build({
  stdin: { contents: snapcnRuntimeSource(), loader: "js" },
  bundle: true,
  platform: "node",
  format: "cjs",
  external: ["react"],
  write: false,
});
const module = { exports: {} };
runInNewContext(result.outputFiles[0].text, {
  module,
  exports: module.exports,
  require: createRequire(import.meta.url),
});
const { OffthreadVideo, __configure } = module.exports;
__configure({ fps: 30, durationInFrames: 90 }, {}, "media-test");

for (const muted of [true, false]) {
  const html = renderToStaticMarkup(
    React.createElement(OffthreadVideo, {
      src: "recording.mp4",
      muted,
      trimBefore: 60,
      playbackRate: 1.5,
      volume: 0.3,
    }),
  );
  assert.equal(/\smuted=""/.test(html), muted);
  assert.equal(
    /data-has-audio="true"/.test(html),
    !muted,
    "HyperFrames must discover audio when the source video is unmuted",
  );
  assert.match(html, /data-media-start="2"/);
  assert.match(html, /data-playback-rate="1.5"/);
  assert.match(html, /data-volume="0.3"/);
}

console.log(
  "Snapcn video preserves audio intent, trim, playback rate and volume.",
);
