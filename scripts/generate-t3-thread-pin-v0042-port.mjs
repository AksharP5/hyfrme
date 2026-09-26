import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-thread-pin";
const output = resolve(root, ".work/t3-thread-pin-v0042-candidate");
const fixture = JSON.parse(await readFile(resolve(source, "thread-pin-fixture.json"), "utf8"));
const lightFixture = JSON.parse(await readFile(resolve(source, "thread-pin-light-fixture.json"), "utf8"));
const themes = await Promise.all(["dark-theme.json", "thread-pin-light-theme.json"].map(async (file) =>
  JSON.parse(await readFile(resolve(source, file), "utf8"))));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const phases = fixture.phases;
const states = await Promise.all(phases.map((phase) => readFile(resolve(source, `thread-pin-${phase}.html`), "utf8")));
const lightStates = await Promise.all(phases.map((phase) => readFile(resolve(source, `thread-pin-light-${phase}.html`), "utf8")));
if (JSON.stringify(lightFixture.phases) !== JSON.stringify(phases) || JSON.stringify(lightFixture.events) !== JSON.stringify(fixture.events)) {
  throw new Error("Dark and light native fixtures use different phase timing");
}
if (fixture.motion?.length !== 2 || lightFixture.motion?.length !== 2 ||
    fixture.motion.some(({ durationMs }) => durationMs !== 150) ||
    lightFixture.motion.some(({ durationMs }) => durationMs !== 150)) {
  throw new Error("Native 150ms Pin row motion is missing from either theme");
}
const rowOffset = (motions, title) => {
  const entry = motions.find(({ row }) => row.includes(title));
  const match = entry?.keyframes[0]?.match(/^translateY\((-?[\d.]+)px\)$/);
  if (!match) throw new Error(`Native Pin motion missing for ${title}`);
  return Number(match[1]);
};
const motionOffsets = [fixture.motion, lightFixture.motion].map((motions) => [
  rowOffset(motions, fixture.targetThread), rowOffset(motions, "Build a logo intro"),
]);
for (const variant of [states, lightStates]) {
  for (let index = 0; index < variant.length; index++) {
    variant[index] = variant[index].replace(/(<span[^>]*class="[^"]*\[text-box:trim-both_cap_alphabetic\][^"]*")/g, "$1 data-layout-ignore");
  }
  variant[0] = variant[0].replace(
    'group-hover:opacity-100"><div class="flex shrink-0 items-center gap-2">',
    'group-hover:opacity-100" style="opacity:1"><div class="flex shrink-0 items-center gap-2">',
  );
  for (const index of [1, 3]) variant[index] = variant[index].replace("<main ", "<main data-layout-ignore ");
}
const portals = await Promise.all(["pin-menu", "unpin-menu"].map(async (phase) =>
  (await readFile(resolve(source, `thread-pin-${phase}-portal.html`), "utf8"))
    .replaceAll('<div class="dropdown-glass', '<div data-layout-ignore class="dropdown-glass')));
