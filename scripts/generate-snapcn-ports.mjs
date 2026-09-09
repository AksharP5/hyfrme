import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { snapcnRuntimeSource } from "./snapcn-runtime.mjs";
import { scopeSnapcnSvgIds, snapcnSvgComponents } from "./snapcn-svg-ids.mjs";
import { snapcnFontFamily, snapcnFontsPlugin } from "./snapcn-fonts.mjs";

const root = resolve(import.meta.dirname, "..");
const upstream = resolve(root, process.env.SNAPCN_SOURCE ?? ".work/snapcn");
const dependencies = resolve(root, ".work/snapcn-deps/node_modules");
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const fixtures = await readJson(resolve(root, "catalog/snapcn-fixtures.json"));
const assetManifest = await readJson(
  resolve(root, "assets/snapcn/manifest.json"),
);
const commit = execFileSync("git", ["-C", upstream, "rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
if (
  execFileSync("git", ["-C", upstream, "status", "--porcelain"], {
    encoding: "utf8",
  }).trim()
) {
  throw new Error(
    "Snapcn checkout must be clean to produce attributable ports.",
  );
}
const onlyIndex = process.argv.indexOf("--only");
const only =
  onlyIndex < 0 ? null : new Set(process.argv[onlyIndex + 1]?.split(","));
const selected = only
  ? fixtures.filter((entry) => only.has(entry.slug))
  : fixtures;
if (selected.length === 0 || (only && selected.length !== only.size)) {
  throw new Error("Expected a nonempty selection of known Snapcn slugs.");
}
if (selected.some((entry) => entry.origin.commit !== commit)) {
  throw new Error(
    "Snapcn checkout does not match the selected fixture pin. Use scripts/run-snapcn.mjs for mixed pins.",
  );
}
const license = await readFile(resolve(upstream, "LICENSE"), "utf8");
const banner = `/*!\nPorted from https://github.com/snapcndev/snapcn at ${commit}.\n${license}\n*/`;
const attribute = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const scriptJson = (value) => JSON.stringify(value).replaceAll("<", "\\u003c");
const assetPath = (path) => path.replace(/^assets\/snapcn\//, "");

for (const entry of selected) {
  const { slug, fixture, componentName } = entry;
  const usedFonts = new Set(["Geist"]);
  const files = new Map();
  const addAsset = (path, target = `assets/snapcn/${assetPath(path)}`) => {
    const local = assetPath(path);
    files.set(local, {
      path: local,
      target,
      type: "hyperframes:asset",
      source: resolve(root, "assets/snapcn", local),
    });
  };
  const media = Object.fromEntries(
    (assetManifest.media ?? []).map((asset) => [
      asset.source,
      `../assets/snapcn/${assetPath(asset.portPath ?? asset.path)}`,
    ]),
  );
  const plugins = [
    snapcnFontsPlugin({ fonts: assetManifest.fonts, dependencies, usedFonts }),
    {
      name: "snapcn-frame-and-fonts",
      setup(api) {
        api.onResolve({ filter: /^@paper-design\/shaders-react$/ }, () => ({
          path: resolve(
            root,
            "assets/snapcn/paper-shaders/shaders-react/src/shaders/pulsing-border.tsx",
          ),
        }));
        api.onResolve({ filter: /^@paper-design\/shaders$/ }, () => ({
          path: "paper",
          namespace: "snapcn-paper",
        }));
        api.onLoad({ filter: /.*/, namespace: "snapcn-paper" }, () => ({
          loader: "ts",
          resolveDir: resolve(root, "assets/snapcn/paper-shaders/shaders/src"),
          contents: [
            "shaders/pulsing-border",
            "shader-mount",
            "shader-sizing",
            "shader-utils",
            "get-shader-color-from-string",
            "get-shader-noise-texture",
            "empty-pixel",
          ]
            .map((path) => `export * from './${path}.ts';`)
            .join("\n"),
        }));
        api.onResolve({ filter: /^remotion$/ }, () => ({
          path: "remotion",
          namespace: "snapcn-frame",
        }));
        api.onLoad({ filter: /.*/, namespace: "snapcn-frame" }, () => ({
          contents: snapcnRuntimeSource(
            snapcnSvgComponents.includes(slug.slice(7)),
          ),
          loader: "jsx",
          resolveDir: dependencies,
        }));
        api.onLoad(
          { filter: /terminal-simulator\/index\.tsx$/ },
          async ({ path }) => {
            const source = await readFile(path, "utf8");
            const sample = "key={g.back}";
            if (!source.includes(sample))
              throw new Error("Pinned terminal ghost samples changed.");
            return {
              loader: "tsx",
              resolveDir: dirname(path),
              contents: source.replace(
                sample,
                "data-hyfrme-motion-samples key={g.back}",
              ),
            };
          },
        );
        api.onLoad(
          { filter: /paper-shaders\/shaders\/src\/shader-mount\.ts$/ },
          async ({ path }) => {
            let source = await readFile(path, "utf8");
            const replace = (pattern, value) => {
              if (!pattern.test(source))
                throw new Error("Pinned shader scheduler changed.");
              source = source.replace(pattern, value);
            };
            // Snapcn always supplies speed=0 and an explicit frame. Remove the
            // unused wall-clock scheduler; shader equations and sizing stay intact.
            replace(
              /    \/\/ Calculate the delta time[\s\S]*?    \/\/ Clear the canvas/,
              "    // Clear the canvas",
            );
            replace(
              /    \/\/ Loop if we're animating[\s\S]*?  \/\*\* Creates a texture/,
              "  };\n\n  /** Creates a texture",
            );
            replace(
              /  private setCurrentSpeed = \(newSpeed: number\): void => \{[\s\S]*?\n  \};/,
              '  private setCurrentSpeed = (newSpeed: number): void => {\n    if (newSpeed !== 0) throw new Error("Snapcn shaders require an explicit frame clock.");\n    this.currentSpeed = 0;\n  };',
            );
            replace(
              /    \/\/ Cancel the rAF loop[\s\S]*?    if \(this.gl/,
              "    if (this.gl",
            );
            source = source.replaceAll("performance.now()", "0");
            return {
              loader: "ts",
              resolveDir: dirname(path),
              contents: source,
            };
          },
        );
        api.onLoad(
          { filter: /snap-cn\/pulsing-border\/index\.tsx$/ },
          async ({ path }) => {
            const source = await readFile(path, "utf8");
            const gate =
              /      requestAnimationFrame\(\(\) =>[\s\S]*?      \);/;
            if (!gate.test(source))
              throw new Error("Pinned shader readiness gate changed.");
            return {
              loader: "tsx",
              resolveDir: dirname(path),
              contents: source.replace(
                gate,
                `      const ready = () => element.querySelector('[data-paper-shader]');
      if (ready()) { continueRender(handle); return; }
      const observer = new MutationObserver(() => {
        if (!ready()) return;
        observer.disconnect();
        continueRender(handle);
      });
      observer.observe(element, {childList: true, subtree: true, attributes: true, attributeFilter: ['data-paper-shader']});`,
              ),
            };
          },
        );
        api.onLoad(
          {
            filter:
              /snap-cn\/(count-grid|phone-frame|punch-lines)\/index\.tsx$/,
          },
          async ({ path }) => ({
            loader: "tsx",
            resolveDir: dirname(path),
            contents: scopeSnapcnSvgIds(
              await readFile(path, "utf8"),
              path.split("/").at(-2),
            ),
          }),
        );
        api.onLoad(
          { filter: /announce-title\/index\.tsx$/ },
          async ({ path }) => {
            const source = scopeSnapcnSvgIds(
              await readFile(path, "utf8"),
              "announce-title",
            );
            const sample =
              "<AbsoluteFill key={i} style={{ opacity: 1 / (i + 1) }}>";
            if (!source.includes(sample))
              throw new Error("Pinned Shutter sample changed.");
            return {
              loader: "tsx",
              contents: source.replace(
                sample,
                "<AbsoluteFill data-hyfrme-motion-samples key={i} style={{ opacity: 1 / (i + 1) }}>",
              ),
              resolveDir: dirname(path),
            };
          },
        );
      },
    },
  ];
  const variables = Object.entries(entry.controls).map(([id, control]) => {
    const type = ["text", "select", "image"].includes(control.type)
      ? "string"
      : control.type === "number-input"
        ? "number"
        : control.type;
    if (!["string", "number", "color", "boolean"].includes(type))
      throw new Error(`Unsupported control ${slug}.${id}: ${type}`);
    return {
      id,
      type,
      label: control.label,
      default: fixture.props[id],
      ...Object.fromEntries(
        ["min", "max", "step", "options"]
          .filter((key) => control[key] !== undefined)
          .map((key) => [key, control[key]]),
      ),
    };
  });
  const duration = fixture.durationInFrames / fixture.fps;
  const contents = `
import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {__configure, __setFrame, __waitForSource} from 'remotion';
import {${componentName}} from ${JSON.stringify(resolve(upstream, entry.origin.entry ?? entry.origin.source))};
const slug = ${JSON.stringify(slug)};
const config = ${JSON.stringify({ width: fixture.width, height: fixture.height, fps: fixture.fps, durationInFrames: fixture.durationInFrames })};
const container = document.getElementById(slug + '-source-root');
const assets = JSON.parse(container.dataset.hyfrmeAssets);
__configure(config, assets, slug);
const props = {...${scriptJson(fixture.props)}, ...window.__hyperframes.getVariables()};
const component = createRoot(container, {identifierPrefix: container.closest('[data-composition-file]')?.dataset.compositionId ?? slug});
const renderFrame = (frame) => {
  __setFrame(frame);
  flushSync(() => component.render(React.createElement(${componentName}, props)));
  ${
    ["snapcn-announce-title", "snapcn-terminal-simulator"].includes(slug)
      ? `// HyperFrames overlap annotations apply to each measured element.
  for (const element of container.querySelectorAll('[data-hyfrme-motion-samples] *:not([data-layout-allow-overlap])')) {
    element.setAttribute('data-layout-allow-overlap', '');
  }`
      : ""
  }
};
window.__hyfrmeRenderers = window.__hyfrmeRenderers || {};
window.__hyfrmeRenderers[slug] = renderFrame;
window.__hyfrmeReadiness = window.__hyfrmeReadiness || {};
const ready = (async () => {
  const families = new Set(JSON.parse(container.dataset.hyfrmeFonts));
  await Promise.all(Array.from(document.fonts).filter(font => families.has(font.family.replaceAll('"', '').replaceAll("'", ''))).map(font => font.load()));
  await document.fonts.ready;
  renderFrame(0);
  await __waitForSource();
  renderFrame(0);
})();
window.__hyfrmeReadiness[slug] = ready;
window.__hyfrmeReady = ready;
`;
  const result = await build({
    absWorkingDir: upstream,
    stdin: {
      contents,
      loader: "tsx",
      resolveDir: upstream,
      sourcefile: `${slug}-entry.tsx`,
    },
    bundle: true,
    format: "iife",
    minify: true,
    platform: "browser",
    target: ["chrome120"],
    ...(slug === "snapcn-pulsing-border"
      ? { supported: { "template-literal": false } }
      : {}),
    tsconfig: resolve(upstream, "tsconfig.json"),
    nodePaths: [dependencies],
    alias: {
      react: resolve(dependencies, "react"),
      "react-dom": resolve(dependencies, "react-dom"),
    },
    plugins,
    define: { "process.env.NODE_ENV": '"production"' },
    banner: { js: banner },
    metafile: true,
    write: false,
  });
  const fonts = assetManifest.fonts.filter((font) =>
    usedFonts.has(font.module),
  );
  const fontCss = fonts
    .map((font) => {
      addAsset(font.path);
      addAsset(
        font.licensePath,
        `THIRD_PARTY_LICENSES/snapcn/${assetPath(font.licensePath).split("/").at(-1)}`,
      );
      return `@font-face {font-family:${JSON.stringify(snapcnFontFamily(font.family))};src:url("../assets/snapcn/${assetPath(font.path)}") format("woff2");font-weight:${font.weight};font-style:${font.style};font-display:block;${font.unicodeRange ? `unicode-range:${font.unicodeRange};` : ""}}`;
    })
    .join("\n");
  const sourceInputs = Object.keys(result.metafile.inputs).filter(
    (path) => !path.includes("node_modules") && !path.startsWith("snapcn-"),
  );
  const sourceText =
    (
      await Promise.all(
        sourceInputs.map((path) => readFile(resolve(upstream, path), "utf8")),
      )
    ).join("\n") + JSON.stringify(fixture.props);
  const hasVideo = /\bOffthreadVideo\b/.test(sourceText);
  const selectedMedia = (assetManifest.media ?? []).filter(
    (asset) =>
      sourceText.includes(asset.source) ||
      (asset.source.startsWith("/") &&
        sourceText.includes(asset.source.slice(1))) ||
      (slug === "snapcn-orbit-gallery" &&
        asset.source.startsWith("https://picsum.photos/seed/snap-orbit-")) ||
      (slug === "snapcn-follower-rush" &&
        /^\/avatars\/\d+\.jpg$/.test(asset.source)),
  );
  for (const asset of selectedMedia) {
    addAsset(asset.portPath ?? asset.path);
    if (asset.noticePath)
      addAsset(
        asset.noticePath,
        `THIRD_PARTY_LICENSES/snapcn/${assetPath(asset.noticePath).split("/").at(-1)}`,
      );
    if (asset.licensePath)
      addAsset(
        asset.licensePath,
        `THIRD_PARTY_LICENSES/snapcn/${assetPath(asset.licensePath).split("/").at(-1)}`,
      );
  }
  const packagedMedia = Object.fromEntries(
    selectedMedia.map((asset) => [asset.source, media[asset.source]]),
  );
  const packages = new Map();
  packages.set("tailwindcss", resolve(dependencies, "tailwindcss"));
  for (const path of Object.keys(result.metafile.inputs)) {
    if (!path.includes("node_modules/")) continue;
    const absolute = resolve(upstream, path);
    const suffix = absolute
      .slice(absolute.lastIndexOf("node_modules/") + "node_modules/".length)
      .split("/");
    const name = suffix[0].startsWith("@")
      ? suffix.slice(0, 2).join("/")
      : suffix[0];
    const packageRoot =
      absolute.slice(0, absolute.lastIndexOf("node_modules/")) +
      "node_modules/" +
      name;
    if (name === "remotion" || name.startsWith("@remotion/"))
      throw new Error(`Remotion runtime leaked into ${slug}: ${name}`);
    if (name.startsWith("@paper-design/"))
      throw new Error(
        `Restricted npm shader code leaked into ${slug}; only frozen Apache sources may be bundled.`,
      );
    packages.set(name, packageRoot);
  }
  const block = resolve(root, "registry/blocks", slug);
  await mkdir(resolve(block, "licenses"), { recursive: true });
  const packageLicenses = [];
  for (const name of entry.inlineDependencies ?? []) {
    const dependency = assetManifest.dependencies.find(
      (item) => item.name === name,
    );
    if (!dependency) throw new Error(`Unaudited inline dependency: ${name}`);
    for (const license of dependency.licenses) {
      const path = `licenses/${basename(license.path)}`;
      files.set(path, {
        path,
        target: `THIRD_PARTY_LICENSES/snapcn/${basename(license.path)}`,
        type: "hyperframes:asset",
        source: resolve(root, "assets/snapcn", license.path),
      });
    }
    packageLicenses.push({
      name,
      version: dependency.version,
      license: dependency.license,
    });
  }
  for (const [name, directory] of packages) {
    const metadata = await readJson(resolve(directory, "package.json"));
    const licenses = (await readdir(directory)).filter((name) =>
      /^(licen[cs]e|notice)(\.|$)/i.test(name),
    );
    if (licenses.length === 0)
      throw new Error(`No license file found for bundled ${name}`);
    for (const licenseName of licenses) {
      const path = `licenses/${name.replaceAll("/", "-")}-${licenseName}`;
      files.set(path, {
        path,
        target: `THIRD_PARTY_LICENSES/snapcn/${path.slice(9)}`,
        type: "hyperframes:asset",
        source: resolve(directory, licenseName),
      });
    }
    packageLicenses.push({
      name,
      version: metadata.version,
      license: metadata.license,
    });
  }
  files.set("licenses/Snapcn-MIT.txt", {
    path: "licenses/Snapcn-MIT.txt",
    target: "THIRD_PARTY_LICENSES/snapcn/Snapcn-MIT.txt",
    type: "hyperframes:asset",
    source: resolve(upstream, "LICENSE"),
  });
  if (slug === "snapcn-pulsing-border") {
    addAsset(
      "paper-shaders/LICENSE.txt",
      "THIRD_PARTY_LICENSES/snapcn/Paper-Shaders-Apache-2.0.txt",
    );
    addAsset(
      "paper-shaders/NOTICE.txt",
      "THIRD_PARTY_LICENSES/snapcn/Paper-Shaders-NOTICE.txt",
    );
    addAsset(
      "paper-shaders/provenance.json",
      "THIRD_PARTY_LICENSES/snapcn/Paper-Shaders-provenance.json",
    );
    packageLicenses.push({
      name: "@paper-design/shaders (Apache source)",
      version: "f9f2a8b2edeb78ec59256c4dc571f5eaf943d798",
      license: "Apache-2.0",
    });
  }
  const cssPath = resolve(root, "fixtures/snapcn/preview.css");
  const previewCss = await readFile(cssPath, "utf8").catch((error) => {
    if (error.code === "ENOENT") return "";
    throw error;
  });
  // Nest under the retained source root: HyperFrames replaces the outer root
  // and scopes only the outer rule, preserving nested utilities and theme rules.
  const scopedCss = previewCss
    .replaceAll('"Geist"', JSON.stringify(snapcnFontFamily("Geist")))
    .replaceAll(":root", "&")
    .replaceAll(":host", "&")
    .replace(/(^|[},])(html|body)(?=[,{])/g, "$1&");
  const html = `<!doctype html>
<html lang="en" data-composition-variables='${attribute(JSON.stringify(variables))}'>
  <head>
    <meta charset="UTF-8">
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
${fontCss}
#${slug}-source-root {${scopedCss}}
      #${slug}, #${slug} * {box-sizing:border-box;}
      html, body {margin:0;width:${fixture.width}px;height:${fixture.height}px;overflow:hidden;}
      #${slug} {position:relative;width:${fixture.width}px;height:${fixture.height}px;}
      #${slug}-stage, #${slug}-source-root {position:absolute;inset:0;width:100%;height:100%;}
      #${slug}-source-root {--font-geist-sans:${JSON.stringify(snapcnFontFamily("Geist"))};font-family:${JSON.stringify(snapcnFontFamily("Geist"))};background:${fixture.background};}
    </style>
  </head>
  <body>
    <div id="${slug}" data-composition-id="${slug}" data-start="0" data-duration="${duration}" data-fps="${fixture.fps}" data-width="${fixture.width}" data-height="${fixture.height}">
      <span hidden data-layout-ignore data-hyfrme-clock></span>
      <div id="${slug}-stage" class="clip" data-start="0" data-duration="${duration}" data-track-index="0"><div id="${slug}-source-root" data-hyfrme-assets='${attribute(JSON.stringify(packagedMedia))}' data-hyfrme-fonts='${attribute(JSON.stringify([...new Set(fonts.map((font) => snapcnFontFamily(font.family)))]))}'></div></div>
    </div>
    <script src="./${slug}.runtime.js"></script>
    <script>
${hasVideo ? "      // Runtime-inserted <video> elements require HyperFrames' browser media probe.\n" : ""}
      const renderFrame = window.__hyfrmeRenderers[${JSON.stringify(slug)}];
      window.__hyfrmeReadiness[${JSON.stringify(slug)}].then(() => {
        const clock = document.querySelector('[data-composition-id="${slug}"] [data-hyfrme-clock]');
        clock.frame = 0;
        const timeline = gsap.timeline({paused:true});
        timeline.to(clock, {frame:${fixture.durationInFrames},duration:${duration},ease:"none",onUpdate:() => renderFrame(Math.max(0,Math.min(${fixture.durationInFrames - 1},Math.round(clock.frame))))});
        window.__timelines = window.__timelines || {};
        window.__timelines[${JSON.stringify(slug)}] = timeline;
        window.__hfForceTimelineRebind?.();
      });
    </script>
  </body>
</html>
`;
  for (const file of files.values()) {
    await mkdir(dirname(resolve(block, file.path)), { recursive: true });
    await copyFile(file.source, resolve(block, file.path));
  }
  await writeFile(resolve(block, `${slug}.html`), html);
  await writeFile(
    resolve(block, `${slug}.runtime.js`),
    result.outputFiles[0].text,
  );
  const manifest = {
    $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
    name: slug,
    type: "hyperframes:block",
    title: entry.title,
    description: entry.description,
    tags: [...new Set([...(entry.tags ?? []), "snapcn", "snapcn-port"])],
    author: "Hyfrme",
    authorUrl: "https://github.com/AksharP5/hyfrme",
    license: [
      ...new Set(
        [
          "MIT",
          ...packageLicenses.map((entry) => entry.license),
          ...fonts.map((font) => font.license),
          ...selectedMedia.map((asset) =>
            asset.license === "Unsplash License"
              ? "LicenseRef-Unsplash"
              : asset.license,
          ),
        ].filter(Boolean),
      ),
    ].join(" AND "),
    origin: entry.origin,
    bundledDependencies: packageLicenses,
    dimensions: { width: fixture.width, height: fixture.height },
    duration,
    files: [
      {
        path: `${slug}.html`,
        target: `compositions/${slug}.html`,
        type: "hyperframes:composition",
      },
      {
        path: `${slug}.runtime.js`,
        target: `compositions/${slug}.runtime.js`,
        type: "hyperframes:asset",
      },
      ...[...files.values()].map(({ source, ...file }) => file),
    ],
  };
  await writeFile(
    resolve(block, "registry-item.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  console.log(
    `Generated ${slug}: ${variables.length} controls, ${files.size} asset/license files.`,
  );
}
