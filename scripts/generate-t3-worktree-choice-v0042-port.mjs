import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-new-worktree-choice";
const output = resolve(root, ".work/t3-new-worktree-choice-v0042-candidate");
const fixture = JSON.parse(
  await readFile(resolve(source, "worktree-choice-v0042-dark-fixture.json"), "utf8"),
);
const lightFixture = JSON.parse(await readFile(resolve(source, "worktree-choice-v0042-light-fixture.json"), "utf8"));
for (const phase of ["before", "menu", "portal", "hover", "after"]) {
  const [dark, light] = await Promise.all(["dark", "light"].map((appearance) =>
    readFile(resolve(source, `worktree-choice-v0042-${appearance}-${phase}.html`), "utf8")));
  const normalizeIds = (html) => html.replace(/_r_[^_]+_/g, "_r_X_");
  if (normalizeIds(dark) !== normalizeIds(light)) throw new Error(`Native ${phase} DOM differs beyond generated IDs`);
}
const theme = JSON.parse(
  await readFile(resolve(source, "dark-theme.json"), "utf8"),
);
const lightTheme = JSON.parse(await readFile(resolve(source, "light-theme.json"), "utf8"));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(
  resolve(root, "registry/blocks/before-after/gsap.min.js"),
  "utf8",
);
const states = await Promise.all(
  ["before", "menu", "portal", "after"].map((phase) =>
    readFile(resolve(source, `worktree-choice-v0042-dark-${phase}.html`), "utf8"),
  ),
);
for (let i = 0; i < states.length; i++) {
  states[i] = states[i]
    .replace(/(<span[^>]*class="[^"]*\[text-box:trim-both_cap_alphabetic\][^"]*")/g, "$1 data-layout-ignore")
    .replace(/(<span[^>]*class="pointer-events-none absolute[^"]*")/g, "$1 data-layout-ignore");
}

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["projectAvatar", "Project avatar letters", "HE"],
  ["branchName", "Branch name", "main"],
  ["activeBranch", "Active branch", "feature/logo-enter"],
  ["thirdBranch", "Third thread branch", "logo/assemble"],
  ["fourthBranch", "Fourth thread branch", "logo/hold-final"],
  ["threadOne", "Thread 1", "Build a logo intro"],
  ["threadTwo", "Thread 2", "Catalog motion audit"],
  ["threadThree", "Thread 3", "Grouped logo tests"],
  ["threadFour", "Thread 4", "Review final hold"],
  ["threadFive", "Thread 5", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ["threadOneAge", "Thread 1 age", "10h"],
  ["threadTwoAge", "Thread 2 age", "12h"],
  ["threadThreeAge", "Thread 3 age", "17h"],
  ["threadFourAge", "Thread 4 age", "1d"],
  ["threadFiveAge", "Thread 5 age", "2d"],
  ["settledAge", "Settled thread age", "7h"],
  ["workspaceBefore", "Previous workspace", "Current checkout"],
  ["workspaceAfter", "Selected workspace", "New worktree"],
  ["baseBranch", "Base branch", "origin/feature/logo-enter"],
  ["previousWorktree", "Existing worktree option", "Previous worktree (main)"],
  ["modelName", "Model", "GPT-6-Astra"],
  ["reasoningLevel", "Reasoning", "Medium"],
  ["permissionMode", "Permission", "Full access"],
  ["prompt", "Prompt", fixture.prompt],
  ["heroLead", "Empty thread question before project", "What should we build in "],
  ["heroTail", "Empty thread question after project", "?"],
];
const variables = [
  ...fields.map(([id, label, value]) => ({
    id,
    type: "string",
    label,
    default: value,
  })),
  { id: "theme", type: "string", label: "T3 Code appearance", default: "dark", options: ["dark", "light"] },
  {
    id: "openFrame",
    type: "number",
    label: "Open picker at frame",
    default: fixture.events.open,
    min: 0,
    max: 90,
    step: 1,
  },
  {
    id: "hoverFrame",
    type: "number",
    label: "Hover New worktree at frame",
    default: fixture.events.hover,
    min: 5,
    max: 105,
    step: 1,
  },
  {
    id: "selectFrame",
    type: "number",
    label: "Select worktree at frame",
    default: fixture.events.select,
    min: 20,
    max: 119,
    step: 1,
  },
];
const defaults = Object.fromEntries(fields.map(([id, , value]) => [id, value]));
defaults.theme = "dark";
defaults.openFrame = fixture.events.open;
defaults.hoverFrame = fixture.events.hover;
defaults.selectFrame = fixture.events.select;
const textReplacements = Object.fromEntries(
  fields
    .filter(([id]) => !id.endsWith("Age") && !["baseBranch", "previousWorktree", "projectName", "projectAvatar", "heroLead", "heroTail"].includes(id))
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
  .t3-stage { ${stageTheme} position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--background); color: var(--foreground); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
  .t3-state[hidden] { display: none !important; }
  .t3-state:not([hidden]) { display: contents; }
  .t3-hover-worktree { background: var(--accent); color: var(--accent-foreground); }
  .t3-native-popup { position: absolute; z-index: 300; left: 360px; top: 430px; width: 225px; height: 150px; pointer-events: none; }
  .t3-native-popup[hidden] { display: none !important; }
  .t3-native-selection { position: absolute; z-index: 300; left: 360px; top: 395px; width: 240px; height: 180px; pointer-events: none; }
  .t3-native-selection[hidden] { display: none !important; }
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
    <img class="t3-native-popup" data-t3-native-popup="menu" src="worktree-choice-v0042-dark-menu-crop.png" width="225" height="150" alt="" aria-hidden="true" data-layout-ignore hidden>
    <img class="t3-native-popup" data-t3-native-popup="hover" src="worktree-choice-v0042-dark-hover-crop.png" width="225" height="150" alt="" aria-hidden="true" data-layout-ignore hidden>
    ${Array.from({ length: 5 }, (_, index) => `<img class="t3-native-selection" data-t3-native-selection="${index}" src="worktree-choice-v0042-dark-select-${index}-crop.png" width="240" height="180" alt="" aria-hidden="true" data-layout-ignore hidden>`).join("\n    ")}
  </div>
</div>
<script src="t3-code-gsap.min.js"></script>
<script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
const stage = document.querySelector('#root .t3-stage');
if (options.theme === 'light') {
  stage.classList.remove('dark');
  stage.classList.add('light');
  for (const [key, value] of Object.entries(${scriptJson(lightTheme)})) stage.style.setProperty(key, value);
}
for (const [key, value] of Object.entries(${scriptJson(fontTheme)})) stage.style.setProperty(key, value);
stage.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
const nativePopup = [...stage.querySelectorAll('[data-t3-native-popup]')];
const nativeSelection = [...stage.querySelectorAll('[data-t3-native-selection]')];
const nativePopupAllowed = Object.keys(defaults).every(key => ['theme', 'openFrame', 'hoverFrame', 'selectFrame'].includes(key) || options[key] === defaults[key]);
if (options.theme === 'light') {
  for (const image of [...nativePopup, ...nativeSelection]) image.src = image.src.replace('dark-', 'light-');
}
const replacements = ${scriptJson(textReplacements)};
const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
let node;
while ((node = walker.nextNode())) {
  const current = node.textContent.trim();
  if (current === defaults.projectName && options.projectName !== defaults.projectName) {
    node.textContent = node.textContent.replace(current, options.projectName);
    continue;
  }
  if (current === defaults.projectAvatar && options.projectAvatar !== defaults.projectAvatar) {
    node.textContent = node.textContent.replace(current, options.projectAvatar);
    continue;
  }
  const key = replacements[current];
  if (key && options[key] !== defaults[key]) node.textContent = node.textContent.replace(current, options[key]);
}
for (const element of stage.querySelectorAll('[aria-label], [title]')) {
  for (const attribute of ['aria-label', 'title']) {
    const original = element.getAttribute(attribute);
    if (!original) continue;
    let updated = original;
    for (const key of ['projectName', 'projectAvatar', 'branchName', 'activeBranch', 'workspaceBefore', 'workspaceAfter']) {
      if (options[key] !== defaults[key]) updated = updated.replaceAll(defaults[key], String(options[key]));
    }
    if (updated !== original) element.setAttribute(attribute, updated);
  }
}
for (const hero of stage.querySelectorAll('h1')) {
  if (hero.firstChild?.nodeType === Node.TEXT_NODE) hero.firstChild.textContent = options.heroLead;
  if (hero.lastChild?.nodeType === Node.TEXT_NODE) hero.lastChild.textContent = options.heroTail;
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
const popup = sections[1].querySelector('[data-slot="select-popup"]');
const previousWorktree = [...sections[1].querySelectorAll('[role="option"]')]
  .find((element) => element.textContent.includes(defaults.previousWorktree));
if (previousWorktree && options.previousWorktree !== defaults.previousWorktree) {
  const label = previousWorktree.querySelector('span');
  if (label?.lastChild) label.lastChild.textContent = options.previousWorktree;
}
const baseBranch = [...sections[2].querySelectorAll('span')]
  .find((element) => element.childElementCount === 0 && element.textContent === 'From ' + defaults.baseBranch);
if (baseBranch) baseBranch.textContent = 'From ' + options.baseBranch;
for (const element of [baseBranch, sections[2].querySelector('[data-composer-shortcut="composer.workspace"]')]) {
  if (!element) continue;
  element.setAttribute('data-layout-allow-occlusion', '');
  for (const child of element.querySelectorAll('*')) child.setAttribute('data-layout-allow-occlusion', '');
}
const worktreeRow = [...sections[1].querySelectorAll('[role="option"]')]
  .find((element) => element.textContent.includes(options.workspaceAfter));
if (!popup || !worktreeRow) throw new Error('Native Workspace selector structure is missing');
for (const element of popup.querySelectorAll('*')) {
  element.setAttribute('data-layout-allow-occlusion', '');
  element.setAttribute('data-layout-allow-overlap', '');
}
for (const section of sections) {
  const prompt = section.querySelector('[data-testid="composer-editor"]');
  if (prompt) prompt.setAttribute('data-layout-allow-occlusion', '');
}
const clock = { frame: 0 };
function draw() {
  const frame = Math.round(clock.frame);
  const hoverFrame = Math.max(Number(options.hoverFrame), Number(options.openFrame) + 1);
  const selectFrame = Math.max(Number(options.selectFrame), hoverFrame + 1);
  const phase = frame < options.openFrame ? 0 : frame < selectFrame ? 1 : 2;
  for (let index = 0; index < sections.length; index++) sections[index].hidden = index !== phase;
  worktreeRow.classList.toggle('t3-hover-worktree', phase === 1 && frame >= hoverFrame);
  nativePopup[0].hidden = !nativePopupAllowed || phase !== 1 || frame >= hoverFrame;
  nativePopup[1].hidden = !nativePopupAllowed || phase !== 1 || frame < hoverFrame;
  for (let index = 0; index < nativeSelection.length; index++) {
    nativeSelection[index].hidden = !nativePopupAllowed || phase !== 2 || frame - selectFrame !== index;
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
for (const appearance of ["dark", "light"]) {
  for (const phase of ["menu", "hover"]) {
    const file = `worktree-choice-v0042-${appearance}-${phase}-crop.png`;
    await copyFile(resolve(source, file), resolve(output, file));
  }
  for (let index = 0; index < 5; index++) {
    const file = `worktree-choice-v0042-${appearance}-select-${index}-crop.png`;
    await copyFile(resolve(source, file), resolve(output, file));
  }
}
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
      title: "T3 Code: New Worktree Choice",
      description:
        "Open the source-matched T3 Code Workspace selector and select a new worktree from the base branch while keeping the project and prompt in view.",
      tags: ["composition", "app-ui", "t3-code", "workspace-selector", "hyfrme-port"],
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
        ...["dark", "light"].flatMap((appearance) => ["menu", "hover"].map((phase) => {
          const file = `worktree-choice-v0042-${appearance}-${phase}-crop.png`;
          return { path: file, target: `compositions/${file}`, type: "hyperframes:asset" };
        })),
        ...["dark", "light"].flatMap((appearance) => Array.from({ length: 5 }, (_, index) => {
          const file = `worktree-choice-v0042-${appearance}-select-${index}-crop.png`;
          return { path: file, target: `compositions/${file}`, type: "hyperframes:asset" };
        })),
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
  `# T3 Code: New Worktree Choice

This four-second block reproduces the official T3 Code v${fixture.sourceTag.slice(1)} Workspace selector at 1200 × 659 and 30 fps in dark and light. It opens the actual composer control, hovers New worktree, and selects it. The native footer changes from Current checkout to New worktree, with From origin/feature/logo-enter as its base branch. No worktree is created until a prompt is sent; this block shows the native choice before that send.

Customize the project, thread rows, prompt, model, permission, workspace labels, previous worktree option, base branch, theme, and open/hover/select frames. The default menu, hover, and five selection-transition frames use cropped official dark/light captures for close parity; changing visible content switches to editable source DOM. Use matching values on adjacent blocks for a continuous workspace. The project, model, and conversation are seeded; no AI provider executes. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. The installed files include the T3 Code MIT license. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.
`,
);
console.log(`Generated ${name} from the pinned T3 Code Workspace selector.`);
