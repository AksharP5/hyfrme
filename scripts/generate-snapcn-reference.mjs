import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const root = resolve(import.meta.dirname, "..");
export const upstream = resolve(
  root,
  process.env.SNAPCN_SOURCE ?? ".work/snapcn",
);
export const workbench = resolve(root, ".work/snapcn-reference");
export const deps = resolve(root, ".work/snapcn-deps/node_modules");
export const remotionVersion = "4.0.473";
export const hyperframesVersion = "0.8.30";
export const run = (command, args, options = {}) =>
  new Promise((accept, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? root,
      env: { ...process.env, ...options.env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
    child.stderr.on("data", (chunk) => {
      output += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0 || options.allowFailure) accept({ output, code });
      else
        reject(
          new Error(`${command} ${args.join(" ")} exited ${code}\n${output}`),
        );
    });
  });

export async function selectFixtures(args = process.argv.slice(2)) {
  const fixtures = JSON.parse(
    await readFile(resolve(root, "catalog/snapcn-fixtures.json"), "utf8"),
  );
  const onlyIndex = args.indexOf("--only");
  if (
    onlyIndex !== -1 &&
    (!args[onlyIndex + 1] || args[onlyIndex + 1].startsWith("--"))
  ) {
    throw new Error("--only requires comma-separated fixture slugs");
  }
  const names =
    onlyIndex === -1 ? null : new Set(args[onlyIndex + 1].split(","));
  const selected = names
    ? fixtures.filter((entry) => names.has(entry.slug))
    : fixtures;
  if (!selected.length || (names && selected.length !== names.size)) {
    throw new Error(
      `Expected ${names?.size ?? "nonempty"} Snapcn fixtures, found ${selected.length}`,
    );
  }
  const { output: commit } = await run("git", ["rev-parse", "HEAD"], {
    cwd: upstream,
  });
  const { output: dirty } = await run(
    "git",
    ["status", "--porcelain", "--untracked-files=no"],
    { cwd: upstream },
  );
  if (dirty.trim())
    throw new Error("Snapcn reference checkout has modified tracked files");
  for (const entry of selected) {
    if (entry.origin.commit !== commit.trim())
      throw new Error(`${entry.slug}: upstream does not match pinned commit`);
    for (const key of ["width", "height", "fps", "durationInFrames"]) {
      if (!Number.isInteger(entry.fixture[key]) || entry.fixture[key] < 1)
        throw new Error(`${entry.slug}: invalid fixture ${key}`);
    }
  }
  return selected;
}

let browserPromise;
export async function verificationBrowser() {
  browserPromise ??= (async () => {
    const path =
      process.env.HYFRME_BROWSER_EXECUTABLE ??
      (
        await run("npx", [
          "--yes",
          `hyperframes@${hyperframesVersion}`,
          "browser",
          "path",
        ])
      ).output
        .trim()
        .split("\n")
        .at(-1);
    const { output } = await run(path, ["--version"]);
    return { path, version: output.trim() };
  })();
  return browserPromise;
}

let frozenAssetFingerprint;
export async function referenceFingerprint(entry) {
  frozenAssetFingerprint ??= (async () => {
    const manifest = JSON.parse(
      await readFile(resolve(root, "assets/snapcn/manifest.json"), "utf8"),
    );
    const files = new Map(
      [...manifest.fonts, ...manifest.media].map((asset) => [
        asset.path,
        asset.sha256,
      ]),
    );
    for (const [path, expected] of files) {
      const actual = createHash("sha256")
        .update(await readFile(resolve(root, "assets/snapcn", path)))
        .digest("hex");
      if (actual !== expected)
        throw new Error(`Frozen Snapcn asset checksum mismatch: ${path}`);
    }
    return JSON.stringify({
      fonts: manifest.fonts.map(
        ({
          module,
          family,
          style,
          weight,
          source,
          path,
          sha256,
          unicodeRange,
        }) => ({
          module,
          family,
          style,
          weight,
          source,
          path,
          sha256,
          unicodeRange,
        }),
      ),
      media: manifest.media.map(({ source, path, sha256 }) => ({
        source,
        path,
        sha256,
      })),
    });
  })();
  return createHash("sha256")
    .update(
      JSON.stringify({
        slug: entry.slug,
        componentName: entry.componentName,
        origin: entry.origin,
        fixture: entry.fixture,
      }),
    )
    .update(await frozenAssetFingerprint)
    .update(await readFile(import.meta.filename))
    .update(await readFile(resolve(root, "fixtures/snapcn/preview.css")))
    .update(remotionVersion)
    .update((await verificationBrowser()).version)
    .digest("hex");
}

