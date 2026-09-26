import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.35");
const name = "t3-project-action";
const output = resolve(root, "registry/blocks/t3-project-action");
const fixture = JSON.parse(await readFile(resolve(source, "project-action-fixture.json"), "utf8"));
const theme = JSON.parse(await readFile(resolve(source, "dark-theme.json"), "utf8"));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const phases = fixture.phases;
const states = await Promise.all(phases.map(async (phase) => {
  const state = await readFile(resolve(source, `project-action-${phase}.html`), "utf8");
  if (!["dialog", "named", "command", "shortcut"].includes(phase)) return state;
  return state.replace('<div class="group/sidebar-wrapper', '<div data-layout-ignore class="group/sidebar-wrapper');
}));
const portals = await Promise.all(phases.map(async (phase) =>
  JSON.parse(await readFile(resolve(source, `project-action-${phase}-portals.json`), "utf8")).map((portal) =>
    portal.replace('data-base-ui-portal=""', 'data-base-ui-portal="" data-layout-ignore'))));
const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["selectedThread", "Selected thread", "Build a logo intro"],
  ["otherThread", "Sidebar thread 2", "Catalog motion audit"],
  ["threadThree", "Sidebar thread 3", "Grouped logo tests"],
  ["threadFour", "Sidebar thread 4", "Review final hold"],
  ["threadFive", "Sidebar thread 5", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ["message", "User message", "Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames."],
  ["replyStart", "Reply before file", "I found the Logo Enter timing in"],
  ["replyFile", "Reply file", "logo-enter.html"],
  ["replyEnd", "Reply after file", ". The final pass can extend the duration while keeping the last rendered frame still."],
  ["workedDuration", "Worked duration", "2m"],
  ["composerPlaceholder", "Composer placeholder", "Enable a provider in Settings to send a message"],
  ["providerStatus", "Provider status", "No provider available"],
  ["permissionMode", "Permission", "Full access"],
  ["workspaceMode", "Workspace", "Worktree"],
  ["actionName", "Action name", "Verify Hyfrme"],
  ["actionCommand", "Action command", "npm run check"],
  ["keybinding", "Action shortcut", "mod+shift+v"],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  ...Object.entries(fixture.events).map(([phase, frame]) => ({
    id: `${phase}Frame`, type: "number", label: `${phase[0].toUpperCase()}${phase.slice(1)} at frame`,
    default: frame, min: 0, max: 119, step: 1,
  })),
];
const defaults = Object.fromEntries(fields.map(([id, , value]) => [id, value]));
for (const [phase, frame] of Object.entries(fixture.events)) defaults[`${phase}Frame`] = frame;
const textReplacements = Object.fromEntries(fields.filter(([id]) => !["replyFile", "workedDuration", "composerPlaceholder", "actionCommand", "keybinding"].includes(id)).map(([id, , value]) => [value, id]));
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
  .t3-state [data-slot="dialog-panel"] form.space-y-4 { transform: translateY(1px); }
  .t3-state [data-slot="dialog-panel"] form.space-y-4 > :not(:last-child) { margin-bottom: 17px; }
  .t3-state [data-slot="dialog-panel"] form.space-y-4 > :nth-child(2) { margin-bottom: 18px; }
  .t3-state [data-slot="dialog-panel"] form.space-y-4 > :nth-child(4) { margin-bottom: 16px; }
  .t3-stage [data-hyfrme-focus-ring] { border-color: var(--ring); box-shadow: 0 0 0 3px color-mix(in oklab, var(--ring) 24%, transparent); }
  .base-ui-disable-scrollbar { scrollbar-width: none; }
  .base-ui-disable-scrollbar::-webkit-scrollbar { display: none; }
  @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
  @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
  @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
  @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"); }
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
  <div class="dark t3-stage">
${states.map((state, index) => `    <div class="t3-state" data-t3-state="${phases[index]}"${index ? " hidden" : ""}>${state}${portals[index].join("")}</div>`).join("\n")}
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
const replacements = ${scriptJson(textReplacements)};
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
  const name = section.querySelector('#script-name');
  if (name?.getAttribute('value')) { name.value = options.actionName; name.setAttribute('value', options.actionName); }
  const shortcut = section.querySelector('#script-keybinding');
  if (shortcut?.getAttribute('value')) { shortcut.value = options.keybinding; shortcut.setAttribute('value', options.keybinding); }
  const command = section.querySelector('#script-command');
  if (command && command.textContent.trim()) { command.value = options.actionCommand; command.textContent = options.actionCommand; }
  const state = section.dataset.t3State;
  const focused = state === 'dialog' || state === 'named' ? name : state === 'command' ? command : state === 'shortcut' ? shortcut : null;
  focused?.closest('[data-slot="input-control"], [data-slot="textarea-control"]')?.setAttribute('data-hyfrme-focus-ring', '');
}
const clock = { frame: 0 };
function draw() {
  const frame = Math.round(clock.frame);
  const names = ['dialog', 'named', 'command', 'shortcut', 'saved', 'menu'];
  const boundaries = [];
  names.forEach((name, index) => {
    const requested = Number(options[name + 'Frame']);
    boundaries.push(Math.max(index ? boundaries[index - 1] + 1 : 0, requested));
  });
  let phase = 0;
  while (phase < boundaries.length && frame >= boundaries[phase]) phase++;
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
await copyFile(resolve(root, "parity/t3-gallery/assets/T3-CODE-LICENSE.txt"), resolve(output, "licenses/T3-CODE-LICENSE.txt"));
await copyFile(resolve(source, "source-file-open-t3-third-party-notices.md"), resolve(output, "licenses/T3-THIRD_PARTY_NOTICES.md"));
await writeFile(resolve(output, "registry-item.json"), `${JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name,
  type: "hyperframes:block",
  title: "T3 Code: Project Action",
  description: "Create a real project-scoped Hyfrme check action in T3 Code, set its command and shortcut, and show it in the toolbar menu.",
  tags: ["composition", "app-ui", "t3-code", "project-action", "hyfrme-port"],
  author: "Hyfrme",
  authorUrl: "https://github.com/AksharP5/hyfrme",
  license: "MIT",
  dimensions: fixture.viewport,
  duration: fixture.frames / fixture.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    { path: "licenses/T3-CODE-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt", type: "hyperframes:asset" },
    { path: "licenses/T3-THIRD_PARTY_NOTICES.md", target: "THIRD_PARTY_LICENSES/t3-code/T3-THIRD_PARTY_NOTICES.md", type: "hyperframes:asset" },
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2)}\n`);
await writeFile(resolve(output, "README.md"), `# T3 Code: Project Action\n\nThis four-second block captures T3 Code v${fixture.sourceTag.slice(1)} at 1200 × 659 and 30 fps. The real Add Action dialog receives a Hyfrme check name, command, and shortcut, then the saved action appears in the toolbar and its menu. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}.\n\nProject and thread copy, action name, command, shortcut, and all six interaction beats are editable. The installed files include T3 Code's MIT license and its bundled third-party icon notice. GSAP 3.14.2 is included for offline frame control under its Standard License: https://gsap.com/standard-license/.\n`);
console.log(`Generated ${name} from pinned T3 Code project-action UI.`);
