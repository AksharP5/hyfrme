import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
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
if (!dark.interactionTargets?.answer || !dark.interactionTargets?.copy || !light.interactionTargets?.answer || !light.interactionTargets?.copy) {
  throw new Error("Agent Answer captures are missing native pointer targets");
}
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks", name, "t3-code-gsap.min.js"), "utf8");
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
  { id: "theme", type: "enum", label: "T3 Code appearance", default: "dark", options: [
    { value: "dark", label: "Dark" }, { value: "light", label: "Light" },
  ] },
  { id: "showPointer", type: "boolean", label: "Show pointer", default: true },
  { id: "pointerColor", type: "color", label: "Pointer color", default: "#ffffff" },
  { id: "pointerSize", type: "number", label: "Pointer size", default: 24, min: 16, max: 40, step: 1 },
  { id: "hoverFrame", type: "number", label: "Reveal answer controls at frame", default: dark.events.hover, min: 0, max: 114, step: 1 },
  { id: "tooltipFrame", type: "number", label: "Show copy tooltip at frame", default: dark.events.tooltip, min: 1, max: 115, step: 1 },
  { id: "copyFrame", type: "number", label: "Show copied feedback at frame", default: dark.events.copy, min: 2, max: 116, step: 1 },
  { id: "clearFrame", type: "number", label: "Clear copied feedback at frame", default: dark.events.clear, min: 3, max: 119, step: 1 },
];
const defaults = Object.fromEntries(variables.map(({ id, default: value }) => [id, value]));
const replacements = Object.fromEntries(fields.map(([id, , value]) => [value, id]));
const themesCss = Object.fromEntries(Object.entries(themes).map(([theme, data]) => [theme,
  Object.entries(data.cssVars).map(([key, value]) => `${key}:${value};`).join("")
]));
const interactionTargets = Object.fromEntries(Object.entries(themes).map(([theme, data]) => [theme, data.fixture.interactionTargets]));
const fontTheme = Object.fromEntries(Object.entries(themes.dark.cssVars).filter(([key]) =>
  key.includes("font-family") || key === "--font-sans" || key === "--font-mono"));
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const scriptJson = (value) => JSON.stringify(value).replaceAll("</", "<\\/");
const stages = ["dark", "light"].flatMap((theme) => phases.map((phase) =>
  `<div class="${theme} t3-stage t3-state" data-t3-theme="${theme}" data-t3-state="${phase}"${["tooltip", "copied"].includes(phase) ? " data-layout-ignore" : ""} style="${escapeAttribute(themesCss[theme])}"${theme === "light" || (theme === "dark" && phase !== "before") ? " hidden" : ""}>${stateHtml[theme][phase]}</div>`)).join("\n");
