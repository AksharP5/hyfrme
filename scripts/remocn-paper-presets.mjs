import { readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sources = resolve(root, "assets/remocn-paper-shaders");
const shared = resolve(root, "assets/snapcn/paper-shaders");
const shaders = {
  "mesh-gradient": "MeshGradient",
  "grain-gradient": "GrainGradient",
  warp: "Warp",
  swirl: "Swirl",
};
const sharedExports = [
  "shader-mount",
  "shader-sizing",
  "shader-utils",
  "get-shader-color-from-string",
  "get-shader-noise-texture",
  "empty-pixel",
  "types",
];
const sharedImports = new Map([
  ["shaders/src/types.js", "shaders/src/types.ts"],
  ["shaders/src/shader-mount.js", "shaders/src/shader-mount.ts"],
  ["shaders/src/shader-sizing.js", "shaders/src/shader-sizing.ts"],
  ["shaders/src/shader-utils.js", "shaders/src/shader-utils.ts"],
  ["shaders-react/src/shader-mount.js", "shaders-react/src/shader-mount.tsx"],
  [
    "shaders-react/src/color-props-are-equal.js",
    "shaders-react/src/color-props-are-equal.ts",
  ],
]);

export const remocnPaperPresetsNotice = `/*!\n${await readFile(resolve(sources, "NOTICE.txt"), "utf8")}*/`;

export const remocnPaperPresetsPlugin = {
  name: "hyfrme-remocn-apache-paper-presets",
  setup(api) {
    api.onResolve(
      { filter: /^@paper-design\/shaders(?:-react)?$/ },
      ({ path, importer }) => {
        if (path === "@paper-design/shaders-react") {
          const name = Object.keys(shaders).find((name) =>
            importer.endsWith(`/registry/remocn/shader-${name}/index.tsx`),
          );
          if (!name)
            throw new Error(
              `Unknown Remocn Paper shader importer: ${importer}`,
            );
          return { path: name, namespace: "hyfrme-remocn-paper-react" };
        }
        const name = Object.keys(shaders).find(
          (name) =>
            importer ===
            resolve(sources, `shaders-react/src/shaders/${name}.tsx`),
        );
        return {
          path: name ?? "shared",
          namespace: "hyfrme-remocn-paper",
        };
      },
    );
    api.onLoad(
      { filter: /.*/, namespace: "hyfrme-remocn-paper-react" },
      ({ path }) => {
        const component = shaders[path];
        const source = JSON.stringify(
          resolve(sources, `shaders-react/src/shaders/${path}.tsx`),
        );
        return {
          loader: "ts",
          resolveDir: api.initialOptions.absWorkingDir ?? root,
          contents: `export { ${component} } from ${source};\nexport type { ${component}Props } from ${source};`,
        };
      },
    );
    api.onLoad(
      { filter: /.*/, namespace: "hyfrme-remocn-paper" },
      ({ path }) => ({
        loader: "ts",
        resolveDir: api.initialOptions.absWorkingDir ?? root,
        contents: [
          ...(path === "shared"
            ? []
            : [resolve(sources, `shaders/src/shaders/${path}.ts`)]),
          ...sharedExports.map((name) =>
            resolve(shared, `shaders/src/${name}.ts`),
          ),
        ]
          .map((source) => `export * from ${JSON.stringify(source)};`)
          .join("\n"),
      }),
    );
    api.onResolve({ filter: /^\.\.\// }, ({ path, importer }) => {
      if (!importer.startsWith(`${sources}/`)) return;
      const source = sharedImports.get(
        relative(sources, resolve(dirname(importer), path)),
      );
      if (source) return { path: resolve(shared, source) };
    });
    // Frozen assets must resolve the same React instance as the composition.
    api.onResolve(
      { filter: /^react(?:\/.*)?$/ },
      ({ path, importer, kind }) => {
        if (
          !importer.startsWith(`${sources}/`) &&
          !importer.startsWith(`${shared}/`)
        )
          return;
        return api.resolve(path, {
          kind,
          resolveDir: api.initialOptions.absWorkingDir ?? root,
        });
      },
    );
    api.onLoad(
      { filter: /paper-shaders\/shaders\/src\/shader-mount\.ts$/ },
      async ({ path }) => {
        if (path !== resolve(shared, "shaders/src/shader-mount.ts")) return;
        let contents = await readFile(path, "utf8");
        const replace = (pattern, replacement) => {
          if (!pattern.test(contents))
            throw new Error("Pinned Remocn Paper shader scheduler changed.");
          contents = contents.replace(pattern, replacement);
        };
        // Remocn supplies speed=0 and milliseconds from its explicit frame clock.
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
          '  private setCurrentSpeed = (newSpeed: number): void => {\n    if (newSpeed !== 0) throw new Error("Remocn shaders require an explicit frame clock.");\n    this.currentSpeed = 0;\n  };',
        );
        replace(
          /    \/\/ Cancel the rAF loop[\s\S]*?    if \(this.gl/,
          "    if (this.gl",
        );
        return {
          loader: "ts",
          resolveDir: dirname(path),
          contents: contents.replaceAll("performance.now()", "0"),
        };
      },
    );
  },
};
