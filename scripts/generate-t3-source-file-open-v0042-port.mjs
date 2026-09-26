import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-source-file-open";
const output = resolve(root, ".work/t3-source-file-open-v0042-candidate");
const themes = ["dark", "light"];
const phases = ["files", "registry", "blocks", "logo-enter", "opened"];
const baseFixture = JSON.parse(await readFile(resolve(source, "file-surface-fixture.json"), "utf8"));
const fixtures = Object.fromEntries(await Promise.all(themes.map(async (theme) => [
  theme,
  JSON.parse(await readFile(resolve(source, `source-file-open${theme === "light" ? "-light" : ""}-fixture.json`), "utf8")),
])));
const themeVars = Object.fromEntries(await Promise.all(themes.map(async (theme) => [
  theme,
  JSON.parse(await readFile(resolve(source, `${theme}-theme.json`), "utf8")),
])));
const captures = await Promise.all(themes.flatMap((theme) => phases.map(async (phase) => {
  const prefix = `source-file-open${theme === "light" ? "-light" : ""}-${phase}`;
  const markup = await readFile(resolve(source, `${prefix}.html`), "utf8");
  const shadows = JSON.parse(await readFile(resolve(source, `${prefix}-shadows.json`), "utf8"));
  return { theme, phase, markup: markup.replace(/(<span[^>]*class="[^"]*\[text-box:trim-both_cap_alphabetic\][^"]*")/g, "$1 data-layout-ignore"), shadows };
})));
for (const theme of themes) {
  const fixture = fixtures[theme];
  if (fixture.sourceTag !== "v0.0.42" || fixture.frames !== 120 || fixture.fps !== 30 ||
      fixture.theme !== theme || fixture.viewport.width !== 1200 || fixture.viewport.height !== 659) {
    throw new Error(`${theme} source-file-open fixture does not match the v0.0.42 desktop contract`);
  }
}
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["projectAvatar", "Project avatar letters", "HE"],
  ["draftTitle", "Draft title", "New thread"],
  ["threadOne", "Sidebar thread 1", "Build a logo intro"],
  ["threadTwo", "Sidebar thread 2", "Catalog motion audit"],
  ["threadThree", "Sidebar thread 3", "Grouped logo tests"],
  ["threadFour", "Sidebar thread 4", "Review final hold"],
  ["threadFive", "Sidebar thread 5", "Search reveal timing"],
  ...baseFixture.threadAges.map((age, index) => [`thread${index + 1}Age`, `Sidebar thread ${index + 1} age`, age]),
  ...baseFixture.threadBranches.map((branch, index) => [`thread${index + 1}Branch`, `Sidebar thread ${index + 1} branch`, branch]),
  ["settledCount", "Settled thread count", "Settled (1)"],
  ["settledAge", "Settled thread age", baseFixture.settledAge],
  ["heading", "New thread heading", "What should we build in"],
  ["composerPlaceholder", "Composer placeholder", "Ask for changes, send follow-ups, or attach images"],
  ["modelName", "Model", "GPT-6-Astra"],
  ["checkoutLabel", "Checkout label", "Current checkout"],
  ["branchName", "Branch", "feature/logo-enter"],
  ["fileSearchPlaceholder", "Files search placeholder", "Search files"],
  ["folderOne", "First source folder", "registry"],
  ["folderTwo", "Second source folder", "blocks"],
  ["folderThree", "Third source folder", "logo-enter"],
  ["fileName", "Source file name", "logo-enter.html"],
  ["otherFolder", "Other folder", "src"],
  ["packageFile", "Package file", "package.json"],
  ["readmeFile", "Readme file", "README.md"],
  ["sourceClass", "Source CSS class", "logo"],
  ["sourceText", "Source logo text", "Hyfrme"],
  ["sourceCaption", "Source caption", "Logo Enter"],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, label, type: "string", default: value })),
  { id: "theme", label: "T3 Code appearance", type: "string", default: "dark", options: themes },
  ...Object.entries(fixtures.dark.events).map(([id, frame]) => ({
    id: `${id}Frame`, label: `${id} at frame`, type: "number", default: frame, min: 0, max: 119, step: 1,
  })),
];
const defaults = Object.fromEntries(variables.map(({ id, default: value }) => [id, value]));
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const scriptJson = (value) => JSON.stringify(value).replaceAll("</", "<\\/");
const stages = captures.map(({ theme, phase, markup }, index) =>
  `<div class="t3-state" data-t3-theme="${theme}" data-t3-phase="${phase}"${index ? " hidden" : ""}>${markup}</div>`).join("\n");
