import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-permission-choice";
const output = resolve(root, ".work/t3-permission-choice-v0042-candidate");
const fixture = JSON.parse(await readFile(resolve(source, "permission-choice-fixture.json"), "utf8"));
const lightFixture = JSON.parse(await readFile(resolve(source, "permission-choice-light-fixture.json"), "utf8"));
if (fixture.sourceCommit !== "719a76ca1dbf5490f1aa33ffb9966301e02be9a9" ||
    fixture.frames !== 120 || lightFixture.frames !== 120) {
  throw new Error("Expected official v0.0.42 120-frame Permission Choice fixtures");
}
const theme = JSON.parse(await readFile(resolve(source, "dark-theme.json"), "utf8"));
const lightTheme = JSON.parse(await readFile(resolve(source, "light-theme.json"), "utf8"));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const fastState = await readFile(resolve(source, "fast-tier-v0042-dark-after.html"), "utf8");
const fastButton = fastState.match(/<button(?=[^>]*data-composer-shortcut="composer\.effort")[\s\S]*?<\/button>/)?.[0];
if (!fastButton) throw new Error("Official v0.0.42 Fast service indicator is missing");
const fastTrigger = fastButton.slice(fastButton.indexOf(">") + 1, -"</button>".length);
const phases = ["before", "menu", "hover", "after"];
const states = Object.fromEntries(await Promise.all(phases.map(async (phase) => [
  phase, (await readFile(resolve(source, `permission-choice-${phase}.html`), "utf8"))
    .replace(/(<span[^>]*class="[^"]*\[text-box:trim-both_cap_alphabetic\][^"]*")/g, "$1 data-layout-ignore")
    .replace(/(<span[^>]*class="pointer-events-none absolute[^"]*")/g, "$1 data-layout-ignore"),
])));
for (const phase of ["menu", "hover"]) {
  states[phase] += await readFile(resolve(source, `permission-choice-${phase}-portal.html`), "utf8");
}

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["projectAvatar", "Project avatar letters", "HE"],
  ["branchName", "Sidebar branch", "main"],
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
  ["modelName", "Model", "GPT-6-Astra"],
  ["reasoningLevel", "Reasoning level", "Medium"],
  ["permissionBefore", "Previous permission", fixture.permissionBefore],
  ["permissionAfter", "Selected permission", fixture.permissionAfter],
  ["supervisedLabel", "Supervised label", "Supervised"],
  ["supervisedDetail", "Supervised description", "Ask before commands and file changes."],
  ["autoAcceptDetail", "Auto-accept description", "Auto-approve edits, ask before other actions."],
  ["autoLabel", "Auto label", "Auto"],
  ["autoDetail", "Auto description", "Supported providers approve routine actions; others still ask."],
  ["fullAccessDetail", "Full access description", "Allow commands and edits without prompts."],
  ["workspaceMode", "Workspace", "Current checkout"],
  ["prompt", "Prompt", fixture.prompt],
  ["heroLead", "Question before project", "What should we build in "],
  ["heroTail", "Question after project", "?"],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "serviceTier", type: "string", label: "Service tier", default: "Standard", options: ["Standard", "Fast"] },
  { id: "theme", type: "string", label: "T3 Code appearance", default: "dark", options: ["dark", "light"] },
  { id: "openFrame", type: "number", label: "Open picker at frame", default: fixture.events.open, min: 0, max: 90, step: 1 },
  { id: "hoverFrame", type: "number", label: "Hover option at frame", default: fixture.events.hover, min: 5, max: 105, step: 1 },
  { id: "selectFrame", type: "number", label: "Select permission at frame", default: fixture.events.select, min: 20, max: 119, step: 1 },
];
const defaults = Object.fromEntries(fields.map(([id, , value]) => [id, value]));
Object.assign(defaults, { serviceTier: "Standard", theme: "dark", openFrame: fixture.events.open,
  hoverFrame: fixture.events.hover, selectFrame: fixture.events.select });
const replacements = Object.fromEntries(fields.filter(([id]) => !["heroLead", "heroTail"].includes(id))
  .map(([id, , value]) => [value, id]));
