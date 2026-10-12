import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.35");
const name = "t3-git-push";
const output = resolve(root, process.env.T3_BLOCK_DIR ?? ".work/t3-git-push-candidate");
const fixture = JSON.parse(await readFile(resolve(source, "git-push-fixture.json"), "utf8"));
const theme = JSON.parse(await readFile(resolve(source, "dark-theme.json"), "utf8"));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const states = await Promise.all(fixture.phases.map(async (phase) => {
  const html = await readFile(resolve(source, `git-push-${phase}.html`), "utf8");
  if (phase === "before") return html;
  return html
    .replace('<p>Build a six-second Hyfrme logo intro.', '<p data-layout-ignore>Build a six-second Hyfrme logo intro.')
    .replace('<div class="group/sidebar-wrapper', '<div data-layout-ignore class="group/sidebar-wrapper');
}));
const portals = await Promise.all(fixture.phases.map(async (phase) =>
  JSON.parse(await readFile(resolve(source, `git-push-${phase}-portals.json`), "utf8"))
    .map((portal) => portal.replace('data-base-ui-portal=""', 'data-base-ui-portal="" data-layout-ignore'))));
const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["selectedThread", "Selected thread", "Build a logo intro"],
  ["otherThread", "Sidebar thread 2", "Catalog motion audit"],
  ["threadThree", "Sidebar thread 3", "Grouped logo tests"],
  ["threadFour", "Sidebar thread 4", "Review final hold"],
  ["threadFive", "Sidebar thread 5", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ["branchName", "Branch", "hyfrme/logo-intro"],
  ["pushTarget", "Push target", "origin/hyfrme/logo-intro"],
  ["message", "User message", "Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames."],
  ["replyStart", "Reply before file", "I found the Logo Enter timing in"],
  ["replyFile", "Reply file", "logo-enter.html"],
  ["replyEnd", "Reply after file", ". The final pass can extend the duration while keeping the last rendered frame still."],
  ["workedDuration", "Worked duration", "2m"],
  ["actionName", "Action name", "Verify Hyfrme"],
  ["quickBefore", "Toolbar before push", "Push & create PR"],
  ["quickAfter", "Toolbar after push", "Create PR"],
  ["progressLabel", "Push progress", "Pushing..."],
  ["successCta", "Success action", "Create change request"],
  ["progressPrefix", "Elapsed prefix", "Running for "],
  ["successDuration", "Successful push duration", "5s"],
  ["composerPlaceholder", "Composer placeholder", "Enable a provider in Settings to send a message"],
  ["providerStatus", "Provider status", "No provider available"],
  ["permissionMode", "Permission", "Full access"],
  ["workspaceMode", "Workspace", "Worktree"],
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
const textReplacements = Object.fromEntries(fields.filter(([id]) => ![
  "projectName", "branchName", "pushTarget", "replyFile", "workedDuration", "composerPlaceholder", "progressPrefix", "successDuration", "quickAfter",
].includes(id)).map(([id, , value]) => [value, id]));
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
${states.map((state, index) => `    <div class="t3-state" data-t3-state="${fixture.phases[index]}"${index ? " hidden" : ""}>${state}${portals[index].join("")}</div>`).join("\n")}
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
    if (current === defaults.projectName && options.projectName !== defaults.projectName) node.textContent = options.projectName;
    if (current.includes(defaults.pushTarget) && options.pushTarget !== defaults.pushTarget) node.textContent = node.textContent.replaceAll(defaults.pushTarget, options.pushTarget);
    else if (current.includes(defaults.branchName) && options.branchName !== defaults.branchName) node.textContent = node.textContent.replaceAll(defaults.branchName, options.branchName);
    if (current === 'Running for 5s' && (options.progressPrefix !== defaults.progressPrefix || options.successDuration !== defaults.successDuration)) node.textContent = options.progressPrefix + options.successDuration;
    if (section.dataset.t3State === 'pushed' && current === defaults.quickAfter && options.quickAfter !== defaults.quickAfter) node.textContent = options.quickAfter;
  }
  for (const element of section.querySelectorAll('[aria-label], [title], [data-testid]')) {
    for (const attribute of ['aria-label', 'title']) {
      const value = element.getAttribute(attribute);
      if (!value) continue;
      let changed = value;
      for (const id of ['actionName', 'branchName', 'pushTarget', 'replyFile']) changed = changed.replaceAll(defaults[id], options[id]);
      if (changed !== value) element.setAttribute(attribute, changed);
    }
  }
  const replyFile = section.querySelector('.chat-markdown-file-link .truncate');
  if (replyFile) replyFile.textContent = options.replyFile;
  const worked = [...section.querySelectorAll('span')].find((element) => element.textContent === 'Worked for 2m');
  if (worked) worked.textContent = 'Worked for ' + options.workedDuration;
  for (const editor of section.querySelectorAll('[data-testid="composer-editor"]')) editor.setAttribute('aria-placeholder', options.composerPlaceholder);
}
const clock = { frame: 0 };
function draw() {
  const frame = Math.round(clock.frame);
  const names = ['menu', 'pushing', 'pushed'];
  const boundaries = [];
  names.forEach((name, index) => boundaries.push(Math.max(index ? boundaries[index - 1] + 1 : 0, Number(options[name + 'Frame']))));
  let phase = 0;
  while (phase < boundaries.length && frame >= boundaries[phase]) phase++;
  for (let index = 0; index < sections.length; index++) sections[index].hidden = index !== phase;
  if (phase === 2) {
    const elapsed = frame - boundaries[1];
    const seconds = elapsed < 16 ? 0 : elapsed < 31 ? 1 : 2;
    const description = sections[2].querySelector('[data-slot="toast-description"]');
    if (description) description.textContent = options.progressPrefix + seconds + 's';
    const toast = sections[2].querySelector('.dropdown-glass.absolute[data-type="loading"]');
    if (toast) {
      toast.style.transition = 'none';
      toast.style.transform = 'translateX(' + ([31, 12, 4, 1][elapsed] ?? 0) + 'px)';
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
await copyFile(resolve(root, "public/ideas/assets/T3-CODE-LICENSE.txt"), resolve(output, "licenses/T3-CODE-LICENSE.txt"));
await copyFile(resolve(source, "source-file-open-t3-third-party-notices.md"), resolve(output, "licenses/T3-THIRD_PARTY_NOTICES.md"));
await copyFile(resolve(source, "git-push-vscode-icons-license.txt"), resolve(output, "licenses/VSCODE-ICONS-LICENSE.txt"));
await writeFile(resolve(output, "registry-item.json"), `${JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name,
  type: "hyperframes:block",
  title: "T3 Code: Git Push",
  description: "Push a committed Hyfrme branch to an isolated local upstream and show T3 Code's native progress and success states.",
  tags: ["composition", "app-ui", "t3-code", "git-push", "hyfrme-port"],
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
    { path: "licenses/VSCODE-ICONS-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/VSCODE-ICONS-LICENSE.txt", type: "hyperframes:asset" },
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2)}\n`);
await writeFile(resolve(output, "README.md"), `# T3 Code: Git Push\n\nThis four-second block captures T3 Code v${fixture.sourceTag.slice(1)} at 1200 × 659 and 30 fps. The native app pushes one committed Hyfrme Logo Enter change to an isolated local bare repository and displays its real progress and success states. No external remote was contacted. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}.\n\nProject, threads, branch, push target, toolbar and toast copy, and three interaction beats are editable. The installed files include T3 Code's MIT license, the adapted vscode-icons MIT license, and T3's third-party notices. GSAP 3.14.2 is included for offline frame control under its Standard License: https://gsap.com/standard-license/.\n`);
console.log(`Generated ${name} from pinned native T3 Code Git Push UI.`);
