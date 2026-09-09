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
const { catalogTaxonomy, categoryFor, taxonomyFor } = await import(
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

const orbit = taxonomyFor({ item: { name: "snapcn-orbit-gallery" } });
assert.equal(orbit.section.label, "Scenes");
assert.equal(orbit.group.label, "Galleries");
for (const name of ["snapcn-logo-flicker", "logo-enter"]) {
  assert.equal(taxonomyFor({ item: { name } }).section.label, "Logos");
}

console.log(
  `Catalog taxonomy passed: ${entries.length} blocks, ${assigned.size} named placements.`,
);