const fontTheme = Object.fromEntries(Object.entries(theme).filter(([key]) =>
  key.includes("font-family") || key === "--font-sans" || key === "--font-mono"));
const stageTheme = Object.entries(theme).map(([key, value]) => `${key}:${value};`).join("");
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;")
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
  .t3-stage { ${stageTheme} position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--background); color: var(--foreground); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
  .t3-state[hidden] { display: none !important; }
  .t3-state:not([hidden]) { display: contents; }
  .t3-popup-raster { position: fixed; z-index: 2147483647; left: 583px; top: 367px; width: 389px; height: 266px; display: block; pointer-events: none; }
  .t3-popup-raster[hidden] { display: none; }
  .t3-raster-default [data-base-ui-portal] { visibility: hidden; }
  .base-ui-disable-scrollbar { scrollbar-width: none; }
  .base-ui-disable-scrollbar::-webkit-scrollbar { display: none; }
  @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
  @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
  @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
  @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"); }
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
  <div class="dark t3-stage">
    ${phases.map((phase, index) => `<div class="t3-state" data-t3-state="${phase}"${phase === "menu" || phase === "hover" ? " data-layout-ignore" : ""}${index ? " hidden" : ""}>${states[phase]}${phase === "menu" || phase === "hover" ? `<img class="t3-popup-raster" src="compositions/permission-choice-dark-${phase}-raster.png" alt="" hidden>` : ""}</div>`).join("\n")}
  </div>