export async function generatePreviewCss() {
  await mkdir(workbench, { recursive: true });
  const globals = (await readFile(resolve(upstream, "app/globals.css"), "utf8"))
    .split("\n")
    .filter(
      (line) => !line.startsWith("@import") && !line.startsWith("@source"),
    )
    .join("\n");
  const input = resolve(workbench, "tailwind.css");
  await writeFile(
    input,
    `@import ${JSON.stringify(resolve(deps, "tailwindcss/index.css"))} source(none);\n@source ${JSON.stringify(resolve(upstream, "registry/snap-cn"))};\n@source ${JSON.stringify(resolve(upstream, "registry/snap-cn-ui"))};\n${globals}\n@theme { --font-sans: "Geist"; --font-mono: monospace; }\n`,
  );
  await mkdir(resolve(root, "fixtures/snapcn"), { recursive: true });
  await run(process.execPath, [
    resolve(deps, "@tailwindcss/cli/dist/index.mjs"),
    "-i",
    input,
    "-o",
    resolve(root, "fixtures/snapcn/preview.css"),
    "--minify",
  ]);
  const cssPath = resolve(root, "fixtures/snapcn/preview.css");
  const css = await readFile(cssPath, "utf8");
  const systemFaces = [
    "Apple Color Emoji",
    "Segoe UI Emoji",
    "Segoe UI Symbol",
    "SFMono-Regular",
  ]
    .map(
      (family) =>
        `@font-face{font-family:${JSON.stringify(family)};src:local(${JSON.stringify(family)})}`,
    )
    .join("\n");
  await writeFile(cssPath, `${css}\n${systemFaces}\n`);
}

