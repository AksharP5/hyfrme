import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { nativeT3MonoFaces } from "./t3-native-fonts.mjs";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-message-rewind";
const shortName = "message-rewind";
const output = resolve(root, `.work/${name}-v0042-candidate`);
const themes = {};
for (const theme of ["dark", "light"]) themes[theme] = {
  fixture: JSON.parse(await readFile(resolve(source, `${shortName}-v0042-${theme}-fixture.json`), "utf8")),
  cssVars: JSON.parse(await readFile(resolve(source, `${theme}-theme.json`), "utf8")),
};
const dark = themes.dark.fixture;
const light = themes.light.fixture;
for (const [theme, { fixture }] of Object.entries(themes)) {
  const imageCount = Object.keys(fixture.captureSpriteSha256).length;
  if (fixture.captureSpriteFrameCount !== 120 || fixture.captureFrameImageIndices?.length !== 120 ||
      imageCount !== (theme === "dark" ? 10 : 11) ||
      fixture.captureFrameImageIndices.some((index) => !Number.isInteger(index) || index < 0 || index >= imageCount))
    throw new Error(`${theme} native PNG frame mapping is incomplete`);
  for (const [suffix, expected] of Object.entries(fixture.captureSpriteSha256)) {
    const bytes = await readFile(resolve(source, `${shortName}-v0042-${theme}-frame-${suffix}.png`));
    if (createHash("sha256").update(bytes).digest("hex") !== expected) throw new Error(`${theme} native frame ${suffix} changed`);
  }
}
const phases = dark.phases;
if (JSON.stringify(phases) !== JSON.stringify(light.phases) || JSON.stringify(dark.events) !== JSON.stringify(light.events)) {
  throw new Error("Message Rewind dark and light captures have different states or timing");
}
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const stateHtml = {};
for (const theme of ["dark", "light"]) {
  stateHtml[theme] = {};
  for (const phase of phases) {
    const root = (await readFile(resolve(source, `${shortName}-v0042-${theme}-${phase}.html`), "utf8"))
      .replace(/(<span[^>]*class="[^\"]*\[text-box:trim-both_cap_alphabetic\][^\"]*")/g, "$1 data-layout-ignore");
    const portal = (await readFile(resolve(source, `${shortName}-v0042-${theme}-${phase}-portal.html`), "utf8"))
      .replace(/(<span[^>]*class="[^\"]*\[text-box:trim-both_cap_alphabetic\][^\"]*")/g, "$1 data-layout-ignore")
      .replace(/(<div[^>]*data-slot="alert-dialog-(?:backdrop|viewport|popup)")/g, "$1 data-layout-ignore")
      .replaceAll('<div class="overflow-auto', '<div data-layout-allow-overflow class="overflow-auto')
      .replaceAll('<div class="overflow-y-auto', '<div data-layout-allow-overflow class="overflow-y-auto');
    stateHtml[theme][phase] = root + portal;
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
  ["userMessage", "User prompt", "Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames."],
  ["replyLead", "Answer opening", "I found the Logo Enter timing in"],
  ["replyPath", "Answer file path", "registry/blocks/logo-enter/logo-enter.html"],
  ["replyTail", "Answer closing", ". The final pass can extend the duration while keeping the last rendered frame still."],
  ["editAction", "Message action label", "Edit from here"],
  ["dialogTitle", "Dialog title", "Edit from here?"],
  ["dialogDescription", "Dialog description", "Rewind chat to before this message. Your prompt and attachments return to the composer."],
  ["cancelLabel", "Cancel action", "Cancel"],
  ["revertFilesLabel", "Revert files action", "Revert files too"],
  ["keepChangesLabel", "Keep file changes action", "Revert and keep changes"],
  ["composerPlaceholder", "Composer placeholder", "Enable a provider in Settings to send a message"],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "theme", type: "string", label: "T3 Code appearance", default: "dark", options: ["dark", "light"] },
  { id: "renderMode", type: "string", label: "Render mode", default: "pixel-verified", options: ["pixel-verified", "editable DOM"] },
  { id: "hoverFrame", type: "number", label: "Reveal message controls at frame", default: dark.events.hover, min: 0, max: 114, step: 1 },
  { id: "tooltipFrame", type: "number", label: "Show edit tooltip at frame", default: dark.events.tooltip, min: 1, max: 115, step: 1 },
  { id: "confirmFrame", type: "number", label: "Open checkpoint dialog at frame", default: dark.events.confirm, min: 2, max: 116, step: 1 },
  { id: "cancelFrame", type: "number", label: "Cancel checkpoint dialog at frame", default: dark.events.cancel, min: 3, max: 119, step: 1 },
];
const defaults = Object.fromEntries(variables.map(({ id, default: value }) => [id, value]));
const replacements = Object.fromEntries(fields.map(([id, , value]) => [value, id]));
const themesCss = Object.fromEntries(Object.entries(themes).map(([theme, data]) => [theme,
  Object.entries(data.cssVars).map(([key, value]) => `${key}:${value};`).join("")
]));
const fontTheme = Object.fromEntries(Object.entries(themes.dark.cssVars).filter(([key]) =>
  key.includes("font-family") || key === "--font-sans" || key === "--font-mono"));
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const scriptJson = (value) => JSON.stringify(value).replaceAll("</", "<\\/");
const stages = ["dark", "light"].flatMap((theme) => phases.map((phase) =>
  `<div class="${theme} t3-stage t3-state" data-t3-theme="${theme}" data-t3-state="${phase}"${["tooltip", "confirm"].includes(phase) ? " data-layout-ignore" : ""} style="${escapeAttribute(themesCss[theme])}"${theme === "light" || (theme === "dark" && phase !== "before") ? " hidden" : ""}>${stateHtml[theme][phase]}</div>`)).join("\n");
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
<script src="t3-code-gsap.min.js"></script><script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
const pixelMode = options.renderMode === 'pixel-verified' && Object.entries(defaults).every(([key, value]) => key === 'theme' || key === 'renderMode' || options[key] === value);
const replacements = ${scriptJson(replacements)};
for (const stage of document.querySelectorAll('#root .t3-stage')) {
  for (const [key, value] of Object.entries(${scriptJson(fontTheme)})) stage.style.setProperty(key, value);
  stage.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
  const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const current = node.textContent.trim();
    const key = replacements[current];
    if (key && options[key] !== defaults[key]) node.textContent = node.textContent.replace(current, String(options[key]));
  }
  for (const editor of stage.querySelectorAll('[data-testid="composer-editor"]')) editor.setAttribute('aria-placeholder', String(options.composerPlaceholder));
  const editControl = stage.querySelector('[aria-label="Edit from here"]');
  if (editControl) {
    editControl.setAttribute('data-hf-edit-action', 'true');
    editControl.setAttribute('aria-label', String(options.editAction));
  }
}
const capture = document.querySelector('canvas.t3-pixel-capture');
const captureContext = capture.getContext('2d');
if (!captureContext) throw new Error('Native Message Rewind capture requires Canvas 2D');
captureContext.imageSmoothingEnabled = false;
let captureImages = [];
const clock = { frame: 0 };
function draw() {
  const frame = Math.min(119, Math.max(0, Math.round(clock.frame)));
  const hoverFrame = Number(options.hoverFrame);
  const tooltipFrame = Math.max(hoverFrame + 1, Number(options.tooltipFrame));
  const confirmFrame = Math.max(tooltipFrame + 1, Number(options.confirmFrame));
  const cancelFrame = Math.max(confirmFrame + 1, Number(options.cancelFrame));
  const phase = frame < hoverFrame ? 'before' : frame < tooltipFrame ? 'hover' : frame < confirmFrame ? 'tooltip' : frame < cancelFrame ? 'confirm' : 'closed';
  for (const stage of document.querySelectorAll('#root .t3-stage')) {
    const active = stage.dataset.t3Theme === options.theme && stage.dataset.t3State === phase;
    stage.hidden = pixelMode || !active;
    if (active && phase !== 'before') stage.querySelector('[data-hf-edit-action]')?.closest('[class~="opacity-0"]')?.style.setProperty('opacity', '1');
  }
  const imageIndex = ${scriptJson([dark.captureFrameImageIndices, light.captureFrameImageIndices])}[options.theme === 'light' ? 1 : 0][frame];
  capture.hidden = !pixelMode;
  if (pixelMode && captureImages[imageIndex]) captureContext.drawImage(captureImages[imageIndex], 0, 0);
}
draw();
const captureReady = pixelMode
  ? Promise.all(${scriptJson(['dark', 'light'].map((theme) => Object.keys(themes[theme].fixture.captureSpriteSha256).sort().map((suffix) => `compositions/${name}-frame-${theme}-${suffix}.png`)))}[options.theme === 'light' ? 1 : 0].map(async (source) => {
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
for (const theme of ["dark", "light"]) for (const suffix of Object.keys(themes[theme].fixture.captureSpriteSha256)) await copyFile(
  resolve(source, `${shortName}-v0042-${theme}-frame-${suffix}.png`),
  resolve(output, `${name}-frame-${theme}-${suffix}.png`));
await copyFile(resolve(root, "parity/t3-gallery/assets/T3-CODE-LICENSE.txt"), resolve(output, "licenses/T3-CODE-LICENSE.txt"));
await copyFile(resolve(root, "assets/t3-code/v0.0.35/agent-work-t3-third-party-notices.md"), resolve(output, "licenses/T3-THIRD_PARTY_NOTICES.md"));
await writeFile(resolve(output, "README.md"), `# T3 Code: Message Rewind\n\nThis four-second block reproduces the official T3 Code v0.0.42 “Edit from here” interaction at 1200 × 659 in desktop dark and light. Hovering the seeded Hyfrme prompt reveals the edit control, then opens the native confirmation with “Revert files too” and “Revert and keep changes.” The capture cancels the dialog and does not rewind the thread or restore files.\n\nPixel-verified mode reproduces the lossless native capture through one persistent canvas with synchronous frame draws from ten dark or eleven light deduplicated native PNG states. These PNGs are decoded from the unchanged pinned native FFV1 recording; every reconstructed frame preserves the native RGBA pixels. Editing the project, branch, thread labels, prompt, response, confirmation copy, or event timing automatically uses editable DOM. Unchanged content and timing retain the native recording in either theme; editable DOM mode can also be selected explicitly. Every native frame atlas round-trips at SSIM 1.0. Source: https://github.com/pingdotgg/t3code/tree/${dark.sourceCommit}.\n`);
await writeFile(resolve(output, "registry-item.json"), `${JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json", name, type: "hyperframes:block", title: "T3 Code: Message Rewind",
  description: "Show T3 Code’s real Edit from here control and checkpoint dialog, then cancel without changing files.",
  tags: ["composition", "app-ui", "t3-code", "message-rewind", "hyfrme-port"], author: "Hyfrme",
  authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT", dimensions: dark.viewport, duration: dark.frames / dark.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    ...["dark", "light"].flatMap((theme) => Object.keys(themes[theme].fixture.captureSpriteSha256).sort().map((suffix) => ({ path: `${name}-frame-${theme}-${suffix}.png`, target: `compositions/${name}-frame-${theme}-${suffix}.png`, type: "hyperframes:asset" }))),
    { path: "licenses/T3-CODE-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt", type: "hyperframes:asset" },
    { path: "licenses/T3-THIRD_PARTY_NOTICES.md", target: "THIRD_PARTY_LICENSES/t3-code/T3-THIRD_PARTY_NOTICES.md", type: "hyperframes:asset" },
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2)}\n`);
console.log(`Generated ${name} from v0.0.42 native dark/light frames and editable DOM states.`);
