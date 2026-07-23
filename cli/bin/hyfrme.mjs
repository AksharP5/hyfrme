#!/usr/bin/env node

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";

const defaultRegistry = "https://hyfrme.vercel.app/registry";
const registryRoot = (
  process.env.HYFRME_REGISTRY_URL ?? defaultRegistry
).replace(/\/$/, "");
const args = process.argv.slice(2);

const usage = `hyfrme — add motion blocks to HyperFrames

Usage:
  hyfrme add <name> [--dir <project>] [--force]

Examples:
  hyfrme add icon-activity
  hyfrme add soft-blur-in --dir ./my-video
`;

const fail = (message) => {
  console.error(`hyfrme: ${message}`);
  process.exit(1);
};

const readProjectConfig = async (projectDirectory) => {
  const configPath = resolve(projectDirectory, "hyperframes.json");
  try {
    return JSON.parse(await readFile(configPath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") {
      fail(
        `no hyperframes.json found in ${projectDirectory}. Run this command inside a HyperFrames project.`,
      );
    }
    fail(`could not read ${configPath}: ${error.message}`);
  }
};

const parseOptions = () => {
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(usage);
    process.exit(0);
  }

  if (args[0] !== "add") fail(`unknown command "${args[0]}"\n\n${usage}`);
  const name = args[1];
  if (!name || name.startsWith("-")) fail("add requires a component name");
  if (!/^[a-z0-9-]+$/.test(name)) fail(`invalid component name "${name}"`);

  let directory = ".";
  let force = false;
  for (let index = 2; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--force") {
      force = true;
      continue;
    }
    if (value === "--dir") {
      directory = args[index + 1];
      if (!directory) fail("--dir requires a path");
      index += 1;
      continue;
    }
    if (value.startsWith("--dir=")) {
      directory = value.slice("--dir=".length);
      continue;
    }
    fail(`unknown option "${value}"`);
  }

  return { name, projectDirectory: resolve(directory), force };
};

const fetchBytes = async (url, label) => {
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) fail(`${label} was not found`);
    fail(`could not download ${label} (${response.status})`);
  }
  return new Uint8Array(await response.arrayBuffer());
};

const fetchJson = async (url, label) => {
  const bytes = await fetchBytes(url, label);
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    fail(`${label} returned invalid JSON`);
  }
};

const targetFor = (projectDirectory, config, item, file) => {
  const normalized = file.target.replaceAll("\\", "/");
  const isComponent = item.type === "hyperframes:component";
  const mappings = [
    ...(isComponent
      ? [
          {
            from: "compositions/components",
            to: config.paths?.components ?? "compositions/components",
          },
        ]
      : [
          {
            from: "compositions",
            to: config.paths?.blocks ?? "compositions",
          },
        ]),
    { from: "assets", to: config.paths?.assets ?? "assets" },
  ];
  const mapping = mappings.find(({ from }) =>
    normalized.startsWith(`${from}/`),
  );
  const targetPath = mapping
    ? `${mapping.to}/${normalized.slice(mapping.from.length + 1)}`
    : normalized;
  const target = resolve(projectDirectory, targetPath);
  const relativeTarget = relative(projectDirectory, target);

  if (
    !normalized ||
    relativeTarget.startsWith("..") ||
    isAbsolute(relativeTarget)
  ) {
    fail(`unsafe target path in ${item.name}: ${file.target}`);
  }
  return target;
};

const exists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const { name, projectDirectory, force } = parseOptions();
const config = await readProjectConfig(projectDirectory);
const itemRoot = `${registryRoot}/blocks/${encodeURIComponent(name)}`;
const item = await fetchJson(
  `${itemRoot}/registry-item.json`,
  `component "${name}"`,
);

if (
  item.name !== name ||
  !Array.isArray(item.files) ||
  item.files.length === 0
) {
  fail(`component "${name}" has an invalid registry manifest`);
}

const downloads = await Promise.all(
  item.files.map(async (file) => ({
    bytes: await fetchBytes(
      `${itemRoot}/${file.path
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/")}`,
      file.path,
    ),
    target: targetFor(projectDirectory, config, item, file),
  })),
);

const conflicts = [];
for (const download of downloads) {
  if (await exists(download.target)) conflicts.push(download.target);
}
if (conflicts.length > 0 && !force) {
  fail(
    `${relative(projectDirectory, conflicts[0])} already exists. Re-run with --force to replace it.`,
  );
}

for (const download of downloads) {
  await mkdir(dirname(download.target), { recursive: true });
  await writeFile(download.target, download.bytes);
}

console.log(`Added ${item.title ?? name}`);
for (const download of downloads) {
  console.log(`  ${relative(projectDirectory, download.target)}`);
}