export async function renderReferences(fixtures, { reuse = false } = {}) {
  const pending = [];
  for (const entry of fixtures) {
    const directory = resolve(workbench, "renders", entry.slug);
    if (reuse) {
      const state = await readFile(
        resolve(directory, "reference-state.json"),
        "utf8",
      )
        .then(JSON.parse)
        .catch(() => null);
      const files = await readdir(resolve(directory, "reference-frames")).catch(
        () => [],
      );
      if (
        state?.fingerprint === (await referenceFingerprint(entry)) &&
        files.filter((name) => name.endsWith(".png")).length ===
          entry.fixture.durationInFrames
      )
        continue;
    }
    pending.push(entry);
  }
  if (!pending.length) return;
  const project = resolve(
    workbench,
    "projects",
    createHash("sha256")
      .update(pending.map((entry) => entry.slug).join(","))
      .digest("hex")
      .slice(0, 16),
  );
  const require = createRequire(resolve(deps, "../package.json"));
  const { bundle } = require("@remotion/bundler");
  const {
    ensureBrowser,
    getCompositions,
    renderFrames,
  } = require("@remotion/renderer");
  if (require("remotion/package.json").version !== remotionVersion)
    throw new Error(`Reference requires Remotion ${remotionVersion}`);
  const assets = JSON.parse(
    await readFile(resolve(root, "assets/snapcn/manifest.json"), "utf8"),
  );
  await mkdir(resolve(project, "fonts"), { recursive: true });
  await mkdir(resolve(project, "public/assets"), { recursive: true });
  await cp(
    resolve(root, "assets/snapcn"),
    resolve(project, "public/assets/snapcn"),
    { recursive: true },
  );
  for (const media of assets.media.filter((media) =>
    media.source.startsWith("/"),
  )) {
    const target = resolve(project, "public", `.${media.source}`);
    await mkdir(dirname(target), { recursive: true });
    await cp(resolve(root, "assets/snapcn", media.path), target);
  }
  const mediaLoader = resolve(project, "frozen-media-loader.cjs");
  const mediaReplacements = assets.media
    .filter((media) => media.source.startsWith("https://"))
    .map((media) => [media.source, `/assets/snapcn/${media.path}`]);
  mediaReplacements.push([
    "https://picsum.photos/seed/snap-orbit-${i + 1}/440/560",
    "/assets/snapcn/media/orbit/snap-orbit-${i + 1}.jpg",
  ]);
  await writeFile(
    mediaLoader,
    `const replacements=${JSON.stringify(mediaReplacements)};\nmodule.exports=function(source){for(const [url,path] of replacements)source=source.split(url).join(path);return source;};\n`,
  );
  const fontAliases = {};
  for (const module of new Set(assets.fonts.map((font) => font.module))) {
    const original = require(`@remotion/google-fonts/${module}`);
    const info = original.getInfo();
    const fonts = {};
    for (const font of assets.fonts.filter((font) => font.module === module)) {
      fonts[font.style] ??= {};
      fonts[font.style][font.weight] ??= {};
      fonts[font.style][font.weight].latin =
        `/public/assets/snapcn/${font.path}`;
    }
    // Keep Remotion's real FontFace loader and delayRender contract, freezing only font URLs/subsets.
    const target = resolve(project, "fonts", `${module}.js`);
    const base = resolve(deps, "@remotion/google-fonts/dist/cjs/base.js");
    await writeFile(
      target,
      `import {loadFonts} from ${JSON.stringify(base)};\nexport const getInfo=()=>(${JSON.stringify({ ...info, fonts, unicodeRanges: { latin: info.unicodeRanges.latin } })});\nexport const fontFamily=${JSON.stringify(info.fontFamily)};\nexport const loadFont=(style,options)=>loadFonts(getInfo(),style,options);\n`,
    );
    fontAliases[`@remotion/google-fonts/${module}$`] = target;
  }
  const tsconfig = JSON.parse(
    await readFile(resolve(upstream, "tsconfig.json"), "utf8"),
  );
  const sourceAliases = {};
  for (const [key, [target]] of Object.entries(
    tsconfig.compilerOptions.paths,
  )) {
    sourceAliases[key.endsWith("/*") ? key.slice(0, -2) : `${key}$`] = resolve(
      upstream,
      target.split("*")[0].replace(/\/$/, ""),
    );
  }
  const previewCss = await readFile(
    resolve(root, "fixtures/snapcn/preview.css"),
    "utf8",
  );
  const components = pending
    .map(
      (entry, index) =>
        `import {${entry.componentName} as Source${index}} from ${JSON.stringify(resolve(upstream, entry.origin.entry ?? entry.origin.source))};\nfunction Fixture${index}(){return <AbsoluteFill style={{background:${JSON.stringify(entry.fixture.background)},'--font-geist-sans':GEIST,fontFamily:GEIST}}><Source${index} {...${JSON.stringify(entry.fixture.props)}}/></AbsoluteFill>;}`,
    )
    .join("\n");
  const compositions = pending
    .map(
      (entry, index) =>
        `<Composition id=${JSON.stringify(entry.slug)} component={Fixture${index}} width={${entry.fixture.width}} height={${entry.fixture.height}} fps={${entry.fixture.fps}} durationInFrames={${entry.fixture.durationInFrames}}/>`,
    )
    .join("\n");
  const entryPoint = resolve(project, "root.tsx");
  await writeFile(
    entryPoint,
    `import React from "react";\nimport {AbsoluteFill,Composition,registerRoot} from "remotion";\nimport {loadFont} from "@remotion/google-fonts/Geist";\nconst {fontFamily:GEIST}=loadFont("normal",{weights:["400","500","600","700"],subsets:["latin"]});\n${components}\nregisterRoot(()=> <><style>{${JSON.stringify(previewCss)}}</style>${compositions}</>);\n`,
  );
  const { path: browserExecutable, version: browserVersion } =
    await verificationBrowser();
  const serveUrl = await bundle({
    entryPoint,
    rootDir: resolve(deps, ".."),
    publicDir: resolve(project, "public"),
    outDir: resolve(project, "bundle"),
    webpackOverride: (config) => ({
      ...config,
      module: {
        ...config.module,
        rules: [
          ...(config.module?.rules ?? []),
          {
            test: /\.[cm]?[jt]sx?$/,
            include: [upstream, entryPoint],
            enforce: "pre",
            use: [mediaLoader],
          },
        ],
      },
      resolve: {
        ...config.resolve,
        modules: [deps, ...(config.resolve?.modules ?? ["node_modules"])],
        alias: {
          ...config.resolve?.alias,
          ...fontAliases,
          ...sourceAliases,
          react$: require.resolve("react"),
          "react-dom$": require.resolve("react-dom"),
          "react/jsx-runtime$": require.resolve("react/jsx-runtime"),
        },
      },
    }),
  });
  // Some source components call staticFile(src), while others use Img directly.
  await cp(resolve(project, "public/assets"), resolve(serveUrl, "assets"), {
    recursive: true,
  });
  const options = {
    serveUrl,
    browserExecutable,
    chromeMode: "headless-shell",
    chromiumOptions: { gl: "swangle" },
    timeoutInMilliseconds: 120000,
  };
  const compositionsById = new Map(
    (await getCompositions(serveUrl, options)).map((composition) => [
      composition.id,
      composition,
    ]),
  );
  for (const entry of pending) {
    const directory = resolve(workbench, "renders", entry.slug);
    const outputDir = resolve(directory, "reference-frames");
    await rm(outputDir, { recursive: true, force: true });
    await mkdir(directory, { recursive: true });
    const composition = compositionsById.get(entry.slug);
    if (!composition)
      throw new Error(`Reference composition missing: ${entry.slug}`);
    console.log(
      `Reference ${entry.slug}: ${entry.fixture.durationInFrames} PNG frames`,
    );
    await renderFrames({
      ...options,
      composition,
      inputProps: {},
      imageFormat: "png",
      outputDir,
      concurrency: 1,
      onStart() {},
      onFrameUpdate() {},
    });
    await writeFile(
      resolve(directory, "reference-state.json"),
      `${JSON.stringify({ fingerprint: await referenceFingerprint(entry), remotionVersion }, null, 2)}\n`,
    );
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  if (process.argv.includes("--css-only")) {
    await generatePreviewCss();
    process.exit(0);
  }
  await renderReferences(await selectFixtures(), {
    reuse:
      process.argv.includes("--reuse-reference") ||
      process.argv.includes("--resume"),
  });
}
