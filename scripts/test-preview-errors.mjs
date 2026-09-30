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
  await readFile(resolve(root, "src/generated/catalog-data.json"), "utf8"),
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
    assert(preview.indexOf(dependency) < preview.indexOf("gsap.timeline("));
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
