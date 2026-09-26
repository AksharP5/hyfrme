import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-terminal-check";
const output = resolve(root, `.work/${name}-v0042-candidate`);
const themes = ["dark", "light"];
const phases = ["source", "add-menu", "ready", "typed", "output"];
const fileFixture = JSON.parse(await readFile(resolve(source, "file-surface-fixture.json"), "utf8"));
const fixtures = Object.fromEntries(await Promise.all(themes.map(async (theme) => [theme,
  JSON.parse(await readFile(resolve(source, `terminal-check${theme === "light" ? "-light" : ""}-fixture.json`), "utf8")),
])));
const themeVars = Object.fromEntries(await Promise.all(themes.map(async (theme) => [theme,
  JSON.parse(await readFile(resolve(source, `${theme}-theme.json`), "utf8")),
])));
for (const theme of themes) {
  const fixture = fixtures[theme];
  if (fixture.sourceTag !== "v0.0.42" || fixture.theme !== theme || fixture.frames !== 120 || fixture.fps !== 30 ||
      fixture.viewport.width !== 1200 || fixture.viewport.height !== 659 ||
      fixture.terminalBounds.x !== 661 || fixture.terminalBounds.y !== 52) {
    throw new Error(`${theme} Terminal fixture differs from the desktop v0.0.42 contract`);
  }
}
const captures = await Promise.all(themes.flatMap((theme) => phases.map(async (phase) => {
  const prefix = `terminal-check${theme === "light" ? "-light" : ""}`;
  let markup = await readFile(resolve(source, `${prefix}-${phase}.html`), "utf8");
  markup = markup.replace(/(<span[^>]*class="[^"]*\[text-box:trim-both_cap_alphabetic\][^"]*")/g, "$1 data-layout-ignore");
  if (["ready", "typed", "output"].includes(phase)) {
    markup = markup.replace(/<canvas class="block size-full cursor-text" aria-hidden="true" width="\d+" height="\d+"><\/canvas>/,
      '<img data-terminal-canvas data-layout-ignore class="block size-full cursor-text" aria-hidden="true">');
    if (!markup.includes("data-terminal-canvas")) throw new Error(`${theme} ${phase} has no native Ghostty canvas`);
  }
  const shadows = JSON.parse(await readFile(resolve(source, `${prefix}-${phase}-shadows.json`), "utf8"));
  return { theme, phase, markup, shadows };
})));
const portal = Object.fromEntries(await Promise.all(themes.map(async (theme) => [theme,
  await readFile(resolve(source, `terminal-check${theme === "light" ? "-light" : ""}-add-menu-portal.html`), "utf8"),
])));
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
  ...fileFixture.threadAges.map((age, index) => [`thread${index + 1}Age`, `Sidebar thread ${index + 1} age`, age]),
  ...fileFixture.threadBranches.map((branch, index) => [`thread${index + 1}Branch`, `Sidebar thread ${index + 1} branch`, branch]),
  ["settledCount", "Settled thread count", "Settled (1)"],
  ["settledAge", "Settled thread age", fileFixture.settledAge],
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
  ["sourceClass", "Source CSS class", "logo"],
  ["sourceText", "Source logo text", "Hyfrme"],
  ["sourceCaption", "Source caption", "Logo Enter"],
  ["terminalTab", "Terminal tab", "Terminal 1"],
  ["terminalPrompt", "Terminal directory", "hyfrme-t3-demo"],
  ["terminalBranch", "Terminal branch", "feature/logo-enter"],
  ["command", "Shell command", fixtures.dark.command],
  ["output", "Command output", fixtures.dark.expectedOutput],
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
const states = captures.map(({ theme, phase, markup }, index) => {
  const menu = phase === "add-menu" ? `<div class="t3-menu-portal" style="left:${fixtures[theme].menuBox.x}px;top:${fixtures[theme].menuBox.y}px">${portal[theme]}</div>` : "";
  return `<div class="t3-state" data-t3-theme="${theme}" data-t3-phase="${phase}"${index ? " hidden" : ""}>${markup}${menu}</div>`;
}).join("\n");
const symbol = captures.find(({ theme, phase }) => theme === "dark" && phase === "source")?.shadows
  .find(({ tag }) => tag === "FILE-TREE-CONTAINER")?.html.match(/<symbol id="file-tree-builtin-html"[\s\S]*?<\/symbol>/)?.[0];
if (!symbol) throw new Error("Native HTML file icon sprite is missing");
const stageTheme = Object.entries(themeVars.dark).map(([key, value]) => `${key}:${value};`).join("");
const fontTheme = Object.fromEntries(Object.entries(themeVars.dark).filter(([key]) =>
  key.includes("font-family") || key === "--font-sans" || key === "--font-mono"));
