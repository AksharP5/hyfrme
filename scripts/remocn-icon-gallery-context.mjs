import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export const galleryStates = ["hover", "focus"];
export const galleryThemes = ["light", "dark"];
const digest = (source) => createHash("sha256").update(source).digest("hex");

export async function iconGalleryAuthority(upstream, entry) {
  const galleryPath = "components/docs/icons-gallery.tsx";
  const cssPath = "app/globals.css";
  const registryPath = "registry/__index__.tsx";
  const previewsPath = "registry/__manifest__.ts";
  const [gallery, css, source, registry, previews] = await Promise.all([
    readFile(resolve(upstream, galleryPath), "utf8"),
    readFile(resolve(upstream, cssPath), "utf8"),
    readFile(resolve(upstream, entry.origin.source), "utf8"),
    readFile(resolve(upstream, registryPath), "utf8"),
    readFile(resolve(upstream, previewsPath), "utf8"),
  ]);
  assert(entry.origin.source.startsWith("registry/remocn-icons/"));
  const number = (name) => {
    const value = gallery.match(new RegExp(`const ${name} = (\\d+);`))?.[1];
    assert(value, `Missing authored gallery ${name}`);
    return Number(value);
  };
  const canvas = number("COMPOSITION_SIZE");
  const glyph = number("GLYPH_SIZE");
  assert.equal(canvas, 80);
  assert.equal(number("MEDIA_SIZE"), canvas);
  assert.equal(glyph, 48);
  assert(gallery.includes("<Icon size={GLYPH_SIZE} />"));
  assert(gallery.includes("<Static size={GLYPH_SIZE} strokeWidth={2} />"));
  assert(gallery.includes("active && !reducedMotion"));
  assert(gallery.includes("hover:text-foreground"));
  assert(gallery.includes("p-3 text-muted-foreground"));
  const staticExport = gallery.match(
    new RegExp(`name: "${entry.slug}"[^}]+Static: (\\w+)`),
  )?.[1];
  assert(staticExport && source.includes(`export function ${staticExport}`));
  assert(
    source.includes('color = "currentColor"'),
    "Authored source color default changed",
  );
  const registryEntry = registry.match(
    new RegExp(`"${entry.slug}": \\{([\\s\\S]+?)loadConfig:`),
  )?.[1];
  assert(
    registryEntry?.includes(`default: m.${entry.componentName},`),
    "Gallery loads a different source export",
  );
  const preview = previews.match(
    new RegExp(`"${entry.slug}": \\{([\\s\\S]+?)defaults:`),
  )?.[1];
  for (const key of ["fps", "durationInFrames"]) {
    assert.equal(
      Number(preview?.match(new RegExp(`${key}: (\\d+)`))?.[1]),
      entry.fixture[key],
      `Gallery source ${key} differs from canonical fixture`,
    );
  }
  const light = css.slice(css.indexOf(":root {"), css.indexOf(".dark {"));
  const dark = css.slice(css.indexOf(".dark {"));
  const colors = (section) =>
    Object.fromEntries(
      ["background", "card", "foreground", "muted-foreground"].map((name) => {
        const value = section.match(new RegExp(`--${name}: ([^;]+);`))?.[1];
        assert(value, `Missing source theme ${name}`);
        return [name, value];
      }),
    );
  const tile = css.match(
    /\.surface-card\s*\{[^}]*background-color:\s*([^;]+);/,
  )?.[1];
  assert.equal(tile, "color-mix(in oklab, var(--color-card) 92%, transparent)");
  return {
    canvas,
    glyph,
    staticExport,
    animatedProps: { size: glyph },
    staticProps: { size: glyph, strokeWidth: 2 },
    omittedAnimatedProps: [
      "animation",
      "loop",
      "speed",
      "color",
      "strokeWidth",
    ],
    playerLoop: true,
    themes: { light: colors(light), dark: colors(dark) },
    tile,
    sourceHashes: {
      [galleryPath]: digest(gallery),
      [cssPath]: digest(css),
      [entry.origin.source]: digest(source),
      [registryPath]: digest(registry),
      [previewsPath]: digest(previews),
    },
    scope:
      "80px gallery media crop, 48px glyph; animated hover/focus versus installed source. Native Static posters cover idle/reduced-motion; no installed Static export is claimed.",
  };
}

export function galleryContext(authority, theme, state) {
  assert(galleryThemes.includes(theme), "Unknown source gallery theme");
  assert(galleryStates.includes(state), "Unknown source gallery state");
  const colors = authority.themes[theme];
  return {
    theme,
    state,
    canvas: authority.canvas,
    glyph: authority.glyph,
    colors,
    color: state === "hover" ? colors.foreground : colors["muted-foreground"],
    tile: authority.tile,
  };
}