const lightPortals = await Promise.all(["pin-menu", "unpin-menu"].map(async (phase) =>
  (await readFile(resolve(source, `thread-pin-light-${phase}-portal.html`), "utf8"))
    .replaceAll('<div class="dropdown-glass', '<div data-layout-ignore class="dropdown-glass')));

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["projectAvatar", "Project avatar letters", "HE"],
  ["branchName", "Branch name", "main"],
  ["activeBranch", "Active branch", "feature/logo-enter"],
  ["thirdBranch", "Third thread branch", "logo/assemble"],
  ["fourthBranch", "Fourth thread branch", "logo/hold-final"],
  ["firstThread", "Initial thread", "Build a logo intro"],
  ["pinThread", "Thread to pin", "Catalog motion audit"],
  ["thirdThread", "Third thread", "Grouped logo tests"],
  ["fourthThread", "Fourth thread", "Review final hold"],
  ["fifthThread", "Fifth thread", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ["firstAge", "Initial thread age", "10h"],
  ["targetAge", "Thread age", "12h"],
  ["thirdAge", "Third thread age", "17h"],
  ["fourthAge", "Fourth thread age", "1d"],
  ["fifthAge", "Fifth thread age", "2d"],
  ["settledAge", "Settled thread age", "7h"],
  ["targetQuestion", "Thread user message", "Which Hyfrme motion blocks need a fresh parity render?"],
  ["targetReply", "Thread answer", "Logo Enter and Answer Stream should be checked at their final frames. Their pinned reference and Hyfrme output must use matching dimensions, frame rate, and input values."],
  ["targetQuestionTime", "Thread user message time", "yesterday at 7:24 PM"],
  ["targetReplyTime", "Thread answer time", "yesterday at 7:26 PM"],
  ["composerPlaceholder", "Composer placeholder", "Enable a provider in Settings to send a message"],
  ["providerStatus", "Provider status", "Open provider settings"],
  ["permissionMode", "Permission", "Full access"],
  ["workspaceMode", "Workspace", "Worktree"],
  ["pinAction", "Pin menu action", "Pin thread"],
  ["unpinAction", "Unpin menu action", "Unpin thread"],
  ["settleAction", "Settle menu action", "Settle thread"],
  ["snoozeAction", "Snooze menu action", "Snooze"],
  ["renameAction", "Rename menu action", "Rename thread"],
  ["regenerateAction", "Regenerate menu action", "Regenerate title"],
  ["unreadAction", "Unread menu action", "Mark unread"],
  ["copyAction", "Copy menu action", "Copy"],
  ["archiveAction", "Archive menu action", "Archive thread"],
  ["deleteAction", "Delete menu action", "Delete"],
];
const variables = [
  { id: "theme", type: "string", label: "Theme", default: "dark", options: ["dark", "light"] },
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "menuFrame", type: "number", label: "Open Pin menu at frame", default: fixture.events.menu, min: 0, max: 105, step: 1 },
  { id: "pinFrame", type: "number", label: "Pin thread at frame", default: fixture.events.pin, min: 1, max: 110, step: 1 },
  { id: "unpinMenuFrame", type: "number", label: "Show Unpin action at frame (120 keeps menu closed)", default: fixture.events.unpinMenu, min: 1, max: 120, step: 1 },
  { id: "seamToUnpin", type: "number", label: "Match the Thread Unpin opening frame", default: 0, min: 0, max: 1, step: 1 },
];
const defaults = Object.fromEntries(variables.map(({ id, default: value }) => [id, value]));
const replacements = Object.fromEntries(fields.map(([id, , value]) => [value, id]));
const fontThemes = themes.map((theme) => Object.fromEntries(Object.entries(theme).filter(([key]) =>
  key.includes("font-family") || key === "--font-sans" || key === "--font-mono")));
const stageThemes = themes.map((theme) => Object.entries(theme).map(([key, value]) => `${key}:${value};`).join(""));
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const scriptJson = (value) => JSON.stringify(value).replaceAll("</", "<\\/");

