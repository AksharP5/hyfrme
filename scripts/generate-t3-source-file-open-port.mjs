import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.35");
const name = "t3-source-file-open";
const output = resolve(root, "registry/blocks/t3-source-file-open");
const fixture = JSON.parse(await readFile(resolve(source, "source-file-open-fixture.json"), "utf8"));
const theme = JSON.parse(await readFile(resolve(source, "dark-theme.json"), "utf8"));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const phases = ["before", "files", "expanded", "opened"];
const states = await Promise.all(phases.map((phase) => readFile(resolve(source, `source-file-open-${phase}.html`), "utf8")));
const shadows = await Promise.all(phases.map(async (phase) => JSON.parse(await readFile(resolve(source, `source-file-open-${phase}-shadows.json`), "utf8"))));

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["branchName", "Branch name", "main"],
  ["selectedThread", "Selected thread", "Build a logo intro"],
  ["otherThread", "Next thread", "Catalog motion audit"],
  ["threadThree", "Sidebar thread 3", "Grouped logo tests"],
  ["threadFour", "Sidebar thread 4", "Review final hold"],
  ["threadFive", "Sidebar thread 5", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ["folderOne", "First folder", "registry"],
  ["folderTwo", "Second folder", "blocks"],
  ["folderThree", "Source folder", "logo-enter"],
  ["fileName", "Source file name", "logo-enter.html"],
  ["otherSourceFile", "Other source file", "catalog.ts"],
  ["packageFile", "Package file", "package.json"],
  ["readmeFile", "Readme file", "README.md"],
  ["componentName", "Source component name", "logo-enter"],
  ["logoClass", "Source logo class", "hyfrme-logo"],
  ["logoText", "Source logo text", "hyfrme"],
  ["selectedThreadAge", "Selected thread age", "4h"],
  ["otherThreadAge", "Next thread age", "6h"],
  ["threadThreeAge", "Sidebar thread 3 age", "11h"],
  ["threadFourAge", "Sidebar thread 4 age", "1d"],
  ["threadFiveAge", "Sidebar thread 5 age", "2d"],
  ["settledThreadAge", "Settled thread age", "4h"],
  ["message", "User message", "Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames."],
  ["replyStart", "Reply before file", "I found the Logo Enter timing in"],
  ["replyFile", "Reply file", "logo-enter.html"],
  ["replyEnd", "Reply after file", ". The final pass can extend the duration while keeping the last rendered frame still."],
  ["workedDuration", "Worked duration", "2m"],
  ["composerPlaceholder", "Composer placeholder", "Enable a provider in Settings to send a message"],
  ["providerStatus", "Provider status", "No provider available"],
  ["permissionMode", "Permission", "Full access"],
  ["workspaceMode", "Workspace", "Worktree"],
  ["fileSearchPlaceholder", "File search placeholder", "Search files"],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "sourceDuration", type: "number", label: "Source duration in seconds", default: 3.6, min: 0.1, max: 30, step: 0.1 },
  { id: "filesFrame", type: "number", label: "Open Files at frame", default: fixture.filesFrame, min: 0, max: 100, step: 1 },
  { id: "expandFrame", type: "number", label: "Expand source folder at frame", default: fixture.expandFrame, min: 1, max: 110, step: 1 },
  { id: "openFrame", type: "number", label: "Open source file at frame", default: fixture.openFrame, min: 2, max: 119, step: 1 },
];
const defaults = Object.fromEntries(fields.map(([id, , value]) => [id, value]));
Object.assign(defaults, { sourceDuration: 3.6, filesFrame: fixture.filesFrame, expandFrame: fixture.expandFrame, openFrame: fixture.openFrame });
const textReplacements = Object.fromEntries(fields.filter(([id]) => !id.endsWith("Age") && !["componentName", "logoClass", "logoText", "replyFile", "workedDuration"].includes(id)).map(([id, , value]) => [value, id]));
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
${states.map((state, index) => `    <div class="t3-state" data-t3-state="${phases[index]}"${index ? " hidden" : ""}>${state}</div>`).join("\n")}
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
const sections = [...stage.querySelectorAll('[data-t3-state]')];
const shadowStates = ${scriptJson(shadows)};
const roots = [stage];
for (const [index, section] of sections.entries()) {
  for (const shadow of shadowStates[index]) {
    const host = section.querySelector('[data-hyfrme-shadow-id="' + shadow.id + '"]');
    if (!host) throw new Error('Missing T3 shadow host ' + shadow.id);
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = shadow.html;
    if (host.tagName === 'DIFFS-CONTAINER') {
      const alignment = document.createElement('style');
      alignment.textContent = '[data-code] { position: relative; top: -1px; }';
      root.append(alignment);
    }
    root.adoptedStyleSheets = shadow.adoptedCss.map((css) => {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      return sheet;
    });
    roots.push(root);
  }
}
const replacements = ${scriptJson(textReplacements)};
for (const root of roots) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const current = node.textContent.trim();
    const key = replacements[current];
    if (key && options[key] !== defaults[key]) node.textContent = node.textContent.replace(current, options[key]);
  }
}
const code = sections[3].querySelector('diffs-container')?.shadowRoot;
if (code) {
  for (const span of code.querySelectorAll('span[data-char]')) {
    if (span.textContent === '"3.6"') span.textContent = '"' + options.sourceDuration + '"';
    if (span.textContent === '"logo-enter"') span.textContent = '"' + options.componentName + '"';
    if (span.textContent === '"hyfrme-logo"') span.textContent = '"' + options.logoClass + '"';
    if (span.getAttribute('data-char') === '28') span.textContent = options.logoText;
  }
}
for (const root of roots) {
  if (root.host?.tagName !== 'FILE-TREE-CONTAINER') continue;
  for (const [original, replacement] of [
    ['logo-enter.html', options.fileName],
    ['catalog.ts', options.otherSourceFile],
    ['package.json', options.packageFile],
    ['README.md', options.readmeFile],
  ]) {
    const item = root.querySelector('button[data-item-type="file"][aria-label="' + original + '"]');
    if (!item) continue;
    item.setAttribute('aria-label', replacement);
    const originalPath = item.getAttribute('data-item-path');
    if (originalPath) item.setAttribute('data-item-path', originalPath.replace(original, replacement));
    const dot = replacement.lastIndexOf('.');
    const stem = dot < 0 ? replacement : replacement.slice(0, dot + 1);
    const extension = dot < 0 ? '' : replacement.slice(dot + 1);
    for (const content of item.querySelectorAll('[data-truncate-segment-priority="2"] [data-truncate-content]')) content.textContent = stem;
    for (const content of item.querySelectorAll('[data-truncate-segment-priority="1"] [data-truncate-content]')) content.textContent = extension;
  }
}
const ageKeys = ['selectedThreadAge', 'otherThreadAge', 'threadThreeAge', 'threadFourAge', 'threadFiveAge'];
for (const section of sections) {
  section.querySelectorAll('[data-testid="sidebar-row-card"]').forEach((row, index) => {
    const age = row.querySelector('span.tabular-nums.text-secondary-label');
    if (age && ageKeys[index]) age.textContent = options[ageKeys[index]];
  });
  const settledAge = section.querySelector('[data-testid="sidebar-row-slim"] .text-xs');
  if (settledAge) settledAge.textContent = options.settledThreadAge;
  for (const editor of section.querySelectorAll('[data-testid="composer-editor"]')) editor.setAttribute('aria-placeholder', options.composerPlaceholder);
  for (const search of section.querySelectorAll('input[placeholder="Search files"]')) {
    search.setAttribute('placeholder', options.fileSearchPlaceholder);
    search.setAttribute('aria-label', options.fileSearchPlaceholder);
  }
  const worked = [...section.querySelectorAll('span')].find((element) => element.textContent === 'Worked for 2m');
  if (worked) worked.textContent = 'Worked for ' + options.workedDuration;
}
for (const section of sections) {
  const replyFile = section.querySelector('.chat-markdown-file-link .truncate');
  if (replyFile) replyFile.textContent = options.replyFile;
}
const path = [options.folderOne, options.folderTwo, options.folderThree, options.fileName].join('/');
const oldPath = 'registry/blocks/logo-enter/logo-enter.html';
const folderPath = [options.folderOne, options.folderTwo, options.folderThree].join('/');
const pathReplacements = [
  [oldPath, path],
  ['registry/blocks/logo-enter/', folderPath + '/'],
  ['registry/blocks/logo-enter', folderPath],
  ['registry / blocks / logo-enter', [options.folderOne, options.folderTwo, options.folderThree].join(' / ')],
];
for (const root of roots) {
  for (const element of root.querySelectorAll('*')) {
    for (const attribute of element.attributes) {
      let value = attribute.value;
      for (const [original, replacement] of pathReplacements) value = value.replaceAll(original, replacement);
      if (value !== attribute.value) element.setAttribute(attribute.name, value);
    }
  }
}
const clock = { frame: 0 };
function draw() {
  const frame = Math.round(clock.frame);
  const files = Number(options.filesFrame);
  const expand = Math.max(Number(options.expandFrame), files + 1);
  const open = Math.max(Number(options.openFrame), expand + 1);
  const phase = frame < files ? 0 : frame < expand ? 1 : frame < open ? 2 : 3;
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
for (const [sourceName, targetName] of [
  ["source-file-open-t3-third-party-notices.md", "T3-THIRD_PARTY_NOTICES.md"],
  ["source-file-open-pierre-trees-license.md", "PIERRE-TREES-LICENSE.md"],
  ["source-file-open-pierre-trees-notice.md", "PIERRE-TREES-NOTICE.md"],
  ["source-file-open-pierre-diffs-license.md", "PIERRE-DIFFS-LICENSE.md"],
]) {
  await copyFile(resolve(source, sourceName), resolve(output, "licenses", targetName));
}
await writeFile(resolve(output, "registry-item.json"), `${JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name,
  type: "hyperframes:block",
  title: "T3 Code: Source File Open",
  description: "Open the Files surface, expand the Hyfrme source folder, and inspect the HTML duration in T3 Code's native editor.",
  tags: ["composition", "app-ui", "t3-code", "source-file-open", "hyfrme-port"],
  author: "Hyfrme",
  authorUrl: "https://github.com/AksharP5/hyfrme",
  license: "MIT",
  dimensions: fixture.viewport,
  duration: fixture.frames / fixture.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    { path: "licenses/T3-CODE-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt", type: "hyperframes:asset" },
    { path: "licenses/T3-THIRD_PARTY_NOTICES.md", target: "THIRD_PARTY_LICENSES/t3-code/T3-THIRD_PARTY_NOTICES.md", type: "hyperframes:asset" },
    { path: "licenses/PIERRE-TREES-LICENSE.md", target: "THIRD_PARTY_LICENSES/pierre/PIERRE-TREES-LICENSE.md", type: "hyperframes:asset" },
    { path: "licenses/PIERRE-TREES-NOTICE.md", target: "THIRD_PARTY_LICENSES/pierre/PIERRE-TREES-NOTICE.md", type: "hyperframes:asset" },
    { path: "licenses/PIERRE-DIFFS-LICENSE.md", target: "THIRD_PARTY_LICENSES/pierre/PIERRE-DIFFS-LICENSE.md", type: "hyperframes:asset" },
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2)}\n`);
await writeFile(resolve(output, "README.md"), `# T3 Code: Source File Open\n\nThis four-second block reproduces T3 Code v${fixture.sourceTag.slice(1)} at 1200 × 659 and 30 fps. The real Files surface opens, the Hyfrme source folder expands, and the native code editor displays the Logo Enter HTML with its 3.6-second duration. The Pierre file tree and editor are restored from captured T3 shadow DOM and styles.\n\nProject, conversation, source folder, file names, code values, and action timing are editable. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. The installed files include T3 Code's MIT license and its vscode-icons third-party notice, plus the Apache 2.0 licenses and notice for @pierre/trees 1.0.0-beta.4 and @pierre/diffs 1.3.0-beta.10. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.\n`);
console.log(`Generated ${name} from pinned T3 Code source-file UI.`);
