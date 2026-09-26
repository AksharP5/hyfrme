import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-prompt-send";
const output = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, `.work/${name}-v0042-candidate`));
const fixtures = Object.fromEntries(await Promise.all(["dark", "light"].map(async (theme) => [theme,
  JSON.parse(await readFile(resolve(source, `prompt-send-v0042-${theme}-fixture.json`), "utf8")),
])));
const fixture = fixtures.dark;
if (fixture.sourceCommit !== fixtures.light.sourceCommit || fixture.prompt !== fixtures.light.prompt ||
  fixture.events.send !== fixtures.light.events.send ||
  fixture.events.transitionFrames !== fixtures.light.events.transitionFrames) throw new Error("Prompt Send theme fixtures differ");
const themes = Object.fromEntries(await Promise.all(["dark", "light"].map(async (theme) => [theme,
  JSON.parse(await readFile(resolve(source, `${theme}-theme.json`), "utf8")),
])));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const sprites = Object.fromEntries(await Promise.all(["dark", "light"].map(async (theme) => [theme,
  await Promise.all(Array.from({ length: 10 }, (_, row) =>
    readFile(resolve(source, `prompt-send-v0042-${theme}-capture-${String(row).padStart(2, "0")}.webp`)))),
])));
const phases = { dark: ["draft", "active", "complete"], light: ["draft", "active", "complete"] };
const states = Object.fromEntries(await Promise.all(["dark", "light"].map(async (theme) => [theme,
  Object.fromEntries(await Promise.all(phases[theme].map(async (phase) => [phase,
    await readFile(resolve(source, `prompt-send-v0042-${theme}-${phase}.html`), "utf8"),
  ]))),
])));
for (const theme of ["dark", "light"]) for (const phase of phases[theme]) {
  states[theme][phase] = states[theme][phase].replace(
    'class="h-full max-h-[inherit] overflow-auto',
    'data-layout-allow-overflow class="h-full max-h-[inherit] overflow-auto',
  ).replaceAll(
    '<span class="pointer-events-none absolute left-1/2 top-1/2 size-[max(100%,3rem)]',
    '<span data-layout-allow-overflow class="pointer-events-none absolute left-1/2 top-1/2 size-[max(100%,3rem)]',
  ).replaceAll(
    'class="live-activity-focus pointer-events-none',
    'data-layout-ignore class="live-activity-focus pointer-events-none',
  ).replaceAll(
    '<div class="legend-list-content-container"',
    '<div data-layout-allow-overflow class="legend-list-content-container"',
  ).replace(/(<span[^>]*class="[^"]*\[text-box:trim-both_cap_alphabetic\][^"]*")/g, "$1 data-layout-ignore")
   .replace(/(<span[^>]*class="pointer-events-none absolute[^"]*")/g, "$1 data-layout-allow-overflow").replaceAll(
    'data-testid="sidebar-row-card" class="group/sidebar-row relative w-full cursor-pointer overflow-hidden rounded-md text-left outline-none select-none bg-sidebar-row-active',
    'data-layout-ignore data-testid="sidebar-row-card" class="group/sidebar-row relative w-full cursor-pointer overflow-hidden rounded-md text-left outline-none select-none bg-sidebar-row-active',
  );
}
for (const theme of ["dark", "light"]) {
  if (states[theme].sent) states[theme].sent = states[theme].sent.replace(
    'class="relative flex w-full min-w-0 flex-col p-[var(--sidebar-content-inset)]',
    'data-prompt-sidebar-list class="relative flex w-full min-w-0 flex-col p-[var(--sidebar-content-inset)]',
  );
  for (const phase of ["active", "complete"]) {
    if (!states[theme][phase]) continue;
    states[theme][phase] = states[theme][phase].replace(
      'style="height: 164px; opacity: 1; position: relative;"',
      'data-prompt-message-row style="height: 164px; opacity: 1; position: relative;"',
    );
  }
}

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["branchName", "Branch name", "feature/logo-enter"],
  ["draftThreadTitle", "Draft thread title", "New thread"],
  ["agentThreadTitle", "Sent thread title", "Build a four-second Hyfrme Logo Enter preview with..."],
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
  ["settledAge", "Settled thread age", "4h"],
  ["modelName", "Model", "GPT-6-Astra"],
  ["reasoningLevel", "Reasoning", "Medium"],
  ["permissionMode", "Permission", "Full access"],
  ["draftWorkspace", "Draft workspace", "Current checkout"],
  ["agentWorkspace", "Agent workspace", "Local checkout"],
  ["prompt", "Prompt", fixture.prompt],
  ["messageTime", "Message time", "11:59 PM"],
  ["workingTime", "Working time", "0s"],
  ["thinkingLabel", "Agent state", "Thinking"],
  ["sentComposerPlaceholder", "Sent composer placeholder", "Ask anything, @tag files/folders, $use skills, or / for commands"],
  ["agentComposerPlaceholder", "Agent composer placeholder", "Ask anything, @tag files/folders, $use skills, or / for commands"],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "theme", type: "string", label: "T3 Code appearance", default: "dark", options: ["dark", "light"] },
  { id: "renderMode", type: "string", label: "Render mode", default: "pixel-verified", options: ["pixel-verified", "editable DOM"] },
  { id: "sendFrame", type: "number", label: "Send at frame", default: fixture.events.send, min: 1, max: 90, step: 1 },
  { id: "completeFrame", type: "number", label: "Final state at frame", default: fixture.events.complete, min: 2, max: 119, step: 1 },
];
const defaults = Object.fromEntries(fields.map(([id, , value]) => [id, value]));
Object.assign(defaults, { theme: "dark", renderMode: "pixel-verified", sendFrame: fixture.events.send,
  completeFrame: fixture.events.complete });