const html = `<!doctype html>
<html lang="en" data-composition-variables='${escapeAttribute(JSON.stringify(variables))}'>
<head><meta charset="utf-8"></head><body><template>
<style>${css}</style>
<style>
  #root { position: relative; width: 100%; height: 100%; overflow: hidden; }
  .t3-stage { position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--background); color: var(--foreground); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
  .t3-stage[hidden], .t3-state[hidden] { display: none !important; }
  .t3-state:not([hidden]) { display: contents; }
  .t3-pointer { position: absolute; top: 0; left: 0; z-index: 200; overflow: visible; pointer-events: none; transform-origin: 0 0; filter: drop-shadow(0 1px 1px rgb(0 0 0 / 65%)); }
  .t3-pointer path { fill: var(--pointer-color); stroke: #141414; stroke-width: 1.4; stroke-linejoin: round; }
  .t3-pointer circle { fill: none; stroke: var(--pointer-color); stroke-width: 1.5; }
  .t3-pointer.is-pressed { scale: .88; }
  .base-ui-disable-scrollbar { scrollbar-width: none; }
  .base-ui-disable-scrollbar::-webkit-scrollbar { display: none; }
  @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
  @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
  @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
  @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"); }
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
${stages}
<svg class="t3-pointer" data-layout-ignore viewBox="0 0 24 32" aria-hidden="true"><circle data-pointer-ring cx="4" cy="2" r="3" opacity="0"></circle><path d="M4 2.4v20.2l5-5.1 3.9 9.1 4-1.7-3.9-9.1h7.2L4 2.4Z"></path></svg>
</div>
<script src="t3-code-gsap.min.js"></script><script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
const replacements = ${scriptJson(replacements)};
const pointerTargets = ${scriptJson(interactionTargets)};
const host = [...document.querySelectorAll('[data-composition-id="${name}"]')]
  .find((element) => element.querySelector('.t3-pointer') && !element.hasAttribute('data-hf-agent-answer-bound'));
if (!host) throw new Error('T3 Agent Answer composition host is missing');
host.setAttribute('data-hf-agent-answer-bound', 'true');
const rootSelector = '[data-hf-inner-root="true"], #root';
const root = host.matches(rootSelector) ? host : host.querySelector(rootSelector) ?? host;
if (!root) throw new Error('T3 Agent Answer root is missing');
const pointer = root.querySelector('.t3-pointer');
const pointerRing = pointer.querySelector('[data-pointer-ring]');
function answerCopyButton(stage) {
  let scope = stage.querySelector('[data-assistant-citation-source] .chat-markdown');
  while (scope) {
    const button = scope.querySelector('button[aria-label="Copy link"]');
    if (button) return button;
    scope = scope.parentElement;
  }
  return null;
}
for (const stage of root.querySelectorAll('.t3-stage')) {
  for (const [key, value] of Object.entries(${scriptJson(fontTheme)})) stage.style.setProperty(key, value);
  stage.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
  const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const current = node.textContent.trim();
    const key = replacements[current];
    if (key && options[key] !== defaults[key]) node.textContent = node.textContent.replace(current, String(options[key]));
  }
  const copyButton = answerCopyButton(stage);
  if (copyButton) {
    copyButton.setAttribute('data-hf-copy-action', 'true');
    copyButton.setAttribute('aria-label', String(options.copyAction));
  }
  for (const link of stage.querySelectorAll('[data-markdown-copy]')) {
    link.setAttribute('data-markdown-copy', link.getAttribute('data-markdown-copy').replace('logo-enter.html', String(options.answerFile)));
  }
  for (const editor of stage.querySelectorAll('[data-testid="composer-editor"]')) editor.setAttribute('aria-placeholder', String(options.composerPlaceholder));
}
const clock = { frame: 0 };
function easeOut(frame, startFrame, endFrame) {
  const progress = Math.max(0, Math.min(1, (frame - startFrame) / Math.max(1, endFrame - startFrame)));
  return progress * (2 - progress);
}
function positionBetween(start, end, progress) {
  return { x: start.x + (end.x - start.x) * progress, y: start.y + (end.y - start.y) * progress };
}
function draw() {
  const frame = Math.min(119, Math.max(0, Math.round(clock.frame)));
  const hoverFrame = Number(options.hoverFrame);
  const tooltipFrame = Math.max(hoverFrame + 1, Number(options.tooltipFrame));
  const copyFrame = Math.max(tooltipFrame + 1, Number(options.copyFrame));
  const clearFrame = Math.max(copyFrame + 1, Number(options.clearFrame));
  const answerArrival = Math.max(0, hoverFrame - 6);
  const tooltipStart = Math.max(hoverFrame + 1, tooltipFrame - 4);
  const copyStart = Math.max(tooltipStart + 1, copyFrame - 4);
  const phase = frame < answerArrival ? 'before' : frame < tooltipStart ? 'hover' : frame < copyStart ? 'tooltip' : frame < clearFrame ? 'copied' : 'clear';
  let activeStage;
  for (const stage of root.querySelectorAll('.t3-stage')) {
    const active = stage.dataset.t3Theme === options.theme && stage.dataset.t3State === phase;
    stage.hidden = !active;
    if (active) activeStage = stage;
  }
  if (!activeStage) return;
  const controls = activeStage.querySelector('[data-hf-copy-action]')?.closest('[class~="opacity-0"]');
  if (controls) {
    const controlsIn = easeOut(frame, answerArrival, hoverFrame);
    const controlsOut = easeOut(frame, clearFrame - 5, clearFrame);
    controls.style.opacity = String(controlsIn * (1 - controlsOut));
  }
  const tooltipPopup = activeStage.querySelector('[data-slot="tooltip-popup"]');
  if (tooltipPopup) {
    const tooltipIn = easeOut(frame, tooltipStart, tooltipFrame);
    tooltipPopup.style.opacity = String(tooltipIn);
    tooltipPopup.style.scale = String(0.98 + tooltipIn * 0.02);
  }
  const copiedPopup = activeStage.querySelector('[data-slot="toast-popup"]');
  if (copiedPopup) {
    const copiedIn = easeOut(frame, copyStart, copyFrame);
    const copiedOut = easeOut(frame, clearFrame - 5, clearFrame);
    copiedPopup.style.opacity = String(copiedIn * (1 - copiedOut));
    copiedPopup.style.scale = String(0.98 + copiedIn * 0.02);
  }
  const targets = pointerTargets[options.theme];
  const answer = activeStage.querySelector('[data-assistant-citation-source] .chat-markdown');
  const copy = answerCopyButton(activeStage);
  const rootBox = root.getBoundingClientRect();
  const answerBox = answer?.getBoundingClientRect();
  const copyBox = copy?.getBoundingClientRect();
  const answerTarget = answerBox ? { x: answerBox.left - rootBox.left + answerBox.width / 2, y: answerBox.top - rootBox.top + answerBox.height / 2 } : targets.answer;
  const copyTarget = copyBox ? { x: copyBox.left - rootBox.left + copyBox.width / 2, y: copyBox.top - rootBox.top + copyBox.height / 2 } : targets.copy;
  const scale = rootBox.width / 1200;
  const pointerStart = { x: targets.pointerStart.x * scale, y: targets.pointerStart.y * scale };
  const pointerExit = { x: targets.pointerExit.x * scale, y: targets.pointerExit.y * scale };
  let point;
  if (frame <= answerArrival) point = positionBetween(pointerStart, answerTarget, easeOut(frame, 0, answerArrival));
  else if (frame <= tooltipStart) point = positionBetween(answerTarget, copyTarget, easeOut(frame, answerArrival, tooltipStart));
  else if (frame < clearFrame - 5) point = copyTarget;
  else point = positionBetween(copyTarget, pointerExit, easeOut(frame, clearFrame - 5, clearFrame));
  pointer.style.transform = 'translate3d(' + (point.x - 4 * scale) + 'px, ' + (point.y - 2.4 * scale) + 'px, 0)';
  pointer.style.width = Number(options.pointerSize) * scale + 'px';
  pointer.style.height = Number(options.pointerSize) * 4 / 3 * scale + 'px';
  pointer.style.setProperty('--pointer-color', String(options.pointerColor));
  pointer.hidden = false;
  pointer.style.display = options.showPointer === false || options.showPointer === "false" ? "none" : "block";
  pointer.classList.toggle('is-pressed', frame >= copyStart - 2 && frame < copyStart);
  const ripple = Math.max(0, Math.min(1, (frame - copyStart) / 6));
  pointerRing.setAttribute('r', String(3 + ripple * 12));
  pointerRing.style.opacity = frame >= copyStart && frame < copyStart + 6 ? String(1 - ripple) : '0';
}
draw();
const timeline = gsap.timeline({ paused: true });
timeline.to(clock, { frame: 120, duration: 4, ease: 'none', onUpdate: draw });
window.__timelines['${name}'] = timeline;
</script></template></body></html>`;

