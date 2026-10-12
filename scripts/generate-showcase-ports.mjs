import { build } from "esbuild";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, relative, resolve } from "node:path";
import { promisify } from "node:util";
import { frameMathSource } from "./hyfrme-frame-math.mjs";
import { frameDrivenPaperPlugin } from "./remocn-frame-driven-paper.mjs";
import {
  adaptSourcePaintGate,
  sourcePaintShim,
} from "./remocn-source-paint.mjs";

const execFileAsync = promisify(execFile);
const root = resolve(import.meta.dirname, "..");
const upstream = resolve(
  root,
  process.env.REMOCN_COLLECTIONS_SOURCE ?? ".work/remocn-collections",
);
const fixtures = JSON.parse(
  await readFile(resolve(root, "catalog/showcase-fixtures.json"), "utf8"),
);
const sourceCommits = new Set(fixtures.map((entry) => entry.origin.commit));
if (sourceCommits.size !== 1) {
  throw new Error("Showcases must share one current upstream source commit");
}
const currentCommit = [...sourceCommits][0];
const frozenAssets = JSON.parse(
  await readFile(
    resolve(root, "assets/remocn-collections/manifest.json"),
    "utf8",
  ),
);
if (frozenAssets.commit !== currentCommit) {
  throw new Error("Frozen showcase assets do not match the source fixtures");
}
const frozenFonts = new Map(
  frozenAssets.fonts.map((font) => [font.module, font]),
);
const outputRoot = resolve(root, "showcases");
const compositionsRoot = resolve(outputRoot, "compositions");
const assetsRoot = resolve(outputRoot, "assets");
const fontsRoot = resolve(assetsRoot, "fonts");
const licensesRoot = resolve(assetsRoot, "licenses");
const demoAssetsRoot = resolve(assetsRoot, "demo");
const normalizeGeneratedText = (value) =>
  value.replace(/\r\n?/g, "\n").replace(/^[ \t]+$/gm, "");
const showcases = fixtures.map(({ origin, fixture, ...metadata }) => ({
  ...metadata,
  durationInFrames: fixture.durationInFrames,
  sourceCommit: origin.commit,
}));

const paperShaderNotice = `/*!
 * Includes @paper-design/shaders-react 0.0.76 under the PolyForm Shield
 * License 1.0.0. Complete terms ship in showcases/assets/licenses.
 */`;

const collectionsNotice = `/*!
 * Visual reference and translated composition structure:
 * https://github.com/Remocn/remocn-collections
 * Pinned source commits are recorded in catalog/showcases.json.
 *
 * This runtime contains React/ReactDOM but no Remotion runtime. HyperFrames
 * owns timing, seeking, validation, and rendering.
 */`;

const { stdout: checkedOutCommit } = await execFileAsync(
  "git",
  ["rev-parse", "HEAD"],
  { cwd: upstream },
);
if (checkedOutCommit.trim() !== currentCommit) {
  throw new Error(
    `Expected remocn-collections at ${currentCommit}, found ${checkedOutCommit.trim()}`,
  );
}
const { stdout: sourceStatus } = await execFileAsync(
  "git",
  ["status", "--porcelain", "--untracked-files=no"],
  { cwd: upstream },
);
if (sourceStatus.trim()) {
  throw new Error("Remocn Collections source has modified tracked files");
}

await mkdir(compositionsRoot, { recursive: true });
await mkdir(fontsRoot, { recursive: true });
await mkdir(licensesRoot, { recursive: true });
await mkdir(demoAssetsRoot, { recursive: true });

const sourceFor = (showcase) =>
  resolve(upstream, "src", "demos", showcase.slug, "index.tsx");

