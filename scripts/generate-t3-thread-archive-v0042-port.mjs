import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-thread-archive";
const output = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, ".work/t3-thread-archive-v0042-candidate"));
const fixtures = Object.fromEntries(await Promise.all(["dark", "light"].map(async (theme) => [theme,
  JSON.parse(await readFile(resolve(source, `thread-archive-v0042-${theme}-fixture.json`), "utf8")),
])));
const { dark, light } = fixtures;
if (dark.sourceCommit !== light.sourceCommit || dark.frames !== light.frames || dark.fps !== light.fps ||
  JSON.stringify(dark.events) !== JSON.stringify(light.events)) throw new Error("Official theme fixtures differ");
const themes = Object.fromEntries(await Promise.all(["dark", "light"].map(async (theme) => [theme,
  JSON.parse(await readFile(resolve(source, `${theme}-theme.json`), "utf8")),
])));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const phases = dark.phases;
const sprite = (await readFile(resolve(source, "file-surface-tree.html"), "utf8"))
  .match(/<symbol id="file-tree-builtin-html"[\s\S]*?<\/symbol>/)?.[0];
if (!sprite) throw new Error("Official T3 Code HTML file icon is missing");
const states = Object.fromEntries(await Promise.all(["dark", "light"].map(async (theme) => [theme,
  await Promise.all(phases.map(async (phase) => {
    let body = await readFile(resolve(source, `thread-archive-v0042-${theme}-${phase}.html`), "utf8");
    body = body.replace('class="h-full max-h-[inherit] overflow-auto', 'data-layout-allow-overflow class="h-full max-h-[inherit] overflow-auto')
      .replace(/(<span[^>]*class="[^"]*\[text-box:trim-both_cap_alphabetic\][^"]*")/g, "$1 data-layout-ignore")
      .replace(/(<span[^>]*class="pointer-events-none absolute[^"]*")/g, "$1 data-layout-allow-overflow");
    if (phase === "menu") {
      body = body.replace('<div class="group/sidebar-wrapper', '<div data-layout-ignore class="group/sidebar-wrapper');
      const portal = await readFile(resolve(source, `thread-archive-v0042-${theme}-menu-portal.html`), "utf8");
      body += portal.replace('<div ', '<div data-layout-ignore ');
    }
    return body;
  })),
])));

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["projectAvatar", "Project avatar", "HE"],
  ["branchName", "Branch name", "main"],
  ["targetThread", "Thread to archive", "Build a logo intro"],
  ["threadTwo", "Sidebar thread 2", "Catalog motion audit"],
  ["threadThree", "Sidebar thread 3", "Grouped logo tests"],
  ["threadFour", "Sidebar thread 4", "Review final hold"],
  ["threadFive", "Sidebar thread 5", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ["targetAge", "Archived thread age", "10h"],
  ["threadTwoAge", "Sidebar thread 2 age", "12h"],
  ["threadThreeAge", "Sidebar thread 3 age", "17h"],
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
  ["headerAction", "Header action", "Commit"],
  ["selectedComposer", "Selected thread composer", "Enable a provider in Settings to send a message"],
  ["providerStatus", "Provider status", "Open provider settings"],
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
  ["archiveAge", "Archived row timestamp", "Archived just now · Created 11h ago"],
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
  { id: "theme", type: "string", label: "T3 Code appearance", default: "dark", options: ["dark", "light"] },
  { id: "menuFrame", type: "number", label: "Open action menu at frame", default: dark.events.menu, min: 1, max: 112, step: 1 },
  { id: "archiveFrame", type: "number", label: "Archive thread at frame", default: dark.events.archive, min: 2, max: 114, step: 1 },
  { id: "archiveListFrame", type: "number", label: "Show archived threads at frame", default: dark.events.archivedList, min: 3, max: 116, step: 1 },
  { id: "unarchiveFrame", type: "number", label: "Unarchive thread at frame", default: dark.events.unarchive, min: 4, max: 119, step: 1 },
];
const defaults = Object.fromEntries(variables.map(({ id, default: value }) => [id, value]));
const replacements = Object.fromEntries(fields
  .filter(([id]) => (!id.endsWith("Age") || id === "archiveAge") && id !== "replyFilePath")
  .map(([id, , value]) => [value, id]));
const fontTheme = Object.fromEntries(Object.entries(themes.dark).filter(([key]) =>
  key.includes("font-family") || key === "--font-sans" || key === "--font-mono"));
const themeStyles = Object.fromEntries(Object.entries(themes).map(([theme, values]) => [theme,
  Object.entries(values).map(([key, value]) => `${key}:${value};`).join(""),
]));
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
  .t3-stage { position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--background); color: var(--foreground); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
  .t3-stage[hidden], .t3-state[hidden], .t3-native-popup[hidden] { display: none !important; }
  .t3-native-popup { position:absolute; left:363px; top:37px; width:185px; height:353px; z-index:10001; pointer-events:none; }
  .t3-state:not([hidden]) { display: contents; }
  .base-ui-disable-scrollbar { scrollbar-width: none; }
  .base-ui-disable-scrollbar::-webkit-scrollbar { display: none; }
  @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
  @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
  @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
  @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"); }
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
  <svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;overflow:hidden" aria-hidden="true" data-layout-ignore>${sprite}</svg>
${["dark", "light"].map((theme) => `<div class="t3-stage ${theme}" data-t3-theme="${theme}" style="${themeStyles[theme].replaceAll('"', '&quot;')}"${theme === "light" ? " hidden" : ""}>
${states[theme].map((body, index) => `<div class="t3-state" data-t3-state="${phases[index]}"${index ? " hidden" : ""}>${body}</div>`).join("\n")}
<img class="t3-native-popup" data-t3-popup="menu" src="thread-archive-v0042-${theme}-menu-crop.png" alt="" aria-hidden="true" data-layout-ignore hidden>
</div>`).join("\n")}
</div>
<script src="t3-code-gsap.min.js"></script>
<script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
const stages = [...document.querySelectorAll('#root [data-t3-theme]')];
const nativePopupAllowed = Object.keys(defaults).every(key => key === 'theme' || key.endsWith('Frame') || options[key] === defaults[key]);
for (const stage of stages) {
  stage.hidden = stage.dataset.t3Theme !== options.theme;
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
  if (file && options.replyFilePath !== defaults.replyFilePath) {
    const path = String(options.replyFilePath).replace(/^\\/+/, '');
    file.setAttribute('href', path);
    file.setAttribute('data-markdown-copy', '\\x60' + path + '\\x60');
  }
  for (const element of section.querySelectorAll('[aria-label], [title]')) {
    for (const attribute of ['aria-label', 'title']) {
      const label = element.getAttribute(attribute);
      if (!label) continue;
      let updated = label;
      for (const key of ['targetThread', 'projectName', 'branchName', 'unarchiveAction', 'providerStatus', 'threadTwo', 'threadThree', 'threadFour', 'threadFive']) {
        if (options[key] !== defaults[key]) updated = updated.replaceAll(defaults[key], String(options[key]));
      }
      if (updated !== label) element.setAttribute(attribute, updated);
    }
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
  for (const stage of stages) {
    const sections = [...stage.querySelectorAll('[data-t3-state]')];
    for (let index = 0; index < sections.length; index++) sections[index].hidden = index !== phase;
    stage.querySelector('.t3-native-popup').hidden = !nativePopupAllowed || phase !== 1;
    if (stage.hidden || phase !== 1 || nativePopupAllowed) continue;
    const trigger = sections[phase].querySelector('[aria-label^="Thread actions for "]');
    const menu = sections[phase].querySelector('.dropdown-glass[data-level="0"]');
    if (!trigger || !menu) continue;
    const bounds = trigger.getBoundingClientRect();
    const origin = stage.getBoundingClientRect();
    menu.style.position = 'absolute';
    menu.style.left = (bounds.left - origin.left) + 'px';
    menu.style.top = (bounds.bottom - origin.top + 4) + 'px';
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
for (const theme of ["dark", "light"]) {
  const file = `thread-archive-v0042-${theme}-menu-crop.png`;
  await copyFile(resolve(source, file), resolve(output, file));
}
await copyFile(resolve(root, "public/ideas/assets/T3-CODE-LICENSE.txt"), resolve(output, "licenses/T3-CODE-LICENSE.txt"));
await copyFile(resolve(root, "registry/blocks/t3-thread-switch/licenses/T3-THIRD_PARTY_NOTICES.md"), resolve(output, "licenses/T3-THIRD_PARTY_NOTICES.md"));
await copyFile(resolve(root, "registry/blocks/t3-thread-switch/licenses/PIERRE-TREES-LICENSE.md"), resolve(output, "licenses/PIERRE-TREES-LICENSE.md"));
await copyFile(resolve(root, "registry/blocks/t3-thread-switch/licenses/PIERRE-TREES-NOTICE.md"), resolve(output, "licenses/PIERRE-TREES-NOTICE.md"));
await copyFile(resolve(root, "registry/blocks/t3-thread-archive/licenses/PIERRE-DIFFS-LICENSE.md"), resolve(output, "licenses/PIERRE-DIFFS-LICENSE.md"));
await writeFile(resolve(output, "registry-item.json"), `${JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: Thread Archive",
  description: "Archive a Hyfrme thread through T3 Code's real action menu, then find and unarchive it in Settings.",
  tags: ["composition", "app-ui", "t3-code", "thread-archive", "hyfrme-port"],
  author: "Hyfrme", authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT",
  dimensions: dark.viewport, duration: dark.frames / dark.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    ...["dark", "light"].map((theme) => ({ path: `thread-archive-v0042-${theme}-menu-crop.png`, target: `compositions/thread-archive-v0042-${theme}-menu-crop.png`, type: "hyperframes:asset" })),
    { path: "licenses/T3-CODE-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt", type: "hyperframes:asset" },
    { path: "licenses/T3-THIRD_PARTY_NOTICES.md", target: "THIRD_PARTY_LICENSES/t3-code/T3-THIRD_PARTY_NOTICES.md", type: "hyperframes:asset" },
    { path: "licenses/PIERRE-TREES-LICENSE.md", target: "THIRD_PARTY_LICENSES/t3-code/PIERRE-TREES-LICENSE.md", type: "hyperframes:asset" },
    { path: "licenses/PIERRE-TREES-NOTICE.md", target: "THIRD_PARTY_LICENSES/t3-code/PIERRE-TREES-NOTICE.md", type: "hyperframes:asset" },
    { path: "licenses/PIERRE-DIFFS-LICENSE.md", target: "THIRD_PARTY_LICENSES/t3-code/PIERRE-DIFFS-LICENSE.md", type: "hyperframes:asset" },
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2)}\n`);
await writeFile(resolve(output, "README.md"), `# T3 Code: Thread Archive\n\nThis four-second, 1200 × 659 block reproduces official T3 Code v${dark.sourceTag.slice(1)} at 30 fps in dark and light. The thread is archived through the native title menu, disappears from the active sidebar, appears in Settings > Archive, and is unarchived. The archive and unarchive actions execute against an isolated local T3 database; the Hyfrme project, conversation, and provider state are seeded. No AI provider or GitHub account runs.\n\nCustomize project, branch, thread titles and ages, conversation, draft, Settings copy, menu actions, appearance, and four event frames through HyperFrames variables. The default menu uses cropped official pixels; edited visible content uses source DOM. Match project and thread values with adjacent T3 Code blocks for continuity. Source: https://github.com/pingdotgg/t3code/tree/${dark.sourceCommit}. Installed files include T3 Code's MIT license, icon notice, and Apache-2.0 licenses for @pierre/trees and @pierre/diffs, plus the @pierre/trees notice. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.\n`);
console.log(`Generated ${name} from five native T3 Code root states and one action menu portal.`);
