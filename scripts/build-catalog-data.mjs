import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { assertExactCompiledParity } from "./compiled-parity.mjs";
import { assertVerifiedBlockFiles } from "./parity-evidence.mjs";

const root = resolve(import.meta.dirname, "..");
const blocksDirectory = resolve(root, "registry", "blocks");
const parityDirectory = resolve(root, "parity");
const outputPath = resolve(root, "src", "generated", "catalog-data.json");
const args = process.argv.slice(2);
const checking = args.includes("--check");
const selected = new Set();
for (let index = 0; index < args.length; index++) {
  if (args[index] === "--check") continue;
  if (
    args[index] !== "--only" ||
    !args[index + 1] ||
    args[index + 1].startsWith("--")
  )
    throw new Error(
      "Usage: build-catalog-data.mjs [--check] [--only name[,name]]",
    );
  for (const name of args[++index].split(",")) {
    if (!name) throw new Error("--only requires an item name");
    selected.add(name);
  }
}

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const registry = await readJson(resolve(root, "registry/registry.json"));
const names = registry.items.map((entry) => entry.name);
for (const name of selected)
  if (!names.includes(name)) throw new Error(`Unknown catalog item: ${name}`);
const directories = selected.size
  ? names.filter((name) => selected.has(name))
  : names;

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
    if (
      parity &&
      (parity.status !== "verified" ||
        parity.result?.pass !== true ||
        (parity.kind !== "original" &&
          (typeof (
            parity.artifacts?.referenceVideo ?? parity.artifacts?.remocnVideo
          ) !== "string" ||
            typeof parity.artifacts?.hyperframesVideo !== "string")))
    )
      throw new Error(
        `${name}: catalog generation requires a passing parity proof and preview videos`,
      );
    if (parity?.classification === "compiled-source-port") {
      assertExactCompiledParity(parity);
      await assertVerifiedBlockFiles(
        resolve(blocksDirectory, name),
        item,
        parity.filesSha256,
      );
    }
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
                  parity.artifacts.referenceVideo ??
                  parity.artifacts.remocnVideo
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
let summaries = entries.map(
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
if (selected.size) {
  const current = await readJson(outputPath);
  const replacements = new Map(
    summaries.map((entry) => [entry.item.name, entry]),
  );
  summaries = current.map(
    (entry) => replacements.get(entry.item.name) ?? entry,
  );
  const existing = new Set(current.map((entry) => entry.item.name));
  summaries.push(
    ...[...replacements.values()].filter(
      (entry) => !existing.has(entry.item.name),
    ),
  );
  summaries.sort((left, right) =>
    left.item.title.localeCompare(right.item.title),
  );
}
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

if (!checking || selected.size)
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
        if (checking) {
          const current = await readFile(path, "utf8").catch((error) => {
            if (error.code === "ENOENT") return "";
            throw error;
          });
          if (current !== details)
            throw new Error(
              `${item.name}: catalog details are stale. Run npm run sync:catalog -- --only ${item.name}.`,
            );
          return;
        }
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, details);
      },
    ),
  );
console.log(
  `${checking ? "Verified catalog summaries" : "Generated catalog summaries and details"} for ${entries.length} items.`,
);
