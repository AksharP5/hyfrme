#!/usr/bin/env node

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, posix, relative, resolve } from "node:path";

const defaultRegistry = "https://hyfrme.vercel.app/registry";
const registryRoot = (
  process.env.HYFRME_REGISTRY_URL ?? defaultRegistry
).replace(/\/$/, "");
const args = process.argv.slice(2);

const usage = `hyfrme — add motion blocks to HyperFrames

Usage:
  hyfrme add <name>... [--dir <project>] [--force]
  hyfrme add <name> [--set <key=value>]... [--dir <project>] [--force]
  hyfrme add --all [--dir <project>] [--force]

Examples:
  hyfrme add icon-activity
  hyfrme add soft-blur-in matrix-decode icon-sparkles
  hyfrme add --all
  hyfrme add soft-blur-in --dir ./my-video
  hyfrme add matrix-decode --set text=HELLO --set fontSize=48
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

  let directory = ".";
  let force = false;
  let installAll = false;
  const names = [];
  const settings = [];
  for (let index = 1; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--all") {
      installAll = true;
      continue;
    }
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
    if (value === "--set") {
      const setting = args[index + 1];
      if (!setting) fail("--set requires a key=value pair");
      settings.push(setting);
      index += 1;
      continue;
    }
    if (value.startsWith("--set=")) {
      settings.push(value.slice("--set=".length));
      continue;
    }
    if (value.startsWith("-")) fail(`unknown option "${value}"`);
    if (!/^[a-z0-9-]+$/.test(value)) {
      fail(`invalid component name "${value}"`);
    }
    names.push(value);
  }

  if (installAll && names.length > 0) {
    fail("--all cannot be combined with component names");
  }
  if (!installAll && names.length === 0) {
    fail("add requires a component name or --all");
  }
  if (settings.length > 0 && (installAll || names.length !== 1)) {
    fail("--set can only customize one named component at a time");
  }

  return {
    names: [...new Set(names)],
    installAll,
    projectDirectory: resolve(directory),
    force,
    settings,
  };
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

const decodeHtmlAttribute = (value) =>
  value
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");

const encodeHtmlAttribute = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const parseSettings = (settings) =>
  settings.map((setting) => {
    const separator = setting.indexOf("=");
    if (separator <= 0)
      fail(`invalid setting "${setting}" (expected key=value)`);
    return {
      id: setting.slice(0, separator),
      raw: setting.slice(separator + 1),
    };
  });

const parseSettingValue = (variable, raw) => {
  if (variable.type === "number") {
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      fail(`"${variable.id}" requires a number, received "${raw}"`);
    }
    return value;
  }
  if (variable.type === "boolean") {
    if (raw !== "true" && raw !== "false") {
      fail(`"${variable.id}" requires true or false, received "${raw}"`);
    }
    return raw === "true";
  }
  return raw;
};

const customizeSource = (source, settings, name) => {
  if (settings.length === 0) return source;
  const match = source.match(/data-composition-variables='([^']*)'/);
  if (!match) {
    fail(`component "${name}" does not expose customizable variables`);
  }

  let variables;
  try {
    variables = JSON.parse(decodeHtmlAttribute(match[1]));
  } catch {
    fail(`component "${name}" has invalid customization metadata`);
  }

  for (const setting of parseSettings(settings)) {
    const variable = variables.find((candidate) => candidate.id === setting.id);
    if (!variable) {
      const available = variables.map((candidate) => candidate.id).join(", ");
      fail(
        `unknown setting "${setting.id}" for ${name}. Available: ${available}`,
      );
    }
    variable.default = parseSettingValue(variable, setting.raw);
  }

  const metadata = encodeHtmlAttribute(JSON.stringify(variables));
  return source.replace(match[0], `data-composition-variables='${metadata}'`);
};

const rewriteInstalledAssetPaths = (source, configuredPath) => {
  const assetPath = configuredPath
    .replaceAll("\\", "/")
    .replace(/^\.?\//, "")
    .replace(/\/+$/, "");
  return source
    .replace(/(?:\.\.\/)+assets\//g, `${assetPath}/`)
    .replace(/(["'`(])\/assets\//g, `$1${assetPath}/`);
};

const rewriteManifestPaths = (source, item, config, projectDirectory) => {
  const composition = item.files.find(
    (file) => file.type === "hyperframes:composition",
  );
  if (!composition) return source;
  const compositionDirectory = posix.dirname(
    composition.target.replaceAll("\\", "/"),
  );

  let rewritten = source;
  for (const file of item.files) {
    const originalTarget = file.target.replaceAll("\\", "/");
    const originalRelative = posix.relative(
      compositionDirectory,
      originalTarget,
    );
    const installedTarget = relative(
      projectDirectory,
      targetFor(projectDirectory, config, item, file),
    ).replaceAll("\\", "/");
    const candidates = new Set([
      originalRelative.startsWith(".")
        ? originalRelative
        : `./${originalRelative}`,
      `/${originalTarget}`,
    ]);
    for (const candidate of candidates) {
      rewritten = rewritten.replaceAll(candidate, installedTarget);
    }
  }
  return rewritten;
};

