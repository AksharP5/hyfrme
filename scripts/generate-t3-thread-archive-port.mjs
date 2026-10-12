import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.35");
const name = "t3-thread-archive";
const output = resolve(root, ".work/t3-thread-archive-candidate");
const fixture = JSON.parse(await readFile(resolve(source, "thread-archive-fixture.json"), "utf8"));
const theme = JSON.parse(await readFile(resolve(source, "dark-theme.json"), "utf8"));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const phases = fixture.phases;
const states = await Promise.all(phases.map((phase) => readFile(resolve(source, `thread-archive-${phase}.html`), "utf8")));
const menu = (await readFile(resolve(source, "thread-archive-menu-portal.html"), "utf8"))
  .replaceAll('<div class="dropdown-glass', '<div data-layout-ignore class="dropdown-glass');
states[1] = states[1].replace("<main ", "<main data-layout-ignore ");

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["branchName", "Branch name", "main"],
  ["targetThread", "Thread to archive", "Build a logo intro"],
  ["threadTwo", "Sidebar thread 2", "Catalog motion audit"],
  ["threadThree", "Sidebar thread 3", "Grouped logo tests"],
  ["threadFour", "Sidebar thread 4", "Review final hold"],
  ["threadFive", "Sidebar thread 5", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ["targetAge", "Archived thread age", "7h"],
  ["threadTwoAge", "Sidebar thread 2 age", "9h"],
  ["threadThreeAge", "Sidebar thread 3 age", "14h"],
  ["threadFourAge", "Sidebar thread 4 age", "1d"],
  ["threadFiveAge", "Sidebar thread 5 age", "2d"],
  ["settledAge", "Settled thread age", "6h"],
  ["userMessage", "Archived thread prompt", "Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames."],
  ["replyLead", "Archived answer before file", "I found the Logo Enter timing in"],
  ["replyFile", "Archived answer file label", "logo-enter.html"],
  ["replyFilePath", "Archived answer file path", "registry/blocks/logo-enter/logo-enter.html"],
  ["replyTail", "Archived answer after file", ". The final pass can extend the duration while keeping the last rendered frame still."],
  ["userMessageTime", "Archived prompt time", "yesterday at 9:22 PM"],
  ["replyTime", "Archived answer time", "yesterday at 9:24 PM"],
  ["workedFor", "Archived thread work duration", "Worked for 2m"],
  ["headerAction", "Header action", "Commit & push"],
  ["selectedComposer", "Selected thread composer", "Enable a provider in Settings to send a message"],
  ["providerStatus", "Provider status", "No provider available"],
  ["workspaceMode", "Workspace mode", "Worktree"],
  ["permissionMode", "Permission mode", "Full access"],
  ["draftTitle", "Draft title", "New thread"],
  ["draftHeadingPrefix", "Draft heading", "What should we build in"],
  ["draftComposer", "Draft composer", "Ask for changes, send follow-ups, or attach images"],
  ["draftModel", "Draft model", "GPT-5.6-Sol"],
  ["draftEffort", "Draft effort", "Low"],
  ["draftCheckout", "Draft checkout", "Current checkout"],
  ["settingsTitle", "Settings title", "Settings"],
  ["archiveSection", "Settings archive section", "Archive"],
  ["archivedHeading", "Archived page title", "Archived threads"],
  ["archiveAge", "Archived row timestamp", "Archived just now · Created 8h ago"],
  ["unarchiveAction", "Unarchive button", "Unarchive"],
  ["emptyTitle", "Empty archive title", "No archived threads"],
  ["emptyDescription", "Empty archive description", "Archived threads will appear here."],
  ["pinAction", "Pin menu action", "Pin thread"],
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
  { id: "menuFrame", type: "number", label: "Open action menu at frame", default: fixture.events.menu, min: 1, max: 112, step: 1 },
  { id: "archiveFrame", type: "number", label: "Archive thread at frame", default: fixture.events.archive, min: 2, max: 114, step: 1 },
  { id: "archiveListFrame", type: "number", label: "Show archived threads at frame", default: fixture.events.archivedList, min: 3, max: 116, step: 1 },
  { id: "unarchiveFrame", type: "number", label: "Unarchive thread at frame", default: fixture.events.unarchive, min: 4, max: 119, step: 1 },
];
const defaults = Object.fromEntries(variables.map(({ id, default: value }) => [id, value]));
const replacements = Object.fromEntries(fields
  .filter(([id]) => (!id.endsWith("Age") || id === "archiveAge") && id !== "replyFilePath")
  .map(([id, , value]) => [value, id]));
const fontTheme = Object.fromEntries(Object.entries(theme).filter(([key]) =>
  key.includes("font-family") || key === "--font-sans" || key === "--font-mono"));
