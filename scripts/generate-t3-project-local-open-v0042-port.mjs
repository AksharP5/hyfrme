import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { nativeTransitionRuntime } from "./t3-native-transition-runtime.mjs";
import { nativeT3MonoFaces } from "./t3-native-fonts.mjs";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-project-local-open";
const output = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, ".work/t3-project-local-open-v0042-candidate"));
const fixture = JSON.parse(
  await readFile(resolve(source, "project-local-open-v0042-dark-fixture.json"), "utf8"),
);
const lightFixture = JSON.parse(await readFile(resolve(source, "project-local-open-v0042-light-fixture.json"), "utf8"));
if (fixture.sourceCommit !== lightFixture.sourceCommit || fixture.frames !== lightFixture.frames || fixture.fps !== lightFixture.fps) {
  throw new Error("Official dark and light fixture metadata differs");
}
const generatedIds = { dark: new Map(), light: new Map() };
const normalizeIds = (html, ids) => html.replace(/_r_[^_]+_/g, (id) => {
  if (!ids.has(id)) ids.set(id, `_r_${ids.size}_`);
  return ids.get(id);
});
for (const phase of [...fixture.phases, "source-portal", "browse-portal", "selected-portal"]) {
  const [dark, light] = await Promise.all(["dark", "light"].map((appearance) =>
    readFile(resolve(source, `project-local-open-v0042-${appearance}-${phase}.html`), "utf8")));
  if (normalizeIds(dark, generatedIds.dark) !== normalizeIds(light, generatedIds.light)) throw new Error(`Native ${phase} DOM differs beyond generated IDs`);
}
const tooltipCrops = JSON.parse(await readFile(resolve(source, "project-local-open-v0042-tooltip-crops.json"), "utf8"));
const tooltipSource = JSON.parse(await readFile(resolve(source, "project-local-open-v0042-tooltip-source.json"), "utf8"));
if (tooltipSource.sourceCommit !== fixture.sourceCommit ||
    createHash("sha256").update(await readFile(resolve(root, tooltipSource.captureScript))).digest("hex") !== tooltipSource.captureScriptSha256 ||
    createHash("sha256").update(await readFile(resolve(root, tooltipSource.sourceDelayModule))).digest("hex") !== tooltipSource.sourceDelayModuleSha256) throw new Error("Native tooltip supplemental provenance differs");
const tooltipMarkup = Object.fromEntries(await Promise.all(["dark", "light"].map(async (appearance) => {
  const recorded = tooltipSource.themes[appearance];
  const html = await readFile(resolve(source, recorded.markup.file), "utf8");
  if (createHash("sha256").update(html).digest("hex") !== recorded.markup.sha256 ||
      recorded.hoverDelay !== 600 || recorded.beforeFirstFrameWait !== 400 ||
      recorded.motion.length !== 2 || new Set(recorded.motion.map(motion => motion.property)).size !== 2 || !recorded.motion.every(motion =>
        ["opacity", "scale"].includes(motion.property) && motion.duration === 150 && motion.easing === "cubic-bezier(0.4, 0, 0.2, 1)" &&
        motion.from === (motion.property === "opacity" ? "0" : "0.98") && motion.to === (motion.property === "opacity" ? "1" : "none"))) throw new Error("Native tooltip source differs");
  return [appearance, html];
})));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
if (
  tooltipCrops.reports.length !== 2 ||
  new Set(tooltipCrops.reports.map((report) => report.theme)).size !== 2
)
  throw new Error("Native tooltip crop themes differ");
