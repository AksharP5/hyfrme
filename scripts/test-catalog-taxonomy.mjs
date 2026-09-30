import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = resolve(import.meta.dirname, "..");
const result = await build({
  entryPoints: [resolve(root, "src/catalog.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});
const {
  catalog,
  catalogTaxonomy,
  hyperframesTaxonomy,
  categoryFor,
  taxonomyFor,
} = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);
const directories = await readdir(resolve(root, "registry/blocks"), {
  withFileTypes: true,
});
const entries = await Promise.all(
  directories
    .filter((directory) => directory.isDirectory())
    .map(async (directory) => ({
      item: JSON.parse(
        await readFile(
          resolve(
            root,
            "registry/blocks",
            directory.name,
            "registry-item.json",
          ),
          "utf8",
        ),
      ),
    })),
);
const names = new Set(entries.map(({ item }) => item.name));
const assigned = new Set();

for (const sections of Object.values(catalogTaxonomy)) {
  for (const section of sections) {
    const slugs = [
      ...(section.slugs ?? []),
      ...(section.groups ?? []).flatMap((group) => group.slugs),
    ];
    assert(
      slugs.includes(section.featuredSlug),
      `${section.id}: missing featured item`,
    );
    for (const slug of slugs) {
      assert(
        names.has(slug),
        `${slug}: taxonomy references an unavailable block`,
      );
      assert(!assigned.has(slug), `${slug}: assigned more than once`);
      assigned.add(slug);
    }
  }
}

for (const entry of entries) {
  if (categoryFor(entry) === "shaders") {
    assert(
      !assigned.has(entry.item.name),
      `${entry.item.name}: shader in component taxonomy`,
    );
    continue;
  }
  assert(taxonomyFor(entry), `${entry.item.name}: missing catalog placement`);
}

for (const [name, category] of [
  ["hyperframes-data-chart", "components"],
  ["hyperframes-spring-pop", "components"],
  ["hyperframes-product-promo", "templates"],
]) {
  const entry = catalog.find((entry) => entry.item.name === name);
  assert(entry, `${name}: official item missing`);
  assert.equal(entry.source.id, "hyperframes");
  assert.equal(categoryFor(entry), category);
  assert(taxonomyFor(entry));
}

const navigation = JSON.parse(
  await readFile(resolve(root, "catalog/hyperframes-navigation.json"), "utf8"),
);
const officialEntries = catalog.filter(
  (entry) => entry.source.id === "hyperframes",
);
const available = new Set(officialEntries.map((entry) => entry.item.name));
const namesForPages = (pages) =>
  pages
    .map((page) => `hyperframes-${page.split("/").at(-1)}`)
    .filter((name) => available.has(name));
assert.equal(officialEntries.length, 394);
for (const [index, upstream] of navigation.groups.entries()) {
  const section = hyperframesTaxonomy[index];
  assert.equal(section.label, upstream.label);
  if (upstream.groups.length) {
    assert.deepEqual(
      section.groups.map((group) => ({
        label: group.label,
        slugs: group.slugs,
      })),
      upstream.groups.map((group) => ({
        label: group.label,
        slugs: namesForPages(group.items),
      })),
    );
  } else {
    assert.deepEqual(section.slugs, namesForPages(upstream.items));
  }
}
assert.equal(hyperframesTaxonomy.length, navigation.groups.length + 1);
assert.deepEqual(hyperframesTaxonomy.at(-1).slugs, [
  "hyperframes-colorama-wipe",
]);
for (const [name, section, group] of [
  ["hyperframes-caption-highlight", "Text & captions", "Captions"],
  ["hyperframes-mk-callout-highlight", "Text & captions", "Captions"],
  ["hyperframes-code-morph", "Code", "Code Animations"],
  ["hyperframes-terminal-simulator", "Code", "Code Animations"],
  ["hyperframes-spring-pop", "Scenes & demos", "Motion Scenes"],
]) {
  const taxonomy = taxonomyFor({ item: { name } });
  assert.equal(taxonomy.category, "components");
  assert.equal(taxonomy.section.label, section);
  assert.equal(taxonomy.group.label, group);
}

const orbit = taxonomyFor({ item: { name: "snapcn-orbit-gallery" } });
assert.equal(orbit.section.label, "Scenes");
assert.equal(orbit.group.label, "Galleries");
for (const name of ["snapcn-logo-flicker", "logo-enter"]) {
  assert.equal(taxonomyFor({ item: { name } }).section.label, "Logos");
}

for (const [name, group] of [
  ["screen-lift", "device-frames"],
  ["before-after", "split-layouts"],
]) {
  const original = catalog.find((entry) => entry.item.name === name);
  assert(original, `${name}: must be listed in the catalog`);
  assert.equal(original.source.id, "hyfrme");
  assert.equal(taxonomyFor(original).group.id, group);
  const evidence = JSON.parse(
    await readFile(resolve(root, "parity", `${name}.json`), "utf8"),
  );
  assert.equal(evidence.kind, "original");
  assert.equal(evidence.artifacts.referenceVideo, undefined);
  assert.equal(evidence.result.meanSsim, undefined);
}

console.log(
  `Catalog taxonomy passed: ${entries.length} blocks, ${assigned.size} named placements.`,
);
