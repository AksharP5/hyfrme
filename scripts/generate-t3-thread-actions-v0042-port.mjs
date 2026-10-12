import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { nativeT3MonoFaces } from "./t3-native-fonts.mjs";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-thread-actions";
const output = resolve(root, ".work/t3-thread-actions-v0042-candidate");
const fixture = JSON.parse(await readFile(resolve(source, "thread-actions-dark-fixture.json"), "utf8"));
const lightFixture = JSON.parse(await readFile(resolve(source, "thread-actions-light-fixture.json"), "utf8"));
if (JSON.stringify(lightFixture.events) !== JSON.stringify(fixture.events)) throw new Error("Native dark and light timing differs");
const themes = await Promise.all(["dark-theme.json", "light-theme.json"].map(async (file) =>
  JSON.parse(await readFile(resolve(source, file), "utf8"))));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const pierreIcons = await readFile(resolve(root, ".work/t3-v0042-bin/t3-0.0.42-linux-x64/client/assets/pierre-icons-vHQ4qnbe.js"), "utf8");
const htmlIcon = pierreIcons.match(/<symbol id="file-tree-builtin-html"[\s\S]*?<\/symbol>/)?.[0];
if (!htmlIcon) throw new Error("The official T3 HTML icon symbol is missing");
const phases = ["before", "menu", "snooze", "after"];
const states = await Promise.all(["dark", "light"].map(async (variant) => Promise.all(phases.map(async (phase) => {
  let html = await readFile(resolve(source, `thread-actions-${variant}-${phase}.html`), "utf8");
  if (phase === "before") html = html.replaceAll('data-message-role="user"', 'data-message-role="user" data-t3-native-hover');
  html = html.replace(/(<span[^>]*class="[^"]*\[text-box:trim-both_cap_alphabetic\][^"]*")/g, "$1 data-layout-ignore");
  if (phase === "menu" || phase === "snooze") html = html.replace("<main ", "<main data-layout-ignore ");
  return html;
}))));
const portals = await Promise.all(["dark", "light"].map(async (variant) => Promise.all(["menu", "snooze"].map(async (phase) => {
  const html = await readFile(resolve(source, `thread-actions-${variant}-${phase}-portal.html`), "utf8");
  return html.replaceAll('<div class="dropdown-glass', '<div data-layout-ignore class="dropdown-glass');
}))));

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["projectAvatar", "Project avatar letters", "HE"],
  ["branchName", "Branch name", "main"],
  ["activeBranch", "Active worktree branch", "feature/logo-enter"],
  ["thirdBranch", "Third thread branch", "logo/assemble"],
  ["fourthBranch", "Fourth thread branch", "logo/hold-final"],
  ["threadOne", "Selected thread", "Build a logo intro"],
  ["threadTwo", "Pinned thread", "Catalog motion audit"],
  ["threadThree", "Sidebar thread 3", "Grouped logo tests"],
  ["threadFour", "Sidebar thread 4", "Review final hold"],
  ["threadFive", "Sidebar thread 5", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ...["12h", "10h", "17h", "1d", "2d"].map((age, index) => [`thread${index + 1}Age`, `Thread ${index + 1} age`, age]),
  ["settledAge", "Settled thread age", "7h"],
  ["userMessage", "User message", "Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames."],
  ["workedDuration", "Work duration", "Worked for 2m"],
  ["replyLead", "Reply before file", "I found the Logo Enter timing in"],
  ["replyFile", "Reply file", "logo-enter.html"],
  ["replyFilePath", "Reply file path", "registry/blocks/logo-enter/logo-enter.html"],
  ["replyTail", "Reply after file", ". The final pass can extend the duration while keeping the last rendered frame still."],
  ["userMessageTime", "User message time", "yesterday at 9:22 PM"],
  ["replyTime", "Reply time", "yesterday at 9:24 PM"],
  ["composerPlaceholder", "Composer placeholder", "Enable a provider in Settings to send a message"],
  ["providerStatus", "Provider status", "Open provider settings"],
  ["workspaceMode", "Workspace", "Worktree"],
  ...fixture.menuLabels.map((value, index) => [`menuItem${index + 1}`, `Menu action ${index + 1}`, value]),
  ...fixture.snoozeLabels.map((value, index) => [`snoozePreset${index + 1}`, `Snooze option ${index + 1}`, value]),
];
const variables = [
  { id: "theme", type: "string", label: "Theme", default: "dark", options: ["dark", "light"] },
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "openFrame", type: "number", label: "Open actions at frame", default: fixture.events.open, min: 0, max: 100, step: 1 },
  { id: "submenuFrame", type: "number", label: "Open Snooze at frame", default: fixture.events.submenu, min: 1, max: 110, step: 1 },
  { id: "closeFrame", type: "number", label: "Close actions at frame", default: fixture.events.close, min: 1, max: 120, step: 1 },
];
const defaults = Object.fromEntries(variables.map(({ id, default: value }) => [id, value]));
const textReplacements = Object.fromEntries(fields
  .filter(([id]) => !id.endsWith("Age") && id !== "replyFilePath")
  .map(([id, , value]) => [value, id]));
