import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.35");
const name = "t3-thread-reorder";
const output = resolve(root, ".work/t3-thread-reorder-candidate");
const fixture = JSON.parse(await readFile(resolve(source, "thread-reorder-fixture.json"), "utf8"));
const theme = JSON.parse(await readFile(resolve(source, "dark-theme.json"), "utf8"));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const phases = fixture.phases;
const states = await Promise.all(phases.map((phase) => readFile(resolve(source, `thread-reorder-${phase}.html`), "utf8")));

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["branchName", "Branch name", "main"],
  ["activeBranch", "Active branch", "feature/logo-enter"],
  ["thirdBranch", "Third thread branch", "logo/assemble"],
  ["fourthBranch", "Fourth thread branch", "logo/hold-final"],
  ["firstThread", "Initially top pinned thread", "Build a logo intro"],
  ["pinThread", "Pinned thread to drag", "Catalog motion audit"],
  ["thirdThread", "Third thread", "Grouped logo tests"],
  ["fourthThread", "Fourth thread", "Review final hold"],
  ["fifthThread", "Fifth thread", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ["firstAge", "Initial thread age", "9h"],
  ["pinAge", "Moved thread age", "11h"],
  ["thirdAge", "Third thread age", "16h"],
  ["fourthAge", "Fourth thread age", "1d"],
  ["fifthAge", "Fifth thread age", "2d"],
  ["settledAge", "Settled thread age", "8h"],
  ["firstQuestion", "Initial user message", "Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames."],
  ["firstReplyLead", "Initial answer before file", "I found the Logo Enter timing in"],
  ["firstReplyFile", "Initial answer file", "logo-enter.html"],
  ["firstReplyTail", "Initial answer after file", ". The final pass can extend the duration while keeping the last rendered frame still."],
  ["firstQuestionTime", "Initial user message time", "yesterday at 9:22 PM"],
  ["firstReplyTime", "Initial answer time", "yesterday at 9:24 PM"],
  ["workedFor", "Initial work duration", "Worked for 2m"],
  ["composerPlaceholder", "Composer placeholder", "Enable a provider in Settings to send a message"],
  ["providerStatus", "Provider status", "No provider available"],
  ["permissionMode", "Permission", "Full access"],
  ["workspaceMode", "Workspace", "Worktree"],
  ["topAction", "Header action", "Commit"],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "liftFrame", type: "number", label: "Lift thread at frame", default: fixture.events.lifted, min: 1, max: 100, step: 1 },
  { id: "overFrame", type: "number", label: "Drag above first thread at frame", default: fixture.events.over, min: 2, max: 110, step: 1 },
  { id: "dropFrame", type: "number", label: "Drop reordered thread at frame", default: fixture.events.dropped, min: 3, max: 116, step: 1 },
  { id: "persistFrame", type: "number", label: "Show reloaded order at frame", default: fixture.events.persisted, min: 4, max: 119, step: 1 },
];
const defaults = Object.fromEntries(variables.map(({ id, default: value }) => [id, value]));
const replacements = Object.fromEntries(fields
  .filter(([id]) => !id.endsWith("Age"))
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
  .t3-state:is([data-t3-state="lifted"], [data-t3-state="over"]) [aria-label="Pinned threads"] > li:nth-child(2) > [data-testid="sidebar-row-card"] { background-color: var(--sidebar-row-hover); color: var(--sidebar-foreground); }
  .t3-state:is([data-t3-state="lifted"], [data-t3-state="over"]) [aria-label="Pinned threads"] > li:nth-child(2) .group\\/sidebar-status-slot > span:first-child { position: absolute; right: 0; opacity: 0; }
  .t3-state:is([data-t3-state="lifted"], [data-t3-state="over"]) [aria-label="Pinned threads"] > li:nth-child(2) .group\\/sidebar-status-slot > span:nth-child(2) { pointer-events: auto; position: static; opacity: 1; }
  .base-ui-disable-scrollbar { scrollbar-width: none; }
  .base-ui-disable-scrollbar::-webkit-scrollbar { display: none; }
  @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
  @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
  @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
  @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"); }
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
  <div class="dark t3-stage">
${states.map((body, index) => `    <div class="t3-state" data-t3-state="${phases[index]}"${index ? " hidden" : ""}>${body}</div>`).join("\n")}
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
const sections = [...stage.querySelectorAll('[data-t3-state]')];
const ageByTitle = new Map([
  [options.firstThread, options.firstAge], [options.pinThread, options.pinAge],
  [options.thirdThread, options.thirdAge], [options.fourthThread, options.fourthAge],
  [options.fifthThread, options.fifthAge],
]);
for (const section of sections) {
  section.querySelectorAll('[data-testid="sidebar-row-card"]').forEach((row) => {
    const title = row.querySelector('.mt-1 span')?.textContent?.trim();
    const age = row.querySelector('span.tabular-nums.text-secondary-label');
    if (age && ageByTitle.has(title)) age.textContent = ageByTitle.get(title);
  });
  const settledAge = section.querySelector('[data-testid="sidebar-row-slim"] .text-xs');
  if (settledAge) settledAge.textContent = options.settledAge;
  for (const editor of section.querySelectorAll('[data-testid="composer-editor"]')) {
    editor.setAttribute('aria-placeholder', options.composerPlaceholder);
  }
  for (const element of section.querySelectorAll('[aria-label], [title]')) {
    for (const attribute of ['aria-label', 'title']) {
      const label = element.getAttribute(attribute);
      if (!label) continue;
      let updated = label;
      for (const key of ['firstThread', 'pinThread', 'thirdThread', 'fourthThread', 'fifthThread', 'projectName', 'branchName', 'activeBranch', 'thirdBranch', 'fourthBranch']) {
        if (options[key] !== defaults[key]) updated = updated.replaceAll(defaults[key], String(options[key]));
      }
      if (updated !== label) element.setAttribute(attribute, updated);
    }
  }
}
const clock = { frame: 0 };
function draw() {
  const frame = Math.round(clock.frame);
  const overFrame = Math.max(Number(options.overFrame), Number(options.liftFrame) + 1);
  const dropFrame = Math.max(Number(options.dropFrame), overFrame + 1);
  const persistFrame = Math.max(Number(options.persistFrame), dropFrame + 1);
  const phase = frame < options.liftFrame ? 0 : frame < overFrame ? 1 : frame < dropFrame ? 2 : frame < persistFrame ? 3 : 4;
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
await copyFile(resolve(source, "thread-rename-t3-third-party-notices.md"), resolve(output, "licenses/T3-THIRD_PARTY_NOTICES.md"));
await copyFile(resolve(source, "source-file-open-pierre-trees-license.md"), resolve(output, "licenses/PIERRE-TREES-LICENSE.md"));
await copyFile(resolve(source, "source-file-open-pierre-trees-notice.md"), resolve(output, "licenses/PIERRE-TREES-NOTICE.md"));
await copyFile(resolve(source, "source-file-open-pierre-diffs-license.md"), resolve(output, "licenses/PIERRE-DIFFS-LICENSE.md"));
await writeFile(resolve(output, "registry-item.json"), `${JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: Reorder Pinned Threads",
  description: "Drag one pinned Hyfrme thread above another in T3 Code's real sidebar, then see the order persist after reload.",
  tags: ["composition", "app-ui", "t3-code", "thread-reorder", "hyfrme-port"],
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
await writeFile(resolve(output, "README.md"), `# T3 Code: Reorder Pinned Threads\n\nThis four-second, 1200 × 659 block reproduces T3 Code v${fixture.sourceTag.slice(1)} at 30 fps. A real pointer drag lifts a pinned Hyfrme thread, moves it above another, then commits and persists the new order across a reload. This interaction applies only to pinned threads on a server advertising the threadPinReorder capability; ordinary threads remain timestamp-sorted.\n\nCustomize project, branch, thread titles and ages, conversation content, composer copy, and the lift/over/drop/reload beats through HyperFrames variables. Match values on adjacent T3 Code blocks for continuity. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. Installed files include T3 Code's MIT license and icon notice, plus Pierre trees/diffs Apache-2.0 licenses and the trees notice for captured file-link assets. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.\n`);
console.log(`Generated ${name} from five native T3 Code pinned-drag states.`);
