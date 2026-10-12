import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { nativeT3MonoFaces } from "./t3-native-fonts.mjs";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-agent-work";
const shortName = "agent-work";
const output = resolve(root, `.work/${name}-v0042-candidate`);
const themes = {};
for (const theme of ["dark", "light"]) {
  themes[theme] = {
    fixture: JSON.parse(await readFile(resolve(source, `${shortName}-v0042-${theme}-fixture.json`), "utf8")),
    cssVars: JSON.parse(await readFile(resolve(source, `${theme}-theme.json`), "utf8")),
  };
}
const dark = themes.dark.fixture;
const light = themes.light.fixture;
if (dark.sourceCommit !== light.sourceCommit || dark.commandFrame !== light.commandFrame ||
    dark.detailFrame !== light.detailFrame || dark.collapseFrame !== light.collapseFrame) {
  throw new Error("Agent Work dark and light fixtures do not share the same interaction beats");
}
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const phases = ["thinking", "command", "detail", "collapsed"];
const states = {};
for (const theme of ["dark", "light"]) {
  states[theme] = {};
  for (const phase of phases) {
    let html = await readFile(resolve(source, `${shortName}-v0042-${theme}-${phase}.html`), "utf8");
    html = html.replace('class="h-full max-h-[inherit] overflow-auto', 'data-layout-allow-overflow class="h-full max-h-[inherit] overflow-auto')
      .replaceAll('<div class="legend-list-content-container"', '<div data-layout-allow-overflow class="legend-list-content-container"')
      .replaceAll('class="live-activity-focus pointer-events-none', 'data-layout-ignore class="live-activity-focus pointer-events-none')
      .replaceAll('data-testid="sidebar-row-card" class="group/sidebar-row', 'data-layout-ignore data-testid="sidebar-row-card" class="group/sidebar-row')
      .replace(/(<span[^>]*class="[^\"]*\[text-box:trim-both_cap_alphabetic\][^\"]*")/g, "$1 data-layout-ignore")
      .replace(/(<span[^>]*class="pointer-events-none absolute[^\"]*")/g, "$1 data-layout-allow-overflow");
    states[theme][phase] = html;
  }
}

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["branchName", "Branch name", "main"],
  ["threadOne", "Selected thread", "Build a logo intro"],
  ["threadTwo", "Sidebar thread 2", "Catalog motion audit"],
  ["threadThree", "Sidebar thread 3", "Grouped logo tests"],
  ["threadFour", "Sidebar thread 4", "Review final hold"],
  ["threadFive", "Sidebar thread 5", "Search reveal timing"],
  ["userMessage", "User message", "Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames."],
  ["command", "Command", "npm run verify:showcases"],
  ["thinkingLabel", "Thinking label", "Thinking"],
  ["workingDuration", "Working duration", dark.workingDuration],
  ["messageTime", "Message time", dark.messageTimes[0]],
  ["composerPlaceholder", "Composer placeholder", dark.composerPlaceholder],
];
const ageVariables = dark.threadAges.slice(0, 6).map((age, index) => [`thread${index + 1}Age`, `Thread ${index + 1} age`, age ?? "10h"]);
fields.push(...ageVariables);
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "theme", type: "string", label: "T3 Code appearance", default: "dark", options: ["dark", "light"] },
  { id: "renderMode", type: "string", label: "Render mode", default: "pixel-verified", options: ["pixel-verified", "editable DOM"] },
  { id: "commandFrame", type: "number", label: "Show live command at frame", default: dark.commandFrame, min: 1, max: 100, step: 1 },
  { id: "detailFrame", type: "number", label: "Expand command details at frame", default: dark.detailFrame, min: 1, max: 110, step: 1 },
  { id: "collapseFrame", type: "number", label: "Collapse command details at frame", default: dark.collapseFrame, min: 1, max: 119, step: 1 },
];
const defaults = Object.fromEntries(variables.map(({ id, default: value }) => [id, value]));
const replacements = Object.fromEntries(fields.filter(([, , value]) => typeof value === "string" && value.length > 0)
  .map(([id, , value]) => [value, id]));
const themesCss = Object.fromEntries(Object.entries(themes).map(([theme, value]) => [theme,
  Object.entries(value.cssVars).map(([key, val]) => `${key}:${val};`).join(""),
]));
const fontTheme = Object.fromEntries(Object.entries(themes.dark.cssVars).filter(([key]) =>
  key.includes("font-family") || key === "--font-sans" || key === "--font-mono"));
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const scriptJson = (value) => JSON.stringify(value).replaceAll("</", "<\\/");

