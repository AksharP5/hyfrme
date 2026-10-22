import { readFile, writeFile } from "node:fs/promises";
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
const { catalog, categoryFor, categoryLabels } = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);
const counts = Object.fromEntries(
  Object.keys(categoryLabels).map((category) => [
    category,
    category === "all"
      ? catalog.length
      : catalog.filter((entry) => categoryFor(entry) === category).length,
  ]),
);
const path = resolve(root, "src/generated/catalog-counts.json");
const output = `${JSON.stringify(counts, null, 2)}\n`;
if (process.argv.includes("--check")) {
  if ((await readFile(path, "utf8")) !== output) {
    throw new Error("Catalog counts are stale. Run npm run sync:catalog.");
  }
} else {
  await writeFile(path, output);
}
console.log(
  `Verified ${counts.all} catalog entries and their category counts.`,
);
