import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-fast-service-tier";
const output = resolve(root, ".work/t3-fast-tier-v0042-candidate");
const fixture = JSON.parse(await readFile(resolve(source, "fast-tier-v0042-dark-fixture.json"), "utf8"));
const lightFixture = JSON.parse(await readFile(resolve(source, "fast-tier-v0042-light-fixture.json"), "utf8"));
if (JSON.stringify(fixture.sourceDomHashes) !== JSON.stringify(lightFixture.sourceDomHashes)) {
  throw new Error("Native service-tier DOM differs between themes");
}
const theme = JSON.parse(await readFile(resolve(source, "dark-theme.json"), "utf8"));
const lightTheme = JSON.parse(await readFile(resolve(source, "light-theme.json"), "utf8"));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const [nativeShell, nativeAfter, menuPortal, hoverPortal] = await Promise.all(
  ["before", "after", "portal", "hover-portal"].map((phase) =>
    readFile(resolve(source, `fast-tier-v0042-dark-${phase}.html`), "utf8")),
);
const triggerInner = (dom) => {
  const markup = dom.match(/<button(?=[^>]*data-composer-shortcut="composer\.effort")[\s\S]*?<\/button>/)?.[0];
  if (!markup) throw new Error("Native service-tier trigger is missing");
  return markup.slice(markup.indexOf(">") + 1, -"</button>".length);
};
const standardTrigger = triggerInner(nativeShell);
const fastTrigger = triggerInner(nativeAfter);
const shell = nativeShell
  .replace(/(<span[^>]*class="[^"]*\[text-box:trim-both_cap_alphabetic\][^"]*")/g, "$1 data-layout-ignore")
  .replace(/(<span[^>]*class="pointer-events-none absolute[^"]*")/g, "$1 data-layout-ignore");

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
  ["modelName", "Model", fixture.modelName],
  ["reasoningLevel", "Reasoning level", fixture.reasoningLevel],
  ["permissionMode", "Permission", "Full access"],
  ["workspaceMode", "Workspace", "Current checkout"],
  ["prompt", "Prompt", fixture.prompt],
  ["heroLead", "Empty thread question before project", "What should we build in "],
  ["heroTail", "Empty thread question after project", "?"],
];
const reasoningChoices = ["Low", "Medium", "High", "Extra High", "Max", "Ultra"];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value,
    ...(id === "reasoningLevel" ? { options: reasoningChoices } : {}) })),
  { id: "serviceBefore", type: "string", label: "Previous service tier", default: fixture.serviceBefore, options: ["Standard", "Fast"] },
  { id: "serviceAfter", type: "string", label: "Selected service tier", default: fixture.serviceAfter, options: ["Standard", "Fast"] },
  { id: "theme", type: "string", label: "T3 Code appearance", default: "dark", options: ["dark", "light"] },
  { id: "openFrame", type: "number", label: "Open menu at frame", default: fixture.openFrame, min: 0, max: 90, step: 1 },
  { id: "hoverFrame", type: "number", label: "Hover service tier at frame", default: fixture.hoverFrame, min: 5, max: 105, step: 1 },
  { id: "selectFrame", type: "number", label: "Select service tier at frame", default: fixture.selectFrame, min: 20, max: 119, step: 1 },
];
const defaults = Object.fromEntries(fields.map(([id, , value]) => [id, value]));
Object.assign(defaults, { serviceBefore: fixture.serviceBefore, serviceAfter: fixture.serviceAfter,
  theme: "dark", openFrame: fixture.openFrame, hoverFrame: fixture.hoverFrame, selectFrame: fixture.selectFrame });
