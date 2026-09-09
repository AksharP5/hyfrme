import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  run,
  verificationBrowser,
  hyperframesVersion,
} from "./generate-snapcn-reference.mjs";

export { run, verificationBrowser, hyperframesVersion };
export const root = resolve(import.meta.dirname, "..");
export const upstream = resolve(
  root,
  process.env.REMOCN_SOURCE ?? ".work/remocn",
);
export const workbench = resolve(root, ".work/remocn-lossless-reference");
export const remotionVersion = "4.0.513";
const referenceGl = "angle-egl";

async function assertSource(commit) {
  const [head, status] = await Promise.all([
    run("git", ["rev-parse", "HEAD"], { cwd: upstream }),
    run("git", ["status", "--porcelain", "--untracked-files=no"], {
      cwd: upstream,
    }),
  ]);
  if (head.output.trim() !== commit) {
    throw new Error(
      `Reference checkout differs from pinned Remocn source ${commit}`,
    );
  }
  if (status.output.trim()) {
    throw new Error("Remocn reference checkout has modified tracked files");
  }
}

async function assertDependencies() {
  const expected = JSON.parse(
    await readFile(
      resolve(root, "fixtures/remocn-latest/package.json"),
      "utf8",
    ),
  );
  const require = createRequire(resolve(upstream, "package.json"));
  for (const [name, version] of Object.entries(expected.dependencies)) {
    const installed = require(`${name}/package.json`).version;
    if (installed !== version) {
      throw new Error(
        `Reference dependency ${name} is ${installed}; expected ${version}`,
      );
    }
  }
}

export async function selectFixtures(args = process.argv.slice(2)) {
  const onlyIndex = args.indexOf("--only");
  if (onlyIndex === -1 || !args[onlyIndex + 1]) {
    throw new Error(
      "Lossless verification requires --only with explicit fixture names.",
    );
  }
  const requested = new Set(args[onlyIndex + 1].split(","));
  const fixtures = (
    await Promise.all(
      ["text", "core", "primitive"].map(async (family) =>
        JSON.parse(
          await readFile(
            resolve(root, `catalog/${family}-fixtures.json`),
            "utf8",
          ),
        ),
      ),
    )
  )
    .flat()
    .filter((entry) => requested.has(entry.slug));
  if (fixtures.length !== requested.size) {
    throw new Error(
      `Expected ${requested.size} fixtures, found ${fixtures.length}`,
    );
  }
  const commit = fixtures[0].origin.commit;
  await assertSource(commit);
  await assertDependencies();
  for (const entry of fixtures) {
    if (entry.origin.commit !== commit) {
      throw new Error(
        `${entry.slug}: reference checkout ${commit} differs from pinned source ${entry.origin.commit}`,
      );
    }
    for (const key of ["width", "height", "fps", "durationInFrames"]) {
      if (!Number.isInteger(entry.fixture[key]) || entry.fixture[key] < 1) {
        throw new Error(`${entry.slug}: invalid fixture ${key}`);
      }
    }
  }
  return fixtures;
}

async function frozenAssets() {
  const manifest = JSON.parse(
    await readFile(
      resolve(root, "assets/remocn-additions/manifest.json"),
      "utf8",
    ),
  );
  for (const asset of manifest.assets) {
    const bytes = await readFile(resolve(root, asset.path));
    if (createHash("sha256").update(bytes).digest("hex") !== asset.sha256) {
      throw new Error(`Frozen Remocn asset checksum mismatch: ${asset.path}`);
    }
  }
  return manifest;
}

export async function referenceFingerprint(entry) {
  await assertSource(entry.origin.commit);
  await assertDependencies();
  return createHash("sha256")
    .update(JSON.stringify(entry))
    .update(JSON.stringify(await frozenAssets()))
    .update(await readFile(resolve(root, "assets/fonts/Geist-Latin.woff2")))
    .update(await readFile(import.meta.filename))
    .update(
      await readFile(resolve(root, "fixtures/remocn-latest/package-lock.json")),
    )
    .update(remotionVersion)
    .update((await verificationBrowser()).version)
    .digest("hex");
}

