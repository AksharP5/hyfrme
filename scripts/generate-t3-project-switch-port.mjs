import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.35");
const name = "t3-project-switch";
const output = resolve(root, ".work/t3-project-switch-candidate");
const fixture = JSON.parse(await readFile(resolve(source, "project-switch-fixture.json"), "utf8"));
const theme = JSON.parse(await readFile(resolve(source, "dark-theme.json"), "utf8"));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const phases = fixture.phases;
const states = await Promise.all(phases.map((phase) => readFile(resolve(source, `project-switch-${phase}.html`), "utf8")));
const portalPhases = ["menu", "motion-menu", "hyfrme-menu"];
const portals = await Promise.all(portalPhases.map(async (phase) =>
  (await readFile(resolve(source, `project-switch-${phase}-portal.html`), "utf8"))
    .replace("<div ", "<div data-layout-ignore ")));
for (const index of [0, 1, 2, 3, 4, 5]) {
  states[index] = states[index].replace(
    'class="h-full max-h-[inherit] overflow-auto',
    'data-layout-allow-overflow class="h-full max-h-[inherit] overflow-auto',
  );
  states[index] = states[index].replaceAll(
    '<span class="pointer-events-none absolute left-1/2 top-1/2 size-[max(100%,3rem)]',
    '<span data-layout-allow-overflow class="pointer-events-none absolute left-1/2 top-1/2 size-[max(100%,3rem)]',
  );
}
for (const index of [1, 3, 5]) {
  states[index] = states[index].replace('<div class="group/sidebar-wrapper', '<div data-layout-ignore class="group/sidebar-wrapper');
}

