import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

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
    const native =
      item.origin?.repository === "https://github.com/heygen-com/hyperframes";
    const parity = native
      ? null
      : await readJson(resolve(parityDirectory, `${name}.json`));
    const primary =
      item.files.find((file) => file.target === "index.html") ??
      item.files.find(
        (file) =>
          file.type === "hyperframes:composition" ||
          file.type === "hyperframes:snippet",
      );
    if (!primary) throw new Error(`${name}: missing HTML source`);
    const source = await readFile(
      resolve(blocksDirectory, name, primary.path),
      "utf8",
    );
    const compositionId = native
      ? (source
          .replace(/<!--[\s\S]*?-->/g, "")
          .match(/data-composition-id=['"]([^'"]+)['"]/)?.[1] ??
        item.origin.name)
      : name;
    const localPreview =
      native && item.type === "hyperframes:example"
        ? {
            poster: `/previews/${name}/thumbnail.webp`,
            video: `/previews/${name}/hyperframes.mp4`,
          }
        : null;
    const comparison =
      item.tags?.includes("icon") &&
      parity?.showcase?.artifacts?.referenceVideo &&
      parity.showcase.artifacts.hyperframesVideo
        ? parity.showcase
        : parity;

    return {
      item,
      sourcePath: primary.path,
      sourceTarget: primary.target,
      compositionId,
      preview:
        localPreview ??
        item.preview ??
        (native
          ? { poster: null, video: null }
          : {
              poster: `/previews/${name}/thumbnail.webp`,
              video: `/previews/${name}/hyperframes.mp4`,
            }),
      sourceRepository: native
        ? item.origin.repository
        : parity.origin.repository,
      parity:
        !parity || parity.kind === "original"
          ? null
          : {
              slug: parity.slug,
              origin: {
                repository: parity.origin.repository,
                commit: parity.origin.commit,
                source: parity.origin.source,
              },
              artifacts: {
                referenceVideo: (
                  comparison.artifacts.referenceVideo ??
                  comparison.artifacts.remocnVideo
                ).replace(/^public\//, "/"),
                hyperframesVideo: comparison.artifacts.hyperframesVideo.replace(
                  /^public\//,
                  "/",
                ),
              },
              result: {
                frameCount: comparison.result.frameCount,
                meanSsim: comparison.result.meanSsim,
                pass: comparison.result.pass,
              },
            },
    };
  }),
);

entries.sort((left, right) => left.item.title.localeCompare(right.item.title));
const summaries = entries.map(
  ({
    item,
    sourceRepository,
    sourcePath,
    sourceTarget,
    compositionId,
    preview,
  }) => ({
    item: {
      name: item.name,
      type: item.type,
      sourcePath,
      sourceTarget,
      compositionId,
      preview: { poster: preview.poster ?? null, video: preview.video ?? null },
      origin: item.origin ?? null,
      title: item.title,
      description: item.description,
      tags: item.tags,
      dimensions: item.dimensions ?? null,
      duration: item.duration ?? null,
    },
    sourceRepository,
  }),
);
const output = `${JSON.stringify(summaries, null, 2)}\n`;

if (checking) {
  const current = await readFile(outputPath, "utf8").catch((error) => {
    if (error.code === "ENOENT") return "";
    throw error;
  });
  if (current !== output)
    throw new Error(
      "src/generated/catalog-data.json is stale. Run npm run sync:catalog.",
    );
} else {
  await mkdir(resolve(root, "src", "generated"), { recursive: true });
  await writeFile(outputPath, output);
}

if (!checking)
  await Promise.all(
    entries.map(
      async ({
        item,
        parity,
        sourcePath,
        sourceTarget,
        compositionId,
        preview,
      }) => {
        const path = resolve(
          root,
          "public/registry/blocks",
          item.name,
          "catalog.json",
        );
        const details = `${JSON.stringify({ item: { ...item, sourcePath, sourceTarget, compositionId, preview, dimensions: item.dimensions ?? null, duration: item.duration ?? null, origin: item.origin ?? null }, parity })}\n`;
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, details);
      },
    ),
  );
console.log(
  `${checking ? "Verified catalog summaries" : "Generated catalog summaries and details"} for ${entries.length} items.`,
);