for (const report of tooltipCrops.reports) {
  if (!["dark", "light"].includes(report.theme))
    throw new Error("Unsupported native dialog crop theme");
  const video =
    ({dark:fixture,light:lightFixture})[report.theme].reference ??
    `parity/t3-project-local-open-v0042-${report.theme}-reference.mkv`;
  const fixturePath = `assets/t3-code/v0.0.42/project-local-open-v0042-${report.theme}-fixture.json`;
  if (
    report.sourceVideo !== video ||
    report.sourceFixture !== fixturePath ||
    report.sourceVideoSha256 !== ({dark:fixture,light:lightFixture})[report.theme].referenceSha256 ||
    report.sourceVideoSha256 !== hash(await readFile(resolve(root, video))) ||
    report.sourceFixtureSha256 !==
      hash(await readFile(resolve(root, fixturePath))) ||
    JSON.stringify(report.crop) !==
      JSON.stringify({ x: 26, y: 49, width: 857, height: 34 }) ||
    report.startFrame !== 35 ||
    report.endFrame !== 59 ||
    report.frames.length !== 25 ||
    report.frameImageIndices.length !== 120
  )
    throw new Error("Native tooltip crop provenance differs");
  for (const [index, image] of report.uniqueImages.entries()) {
    const png = await readFile(resolve(source, image.file));
    if (
      image.index !== index ||
      image.file !==
        `project-local-open-v0042-${report.theme}-tooltip-frame-${String(index).padStart(2, "0")}.png` ||
      hash(png) !== image.pngSha256 ||
      png.readUInt32BE(16) !== 857 ||
      png.readUInt32BE(20) !== 34 ||
      !/^[a-f0-9]{64}$/.test(image.rgbaSha256)
    )
      throw new Error("Native tooltip crop image differs");
  }
  for (let frame = 0; frame < 120; frame++) {
    const index = report.frameImageIndices[frame];
    if (frame < 35 || frame >= 60) {
      if (index !== null)
        throw new Error("Native tooltip crop extends outside source dialog");
      continue;
    }
    const row = report.frames[frame - 35];
    if (
      !Number.isInteger(index) ||
      !report.uniqueImages[index] ||
      row.frame !== frame ||
      row.imageIndex !== index ||
      row.rgbaSha256 !== report.uniqueImages[index].rgbaSha256 ||
      row.pngSha256 !== report.uniqueImages[index].pngSha256
    )
      throw new Error("Native tooltip crop frame mapping differs");
  }
  if (
    new Set(report.frameImageIndices.filter((index) => index !== null)).size !==
    report.uniqueImages.length
  )
    throw new Error("Unused native dialog crop image");
}

const cleanBrowse = JSON.parse(await readFile(resolve(source, "project-local-open-v0042-browse-clean-crops.json"), "utf8"));
if (cleanBrowse.reports.length !== 2 || new Set(cleanBrowse.reports.map(report => report.theme)).size !== 2) throw new Error("Clean browse themes differ");
for (const report of cleanBrowse.reports) {
  const pinned = {dark:fixture, light:lightFixture}[report.theme];
  const png = await readFile(resolve(source, report.file));
  const fixturePath = `assets/t3-code/v0.0.42/project-local-open-v0042-${report.theme}-fixture.json`;
  const video = `parity/t3-project-local-open-v0042-${report.theme}-reference.mkv`;
  if (!pinned || report.sourceFixture !== fixturePath || report.sourceFixtureSha256 !== hash(await readFile(resolve(root,fixturePath))) ||
      report.sourceVideo !== video || report.sourceVideoSha256 !== pinned.referenceSha256 || report.sourceVideoSha256 !== hash(await readFile(resolve(root,video))) ||
      report.frame !== 35 || JSON.stringify(report.crop) !== JSON.stringify({x:312,y:66,width:576,height:230}) ||
      report.file !== `project-local-open-v0042-${report.theme}-browse-clean-crop.png` || hash(png) !== report.pngSha256 ||
      png.readUInt32BE(16) !== 576 || png.readUInt32BE(20) !== 230 || !/^[a-f0-9]{64}$/.test(report.rgbaSha256) ||
      report.originalFile !== `project-local-open-v0042-${report.theme}-browse-crop.png` || hash(await readFile(resolve(source,report.originalFile))) !== report.originalPngSha256 ||
      report.outsideChangedPixels !== 0 || report.changedPixels !== ({dark:1383,light:2276})[report.theme]) throw new Error("Clean browse source provenance differs");
}

