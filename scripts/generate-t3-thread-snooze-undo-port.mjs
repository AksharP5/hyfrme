import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.35");
const name = "t3-thread-snooze-undo";
const output = resolve(root, ".work/t3-thread-snooze-undo-candidate");
const fixture = JSON.parse(await readFile(resolve(source, "thread-snooze-undo-fixture.json"), "utf8"));
const theme = JSON.parse(await readFile(resolve(source, "dark-theme.json"), "utf8"));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const phases = fixture.phases;
const states = await Promise.all(phases.map((phase) => readFile(resolve(source, `thread-snooze-undo-${phase}.html`), "utf8")));
for (const index of [1, 2, 3, 4]) states[index] = states[index].replace("<main ", "<main data-layout-ignore ");
const portals = await Promise.all(["menu", "submenu", "preset", "toast"].map(async (phase) =>
  (await readFile(resolve(source, `thread-snooze-undo-${phase}-portal.html`), "utf8"))
    .replaceAll('<div class="dropdown-glass', '<div data-layout-ignore class="dropdown-glass')));
portals[3] = portals[3].replace('<div id=', '<div data-layout-ignore id=');
const presetLabels = [...portals[2].matchAll(/<span[^>]*>([^<>]+)<\/span>/g)].map((match) => match[1]).filter(Boolean);
if (presetLabels.length !== 5) throw new Error(`Expected five native Snooze presets, got ${presetLabels.length}`);
const toastTitle = portals[3].match(/<h2[^>]*>([^<>]+)<\/h2>/)?.[1];
if (!toastTitle?.startsWith("Snoozed until ")) throw new Error("Native Snooze toast title missing");

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["branchName", "Branch name", "main"],
  ["activeBranch", "Active branch", "feature/logo-enter"],
  ["thirdBranch", "Third thread branch", "logo/assemble"],
  ["fourthBranch", "Fourth thread branch", "logo/hold-final"],
  ["firstThread", "First active thread", "Build a logo intro"],
  ["snoozeThread", "Thread to snooze", "Catalog motion audit"],
  ["thirdThread", "Third thread", "Grouped logo tests"],
  ["fourthThread", "Fourth thread", "Review final hold"],
  ["fifthThread", "Fifth thread", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ["firstAge", "First active thread age", "9h"],
  ["snoozeAge", "Snoozed thread age before action", "11h"],
  ["thirdAge", "Third thread age", "16h"],
  ["fourthAge", "Fourth thread age", "1d"],
  ["fifthAge", "Fifth thread age", "2d"],
  ["settledAge", "Settled thread age", "9h"],
  ["snoozedRemaining", "Snoozed time remaining", "3h"],
  ["question", "Selected thread user message", "Which Hyfrme motion blocks need a fresh parity render?"],
  ["reply", "Selected thread answer", "Logo Enter and Answer Stream should be checked at their final frames. Their pinned reference and Hyfrme output must use matching dimensions, frame rate, and input values."],
  ["questionTime", "User message time", "yesterday at 7:24 PM"],
  ["replyTime", "Answer time", "yesterday at 7:26 PM"],
  ["composerPlaceholder", "Composer placeholder", "Enable a provider in Settings to send a message"],
  ["providerStatus", "Provider status", "No provider available"],
  ["permissionMode", "Permission", "Full access"],
  ["workspaceMode", "Workspace", "Worktree"],
  ["snoozedShelfCount", "Collapsed Snoozed shelf label", "Snoozed (1)"],
  ["bannerTitle", "Snoozed banner title", "This thread is snoozed"],
  ["bannerDescription", "Snoozed banner description", "Sending a message wakes it and moves it back to Active in the sidebar."],
  ["bannerWake", "Snoozed banner action", "Wake now"],
  ["toastTitle", "Snoozed confirmation", toastTitle],
  ["toastUndo", "Toast undo action", "Undo"],
  ["pinAction", "Pin menu action", "Pin thread"],
  ["settleAction", "Settle menu action", "Settle thread"],
  ["snoozeAction", "Snooze menu action", "Snooze"],
  ["renameAction", "Rename menu action", "Rename thread"],
  ["regenerateAction", "Regenerate menu action", "Regenerate title"],
  ["unreadAction", "Unread menu action", "Mark unread"],
  ["copyAction", "Copy menu action", "Copy"],
  ["archiveAction", "Archive menu action", "Archive thread"],
  ["deleteAction", "Delete menu action", "Delete"],
  ...presetLabels.map((value, index) => [`preset${index + 1}`, `Snooze preset ${index + 1}`, value]),
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "menuFrame", type: "number", label: "Open action menu at frame", default: fixture.events.menu, min: 0, max: 95, step: 1 },
  { id: "submenuFrame", type: "number", label: "Open Snooze presets at frame", default: fixture.events.submenu, min: 1, max: 105, step: 1 },
  { id: "snoozedFrame", type: "number", label: "Choose Snooze preset at frame", default: fixture.events.snoozed, min: 1, max: 110, step: 1 },
  { id: "undoFrame", type: "number", label: "Press Undo at frame", default: fixture.events.undone, min: 1, max: 115, step: 1 },
  { id: "persistFrame", type: "number", label: "Show restored thread after reload at frame", default: fixture.events.persisted, min: 1, max: 119, step: 1 },
];
const defaults = Object.fromEntries(variables.map(({ id, default: value }) => [id, value]));
const replacements = Object.fromEntries(fields
  .filter(([id]) => !id.endsWith("Age") && id !== "snoozedRemaining")
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
    <div class="t3-state" data-t3-state="selected">${states[0]}</div>
    <div class="t3-state" data-t3-state="menu" hidden>${states[1]}${portals[0]}</div>
    <div class="t3-state" data-t3-state="submenu" hidden>${states[2]}${portals[1]}${portals[2]}</div>
    <div class="t3-state" data-t3-state="toast" hidden>${states[3]}${portals[3]}</div>
    <div class="t3-state" data-t3-state="undone" hidden>${states[4]}${portals[3]}</div>
    <div class="t3-state" data-t3-state="persisted" hidden>${states[5]}</div>
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
const ageByTitle = new Map([
  [options.firstThread, options.firstAge], [options.snoozeThread, options.snoozeAge],
  [options.thirdThread, options.thirdAge], [options.fourthThread, options.fourthAge],
  [options.fifthThread, options.fifthAge],
]);
for (const section of sections) {
  section.querySelectorAll('[data-testid="sidebar-row-card"]').forEach((row) => {
    const title = row.querySelector('.mt-1 span')?.textContent?.trim();
    const age = row.querySelector('span.tabular-nums.text-secondary-label');
    if (age && ageByTitle.has(title)) age.textContent = ageByTitle.get(title);
  });
  section.querySelectorAll('[data-testid="sidebar-row-slim"]').forEach((row) => {
    const title = row.querySelector('span.min-w-0')?.textContent?.trim();
    const age = row.querySelector('span.text-xs');
    if (title === options.snoozeThread && options.snoozedRemaining !== defaults.snoozedRemaining && age) {
      age.textContent = options.snoozedRemaining;
    }
    if (title === options.settledThread && options.settledAge !== defaults.settledAge && age) {
      age.textContent = options.settledAge;
    }
  });
  for (const editor of section.querySelectorAll('[data-testid="composer-editor"]')) {
    editor.setAttribute('aria-placeholder', options.composerPlaceholder);
  }
  for (const element of section.querySelectorAll('[aria-label], [title]')) {
    for (const attribute of ['aria-label', 'title']) {
      const label = element.getAttribute(attribute);
      if (!label) continue;
      let updated = label;
      for (const key of ['firstThread', 'snoozeThread', 'thirdThread', 'fourthThread', 'fifthThread', 'projectName', 'branchName', 'activeBranch', 'thirdBranch', 'fourthBranch']) {
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
  const submenuFrame = Math.max(Number(options.submenuFrame), menuFrame + 1);
  const snoozedFrame = Math.max(Number(options.snoozedFrame), submenuFrame + 1);
  const undoFrame = Math.max(Number(options.undoFrame), snoozedFrame + 1);
  const persistFrame = Math.max(Number(options.persistFrame), undoFrame + 1);
  const phase = frame < menuFrame ? 0 : frame < submenuFrame ? 1 : frame < snoozedFrame ? 2 : frame < undoFrame ? 3 : frame < persistFrame ? 4 : 5;
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
await copyFile(resolve(source, "thread-rename-t3-third-party-notices.md"), resolve(output, "licenses/T3-THIRD_PARTY_NOTICES.md"));
await writeFile(resolve(output, "registry-item.json"), `${JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: Snooze Undo",
  description: "Snooze a Hyfrme thread from T3 Code's native preset menu, then use the real confirmation toast to Undo and restore its sidebar row.",
  tags: ["composition", "app-ui", "t3-code", "thread-snooze-undo", "hyfrme-port"],
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
await writeFile(resolve(output, "README.md"), `# T3 Code: Snooze Undo\n\nThis four-second, 1200 × 659 block reproduces T3 Code v${fixture.sourceTag.slice(1)} at 30 fps. A Hyfrme thread opens the native action menu, chooses a Snooze preset, disappears from Active, then returns when Undo is pressed in the real five-second confirmation toast. The final state comes from a native reload after the server clears the Snooze timestamp.\n\nCustomize project, branch, thread titles and ages, conversation content, preset, toast and banner copy, and all five interaction beats through HyperFrames variables. Match project and thread values with adjacent T3 Code blocks for continuity. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. Installed files include T3 Code's MIT license and third-party icon notice. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.\n`);
console.log(`Generated ${name} from six native T3 Code states and four menu/toast portals.`);
