import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.35");
const name = "t3-sidebar-focus";
const output = resolve(root, "registry/blocks", name);
const fixture = JSON.parse(
  await readFile(resolve(source, "sidebar-focus-fixture.json"), "utf8"),
);
const theme = JSON.parse(
  await readFile(resolve(source, "dark-theme.json"), "utf8"),
);
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(
  resolve(root, "registry/blocks/before-after/gsap.min.js"),
  "utf8",
);
const states = await Promise.all(
  ["open", "collapsed", "restored"].map((phase) =>
    readFile(resolve(source, `sidebar-focus-${phase}.html`), "utf8"),
  ),
);

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["branchName", "Branch name", "main"],
  ["threadOne", "Thread 1", "Build a logo intro"],
  ["threadTwo", "Thread 2", "Catalog motion audit"],
  ["threadThree", "Thread 3", "Grouped logo tests"],
  ["threadFour", "Thread 4", "Review final hold"],
  ["threadFive", "Thread 5", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ...fixture.threadAges.map((age, index) => [`thread${index + 1}Age`, `Thread ${index + 1} age`, age]),
  ["settledAge", "Settled thread age", "3h"],
  ["prompt", "Prompt", fixture.prompt],
  ["modelName", "Model", "GPT-5.6-Sol"],
  ["reasoningLevel", "Reasoning", "Low"],
  ["permissionMode", "Permission", "Full access"],
  ["workspaceMode", "Workspace", "Current checkout"],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "collapseFrame", type: "number", label: "Collapse at frame", default: fixture.collapseFrame, min: 0, max: 100, step: 1 },
  { id: "restoreFrame", type: "number", label: "Restore at frame", default: fixture.restoreFrame, min: 10, max: 119, step: 1 },
  { id: "transitionMs", type: "number", label: "Slide duration in ms", default: fixture.transitionMs, min: 0, max: 1000, step: 10 },
  { id: "sidebarWidth", type: "number", label: "Sidebar width", default: fixture.sidebarWidth, min: 200, max: 350, step: 1 },
];
const defaults = Object.fromEntries(fields.map(([id, , value]) => [id, value]));
defaults.collapseFrame = fixture.collapseFrame;
defaults.restoreFrame = fixture.restoreFrame;
defaults.transitionMs = fixture.transitionMs;
defaults.sidebarWidth = fixture.sidebarWidth;
const textReplacements = Object.fromEntries(
  fields.filter(([id]) => !id.endsWith("Age"))
    .map(([id, , value]) => [value, id]),
);
const fontTheme = Object.fromEntries(
  Object.entries(theme).filter(
    ([name]) =>
      name.includes("font-family") ||
      name === "--font-sans" ||
      name === "--font-mono",
  ),
);
const stageTheme = Object.entries(theme)
  .map(([key, value]) => `${key}:${value};`)
  .join("");
