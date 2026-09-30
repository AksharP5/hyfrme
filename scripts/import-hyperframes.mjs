import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { parseHyperframesVariables } from "./hyperframes-variables.mjs";

const root = resolve(import.meta.dirname, "..");
const repository = "https://github.com/heygen-com/hyperframes";
const commit = "daa44fcd753d9055aa3c954ad74f09a4e4389780";
const sourceRoot = resolve(
  root,
  process.env.HYPERFRAMES_SOURCE ?? ".work/hyperframes-daa44fcd",
);
const inventoryPath = resolve(root, "catalog/hyperframes-upstream.json");
const families = {
  "hyperframes:block": "blocks",
  "hyperframes:component": "components",
  "hyperframes:example": "examples",
};
const fileTypes = new Set([
  "hyperframes:composition",
  "hyperframes:snippet",
  "hyperframes:asset",
]);
const legalFile = /(?:^|[._-])(?:licen[cs]e|notice|copying|ofl)(?:[._-]|$)/i;
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const git = (...args) =>
  execFileSync("git", ["-C", sourceRoot, ...args], { encoding: "utf8" });

if (git("rev-parse", "HEAD").trim() !== commit) {
  throw new Error(`HyperFrames checkout must be pinned to ${commit}.`);
}
if (git("status", "--porcelain=v1", "--untracked-files=no").trim()) {
  throw new Error("HyperFrames checkout has modified tracked files.");
}
const tracked = new Set(git("ls-files", "-z").split("\0").filter(Boolean));

function requireRelativePath(path) {
  if (
    typeof path !== "string" ||
    !path ||
    isAbsolute(path) ||
    path.includes("\\") ||
    path.split("/").some((part) => !part || part === "." || part === "..")
  ) {
    throw new Error(`Unsafe registry path: ${JSON.stringify(path)}.`);
  }
  return path;
}

async function sourceBytes(path) {
  requireRelativePath(path);
  if (!tracked.has(path))
    throw new Error(`Upstream file is not tracked: ${path}.`);
  const absolute = resolve(sourceRoot, path);
  if (!(await lstat(absolute)).isFile()) {
    throw new Error(`Upstream path is not a regular file: ${path}.`);
  }
  const resolved = relative(sourceRoot, await realpath(absolute));
  if (resolved.startsWith("..") || isAbsolute(resolved)) {
    throw new Error(`Upstream file escapes the checkout: ${path}.`);
  }
  return readFile(absolute);
}

async function writeIfChanged(path, bytes) {
  const current = await readFile(path).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (current?.equals(bytes)) return;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, bytes);
}

const hosted = new Map();
async function hostedBytes(url, localPath) {
  const parsed = new URL(url);
  const expected = parsed.pathname.match(
    /^\/hyperframes-oss\/registry-assets\/([a-f0-9]{16})\.[a-z0-9]+$/,
  )?.[1];
  if (
    parsed.protocol !== "https:" ||
    parsed.hostname !== "static.heygen.ai" ||
    !expected
  ) {
    throw new Error(`Unrecognized upstream asset URL: ${url}.`);
  }
  if (!hosted.has(url)) {
    hosted.set(
      url,
      (async () => {
        const cached = await readFile(localPath).catch((error) => {
          if (error.code === "ENOENT") return null;
          throw error;
        });
        if (cached && sha256(cached).startsWith(expected)) return cached;
        const response = await fetch(url, {
          signal: AbortSignal.timeout(30_000),
        });
        if (!response.ok)
          throw new Error(`${response.status} while fetching ${url}.`);
        const bytes = Buffer.from(await response.arrayBuffer());
        if (!sha256(bytes).startsWith(expected)) {
          throw new Error(
            `Upstream asset digest does not match its URL: ${url}.`,
          );
        }
        return bytes;
      })(),
    );
  }
  return hosted.get(url);
}

const registryBytes = await sourceBytes("registry/registry.json");
const registry = JSON.parse(registryBytes);
if (!Array.isArray(registry.items))
  throw new Error("Upstream registry has no items.");
const names = new Set();
for (const item of registry.items) {
  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.name) ||
    !families[item.type] ||
    names.has(item.name)
  ) {
    throw new Error(
      `Invalid or duplicate upstream registry item: ${JSON.stringify(item)}.`,
    );
  }
  names.add(item.name);
}
const navigationBytes = await sourceBytes("docs/docs.json");
const navigation = JSON.parse(navigationBytes);
const catalogPages = (pages) =>
  pages.flatMap((page) =>
    typeof page === "string" ? [page] : catalogPages(page.pages),
  );
