import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.35");
const name = "t3-prompt-send";
const output = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, "registry/blocks", name));
const fixture = JSON.parse(await readFile(resolve(source, "prompt-send-fixture.json"), "utf8"));
const theme = JSON.parse(await readFile(resolve(source, "dark-theme.json"), "utf8"));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const phases = ["draft", "sent", "agent"];
const states = await Promise.all(phases.map((phase) =>
  readFile(resolve(source, `prompt-send-${phase}.html`), "utf8"),
));
for (let index = 0; index < states.length; index++) {
  states[index] = states[index].replace(
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
  ).replaceAll(
    'data-testid="sidebar-row-card" class="group/sidebar-row relative w-full cursor-pointer overflow-hidden rounded-md text-left outline-none select-none bg-sidebar-row-active',
    'data-layout-ignore data-testid="sidebar-row-card" class="group/sidebar-row relative w-full cursor-pointer overflow-hidden rounded-md text-left outline-none select-none bg-sidebar-row-active',
  );
}
states[1] = states[1].replace(
  'class="relative flex w-full min-w-0 flex-col p-[var(--sidebar-content-inset)]',
  'data-prompt-sidebar-list class="relative flex w-full min-w-0 flex-col p-[var(--sidebar-content-inset)]',
).replace(
  'style="height: 164px; opacity: 1; position: relative;"',
  'data-prompt-message-row style="height: 164px; opacity: 1; position: relative;"',
);

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["branchName", "Branch name", "main"],
  ["draftThreadTitle", "Draft thread title", "New thread"],
  ["agentThreadTitle", "Sent thread title", "Build a four-second Hyfrme Logo Enter preview with..."],
  ["threadOne", "Thread 1", "Build a logo intro"],
  ["threadTwo", "Thread 2", "Catalog motion audit"],
  ["threadThree", "Thread 3", "Grouped logo tests"],
  ["threadFour", "Thread 4", "Review final hold"],
  ["threadFive", "Thread 5", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ["threadOneAge", "Thread 1 age", "5h"],
  ["threadTwoAge", "Thread 2 age", "7h"],
  ["threadThreeAge", "Thread 3 age", "12h"],
  ["threadFourAge", "Thread 4 age", "1d"],
  ["threadFiveAge", "Thread 5 age", "2d"],
  ["settledAge", "Settled thread age", "4h"],
  ["modelName", "Model", "GPT-5.6-Sol"],
  ["reasoningLevel", "Reasoning", "Low"],
  ["permissionMode", "Permission", "Full access"],
  ["draftWorkspace", "Draft workspace", "Current checkout"],
  ["agentWorkspace", "Agent workspace", "Local checkout"],
  ["prompt", "Prompt", fixture.prompt],
  ["messageTime", "Message time", "2:48 AM"],
  ["workingTime", "Working time", "0s"],
  ["thinkingLabel", "Agent state", "Thinking"],
  ["sentComposerPlaceholder", "Sent composer placeholder", "Ask for changes, send follow-ups, or attach images"],
  ["agentComposerPlaceholder", "Agent composer placeholder", "Ask anything, @tag files/folders, $use skills, or / for commands"],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "sendFrame", type: "number", label: "Send at frame", default: fixture.sampleFrames.sent, min: 1, max: 118, step: 1 },
  { id: "agentFrame", type: "number", label: "Agent state at frame", default: fixture.sampleFrames.agent, min: 2, max: 119, step: 1 },
];
const defaults = Object.fromEntries(fields.map(([id, , value]) => [id, value]));
Object.assign(defaults, { sendFrame: fixture.sampleFrames.sent, agentFrame: fixture.sampleFrames.agent });
const textReplacements = Object.fromEntries(fields
  .filter(([id]) => !id.endsWith("Age"))
  .map(([id, , value]) => [value, id]));
const fontTheme = Object.fromEntries(Object.entries(theme).filter(([key]) =>
  key.includes("font-family") || key === "--font-sans" || key === "--font-mono"));
