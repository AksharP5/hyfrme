import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const ensure = async (path, label) => {
  try {
    await access(path);
  } catch {
    throw new Error(`Missing ${label}: ${path}`);
  }
};

const registry = await readJson(resolve(root, "registry", "registry.json"));

if (!Array.isArray(registry.items) || registry.items.length === 0) {
  throw new Error("registry/registry.json must contain at least one item");
}

for (const item of registry.items) {
  const blockDirectory = resolve(root, "registry", "blocks", item.name);
  const manifestPath = resolve(blockDirectory, "registry-item.json");
  const parityPath = resolve(root, "parity", `${item.name}.json`);

  await ensure(manifestPath, `${item.name} registry manifest`);
  await ensure(parityPath, `${item.name} parity manifest`);

  const manifest = await readJson(manifestPath);
  const parity = await readJson(parityPath);

  if (manifest.name !== item.name) {
    throw new Error(
      `${item.name}: registry item name does not match catalog name`,
    );
  }

  for (const file of manifest.files ?? []) {
    await ensure(
      resolve(blockDirectory, file.path),
      `${item.name} file ${file.path}`,
    );
  }

  if (parity.status !== "verified" || parity.result?.pass !== true) {
    throw new Error(
      `${item.name}: only verified, passing ports can enter the catalog`,
    );
  }

  if (manifest.tags?.includes("icon")) {
    const showcase = parity.showcase;
    const hasHighDensityFixture =
      showcase?.fixture?.width === 384 &&
      showcase.fixture.height === 384 &&
      showcase.fixture.scale === 8;
    const hasPassingShowcase =
      showcase?.result?.pass === true &&
      showcase.result.meanSsim >= parity.thresholds.meanSsim;

    if (!hasHighDensityFixture || !hasPassingShowcase) {
      throw new Error(
        `${item.name}: icon catalog previews require a passing 384x384 showcase`,
      );
    }
  }

  await ensure(
    resolve(root, "public", "previews", item.name, "remocn.mp4"),
    `${item.name} reference preview`,
  );
  await ensure(
    resolve(root, "public", "previews", item.name, "hyperframes.mp4"),
    `${item.name} HyperFrames preview`,
  );
  await ensure(
    resolve(root, "public", "previews", item.name, "thumbnail.png"),
    `${item.name} thumbnail`,
  );
}

console.log(`Validated ${registry.items.length} verified Hyfrme port(s).`);
