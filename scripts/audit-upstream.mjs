import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourceRoot = resolve(root, process.env.REMOCN_SOURCE ?? ".work/remocn");
const lintScript =
  process.env.R2HF_LINT_SCRIPT ??
  resolve(
    homedir(),
    ".agents/skills/remotion-to-hyperframes/scripts/lint_source.py",
  );
const registryPath = resolve(sourceRoot, "registry-artifacts/registry.json");
const outputPath = resolve(root, "catalog/upstream-inventory.json");
const reportPath = resolve(root, "docs/UPSTREAM_STATUS.md");
const registry = JSON.parse(await readFile(registryPath, "utf8"));
const publishedRegistry = await readFile(
  resolve(root, "registry", "registry.json"),
  "utf8",
)
  .then(JSON.parse)
  .catch(() => ({ items: [] }));
const textFixtures = await readFile(
  resolve(root, "catalog", "text-fixtures.json"),
  "utf8",
)
  .then(JSON.parse)
  .catch(() => []);
const coreFixtures = await readFile(
  resolve(root, "catalog", "core-fixtures.json"),
  "utf8",
)
  .then(JSON.parse)
  .catch(() => []);

const familyFromPath = (path) => {
  if (path.startsWith("registry/remocn-icons/")) return "icons";
  if (path.startsWith("registry/remocn-ui/")) return "ui";
  return "core";
};

const sourceDirectoryFor = (item) => {
  const firstPath = item.files?.[0]?.path;
  if (!firstPath) return null;
  const relativeDirectory = dirname(firstPath);
  return resolve(sourceRoot, relativeDirectory);
};

const detectFeatures = (source) => {
  const features = [];
  const rules = [
    ["shader", /@paper-design\/shaders-react|Shader/i],
    ["transition", /@remotion\/transitions|TransitionSeries/],
    ["spring", /\bspring\s*\(/],
    ["interpolate", /\binterpolate(?:Colors)?\s*\(/],
    ["sequence", /<(?:Sequence|Series|Loop|Freeze)\b/],
    ["svg", /<svg\b|<path\b/],
    ["state", /\buse(?:State|Reducer)\s*\(/],
    ["effect", /\buse(?:Layout)?Effect\s*\(/],
    ["media", /<(?:Audio|Video|OffthreadVideo|Img|IFrame)\b|staticFile\s*\(/],
    ["font", /@remotion\/google-fonts|@font-face|fontFamily/],
  ];
  for (const [name, pattern] of rules) {
    if (pattern.test(source)) features.push(name);
  }
  return features;
};

const items = [];

for (const item of registry.items) {
  const sourceDirectory = sourceDirectoryFor(item);
  const lint = sourceDirectory
    ? spawnSync("python3", [lintScript, sourceDirectory, "--json"], {
        encoding: "utf8",
      })
    : null;
  const lintResult = lint?.stdout
    ? JSON.parse(lint.stdout)
    : { files_scanned: 0, blockers: 0, warnings: 0, infos: 0, findings: [] };
  const sourceChunks = [];
  for (const file of item.files ?? []) {
    const absolutePath = resolve(sourceRoot, file.path);
    try {
      sourceChunks.push(await readFile(absolutePath, "utf8"));
    } catch {
      // Binary or generated files do not contribute feature signals.
    }
  }
  const source = sourceChunks.join("\n");
  const family = familyFromPath(item.files?.[0]?.path ?? "");
  const visual = item.type !== "registry:lib";
  const blockers = lintResult.findings.filter(
    (finding) => finding.severity === "blocker",
  );

  items.push({
    name: item.name,
    title: item.title,
    description: item.description,
    type: item.type,
    family,
    visual,
    dependencies: item.dependencies ?? [],
    registryDependencies: item.registryDependencies ?? [],
    files: item.files ?? [],
    sourceLineCount: source.split("\n").length,
    features: detectFeatures(source),
    lint: lintResult,
    translationClass: !visual
      ? "shared-runtime"
      : blockers.length > 0
        ? "interop-or-native-rewrite"
        : lintResult.warnings > 0
          ? "manual-review"
          : "mechanical-candidate",
  });
}

const countBy = (values, key) =>
  Object.fromEntries(
    [...new Set(values.map((value) => value[key]))]
      .sort()
      .map((value) => [
        value,
        values.filter((item) => item[key] === value).length,
      ]),
  );

const summary = {
  upstream: {
    repository: "https://github.com/Remocn/remocn",
    commit: spawnSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], {
      encoding: "utf8",
    }).stdout.trim(),
  },
  totalRegistryItems: items.length,
  visualItems: items.filter((item) => item.visual).length,
  sharedRuntimeItems: items.filter((item) => !item.visual).length,
  byFamily: countBy(items, "family"),
  byTranslationClass: countBy(items, "translationClass"),
  blockerItems: items
    .filter((item) => item.lint.blockers > 0)
    .map((item) => item.name),
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({ summary, items }, null, 2)}\n`);

const tableRows = Object.entries(summary.byTranslationClass)
  .map(([classification, count]) => `| ${classification} | ${count} |`)
  .join("\n");
const publishedCount = publishedRegistry.items?.length ?? 0;
const publishedIconCount =
  publishedRegistry.items?.filter((item) => item.name.startsWith("icon-"))
    .length ?? 0;
const textNames = new Set(textFixtures.map((item) => item.slug));
const publishedTextCount =
  publishedRegistry.items?.filter((item) => textNames.has(item.name)).length ??
  0;
const coreNames = new Set(coreFixtures.map((item) => item.slug));
const publishedCoreCount =
  publishedRegistry.items?.filter((item) => coreNames.has(item.name)).length ??
  0;
const blockerRows = items
  .filter((item) => item.lint.blockers > 0)
  .map(
    (item) =>
      `| \`${item.name}\` | ${item.family} | ${item.lint.findings
        .filter((finding) => finding.severity === "blocker")
        .map((finding) => finding.rule)
        .join(", ")} |`,
  )
  .join("\n");

const report = `# Upstream migration status

Pinned Remocn commit: \`${summary.upstream.commit}\`

This inventory is generated by \`npm run audit:upstream\` from Remocn's merged
registry manifest and the official Remotion-to-HyperFrames source linter.

## Inventory

- ${summary.totalRegistryItems} registry items
- ${summary.visualItems} visual components
- ${summary.sharedRuntimeItems} shared runtime libraries
- Families: ${Object.entries(summary.byFamily)
  .map(([family, count]) => `${family} ${count}`)
  .join(", ")}

## Verified progress

- ${publishedCount} visual ports published in the local verified registry.
- ${publishedIconCount}/100 animated icons published.
- ${publishedTextCount}/${textFixtures.length} typography/effect ports published.
- ${publishedCoreCount}/${coreFixtures.length} composition/data ports published.
- ${Math.max(0, summary.visualItems - publishedCount)} visual items remain.

| Translation class | Count |
| --- | ---: |
${tableRows}

## Source-lint blockers

Blockers are not failed ports. They require a native deterministic rewrite or a
documented runtime adapter before parity grading.

| Item | Family | Rule |
| --- | --- | --- |
${blockerRows || "| None | — | — |"}
`;

await writeFile(reportPath, report);

console.log(JSON.stringify(summary, null, 2));
