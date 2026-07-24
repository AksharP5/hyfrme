import { build } from "esbuild";
import { execFile } from "node:child_process";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, relative, resolve } from "node:path";
import { promisify } from "node:util";
import { frameMathSource } from "./hyfrme-frame-math.mjs";

const execFileAsync = promisify(execFile);
const root = resolve(import.meta.dirname, "..");
const upstream = resolve(
  root,
  process.env.REMOCN_COLLECTIONS_SOURCE ?? ".work/remocn-collections",
);
const currentCommit = "2ec2e52e38854da2b6b6e7a90477dce1a3d742a5";
const tenkitCommit = "df2cb173c00a6a0e5dd1141543854a79e8ac291a";
const outputRoot = resolve(root, "showcases");
const compositionsRoot = resolve(outputRoot, "compositions");
const assetsRoot = resolve(outputRoot, "assets");
const fontsRoot = resolve(assetsRoot, "fonts");
const licensesRoot = resolve(assetsRoot, "licenses");
const demoAssetsRoot = resolve(assetsRoot, "demo");
const normalizeGeneratedText = (value) =>
  value.replace(/\r\n?/g, "\n").replace(/^[ \t]+$/gm, "");
const normalizeLicenseText = (value) =>
  normalizeGeneratedText(value).replace(/[ \t]+$/gm, "");

const showcases = [
  {
    slug: "introducing-nextjs",
    title: "Introducing Next.js",
    componentName: "IntroducingNextjsDemo",
    durationInFrames: 976,
    sourceCommit: currentCommit,
    author: { name: "kapish_dima", url: "https://github.com/kapishdima" },
    description:
      "A monochrome flight through the framework, its command, and its core platform features.",
  },
  {
    slug: "introducing-tenkit",
    title: "Introducing Tenkit",
    componentName: "IntroducingTenkitDemo",
    durationInFrames: 1152,
    sourceCommit: tenkitCommit,
    author: {
      name: "brilliantinsane",
      url: "https://github.com/brilliantinsane",
    },
    description:
      "One codebase becomes many branded apps through a continuous multi-tenant product story.",
  },
  {
    slug: "paper-shaders",
    title: "Paper Shaders",
    componentName: "PaperShadersDemo",
    durationInFrames: 984,
    sourceCommit: currentCommit,
    author: { name: "kapish_dima", url: "https://github.com/kapishdima" },
    description:
      "A cinematic tour of GPU shader backgrounds and the copy-paste workflow behind them.",
  },
  {
    slug: "introducing-videorc",
    title: "Introducing Videorc",
    componentName: "IntroducingVideorcDemo",
    durationInFrames: 756,
    sourceCommit: currentCommit,
    author: { name: "kapish_dima", url: "https://github.com/kapishdima" },
    description:
      "A red recording signal moves through capture, multistream, and AI publishing.",
  },
  {
    slug: "introducing-shadcn",
    title: "Introducing shadcn/ui",
    componentName: "IntroducingShadcnDemo",
    durationInFrames: 2178,
    sourceCommit: currentCommit,
    author: { name: "kapish_dima", url: "https://github.com/kapishdima" },
    description:
      "A component-field tour that turns the shadcn/ui philosophy into a full product film.",
  },
  {
    slug: "introducing-remocn",
    title: "Introducing Remocn",
    componentName: "IntroducingRemocnDemo",
    durationInFrames: 1012,
    sourceCommit: currentCommit,
    author: { name: "kapish_dima", url: "https://github.com/kapishdima" },
    description:
      "The original Remocn launch story, translated to a HyperFrames-owned frame clock.",
  },
];

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

await mkdir(compositionsRoot, { recursive: true });
await mkdir(fontsRoot, { recursive: true });
await mkdir(licensesRoot, { recursive: true });
await mkdir(demoAssetsRoot, { recursive: true });

const sourceFor = (showcase) =>
  resolve(upstream, "src", "demos", showcase.slug, "index.tsx");

