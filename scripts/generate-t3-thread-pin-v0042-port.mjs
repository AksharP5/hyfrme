import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { nativeT3MonoFaces } from "./t3-native-fonts.mjs";
import { nativeTransitionRuntime } from "./t3-native-transition-runtime.mjs";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-thread-pin";
const output = resolve(root, ".work/t3-thread-pin-v0042-candidate");
const fixture = JSON.parse(
  await readFile(resolve(source, "thread-pin-fixture.json"), "utf8"),
);
const lightFixture = JSON.parse(
  await readFile(resolve(source, "thread-pin-light-fixture.json"), "utf8"),
);
const themes = await Promise.all(
  ["dark-theme.json", "thread-pin-light-theme.json"].map(async (file) =>
    JSON.parse(await readFile(resolve(source, file), "utf8")),
  ),
);
const css = await readFile(resolve(source, "t3.css"), "utf8");
for (const [index, native] of [fixture, lightFixture].entries()) {
  const imageCount = Object.keys(native.captureSpriteSha256 ?? {}).length;
  if (native.captureSpriteFrameCount !== 120 || !imageCount ||
      native.captureFrameImageIndices?.length !== 120 ||
      native.captureFrameImageIndices.some((index) => !Number.isInteger(index) || index < 0 || index >= imageCount))
    throw new Error("Native Pin PNG frame mapping is incomplete");
  const theme = index === 0 ? "dark" : "light";
  for (let row = 0; row < Object.keys(native.captureSpriteSha256).length; row++) {
    const suffix = String(row).padStart(2, "0");
    const bytes = await readFile(resolve(source, `thread-pin-v0042-${theme}-capture-${suffix}.png`));
    if (createHash("sha256").update(bytes).digest("hex") !== native.captureSpriteSha256[suffix])
      throw new Error(`Native Pin ${theme} native frame ${suffix} changed`);
  }
}
const gsap = await readFile(
  resolve(root, "registry/blocks/before-after/gsap.min.js"),
  "utf8",
);
const phases = fixture.phases;
const states = await Promise.all(
  phases.map((phase) =>
    readFile(resolve(source, `thread-pin-${phase}.html`), "utf8"),
  ),
);
const lightStates = await Promise.all(
  phases.map((phase) =>
    readFile(resolve(source, `thread-pin-light-${phase}.html`), "utf8"),
  ),
);
if (
  JSON.stringify(lightFixture.phases) !== JSON.stringify(phases) ||
  JSON.stringify(lightFixture.events) !== JSON.stringify(fixture.events)
) {
  throw new Error("Dark and light native fixtures use different phase timing");
}
if (
  fixture.motion?.length !== 2 ||
  lightFixture.motion?.length !== 2 ||
  fixture.motion.some(({ durationMs }) => durationMs !== 150) ||
  lightFixture.motion.some(({ durationMs }) => durationMs !== 150)
) {
  throw new Error("Native 150ms Pin row motion is missing from either theme");
}
const rowOffset = (motions, title) => {
  const entry = motions.find(({ row }) => row.includes(title));
  const match = entry?.keyframes[0]?.match(/^translateY\((-?[\d.]+)px\)$/);
  if (!match) throw new Error(`Native Pin motion missing for ${title}`);
  return Number(match[1]);
};
const motionOffsets = [fixture.motion, lightFixture.motion].map((motions) => [
  rowOffset(motions, fixture.targetThread),
  rowOffset(motions, "Build a logo intro"),
]);
for (const variant of [states, lightStates]) {
  for (let index = 0; index < variant.length; index++) {
    variant[index] = variant[index].replace(
      /(<span[^>]*class="[^"]*\[text-box:trim-both_cap_alphabetic\][^"]*")/g,
      "$1 data-layout-ignore",
    );
  }
  variant[0] = variant[0].replace(
    'group-hover:opacity-100"><div class="flex shrink-0 items-center gap-2">',
    'group-hover:opacity-100" style="opacity:1"><div class="flex shrink-0 items-center gap-2">',
  );
  for (const index of [1, 3])
    variant[index] = variant[index].replace(
      "<main ",
      "<main data-layout-ignore ",
    );
}
const portals = await Promise.all(
  ["pin-menu", "unpin-menu"].map(async (phase) =>
    (
      await readFile(resolve(source, `thread-pin-${phase}-portal.html`), "utf8")
    ).replaceAll(
      '<div class="dropdown-glass',
      '<div data-layout-ignore class="dropdown-glass',
    ),
  ),
);
const lightPortals = await Promise.all(
  ["pin-menu", "unpin-menu"].map(async (phase) =>
    (
      await readFile(
        resolve(source, `thread-pin-light-${phase}-portal.html`),
        "utf8",
      )
    ).replaceAll(
      '<div class="dropdown-glass',
      '<div data-layout-ignore class="dropdown-glass',
    ),
  ),
);
const hoverCards = await Promise.all(
  ["thread-pin", "thread-pin-light"].map((prefix) =>
    readFile(resolve(source, `${prefix}-pinned-portal.html`), "utf8"),
  ),
);
const hoverCardOffsets = [fixture, lightFixture].map(({ hoverCard, captureClock, events }) => {
  const visible = captureClock.samples.filter((sample) => sample.hoverCards.some((card) => card.text.includes(hoverCard.thread) && Number(card.opacity) > 0));
  if (!visible.length) throw new Error("Native Pin hover-card visibility is missing");
  return [visible[0].frame - events.pin, visible.at(-1).frame - events.unpinMenu];
});

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["projectAvatar", "Project avatar letters", "HE"],
  ["branchName", "Branch name", "main"],
  ["activeBranch", "Active branch", "feature/logo-enter"],
  ["thirdBranch", "Third thread branch", "logo/assemble"],
  ["fourthBranch", "Fourth thread branch", "logo/hold-final"],
  ["firstThread", "Initial thread", "Build a logo intro"],
  ["pinThread", "Thread to pin", "Catalog motion audit"],
  ["thirdThread", "Third thread", "Grouped logo tests"],
  ["fourthThread", "Fourth thread", "Review final hold"],
  ["fifthThread", "Fifth thread", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ["firstAge", "Initial thread age", "10h"],
  ["targetAge", "Thread age", "12h"],
  ["thirdAge", "Third thread age", "17h"],
  ["fourthAge", "Fourth thread age", "1d"],
  ["fifthAge", "Fifth thread age", "2d"],
  ["settledAge", "Settled thread age", "7h"],
  [
    "targetQuestion",
    "Thread user message",
    "Which Hyfrme motion blocks need a fresh parity render?",
  ],
  [
    "targetReply",
    "Thread answer",
    "Logo Enter and Answer Stream should be checked at their final frames. Their pinned reference and Hyfrme output must use matching dimensions, frame rate, and input values.",
  ],
  ["targetQuestionTime", "Thread user message time", "yesterday at 7:24 PM"],
  ["targetReplyTime", "Thread answer time", "yesterday at 7:26 PM"],
  [
    "composerPlaceholder",
    "Composer placeholder",
    "Enable a provider in Settings to send a message",
  ],
  ["providerStatus", "Provider status", "Open provider settings"],
  ["permissionMode", "Permission", "Full access"],
  ["workspaceMode", "Workspace", "Worktree"],
  ["pinAction", "Pin menu action", "Pin thread"],
  ["unpinAction", "Unpin menu action", "Unpin thread"],
  ["settleAction", "Settle menu action", "Settle thread"],
  ["snoozeAction", "Snooze menu action", "Snooze"],
  ["renameAction", "Rename menu action", "Rename thread"],
  ["regenerateAction", "Regenerate menu action", "Regenerate title"],
  ["unreadAction", "Unread menu action", "Mark unread"],
  ["copyAction", "Copy menu action", "Copy"],
  ["archiveAction", "Archive menu action", "Archive thread"],
  ["deleteAction", "Delete menu action", "Delete"],
];
const variables = [
  {
    id: "theme",
    type: "string",
    label: "Theme",
    default: "dark",
    options: ["dark", "light"],
  },
  { id: "renderMode", type: "string", label: "Render mode", default: "pixel-verified", options: ["pixel-verified", "editable DOM"] },
  ...fields.map(([id, label, value]) => ({
    id,
    type: "string",
    label,
    default: value,
  })),
  {
    id: "menuFrame",
    type: "number",
    label: "Open Pin menu at frame",
    default: fixture.events.menu,
    min: 0,
    max: 105,
    step: 1,
  },
  {
    id: "pinFrame",
    type: "number",
    label: "Pin thread at frame",
    default: fixture.events.pin,
    min: 1,
    max: 110,
    step: 1,
  },
  {
    id: "unpinMenuFrame",
    type: "number",
    label: "Show Unpin action at frame (120 keeps menu closed)",
    default: fixture.events.unpinMenu,
    min: 1,
    max: 120,
    step: 1,
  },
  {
    id: "seamToUnpin",
    type: "number",
    label: "Match the Thread Unpin opening frame",
    default: 0,
    min: 0,
    max: 1,
    step: 1,
  },
];
const defaults = Object.fromEntries(
  variables.map(({ id, default: value }) => [id, value]),
);
const replacements = Object.fromEntries(
  fields.map(([id, , value]) => [value, id]),
);
const fontThemes = themes.map((theme) =>
  Object.fromEntries(
    Object.entries(theme).filter(
      ([key]) =>
        key.includes("font-family") ||
        key === "--font-sans" ||
        key === "--font-mono",
    ),
  ),
);
const stageThemes = themes.map((theme) =>
  Object.entries(theme)
    .map(([key, value]) => `${key}:${value};`)
    .join(""),
);
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
  .t3-stage { position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--background); color: var(--foreground); -webkit-font-smoothing: antialiased; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
  /* Preserve native T3 typography when HyperFrames compiles the block. */
  .t3-stage, .t3-stage *:not([text-rendering]) { text-rendering: auto; }
  /* Native Submit buttons must not animate inherited clip visibility. */
  .t3-stage button[type="submit"].transition-all { transition-property: background-color, color, box-shadow, transform, scale, opacity; }
  .t3-stage[hidden] { display: none !important; }
  .t3-state[hidden] { display: none !important; }
  .t3-state:not([hidden]) { display: contents; }
  .t3-pixel-capture { position: absolute; inset: 0; z-index: 200; pointer-events: none; width: 1200px; height: 659px; }
  .t3-pixel-capture[hidden] { display: none !important; }
  .base-ui-disable-scrollbar { scrollbar-width: none; }
  .base-ui-disable-scrollbar::-webkit-scrollbar { display: none; }
  @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
  @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
  @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
  @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"); }
