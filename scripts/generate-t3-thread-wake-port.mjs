import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.35");
const name = "t3-thread-wake";
const output = resolve(root, ".work/t3-thread-wake-candidate");
const fixture = JSON.parse(await readFile(resolve(source, "thread-wake-fixture.json"), "utf8"));
const theme = JSON.parse(await readFile(resolve(source, "dark-theme.json"), "utf8"));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const phases = fixture.phases;
const states = await Promise.all(phases.map((phase) => readFile(resolve(source, `thread-wake-${phase}.html`), "utf8")));
states[2] = states[2].replace("<main ", "<main data-layout-ignore ");
const menuPortal = (await readFile(resolve(source, "thread-wake-menu-portal.html"), "utf8"))
  .replaceAll('<div class="dropdown-glass', '<div data-layout-ignore class="dropdown-glass');

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["branchName", "Branch name", "main"],
  ["activeBranch", "Active branch", "feature/logo-enter"],
  ["thirdBranch", "Third thread branch", "logo/assemble"],
  ["fourthBranch", "Fourth thread branch", "logo/hold-final"],
  ["firstThread", "First active thread", "Build a logo intro"],
  ["wakeThread", "Thread to wake", "Catalog motion audit"],
  ["thirdThread", "Third thread", "Grouped logo tests"],
  ["fourthThread", "Fourth thread", "Review final hold"],
  ["fifthThread", "Fifth thread", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ["firstAge", "First active thread age", "8h"],
  ["wakeAge", "Thread age after wake", "10h"],
  ["thirdAge", "Third thread age", "15h"],
  ["fourthAge", "Fourth thread age", "1d"],
  ["fifthAge", "Fifth thread age", "2d"],
  ["settledAge", "Settled thread age", "7h"],
  ["wakeCountdown", "Snooze wake countdown", "3h"],
  ["question", "Selected thread user message", "Which Hyfrme motion blocks need a fresh parity render?"],
  ["reply", "Selected thread answer", "Logo Enter and Answer Stream should be checked at their final frames. Their pinned reference and Hyfrme output must use matching dimensions, frame rate, and input values."],
  ["questionTime", "User message time", "yesterday at 7:24 PM"],
  ["replyTime", "Answer time", "yesterday at 7:26 PM"],
  ["composerPlaceholder", "Composer placeholder", "Enable a provider in Settings to send a message"],
  ["providerStatus", "Provider status", "No provider available"],
  ["permissionMode", "Permission", "Full access"],
  ["workspaceMode", "Workspace", "Worktree"],
  ["snoozedShelfCount", "Collapsed Snoozed shelf label", "Snoozed (1)"],
  ["snoozedShelf", "Expanded Snoozed shelf label", "Snoozed"],
  ["bannerTitle", "Snoozed banner title", "This thread is snoozed"],
  ["bannerDescription", "Snoozed banner description", "Sending a message wakes it and moves it back to Active in the sidebar."],
  ["bannerWake", "Banner wake action", "Wake now"],
  ["rowWakeAction", "Snoozed row wake action", "Wake thread now"],
  ["pinAction", "Pin menu action", "Pin thread"],
  ["settleAction", "Settle menu action", "Settle thread"],
  ["wakeAction", "Wake menu action", "Wake thread"],
  ["renameAction", "Rename menu action", "Rename thread"],
  ["regenerateAction", "Regenerate menu action", "Regenerate title"],
  ["unreadAction", "Unread menu action", "Mark unread"],
  ["copyAction", "Copy menu action", "Copy"],
  ["archiveAction", "Archive menu action", "Archive thread"],
  ["deleteAction", "Delete menu action", "Delete"],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "expandedFrame", type: "number", label: "Expand Snoozed shelf at frame", default: fixture.events.expanded, min: 0, max: 100, step: 1 },
  { id: "menuFrame", type: "number", label: "Open action menu at frame", default: fixture.events.menu, min: 0, max: 110, step: 1 },
  { id: "wakeFrame", type: "number", label: "Wake thread at frame", default: fixture.events.woke, min: 3, max: 119, step: 1 },
];
const defaults = Object.fromEntries(variables.map(({ id, default: value }) => [id, value]));
const replacements = Object.fromEntries(fields
  .filter(([id]) => !["snoozedShelf", "snoozedShelfCount"].includes(id))
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
    <div class="t3-state" data-t3-state="collapsed">${states[0]}</div>
    <div class="t3-state" data-t3-state="expanded" hidden>${states[1]}</div>
    <div class="t3-state" data-t3-state="menu" hidden>${states[2]}${menuPortal}</div>
    <div class="t3-state" data-t3-state="woke" hidden>${states[3]}</div>
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
for (const section of sections) {
  const shelfTitle = section.querySelector('[data-testid="sidebar-snoozed-shelf-toggle"] span');
  if (shelfTitle) shelfTitle.textContent = section.dataset.t3State === 'collapsed' ? options.snoozedShelfCount : options.snoozedShelf;
  for (const editor of section.querySelectorAll('[data-testid="composer-editor"]')) {
    editor.setAttribute('aria-placeholder', options.composerPlaceholder);
  }
  for (const element of section.querySelectorAll('[aria-label], [title]')) {
    for (const attribute of ['aria-label', 'title']) {
      const label = element.getAttribute(attribute);
      if (!label) continue;
      let updated = label;
      for (const key of ['firstThread', 'wakeThread', 'thirdThread', 'fourthThread', 'fifthThread', 'projectName', 'branchName', 'activeBranch', 'thirdBranch', 'fourthBranch', 'rowWakeAction']) {
        if (options[key] !== defaults[key]) updated = updated.replaceAll(defaults[key], String(options[key]));
      }
      if (updated !== label) element.setAttribute(attribute, updated);
    }
  }
}
const clock = { frame: 0 };
function draw() {
  const frame = Math.round(clock.frame);
  const expandedFrame = Number(options.expandedFrame);
  const menuFrame = Math.max(Number(options.menuFrame), expandedFrame);
  const wakeFrame = Math.max(Number(options.wakeFrame), menuFrame + 1);
  const phase = frame < expandedFrame ? 0 : frame < menuFrame ? 1 : frame < wakeFrame ? 2 : 3;
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
await copyFile(resolve(root, "parity/t3-gallery/assets/T3-CODE-LICENSE.txt"), resolve(output, "licenses/T3-CODE-LICENSE.txt"));
await copyFile(resolve(source, "thread-rename-t3-third-party-notices.md"), resolve(output, "licenses/T3-THIRD_PARTY_NOTICES.md"));
await copyFile(resolve(root, "registry/blocks/t3-git-push/licenses/VSCODE-ICONS-LICENSE.txt"), resolve(output, "licenses/VSCODE-ICONS-LICENSE.txt"));
await writeFile(resolve(output, "registry-item.json"), `${JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: Thread Wake",
  description: "Wake a snoozed Hyfrme thread through T3 Code's real action menu and restore it to Active.",
  tags: ["composition", "app-ui", "t3-code", "thread-wake", "hyfrme-port"],
  author: "Hyfrme", authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT",
  dimensions: fixture.viewport, duration: fixture.frames / fixture.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    { path: "licenses/T3-CODE-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt", type: "hyperframes:asset" },
    { path: "licenses/T3-THIRD_PARTY_NOTICES.md", target: "THIRD_PARTY_LICENSES/t3-code/T3-THIRD_PARTY_NOTICES.md", type: "hyperframes:asset" },
    { path: "licenses/VSCODE-ICONS-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/VSCODE-ICONS-LICENSE.txt", type: "hyperframes:asset" },
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2)}\n`);
await writeFile(resolve(output, "README.md"), `# T3 Code: Thread Wake\n\nThis four-second, 1200 × 659 block reproduces T3 Code v${fixture.sourceTag.slice(1)} at 30 fps. A snoozed Hyfrme thread expands its shelf, opens the native action menu, and wakes back into Active.\n\nCustomize project, branch, thread titles and ages, conversation, sidebar, menu, banner, and the three interaction beats through HyperFrames variables. Match project and thread values with adjacent T3 Code blocks for continuity. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. Installed files include T3 Code's MIT license, exact third-party notice, and the full vscode-icons MIT license. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.\n`);
console.log(`Generated ${name} from four native T3 Code states and its real action-menu portal.`);