const tooltipFrameSources = Object.fromEntries(tooltipCrops.reports.map(report => [report.theme, {
  images: report.uniqueImages.map(image => `compositions/${image.file}`), frameImageIndices: report.frameImageIndices,
}]));
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
  fixture.phases.map((phase) =>
    readFile(resolve(source, `project-local-open-v0042-dark-${phase}.html`), "utf8"),
  ),
);
const portals = await Promise.all(["source", "browse", "selected"].map((phase) =>
  readFile(resolve(source, `project-local-open-v0042-dark-${phase}-portal.html`), "utf8")));
for (const index of [0, 1, 2, 3, 4]) {
  states[index] = states[index]
    .replace(/(<span[^>]*class="[^"]*\[text-box:trim-both_cap_alphabetic\][^"]*")/g, "$1 data-layout-ignore")
    .replace(/(<span[^>]*class="pointer-events-none absolute[^"]*")/g, "$1 data-layout-ignore");
  states[index] = states[index].replace(
    'class="h-full max-h-[inherit] overflow-auto',
    'data-layout-allow-overflow class="h-full max-h-[inherit] overflow-auto',
  );
  states[index] = states[index].replaceAll(
    '<span class="pointer-events-none absolute left-1/2 top-1/2 size-[max(100%,3rem)]',
    '<span data-layout-allow-overflow class="pointer-events-none absolute left-1/2 top-1/2 size-[max(100%,3rem)]',
  );
}
for (const index of [1, 2, 3]) {
  states[index] = states[index].replace('<div class="group/sidebar-wrapper', '<div data-layout-ignore class="group/sidebar-wrapper');
  portals[index - 1] = portals[index - 1].replace("<div ", "<div data-layout-ignore ");
}

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["projectAvatar", "Project avatar letters", "HE"],
  ["newProjectName", "Added project name", "hyfrme-motion-lab"],
  ["newProjectAvatar", "Added project avatar letters", "HL"],
  ["folderBasePath", "Local folder parent path", "/var/tmp"],
  ["folderSearch", "Folder search text", "hyfrme-motion"],
  ["childDirectory", "Folder shown after selection", "docs"],
  ["alternateDirectory", "Second folder search result", "hyfrme-motion-lab-rename"],
  ["branchName", "Branch name", "main"],
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
  ["reasoningLevel", "Reasoning", "Medium"],
  ["permissionMode", "Permission", "Full access"],
  ["workspaceMode", "Workspace", "Current checkout"],
  ["composerPlaceholder", "Composer placeholder", "Ask for changes, send follow-ups, or attach images"],
  ["draftTitle", "New thread title", "New thread"],
  ["draftHeading", "New thread heading", "What should we build in"],
  ["searchPlaceholder", "Source search placeholder", "Search..."],
  ["pathPlaceholder", "Folder path placeholder", "Enter path (e.g. ~/projects/my-app)"],
  ["sourcesTitle", "Source list heading", "Sources"],
  ["localTitle", "Local source title", "Local folder"],
  ["localDescription", "Local source description", "Browse a folder on disk"],
  ["gitUrlTitle", "Git URL title", "Git URL"],
  ["gitUrlDescription", "Git URL description", "Clone from a remote URL"],
  ["githubTitle", "GitHub title", "GitHub repository"],
  ["githubDescription", "GitHub description", "Clone GitHub owner/repo"],
  ["azureTitle", "Azure DevOps title", "Azure DevOps repository"],
  ["azureDescription", "Azure DevOps description", "Clone Azure DevOps project/repository"],
  ["bitbucketTitle", "Bitbucket title", "Bitbucket repository"],
  ["bitbucketDescription", "Bitbucket description", "Clone Bitbucket workspace/repository"],
  ["forgejoTitle", "Forgejo title", "Forgejo / Gitea repository"],
  ["forgejoDescription", "Forgejo description", "Clone Forgejo / Gitea owner/repo"],
  ["gitlabTitle", "GitLab title", "GitLab repository"],
  ["gitlabDescription", "GitLab description", "Clone GitLab group/project"],
  ["setupRequired", "Unavailable provider badge", "Setup Required"],
  ["createAndAdd", "Search-action label", "Create & Add"],
  ["addProject", "Selected-folder action", "Add"],
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
    id: "sourceFrame",
    type: "number",
    label: "Open source chooser at frame",
    default: fixture.events.source,
    min: 0,
    max: 110,
    step: 1,
  },
  {
    id: "browseFrame",
    type: "number",
    label: "Search local folder at frame",
    default: fixture.events.browse,
    min: 1,
    max: 112,
    step: 1,
  },
  {
    id: "selectedFrame",
    type: "number",
    label: "Select local folder at frame",
    default: fixture.events.selected,
    min: 2,
    max: 116,
    step: 1,
  },
  {
    id: "addedFrame",
    type: "number",
    label: "Add project at frame",
    default: fixture.events.added,
    min: 3,
    max: 119,
    step: 1,
  },
];
const defaults = Object.fromEntries(variables.map(({ id, default: value }) => [id, value]));
const textReplacements = Object.fromEntries(
  fields
    .filter(([id]) => !id.endsWith("Age") && !["searchPlaceholder", "pathPlaceholder", "folderBasePath", "folderSearch", "newProjectName", "newProjectAvatar", "projectName", "projectAvatar", "childDirectory", "alternateDirectory", "createAndAdd", "addProject"].includes(id))
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
  /* Preserve native T3 typography when HyperFrames compiles the block. */
  .t3-stage, .t3-stage *:not([text-rendering]) { text-rendering: auto; }
  /* Native Submit buttons must not animate inherited clip visibility. */
  .t3-stage button[type="submit"].transition-all { transition-property: background-color, color, box-shadow, transform, scale, opacity; }
  .t3-state[hidden] { display: none !important; }
  .t3-state:not([hidden]) { display: contents; }
  .t3-native-popup { position: absolute; z-index: 50; left: 312px; top: 66px; pointer-events: none; }
  .t3-native-popup[hidden], [data-t3-tooltip-theme][hidden], [data-t3-tooltip-canvas][hidden] { display: none !important; }
  [data-t3-tooltip-canvas] { position:absolute; left:26px; top:49px; width:857px !important; height:34px !important; z-index:301; pointer-events:none; }
  [data-t3-tooltip-theme], [data-t3-tooltip-theme] *:not([text-rendering]) { text-rendering:auto; }
  [data-t3-tooltip-theme] { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif; }
  .base-ui-disable-scrollbar { scrollbar-width: none; }
  .base-ui-disable-scrollbar::-webkit-scrollbar { display: none; }
  @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
  @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
  @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
  @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"); }
${nativeT3MonoFaces}
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
  <div class="dark t3-stage">
${states.map((body, index) => `    <div class="t3-state" data-t3-state="${fixture.phases[index]}"${index ? " hidden" : ""}>${body}${index >= 1 && index <= 3 ? portals[index - 1] : ""}</div>`).join("\n")}
${["source", "browse", "selected"].map((phase, index) => `    <img class="t3-native-popup" data-t3-popup="${phase}" width="576" height="${[420, 230, 198][index]}" alt="" aria-hidden="true" data-layout-ignore hidden>`).join("\n")}
  </div>
${["dark", "light"].map(appearance => `<div data-base-ui-portal data-t3-tooltip-theme="${appearance}" class="${appearance}" data-layout-ignore hidden>${tooltipMarkup[appearance]}</div>`).join("\n")}
<canvas data-t3-tooltip-canvas width="857" height="34" data-layout-ignore hidden></canvas>
</div>
<script src="t3-code-gsap.min.js"></script>
<script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
const stage = document.querySelector('#root .t3-stage');
const nativePopups = [...stage.querySelectorAll('.t3-native-popup')];
const nativePopupSources = ${scriptJson(Object.fromEntries(['dark', 'light'].map((theme) => [theme, Object.fromEntries(['source', 'browse', 'selected'].map((phase) => [phase, `compositions/project-local-open-v0042-${theme}-${phase === "browse" ? "browse-clean" : phase}-crop.png`]))])))};
const nativePopupAllowed = Object.keys(defaults).every(key => ['theme', 'sourceFrame', 'browseFrame', 'selectedFrame', 'addedFrame'].includes(key) || options[key] === defaults[key]);
if (nativePopupAllowed) for (const image of nativePopups) image.src = nativePopupSources[options.theme][image.dataset.t3Popup];
const nativeTooltipAllowed = nativePopupAllowed && ['sourceFrame', 'browseFrame', 'selectedFrame', 'addedFrame'].every(key => Number(options[key]) === defaults[key]);
const tooltipFrames = ${scriptJson(tooltipFrameSources)}[options.theme];
const tooltipImages = nativeTooltipAllowed ? tooltipFrames.images.map(src => { const image = new Image(); image.src = src; return image; }) : [];
const tooltipCanvas = document.querySelector('[data-t3-tooltip-canvas]');
const tooltipContext = tooltipCanvas.getContext('2d');
const nativeTooltip = document.querySelector('[data-t3-tooltip-theme="' + options.theme + '"]');
const tooltipPopup = nativeTooltip.querySelector('[data-slot="tooltip-popup"]');
const tooltipPositioner = nativeTooltip.querySelector('[data-slot="tooltip-positioner"]');
const tooltipLabel = nativeTooltip.querySelector('[data-current]');
const tooltipMotion = ${scriptJson(Object.fromEntries(Object.entries(tooltipSource.themes).map(([appearance, recorded]) => [appearance, {motion:recorded.motion,hoverDelay:recorded.hoverDelay,beforeFirstFrameWait:recorded.beforeFirstFrameWait}])))}[options.theme];
tooltipLabel.textContent = String(options.createAndAdd) + ' (Enter)';
let tooltipLoaded = false;
const tooltipImagesReady = Promise.all(tooltipImages.map(image => image.decode()));
window.__hyfrmeReady = tooltipImagesReady.then(() => { tooltipLoaded = true; draw(); });
let nativeReady = Promise.resolve();
window.addEventListener('hf-seek', event => event.detail.waitUntil(Promise.resolve().then(() => Promise.all([window.__hyfrmeReady, nativeReady]))));

if (options.theme === 'light') {
  stage.classList.remove('dark');
  stage.classList.add('light');
  for (const [key, value] of Object.entries(${scriptJson(lightTheme)})) stage.style.setProperty(key, value);
}
for (const [key, value] of Object.entries(${scriptJson(fontTheme)})) stage.style.setProperty(key, value);
stage.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
// The pinned native appearance is already selected before its first paint.
for (const animation of stage.getAnimations({ subtree: true })) {
  if (animation instanceof CSSTransition &&
      ['color', 'background-color', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'outline-color', 'text-decoration-color', 'fill', 'stroke'].includes(animation.transitionProperty)) {
    animation.cancel();
  }
}

for (const [key, value] of Object.entries(options.theme === 'light' ? ${scriptJson(lightTheme)} : ${scriptJson(theme)})) nativeTooltip.style.setProperty(key, value);
for (const [key, value] of Object.entries(${scriptJson(fontTheme)})) nativeTooltip.style.setProperty(key, value);
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
  if (current === defaults.newProjectAvatar && options.newProjectAvatar !== defaults.newProjectAvatar) {
    node.textContent = node.textContent.replace(current, options.newProjectAvatar);
    continue;
  }
  if (current === defaults.alternateDirectory && options.alternateDirectory !== defaults.alternateDirectory) {
    node.textContent = node.textContent.replace(current, options.alternateDirectory);
    continue;
  }
  const key = replacements[current];
  if (key && options[key] !== defaults[key]) node.textContent = node.textContent.replace(current, options[key]);
  if (options.newProjectName !== defaults.newProjectName && node.textContent.includes(defaults.newProjectName)) {
    node.textContent = node.textContent.replaceAll(defaults.newProjectName, String(options.newProjectName));
  }
  if (options.draftHeading !== defaults.draftHeading && node.textContent.includes(defaults.draftHeading)) {
    node.textContent = node.textContent.replaceAll(defaults.draftHeading, String(options.draftHeading));
  }
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
  const editor = section.querySelector('[data-testid="composer-editor"]');
  if (editor) editor.setAttribute('aria-placeholder', options.composerPlaceholder);
  const palette = section.querySelector('[data-testid="command-palette"]');
  const search = palette?.querySelector('input[data-slot="autocomplete-input"]');
  if (search && section.dataset.t3State === 'source') search.setAttribute('placeholder', options.searchPlaceholder);
  if (search && ['browse', 'selected'].includes(section.dataset.t3State)) {
    search.setAttribute('placeholder', options.pathPlaceholder);
    const path = section.dataset.t3State === 'browse'
      ? String(options.folderBasePath).replace(/\\/$/, '') + '/' + options.folderSearch
      : String(options.folderBasePath).replace(/\\/$/, '') + '/' + options.newProjectName + '/';
    search.value = path;
    search.setAttribute('value', path);
  }
  if (palette) {
    const labels = {
      'hyfrme-motion-lab': options.newProjectName,
      'hyfrme-motion-lab-rename': options.alternateDirectory,
      docs: options.childDirectory,
      'Create & Add': options.createAndAdd,
      Add: options.addProject,
    };
    const paletteWalker = document.createTreeWalker(palette, NodeFilter.SHOW_TEXT);
    let paletteNode;
    while ((paletteNode = paletteWalker.nextNode())) {
      const key = paletteNode.textContent.trim();
      if (key in labels) paletteNode.textContent = paletteNode.textContent.replace(key, String(labels[key]));
    }
  }
  for (const element of section.querySelectorAll('[aria-label], [title]')) {
    for (const attribute of ['aria-label', 'title']) {
      const value = element.getAttribute(attribute);
      if (!value) continue;
      let next = value.includes(defaults.newProjectName)
        ? value.replaceAll(defaults.newProjectName, String(options.newProjectName))
        : value.replaceAll(defaults.projectName, String(options.projectName));
      if (options.createAndAdd !== defaults.createAndAdd) next = next.replaceAll(defaults.createAndAdd, String(options.createAndAdd));
      if (options.addProject !== defaults.addProject && next.startsWith('Add (')) next = next.replace('Add (', String(options.addProject) + ' (');
      if (next !== value) element.setAttribute(attribute, next);
    }
  }
}
${nativeTransitionRuntime}
const tooltipStart = Math.max(Number(options.browseFrame), Number(options.sourceFrame) + 1) + (tooltipMotion.hoverDelay - tooltipMotion.beforeFirstFrameWait) * 30 / 1000;
for (const motion of tooltipMotion.motion) sourceTransition(tooltipPopup, motion.property, motion.from, motion.to, tooltipStart, motion.duration);
const clock = { frame: 0 };
function draw() {
  const frame = Math.round(clock.frame);
  const browseFrame = Math.max(Number(options.browseFrame), Number(options.sourceFrame) + 1);
  const selectedFrame = Math.max(Number(options.selectedFrame), browseFrame + 1);
  const addedFrame = Math.max(Number(options.addedFrame), selectedFrame + 1);
  const phase = frame < options.sourceFrame ? 0 : frame < browseFrame ? 1 : frame < selectedFrame ? 2 : frame < addedFrame ? 3 : 4;
  for (let index = 0; index < sections.length; index++) sections[index].hidden = index !== phase;
  for (let index = 0; index < nativePopups.length; index++) nativePopups[index].hidden = !nativePopupAllowed || phase !== index + 1;
  const tooltipImage = tooltipFrames.frameImageIndices[frame];
  tooltipCanvas.hidden = !nativeTooltipAllowed || !tooltipLoaded || tooltipImage == null;
  if (!tooltipCanvas.hidden) tooltipContext.drawImage(tooltipImages[tooltipImage], 0, 0);
  nativeTooltip.hidden = nativeTooltipAllowed || phase !== 2 || frame < tooltipStart;
  if (!nativeTooltip.hidden) {
    const trigger = [...sections[2].querySelectorAll('[data-slot="tooltip-trigger"]')].find(element => element.getAttribute('aria-label') === String(options.createAndAdd) + ' (Enter)');
    if (!trigger) throw new Error('Native Create & Add tooltip anchor missing');
    tooltipPopup.style.setProperty('--popup-width', 'max-content');
    tooltipPopup.style.scale = 'none';
    const box = trigger.getBoundingClientRect();
    const tooltipStyle = getComputedStyle(tooltipPopup);
    const width = parseFloat(tooltipStyle.width), height = parseFloat(tooltipStyle.height);
    tooltipPositioner.style.setProperty('--positioner-width', width + 'px');
    tooltipPositioner.style.setProperty('--positioner-height', height + 'px');
    tooltipPositioner.style.left = (box.left + (box.width - width) / 2) + 'px';
    tooltipPositioner.style.top = (box.top - 4 - height) + 'px';
    tooltipPositioner.style.bottom = 'auto';
  }
  nativeReady = seekNativeTransitions(nativeTooltip.hidden ? stage : nativeTooltip, frame);
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
  for (const phase of ["source", "browse", "selected"]) {
    await copyFile(resolve(source, `project-local-open-v0042-${appearance}-${phase === "browse" ? "browse-clean" : phase}-crop.png`),
      resolve(output, `project-local-open-v0042-${appearance}-${phase === "browse" ? "browse-clean" : phase}-crop.png`));
  }
}
const tooltipFiles = tooltipCrops.reports.flatMap(report => report.uniqueImages.map(image => image.file));
for (const file of [...tooltipFiles, "project-local-open-v0042-tooltip-crops.json", "project-local-open-v0042-browse-clean-crops.json"]) await copyFile(resolve(source,file),resolve(output,file));
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
      title: "T3 Code: Open Local Project",
      description:
        "Choose a real local Hyfrme folder in T3 Code's filesystem browser, add it, and open its new thread.",
      tags: ["composition", "app-ui", "t3-code", "project-local", "hyfrme-port"],
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
        ...["dark", "light"].flatMap((appearance) => ["source", "browse", "selected"].map((phase) => ({
          path: `project-local-open-v0042-${appearance}-${phase === "browse" ? "browse-clean" : phase}-crop.png`,
          target: `compositions/project-local-open-v0042-${appearance}-${phase === "browse" ? "browse-clean" : phase}-crop.png`,
          type: "hyperframes:asset",
        }))),
        ...[...tooltipFiles, "project-local-open-v0042-tooltip-crops.json", "project-local-open-v0042-browse-clean-crops.json"].map(file => ({path:file,target:`compositions/${file}`,type:"hyperframes:asset"})),
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
  `# T3 Code: Open Local Project

This four-second block reproduces T3 Code v${fixture.sourceTag.slice(1)} in dark or light mode at 1200 × 659 and 30 fps. In the real full Hyfrme workspace, New project opens the source chooser. Local folder searches an isolated filesystem path, selects hyfrme-motion-lab, and the native Add action creates the project and opens its new thread. No provider or repository account is used.

Customize the old and new project names, local path and search, chooser labels, sidebar, draft copy, appearance, and all four transition frames. The default chooser uses cropped official dark/light pixels. The browse crop comes from unchanged native frame 35 at the original bounds, removing only stale tooltip glyphs; the original crop remains preserved in source history. Its source hashes and exact comparison are packaged. An 857 × 34 strip preserves the pinned native tooltip placement history only with unchanged content and all four event frames; its source movie, ordered frame mapping, and image hashes are packaged. Changing content loads no native crops. Edited tooltip content and timing use the captured native markup and its source opacity/scale transition; changing timing loads no tooltip strips. Set matching variables on adjacent T3 Code blocks for a continuous workspace. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. The installed files include T3 Code's MIT license. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.
`,
);
console.log(`Generated ${name} from the real T3 Code local-folder browser and successful project add.`);