const fontThemes = themes.map((theme) => Object.fromEntries(Object.entries(theme).filter(([key]) =>
  key.includes("font-family") || key === "--font-sans" || key === "--font-mono")));
const stageThemes = themes.map((theme) => Object.entries(theme).map(([key, value]) => `${key}:${value};`).join(""));
const nativeTransitions = [fixture, lightFixture].map(({ transitions }) => transitions);
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
  .t3-stage { position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--background); color: var(--foreground); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
  /* Preserve native T3 typography when HyperFrames compiles the block. */
  .t3-stage, .t3-stage *:not([text-rendering]) { text-rendering: auto; }
  /* Native Submit buttons must not animate inherited clip visibility. */
  .t3-stage button[type="submit"].transition-all { transition-property: background-color, color, box-shadow, transform, scale, opacity; }
  .t3-stage[hidden] { display: none !important; }
  .t3-state[hidden] { display: none !important; }
  .t3-state:not([hidden]) { display: contents; }
  .t3-stage [data-t3-native-hover] .opacity-0.transition-opacity { opacity: 1; }
  .t3-stage * { transition: none; }
  .base-ui-disable-scrollbar { scrollbar-width: none; }
  .base-ui-disable-scrollbar::-webkit-scrollbar { display: none; }
  @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
  @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
  @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
  @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"); }
${nativeT3MonoFaces}
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
<svg data-layout-ignore aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden">${htmlIcon}</svg>
  <div class="dark t3-stage" style='${escapeAttribute(stageThemes[0])}'>
    <div class="t3-state" data-t3-state="before">${states[0][0]}</div>
    <div class="t3-state" data-t3-state="menu" data-layout-ignore hidden>${states[0][1]}${portals[0][0]}</div>
    <div class="t3-state" data-t3-state="snooze" data-layout-ignore hidden>${states[0][2]}${portals[0][1]}</div>
    <div class="t3-state" data-t3-state="after" hidden>${states[0][3]}</div>
  </div>
  <div class="light t3-stage" style='${escapeAttribute(stageThemes[1])}' hidden>
    <div class="t3-state" data-t3-state="before">${states[1][0]}</div>
    <div class="t3-state" data-t3-state="menu" data-layout-ignore hidden>${states[1][1]}${portals[1][0]}</div>
    <div class="t3-state" data-t3-state="snooze" data-layout-ignore hidden>${states[1][2]}${portals[1][1]}</div>
    <div class="t3-state" data-t3-state="after" hidden>${states[1][3]}</div>
  </div>