const historicTenkitSource = (
  await execFileAsync(
    "git",
    ["show", `${tenkitCommit}:src/demos/introducing-tenkit/index.tsx`],
    { cwd: upstream, maxBuffer: 10 * 1024 * 1024 },
  )
).stdout;

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

        export {Easing, interpolate, interpolateColors, random, spring};
        export const delayRender = () => 0;
        export const continueRender = () => {};
        export const useCurrentFrame = () => useContext(LocalFrameContext) ?? currentFrame;
        export const useVideoConfig = () => videoConfig;
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
        }) => {
          const localFrame = useCurrentFrame() - from;
          if (localFrame < 0 || localFrame >= durationInFrames) return null;
          const content = React.createElement(
            LocalFrameContext.Provider,
            {value: localFrame},
            children,
          );
          if (layout === "none") return content;
          return React.createElement("div", {
            className,
            style: {position: "absolute", inset: 0, ...style},
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

          export const TransitionSeries = ({children}) => {
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

              if (nextTransition) {
                const duration = nextTransition.props.timing.getDurationInFrames({fps});
                const progress = nextTransition.props.timing.getProgress({
                  frame: frame - start - entry.props.durationInFrames + duration,
                  fps,
                });
                const presentation = nextTransition.props.presentation;
                const Presentation = presentation.component;
                content = React.createElement(
                  Presentation,
                  {
                    passedProps: presentation.props ?? {},
                    presentationDirection: "exiting",
                    presentationProgress: progress,
                    presentationDurationInFrames: duration,
                    bothEnteringAndExiting: false,
                  },
                  content,
                );
              }

              if (previousTransition) {
                const duration = previousTransition.props.timing.getDurationInFrames({fps});
                const progress = previousTransition.props.timing.getProgress({
                  frame: frame - start,
                  fps,
                });
                const presentation = previousTransition.props.presentation;
                const Presentation = presentation.component;
                content = React.createElement(
                  Presentation,
                  {
                    passedProps: presentation.props ?? {},
                    presentationDirection: "entering",
                    presentationProgress: progress,
                    presentationDurationInFrames: duration,
                    bothEnteringAndExiting: false,
                  },
                  content,
                );
              }

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
        const Fade = ({children, presentationDirection, presentationProgress}) =>
          React.createElement("div", {
            style: {
              position: "absolute",
              inset: 0,
              opacity: presentationDirection === "entering"
                ? presentationProgress
                : 1 - presentationProgress,
            },
          }, children);
        export const fade = () => ({component: Fade, props: {}});
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
      const family = {
        Geist: "Geist",
        GeistMono: "Geist Mono",
        Inter: "Inter",
        Manrope: "Manrope",
        SpaceGrotesk: "Space Grotesk",
      }[args.path];
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
      { filter: /src\/demos\/introducing-tenkit\/index\.tsx$/ },
      (args) =>
        args.path === sourceFor(showcases[1])
          ? {
              contents: historicTenkitSource,
              loader: "tsx",
              resolveDir: dirname(args.path),
            }
          : null,
    );
    buildApi.onLoad(
      { filter: /src\/components\/remocn\/shader-[^/]+\.tsx$/ },
      async (args) => {
        const original = await readFile(args.path, "utf8");
        const contents = original.replace(
          /const \[handle\] = useState\(\(\) => delayRender\("shader-[^"]+"\)\);/,
          "const handle = 0;",
        );
        if (contents === original) {
          throw new Error(
            `Missing expected shader render gate in ${args.path}`,
          );
        }
        return { contents, loader: "tsx", resolveDir: dirname(args.path) };
      },
    );
    buildApi.onLoad({ filter: /src\/demos\/_ui\/use-mobile\.ts$/ }, () => ({
      loader: "ts",
      contents:
        "export const useIsMobile = () => false; // Canonical 1280px showcase fixture",
    }));
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
  const entry = `
    import React from "react";
    import {flushSync} from "react-dom";
    import {createRoot} from "react-dom/client";
    import {__setHyfrmeFrame} from "remotion";
    import {${showcase.componentName}} from ${JSON.stringify(
      `./${relative(upstream, sourceFor(showcase)).replaceAll("\\", "/")}`,
    )};

    const root = createRoot(document.getElementById("hyfrme-showcase-root"));
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
  `;

  const result = await build({
    absWorkingDir: upstream,
    bundle: true,
    format: "iife",
    legalComments: "eof",
    minify: true,
    platform: "browser",
    plugins: [
      sourceRewritePlugin,
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
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    ${showcase.slug === "introducing-shadcn" ? '<link rel="stylesheet" href="assets/shadcn.css">' : ""}
    <style>
      @font-face { font-family: "Geist"; src: url("assets/fonts/Geist-Latin.woff2") format("woff2"); font-style: normal; font-weight: 100 900; font-display: block; }
      @font-face { font-family: "Geist Mono"; src: url("assets/fonts/GeistMono-Latin.woff2") format("woff2"); font-style: normal; font-weight: 100 900; font-display: block; }
      @font-face { font-family: "Inter"; src: url("assets/fonts/Inter-Latin.woff2") format("woff2"); font-style: normal; font-weight: 100 900; font-display: block; }
      @font-face { font-family: "Manrope"; src: url("assets/fonts/Manrope-Latin.woff2") format("woff2"); font-style: normal; font-weight: 200 800; font-display: block; }
      @font-face { font-family: "Space Grotesk"; src: url("assets/fonts/SpaceGrotesk-Latin.woff2") format("woff2"); font-style: normal; font-weight: 300 700; font-display: block; }
      @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"), local("SF Mono"); }
      @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
      @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
      @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
      * { box-sizing: border-box; }
      html, body { width: 1280px; height: 720px; margin: 0; overflow: hidden; background: #09090b; }
      #hyfrme-showcase-root { position: absolute; inset: 0; width: 1280px; height: 720px; overflow: hidden; }
    </style>
  </head>
  <body>
    <div id="${showcase.slug}" data-composition-id="${showcase.slug}" data-start="0" data-duration="${duration}" data-fps="30" data-width="1280" data-height="720">
      <div id="${showcase.slug}-source-stage" class="clip" data-start="0" data-duration="${duration}" data-track-index="0">
        <div
          id="hyfrme-showcase-root"
          data-layout-allow-overflow
          data-layout-allow-overlap
          data-layout-allow-occlusion
        ></div>
      </div>
    </div>
    <script src="compositions/${showcase.slug}.runtime.js"></script>
    <script>
      window.__timelines = window.__timelines || {};
      const clock = { frame: 0 };
      const timeline = gsap.timeline({ paused: true });
      timeline.to(clock, {
        frame: ${showcase.durationInFrames - 1},
        duration: ${duration},
        ease: "none",
        onUpdate: () => window.__hyfrmeRenderFrame(
          Math.max(0, Math.min(${showcase.durationInFrames - 1}, Math.round(clock.frame)))
        ),
      });
      window.__timelines["${showcase.slug}"] = timeline;
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
const postcss = requireFromUpstream("postcss");
const tailwind = requireFromUpstream("@tailwindcss/postcss");
const tailwindSource = resolve(upstream, "styles", "global.css");
const compiledCss = await postcss([tailwind()]).process(
  await readFile(tailwindSource, "utf8"),
  { from: tailwindSource },
);
await writeFile(resolve(assetsRoot, "shadcn.css"), compiledCss.css);

await copyFile(
  resolve(
    upstream,
    "node_modules",
    "geist",
    "dist",
    "fonts",
    "geist-sans",
    "Geist-Variable.woff2",
  ),
  resolve(fontsRoot, "Geist-Latin.woff2"),
);
await copyFile(
  resolve(root, "assets", "fonts", "GeistMono-Latin.woff2"),
  resolve(fontsRoot, "GeistMono-Latin.woff2"),
);
await copyFile(
  resolve(root, "assets", "fonts", "Inter-Latin.woff2"),
  resolve(fontsRoot, "Inter-Latin.woff2"),
);
await copyFile(
  resolve(root, "assets", "fonts", "Manrope-Latin.woff2"),
  resolve(fontsRoot, "Manrope-Latin.woff2"),
);

const spaceGroteskFont = await fetch(
  "https://fonts.gstatic.com/s/spacegrotesk/v22/V8mDoQDjQSkFtoMM3T6r8E7mPbF4Cw.woff2",
);
if (!spaceGroteskFont.ok) {
  throw new Error(`Space Grotesk download failed: ${spaceGroteskFont.status}`);
}
await writeFile(
  resolve(fontsRoot, "SpaceGrotesk-Latin.woff2"),
  Buffer.from(await spaceGroteskFont.arrayBuffer()),
);

for (const license of [
  "Geist-OFL.txt",
  "GeistMono-OFL.txt",
  "Inter-OFL.txt",
  "Manrope-OFL.txt",
]) {
  await writeFile(
    resolve(licensesRoot, license),
    normalizeLicenseText(
      await readFile(resolve(root, "assets", "fonts", license), "utf8"),
    ),
  );
}
await copyFile(
  resolve(root, "assets", "licenses", "Paper-Shaders-POLYFORM-SHIELD-1.0.0.md"),
  resolve(licensesRoot, "Paper-Shaders-POLYFORM-SHIELD-1.0.0.md"),
);

const spaceGroteskLicense = await fetch(
  "https://raw.githubusercontent.com/google/fonts/main/ofl/spacegrotesk/OFL.txt",
);
if (!spaceGroteskLicense.ok) {
  throw new Error(
    `Space Grotesk license download failed: ${spaceGroteskLicense.status}`,
  );
}
await writeFile(
  resolve(licensesRoot, "SpaceGrotesk-OFL.txt"),
  normalizeLicenseText(await spaceGroteskLicense.text()),
);

for (const asset of [
  "videorc-icon.png",
  "videorc-logo.png",
  "videorc-orb.png",
]) {
  await copyFile(
    resolve(upstream, "public", asset),
    resolve(demoAssetsRoot, asset),
  );
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
