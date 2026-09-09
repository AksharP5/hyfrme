export const snapcnSvgComponents = [
  "count-grid",
  "phone-frame",
  "announce-title",
  "punch-lines",
];

// Scope source SVG references to the installed scene without changing their geometry.
export function scopeSnapcnSvgIds(source, component) {
  if (!snapcnSvgComponents.includes(component)) return source;

  function replace(expected, replacement, count = 1) {
    const actual = source.split(expected).length - 1;
    if (actual !== count) {
      throw new Error(
        `${component}: expected ${count} SVG source matches for ${expected}, found ${actual}`,
      );
    }
    source = source.replaceAll(expected, replacement);
  }

  if (component === "count-grid") {
    for (const id of ["count-grid-smear", "count-grid-late"]) {
      replace(`id="${id}"`, `id={__instanceId("${id}")}`);
      replace(`"url(#${id})"`, '`url(#${__instanceId("' + id + '")})`');
    }
  }
  if (component === "phone-frame") {
    for (const id of ["pf-elev", "pf-glow"]) {
      replace(`id="${id}"`, `id={__instanceId("${id}")}`);
    }
    replace(
      'fill="url(#pf-elev)"',
      'fill={`url(#${__instanceId("pf-elev")})`}',
    );
    replace(
      'filter="url(#pf-glow)"',
      'filter={`url(#${__instanceId("pf-glow")})`}',
      2,
    );
  }
  if (component === "announce-title") {
    for (const id of ["announce-title-macro-symbol", "announce-title-symbol"]) {
      replace(`id="${id}"`, `id={__instanceId("${id}")}`);
    }
  }
  if (component === "punch-lines") {
    replace(
      "const blurId = `punch-lines-${beatIndex}-${li}`;",
      "const blurId = __instanceId(`punch-lines-${beatIndex}-${li}`);",
    );
  }
  replace(
    '"use client";',
    '"use client";\nimport { __instanceId } from "remotion";',
  );
  return source;
}