${nativeT3MonoFaces}
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
  <div class="dark t3-stage" style='${escapeAttribute(stageThemes[0])}'>
    <div class="t3-state" data-t3-state="unpinned">${states[0]}</div>
    <div class="t3-state" data-t3-state="pin-menu" data-layout-ignore hidden>${states[1]}${portals[0]}</div>
    <div class="t3-state" data-t3-state="pinned" hidden>${states[2]}${hoverCards[0]}</div>
    <div class="t3-state" data-t3-state="unpin-menu" data-layout-ignore hidden>${states[3]}${portals[1]}</div>
  </div>
  <div class="light t3-stage" style='${escapeAttribute(stageThemes[1])}' hidden>
    <div class="t3-state" data-t3-state="unpinned">${lightStates[0]}</div>
    <div class="t3-state" data-t3-state="pin-menu" data-layout-ignore hidden>${lightStates[1]}${lightPortals[0]}</div>
    <div class="t3-state" data-t3-state="pinned" hidden>${lightStates[2]}${hoverCards[1]}</div>
    <div class="t3-state" data-t3-state="unpin-menu" data-layout-ignore hidden>${lightStates[3]}${lightPortals[1]}</div>
  </div>
  <canvas data-layout-ignore class="t3-pixel-capture" width="1200" height="659" hidden></canvas>
