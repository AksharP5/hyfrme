import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { nativeT3MonoFaces } from "./t3-native-fonts.mjs";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-file-surface";
const output = resolve(root, ".work/t3-file-surface-v0042-candidate");
const fixture = JSON.parse(await readFile(resolve(source, "file-surface-fixture.json"), "utf8"));
const lightFixture = JSON.parse(await readFile(resolve(source, "file-surface-light-fixture.json"), "utf8"));
if (fixture.hoverColors?.length !== 5 || lightFixture.hoverColors?.length !== 5) {
  throw new Error("Both themes need five native 30fps Files hover colors");
}
const nativeFirstFile = "file-surface-v0042-native-first.json";
const nativeFirstBytes = await readFile(resolve(source, nativeFirstFile));
const nativeFirst = JSON.parse(nativeFirstBytes);
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
if (nativeFirst.sourceCommit !== fixture.sourceCommit || nativeFirst.width !== fixture.viewport.width ||
  nativeFirst.height !== fixture.viewport.height || nativeFirst.fps !== fixture.fps || nativeFirst.frame !== 0) {
  throw new Error("Native File Surface first-frame provenance differs from the fixture");
}
for (const [theme, pinned] of [["dark", fixture], ["light", lightFixture]]) {
  const evidence = nativeFirst.themes[theme];
  if (hash(await readFile(resolve(source, evidence.fixture))) !== evidence.fixtureSha256 ||
    evidence.referenceSha256 !== pinned.referenceSha256 ||
    hash(await readFile(resolve(root, evidence.reference))) !== evidence.referenceSha256 ||
    hash(await readFile(resolve(source, evidence.file))) !== evidence.pngSha256) {
    throw new Error(theme + ": stale native File Surface first frame");
  }
  const decode = path => execFileSync("ffmpeg", ["-v", "error", "-i", path, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgba", "-"], {maxBuffer: 8 * 1024 * 1024});
  const png = decode(resolve(source, evidence.file));
  if (hash(png) !== evidence.rgbaSha256 || !png.equals(decode(resolve(root, evidence.reference)))) {
    throw new Error(theme + ": native first-frame PNG differs from the pinned source sample");
  }
}
const theme = JSON.parse(await readFile(resolve(source, "dark-theme.json"), "utf8"));
const lightTheme = JSON.parse(await readFile(resolve(source, "light-theme.json"), "utf8"));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const phases = ["before", "chooser", "hover", "files"];
const states = await Promise.all(phases.map((phase) => readFile(resolve(source, `file-surface-${phase}.html`), "utf8")));
for (let index = 0; index < states.length; index++) {
  states[index] = states[index].replace(/(<span[^>]*class="[^"]*\[text-box:trim-both_cap_alphabetic\][^"]*")/g, "$1 data-layout-ignore");
}
const treeHtml = await readFile(resolve(source, "file-surface-tree.html"), "utf8");
const treeCss = await readFile(resolve(source, "file-surface-tree-css.html"), "utf8");
const threadBranches = fixture.threadBranches;

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["projectAvatar", "Project avatar letters", "HE"],
  ["draftTitle", "Draft title", "New thread"],
  ["threadOne", "Sidebar thread 1", "Build a logo intro"],
  ["threadTwo", "Sidebar thread 2", "Catalog motion audit"],
  ["threadThree", "Sidebar thread 3", "Grouped logo tests"],
  ["threadFour", "Sidebar thread 4", "Review final hold"],
  ["threadFive", "Sidebar thread 5", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ...fixture.threadAges.map((age, index) => [`thread${index + 1}Age`, `Thread ${index + 1} age`, age]),
  ...threadBranches.map((branch, index) => [`thread${index + 1}Branch`, `Thread ${index + 1} branch`, branch]),
  ["settledCount", "Settled thread count", "Settled (1)"],
  ["settledAge", "Settled thread age", fixture.settledAge],
  ["heading", "New thread heading", "What should we build in"],
  ["composerPlaceholder", "Composer placeholder", "Ask for changes, send follow-ups, or attach images"],
  ["modelName", "Model", "GPT-6-Astra"],
  ["checkoutLabel", "Checkout label", "Current checkout"],
  ["branchName", "Branch", "feature/logo-enter"],
  ["chooserTitle", "Surface chooser title", "Open a surface"],
  ["browserLabel", "Browser surface", "Browser"],
  ["terminalLabel", "Terminal surface", "Terminal"],
  ["filesLabel", "Files surface", "Files"],
  ["diffLabel", "Diff surface", "Diff"],
  ["pullRequestLabel", "Pull request surface", "Pull request"],
  ["linkedPullRequestsLabel", "Linked pull requests surface", "Linked pull requests"],
  ["agentsLabel", "Agents surface", "Agents"],
  ["deviceLabel", "Device surface", "Device"],
  ["fileSearchPlaceholder", "Files search placeholder", "Search files"],
  ["treeRow1", "Tree row 1", "registry"],
  ["treeRow2", "Tree row 2", "src"],
  ["treeRow3", "Tree row 3", "package.json"],
  ["treeRow4", "Tree row 4", "README.md"],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "renderMode", type: "string", label: "Render mode", default: "pixel-verified", options: ["pixel-verified", "editable DOM"] },
  { id: "theme", type: "string", label: "T3 Code appearance", default: "dark", options: ["dark", "light"] },
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
  .t3-stage { ${stageTheme} position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--background); color: var(--foreground); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
  /* Preserve native T3 typography when HyperFrames compiles the block. */
  .t3-stage, .t3-stage *:not([text-rendering]) { text-rendering: auto; }
  /* Native Submit buttons must not animate inherited clip visibility. */
  .t3-stage button[type="submit"].transition-all { transition-property: background-color, color, box-shadow, transform, scale, opacity; }
  .t3-state[hidden], .t3-stage[hidden], .t3-native-first[hidden] { display: none !important; }
  .t3-native-first { position:absolute; inset:0; width:1200px; height:659px; pointer-events:none; }
  .t3-state:not([hidden]) { display: contents; }
  .base-ui-disable-scrollbar { scrollbar-width: none; }
  .base-ui-disable-scrollbar::-webkit-scrollbar { display: none; }
  @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
  @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
  @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
  @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"); }
${nativeT3MonoFaces}
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
  <div class="dark t3-stage">
    <div class="t3-state" data-t3-state="before">${states[0]}</div>
    <div class="t3-state" data-t3-state="chooser" hidden>${states[1]}</div>
    <div class="t3-state" data-t3-state="hover" hidden>${states[2]}</div>
    <div class="t3-state" data-t3-state="files" hidden>${states[3]}</div>
  </div>
  <canvas class="t3-native-first" width="1200" height="659" hidden></canvas>
</div>
<script src="t3-code-gsap.min.js"></script>
<script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
const pixelMode = options.renderMode === 'pixel-verified' && Object.entries(defaults).every(([key, value]) => key === 'theme' || key === 'renderMode' || options[key] === value);
const firstFrames = {
  dark: 'compositions/file-surface-v0042-dark-native-first.png',
  light: 'compositions/file-surface-v0042-light-native-first.png',
};
const stage = document.querySelector('#root .t3-stage');
if (options.theme === 'light') {
  stage.classList.remove('dark');
  stage.classList.add('light');
  for (const [key, value] of Object.entries(${scriptJson(lightTheme)})) stage.style.setProperty(key, value);
}
for (const [key, value] of Object.entries(${scriptJson(fontTheme)})) stage.style.setProperty(key, value);
stage.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
const treeHost = stage.querySelector('[data-t3-state="files"] file-tree-container');
treeHost.style.colorScheme = options.theme;
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
const hoverButton = [...sections[2].querySelectorAll('[aria-label="Open a surface"] button')]
  .find((button) => button.textContent.includes(options.filesLabel));
if (!hoverButton) throw new Error('Files hover row missing');
hoverButton.style.transition = 'none';
const hoverColors = ${scriptJson([fixture.hoverColors, lightFixture.hoverColors])};
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
const capture = document.querySelector('canvas.t3-native-first');
const captureContext = capture.getContext('2d');
if (!captureContext) throw new Error('Native File Surface first frame requires Canvas 2D');
captureContext.imageSmoothingEnabled = false;
let captureImage;
const clock = { frame: 0 };
function draw() {
  const frame = Math.round(clock.frame);
  const nativeFirstVisible = pixelMode && frame === 0;
  stage.hidden = nativeFirstVisible;
  capture.hidden = !nativeFirstVisible;
  if (nativeFirstVisible && captureImage) captureContext.drawImage(captureImage, 0, 0, 1200, 659);
  const hoverFrame = Math.max(Number(options.hoverFrame), Number(options.openFrame) + 1);
  const filesFrame = Math.max(Number(options.filesFrame), hoverFrame + 1);
  const phase = frame < options.openFrame ? 0 : frame < hoverFrame ? 1 : frame < filesFrame ? 2 : 3;
  for (let index = 0; index < sections.length; index++) sections[index].hidden = index !== phase;
  const hoverIndex = frame - hoverFrame;
  hoverButton.style.backgroundColor = hoverIndex >= 0 && hoverIndex < 5
    ? hoverColors[options.theme === 'light' ? 1 : 0][hoverIndex]
    : '';
}
draw();
const captureReady = pixelMode ? (async () => {
  const image = new Image();
  image.src = firstFrames[options.theme];
  await image.decode();
  return image;
})() : Promise.resolve(null);
window.__hyfrmeReady = captureReady.then(image => {
  captureImage = image;
  draw();
  const timeline = gsap.timeline({ paused: true });
  timeline.to(clock, { frame: 120, duration: 4, ease: 'none', onUpdate: draw });
  window.__timelines['${name}'] = timeline;
  window.__hfForceTimelineRebind?.();
});
</script>
</template>
</body>
</html>
`;

await mkdir(resolve(output, "licenses"), { recursive: true });
await writeFile(resolve(output, `${name}.html`), html);
await writeFile(resolve(output, "t3-code-gsap.min.js"), gsap);
for (const evidence of Object.values(nativeFirst.themes)) await copyFile(resolve(source, evidence.file), resolve(output, evidence.file));
await writeFile(resolve(output, nativeFirstFile), nativeFirstBytes);
await copyFile(resolve(root, "parity/t3-gallery/assets/T3-CODE-LICENSE.txt"), resolve(output, "licenses/T3-CODE-LICENSE.txt"));
await copyFile(resolve(root, "assets/t3-code/v0.0.35/file-surface-t3-third-party-notices.md"), resolve(output, "licenses/T3-THIRD_PARTY_NOTICES.md"));
await copyFile(resolve(root, "assets/t3-code/v0.0.35/file-surface-pierre-trees-license.md"), resolve(output, "licenses/PIERRE-TREES-LICENSE.md"));
await copyFile(resolve(root, "assets/t3-code/v0.0.35/file-surface-pierre-trees-notice.md"), resolve(output, "licenses/PIERRE-TREES-NOTICE.md"));
await writeFile(resolve(output, "registry-item.json"), `${JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: File Surface",
  description: "Open the real T3 Code right-panel chooser and reveal the Hyfrme workspace file tree beside a new-thread composer.",
  tags: ["composition", "app-ui", "t3-code", "files", "hyfrme-port"],
  author: "Hyfrme", authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT",
  dimensions: fixture.viewport, duration: fixture.frames / fixture.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    ...Object.values(nativeFirst.themes).map(({file}) => ({path:file, target:'compositions/' + file, type:'hyperframes:asset'})),
    { path:nativeFirstFile, target:'compositions/' + nativeFirstFile, type:'hyperframes:asset' },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    { path: "licenses/T3-CODE-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt", type: "hyperframes:asset" },
    { path: "licenses/T3-THIRD_PARTY_NOTICES.md", target: "THIRD_PARTY_LICENSES/t3-code/T3-THIRD_PARTY_NOTICES.md", type: "hyperframes:asset" },
    { path: "licenses/PIERRE-TREES-LICENSE.md", target: "THIRD_PARTY_LICENSES/pierre/PIERRE-TREES-LICENSE.md", type: "hyperframes:asset" },
    { path: "licenses/PIERRE-TREES-NOTICE.md", target: "THIRD_PARTY_LICENSES/pierre/PIERRE-TREES-NOTICE.md", type: "hyperframes:asset" },
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2)}\n`);
await writeFile(resolve(output, "README.md"), `# T3 Code: File Surface

This four-second, 1200 × 659 block reproduces T3 Code v${fixture.sourceTag.slice(1)} at 30 fps. A new Hyfrme thread opens the native right-panel chooser, highlights Files, and reveals the real workspace tree. The tree uses the captured T3 Code shadow DOM and stylesheet. Unchanged content and timing replay the whole pinned native first frame, preserving the original capture’s transient scrollbar state. Frames 1–119 use the editable DOM. Editing any content or timing, or selecting editable DOM, uses DOM for every frame; customized output does not claim pixel equality.

Customize the project, draft, sidebar, chooser, tree rows, composer, and transition frames through HyperFrames variables. Match project and thread values with adjacent T3 Code blocks for continuity. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. The installed files include T3 Code's MIT license and third-party icon notice, plus @pierre/trees 1.0.0-beta.4's Apache-2.0 license and NOTICE for the captured tree markup and CSS. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.
`);
console.log(`Generated ${name} from four native T3 Code states and the Files shadow tree.`);
