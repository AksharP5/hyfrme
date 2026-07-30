import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const explicitSource = process.env.REMOCN_SOURCE !== undefined;
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
const sourceCommit = spawnSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], {
  encoding: "utf8",
}).stdout.trim();
const sourceStatus = spawnSync(
  "git",
  ["-C", sourceRoot, "status", "--porcelain=v1", "--untracked-files=all"],
  {
    encoding: "utf8",
  },
).stdout.trim();
const pinnedCommit = await readFile(outputPath, "utf8")
  .then(JSON.parse)
  .then((inventory) => inventory.summary?.upstream?.commit)
  .catch(() => null);

if (!sourceCommit) {
  throw new Error(`Could not resolve a Remocn commit in ${sourceRoot}.`);
}

if (!explicitSource && pinnedCommit && sourceCommit !== pinnedCommit) {
  throw new Error(
    [
      `The default Remocn checkout is at ${sourceCommit},`,
      `but the generated inventory is pinned to ${pinnedCommit}.`,
      "Update .work/remocn to the pinned commit, or set REMOCN_SOURCE to an intentional checkout.",
    ].join(" "),
  );
}

if (sourceStatus) {
  throw new Error(
    `The Remocn checkout at ${sourceRoot} has uncommitted files. Audit a clean checkout so the inventory matches ${sourceCommit}.`,
  );
}

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
const primitiveFixtures = await readFile(
  resolve(root, "catalog", "primitive-fixtures.json"),
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

const normalizeLintResult = (result) => ({
  ...result,
  findings: (result.findings ?? []).map((finding) => ({
    ...finding,
    file: finding.file.startsWith(sourceRoot)
      ? relative(sourceRoot, finding.file).replaceAll("\\", "/")
      : finding.file,
  })),
});

const items = [];

for (const item of registry.items) {
  const sourceDirectory = sourceDirectoryFor(item);
  const lint = sourceDirectory
    ? spawnSync("python3", [lintScript, sourceDirectory, "--json"], {
        encoding: "utf8",
      })
    : null;
  const rawLintResult = lint?.stdout
    ? JSON.parse(lint.stdout)
    : { files_scanned: 0, blockers: 0, warnings: 0, infos: 0, findings: [] };
  const lintResult = normalizeLintResult(rawLintResult);
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
  // `brush` is an internal rendering helper exposed as registry:component
  // upstream, but it has no public docs/config and is not a standalone visual.
  const visual = item.type !== "registry:lib" && item.name !== "brush";
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

const visualNames = new Set(
  items.filter((item) => item.visual).map((item) => item.name),
);
const publishedNames = new Set(
  publishedRegistry.items?.map((item) => item.name) ?? [],
);
const publishedCount = [...visualNames].filter((name) =>
  publishedNames.has(name),
).length;
const missingNames = [...visualNames]
  .filter((name) => !publishedNames.has(name))
  .sort();
const extraNames = [...publishedNames]
  .filter((name) => !visualNames.has(name))
  .sort();

const summary = {
  upstream: {
    repository: "https://github.com/Remocn/remocn",
    commit: sourceCommit,
  },
  totalRegistryItems: items.length,
  visualItems: items.filter((item) => item.visual).length,
  sharedRuntimeItems: items.filter((item) => !item.visual).length,
  byFamily: countBy(
    items.filter((item) => item.visual),
    "family",
  ),
  byTranslationClass: countBy(items, "translationClass"),
  coverage: {
    publishedItems: publishedCount,
    missingItems: missingNames,
    extraItems: extraNames,
  },
  blockerItems: items
    .filter((item) => item.lint.blockers > 0)
    .map((item) => item.name),
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({ summary, items }, null, 2)}\n`);

const tableRows = Object.entries(summary.byTranslationClass)
  .map(([classification, count]) => `| ${classification} | ${count} |`)
  .join("\n");
const iconNames = new Set(
  items
    .filter((item) => item.family === "icons" && item.visual)
    .map((item) => item.name),
);
const fixtureNames = (fixtures) =>
  new Set(
    fixtures.map((item) => item.slug).filter((name) => visualNames.has(name)),
  );
const textNames = fixtureNames(textFixtures);
const coreNames = fixtureNames(coreFixtures);
const primitiveNames = fixtureNames(primitiveFixtures);
const categorizedNames = new Set([
  ...iconNames,
  ...textNames,
  ...coreNames,
  ...primitiveNames,
]);
const standaloneNames = new Set(
  [...visualNames].filter((name) => !categorizedNames.has(name)),
);
const publishedIn = (names) =>
  [...names].filter((name) => publishedNames.has(name)).length;
const publishedIconCount = publishedIn(iconNames);
const publishedTextCount = publishedIn(textNames);
const publishedCoreCount = publishedIn(coreNames);
const publishedPrimitiveCount = publishedIn(primitiveNames);
const publishedStandaloneCount = publishedIn(standaloneNames);
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

- ${publishedCount}/${visualNames.size} visual ports published in the local verified registry.
- ${publishedIconCount}/${iconNames.size} animated icons published.
- ${publishedTextCount}/${textNames.size} typography/effect ports published.
- ${publishedCoreCount}/${coreNames.size} composition/data ports published.
- ${publishedPrimitiveCount}/${primitiveNames.size} UI primitive ports published.
${standaloneNames.size > 0 ? `- ${publishedStandaloneCount}/${standaloneNames.size} standalone visual ports published (${[...standaloneNames].map((name) => `\`${name}\``).join(", ")}).\n` : ""}- ${missingNames.length} visual items remain.
- ${extraNames.length} local-only registry items.

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
