import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { build } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { snapcnRuntimeSource } from "./snapcn-runtime.mjs";

const result = await build({
  stdin: {
    contents: snapcnRuntimeSource(),
    loader: "js",
    resolveDir: import.meta.dirname,
  },
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
const { OffthreadVideo, __configure, __setFrame } = module.exports;
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

__configure({ fps: 30, durationInFrames: 240 }, {}, "media-test", {
  "recording.mp4": { src: "final.png", duration: 5 },
});
for (const [frame, ended] of [
  [149, false],
  [150, true],
  [239, true],
  [0, false],
]) {
  __setFrame(frame);
  const html = renderToStaticMarkup(
    React.createElement(OffthreadVideo, { src: "recording.mp4", muted: true }),
  );
  assert.equal(/<video\b/.test(html), !ended);
  assert.equal(/<img[^>]*display:none/.test(html), !ended);
  assert.match(html, /src="final.png"/);
}
__setFrame(100);
assert.match(
  renderToStaticMarkup(
    React.createElement(OffthreadVideo, {
      src: "recording.mp4",
      muted: true,
      trimBefore: 10,
      playbackRate: 1.5,
    }),
  ),
  /<img[^>]*src="final.png"/,
);

console.log(
  "Snapcn video preserves audio, trim, rate, volume and the source's final-frame hold when seeking.",
);
