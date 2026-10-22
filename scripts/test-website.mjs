import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { build } from "esbuild";

const root = resolve(import.meta.dirname, "..");
const result = await build({
  stdin: {
    contents: `
      export { App } from "./src/App";
      export { CatalogPages } from "./src/CatalogPages";
      export { InstallPanel } from "./src/components/InstallPanel";
      export { LivePreview } from "./src/components/LivePreview";
      export { createElement } from "react";
      export { renderToStaticMarkup } from "react-dom/server";
    `,
    resolveDir: root,
  },
  bundle: true,
  platform: "node",
  format: "esm",
  banner: {
    js: `import { createRequire } from "node:module"; const require = createRequire(${JSON.stringify(resolve(root, "package.json"))});`,
  },
  write: false,
});
const {
  App,
  CatalogPages,
  InstallPanel,
  LivePreview,
  createElement,
  renderToStaticMarkup,
} = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

test("canvas previews preserve upstream browser fallbacks and customized inputs", async () => {
  const item = JSON.parse(
    await readFile(
      resolve(root, "registry/blocks/tv-power-off/registry-item.json"),
      "utf8",
    ),
  );
  Object.assign(item, {
    compositionId: "tv-power-off",
    sourcePath: "tv-power-off.html",
    preview: { video: "/previews/tv-power-off/hyperframes.mp4" },
  });
  const source = await readFile(
    resolve(root, "registry/blocks/tv-power-off/tv-power-off.html"),
    "utf8",
  );
  globalThis.window = { location: { origin: "https://hyfrme.example" } };
  globalThis.document = { createElement: () => ({ getContext: () => ({}) }) };
  try {
    const page = renderToStaticMarkup(
      createElement(LivePreview, { item, source, values: { gain: 0 } }),
    );
    assert.match(page, /<iframe\b/);
    assert.doesNotMatch(page, /<video\b/);
    assert.match(page, /Browser fallback/);
    assert.match(page, /&quot;gain&quot;:0/);
    assert.match(page, /GeistMono-Latin\.woff2/);

    const native = renderToStaticMarkup(
      createElement(LivePreview, {
        item: { ...item, tags: ["html-in-canvas", "hyperframes-official"] },
        source,
        values: {},
      }),
    );
    assert.match(native, /<video\b/);
    assert.match(native, /Showing default settings/);
  } finally {
    delete globalThis.document;
  }
});

test("malformed component and showcase links render the missing-page fallback", () => {
  for (const collection of ["components", "showcases"]) {
    for (const slug of ["%", "%E0%A4%A", "unknown-component"]) {
      globalThis.window = {
        location: { pathname: `/${collection}/${slug}`, search: "" },
      };
      const page = renderToStaticMarkup(
        createElement(collection === "components" ? CatalogPages : App, {
          cliPackage: "hyfrme@latest",
        }),
      );
      assert.match(page, /That component is not here\./);
      assert.match(page, /Browse all components/);
    }
  }
});

test("valid encoded slugs still resolve their catalog pages", () => {
  for (const [pathname, heading] of [
    ["/components/%6Datrix-decode", "Matrix Decode"],
    ["/showcases/%69ntroducing-nextjs", "Introducing Next.js"],
  ]) {
    globalThis.window = {
      location: {
        pathname,
        search: "",
        origin: "https://hyfrme.example",
      },
      localStorage: { getItem: () => null },
    };
    const page = renderToStaticMarkup(
      createElement(pathname.startsWith("/components/") ? CatalogPages : App, {
        cliPackage: "hyfrme@latest",
      }),
    );
    assert(page.includes(heading));
    assert(!page.includes("That component is not here."));
  }
});

test("homepage startup excludes the catalog, its metadata, and the editor", async () => {
  const result = await build({
    entryPoints: [resolve(root, "src/main.tsx")],
    bundle: true,
    splitting: true,
    format: "esm",
    platform: "browser",
    minify: true,
    metafile: true,
    write: false,
    outdir: resolve(root, ".work/website-bundle-test"),
    loader: { ".css": "empty" },
  });
  const outputs = result.metafile.outputs;
  const entry = Object.entries(outputs).find(
    ([, output]) => output.entryPoint === "src/main.tsx",
  );
  assert(entry, "Missing browser entry point");
  const visited = new Set();
  const inputs = new Set();
  const visit = (path) => {
    if (visited.has(path)) return;
    visited.add(path);
    const output = outputs[path];
    for (const input of Object.keys(output.inputs)) inputs.add(input);
    for (const dependency of output.imports) {
      if (dependency.kind === "import-statement" && !dependency.external)
        visit(dependency.path);
    }
  };
  visit(entry[0]);
  for (const input of inputs) {
    assert(
      !/src\/(?:catalog\.ts|CatalogPages\.tsx|generated\/catalog-(?:native|ports)\.json|components\/ComponentEditor\.tsx)$/.test(
        input,
      ),
      `Loaded catalog code during homepage startup: ${input}`,
    );
  }
  const bytes = [...visited].reduce(
    (total, path) => total + outputs[path].bytes,
    0,
  );
  assert(bytes < 350_000, `Homepage startup JavaScript grew to ${bytes} bytes`);
});

test("installation stays usable when browser storage is denied", () => {
  globalThis.window = {
    get localStorage() {
      throw new DOMException("Storage is blocked", "SecurityError");
    },
  };
  const panel = renderToStaticMarkup(
    createElement(InstallPanel, {
      commands: {
        prompt: "Install matrix-decode",
        npm: "npx hyfrme@latest add matrix-decode",
        pnpm: "pnpm dlx hyfrme@latest add matrix-decode",
        yarn: "yarn dlx hyfrme@latest add matrix-decode",
        bun: "bunx hyfrme@latest add matrix-decode",
      },
      customized: false,
    }),
  );
  assert.match(panel, /aria-selected="true">npm<\/button>/);
  assert.match(panel, /npx hyfrme@latest add matrix-decode/);
});