const html = `<!doctype html>
<html lang="en" data-composition-variables='${escapeAttribute(JSON.stringify(variables))}'>
<head><meta charset="utf-8"></head><body><template>
<style>${css}</style>
<style>
  #root { position: relative; width: 100%; height: 100%; overflow: hidden; }
  .t3-stage { ${stageTheme} position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--background); color: var(--foreground); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
  .t3-state[hidden] { display: none !important; }
  .t3-state:not([hidden]) { display: contents; }
  .t3-menu-portal { position: absolute; z-index: 200; }
  .base-ui-disable-scrollbar { scrollbar-width: none; }
  .base-ui-disable-scrollbar::-webkit-scrollbar { display: none; }
  .t3-stage [style*="t3-mobile-draft-headline"] h1 { transform: translateY(1px); }
  .terminal-custom { position: absolute; inset: 0; box-sizing: border-box; padding: 21px 4px 0; background: var(--terminal-background); color: var(--terminal-foreground); font: 13px/18px "JetBrains Mono", monospace; white-space: pre-wrap; }
  .terminal-custom[hidden] { display: none !important; }
  .terminal-custom .directory { color: #8fbfc4; font-weight: 600; }
  .terminal-custom .branch { color: #cf8993; font-style: italic; }
  .terminal-custom .status { color: #d18490; }
  .terminal-custom .prompt-dot { color: #93b9aa; }
  @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
  @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
  @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
  @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"); }
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
  <div class="dark t3-stage"><svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;overflow:hidden" aria-hidden="true">${symbol}</svg>${states}</div>
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
    root.adoptedStyleSheets = shadow.css.map((css) => { const sheet = new CSSStyleSheet(); sheet.replaceSync(css); return sheet; });
    if (host.tagName === 'DIFFS-CONTAINER') {
      const alignment = document.createElement('style');
      alignment.textContent = '[data-code] { position: relative; top: -1px; }';
      root.append(alignment);
    }
    roots.push(root);
  }
}
const replacements = ${scriptJson(Object.fromEntries(fields.filter(([id]) => !id.endsWith('Age') && !id.endsWith('Branch') &&
  !['sourceClass', 'sourceText', 'sourceCaption', 'folderOne', 'folderTwo', 'folderThree', 'fileName', 'terminalTab', 'terminalPrompt', 'command', 'output'].includes(id))
  .map(([id, , value]) => [value, id])))};
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
    const key = { registry: 'folderOne', blocks: 'folderTwo', 'logo-enter': 'folderThree', 'logo-enter.html': 'fileName' }[current];
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
  const title = state.querySelector('[data-slot="sidebar-thread-title"]');
  for (const [index, row] of [...state.querySelectorAll('[data-testid="sidebar-row-card"]')].entries()) {
    const key = ['threadOne', 'threadTwo', 'threadThree', 'threadFour', 'threadFive'][index];
    const label = row.querySelector('[data-slot="sidebar-thread-title"]');
    if (key && label && options[key] !== defaults[key]) label.textContent = options[key];
  }
  for (const tab of state.querySelectorAll('button')) {
    if (tab.textContent.trim() === defaults.terminalTab && options.terminalTab !== defaults.terminalTab) {
      const label = [...tab.querySelectorAll('span')].find((item) => item.textContent.trim() === defaults.terminalTab);
      if (label) label.textContent = options.terminalTab;
    }
  }
}
for (const state of states.filter((item) => item.dataset.t3Phase === 'add-menu')) {
  for (const label of state.querySelectorAll('[data-file-breadcrumbs] span')) {
    label.setAttribute('data-layout-allow-occlusion', '');
    label.setAttribute('data-layout-ignore', '');
  }
}
for (const state of states.filter((item) => ['source', 'add-menu'].includes(item.dataset.t3Phase))) {
  const code = state.querySelector('diffs-container')?.shadowRoot;
  if (!code) continue;
  for (const span of code.querySelectorAll('span[data-char]')) {
    if (span.textContent === '"logo"' && options.sourceClass !== defaults.sourceClass) span.textContent = '"' + options.sourceClass + '"';
    if (span.textContent === 'Hyfrme' && options.sourceText !== defaults.sourceText) span.textContent = options.sourceText;
    if (span.textContent === 'Logo Enter' && options.sourceCaption !== defaults.sourceCaption) span.textContent = options.sourceCaption;
  }
}
const sequences = ${scriptJson(Object.fromEntries(themes.map((theme) => [theme, fixtures[theme].canvasSequence])))};
const active = states.filter((state) => state.dataset.t3Theme === options.theme);
const customTerminal = ['terminalPrompt', 'terminalBranch', 'command', 'output'].some((key) => options[key] !== defaults[key]);
for (const state of active.filter((item) => ['ready', 'typed', 'output'].includes(item.dataset.t3Phase))) {
  const image = state.querySelector('[data-terminal-canvas]');
  const overlay = document.createElement('div');
  overlay.className = 'terminal-custom';
  overlay.hidden = !customTerminal;
  overlay.setAttribute('data-layout-ignore', '');
  const phase = state.dataset.t3Phase;
  const makePrompt = () => {
    const line = document.createElement('div');
    line.innerHTML = '<span class="directory"></span> <span class="branch"></span> <span class="prompt-dot">●</span> ❯ ';
    line.querySelector('.directory').textContent = options.terminalPrompt;
    line.querySelector('.branch').textContent = options.terminalBranch;
    return line;
  };
  const line = makePrompt();
  if (phase !== 'ready') line.append(document.createTextNode(options.command));
  overlay.append(line);
  if (phase === 'output') {
    const result = document.createElement('div');
    result.textContent = options.output;
    overlay.append(result, makePrompt());
  }
  image.parentElement.style.position = 'relative';
  image.insertAdjacentElement('afterend', overlay);
  image.hidden = customTerminal;
}
const clock = { frame: 0 };
function draw() {
  const frame = Math.max(0, Math.min(119, Math.round(clock.frame)));
  const starts = [0, Number(options.addSurfaceFrame), Number(options.terminalFrame), Number(options.typeFrame), Number(options.runFrame)];
  for (let index = 1; index < starts.length; index++) starts[index] = Math.max(starts[index], starts[index - 1] + 1);
  let phase = 0;
  for (let index = 1; index < starts.length; index++) if (frame >= starts[index]) phase = index;
  for (const state of states) state.hidden = state !== active[phase];
  if (phase > 1 && !customTerminal) {
    const sequence = sequences[options.theme];
    const phaseStart = starts[phase];
    const sourceStart = [0, 0, ${fixtures.dark.events.terminal}, ${fixtures.dark.events.type}, ${fixtures.dark.events.run}][phase];
    const sourceEnd = [0, 0, ${fixtures.dark.events.type}, ${fixtures.dark.events.run}, 120][phase];
    const sourceFrame = sourceStart + ((frame - phaseStart) % (sourceEnd - sourceStart));
    active[phase].querySelector('[data-terminal-canvas]').src = 'compositions/' + sequence[sourceFrame];
  }
}
draw();
const timeline = gsap.timeline({ paused: true });
timeline.to(clock, { frame: 120, duration: 4, ease: 'none', onUpdate: draw });
window.__timelines['${name}'] = timeline;
</script></template></body></html>`;

