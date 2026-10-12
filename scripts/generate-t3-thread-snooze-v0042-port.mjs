import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { nativeT3MonoFaces } from "./t3-native-fonts.mjs";
import { assertCapturedSnoozeSourceEffects } from "./t3-snooze-source-contracts.mjs";

const root = resolve(import.meta.dirname, "..");
const source = resolve(
  process.env.T3_SOURCE_DIR ?? resolve(root, "assets/t3-code/v0.0.42"),
);
const name = "t3-thread-snooze";
const output = resolve(
  process.env.T3_BLOCK_DIR ??
    resolve(root, ".work/t3-thread-snooze-v0042-candidate"),
);
const fixtures = await Promise.all(
  ["dark", "light"].map(async (theme) =>
    JSON.parse(
      await readFile(
        resolve(source, `thread-snooze-${theme}-fixture.json`),
        "utf8",
      ),
    ),
  ),
);
if (JSON.stringify(fixtures[0].events) !== JSON.stringify(fixtures[1].events))
  throw new Error("Native theme timing differs");
const observed = JSON.parse(
  await readFile(
    new URL("./t3-snooze-observed-effects.json", import.meta.url),
    "utf8",
  ),
);
const capturedSourceEffects = fixtures.map((fixture) =>
  assertCapturedSnoozeSourceEffects(fixture, observed.themes[fixture.theme]),
);
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
  "menu",
  "submenu",
  "snoozing",
  "snoozed",
  "expanding",
  "expanded",
  "toast-closing",
  "toast-closed",
  "inline-banner",
];
const states = await Promise.all(
  ["dark", "light"].map(async (theme) =>
    Promise.all(
      phases.map(async (phase) => {
        const html = await readFile(
          resolve(source, `thread-snooze-${theme}-${phase}.html`),
          "utf8",
        );
        return html
          .replace(
            /(<span[^>]*class="[^"]*\[text-box:trim-both_cap_alphabetic\][^"]*")/g,
            "$1 data-layout-ignore",
          )
          .replace(
            /<span class="pointer-events-none absolute/g,
            '<span data-layout-allow-overflow class="pointer-events-none absolute',
          )
          .replace(/<span/g, (tag) =>
            phase === "menu" || phase === "submenu"
              ? "<span data-layout-allow-occlusion"
              : tag,
          )
          .replace(
            "<main ",
            `<main ${phase === "before" ? "" : "data-layout-ignore "}`,
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
            resolve(source, `thread-snooze-${theme}-${phase}-portal.html`),
            "utf8",
          )
        )
          .replaceAll(
            '<div class="dropdown-glass',
            '<div data-layout-ignore class="dropdown-glass',
          )
          .replace(
            'data-slot="toast-portal"',
            'data-slot="toast-portal" data-layout-ignore',
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
  ["snoozeThread", "Thread to snooze", "Build a logo intro"],
  ["nextThread", "Next active thread", "Grouped logo tests"],
  ["threadFour", "Fourth active thread", "Review final hold"],
  ["threadFive", "Fifth active thread", "Search reveal timing"],
  [
    "previousSettledThread",
    "Previous settled thread",
    "Verify Logo Enter parity",
  ],
  ["threadOneAge", "First thread age", "18h"],
  ["snoozeThreadAge", "Thread to snooze age", "16h"],
  ["nextThreadAge", "Next thread age", "23h"],
  ["threadFourAge", "Fourth thread age", "1d"],
  ["threadFiveAge", "Fifth thread age", "2d"],
  ["wakeCountdown", "Snoozed wake countdown", "3h"],
  ["snoozedCount", "Snoozed count", 1],
  [
    "userMessage",
    "Thread user message",
    "Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames.",
  ],
  ["messageTime", "Thread message time", "yesterday at 9:22 PM"],
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
  ["snoozeAction", "Snooze menu action", "Snooze"],
  ["snoozePreset", "Three-hour preset", "In 3 hours (5:00 PM)"],
  ["toastTitle", "Snooze confirmation", "Snoozed until 5:00 PM"],
  ["toastUndo", "Toast action", "Undo"],
  ["bannerTitle", "Inline banner title", "This thread is snoozed"],
  ["bannerDescription", "Inline banner description", "Send a message to wake"],
  ["bannerWake", "Inline banner action", "Wake now"],
];
const variables = [
  {
    id: "theme",
    type: "string",
    label: "Theme",
    default: "dark",
    options: ["dark", "light"],
  },
  ...fields
    .filter(([id]) => id !== "snoozedCount")
    .map(([id, label, value]) => ({
      id,
      type: "string",
      label,
      default: value,
    })),
  {
    id: "snoozedCount",
    type: "number",
    label: "Snoozed count",
    default: 1,
    min: 1,
    max: 99,
    step: 1,
  },
  ...Object.entries(fixtures[0].events)
    .filter(([key]) => !["postSnooze", "expanded", "toastClosed"].includes(key))
    .map(([key, value]) => ({
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
    .filter(
      ([id]) =>
        !id.endsWith("Age") && id !== "replyFilePath" && id !== "snoozedCount",
    )
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
const escapeAttribute = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const scriptJson = (value) => JSON.stringify(value).replaceAll("</", "<\\/");
const sourceRuntime = (
  await readFile(
    new URL("./t3-snooze-source-runtime.js", import.meta.url),
    "utf8",
  )
).replace("SOURCE_EFFECTS", scriptJson(capturedSourceEffects));

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
  .t3-stage *:not([data-t3-snooze-source-effect]) { transition: none !important; }
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
const timestampGroups = sections.map((variant) => variant.map((section) => {
  const groups = section.querySelectorAll('[data-message-role="user"] [class~="opacity-0"][class~="group-hover:opacity-100"]');
  if (groups.length > 1) throw new Error('Ambiguous native message metadata group');
  return groups[0] ?? null;
}));
for (const [themeIndex, variant] of sections.entries()) {
  for (const [phaseIndex, section] of variant.entries()) {
    const after = phaseIndex >= 3;
    const ageKeys = after
      ? ['threadOneAge', 'nextThreadAge', 'threadFourAge', 'threadFiveAge']
      : ['threadOneAge', 'snoozeThreadAge', 'nextThreadAge', 'threadFourAge', 'threadFiveAge'];
    for (const [index, row] of [...section.querySelectorAll('[data-testid="sidebar-row-card"]')].entries()) {
      const age = row.querySelector('span.tabular-nums.text-secondary-label');
      if (age) age.textContent = String(options[ageKeys[index]]);
      if ((phaseIndex === 1 || phaseIndex === 2) && row.textContent.includes(options.snoozeThread)) {
        const actions = row.querySelector('button[aria-label="Snooze thread"]')?.parentElement;
        const restingAge = actions?.previousElementSibling;
        if (actions) Object.assign(actions.style, { position: 'static', opacity: '1', pointerEvents: 'auto' });
        if (restingAge) Object.assign(restingAge.style, { position: 'absolute', right: '0', opacity: '0' });
      }
    }
    for (const row of section.querySelectorAll('[data-testid="sidebar-row-slim"]')) {
      const age = row.querySelector('span.text-xs');
      if (age && row.textContent.includes(options.snoozeThread)) age.textContent = String(options.wakeCountdown);
    }
    const shelf = section.querySelector('[data-testid="sidebar-snoozed-shelf-toggle"] span');
    if (shelf && shelf.textContent.includes('(')) shelf.textContent = 'Snoozed (' + Math.max(1, Math.round(Number(options.snoozedCount))) + ')';
    for (const editor of section.querySelectorAll('[data-testid="composer-editor"]')) editor.setAttribute('aria-placeholder', String(options.composerPlaceholder));
    for (const link of section.querySelectorAll('a[href*="registry/blocks/logo-enter/logo-enter.html"]')) {
      if (options.replyFilePath !== defaults.replyFilePath) link.setAttribute('href', String(options.replyFilePath));
    }
    for (const element of section.querySelectorAll('[aria-label]')) {
      const label = element.getAttribute('aria-label');
      if (label?.startsWith('Thread actions for ')) {
        for (const id of ['threadOne', 'snoozeThread', 'nextThread', 'threadFour', 'threadFive'])
          if (label.endsWith(defaults[id])) element.setAttribute('aria-label', 'Thread actions for ' + options[id]);
      }
      if (label === 'New thread in ' + defaults.projectName) element.setAttribute('aria-label', 'New thread in ' + options.projectName);
    }
  }
}
const native = ${scriptJson(nativeTransitions)};
const recordedEffects = sections.map((variant, themeIndex) => {
  const bind = (section, event, onlyToast = false) => native[themeIndex][event].filter(record => !onlyToast || record.target?.startsWith('dropdown-glass')).map(record => {
    const list = section.querySelector('ul[role="list"].relative');
    const shelf = section.querySelector('[data-testid="sidebar-snoozed-shelf-toggle"]');
    const snoozeRow = [...section.querySelectorAll('[data-testid="sidebar-row-card"], [data-testid="sidebar-row-slim"]')]
      .find(row => row.textContent.includes(options.snoozeThread));
    let target;
    if (record.listChildIndex !== null) target = list?.children[record.listChildIndex];
    else if (record.target?.startsWith('dropdown-glass')) target = section.querySelector('[data-slot="toast-portal"] .dropdown-glass');
    else if (record.target?.startsWith('lucide lucide-chevron-down')) target = shelf?.querySelector('.lucide-chevron-down');
    else if (event === 'closeToast') target = section.querySelector('button[data-slot="toast-close"]');
    else if (event === 'submenu' && record.target?.startsWith('flex w-full cursor-default')) target = section.querySelector('button[aria-haspopup="menu"][aria-expanded="true"]');
    else if (record.target?.startsWith('shrink-0 transition-opacity')) target = snoozeRow?.querySelector(':scope > span');
    else if (record.target?.startsWith('pointer-events-none absolute')) target = snoozeRow?.querySelector('button[aria-label="Snooze thread"], button[aria-label="Wake thread now"]')?.parentElement;
    else if (record.target?.startsWith('pointer-events-none group-has-') || record.target?.startsWith('inline-flex justify-end tabular-nums')) target = snoozeRow?.querySelector('span.tabular-nums.text-secondary-label');
    if (!target) throw new Error('Native Snooze effect target missing: ' + event + '/' + record.target);
    const animation = new Animation(new KeyframeEffect(target, record.keyframes, {
      duration: record.durationMs, easing: record.easing,
      ...(record.listChildIndex === null ? { fill:'backwards' } : {}),
    }), document.timeline);
    animation.pause();
    animation.currentTime = 0;
    return { target, record, animation };
  });
  return {
    menu: bind(variant[1], 'menu'),
    submenu: bind(variant[2], 'submenu'),
    snooze: bind(variant[3], 'snooze'),
    snoozeSettledToast: bind(variant[4], 'snooze', true),
    expand: bind(variant[5], 'expand'),
    closeToast: bind(variant[7], 'closeToast'),
    openThread: bind(variant[9], 'openThread'),
  };
});
const shelfRows = sections.map((variant) => [variant[5], variant[6]].map((section) => {
  const row = section.querySelector('[data-testid="sidebar-row-slim"]');
  if (!row) throw new Error('Native Snoozed shelf row missing');
  return {
    row, avatar: row.querySelector(':scope > span'), title: row.children[1],
    age: row.querySelector('span.tabular-nums.transition-opacity'),
    wake: row.querySelector('button[aria-label="Wake thread now"]'),
  };
}));
const clock = { frame: 0 };
${sourceRuntime}
const seekRecorded = (effects, frame, start) => {
  for (const { animation, record } of effects) {
    animation.pause();
    animation.currentTime = Math.max(0, (frame - start) * 1000 / 30);
    if (animation.currentTime > record.durationMs) animation.finish();
  }
};
function draw() {
  const frame = Math.round(clock.frame);
  const menu = Number(options.menuFrame);
  const submenu = Math.max(Number(options.submenuFrame), menu + 1);
  const snooze = Math.max(Number(options.snoozeFrame), submenu + 1);
  const expand = Math.max(Number(options.expandFrame), snooze + 7);
  const closeToast = Math.max(Number(options.closeToastFrame), expand + 7);
  const openThread = Math.max(Number(options.openThreadFrame), closeToast + 18);
  const phase = frame < menu ? 0 : frame < submenu ? 1 : frame < snooze ? 2
    : frame < snooze + 5 ? 3 : frame < expand ? 4
    : frame < expand + 5 ? 5 : frame < closeToast ? 6
    : frame < closeToast + 16 ? 7 : frame < openThread ? 8 : 9;
  for (const [index, stage] of stages.entries()) stage.hidden = (index === 1) !== (options.theme === 'light');
  for (const variant of sections) for (let index = 0; index < variant.length; index++) variant[index].hidden = index !== phase;
  for (const [themeIndex] of sections.entries()) {
    for (const [event, start] of [['menu', menu], ['submenu', submenu], ['snooze', snooze], ['expand', expand], ['closeToast', closeToast], ['openThread', openThread]]) {
      seekRecorded(recordedEffects[themeIndex][event], frame, start);
    }
    seekRecorded(recordedEffects[themeIndex].snoozeSettledToast, frame, snooze);
    for (const [index, { row, avatar, title, age, wake }] of shelfRows[themeIndex].entries()) {
      const hovered = index === 0 || frame < expand + 7;
      row.style.backgroundColor = hovered ? 'var(--sidebar-row-hover)' : '';
      row.style.color = hovered ? 'var(--sidebar-foreground)' : '';
      if (title) title.style.color = hovered ? 'var(--foreground)' : '';
      if (index === 0 || frame < expand + 7) {
        if (age) age.style.opacity = '0';
        if (wake) wake.style.opacity = '1';
        if (avatar) avatar.style.opacity = '1';
      }
      if (avatar) {
        avatar.style.filter = hovered ? 'none' : '';
      }
    }
  }
  window.__hyfrmeReady = seekSourceEffects(frame, phase, { menu, submenu, snooze, expand, closeToast, openThread });
}
draw();
window.addEventListener('hf-seek', (event) => event.detail?.waitUntil?.(window.__hyfrmeReady));
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
      title: "T3 Code: Snooze a Thread",
      description:
        "Snooze a selected T3 Code v0.0.42 thread through its native sidebar menu, close the confirmation, and reveal the Snoozed shelf and inline banner in a seeded Hyfrme workspace.",
      tags: [
        "composition",
        "app-ui",
        "t3-code",
        "thread-snooze",
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
  `# T3 Code: Snooze a Thread

This four-second block reproduces the official T3 Code v${fixtures[0].sourceTag.slice(1)} sidebar Snooze action in desktop dark and light themes at 1200 × 659 and 30 fps. The selected thread leaves the active cards after the native three-hour preset, navigation advances to the next card, the confirmation toast slides in and closes, the Snoozed shelf expands, and reopening the thread reveals its inline banner. A native reload check confirms Snooze persists until 2026-09-25T21:00:00Z in this deterministic fixture.

The local Hyfrme project and conversation are seeded, and no provider is configured. Project, conversation, thread titles, sidebar ages, theme, toast and banner copy, Snoozed count, and interaction timing are HyperFrames variables. Match these inputs across adjacent T3 Code blocks for seamless clips. Source: https://github.com/pingdotgg/t3code/tree/${fixtures[0].sourceCommit}. The installed files include T3 Code's MIT license and third-party icon notice. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.
`,
);
console.log(`Generated ${name} from native v0.0.42 dark/light Snooze states.`);