</div>
<script src="t3-code-gsap.min.js"></script>
<script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
if (options.branchName !== defaults.branchName && options.menuItem1 === defaults.menuItem1) {
  options.menuItem1 = 'New thread on ' + options.branchName;
}
const stages = [...document.querySelectorAll('#root .t3-stage')];
for (const [index, stage] of stages.entries()) {
  for (const [key, value] of Object.entries(${scriptJson(fontThemes)}[index])) stage.style.setProperty(key, value);
  stage.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
}
const replacements = ${scriptJson(textReplacements)};
const walker = document.createTreeWalker(document.querySelector('#root'), NodeFilter.SHOW_TEXT);
let node;
while ((node = walker.nextNode())) {
  const current = node.textContent.trim();
  const key = replacements[current];
  if (key && options[key] !== defaults[key]) node.textContent = node.textContent.replace(current, String(options[key]));
}
const sections = stages.map((stage) => [...stage.querySelectorAll('[data-t3-state]')]);
const rowMotion = sections.map((variant) => [variant[1], variant[2]].map((section) => {
  const row = [...section.querySelectorAll('[data-testid="sidebar-row-card"]')]
    .find((element) => element.textContent.includes(options.threadOne));
  if (!row) throw new Error('Selected sidebar row missing');
  const descendants = [...row.querySelectorAll('*')];
  const age = descendants.find((element) => element.className?.startsWith?.('pointer-events-none group-has-[:focus-visible]/sidebar-status-slot'));
  const actions = descendants.find((element) => element.className?.startsWith?.('pointer-events-none absolute inset-y-0 right-0 flex items-stretch opacity-0 transition-opacity'));
  if (!age || !actions) throw new Error('Native sidebar hover controls missing');
  age.style.transition = 'none';
  actions.style.transition = 'none';
  return { age, actions };
}));
const transitions = ${scriptJson(nativeTransitions)};
const snoozeTriggers = sections.map(variant => {
  const snooze = [...variant[2].querySelectorAll('.dropdown-glass[data-level="0"] button')]
    .find(element => element.textContent.trim() === options.menuItem4);
  if (!snooze) throw new Error('Snooze menu trigger missing');
  return snooze;
});
const ageKeys = ['thread1Age', 'thread2Age', 'thread3Age', 'thread4Age', 'thread5Age'];
for (const section of sections.flat()) {
  section.querySelectorAll('[data-testid="sidebar-row-card"]').forEach((row, index) => {
    const age = row.querySelector('span.tabular-nums.text-secondary-label');
    if (age && ageKeys[index]) age.textContent = options[ageKeys[index]];
  });
  const settledAge = section.querySelector('[data-testid="sidebar-row-slim"] .text-xs');
  if (settledAge) settledAge.textContent = options.settledAge;
  for (const editor of section.querySelectorAll('[data-testid="composer-editor"]')) {
    editor.setAttribute('aria-placeholder', options.composerPlaceholder);
  }
  for (const link of section.querySelectorAll('a[href*="registry/blocks/logo-enter/logo-enter.html"]')) {
    if (options.replyFilePath !== defaults.replyFilePath) link.setAttribute('href', String(options.replyFilePath));
  }
  for (const element of section.querySelectorAll('[aria-label]')) {
    const label = element.getAttribute('aria-label');
    if (label === 'Thread actions for ' + defaults.threadOne) {
      element.setAttribute('aria-label', 'Thread actions for ' + options.threadOne);
    }
    if (label === 'New thread in ' + defaults.projectName) {
      element.setAttribute('aria-label', 'New thread in ' + options.projectName);
    }
    if (label?.startsWith('Worktree:') && options.branchName !== defaults.branchName) {
      element.setAttribute('aria-label', label.replace('(' + defaults.branchName + ')', '(' + options.branchName + ')'));
    }
  }
}
const clock = { frame: 0 };
const effects = new Map();
const propertyOf = record => Object.keys(record.keyframes[0]).find(key => !['offset', 'computedOffset', 'easing', 'composite'].includes(key));
const cssProperty = property => property.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase());
function seekSourceEffects(records, frame, start) {
  const grouped = new Map();
  for (const { target, record } of records) {
    if (!grouped.has(target)) grouped.set(target, []);
    grouped.get(target).push(record);
  }
  const ready = [];
  for (const [target, motions] of grouped) {
    const finishFrame = start + (motions.some(motion => motion.sourceUserOpacity) ? 6 : 5);
    let animations = effects.get(target);
    if (animations && frame < finishFrame && animations.some(animation => animation.playState === 'idle')) animations = undefined;
    if (!animations) {
      target.style.transitionProperty = 'none';
      for (const motion of motions) target.style[propertyOf(motion)] = motion.keyframes[0][propertyOf(motion)];
      getComputedStyle(target).opacity;
      target.style.transitionProperty = motions.map(motion => cssProperty(propertyOf(motion))).join(',');
      target.style.transitionDuration = motions.map(motion => motion.durationMs + 'ms').join(',');
      target.style.transitionTimingFunction = motions.map(motion => motion.easing).join(',');
      for (const motion of motions) target.style[propertyOf(motion)] = motion.keyframes.at(-1)[propertyOf(motion)];
      getComputedStyle(target).opacity;
      animations = target.getAnimations().filter(animation => animation instanceof CSSTransition && motions.some(motion => cssProperty(propertyOf(motion)) === animation.transitionProperty));
      if (animations.length !== motions.length) throw new Error('Native Thread Actions CSS transition did not start');
      for (const animation of animations) animation.pause();
      effects.set(target, animations);
    }
    for (const animation of animations) {
      if (frame >= finishFrame) animation.cancel();
      else {
        animation.pause();
        animation.currentTime = Math.max(0, (frame - start) * 1000 / 30);
        ready.push(animation.ready);
      }
    }
  }
  return ready;
}
function draw() {
  const frame = Math.round(clock.frame);
  const openFrame = Number(options.openFrame);
  const submenuFrame = Math.max(Number(options.submenuFrame), openFrame + 1);
  const closeFrame = Math.max(Number(options.closeFrame), submenuFrame + 1);
  const phase = frame < openFrame ? 0 : frame < submenuFrame ? 1 : frame < closeFrame ? 2 : 3;
  for (const [index, stage] of stages.entries()) stage.hidden = (index === 1) !== (options.theme === 'light');
  for (const variant of sections) for (let index = 0; index < variant.length; index++) variant[index].hidden = index !== phase;
  const themeIndex = options.theme === 'light' ? 1 : 0;
  const visible = sections[themeIndex][phase];
  for (const [target, animations] of effects) {
    if (visible.contains(target)) continue;
    for (const animation of animations) animation.cancel();
    effects.delete(target);
  }
  const ready = [];
  if (phase === 1 || phase === 2) {
    const row = rowMotion[themeIndex][phase - 1];
    row.age.style.position = phase === 1 ? 'absolute' : 'static';
    row.age.style.right = '0';
    row.actions.style.position = phase === 1 ? 'static' : 'absolute';
    const event = phase === 1 ? 'open' : 'submenu';
    const start = phase === 1 ? openFrame : submenuFrame;
    const source = transitions[themeIndex][event];
    ready.push(...seekSourceEffects(source.map(record => ({ record, target: record.label === 'Snooze' ? snoozeTriggers[themeIndex] : record.target.startsWith('pointer-events-none group-has-') ? row.age : row.actions })), frame, start));
    if (phase === 1) {
      const messages = [...visible.querySelectorAll('[data-message-role="user"] .opacity-0.transition-opacity')];
      ready.push(...seekSourceEffects(messages.map(target => ({ target, record: { sourceUserOpacity: true, durationMs: 200, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', keyframes: [{ opacity: '1' }, { opacity: '0' }] } })), frame, openFrame));
    }
  }
  const pending = Promise.all(ready);
  window.__hyfrmeReady = pending;
  return pending;
}
draw();
const timeline = gsap.timeline({ paused: true });
timeline.to(clock, { frame: 120, duration: 4, ease: 'none', onUpdate: draw });
window.__timelines['${name}'] = timeline;
window.addEventListener('hf-seek', event => {
  const pending = Promise.resolve().then(draw);
  window.__hyfrmeReady = pending;
  event.detail?.waitUntil?.(pending);
});
</script>
</template>
</body>
</html>
`;

await mkdir(resolve(output, "licenses"), { recursive: true });
await writeFile(resolve(output, `${name}.html`), html);
await writeFile(resolve(output, "t3-code-gsap.min.js"), gsap);
await copyFile(resolve(root, "parity/t3-gallery/assets/T3-CODE-LICENSE.txt"), resolve(output, "licenses/T3-CODE-LICENSE.txt"));
await copyFile(resolve(root, "registry/blocks/t3-thread-pin/licenses/T3-THIRD_PARTY_NOTICES.md"), resolve(output, "licenses/T3-THIRD_PARTY_NOTICES.md"));
await writeFile(resolve(output, "registry-item.json"), `${JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: Thread Actions",
  description: "Open T3 Code v0.0.42's sidebar row menu, reveal Snooze choices, and close it in a seeded local Hyfrme workspace.",
  tags: ["composition", "app-ui", "t3-code", "thread-actions", "hyfrme-port"],
  author: "Hyfrme", authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT",
  dimensions: fixture.viewport, duration: fixture.frames / fixture.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    { path: "licenses/T3-CODE-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt", type: "hyperframes:asset" },
    { path: "licenses/T3-THIRD_PARTY_NOTICES.md", target: "THIRD_PARTY_LICENSES/t3-code/T3-THIRD_PARTY_NOTICES.md", type: "hyperframes:asset" },
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2)}\n`);
await writeFile(resolve(output, "README.md"), `# T3 Code: Thread Actions

This four-second, 1200 × 659 block reproduces T3 Code v${fixture.sourceTag.slice(1)} at 30 fps in desktop dark and light themes. Right-clicking the selected thread's sidebar row opens its native action menu beside that row, then hovering Snooze reveals its submenu. The project and conversation are seeded local Hyfrme data; the menu interactions are live captures of the official app. The user metadata uses its source 200ms opacity transition. The pointer starts over the user message and leaves at the right-click event. Sidebar controls and Snooze hover use the recorded native CSS property transitions, paused and sought with the source clock; the capture cancels them five frames after each event.

Customize theme, project, selected thread, conversation, sidebar, footer, menu copy, and opening, submenu, and closing frames through HyperFrames variables. Match project, branch, and thread values with adjacent T3 Code blocks for continuity. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. The installed files include T3 Code's MIT license and third-party icon notice. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.
`);
console.log(`Generated ${name} from four native T3 Code states and their menu portals.`);
