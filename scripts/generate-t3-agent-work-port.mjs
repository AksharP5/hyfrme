import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.35");
const name = "t3-agent-work";
const output = resolve(root, ".work/t3-agent-work-block");
const fixture = JSON.parse(await readFile(resolve(source, "agent-work-fixture.json"), "utf8"));
const theme = JSON.parse(await readFile(resolve(source, "dark-theme.json"), "utf8"));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const phases = ["thinking", "command", "detail", "collapsed"];
const states = await Promise.all(phases.map((phase) => readFile(resolve(source, `agent-work-${phase}.html`), "utf8")));
for (let index = 0; index < states.length; index++) {
  states[index] = states[index].replace(
    'class="h-full max-h-[inherit] overflow-auto',
    'data-layout-allow-overflow class="h-full max-h-[inherit] overflow-auto',
  ).replaceAll(
    '<span class="pointer-events-none absolute left-1/2 top-1/2 size-[max(100%,3rem)]',
    '<span data-layout-allow-overflow class="pointer-events-none absolute left-1/2 top-1/2 size-[max(100%,3rem)]',
  ).replaceAll(
    'class="live-activity-focus pointer-events-none',
    'data-layout-ignore class="live-activity-focus pointer-events-none',
  ).replaceAll(
    '<div class="legend-list-content-container"',
    '<div data-layout-allow-overflow class="legend-list-content-container"',
  ).replaceAll(
    'data-testid="sidebar-row-card" class="group/sidebar-row relative w-full cursor-pointer overflow-hidden rounded-md text-left outline-none select-none bg-sidebar-row-active',
    'data-layout-ignore data-testid="sidebar-row-card" class="group/sidebar-row relative w-full cursor-pointer overflow-hidden rounded-md text-left outline-none select-none bg-sidebar-row-active',
  );
}

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["branchName", "Branch name", "main"],
  ["threadOne", "Selected thread", "Build a logo intro"],
  ["threadTwo", "Sidebar thread 2", "Catalog motion audit"],
  ["threadThree", "Sidebar thread 3", "Grouped logo tests"],
  ["threadFour", "Sidebar thread 4", "Review final hold"],
  ["threadFive", "Sidebar thread 5", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ...fixture.threadAges.slice(1).map((age, index) => [`thread${index + 2}Age`, `Thread ${index + 2} age`, age]),
  ["settledAge", "Settled thread age", "5h"],
  ["userMessage", "User message", "Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames."],
  ["command", "Command", "npm run verify:showcases"],
  ["liveCommandLabel", "Live activity label", "Running npm"],
  ["thinkingLabel", "Thinking label", "Thinking"],
  ["workingStatus", "Sidebar working status", "Working"],
  ["sidebarWorkingAge", "Sidebar working age", "2m"],
  ["workingDuration", "Working duration", fixture.workingDuration],
  ["userMessageTime", "User message time", fixture.messageTimes[0]],
  ["composerPlaceholder", "Composer placeholder", "Enable a provider in Settings to send a message"],
  ["providerStatus", "Provider status", "No provider available"],
  ["permissionMode", "Permission", "Full access"],
  ["workspaceMode", "Workspace", "Worktree"],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "commandFrame", type: "number", label: "Show live command at frame", default: fixture.commandFrame, min: 0, max: 100, step: 1 },
  { id: "detailFrame", type: "number", label: "Expand command detail at frame", default: fixture.detailFrame, min: 1, max: 110, step: 1 },
  { id: "collapseFrame", type: "number", label: "Collapse command detail at frame", default: fixture.collapseFrame, min: 1, max: 119, step: 1 },
];
const defaults = Object.fromEntries(variables.map(({ id, default: value }) => [id, value]));
const textReplacements = Object.fromEntries(fields
  .filter(([id]) => !id.endsWith("Age") && !["workingStatus", "workingDuration"].includes(id))
  .map(([id, , value]) => [value, id]));
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
  .t3-stage { ${stageTheme} position: relative; width: 100%; height: 100%; overflow: hidden; background: oklch(14.5% 0 0); color: oklch(97% 0 0); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
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
    <div class="t3-state" data-t3-state="thinking">${states[0]}</div>
    <div class="t3-state" data-t3-state="command" hidden>${states[1]}</div>
    <div class="t3-state" data-t3-state="detail" hidden>${states[2]}</div>
    <div class="t3-state" data-t3-state="collapsed" hidden>${states[3]}</div>
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
  if (key && options[key] !== defaults[key]) node.textContent = node.textContent.replace(current, String(options[key]));
}
const sections = [...stage.querySelectorAll('[data-t3-state]')];
const ageKeys = [null, 'thread2Age', 'thread3Age', 'thread4Age', 'thread5Age'];
for (const section of sections) {
  section.querySelectorAll('[data-testid="sidebar-row-card"]').forEach((row, index) => {
    const age = row.querySelector('span.tabular-nums.text-secondary-label');
    if (age && ageKeys[index]) age.textContent = options[ageKeys[index]];
  });
  const settledAge = section.querySelector('[data-testid="sidebar-row-slim"] .text-xs');
  if (settledAge) settledAge.textContent = options.settledAge;
  const selected = section.querySelector('[data-testid="sidebar-row-card"]');
  const workingStatus = selected?.querySelector('span[role="status"]');
  if (workingStatus) workingStatus.textContent = options.workingStatus;
  const workingAge = selected?.querySelector('span.font-mono.tabular-nums');
  if (workingAge) workingAge.textContent = options.sidebarWorkingAge;
  const timer = section.querySelector('[data-timeline-row-kind="working"] span.tabular-nums');
  if (timer) timer.textContent = options.workingDuration;
  section.querySelectorAll('[data-timeline-row-kind="work"] [aria-label]').forEach((row) => {
    if (row.getAttribute('aria-label') === defaults.command) row.setAttribute('aria-label', options.command);
  });
  for (const editor of section.querySelectorAll('[data-testid="composer-editor"]')) {
    editor.setAttribute('aria-placeholder', options.composerPlaceholder);
  }
}
const clock = { frame: 0 };
function draw() {
  const frame = Math.round(clock.frame);
  const detailFrame = Math.max(Number(options.detailFrame), Number(options.commandFrame) + 1);
  const collapseFrame = Math.max(Number(options.collapseFrame), detailFrame + 1);
  const phase = frame < options.commandFrame ? 0 : frame < detailFrame ? 1 : frame < collapseFrame ? 2 : 3;
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
await copyFile(resolve(source, "agent-work-t3-third-party-notices.md"), resolve(output, "licenses/T3-THIRD_PARTY_NOTICES.md"));
await writeFile(resolve(output, "registry-item.json"), `${JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: Agent Work",
  description: "Show a live T3 Code agent moving from Thinking to a running command, expand its command detail, and collapse it in the full Hyfrme workspace.",
  tags: ["composition", "app-ui", "t3-code", "agent", "live-work", "hyfrme-port"],
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
await writeFile(resolve(output, "README.md"), `# T3 Code: Agent Work

This four-second, 1200 × 659 block reproduces T3 Code v${fixture.sourceTag.slice(1)} at 30 fps. A live Hyfrme agent shows Thinking, starts a command, reveals its command detail, then collapses the detail while work continues. Each state is captured from the pinned T3 Code app. It does not portray a finished answer.

Customize the project, thread, prompt, working labels, command, sidebar, footer, and phase frames through HyperFrames variables. Match project, branch, and thread values with adjacent T3 Code blocks for continuity. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. The installed files include T3 Code's MIT license and third-party icon notice. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.
`);
console.log(`Generated ${name} from four native T3 Code live-work DOM states.`);
