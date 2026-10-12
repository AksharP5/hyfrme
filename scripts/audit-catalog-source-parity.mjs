import { execFile, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { isDeepStrictEqual, promisify } from "node:util";
import { build } from "esbuild";
import { parseHyperframesVariables } from "./hyperframes-variables.mjs";
import { readRemocnRegistry } from "./remocn-registry.mjs";

const root = resolve(import.meta.dirname, "..");
const output = resolve(
  root,
  ".work/full-parity-audit/catalog-parity-report.json",
);
const read = async (path) =>
  JSON.parse(await readFile(resolve(root, path), "utf8"));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const blobHash = (bytes) =>
  createHash("sha1")
    .update(`blob ${bytes.length}\0`)
    .update(bytes)
    .digest("hex");
const run = promisify(execFile);
const failures = [];
const exact = (scope, actual, expected, context = {}) => {
  const same = isDeepStrictEqual(actual, expected);
  if (!same) failures.push({ scope, ...context, actual, expected });
  return same;
};
const fetchBytes = async (url) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return Buffer.from(await response.arrayBuffer());
};
const repositories = {
  remocn: "https://github.com/Remocn/remocn",
  snapcn: "https://github.com/snapcndev/snapcn",
  hyperframes: "https://github.com/heygen-com/hyperframes",
};
const heads = Object.fromEntries(
  await Promise.all(
    Object.entries(repositories).map(async ([name, url]) => {
      const { stdout } = await run("git", ["ls-remote", url, "HEAD"]);
      return [name, { repository: url, commit: stdout.trim().split(/\s+/)[0] }];
    }),
  ),
);
const previous = await read(
  ".work/full-parity-audit/catalog-parity-report.json",
).catch((error) => {
  if (error.code === "ENOENT") return {};
  throw error;
});
const report = {
  ...previous,
  checkedAtUtc: new Date().toISOString(),
  reproduction: "node scripts/audit-catalog-source-parity.mjs",
  scope:
    "Current public source inventories, pinned inputs, installed bytes, variables, grouping, media and license hashes. Visual/render parity is verified separately.",
  heads,
};
report.remocn ??= {};
const installedNames = new Set(
  (await readdir(resolve(root, "registry/blocks"), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name),
);
const liveRegistries = Object.fromEntries(
  await Promise.all(
    ["remocn", "snapcn"].map(async (name) => {
      const url = `https://${name}.dev/r/registry.json`;
      const bytes = await fetchBytes(url);
      return [
        name,
        { url, sha256: hash(bytes), items: JSON.parse(bytes).items },
      ];
    }),
  ),
);

const remocnFixtures = (
  await Promise.all(
    ["text", "core", "primitive", "icon"].map((family) =>
      read(`catalog/${family}-fixtures.json`),
    ),
  )
).flat();
const remocnRoot = resolve(
  root,
  process.env.REMOCN_SOURCE ??
    `.work/full-parity-audit/source-${heads.remocn.commit}`,
);
const currentRemocn = await readRemocnRegistry(remocnRoot);
const remocnVisuals = currentRemocn.items.filter(
  (item) => item.type !== "registry:lib" && item.name !== "brush",
);
const remocnMissing = remocnVisuals
  .filter((item) => !installedNames.has(item.name))
  .map((item) => item.name);
exact("Remocn coverage", remocnMissing, []);
exact(
  "Remocn fixture coverage",
  remocnFixtures.map((fixture) => fixture.slug).sort(),
  remocnVisuals.map((item) => item.name).sort(),
);
const remocnInputs = [];
let remocnVariables = 0;
const iconFixtures = remocnFixtures.filter((fixture) =>
  fixture.origin.config?.startsWith("registry/remocn-icons/"),
);
const iconConfigBuild = await build({
  stdin: {
    contents: `
      import {resolveControls} from "./lib/customizer-config";
      ${iconFixtures.map((fixture, index) => `import * as Config${index} from ${JSON.stringify(`./${fixture.origin.config}`)};`).join("\n")}
      export const icons = [${iconFixtures
        .map(
          (fixture, index) => `{
        slug: ${JSON.stringify(fixture.slug)},
        controls: resolveControls(${JSON.stringify(fixture.slug)}, Object.values(Config${index}).find(value => value && typeof value === "object" && "controls" in value && "componentName" in value).controls),
      }`,
        )
        .join(",")}];
    `,
    loader: "ts",
    resolveDir: remocnRoot,
  },
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  tsconfig: resolve(remocnRoot, "tsconfig.json"),
});
const iconControlsModule = await import(
  `data:text/javascript;base64,${Buffer.from(iconConfigBuild.outputFiles[0].text).toString("base64")}`
);
const iconControls = new Map(
  iconControlsModule.icons.map(({ slug, controls }) => [slug, controls]),
);
const iconControlAudit = [];
for (const fixture of remocnFixtures) {
  exact(
    "Remocn current source pin",
    fixture.origin.commit,
    heads.remocn.commit,
    { slug: fixture.slug },
  );
  const sourceRoot = resolve(
    root,
    `.work/full-parity-audit/source-${fixture.origin.commit}`,
  );
  for (const path of new Set(
    [
      fixture.origin.source,
      fixture.origin.config,
      fixture.origin.entry,
      ...(fixture.fixture.previewBackdrop
        ? ["registry/remocn/backdrop/index.tsx", `public${fixture.fixture.previewBackdrop.src}`]
        : []),
      ...(fixture.slug === "backdrop" ? ["public/hero.png"] : []),
    ].filter(
      Boolean,
    ),
  )) {
    if (/\/hyfrme-[^/]+\.(?:ts|tsx)$/.test(path)) {
      remocnInputs.push({
        slug: fixture.slug,
        path,
        kind: "Hyfrme preview adapter",
      });
      continue;
    }
    const bytes = await readFile(resolve(sourceRoot, path));
    const upstream = execFileSync(
      "git",
      ["-C", sourceRoot, "show", `${fixture.origin.commit}:${path}`],
      { maxBuffer: 8 * 1024 * 1024 },
    );
    remocnInputs.push({
      slug: fixture.slug,
      path,
      sha256: hash(bytes),
      gitBlob: blobHash(upstream),
      exact: exact("Remocn source input bytes", hash(bytes), hash(upstream), {
        slug: fixture.slug,
        path,
      }),
    });
  }
  const manifest = await read(
    `registry/blocks/${fixture.slug}/registry-item.json`,
  );
  const primary = manifest.files.find(
    (file) => file.type === "hyperframes:composition",
  );
  const variables =
    parseHyperframesVariables(
      await readFile(
        resolve(root, "registry/blocks", fixture.slug, primary.path),
        "utf8",
      ),
    ) ?? [];
  remocnVariables += variables.length;
  for (const variable of variables)
    exact(
      "Remocn installed default",
      variable.default,
      fixture.fixture.props[variable.id],
      { slug: fixture.slug, variable: variable.id },
    );
  if (iconControls.has(fixture.slug)) {
    const controls = iconControls.get(fixture.slug);
    const expected = Object.entries(controls).map(([id, control]) => {
      const variable = {
        id,
        type:
          control.type === "select" || control.type === "text"
            ? "string"
            : control.type === "number-input"
              ? "number"
              : control.type,
        label: control.label,
        default: control.default,
      };
      for (const key of ["options", "min", "max", "step"])
        if (Object.hasOwn(control, key)) variable[key] = control[key];
      return variable;
    });
    iconControlAudit.push({
      slug: fixture.slug,
      controls: expected.length,
      installedSchemaSha256: hash(JSON.stringify(variables)),
      exact: exact("Remocn icon control schema", variables, expected, {
        slug: fixture.slug,
      }),
    });
  }
}
report.remocn.currentAudit = {
  registryItems: currentRemocn.items.length,
  publicVisualItems: remocnVisuals.length,
  fixtures: remocnFixtures.length,
  installedVariables: remocnVariables,
  missing: remocnMissing,
  liveRegistry: {
    ...liveRegistries.remocn,
    items: liveRegistries.remocn.items.length,
  },
  sourceInputs: remocnInputs,
  iconControlSchemas: iconControlAudit,
};

const snapcnFixtures = await read("catalog/snapcn-fixtures.json");
const snapcnInventory = await read("catalog/snapcn-upstream.json");
const snapcnAssets = await read("assets/snapcn/manifest.json");
const snapcnRoot = resolve(
  root,
  process.env.SNAPCN_SOURCE ?? `.work/snapcn-${heads.snapcn.commit}`,
);
const configBuild = await build({
  stdin: {
    contents:
      "export {CONFIGS} from './registry/__configs__.ts'; export {pulsingBorderConfig} from './registry/snap-cn/pulsing-border/config.ts'; export {caretConfig} from './registry/snap-cn-ui/caret/config.ts'; export {inputConfig} from './registry/snap-cn-ui/input/config.ts';",
    loader: "ts",
    resolveDir: snapcnRoot,
  },
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  tsconfig: resolve(snapcnRoot, "tsconfig.json"),
});
const configsModule = await import(
  `data:text/javascript;base64,${Buffer.from(configBuild.outputFiles[0].text).toString("base64")}`
);
const configs = {
  ...configsModule.CONFIGS,
  "pulsing-border": configsModule.pulsingBorderConfig,
  caret: configsModule.caretConfig,
  input: configsModule.inputConfig,
};
const mediaUses = new Map();
const strings = (value) =>
  typeof value === "string"
    ? [value]
    : Array.isArray(value)
      ? value.flatMap(strings)
      : value && typeof value === "object"
        ? Object.values(value).flatMap(strings)
        : [];
let snapcnControls = 0;
for (const fixture of snapcnFixtures) {
  exact(
    "Snapcn current source pin",
    fixture.origin.commit,
    heads.snapcn.commit,
    { slug: fixture.slug },
  );
  const config = configs[fixture.slug.slice(7)];
  exact("Snapcn public controls", fixture.controls, config.controls, {
    slug: fixture.slug,
  });
  snapcnControls += Object.keys(config.controls).length;
  const variables = parseHyperframesVariables(
    await readFile(
      resolve(root, "registry/blocks", fixture.slug, `${fixture.slug}.html`),
      "utf8",
    ),
  );
  for (const [id, control] of Object.entries(config.controls))
    exact("Snapcn default", fixture.fixture.props[id], control.default, {
      slug: fixture.slug,
      variable: id,
    });
  for (const variable of variables)
    exact(
      "Snapcn installed default",
      variable.default,
      config.controls[variable.id].default,
      { slug: fixture.slug, variable: variable.id },
    );
  for (const [key, value] of Object.entries(fixture.fixture.props))
    for (const text of strings(value))
      for (const match of text.matchAll(
        /https?:\/\/[^\s|>"']+|\/(?:avatars|logo|showcase-assets)\/[^\s|>"']+/g,
      )) {
        const url = match[0];
        if (!mediaUses.has(url)) mediaUses.set(url, []);
        mediaUses.get(url).push({ slug: fixture.slug, key });
      }
}
const snapcnMedia = await Promise.all(
  [...mediaUses].map(async ([source, uses]) => {
    const bytes = source.startsWith("/")
      ? execFileSync(
          "git",
          ["-C", snapcnRoot, "show", `${heads.snapcn.commit}:public${source}`],
          { maxBuffer: 15 * 1024 * 1024 },
        )
      : await fetchBytes(source);
    const sha256 = hash(bytes);
    return {
      source,
      bytes: bytes.length,
      sha256,
      uses: uses.map((use) => {
        const candidates = snapcnAssets.media.filter(
          (asset) => asset.source === source,
        );
        const selected =
          candidates.find((asset) => asset.slugs?.includes(use.slug)) ??
          candidates.find((asset) => !asset.slugs);
        return {
          ...use,
          path: selected?.path,
          exact: exact("Snapcn live default media", selected?.sha256, sha256, {
            ...use,
            source,
          }),
        };
      }),
    };
  }),
);
const snapcnHashes = new Map();
for (const asset of [...snapcnAssets.media, ...snapcnAssets.fonts])
  for (const [path, recorded] of [
    [asset.path, asset.sha256],
    [asset.portPath, asset.portSha256],
    [asset.licensePath, asset.licenseSha256],
    [asset.noticePath, asset.noticeSha256],
    [asset.finalFrame?.path, asset.finalFrame?.sha256],
  ])
    if (path && !snapcnHashes.has(path)) {
      const actual = hash(await readFile(resolve(root, "assets/snapcn", path)));
      snapcnHashes.set(path, {
        path,
        sha256: actual,
        exact: exact("Snapcn frozen asset/license/notice", actual, recorded, {
          path,
        }),
      });
    }
const snapcnSourceHashes = await Promise.all(
  snapcnInventory.items.map(async (item) => {
    const actual = hash(await readFile(resolve(snapcnRoot, item.source)));
    return {
      name: item.name,
      source: item.source,
      sha256: actual,
      exact: exact("Snapcn current source hash", actual, item.sourceSha256, {
        name: item.name,
      }),
    };
  }),
);
const snapcnMissing = liveRegistries.snapcn.items
  .filter(
    (item) =>
      item.type !== "registry:lib" &&
      !installedNames.has(`snapcn-${item.name}`),
  )
  .map((item) => item.name);
exact("Snapcn coverage", snapcnMissing, []);
exact(
  "Snapcn fixture coverage",
  snapcnFixtures.map((fixture) => fixture.slug).sort(),
  liveRegistries.snapcn.items
    .filter((item) => item.type !== "registry:lib")
    .map((item) => `snapcn-${item.name}`)
    .sort(),
);
const pro = JSON.parse(
  await readFile(resolve(snapcnRoot, "lib/pro-catalogue.json"), "utf8"),
);
const proNames = (Array.isArray(pro) ? pro : pro.items).map(
  (item) => item.name,
);
exact(
  "Snapcn closed Pro items excluded",
  proNames.filter((name) => installedNames.has(`snapcn-${name}`)),
  [],
);
const cssPath = "app/globals.css";
const cssRoot = resolve(
  root,
  `.work/snapcn-${snapcnInventory.publishedAudit.commit}`,
);
const cssExact = exact(
  "Snapcn published preview CSS current",
  hash(await readFile(resolve(cssRoot, cssPath))),
  hash(await readFile(resolve(snapcnRoot, cssPath))),
);
report.snapcn = {
  currentCommit: heads.snapcn.commit,
  fixtures: snapcnFixtures.length,
  controls: snapcnControls,
  liveRegistry: {
    ...liveRegistries.snapcn,
    items: liveRegistries.snapcn.items.length,
  },
  missing: snapcnMissing,
  excludedProItems: proNames.length,
  previewCssExact: cssExact,
  sourceHashes: snapcnSourceHashes,
  liveDefaultMedia: snapcnMedia,
  frozenAssetLicenseNoticeHashes: [...snapcnHashes.values()],
};

const native = await read("catalog/hyperframes-upstream.json");
const nativeRoot = resolve(
  root,
  process.env.HYPERFRAMES_SOURCE ??
    `.work/hyperframes-${native.summary.upstream.commit.slice(0, 8)}`,
);
const nativeTree = JSON.parse(
  await fetchBytes(
    `https://api.github.com/repos/heygen-com/hyperframes/git/trees/${heads.hyperframes.commit}?recursive=1`,
  ),
);
if (nativeTree.truncated || !nativeTree.tree)
  throw new Error("Incomplete current HyperFrames Git tree.");
const nativeBlobs = new Map(
  nativeTree.tree
    .filter((entry) => entry.type === "blob")
    .map((entry) => [entry.path, entry.sha]),
);
const currentBytes = async (path) => {
  const bytes = await readFile(resolve(nativeRoot, path));
  exact(
    "HyperFrames current source blob",
    blobHash(bytes),
    nativeBlobs.get(path),
    { path },
  );
  return bytes;
};
const registryBytes = await currentBytes("registry/registry.json");
const nativeRegistry = JSON.parse(registryBytes);
const navigationBytes = await currentBytes("docs/docs.json");
const navigation = JSON.parse(navigationBytes).navigation.tabs.find(
  (tab) => tab.tab === "Catalog",
).groups[0].pages;
const groups = navigation
  .filter((page) => typeof page !== "string")
  .map((group) => ({
    label: group.group,
    items: group.pages.filter((page) => typeof page === "string"),
    groups: group.pages
      .filter((page) => typeof page !== "string")
      .map((nested) => ({ label: nested.group, items: nested.pages })),
  }));
const localNavigation = await read("catalog/hyperframes-navigation.json");
exact("HyperFrames grouping and order", localNavigation.groups, groups);
exact(
  "HyperFrames navigation SHA",
  hash(navigationBytes),
  native.summary.navigationSha256,
);
exact(
  "HyperFrames registry SHA",
  hash(registryBytes),
  native.summary.upstream.registrySha256,
);
exact(
  "HyperFrames license SHA",
  hash(await currentBytes("LICENSE")),
  native.summary.upstream.licenseSha256,
);
const nativeFiles = [];
const nativeManifests = [];
for (const item of native.items) {
  const upstreamManifest = await currentBytes(item.upstreamManifest.path);
  exact(
    "HyperFrames source manifest SHA",
    hash(upstreamManifest),
    item.upstreamManifest.sha256,
    { name: item.name },
  );
  const localManifest = await readFile(resolve(root, item.localManifest.path));
  exact(
    "HyperFrames imported manifest SHA",
    hash(localManifest),
    item.localManifest.sha256,
    { name: item.name },
  );
  nativeManifests.push({
    name: item.name,
    upstreamSha256: hash(upstreamManifest),
    localSha256: hash(localManifest),
  });
  for (const file of item.files) {
    const bytes = await readFile(
      resolve(root, "registry/blocks", item.name, file.path),
    );
    exact("HyperFrames installed bytes", hash(bytes), file.sha256, {
      name: item.name,
      path: file.path,
    });
    exact("HyperFrames installed size", bytes.length, file.bytes, {
      name: item.name,
      path: file.path,
    });
    if (file.source.url)
      exact(
        "HyperFrames content-addressed media",
        hash(bytes).slice(0, 16),
        new URL(file.source.url).pathname.match(
          /\/([a-f0-9]{16})\.[a-z0-9]+$/,
        )?.[1],
        { name: item.name, path: file.path },
      );
    else if (file.source.extraction) {
      const mdx = (await currentBytes(file.source.path)).toString("utf8");
      const snippet = mdx.match(
        new RegExp(
          "```html " + item.originalName + "\\.html\\n([\\s\\S]*?)\\n```",
        ),
      )?.[1];
      exact(
        "HyperFrames documented snippet bytes",
        bytes.toString("utf8"),
        `${snippet}\n`,
        { name: item.name },
      );
    } else
      exact(
        "HyperFrames payload matches current Git",
        blobHash(bytes),
        nativeBlobs.get(file.source.path),
        { name: item.name, path: file.source.path },
      );
    nativeFiles.push({
      name: item.name,
      path: file.path,
      source: file.source,
      sha256: hash(bytes),
      bytes: bytes.length,
    });
  }
  const manifest = JSON.parse(localManifest);
  const primary =
    manifest.files.find((file) => file.target === "index.html") ??
    manifest.files.find((file) =>
      ["hyperframes:composition", "hyperframes:snippet"].includes(file.type),
    );
  const variables = parseHyperframesVariables(
    await readFile(
      resolve(root, "registry/blocks", item.name, primary.path),
      "utf8",
    ),
  );
  const original = item.upstreamManifest.path.endsWith(".json")
    ? JSON.parse(upstreamManifest)
    : manifest;
  exact(
    "HyperFrames published variables",
    manifest.variables,
    variables ?? original.variables,
    { name: item.name },
  );
}
const missingNative = nativeRegistry.items
  .filter((item) => !installedNames.has(`hyperframes-${item.name}`))
  .map((item) => item.name);
exact("HyperFrames registry coverage", missingNative, []);
const templates = nativeRegistry.items
  .filter((item) => item.type === "hyperframes:example")
  .map((item) => item.name);
report.hyperframes = {
  currentHead: heads.hyperframes.commit,
  importPin: native.summary.upstream.commit,
  publishedRegistryItems: nativeRegistry.items.length,
  installedCatalogItems: native.items.length,
  docsOnlyItems: native.summary.documentationItems,
  templates,
  groups: groups.length,
  groupingAndOrderExact: isDeepStrictEqual(groups, localNavigation.groups),
  missing: missingNative,
  installedFiles: nativeFiles,
  manifests: nativeManifests,
};
report.failures = failures;
report.passed = failures.length === 0;
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(
  JSON.stringify(
    {
      report: output,
      heads,
      remocn: {
        visuals: remocnVisuals.length,
        sourceInputs: remocnInputs.length,
        variables: remocnVariables,
      },
      snapcn: {
        fixtures: snapcnFixtures.length,
        controls: snapcnControls,
        media: snapcnMedia.length,
        excludedProItems: proNames.length,
      },
      hyperframes: {
        items: native.items.length,
        files: nativeFiles.length,
        templates: templates.length,
        groups: groups.length,
      },
      failures,
    },
    null,
    2,
  ),
);
process.exitCode = failures.length ? 1 : 0;