const stageTheme = Object.entries(theme).map(([key, value]) => `${key}:${value};`).join("");
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
  .t3-stage { ${stageTheme} position: relative; width: 100%; height: 100%; overflow: hidden; background: oklch(14.5% 0 0); color: oklch(97% 0 0); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
  .t3-state[hidden] { display: none !important; }
  .t3-state:not([hidden]) { display: contents; }
  [data-t3-state="sent"] [data-prompt-sidebar-list] { transform: translateY(80px); }
  [data-t3-state="sent"] [data-prompt-message-row] { top: -28px; }
  [data-t3-state="sent"] [data-message-role="user"] .opacity-0.transition-opacity { opacity: .24; }
  [data-t3-state="sent"] [data-chat-composer-overlay="true"] { transform: translateY(-18px); }
  .base-ui-disable-scrollbar { scrollbar-width: none; }
  .base-ui-disable-scrollbar::-webkit-scrollbar { display: none; }
  @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
  @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
  @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
  @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"); }
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
  <div class="dark t3-stage">
    ${states.map((state, index) => `<div class="t3-state" data-t3-state="${phases[index]}"${index ? " hidden" : ""}>${state}</div>`).join("\n    ")}
  </div>
</div>
<script src="t3-code-gsap.min.js"></script>
<script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
const stage = document.querySelector('#root .t3-stage');
for (const [key, value] of Object.entries(${scriptJson(fontTheme)})) stage.style.setProperty(key, value);
stage.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
const replacements = ${scriptJson(textReplacements)};
const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
let node;
while ((node = walker.nextNode())) {
  const current = node.textContent.trim();
  const key = replacements[current];
  if (key && options[key] !== defaults[key]) node.textContent = node.textContent.replace(current, options[key]);
}
const sections = [...stage.querySelectorAll('[data-t3-state]')];
const ageKeys = ['threadOneAge', 'threadTwoAge', 'threadThreeAge', 'threadFourAge', 'threadFiveAge'];
for (const section of sections) {
  section.querySelectorAll('[data-testid="sidebar-row-card"]').forEach((row, index) => {
    const age = row.querySelector('span.tabular-nums.text-secondary-label');
    const ageKey = ageKeys[index - (section.dataset.t3State === 'agent' ? 1 : 0)];
    if (age && ageKey) age.textContent = options[ageKey];
  });
  const settledAge = section.querySelector('[data-testid="sidebar-row-slim"] .text-xs');
  if (settledAge) settledAge.textContent = options.settledAge;
}
const sentEditor = sections[1].querySelector('[data-testid="composer-editor"]');
const agentEditor = sections[2].querySelector('[data-testid="composer-editor"]');
if (sentEditor) sentEditor.setAttribute('aria-placeholder', options.sentComposerPlaceholder);
if (agentEditor) agentEditor.setAttribute('aria-placeholder', options.agentComposerPlaceholder);
const clock = { frame: 0 };
function draw() {
  const frame = Math.min(119, Math.max(0, Math.round(clock.frame)));
  const sendFrame = Math.min(118, Math.max(1, Number(options.sendFrame)));
  const agentFrame = Math.min(119, Math.max(sendFrame + 1, Number(options.agentFrame)));
  const phase = frame < sendFrame ? 0 : frame < agentFrame ? 1 : 2;
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
await copyFile(resolve(root, "public/ideas/assets/T3-CODE-LICENSE.txt"), resolve(output, "licenses/T3-CODE-LICENSE.txt"));
await writeFile(resolve(output, "registry-item.json"), `${JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: Prompt Send",
  description: "Send a Hyfrme prompt in T3 Code's full workspace and enter the real agent-start state.",
  tags: ["composition", "app-ui", "t3-code", "prompt", "agent", "hyfrme-port"],
  author: "Hyfrme", authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT",
  dimensions: fixture.viewport, duration: fixture.frames / fixture.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    { path: "licenses/T3-CODE-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt", type: "hyperframes:asset" },
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2)}\n`);
await writeFile(resolve(output, "README.md"), `# T3 Code: Prompt Send

This four-second block reproduces T3 Code v${fixture.sourceTag.slice(1)} at 1200 × 659 and 30 fps. Its Hyfrme-only prompt is drafted in the full workspace, sent through the real T3 Code Send action, then shown as a user message while the native agent enters Thinking. The three native interaction beats are held across 120 frames. The isolated source server blocks outbound provider traffic, so this block does not imply a generated answer.

Project, thread, prompt, message time, agent labels, model, permission, workspace, and beat timing are editable. Set matching values on adjacent T3 Code blocks for a continuous workspace. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. The installed files include the T3 Code MIT license. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.
`);
console.log(`Generated ${name} from the pinned T3 Code send interaction.`);
