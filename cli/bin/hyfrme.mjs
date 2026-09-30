#!/usr/bin/env node

import {
  access,
  lstat,
  mkdir,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, posix, relative, resolve, sep } from "node:path";

const defaultRegistry = "https://hyfrme.vercel.app/registry";
const nativeRepository = "https://github.com/heygen-com/hyperframes";
const registryRoot = (
  process.env.HYFRME_REGISTRY_URL ?? defaultRegistry
).replace(/\/$/, "");
const args = process.argv.slice(2);

const usage = `hyfrme — add motion blocks to HyperFrames

Usage:
  hyfrme add <name>... [--dir <project>] [--force]
  hyfrme add <name> [--set <key=value>]... [--dir <project>] [--force]
  hyfrme add --all [--dir <project>] [--force]
  hyfrme init <template> [--dir <project>] [--force]

Examples:
  hyfrme add icon-activity
  hyfrme add soft-blur-in matrix-decode icon-sparkles
  hyfrme add --all
  hyfrme add soft-blur-in --dir ./my-video
  hyfrme add matrix-decode --set text=HELLO --set fontSize=48
  hyfrme init hyperframes-product-promo --dir ./my-video
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

  const command = args[0];
  if (command !== "add" && command !== "init") {
    fail(`unknown command "${command}"\n\n${usage}`);
  }

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
    fail(
      command === "init"
        ? "init requires a template name"
        : "add requires a component name or --all",
    );
  }
  if (settings.length > 0 && (installAll || names.length !== 1)) {
    fail("--set can only customize one named component at a time");
  }
  if (command === "init" && (installAll || names.length !== 1)) {
    fail("init requires one template name and does not support --all");
  }
  if (command === "init" && settings.length > 0) {
    fail("init does not support --set. Edit the installed template directly.");
  }

  return {
    command,
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
    relativeTarget === ".." ||
    relativeTarget.startsWith(`..${sep}`) ||
    isAbsolute(relativeTarget)
  ) {
    fail(`unsafe target path in ${item.name}: ${file.target}`);
  }
  return target;
};

const requireSafeTarget = async (projectRoot, target, name, originalTarget) => {
  let existingPath = target;
  for (;;) {
    try {
      await lstat(existingPath);
      break;
    } catch (error) {
      if (error.code !== "ENOENT") {
        fail(`could not inspect ${existingPath}: ${error.message}`);
      }
      existingPath = dirname(existingPath);
    }
  }

  const actualPath = await realpath(existingPath).catch((error) => {
    fail(`unsafe target path in ${name}: ${originalTarget} (${error.message})`);
  });
  const relativeTarget = relative(projectRoot, actualPath);
  if (
    relativeTarget === ".." ||
    relativeTarget.startsWith(`..${sep}`) ||
    isAbsolute(relativeTarget)
  ) {
    fail(`unsafe target path in ${name}: ${originalTarget}`);
  }
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
    if (raw.trim() === "" || !Number.isFinite(value)) {
      fail(`"${variable.id}" requires a number, received "${raw}"`);
    }
    if (typeof variable.min === "number" && value < variable.min) {
      fail(
        `"${variable.id}" must be at least ${variable.min}, received ${value}`,
      );
    }
    if (typeof variable.max === "number" && value > variable.max) {
      fail(
        `"${variable.id}" must be at most ${variable.max}, received ${value}`,
      );
    }
    return value;
  }
  if (variable.type === "boolean") {
    if (raw !== "true" && raw !== "false") {
      fail(`"${variable.id}" requires true or false, received "${raw}"`);
    }
    return raw === "true";
  }
  const options = variable.options?.map((option) =>
    typeof option === "string" ? option : option.value,
  );
  if (options && !options.includes(raw)) {
    fail(
      `"${variable.id}" must be one of: ${options.join(", ")}, received "${raw}"`,
    );
  }
  if (
    typeof variable.maxLength === "number" &&
    raw.length > variable.maxLength
  ) {
    fail(`"${variable.id}" must be at most ${variable.maxLength} characters`);
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
  return `<!doctype html>
<html${html[1]}>
  <head>
    <meta charset="UTF-8">
  </head>
  <body>
    <template>
${templateContent}
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

const { command, names, installAll, projectDirectory, force, settings } =
  parseOptions();
