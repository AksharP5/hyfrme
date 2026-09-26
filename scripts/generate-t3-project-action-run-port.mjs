import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.35");
const name = "t3-project-action-run";
const output = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, "registry/blocks", name));
const fixture = JSON.parse(await readFile(resolve(source, "project-action-run-fixture.json"), "utf8"));
const theme = JSON.parse(await readFile(resolve(source, "dark-theme.json"), "utf8"));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const phases = ["before", "opened", "output"];
const canvasNames = Object.keys(fixture.assetSha256);
const terminalImages = canvasNames.map((asset) =>
  `<img data-terminal-canvas data-canvas-name="${asset}" class="block size-full cursor-text" aria-hidden="true" width="${fixture.terminalBounds.width}" height="${fixture.terminalBounds.height}" src="compositions/${asset}" loading="eager" decoding="sync" hidden>`).join("");
const states = await Promise.all(phases.map((phase) => readFile(resolve(source, `project-action-run-${phase}.html`), "utf8")));
for (let index = 0; index < states.length; index++) {
  states[index] = states[index].replace(
    'class="h-full max-h-[inherit] overflow-auto',
    'data-layout-allow-overflow class="h-full max-h-[inherit] overflow-auto',
  ).replaceAll(
    '<span class="pointer-events-none absolute left-1/2 top-1/2 size-[max(100%,3rem)]',
    '<span data-layout-allow-overflow class="pointer-events-none absolute left-1/2 top-1/2 size-[max(100%,3rem)]',
  ).replace(
    '<div class="legend-list-content-container"',
    '<div data-layout-allow-overflow class="legend-list-content-container"',
  );
  if (index === 0) continue;
  states[index] = states[index].replace(
    '<form class="mx-auto w-full min-w-0 max-w-3xl" data-chat-composer-form="true"',
    '<form data-layout-ignore class="mx-auto w-full min-w-0 max-w-3xl" data-chat-composer-form="true"',
  ).replace(
    '<p>I found the Logo Enter timing in ',
    '<p data-layout-ignore>I found the Logo Enter timing in ',
  );
  states[index] = states[index].replace(
    /<canvas(?=[^>]*class="block size-full cursor-text")[^>]*><\/canvas>/,
    terminalImages,
  );
  if (!states[index].includes("data-terminal-canvas")) throw new Error(`Pinned ${phases[index]} DOM has no Ghostty canvas`);
}

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["selectedThread", "Selected thread", "Build a logo intro"],
  ["otherThread", "Sidebar thread 2", "Catalog motion audit"],
  ["threadThree", "Sidebar thread 3", "Grouped logo tests"],
  ["threadFour", "Sidebar thread 4", "Review final hold"],
  ["threadFive", "Sidebar thread 5", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ["userMessage", "User message", "Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames."],
  ["replyBeforeFile", "Reply before file", "I found the Logo Enter timing in"],
  ["replyFile", "Reply file", "logo-enter.html"],
  ["replyAfterFile", "Reply after file", ". The final pass can extend the duration while keeping the last rendered frame still."],
  ["workedDuration", "Worked duration", "2m"],
  ["composerPlaceholder", "Composer placeholder", "Enable a provider in Settings to send a message"],
  ["providerStatus", "Provider status", "No provider available"],
  ["permissionMode", "Permission", "Full access"],
  ["workspaceMode", "Workspace", "Worktree"],
  ["actionName", "Saved action name", "Verify Hyfrme"],
  ["terminalPrompt", "Terminal directory", "hyfrme"],
  ["branchName", "Terminal branch", "main"],
  ["command", "Run command", fixture.command],
  ["output", "Command output", fixture.output],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "runFrame", type: "number", label: "Run action at frame", default: fixture.runFrame, min: 0, max: 118, step: 1 },
  { id: "resultFrame", type: "number", label: "Show completed output at frame", default: fixture.resultFrame, min: 1, max: 119, step: 1 },
];
const defaults = Object.fromEntries(fields.map(([id, , value]) => [id, value]));
Object.assign(defaults, { runFrame: fixture.runFrame, resultFrame: fixture.resultFrame });
const replacements = Object.fromEntries(fields
  .filter(([id]) => !["replyFile", "workedDuration", "composerPlaceholder", "terminalPrompt", "branchName", "command", "output"].includes(id))
  .map(([id, , value]) => [value, id]));
