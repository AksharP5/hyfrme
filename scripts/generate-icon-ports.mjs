import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const upstream = resolve(root, ".work", "remocn");
const upstreamCommit = (
  await readFile(resolve(root, "catalog", "upstream-inventory.json"), "utf8")
).match(/"commit":\s*"([a-f0-9]+)"/)?.[1];
const inventory = JSON.parse(
  await readFile(resolve(root, "catalog", "upstream-inventory.json"), "utf8"),
);
const upstreamRegistry = JSON.parse(
  await readFile(
    resolve(upstream, "registry-artifacts", "registry.json"),
    "utf8",
  ),
);

const onlyIndex = process.argv.indexOf("--only");
const only = onlyIndex === -1 ? null : process.argv[onlyIndex + 1];
const allIcons = inventory.items.filter(
  (item) => item.family === "icons" && item.visual,
);
const icons = only ? allIcons.filter((item) => item.name === only) : allIcons;
const generatedFixtures = [];

if (only && icons.length !== 1) {
  throw new Error(`Unknown icon: ${only}`);
}

const numberField = (source, name) => {
  const value = source.match(new RegExp(`${name}:\\s*(\\d+(?:\\.\\d+)?)`))?.[1];
  if (!value) throw new Error(`Could not read ${name} from icon config`);
  return Number(value);
};

const stringDefault = (source, control, fallback) =>
  source.match(
    new RegExp(`${control}:\\s*\\{[\\s\\S]*?default:\\s*["']([^"']+)["']`),
  )?.[1] ?? fallback;

const numberDefault = (source, control, fallback) => {
  const match = source.match(
    new RegExp(`${control}:\\s*\\{[\\s\\S]*?default:\\s*(-?\\d+(?:\\.\\d+)?)`),
  );
  return match ? Number(match[1]) : fallback;
};

const booleanDefault = (source, control, fallback) => {
  const match = source.match(
    new RegExp(`${control}:\\s*\\{[\\s\\S]*?default:\\s*(true|false)`),
  );
  return match ? match[1] === "true" : fallback;
};

const escapeInlineScript = (source) =>
  source.replaceAll("</script", "<\\/script");

const remotionNoReactEntry = resolve(
  upstream,
  "node_modules",
  "remotion",
  "dist",
  "esm",
  "no-react.mjs",
);

