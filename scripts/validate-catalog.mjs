import { access, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { build } from "esbuild";
import { parseHyperframesVariables } from "./hyperframes-variables.mjs";
import { iconShowcaseThreshold } from "./icon-showcase-history.mjs";
import {
  assertFreshCompiledEvidence,
  hasFreshCompiledEvidence,
} from "./fresh-parity-evidence.mjs";

const root = resolve(import.meta.dirname, "..");
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const ensure = async (path, label) => {
  try {
    await access(path);
  } catch {
    throw new Error(`Missing ${label}: ${path}`);
  }
};

const nativeInventory = await readJson(
  resolve(root, "catalog/hyperframes-upstream.json"),
);
const templatePreviews = await readJson(
  resolve(root, "catalog/hyperframes-template-previews.json"),
);
const templateRecords = new Map(
  templatePreviews.items.map((record) => [record.name, record]),
);
const nativeRepository = "https://github.com/heygen-com/hyperframes";
const nativeRecords = new Map(
  nativeInventory.items.map((record) => [record.name, record]),
);
if (
  nativeInventory.summary.importedItems !==
    nativeInventory.summary.totalCatalogItems ||
  nativeInventory.summary.missingFiles.length
) {
  throw new Error("The official HyperFrames catalog import is incomplete.");
}

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
  .filter(
    (entry) =>
      entry.source.id !== "hyperframes" &&
      entry.item.tags.includes("typography"),
  )
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
  const manifest = await readJson(manifestPath);
  if (manifest.origin?.repository === nativeRepository) {
    const record = nativeRecords.get(item.name);
    if (
      !record ||
      record.status !== "imported" ||
      record.type !== item.type ||
      record.type !== manifest.type ||
      manifest.name !== item.name ||
      manifest.origin.commit !== nativeInventory.summary.upstream.commit ||
      manifest.origin.source !== record.upstreamManifest.path ||
      !manifest.tags.includes("hyperframes-official")
    ) {
      throw new Error(
        `${item.name}: official source provenance is missing or inconsistent`,
      );
    }
    const manifestBytes = await readFile(manifestPath);
    if (
      createHash("sha256").update(manifestBytes).digest("hex") !==
        record.localManifest.sha256 ||
      record.files.length !== manifest.files.length
    ) {
      throw new Error(
        `${item.name}: official manifest no longer matches its import`,
      );
    }
    for (const file of record.files) {
      const declared = manifest.files.find((entry) => entry.path === file.path);
      const bytes = await readFile(resolve(blockDirectory, file.path));
      if (
        !declared ||
        declared.target !== file.target ||
        declared.type !== file.type ||
        bytes.length !== file.bytes ||
        createHash("sha256").update(bytes).digest("hex") !== file.sha256
      ) {
        throw new Error(
          `${item.name}: native source file changed: ${file.path}`,
        );
      }
    }
    const primary =
      manifest.files.find((file) => file.target === "index.html") ??
      manifest.files.find(
        (file) =>
          file.type === "hyperframes:composition" ||
          file.type === "hyperframes:snippet",
      );
    if (!primary)
      throw new Error(`${item.name}: official item has no primary HTML source`);
    const sourceVariables = parseHyperframesVariables(
      await readFile(resolve(blockDirectory, primary.path), "utf8"),
    );
    if (
      sourceVariables !== undefined &&
      !isDeepStrictEqual(sourceVariables, manifest.variables)
    )
      throw new Error(
        `${item.name}: official variables differ from the active HTML declaration`,
      );
    if (manifest.type === "hyperframes:example") {
      const preview = templateRecords.get(item.name);
      if (
        !preview ||
        preview.render.status !== "passed" ||
        preview.origin.commit !== manifest.origin.commit ||
        preview.sourceManifestSha256 !== record.localManifest.sha256 ||
        preview.dimensions.width !== manifest.dimensions.width ||
        preview.dimensions.height !== manifest.dimensions.height ||
        preview.duration !== manifest.duration ||
        preview.render.frameCount !== preview.fps * preview.duration ||
        preview.files.length !== record.files.length
      ) {
        throw new Error(
          `${item.name}: template preview evidence is stale or incomplete`,
        );
      }
      for (const file of preview.files) {
        if (
          record.files.find((source) => source.path === file.path)?.sha256 !==
          file.sourceSha256
        )
          throw new Error(
            `${item.name}: template source hash changed: ${file.path}`,
          );
      }
      for (const artifact of Object.values(preview.artifacts)) {
        const bytes = await readFile(resolve(root, artifact.path));
        if (
          bytes.length !== artifact.bytes ||
          createHash("sha256").update(bytes).digest("hex") !== artifact.sha256
        )
          throw new Error(
            `${item.name}: template preview changed: ${artifact.path}`,
          );
      }
    }
    continue;
  }
  await ensure(parityPath, `${item.name} parity manifest`);
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

  if (hasFreshCompiledEvidence(parity)) {
    const fixtures = (
      await Promise.all(
        ["text", "core", "primitive", "icon"].map((family) =>
          readJson(resolve(root, `catalog/${family}-fixtures.json`)),
        ),
      )
    ).flat();
    const entry = fixtures.find((fixture) => fixture.slug === item.name);
    if (!entry) throw new Error(`${item.name}: pinned fresh fixture missing`);
    await assertFreshCompiledEvidence({
      parity,
      manifest,
      fixture: entry.fixture,
      origin: entry.origin,
      readBytes: (path) => readFile(resolve(root, path)),
    });
  }

  if (parity.classification === "source-dom-port") {
    const composition = manifest.files.find(
      (file) => file.type === "hyperframes:composition",
    );
    const scores = [
      ...(
        await readFile(resolve(root, parity.artifacts.frameSsim), "utf8")
      ).matchAll(/^n:\d+ .*?All:([\d.]+)/gm),
    ].map((match) => Number(match[1]));
    const mean =
      scores.reduce((total, score) => total + score, 0) / scores.length;
    const minimum = Math.min(...scores);
    const source = composition
      ? await readFile(resolve(blockDirectory, composition.path))
      : null;
    const assetsMatch = await Promise.all(
      Object.entries(parity.fixture.assetSha256 ?? {}).map(
        async ([path, expected]) => {
          const bytes = await readFile(resolve(blockDirectory, path));
          return createHash("sha256").update(bytes).digest("hex") === expected;
        },
      ),
    );
    if (
      !source ||
      assetsMatch.includes(false) ||
      createHash("sha256").update(source).digest("hex") !==
        parity.fixture.compositionSha256 ||
      parity.checks?.installedThroughCli !== true ||
      parity.fixture.width !== manifest.dimensions.width ||
      parity.fixture.height !== manifest.dimensions.height ||
      parity.fixture.durationInFrames !== scores.length ||
      scores.length !== parity.result.frameCount ||
      Math.abs(mean - parity.result.meanSsim) > 0.000001 ||
      Math.abs(minimum - parity.result.minSsim) > 0.000001 ||
      mean < parity.thresholds.meanSsim ||
      minimum < parity.thresholds.minSsim
    ) {
      throw new Error(
        `${item.name}: native frame-parity evidence is stale or incomplete`,
      );
    }
  }

  if (manifest.tags?.includes("icon")) {
    const showcase = parity.showcase;
    const hasHighDensityFixture =
      showcase?.fixture?.width === 384 &&
      showcase.fixture.height === 384 &&
      showcase.fixture.scale === 8;
    const showcaseThreshold = await iconShowcaseThreshold(root, item.name, parity);
    const hasPassingShowcase =
      showcase?.result?.pass === true &&
      showcase.result.meanSsim >= showcaseThreshold;

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

for (const record of nativeRecords.values()) {
  if (!registry.items.some((item) => item.name === record.name))
    throw new Error(
      `${record.name}: official catalog item missing from the registry`,
    );
}
console.log(
  `Validated ${registry.items.length} catalog items, including ${nativeRecords.size} exact official source imports.`,
);
