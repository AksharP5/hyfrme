import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { promisify } from "node:util";
import { createContext, runInContext } from "node:vm";

const root = resolve(import.meta.dirname, "..");
const slugs = [
  "t3-agent-work",
  "t3-diff-review",
  "t3-commit-review",
  "t3-message-rewind",
  "t3-prompt-send",
  "t3-commit-creation",
  "t3-git-push",
  "t3-project-action-run",
  "t3-thread-reorder",
  "t3-thread-pin",
];
const decode = (value) =>
  value
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
const variables = (source) =>
  JSON.parse(decode(source.match(/data-composition-variables='([^']*)'/)[1]));

// Execute generated initialization and draw code with media/DOM boundaries replaced,
// so visibility and readiness are checked without reimplementing the render-mode gate.
async function execute(source, overrides = {}) {
  let decodes = 0;
  const elements = [
    ...source.matchAll(
      /<(?:div|canvas|img)\b[^>]*(?:data-t3-(?:theme|pixel-theme|preload-theme)|class="[^"]*t3-stage)[^>]*>/g,
    ),
  ].map(([tag]) => {
    const dataset = Object.fromEntries(
      [...tag.matchAll(/data-([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [
        key.replace(/-([a-z])/g, (_, c) => c.toUpperCase()),
        decode(value),
      ]),
    );
    const pin = source.includes("'t3-thread-pin'");
    const rowTitles = variables(source).filter(v => ["pinThread", "firstThread", "thirdThread"].includes(v.id)).map(v => overrides[v.id] ?? v.default);
    const animation = () => ({ pause() {}, cancel() {}, ready: Promise.resolve(), currentTime: 0 });
    const rows = rowTitles.map(textContent => ({ textContent, style: {}, querySelectorAll: () => [], closest() { return this; }, animate: animation }));
    const portal = { hidden: false, querySelector: () => ({ toggleAttribute() {} }) };
    const sections = Array.from({ length: 4 }, () => ({
      hidden: false,
      contains: () => false,
      querySelectorAll: selector => pin && selector === '[data-testid="sidebar-row-card"]' ? rows : [],
      querySelector: selector => pin && selector.includes('tooltip-positioner') ? portal : pin && selector.includes('duration-200') ? {} : null,
    }));
    const popup = { hidden: true };
    return {
      dataset,
      isStage: /class="[^"]*t3-stage/.test(tag),
      hidden: tag.includes(" hidden"),
      style: { cssText: "", setProperty() {} },
      complete: true,
      naturalWidth: 14400,
      querySelectorAll: (selector) => selector === "[data-t3-state]" ? sections : [],
      querySelector: (selector) => selector === ".t3-native-popup" ? popup : null,
      setAttribute() {},
      getContext: () => ({ drawImage() {} }),
      decode: async () => {
        decodes++;
      },
    };
  });
  const canvas = source.includes('class="t3-pixel-capture"')
    ? { hidden: true, getContext: () => ({ drawImage() {} }) }
    : null;
  const stages = elements.filter((el) => el.dataset.t3Theme || el.isStage),
    captures = elements.filter((el) => el.dataset.t3PixelTheme),
    preloads = elements.filter((el) => el.dataset.t3PreloadTheme);
  if (canvas && captures.length === 0) captures.push(canvas);
  const window = {
    __hyperframes: {
      getVariables: () => ({
        ...Object.fromEntries(variables(source).map((v) => [v.id, v.default])),
        ...overrides,
      }),
    },
  };
  const document = {
    querySelector: (selector) =>
      selector === "canvas.t3-pixel-capture" ? canvas : null,
    querySelectorAll(selector) {
      if (selector.includes("preload-theme")) return preloads;
      if (selector.includes("pixel-theme")) return captures;
      if (selector.includes(".t3-stage") || selector === "#root [data-t3-theme]") return stages;
      return [];
    },
    createTreeWalker: () => ({ nextNode: () => null }),
  };
  const context = createContext({
    window,
    document,
    NodeFilter: { SHOW_TEXT: 4 },
    Image: class {
      async decode() {
        decodes++;
      }
    },
    getComputedStyle: (el) => ({
      backgroundImage: `url("capture-${el.dataset.t3PixelTheme}-${el.dataset.t3PixelRow}.webp")`,
    }),
    gsap: {
      timeline: () => ({
        to(target, settings) {
          this.target = target;
          this.update = settings.onUpdate;
          return this;
        },
        seek(time) {
          this.target.frame = time * 30;
          this.update?.();
          return this;
        },
      }),
    },
  });
  const script = [
    ...source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g),
  ]
    .map(([, body]) => body)
    .find((body) => body.includes("window.__timelines"));
  assert.ok(script, "Generated composition runtime missing");
  runInContext(script, context, { timeout: 1000 });
  await window.__hyfrmeReady;
  for (const timeline of Object.values(window.__timelines)) timeline.seek(2);
  return {
    nativeVisible: captures.some((el) => !el.hidden),
    domVisible: stages.some((el) => !el.hidden),
    decodes,
  };
}

for (const slug of slugs) {
  const source = await readFile(
    resolve(root, "registry/blocks", slug, `${slug}.html`),
    "utf8",
  );
  const timing = variables(source).find((v) => v.id.endsWith("Frame"));
  assert.ok(timing, `${slug} event control missing`);
  for (const [label, overrides, native] of [
    ["defaults", {}, true],
    ["light", { theme: "light" }, true],
    ["content", { projectName: "hyfrme-edited" }, false],
    [
      "timing",
      {
        [timing.id]:
          timing.default === timing.max
            ? timing.default - 1
            : timing.default + 1,
      },
      false,
    ],
    ["explicit DOM", { renderMode: "editable DOM" }, false],
  ]) {
    const result = await execute(source, overrides);
    assert.equal(
      result.nativeVisible,
      native,
      `${slug}/${label}: native capture visibility`,
    );
    assert.equal(
      result.domVisible,
      !native,
      `${slug}/${label}: editable DOM visibility`,
    );
    assert.equal(
      result.decodes > 0,
      native,
      `${slug}/${label}: native readiness`,
    );
  }
  if (slug === "t3-thread-pin") {
    const result = await execute(source, { seamToUnpin: 1 });
    assert.equal(result.nativeVisible, false, "Pin seam customization uses editable DOM");
    assert.equal(result.domVisible, true);
    assert.equal(result.decodes, 0);
  }
}

const scratch = await mkdtemp(join(tmpdir(), "hyfrme-t3-render-mode-"));
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    if (!pathname.startsWith("/blocks/"))
      throw new Error("Invalid registry route");
    response.end(await readFile(resolve(root, "registry", `.${pathname}`)));
  } catch {
    response.writeHead(404);
    response.end();
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
try {
  await writeFile(
    resolve(scratch, "hyperframes.json"),
    JSON.stringify({
      paths: {
        blocks: "compositions",
        components: "components",
        assets: "assets",
      },
    }),
  );
  for (const slug of ["t3-agent-work", "t3-diff-review", "t3-commit-review", "t3-thread-pin"]) {
    await promisify(execFile)(
      process.execPath,
      [
        resolve(root, "cli/bin/hyfrme.mjs"),
        "add",
        slug,
        "--dir",
        scratch,
        "--set",
        "projectName=hyfrme-installed",
      ],
      {
        env: {
          ...process.env,
          HYFRME_REGISTRY_URL: `http://127.0.0.1:${server.address().port}`,
        },
      },
    );
    const installed = await readFile(
      resolve(scratch, "compositions", `${slug}.html`),
      "utf8",
    );
    assert.equal(
      variables(installed).find((v) => v.id === "projectName").default,
      "hyfrme-installed",
    );
    assert.equal(
      variables(installed).find((v) => v.id === "renderMode").default,
      "pixel-verified",
    );
    const result = await execute(installed);
    assert.equal(
      result.nativeVisible,
      false,
      "CLI-edited metadata must trigger editable source against original defaults",
    );
    assert.equal(result.domVisible, true);
    assert.equal(result.decodes, 0);
  }
} finally {
  await new Promise((done) => server.close(done));
  await rm(scratch, { recursive: true, force: true });
}
console.log(
  "Ten T3 generated runtimes preserve native defaults/themes and apply content/timing edits, including actual CLI-installed metadata.",
);
