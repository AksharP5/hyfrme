import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-thread-unpin";
const output = resolve(root, ".work/t3-thread-unpin-v0042-candidate");
const fixture = JSON.parse(await readFile(resolve(source, "thread-unpin-fixture.json"), "utf8"));
const lightFixture = JSON.parse(await readFile(resolve(source, "thread-unpin-light-fixture.json"), "utf8"));
if (JSON.stringify(lightFixture.events) !== JSON.stringify(fixture.events)) throw new Error("Dark and light event frames differ");
const rowOffset = (motions, title) => {
  const entry = motions.find(({ row }) => row.includes(title));
  const match = entry?.keyframes[0]?.match(/^translateY\((-?[\d.]+)px\)$/);
  if (!match || entry.durationMs !== 150) throw new Error(`Native Unpin motion missing for ${title}`);
  return Number(match[1]);
};
const motionOffsets = [fixture.motion, lightFixture.motion].map((motions) => [
  rowOffset(motions, fixture.targetThread), rowOffset(motions, "Build a logo intro"),
]);
const theme = JSON.parse(await readFile(resolve(source, "dark-theme.json"), "utf8"));
const lightTheme = JSON.parse(await readFile(resolve(source, "light-theme.json"), "utf8"));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const phases = fixture.phases;
const states = await Promise.all(phases.map((phase) => readFile(resolve(source, `thread-unpin-${phase}.html`), "utf8")));
for (let index = 0; index < states.length; index++) {
  states[index] = states[index].replace(/(<span[^>]*class="[^"]*\[text-box:trim-both_cap_alphabetic\][^"]*")/g, "$1 data-layout-ignore");
}
states[0] = states[0].replace(
  'group-hover:opacity-100"><div class="flex shrink-0 items-center gap-2">',
  'group-hover:opacity-100" style="opacity:1"><div class="flex shrink-0 items-center gap-2">',
);
for (const index of [1, 3]) states[index] = states[index].replace("<main ", "<main data-layout-ignore ");
const portals = await Promise.all(["unpin-menu", "pin-menu"].map(async (phase) =>
  (await readFile(resolve(source, `thread-unpin-${phase}-portal.html`), "utf8"))
    .replaceAll('<div class="dropdown-glass', '<div data-layout-ignore class="dropdown-glass')));

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["projectAvatar", "Project avatar letters", "HE"],
  ["branchName", "Branch name", "main"],
  ["activeBranch", "Active branch", "feature/logo-enter"],
  ["thirdBranch", "Third thread branch", "logo/assemble"],
  ["fourthBranch", "Fourth thread branch", "logo/hold-final"],
  ["firstThread", "Initial thread", "Build a logo intro"],
  ["targetThread", "Thread to unpin", "Catalog motion audit"],
  ["thirdThread", "Third thread", "Grouped logo tests"],
  ["fourthThread", "Fourth thread", "Review final hold"],
  ["fifthThread", "Fifth thread", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ["firstAge", "Initial thread age", "10h"],
  ["targetAge", "Pinned thread age", "12h"],
  ["thirdAge", "Third thread age", "17h"],
  ["fourthAge", "Fourth thread age", "1d"],
  ["fifthAge", "Fifth thread age", "2d"],
  ["settledAge", "Settled thread age", "7h"],
  ["targetQuestion", "Pinned thread user message", "Which Hyfrme motion blocks need a fresh parity render?"],
  ["targetReply", "Pinned thread answer", "Logo Enter and Answer Stream should be checked at their final frames. Their pinned reference and Hyfrme output must use matching dimensions, frame rate, and input values."],
  ["targetQuestionTime", "Pinned thread user message time", "yesterday at 7:24 PM"],
  ["targetReplyTime", "Pinned thread answer time", "yesterday at 7:26 PM"],
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
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "theme", type: "string", label: "T3 Code appearance", default: "dark", options: ["dark", "light"] },
  { id: "menuFrame", type: "number", label: "Open Unpin menu at frame", default: fixture.events.menu, min: 0, max: 105, step: 1 },
  { id: "unpinFrame", type: "number", label: "Unpin thread at frame", default: fixture.events.unpin, min: 1, max: 110, step: 1 },
  { id: "pinMenuFrame", type: "number", label: "Show Pin action at frame", default: fixture.events.pinMenu, min: 1, max: 119, step: 1 },
];
const defaults = Object.fromEntries(variables.map(({ id, default: value }) => [id, value]));
const replacements = Object.fromEntries(fields.map(([id, , value]) => [value, id]));
const fontTheme = Object.fromEntries(Object.entries(theme).filter(([key]) =>
  key.includes("font-family") || key === "--font-sans" || key === "--font-mono"));