const textReplacements = Object.fromEntries(
  fields.filter(([id]) => !id.endsWith("Age") && !["projectName", "projectAvatar", "heroLead", "heroTail"].includes(id))
    .map(([id, , value]) => [value, id]),
);
const fontTheme = Object.fromEntries(Object.entries(theme).filter(([name]) =>
  name.includes("font-family") || name === "--font-sans" || name === "--font-mono"));
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
  .t3-popup-state[hidden] { display: none !important; }
  .t3-popup-state:not([hidden]) { display: contents; }
  .t3-popup-raster { position: fixed; z-index: 2147483647; left: 500px; top: 38px; width: 174px; height: 315px; display: block; pointer-events: none; }
  .t3-popup-raster[hidden] { display: none; }
  .base-ui-disable-scrollbar { scrollbar-width: none; }
  .base-ui-disable-scrollbar::-webkit-scrollbar { display: none; }
  @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
  @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
  @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
  @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"); }
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
  <div class="dark t3-stage">
    ${shell}
    <div class="t3-popup-state" data-t3-popup="menu" hidden>${menuPortal}<img class="t3-popup-raster" data-layout-ignore src="compositions/fast-tier-v0042-dark-menu-raster.png" alt="" hidden></div>
    <div class="t3-popup-state" data-t3-popup="hover" hidden>${hoverPortal}<img class="t3-popup-raster" data-layout-ignore src="compositions/fast-tier-v0042-dark-hover-raster.png" alt="" hidden></div>
  </div>
</div>
<script src="t3-code-gsap.min.js"></script>
<script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
const stage = document.querySelector('#root .t3-stage');
const useNativePopup = ${scriptJson(fields.map(([id]) => id))}.every((key) => options[key] === defaults[key]) &&
  options.serviceBefore === defaults.serviceBefore && options.serviceAfter === defaults.serviceAfter;
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
  if (node.parentElement?.closest('[data-slot="menu-popup"]')) continue;
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
const ageKeys = ['threadOneAge', 'threadTwoAge', 'threadThreeAge', 'threadFourAge', 'threadFiveAge'];
stage.querySelectorAll('[data-testid="sidebar-row-card"]').forEach((row, index) => {
  const age = row.querySelector('span.tabular-nums.text-secondary-label');
  if (age && ageKeys[index]) age.textContent = options[ageKeys[index]];
});
const settledAge = stage.querySelector('[data-testid="sidebar-row-slim"] .text-xs');
if (settledAge) settledAge.textContent = options.settledAge;
const popups = [...stage.querySelectorAll('[data-t3-popup]')];
const trigger = stage.querySelector('[data-composer-shortcut="composer.effort"]');
if (!trigger || popups.length !== 2) throw new Error('Native service-tier menu structure is missing');
function triggerMarkup(markup) {
  const fragment = document.createElement('template');
  fragment.innerHTML = markup;
  fragment.content.querySelector('.truncate').textContent = options.reasoningLevel;
  return fragment.innerHTML;
}
const standardMarkup = triggerMarkup(${scriptJson(standardTrigger)});
const fastMarkup = triggerMarkup(${scriptJson(fastTrigger)});
let triggerFast = null;
function setFast(fast) {
  if (triggerFast === fast) return;
  trigger.innerHTML = fast ? fastMarkup : standardMarkup;
  triggerFast = fast;
}
setFast(options.serviceBefore === 'Fast');
const coveredText = [stage.querySelector('h1'), stage.querySelector('h1 button'), stage.querySelector('[data-lexical-text]')];
for (const element of coveredText) {
  if (!element) continue;
  element.setAttribute('data-layout-allow-occlusion', '');
  element.setAttribute('data-layout-allow-overlap', '');
}
for (const section of popups) {
  const groups = [...section.querySelectorAll('[data-slot="menu-radio-group"]')];
  for (const [index, group] of groups.entries()) {
    for (const item of group.querySelectorAll('[role="menuitemradio"]')) {
      const choice = item.querySelector('.truncate')?.firstChild?.textContent?.trim();
      const selected = choice === (index === 0 ? options.reasoningLevel : options.serviceBefore);
      item.setAttribute('aria-checked', String(selected));
      item.toggleAttribute('data-checked', selected);
      item.toggleAttribute('data-unchecked', !selected);
      if (section.dataset.t3Popup === 'hover') {
        const highlighted = index === 1 && choice === options.serviceAfter;
        item.toggleAttribute('data-highlighted', highlighted);
        item.tabIndex = highlighted ? 0 : -1;
      }
    }
  }
}
const triggerRect = trigger.getBoundingClientRect();
for (const section of popups) {
  const positioner = section.querySelector('[data-slot="menu-positioner"]');
  if (positioner) positioner.style.transform = 'translate(' + Math.round(triggerRect.left + ${fixture.popupBox.x - fixture.triggerBox.x}) + 'px, ' + Math.round(triggerRect.top + ${fixture.popupBox.y - fixture.triggerBox.y}) + 'px)';
  if (useNativePopup) {
    for (const label of section.querySelectorAll('[data-slot="menu-popup"] span, [data-slot="menu-popup"] div')) {
      if ([...label.childNodes].some((child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim())) {
        label.setAttribute('data-layout-ignore', '');
      }
    }
    const raster = section.querySelector('.t3-popup-raster');
    raster.src = 'compositions/fast-tier-v0042-' + options.theme + '-' + section.dataset.t3Popup + '-raster.png';
    raster.hidden = false;
  }
}
const clock = { frame: 0 };
function draw() {
  const frame = Math.round(clock.frame);
  const openFrame = Math.max(0, Math.min(90, Number(options.openFrame)));
  const hoverFrame = Math.max(openFrame + 5, Math.min(105, Number(options.hoverFrame)));
  const selectFrame = Math.max(hoverFrame + 5, Math.min(119, Number(options.selectFrame)));
  const phase = frame < openFrame ? 0 : frame < hoverFrame ? 1 : frame < selectFrame ? 2 : 3;
  popups[0].hidden = phase !== 1;
  popups[1].hidden = phase !== 2;
  trigger.toggleAttribute('data-popup-open', phase === 1 || phase === 2);
  trigger.toggleAttribute('data-pressed', phase === 1 || phase === 2);
  trigger.setAttribute('aria-expanded', String(phase === 1 || phase === 2));
  if (phase === 1 || phase === 2) trigger.setAttribute('aria-controls', '_r_3r_');
  else trigger.removeAttribute('aria-controls');
  setFast((phase === 3 ? options.serviceAfter : options.serviceBefore) === 'Fast');
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
    const file = `fast-tier-v0042-${themeName}-${phase}-raster.png`;
    await copyFile(resolve(source, file), resolve(output, file));
  }
}
await copyFile(resolve(root, "parity/t3-gallery/assets/T3-CODE-LICENSE.txt"), resolve(output, "licenses/T3-CODE-LICENSE.txt"));
await copyFile(resolve(root, "registry/blocks/t3-thread-unpin/licenses/T3-THIRD_PARTY_NOTICES.md"),
  resolve(output, "licenses/T3-THIRD_PARTY_NOTICES.md"));
