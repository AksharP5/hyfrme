import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const iconFixtures = JSON.parse(
  await readFile(resolve(root, "catalog", "icon-fixtures.json"), "utf8"),
);
const textFixtures = JSON.parse(
  await readFile(resolve(root, "catalog", "text-fixtures.json"), "utf8"),
);
const coreFixtures = JSON.parse(
  await readFile(resolve(root, "catalog", "core-fixtures.json"), "utf8"),
);
const primitiveFixtures = JSON.parse(
  await readFile(resolve(root, "catalog", "primitive-fixtures.json"), "utf8"),
);
const orderedNames = [
  "soft-blur-in",
  ...textFixtures.map((entry) => entry.slug),
  ...coreFixtures.map((entry) => entry.slug),
  ...primitiveFixtures.map((entry) => entry.slug),
  ...iconFixtures.map((entry) => entry.slug),
];
const items = [];

for (const name of orderedNames) {
  const parity = JSON.parse(
    await readFile(resolve(root, "parity", `${name}.json`), "utf8"),
  );
  if (parity.status !== "verified" || parity.result?.pass !== true) continue;
  items.push({ name, type: "hyperframes:block" });
}

await writeFile(
  resolve(root, "registry", "registry.json"),
  `${JSON.stringify(
    {
      $schema: "https://hyperframes.heygen.com/schema/registry.json",
      name: "hyfrme",
      homepage: "https://hyfrme.vercel.app",
      items,
    },
    null,
    2,
  )}\n`,
);

console.log(`Published ${items.length} verified block(s) to registry.json.`);
