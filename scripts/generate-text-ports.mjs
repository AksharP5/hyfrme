import { build } from "esbuild";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { frameMathSource, remocnMitBanner } from "./hyfrme-frame-math.mjs";

const root = resolve(import.meta.dirname, "..");
const upstream = resolve(root, ".work", "remocn");
const upstreamInventory = JSON.parse(
  await readFile(resolve(root, "catalog", "upstream-inventory.json"), "utf8"),
);
const upstreamRegistry = JSON.parse(
  await readFile(
    resolve(upstream, "registry-artifacts", "registry.json"),
    "utf8",
  ),
);
const upstreamCommit = upstreamInventory.summary.upstream.commit;
const textNames = [
  "per-character-rise",
  "bottom-up-letters",
  "top-down-letters",
  "spring-scale-in",
  "micro-scale-fade",
  "scale-down-fade",
  "blur-out-up",
  "focus-blur-resolve",
  "line-by-line-slide",
  "per-word-crossfade",
  "fade-through",
  "shared-axis-y",
  "shared-axis-z",
  "short-slide-right",
  "kinetic-center-build",
  "short-slide-down",
  "inline-highlight",
  "strikethrough-replace",
  "staggered-fade-up",
  "mask-reveal-up",
  "shimmer-sweep",
  "marker-highlight",
  "tracking-in",
  "slot-machine-roll",
];
const coreNames = [
  "chat-to-preview-layout",
  "data-flow-pipes",
  "perspective-marquee",
  "live-code-compilation",
  "infinite-bento-pan",
  "infinite-marquee",
  "terminal-simulator",
  "terminal-cursor-zoom",
  "glass-code-block",
  "glass-code-walk",
  "animated-line-chart",
  "animated-bar-chart",
  "progress-steps",
  "simulated-cursor",
  "logo-enter",
  "ecosystem-constellation",
];
const primitiveNames = [
  "caret",
  "skeleton-block",
  "spinner",
  "typing-indicator",
  "typewriter",
];
const names = [...textNames, ...coreNames, ...primitiveNames];
const familyIndex = process.argv.indexOf("--family");
const family = familyIndex === -1 ? null : process.argv[familyIndex + 1];
const familyNames =
  family === "text"
    ? textNames
    : family === "core"
      ? coreNames
      : family === "primitive"
        ? primitiveNames
        : family === null
          ? names
          : null;
if (!familyNames) throw new Error(`Unknown compiled family: ${family}`);
const onlyIndex = process.argv.indexOf("--only");
const only =
  onlyIndex === -1 ? null : new Set(process.argv[onlyIndex + 1].split(","));
const selectedNames = only
  ? familyNames.filter((name) => only.has(name))
  : familyNames;

if (only && selectedNames.length !== only.size) {
  throw new Error(
    `Expected ${only.size} known names, found ${selectedNames.length}`,
  );
}

const remotionPlugin = {
  name: "hyfrme-remotion-clock",
  setup(buildApi) {
    buildApi.onResolve({ filter: /^remotion$/ }, () => ({
      path: "remotion",
      namespace: "hyfrme-remotion",
    }));
    buildApi.onLoad({ filter: /.*/, namespace: "hyfrme-remotion" }, () => ({
      loader: "js",
      resolveDir: upstream,
      contents: `
          import React, {createContext, useContext} from "react";
          ${frameMathSource}
          let currentFrame = 0;
          let videoConfig = {fps: 30, width: 1280, height: 720, durationInFrames: 60};
          const LocalFrameContext = createContext(null);
          export {Easing, interpolate, interpolateColors, spring};
          export const useCurrentFrame = () => useContext(LocalFrameContext) ?? currentFrame;
          export const useVideoConfig = () => videoConfig;
          export const AbsoluteFill = ({children, className, style, ...props}) => React.createElement("div", {
            ...props,
            className,
            style: {position: "absolute", inset: 0, width: "100%", height: "100%", display: "flex", flexDirection: "column", ...style},
          }, children);
          export const Sequence = ({from = 0, durationInFrames = Infinity, children, layout, style, className}) => {
            const localFrame = useCurrentFrame() - from;
            if (localFrame < 0 || localFrame >= durationInFrames) return null;
            const content = React.createElement(LocalFrameContext.Provider, {value: localFrame}, children);
            if (layout === "none") return content;
            return React.createElement("div", {
              className,
              style: {position: "absolute", inset: 0, ...style},
            }, content);
          };
          export const __setHyfrmeFrame = (frame, config) => {
            currentFrame = frame;
            videoConfig = config;
          };
        `,
    }));
  },
};

