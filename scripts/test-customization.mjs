import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { build } from "esbuild";

const root = resolve(import.meta.dirname, "..");
const result = await build({
  entryPoints: [resolve(root, "src/lib/customization.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});
const {
  buildInstallCommand,
  parseCompositionVariables,
  valuesFromUrl,
  customizedSource,
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