await mkdir(resolve(output, "licenses"), { recursive: true });
await writeFile(resolve(output, `${name}.html`), html);
await writeFile(resolve(output, "t3-code-gsap.min.js"), gsap);
await copyFile(resolve(root, "parity/t3-gallery/assets/T3-CODE-LICENSE.txt"), resolve(output, "licenses/T3-CODE-LICENSE.txt"));
await copyFile(resolve(root, "assets/t3-code/v0.0.35/agent-work-t3-third-party-notices.md"), resolve(output, "licenses/T3-THIRD_PARTY_NOTICES.md"));
await writeFile(resolve(output, "README.md"), `# T3 Code: Agent Answer\n\nThis four-second block recreates the T3 Code v0.0.42 completed-answer view at 1200 × 659 in desktop dark and light. A visible pointer moves onto the seeded Hyfrme reply, reveals its native Copy link control, hovers for the tooltip, clicks, and shows T3 Code's copied feedback. The answer is seeded; no AI provider runs.\n\nChange the project, branch, thread labels, prompt, answer, control labels, theme, pointer appearance, or event timing through HyperFrames variables. The pointer follows the answer and native control positions in both themes. Source: https://github.com/pingdotgg/t3code/tree/${dark.sourceCommit}.\n`);
await writeFile(resolve(output, "registry-item.json"), `${JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json", name, type: "hyperframes:block", title: "T3 Code: Agent Answer",
  description: "Recreate a completed T3 Code reply with a visible pointer-led Copy link interaction and native copied feedback.",
  tags: ["composition", "app-ui", "t3-code", "agent-answer", "hyfrme-port"], author: "Hyfrme",
  authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT", dimensions: dark.viewport, duration: dark.frames / dark.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    { path: "licenses/T3-CODE-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt", type: "hyperframes:asset" },
    { path: "licenses/T3-THIRD_PARTY_NOTICES.md", target: "THIRD_PARTY_LICENSES/t3-code/T3-THIRD_PARTY_NOTICES.md", type: "hyperframes:asset" },
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2)}\n`);
console.log(`Generated ${name} from v0.0.42 dark/light DOM states with a seekable pointer-led copy interaction.`);