</div>
<script src="t3-code-gsap.min.js"></script>
<script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
const pixelMode = options.renderMode === 'pixel-verified' && Object.entries(defaults).every(([key, value]) => key === 'theme' || key === 'renderMode' || options[key] === value);
const stages = [...document.querySelectorAll('#root .t3-stage')];
for (const [index, stage] of stages.entries()) {
  for (const [key, value] of Object.entries(${scriptJson(fontThemes)}[index])) stage.style.setProperty(key, value);
  stage.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
}
const replacements = ${scriptJson(replacements)};
const walker = document.createTreeWalker(document.querySelector('#root'), NodeFilter.SHOW_TEXT);
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
const sections = stages.map((stage) => [...stage.querySelectorAll('[data-t3-state]')]);
const movingRows = sections.map((variant, themeIndex) => [options.pinThread, options.firstThread].map((title, rowIndex) => {
  const row = [...variant[2].querySelectorAll('[data-testid="sidebar-row-card"]')]
    .find((element) => element.textContent.includes(title))?.closest('[data-thread-item="true"]');
  if (!row) throw new Error('Pin motion row missing: ' + title);
  return { row, offset: ${scriptJson(motionOffsets)}[themeIndex][rowIndex] };
}));
for (const variant of sections) for (const [section, title, hoveredBackground] of [[variant[1], options.pinThread, false], [variant[2], options.thirdThread, Number(options.seamToUnpin) !== 1], [variant[3], options.pinThread, false]]) {
  if (section === variant[2] && !hoveredBackground) continue;
  const row = [...section.querySelectorAll('[data-testid="sidebar-row-card"]')]
    .find((element) => element.textContent.includes(title));
  if (!row) continue;
  if (hoveredBackground) {
    row.style.backgroundColor = 'var(--sidebar-row-hover)';
    row.style.color = 'var(--sidebar-foreground)';
  }
  for (const element of row.querySelectorAll('span')) {
    const classes = element.getAttribute('class') ?? '';
    if (classes.includes('group-hover/sidebar-row:opacity-0')) {
      element.style.opacity = '0';
      element.style.position = 'absolute';
      element.style.right = '0';
    }
    if (classes.includes('group-hover/sidebar-row:opacity-100')) {
      element.style.opacity = '1';
      element.style.position = 'static';
      element.style.pointerEvents = 'auto';
    }
  }
}
${nativeTransitionRuntime}
function transitionRowControls(row, entering, start) {
  if (!row) throw new Error('Pin native hover row missing');
  for (const element of row.querySelectorAll('[class*="group-hover/sidebar-row:opacity-"]')) {
    const showing = element.classList.contains('group-hover/sidebar-row:opacity-100');
    sourceTransition(element, 'opacity', showing === entering ? '0' : '1', showing === entering ? '1' : '0', start, 150);
  }
}
for (const [themeIndex, variant] of sections.entries()) {
  const findRow = (section, title) => [...section.querySelectorAll('[data-testid="sidebar-row-card"]')]
    .find((element) => element.textContent.includes(title));
  const menuFrame = Number(options.menuFrame);
  const pinFrame = Math.max(Number(options.pinFrame), menuFrame + 1);
  const unpinMenuFrame = Math.max(Number(options.unpinMenuFrame), pinFrame + 5);
  transitionRowControls(findRow(variant[1], options.pinThread), true, menuFrame);
  transitionRowControls(movingRows[themeIndex][0].row, false, pinFrame);
  transitionRowControls(findRow(variant[3], options.pinThread), true, unpinMenuFrame);
  if (Number(options.seamToUnpin) !== 1) {
    transitionRowControls(findRow(variant[2], options.thirdThread), true, pinFrame);
    transitionRowControls(findRow(variant[3], options.thirdThread), false, unpinMenuFrame);
  }
  const messageControls = variant[1].querySelector('[class~="opacity-0"][class~="duration-200"]');
  if (!messageControls) throw new Error('Pin native message controls missing');
  sourceTransition(messageControls, 'opacity', '1', '0', menuFrame, 200);
}
for (const section of sections.flat()) {
  for (const editor of section.querySelectorAll('[data-testid="composer-editor"]')) {
    editor.setAttribute('aria-placeholder', options.composerPlaceholder);
  }
  for (const element of section.querySelectorAll('[aria-label], [title]')) {
    for (const attribute of ['aria-label', 'title']) {
      const label = element.getAttribute(attribute);
      if (!label) continue;
      let updated = label;
      for (const key of ['firstThread', 'pinThread', 'thirdThread', 'fourthThread', 'fifthThread', 'projectName', 'projectAvatar', 'branchName', 'activeBranch', 'thirdBranch', 'fourthBranch', 'unpinAction', 'pinAction']) {
        if (options[key] !== defaults[key]) updated = updated.replaceAll(defaults[key], String(options[key]));
      }
      if (updated !== label) element.setAttribute(attribute, updated);
    }
  }
}
// Native row animation preserves the source compositor and easing at every seek.
const rowAnimations = pixelMode ? [] : movingRows.flat().map(({ row, offset }) => {
  const animation = row.animate([{ transform: 'translateY(' + offset + 'px)' }, { transform: 'translateY(0px)' }], {
    duration: 150, easing: 'ease-out', delay: Math.max(Number(options.pinFrame), Number(options.menuFrame) + 1) * 1000 / 30,
  });
  animation.pause();
  animation.currentTime = 0;
  return animation;
});
const clock = { frame: 0 };
const capture = document.querySelector('canvas.t3-pixel-capture');
const captureContext = capture.getContext('2d');
if (!captureContext) throw new Error('Native frame capture requires Canvas 2D');
captureContext.imageSmoothingEnabled = false;
let captureImages = [];
let runtimeSeekCompletion;
let nativeSeekBound = false;
let nativeReady = Promise.resolve();
async function waitForNativeTransitions() {
  if (runtimeSeekCompletion) await runtimeSeekCompletion();
  await nativeReady;
}
function bindNativeSeekCompletion() {
  if (nativeSeekBound || typeof window.__hfWaitForSeekCompletion !== 'function') return;
  nativeSeekBound = true;
  runtimeSeekCompletion = window.__hfWaitForSeekCompletion;
  window.__hfWaitForSeekCompletion = waitForNativeTransitions;
}
function draw() {
  const frame = Math.min(119, Math.max(0, Math.round(clock.frame)));
  const menuFrame = Number(options.menuFrame);
  const pinFrame = Math.max(Number(options.pinFrame), menuFrame + 1);
  const unpinMenuFrame = Math.max(Number(options.unpinMenuFrame), pinFrame + 5);
  const phase = frame < menuFrame ? 0 : frame < pinFrame ? 1 : frame < unpinMenuFrame ? 2 : 3;
  const themeIndex = options.theme === 'light' ? 1 : 0;
  for (const [index, stage] of stages.entries()) stage.hidden = pixelMode || index !== themeIndex;
  capture.hidden = !pixelMode;
  if (pixelMode) {
    const imageIndex = ${scriptJson([fixture.captureFrameImageIndices, lightFixture.captureFrameImageIndices])}[themeIndex][frame];
    if (captureImages[imageIndex]) captureContext.drawImage(captureImages[imageIndex], 0, 0);
    nativeReady = Promise.resolve();
    bindNativeSeekCompletion();
    return;
  }
  for (const variant of sections) {
    for (const [index, section] of variant.entries()) section.hidden = index !== phase;
  }
  for (const [index, variant] of sections.entries()) {
    const portal = variant[2].querySelector('[data-slot="tooltip-positioner"]');
    const [first, last] = ${scriptJson(hoverCardOffsets)}[index];
    portal.hidden = Number(options.seamToUnpin) === 1 || frame < pinFrame + first - 1 || frame > unpinMenuFrame + last + 1;
    const popup = portal.querySelector('[data-slot="tooltip-popup"]');
    popup.toggleAttribute('data-starting-style', frame === pinFrame + first - 1);
    popup.toggleAttribute('data-ending-style', frame === unpinMenuFrame + last + 1);
  }
  for (const animation of rowAnimations) animation.currentTime = frame * 1000 / 30;
  nativeReady = Promise.all([Promise.all(rowAnimations.map((animation) => animation.ready)), seekNativeTransitions(sections[themeIndex][phase], frame)]);
  bindNativeSeekCompletion();

}
draw();
const captureReady = pixelMode
  ? Promise.all(Array.from({ length: ${scriptJson([Object.keys(fixture.captureSpriteSha256).length, Object.keys(lightFixture.captureSpriteSha256).length])}[options.theme === 'light' ? 1 : 0] }, async (_, row) => {
      const image = new Image();
      image.src = ${scriptJson([fixture, lightFixture].map((native, index) => Object.keys(native.captureSpriteSha256).sort().map((suffix) => `compositions/${name}-capture-${index === 0 ? 'dark' : 'light'}-${suffix}.png`)))}[options.theme === 'light' ? 1 : 0][row];
      await image.decode();
      return image;
    }))
  : Promise.resolve([]);