if (command === "init") await mkdir(projectDirectory, { recursive: true });
const configPath = resolve(projectDirectory, "hyperframes.json");
const needsConfig = command === "init" && !(await exists(configPath));
const config = needsConfig
  ? {
      $schema: "https://hyperframes.heygen.com/schema/hyperframes.json",
      paths: {
        blocks: "compositions",
        components: "compositions/components",
        assets: "assets",
      },
    }
  : await readProjectConfig(projectDirectory);
const projectRoot = await realpath(projectDirectory);
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

const itemCache = new Map();
const fetchItem = async (name) => {
  if (itemCache.has(name)) return itemCache.get(name);
  const itemRoot = `${registryRoot}/blocks/${encodeURIComponent(name)}`;
  const item = await fetchJson(
    `${itemRoot}/registry-item.json`,
    `component "${name}"`,
  );

  if (
    !item ||
    item.name !== name ||
    !Array.isArray(item.files) ||
    item.files.length === 0 ||
    item.files.some(
      (file) =>
        typeof file?.path !== "string" ||
        typeof file.target !== "string" ||
        !file.path ||
        !file.target,
    ) ||
    (item.registryDependencies !== undefined &&
      (!Array.isArray(item.registryDependencies) ||
        item.registryDependencies.some(
          (dependency) =>
            typeof dependency !== "string" || !/^[a-z0-9-]+$/.test(dependency),
        )))
  ) {
    fail(`component "${name}" has an invalid registry manifest`);
  }
  itemCache.set(name, item);
  return item;
};

const resolveItems = async (name) => {
  const resolved = new Map();
  const visiting = [];
  const visit = async (current) => {
    if (resolved.has(current)) return;
    if (visiting.includes(current)) {
      fail(
        `circular registry dependencies: ${[...visiting, current].join(" -> ")}`,
      );
    }
    visiting.push(current);
    const item = await fetchItem(current);
    if (
      item.type === "hyperframes:example" &&
      (command !== "init" || current !== name)
    ) {
      fail(
        `"${current}" is a project template. Use hyfrme init ${current} --dir <project>.`,
      );
    }
    for (const dependency of item.registryDependencies ?? []) {
      await visit(dependency);
    }
    visiting.pop();
    resolved.set(current, item);
  };
  await visit(name);
  const item = resolved.get(name);
  if (command === "init" && item.type !== "hyperframes:example") {
    fail(`"${name}" is not a project template. Use hyfrme add ${name}.`);
  }
  return [...resolved.values()];
};

