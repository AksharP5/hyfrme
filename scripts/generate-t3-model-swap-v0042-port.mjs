import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { isDeepStrictEqual } from "node:util";
import { assertT3CaptureImages } from "./t3-capture-images.mjs";
import { nativeT3MonoFaces } from "./t3-native-fonts.mjs";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-model-swap";
const output = resolve(root, ".work/t3-model-swap-v0042-candidate");
const fixture = JSON.parse(
  await readFile(resolve(source, "model-swap-v0042-dark-fixture.json"), "utf8"),
);
const lightFixture = JSON.parse(await readFile(resolve(source, "model-swap-v0042-light-fixture.json"), "utf8"));
const captureAtlasPath = "parity/t3-model-swap-v0042-atlas.json";
const captureAtlasBytes = await readFile(resolve(root, captureAtlasPath));
const captureAtlas = JSON.parse(captureAtlasBytes);
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const decodedFrames = path => execFileSync("ffmpeg", ["-v", "error", "-i", path, "-pix_fmt", "rgba", "-f", "framehash", "-hash", "sha256", "-"], {encoding:"utf8", maxBuffer:4 * 1024 * 1024})
  .split("\n").filter(line => line && !line.startsWith("#")).map(line => line.split(",").map(value => value.trim()));
if (captureAtlas.slug !== name || captureAtlas.sourceCommit !== fixture.sourceCommit ||
  captureAtlas.sourceTag !== fixture.sourceTag) throw new Error("Native Model Swap capture pin changed");