const stageTheme = Object.entries(theme).map(([key, value]) => `${key}:${value};`).join("");
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
  .t3-stage { ${stageTheme} position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--background); color: var(--foreground); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
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
  <div class="dark t3-stage">
    <div class="t3-state" data-t3-state="pinned">${states[0]}</div>
    <div class="t3-state" data-t3-state="unpin-menu" data-layout-ignore hidden>${states[1]}${portals[0]}</div>
    <div class="t3-state" data-t3-state="unpinned" hidden>${states[2]}</div>
    <div class="t3-state" data-t3-state="pin-menu" data-layout-ignore hidden>${states[3]}${portals[1]}</div>
  </div>
</div>
<script src="t3-code-gsap.min.js"></script>
<script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
const stage = document.querySelector('#root .t3-stage');
if (options.theme === 'light') {
  stage.classList.remove('dark');
  stage.classList.add('light');
  for (const [key, value] of Object.entries(${scriptJson(lightTheme)})) stage.style.setProperty(key, value);
}
for (const [key, value] of Object.entries(${scriptJson(fontTheme)})) stage.style.setProperty(key, value);
stage.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
const replacements = ${scriptJson(replacements)};
const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
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
const sections = [...stage.querySelectorAll('[data-t3-state]')];
const movingRows = [options.targetThread, options.firstThread].map((title, index) => {
  const row = [...sections[2].querySelectorAll('[data-testid="sidebar-row-card"]')]
    .find((element) => element.textContent.includes(title))?.closest('[data-thread-item="true"]');
  if (!row) throw new Error('Unpin motion row missing: ' + title);
  return { row, index };
});
for (const section of [sections[1], sections[3]]) {
  const row = [...section.querySelectorAll('[data-testid="sidebar-row-card"]')]
    .find((element) => element.textContent.includes(options.targetThread));
  if (!row) continue;
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
for (const section of sections) {
  for (const editor of section.querySelectorAll('[data-testid="composer-editor"]')) {
    editor.setAttribute('aria-placeholder', options.composerPlaceholder);
  }
  for (const element of section.querySelectorAll('[aria-label], [title]')) {
    for (const attribute of ['aria-label', 'title']) {
      const label = element.getAttribute(attribute);
      if (!label) continue;
      let updated = label;
      for (const key of ['firstThread', 'targetThread', 'thirdThread', 'fourthThread', 'fifthThread', 'projectName', 'projectAvatar', 'branchName', 'activeBranch', 'thirdBranch', 'fourthBranch', 'unpinAction', 'pinAction']) {
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
  const unpinFrame = Math.max(Number(options.unpinFrame), menuFrame + 1);
  const pinMenuFrame = Math.max(Number(options.pinMenuFrame), unpinFrame + 1);
  const phase = frame < menuFrame ? 0 : frame < unpinFrame ? 1 : frame < pinMenuFrame ? 2 : 3;
  for (let index = 0; index < sections.length; index++) sections[index].hidden = index !== phase;
  const elapsed = (frame - unpinFrame) * 1000 / 30;
  const progress = Math.max(0, Math.min(1, elapsed / 150));
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
  const offsets = ${scriptJson(motionOffsets)}[options.theme === 'light' ? 1 : 0];
  for (const { row, index } of movingRows) {
    row.style.transform = progress < 1 ? 'translateY(' + (offsets[index] * (1 - eased)) + 'px)' : '';
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
await copyFile(resolve(root, "public/ideas/assets/T3-CODE-LICENSE.txt"), resolve(output, "licenses/T3-CODE-LICENSE.txt"));
await copyFile(resolve(root, "registry/blocks/t3-thread-unpin/licenses/T3-THIRD_PARTY_NOTICES.md"), resolve(output, "licenses/T3-THIRD_PARTY_NOTICES.md"));
await writeFile(resolve(output, "registry-item.json"), `${JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: Thread Unpin",
  description: "Unpin a Hyfrme thread through T3 Code's real sidebar context menu, then see it return to active ordering and reveal the native Pin action.",
  tags: ["composition", "app-ui", "t3-code", "thread-unpin", "hyfrme-port"],
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
await writeFile(resolve(output, "README.md"), `# T3 Code: Thread Unpin\n\nThis four-second, 1200 × 659 block reproduces T3 Code v${fixture.sourceTag.slice(1)} at 30 fps. Right-clicking the pinned row opens its sidebar context menu beside the row. Unpin restores normal ordering and the menu then offers Pin thread.\n\nCustomize project, branch, thread titles and ages, conversation content, composer copy, menu actions, and the three interaction beats through HyperFrames variables. Match the project and thread values with adjacent T3 Code blocks for continuity. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. Installed files include T3 Code's MIT license and third-party icon notice. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.\n`);
console.log(`Generated ${name} from four native T3 Code states and two action menu portals.`);
