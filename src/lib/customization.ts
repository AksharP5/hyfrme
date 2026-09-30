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
  maxLength?: number;
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
    const parsed: unknown = JSON.parse(decodeHtmlAttribute(match[1]));
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((value: unknown): CompositionVariable[] => {
      if (
        !value ||
        typeof value !== "object" ||
        !("id" in value) ||
        typeof value.id !== "string" ||
        !("type" in value) ||
        !("default" in value)
      )
        return [];
      const type =
        value.type === "enum" || value.type === "image" ? "string" : value.type;
      if (
        type !== "string" &&
        type !== "number" &&
        type !== "color" &&
        type !== "boolean"
      )
        return [];
      const initial = value.default;
      if (
        typeof initial !== "string" &&
        typeof initial !== "number" &&
        typeof initial !== "boolean"
      )
        return [];
      const options =
        "options" in value && Array.isArray(value.options)
          ? value.options.flatMap((option: unknown) => {
              if (typeof option === "string") return [option];
              if (
                option &&
                typeof option === "object" &&
                "value" in option &&
                typeof option.value === "string"
              )
                return [option.value];
              return [];
            })
          : undefined;
      return [
        {
          id: value.id,
          type,
          default: initial,
          label:
            "label" in value && typeof value.label === "string"
              ? value.label
              : value.id,
          ...(options?.length ? { options } : {}),
          ...Object.fromEntries(
            ["min", "max", "step", "maxLength"].flatMap((key) => {
              const bound = Reflect.get(value, key);
              return typeof bound === "number" && Number.isFinite(bound)
                ? [[key, bound]]
                : [];
            }),
          ),
        },
      ];
    });
  } catch {
    return [];
  }
}

export function defaultValues(variables: CompositionVariable[]): CustomValues {
  return Object.fromEntries(
    variables.map((variable) => [variable.id, variable.default]),
  );
}

export function parseVariableValue(variable: CompositionVariable, raw: string) {
  if (variable.type === "number") {
    const number = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(number)) return variable.default;
    return Math.min(
      variable.max ?? Infinity,
      Math.max(variable.min ?? -Infinity, number),
    );
  }
  if (variable.type === "boolean") {
    if (raw === "true") return true;
    if (raw === "false") return false;
    return variable.default;
  }
  if (variable.options && !variable.options.includes(raw))
    return variable.default;
  return variable.maxLength === undefined
    ? raw
    : raw.slice(0, variable.maxLength);
}