const html = `<!doctype html>
<html lang="en" data-composition-variables='${escapeAttribute(JSON.stringify(variables))}'>
<head><meta charset="utf-8"></head>
<body>
<template>
<style>${css}</style>
<style>
  #root { position: relative; width: 100%; height: 100%; overflow: hidden; }
  .t3-stage { position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--background); color: var(--foreground); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
  .t3-stage[hidden] { display: none !important; }
  .t3-state[hidden] { display: none !important; }
  .t3-state:not([hidden]) { display: contents; }
  .base-ui-disable-scrollbar { scrollbar-width: none; }
  .base-ui-disable-scrollbar::-webkit-scrollbar { display: none; }
  @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
  @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
  @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
  @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"); }
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
  <div class="dark t3-stage" style='${escapeAttribute(stageThemes[0])}'>
    <div class="t3-state" data-t3-state="unpinned">${states[0]}</div>
    <div class="t3-state" data-t3-state="pin-menu" data-layout-ignore hidden>${states[1]}${portals[0]}</div>
    <div class="t3-state" data-t3-state="pinned" hidden>${states[2]}</div>
    <div class="t3-state" data-t3-state="unpin-menu" data-layout-ignore hidden>${states[3]}${portals[1]}</div>
  </div>
  <div class="light t3-stage" style='${escapeAttribute(stageThemes[1])}' hidden>
    <div class="t3-state" data-t3-state="unpinned">${lightStates[0]}</div>
    <div class="t3-state" data-t3-state="pin-menu" data-layout-ignore hidden>${lightStates[1]}${lightPortals[0]}</div>
    <div class="t3-state" data-t3-state="pinned" hidden>${lightStates[2]}</div>
    <div class="t3-state" data-t3-state="unpin-menu" data-layout-ignore hidden>${lightStates[3]}${lightPortals[1]}</div>
  </div>
</div>
<script src="t3-code-gsap.min.js"></script>
<script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
const stages = [...document.querySelectorAll('#root .t3-stage')];
for (const [index, stage] of stages.entries()) {
  for (const [key, value] of Object.entries(${scriptJson(fontThemes)}[index])) stage.style.setProperty(key, value);
  stage.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
}
const replacements = ${scriptJson(replacements)};
const walker = document.createTreeWalker(document.querySelector('#root'), NodeFilter.SHOW_TEXT);
let node;
while ((node = walker.nextNode())) {
  const current = node.textContent.trim();
  if (current === 'New thread on main' && options.branchName !== defaults.branchName) {
    node.textContent = node.textContent.replace(current, 'New thread on ' + options.branchName);
    continue;
  }
  const key = replacements[current];
  if (key && options[key] !== defaults[key]) node.textContent = node.textContent.replace(current, String(options[key]));
}
const sections = stages.map((stage) => [...stage.querySelectorAll('[data-t3-state]')]);
const movingRows = sections.map((variant, themeIndex) => [options.pinThread, options.firstThread].map((title, rowIndex) => {
  const row = [...variant[2].querySelectorAll('[data-testid="sidebar-row-card"]')]
    .find((element) => element.textContent.includes(title))?.closest('[data-thread-item="true"]');
  if (!row) throw new Error('Pin motion row missing: ' + title);
  return { row, offset: ${scriptJson(motionOffsets)}[themeIndex][rowIndex] };
}));
for (const variant of sections) for (const [section, title, hoveredBackground] of [[variant[1], options.pinThread, false], [variant[2], options.thirdThread, Number(options.seamToUnpin) !== 1], [variant[3], options.pinThread, false]]) {
  if (section === variant[2] && !hoveredBackground) continue;
  const row = [...section.querySelectorAll('[data-testid="sidebar-row-card"]')]
    .find((element) => element.textContent.includes(title));
  if (!row) continue;
  if (hoveredBackground) {
    row.style.backgroundColor = 'var(--sidebar-row-hover)';
    row.style.color = 'var(--sidebar-foreground)';
  }
  for (const element of row.querySelectorAll('span')) {
    const classes = element.getAttribute('class') ?? '';
    if (classes.includes('group-hover/sidebar-row:opacity-0')) {
      element.style.opacity = '0';
      element.style.position = 'absolute';
      element.style.right = '0';
    }
    if (classes.includes('group-hover/sidebar-row:opacity-100')) {
      element.style.opacity = '1';
      element.style.position = 'static';
      element.style.pointerEvents = 'auto';
    }
  }
}
const pinStartHover = sections.map((variant, themeIndex) => {
  const target = movingRows[themeIndex][0].row;
  const third = [...variant[2].querySelectorAll('[data-testid="sidebar-row-card"]')]
    .find((element) => element.textContent.includes(options.thirdThread));
  if (!third) throw new Error('Pin hover row missing');
  const controls = (row) => [...row.querySelectorAll('[class*="group-hover/sidebar-row:opacity-"]')];
  return { target: controls(target), pinIcon: target.querySelector('[aria-label="Unpin thread"]'), third: controls(third) };
});
for (const section of sections.flat()) {
  for (const editor of section.querySelectorAll('[data-testid="composer-editor"]')) {
    editor.setAttribute('aria-placeholder', options.composerPlaceholder);
  }
  for (const element of section.querySelectorAll('[aria-label], [title]')) {
    for (const attribute of ['aria-label', 'title']) {
      const label = element.getAttribute(attribute);
      if (!label) continue;
      let updated = label;
      for (const key of ['firstThread', 'pinThread', 'thirdThread', 'fourthThread', 'fifthThread', 'projectName', 'projectAvatar', 'branchName', 'activeBranch', 'thirdBranch', 'fourthBranch', 'unpinAction', 'pinAction']) {
        if (options[key] !== defaults[key]) updated = updated.replaceAll(defaults[key], String(options[key]));
      }
      if (updated !== label) element.setAttribute(attribute, updated);
    }
  }
}
const clock = { frame: 0 };
function draw() {
  const frame = Math.round(clock.frame);
  const menuFrame = Number(options.menuFrame);
  const pinFrame = Math.max(Number(options.pinFrame), menuFrame + 1);
  const unpinMenuFrame = Math.max(Number(options.unpinMenuFrame), pinFrame + 5);
  const phase = frame < menuFrame ? 0 : frame < pinFrame ? 1 : frame < unpinMenuFrame ? 2 : 3;
  const themeIndex = options.theme === 'light' ? 1 : 0;
  for (const [index, stage] of stages.entries()) stage.hidden = index !== themeIndex;
  for (const variant of sections) {
    for (const [index, section] of variant.entries()) section.hidden = index !== phase;
  }
  const elapsed = (frame - pinFrame) * 1000 / 30;
  const progress = Math.max(0, Math.min(1, elapsed / 150));
  // The native sidebar uses a 150ms CSS ease-out timing curve for its two row moves.
  let low = 0, high = 1;
  for (let index = 0; index < 20; index++) {
    const middle = (low + high) / 2;
    const inverse = 1 - middle;
    const x = 3 * inverse * middle * middle * 0.58 + middle * middle * middle;
    if (x < progress) low = middle; else high = middle;
  }
  const curveTime = (low + high) / 2;
  const inverse = 1 - curveTime;
  const eased = 3 * inverse * curveTime * curveTime + curveTime * curveTime * curveTime;
  for (const variant of movingRows) for (const { row, offset } of variant) {
    row.style.transform = progress < 1 ? 'translateY(' + (offset * (1 - eased)) + 'px)' : '';
  }
  for (const [index, { target, pinIcon, third }] of pinStartHover.entries()) {
    const atPinStart = index === 0 && frame === pinFrame;
    for (const element of target) {
      const showing = element.classList.contains('group-hover/sidebar-row:opacity-100');
      element.style.opacity = atPinStart ? (showing ? '1' : '0') : '';
      if (element.classList.contains('group-hover/sidebar-row:absolute') || element.classList.contains('group-hover/sidebar-row:static')) {
        element.style.position = atPinStart ? (showing ? 'static' : 'absolute') : '';
      }
    }
    if (pinIcon) pinIcon.style.opacity = atPinStart ? '0' : '';
    if (Number(options.seamToUnpin) !== 1) for (const element of third) {
      const showing = element.classList.contains('group-hover/sidebar-row:opacity-100');
      element.style.opacity = atPinStart ? (showing ? '0.25' : '0.75') : (showing ? '1' : '0');
    }
  }
}
draw();
const timeline = gsap.timeline({ paused: true });
timeline.to(clock, { frame: 120, duration: 4, ease: 'none', onUpdate: draw });
window.__timelines['${name}'] = timeline;
</script>
</template>
</body>
</html>
`;

