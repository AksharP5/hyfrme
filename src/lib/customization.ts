import type { RegistryItem, RegistrySummary } from "../catalog";

export type CompositionVariable = {
  id: string;
  type: "string" | "number" | "color" | "boolean";
  label: string;
  default: string | number | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
};

export type CustomValues = Record<string, string | number | boolean>;
export type InstallMode = "prompt" | "pnpm" | "yarn" | "npm" | "bun";
export type InstallCommands = Record<InstallMode, string>;

const htmlEntities: Record<string, string> = {
  "&amp;": "&",
  "&quot;": '"',
  "&#39;": "'",
  "&lt;": "<",
  "&gt;": ">",
};

function decodeHtmlAttribute(value: string) {
  return value.replace(
    /&(amp|quot|#39|lt|gt);/g,
    (entity) => htmlEntities[entity] ?? entity,
  );
}

export function parseCompositionVariables(source: string) {
  const match = source.match(/data-composition-variables='([^']*)'/);
  if (!match) return [];
  try {
    return JSON.parse(decodeHtmlAttribute(match[1])) as CompositionVariable[];
  } catch {
    return [];
  }
}

export function defaultValues(variables: CompositionVariable[]): CustomValues {
  return Object.fromEntries(
    variables.map((variable) => [variable.id, variable.default]),
  );
}

function parseValue(variable: CompositionVariable, raw: string) {
  if (variable.type === "number") {
    const number = Number(raw);
    return Number.isFinite(number) ? number : variable.default;
  }
  if (variable.type === "boolean") return raw === "true";
  return raw;
}

export function valuesFromUrl(variables: CompositionVariable[]): CustomValues {
  const values = defaultValues(variables);
  const params = new URLSearchParams(window.location.search);
  for (const variable of variables) {
    const raw = params.get(`v.${variable.id}`);
    if (raw !== null) values[variable.id] = parseValue(variable, raw);
  }
  return values;
}

export function writeValuesToUrl(
  variables: CompositionVariable[],
  values: CustomValues,
) {
  const url = new URL(window.location.href);
  for (const variable of variables) {
    const key = `v.${variable.id}`;
    const value = values[variable.id];
    if (value === variable.default) url.searchParams.delete(key);
    else url.searchParams.set(key, String(value));
  }
  window.history.replaceState(null, "", url);
}

function shellQuote(value: string) {
  return `'${value.replaceAll("'", `'\"'\"'`)}'`;
}

export function buildInstallCommand(
  cliPackage: string,
  name: string,
  variables: CompositionVariable[],
  values: CustomValues,
) {
  const changed = variables.filter(
    (variable) => values[variable.id] !== variable.default,
  );
  const options = changed
    .map((variable) =>
      shellQuote(`${variable.id}=${String(values[variable.id])}`),
    )
    .map((value) => ` --set ${value}`)
    .join("");
  return `npx ${cliPackage} add ${name}${options}`;
}

export function buildInstallCommands(
  cliPackage: string,
  name: string,
  variables: CompositionVariable[],
  values: CustomValues,
): InstallCommands {
  const npm = buildInstallCommand(cliPackage, name, variables, values);
  const args = npm.slice(`npx ${cliPackage} `.length);
  return {
    prompt: `Add the Hyfrme ${name} block to my HyperFrames project. Run: ${npm}`,
    pnpm: `pnpm dlx ${cliPackage} ${args}`,
    yarn: `YARN_NPM_PREAPPROVED_PACKAGES=hyfrme yarn dlx ${cliPackage} ${args}`,
    npm,
    bun: `bunx ${cliPackage} ${args}`,
  };
}

function htmlAttributeJson(value: CustomValues) {
  return JSON.stringify(value)
    .replaceAll("&", "&amp;")
    .replaceAll("'", "&#39;");
}

export function changedValues(
  variables: CompositionVariable[],
  values: CustomValues,
) {
  return Object.fromEntries(
    variables
      .filter((variable) => values[variable.id] !== variable.default)
      .map((variable) => [variable.id, values[variable.id]]),
  ) as CustomValues;
}

export function buildUsageSnippet(
  item: RegistrySummary,
  variables: CompositionVariable[],
  values: CustomValues,
) {
  const overrides = changedValues(variables, values);
  const variableLine =
    Object.keys(overrides).length > 0
      ? `\n  data-variable-values='${htmlAttributeJson(overrides)}'`
      : "";
  return `<!-- Add this to your HyperFrames composition -->
<div
  id="${item.name}"
  data-composition-id="${item.name}"
  data-composition-src="compositions/${item.name}.html"
  ${variableLine.trimStart()}
  data-start="0"
  data-duration="${Number(item.duration.toFixed(3))}"
  data-track-index="1"
  data-width="${item.dimensions.width}"
  data-height="${item.dimensions.height}"
></div>`;
}