const escapeAttribute = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
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
    <div class="t3-state" data-t3-state="open">${states[0]}</div>
    <div class="t3-state" data-t3-state="collapsed" hidden>${states[1]}</div>
    <div class="t3-state" data-t3-state="restored" hidden>${states[2]}</div>
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
const replacements = ${scriptJson(textReplacements)};
const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
let node;
while ((node = walker.nextNode())) {
  const current = node.textContent.trim();
  const key = replacements[current];
  if (key && options[key] !== defaults[key]) node.textContent = node.textContent.replace(current, options[key]);
}
const sections = [...stage.querySelectorAll('[data-t3-state]')];
const ageKeys = ['thread1Age', 'thread2Age', 'thread3Age', 'thread4Age', 'thread5Age'];
for (const section of sections) {
  section.querySelectorAll('[data-testid="sidebar-row-card"]').forEach((row, index) => {
    const age = row.querySelector('span.tabular-nums.text-secondary-label');
    if (age && ageKeys[index]) age.textContent = options[ageKeys[index]];
  });
  const settledAge = section.querySelector('[data-testid="sidebar-row-slim"] .text-xs');
  if (settledAge) settledAge.textContent = options.settledAge;
  section.querySelector('[data-slot="sidebar-wrapper"]').style.setProperty('--sidebar-width', options.sidebarWidth + 'px');
}
const moving = sections.slice(1).map((section) => ({
  gap: section.querySelector('[data-slot="sidebar-gap"]'),
  container: section.querySelector('[data-slot="sidebar-container"]'),
  rail: section.querySelector('[data-slot="sidebar-rail"]'),
  header: section.querySelector('[data-chat-header="true"]'),
}));
for (const parts of moving) {
  parts.gap.style.transition = 'none';
  parts.container.style.transition = 'none';
  parts.rail.style.transition = 'none';
  parts.header.style.transition = 'none';
}
const clock = { frame: 0 };
function draw() {
  const frame = Math.round(clock.frame);
  const collapseFrame = Number(options.collapseFrame);
  const restoreFrame = Math.max(Number(options.restoreFrame), collapseFrame + 1);
  const phase = frame < collapseFrame ? 0 : frame < restoreFrame ? 1 : 2;
  for (let index = 0; index < sections.length; index++) sections[index].hidden = index !== phase;
  if (phase === 0) return;
  const elapsed = (frame - (phase === 1 ? collapseFrame : restoreFrame)) * 1000 / 30;
  const progress = options.transitionMs <= 0 ? 1 : Math.min(1, elapsed / options.transitionMs);
  const closed = phase === 1 ? progress : 1 - progress;
  const parts = moving[phase - 1];
  const width = Number(options.sidebarWidth);
  parts.gap.style.width = width * (1 - closed) + 'px';
  parts.container.style.left = -width * closed + 'px';
  parts.rail.style.right = (-16 + 8 * closed) + 'px';
  parts.rail.style.translate = (-50 * (1 - closed)) + '%';
  parts.header.style.paddingLeft = (20 + 32 * closed) + 'px';
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
await copyFile(
  resolve(root, "public/ideas/assets/T3-CODE-LICENSE.txt"),
  resolve(output, "licenses/T3-CODE-LICENSE.txt"),
);
await writeFile(
  resolve(output, "registry-item.json"),
  `${JSON.stringify(
    {
      $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
      name,
      type: "hyperframes:block",
      title: "T3 Code: Sidebar Focus",
      description:
        "Collapse and restore T3 Code’s real thread sidebar around a Hyfrme source request, preserving native 200 ms motion.",
      tags: ["composition", "app-ui", "t3-code", "sidebar-focus", "hyfrme-port"],
      author: "Hyfrme",
      authorUrl: "https://github.com/AksharP5/hyfrme",
      license: "MIT",
      dimensions: fixture.viewport,
      duration: fixture.frames / fixture.fps,
      files: [
        {
          path: `${name}.html`,
          target: `compositions/${name}.html`,
          type: "hyperframes:composition",
        },
        {
          path: "t3-code-gsap.min.js",
          target: "compositions/t3-code-gsap.min.js",
          type: "hyperframes:asset",
        },
        {
          path: "licenses/T3-CODE-LICENSE.txt",
          target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt",
          type: "hyperframes:asset",
        },
        {
          path: "README.md",
          target: `compositions/${name}.README.md`,
          type: "hyperframes:asset",
        },
      ],
    },
    null,
    2,
  )}\n`,
);
await writeFile(
  resolve(output, "README.md"),
  `# T3 Code: Sidebar Focus

This four-second block reproduces the T3 Code v${fixture.sourceTag.slice(1)} sidebar collapse and restore at 1200 × 659 and 30 fps. It uses the pinned full workspace DOM and CSS, including the native 200 ms linear slide, around a Hyfrme source request.

Set the same project, branch, thread, age, and prompt variables on adjacent T3 Code blocks for a continuous workspace. collapseFrame, restoreFrame, transitionMs, and sidebarWidth control the framing. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. The installed files include the T3 Code MIT license. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.
`,
);
console.log(`Generated ${name} from the pinned T3 Code sidebar UI.`);
