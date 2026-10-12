import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.35");
const name = "t3-diff-review";
const output = resolve(root, process.env.T3_BLOCK_OUTPUT ?? ".work/t3-diff-review-candidate");
const fixture = JSON.parse(await readFile(resolve(source, "diff-review-fixture.json"), "utf8"));
const theme = JSON.parse(await readFile(resolve(source, "dark-theme.json"), "utf8"));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const phases = fixture.phases;
const states = await Promise.all(phases.map((phase) => readFile(resolve(source, `diff-review-${phase}.html`), "utf8")));
const shadows = await Promise.all(phases.map(async (phase) =>
  JSON.parse(await readFile(resolve(source, `diff-review-${phase}-shadows.json`), "utf8"))));

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["branchName", "Branch name", "feature/logo-enter"],
  ["selectedThread", "Selected thread", "Build a logo intro"],
  ["otherThread", "Next thread", "Catalog motion audit"],
  ["threadThree", "Sidebar thread 3", "Grouped logo tests"],
  ["threadFour", "Sidebar thread 4", "Review final hold"],
  ["threadFive", "Sidebar thread 5", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ["message", "User message", "Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames."],
  ["replyStart", "Reply before file", "I found the Logo Enter timing in"],
  ["replyFile", "Reply file", "logo-enter.html"],
  ["replyEnd", "Reply after file", ". The final pass can extend the duration while keeping the last rendered frame still."],
  ["workedDuration", "Worked duration", "2m"],
  ["composerPlaceholder", "Composer placeholder", "Enable a provider in Settings to send a message"],
  ["providerStatus", "Provider status", "No provider available"],
  ["permissionMode", "Permission", "Full access"],
  ["workspaceMode", "Workspace", "Worktree"],
  ["diffScope", "Diff scope", "Working tree"],
  ["fileName", "Changed file name", "logo-enter.html"],
  ["logoClass", "HTML logo class", "logo"],
  ["logoText", "Changed logo text", "Hyfrme"],
  ["captionClass", "HTML caption class", "caption"],
  ["captionText", "Added caption text", "Logo Enter"],
  ["additions", "Added line count", "+4"],
  ["deletions", "Deleted line count", "-1"],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  ...Object.entries(fixture.events).map(([phase, frame]) => ({
    id: `${phase}Frame`, type: "number", label: `${phase[0].toUpperCase()}${phase.slice(1)} at frame`,
    default: frame, min: 0, max: 119, step: 1,
  })),
];
const defaults = Object.fromEntries(fields.map(([id, , value]) => [id, value]));
for (const [phase, frame] of Object.entries(fixture.events)) defaults[`${phase}Frame`] = frame;
const textReplacements = Object.fromEntries(fields.filter(([id]) => ![
  "replyFile", "workedDuration", "composerPlaceholder", "fileName", "logoClass", "logoText",
  "captionClass", "captionText", "additions", "deletions",
].includes(id)).map(([id, , value]) => [value, id]));
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
  .t3-native-diff-canvas { position: absolute; z-index: 100; left: 661px; top: 90px; width: 539px; height: 310px; pointer-events: none; display: none; }
  @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
  @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
  @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
  @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"); }
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
  <div class="dark t3-stage">
    <svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;overflow:hidden" aria-hidden="true"><symbol id="file-tree-builtin-html" viewBox="0 0 16 16"><path fill="currentColor" d="M8 1C2.24 1 1 2.24 1 8s1.24 7 7 7 7-1.24 7-7-1.24-7-7-7" class="bg" opacity=".2"></path><path fill="currentColor" d="M10.48 3.76a.5.5 0 0 1 .4.58L10.6 5.8h1.14a.5.5 0 0 1 0 1h-1.32L10 9.2h1.08a.5.5 0 1 1-.98-.18l.27-1.46H6.4l-.3 1.64a.5.5 0 1 1-.98-.18l.27-1.46H4.25a.5.5 0 0 1 0-1h1.32L6 6.8H4.93a.5.5 0 0 1 0-1H6.2l.3-1.64a.5.5 0 1 1 .98.18L7.2 5.8h2.4l.3-1.64a.5.5 0 0 1 .58-.4M6.58 9.2h2.4l.44-2.4h-2.4z" class="fg"></path></symbol></svg>
${states.map((state, index) => `    <div class="t3-state" data-t3-state="${phases[index]}"${index ? " hidden" : ""}>${state}</div>`).join("\n")}
    <img class="t3-native-diff-canvas" data-t3-diff-canvas="stacked" src="t3-diff-review-stacked.png" alt="">
    <img class="t3-native-diff-canvas" data-t3-diff-canvas="split" src="t3-diff-review-split.png" alt="">
  </div>