const compatibilityPlugin = {
  name: "hyfrme-remotion-clock",
  setup(buildApi) {
    buildApi.onResolve({ filter: /^remotion$/ }, () => ({
      path: "remotion",
      namespace: "hyfrme-remotion",
    }));
    buildApi.onResolve({ filter: /^hyfrme-interpolate-actual$/ }, () => ({
      path: remotionNoReactEntry,
    }));
    buildApi.onResolve({ filter: /^react\/jsx-runtime$/ }, () => ({
      path: "react/jsx-runtime",
      namespace: "hyfrme-jsx",
    }));
    buildApi.onLoad({ filter: /.*/, namespace: "hyfrme-remotion" }, () => ({
      loader: "js",
      contents: `
          import {interpolate} from "hyfrme-interpolate-actual";
          let currentFrame = 0;
          let videoConfig = {fps: 30, width: 48, height: 48, durationInFrames: 75};

          const clampUnit = (value) => Math.min(1, Math.max(0, value));
          const NEWTON_ITERATIONS = 4;
          const NEWTON_MIN_SLOPE = 0.001;
          const SUBDIVISION_PRECISION = 0.0000001;
          const SUBDIVISION_MAX_ITERATIONS = 10;
          const SPLINE_SIZE = 11;
          const SAMPLE_STEP = 1 / (SPLINE_SIZE - 1);
          const bezierA = (a1, a2) => 1 - 3 * a2 + 3 * a1;
          const bezierB = (a1, a2) => 3 * a2 - 6 * a1;
          const bezierC = (a1) => 3 * a1;
          const calcBezier = (t, a1, a2) =>
            ((bezierA(a1, a2) * t + bezierB(a1, a2)) * t + bezierC(a1)) * t;
          const getSlope = (t, a1, a2) =>
            3 * bezierA(a1, a2) * t * t + 2 * bezierB(a1, a2) * t + bezierC(a1);
          const binarySubdivide = (x, initialA, initialB, x1, x2) => {
            let currentX;
            let currentT;
            let index = 0;
            let a = initialA;
            let b = initialB;
            do {
              currentT = a + (b - a) / 2;
              currentX = calcBezier(currentT, x1, x2) - x;
              if (currentX > 0) b = currentT;
              else a = currentT;
            } while (
              Math.abs(currentX) > SUBDIVISION_PRECISION &&
              ++index < SUBDIVISION_MAX_ITERATIONS
            );
            return currentT;
          };
          const newtonRaphson = (x, initialGuess, x1, x2) => {
            let guess = initialGuess;
            for (let index = 0; index < NEWTON_ITERATIONS; index += 1) {
              const slope = getSlope(guess, x1, x2);
              if (slope === 0) return guess;
              guess -= (calcBezier(guess, x1, x2) - x) / slope;
            }
            return guess;
          };
          const bezier = (x1, y1, x2, y2) => {
            const samples = new Float32Array(SPLINE_SIZE);
            if (x1 !== y1 || x2 !== y2) {
              for (let index = 0; index < SPLINE_SIZE; index += 1) {
                samples[index] = calcBezier(index * SAMPLE_STEP, x1, x2);
              }
            }
            const getTForX = (x) => {
              let start = 0;
              let sample = 1;
              const last = SPLINE_SIZE - 1;
              for (; sample !== last && samples[sample] <= x; sample += 1) {
                start += SAMPLE_STEP;
              }
              sample -= 1;
              const distance =
                (x - samples[sample]) / (samples[sample + 1] - samples[sample]);
              const guess = start + distance * SAMPLE_STEP;
              const slope = getSlope(guess, x1, x2);
              if (slope >= NEWTON_MIN_SLOPE) {
                return newtonRaphson(x, guess, x1, x2);
              }
              if (slope === 0) return guess;
              return binarySubdivide(x, start, start + SAMPLE_STEP, x1, x2);
            };
            return (value) => {
              const x = clampUnit(value);
              if (x1 === y1 && x2 === y2) return x;
              if (x === 0 || x === 1) return x;
              return calcBezier(getTForX(x), y1, y2);
            };
          };

          class Easing {
            static step0(value) { return value > 0 ? 1 : 0; }
            static step1(value) { return value >= 1 ? 1 : 0; }
            static linear(value) { return value; }
            static ease(value) { return Easing.bezier(0.42, 0, 1, 1)(value); }
            static quad(value) { return value * value; }
            static cubic(value) { return value * value * value; }
            static poly(power) { return (value) => value ** power; }
            static sin(value) { return 1 - Math.cos((value * Math.PI) / 2); }
            static circle(value) {
              const unit = clampUnit(value);
              return 1 - Math.sqrt(1 - unit * unit);
            }
            static exp(value) { return 2 ** (10 * (value - 1)); }
            static elastic(bounciness = 1) {
              const period = bounciness * Math.PI;
              return (value) =>
                1 - Math.cos((value * Math.PI) / 2) ** 3 * Math.cos(value * period);
            }
            static back(strength = 1.70158) {
              return (value) => value * value * ((strength + 1) * value - strength);
            }
            static bounce(value) {
              const unit = clampUnit(value);
              if (unit < 1 / 2.75) return 7.5625 * unit * unit;
              if (unit < 2 / 2.75) {
                const shifted = unit - 1.5 / 2.75;
                return 7.5625 * shifted * shifted + 0.75;
              }
              if (unit < 2.5 / 2.75) {
                const shifted = unit - 2.25 / 2.75;
                return 7.5625 * shifted * shifted + 0.9375;
              }
              const shifted = unit - 2.625 / 2.75;
              return 7.5625 * shifted * shifted + 0.984375;
            }
            static bezier(x1, y1, x2, y2) { return bezier(x1, y1, x2, y2); }
            static in(easing) { return easing; }
            static out(easing) { return (value) => 1 - easing(1 - value); }
            static inOut(easing) {
              return (value) =>
                value < 0.5
                  ? easing(value * 2) / 2
                  : 1 - easing((1 - value) * 2) / 2;
            }
          }

          const defaultSpringConfig = {
            damping: 10,
            mass: 1,
            stiffness: 100,
            overshootClamping: false,
          };
          const advanceCache = {};
          const advance = ({animation, now, config}) => {
            const {toValue, lastTimestamp, current, velocity} = animation;
            const deltaTime = Math.min(now - lastTimestamp, 64);
            const {damping: c2, mass, stiffness} = config;
            const key = [toValue, lastTimestamp, current, velocity, c2, mass, stiffness, now].join("-");
            if (advanceCache[key]) return advanceCache[key];
            const v0 = -velocity;
            const x0 = toValue - current;
            const zeta = c2 / (2 * Math.sqrt(stiffness * mass));
            const omega0 = Math.sqrt(stiffness / mass);
            const omega1 = omega0 * Math.sqrt(1 - zeta ** 2);
            const time = deltaTime / 1000;
            const sine = Math.sin(omega1 * time);
            const cosine = Math.cos(omega1 * time);
            const envelope = Math.exp(-zeta * omega0 * time);
            const fragment =
              envelope * (sine * ((v0 + zeta * omega0 * x0) / omega1) + x0 * cosine);
            const underPosition = toValue - fragment;
            const underVelocity =
              zeta * omega0 * fragment -
              envelope * (cosine * (v0 + zeta * omega0 * x0) - omega1 * x0 * sine);
            const criticalEnvelope = Math.exp(-omega0 * time);
            const criticalPosition =
              toValue - criticalEnvelope * (x0 + (v0 + omega0 * x0) * time);
            const criticalVelocity =
              criticalEnvelope *
              (v0 * (time * omega0 - 1) + time * x0 * omega0 * omega0);
            const result = {
              toValue,
              prevPosition: current,
              lastTimestamp: now,
              current: zeta < 1 ? underPosition : criticalPosition,
              velocity: zeta < 1 ? underVelocity : criticalVelocity,
            };
            advanceCache[key] = result;
            return result;
          };
          const calculationCache = {};
          const springCalculation = ({frame, fps, config = {}}) => {
            const key = [frame, fps, config.damping, config.mass, config.overshootClamping, config.stiffness].join("-");
            if (calculationCache[key]) return calculationCache[key];
            let animation = {lastTimestamp: 0, current: 0, toValue: 1, velocity: 0, prevPosition: 0};
            const clamped = Math.max(0, frame);
            const unevenRest = clamped % 1;
            for (let index = 0; index <= Math.floor(clamped); index += 1) {
              if (index === Math.floor(clamped)) index += unevenRest;
              animation = advance({
                animation,
                now: (index / fps) * 1000,
                config: {...defaultSpringConfig, ...config},
              });
            }
            calculationCache[key] = animation;
            return animation;
          };
          const measureCache = new Map();
          const measureSpring = ({fps, config = {}, threshold = 0.005}) => {
            const key = [fps, config.damping, config.mass, config.overshootClamping, config.stiffness, threshold].join("-");
            if (measureCache.has(key)) return measureCache.get(key);
            let frame = 0;
            let finishedFrame = 0;
            let animation = springCalculation({fps, frame, config});
            let difference = Math.abs(animation.current - animation.toValue);
            while (difference >= threshold) {
              frame += 1;
              animation = springCalculation({fps, frame, config});
              difference = Math.abs(animation.current - animation.toValue);
            }
            finishedFrame = frame;
            for (let index = 0; index < 20; index += 1) {
              frame += 1;
              animation = springCalculation({fps, frame, config});
              difference = Math.abs(animation.current - animation.toValue);
              if (difference >= threshold) {
                index = 0;
                finishedFrame = frame + 1;
              }
            }
            measureCache.set(key, finishedFrame);
            return finishedFrame;
          };
          const spring = ({
            frame,
            fps,
            config = {},
            from = 0,
            to = 1,
            durationInFrames,
            durationRestThreshold,
            delay = 0,
            reverse = false,
          }) => {
            const needsNatural = reverse || typeof durationInFrames !== "undefined";
            const naturalDuration = needsNatural
              ? measureSpring({fps, config, threshold: durationRestThreshold})
              : undefined;
            const reverseProcessed = reverse
              ? (durationInFrames ?? naturalDuration) - frame
              : frame;
            const delayProcessed = reverseProcessed + (reverse ? delay : -delay);
            const durationProcessed =
              durationInFrames === undefined
                ? delayProcessed
                : delayProcessed / (durationInFrames / naturalDuration);
            if (durationInFrames && delayProcessed > durationInFrames) return to;
            const calculated = springCalculation({fps, frame: durationProcessed, config});
            const inner = config.overshootClamping
              ? to >= from
                ? Math.min(calculated.current, to)
                : Math.max(calculated.current, to)
              : calculated.current;
            return from === 0 && to === 1
              ? inner
              : interpolate(inner, [0, 1], [from, to]);
          };

          export {Easing, interpolate, spring};
          export const useCurrentFrame = () => currentFrame;
          export const useVideoConfig = () => videoConfig;
          export const __setHyfrmeFrame = (frame, config) => {
            currentFrame = frame;
            videoConfig = config;
          };
        `,
    }));
    buildApi.onLoad({ filter: /.*/, namespace: "hyfrme-jsx" }, () => ({
      loader: "js",
      contents: `
        const Fragment = Symbol("hyfrme-fragment");
        const jsx = (type, props) => {
          if (typeof type === "function") return type(props || {});
          return {type, props: props || {}};
        };
        const jsxs = jsx;
        const svgAttributes = {
          className: "class",
          strokeWidth: "stroke-width",
          strokeLinecap: "stroke-linecap",
          strokeLinejoin: "stroke-linejoin",
          strokeDasharray: "stroke-dasharray",
          strokeDashoffset: "stroke-dashoffset",
          fillRule: "fill-rule",
          clipRule: "clip-rule",
        };
        const makeNode = (value, insideSvg = false) => {
          if (value === null || value === undefined || value === false || value === true) {
            return document.createDocumentFragment();
          }
          if (Array.isArray(value)) {
            const fragment = document.createDocumentFragment();
            for (const child of value) fragment.append(makeNode(child, insideSvg));
            return fragment;
          }
          if (typeof value === "string" || typeof value === "number") {
            return document.createTextNode(String(value));
          }
          if (value.type === Fragment) return makeNode(value.props.children, insideSvg);
          const isSvg = insideSvg || value.type === "svg";
          const element = isSvg
            ? document.createElementNS("http://www.w3.org/2000/svg", value.type)
            : document.createElement(value.type);
          for (const [key, property] of Object.entries(value.props)) {
            if (key === "children" || property === null || property === undefined || property === false) continue;
            if (key === "style") {
              for (const [styleName, styleValue] of Object.entries(property)) {
                element.style[styleName] = String(styleValue);
              }
              continue;
            }
            const attribute = svgAttributes[key] || key;
            element.setAttribute(attribute, property === true ? "" : String(property));
          }
          const children = value.props.children;
          if (children !== undefined) element.append(makeNode(children, isSvg));
          return element;
        };
        const renderHyfrmeVNode = (root, value) => root.replaceChildren(makeNode(value));
        export {Fragment, jsx, jsxs, renderHyfrmeVNode};
      `,
    }));
  },
};