const remotionPlugin = {
  name: "hyfrme-showcase-remotion-clock",
  setup(buildApi) {
    buildApi.onResolve({ filter: /^remotion$/ }, () => ({
      path: "remotion",
      namespace: "hyfrme-remotion",
    }));
    buildApi.onLoad({ filter: /.*/, namespace: "hyfrme-remotion" }, () => ({
      loader: "jsx",
      resolveDir: upstream,
      contents: `
        import React, {createContext, useContext} from "react";
        ${frameMathSource}
        let currentFrame = 0;
        let videoConfig = {fps: 30, width: 1280, height: 720, durationInFrames: 1};
        const LocalFrameContext = createContext(null);
        const LocalVideoContext = createContext(null);

        export {Easing, interpolate, interpolateColors, random, spring};
        let nextHandle = 0;
        const pending = new Map();
        const waiting = new Set();
        let sourceError;
        export const delayRender = (label) => {
          const handle = nextHandle++;
          pending.set(handle, label);
          return handle;
        };
        export const continueRender = (handle) => {
          pending.delete(handle);
          if (pending.size === 0) {
            for (const {resolve} of waiting) resolve();
            waiting.clear();
          }
        };
        export const cancelRender = (error) => {
          sourceError = error instanceof Error ? error : new Error(String(error));
          for (const {reject} of waiting) reject(sourceError);
          waiting.clear();
          throw sourceError;
        };
        export const __waitForSource = () => sourceError ? Promise.reject(sourceError) : pending.size === 0 ? Promise.resolve() : new Promise((resolve, reject) => waiting.add({resolve, reject}));
        ${sourcePaintShim}
        export const useCurrentFrame = () => useContext(LocalFrameContext) ?? currentFrame;
        export const useVideoConfig = () => useContext(LocalVideoContext) ?? videoConfig;
        export const staticFile = (path) => "/assets/demo/" + path.replace(/^\\//, "");
        export const Img = ({children, ...props}) => React.createElement("img", props, children);
        export const AbsoluteFill = ({children, className, style, ...props}) =>
          React.createElement("div", {
            ...props,
            className,
            style: {
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              ...style,
            },
          }, children);

        export const Sequence = ({
          from = 0,
          durationInFrames = Infinity,
          children,
          layout,
          style,
          className,
          width,
          height,
        }) => {
          const localFrame = useCurrentFrame() - from;
          const parentConfig = useVideoConfig();
          if (localFrame < 0 || localFrame >= durationInFrames) return null;
          const content = React.createElement(
            LocalFrameContext.Provider,
            {value: localFrame},
            React.createElement(
              LocalVideoContext.Provider,
              {value: {
                ...parentConfig,
                width: width ?? parentConfig.width,
                height: height ?? parentConfig.height,
                durationInFrames: Math.max(0, Math.min(
                  durationInFrames,
                  parentConfig.durationInFrames - from,
                )),
              }},
              children,
            ),
          );
          if (layout === "none") return content;
          return React.createElement(AbsoluteFill, {
            className,
            style: {
              flexDirection: undefined,
              ...(width ? {width} : {}),
              ...(height ? {height} : {}),
              ...style,
            },
          }, content);
        };

        const SeriesSequence = () => null;
        export const Series = ({children}) => {
          let cursor = 0;
          const rendered = [];
          for (const [index, child] of React.Children.toArray(children).entries()) {
            if (!React.isValidElement(child) || child.type !== SeriesSequence) continue;
            cursor += child.props.offset ?? 0;
            rendered.push(
              React.createElement(
                Sequence,
                {
                  key: child.key ?? index,
                  from: cursor,
                  durationInFrames: child.props.durationInFrames,
                  layout: child.props.layout,
                  style: child.props.style,
                  className: child.props.className,
                },
                child.props.children,
              ),
            );
            cursor += child.props.durationInFrames;
          }
          return React.createElement(React.Fragment, null, ...rendered);
        };
        Series.Sequence = SeriesSequence;

        export const __setHyfrmeFrame = (frame, config) => {
          currentFrame = frame;
          videoConfig = config;
        };
      `,
    }));
  },
};