const documentationItems = [];
for (const page of catalogPages(
  navigation.navigation.tabs.find((tab) => tab.tab === "Catalog").groups[0]
    .pages,
)) {
  const match = page.match(/^catalog\/(blocks|components)\/([a-z0-9-]+)$/);
  if (!match || names.has(match[2])) continue;
  const [, family, name] = match;
  const manifestPath = `registry/${family}/${name}/registry-item.json`;
  if (tracked.has(manifestPath)) {
    const manifest = JSON.parse(await sourceBytes(manifestPath));
    documentationItems.push({
      name,
      type: manifest.type,
      catalogPage: `${page}.mdx`,
    });
    names.add(name);
    continue;
  }
  const source = `docs/${page}.mdx`;
  const text = (await sourceBytes(source)).toString("utf8");
  const code = text.match(
    new RegExp("```html " + name + "\\.html\\n([\\s\\S]*?)\\n```"),
  )?.[1];
  if (family !== "components" || !code)
    throw new Error(
      `Missing installable source for upstream catalog page: ${page}`,
    );
  const variables = JSON.parse(
    code.match(/data-composition-variables='([^']+)'/)?.[1] ?? "[]",
  );
  const tags = [
    ...(text.match(/Tagged ([^\n]+)/)?.[1] ?? "").matchAll(/`([^`]+)`/g),
  ].map((match) => match[1]);
  const manifest = {
    $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
    name,
    type: "hyperframes:component",
    title: JSON.parse(text.match(/^title: (".*")$/m)[1]),
    description: JSON.parse(text.match(/^description: (".*")$/m)[1]),
    tags,
    variables,
    files: [
      {
        path: `${name}.html`,
        target: `compositions/components/${name}.html`,
        type: "hyperframes:snippet",
      },
    ],
  };
  documentationItems.push({
    name,
    type: manifest.type,
    catalogPage: `${page}.mdx`,
    source,
    manifest,
    snippet: Buffer.from(`${code}\n`),
  });
  names.add(name);
}
const listedItems = [...registry.items, ...documentationItems];
const licenseBytes = await sourceBytes("LICENSE");
const items = [];

for (const listed of listedItems) {
  const name = `hyperframes-${listed.name}`;
  const directory = `registry/${families[listed.type]}/${listed.name}`;
  const source = listed.source ?? `${directory}/registry-item.json`;
  const localDirectory = `registry/blocks/${name}`;
  const record = {
    name,
    originalName: listed.name,
    type: listed.type,
    ...(listed.catalogPage
      ? { catalogPage: `docs/${listed.catalogPage}` }
      : {}),
    status: "imported",
    files: [],
    missingFiles: [],
  };
  try {
    const manifestBytes = await sourceBytes(source);
    const original = listed.manifest ?? JSON.parse(manifestBytes);
    if (
      original.name !== listed.name ||
      original.type !== listed.type ||
      !Array.isArray(original.files) ||
      !original.files.length
    ) {
      throw new Error(
        `Manifest does not match its published registry entry: ${source}.`,
      );
    }
    if (
      original.tags !== undefined &&
      (!Array.isArray(original.tags) ||
        original.tags.some((tag) => typeof tag !== "string"))
    ) {
      throw new Error(`Invalid upstream tags: ${source}.`);
    }
    if (
      original.registryDependencies !== undefined &&
      (!Array.isArray(original.registryDependencies) ||
        original.registryDependencies.some(
          (dependency) => !names.has(dependency),
        ))
    ) {
      throw new Error(`Unknown upstream registry dependency: ${source}.`);
    }
    const files = original.files.map((file) => {
      requireRelativePath(file.path);
      requireRelativePath(file.target);
      if (!fileTypes.has(file.type))
        throw new Error(`Unknown file type in ${source}: ${file.type}.`);
      if (
        ["whip-pan", "code-morph"].includes(listed.name) &&
        file.target === `compositions/${listed.name}.html`
      ) {
        return { ...file, target: `compositions/${name}.html` };
      }
      if (
        listed.type !== "hyperframes:example" &&
        file.target === "TEMPLATE.md"
      ) {
        return { ...file, target: `compositions/${name}/TEMPLATE.md` };
      }
      return { ...file };
    });
    const legalPaths = [...tracked]
      .filter(
        (path) =>
          path.startsWith(`${directory}/`) &&
          legalFile.test(path.split("/").at(-1)),
      )
      .sort();
    for (const path of legalPaths) {
      const local = path.slice(directory.length + 1);
      if (files.some((file) => file.path === local)) continue;
      files.push({
        path: local,
        target: `THIRD_PARTY_LICENSES/hyperframes/${listed.name}/${local}`,
        type: "hyperframes:asset",
      });
    }
    const rootNotices = [
      "LICENSE",
      ...(tracked.has("NOTICE") ? ["NOTICE"] : []),
    ];
    for (const notice of rootNotices) {
      const path = `licenses/HyperFrames-${notice}`;
      if (files.some((file) => file.path === path))
        throw new Error(`License path collision in ${name}.`);
      files.push({
        path,
        target: `THIRD_PARTY_LICENSES/hyperframes/${notice}`,
        type: "hyperframes:asset",
      });
    }
    const payloads = await Promise.all(
      files.map(async (file) => {
        const rootNotice = rootNotices.find(
          (notice) => file.path === `licenses/HyperFrames-${notice}`,
        );
        const extractedSnippet =
          listed.snippet && file.type === "hyperframes:snippet";
        const path =
          rootNotice ??
          (extractedSnippet ? source : `${directory}/${file.path}`);
        const localPath = resolve(root, localDirectory, file.path);
        const bytes = file.url
          ? await hostedBytes(file.url, localPath)
          : extractedSnippet
            ? listed.snippet
            : await sourceBytes(path);
        const originalTarget = original.files.find(
          (candidate) => candidate.path === file.path,
        )?.target;
        const provenance = {
          path: file.path,
          target: file.target,
          type: file.type,
          ...(originalTarget && originalTarget !== file.target
            ? {
                originalTarget,
                targetReason:
                  originalTarget === "TEMPLATE.md"
                    ? "Keep each block's template documentation without root filename conflicts."
                    : "Avoid overwriting an existing Hyfrme composition.",
              }
            : {}),
          source: file.url
            ? { url: file.url }
            : {
                path,
                ...(extractedSnippet
                  ? { extraction: `html code fence: ${listed.name}.html` }
                  : {}),
              },
          sha256: sha256(bytes),
          bytes: bytes.length,
        };
        return { localPath, bytes, provenance };
      }),
    );
    const primary =
      files.find((file) => file.target === "index.html") ??
      files.find(
        (file) =>
          file.type === "hyperframes:composition" ||
          file.type === "hyperframes:snippet",
      );
    if (!primary) throw new Error(`Missing primary HTML source in ${name}.`);
    const sourceVariables = parseHyperframesVariables(
      payloads
        .find((payload) => payload.provenance.path === primary.path)
        .bytes.toString("utf8"),
    );
    const normalizeVariables =
      sourceVariables !== undefined &&
      !isDeepStrictEqual(sourceVariables, original.variables);
    const manifest = {
      ...original,
      ...(normalizeVariables ? { variables: sourceVariables } : {}),
      name,
      tags: [...new Set([...(original.tags ?? []), "hyperframes-official"])],
      license: original.license ?? "Apache-2.0",
      ...(original.registryDependencies
        ? {
            registryDependencies: original.registryDependencies.map(
              (dependency) => `hyperframes-${dependency}`,
            ),
          }
        : {}),
      origin: { repository, commit, source, name: listed.name },
      files,
    };
    const localManifestBytes = Buffer.from(
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
    for (const payload of payloads)
      await writeIfChanged(payload.localPath, payload.bytes);
    await writeIfChanged(
      resolve(root, localDirectory, "registry-item.json"),
      localManifestBytes,
    );
    record.upstreamManifest = { path: source, sha256: sha256(manifestBytes) };
    record.localManifest = {
      path: `${localDirectory}/registry-item.json`,
      sha256: sha256(localManifestBytes),
    };
    record.files = payloads.map((payload) => payload.provenance);
    if (normalizeVariables) record.variablesSource = primary.path;
  } catch (error) {
    record.status = "failed";
    record.missingFiles.push(
      error instanceof Error ? error.message : String(error),
    );
    console.error(`${name}: ${record.missingFiles[0]}`);
  }
  items.push(record);
}

const imported = items.filter((item) => item.status === "imported");
const missingFiles = items.flatMap((item) =>
  item.missingFiles.map((message) => ({ name: item.name, message })),
);
const countByType = (entries) =>
  Object.fromEntries(
    Object.keys(families).map((type) => [
      type,
      entries.filter((item) => item.type === type).length,
    ]),
  );
const summary = {
  upstream: {
    repository,
    commit,
    registry: "registry/registry.json",
    registrySha256: sha256(registryBytes),
    licenseSha256: sha256(licenseBytes),
  },
  verification: "native-source-copy",
  totalRegistryItems: registry.items.length,
  totalCatalogItems: listedItems.length,
  documentationItems: documentationItems.map(({ name, catalogPage }) => ({
    name,
    source: `docs/${catalogPage}`,
  })),
  navigationSha256: sha256(navigationBytes),
  importedItems: imported.length,
  byType: countByType(imported),
  sourceFiles: imported.reduce(
    (count, item) =>
      count +
      item.files.filter(
        (file) =>
          file.source.path !== "LICENSE" && file.source.path !== "NOTICE",
      ).length,
    0,
  ),
  installedFiles: imported.reduce(
    (count, item) => count + item.files.length,
    0,
  ),
  hostedAssets: imported
    .flatMap((item) => item.files)
    .filter((file) => file.source.url).length,
  uniqueHostedAssets: new Set(
    imported
      .flatMap((item) => item.files)
      .flatMap((file) => (file.source.url ? [file.source.url] : [])),
  ).size,
  missingFiles,
};
await writeIfChanged(
  inventoryPath,
  Buffer.from(`${JSON.stringify({ summary, items }, null, 2)}\n`),
);
console.log(JSON.stringify(summary, null, 2));
if (missingFiles.length) process.exitCode = 1;