</div>
<script src="t3-code-gsap.min.js"></script>
<script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
const phases = ${scriptJson(phases)};
const useNativeDiffCanvas = ${scriptJson(fields.map(([id]) => id))}.every((id) => options[id] === defaults[id]);
const stage = document.querySelector('#root .t3-stage');
for (const [key, value] of Object.entries(${scriptJson(fontTheme)})) stage.style.setProperty(key, value);
stage.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
const sections = [...stage.querySelectorAll('[data-t3-state]')];
const shadowStates = ${scriptJson(shadows)};
const roots = [stage];
for (const [index, section] of sections.entries()) {
  for (const shadow of shadowStates[index]) {
    const host = section.querySelector('[data-hyfrme-shadow-id="' + shadow.id + '"]');
    if (!host) throw new Error('Missing native T3 shadow host ' + shadow.id);
    const shadowRoot = host.attachShadow({ mode: 'open' });
    shadowRoot.innerHTML = shadow.html;
    if (host.tagName === 'DIFFS-CONTAINER') {
      for (const code of shadowRoot.querySelectorAll('pre[data-diff]')) code.style.fontFamily = '"Liberation Mono", monospace';
    }
    shadowRoot.adoptedStyleSheets = shadow.adoptedCss.map((css) => {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      return sheet;
    });
    roots.push(shadowRoot);
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
for (const section of sections) {
  const replyFile = section.querySelector('.chat-markdown-file-link .truncate');
  if (replyFile) replyFile.textContent = options.replyFile;
  const worked = [...section.querySelectorAll('span')].find((element) => element.textContent === 'Worked for 2m');
  if (worked) worked.textContent = 'Worked for ' + options.workedDuration;
  for (const editor of section.querySelectorAll('[data-testid="composer-editor"]')) editor.setAttribute('aria-placeholder', options.composerPlaceholder);
  for (const stat of section.querySelectorAll('[role="group"][aria-label="4 additions, 1 deletions"]')) {
    stat.querySelector('.text-success').textContent = options.additions;
    stat.querySelector('.text-destructive').textContent = options.deletions;
    stat.setAttribute('aria-label', options.additions + ' additions, ' + options.deletions + ' deletions');
  }
  for (const shadow of section.querySelectorAll('diffs-container')) {
    const root = shadow.shadowRoot;
    if (!root) continue;
    for (const count of root.querySelectorAll('[data-additions-count]')) count.textContent = options.additions;
    for (const count of root.querySelectorAll('[data-deletions-count]')) count.textContent = options.deletions;
    if (options.fileName !== defaults.fileName) root.querySelector('[data-title] bdi').textContent = options.fileName;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (!node.parentElement?.closest('[data-code]')) continue;
      let value = node.textContent;
      value = value.replaceAll('class="logo"', 'class="' + options.logoClass + '"');
      value = value.replaceAll('class="caption"', 'class="' + options.captionClass + '"');
      value = value.replaceAll('Hyfrme', options.logoText);
      value = value.replaceAll('Logo Enter', options.captionText);
      node.textContent = value;
    }
  }
}
const clock = { frame: 0 };
function draw() {
  const frame = Math.round(clock.frame);
  const chooser = Number(options.chooserFrame);
  const stacked = Math.max(Number(options.stackedFrame), chooser + 1);
  const split = Math.max(Number(options.splitFrame), stacked + 1);
  const phase = frame < chooser ? 0 : frame < stacked ? 1 : frame < split ? 2 : 3;
  for (let index = 0; index < sections.length; index++) sections[index].hidden = index !== phase;
  for (const canvas of stage.querySelectorAll('[data-t3-diff-canvas]')) {
    canvas.style.display = useNativeDiffCanvas && canvas.dataset.t3DiffCanvas === phases[phase] ? 'block' : 'none';
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
for (const [phase, frame] of [["stacked", 55], ["split", 86]]) {
  const crop = spawnSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-i", resolve(root, `parity/${name}-reference.mkv`),
    "-vf", `select=eq(n\\,${frame}),crop=539:310:661:90`,
    "-frames:v", "1", resolve(output, `${name}-${phase}.png`),
  ], { encoding: "utf8" });
  if (crop.status !== 0) throw new Error(crop.stderr);
}
await copyFile(resolve(root, "public/ideas/assets/T3-CODE-LICENSE.txt"), resolve(output, "licenses/T3-CODE-LICENSE.txt"));
for (const [sourceName, targetName] of [
  ["source-file-open-t3-third-party-notices.md", "T3-THIRD_PARTY_NOTICES.md"],
  ["source-file-open-pierre-diffs-license.md", "PIERRE-DIFFS-LICENSE.md"],
]) await copyFile(resolve(source, sourceName), resolve(output, "licenses", targetName));
await writeFile(resolve(output, "registry-item.json"), `${JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: Diff Review",
  description: "Open T3 Code's real Working tree diff for a Hyfrme Logo Enter change, then switch from stacked to split review.",
  tags: ["composition", "app-ui", "t3-code", "diff-review", "hyfrme-port"],
  author: "Hyfrme", authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT",
  dimensions: fixture.viewport, duration: fixture.frames / fixture.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    ...["stacked", "split"].map((phase) => ({ path: `${name}-${phase}.png`, target: `compositions/${name}-${phase}.png`, type: "hyperframes:asset" })),
    { path: "licenses/T3-CODE-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt", type: "hyperframes:asset" },
    { path: "licenses/T3-THIRD_PARTY_NOTICES.md", target: "THIRD_PARTY_LICENSES/t3-code/T3-THIRD_PARTY_NOTICES.md", type: "hyperframes:asset" },
    { path: "licenses/PIERRE-DIFFS-LICENSE.md", target: "THIRD_PARTY_LICENSES/pierre/PIERRE-DIFFS-LICENSE.md", type: "hyperframes:asset" },
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2)}\n`);
await writeFile(resolve(output, "README.md"), `# T3 Code: Diff Review\n\nThis four-second block reproduces T3 Code v${fixture.sourceTag.slice(1)} at 1200 × 659 and 30 fps. A real Hyfrme Logo Enter Git change opens in the native Working tree diff, then changes from stacked to split view. The Pierre diff viewer is restored from captured T3 shadow DOM and styles. At the pinned default content, the code area uses two cropped native canvases to preserve the exact diff font raster. Changing visible content switches the same area to editable Pierre DOM.\n\nProject, conversation, diff text, counts, and interaction timing are editable. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. The installed files include T3 Code's MIT license, its bundled vscode-icons notice, and the Apache 2.0 license for @pierre/diffs 1.3.0-beta.10. GSAP 3.14.2 is included for offline frame control under its Standard License: https://gsap.com/standard-license/.\n`);
console.log(`Generated ${name} from pinned T3 Code diff UI at ${output}`);