await mkdir(resolve(output, "licenses"), { recursive: true });
await writeFile(resolve(output, `${name}.html`), html);
await writeFile(resolve(output, "t3-code-gsap.min.js"), gsap);
for (const theme of themes) {
  for (const asset of Object.keys(fixtures[theme].canvasAssets)) await copyFile(resolve(source, asset), resolve(output, asset));
}
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
  ...themes.flatMap((theme) => Object.keys(fixtures[theme].canvasAssets).map((path) => ({
    path, target: `compositions/${path}`, type: "hyperframes:asset",
  }))),
  ...["T3-CODE-LICENSE.txt", "T3-THIRD_PARTY_NOTICES.md", "PIERRE-TREES-LICENSE.md", "PIERRE-TREES-NOTICE.md", "PIERRE-DIFFS-LICENSE.md"].map((file) => ({
    path: `licenses/${file}`, target: `THIRD_PARTY_LICENSES/t3-code/${file}`, type: "hyperframes:asset",
  })),
  { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
];
await writeFile(resolve(output, "registry-item.json"), JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json", name, type: "hyperframes:block",
  title: "T3 Code: Terminal Check",
  description: "Open a T3 Code v0.0.42 Terminal surface from a source file and run a command in the Hyfrme demo workspace.",
  tags: ["composition", "app-ui", "t3-code", "terminal", "hyfrme-port"],
  author: "Hyfrme", authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT",
  dimensions: fixtures.dark.viewport, duration: 4, files,
}, null, 2) + "\n");
await writeFile(resolve(output, "README.md"), `# T3 Code: Terminal Check\n\nThis four-second block captures the official T3 Code v0.0.42 source-file tab, add-surface menu, and live local terminal command at 1200 × 659 and 30 fps in dark and light themes. The real shell runs \`git status --short\` in an isolated Hyfrme demo repository; no AI provider or GitHub account is involved.\n\nProject, source file, thread labels, shell prompt/branch/command/output, theme, and interaction frames are HyperFrames variables. The default terminal pixels come from the native Ghostty canvas, including cursor states; edited command/output values use a customizable HTML terminal surface. Source: https://github.com/pingdotgg/t3code/tree/${fixtures.dark.sourceCommit}. Installed files include T3 Code and Pierre attribution and license files.\n`);
console.log(`Generated ${name} from dual-theme native v0.0.42 terminal captures.`);