const rewriteNativePaths = (source, file, fetched) => {
  const originalDirectory = posix.dirname(file.target.replaceAll("\\", "/"));
  const installedFile = fetched.find((download) => download.file === file);
  const installedDirectory = posix.dirname(
    relative(projectDirectory, installedFile.target).replaceAll("\\", "/"),
  );
  const replacements = new Map();
  for (const download of fetched) {
    const original = download.file.target.replaceAll("\\", "/");
    const installed = relative(projectDirectory, download.target).replaceAll(
      "\\",
      "/",
    );
    const originalRelative = posix.relative(originalDirectory, original);
    const installedRelative = posix.relative(installedDirectory, installed);
    replacements.set(original, installed);
    replacements.set(`/${original}`, `/${installed}`);
    replacements.set(originalRelative, installedRelative);
    replacements.set(`./${originalRelative}`, `./${installedRelative}`);
    if (download.file.url) replacements.set(download.file.url, installed);
  }
  const candidates = [...replacements]
    .filter(([original, installed]) => original !== installed)
    .map(([original]) => original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (candidates.length === 0) return source;
  const reference = new RegExp(
    `(["'\x60(])(${candidates.join("|")})(?=["'\x60)])`,
    "g",
  );
  return source.replace(
    reference,
    (_match, prefix, original) => `${prefix}${replacements.get(original)}`,
  );
};

const materializeTemplate = (source, item, file) => {
  const initialized = source
    .replace(/<video[^>]*src="__VIDEO_SRC__"[^>]*>[\s\S]*?<\/video>/g, "")
    .replace(/<video[^>]*src="__VIDEO_SRC__"[^>]*>/g, "")
    .replace(/<audio[^>]*src="__VIDEO_SRC__"[^>]*>[\s\S]*?<\/audio>/g, "")
    .replace(/<audio[^>]*src="__VIDEO_SRC__"[^>]*>/g, "")
    .replaceAll("__VIDEO_DURATION__", "10");
  if (
    item.origin?.repository !== nativeRepository ||
    item.name !== "hyperframes-decision-tree" ||
    file.path !== "compositions/decision_tree.html"
  ) {
    return initialized;
  }
  // HyperFrames' GSAP proxy omits labels; this template's hold5 starts at 6.25s.
  return initialized.replaceAll(
    'tl.labels["hold5"]',
    '(tl.labels?.["hold5"] ?? 6.25)',
  );
};

const prepareComponent = async (item, componentSettings) => {
  const { name } = item;
  const itemRoot = `${registryRoot}/blocks/${encodeURIComponent(name)}`;

  const fetched = await Promise.all(
    item.files.map(async (file) => {
      const target = targetFor(projectDirectory, config, item, file);
      await requireSafeTarget(projectRoot, target, item.name, file.target);
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
        target,
      };
    }),
  );

  if (
    item.origin?.repository === nativeRepository ||
    item.type === "hyperframes:example"
  ) {
    const customizable =
      componentSettings.length > 0
        ? fetched.find(
            ({ bytes, file }) =>
              file.path.endsWith(".html") &&
              /data-composition-variables='/.test(
                new TextDecoder().decode(bytes),
              ),
          )
        : undefined;
    if (componentSettings.length > 0 && !customizable) {
      fail(
        `component "${name}" has no declared composition variables. Edit native CSS parameters directly in the installed source.`,
      );
    }
    const downloads = fetched.map((download) => {
      if (!/\.(?:html|css|m?js)$/i.test(download.file.path)) return download;
      const source = new TextDecoder().decode(download.bytes);
      const initialized =
        item.type === "hyperframes:example" &&
        download.file.path.endsWith(".html")
          ? materializeTemplate(source, item, download.file)
          : source;
      const relocated = rewriteNativePaths(initialized, download.file, fetched);
      const customized =
        download === customizable
          ? customizeSource(relocated, componentSettings, name)
          : relocated;
      return customized === source
        ? download
        : { ...download, bytes: new TextEncoder().encode(customized) };
    });
    return { item, downloads };
  }

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
  const items = await resolveItems(name);
  const prepared = await Promise.all(
    items.map((item) =>
      prepareComponent(item, item.name === name ? componentSettings : []),
    ),
  );
  const { item } = prepared.at(-1);
  const downloads = prepared.flatMap((component) => component.downloads);
  if (needsConfig) {
    await requireSafeTarget(projectRoot, configPath, name, "hyperframes.json");
    downloads.push({
      target: configPath,
      bytes: new TextEncoder().encode(`${JSON.stringify(config, null, 2)}\n`),
      file: { target: "hyperframes.json", type: "hyperframes:asset" },
    });
  }
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

  console.log(
    command === "init"
      ? `Initialized ${item.title ?? name} in ${projectDirectory}`
      : `Added ${item.title ?? name}`,
  );
  if (componentSettings.length > 0) {
    console.log(`  customized: ${componentSettings.join(", ")}`);
  }
  for (const download of downloads) {
    console.log(`  ${relative(projectDirectory, download.target)}`);
  }
  if (item.type === "hyperframes:block" && item.dimensions) {
    const composition = prepared
      .at(-1)
      .downloads.find(
        (download) => download.file.type === "hyperframes:composition",
      );
    const compositionPath = composition
      ? relative(projectDirectory, composition.target).replaceAll("\\", "/")
      : `compositions/${item.name}.html`;
    const compositionId =
      item.origin?.repository === nativeRepository && composition
        ? (new TextDecoder()
            .decode(composition.bytes)
            .replace(/<!--[\s\S]*?-->/g, "")
            .match(/\bdata-composition-id=["']([^"']+)["']/)?.[1] ??
          item.origin.name)
        : item.name;
    console.log(`
Use it in your composition:
  <div
    id="${compositionId}"
    data-composition-id="${compositionId}"
    data-composition-src="${compositionPath}"
    data-start="0"
    data-duration="${item.duration}"
    data-track-index="1"
    data-width="${item.dimensions.width}"
    data-height="${item.dimensions.height}"
  ></div>`);
  }
  if (item.type === "hyperframes:component") {
    console.log(
      "\nPaste the installed snippet's markup, styles, and script into your composition. Follow its timeline integration notes.",
    );
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
      const components = registry.items.filter(
        (item) => item.type !== "hyperframes:example",
      );
      if (components.length === 0) {
        fail("Hyfrme registry has no installable blocks or components");
      }
      const templateCount = registry.items.length - components.length;
      if (templateCount > 0) {
        console.log(
          `${templateCount} project templates use hyfrme init <template> --dir <project>.`,
        );
      }
      return [...new Set(components.map((item) => item.name))];
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
