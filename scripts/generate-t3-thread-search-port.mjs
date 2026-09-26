import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.35");
const name = "t3-thread-search";
const output = resolve(root, ".work/t3-thread-search-block");
const fixture = JSON.parse(await readFile(resolve(source, "thread-search-fixture.json"), "utf8"));
const theme = JSON.parse(await readFile(resolve(source, "dark-theme.json"), "utf8"));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const snapshots = Object.fromEntries(await Promise.all(
  Object.entries(fixture.stateFiles).map(async ([stateKey, { file }]) => [stateKey, await readFile(resolve(source, file), "utf8")]),
));
const textFields = [
  ["projectName", "Project name", "hyfrme"],
  ["branchName", "Branch name", "main"],
  ["threadOne", "Thread 1", "Build a logo intro"],
  ["threadTwo", "Thread 2", "Catalog motion audit"],
  ["threadThree", "Thread 3", "Grouped logo tests"],
  ["threadFour", "Thread 4", "Review final hold"],
  ["threadFive", "Thread 5", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ["threadOneAge", "Thread 1 age", "3h"],
  ["threadTwoAge", "Thread 2 age", "5h"],
  ["threadThreeAge", "Thread 3 age", "10h"],
  ["threadFourAge", "Thread 4 age", "1d"],
  ["threadFiveAge", "Thread 5 age", "2d"],
  ["settledAge", "Settled age", "4h"],
  ["modelName", "Model", "GPT-5.6-Sol"],
  ["reasoningLevel", "Reasoning", "Low"],
  ["permissionMode", "Permission", "Full access"],
  ["workspaceMode", "Workspace", "Current checkout"],
  ["composerPlaceholder", "Composer placeholder", "Ask for changes, send follow-ups, or attach images"],
  ["firstQuery", "First query", fixture.firstQuery],
  ["finalQuery", "Final query", fixture.finalQuery],
];
const numberFields = [
  ["firstStartFrame", "First search starts at frame", 10],
  ["firstStepFrames", "Frames per first-query character", 5],
  ["clearStartFrame", "Clear first query at frame", 56],
  ["secondStartFrame", "Second search starts at frame", 60],
  ["secondStepFrames", "Frames per final-query character", 4],
];
const variables = [
  ...textFields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  ...numberFields.map(([id, label, value]) => ({ id, type: "number", label, default: value, min: 0, max: 119, step: 1 })),
];
const defaults = Object.fromEntries(variables.map(({ id, default: value }) => [id, value]));
const themeStyle = Object.entries(theme).map(([key, value]) => `${key}:${value};`).join("");
const fontTheme = Object.fromEntries(Object.entries(theme).filter(([key]) =>
  key.includes("font-family") || key === "--font-sans" || key === "--font-mono",
));
const escapeAttribute = (value) => value
  .replaceAll("&", "&amp;").replaceAll("'", "&#39;")
  .replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const scriptJson = (value) => JSON.stringify(value).replaceAll("</", "<\\/");

const html = `<!doctype html>
<html lang="en" data-composition-variables='${escapeAttribute(JSON.stringify(variables))}'>
<head><meta charset="utf-8"></head>
<body>
<template>
<style>${css}</style>
<style>
  #root { position: relative; width: 100%; height: 100%; overflow: hidden; }
  .t3-stage { ${themeStyle} position: relative; width: 100%; height: 100%; overflow: hidden; background: oklch(14.5% 0 0); color: oklch(97% 0 0); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
  .t3-source-root { position: relative; width: 100%; height: 100%; }
  .base-ui-disable-scrollbar { scrollbar-width: none; }
  .base-ui-disable-scrollbar::-webkit-scrollbar { display: none; }
  @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
  @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
  @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
  @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"); }
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
  <div class="dark t3-stage"><div class="t3-source-root"></div></div>
</div>
<script src="t3-code-gsap.min.js"></script>
<script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
const snapshots = ${scriptJson(snapshots)};
const threadRows = ${scriptJson(fixture.threadRows)};
const referenceQueries = ${scriptJson(fixture.queries)};
const referenceStateKeys = ${scriptJson(fixture.stateKeys)};
const stage = document.querySelector('#root .t3-stage');
const surface = stage.querySelector('.t3-source-root');
for (const [key, value] of Object.entries(${scriptJson(fontTheme)})) stage.style.setProperty(key, value);
stage.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
const textMap = ${scriptJson(Object.fromEntries(textFields.map(([id, , value]) => [value, id])))};
const titles = ['threadOne', 'threadTwo', 'threadThree', 'threadFour', 'threadFive', 'settledThread'];
const ages = ['threadOneAge', 'threadTwoAge', 'threadThreeAge', 'threadFourAge', 'threadFiveAge', 'settledAge'];
const contentCustomized = titles.some((key) => options[key] !== defaults[key]);
const queryCustomized = options.firstQuery !== defaults.firstQuery || options.finalQuery !== defaults.finalQuery ||
  ${scriptJson(numberFields.map(([id]) => id))}.some((key) => Number(options[key]) !== defaults[key]);
function queryAt(frame) {
  if (!queryCustomized) return referenceQueries[frame];
  if (frame < options.firstStartFrame) return '';
  if (frame < options.clearStartFrame) return options.firstQuery.slice(0, Math.floor((frame - options.firstStartFrame) / Math.max(1, options.firstStepFrames)) + 1);
  if (frame < options.secondStartFrame) {
    const remaining = (options.secondStartFrame - frame - 1) / Math.max(1, options.secondStartFrame - options.clearStartFrame);
    return options.firstQuery.slice(0, Math.round(options.firstQuery.length * remaining));
  }
  return options.finalQuery.slice(0, Math.floor((frame - options.secondStartFrame) / Math.max(1, options.secondStepFrames)) + 1);
}
function replaceVisibleText() {
  const changed = Object.entries(textMap).filter(([original, key]) => options[key] !== defaults[key]);
  if (!changed.length) return;
  const walker = document.createTreeWalker(surface, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    let value = node.textContent;
    for (const [original, key] of changed) value = value.replaceAll(original, String(options[key]));
    if (value !== node.textContent) node.textContent = value;
  }
  for (const element of surface.querySelectorAll('*')) {
    for (const name of ['aria-label', 'title', 'placeholder']) {
      const originalValue = element.getAttribute(name);
      if (!originalValue) continue;
      let value = originalValue;
      for (const [original, key] of changed) value = value.replaceAll(original, String(options[key]));
      if (value !== originalValue) element.setAttribute(name, value);
    }
  }
}
function rebuildResults(query) {
  if (!query || (!contentCustomized && !queryCustomized)) return;
  const input = surface.querySelector('input[aria-label="Search threads"]');
  if (!input) return;
  const matches = titles.map((key, index) => ({ key, age: ages[index] }))
    .filter(({ key }) => String(options[key]).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const list = surface.querySelector('#sidebar-thread-search-results');
  if (!list) return;
  if (!matches.length) {
    const empty = document.createElement('p');
    empty.setAttribute('role', 'status');
    empty.className = 'px-2 py-6 text-center text-xs text-sidebar-muted-foreground';
    empty.textContent = 'No threads found';
    list.replaceWith(empty);
  } else {
    list.innerHTML = matches.map(({ key, age }, index) => {
      const defaultTitle = defaults[key];
      const row = document.createElement('div');
      row.innerHTML = threadRows[defaultTitle];
      const button = row.querySelector('button[role="option"]');
      button.id = 'sidebar-thread-search-result-' + index;
      button.setAttribute('aria-selected', String(index === 0));
      if (index) button.className = button.className.replace('bg-sidebar-row-active text-sidebar-foreground', 'text-sidebar-muted-foreground/75 hover:bg-sidebar-row-hover hover:text-sidebar-foreground');
      const title = button.querySelector('span.min-w-0.flex-1.truncate');
      if (title) title.textContent = String(options[key]);
      const time = button.querySelector('span.tabular-nums');
      if (time) time.textContent = String(options[age]);
      button.setAttribute('aria-label', String(options[key]) + ', ' + String(options.projectName));
      return row.innerHTML;
    }).join('');
  }
  input.setAttribute('aria-expanded', String(matches.length > 0));
  input.setAttribute('aria-activedescendant', matches.length ? 'sidebar-thread-search-result-0' : '');
}
let renderedState;
const clock = { frame: 0 };
function draw() {
  const frame = Math.max(0, Math.min(119, Math.round(clock.frame)));
  const query = queryAt(frame);
  const stateKey = queryCustomized ? referenceStateKeys[query ? 25 : 0] : referenceStateKeys[frame];
  const renderKey = stateKey + '\\0' + query;
  if (renderedState === renderKey) return;
  renderedState = renderKey;
  surface.innerHTML = snapshots[stateKey];
  const input = surface.querySelector('input[aria-label="Search threads"]');
  if (input) { input.value = query; input.setAttribute('value', query); }
  replaceVisibleText();
  rebuildResults(query);
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
await writeFile(resolve(output, "registry-item.json"), `${JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: Thread Search",
  description: "Search T3 Code threads in the full workspace with native search-result states and editable Hyfrme thread data.",
  tags: ["composition", "app-ui", "t3-code", "thread-search", "hyfrme-port"],
  author: "Hyfrme", authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT",
  dimensions: fixture.viewport, duration: fixture.frames / fixture.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    { path: "licenses/T3-CODE-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt", type: "hyperframes:asset" },
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2)}\n`);
await writeFile(resolve(output, "README.md"), `# T3 Code: Thread Search

This four-second, 1200 × 659 block reproduces the T3 Code v0.0.35 thread-search flow at 30 fps. The full workspace stays visible as Logo narrows the list, the field clears, and Grouped logo leaves one result.

Edit the two queries, each Hyfrme thread title and age, project and composer labels, and frame timing with HyperFrames variables. Use the same project and thread values in adjacent T3 Code blocks for continuity. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. The installed files include the T3 Code MIT license. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.
`);
console.log(`Generated ${name} from ${Object.keys(snapshots).length} pinned T3 Code DOM states.`);