for (const record of captureAtlas.historical) {
  if (hash(await readFile(resolve(root, record.path))) !== record.sha256) throw new Error("Archived Model Swap proof changed: " + record.path);
}
for (const [theme, native] of [["dark", fixture], ["light", lightFixture]]) {
  const evidence = captureAtlas.themes[theme];
  assertT3CaptureImages(captureAtlas, native, theme);
  const originalBytes = await readFile(resolve(root, evidence.originalFixture));
  const {captureSpriteSha256, captureFrameImageIndices, captureSpriteFrameCount, ...originalFields} = native;
  if (hash(originalBytes) !== evidence.originalFixtureSha256 ||
    !isDeepStrictEqual(originalFields, JSON.parse(originalBytes)) ||
    hash(await readFile(resolve(root, evidence.fixture))) !== evidence.fixtureSha256 ||
    hash(await readFile(resolve(root, evidence.reference))) !== evidence.referenceSha256 ||
    native.referenceSha256 !== evidence.referenceSha256) throw new Error(theme + ": native Model Swap fixture changed");
  const frames = decodedFrames(resolve(root, evidence.reference));
  if (frames.length !== native.frames || evidence.images.length !== evidence.uniqueFrames) throw new Error(theme + ": incomplete native Model Swap frames");
  for (const [index, image] of evidence.images.entries()) {
    const path = resolve(source, image.file), png = await readFile(path);
    const decoded = decodedFrames(path);
    if (hash(png) !== image.pngSha256 || decoded.length !== 1 ||
      decoded[0][4] !== String(native.viewport.width * native.viewport.height * 4) ||
      decoded[0][5] !== image.rgbaSha256 || image.rgbaSha256 !== evidence.rgbaSha256[image.firstFrame] ||
      evidence.frameImageIndices[image.firstFrame] !== index) throw new Error(theme + ": native Model Swap image changed: " + image.file);
  }
  for (const [frame, record] of frames.entries()) {
    const image = evidence.images[evidence.frameImageIndices[frame]];
    if (record[2] !== String(frame) || record[4] !== String(native.viewport.width * native.viewport.height * 4) ||
      record[5] !== evidence.rgbaSha256[frame] || record[5] !== image.rgbaSha256 ||
      evidence.sourcePngSha256[frame] !== image.pngSha256) throw new Error(theme + ": native Model Swap frame " + frame + " is not exact");
  }
}
if (JSON.stringify(fixture.sourceDomHashes) !== JSON.stringify(lightFixture.sourceDomHashes)) {
  throw new Error("Native model picker DOM differs between themes");
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
const [nativeShell, menuPortal, hoverPortal] = await Promise.all(
  ["before", "portal", "hover-portal"].map((phase) =>
    readFile(resolve(source, `model-swap-v0042-dark-${phase}.html`), "utf8"),
  ),
);
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
  ["modelBefore", "Previous model", fixture.modelBefore],
  ["modelAfter", "Selected model", fixture.modelAfter],
  ["reasoningLevel", "Reasoning", "Medium"],
  ["permissionMode", "Permission", "Full access"],
  ["workspaceMode", "Workspace", "Current checkout"],
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
  { id: "renderMode", type: "string", label: "Render mode", default: "pixel-verified", options: ["pixel-verified", "editable DOM"] },
  { id: "theme", type: "string", label: "T3 Code appearance", default: "dark", options: ["dark", "light"] },
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
    id: "hoverFrame",
    type: "number",
    label: "Hover selected model at frame",
    default: fixture.hoverFrame,
    min: 5,
    max: 105,
    step: 1,
  },
  {
    id: "selectFrame",
    type: "number",
    label: "Select model at frame",
    default: fixture.selectFrame,
    min: 20,
    max: 119,
    step: 1,
  },
];
const defaults = Object.fromEntries(fields.map(([id, , value]) => [id, value]));
defaults.renderMode = "pixel-verified";
defaults.theme = "dark";
defaults.openFrame = fixture.openFrame;
defaults.hoverFrame = fixture.hoverFrame;
defaults.selectFrame = fixture.selectFrame;
const textReplacements = Object.fromEntries(
  fields
    .filter(([id]) => !id.endsWith("Age") && !["projectName", "projectAvatar", "heroLead", "heroTail"].includes(id))
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
  /* The pinned native Playwright screenshots hide text carets. */
  .t3-stage input[data-slot="combobox-input"] { caret-color: transparent; }
  .t3-popup-state[hidden], .t3-stage[hidden], .t3-pixel-capture[hidden] { display: none !important; }
  .t3-pixel-capture { position:absolute; inset:0; width:1200px; height:659px; pointer-events:none; }
  .t3-popup-state:not([hidden]) { display: contents; }
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
    ${shell}
    <div class="t3-popup-state" data-t3-popup="menu" hidden>${menuPortal}</div>
    <div class="t3-popup-state" data-t3-popup="hover" hidden>${hoverPortal}</div>
  </div>
  <canvas class="t3-pixel-capture" width="1200" height="659" hidden></canvas>
</div>
<script src="t3-code-gsap.min.js"></script>
<script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
const pixelMode = options.renderMode === 'pixel-verified' && Object.entries(defaults).every(([key, value]) => key === 'theme' || key === 'renderMode' || options[key] === value);
const nativeFrames = ${scriptJson(Object.fromEntries(["dark", "light"].map(theme => [theme, {images:captureAtlas.themes[theme].images.map(({file}) => 'compositions/' + file), mapping:captureAtlas.themes[theme].frameImageIndices}])))};
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
    for (const key of ['projectName', 'projectAvatar', 'branchName', 'activeBranch', 'modelBefore', 'modelAfter']) {
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
const trigger = stage.querySelector('button[data-chat-provider-model-picker="true"]');
const modelLabel = trigger?.querySelector('[data-chat-provider-model-picker-label="true"]');
if (!trigger || !modelLabel || popups.length !== 2) throw new Error('Native model picker structure is missing');
const coveredText = [
  stage.querySelector('h1'),
  stage.querySelector('h1 button'),
  stage.querySelector('[data-lexical-text]'),
  modelLabel,
  ...[...stage.querySelectorAll('span')].filter(span => [options.reasoningLevel, options.permissionMode].includes(span.textContent.trim())),
];
for (const element of coveredText) {
  if (!element) continue;
  element.setAttribute('data-layout-allow-occlusion', '');
  element.setAttribute('data-layout-allow-overlap', '');
}
const motion = options.theme === 'light' ? ${scriptJson(lightFixture.motion)} : ${scriptJson(fixture.motion)};
const entries = popups.map(section => {
  const popup = section.querySelector('[data-slot="popover-popup"]');
  const searchBorder = section.querySelector('input[placeholder="Search models..."]')?.closest('.border-b');
  popup.style.transition = 'none';
  if (searchBorder) searchBorder.style.transition = 'none';
  return { popup, searchBorder };
});
const hoverRow = popups[1].querySelector('[data-slot="combobox-item"][data-highlighted]');
const favorite = hoverRow?.querySelector('[data-slot="tooltip-trigger"]');
if (!hoverRow || !favorite) throw new Error('Native model hover row is missing');
hoverRow.style.transition = 'none';
favorite.style.transition = 'none';
function ease(progress) {
  let position = progress;
  for (let index = 0; index < 8; index++) {
    const x = 3 * (1 - position) * (1 - position) * position * 0.4 + 3 * (1 - position) * position * position * 0.2 + position * position * position;
    const derivative = 3 * (1 - position) * (1 - position) * 0.4 + 6 * (1 - position) * position * (0.2 - 0.4) + 3 * position * position * (1 - 0.2);
    position = Math.max(0, Math.min(1, position - (x - progress) / Math.max(0.0001, derivative)));
  }
  return 3 * (1 - position) * position * position + position * position * position;
}
function mix(from, to, amount) {
  if (amount <= 0) return from;
  if (amount >= 1) return to;
  return 'color-mix(in oklab, ' + from + ' ' + ((1 - amount) * 100) + '%, ' + to + ' ' + (amount * 100) + '%)';
}
const searchColor = motion.open.find(record => record.keyframes[0]?.styles.borderBottomColor)?.keyframes;
const hoverBackground = motion.hover.find(record => record.keyframes[0]?.styles.backgroundColor)?.keyframes;
const hoverText = motion.hover.find(record => record.keyframes[0]?.styles.color)?.keyframes;
const capture = document.querySelector('canvas.t3-pixel-capture');
const captureContext = capture.getContext('2d');
if (!captureContext) throw new Error('Native Model Swap capture requires Canvas 2D');
captureContext.imageSmoothingEnabled = false;
let captureImages = [];
const clock = { frame: 0 };
function draw() {
  const frame = Math.min(119, Math.max(0, Math.round(clock.frame)));
  stage.hidden = pixelMode;
  capture.hidden = !pixelMode;
  if (pixelMode) {
    const image = captureImages[nativeFrames[options.theme].mapping[frame]];
    if (image) captureContext.drawImage(image, 0, 0, 1200, 659);
    return;
  }
  const openFrame = Math.max(0, Math.min(90, Number(options.openFrame)));
  const hoverFrame = Math.max(openFrame + 5, Math.min(105, Number(options.hoverFrame)));
  const selectFrame = Math.max(hoverFrame + 5, Math.min(119, Number(options.selectFrame)));
  const phase = frame < openFrame ? 0 : frame < hoverFrame ? 1 : frame < selectFrame ? 2 : 3;
  popups[0].hidden = phase !== 1;
  popups[1].hidden = phase !== 2;
  trigger.style.color = phase === 1 ? 'var(--contrast-foreground)' : '';
  trigger.setAttribute('aria-expanded', String(phase === 1 || phase === 2));
  trigger.toggleAttribute('data-popup-open', phase === 1 || phase === 2);
  trigger.toggleAttribute('data-pressed', phase === 1 || phase === 2);
  if (phase === 1 || phase === 2) trigger.setAttribute('aria-controls', '_r_3m_');
  else trigger.removeAttribute('aria-controls');
  modelLabel.textContent = phase === 3 ? options.modelAfter : options.modelBefore;
  if (phase === 1 || phase === 2) {
    const opening = ease(Math.max(0, Math.min(1, (frame - openFrame) * 1000 / 30 / 150)));
    const { popup, searchBorder } = entries[phase - 1];
    popup.style.opacity = String(opening);
    popup.style.scale = opening >= 1 ? 'none' : String(0.98 + 0.02 * opening);
    if (searchBorder && searchColor) searchBorder.style.borderColor = mix(searchColor[0].styles.borderBottomColor, searchColor[1].styles.borderBottomColor, opening);
    if (phase === 2) {
      const hovering = ease(Math.max(0, Math.min(1, (frame - hoverFrame) * 1000 / 30 / 150)));
      if (hoverBackground) hoverRow.style.backgroundColor = mix(hoverBackground[0].styles.backgroundColor, hoverBackground[1].styles.backgroundColor, hovering);
      if (hoverText) hoverRow.style.color = mix(hoverText[0].styles.color, hoverText[1].styles.color, hovering);
      favorite.style.opacity = String(0.64 + 0.36 * hovering);
    }
    popups[phase - 1].querySelector('input[placeholder="Search models..."]')?.focus({ preventScroll: true });
  }
}
draw();
const captureReady = pixelMode ? Promise.all(nativeFrames[options.theme].images.map(async source => {
  const image = new Image();
  image.src = source;
  await image.decode();
  return image;
})) : Promise.resolve([]);
window.__hyfrmeReady = captureReady.then(images => {
  captureImages = images;
  draw();
  const timeline = gsap.timeline({ paused: true });
  timeline.to(clock, { frame: 120, duration: 4, ease: 'none', onUpdate: draw });
  window.__timelines['${name}'] = timeline;
  window.__hfForceTimelineRebind?.();
});
</script>
</template>
</body>
</html>
`;

await mkdir(resolve(output, "licenses"), { recursive: true });
await writeFile(resolve(output, `${name}.html`), html);
await writeFile(resolve(output, "t3-code-gsap.min.js"), gsap);
for (const theme of ["dark", "light"]) for (const image of captureAtlas.themes[theme].images) await copyFile(resolve(source, image.file), resolve(output, image.file));
await writeFile(resolve(output, "model-swap-v0042-native-frames.json"), captureAtlasBytes);
await copyFile(
  resolve(root, "parity/t3-gallery/assets/T3-CODE-LICENSE.txt"),
  resolve(output, "licenses/T3-CODE-LICENSE.txt"),
);
await copyFile(resolve(root, "registry/blocks/t3-thread-unpin/licenses/T3-THIRD_PARTY_NOTICES.md"),
  resolve(output, "licenses/T3-THIRD_PARTY_NOTICES.md"));
await writeFile(
  resolve(output, "registry-item.json"),
  `${JSON.stringify(
    {
      $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
      name,
      type: "hyperframes:block",
      title: "T3 Code: Model Swap",
      description:
        "Open the native T3 Code v0.0.42 model picker and switch a seeded model selection while keeping the same project, thread, and prompt in view. No provider executes inference.",
      tags: ["composition", "app-ui", "t3-code", "model-picker", "hyfrme-port"],
      author: "Hyfrme",
      authorUrl: "https://github.com/AksharP5/hyfrme",
      license: "MIT",
      dimensions: fixture.viewport,
      duration: fixture.frames / fixture.fps,
      files: [
        ...["dark", "light"].flatMap(theme => captureAtlas.themes[theme].images.map(({file}) => ({path:file, target:'compositions/' + file, type:'hyperframes:asset'}))),
        {path:'model-swap-v0042-native-frames.json', target:'compositions/model-swap-v0042-native-frames.json', type:'hyperframes:asset'},
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
          path: "licenses/T3-THIRD_PARTY_NOTICES.md",
          target: "THIRD_PARTY_LICENSES/t3-code/T3-THIRD_PARTY_NOTICES.md",
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
  `# T3 Code: Model Swap

This four-second block reproduces the T3 Code ${fixture.sourceTag} model picker in dark or light at 1200 × 659 and 30 fps. It starts with the same project and prompt as t3-brief-to-prompt, opens the picker, hovers a model, and selects ${fixture.modelAfter}. The model list is a seeded T3 fixture with no provider configured; this capture exercises native picker UI and does not run AI inference. Unchanged content and timing replay the whole pinned native recording frame for frame, including its original browser paint history. Editing any content or timing, or selecting editable DOM, automatically uses the corrected source DOM; customized output does not claim pixel equality.

Set the same theme, project, branch, thread, age, and prompt variables on adjacent T3 Code blocks for a continuous workspace. The picker opens at openFrame, highlights the next model at hoverFrame, and commits selection at selectFrame. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. The installed files include the T3 Code MIT license and third-party icon notice. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.
`,
);
console.log(`Generated ${name} candidate from official T3 Code v0.0.42 model picker.`);