const transitionsPlugin = {
  name: "hyfrme-showcase-transition-series",
  setup(buildApi) {
    buildApi.onResolve({ filter: /^@remotion\/transitions$/ }, () => ({
      path: "transitions",
      namespace: "hyfrme-transitions",
    }));
    buildApi.onLoad({ filter: /.*/, namespace: "hyfrme-transitions" }, () => ({
      loader: "jsx",
      resolveDir: upstream,
      contents: `
          import React from "react";
          import {Sequence, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
          const Transition = () => null;
          const TransitionSequence = () => null;

          export const linearTiming = ({durationInFrames, easing}) => ({
            getDurationInFrames: () => durationInFrames,
            getProgress: ({frame}) => interpolate(
              frame,
              [0, durationInFrames],
              [0, 1],
              {
                easing,
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            ),
          });

          const TransitionSeriesChildren = ({children}) => {
            const frame = useCurrentFrame();
            const {fps} = useVideoConfig();
            const entries = React.Children.toArray(children);
            let timelineCursor = 0;
            let transitionOffset = 0;
            const rendered = [];

            for (let index = 0; index < entries.length; index += 1) {
              const entry = entries[index];
              if (!React.isValidElement(entry) || entry.type !== TransitionSequence) continue;
              const previous = entries[index - 1];
              const next = entries[index + 1];
              const previousTransition =
                React.isValidElement(previous) && previous.type === Transition
                  ? previous
                  : null;
              const nextTransition =
                React.isValidElement(next) && next.type === Transition
                  ? next
                  : null;
              const rawStart = timelineCursor + (entry.props.offset ?? 0);
              if (previousTransition) {
                transitionOffset -= previousTransition.props.timing.getDurationInFrames({fps});
              }
              const start = Math.max(0, rawStart + transitionOffset);
              timelineCursor += entry.props.durationInFrames + (entry.props.offset ?? 0);
              let content = entry.props.children;

              const wrapTransition = (transition, direction) => {
                if (!transition) return;
                const duration = transition.props.timing.getDurationInFrames({fps});
                const progress = transition.props.timing.getProgress({
                  frame: direction === "entering"
                    ? frame - start
                    : frame - start - entry.props.durationInFrames + duration,
                  fps,
                });
                const presentation = transition.props.presentation;
                const Presentation = presentation.component;
                content = React.createElement(
                  Presentation,
                  {
                    passedProps: presentation.props ?? {},
                    presentationDirection: direction,
                    presentationProgress: progress,
                    presentationDurationInFrames: duration,
                    bothEnteringAndExiting: Boolean(previousTransition && nextTransition),
                  },
                  content,
                );
              };
              wrapTransition(previousTransition, "entering");
              wrapTransition(nextTransition, "exiting");

              rendered.push(
                React.createElement(
                  Sequence,
                  {
                    key: entry.key ?? index,
                    from: start,
                    durationInFrames: entry.props.durationInFrames,
                  },
                  content,
                ),
              );
            }
            return React.createElement(React.Fragment, null, ...rendered);
          };
          export const TransitionSeries = ({children, ...props}) =>
            React.createElement(Sequence, props,
              React.createElement(TransitionSeriesChildren, {children}));
          TransitionSeries.Sequence = TransitionSequence;
          TransitionSeries.Transition = Transition;
        `,
    }));
  },
};

const fadePlugin = {
  name: "hyfrme-showcase-fade",
  setup(buildApi) {
    buildApi.onResolve({ filter: /^@remotion\/transitions\/fade$/ }, () => ({
      path: "fade",
      namespace: "hyfrme-fade",
    }));
    buildApi.onLoad({ filter: /.*/, namespace: "hyfrme-fade" }, () => ({
      loader: "jsx",
      resolveDir: upstream,
      contents: `
        import React from "react";
        import {AbsoluteFill} from "remotion";
        const Fade = ({children, presentationDirection, presentationProgress, passedProps}) =>
          React.createElement(AbsoluteFill, {
            style: {
              opacity: presentationDirection === "entering"
                ? presentationProgress
                : passedProps.shouldFadeOutExitingScene ? 1 - presentationProgress : 1,
              ...(presentationDirection === "entering" ? passedProps.enterStyle : passedProps.exitStyle),
            },
          }, children);
        export const fade = (props) => ({component: Fade, props: props ?? {}});
      `,
    }));
  },
};