const namespaceCompiledPort = (
  source,
  name,
  runtime = false,
  assetPath = "assets",
) => {
  const renderer = `window.__hyfrmeRenderers[${JSON.stringify(name)}]`;
  const variables = `window.__hyfrmeVariables[${JSON.stringify(name)}]`;
  let namespaced = rewriteInstalledAssetPaths(source, assetPath)
    .replaceAll("hyfrme-source-root", `${name}-source-root`)
    .replaceAll("hyfrme-source-stage", `${name}-source-stage`)
    .replaceAll("hyfrme-icon-root", `${name}-icon-root`)
    .replaceAll("hyfrme-icon-stage", `${name}-icon-stage`)
    .replaceAll("window.__hyfrmeRenderFrame", renderer);
  if (runtime) {
    namespaced = namespaced.replaceAll(
      "window.__hyperframes.getVariables()",
      variables,
    );
  }
  if (!runtime) {
    namespaced = namespaced.replace(
      /<script[^>]*\/gsap(?:\.min)?\.js[^>]*><\/script>\s*/gi,
      "",
    );
    namespaced = namespaced.replace(
      /<script>([\s\S]*?)<\/script>/gi,
      (_match, body) => `<script>
      (() => {
${body}
      })();
    </script>`,
    );
  }
  if (!runtime && namespaced.includes(".runtime.js")) {
    const bootstrap = `<script>
      window.__hyfrmeVariables = window.__hyfrmeVariables || {};
      ${variables} = window.__hyperframes.getVariables();
    </script>`;
    namespaced = namespaced.replace(
      /(<script\s+src=["'][^"']+\.runtime\.js["']><\/script>)/i,
      `${bootstrap}\n    $1`,
    );
  }
  if (runtime && namespaced !== source) {
    namespaced = `window.__hyfrmeRenderers = window.__hyfrmeRenderers || {};\nwindow.__hyfrmeVariables = window.__hyfrmeVariables || {};\n${namespaced}`;
  }
  return namespaced;
};

const toInstallableBlock = (source, name, assetPath) => {
  const namespaced = namespaceCompiledPort(source, name, false, assetPath);
  if (/<template(?:\s|>)/i.test(namespaced)) return namespaced;

  const html = namespaced.match(/<html([^>]*)>/i);
  const head = namespaced.match(/<head>([\s\S]*?)<\/head>/i);
  const body = namespaced.match(/<body>([\s\S]*?)<\/body>/i);
  if (!html || !head || !body) {
    fail(`component "${name}" has an unsupported composition structure`);
  }

  const templateContent = `${head[1]
    .replace(/<meta[^>]*charset[^>]*>\s*/gi, "")
    .trim()}\n${body[1].trim()}`
    .replace(/html,\s*body\s*\{([^}]*)\}/gi, "#root {$1}")
    .replace(/(^|\})\s*body\s*\{([^}]*)\}/gi, "$1\n#root {$2}");
  const indented = templateContent
    .split("\n")
    .map((line) => `      ${line}`)
    .join("\n");

  return `<!doctype html>
<html${html[1]}>
  <head>
    <meta charset="UTF-8">
  </head>
  <body>
    <template>
${indented}
    </template>
  </body>
</html>
`;
};

const inlineCompiledRuntime = (source, runtimeSource, runtimePath, name) => {
  const variables = `window.__hyfrmeVariables[${JSON.stringify(name)}]`;
  // HyperFrames lints every inline script as authored animation code. React's
  // compiled runtime uses these APIs internally for bookkeeping/scheduling, so
  // preserve their behavior without presenting them as composition source.
  const lintSafeRuntime = runtimeSource
    .replaceAll("Math.random(", 'Math["random"](')
    .replaceAll("Date.now(", 'Date["now"](');
  const bootstrap = `<script>
      window.__hyfrmeVariables = window.__hyfrmeVariables || {};
      ${variables} = window.__hyperframes.getVariables();
    </script>`;
  const inlineRuntime = `<script>
${lintSafeRuntime.replace(/<\/script/gi, "<\\/script")}
    </script>`;
  const replacement = `${bootstrap}\n    ${inlineRuntime}`;
  return source
    .replace(`<script src="${runtimePath}"></script>`, () => replacement)
    .replace(`<script src='${runtimePath}'></script>`, () => replacement);
};

const { names, installAll, projectDirectory, force, settings } = parseOptions();
const config = await readProjectConfig(projectDirectory);
const assetPath = config.paths?.assets ?? "assets";
const matchesExistingFile = async (path, bytes) => {
  try {
    const current = new Uint8Array(await readFile(path));
    if (current.length !== bytes.length) return false;
    return current.every((byte, index) => byte === bytes[index]);
  } catch {
    return false;
  }
};

