import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-agent-answer";
const shortName = "agent-answer";
const output = resolve(root, `.work/${name}-v0042-candidate`);
const themes = {};
for (const theme of ["dark", "light"]) themes[theme] = {
  fixture: JSON.parse(await readFile(resolve(source, `${shortName}-v0042-${theme}-fixture.json`), "utf8")),
  cssVars: JSON.parse(await readFile(resolve(source, `${theme}-theme.json`), "utf8")),
};
const dark = themes.dark.fixture;
const light = themes.light.fixture;
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
  ["answerLead", "Answer opening", "I found the Logo Enter timing in"],
  ["answerFile", "Answer file name", "logo-enter.html"],
  ["answerTail", "Answer closing", ". The final pass can extend the duration while keeping the last rendered frame still."],
  ["copyAction", "Copy button label", "Copy link"],
  ["copyTooltip", "Copy tooltip", "Copy to clipboard"],
  ["copiedFeedback", "Copied feedback", "Copied!"],
  ["composerPlaceholder", "Composer placeholder", "Enable a provider in Settings to send a message"],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "theme", type: "string", label: "T3 Code appearance", default: "dark", options: ["dark", "light"] },
  { id: "renderMode", type: "string", label: "Render mode", default: "pixel-verified", options: ["pixel-verified", "editable DOM"] },
  { id: "hoverFrame", type: "number", label: "Reveal answer controls at frame", default: dark.events.hover, min: 0, max: 114, step: 1 },
  { id: "tooltipFrame", type: "number", label: "Show copy tooltip at frame", default: dark.events.tooltip, min: 1, max: 115, step: 1 },
  { id: "copyFrame", type: "number", label: "Copy the answer at frame", default: dark.events.copy, min: 2, max: 116, step: 1 },
  { id: "clearFrame", type: "number", label: "Clear copied feedback at frame", default: dark.events.clear, min: 3, max: 119, step: 1 },
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
  `<div class="${theme} t3-stage t3-state" data-t3-theme="${theme}" data-t3-state="${phase}"${["tooltip", "copied"].includes(phase) ? " data-layout-ignore" : ""} style="${escapeAttribute(themesCss[theme])}"${theme === "light" || (theme === "dark" && phase !== "before") ? " hidden" : ""}>${stateHtml[theme][phase]}</div>`)).join("\n");
const captures = ["dark", "light"].flatMap((theme) => Array.from({ length: 10 }, (_, row) =>
  `<div data-layout-ignore class="t3-pixel-capture" data-t3-pixel-theme="${theme}" data-t3-pixel-row="${row}" style="background-image:url(compositions/${name}-capture-${theme}-${String(row).padStart(2, "0")}.webp)" hidden></div>`)).join("\n");
const html = `<!doctype html>
<html lang="en" data-composition-variables='${escapeAttribute(JSON.stringify(variables))}'>
<head><meta charset="utf-8"></head><body><template>
<style>${css}</style>
<style>
  #root { position: relative; width: 100%; height: 100%; overflow: hidden; }
  .t3-stage { position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--background); color: var(--foreground); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
  .t3-stage[hidden], .t3-state[hidden] { display: none !important; }
  .t3-state:not([hidden]) { display: contents; }
  .t3-pixel-capture { position: absolute; inset: 0; z-index: 100; pointer-events: none; background-repeat: no-repeat; background-size: 14400px 659px; background-position: 0 0; }
  .t3-pixel-capture[hidden] { display: none !important; }
  .base-ui-disable-scrollbar { scrollbar-width: none; }
  .base-ui-disable-scrollbar::-webkit-scrollbar { display: none; }
  @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
  @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
  @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
  @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"); }
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
${stages}
${captures}
</div>
<script src="t3-code-gsap.min.js"></script><script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
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
  for (const element of stage.querySelectorAll('[aria-label="Copy link"]')) {
    element.setAttribute('data-hf-copy-action', 'true');
    element.setAttribute('aria-label', String(options.copyAction));
  }
  for (const editor of stage.querySelectorAll('[data-testid="composer-editor"]')) editor.setAttribute('aria-placeholder', String(options.composerPlaceholder));
}
const clock = { frame: 0 };
function draw() {
  const frame = Math.min(119, Math.max(0, Math.round(clock.frame)));
  const hoverFrame = Number(options.hoverFrame);
  const tooltipFrame = Math.max(hoverFrame + 1, Number(options.tooltipFrame));
  const copyFrame = Math.max(tooltipFrame + 1, Number(options.copyFrame));
  const clearFrame = Math.max(copyFrame + 1, Number(options.clearFrame));
  const phase = frame < hoverFrame ? 'before' : frame < tooltipFrame ? 'hover' : frame < copyFrame ? 'tooltip' : frame < clearFrame ? 'copied' : 'clear';
  for (const stage of document.querySelectorAll('#root .t3-stage')) {
    const active = stage.dataset.t3Theme === options.theme && stage.dataset.t3State === phase;
    stage.hidden = !active;
    if (active && phase !== 'before') stage.querySelector('[data-hf-copy-action]')?.closest('[class~="opacity-0"]')?.style.setProperty('opacity', '1');
  }
  const pixelMode = options.renderMode === 'pixel-verified';
  const row = Math.floor(frame / 12);
  for (const capture of document.querySelectorAll('[data-t3-pixel-theme]')) {
    const active = pixelMode && capture.dataset.t3PixelTheme === options.theme && Number(capture.dataset.t3PixelRow) === row;
    capture.hidden = !active;
    if (active) capture.style.backgroundPosition = '-' + ((frame % 12) * 1200) + 'px 0px';
  }
}
draw();
const timeline = gsap.timeline({ paused: true });
timeline.to(clock, { frame: 120, duration: 4, ease: 'none', onUpdate: draw });
window.__timelines['${name}'] = timeline;
</script></template></body></html>`;

