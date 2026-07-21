import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const upstream = resolve(root, ".work", "remocn");
const fixtureFiles = [
  "text-fixtures.json",
  "core-fixtures.json",
  "primitive-fixtures.json",
];
const fixtures = (
  await Promise.all(
    fixtureFiles.map((file) =>
      readFile(resolve(root, "catalog", file), "utf8")
        .then(JSON.parse)
        .catch(() => []),
    ),
  )
).flat();

const imports = fixtures
  .map(
    (entry) =>
      `import { ${entry.componentName} } from "@/${entry.origin.source.replace(/^registry\//, "registry/").replace(/\/index\.tsx$/, "")}";`,
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

const rootSource = `import {loadFont} from "@remotion/google-fonts/Geist";
import {AbsoluteFill, Composition, registerRoot} from "remotion";
${imports}

const {fontFamily: GEIST} = loadFont("normal", {
  weights: ["600", "700"],
  subsets: ["latin"],
});
${fixtureComponents}

function HyfrmeTextRoot() {
  return (
    <>${compositions}
    </>
  );
}

registerRoot(HyfrmeTextRoot);
`;

const rendererSource = `import {mkdirSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {bundle} from "@remotion/bundler";
import {ensureBrowser, getCompositions, renderMedia} from "@remotion/renderer";
import {tsconfigWebpackAlias} from "./tsconfig-webpack-alias.mts";

const here = path.dirname(fileURLToPath(import.meta.url));
const upstream = path.resolve(here, "..");
const hyfrme = path.resolve(upstream, "..", "..");
const onlyIndex = process.argv.indexOf("--only");
const only = onlyIndex === -1 ? null : new Set(process.argv[onlyIndex + 1].split(","));

await ensureBrowser();
const aliases = tsconfigWebpackAlias(upstream);
const serveUrl = await bundle({
  entryPoint: path.join(upstream, "src", "remotion", "hyfrme-text-root.tsx"),
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
let compositions = await getCompositions(serveUrl);
if (only) compositions = compositions.filter((entry) => only.has(entry.id));
if (only && compositions.length !== only.size) {
  throw new Error(\`Expected \${only.size} compositions, found \${compositions.length}\`);
}

for (const [index, composition] of compositions.entries()) {
  const output = path.join(hyfrme, ".work", "renders", "text", composition.id, "remocn.mp4");
  mkdirSync(path.dirname(output), {recursive: true});
  process.stdout.write(\`[\${index + 1}/\${compositions.length}] Remocn \${composition.id}… \`);
  await renderMedia({
    serveUrl,
    composition,
    codec: "h264",
    colorSpace: "bt709",
    imageFormat: "png",
    outputLocation: output,
    overwrite: true,
    concurrency: 4,
  });
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
