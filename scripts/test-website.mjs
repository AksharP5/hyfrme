import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { build } from "esbuild";

const root = resolve(import.meta.dirname, "..");
const result = await build({
  stdin: {
    contents: `
      export { App } from "./src/App";
      export { InstallPanel } from "./src/components/InstallPanel";
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
const { App, InstallPanel, createElement, renderToStaticMarkup } = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

test("malformed component and showcase links render the missing-page fallback", () => {
  for (const collection of ["components", "showcases"]) {
    for (const slug of ["%", "%E0%A4%A", "unknown-component"]) {
      globalThis.window = {
        location: { pathname: `/${collection}/${slug}`, search: "" },
      };
      const page = renderToStaticMarkup(createElement(App));
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
    const page = renderToStaticMarkup(createElement(App));
    assert(page.includes(heading));
    assert(!page.includes("That component is not here."));
  }
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
