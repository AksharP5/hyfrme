import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
const root = resolve(import.meta.dirname, "..");
const catalog = JSON.parse(
  await readFile(resolve(root, "src/generated/catalog-native.json"), "utf8"),
);

async function nativePreview(name) {
  globalThis.window = { location: { origin: "http://localhost:5173" } };
  const { item } = catalog.find((entry) => entry.item.name === name);
  const manifest = JSON.parse(
    await readFile(
      resolve(root, "registry/blocks", name, "registry-item.json"),
      "utf8",
    ),
  );
  const source = await readFile(
    resolve(root, "registry/blocks", name, item.sourcePath),
    "utf8",
  );
  return buildPreviewDocument(
    source,
    { ...item, files: manifest.files },
    {},
    false,
  );
}
const document = buildPreviewDocument(
  "<html><head></head><body></body></html>",
  {
    name: "demo",
    compositionId: "demo",
    dimensions: { width: 1280, height: 720 },
    files: [],
  },
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
    window.__timelines.demo = {
      pause: () => {
        paused = true;
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

test("an initialization error keeps the preview paused after load", async () => {
  const window = new EventTarget();
  const messages = [];
  const frames = [];
  let paused = false;
  let plays = 0;
  runInNewContext(bootstrap, {
    window,
    document: { querySelectorAll: () => [], body: { style: {} } },
    parent: {
      location: { origin: "https://hyfrme.example" },
      postMessage: (message) => messages.push(message),
    },
    frameElement: null,
    innerWidth: 1280,
    innerHeight: 720,
    addEventListener() {},
    requestAnimationFrame: (callback) => frames.push(callback),
    console: { error() {} },
  });
  window.__timelines.demo = {
    pause: () => {
      paused = true;
    },
    eventCallback() {},
    repeat() {
      return this;
    },
    play: () => {
      paused = false;
      plays += 1;
    },
    time: () => 0,
  };
  window.dispatchEvent(
    Object.assign(new Event("error"), {
      error: new Error("Composition initialization failed"),
    }),
  );
  window.dispatchEvent(new Event("load"));
  await new Promise(setImmediate);
  assert.equal(frames.length, 1);
  frames[0]();
  assert(paused);
  assert.equal(plays, 0);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].paused, true);
  assert.equal(messages[0].message, "Composition initialization failed");
});

test("native build readiness failures surface instead of leaving a blank preview", async () => {
  const window = new EventTarget();
  const messages = [];
  const frames = [];
  runInNewContext(bootstrap, {
    window,
    document: { querySelectorAll: () => [], body: { style: {} } },
    parent: {
      location: { origin: "https://hyfrme.example" },
      postMessage: (message) => messages.push(message),
    },
    frameElement: null,
    requestAnimationFrame: (callback) => frames.push(callback),
    console: { error() {} },
  });
  window.__hf = {
    buildReady: {
      shaders: Promise.reject(
        new Error("shaders: WebGPU unavailable (no-adapter)"),
      ),
    },
  };
  window.dispatchEvent(new Event("load"));
  await new Promise(setImmediate);
  assert.equal(frames.length, 0);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].paused, true);
  assert.equal(messages[0].message, "shaders: WebGPU unavailable (no-adapter)");
});

test("native shader preview waits for readiness and serializes seek frames", async () => {
  const preview = await nativePreview("hyperframes-liquid-metal");
  const script = preview.match(/<script>([\s\S]*?)<\/script>/)[1];
  const window = new EventTarget();
  const frames = [];
  const seeks = [];
  const finishes = [];
  let ready;
  let clock;
  let tween;
  let update;
  const timeline = {
    to(target, options) {
      clock = target;
      tween = options;
      return this;
    },
    eventCallback(_name, callback) {
      if (callback) update = callback;
    },
    repeat() {
      return this;
    },
    play() {
      return this;
    },
    time: () => clock.time,
  };
  runInNewContext(script, {
    window,
    gsap: { timeline: () => timeline },
    document: {
      querySelector: () => ({}),
      querySelectorAll: () => [],
      body: { style: {} },
    },
    parent: { location: { origin: "https://hyfrme.example" } },
    frameElement: null,
    innerWidth: 822,
    innerHeight: 461,
    addEventListener() {},
    requestAnimationFrame: (callback) => frames.push(callback),
    CustomEvent: class extends Event {
      constructor(type, { detail }) {
        super(type);
        this.detail = detail;
      }
    },
    console: { error() {} },
  });
  window.__hf = {
    buildReady: {
      shaders: new Promise((resolve) => {
        ready = resolve;
      }),
    },
  };
  window.addEventListener("hf-seek", ({ detail }) => {
    seeks.push(detail.time);
    detail.waitUntil(new Promise((resolve) => finishes.push(resolve)));
  });
  window.dispatchEvent(new Event("load"));
  await new Promise(setImmediate);
  assert.equal(frames.length, 0);
  ready();
  await new Promise(setImmediate);
  frames[0]();
  assert.equal(window.__timelines["liquid-metal"], timeline);
  assert.equal(tween.duration, 2);
  clock.time = 0.25;
  tween.onUpdate();
  clock.time = 0.5;
  tween.onUpdate();
  clock.time = 0;
  tween.onUpdate();
  assert.deepEqual(seeks, [0.25]);
  finishes.shift()();
  await new Promise(setImmediate);
  assert.deepEqual(seeks, [0.25, 0]);
  finishes.shift()();
  await new Promise(setImmediate);
  clock.time = 0.75;
  tween.onUpdate();
  assert.deepEqual(seeks, [0.25, 0, 0.75]);
  finishes.shift()();
  await new Promise(setImmediate);
  assert.equal(typeof update, "function");
});