export function valuesFromUrl(variables: CompositionVariable[]): CustomValues {
  const values = defaultValues(variables);
  const params = new URLSearchParams(window.location.search);
  for (const variable of variables) {
    const raw = params.get(`v.${variable.id}`);
    if (raw !== null) values[variable.id] = parseVariableValue(variable, raw);
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
  action: "add" | "init" = "add",
): InstallCommands {
  const npm =
    buildInstallCommand(cliPackage, name, variables, values).replace(
      " add ",
      ` ${action} `,
    ) +
    (action === "init" ? ` --dir ./${name.replace(/^hyperframes-/, "")}` : "");
  const args = npm.slice(`npx ${cliPackage} `.length);
  return {
    prompt: `Install the Hyfrme ${name} item to my HyperFrames project. Run: ${npm}`,
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

export function customizedSource(source: string, values: CustomValues) {
  return source.replace(
    /<!--[\s\S]*?-->|data-composition-variables='([^']*)'/g,
    (match, declaration: string | undefined) => {
      if (declaration === undefined) return match;
      const metadata: unknown = JSON.parse(decodeHtmlAttribute(declaration));
      if (!Array.isArray(metadata)) return match;
      const variables = metadata.map((variable: unknown) => {
        if (
          !variable ||
          typeof variable !== "object" ||
          !("id" in variable) ||
          typeof variable.id !== "string" ||
          !Object.hasOwn(values, variable.id)
        )
          return variable;
        return { ...variable, default: values[variable.id] };
      });
      const encoded = JSON.stringify(variables)
        .replaceAll("&", "&amp;")
        .replaceAll("'", "&#39;");
      return `data-composition-variables='${encoded}'`;
    },
  );
}

export function buildUsageSnippet(
  item: RegistrySummary,
  variables: CompositionVariable[],
  values: CustomValues,
) {
  if (!item.dimensions || item.duration === null)
    return "<!-- Paste the installed HTML snippet into your composition. -->";
  const overrides = changedValues(variables, values);
  const variableLine =
    Object.keys(overrides).length > 0
      ? `\n  data-variable-values='${htmlAttributeJson(overrides)}'`
      : "";
  return `<!-- Add this to your HyperFrames composition -->
<div
  id="${item.name}"
  data-composition-id="${item.compositionId}"
  data-composition-src="${item.sourceTarget}"
  ${variableLine.trimStart()}
  data-start="0"
  data-duration="${Number(item.duration.toFixed(3))}"
  data-track-index="1"
  data-width="${item.dimensions.width}"
  data-height="${item.dimensions.height}"
></div>`;
}

function registryFileUrl(name: string, path: string) {
  return new URL(
    `/registry/blocks/${encodeURIComponent(name)}/${path.split("/").map(encodeURIComponent).join("/")}`,
    window.location.origin,
  ).href;
}

function rewriteAssetPaths(source: string, item: RegistryItem) {
  const composition =
    item.files.find((file) => file.path === item.sourcePath) ??
    item.files.find(
      (file) =>
        file.type === "hyperframes:composition" ||
        file.type === "hyperframes:snippet",
    );
  if (!composition) return source;
  const compositionDirectory = composition.target.split("/").slice(0, -1);

  let rewritten = source;
  for (const file of item.files) {
    const url = registryFileUrl(item.name, file.path);
    if (file.url) rewritten = rewritten.replaceAll(file.url, url);
    for (const target of [file.target, `/${file.target}`, `./${file.target}`]) {
      for (const quote of ['"', "'", "`"]) {
        rewritten = rewritten.replaceAll(
          `${quote}${target}${quote}`,
          `${quote}${url}${quote}`,
        );
      }
      rewritten = rewritten.replaceAll(`url(${target})`, `url(${url})`);
    }
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
    for (const quote of ['"', "'", "`"]) {
      rewritten = rewritten.replaceAll(
        `${quote}${relativeTarget}${quote}`,
        `${quote}${url}${quote}`,
      );
    }
    rewritten = rewritten.replaceAll(`url(${relativeTarget})`, `url(${url})`);
  }
  const directories = new Map<string, string | null>();
  for (const file of item.files) {
    const target = file.target.split("/");
    const path = file.path.split("/");
    const targetName = target.pop();
    const pathName = path.pop();
    const targetDirectory = target.join("/");
    const sourceDirectory = path.join("/");
    const existing = directories.get(targetDirectory);
    directories.set(
      targetDirectory,
      targetName !== pathName ||
        (existing !== undefined && existing !== sourceDirectory)
        ? null
        : sourceDirectory,
    );
  }
  for (const [target, path] of directories) {
    if (!target || path === null) continue;
    const url = registryFileUrl(item.name, path ? `${path}/` : "");
    for (const prefix of [`${target}/`, `./${target}/`, `/${target}/`]) {
      for (const quote of ['"', "'", "`"]) {
        rewritten = rewritten.replaceAll(`${quote}${prefix}`, `${quote}${url}`);
      }
    }
  }
  return rewritten;
}

export function buildPreviewDocument(
  source: string,
  item: RegistryItem,
  values: CustomValues,
  transparent: boolean,
  nativeViewport = false,
) {
  const safeValues = rewriteAssetPaths(JSON.stringify(values), item)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e");
  const safeName = JSON.stringify(item.compositionId);
  const width = item.dimensions?.width ?? 1920;
  const height = item.dimensions?.height ?? 1080;
  const backgroundRule = transparent
    ? "background: transparent !important;"
    : "";
  const previewScale = transparent ? 0.42 : 1;
  const bootstrap = `<script>
window.__hyperframes = { getVariables: () => (${safeValues}) };
window.__timelines = {};
const previewError = (error, paused = false) => {
  console.error("Component preview failed", error);
  parent.postMessage({type: "hyfrme-preview-error", message: error?.message || String(error), paused}, parent.location.origin);
};
const runtimeError = (error) => {
  window.__timelines?.[${safeName}]?.pause();
  for (const media of document.querySelectorAll("video, audio")) media.pause();
  previewError(error, true);
};
window.addEventListener("error", (event) => runtimeError(event.error || event.message));
window.addEventListener("unhandledrejection", (event) => runtimeError(event.reason));
window.addEventListener("load", () => {
  if (${!transparent} && frameElement && getComputedStyle(document.documentElement).backgroundColor === "rgba(0, 0, 0, 0)") {
    document.documentElement.style.backgroundColor = parent.getComputedStyle(frameElement).getPropertyValue("--preview");
  }
  const fit = () => {
    if (${nativeViewport}) return;
    const scale = Math.min(innerWidth / ${width}, innerHeight / ${height}) * ${previewScale};
    const x = (innerWidth - ${width} * scale) / 2;
    const y = (innerHeight - ${height} * scale) / 2;
    document.body.style.transform = "translate(" + x + "px," + y + "px) scale(" + scale + ")";
  };
  Promise.resolve(window.__hyfrmeReady).then(() => {
    fit();
    addEventListener("resize", fit);
    requestAnimationFrame(() => {
      const timeline = window.__timelines?.[${safeName}];
      if (!timeline) return;
      const tracked = new WeakSet();
      const pending = new WeakSet();
      const failed = new WeakSet();
      const autoplayBlocked = new WeakSet();
      const syncMedia = (force = false) => {
        const time = timeline.time();
        for (const media of document.querySelectorAll("video[data-start], audio[data-start]")) {
          if (!tracked.has(media)) {
            tracked.add(media);
            media.addEventListener("loadedmetadata", () => syncMedia(true));
            const mediaError = () => {
              if (failed.has(media)) return;
              failed.add(media);
              previewError(new Error("Unable to load media: " + (media.currentSrc || media.src)));
            };
            media.addEventListener("error", mediaError);
            if (media.error) mediaError();
          }
          if (failed.has(media) || media.readyState === 0) continue;
          const start = Number(media.dataset.start || 0);
          const duration = Number(media.dataset.duration || timeline.duration());
          const offsetValue = Number(media.dataset.playbackStart ?? media.dataset.mediaStart ?? 0);
          const offset = Number.isFinite(offsetValue) ? Math.max(0, offsetValue) : 0;
          const rateValue = Number(media.dataset.playbackRate || media.defaultPlaybackRate);
          const rate = rateValue > 0 && Number.isFinite(rateValue) ? Math.max(0.1, Math.min(5, rateValue)) : 1;
          const target = Math.min(media.duration, offset + Math.max(0, time - start) * rate);
          const playing = !timeline.paused() && time >= start && time < start + duration && target < media.duration;
          if (!playing) media.pause();
          if (!media.seeking && Math.abs(media.currentTime - target) > (force || !playing ? 0.01 : 0.2)) {
            media.currentTime = target;
          }
          media.playbackRate = rate * timeline.timeScale();
          if (force) autoplayBlocked.delete(media);
          if (playing && media.paused && !pending.has(media) && !autoplayBlocked.has(media)) {
            pending.add(media);
            media.play().catch((error) => {
              if (error.name === "AbortError") return;
              if (error.name === "NotAllowedError") autoplayBlocked.add(media);
              else failed.add(media);
              previewError(error);
            }).finally(() => pending.delete(media));
          }
        }
      };
      window.__hyfrmeSyncPreviewMedia = () => syncMedia(true);
      const onUpdate = timeline.eventCallback("onUpdate");
      timeline.eventCallback("onUpdate", () => {
        onUpdate?.call(timeline);
        syncMedia();
      });
      timeline.repeat(-1).play(0);
      syncMedia(true);
    });
  }).catch(runtimeError);
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
  const activeSource = source
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<template(?:\s[^>]*)?>([\s\S]*?)<\/template>/i, "$1");
  const documentSource = /<head(?:\s[^>]*)?>/i.test(activeSource)
    ? activeSource
    : `<!doctype html><html><head><script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script></head><body>${activeSource}</body></html>`;
  const gsapScript =
    /\bgsap\s*\./.test(documentSource) &&
    !/<script\b[^>]*\bsrc\s*=\s*["'][^"']*gsap[^"']*["']/i.test(documentSource)
      ? '<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>'
      : "";
  const moduleBase =
    item.sourcePath &&
    /<script\b[^>]*\btype\s*=\s*["']importmap["']/i.test(documentSource) &&
    !/<base\b/i.test(documentSource)
      ? `<base href="${registryFileUrl(item.name, item.sourcePath)}">`
      : "";
  return rewriteAssetPaths(documentSource, item).replace(
    /<head(?:\s[^>]*)?>/i,
    (head) => `${head}${moduleBase}${bootstrap}${gsapScript}`,
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
      max: Math.max(
        item.dimensions?.width ?? 1920,
        item.dimensions?.height ?? 1080,
      ),
      step: 1,
    });
  }
  if (signedNumbers.has(variable.id) || value < 0) {
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
