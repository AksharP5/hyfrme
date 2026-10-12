import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { nativeT3MonoFaces } from "./t3-native-fonts.mjs";

const root = resolve(import.meta.dirname, "..");
const source = resolve(
  process.env.T3_SOURCE_DIR ?? resolve(root, "assets/t3-code/v0.0.42"),
);
const name = "t3-settle-thread";
const output = resolve(
  process.env.T3_BLOCK_DIR ??
    resolve(root, ".work/t3-settle-thread-v0042-candidate"),
);
const fixtures = await Promise.all(
  ["dark", "light"].map(async (theme) =>
    JSON.parse(
      await readFile(
        resolve(source, `settle-thread-${theme}-fixture.json`),
        "utf8",
      ),
    ),
  ),
);
if (JSON.stringify(fixtures[0].events) !== JSON.stringify(fixtures[1].events))
  throw new Error("Native theme timing differs");
const themes = await Promise.all(
  ["dark-theme.json", "light-theme.json"].map(async (file) =>
    JSON.parse(await readFile(resolve(source, file), "utf8")),
  ),
);
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(
  resolve(root, "registry/blocks/before-after/gsap.min.js"),
  "utf8",
);
const pierreIcons = await readFile(
  resolve(
    root,
    ".work/t3-v0042-bin/t3-0.0.42-linux-x64/client/assets/pierre-icons-vHQ4qnbe.js",
  ),
  "utf8",
);
const htmlIcon = pierreIcons.match(
  /<symbol id="file-tree-builtin-html"[\s\S]*?<\/symbol>/,
)?.[0];
if (!htmlIcon) throw new Error("Official T3 HTML file icon is missing");
const phases = [
  "before",
  "hover",
  "details",
  "tooltip",
  "settling",
  "settled",
  "expanded",
  "collapsed",
  "collapsed-done",
];
const states = await Promise.all(
  ["dark", "light"].map(async (theme) =>
    Promise.all(
      phases.map(async (phase) => {
        const html = await readFile(
          resolve(source, `settle-thread-${theme}-${phase}.html`),
          "utf8",
        );
        const hovered = [
          "before",
          "settled",
          "expanded",
          "collapsed",
          "collapsed-done",
        ].includes(phase)
          ? html.replaceAll(
              'data-message-role="user"',
              'data-message-role="user" data-t3-native-hover',
            )
          : html;
        const controls =
          phase === "tooltip"
            ? hovered.replaceAll(
                'aria-label="Settle thread"',
                'aria-label="Settle thread" data-t3-native-control-hover',
              )
            : hovered;
        return controls.replace(
          /(<span[^>]*class="[^"]*\[text-box:trim-both_cap_alphabetic\][^"]*")/g,
          "$1 data-layout-ignore",
        );
      }),
    ),
  ),
);
const portals = await Promise.all(
  ["dark", "light"].map(async (theme) =>
    Promise.all(
      phases.map(async (phase) =>
        (
          await readFile(
            resolve(source, `settle-thread-${theme}-${phase}-portal.html`),
            "utf8",
          )
        ).replace(
          'data-slot="tooltip-positioner"',
          'data-slot="tooltip-positioner" data-layout-ignore',
        ),
      ),
    ),
  ),
);
const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["projectAvatar", "Project avatar", "HE"],
  ["branchName", "Branch name", "main"],
  ["activeBranch", "Active worktree branch", "feature/logo-enter"],
  ["nextBranch", "Next thread branch", "logo/assemble"],
  ["fourthBranch", "Fourth thread branch", "logo/hold-final"],
  ["threadOne", "First active thread", "Catalog motion audit"],
  ["settledThread", "Thread to settle", "Build a logo intro"],
  ["nextThread", "Next active thread", "Grouped logo tests"],
  ["threadFour", "Fourth active thread", "Review final hold"],
  ["threadFive", "Fifth active thread", "Search reveal timing"],
  [
    "previousSettledThread",
    "Previous settled thread",
    "Verify Logo Enter parity",
  ],
  ["threadOneAge", "First thread age", "12h"],
  ["settledThreadAge", "Thread to settle age", "10h"],
  ["nextThreadAge", "Next thread age", "17h"],
  ["threadFourAge", "Fourth thread age", "1d"],
  ["threadFiveAge", "Fifth thread age", "2d"],
  ["newlySettledAge", "Newly settled age", "now"],
  ["previousSettledAge", "Previous settled age", "9h"],
  ["settleAction", "Settle action", "Settle"],
  ["settleTooltip", "Settle tooltip", "Settle thread"],
  [
    "userMessage",
    "Thread user message",
    "Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames.",
  ],
  ["workedDuration", "Work duration", "Worked for 2m"],
  ["replyLead", "Reply before file", "I found the Logo Enter timing in"],
  ["replyFile", "Reply file", "logo-enter.html"],
  [
    "replyFilePath",
    "Reply file path",
    "registry/blocks/logo-enter/logo-enter.html",
  ],
  [
    "replyTail",
    "Reply after file",
    ". The final pass can extend the duration while keeping the last rendered frame still.",
  ],
  [
    "nextUserMessage",
    "Next thread user message",
    "Gather the source marks into a Hyfrme logo lockup.",
  ],
  [
    "nextReply",
    "Next thread reply",
    "The marks should arrive separately, align on the same baseline, and resolve into the Hyfrme wordmark. Keep the source credit visible at the final hold.",
  ],
  [
    "composerPlaceholder",
    "Composer placeholder",
    "Enable a provider in Settings to send a message",
  ],
  ["providerStatus", "Provider status", "Open provider settings"],
  ["workspaceMode", "Workspace", "Worktree"],
];
const variables = [
  {
    id: "theme",
    type: "string",
    label: "Theme",
    default: "dark",
    options: ["dark", "light"],
  },
  ...fields.map(([id, label, value]) => ({
    id,
    type: "string",
    label,
    default: value,
  })),
  {
    id: "settledCount",
    type: "number",
    label: "Settled count after action",
    default: 2,
    min: 1,
    max: 99,
    step: 1,
  },
  ...Object.entries(fixtures[0].events).map(([key, value]) => ({
    id: `${key}Frame`,
    type: "number",
    label: `${key[0].toUpperCase()}${key.slice(1)} at frame`,
    default: value,
    min: 0,
    max: 110,
    step: 1,
  })),
];
const defaults = Object.fromEntries(
  variables.map(({ id, default: value }) => [id, value]),
);
const textReplacements = Object.fromEntries(
  fields
    .filter(([id]) => !id.endsWith("Age") && id !== "replyFilePath")
    .map(([id, , value]) => [value, id]),
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
const nativeTransitions = fixtures.map(({ transitions }) => transitions);
const completionOffsets = fixtures.map(
  (fixture) => fixture.completionEvents?.settle - fixture.events.settle,
);
if (
  completionOffsets.some((offset) => !Number.isInteger(offset) || offset <= 0)
)
  throw Error("Native Settle completion event is missing");
for (const native of nativeTransitions) {
  const userMotion = native.hover.filter((record) => record.sourceUserOpacity);
  if (
    userMotion.length !== 1 ||
    userMotion[0].keyframes[0].opacity !== "1" ||
    userMotion[0].keyframes.at(-1).opacity !== "0"
  ) {
    throw new Error(
      "Measured native user-metadata hover transition is missing; recapture the deterministic fixture first",
    );
  }
}
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
  .t3-stage { position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--background); color: var(--foreground); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
  /* Preserve native T3 typography when HyperFrames compiles the block. */
  .t3-stage, .t3-stage *:not([text-rendering]) { text-rendering: auto; }
  /* Native Submit buttons must not animate inherited clip visibility. */
  .t3-stage button[type="submit"].transition-all { transition-property: background-color, color, box-shadow, transform, scale, opacity; }
  .t3-stage[hidden], .t3-state[hidden] { display: none !important; }
  .t3-state:not([hidden]) { display: contents; }
  .t3-stage * { transition: none; }
  .t3-stage [data-t3-native-hover] .opacity-0.transition-opacity { opacity: 1; }
  .t3-stage [data-t3-native-control-hover] { color: var(--foreground); }
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
${states
  .map(
    (
      variant,
      themeIndex,
    ) => `  <div class="${themeIndex ? "light" : "dark"} t3-stage" style='${escapeAttribute(stageThemes[themeIndex])}'${themeIndex ? " hidden" : ""}>
${variant.map((state, phaseIndex) => `    <div class="t3-state" data-t3-state="${phases[phaseIndex]}"${phaseIndex ? " hidden" : ""}>${state}${portals[themeIndex][phaseIndex]}</div>`).join("\n")}
  </div>`,
  )
  .join("\n")}
</div>
<script src="t3-code-gsap.min.js"></script>
<script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
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
for (const [themeIndex, variant] of sections.entries()) {
  for (const [phaseIndex, section] of variant.entries()) {
    const after = phaseIndex >= 4;
    const ageKeys = after
      ? ['threadOneAge', 'nextThreadAge', 'threadFourAge', 'threadFiveAge']
      : ['threadOneAge', 'settledThreadAge', 'nextThreadAge', 'threadFourAge', 'threadFiveAge'];
    for (const [index, row] of [...section.querySelectorAll('[data-testid="sidebar-row-card"]')].entries()) {
      const age = row.querySelector('span.tabular-nums.text-secondary-label');
      if (age) age.textContent = String(options[ageKeys[index]]);
    }
    for (const [index, row] of [...section.querySelectorAll('[data-testid="sidebar-row-slim"]')].entries()) {
      const age = row.querySelector('span.text-xs');
      if (age) age.textContent = String(options[index ? 'previousSettledAge' : 'newlySettledAge']);
    }
    const shelf = section.querySelector('[data-testid="sidebar-settled-shelf-toggle"] span');
    if (shelf && shelf.textContent.includes('(')) shelf.textContent = 'Settled (' + Math.max(0, Math.round(Number(options.settledCount)) - (after ? 0 : 1)) + ')';
    for (const editor of section.querySelectorAll('[data-testid="composer-editor"]')) editor.setAttribute('aria-placeholder', String(options.composerPlaceholder));
    for (const link of section.querySelectorAll('a[href*="registry/blocks/logo-enter/logo-enter.html"]')) {
      if (options.replyFilePath !== defaults.replyFilePath) link.setAttribute('href', String(options.replyFilePath));
    }
    for (const element of section.querySelectorAll('[aria-label]')) {
      const label = element.getAttribute('aria-label');
      if (label?.startsWith('Thread actions for ')) {
        for (const id of ['threadOne', 'settledThread', 'nextThread', 'threadFour', 'threadFive'])
          if (label.endsWith(defaults[id])) element.setAttribute('aria-label', 'Thread actions for ' + options[id]);
      }
      if (label === 'New thread in ' + defaults.projectName) element.setAttribute('aria-label', 'New thread in ' + options.projectName);
    }
  }
}
const native = ${scriptJson(nativeTransitions)};
const findStatus = (section, title) => {
  const row = [...section.querySelectorAll('[data-testid="sidebar-row-card"]')].find((element) => element.textContent.includes(title));
  const descendants = row ? [...row.querySelectorAll('*')] : [];
  const age = descendants.find((element) => element.className?.startsWith?.('pointer-events-none group-has-[:focus-visible]/sidebar-status-slot'));
  const actions = descendants.find((element) => element.className?.startsWith?.('pointer-events-none absolute inset-y-0 right-0 flex items-stretch opacity-0 transition-opacity'));
  if (!age || !actions) throw new Error('Native Settle row controls missing');
  age.style.transition = 'none';
  actions.style.transition = 'none';
  return { age, actions };
};
const status = sections.map((variant) => ({
  hovered: [1, 2, 3].map((index) => findStatus(variant[index], options.settledThread)),
}));
const animations = sections.map((variant, themeIndex) => {
  const controls = {};
  for (const event of ['details', 'tooltip', 'settle', 'settleCompletion', 'expand', 'collapse']) {
    const phase = event === 'settle' || event === 'settleCompletion' ? 4 : event === 'expand' ? 6 : event === 'collapse' ? 7 : event === 'details' ? 2 : 3;
    const section = variant[phase];
    const list = section.querySelector('ul[role="list"].relative');
    const shelf = section.querySelector('[data-testid="sidebar-settled-shelf-toggle"]');
    controls[event] = native[themeIndex][event].filter((record) => event === 'settleCompletion' || record.listChildIndex !== null || record.sidebarChildIndex !== null || record.target?.startsWith('lucide lucide-chevron-down') || record.slot || record.sourceComposer || record.sourceUserOpacity).map((record) => {
      const target = record.listChildIndex !== null ? list?.children[record.listChildIndex]
        : record.sidebarChildIndex !== null ? [...(list?.children[record.sidebarChildIndex]?.querySelectorAll('*') ?? [])].find(target => target.getAttribute('class')?.slice(0, 140) === record.target)
          : record.slot ? section.querySelector('[data-slot="' + record.slot + '"]')
            : record.sourceUserOpacity ? [...section.querySelectorAll('[data-message-role="user"] .opacity-0.transition-opacity')].find(target => target.getAttribute('class')?.slice(0, 140) === record.target)
              : record.sourceComposer ? section.querySelector('[data-chat-composer-main-surface]') : shelf?.querySelector('.lucide-chevron-down');
      if (!target) throw new Error('Native sidebar motion target missing');
      return { target, record };
    });
  }
  return controls;
});
const clock = { frame: 0 };
const effects = new Map();
const propertyOf = record => Object.keys(record.keyframes[0]).find(key => !['offset', 'computedOffset', 'easing', 'composite'].includes(key));
const cssPropertyOf = record => propertyOf(record).replace(/[A-Z]/g, letter => '-' + letter.toLowerCase());
function seekSourceEffects(records, frame, start) {
  const grouped = new Map();
  for (const { target, record } of records) {
    if (!grouped.has(target)) grouped.set(target, []);
    grouped.get(target).push(record);
  }
  const ready = [];
  for (const [target, motions] of grouped) {
    const finishFrame = start + Math.ceil(Math.max(...motions.map(motion => motion.durationMs)) * 30 / 1000);
    const css = motions[0].listChildIndex === null;
    // The native FLIP list removes only departing inert clones on animation finish.
    const departing = !css && target.getAttribute('aria-hidden') === 'true' && target.hasAttribute('inert') && motions.some(motion => propertyOf(motion) === 'opacity' && motion.keyframes.at(-1).opacity === '0');
    if (departing) target.hidden = frame >= finishFrame;
    let effect = effects.get(target);
    if (effect?.css && frame < finishFrame && effect.animations.some(animation => animation.playState === 'idle')) {
      effects.delete(target);
      effect = undefined;
    }
    if (!effect) {
      let animations;
      if (css) {
        target.style.transitionProperty = 'none';
        for (const motion of motions) target.style[propertyOf(motion)] = motion.keyframes[0][propertyOf(motion)];
        getComputedStyle(target).opacity;
        target.style.transitionProperty = motions.map(cssPropertyOf).join(',');
        target.style.transitionDuration = motions.map(motion => motion.durationMs + 'ms').join(',');
        target.style.transitionTimingFunction = motions.map(motion => motion.easing).join(',');
        for (const motion of motions) target.style[propertyOf(motion)] = motion.keyframes.at(-1)[propertyOf(motion)];
        getComputedStyle(target).opacity;
        animations = target.getAnimations().filter(animation => animation instanceof CSSTransition && motions.some(motion => cssPropertyOf(motion) === animation.transitionProperty));
        if (animations.length !== motions.length) throw new Error('Native Settle CSS transition did not start');
      } else {
        animations = motions.map(motion => new Animation(new KeyframeEffect(target, motion.keyframes, { duration: motion.durationMs, easing: motion.easing }), document.timeline));
      }
      for (const animation of animations) animation.pause();
      effect = { animations, css };
      effects.set(target, effect);
    }
    for (const animation of effect.animations) {
      const motion = css ? motions.find(record => cssPropertyOf(record) === animation.transitionProperty) : motions[effect.animations.indexOf(animation)];
      if (frame >= finishFrame) {
        if (css) animation.cancel(); else animation.finish();
      } else {
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
  const hover = Number(options.hoverFrame);
  const details = Math.max(Number(options.detailsFrame), hover + 1);
  const tooltip = Math.max(Number(options.tooltipFrame), details + 1);
  const settle = Math.max(Number(options.settleFrame), tooltip + 1);
  const expand = Math.max(Number(options.expandFrame), settle + 7);
  const collapse = Math.max(Number(options.collapseFrame), expand + 6);
  const phase = frame < hover ? 0 : frame < details ? 1 : frame < tooltip ? 2 : frame < settle ? 3
    : frame < settle + 6 ? 4 : frame < expand ? 5 : frame < collapse ? 6
    : frame < collapse + 6 ? 7 : 8;
  for (const [index, stage] of stages.entries()) stage.hidden = (index === 1) !== (options.theme === 'light');
  for (const variant of sections) for (let index = 0; index < variant.length; index++) variant[index].hidden = index !== phase;
  const ready = [];
  const visible = sections[options.theme === 'light' ? 1 : 0][phase];
  for (const [target, effect] of effects) {
    if (visible.contains(target)) continue;
    for (const animation of effect.animations) animation.cancel();
    effects.delete(target);
  }
  const themeIndex = options.theme === 'light' ? 1 : 0;
  const completion = settle + ${scriptJson(completionOffsets)}[themeIndex];
  if (phase >= 1 && phase <= 3) {
    const row = status[themeIndex].hovered[phase - 1];
    row.age.style.position = 'absolute';
    row.age.style.right = '0';
    row.actions.style.position = 'static';
    ready.push(...seekSourceEffects([
      { target: row.age, record: { ...native[themeIndex].hover[0], listChildIndex: null } },
      { target: row.actions, record: { ...native[themeIndex].hover[1], listChildIndex: null } },
    ], frame, hover));
  }
  for (const [event, start, eventPhase] of [['details', details, 2], ['tooltip', tooltip, 3], ['settle', settle, 4], ['expand', expand, 6], ['collapse', collapse, 7]]) {
    if (phase === eventPhase) ready.push(...seekSourceEffects(animations[themeIndex][event], frame, start));
  }
  if (phase === 4 && frame >= completion) {
    const row = findStatus(visible, options.nextThread);
    row.age.style.position = 'absolute';
    row.age.style.right = '0';
    row.actions.style.position = 'static';
    ready.push(...seekSourceEffects(animations[themeIndex].settleCompletion, frame, completion));
  }
  // The native pointer leaves the initial user message at the row-hover event.
  if (phase === 1 || phase === 2) {
    const messages = [...visible.querySelectorAll('[data-message-role="user"] .opacity-0.transition-opacity')];
    const record = native[themeIndex].hover.find(motion => motion.sourceUserOpacity);
    ready.push(...seekSourceEffects(messages.map(target => ({ target, record })), frame, hover));
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
  // The SDK seeks discovered WAAPI handles synchronously; restore the source clock after it.
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
  JSON.stringify(
    {
      $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
      name,
      type: "hyperframes:block",
      title: "T3 Code: Settle a Thread",
      description:
        "Settle a selected T3 Code v0.0.42 thread, then open and close its persisted Settled shelf in a seeded Hyfrme workspace.",
      tags: [
        "composition",
        "app-ui",
        "t3-code",
        "settle-thread",
        "hyfrme-port",
      ],
      author: "Hyfrme",
      authorUrl: "https://github.com/AksharP5/hyfrme",
      license: "MIT",
      dimensions: fixtures[0].viewport,
      duration: fixtures[0].frames / fixtures[0].fps,
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
  ) + "\n",
);
await writeFile(
  resolve(output, "README.md"),
  `# T3 Code: Settle a Thread

This four-second block reproduces the official T3 Code v${fixtures[0].sourceTag.slice(1)} sidebar Settle action in desktop dark and light themes at 1200 × 659 and 30 fps. The selected thread leaves the active cards, navigation advances to the next card, and the Settled shelf expands and collapses. A native reload check confirms the settled thread persists.

The local Hyfrme project and conversation are seeded, and no provider is configured. Project, conversation, thread titles, sidebar ages, theme, settled count, and interaction timing are HyperFrames variables. Captured sidebar list keyframes run through browser Animation and KeyframeEffect handles owned by the source frame clock; controls, tooltip, and shelf chevron use the recorded CSS transitions. The user metadata uses its source 200ms opacity transition. The pointer starts over the user message, leaves at the row-hover event, and returns after settling. Match these inputs across adjacent T3 Code blocks for seamless clips. Source: https://github.com/pingdotgg/t3code/tree/${fixtures[0].sourceCommit}. The installed files include T3 Code's MIT license and third-party icon notice. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.
`,
);
console.log(`Generated ${name} from native v0.0.42 dark/light Settle states.`);
