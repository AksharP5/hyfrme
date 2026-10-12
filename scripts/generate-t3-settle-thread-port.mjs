import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.35");
const name = "t3-settle-thread";
const output = resolve(root, "registry/blocks", name);
const fixture = JSON.parse(await readFile(resolve(source, "settle-thread-fixture.json"), "utf8"));
const theme = JSON.parse(await readFile(resolve(source, "dark-theme.json"), "utf8"));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const phases = ["selected", "hover", "settled", "collapsed", "expanded"];
const states = await Promise.all(phases.map((phase) => readFile(resolve(source, `settle-thread-${phase}.html`), "utf8")));

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["branchName", "Branch name", "main"],
  ["settledThreadTitle", "Thread to settle", "Build a logo intro"],
  ["nextThreadTitle", "Next active thread", "Catalog motion audit"],
  ["threadThree", "Sidebar thread 3", "Grouped logo tests"],
  ["threadFour", "Sidebar thread 4", "Review final hold"],
  ["threadFive", "Sidebar thread 5", "Search reveal timing"],
  ["previousSettledTitle", "Existing settled thread", "Verify Logo Enter parity"],
  ["settleActionLabel", "Settle action", "Settle"],
  ["settleTooltip", "Settle tooltip", "Settle thread"],
  ["settledThreadAge", "Thread to settle age", "4h"],
  ["nextThreadAge", "Next active thread age", "6h"],
  ["threadThreeAge", "Sidebar thread 3 age", "11h"],
  ["threadFourAge", "Sidebar thread 4 age", "1d"],
  ["threadFiveAge", "Sidebar thread 5 age", "2d"],
  ["newlySettledAge", "Newly settled age", "now"],
  ["previousSettledAge", "Existing settled age", "3h"],
  ["messageOne", "First user message", "Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames."],
  ["replyOneStart", "First reply before file", "I found the Logo Enter timing in"],
  ["replyOneFile", "First reply file", "logo-enter.html"],
  ["replyOneEnd", "First reply after file", ". The final pass can extend the duration while keeping the last rendered frame still."],
  ["messageTwo", "Next thread user message", "Which Hyfrme motion blocks need a fresh parity render?"],
  ["replyTwo", "Next thread reply", "Logo Enter and Answer Stream should be checked at their final frames. Their pinned reference and Hyfrme output must use matching dimensions, frame rate, and input values."],
  ["workedDuration", "Worked duration", "2m"],
  ["composerPlaceholder", "Composer placeholder", "Enable a provider in Settings to send a message"],
  ["providerStatus", "Provider status", "No provider available"],
  ["permissionMode", "Permission", "Full access"],
  ["workspaceMode", "Workspace", "Worktree"],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "settledCount", type: "number", label: "Collapsed settled count", default: 2, min: 0, max: 99, step: 1 },
  { id: "hoverFrame", type: "number", label: "Hover Settle at frame", default: fixture.hoverFrame, min: 0, max: 100, step: 1 },
  { id: "settleFrame", type: "number", label: "Settle thread at frame", default: fixture.settleFrame, min: 1, max: 110, step: 1 },
  { id: "collapseFrame", type: "number", label: "Collapse shelf at frame", default: fixture.collapseFrame, min: 2, max: 118, step: 1 },
  { id: "expandFrame", type: "number", label: "Expand shelf at frame", default: fixture.expandFrame, min: 3, max: 119, step: 1 },
];
const defaults = Object.fromEntries(fields.map(([id, , value]) => [id, value]));
Object.assign(defaults, {
  settledCount: 2,
  hoverFrame: fixture.hoverFrame,
  settleFrame: fixture.settleFrame,
  collapseFrame: fixture.collapseFrame,
  expandFrame: fixture.expandFrame,
});
const textReplacements = Object.fromEntries(fields.filter(([id]) => !id.endsWith("Age") && id !== "workedDuration").map(([id, , value]) => [value, id]));
const fontTheme = Object.fromEntries(Object.entries(theme).filter(([key]) => key.includes("font-family") || key === "--font-sans" || key === "--font-mono"));
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
  .t3-stage { ${stageTheme} position: relative; width: 100%; height: 100%; overflow: hidden; background: oklch(14.5% 0 0); color: oklch(97% 0 0); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
  .t3-state[hidden] { display: none !important; }
  .t3-state:not([hidden]) { display: contents; }
  .t3-native-settle-tooltip { position: absolute; z-index: 140; left: 168px; top: 116px; border: 1px solid var(--border); border-radius: 6px; background: var(--popover); color: var(--popover-foreground); padding: 3px 8px; font-size: 12px; line-height: 16px; box-shadow: 0 4px 8px rgb(0 0 0 / 0.12); }
  .base-ui-disable-scrollbar { scrollbar-width: none; }
  .base-ui-disable-scrollbar::-webkit-scrollbar { display: none; }
  @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
  @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
  @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
  @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"); }
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
  <div class="dark t3-stage">
    <svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;overflow:hidden" aria-hidden="true"><symbol id="file-tree-builtin-html" viewBox="0 0 16 16"><path fill="currentColor" d="M8 1C2.24 1 1 2.24 1 8s1.24 7 7 7 7-1.24 7-7-1.24-7-7-7" class="bg" opacity=".2"></path><path fill="currentColor" d="M10.48 3.76a.5.5 0 0 1 .4.58L10.6 5.8h1.14a.5.5 0 0 1 0 1h-1.32L10 9.2h1.08a.5.5 0 0 1 0 1H9.8l-.3 1.64a.5.5 0 1 1-.98-.18l.27-1.46H6.4l-.3 1.64a.5.5 0 1 1-.98-.18l.27-1.46H4.25a.5.5 0 0 1 0-1h1.32L6 6.8H4.93a.5.5 0 0 1 0-1H6.2l.3-1.64a.5.5 0 1 1 .98.18L7.2 5.8h2.4l.3-1.64a.5.5 0 0 1 .58-.4M6.58 9.2h2.4l.44-2.4h-2.4z" class="fg"></path></symbol></svg>
${states.map((state, index) => `    <div class="t3-state" data-t3-state="${phases[index]}"${index ? " hidden" : ""}>${state}${index === 1 ? '<div class="t3-native-settle-tooltip">Settle thread</div>' : ''}</div>`).join("\n")}
  </div>
</div>
<script src="t3-code-gsap.min.js"></script>
<script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
const stage = document.querySelector('#root .t3-stage');
for (const [key, value] of Object.entries(${scriptJson(fontTheme)})) stage.style.setProperty(key, value);
stage.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
const replacements = ${scriptJson(textReplacements)};
const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
let node;
while ((node = walker.nextNode())) {
  const current = node.textContent.trim();
  const key = replacements[current];
  if (key && options[key] !== defaults[key]) node.textContent = node.textContent.replace(current, options[key]);
}
const sections = [...stage.querySelectorAll('[data-t3-state]')];
const hoverRow = sections[1].querySelector('[data-testid="sidebar-row-card"]');
const hoverStatus = hoverRow?.querySelector('[class*="group/sidebar-status-slot"]');
if (hoverStatus?.children[0]) hoverStatus.children[0].style.opacity = '0';
if (hoverStatus?.children[1]) {
  hoverStatus.children[1].style.position = 'static';
  hoverStatus.children[1].style.opacity = '1';
  hoverStatus.children[1].style.pointerEvents = 'auto';
}
const beforeAges = ['settledThreadAge', 'nextThreadAge', 'threadThreeAge', 'threadFourAge', 'threadFiveAge'];
const afterAges = beforeAges.slice(1);
for (const [sectionIndex, section] of sections.entries()) {
  const ageKeys = sectionIndex < 2 ? beforeAges : afterAges;
  section.querySelectorAll('[data-testid="sidebar-row-card"]').forEach((row, index) => {
    const age = row.querySelector('span.tabular-nums.text-secondary-label');
    if (age && ageKeys[index]) age.textContent = options[ageKeys[index]];
  });
  section.querySelectorAll('[data-testid="sidebar-row-slim"]').forEach((row, index) => {
    const age = row.querySelector('span.text-xs');
    if (age) age.textContent = sectionIndex < 2 ? options.previousSettledAge :
      index === 0 ? options.newlySettledAge : options.previousSettledAge;
  });
  const shelf = section.querySelector('[data-testid="sidebar-settled-shelf-toggle"]');
  if (shelf && sectionIndex === 3) {
    const label = shelf.querySelector('span');
    if (label) label.textContent = 'Settled (' + Math.round(Number(options.settledCount)) + ')';
  }
  for (const editor of section.querySelectorAll('[data-testid="composer-editor"]')) {
    editor.setAttribute('aria-placeholder', options.composerPlaceholder);
  }
}
for (const section of sections.slice(0, 2)) {
  const worked = [...section.querySelectorAll('span')].find((element) => element.textContent === 'Worked for 2m');
  if (worked) worked.textContent = 'Worked for ' + options.workedDuration;
}
const clock = { frame: 0 };
function draw() {
  const frame = Math.round(clock.frame);
  const hover = Number(options.hoverFrame);
  const settle = Math.max(Number(options.settleFrame), hover + 1);
  const collapse = Math.max(Number(options.collapseFrame), settle + 1);
  const expand = Math.max(Number(options.expandFrame), collapse + 1);
  const phase = frame < hover ? 0 : frame < settle ? 1 : frame < collapse ? 2 : frame < expand ? 3 : 4;
  for (let index = 0; index < sections.length; index++) sections[index].hidden = index !== phase;
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
await writeFile(resolve(output, "registry-item.json"), `${JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name,
  type: "hyperframes:block",
  title: "T3 Code: Settle a Thread",
  description: "Settle a finished thread in the real T3 Code workspace, then inspect the updated Settled shelf.",
  tags: ["composition", "app-ui", "t3-code", "settle-thread", "hyfrme-port"],
  author: "Hyfrme",
  authorUrl: "https://github.com/AksharP5/hyfrme",
  license: "MIT",
  dimensions: fixture.viewport,
  duration: fixture.frames / fixture.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    { path: "licenses/T3-CODE-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt", type: "hyperframes:asset" },
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2)}\n`);
await writeFile(resolve(output, "README.md"), `# T3 Code: Settle a Thread\n\nThis four-second block reproduces the native T3 Code v${fixture.sourceTag.slice(1)} Settle action at 1200 × 659 and 30 fps. The finished Hyfrme thread moves from the active sidebar to Settled, selection advances to the next active thread, and the shelf closes to show the new count before reopening. All workspace and conversation copy, sidebar labels and ages, settled count, and action timing are editable.\n\nKeep the same project and thread variables across adjacent T3 Code blocks for seamless clips. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. The installed files include T3 Code's MIT license. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.\n`);
console.log(`Generated ${name} from the pinned T3 Code Settle UI.`);
