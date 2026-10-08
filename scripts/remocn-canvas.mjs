export const canvasTransitionNames = new Set([
  "displacement",
  "ember-burn",
  "glitch-cut",
  "grid-wave",
  "particle-dissolve",
]);

export const canvasFilterNames = new Set([
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

export const sourcePreviewNames = new Set([
  ...canvasTransitionNames,
  ...canvasFilterNames,
  "infinite-marquee",
  "perspective-marquee",
  "switch",
  "command-menu",
  "onboarding-stepper-flow",
  "context-menu",
]);

export const sourcePreviewCss = `
#hyfrme-source-root {
  font-size: 14px;
  line-height: calc(20 / 14);
  font-feature-settings: "cv11", "ss01";
  font-synthesis: none;
  -webkit-font-smoothing: antialiased;
}
#hyfrme-source-root, #hyfrme-source-root * {
  text-rendering: optimizeLegibility;
}`;