const loadConfig = async (path) => {
  const result = await build({
    absWorkingDir: upstream,
    bundle: true,
    entryPoints: [path],
    format: "esm",
    platform: "node",
    tsconfig: resolve(upstream, "tsconfig.json"),
    write: false,
  });
  const url = `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`;
  const exports = await import(url);
  return Object.values(exports)[0];
};

const escapeHtmlAttribute = (value) =>
  value.replaceAll("&", "&amp;").replaceAll("'", "&#39;");

const fixtures = [];
const fontSource = resolve(
  root,
  "registry",
  "blocks",
  "soft-blur-in",
  "Geist-SemiBold.woff2",
);

for (const name of selectedNames) {
  const inventoryItem = upstreamInventory.items.find(
    (item) => item.name === name,
  );
  const registryItem = upstreamRegistry.items.find(
    (item) => item.name === name,
  );
  if (!inventoryItem || !registryItem)
    throw new Error(`Missing upstream item ${name}`);
  const sourcePath = resolve(upstream, inventoryItem.files[0].path);
  const configPath = resolve(dirname(sourcePath), "config.ts");
  const config = await loadConfig(configPath);
  const props = Object.fromEntries(
    Object.entries(config.controls).map(([key, control]) => [
      key,
      control.default,
    ]),
  );
  const source = await readFile(sourcePath, "utf8");
  if (/\bspeed\??:/.test(source) && !("speed" in props)) props.speed = 1;
  const fixture = {
    width: config.compositionWidth,
    height: config.compositionHeight,
    fps: config.fps,
    durationInFrames: config.durationInFrames,
    props,
    background:
      config.previewBackdrop?.type === "color" ||
      config.previewBackdrop?.type === "gradient"
        ? config.previewBackdrop.value
        : "#ffffff",
  };
  const importPath = `./${relative(upstream, sourcePath).replaceAll("\\", "/")}`;
  const entry = `
    import React from "react";
    import {flushSync} from "react-dom";
    import {createRoot} from "react-dom/client";
    import {__setHyfrmeFrame} from "remotion";
    import {${config.componentName}} from ${JSON.stringify(importPath)};
    const root = createRoot(document.getElementById("hyfrme-source-root"));
    const variables = window.__hyperframes.getVariables();
    const config = ${JSON.stringify({
      fps: fixture.fps,
      width: fixture.width,
      height: fixture.height,
      durationInFrames: fixture.durationInFrames,
    })};
    const props = ${JSON.stringify(Object.keys(props))}.reduce((result, key) => {
      result[key] = variables[key];
      return result;
    }, {});
    window.__hyfrmeRenderFrame = (frame) => {
      __setHyfrmeFrame(frame, config);
      flushSync(() => root.render(React.createElement(${config.componentName}, props)));
    };
    window.__hyfrmeRenderFrame(0);
  `;
  const result = await build({
    absWorkingDir: upstream,
    bundle: true,
    format: "iife",
    minify: true,
    platform: "browser",
    plugins: [remotionPlugin],
    stdin: {
      contents: entry,
      loader: "tsx",
      resolveDir: upstream,
      sourcefile: `${name}-hyfrme-entry.tsx`,
    },
    target: ["chrome120"],
    tsconfig: resolve(upstream, "tsconfig.json"),
    banner: { js: remocnMitBanner },
    write: false,
  });
  const runtime = result.outputFiles[0].text;
  const catalogFamily = textNames.includes(name)
    ? "text"
    : primitiveNames.includes(name)
      ? "primitive"
      : "core";
  const duration = fixture.durationInFrames / fixture.fps;
  const variables = Object.entries(config.controls).map(([id, control]) => ({
    id,
    type:
      control.type === "text"
        ? "string"
        : control.type === "select"
          ? "string"
          : control.type === "number-input"
            ? "number"
            : control.type,
    label: control.label ?? id,
    default: control.default,
  }));
  if (
    "speed" in props &&
    !variables.some((variable) => variable.id === "speed")
  ) {
    variables.push({ id: "speed", type: "number", label: "Speed", default: 1 });
  }
  const html = `<!doctype html>
<html lang="en" data-composition-variables='${escapeHtmlAttribute(JSON.stringify(variables))}'>
  <head>
    <meta charset="UTF-8">
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      @font-face { font-family: "Geist"; src: url("../assets/fonts/Geist-SemiBold.woff2") format("woff2"); font-style: normal; font-weight: 600; font-display: block; }
      * { box-sizing: border-box; }
      html, body { width: ${fixture.width}px; height: ${fixture.height}px; margin: 0; overflow: hidden; background: ${fixture.background}; }
      body { --font-geist-sans: "Geist"; font-family: "Geist", -apple-system, BlinkMacSystemFont, sans-serif; }
      #hyfrme-source-root { position: absolute; inset: 0; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="${name}" data-start="0" data-duration="${duration}" data-fps="${fixture.fps}" data-width="${fixture.width}" data-height="${fixture.height}">
      <div id="hyfrme-source-stage" class="clip" data-start="0" data-duration="${duration}" data-track-index="0">
        <div id="hyfrme-source-root"${name === "shimmer-sweep" ? " data-layout-allow-occlusion" : ""}></div>
      </div>
    </div>
    <script src="./${name}.runtime.js"></script>
    <script>
      window.__timelines = window.__timelines || {};
      const clock = { frame: 0 };
      const timeline = gsap.timeline({ paused: true });
      timeline.to(clock, {
        frame: ${fixture.durationInFrames},
        duration: ${duration},
        ease: "none",
        onUpdate: () => window.__hyfrmeRenderFrame(Math.max(0, Math.min(${fixture.durationInFrames - 1}, Math.round(clock.frame)))),
      });
      window.__timelines["${name}"] = timeline;
    </script>
  </body>
</html>
`;
  const blockDirectory = resolve(root, "registry", "blocks", name);
  await mkdir(blockDirectory, { recursive: true });
  await writeFile(resolve(blockDirectory, `${name}.html`), html);
  await writeFile(resolve(blockDirectory, `${name}.runtime.js`), runtime);
  await copyFile(fontSource, resolve(blockDirectory, "Geist-SemiBold.woff2"));
  await writeFile(
    resolve(blockDirectory, "registry-item.json"),
    `${JSON.stringify(
      {
        $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
        name,
        type: "hyperframes:block",
        title: registryItem.title,
        description: `${registryItem.description} Compiled for deterministic HyperFrames playback by Hyfrme.`,
        tags:
          catalogFamily === "text"
            ? ["typography", "effect", "remocn-port"]
            : catalogFamily === "primitive"
              ? ["ui", "primitive", "remocn-port"]
              : ["composition", "data", "remocn-port"],
        author: "Hyfrme",
        authorUrl: "https://github.com/AksharP5/hyfrme",
        license: "MIT",
        dimensions: { width: fixture.width, height: fixture.height },
        duration,
        files: [
          {
            path: `${name}.html`,
            target: `compositions/${name}.html`,
            type: "hyperframes:composition",
          },
          {
            path: `${name}.runtime.js`,
            target: `compositions/${name}.runtime.js`,
            type: "hyperframes:asset",
          },
          {
            path: "Geist-SemiBold.woff2",
            target: "assets/fonts/Geist-SemiBold.woff2",
            type: "hyperframes:asset",
          },
        ],
      },
      null,
      2,
    )}\n`,
  );
  fixtures.push({
    slug: name,
    catalogFamily,
    title: registryItem.title,
    description: registryItem.description,
    componentName: config.componentName,
    origin: {
      repository: "https://github.com/Remocn/remocn",
      commit: upstreamCommit,
      source: inventoryItem.files[0].path,
      config: relative(upstream, configPath),
      license: "MIT",
    },
    fixture,
  });
  console.log(
    `Generated ${name}: ${fixture.durationInFrames} frames, ${Math.round(runtime.length / 1024)} KiB runtime`,
  );
}

if (!only && (family === null || family === "text")) {
  await writeFile(
    resolve(root, "catalog", "text-fixtures.json"),
    `${JSON.stringify(
      fixtures.filter((entry) => entry.catalogFamily === "text"),
      null,
      2,
    )}\n`,
  );
}

if (!only && (family === null || family === "core")) {
  await writeFile(
    resolve(root, "catalog", "core-fixtures.json"),
    `${JSON.stringify(
      fixtures.filter((entry) => entry.catalogFamily === "core"),
      null,
      2,
    )}\n`,
  );
}

if (!only && (family === null || family === "primitive")) {
  await writeFile(
    resolve(root, "catalog", "primitive-fixtures.json"),
    `${JSON.stringify(
      fixtures.filter((entry) => entry.catalogFamily === "primitive"),
      null,
      2,
    )}\n`,
  );
}