for (const icon of icons) {
  const registryItem = upstreamRegistry.items.find(
    (item) => item.name === icon.name,
  );
  const sourcePath = resolve(upstream, icon.files[0].path);
  const configPath = resolve(dirname(sourcePath), "config.ts");
  const configSource = await readFile(configPath, "utf8");
  const componentName = configSource.match(
    /componentName:\s*["']([^"']+)["']/,
  )?.[1];

  if (!componentName) {
    throw new Error(`Could not read componentName from ${configPath}`);
  }

  const fps = configSource.includes("fps: FPS")
    ? 30
    : numberField(configSource, "fps");
  const durationInFrames = numberField(configSource, "durationInFrames");
  const width = numberField(configSource, "compositionWidth");
  const height = numberField(configSource, "compositionHeight");
  const defaults = {
    animation: stringDefault(configSource, "animation", "both"),
    loop: booleanDefault(configSource, "loop", false),
    speed: numberDefault(configSource, "speed", 1),
    size: numberDefault(configSource, "size", Math.min(width, height)),
    color: stringDefault(configSource, "color", "#171717"),
    strokeWidth: numberDefault(configSource, "strokeWidth", 2),
  };
  const importPath = `./${relative(upstream, sourcePath).replaceAll("\\", "/")}`;
  const entry = `
    import {renderHyfrmeVNode} from "react/jsx-runtime";
    import {__setHyfrmeFrame} from "remotion";
    import {${componentName}} from ${JSON.stringify(importPath)};

    const rootElement = document.getElementById("hyfrme-icon-root");
    const variables = window.__hyperframes.getVariables();
    const videoConfig = ${JSON.stringify({ fps, width, height, durationInFrames })};
    const props = {
      animation: String(variables.animation),
      loop: Boolean(variables.loop),
      speed: Number(variables.speed),
      size: Number(variables.size),
      color: String(variables.color),
      strokeWidth: Number(variables.strokeWidth),
    };

    window.__hyfrmeRenderFrame = (frame) => {
      __setHyfrmeFrame(frame, videoConfig);
      renderHyfrmeVNode(rootElement, ${componentName}(props));
    };
    window.__hyfrmeRenderFrame(0);
  `;
  const result = await build({
    absWorkingDir: upstream,
    bundle: true,
    format: "iife",
    minify: true,
    platform: "browser",
    plugins: [compatibilityPlugin],
    stdin: {
      contents: entry,
      loader: "tsx",
      resolveDir: upstream,
      sourcefile: `${icon.name}-hyfrme-entry.tsx`,
    },
    target: ["chrome120"],
    tsconfig: resolve(upstream, "tsconfig.json"),
    write: false,
  });
  const bundle = result.outputFiles[0].text;
  const duration = durationInFrames / fps;
  const variableSchema = [
    {
      id: "animation",
      type: "string",
      label: "Animation",
      default: defaults.animation,
    },
    { id: "loop", type: "boolean", label: "Loop", default: defaults.loop },
    { id: "speed", type: "number", label: "Speed", default: defaults.speed },
    { id: "size", type: "number", label: "Size", default: defaults.size },
    { id: "color", type: "color", label: "Color", default: defaults.color },
    {
      id: "strokeWidth",
      type: "number",
      label: "Stroke width",
      default: defaults.strokeWidth,
    },
  ];
  const html = `<!doctype html>
<html lang="en" data-composition-variables='${JSON.stringify(variableSchema)}'>
  <head>
    <meta charset="UTF-8">
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * { box-sizing: border-box; }
      html, body { width: ${width}px; height: ${height}px; margin: 0; overflow: hidden; background: #fff; }
      #hyfrme-icon-stage { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: ${defaults.color}; }
      #hyfrme-icon-root { width: ${defaults.size}px; height: ${defaults.size}px; display: flex; align-items: center; justify-content: center; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="${icon.name}" data-start="0" data-duration="${duration}" data-fps="${fps}" data-width="${width}" data-height="${height}">
      <div id="hyfrme-icon-stage" class="clip" data-start="0" data-duration="${duration}" data-track-index="0">
        <div id="hyfrme-icon-root"></div>
      </div>
    </div>
    <script>${escapeInlineScript(bundle)}</script>
    <script>
      window.__timelines = window.__timelines || {};
      const clock = { frame: 0 };
      const timeline = gsap.timeline({ paused: true });
      timeline.to(clock, {
        frame: ${durationInFrames},
        duration: ${duration},
        ease: "none",
        onUpdate: () => window.__hyfrmeRenderFrame(Math.max(0, Math.min(${durationInFrames - 1}, Math.round(clock.frame)))),
      });
      window.__timelines["${icon.name}"] = timeline;
    </script>
  </body>
</html>
`;
  const blockDirectory = resolve(root, "registry", "blocks", icon.name);
  await mkdir(blockDirectory, { recursive: true });
  await writeFile(resolve(blockDirectory, `${icon.name}.html`), html);
  await writeFile(
    resolve(blockDirectory, "registry-item.json"),
    `${JSON.stringify(
      {
        $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
        name: icon.name,
        type: "hyperframes:block",
        title: registryItem.title,
        description: `${registryItem.description} Compiled for deterministic HyperFrames playback by Hyfrme.`,
        tags: ["icon", "svg", "remocn-port"],
        author: "Hyfrme",
        authorUrl: "https://github.com/AksharP5/hyfrme",
        license: "MIT",
        dimensions: { width, height },
        duration,
        files: [
          {
            path: `${icon.name}.html`,
            target: `compositions/${icon.name}.html`,
            type: "hyperframes:composition",
          },
        ],
      },
      null,
      2,
    )}\n`,
  );
  generatedFixtures.push({
    slug: icon.name,
    title: registryItem.title,
    description: registryItem.description,
    origin: {
      repository: "https://github.com/Remocn/remocn",
      commit: upstreamCommit,
      source: icon.files[0].path,
      config: relative(upstream, configPath),
      license: "MIT",
    },
    fixture: { width, height, fps, durationInFrames, props: defaults },
    componentName,
  });
  console.log(
    `Generated ${icon.name}: ${width}x${height}, ${durationInFrames} frames, ${Math.round(bundle.length / 1024)} KiB runtime`,
  );
}

if (!only) {
  await writeFile(
    resolve(root, "catalog", "icon-fixtures.json"),
    `${JSON.stringify(generatedFixtures, null, 2)}\n`,
  );
}
