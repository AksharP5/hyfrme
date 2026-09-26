import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-sidebar-focus";
const output = resolve(root, ".work/t3-sidebar-focus-v0042-candidate");
const fixture = JSON.parse(await readFile(resolve(source, "sidebar-focus-v0042-dark-default-fixture.json"), "utf8"));
const lightFixture = JSON.parse(await readFile(resolve(source, "sidebar-focus-v0042-light-default-fixture.json"), "utf8"));
const darkMotion = JSON.parse(await readFile(resolve(source, "sidebar-focus-v0042-dark-animated-fixture.json"), "utf8"));
const lightMotion = JSON.parse(await readFile(resolve(source, "sidebar-focus-v0042-light-animated-fixture.json"), "utf8"));
for (const actual of [lightFixture, darkMotion, lightMotion]) {
  if (JSON.stringify(actual.events) !== JSON.stringify(fixture.events)) throw new Error("Native sidebar event frames differ");
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
  ["open", "collapsed", "restored"].map((phase) =>
    readFile(resolve(source, `sidebar-focus-v0042-dark-default-${phase}.html`), "utf8"),
  ),
);
for (const [index, markup] of states.entries()) {
  states[index] = markup
    .replace(/style="clip-path: inset\(50%\);[^"]*"/g, 'style="display:none"')
    .replace(/style="[^"]*clip-path: inset\(100%\)[^"]*"/g, 'style="display:none"')
    .replace(/(<span[^>]*class="[^"]*\[text-box:trim-both_cap_alphabetic\][^"]*")/g, "$1 data-layout-ignore")
    .replace(/(<span[^>]*class="pointer-events-none absolute[^"]*")/g, "$1 data-layout-ignore")
    .replace('<span class="shrink-0">Settled (1)</span>',
      `<span class="shrink-0"${index === 0 ? "" : " data-layout-ignore"}>Settled (1)</span>`);
}
states[1] = states[1].replace('data-slot="sidebar-container"',
  'data-slot="sidebar-container" data-layout-ignore');
const sourceStandard = await readFile(resolve(source, "fast-tier-v0042-dark-before.html"), "utf8");
const triggerInner = (dom) => {
  const markup = dom.match(/<button(?=[^>]*data-composer-shortcut="composer\.effort")[\s\S]*?<\/button>/)?.[0];
  if (!markup) throw new Error("Native service-tier trigger is missing");
  return markup.slice(markup.indexOf(">") + 1, -"</button>".length);
};
const standardTrigger = triggerInner(sourceStandard);
const fastTrigger = triggerInner(states[0]);
if (!fastTrigger.includes("Fast mode on")) throw new Error("Native sidebar trigger is not in Fast mode");

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
  ["threadOneAge", "Thread 1 age", "10h"],
  ["threadTwoAge", "Thread 2 age", "12h"],
  ["threadThreeAge", "Thread 3 age", "17h"],
  ["threadFourAge", "Thread 4 age", "1d"],
  ["threadFiveAge", "Thread 5 age", "2d"],
  ["prompt", "Prompt", fixture.prompt],
  ["modelName", "Model", fixture.modelName],
  ["reasoningLevel", "Reasoning", fixture.reasoningLevel],
  ["permissionMode", "Permission", "Full access"],
  ["workspaceMode", "Workspace", "Current checkout"],
  ["heroLead", "Empty thread question before project", "What should we build in "],
  ["heroTail", "Empty thread question after project", "?"],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "serviceTier", type: "string", label: "Service tier", default: "Fast", options: ["Standard", "Fast"] },
  { id: "theme", type: "string", label: "T3 Code appearance", default: "dark", options: ["dark", "light"] },
  { id: "collapseFrame", type: "number", label: "Collapse at frame", default: fixture.events.collapse, min: 0, max: 100, step: 1 },
  { id: "restoreFrame", type: "number", label: "Restore at frame", default: fixture.events.restore, min: 10, max: 119, step: 1 },
  { id: "transitionMs", type: "number", label: "Panel animation duration in ms", default: 0, min: 0, max: 400, step: 25 },
  { id: "sidebarWidth", type: "number", label: "Sidebar width", default: fixture.sidebarWidth, min: 200, max: 350, step: 1 },
];
const defaults = Object.fromEntries(fields.map(([id, , value]) => [id, value]));
defaults.serviceTier = "Fast";
defaults.theme = "dark";
defaults.collapseFrame = fixture.events.collapse;
defaults.restoreFrame = fixture.events.restore;
defaults.transitionMs = 0;
defaults.sidebarWidth = fixture.sidebarWidth;
const textReplacements = Object.fromEntries(
  fields.filter(([id]) => !id.endsWith("Age") && !["projectName", "projectAvatar", "heroLead", "heroTail"].includes(id))
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
  .t3-stage { ${stageTheme} position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--background); color: var(--foreground); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
  .t3-state { display: contents; }
  .base-ui-disable-scrollbar { scrollbar-width: none; }
  .base-ui-disable-scrollbar::-webkit-scrollbar { display: none; }
  @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
  @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
  @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
  @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"); }
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
  <div class="dark t3-stage">
    <div class="t3-state" data-t3-state="open" style="display:contents">${states[0]}</div>
    <div class="t3-state" data-t3-state="collapsed" style="display:none">${states[1]}</div>
    <div class="t3-state" data-t3-state="restored" style="display:none">${states[2]}</div>
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
    for (const key of ['projectName', 'projectAvatar', 'branchName', 'activeBranch', 'modelName']) {
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
  const wrapper = section.querySelector('[data-slot="sidebar-wrapper"]');
  wrapper.style.setProperty('--sidebar-width', options.sidebarWidth + 'px');
  wrapper.style.setProperty('--panel-animation-duration', options.transitionMs + 'ms');
  for (const element of section.querySelectorAll('[data-panel-animations]')) {
    element.setAttribute('data-panel-animations', String(Number(options.transitionMs) > 0));
  }
  const trigger = section.querySelector('[data-composer-shortcut="composer.effort"]');
  if (trigger && options.serviceTier === 'Standard') {
    trigger.innerHTML = ${scriptJson(standardTrigger)};
    trigger.querySelector('.truncate').textContent = options.reasoningLevel;
  }
}
const moving = sections.slice(1).map((section) => ({
  gap: section.querySelector('[data-slot="sidebar-gap"]'),
  container: section.querySelector('[data-slot="sidebar-container"]'),
  rail: section.querySelector('[data-slot="sidebar-rail"]'),
  header: section.querySelector('[data-chat-header="true"]'),
}));
const restoringContent = sections[2].querySelector('[data-slot="sidebar-content"]');
for (const parts of moving) {
  parts.gap.style.transition = 'none';
  parts.container.style.transition = 'none';
  parts.rail.style.transition = 'none';
  parts.header.style.transition = 'none';
}
function nativeEase(progress) {
  if (progress <= 0) return 0;
  if (progress >= 1) return 1;
  let low = 0;
  let high = 1;
  for (let index = 0; index < 24; index++) {
    const curve = (low + high) / 2;
    const remaining = 1 - curve;
    const x = 0.6 * remaining * curve * curve + curve * curve * curve;
    if (x < progress) low = curve;
    else high = curve;
  }
  const curve = (low + high) / 2;
  const remaining = 1 - curve;
  return 3 * remaining * curve * curve + curve * curve * curve;
}
const clock = { frame: 0 };
function draw() {
  const frame = Math.round(clock.frame);
  const collapseFrame = Number(options.collapseFrame);
  const restoreFrame = Math.max(Number(options.restoreFrame), collapseFrame + 1);
  const phase = frame < collapseFrame ? 0 : frame < restoreFrame ? 1 : 2;
  for (let index = 0; index < sections.length; index++) sections[index].style.display = index === phase ? 'contents' : 'none';
  restoringContent.style.visibility = phase === 2 && Number(options.transitionMs) > 0 && frame === restoreFrame + 1 ? 'hidden' : '';
  if (phase === 0) return;
  const elapsed = (frame - (phase === 1 ? collapseFrame : restoreFrame)) * 1000 / 30;
  const progress = options.transitionMs <= 0 ? 1 : nativeEase(Math.min(1, elapsed / options.transitionMs));
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
      title: "T3 Code: Sidebar Focus",
      description:
        "Collapse and restore T3 Code’s thread sidebar around a Hyfrme source request. The release default is instant; Appearance can enable the native panel transition.",
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

This four-second block reproduces the T3 Code ${fixture.sourceTag} sidebar collapse and restore at 1200 × 659 and 30 fps. It uses pinned official workspace DOM and CSS around a Hyfrme source request in dark or light appearance.

The release-default transitionMs is 0, so the sidebar toggles instantly. Set it to 200 ms to use the Appearance setting's native cubic-bezier(0, 0, 0.2, 1) transition; the official slider ranges from 0 to 400 ms in 25 ms steps. Customize project, branch, thread names and ages, prompt, provider label, reasoning, service tier, permission, workspace, sidebar width, and action frames for a continuous Hyfrme video. Provider/model options in the fixture are seeded; no AI inference runs.

Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. The installed files include the T3 Code MIT license. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.
`,
);
console.log(`Generated ${name} from the pinned T3 Code sidebar UI.`);
