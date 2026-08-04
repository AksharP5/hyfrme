import { copyFile, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const upstream = resolve(root, process.env.REMOCN_SOURCE ?? ".work/remocn");
await cp(
  resolve(root, "assets", "social"),
  resolve(upstream, "public", "assets", "social"),
  { recursive: true },
);
await mkdir(resolve(upstream, "public", "assets", "fonts"), {
  recursive: true,
});
await copyFile(
  resolve(root, "assets", "fonts", "Geist-Latin.woff2"),
  resolve(upstream, "public", "assets", "fonts", "Geist-Latin.woff2"),
);
const fixtureFiles = [
  "text-fixtures.json",
  "core-fixtures.json",
  "primitive-fixtures.json",
];
const allFixtures = (
  await Promise.all(
    fixtureFiles.map((file) =>
      readFile(resolve(root, "catalog", file), "utf8")
        .then(JSON.parse)
        .catch(() => []),
    ),
  )
).flat();
const onlyIndex = process.argv.indexOf("--only");
const requested =
  onlyIndex === -1 ? null : new Set(process.argv[onlyIndex + 1].split(","));
const fixtures = requested
  ? allFixtures.filter((entry) => requested.has(entry.slug))
  : allFixtures;
const canvasNames = new Set([
  "displacement",
  "ember-burn",
  "glitch-cut",
  "grid-wave",
  "particle-dissolve",
  "ascii-render",
  "camera-lens",
  "crt-screen",
  "halftone-print",
  "hologram",
  "pixelate-region",
  "security-cam",
  "sustained-glitch",
  "tv-power-off",
  "underwater-ripple",
  "vhs-filter",
]);
const requiresHtmlInCanvas = fixtures.some((entry) =>
  canvasNames.has(entry.slug),
);
if (requested && fixtures.length !== requested.size) {
  throw new Error(
    `Expected ${requested.size} fixtures, found ${fixtures.length}`,
  );
}

const imports = fixtures
  .map(
    (entry) =>
      `import { ${entry.componentName} } from "@/${(entry.origin.entry ?? entry.origin.source).replace(/^registry\//, "registry/").replace(/\/index\.tsx$/, "")}";`,
  )
  .join("\n");
const fixtureComponents = fixtures
  .map(
    (entry, index) => `
function Fixture${index}() {
  return (
    <AbsoluteFill
      style={{
        background: ${JSON.stringify(entry.fixture.background)},
        ["--font-geist-sans" as string]: GEIST,
        fontFamily: GEIST,
      }}
    >
      <${entry.componentName} {...${JSON.stringify(entry.fixture.props)}} />
    </AbsoluteFill>
  );
}`,
  )
  .join("\n");
const compositions = fixtures
  .map(
    (entry, index) => `
      <Composition
        id=${JSON.stringify(entry.slug)}
        component={Fixture${index}}
        durationInFrames={${entry.fixture.durationInFrames}}
        fps={${entry.fixture.fps}}
        width={${entry.fixture.width}}
        height={${entry.fixture.height}}
      />`,
  )
  .join("");

const rootSource = `import {AbsoluteFill, Composition, isHtmlInCanvasSupported, registerRoot, staticFile} from "remotion";
${imports}

const GEIST = "Geist";
${fixtureComponents}

function HyfrmeTextRoot() {
  if (${requiresHtmlInCanvas} && !isHtmlInCanvasSupported()) {
    throw new Error("The Remocn reference browser does not support HTML-in-canvas");
  }
  return (
    <>
      <style>{'@font-face { font-family: "Geist"; src: url("' + staticFile("assets/fonts/Geist-Latin.woff2") + '") format("woff2"); font-style: normal; font-weight: 100 900; font-display: block; }'}</style>
      ${compositions}
    </>
  );
}

registerRoot(HyfrmeTextRoot);
`;

const rendererSource = `import {cpSync, mkdirSync, rmSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {bundle} from "@remotion/bundler";
import {ensureBrowser, getCompositions, renderFrames, renderMedia} from "@remotion/renderer";
import {tsconfigWebpackAlias} from "./tsconfig-webpack-alias.mts";

const here = path.dirname(fileURLToPath(import.meta.url));
const upstream = path.resolve(here, "..");
const hyfrme = ${JSON.stringify(root)};
const onlyIndex = process.argv.indexOf("--only");
const only = onlyIndex === -1 ? null : new Set(process.argv[onlyIndex + 1].split(","));
const browserExecutable = process.env.HYFRME_BROWSER_EXECUTABLE;
const losslessFrameNames = new Set(["security-cam", "vhs-filter"]);

if (!browserExecutable) await ensureBrowser({chromeMode: "headless-shell"});
const aliases = tsconfigWebpackAlias(upstream);
const serveUrl = await bundle({
  entryPoint: path.join(upstream, "src", "remotion", "hyfrme-text-root.tsx"),
  publicDir: path.join(upstream, "public"),
  webpackOverride: (config) => ({
    ...config,
    resolve: {
      ...config.resolve,
      alias: [
        ...Object.entries(config.resolve?.alias ?? {}).map(([name, alias]) => ({
          name: name.replace(/\\$$/, ""),
          alias: alias as string,
          onlyModule: name.endsWith("$"),
        })),
        ...aliases,
      ],
    },
  }),
});
cpSync(path.join(upstream, "public", "assets"), path.join(serveUrl, "assets"), {
  recursive: true,
});
let compositions = await getCompositions(serveUrl, {
  browserExecutable,
  chromeMode: "headless-shell",
  chromiumOptions: {gl: "swangle"},
  timeoutInMilliseconds: 120000,
  onBrowserLog: (log) => console.log("[Remocn browser] " + log.text),
});
if (only) compositions = compositions.filter((entry) => only.has(entry.id));
if (only && compositions.length !== only.size) {
  throw new Error(\`Expected \${only.size} compositions, found \${compositions.length}\`);
}

for (const [index, composition] of compositions.entries()) {
  const output = path.join(hyfrme, ".work", "renders", "text", composition.id, "remocn.mp4");
  mkdirSync(path.dirname(output), {recursive: true});
  process.stdout.write(\`[\${index + 1}/\${compositions.length}] Remocn \${composition.id}… \`);
  await renderMedia({
    browserExecutable,
    serveUrl,
    composition,
    codec: "h264",
    colorSpace: "bt709",
    imageFormat: "png",
    outputLocation: output,
    overwrite: true,
    concurrency: 1,
    chromeMode: "headless-shell",
    chromiumOptions: {gl: "swangle"},
    timeoutInMilliseconds: 120000,
  });
  if (losslessFrameNames.has(composition.id)) {
    const outputDir = path.join(hyfrme, ".work", "renders", "text", composition.id, "remocn-frames");
    rmSync(outputDir, {recursive: true, force: true});
    await renderFrames({
      serveUrl,
      composition,
      inputProps: {},
      imageFormat: "png",
      outputDir,
      concurrency: 1,
      chromeMode: "headless-shell",
      chromiumOptions: {gl: "swangle"},
      browserExecutable,
      timeoutInMilliseconds: 120000,
      onStart: () => {},
      onFrameUpdate: () => {},
    });
  }
  process.stdout.write("done\\n");
}
`;

await mkdir(resolve(upstream, "src", "remotion"), { recursive: true });
await mkdir(resolve(upstream, "scripts"), { recursive: true });
await writeFile(
  resolve(upstream, "src", "remotion", "hyfrme-text-root.tsx"),
  rootSource,
);
await writeFile(
  resolve(upstream, "scripts", "hyfrme-render-text.mts"),
  rendererSource,
);

console.log(
  `Generated one Remotion reference root for ${fixtures.length} compiled ports.`,
);