const fontPlugin = {
  name: "hyfrme-showcase-fonts",
  setup(buildApi) {
    buildApi.onResolve(
      {
        filter:
          /^@remotion\/google-fonts\/(Geist|GeistMono|Inter|Manrope|SpaceGrotesk)$/,
      },
      (args) => ({
        path: args.path.split("/").at(-1),
        namespace: "hyfrme-font",
      }),
    );
    buildApi.onLoad({ filter: /.*/, namespace: "hyfrme-font" }, (args) => {
      const font = frozenFonts.get(args.path);
      if (!font) throw new Error(`Missing frozen showcase font: ${args.path}`);
      const family = font.family;
      return {
        loader: "js",
        contents: `
          export const fontFamily = ${JSON.stringify(family)};
          export const loadFont = () => ({
            fontFamily,
            waitUntilDone: () => Promise.resolve(),
          });
        `,
      };
    });
  },
};

const sourceRewritePlugin = {
  name: "hyfrme-showcase-source-rewrites",
  setup(buildApi) {
    buildApi.onLoad(
      { filter: /src\/components\/remocn\/shader-[^/]+\.tsx$/ },
      async (args) => {
        const source = await readFile(args.path, "utf8");
        return {
          loader: "tsx",
          resolveDir: dirname(args.path),
          contents: source.includes("requestAnimationFrame")
            ? adaptSourcePaintGate(source, args.path)
            : source,
        };
      },
    );
    buildApi.onLoad(
      { filter: /src\/demos\/_ui\/app-sidebar\.tsx$/ },
      async (args) => ({
        loader: "tsx",
        resolveDir: dirname(args.path),
        // The missing upstream image and empty src both render Radix's CN fallback.
        contents: (await readFile(args.path, "utf8")).replace(
          'avatar: "/avatars/shadcn.jpg"',
          'avatar: ""',
        ),
      }),
    );
    buildApi.onLoad({ filter: /src\/lib\/demo-assets\.ts$/ }, () => ({
      loader: "ts",
      contents: `
          export const DEMO_ASSETS_BASE = "/assets/demo";
          export const demoAsset = (path) =>
            DEMO_ASSETS_BASE + "/" + path.replace(/^\\/+/, "");
        `,
    }));
  },
};