const fontTheme = Object.fromEntries(Object.entries(theme).filter(([key]) => key.includes("font-family") || key === "--font-sans" || key === "--font-mono"));
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
  [data-terminal-canvas][hidden], .terminal-custom[hidden] { display: none !important; }
  .terminal-custom { position: absolute; inset: 0; box-sizing: border-box; padding: 9px 4px; background: var(--terminal-background); color: var(--terminal-foreground); font: 13px/18px "JetBrains Mono", monospace; white-space: pre-wrap; }
  .terminal-custom .directory { color: #8fbfc4; font-weight: 600; }
  .terminal-custom .branch { color: #cf8993; font-style: italic; }
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
${states.map((state, index) => `    <div class="t3-state" data-t3-state="${phases[index]}"${index ? " hidden" : ""}>${state}</div>`).join("\n")}
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
const sections = [...stage.querySelectorAll('[data-t3-state]')];
const replacements = ${scriptJson(replacements)};
for (const section of sections) {
  const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const current = node.textContent.trim();
    const key = replacements[current];
    if (key && options[key] !== defaults[key]) node.textContent = node.textContent.replace(current, options[key]);
  }
  for (const element of section.querySelectorAll('[aria-label], [title]')) {
    for (const attribute of ['aria-label', 'title']) {
      const value = element.getAttribute(attribute);
      if (value?.includes(defaults.actionName)) element.setAttribute(attribute, value.replaceAll(defaults.actionName, options.actionName));
      if (value?.includes(defaults.replyFile)) element.setAttribute(attribute, value.replaceAll(defaults.replyFile, options.replyFile));
    }
  }
  const replyFile = section.querySelector('.chat-markdown-file-link .truncate');
  if (replyFile) replyFile.textContent = options.replyFile;
  const worked = [...section.querySelectorAll('span')].find((element) => element.textContent === 'Worked for 2m');
  if (worked) worked.textContent = 'Worked for ' + options.workedDuration;
  for (const editor of section.querySelectorAll('[data-testid="composer-editor"]')) editor.setAttribute('aria-placeholder', options.composerPlaceholder);
}
const canvasSequence = ${scriptJson(fixture.canvasSequence)};
const customTerminal = ['terminalPrompt', 'branchName', 'command', 'output'].some((key) => options[key] !== defaults[key]);
for (let index = 1; index < sections.length; index++) {
  const section = sections[index];
  const images = [...section.querySelectorAll('[data-terminal-canvas]')];
  const overlay = document.createElement('div');
  overlay.className = 'terminal-custom';
  overlay.hidden = !customTerminal;
  overlay.setAttribute('data-layout-ignore', '');
  const prompt = document.createElement('div');
  prompt.innerHTML = '<span class="directory"></span> <span class="branch"></span> <span class="prompt-dot">●</span> ❯ ';
  prompt.querySelector('.directory').textContent = options.terminalPrompt;
  prompt.querySelector('.branch').textContent = options.branchName;
  prompt.append(document.createTextNode(options.command));
  overlay.append(prompt);
  if (index === 2) {
    const output = document.createElement('div');
    output.textContent = '\\n' + options.output + '\\n';
    overlay.append(output);
    const next = prompt.cloneNode(true);
    next.lastChild.textContent = '';
    overlay.append(next);
  }
  images.at(-1).insertAdjacentElement('afterend', overlay);
  for (const image of images) image.hidden = true;
}
const clock = { frame: 0 };
function draw() {
  const frame = Math.min(119, Math.max(0, Math.round(clock.frame)));
  const runFrame = Math.min(118, Math.max(0, Number(options.runFrame)));
  const resultFrame = Math.min(119, Math.max(runFrame + 1, Number(options.resultFrame)));
  const phaseIndex = frame < runFrame ? 0 : frame < resultFrame ? 1 : 2;
  for (let index = 0; index < sections.length; index++) sections[index].hidden = index !== phaseIndex;
  if (phaseIndex > 0) {
    const scroller = sections[phaseIndex].querySelector('.scrollbar-gutter-both.h-full');
    if (scroller) scroller.scrollTop = scroller.scrollHeight - scroller.clientHeight;
  }
  if (phaseIndex > 0 && !customTerminal) {
    const defaultTiming = runFrame === defaults.runFrame && resultFrame === defaults.resultFrame;
    const sourceFrame = defaultTiming ? frame : phaseIndex === 1
      ? defaults.runFrame + ((frame - runFrame) % (defaults.resultFrame - defaults.runFrame))
      : defaults.resultFrame + ((frame - resultFrame) % (120 - defaults.resultFrame));
    for (const image of sections[phaseIndex].querySelectorAll('[data-terminal-canvas]')) {
      image.hidden = image.getAttribute('data-canvas-name') !== canvasSequence[sourceFrame];
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
for (const asset of Object.keys(fixture.assetSha256)) await copyFile(resolve(source, asset), resolve(output, asset));
await copyFile(resolve(root, "parity/t3-gallery/assets/T3-CODE-LICENSE.txt"), resolve(output, "licenses/T3-CODE-LICENSE.txt"));
await copyFile(resolve(source, "project-action-run-GHOSTTY-LICENSE.txt"), resolve(output, "licenses/GHOSTTY-LICENSE.txt"));
await copyFile(resolve(source, "project-action-run-SYMBOLS-NERD-FONT-LICENSE.txt"), resolve(output, "licenses/SYMBOLS-NERD-FONT-LICENSE.txt"));
await writeFile(resolve(output, "registry-item.json"), `${JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: Project Action Run",
  description: "Run a saved project action in T3 Code and watch its real check output in the workspace terminal.",
  tags: ["composition", "app-ui", "t3-code", "project-action", "terminal", "hyfrme-port"],
  author: "Hyfrme", authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT",
  dimensions: fixture.viewport, duration: fixture.frames / fixture.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    ...Object.keys(fixture.assetSha256).map((path) => ({ path, target: `compositions/${path}`, type: "hyperframes:asset" })),
    { path: "licenses/T3-CODE-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt", type: "hyperframes:asset" },
    { path: "licenses/GHOSTTY-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/GHOSTTY-LICENSE.txt", type: "hyperframes:asset" },
    { path: "licenses/SYMBOLS-NERD-FONT-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/SYMBOLS-NERD-FONT-LICENSE.txt", type: "hyperframes:asset" },
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2)}\n`);
await writeFile(resolve(output, "README.md"), `# T3 Code: Project Action Run

This four-second block reproduces the pinned T3 Code ${fixture.sourceTag} workspace at 1200 × 659 and 30 fps. It clicks the saved Verify Hyfrme action, which really runs npm run check in an isolated Hyfrme project, and shows the TypeScript check result in T3's Ghostty terminal. The installed composition uses the captured source DOM, pinned T3 CSS, and native terminal canvas states. Project, thread, action, command, output, and timing are editable.

Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. The installed files include T3 Code's MIT license, Ghostty's MIT license for the terminal renderer behind the captured pixels, and the MIT license for Symbols Nerd Font Mono glyphs. The block ships canvas stills, not Ghostty WASM or the font binary. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.
`);
console.log(`Generated ${name} from pinned T3 Code Project Action Run capture.`);