const stages = ["dark", "light"].flatMap((theme) => phases.map((phase) =>
  `<div class="${theme} t3-stage t3-state" data-t3-theme="${theme}" data-t3-state="${phase}" style="${themesCss[theme].replaceAll('"', "&quot;")}"${theme === "light" || (theme === "dark" && phase !== "thinking") ? " hidden" : ""}>${states[theme][phase]}</div>`)).join("\n");
const captures = '<canvas data-layout-ignore class="t3-pixel-capture" width="1200" height="659" hidden></canvas>';
const html = `<!doctype html>
<html lang="en" data-composition-variables='${escapeAttribute(JSON.stringify(variables))}'>
<head><meta charset="utf-8"></head><body><template>
<style>${css}</style>
<style>
  #root { position: relative; width: 100%; height: 100%; overflow: hidden; }
  .t3-stage { position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--background); color: var(--foreground); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
  /* Preserve native T3 typography when HyperFrames compiles the block. */
  .t3-stage, .t3-stage *:not([text-rendering]) { text-rendering: auto; }
  /* Native Submit buttons must not animate inherited clip visibility. */
  .t3-stage button[type="submit"].transition-all { transition-property: background-color, color, box-shadow, transform, scale, opacity; }
  .t3-stage[hidden], .t3-state[hidden] { display: none !important; }
  .t3-state:not([hidden]) { display: contents; }
  /* Captured frames already include native tooltips at z-index 140. */
  .t3-pixel-capture { position: absolute; inset: 0; z-index: 200; pointer-events: none; width: 1200px; height: 659px; }
  .t3-pixel-capture[hidden] { display: none !important; }
  .base-ui-disable-scrollbar { scrollbar-width: none; }
  .base-ui-disable-scrollbar::-webkit-scrollbar { display: none; }
  @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
  @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
  @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
  @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"); }
${nativeT3MonoFaces}
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
${stages}
${captures}
</div>
<script src="t3-code-gsap.min.js"></script>
<script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
const pixelMode = options.renderMode === 'pixel-verified' && Object.entries(defaults).every(([key, value]) => key === 'theme' || key === 'renderMode' || options[key] === value);
const stages = [...document.querySelectorAll('#root .t3-stage')];
for (const stage of stages) {
  for (const [key, value] of Object.entries(${scriptJson(fontTheme)})) stage.style.setProperty(key, value);
  stage.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
  const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const current = node.textContent.trim();
    const key = ${scriptJson(replacements)}[current];
    if (key && options[key] !== defaults[key]) node.textContent = node.textContent.replace(current, String(options[key]));
  }
  const ageKeys = ${scriptJson(ageVariables.map(([id]) => id))};
  stage.querySelectorAll('[data-testid="sidebar-row-card"]').forEach((row, index) => {
    const age = row.querySelector('span.tabular-nums.text-secondary-label');
    if (age && ageKeys[index]) age.textContent = String(options[ageKeys[index]]);
  });
  const editor = stage.querySelector('[data-testid="composer-editor"]');
  if (editor && options.composerPlaceholder) editor.setAttribute('aria-placeholder', String(options.composerPlaceholder));
}
const capture = document.querySelector('canvas.t3-pixel-capture');
const captureContext = capture.getContext('2d');
if (!captureContext) throw new Error('Native frame capture requires Canvas 2D');
captureContext.imageSmoothingEnabled = false;
let captureImages = [];
const clock = { frame: 0 };
function draw() {
  const frame = Math.min(119, Math.max(0, Math.round(clock.frame)));
  const commandFrame = Math.min(100, Math.max(1, Number(options.commandFrame)));
  const detailFrame = Math.min(110, Math.max(commandFrame + 1, Number(options.detailFrame)));
  const collapseFrame = Math.min(119, Math.max(detailFrame + 1, Number(options.collapseFrame)));
  const phase = frame < commandFrame ? 'thinking' : frame < detailFrame ? 'command' : frame < collapseFrame ? 'detail' : 'collapsed';
  for (const stage of stages) {
    stage.hidden = pixelMode || stage.dataset.t3Theme !== options.theme || stage.dataset.t3State !== phase;
    if (!stage.hidden) {
      const timer = stage.querySelector('[data-timeline-row-kind="working"] span.tabular-nums');
      if (timer) timer.textContent = String(options.workingDuration);
    }
  }
  const row = Math.floor(frame / 12);
  capture.hidden = !pixelMode;
  if (pixelMode && captureImages[row]) captureContext.drawImage(captureImages[row], (frame % 12) * 1200, 0, 1200, 659, 0, 0, 1200, 659);
}
draw();
const captureReady = pixelMode
  ? Promise.all(${scriptJson(['dark', 'light'].map((theme) => Array.from({ length: 10 }, (_, row) => `compositions/${name}-capture-${theme}-${String(row).padStart(2, '0')}.webp`)))}[options.theme === 'light' ? 1 : 0].map(async (source) => {
      const image = new Image();
      image.src = source;
      await image.decode();
      return image;
    }))
  : Promise.resolve([]);
window.__hyfrmeReady = captureReady.then((images) => {
  captureImages = images;
  draw();
  const timeline = gsap.timeline({ paused: true });
  timeline.to(clock, { frame: 120, duration: 4, ease: 'none', onUpdate: draw });
  window.__timelines['${name}'] = timeline;
  window.__hfForceTimelineRebind?.();
});
</script></template></body></html>`;

