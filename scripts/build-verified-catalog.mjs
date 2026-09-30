import { readFile, readdir, writeFile } from "node:fs/promises";
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
const snapcnFixtures = JSON.parse(
  await readFile(resolve(root, "catalog", "snapcn-fixtures.json"), "utf8"),
);
const blockDirectory = resolve(root, "registry", "blocks");
const blockItems = await Promise.all(
  (await readdir(blockDirectory)).map(async (name) =>
    JSON.parse(
      await readFile(
        resolve(blockDirectory, name, "registry-item.json"),
        "utf8",
      ),
    ),
  ),
);
const officialItems = blockItems.filter(
  (item) =>
    item.origin?.repository === "https://github.com/heygen-com/hyperframes",
);
const originalItems = blockItems.filter((item) =>
  item.tags?.includes("hyfrme-original"),
);
const t3Items = blockItems.filter((item) => item.tags?.includes("t3-code"));
const orderedNames = [
  ...originalItems.map((item) => item.name).sort(),
  ...t3Items.map((item) => item.name).sort(),
  "soft-blur-in",
  ...textFixtures.map((entry) => entry.slug),
  ...coreFixtures.map((entry) => entry.slug),
  ...primitiveFixtures.map((entry) => entry.slug),
  ...iconFixtures.map((entry) => entry.slug),
  ...snapcnFixtures.map((entry) => entry.slug),
];
const items = [];

for (const name of orderedNames) {
  const proof = await readFile(
    resolve(root, "parity", `${name}.json`),
    "utf8",
  ).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (!proof) continue;
  const parity = JSON.parse(proof);
  if (parity.status !== "verified" || parity.result?.pass !== true) continue;
  items.push({ name, type: "hyperframes:block" });
}

items.push(
  ...officialItems
    .sort((left, right) => left.name.localeCompare(right.name))
    .map(({ name, type }) => ({ name, type })),
);

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

console.log(
  `Published ${items.length} verified ports and native official item(s) to registry.json.`,
);
