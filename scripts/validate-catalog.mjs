import { access, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { build } from "esbuild";

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
const upstreamInventory = await readJson(
  resolve(root, "catalog", "upstream-inventory.json"),
);
const htmlInCanvasItems = new Set(
  upstreamInventory.items
    .filter(
      (item) =>
        item.visual === true &&
        item.registryDependencies?.includes("@remocn/canvas-presentation"),
    )
    .map((item) => item.name),
);

if (!Array.isArray(registry.items) || registry.items.length === 0) {
  throw new Error("registry/registry.json must contain at least one item");
}

const [{ text: catalogModuleSource }] = (
  await build({
    entryPoints: [resolve(root, "src", "catalog.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    write: false,
  })
).outputFiles;
const catalogModule = await import(
  `data:text/javascript;base64,${Buffer.from(catalogModuleSource).toString("base64")}`
);
const unclassifiedTypography = catalogModule.catalog
  .filter((entry) => entry.item.tags.includes("typography"))
  .filter(
    (entry) => catalogModule.taxonomyFor(entry)?.section.id !== "typography",
  )
  .map((entry) => entry.item.name);

if (unclassifiedTypography.length > 0) {
  throw new Error(
    `Typography ports must be assigned to the Typography taxonomy: ${unclassifiedTypography.join(", ")}`,
  );
}

for (const item of registry.items) {
  const blockDirectory = resolve(root, "registry", "blocks", item.name);
  const manifestPath = resolve(blockDirectory, "registry-item.json");
  const parityPath = resolve(root, "parity", `${item.name}.json`);

  await ensure(manifestPath, `${item.name} registry manifest`);
  await ensure(parityPath, `${item.name} parity manifest`);

  const manifest = await readJson(manifestPath);
  const parity = await readJson(parityPath);
  const original = parity.kind === "original";

  if (original !== manifest.tags?.includes("hyfrme-original")) {
    throw new Error(
      `${item.name}: original source tag must match its evidence`,
    );
  }

  if (manifest.name !== item.name) {
    throw new Error(
      `${item.name}: registry item name does not match catalog name`,
    );
  }

  if (
    manifest.tags?.includes("html-in-canvas") !==
    htmlInCanvasItems.has(item.name)
  ) {
    throw new Error(
      `${item.name}: html-in-canvas tag must match its Remocn canvas-presentation dependency`,
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
      `${item.name}: only verified, passing components can enter the catalog`,
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

  if (original) {
    if (
      parity.checks?.hyperframes?.pass !== true ||
      parity.fixture?.width !== manifest.dimensions.width ||
      parity.fixture.height !== manifest.dimensions.height ||
      parity.fixture.durationInFrames !== parity.result.frameCount ||
      parity.fixture.durationInFrames / parity.fixture.fps !== manifest.duration
    ) {
      throw new Error(
        `${item.name}: original requires a passing check and complete render`,
      );
    }
    if (
      parity.origin.commit ||
      parity.artifacts.referenceVideo ||
      parity.artifacts.remocnVideo ||
      "meanSsim" in parity.result
    ) {
      throw new Error(`${item.name}: original must not claim upstream parity`);
    }
    await ensure(
      resolve(root, parity.artifacts.check),
      `${item.name} HyperFrames check`,
    );
    await ensure(
      resolve(root, parity.artifacts.summary),
      `${item.name} render summary`,
    );
    const [check, summary, source] = await Promise.all([
      readJson(resolve(root, parity.artifacts.check)),
      readJson(resolve(root, parity.artifacts.summary)),
      readFile(resolve(root, parity.origin.source)),
    ]);
    if (
      check.ok !== true ||
      summary.pass !== true ||
      summary.frameCount !== parity.result.frameCount ||
      summary.sourceSha256 !== createHash("sha256").update(source).digest("hex")
    ) {
      throw new Error(
        `${item.name}: original verification evidence is stale or failing`,
      );
    }
  } else {
    await ensure(
      resolve(
        root,
        parity.artifacts.referenceVideo ?? parity.artifacts.remocnVideo,
      ),
      `${item.name} reference preview`,
    );
  }
  await ensure(
    resolve(root, "public", "previews", item.name, "hyperframes.mp4"),
    `${item.name} HyperFrames preview`,
  );
  await ensure(
    resolve(root, "public", "previews", item.name, "thumbnail.png"),
    `${item.name} thumbnail`,
  );
  await ensure(
    resolve(root, "public", "previews", item.name, "thumbnail.webp"),
    `${item.name} optimized thumbnail; run npm run optimize:thumbnails`,
  );
}

console.log(`Validated ${registry.items.length} verified Hyfrme component(s).`);