function registryFileUrl(name: string, path: string) {
  return `/registry/blocks/${encodeURIComponent(name)}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

function rewriteAssetPaths(source: string, item: RegistryItem) {
  const composition = item.files.find(
    (file) => file.type === "hyperframes:composition",
  );
  if (!composition) return source;
  const compositionDirectory = composition.target.split("/").slice(0, -1);

  let rewritten = source;
  for (const file of item.files) {
    const targetParts = file.target.split("/");
    let shared = 0;
    while (
      shared < compositionDirectory.length &&
      compositionDirectory[shared] === targetParts[shared]
    ) {
      shared += 1;
    }
    const relativeTarget = [
      ...Array(compositionDirectory.length - shared).fill(".."),
      ...targetParts.slice(shared),
    ].join("/");
    const relativePath = relativeTarget.startsWith(".")
      ? relativeTarget
      : `./${relativeTarget}`;
    rewritten = rewritten.replaceAll(
      relativePath,
      registryFileUrl(item.name, file.path),
    );
  }
  return rewritten;
}

export function buildPreviewDocument(
  source: string,
  item: RegistryItem,
  values: CustomValues,
  transparent: boolean,
) {
  const safeValues = rewriteAssetPaths(JSON.stringify(values), item)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e");
  const safeName = JSON.stringify(item.name);
  const width = item.dimensions.width;
  const height = item.dimensions.height;
  const backgroundRule = transparent
    ? "background: transparent !important;"
    : "";
  const previewScale = transparent ? 0.42 : 1;
  const bootstrap = `<script>
window.__hyperframes = { getVariables: () => (${safeValues}) };
window.addEventListener("load", () => {
  const fit = () => {
    const scale = Math.min(innerWidth / ${width}, innerHeight / ${height}) * ${previewScale};
    const x = (innerWidth - ${width} * scale) / 2;
    const y = (innerHeight - ${height} * scale) / 2;
    document.body.style.transform = "translate(" + x + "px," + y + "px) scale(" + scale + ")";
  };
  fit();
  addEventListener("resize", fit);
  requestAnimationFrame(() => {
    const timeline = window.__timelines?.[${safeName}];
    if (timeline) timeline.repeat(-1).play(0);
  });
});
</script>
<style>
html { width: 100%; height: 100%; overflow: hidden; ${backgroundRule} }
body {
  width: ${width}px !important;
  height: ${height}px !important;
  transform-origin: 0 0;
  ${backgroundRule}
}
</style>`;
  return rewriteAssetPaths(source, item).replace(
    "<head>",
    `<head>${bootstrap}`,
  );
}

const selectOptions: Record<string, string[]> = {
  animation: ["draw", "action", "both"],
  align: ["left", "center"],
  direction: ["left", "right", "up", "down"],
  fontWeight: ["400", "500", "600", "700"],
  weight: ["400", "500", "600", "700"],
  orientation: ["horizontal", "vertical"],
  state: ["idle", "hover", "press", "loading", "success"],
  theme: ["light", "dark"],
};

export function optionsFor(variable: CompositionVariable) {
  if (variable.options?.includes(String(variable.default))) {
    return variable.options;
  }
  const options = selectOptions[variable.id];
  return options?.includes(String(variable.default)) ? options : null;
}

const signedNumbers = new Set([
  "curvature",
  "rotateX",
  "rotateY",
  "rotation",
  "startTracking",
  "twist",
]);

export function numberBounds(
  variable: CompositionVariable,
  item: RegistrySummary,
) {
  const value = Number(variable.default);
  const withOverrides = (bounds: {
    min: number;
    max: number;
    step: number;
  }) => ({
    min: variable.min ?? bounds.min,
    max: variable.max ?? bounds.max,
    step: variable.step ?? bounds.step,
  });
  if (variable.id === "speed") {
    return withOverrides({ min: 0.25, max: 4, step: 0.25 });
  }
  if (variable.id === "size" && item.tags.includes("icon")) {
    return withOverrides({
      min: 12,
      max: Math.max(item.dimensions.width, item.dimensions.height),
      step: 1,
    });
  }
  if (signedNumbers.has(variable.id)) {
    const span = Math.max(Math.abs(value) * 2, 1);
    return withOverrides({
      min: -span,
      max: span,
      step: Number.isInteger(value) ? 1 : 0.05,
    });
  }
  if (Math.abs(value) <= 1) {
    return withOverrides({
      min: 0,
      max: Math.max(1, value * 2),
      step: 0.05,
    });
  }
  return withOverrides({
    min: 0,
    max: Math.max(Math.ceil(value * 2), 10),
    step: Number.isInteger(value) ? 1 : 0.1,
  });
}