</div>
<script src="t3-code-gsap.min.js"></script>
<script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
const stage = document.querySelector('#root .t3-stage');
const useNativePopup = ${scriptJson(fields.map(([id]) => id))}.every((key) => options[key] === defaults[key]) && options.serviceTier === 'Standard';
if (options.theme === 'light') {
  stage.classList.remove('dark');
  stage.classList.add('light');
  for (const [key, value] of Object.entries(${scriptJson(lightTheme)})) stage.style.setProperty(key, value);
}
for (const [key, value] of Object.entries(${scriptJson(fontTheme)})) stage.style.setProperty(key, value);
stage.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
const replacements = ${scriptJson(replacements)};
const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
let node;
while ((node = walker.nextNode())) {
  const original = node.textContent.trim();
  const key = replacements[original];
  if (key && options[key] !== defaults[key]) node.textContent = node.textContent.replace(original, options[key]);
}
for (const heading of stage.querySelectorAll('h1')) {
  if (heading.firstChild?.nodeType === Node.TEXT_NODE) heading.firstChild.textContent = options.heroLead;
  if (heading.lastChild?.nodeType === Node.TEXT_NODE) heading.lastChild.textContent = options.heroTail;
}
for (const element of stage.querySelectorAll('[aria-label], [title]')) {
  for (const attribute of ['aria-label', 'title']) {
    const original = element.getAttribute(attribute);
    if (!original) continue;
    let updated = original;
    for (const key of ['projectName', 'branchName', 'activeBranch', 'modelName', 'permissionBefore', 'permissionAfter']) {
      if (options[key] !== defaults[key]) updated = updated.replaceAll(defaults[key], String(options[key]));
    }
    if (updated !== original) element.setAttribute(attribute, updated);
  }
}
if (options.serviceTier === 'Fast') {
  const fragment = document.createElement('template');
  fragment.innerHTML = ${scriptJson(fastTrigger)};
  fragment.content.querySelector('.truncate').textContent = options.reasoningLevel;
  for (const trigger of stage.querySelectorAll('[data-composer-shortcut="composer.effort"]')) {
    trigger.innerHTML = fragment.innerHTML;
  }
}
const sections = [...stage.querySelectorAll('[data-t3-state]')];
if (sections.length !== 4 || sections.some((section) => !section.querySelector('[aria-label="Runtime mode"]'))) {
  throw new Error('Native Runtime mode structure is missing');
}
const triggerBox = sections[0].querySelector('[aria-label="Runtime mode"]').getBoundingClientRect();
for (const section of sections.slice(1, 3)) {
  const positioner = section.querySelector('[data-slot="select-positioner"]');
  if (!positioner) throw new Error('Native Runtime mode popup is missing');
  positioner.style.transform = 'translate(' + Math.round(triggerBox.left + ${fixture.popupBox.x - fixture.triggerBox.x}) + 'px, ' + Math.round(triggerBox.top + ${fixture.popupBox.y - fixture.triggerBox.y}) + 'px)';
  if (useNativePopup) {
    section.classList.add('t3-raster-default');
    const raster = section.querySelector('.t3-popup-raster');
    raster.src = 'compositions/permission-choice-' + options.theme + '-' + section.dataset.t3State + '-raster.png';
    raster.hidden = false;
  }
}
const clock = { frame: 0 };
function draw() {
  const frame = Math.round(clock.frame);
  const open = Math.max(0, Math.min(90, Number(options.openFrame)));
  const hover = Math.max(open + 5, Math.min(105, Number(options.hoverFrame)));
  const select = Math.max(hover + 5, Math.min(119, Number(options.selectFrame)));
  const phase = frame < open ? 0 : frame < hover ? 1 : frame < select ? 2 : 3;
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
for (const themeName of ["dark", "light"]) {
  for (const phase of ["menu", "hover"]) {
    const file = `permission-choice-${themeName}-${phase}-raster.png`;
    await copyFile(resolve(source, file), resolve(output, file));
  }
}
await copyFile(resolve(root, "public/ideas/assets/T3-CODE-LICENSE.txt"), resolve(output, "licenses/T3-CODE-LICENSE.txt"));
await copyFile(resolve(root, "registry/blocks/t3-thread-unpin/licenses/T3-THIRD_PARTY_NOTICES.md"),
  resolve(output, "licenses/T3-THIRD_PARTY_NOTICES.md"));
await writeFile(resolve(output, "registry-item.json"), JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: Permission Choice",
  description: "Open the native T3 Code v0.0.42 Runtime mode menu, hover Auto-accept edits, and select it in the full workspace. Seeded local thread; no AI provider execution.",
  tags: ["composition", "app-ui", "t3-code", "permission-choice", "hyfrme-port"],
  author: "Hyfrme", authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT",
  dimensions: fixture.viewport, duration: fixture.frames / fixture.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    ...["dark", "light"].flatMap((themeName) => ["menu", "hover"].map((phase) => ({
      path: `permission-choice-${themeName}-${phase}-raster.png`,
      target: `compositions/permission-choice-${themeName}-${phase}-raster.png`,
      type: "hyperframes:asset",
    }))),
    { path: "licenses/T3-CODE-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt", type: "hyperframes:asset" },
    { path: "licenses/T3-THIRD_PARTY_NOTICES.md", target: "THIRD_PARTY_LICENSES/t3-code/T3-THIRD_PARTY_NOTICES.md", type: "hyperframes:asset" },
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2) + "\n");
await writeFile(resolve(output, "README.md"), `# T3 Code: Permission Choice

This four-second block reproduces the native T3 Code ${fixture.sourceTag} Runtime mode menu at 1200 × 659, 30 fps, in dark and light. It opens beside the full-size composer, hovers Auto-accept edits, and selects it. The project and thread are seeded local Hyfrme data with no provider configured, so this capture does not show AI inference or an external permission approval.

Customize the theme, workspace, prompt, permission labels and descriptions, model, reasoning level, service tier, thread/project content, and open/hover/select frames in HyperFrames. The Fast service option inserts the official v0.0.42 lightning indicator so this block can follow Fast Service Tier. Use the same shared workspace variables on adjacent T3 Code blocks to make continuous videos. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. Installed files include the T3 Code MIT license and third-party icon notice. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.

The default popup uses cropped pixels from the pinned native capture for frame-exact menu text. Changing any visible content or selecting Fast switches the popup to the editable native DOM snapshot. Timing and theme work with either path.
`);
console.log(`Generated ${name} candidate from official T3 Code v0.0.42 Runtime mode menu.`);