const stageTheme = Object.entries(theme).map(([key, value]) => `${key}:${value};`).join("");
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
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
${states.map((body, index) => `    <div class="t3-state" data-t3-state="${phases[index]}"${index ? " hidden" : ""}>${body}${index === 1 ? menu : ""}</div>`).join("\n")}
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
const ages = new Map([
  [options.targetThread, options.targetAge], [options.threadTwo, options.threadTwoAge],
  [options.threadThree, options.threadThreeAge], [options.threadFour, options.threadFourAge],
  [options.threadFive, options.threadFiveAge],
]);
const sections = [...stage.querySelectorAll('[data-t3-state]')];
for (const section of sections) {
  section.querySelectorAll('[data-testid="sidebar-row-card"]').forEach((row) => {
    const title = row.querySelector('.mt-1 span')?.textContent?.trim();
    const age = row.querySelector('span.tabular-nums.text-secondary-label');
    if (age && ages.has(title)) age.textContent = ages.get(title);
  });
  const settledAge = section.querySelector('[data-testid="sidebar-row-slim"] .text-xs');
  if (settledAge) settledAge.textContent = options.settledAge;
  for (const editor of section.querySelectorAll('[data-testid="composer-editor"]')) {
    editor.setAttribute('aria-placeholder', section.dataset.t3State === 'archived' ? options.draftComposer : options.selectedComposer);
  }
  const file = section.querySelector('.chat-markdown-file-link');
  if (file) {
    const path = String(options.replyFilePath).replace(/^\\/+/, '');
    file.setAttribute('href', 'hyfrme-demo/' + path);
    file.setAttribute('data-markdown-copy', '\\x60' + path + '\\x60');
  }
  for (const element of section.querySelectorAll('[aria-label], [title]')) {
    for (const attribute of ['aria-label', 'title']) {
      const label = element.getAttribute(attribute);
      if (!label) continue;
      let updated = label;
      for (const key of ['targetThread', 'projectName', 'branchName', 'unarchiveAction']) {
        if (options[key] !== defaults[key]) updated = updated.replaceAll(defaults[key], String(options[key]));
      }
      if (updated !== label) element.setAttribute(attribute, updated);
    }
  }
}
const clock = { frame: 0 };
function draw() {
  const frame = Math.round(clock.frame);
  const archiveFrame = Math.max(Number(options.archiveFrame), Number(options.menuFrame) + 1);
  const archiveListFrame = Math.max(Number(options.archiveListFrame), archiveFrame + 1);
  const unarchiveFrame = Math.max(Number(options.unarchiveFrame), archiveListFrame + 1);
  const phase = frame < options.menuFrame ? 0 : frame < archiveFrame ? 1 : frame < archiveListFrame ? 2 : frame < unarchiveFrame ? 3 : 4;
  for (let index = 0; index < sections.length; index++) sections[index].hidden = index !== phase;
  if (phase < 2) {
    const chatScroll = sections[phase].querySelector('.topbar-scroll-fade');
    if (chatScroll) chatScroll.scrollTop = 9;
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
await copyFile(resolve(source, "thread-rename-t3-third-party-notices.md"), resolve(output, "licenses/T3-THIRD_PARTY_NOTICES.md"));
await copyFile(resolve(source, "source-file-open-pierre-trees-license.md"), resolve(output, "licenses/PIERRE-TREES-LICENSE.md"));
await copyFile(resolve(source, "source-file-open-pierre-trees-notice.md"), resolve(output, "licenses/PIERRE-TREES-NOTICE.md"));
await copyFile(resolve(source, "source-file-open-pierre-diffs-license.md"), resolve(output, "licenses/PIERRE-DIFFS-LICENSE.md"));
await writeFile(resolve(output, "registry-item.json"), `${JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: Thread Archive",
  description: "Archive a Hyfrme thread through T3 Code's real action menu, then find and unarchive it in Settings.",
  tags: ["composition", "app-ui", "t3-code", "thread-archive", "hyfrme-port"],
  author: "Hyfrme", authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT",
  dimensions: fixture.viewport, duration: fixture.frames / fixture.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    { path: "licenses/T3-CODE-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt", type: "hyperframes:asset" },
    { path: "licenses/T3-THIRD_PARTY_NOTICES.md", target: "THIRD_PARTY_LICENSES/t3-code/T3-THIRD_PARTY_NOTICES.md", type: "hyperframes:asset" },
    { path: "licenses/PIERRE-TREES-LICENSE.md", target: "THIRD_PARTY_LICENSES/t3-code/PIERRE-TREES-LICENSE.md", type: "hyperframes:asset" },
    { path: "licenses/PIERRE-TREES-NOTICE.md", target: "THIRD_PARTY_LICENSES/t3-code/PIERRE-TREES-NOTICE.md", type: "hyperframes:asset" },
    { path: "licenses/PIERRE-DIFFS-LICENSE.md", target: "THIRD_PARTY_LICENSES/t3-code/PIERRE-DIFFS-LICENSE.md", type: "hyperframes:asset" },
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2)}\n`);
await writeFile(resolve(output, "README.md"), `# T3 Code: Thread Archive\n\nThis four-second, 1200 × 659 block reproduces T3 Code v${fixture.sourceTag.slice(1)} at 30 fps. The Hyfrme thread is archived through its actual action menu and disappears from the active sidebar. T3 navigates to a draft. Settings > Archive then shows the retained thread and its native Unarchive control; clicking it returns the settings page to an empty archive.\n\nCustomize project, branch, thread titles and ages, conversation, draft, Settings copy, menu actions, and the four interaction beats through HyperFrames variables. Match project and thread values with adjacent T3 Code blocks for continuity. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. Installed files include T3 Code's MIT license, icon notice, and Apache-2.0 licenses for @pierre/trees and @pierre/diffs, plus the @pierre/trees notice. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.\n`);
console.log(`Generated ${name} from five native T3 Code root states and one action menu portal.`);