test("actor snippets mount against composition dimensions before their script runs", async () => {
  const preview = await nativePreview("hyperframes-agent-cursor");
  const style = preview.match(/body \{([\s\S]*?)\}/)[1];
  assert.match(style, /position: relative/);
  assert.match(style, /margin: 0/);
  assert.match(style, /width: 1920px/);
  assert.match(style, /height: 1080px/);
  assert(preview.indexOf(style) < preview.indexOf("var W = root.clientWidth"));
});

test("pendulum preview runs the documented host tween without changing installed source", async () => {
  const preview = await nativePreview("hyperframes-pendulum-swing");
  const script = preview.match(/<script>([\s\S]*?)<\/script>/)[1];
  const window = new EventTarget();
  const frames = [];
  let tween;
  const timeline = {
    fromTo(selector, from, to) {
      tween = { selector, from, to };
      return this;
    },
    eventCallback() {},
    repeat() {
      return this;
    },
    play() {},
    time: () => 0,
  };
  runInNewContext(script, {
    window,
    gsap: { timeline: () => timeline },
    document: {
      querySelector: () => null,
      querySelectorAll: () => [],
      body: { style: {} },
    },
    frameElement: null,
    innerWidth: 822,
    innerHeight: 461,
    addEventListener() {},
    requestAnimationFrame: (callback) => frames.push(callback),
  });
  window.dispatchEvent(new Event("load"));
  await new Promise(setImmediate);
  frames[0]();
  assert.equal(window.__timelines["pendulum-swing"], timeline);
  assert.equal(tween.selector, ".hf-catalog-pendulum-swing");
  assert.equal(tween.from["--hf-swing-angle"], 1);
  assert.equal(tween.to["--hf-swing-angle"], 0);
  assert.equal(tween.to.duration, 2.9);
  assert.equal(tween.to.ease(0), 0);
  assert(tween.to.ease(0.25) > 1);
  assert(Math.abs(tween.to.ease(1) - 1) < 1e-12);
  assert.match(preview, /left: 50%; top: 40%; translate: -50% -50%/);
});

test("echo smear previews animate a host and attach the effect before timeline registration", async () => {
  globalThis.window = { location: { origin: "http://localhost:5173" } };
  const directory = resolve(root, "registry/blocks/hyperframes-echo-smear");
  const manifest = JSON.parse(
    await readFile(resolve(directory, "registry-item.json"), "utf8"),
  );
  const source = await readFile(resolve(directory, "echo-smear.html"), "utf8");
  const preview = buildPreviewDocument(
    source,
    {
      ...manifest,
      compositionId: manifest.origin.name,
      sourcePath: "echo-smear.html",
      dimensions: null,
      duration: null,
    },
    {},
    false,
  );
  assert.match(preview, /<div class="hf-catalog-echo-smear"/);
  const script = preview.match(/<script>([\s\S]*?)<\/script>/)[1];
  const window = new EventTarget();
  const frames = [];
  const actions = [];
  const body = { style: {} };
  const timeline = {
    fromTo(selector, from, to) {
      assert.equal(selector, ".hf-catalog-echo-smear");
      assert.notEqual(from.x, to.x);
      assert.notEqual(from.rotation, to.rotation);
      actions.push("animate");
      return this;
    },
    set(target, _values, at) {
      assert.equal(target, body);
      assert.equal(at, 2);
      actions.push("extend");
      return this;
    },
    eventCallback() {},
    repeat() {
      return this;
    },
    play() {
      assert.equal(window.__timelines["echo-smear"], timeline);
      actions.push("play");
    },
    time: () => 0,
  };
  window.attachEchoSmear = (selector, attached, options) => {
    assert.equal(selector, ".hf-catalog-echo-smear");
    assert.equal(attached, timeline);
    assert.equal(window.__timelines["echo-smear"], undefined);
    assert.equal(options.maxEchoes, 24);
    actions.push("attach");
  };
  runInNewContext(script, {
    window,
    gsap: { timeline: () => timeline },
    document: { querySelector: () => null, querySelectorAll: () => [], body },
    frameElement: null,
    innerWidth: 822,
    innerHeight: 461,
    addEventListener() {},
    requestAnimationFrame: (callback) => frames.push(callback),
  });
  window.dispatchEvent(new Event("load"));
  await new Promise(setImmediate);
  frames[0]();
  assert.deepEqual(actions, ["animate", "extend", "attach", "play"]);
});

