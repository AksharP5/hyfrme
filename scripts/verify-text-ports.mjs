import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const families = ["text", "core", "primitive", "icon"];

export async function remocnVerifierArgs(args, defaultFamily = null) {
  const option = (name) => {
    const index = args.indexOf(name);
    if (index === -1) return null;
    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`${name} requires a value.`);
    }
    if (args.indexOf(name, index + 1) !== -1) {
      throw new Error(`Specify ${name} once.`);
    }
    return value;
  };
  const selectionOptions = [
    "--family",
    "--only",
    "--source-profile",
    "--full-check",
  ];
  const values = Object.fromEntries(
    selectionOptions.map((name) => [name, option(name)]),
  );
  const family = values["--family"] ?? defaultFamily;
  if (family && !families.includes(family)) {
    throw new Error(`Unknown Remocn fixture family: ${family}`);
  }
  if (defaultFamily && family !== defaultFamily) {
    throw new Error(`This command verifies only ${defaultFamily} fixtures.`);
  }
  const sourceProfile = values["--source-profile"];
  if (sourceProfile && sourceProfile !== "remocn") {
    throw new Error("This command requires the Remocn source profile.");
  }
  const only = values["--only"];
  const requested = only
    ? new Set(only.split(",").map((slug) => slug.trim()))
    : null;
  if (requested?.has("")) {
    throw new Error("--only requires comma-separated fixture names.");
  }
  const iconShowcase = args.includes("--icon-showcase");
  if (args.includes("--cold-reference-browser") && (!iconShowcase || family !== "icon")) {
    throw new Error("--cold-reference-browser requires --icon-showcase and icon fixtures.");
  }
  if (iconShowcase && family && family !== "icon") {
    throw new Error("--icon-showcase requires icon fixtures.");
  }
  const selectedFamilies = family
    ? [family]
    : iconShowcase
      ? ["icon"]
      : requested
        ? families
        : families.filter((name) => name !== "icon");
  const fixtures = (
    await Promise.all(
      selectedFamilies.map(async (name) =>
        JSON.parse(
          await readFile(
            resolve(root, `catalog/${name}-fixtures.json`),
            "utf8",
          ),
        ),
      ),
    )
  ).flat();
  const selected = fixtures.filter(
    (entry) => !requested || requested.has(entry.slug),
  );
  if (!selected.length || (requested && selected.length !== requested.size)) {
    throw new Error(
      "--only must select known fixtures in the requested family.",
    );
  }
  // Full checks and lossless comparison are mandatory in the shared verifier.
  const removedIndices = new Set();
  for (const name of selectionOptions) {
    const index = args.indexOf(name);
    if (index !== -1) {
      removedIndices.add(index);
      removedIndices.add(index + 1);
    }
  }
  return [
    "--source-profile",
    "remocn",
    ...args.filter(
      (arg, index) => arg !== "--lossless" && !removedIndices.has(index),
    ),
    "--only",
    selected.map((entry) => entry.slug).join(","),
  ];
}

export async function verifyRemocnPorts(
  args = process.argv.slice(2),
  family = null,
) {
  if (args.includes("--help")) {
    const script = relative(root, process.argv[1] ?? import.meta.filename);
    console.log(
      `Usage: node ${script} ${family ? "" : "[--family text|core|primitive|icon] "}[--only slug,...] [--resume] [--reuse-reference] [--icon-showcase]\nEvery selected fixture requires a full HyperFrames check and exact lossless RGBA parity. Without --only, all fixtures in the selected family are verified.${family === "icon" ? " Authored showcases also accept --cold-reference-browser [--prepare] through the shared fresh verifier; canonical48 defaults are unchanged." : ""}`,
    );
    return;
  }
  const forwarded = await remocnVerifierArgs(args, family);
  const coldShowcase = forwarded.includes("--cold-reference-browser");
  const script = coldShowcase
    ? "scripts/verify-remocn-fresh.mjs"
    : "scripts/verify-snapcn-ports.mjs";
  const verifierArgs = coldShowcase ? forwarded.slice(2) : forwarded;
  const result = spawnSync(
    process.execPath,
    [resolve(root, script), ...verifierArgs],
    { cwd: root, env: process.env, stdio: "inherit" },
  );
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  await verifyRemocnPorts();
}
