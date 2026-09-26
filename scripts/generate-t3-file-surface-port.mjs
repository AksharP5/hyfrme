import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.35");
const name = "t3-file-surface";
const output = resolve(root, ".work/t3-file-surface-block");
const fixture = JSON.parse(await readFile(resolve(source, "file-surface-fixture.json"), "utf8"));
const theme = JSON.parse(await readFile(resolve(source, "dark-theme.json"), "utf8"));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const phases = ["before", "chooser", "hover", "files"];
const states = await Promise.all(phases.map((phase) => readFile(resolve(source, `file-surface-${phase}.html`), "utf8")));
const treeHtml = await readFile(resolve(source, "file-surface-tree.html"), "utf8");
const treeCss = await readFile(resolve(source, "file-surface-tree-css.html"), "utf8");
const threadBranches = fixture.threadBranches;

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["draftTitle", "Draft title", "New thread"],
  ["threadOne", "Sidebar thread 1", "Build a logo intro"],
  ["threadTwo", "Sidebar thread 2", "Catalog motion audit"],
  ["threadThree", "Sidebar thread 3", "Grouped logo tests"],
  ["threadFour", "Sidebar thread 4", "Review final hold"],
  ["threadFive", "Sidebar thread 5", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ...fixture.threadAges.map((age, index) => [`thread${index + 1}Age`, `Thread ${index + 1} age`, age]),
  ...threadBranches.map((branch, index) => [`thread${index + 1}Branch`, `Thread ${index + 1} branch`, branch]),
  ["settledAge", "Settled thread age", fixture.settledAge],
  ["heading", "New thread heading", "What should we build in"],
  ["composerPlaceholder", "Composer placeholder", "Ask for changes, send follow-ups, or attach images"],
  ["modelName", "Model", "GPT-5.6-Sol"],
  ["checkoutLabel", "Checkout label", "Current checkout"],
  ["branchName", "Branch", "main"],
  ["chooserTitle", "Surface chooser title", "Open a surface"],
  ["chooserDescription", "Surface chooser description", "Choose what to show in the right panel."],
  ["browserLabel", "Browser surface", "Browser"],
  ["browserDescription", "Browser description", "Only available in the desktop app."],
  ["terminalLabel", "Terminal surface", "Terminal"],
  ["terminalDescription", "Terminal description", "Start a shell in this workspace."],
  ["filesLabel", "Files surface", "Files"],
  ["filesDescription", "Files description", "Browse and read workspace files."],
  ["diffLabel", "Diff surface", "Diff"],
  ["diffDescription", "Diff description", "Available for Git repositories."],
  ["pullRequestLabel", "Pull request surface", "Pull request"],
  ["pullRequestDescription", "Pull request description", "No pull request on this branch yet."],
  ["agentsLabel", "Agents surface", "Agents"],
  ["agentsDescription", "Agents description", "Follow subagents and workflows."],
  ["fileSearchPlaceholder", "Files search placeholder", "Search files"],
  ["treeRow1", "Tree row 1", "docs"],
  ["treeRow2", "Tree row 2", "DEVELOPMENT.md"],
  ["treeRow3", "Tree row 3", "registry / blocks"],
  ["treeRow4", "Tree row 4", "src"],
  ["treeRow5", "Tree row 5", "catalog.ts"],
  ["treeRow6", "Tree row 6", "package.json"],
  ["treeRow7", "Tree row 7", "README.md"],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "openFrame", type: "number", label: "Open right panel at frame", default: fixture.openFrame, min: 0, max: 100, step: 1 },
  { id: "hoverFrame", type: "number", label: "Hover Files at frame", default: fixture.hoverFrame, min: 1, max: 110, step: 1 },
  { id: "filesFrame", type: "number", label: "Open Files at frame", default: fixture.filesFrame, min: 1, max: 119, step: 1 },
];
const defaults = Object.fromEntries(variables.map(({ id, default: value }) => [id, value]));
const textReplacements = Object.fromEntries(fields
  .filter(([id]) => !id.endsWith("Age") && !id.endsWith("Branch") && !id.startsWith("treeRow") && id !== "fileSearchPlaceholder" && id !== "branchName")
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
  .t3-stage [style*="t3-mobile-draft-headline"] h1 { transform: translateY(1px); }
  @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
  @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
  @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
  @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"); }
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
  <div class="dark t3-stage">
    <div class="t3-state" data-t3-state="before">${states[0]}</div>
    <div class="t3-state" data-t3-state="chooser" hidden>${states[1]}</div>
    <div class="t3-state" data-t3-state="hover" hidden>${states[2]}</div>
    <div class="t3-state" data-t3-state="files" hidden>${states[3]}</div>
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
const treeHost = stage.querySelector('[data-t3-state="files"] file-tree-container');
const treeShadow = treeHost.attachShadow({ mode: 'open' });
treeShadow.innerHTML = ${scriptJson(treeHtml)};
const treeSheet = new CSSStyleSheet();
treeSheet.replaceSync(${scriptJson(treeCss)});
treeShadow.adoptedStyleSheets = [treeSheet];
const replacements = ${scriptJson(textReplacements)};
const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
let node;
while ((node = walker.nextNode())) {
  const current = node.textContent.trim();
  const key = replacements[current];
  if (key && options[key] !== defaults[key]) node.textContent = node.textContent.replace(current, String(options[key]));
}
const sections = [...stage.querySelectorAll('[data-t3-state]')];
const ageKeys = ['thread1Age', 'thread2Age', 'thread3Age', 'thread4Age', 'thread5Age'];
const branchKeys = ['thread1Branch', 'thread2Branch', 'thread3Branch', 'thread4Branch', 'thread5Branch'];
for (const section of sections) {
  section.querySelectorAll('[data-testid="sidebar-row-card"]').forEach((row, index) => {
    const age = row.querySelector('span.tabular-nums.text-secondary-label');
    if (age && ageKeys[index]) age.textContent = options[ageKeys[index]];
    const branch = row.querySelector('span.whitespace-nowrap');
    if (branch && branchKeys[index]) branch.textContent = options[branchKeys[index]];
    const worktree = row.querySelector('[aria-label^="Worktree:"]');
    if (worktree && branchKeys[index] && options[branchKeys[index]] !== defaults[branchKeys[index]]) {
      worktree.setAttribute('aria-label', worktree.getAttribute('aria-label').replace('(' + defaults[branchKeys[index]] + ')', '(' + options[branchKeys[index]] + ')'));
    }
  });
  const settledAge = section.querySelector('[data-testid="sidebar-row-slim"] .text-xs');
  if (settledAge) settledAge.textContent = options.settledAge;
  for (const editor of section.querySelectorAll('[data-testid="composer-editor"]')) {
    editor.setAttribute('aria-placeholder', options.composerPlaceholder);
  }
  for (const input of section.querySelectorAll('input[placeholder="Search files"]')) {
    input.placeholder = options.fileSearchPlaceholder;
    input.setAttribute('aria-label', 'Search ' + options.projectName + ' files');
  }
  for (const label of section.querySelectorAll('[data-composer-label-motion]')) {
    if (label.textContent.trim() === defaults.branchName) label.textContent = options.branchName;
  }
}
treeHost.setAttribute('aria-label', options.projectName + ' files');
const rows = [...treeShadow.querySelectorAll('button[data-type="item"]')];
for (let index = 0; index < rows.length; index++) {
  const key = 'treeRow' + (index + 1);
  if (options[key] === defaults[key]) continue;
  const row = rows[index];
  row.setAttribute('aria-label', options[key]);
  const content = row.querySelector('[data-item-section="content"]');
  if (content) content.innerHTML = '<div data-truncate-container="truncate"><span></span></div>';
  const label = content?.querySelector('span');
  if (label) label.textContent = options[key];
}
const clock = { frame: 0 };
function draw() {
  const frame = Math.round(clock.frame);
  const hoverFrame = Math.max(Number(options.hoverFrame), Number(options.openFrame) + 1);
  const filesFrame = Math.max(Number(options.filesFrame), hoverFrame + 1);
  const phase = frame < options.openFrame ? 0 : frame < hoverFrame ? 1 : frame < filesFrame ? 2 : 3;
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
await copyFile(resolve(source, "file-surface-t3-third-party-notices.md"), resolve(output, "licenses/T3-THIRD_PARTY_NOTICES.md"));
await copyFile(resolve(source, "file-surface-pierre-trees-license.md"), resolve(output, "licenses/PIERRE-TREES-LICENSE.md"));
await copyFile(resolve(source, "file-surface-pierre-trees-notice.md"), resolve(output, "licenses/PIERRE-TREES-NOTICE.md"));
await writeFile(resolve(output, "registry-item.json"), `${JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: File Surface",
  description: "Open the real T3 Code right-panel chooser and reveal the Hyfrme workspace file tree beside a new-thread composer.",
  tags: ["composition", "app-ui", "t3-code", "files", "hyfrme-port"],
  author: "Hyfrme", authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT",
  dimensions: fixture.viewport, duration: fixture.frames / fixture.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    { path: "licenses/T3-CODE-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt", type: "hyperframes:asset" },
    { path: "licenses/T3-THIRD_PARTY_NOTICES.md", target: "THIRD_PARTY_LICENSES/t3-code/T3-THIRD_PARTY_NOTICES.md", type: "hyperframes:asset" },
    { path: "licenses/PIERRE-TREES-LICENSE.md", target: "THIRD_PARTY_LICENSES/pierre/PIERRE-TREES-LICENSE.md", type: "hyperframes:asset" },
    { path: "licenses/PIERRE-TREES-NOTICE.md", target: "THIRD_PARTY_LICENSES/pierre/PIERRE-TREES-NOTICE.md", type: "hyperframes:asset" },
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2)}\n`);
await writeFile(resolve(output, "README.md"), `# T3 Code: File Surface

This four-second, 1200 × 659 block reproduces T3 Code v${fixture.sourceTag.slice(1)} at 30 fps. A new Hyfrme thread opens the native right-panel chooser, highlights Files, and reveals the real workspace tree. The tree uses the captured T3 Code shadow DOM and stylesheet.

Customize the project, draft, sidebar, chooser, tree rows, composer, and transition frames through HyperFrames variables. Match project and thread values with adjacent T3 Code blocks for continuity. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. The installed files include T3 Code's MIT license and third-party icon notice, plus @pierre/trees 1.0.0-beta.4's Apache-2.0 license and NOTICE for the captured tree markup and CSS. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.
`);
console.log(`Generated ${name} from four native T3 Code states and the Files shadow tree.`);