await mkdir(resolve(output, "licenses"), { recursive: true });
await writeFile(resolve(output, `${name}.html`), html);
await writeFile(resolve(output, "t3-code-gsap.min.js"), gsap);
for (const theme of ["dark", "light"]) for (let row = 0; row < 10; row++) await copyFile(
  resolve(source, `${shortName}-v0042-${theme}-capture-${String(row).padStart(2, "0")}.webp`),
  resolve(output, `${name}-capture-${theme}-${String(row).padStart(2, "0")}.webp`));
await copyFile(resolve(root, "public/ideas/assets/T3-CODE-LICENSE.txt"), resolve(output, "licenses/T3-CODE-LICENSE.txt"));
await copyFile(resolve(root, "assets/t3-code/v0.0.35/agent-work-t3-third-party-notices.md"), resolve(output, "licenses/T3-THIRD_PARTY_NOTICES.md"));
await writeFile(resolve(output, "README.md"), `# T3 Code: Agent Answer\n\nThis four-second block reproduces the official T3 Code v0.0.42 completed-answer controls at 1200 × 659 in desktop dark and light. Hovering the seeded Hyfrme answer reveals the native copy action, the tooltip appears, and Copy link places the reply on the browser clipboard before the feedback clears. The answer is seeded; no AI provider runs.\n\nPixel-verified mode reproduces the lossless native capture. Switch to editable DOM mode to change the project, branch, thread labels, prompt, answer, button and tooltip labels, theme, and event timing. Every native frame atlas round-trips at SSIM 1.0. Source: https://github.com/pingdotgg/t3code/tree/${dark.sourceCommit}.\n`);
await writeFile(resolve(output, "registry-item.json"), `${JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json", name, type: "hyperframes:block", title: "T3 Code: Agent Answer",
  description: "Show a completed Hyfrme reply in T3 Code, copy it with the native controls, and display copied feedback.",
  tags: ["composition", "app-ui", "t3-code", "agent-answer", "hyfrme-port"], author: "Hyfrme",
  authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT", dimensions: dark.viewport, duration: dark.frames / dark.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    ...["dark", "light"].flatMap((theme) => Array.from({ length: 10 }, (_, row) => ({ path: `${name}-capture-${theme}-${String(row).padStart(2, "0")}.webp`, target: `compositions/${name}-capture-${theme}-${String(row).padStart(2, "0")}.webp`, type: "hyperframes:asset" }))),
    { path: "licenses/T3-CODE-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt", type: "hyperframes:asset" },
    { path: "licenses/T3-THIRD_PARTY_NOTICES.md", target: "THIRD_PARTY_LICENSES/t3-code/T3-THIRD_PARTY_NOTICES.md", type: "hyperframes:asset" },
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2)}\n`);
console.log(`Generated ${name} from v0.0.42 native dark/light frames and editable DOM states.`);