test("preview mounts the real source template after a documentation example", () => {
  globalThis.window = { location: { origin: "http://localhost:5173" } };
  const preview = buildPreviewDocument(
    `<!-- Use <template data-slot="example">EXAMPLE</template> --><html><head></head><body><template><div id="actual">Hyfrme</div></template></body></html>`,
    {
      name: "demo",
      compositionId: "demo",
      dimensions: { width: 1920, height: 1080 },
      files: [],
    },
    {},
    false,
  );
  assert(!preview.includes("EXAMPLE"));
  assert(!preview.includes("<template"));
  assert(preview.includes('<div id="actual">Hyfrme</div>'));
});

test("native snippet previews resolve direct and concatenated declared assets", () => {
  globalThis.window = { location: { origin: "http://localhost:5173" } };
  const item = {
    name: "hyperframes-texture",
    compositionId: "texture",
    sourcePath: "texture.html",
    dimensions: null,
    files: [
      {
        path: "texture.html",
        target: "compositions/components/texture.html",
        type: "hyperframes:snippet",
      },
      {
        path: "lava.png",
        target: "compositions/components/lava.png",
        type: "hyperframes:asset",
      },
      {
        path: "assets/fonts/Caveat.woff2",
        target: "assets/fonts/Caveat.woff2",
        type: "hyperframes:asset",
      },
    ],
  };
  const preview = buildPreviewDocument(
    '<html><head><style>@font-face{src:url("assets/fonts/Caveat.woff2")}</style></head><body><img src="./compositions/components/lava.png"><script>const texture="compositions/components/" + name + ".png";</script></body></html>',
    item,
    {},
    false,
  );
  const root = "http://localhost:5173/registry/blocks/hyperframes-texture/";
  assert(preview.includes(`url("${root}assets/fonts/Caveat.woff2")`));
  assert(preview.includes(`src="${root}lava.png"`));
  assert(preview.includes(`const texture="${root}" + name + ".png"`));
});

for (const name of [
  "hyperframes-oversized-cursor",
  "hyperframes-touch-indicator",
]) {
  test(`${name} preview loads the host-provided GSAP dependency`, async () => {
    const preview = await nativePreview(name);
    const dependency =
      '<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>';
    assert(preview.includes(dependency));
    assert(preview.indexOf(dependency) < preview.lastIndexOf("gsap.timeline("));
  });
}

test("native block previews resolve bare composition-relative scripts and fonts", async () => {
  const cuboid = await nativePreview("hyperframes-cuboid-carousel");
  assert(
    cuboid.includes(
      'src="http://localhost:5173/registry/blocks/hyperframes-cuboid-carousel/assets/gsap-3.14.2.min.js"',
    ),
  );
  assert.equal((cuboid.match(/<script\b[^>]*src=[^>]*gsap/g) ?? []).length, 1);
  const weight = await nativePreview("hyperframes-weight-wave");
  assert(
    weight.includes(
      'url("http://localhost:5173/registry/blocks/hyperframes-weight-wave/assets/fonts/Recursive-wght-slnt-latin.woff2")',
    ),
  );
});

test("native importmap prefixes resolve declared nested addon modules", async () => {
  const preview = await nativePreview("hyperframes-cuboid-carousel");
  const base = preview.match(/<base href="([^"]+)">/)[1];
  const { imports } = JSON.parse(
    preview.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1],
  );
  const root =
    "http://localhost:5173/registry/blocks/hyperframes-cuboid-carousel/";
  assert.equal(base, `${root}cuboid-carousel.html`);
  for (const path of [
    "environments/RoomEnvironment.js",
    "utils/BufferGeometryUtils.js",
  ]) {
    assert.equal(
      new URL(`${imports["three/addons/"]}${path}`, base).href,
      `${root}assets/addons/${path}`,
    );
  }
});