window.__hyfrmeReady = captureReady.then((images) => {
  captureImages = images;
  draw();
  const timeline = gsap.timeline({ paused: true });
  timeline.to(clock, { frame: 120, duration: 4, ease: 'none', onUpdate: draw });
  window.__timelines['${name}'] = timeline;
  window.__hfForceTimelineRebind?.();
  return nativeReady;
});

</script>
</template>
</body>
</html>
`;

await mkdir(resolve(output, "licenses"), { recursive: true });
await writeFile(resolve(output, `${name}.html`), html);
await writeFile(resolve(output, "t3-code-gsap.min.js"), gsap);
for (const [index, theme] of ["dark", "light"].entries()) for (let row = 0; row < Object.keys([fixture, lightFixture][index].captureSpriteSha256).length; row++) {
  const suffix = String(row).padStart(2, "0");
  await copyFile(resolve(source, `thread-pin-v0042-${theme}-capture-${suffix}.png`), resolve(output, `${name}-capture-${theme}-${suffix}.png`));
}
await copyFile(
  resolve(root, "parity/t3-gallery/assets/T3-CODE-LICENSE.txt"),
  resolve(output, "licenses/T3-CODE-LICENSE.txt"),
);
await copyFile(
  resolve(
    root,
    "registry/blocks/t3-thread-pin/licenses/T3-THIRD_PARTY_NOTICES.md",
  ),
  resolve(output, "licenses/T3-THIRD_PARTY_NOTICES.md"),
);
await writeFile(
  resolve(output, "registry-item.json"),
  `${JSON.stringify(
    {
      $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
      name,
      type: "hyperframes:block",
      title: "T3 Code: Thread Pin",
      description:
        "Pin a Hyfrme thread through T3 Code's sidebar context menu, then see it move to the top and reveal the native Unpin action.",
      tags: ["composition", "app-ui", "t3-code", "thread-pin", "hyfrme-port"],
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
        ...["dark", "light"].flatMap((theme, index) => Array.from({ length: Object.keys([fixture, lightFixture][index].captureSpriteSha256).length }, (_, row) => ({
          path: `${name}-capture-${theme}-${String(row).padStart(2, "0")}.png`,
          target: `compositions/${name}-capture-${theme}-${String(row).padStart(2, "0")}.png`,
          type: "hyperframes:asset",
        }))),
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
  `# T3 Code: Thread Pin\n\nThis four-second, 1200 × 659 block reproduces T3 Code v${fixture.sourceTag.slice(1)} at 30 fps. Right-clicking the unpinned row opens its sidebar context menu beside the row. Pin moves the thread to the top through the native 150 ms row transition, shows the hovered third thread's details, and then offers Unpin thread. The theme variable selects independently captured dark or light source states.\n\nUnchanged content and timing use the native recording frame for frame through one canvas and 20 deduplicated lossless native PNG frames per theme. Editing content, timing, or continuity settings automatically uses editable DOM. Set renderMode to editable DOM to use native source markup explicitly. The editable path preserves the row transitions and hover-card lifecycle.\n\nCustomize theme, project, branch, thread titles and ages, conversation content, composer copy, menu actions, and the three interaction beats through HyperFrames variables. Match the project and thread values with adjacent T3 Code blocks for continuity. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. Installed files include T3 Code's MIT license and third-party icon notice. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.\n`,
);
console.log(
  `Generated ${name} from four native T3 Code states, two action menus, and the third-thread hover portal.`,
);