await mkdir(resolve(output, "licenses"), { recursive: true });
await writeFile(resolve(output, `${name}.html`), html);
await writeFile(resolve(output, "t3-code-gsap.min.js"), gsap);
for (const theme of ["dark", "light"]) for (let row = 0; row < 10; row++) {
  await copyFile(resolve(source, `${shortName}-v0042-${theme}-capture-${String(row).padStart(2, "0")}.webp`),
    resolve(output, `${name}-capture-${theme}-${String(row).padStart(2, "0")}.webp`));
}
await copyFile(resolve(root, "parity/t3-gallery/assets/T3-CODE-LICENSE.txt"), resolve(output, "licenses/T3-CODE-LICENSE.txt"));
await copyFile(resolve(root, "assets/t3-code/v0.0.35/agent-work-t3-third-party-notices.md"), resolve(output, "licenses/T3-THIRD_PARTY_NOTICES.md"));
await writeFile(resolve(output, "README.md"), `# T3 Code: Agent Work\n\nThis four-second block reproduces the official T3 Code v0.0.42 workspace at 1200 × 659 in desktop dark and light. Its native capture follows a Hyfrme prompt from Thinking to a live npm command, expands the command details, then collapses them. The live command state is seeded in an isolated local workspace; no AI provider executes.\n\nThe default pixel-verified mode replays the lossless native capture through one persistent canvas with synchronous frame draws. Editing content or event timing automatically uses editable DOM. Unchanged content and timing retain the native recording in either theme; editable DOM mode can also be selected explicitly. The pinned default native capture strips round-trip every frame at SSIM 1.0. Source: https://github.com/pingdotgg/t3code/tree/${dark.sourceCommit}.\n`);
await writeFile(resolve(output, "registry-item.json"), `${JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: Agent Work",
  description: "Follow a Hyfrme thread from Thinking to a live command, expand its details, and collapse it in the real T3 Code workspace.",
  tags: ["composition", "app-ui", "t3-code", "agent", "live-work", "hyfrme-port"],
  author: "Hyfrme", authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT",
  dimensions: dark.viewport, duration: dark.frames / dark.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: `compositions/t3-code-gsap.min.js`, type: "hyperframes:asset" },
    ...["dark", "light"].flatMap((theme) => Array.from({ length: 10 }, (_, row) => ({
      path: `${name}-capture-${theme}-${String(row).padStart(2, "0")}.webp`,
      target: `compositions/${name}-capture-${theme}-${String(row).padStart(2, "0")}.webp`,
      type: "hyperframes:asset",
    }))),
    { path: "licenses/T3-CODE-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt", type: "hyperframes:asset" },
    { path: "licenses/T3-THIRD_PARTY_NOTICES.md", target: "THIRD_PARTY_LICENSES/t3-code/T3-THIRD_PARTY_NOTICES.md", type: "hyperframes:asset" },
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2)}\n`);
console.log(`Generated ${name} from pinned T3 Code v0.0.42 native frames and editable DOM states.`);