export function galleryNativeRoot(entry, authority, context, sourcePath) {
  const style = {
    background: context.colors.background,
    color: context.color,
    "--color-card": context.colors.card,
  };
  const posterStyle = { ...style, color: context.colors["muted-foreground"] };
  return `import React from "react";
import {AbsoluteFill,Composition,registerRoot} from "remotion";
import {${entry.componentName} as Animated,${authority.staticExport} as Static} from ${JSON.stringify(sourcePath)};
const tile={background:${JSON.stringify(context.tile)},alignItems:"center",justifyContent:"center"};
function AnimatedFixture(){return <AbsoluteFill style={${JSON.stringify(style)}}><AbsoluteFill style={tile}><Animated size={${authority.glyph}}/></AbsoluteFill></AbsoluteFill>}
function IdleFixture(){return <AbsoluteFill style={${JSON.stringify(posterStyle)}}><AbsoluteFill style={tile}><Static size={${authority.glyph}} strokeWidth={2}/></AbsoluteFill></AbsoluteFill>}
function ReducedMotionFixture(){return <AbsoluteFill style={${JSON.stringify(style)}}><AbsoluteFill style={tile}><Static size={${authority.glyph}} strokeWidth={2}/></AbsoluteFill></AbsoluteFill>}
registerRoot(()=> <><Composition id=${JSON.stringify(entry.slug)} component={AnimatedFixture} width={${authority.canvas}} height={${authority.canvas}} fps={${entry.fixture.fps}} durationInFrames={${entry.fixture.durationInFrames}}/><Composition id=${JSON.stringify(`${entry.slug}-static-idle`)} component={IdleFixture} width={${authority.canvas}} height={${authority.canvas}} fps={${entry.fixture.fps}} durationInFrames={1}/><Composition id=${JSON.stringify(`${entry.slug}-static-reduced-motion`)} component={ReducedMotionFixture} width={${authority.canvas}} height={${authority.canvas}} fps={${entry.fixture.fps}} durationInFrames={1}/></>);
`;
}

export async function wrapInstalledIconGallery(path, entry, context) {
  const original = await readFile(path, "utf8");
  const variables = original.match(/data-composition-variables='([^']+)'/);
  assert(variables, "Installed icon variables are missing");
  const schema = JSON.parse(variables[1]);
  assert.equal(schema.find((variable) => variable.id === "size")?.default, 48);
  const color = schema.find((variable) => variable.id === "color");
  assert(color, "Installed icon color control is missing");
  color.default = "currentColor";
  const css = `<style data-authored-icon-gallery-context>
html,body{width:${context.canvas}px!important;height:${context.canvas}px!important;background:${context.colors.background}!important;color:${context.color}!important;--color-card:${context.colors.card}}
[id$="hyfrme-icon-stage"]{width:${context.canvas}px;height:${context.canvas}px;color:inherit!important;background:${context.tile};align-items:center;justify-content:center}
[id$="hyfrme-icon-root"]{width:${context.glyph}px!important;height:${context.glyph}px!important}
</style>`;
  assert(
    original.includes('data-width="48" data-height="48"'),
    "Installed canonical icon geometry changed",
  );
  const adapted = original
    .replace(
      variables[0],
      `data-composition-variables='${JSON.stringify(schema)}'`,
    )
    .replaceAll(
      'data-width="48" data-height="48"',
      `data-width="${context.canvas}" data-height="${context.canvas}"`,
    )
    .replace("</head>", `${css}</head>`);
  assert.notEqual(adapted, original);
  await writeFile(path, adapted);
  return {
    canonicalInstalledSha256: digest(original),
    galleryInstalledSha256: digest(adapted),
    adapted: [
      "composition canvas 80px",
      "inherited source currentColor",
      "authored page/tile/theme CSS",
    ],
    sourceAnimationControls: entry.fixture.props,
    sourceAnimationCodeChanged: false,
  };
}

export function galleryProjectHtml(entry, context) {
  const duration = entry.fixture.durationInFrames / entry.fixture.fps;
  return `<!doctype html><html><head><meta charset="UTF-8"><script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script><style>html,body{margin:0;width:${context.canvas}px;height:${context.canvas}px;overflow:hidden;background:${context.colors.background};color:${context.color};--color-card:${context.colors.card}}#root,#scene{position:absolute;inset:0}</style></head><body><div id="root" data-composition-id="gallery-${entry.slug}" data-no-timeline data-start="0" data-duration="${duration}" data-width="${context.canvas}" data-height="${context.canvas}" data-fps="${entry.fixture.fps}"><div id="scene" class="clip" data-composition-id="${entry.slug}" data-composition-src="compositions/${entry.slug}.html" data-start="0" data-duration="${duration}" data-track-index="1" data-width="${context.canvas}" data-height="${context.canvas}"></div></div></body></html>\n`;
}
