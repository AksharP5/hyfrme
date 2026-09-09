import { resolve } from "node:path";

export const snapcnFontFamily = (family) => `Hyfrme Snapcn ${family}`;

// Keep public font labels intact. Only the loaded faces and DOM font stacks
// change, so canvas measurements and rendered glyphs use the same binaries.
export function snapcnFontsPlugin({ fonts, dependencies, usedFonts }) {
  const react = resolve(dependencies, "react");
  const families = [...new Set(fonts.map((font) => font.family))].map(
    (family) => [family, snapcnFontFamily(family)],
  );
  const styleSource = `
const families = new Map(${JSON.stringify(families)});
function fontProps(type, props) {
  if (typeof type !== "string" || typeof props?.style?.fontFamily !== "string") return props;
  const original = props.style.fontFamily;
  const family = original.split(",").map(part => {
    const name = part.trim().replace(/^(['"])(.*)\\1$/, "$2");
    const mapped = families.get(name);
    return mapped ? JSON.stringify(mapped) : part;
  }).join(",");
  return family === original ? props : {...props, style: {...props.style, fontFamily: family}};
}
`;

  return {
    name: "snapcn-fonts",
    setup(api) {
      api.onResolve({ filter: /^@remotion\/google-fonts\// }, ({ path }) => ({
        path: path.split("/").at(-1),
        namespace: "snapcn-font",
      }));
      api.onLoad({ filter: /.*/, namespace: "snapcn-font" }, ({ path }) => {
        usedFonts.add(path);
        const font = fonts.find((candidate) => candidate.module === path);
        if (!font) throw new Error(`Missing frozen font: ${path}`);
        return {
          loader: "js",
          contents: `export const fontFamily = ${JSON.stringify(snapcnFontFamily(font.family))}; export const loadFont = () => ({fontFamily, waitUntilDone: () => Promise.resolve()});`,
        };
      });

      // esbuild applies the generator's React alias before onResolve hooks.
      api.onResolve(
        { filter: /(?:^|\/)react(?:\/jsx-runtime)?$/ },
        ({ path }) => {
          if (path === "react" || path === react) {
            return { path: "react", namespace: "snapcn-font-boundary" };
          }
          if (path === "react/jsx-runtime" || path === `${react}/jsx-runtime`) {
            return { path: "jsx-runtime", namespace: "snapcn-font-boundary" };
          }
        },
      );
      api.onLoad(
        { filter: /.*/, namespace: "snapcn-font-boundary" },
        ({ path }) => {
          if (path === "react") {
            const original = JSON.stringify(resolve(react, "index.js"));
            return {
              loader: "js",
              resolveDir: dependencies,
              contents: `
import React from ${original};
export * from ${original};
${styleSource}
export const createElement = (type, props, ...children) => React.createElement(type, fontProps(type, props), ...children);
export default {...React, createElement};
`,
            };
          }
          const original = JSON.stringify(resolve(react, "jsx-runtime.js"));
          return {
            loader: "js",
            resolveDir: dependencies,
            contents: `
import {jsx as originalJsx, jsxs as originalJsxs} from ${original};
export {Fragment} from ${original};
${styleSource}
export const jsx = (type, props, key) => originalJsx(type, fontProps(type, props), key);
export const jsxs = (type, props, key) => originalJsxs(type, fontProps(type, props), key);
`,
          };
        },
      );
    },
  };
}