const textReplacements = Object.fromEntries(fields
  .filter(([id, , value]) => !id.endsWith("Age") && value)
  .map(([id, , value]) => [value, id]));
const fontTheme = Object.fromEntries(Object.entries(themes.dark).filter(([key]) =>
  key.includes("font-family") || key === "--font-sans" || key === "--font-mono"));
const stageThemes = Object.fromEntries(Object.entries(themes).map(([theme, values]) => [theme,
  Object.entries(values).map(([key, value]) => `${key}:${value};`).join(""),
]));
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
  .t3-stage[hidden] { display:none !important; }
  .t3-state[hidden] { display: none !important; }
  .t3-pixel-capture { position: absolute; inset: 0; z-index: 100; pointer-events: none; background-repeat: no-repeat; background-size: 14400px 659px; background-position: 0 0; }
  .t3-pixel-capture[hidden] { display: none !important; }
  .base-ui-disable-scrollbar { scrollbar-width: none; }
  .base-ui-disable-scrollbar::-webkit-scrollbar { display: none; }
  @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
  @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
  @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
  @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"); }
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
${["dark", "light"].flatMap((theme) => phases[theme].map((phase, index) => `<div class="${theme} t3-stage t3-state" data-t3-theme="${theme}" data-t3-state="${phase}" style="${stageThemes[theme].replaceAll('"', "&quot;")}"${theme === "light" || (theme === "dark" && index > 0) ? " hidden" : ""}>${states[theme][phase]}</div>`)).join("\n")}
${["dark", "light"].flatMap((theme) => sprites[theme].map((_, row) =>
  `<div class="t3-pixel-capture" data-t3-pixel-theme="${theme}" data-t3-pixel-row="${row}" style="background-image:url(compositions/t3-prompt-send-capture-${theme}-${String(row).padStart(2, "0")}.webp)" hidden></div>`
)).join("\n")}
</div>
<script src="t3-code-gsap.min.js"></script>
<script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
const stages = [...document.querySelectorAll('#root .t3-stage')];
for (const stage of stages) {
  for (const [key, value] of Object.entries(${scriptJson(fontTheme)})) stage.style.setProperty(key, value);
  stage.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
}
const replacements = ${scriptJson(textReplacements)};
const ageKeys = ['threadOneAge', 'threadTwoAge', 'threadThreeAge', 'threadFourAge', 'threadFiveAge'];
for (const stage of stages) {
  const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const current = node.textContent.trim();
    const key = replacements[current];
    if (key && options[key] !== defaults[key]) node.textContent = node.textContent.replace(current, options[key]);
  }
  let ageIndex = 0;
  stage.querySelectorAll('[data-testid="sidebar-row-card"]').forEach((row) => {
    const age = [...row.querySelectorAll('span.tabular-nums.text-secondary-label')]
      .find((element) => /^\d+[smhd]$/i.test(element.textContent.trim()));
    if (!age) return;
    const ageKey = ageKeys[ageIndex++];
    if (ageKey) age.textContent = options[ageKey];
  });
  const settledAge = stage.querySelector('[data-testid="sidebar-row-slim"] .text-xs');
  if (settledAge) settledAge.textContent = options.settledAge;
  const editor = stage.querySelector('[data-testid="composer-editor"]');
  if (editor) editor.setAttribute('aria-placeholder', stage.dataset.t3State === 'draft' ? options.sentComposerPlaceholder : options.agentComposerPlaceholder);
  const answer = stage.querySelector('[data-message-role="assistant"] .chat-markdown p');
  if (answer) answer.dataset.t3PromptAnswer = 'true';
}
const phaseVisuals = ${scriptJson(Object.fromEntries(Object.entries(fixtures).map(([theme, value]) => [theme, value.stateVisuals])))};
for (const stage of stages) {
  const visual = phaseVisuals[stage.dataset.t3Theme]?.[stage.dataset.t3State];
  for (const element of stage.querySelectorAll('[data-id]')) {
    const value = visual?.scrollPositions?.[element.getAttribute('data-id')];
    if (value !== undefined) element.dataset.t3ScrollTop = String(value);
  }
  if (visual?.messageOpacity !== null && visual?.messageOpacity !== undefined) {
    let target = stage.querySelector('[data-message-role="user"]');
    while (target && target !== stage && target.style.opacity === '') target = target.parentElement;
    if (target && target !== stage) target.dataset.t3CapturedOpacity = String(visual.messageOpacity);
  }
}
const clock = { frame: 0 };
function draw() {
  const frame = Math.min(119, Math.max(0, Math.round(clock.frame)));
  const theme = options.theme;
  const sendFrame = Math.min(90, Math.max(1, Number(options.sendFrame)));
  const completeFrame = Math.min(119, Math.max(sendFrame + 1, Number(options.completeFrame)));
  let phase = frame <= sendFrame ? 'draft' : null;
  if (!phase && frame >= completeFrame) phase = 'complete';
  if (!phase) phase = 'active';
  for (const stage of stages) {
    stage.hidden = stage.dataset.t3Theme !== theme || stage.dataset.t3State !== phase;
    if (!stage.hidden) {
      for (const element of stage.querySelectorAll('[data-t3-scroll-top]')) element.scrollTop = Number(element.dataset.t3ScrollTop);
      const opacityTarget = stage.querySelector('[data-t3-captured-opacity]');
      if (opacityTarget) opacityTarget.style.opacity = opacityTarget.dataset.t3CapturedOpacity;
    }
  }
  const usePixelCapture = options.renderMode === 'pixel-verified';
  const captureRow = Math.floor(frame / 12);
  for (const capture of document.querySelectorAll('[data-t3-pixel-theme]')) {
    const active = usePixelCapture && capture.dataset.t3PixelTheme === theme && Number(capture.dataset.t3PixelRow) === captureRow;
    capture.hidden = !active;
    if (active) {
      capture.style.backgroundPosition = '-' + ((frame % 12) * 1200) + 'px 0px';
    }
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
for (const theme of ["dark", "light"]) for (let row = 0; row < sprites[theme].length; row++) {
  await writeFile(resolve(output, `t3-prompt-send-capture-${theme}-${String(row).padStart(2, "0")}.webp`), sprites[theme][row]);
}
await copyFile(resolve(root, "public/ideas/assets/T3-CODE-LICENSE.txt"), resolve(output, "licenses/T3-CODE-LICENSE.txt"));
await writeFile(resolve(output, "registry-item.json"), `${JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: Prompt Send",
  description: "Send a Hyfrme prompt through T3 Code's native composer, follow its live work state, and capture the provider response.",
  tags: ["composition", "app-ui", "t3-code", "prompt", "agent", "hyfrme-port"],
  author: "Hyfrme", authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT",
  dimensions: fixture.viewport, duration: fixture.frames / fixture.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    ...["dark", "light"].flatMap((theme) => sprites[theme].map((_, row) => ({
      path: `t3-prompt-send-capture-${theme}-${String(row).padStart(2, "0")}.webp`,
      target: `compositions/t3-prompt-send-capture-${theme}-${String(row).padStart(2, "0")}.webp`,
      type: "hyperframes:asset",
    }))),
    { path: "licenses/T3-CODE-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt", type: "hyperframes:asset" },
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2)}\n`);
await writeFile(resolve(output, "README.md"), `# T3 Code: Prompt Send

This four-second block reproduces official T3 Code v0.0.42 at 1200 × 659 and 30 fps in dark and light. The default pixel-verified mode replays the lossless native frame capture in ten lightweight strips. Choose editable DOM mode before editing text, project, workspace, thread, or event variables. It drafts a Hyfrme Logo Enter request, sends it through the native composer, follows thread creation and Thinking, and ends with the live ${fixture.providerState.match(/live ([^ ]+)/)?.[1] ?? "provider"} turn captured in the reference session.

Project, thread list, prompt, response, message time, agent labels, model, permission, workspace, theme, and event frames are editable. Set matching values on adjacent T3 Code blocks for a continuous workspace. The default action and answer were captured live; edited text renders from DOM. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. The installed files include the T3 Code MIT license. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.
`);
console.log(`Generated ${name} from the pinned T3 Code send interaction.`);
