import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { build } from "esbuild";

const root = resolve(import.meta.dirname, "..");
const result = await build({
  stdin: {
    contents: `
      export * from "./src/lib/customization";
      export { Customizer } from "./src/components/Customizer";
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
  buildInstallCommand,
  parseCompositionVariables,
  valuesFromUrl,
  customizedSource,
  numberBounds,
  Customizer,
  createElement,
  renderToStaticMarkup,
} = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);
const periodDropVariables = parseCompositionVariables(
  await readFile(
    resolve(root, "registry/blocks/period-drop/period-drop.html"),
    "utf8",
  ),
);
const wordWheelVariables = parseCompositionVariables(
  await readFile(
    resolve(root, "registry/blocks/snapcn-word-wheel/snapcn-word-wheel.html"),
    "utf8",
  ),
);

globalThis.window = { location: { search: "" } };

test("shared links produce installable numbers within the declared limits", () => {
  window.location.search =
    "?v.fontSize=999&v.speed=-1&v.dotSize=NaN&v.fontWeight=";
  const values = valuesFromUrl(periodDropVariables);
  assert.equal(values.fontSize, 280);
  assert.equal(values.speed, 0.25);
  assert.equal(values.dotSize, 0.2);
  assert.equal(values.fontWeight, 800);
  assert.equal(
    buildInstallCommand(
      "hyfrme@latest",
      "period-drop",
      periodDropVariables,
      values,
    ),
    "npx hyfrme@latest add period-drop --set 'fontSize=280' --set 'speed=0.25'",
  );
});

test("shared links preserve valid settings and restore unsupported choices", () => {
  window.location.search =
    "?v.spin=12&v.mode=dark&v.fontFamily=missing&v.headline=Hyfrme%20%26%20you";
  const values = valuesFromUrl(wordWheelVariables);
  assert.equal(values.spin, 12);
  assert.equal(values.mode, "dark");
  assert.equal(values.fontFamily, "Default");
  assert.equal(values.headline, "Hyfrme & you");
});

test("malformed boolean settings retain the default", () => {
  const variables = [{ id: "enabled", type: "boolean", default: true }];
  window.location.search = "?v.enabled=invalid";
  assert.equal(valuesFromUrl(variables).enabled, true);
  window.location.search = "?v.enabled=false";
  assert.equal(valuesFromUrl(variables).enabled, false);
});

test("shared color and font weight values remain visible in their controls", async () => {
  const variables = parseCompositionVariables(
    await readFile(
      resolve(root, "registry/blocks/infinite-marquee/infinite-marquee.html"),
      "utf8",
    ),
  );
  window.location.search = "?v.color=%2300000000&v.fontWeight=900";
  const values = valuesFromUrl(variables);
  const controls = renderToStaticMarkup(
    createElement(Customizer, {
      item: { tags: [] },
      variables,
      values,
      onChange() {},
      onReset() {},
      shareUrl: "https://hyfrme.example/components/infinite-marquee",
    }),
  );
  assert.match(
    controls,
    /id="control-color" type="text"[^>]*value="#00000000"/,
  );
  assert.match(controls, /<option value="900" selected="">900<\/option>/);
  assert.match(
    buildInstallCommand("hyfrme@latest", "infinite-marquee", variables, values),
    /--set 'color=#00000000' --set 'fontWeight=900'/,
  );
});

test("official enum and image variables normalize to installable controls", () => {
  const variables = parseCompositionVariables(
    `<html data-composition-variables='[{"id":"direction","type":"enum","default":"out","options":[{"value":"out","label":"Out"},{"value":"in","label":"In"}]},{"id":"logo","type":"image","default":"assets/logo.svg"},{"id":"title","type":"string","default":"Hi","maxLength":4}]'>`,
  );
  const copied = customizedSource(
    `<html data-composition-variables='[{"id":"direction","type":"enum","role":"timing","default":"out","options":[{"value":"out","label":"Out"},{"value":"in","label":"In"}]}]'>`,
    { direction: "in" },
  );
  assert.match(copied, /"type":"enum"/);
  assert.match(copied, /"role":"timing"/);
  assert.equal(parseCompositionVariables(copied)[0].default, "in");
  assert.equal(variables[0].type, "string");
  assert.deepEqual(variables[0].options, ["out", "in"]);
  assert.equal(variables[1].type, "string");
  window.location.search =
    "?v.direction=in&v.logo=assets/new.svg&v.title=Longer";
  const values = valuesFromUrl(variables);
  assert.deepEqual(values, {
    direction: "in",
    logo: "assets/new.svg",
    title: "Long",
  });
  assert.match(
    buildInstallCommand("hyfrme@latest", "hyperframes-test", variables, values),
    /--set 'direction=in'/,
  );
  window.location.search = "?v.direction=sideways";
  assert.equal(valuesFromUrl(variables).direction, "out");
});

test("copied Touch Indicator source keeps both runtime variable carriers in sync", async () => {
  const source = await readFile(
    resolve(
      root,
      "registry/blocks/hyperframes-touch-indicator/touch-indicator.html",
    ),
    "utf8",
  );
  const example = `<!-- Example: data-composition-variables='[{"id":"gesture","type":"enum","default":"tap"}]' -->`;
  const copied = customizedSource(example + source, { gesture: "swipe" });
  assert(copied.startsWith(example));
  const carriers = [
    ...copied
      .replace(/<!--[\s\S]*?-->/g, "")
      .matchAll(/data-composition-variables='([^']*)'/g),
  ].map((match) => JSON.parse(match[1]));
  assert.equal(carriers.length, 2);
  for (const variables of carriers) {
    const gesture = variables.find((variable) => variable.id === "gesture");
    assert.equal(gesture.default, "swipe");
    assert.equal(gesture.type, "enum");
    assert.deepEqual(gesture.options, [
      { value: "tap", label: "Tap" },
      { value: "swipe", label: "Swipe" },
    ]);
  }
});

test("angle sliders preserve negative defaults and allow either direction", async () => {
  for (const [name, id] of [
    ["page-turn", "angle"],
    ["crumple-toss", "direction"],
  ]) {
    const source = await readFile(
      resolve(root, "registry/blocks", name, `${name}.html`),
      "utf8",
    );
    const variable = parseCompositionVariables(source).find(
      (variable) => variable.id === id,
    );
    const bounds = numberBounds(variable, { tags: [] });
    assert(bounds.min <= variable.default);
    assert(bounds.max > 0);
    assert.equal(bounds.step, 1);
  }
});
