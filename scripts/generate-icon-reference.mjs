import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const upstream = resolve(root, process.env.REMOCN_SOURCE ?? ".work/remocn");
const fixtures = JSON.parse(
  await readFile(resolve(root, "catalog", "icon-fixtures.json"), "utf8"),
);

const imports = fixtures
  .map(
    (entry) =>
      `import { ${entry.componentName} } from "@/${entry.origin.source.replace(/^registry\//, "registry/").replace(/\/index\.tsx$/, "")}";`,
  )
  .join("\n");
const fixtureComponents = fixtures
  .map(
    (entry, index) => `
function Fixture${index}(props) {
  return (
    <AbsoluteFill style={{alignItems: "center", backgroundColor: "#ffffff", justifyContent: "center"}}>
      <${entry.componentName} {...props} />
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
        defaultProps={${JSON.stringify(entry.fixture.props)}}
        durationInFrames={${entry.fixture.durationInFrames}}
        fps={${entry.fixture.fps}}
        width={${entry.fixture.width}}
        height={${entry.fixture.height}}
      />`,
  )
  .join("");

const rootSource = `import {AbsoluteFill, Composition, registerRoot} from "remotion";
${imports}
${fixtureComponents}

function HyfrmeIconsRoot() {
  return (
    <>${compositions}
    </>
  );
}

registerRoot(HyfrmeIconsRoot);
`;

const rendererSource = `import {mkdirSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {bundle} from "@remotion/bundler";
import {ensureBrowser, getCompositions, renderFrames, renderMedia} from "@remotion/renderer";
import {tsconfigWebpackAlias} from "./tsconfig-webpack-alias.mts";

const here = path.dirname(fileURLToPath(import.meta.url));
const upstream = path.resolve(here, "..");
const hyfrme = path.resolve(upstream, "..", "..");
const onlyIndex = process.argv.indexOf("--only");
const only = onlyIndex === -1 ? null : new Set(process.argv[onlyIndex + 1].split(","));
const showcase = process.argv.includes("--showcase");
const frames = process.argv.includes("--frames");
const showcaseScale = 8;
const browserExecutable = process.env.HYPERFRAMES_BROWSER_PATH;

if (!browserExecutable) await ensureBrowser();
const aliases = tsconfigWebpackAlias(upstream);
const serveUrl = await bundle({
  entryPoint: path.join(upstream, "src", "remotion", "hyfrme-icons-root.tsx"),
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
let compositions = await getCompositions(serveUrl, {browserExecutable});
if (only) compositions = compositions.filter((entry) => only.has(entry.id));
if (only && compositions.length !== only.size) {
  throw new Error(\`Expected \${only.size} compositions, found \${compositions.length}\`);
}

for (const [index, composition] of compositions.entries()) {
  // A larger SVG prop preserves CSS pixel motion; render scaling magnifies it.
  const fixture = showcase ? {
    ...composition,
    width: composition.width * showcaseScale,
    height: composition.height * showcaseScale,
    props: {...composition.props, size: composition.props.size * showcaseScale},
  } : composition;
  const output = path.join(
    hyfrme,
    ".work",
    "renders",
    "icons",
    composition.id,
    showcase ? "remocn-showcase.mp4" : "remocn.mp4",
  );
  mkdirSync(path.dirname(output), {recursive: true});
  process.stdout.write(
    \`[\${index + 1}/\${compositions.length}] Remocn \${composition.id}\${showcase ? " showcase" : ""}… \`,
  );
  if (frames) {
    await renderFrames({
      serveUrl,
      composition: fixture,
      browserExecutable,
      imageFormat: "png",
      outputDir: output.replace(/\\.mp4$/, "-frames"),
      concurrency: 1,
      onStart() {},
      onFrameUpdate() {},
    });
    process.stdout.write("done\\n");
    continue;
  }
  await renderMedia({
    serveUrl,
    composition: fixture,
    browserExecutable,
    codec: "h264",
    colorSpace: "bt709",
    imageFormat: "png",
    outputLocation: output,
    overwrite: true,
    concurrency: showcase ? 2 : 4,
    timeoutInMilliseconds: showcase ? 120000 : 30000,
  });
  process.stdout.write("done\\n");
}
`;

await mkdir(resolve(upstream, "src", "remotion"), { recursive: true });
await mkdir(resolve(upstream, "scripts"), { recursive: true });
await writeFile(
  resolve(upstream, "src", "remotion", "hyfrme-icons-root.tsx"),
  rootSource,
);
await writeFile(
  resolve(upstream, "scripts", "hyfrme-render-icons.mts"),
  rendererSource,
);

console.log(
  `Generated one Remotion reference root for ${fixtures.length} icons.`,
);