const fields = [
  ["projectName", "First project name", "hyfrme"],
  ["motionProject", "Second project name", "hyfrme-motion-lab"],
  ["allProjects", "All projects option", "All projects"],
  ["emptyMessage", "Second project's empty state", "No threads in hyfrme-motion-lab yet"],
  ["branchName", "Branch name", "main"],
  ["thirdBranch", "Third thread branch", "logo/assemble"],
  ["fourthBranch", "Fourth thread branch", "logo/hold-final"],
  ["firstThread", "Selected thread", "Build a logo intro"],
  ["secondThread", "Second thread", "Catalog motion audit"],
  ["thirdThread", "Third thread", "Grouped logo tests"],
  ["fourthThread", "Fourth thread", "Review final hold"],
  ["fifthThread", "Fifth thread", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ["firstAge", "Selected thread age", "9h"],
  ["secondAge", "Second thread age", "11h"],
  ["thirdAge", "Third thread age", "16h"],
  ["fourthAge", "Fourth thread age", "1d"],
  ["fifthAge", "Fifth thread age", "2d"],
  ["settledAge", "Settled thread age", "8h"],
  ["question", "Selected thread user message", "Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames."],
  ["replyLead", "Answer before file mention", "I found the Logo Enter timing in"],
  ["fileMention", "Answer file mention", "logo-enter.html"],
  ["replyTail", "Answer after file mention", "The final pass can extend the duration while keeping the last rendered frame still."],
  ["workedDuration", "Agent duration", "Worked for 2m"],
  ["composerPlaceholder", "Composer placeholder", "Enable a provider in Settings to send a message"],
  ["providerStatus", "Provider status", "No provider available"],
  ["permissionMode", "Permission", "Full access"],
  ["workspaceMode", "Workspace", "Worktree"],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "menuFrame", type: "number", label: "Open project menu at frame", default: fixture.events.menu, min: 1, max: 90, step: 1 },
  { id: "motionFrame", type: "number", label: "Choose second project at frame", default: fixture.events.motion, min: 2, max: 95, step: 1 },
  { id: "motionMenuFrame", type: "number", label: "Inspect second selection at frame", default: fixture.events.motionMenu, min: 3, max: 105, step: 1 },
  { id: "hyfrmeFrame", type: "number", label: "Choose first project at frame", default: fixture.events.hyfrme, min: 4, max: 112, step: 1 },
  { id: "hyfrmeMenuFrame", type: "number", label: "Inspect first selection at frame", default: fixture.events.hyfrmeMenu, min: 5, max: 119, step: 1 },
];
const defaults = Object.fromEntries(variables.map(({ id, default: value }) => [id, value]));
const replacements = Object.fromEntries(fields
  .filter(([id]) => !["emptyMessage"].includes(id))
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
  .t3-stage [data-slot="menu-popup"] { position: absolute; top: 132px; left: 8px; width: 202px; z-index: 50; --anchor-width: 202px; }
  .base-ui-disable-scrollbar { scrollbar-width: none; }
  .base-ui-disable-scrollbar::-webkit-scrollbar { display: none; }
  @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
  @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
  @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
  @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"); }
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
  <div class="dark t3-stage">
${states.map((body, index) => `    <div class="t3-state" data-t3-state="${phases[index]}"${index ? " hidden" : ""}>${body}${index === 1 ? portals[0] : index === 3 ? portals[1] : index === 5 ? portals[2] : ""}</div>`).join("\n")}
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
const replacements = ${scriptJson(replacements)};
const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
let node;
while ((node = walker.nextNode())) {
  const current = node.textContent.trim();
  if (current === defaults.emptyMessage) {
    node.textContent = options.emptyMessage !== defaults.emptyMessage
      ? String(options.emptyMessage)
      : defaults.emptyMessage.replace(defaults.motionProject, String(options.motionProject));
    continue;
  }
  const key = replacements[current];
  if (key && options[key] !== defaults[key]) node.textContent = node.textContent.replace(current, String(options[key]));
  for (const id of ['motionProject', 'replyLead', 'replyTail']) {
    if (options[id] !== defaults[id] && node.textContent.includes(defaults[id])) {
      node.textContent = node.textContent.replaceAll(defaults[id], String(options[id]));
    }
  }
}
const sections = [...stage.querySelectorAll('[data-t3-state]')];
for (const section of sections) {
  for (const editor of section.querySelectorAll('[data-testid="composer-editor"]')) {
    editor.setAttribute('aria-placeholder', options.composerPlaceholder);
  }
  for (const element of section.querySelectorAll('[aria-label], [title]')) {
    for (const attribute of ['aria-label', 'title']) {
      const label = element.getAttribute(attribute);
      if (!label) continue;
      let updated = label;
      for (const key of ['firstThread', 'secondThread', 'thirdThread', 'fourthThread', 'fifthThread', 'projectName', 'motionProject', 'branchName', 'thirdBranch', 'fourthBranch']) {
        if (options[key] !== defaults[key]) updated = updated.replaceAll(defaults[key], String(options[key]));
      }
      if (updated !== label) element.setAttribute(attribute, updated);
    }
  }
}
const clock = { frame: 0 };
function draw() {
  const frame = Math.round(clock.frame);
  const menuFrame = Number(options.menuFrame);
  const motionFrame = Math.max(Number(options.motionFrame), menuFrame + 1);
  const motionMenuFrame = Math.max(Number(options.motionMenuFrame), motionFrame + 1);
  const hyfrmeFrame = Math.max(Number(options.hyfrmeFrame), motionMenuFrame + 1);
  const hyfrmeMenuFrame = Math.max(Number(options.hyfrmeMenuFrame), hyfrmeFrame + 1);
  const phase = frame < menuFrame ? 0 : frame < motionFrame ? 1 : frame < motionMenuFrame ? 2 : frame < hyfrmeFrame ? 3 : frame < hyfrmeMenuFrame ? 4 : 5;
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
await copyFile(resolve(root, "registry/blocks/t3-git-push/licenses/VSCODE-ICONS-LICENSE.txt"), resolve(output, "licenses/VSCODE-ICONS-LICENSE.txt"));
await writeFile(resolve(output, "registry-item.json"), `${JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: Project Scope",
  description: "Switch T3 Code's project-scoped sidebar between two real Hyfrme workspaces through its native radio menu.",
  tags: ["composition", "app-ui", "t3-code", "project-switch", "hyfrme-port"],
  author: "Hyfrme", authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT",
  dimensions: fixture.viewport, duration: fixture.frames / fixture.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    { path: "licenses/T3-CODE-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt", type: "hyperframes:asset" },
    { path: "licenses/T3-THIRD_PARTY_NOTICES.md", target: "THIRD_PARTY_LICENSES/t3-code/T3-THIRD_PARTY_NOTICES.md", type: "hyperframes:asset" },
    { path: "licenses/VSCODE-ICONS-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/VSCODE-ICONS-LICENSE.txt", type: "hyperframes:asset" },
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2)}\n`);
await writeFile(resolve(output, "README.md"), `# T3 Code: Project Scope\n\nThis four-second, 1200 × 659 block reproduces T3 Code v${fixture.sourceTag.slice(1)} at 30 fps. The real project scope menu moves the sidebar from All projects to hyfrme-motion-lab and back to hyfrme. The chosen radio stays selected while the page is open; pinned v0.0.35 resets this scope to All projects on reload.\n\nCustomize both project names, the thread list, conversation, empty state, menu copy, and all five interaction beats through HyperFrames variables. Match project and thread values with adjacent T3 Code blocks for continuity. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. Installed files include T3 Code's MIT license, exact third-party notice, and the full vscode-icons MIT license. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.\n`);
console.log(`Generated ${name} from six native T3 Code states and three project-menu portals.`);
