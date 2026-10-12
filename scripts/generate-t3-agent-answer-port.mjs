import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.35");
const name = "t3-agent-answer";
const output = resolve(root, ".work/t3-agent-answer-block");
const fixture = JSON.parse(await readFile(resolve(source, "agent-answer-fixture.json"), "utf8"));
const theme = JSON.parse(await readFile(resolve(source, "dark-theme.json"), "utf8"));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const phases = ["before", "hover", "tooltip", "copied", "clear"];
const states = await Promise.all(phases.map(async (phase) => ({
  root: await readFile(resolve(source, `agent-answer-${phase}.html`), "utf8"),
  portal: await readFile(resolve(source, `agent-answer-${phase}-portal.html`), "utf8"),
})));
states[2].root = states[2].root.replace(
  "<p>I found the Logo Enter timing in",
  "<p data-layout-ignore>I found the Logo Enter timing in",
);

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["branchName", "Branch name", "main"],
  ["threadOne", "Selected thread", "Build a logo intro"],
  ["threadTwo", "Sidebar thread 2", "Catalog motion audit"],
  ["threadThree", "Sidebar thread 3", "Grouped logo tests"],
  ["threadFour", "Sidebar thread 4", "Review final hold"],
  ["threadFive", "Sidebar thread 5", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ...fixture.threadAges.map((age, index) => [`thread${index + 1}Age`, `Thread ${index + 1} age`, age]),
  ["settledAge", "Settled thread age", "5h"],
  ["userMessage", "User prompt", "Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames."],
  ["replyLead", "Answer before file", "I found the Logo Enter timing in"],
  ["replyFile", "Answer file label", "logo-enter.html"],
  ["replyTail", "Answer after file", ". The final pass can extend the duration while keeping the last rendered frame still."],
  ["replyFilePath", "Answer file path", "registry/blocks/logo-enter/logo-enter.html"],
  ["userMessageTime", "Prompt time", fixture.messageTimes[0]],
  ["replyTime", "Answer time", fixture.messageTimes[1]],
  ["workedDuration", "Worked duration", "Worked for 2m"],
  ["composerPlaceholder", "Composer placeholder", "Enable a provider in Settings to send a message"],
  ["providerStatus", "Provider status", "No provider available"],
  ["permissionMode", "Permission", "Full access"],
  ["workspaceMode", "Workspace", "Worktree"],
  ["copyTooltip", "Copy tooltip", "Copy to clipboard"],
  ["copiedFeedback", "Copied feedback", "Copied!"],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "hoverFrame", type: "number", label: "Reveal answer controls at frame", default: fixture.hoverFrame, min: 0, max: 115, step: 1 },
  { id: "tooltipFrame", type: "number", label: "Show copy tooltip at frame", default: fixture.tooltipFrame, min: 1, max: 116, step: 1 },
  { id: "copyFrame", type: "number", label: "Copy answer at frame", default: fixture.copyFrame, min: 2, max: 117, step: 1 },
  { id: "clearFrame", type: "number", label: "Clear copy feedback at frame", default: fixture.clearFrame, min: 3, max: 119, step: 1 },
];
const defaults = Object.fromEntries(variables.map(({ id, default: value }) => [id, value]));
const textReplacements = Object.fromEntries(fields
  .filter(([id]) => !id.endsWith("Age") && id !== "replyFilePath")
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
  .base-ui-disable-scrollbar { scrollbar-width: none; }
  .base-ui-disable-scrollbar::-webkit-scrollbar { display: none; }
  @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
  @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
  @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
  @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"); }
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
  <div class="dark t3-stage">
${states.map(({ root: body, portal }, index) => `    <div class="t3-state" data-t3-state="${phases[index]}"${index ? " hidden" : ""}>${body}${portal}</div>`).join("\n")}
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
  if (key && options[key] !== defaults[key]) node.textContent = node.textContent.replace(current, String(options[key]));
}
const sections = [...stage.querySelectorAll('[data-t3-state]')];
const ageKeys = ['thread1Age', 'thread2Age', 'thread3Age', 'thread4Age', 'thread5Age'];
for (const section of sections) {
  section.querySelectorAll('[data-testid="sidebar-row-card"]').forEach((row, index) => {
    const age = row.querySelector('span.tabular-nums.text-secondary-label');
    if (age && ageKeys[index]) age.textContent = options[ageKeys[index]];
  });
  const settledAge = section.querySelector('[data-testid="sidebar-row-slim"] .text-xs');
  if (settledAge) settledAge.textContent = options.settledAge;
  for (const editor of section.querySelectorAll('[data-testid="composer-editor"]')) editor.setAttribute('aria-placeholder', options.composerPlaceholder);
  for (const element of section.querySelectorAll('[aria-label]')) {
    const label = element.getAttribute('aria-label');
    if (label === 'Thread actions for ' + defaults.threadOne) element.setAttribute('aria-label', 'Thread actions for ' + options.threadOne);
  }
  const file = section.querySelector('.chat-markdown-file-link');
  if (file) file.setAttribute('href', 'hyfrme-demo/' + String(options.replyFilePath).replace(/^\\/+/, ''));
  if (['hover', 'tooltip', 'copied'].includes(section.dataset.t3State)) {
    const answer = [...section.querySelectorAll('[data-timeline-row-kind="message"]')]
      .find((row) => row.textContent.includes(options.replyLead));
    const metadata = answer?.querySelector('button[aria-label="Copy link"]')?.parentElement;
    if (metadata) metadata.style.opacity = '1';
  }
}
const clock = { frame: 0 };
function draw() {
  const frame = Math.round(clock.frame);
  const tooltipFrame = Math.max(Number(options.tooltipFrame), Number(options.hoverFrame) + 1);
  const copyFrame = Math.max(Number(options.copyFrame), tooltipFrame + 1);
  const clearFrame = Math.max(Number(options.clearFrame), copyFrame + 1);
  const phase = frame < options.hoverFrame ? 0 : frame < tooltipFrame ? 1 : frame < copyFrame ? 2 : frame < clearFrame ? 3 : 4;
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
await copyFile(resolve(source, "thread-rename-t3-third-party-notices.md"), resolve(output, "licenses/T3-THIRD_PARTY_NOTICES.md"));
await copyFile(resolve(source, "source-file-open-pierre-trees-license.md"), resolve(output, "licenses/PIERRE-TREES-LICENSE.md"));
await copyFile(resolve(source, "source-file-open-pierre-trees-notice.md"), resolve(output, "licenses/PIERRE-TREES-NOTICE.md"));
await writeFile(resolve(output, "registry-item.json"), `${JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: Agent Answer",
  description: "A completed T3 Code assistant reply with its real hover metadata, copy tooltip, and copy confirmation in the full Hyfrme workspace.",
  tags: ["composition", "app-ui", "t3-code", "agent-answer", "hyfrme-port"],
  author: "Hyfrme", authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT",
  dimensions: fixture.viewport, duration: fixture.frames / fixture.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    { path: "licenses/T3-CODE-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt", type: "hyperframes:asset" },
    { path: "licenses/T3-THIRD_PARTY_NOTICES.md", target: "THIRD_PARTY_LICENSES/t3-code/T3-THIRD_PARTY_NOTICES.md", type: "hyperframes:asset" },
    { path: "licenses/PIERRE-TREES-LICENSE.md", target: "THIRD_PARTY_LICENSES/t3-code/PIERRE-TREES-LICENSE.md", type: "hyperframes:asset" },
    { path: "licenses/PIERRE-TREES-NOTICE.md", target: "THIRD_PARTY_LICENSES/t3-code/PIERRE-TREES-NOTICE.md", type: "hyperframes:asset" },
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2)}\n`);
await writeFile(resolve(output, "README.md"), `# T3 Code: Agent Answer

This four-second, 1200 × 659 block reproduces a completed T3 Code v${fixture.sourceTag.slice(1)} assistant reply at 30 fps. It reveals native answer metadata on hover, shows the copy tooltip and confirmation, then clears the feedback. The native reference uses a seeded completed Hyfrme thread and the real T3 Code interface. Its copy interaction was verified against the browser clipboard; it does not claim a live backend generated the response.

Customize the project, thread, prompt, answer text and file link, metadata, footer, copy feedback, and timing through HyperFrames variables. Match thread values with adjacent T3 Code blocks for continuity. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. The installed files include T3 Code's MIT license, its icon notice, and the Apache-2.0 @pierre/trees license and notice for the source icon sprite. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.
`);
console.log(`Generated ${name} from five native T3 Code answer/copy states.`);
