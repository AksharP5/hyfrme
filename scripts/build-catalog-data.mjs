import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const blocksDirectory = resolve(root, "registry", "blocks");
const parityDirectory = resolve(root, "parity");
const outputPath = resolve(root, "src", "generated", "catalog-data.json");
const checking = process.argv.includes("--check");

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const registry = await readJson(resolve(root, "registry/registry.json"));
const directories = registry.items.map((entry) => entry.name);

const entries = await Promise.all(
  directories.map(async (name) => {
    const item = await readJson(
      resolve(blocksDirectory, name, "registry-item.json"),
    );
    const parity = await readJson(resolve(parityDirectory, `${name}.json`));

    return {
      item: {
        name: item.name,
        title: item.title,
        description: item.description,
        tags: item.tags,
        dimensions: item.dimensions,
        duration: item.duration,
      },
      parity: {
        slug: parity.slug,
        origin: {
          repository: parity.origin.repository,
          commit: parity.origin.commit,
          source: parity.origin.source,
        },
        artifacts: {
          referenceVideo: (
            parity.artifacts.referenceVideo ?? parity.artifacts.remocnVideo
          ).replace(/^public\//, "/"),
          hyperframesVideo: parity.artifacts.hyperframesVideo.replace(
            /^public\//,
            "/",
          ),
        },
        result: {
          frameCount: parity.result.frameCount,
          meanSsim: parity.result.meanSsim,
          pass: parity.result.pass,
        },
      },
    };
  }),
);

entries.sort((left, right) => left.item.title.localeCompare(right.item.title));
const output = `${JSON.stringify(entries, null, 2)}\n`;

if (checking) {
  const current = await readFile(outputPath, "utf8").catch(() => "");
  if (current !== output) {
    throw new Error(
      "src/generated/catalog-data.json is stale. Run npm run sync:catalog.",
    );
  }
  console.log(
    `Verified lightweight catalog data for ${entries.length} blocks.`,
  );
} else {
  await mkdir(resolve(root, "src", "generated"), { recursive: true });
  await writeFile(outputPath, output);
  console.log(
    `Generated lightweight catalog data for ${entries.length} blocks.`,
  );
}