await writeFile(resolve(output, "registry-item.json"), JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: Fast Service Tier",
  description: "Open the T3 Code v0.0.42 service-tier menu, hover Fast, and select it to reveal the native lightning indicator. Seeded provider options; no AI inference runs.",
  tags: ["composition", "app-ui", "t3-code", "service-tier", "hyfrme-port"],
  author: "Hyfrme", authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT",
  dimensions: fixture.viewport, duration: fixture.frames / fixture.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    ...["dark", "light"].flatMap((themeName) => ["menu", "hover"].map((phase) => ({
      path: `fast-tier-v0042-${themeName}-${phase}-raster.png`,
      target: `compositions/fast-tier-v0042-${themeName}-${phase}-raster.png`,
      type: "hyperframes:asset",
    }))),
    { path: "licenses/T3-CODE-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt", type: "hyperframes:asset" },
    { path: "licenses/T3-THIRD_PARTY_NOTICES.md", target: "THIRD_PARTY_LICENSES/t3-code/T3-THIRD_PARTY_NOTICES.md", type: "hyperframes:asset" },
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2) + "\n");
await writeFile(resolve(output, "README.md"), `# T3 Code: Fast Service Tier

This four-second block reproduces the T3 Code ${fixture.sourceTag} service-tier menu in dark or light at 1200 × 659 and 30 fps. The reference opens the native menu, hovers Fast, and selects it; the block mirrors the menu and lightning indicator. The model, reasoning, and service-tier options are seeded in an isolated local Hyfrme workspace with no provider configured; this capture exercises native controls and does not run AI inference. The default menu popup uses pixels cropped from the pinned native capture for exact small-text rendering; changing any visible content or service-tier choice switches to the editable native DOM snapshot.

Set the same theme, project, branch, thread, age, and prompt variables on adjacent T3 Code blocks for a continuous workspace. The default first frame is pixel-identical to Reasoning Level's native final frame in both themes. The menu opens at openFrame, highlights the selected service tier at hoverFrame, and commits it at selectFrame. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. Installed files include the T3 Code MIT license and third-party icon notice. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.
`);
console.log(`Generated ${name} candidate from official T3 Code v0.0.42 service-tier menu.`);