await mkdir(resolve(output, "licenses"), { recursive: true });
await writeFile(resolve(output, `${name}.html`), html);
await writeFile(resolve(output, "t3-code-gsap.min.js"), gsap);
await copyFile(resolve(root, "parity/t3-gallery/assets/T3-CODE-LICENSE.txt"), resolve(output, "licenses/T3-CODE-LICENSE.txt"));
await copyFile(resolve(root, "registry/blocks/t3-thread-pin/licenses/T3-THIRD_PARTY_NOTICES.md"), resolve(output, "licenses/T3-THIRD_PARTY_NOTICES.md"));
await writeFile(resolve(output, "registry-item.json"), `${JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: Thread Pin",
  description: "Pin a Hyfrme thread through T3 Code's sidebar context menu, then see it move to the top and reveal the native Unpin action.",
  tags: ["composition", "app-ui", "t3-code", "thread-pin", "hyfrme-port"],
  author: "Hyfrme", authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT",
  dimensions: fixture.viewport, duration: fixture.frames / fixture.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    { path: "licenses/T3-CODE-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt", type: "hyperframes:asset" },
    { path: "licenses/T3-THIRD_PARTY_NOTICES.md", target: "THIRD_PARTY_LICENSES/t3-code/T3-THIRD_PARTY_NOTICES.md", type: "hyperframes:asset" },
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2)}\n`);
await writeFile(resolve(output, "README.md"), `# T3 Code: Thread Pin\n\nThis four-second, 1200 × 659 block reproduces T3 Code v${fixture.sourceTag.slice(1)} at 30 fps. Right-clicking the unpinned row opens its sidebar context menu beside the row. Pin moves the thread to the top through the native 150 ms row transition, and the menu then offers Unpin thread. The theme variable selects independently captured dark or light source states.\n\nCustomize theme, project, branch, thread titles and ages, conversation content, composer copy, menu actions, and the three interaction beats through HyperFrames variables. Match the project and thread values with adjacent T3 Code blocks for continuity. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. Installed files include T3 Code's MIT license and third-party icon notice. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.\n`);
console.log(`Generated ${name} from four native T3 Code states and two action menu portals.`);
