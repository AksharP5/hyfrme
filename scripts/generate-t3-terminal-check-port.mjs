import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.35");
const name = "t3-terminal-check";
const output = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, "registry/blocks", name));
const fixture = JSON.parse(await readFile(resolve(source, "terminal-check-fixture.json"), "utf8"));
const theme = JSON.parse(await readFile(resolve(source, "dark-theme.json"), "utf8"));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const phases = ["before", "ready", "typed", "output"];
const states = await Promise.all(phases.map((phase) =>
  readFile(resolve(source, `terminal-check-${phase}.html`), "utf8"),
));
for (let index = 0; index < states.length; index++) {
  states[index] = states[index].replace(
    'class="h-full max-h-[inherit] overflow-auto',
    'data-layout-allow-overflow class="h-full max-h-[inherit] overflow-auto',
  ).replaceAll(
    '<span class="pointer-events-none absolute left-1/2 top-1/2 size-[max(100%,3rem)]',
    '<span data-layout-allow-overflow class="pointer-events-none absolute left-1/2 top-1/2 size-[max(100%,3rem)]',
  );
  if (index > 0) {
    states[index] = states[index].replace(
      /<canvas class="block size-full cursor-text" aria-hidden="true" width="\d+" height="\d+"><\/canvas>/,
      `<img data-terminal-canvas class="block size-full cursor-text" aria-hidden="true" width="${fixture.terminalBounds.width}" height="${fixture.terminalBounds.height}">`,
    );
    if (!states[index].includes("data-terminal-canvas")) {
      throw new Error(`Pinned ${phases[index]} DOM has no Ghostty canvas`);
    }
  }
}

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["branchName", "Branch name", "main"],
  ["currentThreadTitle", "Open thread", "New thread"],
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
  ["workspaceMode", "Workspace", "Current checkout"],
  ["composerPlaceholder", "Composer placeholder", "Ask for changes, send follow-ups, or attach images"],
  ["terminalTitle", "Terminal tab", "Terminal 1"],
  ["terminalPrompt", "Terminal directory", "hyfrme-t3-demo"],
  ["terminalBranch", "Terminal branch", "main"],
  ["command", "Command", fixture.command],
  ["output", "Command output", fixture.output],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "openFrame", type: "number", label: "Open terminal at frame", default: fixture.openFrame, min: 0, max: 117, step: 1 },
  { id: "typeFrame", type: "number", label: "Type command at frame", default: fixture.typeFrame, min: 1, max: 118, step: 1 },
  { id: "runFrame", type: "number", label: "Show output at frame", default: fixture.runFrame, min: 2, max: 119, step: 1 },
];
const defaults = Object.fromEntries(fields.map(([id, , value]) => [id, value]));
Object.assign(defaults, { openFrame: fixture.openFrame, typeFrame: fixture.typeFrame, runFrame: fixture.runFrame });
const textReplacements = Object.fromEntries(fields
  .filter(([id]) => !id.endsWith("Age") && !["terminalPrompt", "terminalBranch", "command", "output"].includes(id))
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
  [data-terminal-canvas][hidden] { display: none !important; }
  .terminal-custom { position: absolute; inset: 0; box-sizing: border-box; padding: 21px 4px 0; background: var(--terminal-background); color: var(--terminal-foreground); font: 13px/18px "JetBrains Mono", monospace; white-space: pre-wrap; }
  .terminal-custom[hidden] { display: none !important; }
  .terminal-custom .directory { color: #8fbfc4; font-weight: 600; }
  .terminal-custom .branch { color: #cf8993; font-style: italic; }
  .terminal-custom .status { color: #d18490; }
  .terminal-custom .prompt-dot { color: #93b9aa; }
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
    if (age && ageKeys[index]) age.textContent = options[ageKeys[index]];
  });
  const settledAge = section.querySelector('[data-testid="sidebar-row-slim"] .text-xs');
  if (settledAge) settledAge.textContent = options.settledAge;
  const editor = section.querySelector('[data-testid="composer-editor"]');
  if (editor) editor.setAttribute('aria-placeholder', options.composerPlaceholder);
}
const canvasSequence = ${scriptJson(fixture.canvasSequence)};
const phaseStarts = { ready: ${fixture.openFrame}, typed: ${fixture.typeFrame}, output: ${fixture.runFrame} };
const phaseFrames = Object.fromEntries(['ready', 'typed', 'output'].map((phase) => [phase,
  canvasSequence.slice(phaseStarts[phase], phase === 'ready' ? phaseStarts.typed : phase === 'typed' ? phaseStarts.output : 120)]));
const customTerminal = ['terminalPrompt', 'terminalBranch', 'command', 'output'].some((key) => options[key] !== defaults[key]);
function terminalMarkup(phase) {
  const prompt = '<span class="directory"></span> <span class="branch"></span> <span class="prompt-dot">●</span> ❯ ';
  const command = phase === 'ready' ? '' : options.command;
  const output = phase === 'output' ? '\\n' + options.output + '\\n' : '';
  return { prompt, command, output };
}
for (let index = 1; index < sections.length; index++) {
  const section = sections[index];
  const image = section.querySelector('[data-terminal-canvas]');
  const overlay = document.createElement('div');
  overlay.className = 'terminal-custom';
  overlay.hidden = !customTerminal;
  overlay.setAttribute('data-layout-ignore', '');
  const phase = ['before', 'ready', 'typed', 'output'][index];
  const markup = terminalMarkup(phase);
  const line = document.createElement('div');
  line.innerHTML = markup.prompt;
  line.querySelector('.directory').textContent = options.terminalPrompt;
  line.querySelector('.branch').textContent = options.terminalBranch;
  line.append(document.createTextNode(markup.command));
  overlay.append(line);
  if (phase === 'output') {
    const output = document.createElement('div');
    output.textContent = options.output;
    overlay.append(output);
    const nextPrompt = line.cloneNode(true);
    nextPrompt.lastChild.textContent = '';
    overlay.append(nextPrompt);
  }
  image.insertAdjacentElement('afterend', overlay);
  image.hidden = customTerminal;
}
const clock = { frame: 0 };
function draw() {
  const frame = Math.min(119, Math.max(0, Math.round(clock.frame)));
  const openFrame = Math.min(117, Math.max(0, Number(options.openFrame)));
  const typeFrame = Math.min(118, Math.max(openFrame + 1, Number(options.typeFrame)));
  const runFrame = Math.min(119, Math.max(typeFrame + 1, Number(options.runFrame)));
  const phaseIndex = frame < openFrame ? 0 : frame < typeFrame ? 1 : frame < runFrame ? 2 : 3;
  for (let index = 0; index < sections.length; index++) sections[index].hidden = index !== phaseIndex;
  if (phaseIndex > 0 && !customTerminal) {
    const phase = ['before', 'ready', 'typed', 'output'][phaseIndex];
    const defaultTiming = openFrame === defaults.openFrame && typeFrame === defaults.typeFrame && runFrame === defaults.runFrame;
    const phaseStart = phaseIndex === 1 ? openFrame : phaseIndex === 2 ? typeFrame : runFrame;
    const image = defaultTiming ? canvasSequence[frame] : phaseFrames[phase][(frame - phaseStart) % phaseFrames[phase].length];
    sections[phaseIndex].querySelector('[data-terminal-canvas]').src = 'compositions/' + image;
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
for (const asset of Object.keys(fixture.canvasAssets)) await copyFile(resolve(source, asset), resolve(output, asset));
await copyFile(resolve(root, "public/ideas/assets/T3-CODE-LICENSE.txt"), resolve(output, "licenses/T3-CODE-LICENSE.txt"));
await writeFile(resolve(output, "registry-item.json"), `${JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: Terminal Check",
  description: "Open T3 Code's real Terminal 1 and run git status against the Hyfrme demo repository.",
  tags: ["composition", "app-ui", "t3-code", "terminal", "hyfrme-port"],
  author: "Hyfrme", authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT",
  dimensions: fixture.viewport, duration: fixture.frames / fixture.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    ...Object.keys(fixture.canvasAssets).map((path) => ({ path, target: `compositions/${path}`, type: "hyperframes:asset" })),
    { path: "licenses/T3-CODE-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt", type: "hyperframes:asset" },
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2)}\n`);
await writeFile(resolve(output, "README.md"), `# T3 Code: Terminal Check

This four-second block reproduces T3 Code v${fixture.sourceTag.slice(1)} at 1200 × 659 and 30 fps. It starts in the full Hyfrme workspace, opens the real Terminal 1 panel, types \`git status --short\`, and displays the changed Hyfrme Logo Enter file reported by the actual shell. The terminal surface is Ghostty canvas in T3 Code; six native canvas states preserve its cursor blink alongside the captured source DOM and CSS. Command, output, prompt, and beat timing remain editable.

Set the same project, branch, thread, age, model, and composer variables on adjacent T3 Code blocks for a continuous workspace. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. The installed files include the T3 Code MIT license. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.
`);
console.log(`Generated ${name} from the pinned T3 Code terminal surface.`);