export async function renderReferences(fixtures, { reuse = false } = {}) {
  const pending = [];
  for (const entry of fixtures) {
    const directory = resolve(workbench, "renders", entry.slug);
    const state = reuse
      ? await readFile(resolve(directory, "reference-state.json"), "utf8")
          .then(JSON.parse)
          .catch(() => null)
      : null;
    const count = await readdir(resolve(directory, "reference-frames"))
      .then((files) => files.filter((file) => file.endsWith(".png")).length)
      .catch(() => 0);
    if (
      state?.fingerprint === (await referenceFingerprint(entry)) &&
      count === entry.fixture.durationInFrames
    ) {
      continue;
    }
    pending.push(entry);
  }
  if (!pending.length) return;

  const require = createRequire(resolve(upstream, "package.json"));
  if (require("remotion/package.json").version !== remotionVersion) {
    throw new Error(`Lossless references require Remotion ${remotionVersion}`);
  }
  const { bundle } = require("@remotion/bundler");
  const { getCompositions, renderFrames } = require("@remotion/renderer");
  const { tsconfigWebpackAlias } = await import(
    pathToFileURL(resolve(upstream, "scripts/tsconfig-webpack-alias.mts")).href
  );
  const project = resolve(
    workbench,
    pending
      .map((entry) => entry.slug)
      .join("_")
      .slice(0, 100),
  );
  const publicDirectory = resolve(project, "public");
  await mkdir(publicDirectory, { recursive: true });
  await cp(resolve(upstream, "public"), publicDirectory, { recursive: true });
  await mkdir(resolve(publicDirectory, "assets/fonts"), { recursive: true });
  await cp(
    resolve(root, "assets/fonts/Geist-Latin.woff2"),
    resolve(publicDirectory, "assets/fonts/Geist-Latin.woff2"),
  );
  await cp(
    resolve(root, "assets/remocn-additions"),
    resolve(publicDirectory, "assets/remocn-additions"),
    { recursive: true },
  );

  const manifest = await frozenAssets();
  const replacements = manifest.assets
    .filter((asset) => asset.sourceUrl && asset.role !== "upstream-stylesheet")
    .map((asset) => [asset.sourceUrl, `/${asset.path}`]);
  const fontCss = [
    '@font-face { font-family:"Geist";src:url("/assets/fonts/Geist-Latin.woff2") format("woff2");font-style:normal;font-weight:100 900;font-display:block; }',
  ];
  for (const asset of manifest.assets.filter(
    (asset) => asset.role === "local-stylesheet",
  )) {
    const css = await readFile(resolve(root, asset.path), "utf8");
    fontCss.push(
      css.replace(
        /url\(["']?([^"')]+)["']?\)/g,
        (_match, path) =>
          `url("${new URL(path, `https://reference.invalid/${asset.path}`).pathname}")`,
      ),
    );
  }
  const stageImage = manifest.assets.find(
    (asset) => asset.components.includes("stage") && /\.webp$/.test(asset.path),
  );
  if (stageImage) {
    await cp(
      resolve(root, stageImage.path),
      resolve(publicDirectory, "stage-remocn-components.webp"),
    );
  }
  const loader = resolve(project, "frozen-assets.cjs");
  await writeFile(
    loader,
    `const replacements=${JSON.stringify(replacements)};module.exports=function(source){for(const [url,path] of replacements)source=source.split(url).join(path);return source;};\n`,
  );
  const imports = pending
    .map(
      (entry, index) =>
        `import {${entry.componentName} as Source${index}} from ${JSON.stringify(resolve(upstream, entry.origin.entry ?? entry.origin.source))};`,
    )
    .join("\n");
  const wrappers = pending
    .map(
      (entry, index) =>
        `function Fixture${index}(){return <FontReady><AbsoluteFill style={{background:${JSON.stringify(entry.fixture.background)},fontFamily:"Geist",["--font-geist-sans"]:"Geist"}}><Source${index} {...${JSON.stringify(entry.fixture.props)}} /></AbsoluteFill></FontReady>}`,
    )
    .join("\n");
  const compositions = pending
    .map(
      (entry, index) =>
        `<Composition id=${JSON.stringify(entry.slug)} component={Fixture${index}} width={${entry.fixture.width}} height={${entry.fixture.height}} fps={${entry.fixture.fps}} durationInFrames={${entry.fixture.durationInFrames}} />`,
    )
    .join("\n");
  const entryPoint = resolve(project, "root.tsx");
  await writeFile(
    entryPoint,
    `import React,{useEffect,useState} from "react";
import {AbsoluteFill,Composition,registerRoot,delayRender,continueRender,cancelRender} from "remotion";
${imports}
function FontReady({children}){
  const [handle]=useState(()=>delayRender("Frozen source fonts"));
  const [ready,setReady]=useState(false);
  useEffect(()=>{Promise.all(Array.from(document.fonts).map(font=>font.load())).then(()=>document.fonts.ready).then(()=>{setReady(true);continueRender(handle)}).catch(cancelRender)},[handle]);
  return ready?children:null;
}
${wrappers}
registerRoot(()=> <><style>{${JSON.stringify(fontCss.join("\n"))}}</style>${compositions}</>);
`,
  );
  const serveUrl = await bundle({
    entryPoint,
    rootDir: upstream,
    publicDir: publicDirectory,
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
            use: [loader],
          },
        ],
      },
      resolve: {
        ...config.resolve,
        modules: [
          resolve(upstream, "node_modules"),
          ...(config.resolve?.modules ?? ["node_modules"]),
        ],
        alias: [
          { name: "react", alias: require.resolve("react"), onlyModule: true },
          {
            name: "react-dom",
            alias: require.resolve("react-dom"),
            onlyModule: true,
          },
          {
            name: "react/jsx-runtime",
            alias: require.resolve("react/jsx-runtime"),
            onlyModule: true,
          },
          ...tsconfigWebpackAlias(upstream),
        ],
      },
    }),
  });
  await cp(resolve(publicDirectory, "assets"), resolve(serveUrl, "assets"), {
    recursive: true,
  });
  const browser = await verificationBrowser();
  const options = {
    serveUrl,
    browserExecutable: browser.path,
    chromeMode: "headless-shell",
    chromiumOptions: { gl: referenceGl },
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
      `${JSON.stringify({ fingerprint: await referenceFingerprint(entry), remotionVersion, referenceGl }, null, 2)}\n`,
    );
  }
}
