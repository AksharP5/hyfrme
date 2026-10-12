import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.35");
const name = "t3-commit-review";
const output = resolve(root, ".work/t3-commit-review-block");
const fixture = JSON.parse(await readFile(resolve(source, "commit-review-fixture.json"), "utf8"));
const theme = JSON.parse(await readFile(resolve(source, "dark-theme.json"), "utf8"));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const phases = ["before", "menu", "dialog", "message"];
const states = await Promise.all(phases.map((phase) => readFile(resolve(source, `commit-review-${phase}.html`), "utf8")));
for (let index = 0; index < states.length; index++) {
  states[index] = states[index].replace(
    'class="h-full max-h-[inherit] overflow-auto',
    'data-layout-allow-overflow class="h-full max-h-[inherit] overflow-auto',
  );
  states[index] = states[index].replaceAll(
    '<span class="pointer-events-none absolute left-1/2 top-1/2 size-[max(100%,3rem)]',
    '<span data-layout-allow-overflow class="pointer-events-none absolute left-1/2 top-1/2 size-[max(100%,3rem)]',
  );
  if (index > 0) states[index] = states[index].replace(
    '<div class="group/sidebar-wrapper',
    '<div data-layout-ignore class="group/sidebar-wrapper',
  );
}
const portals = await Promise.all(["menu", "dialog", "message"].map(async (phase) =>
  (await readFile(resolve(source, `commit-review-${phase}-portal.html`), "utf8"))
    .replace('data-base-ui-portal=""', 'data-base-ui-portal="" data-layout-ignore')));

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["draftTitle", "Draft title", "New thread"],
  ["threadOne", "Sidebar thread 1", "Build a logo intro"],
  ["threadTwo", "Sidebar thread 2", "Catalog motion audit"],
  ["threadThree", "Sidebar thread 3", "Grouped logo tests"],
  ["threadFour", "Sidebar thread 4", "Review final hold"],
  ["threadFive", "Sidebar thread 5", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ...fixture.threadAges.map((age, index) => [`thread${index + 1}Age`, `Thread ${index + 1} age`, age]),
  ...fixture.threadBranches.map((branch, index) => [`thread${index + 1}Branch`, `Thread ${index + 1} branch`, branch]),
  ["settledAge", "Settled thread age", fixture.settledAge],
  ["heading", "New thread heading", "What should we build in"],
  ["composerPlaceholder", "Composer placeholder", "Ask for changes, send follow-ups, or attach images"],
  ["modelName", "Model", "GPT-5.6-Sol"],
  ["reasoningLevel", "Reasoning", "Low"],
  ["permissionMode", "Permission", "Full access"],
  ["checkoutLabel", "Checkout label", "Current checkout"],
  ["branchName", "Branch", fixture.branch],
  ["commitAction", "Commit action", "Commit"],
  ["publishAction", "Publish action", "Publish repository..."],
  ["dialogTitle", "Dialog title", "Commit changes"],
  ["dialogDescription", "Dialog description", "Review and confirm your commit. Leave the message blank to auto-generate one."],
  ["branchLabel", "Branch label", "Branch"],
  ["filesLabel", "Files label", "Files"],
  ["editLabel", "Edit files label", "Edit"],
  ["changedFile", "Changed file", fixture.changedFile],
  ["insertions", "Added lines", fixture.insertions],
  ["deletions", "Removed lines", fixture.deletions],
  ["messageLabel", "Commit message label", "Commit message (optional)"],
  ["messagePlaceholder", "Commit message placeholder", "Leave empty to auto-generate"],
  ["commitMessage", "Typed commit message", fixture.commitMessage],
  ["cancelLabel", "Cancel button", "Cancel"],
  ["newRefLabel", "Commit on new ref button", "Commit on new refName"],
];
const variables = [
  ...fields.map(([id, label, value]) =>
    id === "insertions" || id === "deletions"
      ? { id, type: "number", label, default: value, min: 0, max: 9999, step: 1 }
      : { id, type: "string", label, default: value }),
  { id: "menuFrame", type: "number", label: "Open Git menu at frame", default: fixture.menuFrame, min: 0, max: 100, step: 1 },
  { id: "dialogFrame", type: "number", label: "Open review dialog at frame", default: fixture.dialogFrame, min: 1, max: 110, step: 1 },
  { id: "messageFrame", type: "number", label: "Type message at frame", default: fixture.messageFrame, min: 1, max: 119, step: 1 },
];
const defaults = Object.fromEntries(variables.map(({ id, default: value }) => [id, value]));
const textReplacements = Object.fromEntries(fields
  .filter(([id]) => !id.endsWith("Age") && !id.endsWith("Branch") && !["branchName", "insertions", "deletions", "commitMessage", "messagePlaceholder"].includes(id))
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
  .t3-stage [style*="t3-mobile-draft-headline"] h1 { transform: translateY(1px); }
  @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
  @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
  @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
  @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"); }
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
  <div class="dark t3-stage">
    <div class="t3-state" data-t3-state="before">${states[0]}</div>
    <div class="t3-state" data-t3-state="menu" hidden>${states[1]}${portals[0]}</div>
    <div class="t3-state" data-t3-state="dialog" hidden>${states[2]}${portals[1]}</div>
    <div class="t3-state" data-t3-state="message" hidden>${states[3]}${portals[2]}</div>
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
const branchKeys = ['thread1Branch', 'thread2Branch', 'thread3Branch', 'thread4Branch', 'thread5Branch'];
for (const section of sections) {
  section.querySelectorAll('[data-testid="sidebar-row-card"]').forEach((row, index) => {
    const age = row.querySelector('span.tabular-nums.text-secondary-label');
    if (age && ageKeys[index]) age.textContent = options[ageKeys[index]];
    const branch = row.querySelector('span.whitespace-nowrap');
    if (branch && branchKeys[index]) branch.textContent = options[branchKeys[index]];
  });
  const settledAge = section.querySelector('[data-testid="sidebar-row-slim"] span.text-xs');
  if (settledAge) settledAge.textContent = options.settledAge;
  for (const editor of section.querySelectorAll('[data-testid="composer-editor"]')) {
    editor.setAttribute('aria-placeholder', options.composerPlaceholder);
  }
  for (const label of section.querySelectorAll('[data-composer-label-motion]')) {
    if (label.textContent.trim() === defaults.branchName) label.textContent = options.branchName;
  }
  for (const textarea of section.querySelectorAll('textarea')) {
    textarea.placeholder = options.messagePlaceholder;
    if (section.dataset.t3State === 'message') {
      textarea.value = options.commitMessage;
      textarea.textContent = options.commitMessage;
    }
  }
  if (section.dataset.t3State === 'dialog' || section.dataset.t3State === 'message') {
    const dialog = section.querySelector('[role="dialog"]');
    for (const label of dialog.querySelectorAll('span.font-medium')) {
      if (label.textContent.trim() === defaults.branchName) label.textContent = options.branchName;
    }
    for (const path of dialog.querySelectorAll('bdi')) {
      if (path.textContent.trim() === defaults.changedFile) path.textContent = options.changedFile;
    }
    for (const added of dialog.querySelectorAll('.text-success')) {
      if (added.textContent.trim() === '+' + defaults.insertions) added.textContent = '+' + options.insertions;
    }
    for (const removed of dialog.querySelectorAll('.text-destructive')) {
      if (removed.textContent.trim() === '-' + defaults.deletions) removed.textContent = '-' + options.deletions;
    }
  }
}
const clock = { frame: 0 };
function draw() {
  const frame = Math.round(clock.frame);
  const dialogFrame = Math.max(Number(options.dialogFrame), Number(options.menuFrame) + 1);
  const messageFrame = Math.max(Number(options.messageFrame), dialogFrame + 1);
  const phase = frame < options.menuFrame ? 0 : frame < dialogFrame ? 1 : frame < messageFrame ? 2 : 3;
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
await copyFile(resolve(source, "commit-review-t3-third-party-notices.md"), resolve(output, "licenses/T3-THIRD_PARTY_NOTICES.md"));
await writeFile(resolve(output, "registry-item.json"), `${JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: Commit Review",
  description: "Open T3 Code's real Git action menu and review a changed Hyfrme Logo Enter file and commit message without committing.",
  tags: ["composition", "app-ui", "t3-code", "git", "commit-review", "hyfrme-port"],
  author: "Hyfrme", authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT",
  dimensions: fixture.viewport, duration: fixture.frames / fixture.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    { path: "licenses/T3-CODE-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt", type: "hyperframes:asset" },
    { path: "licenses/T3-THIRD_PARTY_NOTICES.md", target: "THIRD_PARTY_LICENSES/t3-code/T3-THIRD_PARTY_NOTICES.md", type: "hyperframes:asset" },
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2)}\n`);
await writeFile(resolve(output, "README.md"), `# T3 Code: Commit Review

This four-second, 1200 × 659 block reproduces T3 Code v${fixture.sourceTag.slice(1)} at 30 fps. In a real Hyfrme Git worktree, the native action menu opens and the Commit review dialog shows the changed Logo Enter source at +${fixture.insertions}/-${fixture.deletions}. A message is drafted but no commit runs.

Customize the project, branch, sidebar, file path, diff counts, commit message, labels, and transition frames through HyperFrames variables. Match project and thread values with adjacent T3 Code blocks for continuity. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. The installed files include T3 Code's MIT license and third-party icon notice. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.
`);
console.log(`Generated ${name} from four native T3 Code states and real Git dialog portals.`);
