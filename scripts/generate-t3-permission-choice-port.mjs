import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.35");
const name = "t3-permission-choice";
const output = resolve(root, "registry/blocks", name);
const fixture = JSON.parse(
  await readFile(resolve(source, "permission-choice-fixture.json"), "utf8"),
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
  ["before", "menu", "portal", "after"].map((phase) =>
    readFile(resolve(source, `permission-choice-${phase}.html`), "utf8"),
  ),
);
states[2] = states[2].replace("<div id=", "<div data-layout-ignore id=");
states[1] = states[1].replace("<form ", "<form data-layout-ignore ");

const fields = [
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
  ["settledAge", "Settled thread age", "3h"],
  ["modelName", "Model", "GPT-5.6-Sol"],
  ["reasoningLevel", "Reasoning level", fixture.reasoning],
  ["permissionBefore", "Previous permission", fixture.permissionBefore],
  ["permissionAfter", "Selected permission", fixture.permissionAfter],
  ["supervisedLabel", "Supervised label", "Supervised"],
  ["supervisedDetail", "Supervised detail", "Ask before commands and file changes."],
  ["autoAcceptDetail", "Auto-accept detail", "Auto-approve edits, ask before other actions."],
  ["autoLabel", "Auto label", "Auto"],
  ["autoDetail", "Auto detail", "Supported providers approve routine actions; others still ask."],
  ["fullAccessDetail", "Full access detail", "Allow commands and edits without prompts."],
  ["workspaceMode", "Workspace", "Current checkout"],
  ["prompt", "Prompt", fixture.prompt],
];
const variables = [
  ...fields.map(([id, label, value]) => ({
    id,
    type: "string",
    label,
    default: value,
  })),
  {
    id: "openFrame",
    type: "number",
    label: "Open picker at frame",
    default: fixture.openFrame,
    min: 0,
    max: 90,
    step: 1,
  },
  {
    id: "selectFrame",
    type: "number",
    label: "Select permission at frame",
    default: fixture.selectFrame,
    min: 20,
    max: 119,
    step: 1,
  },
  {
    id: "headingOffset",
    type: "number",
    label: "Heading vertical offset",
    default: 1,
    min: -4,
    max: 4,
    step: 1,
  },
];
const defaults = Object.fromEntries(fields.map(([id, , value]) => [id, value]));
defaults.openFrame = fixture.openFrame;
defaults.selectFrame = fixture.selectFrame;
defaults.headingOffset = 1;
const textReplacements = Object.fromEntries(
  fields
    .filter(([id]) => !id.endsWith("Age"))
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
  .t3-stage h1 { position: relative; top: 1px; }
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
    <div class="t3-state" data-t3-state="before">${states[0]}</div>
    <div class="t3-state" data-t3-state="menu" hidden>${states[1]}${states[2]}</div>
    <div class="t3-state" data-t3-state="after" hidden>${states[3]}</div>
  </div>
</div>
<script src="t3-code-gsap.min.js"></script>
<script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
const stage = document.querySelector('#root .t3-stage');
if (options.headingOffset !== 1) {
  stage.querySelectorAll('h1').forEach((heading) => { heading.style.top = options.headingOffset + 'px'; });
}
for (const [key, value] of Object.entries(${scriptJson(fontTheme)})) stage.style.setProperty(key, value);
stage.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
const replacements = ${scriptJson(textReplacements)};
const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
let node;
while ((node = walker.nextNode())) {
  const current = node.textContent.trim();
  const key = replacements[current];
  if (node.parentElement?.closest('[data-slot="select-popup"]') && !['permissionBefore', 'permissionAfter', 'supervisedLabel', 'supervisedDetail', 'autoAcceptDetail', 'autoLabel', 'autoDetail', 'fullAccessDetail'].includes(key)) continue;
  if (key && options[key] !== defaults[key]) node.textContent = node.textContent.replace(current, options[key]);
}
const sections = [...stage.querySelectorAll('[data-t3-state]')];
const ageKeys = ['threadOneAge', 'threadTwoAge', 'threadThreeAge', 'threadFourAge', 'threadFiveAge'];
for (const section of sections) {
  section.querySelectorAll('[data-testid="sidebar-row-card"]').forEach((row, index) => {
    const age = row.querySelector('span.tabular-nums.text-secondary-label');
    if (age && ageKeys[index]) age.textContent = options[ageKeys[index]];
  });
  const settledAge = section.querySelector('[data-testid="sidebar-row-slim"] .text-xs');
  if (settledAge) settledAge.textContent = options.settledAge;
}
const clock = { frame: 0 };
function draw() {
  const frame = Math.round(clock.frame);
  const selectFrame = Math.max(Number(options.selectFrame), Number(options.openFrame) + 5);
  const phase = frame < options.openFrame ? 0 : frame < selectFrame ? 1 : 2;
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
await copyFile(
  resolve(root, "parity/t3-gallery/assets/T3-CODE-LICENSE.txt"),
  resolve(output, "licenses/T3-CODE-LICENSE.txt"),
);
await writeFile(
  resolve(output, "registry-item.json"),
  `${JSON.stringify(
    {
      $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
      name,
      type: "hyperframes:block",
      title: "T3 Code: Permission Choice",
      description:
        "Open T3 Code's native access menu and select Auto-accept edits while the full workspace stays visible.",
      tags: ["composition", "app-ui", "t3-code", "permission-choice", "hyfrme-port"],
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
  `# T3 Code: Permission Choice

This four-second block reproduces the T3 Code v${fixture.sourceTag.slice(1)} permission-choice menu at 1200 × 659 and 30 fps. It opens the native access menu and changes Full access to Auto-accept edits. The full T3 Code workspace remains visible throughout.

Set the same project, branch, thread, age, model, reasoning, and prompt variables on adjacent T3 Code blocks for a continuous workspace. Set the following block's permission mode to this block's permissionAfter value. The menu opens at openFrame and commits the selection at selectFrame. You can customize the option labels, descriptions, workspace copy, and timing. The native heading sits one pixel lower in this capture; set headingOffset to 0 when cutting directly from Reasoning Level to keep the title still. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. The installed files include the T3 Code MIT license. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.
`,
);
console.log(`Generated ${name} from the pinned T3 Code permission-choice menu.`);