const symbol = captures.find(({ theme, phase }) => theme === "dark" && phase === "opened")
  ?.shadows.find(({ tag }) => tag === "FILE-TREE-CONTAINER")?.html
  .match(/<symbol id="file-tree-builtin-html"[\s\S]*?<\/symbol>/)?.[0];
if (!symbol) throw new Error("Native HTML file icon sprite is missing");
const stageTheme = Object.entries(themeVars.dark).map(([key, value]) => `${key}:${value};`).join("");
const fontTheme = Object.fromEntries(Object.entries(themeVars.dark).filter(([key]) =>
  key.includes("font-family") || key === "--font-sans" || key === "--font-mono"));
const html = `<!doctype html>
<html lang="en" data-composition-variables='${escapeAttribute(JSON.stringify(variables))}'>
<head><meta charset="utf-8"></head>
<body>
<template>
<style>${css}</style>
<style>
  #root { position: relative; width: 100%; height: 100%; overflow: hidden; }
  .t3-stage { ${stageTheme} position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--background); color: var(--foreground); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
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
  <div class="dark t3-stage"><svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;overflow:hidden" aria-hidden="true">${symbol}</svg>${stages}</div>
</div>
<script src="t3-code-gsap.min.js"></script>
<script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
const stage = document.querySelector('#root .t3-stage');
if (options.theme === 'light') {
  stage.classList.replace('dark', 'light');
  for (const [key, value] of Object.entries(${scriptJson(themeVars.light)})) stage.style.setProperty(key, value);
}
for (const [key, value] of Object.entries(${scriptJson(fontTheme)})) stage.style.setProperty(key, value);
stage.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
const states = [...stage.querySelectorAll('[data-t3-phase]')];
const shadowStates = ${scriptJson(captures.map(({ shadows }) => shadows))};
const roots = [stage];
for (const [index, state] of states.entries()) {
  for (const shadow of shadowStates[index]) {
    const host = state.querySelector('[data-hyfrme-shadow-id="' + shadow.id + '"]');
    if (!host) throw new Error('Missing T3 shadow host ' + shadow.id);
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = shadow.html;
    root.adoptedStyleSheets = shadow.css.map((css) => {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      return sheet;
    });
    if (host.tagName === 'DIFFS-CONTAINER') {
      const alignment = document.createElement('style');
      alignment.textContent = '[data-code] { position: relative; top: -1px; }';
      root.append(alignment);
    }
    roots.push(root);
  }
}
const replacements = ${scriptJson(Object.fromEntries(fields.filter(([id]) => !id.endsWith('Age') && !id.endsWith('Branch') && !['sourceClass', 'sourceText', 'sourceCaption', 'branchName', 'folderOne', 'folderTwo', 'folderThree', 'fileName', 'otherFolder', 'packageFile', 'readmeFile'].includes(id)).map(([id, , value]) => [value, id])))};
for (const root of roots) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const current = node.textContent.trim();
    const key = replacements[current];
    if (key && options[key] !== defaults[key]) node.textContent = node.textContent.replace(current, options[key]);
  }
}
const paths = [
  ['registry/blocks/logo-enter/logo-enter.html', [options.folderOne, options.folderTwo, options.folderThree, options.fileName].join('/')],
  ['registry/blocks/logo-enter/', [options.folderOne, options.folderTwo, options.folderThree].join('/') + '/'],
  ['registry/blocks/logo-enter', [options.folderOne, options.folderTwo, options.folderThree].join('/')],
  ['registry/blocks/', [options.folderOne, options.folderTwo].join('/') + '/'],
  ['registry/', options.folderOne + '/'],
  ['src/', options.otherFolder + '/'],
  ['package.json', options.packageFile],
  ['README.md', options.readmeFile],
];
for (const root of roots) {
  for (const element of root.querySelectorAll('*')) {
    for (const attribute of [...element.attributes]) {
      let value = attribute.value;
      for (const [original, next] of paths) value = value.replaceAll(original, next);
      if (value !== attribute.value) element.setAttribute(attribute.name, value);
    }
    if (element.children.length) continue;
    const current = element.textContent.trim();
    const key = { registry: 'folderOne', blocks: 'folderTwo', 'logo-enter': 'folderThree', 'logo-enter.html': 'fileName', src: 'otherFolder', 'package.json': 'packageFile', 'README.md': 'readmeFile' }[current];
    if (key && options[key] !== defaults[key]) element.textContent = element.textContent.replace(current, options[key]);
  }
}
if (options.fileName !== defaults.fileName) {
  const dot = options.fileName.lastIndexOf('.');
  const stem = dot < 0 ? options.fileName : options.fileName.slice(0, dot + 1);
  const extension = dot < 0 ? '' : options.fileName.slice(dot + 1);
  for (const root of roots) {
    for (const row of root.querySelectorAll('button[data-item-type="file"]')) {
      if (!row.getAttribute('data-item-path')?.endsWith('/' + options.fileName)) continue;
      for (const content of row.querySelectorAll('[data-truncate-segment-priority="2"] [data-truncate-content]')) content.textContent = stem;
      for (const content of row.querySelectorAll('[data-truncate-segment-priority="1"] [data-truncate-content]')) content.textContent = extension;
    }
  }
}
for (const state of states) {
  const ageKeys = ['thread1Age', 'thread2Age', 'thread3Age', 'thread4Age', 'thread5Age'];
  const branchKeys = ['thread1Branch', 'thread2Branch', 'thread3Branch', 'thread4Branch', 'thread5Branch'];
  state.querySelectorAll('[data-testid="sidebar-row-card"]').forEach((row, index) => {
    const age = row.querySelector('span.tabular-nums.text-secondary-label');
    if (age && ageKeys[index]) age.textContent = options[ageKeys[index]];
    const branch = row.querySelector('span.whitespace-nowrap');
    if (branch && branchKeys[index]) branch.textContent = options[branchKeys[index]];
  });
  const settledAge = state.querySelector('[data-testid="sidebar-row-slim"] .text-xs');
  if (settledAge) settledAge.textContent = options.settledAge;
  const editor = state.querySelector('[data-testid="composer-editor"]');
  if (editor) editor.setAttribute('aria-placeholder', options.composerPlaceholder);
  const search = state.querySelector('input[placeholder="Search files"]');
  if (search) search.setAttribute('placeholder', options.fileSearchPlaceholder);
  const branch = [...state.querySelectorAll('[data-composer-label-motion]')].find((item) => item.textContent.trim() === defaults.branchName);
  if (branch) branch.textContent = options.branchName;
  for (const [index, thread] of [...state.querySelectorAll('[data-testid="sidebar-row-card"]')].entries()) {
    const key = ['threadOne', 'threadTwo', 'threadThree', 'threadFour', 'threadFive'][index];
    if (!key) continue;
    const label = thread.querySelector('[data-slot="sidebar-thread-title"]');
    if (label && options[key] !== defaults[key]) label.textContent = options[key];
  }
}
for (const state of states.filter((item) => item.dataset.t3Phase === 'opened')) {
  const code = state.querySelector('diffs-container')?.shadowRoot;
  if (!code) continue;
  for (const span of code.querySelectorAll('span[data-char]')) {
    if (span.textContent === '"logo"' && options.sourceClass !== defaults.sourceClass) span.textContent = '"' + options.sourceClass + '"';
    if (span.textContent === 'Hyfrme' && options.sourceText !== defaults.sourceText) span.textContent = options.sourceText;
    if (span.textContent === 'Logo Enter' && options.sourceCaption !== defaults.sourceCaption) span.textContent = options.sourceCaption;
  }
}
const active = states.filter((state) => state.dataset.t3Theme === options.theme);
const clock = { frame: 0 };
function nativeEase(progress) {
  const x = Math.min(1, Math.max(0, progress));
  const cubic = (time, first, second) => 3 * (1 - time) ** 2 * time * first + 3 * (1 - time) * time ** 2 * second + time ** 3;
  let low = 0;
  let high = 1;
  for (let index = 0; index < 16; index++) {
    const middle = (low + high) / 2;
    if (cubic(middle, 0.25, 0.25) < x) low = middle;
    else high = middle;
  }
  return cubic((low + high) / 2, 0.1, 1);
}
function draw() {
  const frame = Math.round(clock.frame);
  const starts = [0, Number(options.registryFrame), Number(options.blocksFrame), Number(options.logoEnterFrame), Number(options.openFileFrame)];
  for (let index = 1; index < starts.length; index++) starts[index] = Math.max(starts[index], starts[index - 1] + 1);
  let phase = 0;
  for (let index = 1; index < starts.length; index++) if (frame >= starts[index]) phase = index;
  for (const state of states) state.hidden = state !== active[phase];
  if (phase === 4) {
    if (['folderOne', 'folderTwo', 'folderThree', 'fileName'].some((key) => options[key] !== defaults[key])) {
      const currentFile = active[4].querySelector('[data-current-file-crumb="true"]');
      const breadcrumb = currentFile?.closest('[data-slot="scroll-area-viewport"]');
      if (breadcrumb) breadcrumb.scrollLeft = breadcrumb.scrollWidth - breadcrumb.clientWidth;
      for (const label of breadcrumb?.querySelectorAll('[data-current-file-crumb] span') ?? []) {
        label.setAttribute('data-layout-allow-occlusion', '');
      }
    }
    const guide = active[4].querySelector('file-tree-container')?.shadowRoot?.querySelector('[data-item-section="spacing-item"][data-ancestor-path="' + [options.folderOne, options.folderTwo, options.folderThree].join('/') + '/"]');
    if (guide) guide.style.opacity = String(nativeEase((frame - starts[4]) / 4.5));
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
await copyFile(resolve(root, "parity/t3-gallery/assets/T3-CODE-LICENSE.txt"), resolve(output, "licenses/T3-CODE-LICENSE.txt"));
for (const [from, to] of [
  ["source-file-open-t3-third-party-notices.md", "T3-THIRD_PARTY_NOTICES.md"],
  ["source-file-open-pierre-trees-license.md", "PIERRE-TREES-LICENSE.md"],
  ["source-file-open-pierre-trees-notice.md", "PIERRE-TREES-NOTICE.md"],
  ["source-file-open-pierre-diffs-license.md", "PIERRE-DIFFS-LICENSE.md"],
]) await copyFile(resolve(root, "assets/t3-code/v0.0.35", from), resolve(output, "licenses", to));
const files = [
  { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
  { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
  ...["T3-CODE-LICENSE.txt", "T3-THIRD_PARTY_NOTICES.md", "PIERRE-TREES-LICENSE.md", "PIERRE-TREES-NOTICE.md", "PIERRE-DIFFS-LICENSE.md"].map((file) => ({
    path: `licenses/${file}`, target: `THIRD_PARTY_LICENSES/t3-code/${file}`, type: "hyperframes:asset",
  })),
  { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
];
await writeFile(resolve(output, "registry-item.json"), JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: Source File Open",
  description: "Expand the Hyfrme Files tree and open Logo Enter HTML source using T3 Code v0.0.42's native viewer.",
  tags: ["composition", "app-ui", "t3-code", "source-file-open", "hyfrme-port"],
  author: "Hyfrme", authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT",
  dimensions: fixtures.dark.viewport, duration: 4, files,
}, null, 2) + "\n");
await writeFile(resolve(output, "README.md"), `# T3 Code: Source File Open\n\nThis four-second block reproduces the official T3 Code v0.0.42 Files tree and HTML source viewer at 1200 × 659 and 30 fps in dark and light themes. The fixture opens the native file row, then selects “Show HTML source” because HTML otherwise opens as a rendered page.\n\nProject, thread, folder, filename, selected source text, theme, and interaction frames are HyperFrames variables. The seeded local Hyfrme project and source file are explicitly labeled; no provider or GitHub execution occurs. Source: https://github.com/pingdotgg/t3code/tree/${fixtures.dark.sourceCommit}. The installed block includes the T3 Code and Pierre attribution and license files.\n`);
console.log(`Generated ${name} from dual-theme T3 Code v0.0.42 fixtures.`);