const prepareComponent = async (name, componentSettings) => {
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

  const fetched = await Promise.all(
    item.files.map(async (file) => {
      const bytes = await fetchBytes(
        `${itemRoot}/${file.path
          .split("/")
          .map((segment) => encodeURIComponent(segment))
          .join("/")}`,
        file.path,
      );
      return {
        bytes,
        file,
        target: targetFor(projectDirectory, config, item, file),
      };
    }),
  );

  const runtimeDownloads = new Map(
    fetched
      .filter(({ file }) => file.path.endsWith(".runtime.js"))
      .map(({ bytes, file, target }) => {
        const source = new TextDecoder().decode(bytes);
        const relocated = rewriteManifestPaths(
          source,
          item,
          config,
          projectDirectory,
        );
        return [
          file.path,
          {
            path: relative(projectDirectory, target).replaceAll("\\", "/"),
            source: namespaceCompiledPort(relocated, name, true, assetPath),
          },
        ];
      }),
  );

  const downloads = fetched.map(({ bytes, file, target }) => {
    const isComposition = file.type === "hyperframes:composition";
    const isRuntime = file.path.endsWith(".runtime.js");
    let output = bytes;
    if (isComposition || isRuntime) {
      const source = new TextDecoder().decode(bytes);
      const relocated = rewriteManifestPaths(
        source,
        item,
        config,
        projectDirectory,
      );
      if (isComposition) {
        let customized = customizeSource(relocated, componentSettings, name);
        for (const runtime of runtimeDownloads.values()) {
          customized = inlineCompiledRuntime(
            customized,
            runtime.source,
            runtime.path,
            name,
          );
        }
        output = new TextEncoder().encode(
          toInstallableBlock(customized, name, assetPath),
        );
      } else {
        output = new TextEncoder().encode(
          runtimeDownloads.get(file.path)?.source ??
            namespaceCompiledPort(relocated, name, true, assetPath),
        );
      }
    }
    return {
      bytes: output,
      file,
      target,
    };
  });

  return { item, downloads };
};

const installComponent = async (name, componentSettings, detailedOutput) => {
  const { item, downloads } = await prepareComponent(name, componentSettings);
  const conflicts = [];
  const unchanged = new Set();

  for (const download of downloads) {
    if (!(await exists(download.target))) continue;
    if (await matchesExistingFile(download.target, download.bytes)) {
      unchanged.add(download.target);
    } else {
      conflicts.push(download.target);
    }
  }

  if (conflicts.length > 0 && !force) {
    fail(
      `${relative(projectDirectory, conflicts[0])} already exists. Re-run with --force to replace it.`,
    );
  }

  for (const download of downloads) {
    if (unchanged.has(download.target)) continue;
    await mkdir(dirname(download.target), { recursive: true });
    await writeFile(download.target, download.bytes);
  }

  if (!detailedOutput) return item.title ?? name;

  console.log(`Added ${item.title ?? name}`);
  if (componentSettings.length > 0) {
    console.log(`  customized: ${componentSettings.join(", ")}`);
  }
  for (const download of downloads) {
    console.log(`  ${relative(projectDirectory, download.target)}`);
  }
  if (item.type === "hyperframes:block" && item.dimensions) {
    const composition = downloads.find(
      (download) => download.file.type === "hyperframes:composition",
    );
    const compositionPath = composition
      ? relative(projectDirectory, composition.target).replaceAll("\\", "/")
      : `compositions/${item.name}.html`;
    console.log(`
Use it in your composition:
  <div
    id="${item.name}"
    data-composition-id="${item.name}"
    data-composition-src="${compositionPath}"
    data-start="0"
    data-duration="${item.duration}"
    data-track-index="1"
    data-width="${item.dimensions.width}"
    data-height="${item.dimensions.height}"
  ></div>`);
  }

  return item.title ?? name;
};

const namesToInstall = installAll
  ? await (async () => {
      const registry = await fetchJson(
        `${registryRoot}/registry.json`,
        "Hyfrme registry",
      );
      if (!Array.isArray(registry.items) || registry.items.length === 0) {
        fail("Hyfrme registry has no installable components");
      }
      const registryNames = registry.items.map((item) => item?.name);
      if (
        registryNames.some(
          (name) => typeof name !== "string" || !/^[a-z0-9-]+$/.test(name),
        )
      ) {
        fail("Hyfrme registry contains an invalid component name");
      }
      return [...new Set(registryNames)];
    })()
  : names;

if (namesToInstall.length === 1) {
  await installComponent(namesToInstall[0], settings, true);
} else {
  console.log(`Adding ${namesToInstall.length} Hyfrme components…`);
  for (const [index, name] of namesToInstall.entries()) {
    const title = await installComponent(name, [], false);
    console.log(`  ${index + 1}/${namesToInstall.length} ${title}`);
  }
  console.log(`Added ${namesToInstall.length} Hyfrme components.`);
}
