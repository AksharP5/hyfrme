import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { build } from "esbuild";

const result = await build({
  entryPoints: [resolve(import.meta.dirname, "../src/lib/customization.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});
const { buildPreviewDocument } = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);
const document = buildPreviewDocument(
  "<html><head></head><body></body></html>",
  { name: "demo", dimensions: { width: 1280, height: 720 }, files: [] },
  {},
  false,
);
const bootstrap = document.match(/<script>([\s\S]*?)<\/script>/)[1];

for (const type of ["error", "unhandledrejection"]) {
  test(`${type} after timeline startup reports the failure and pauses playback`, () => {
    const window = new EventTarget();
    const messages = [];
    let paused = false;
    let mediaPaused = false;
    runInNewContext(bootstrap, {
      window,
      document: {
        querySelectorAll: () => [
          {
            pause: () => {
              mediaPaused = true;
            },
          },
        ],
      },
      parent: {
        location: { origin: "https://hyfrme.example" },
        postMessage: (message, origin) => messages.push({ ...message, origin }),
      },
      console: { error() {} },
    });
    window.__timelines = {
      demo: {
        pause: () => {
          paused = true;
        },
      },
    };
    const error = new Error("WebGL2 is unavailable");
    window.dispatchEvent(
      Object.assign(new Event(type), {
        [type === "error" ? "error" : "reason"]: error,
      }),
    );
    assert(paused);
    assert(mediaPaused);
    assert.deepEqual(messages, [
      {
        type: "hyfrme-preview-error",
        message: error.message,
        paused: true,
        origin: "https://hyfrme.example",
      },
    ]);
  });
}