for (const showcase of showcases) {
  const fontRequests = frozenAssets.fontRequests[showcase.slug];
  if (!fontRequests?.length) {
    throw new Error(`Missing source font requests: ${showcase.slug}`);
  }
  const fontFaces = fontRequests
    .flatMap((request) => {
      const font = frozenFonts.get(request.module);
      if (
        !font ||
        request.style !== font.style ||
        request.subsets.length !== 1 ||
        request.subsets[0] !== font.subset
      ) {
        throw new Error(
          `Unsupported source font request: ${showcase.slug}/${request.module}`,
        );
      }
      return request.weights.map(
        (weight) =>
          `@font-face { font-family: "${font.family}"; src: url("assets/fonts/${font.module}-Latin.woff2") format("woff2"); font-style: ${request.style}; font-weight: ${weight}; unicode-range: ${font.unicodeRange}; }`,
      );
    })
    .join("\n      ");
  const entry = `
    import React from "react";
    import {flushSync} from "react-dom";
    import {createRoot} from "react-dom/client";
    import {__setHyfrmeFrame, __waitForSource} from "remotion";
    import {${showcase.componentName}} from ${JSON.stringify(
      `./${relative(upstream, sourceFor(showcase)).replaceAll("\\", "/")}`,
    )};

    const container = document.getElementById("hyfrme-showcase-root");
    window.addEventListener("hf-seek", (event) => {
      event.detail.waitUntil(Promise.resolve().then(async () => {
        await __waitForSource();
        await Promise.all(Array.from(container.querySelectorAll('img')).map(image => image.decode()));
      }));
    });
    window.__hyfrmeShowcaseReady = new Promise((resolve) => {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", resolve, {once: true});
      } else resolve();
    }).then(async () => {
      const root = createRoot(container);
      const config = ${JSON.stringify({
        fps: 30,
        width: 1280,
        height: 720,
        durationInFrames: showcase.durationInFrames,
      })};
      window.__hyfrmeRenderFrame = (frame) => {
        __setHyfrmeFrame(frame, config);
        flushSync(() => root.render(React.createElement(${showcase.componentName})));
      };
      window.__hyfrmeRenderFrame(0);
      await document.fonts.ready;
      await __waitForSource();
      await Promise.all(Array.from(document.querySelectorAll('img')).map(image => image.decode()));
    });
  `;

  const result = await build({
    absWorkingDir: upstream,
    bundle: true,
    format: "iife",
    legalComments: "eof",
    minify: true,
    supported: { "template-literal": false },
    platform: "browser",
    plugins: [
      sourceRewritePlugin,
      frameDrivenPaperPlugin,
      remotionPlugin,
      transitionsPlugin,
      fadePlugin,
      fontPlugin,
    ],
    stdin: {
      contents: entry,
      loader: "tsx",
      resolveDir: upstream,
      sourcefile: `${showcase.slug}-hyfrme-entry.tsx`,
    },
    target: ["chrome120"],
    tsconfig: resolve(upstream, "tsconfig.json"),
    banner: { js: `${collectionsNotice}\n${paperShaderNotice}` },
    write: false,
  });

  const runtime = result.outputFiles[0]?.text;
  if (!runtime) throw new Error(`No JavaScript output for ${showcase.slug}`);

  const duration = showcase.durationInFrames / 30;
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=1280">
    <script src="assets/gsap.min.js"></script>
    <link rel="stylesheet" href="assets/shadcn.css">
    <style>
      ${fontFaces}
      @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"), local("SF Mono"); }
      @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
      @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
      @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
      * { box-sizing: border-box; }
      html, body { width: 1280px; height: 720px; margin: 0; overflow: hidden; background: #09090b; }
      #hyfrme-showcase-root { position: absolute; inset: 0; width: 1280px; height: 720px; overflow: hidden; }
      #hyfrme-showcase-root, #hyfrme-showcase-root * { text-rendering: auto; }
    </style>
  </head>
  <body>
    <div id="${showcase.slug}" data-composition-id="${showcase.slug}" data-start="0" data-duration="${duration}" data-fps="30" data-width="1280" data-height="720">
      <div
        id="hyfrme-showcase-root"
        class="clip"
        data-start="0"
        data-duration="${duration}"
        data-track-index="0"
        data-layout-allow-overflow
        data-layout-allow-overlap
        data-layout-allow-occlusion
      ></div>
    </div>
    <script src="compositions/${showcase.slug}.runtime.js"></script>
    <script>
      window.__hyfrmeShowcaseReady.then(() => {
      window.__timelines = window.__timelines || {};
      const clock = { frame: 0 };
      const timeline = gsap.timeline({ paused: true });
      timeline.to(clock, {
        frame: ${showcase.durationInFrames},
        duration: ${duration},
        ease: "none",
        onUpdate: () => window.__hyfrmeRenderFrame(
          Math.max(0, Math.min(${showcase.durationInFrames - 1}, Math.round(clock.frame)))
        ),
      });
      window.__timelines["${showcase.slug}"] = timeline;
      });
    </script>
  </body>
</html>
`;

  await writeFile(
    resolve(compositionsRoot, `${showcase.slug}.html`),
    normalizeGeneratedText(html),
  );
  await writeFile(
    resolve(compositionsRoot, `${showcase.slug}.runtime.js`),
    normalizeGeneratedText(runtime),
  );
  console.log(
    `Generated ${showcase.slug}: ${showcase.durationInFrames} frames, ${Math.round(runtime.length / 1024)} KiB runtime`,
  );
}

const landingShowcase =
  showcases.find(
    (showcase) => showcase.slug === process.env.HYFRME_SHOWCASE_INDEX,
  ) ?? showcases[0];
const landingHtml = await readFile(
  resolve(compositionsRoot, `${landingShowcase.slug}.html`),
  "utf8",
);
await writeFile(resolve(outputRoot, "index.html"), landingHtml);

const requireFromUpstream = createRequire(resolve(upstream, "package.json"));
const tailwindLoader = requireFromUpstream("@tailwindcss/webpack");
const tailwindSource = resolve(upstream, "styles", "global.css");
const stylesheet = await readFile(tailwindSource, "utf8");
// Use Remotion's own loader and source scan root, including its pinned compiler.
const compiledCss = await new Promise((accept, reject) =>
  tailwindLoader.call(
    {
      resourcePath: tailwindSource,
      getOptions: () => ({ base: upstream, optimize: false }),
      async: () => (error, css) => (error ? reject(error) : accept(css)),
      addDependency() {},
      addContextDependency() {},
    },
    stylesheet,
  ),
);
await writeFile(resolve(assetsRoot, "shadcn.css"), compiledCss);
const gsapPath = resolve(root, "registry/blocks/before-after/gsap.min.js");
const gsap = await readFile(gsapPath, "utf8");
if (
  createHash("sha256").update(gsap).digest("hex") !==
  "c174bfce53a729418d57a8ad8625e7247c793a22fef8e2851e3cfa3de9cd8280"
)
  throw new Error("Collections require the frozen GSAP 3.14.2 asset");
await copyFile(gsapPath, resolve(assetsRoot, "gsap.min.js"));

for (const font of frozenAssets.fonts) {
  for (const [path, expected] of [
    [font.path, font.sha256],
    [font.licensePath, font.licenseSha256],
  ]) {
    const actual = createHash("sha256")
      .update(await readFile(resolve(root, path)))
      .digest("hex");
    if (actual !== expected) {
      throw new Error(`Frozen showcase asset checksum mismatch: ${path}`);
    }
  }
  await copyFile(
    resolve(root, font.path),
    resolve(fontsRoot, `${font.module}-Latin.woff2`),
  );
  await copyFile(
    resolve(root, font.licensePath),
    resolve(licensesRoot, `${font.module}-OFL.txt`),
  );
}
await copyFile(
  resolve(root, frozenAssets.noticePath),
  resolve(licensesRoot, "Fonts-NOTICE.txt"),
);
await copyFile(
  resolve(root, "assets", "licenses", "Paper-Shaders-POLYFORM-SHIELD-1.0.0.md"),
  resolve(licensesRoot, "Paper-Shaders-POLYFORM-SHIELD-1.0.0.md"),
);

for (const asset of frozenAssets.media) {
  const source = resolve(upstream, asset.upstreamPath);
  const actual = createHash("sha256")
    .update(await readFile(source))
    .digest("hex");
  if (actual !== asset.sha256) {
    throw new Error(
      `Frozen showcase media checksum mismatch: ${asset.upstreamPath}`,
    );
  }
  await copyFile(source, resolve(root, asset.path));
}

const demoMeta = JSON.parse(
  await readFile(resolve(upstream, "src", "demos", "demo-meta.json"), "utf8"),
);
const published = await Promise.all(
  showcases.map(async (showcase) => {
    const parityPath = resolve(
      root,
      "parity",
      "showcases",
      `${showcase.slug}.json`,
    );
    let parity = null;
    try {
      parity = JSON.parse(await readFile(parityPath, "utf8"));
    } catch {
      // Parity is populated after the first deterministic render.
    }

    return {
      ...showcase,
      components: demoMeta[showcase.slug]?.remocnComponents ?? [],
      fps: 30,
      width: 1280,
      height: 720,
      duration: showcase.durationInFrames / 30,
      sourcePath: `showcases/compositions/${showcase.slug}.html`,
      previewUrl: `/showcases/${showcase.slug}.mp4`,
      posterUrl: `/showcases/${showcase.slug}.png`,
      originUrl: `https://github.com/Remocn/remocn-collections/blob/${showcase.sourceCommit}/src/demos/${showcase.slug}/index.tsx`,
      sourceUrl: `https://github.com/AksharP5/hyfrme/blob/main/showcases/compositions/${showcase.slug}.html`,
      meanSsim: parity?.meanSsim ?? null,
    };
  }),
);

await writeFile(
  resolve(root, "catalog", "showcases.json"),
  `${JSON.stringify(published, null, 2)}\n`,
);
