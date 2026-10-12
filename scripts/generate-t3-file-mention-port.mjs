import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.35");
const name = "t3-file-mention";
const output = resolve(root, ".work/t3-file-mention-candidate");
const fixture = JSON.parse(await readFile(resolve(source, "file-mention-fixture.json"), "utf8"));
const theme = JSON.parse(await readFile(resolve(source, "dark-theme.json"), "utf8"));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const states = await Promise.all(fixture.phases.map((phase) => readFile(resolve(source, `file-mention-${phase}.html`), "utf8")));
const portals = await Promise.all(["at", "results", "highlight"].map(async (phase) =>
  (await readFile(resolve(source, `file-mention-${phase}-portal.html`), "utf8"))
    .replace('data-composer-drawer-layer="true"', 'data-composer-drawer-layer="true" data-layout-ignore')));
for (const index of [1, 2, 3]) states[index] = states[index].replace("<main ", "<main data-layout-ignore ");

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["branchName", "Branch name", "main"],
  ["threadOne", "Selected thread", "Build a logo intro"],
  ["threadTwo", "Sidebar thread 2", "Catalog motion audit"],
  ["threadThree", "Sidebar thread 3", "Grouped logo tests"],
  ["threadFour", "Sidebar thread 4", "Review final hold"],
  ["threadFive", "Sidebar thread 5", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ["threadOneAge", "Selected thread age", "8h"],
  ["threadTwoAge", "Sidebar thread 2 age", "10h"],
  ["threadThreeAge", "Sidebar thread 3 age", "15h"],
  ["threadFourAge", "Sidebar thread 4 age", "1d"],
  ["threadFiveAge", "Sidebar thread 5 age", "2d"],
  ["settledAge", "Settled thread age", "7h"],
  ["userMessage", "User prompt", "Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames."],
  ["replyLead", "Answer before file", "I found the Logo Enter timing in"],
  ["replyFile", "Answer file label", "logo-enter.html"],
  ["replyFilePath", "Answer file path", "registry/blocks/logo-enter/logo-enter.html"],
  ["replyTail", "Answer after file", ". The final pass can extend the duration while keeping the last rendered frame still."],
  ["workedFor", "Work duration", "Worked for 2m"],
  ["headerAction", "Header action", "Publish repository"],
  ["composerPlaceholder", "Composer placeholder", "Enable a provider in Settings to send a message"],
  ["providerStatus", "Provider status", "No provider available"],
  ["permissionMode", "Permission mode", "Full access"],
  ["workspaceMode", "Workspace", "Worktree"],
  ["inputPrefix", "Typed prompt before mention", "Review"],
  ["query", "File search query", fixture.query],
  ["emptyMessage", "Bare @ message", "No matching files or folders."],
  ["resultOneLabel", "Result 1 label", "logo-motion-notes.md"],
  ["resultOneDirectory", "Result 1 directory", "docs"],
  ["resultTwoLabel", "Result 2 label", "logo-enter"],
  ["resultTwoDirectory", "Result 2 directory", "registry/blocks"],
  ["resultThreeLabel", "Result 3 label", "logo-flicker"],
  ["resultThreeDirectory", "Result 3 directory", "registry/blocks"],
  ["resultFourLabel", "Result 4 label", "logo-group"],
  ["resultFourDirectory", "Result 4 directory", "registry/blocks"],
  ["selectedFileLabel", "Selected file label", fixture.selectedFile],
  ["selectedFilePath", "Selected file path", fixture.selectedPath],
  ["resultSixLabel", "Result 6 label", "logo-group.html"],
  ["resultSixDirectory", "Result 6 directory", "registry/blocks/logo-group"],
  ["resultSevenLabel", "Result 7 label", "logo-enter.html"],
  ["resultSevenDirectory", "Result 7 directory", "registry/blocks/logo-enter"],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "atFrame", type: "number", label: "Type @ at frame", default: fixture.events.at, min: 1, max: 112, step: 1 },
  { id: "resultsFrame", type: "number", label: "Show search results at frame", default: fixture.events.results, min: 2, max: 114, step: 1 },
  { id: "highlightFrame", type: "number", label: "Highlight selected file at frame", default: fixture.events.highlight, min: 3, max: 116, step: 1 },
  { id: "chipFrame", type: "number", label: "Insert file chip at frame", default: fixture.events.chip, min: 4, max: 119, step: 1 },
];
const defaults = Object.fromEntries(variables.map(({ id, default: value }) => [id, value]));
const replacements = Object.fromEntries(fields
  .filter(([id]) => !id.endsWith("Age") && !id.startsWith("result") && !["replyFilePath", "inputPrefix", "query", "selectedFileLabel", "selectedFilePath"].includes(id))
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
${states.map((body, index) => `    <div class="t3-state" data-t3-state="${fixture.phases[index]}"${index ? " hidden" : ""}>${body}${index >= 1 && index <= 3 ? portals[index - 1] : ""}</div>`).join("\n")}
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
  const key = replacements[current];
  if (key && options[key] !== defaults[key]) node.textContent = node.textContent.replace(current, String(options[key]));
}
const sections = [...stage.querySelectorAll('[data-t3-state]')];
const ages = new Map([
  [options.threadOne, options.threadOneAge], [options.threadTwo, options.threadTwoAge],
  [options.threadThree, options.threadThreeAge], [options.threadFour, options.threadFourAge],
  [options.threadFive, options.threadFiveAge],
]);
const resultRows = [
  [options.resultOneLabel, options.resultOneDirectory],
  [options.resultTwoLabel, options.resultTwoDirectory],
  [options.resultThreeLabel, options.resultThreeDirectory],
  [options.resultFourLabel, options.resultFourDirectory],
  [options.selectedFileLabel, String(options.selectedFilePath).slice(0, String(options.selectedFilePath).lastIndexOf('/'))],
  [options.resultSixLabel, options.resultSixDirectory],
  [options.resultSevenLabel, options.resultSevenDirectory],
];
for (const section of sections) {
  section.querySelectorAll('[data-testid="sidebar-row-card"]').forEach((row) => {
    const title = row.querySelector('.mt-1 span')?.textContent?.trim();
    const age = row.querySelector('span.tabular-nums.text-secondary-label');
    if (age && ages.has(title)) age.textContent = ages.get(title);
  });
  const settledAge = section.querySelector('[data-testid="sidebar-row-slim"] .text-xs');
  if (settledAge) settledAge.textContent = options.settledAge;
  const editor = section.querySelector('[data-testid="composer-editor"]');
  if (editor) {
    editor.setAttribute('aria-placeholder', options.composerPlaceholder);
    const text = editor.querySelector('[data-lexical-text]');
    if (text && section.dataset.t3State === 'at') text.textContent = options.inputPrefix + ' @';
    if (text && ['results', 'highlight'].includes(section.dataset.t3State)) text.textContent = options.inputPrefix + ' @' + options.query;
    if (text && section.dataset.t3State === 'chip') text.textContent = options.inputPrefix + ' ';
  }
  const chip = section.querySelector('[data-composer-mention-chip="true"] .truncate');
  if (chip) chip.textContent = options.selectedFileLabel;
  const answerFile = section.querySelector('.chat-markdown-file-link');
  if (answerFile) {
    const path = String(options.replyFilePath).replace(/^\\/+/, '');
    answerFile.setAttribute('href', 'hyfrme-demo/' + path);
    answerFile.setAttribute('data-markdown-copy', '\\x60' + path + '\\x60');
  }
  section.querySelectorAll('[data-composer-item-id]').forEach((row, index) => {
    const item = resultRows[index];
    if (!item) return;
    const content = row.querySelector('span.flex');
    const label = content?.children[0];
    const directory = content?.children[1];
    if (label) label.textContent = item[0];
    if (directory) directory.textContent = item[1];
    const kind = row.getAttribute('data-composer-item-id')?.split(':')[1] ?? 'file';
    const path = index === 4 ? options.selectedFilePath : item[1] + '/' + item[0];
    row.setAttribute('data-composer-item-id', 'path:' + kind + ':' + path);
  });
  for (const element of section.querySelectorAll('[aria-label], [title]')) {
    for (const attribute of ['aria-label', 'title']) {
      const label = element.getAttribute(attribute);
      if (!label) continue;
      let updated = label;
      for (const key of ['projectName', 'branchName', 'threadOne', 'selectedFileLabel']) {
        if (options[key] !== defaults[key]) updated = updated.replaceAll(defaults[key], String(options[key]));
      }
      if (updated !== label) element.setAttribute(attribute, updated);
    }
  }
}
const clock = { frame: 0 };
function draw() {
  const frame = Math.round(clock.frame);
  const resultsFrame = Math.max(Number(options.resultsFrame), Number(options.atFrame) + 1);
  const highlightFrame = Math.max(Number(options.highlightFrame), resultsFrame + 1);
  const chipFrame = Math.max(Number(options.chipFrame), highlightFrame + 1);
  const phase = frame < options.atFrame ? 0 : frame < resultsFrame ? 1 : frame < highlightFrame ? 2 : frame < chipFrame ? 3 : 4;
  for (let index = 0; index < sections.length; index++) sections[index].hidden = index !== phase;
  const chatScroll = sections[phase].querySelector('.topbar-scroll-fade');
  if (chatScroll) chatScroll.scrollTop = 9;
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
  name, type: "hyperframes:block", title: "T3 Code: File Mention",
  description: "Type @ in T3 Code's composer, search real Hyfrme project files, select one, and see its native file chip.",
  tags: ["composition", "app-ui", "t3-code", "file-mention", "hyfrme-port"],
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
await writeFile(resolve(output, "README.md"), `# T3 Code: File Mention\n\nThis four-second, 1200 × 659 block reproduces T3 Code v${fixture.sourceTag.slice(1)} at 30 fps. The real Hyfrme workspace composer opens its @ path drawer, searches local project files, highlights Logo Flicker, and inserts T3's native Lexical file chip. The bare @ state intentionally shows no matches until a query is entered.\n\nCustomize project and thread copy, typed prompt/query, all seven result labels and paths, the selected chip, and transition frames through HyperFrames variables. No AI response is simulated. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. Installed files include T3 Code's MIT license, icon notice, and Apache-2.0 licenses for @pierre/trees and @pierre/diffs, plus the @pierre/trees notice. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.\n`);
console.log(`Generated ${name} from five native root states and three composer-drawer portals.`);
