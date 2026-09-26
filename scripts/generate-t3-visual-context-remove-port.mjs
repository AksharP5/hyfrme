import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.35");
const name = "t3-visual-context-remove";
const output = resolve(root, ".work/t3-visual-context-remove-candidate");
const fixture = JSON.parse(
  await readFile(resolve(source, "visual-context-remove-fixture.json"), "utf8"),
);
const theme = JSON.parse(
  await readFile(resolve(source, "dark-theme.json"), "utf8"),
);
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(
  resolve(root, "registry/blocks/before-after/gsap.min.js"),
  "utf8",
);
const states = await Promise.all(
  fixture.phases.map((phase) =>
    readFile(resolve(source, `visual-context-remove-${phase}.html`), "utf8"),
  ),
);

const fields = [
  ["appName", "App name", "Code"],
  ["projectName", "Project name", "hyfrme"],
  ["branchName", "Branch name", "main"],
  ["thirdBranch", "Third thread branch", "logo/assemble"],
  ["fourthBranch", "Fourth thread branch", "logo/hold-final"],
  ["searchLabel", "Search label", "Search"],
  ["allProjectsLabel", "Projects label", "All projects"],
  ["settleLabel", "Settle label", "Settle"],
  ["settledLabel", "Settled group label", "Settled"],
  ["threadOne", "Thread 1", "Build a logo intro"],
  ["threadTwo", "Thread 2", "Catalog motion audit"],
  ["threadThree", "Thread 3", "Grouped logo tests"],
  ["threadFour", "Thread 4", "Review final hold"],
  ["threadFive", "Thread 5", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ...fixture.threadAges.map((age, index) => [`thread${index + 1}Age`, `Thread ${index + 1} age`, age]),
  ["settledAge", "Settled thread age", "8h"],
  ["openQuestion", "Open thread question", "Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames."],
  ["replyLead", "Open thread answer before file", "I found the Logo Enter timing in"],
  ["replyFile", "Open thread answer file", "logo-enter.html"],
  ["replyTail", "Open thread answer after file", ". The final pass can extend the duration while keeping the last rendered frame still."],
  ["questionTime", "Question time", "yesterday at 9:22 PM"],
  ["answerTime", "Answer time", "yesterday at 9:24 PM"],
  ["workedFor", "Open thread work duration", "Worked for 2m"],
  ["addAction", "Add action", "Add action"],
  ["openAction", "Open action", "Open"],
  ["commitAction", "Commit action", "Commit"],
  ["contextPrompt", "Reference instruction", fixture.prompt],
  ["imageSrc", "Reference image path", "t3-visual-context-logo-enter.png"],
  ["imageName", "Reference image name", fixture.imageName],
  ["providerStatus", "Provider status", "No provider available"],
  ["permissionMode", "Permission", "Full access"],
  ["workspaceMode", "Workspace", "Worktree"],
  ["composerPlaceholder", "Composer placeholder", "Enable a provider in Settings to send a message"],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "removeHoverFrame", type: "number", label: "Hover remove at frame", default: fixture.events.removeHover, min: 1, max: 100, step: 1 },
  { id: "removeFrame", type: "number", label: "Remove image at frame", default: fixture.events.remove, min: 2, max: 110, step: 1 },
  { id: "persistedFrame", type: "number", label: "Show persisted removal at frame", default: fixture.events.persisted, min: 3, max: 119, step: 1 },
];
const defaults = Object.fromEntries(fields.map(([id, , value]) => [id, value]));
defaults.removeHoverFrame = fixture.events.removeHover;
defaults.removeFrame = fixture.events.remove;
defaults.persistedFrame = fixture.events.persisted;
const textReplacements = Object.fromEntries(
  fields.filter(([id]) => !id.endsWith("Age") && !["contextPrompt", "imageSrc", "imageName"].includes(id))
    .map(([id, , value]) => [value, id]),
);
const fontTheme = Object.fromEntries(
  Object.entries(theme).filter(
    ([name]) =>
      name.includes("font-family") ||
      name === "--font-sans" ||
      name === "--font-mono",
  ),
);
const stageTheme = Object.entries(theme)
  .map(([key, value]) => `${key}:${value};`)
  .join("");
const escapeAttribute = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
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
  .t3-state[data-t3-state="remove-hover"] button[aria-label^="Remove "] { background-color: rgb(191 192 192); }
  .base-ui-disable-scrollbar { scrollbar-width: none; }
  .base-ui-disable-scrollbar::-webkit-scrollbar { display: none; }
  @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
  @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
  @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
  @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"); }
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
  <div class="dark t3-stage">
    ${states.map((state, index) => `<div class="t3-state" data-t3-state="${fixture.phases[index]}"${index ? " hidden" : ""}>${state}</div>`).join("\n    ")}
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
const ageKeys = ['thread1Age', 'thread2Age', 'thread3Age', 'thread4Age', 'thread5Age'];
for (const section of sections) {
  section.querySelectorAll('[data-testid="sidebar-row-card"]').forEach((row, index) => {
    const age = row.querySelector('span.tabular-nums.text-secondary-label');
    if (age && ageKeys[index]) age.textContent = options[ageKeys[index]];
  });
  const settledAge = section.querySelector('[data-testid="sidebar-row-slim"] .text-xs');
  if (settledAge) settledAge.textContent = options.settledAge;
  for (const editor of section.querySelectorAll('[data-testid="composer-editor"]')) {
    editor.setAttribute('aria-placeholder', options.composerPlaceholder);
  }
  for (const element of section.querySelectorAll('[aria-label], [title]')) {
    for (const attribute of ['aria-label', 'title']) {
      const label = element.getAttribute(attribute);
      if (!label) continue;
      let updated = label;
      for (const key of ['appName', 'projectName', 'branchName', 'thirdBranch', 'fourthBranch', 'searchLabel', 'allProjectsLabel', 'threadOne', 'threadTwo', 'threadThree', 'threadFour', 'threadFive', 'settledThread', 'addAction', 'openAction', 'commitAction']) {
        if (options[key] !== defaults[key]) updated = updated.replaceAll(defaults[key], String(options[key]));
      }
      if (updated !== label) element.setAttribute(attribute, updated);
    }
  }
}
for (let index = 0; index < sections.length; index++) {
  const section = sections[index];
  const prompt = section.querySelector('[data-testid="composer-editor"] [data-lexical-text]');
  if (prompt && options.contextPrompt !== defaults.contextPrompt) prompt.textContent = options.contextPrompt;
  const img = section.querySelector('img[alt$="logo-enter-final.png"]');
  if (!img) continue;
  if (options.imageSrc !== defaults.imageSrc) img.src = options.imageSrc;
  img.alt = options.imageName;
  img.closest('button')?.setAttribute('aria-label', 'Preview ' + options.imageName);
  img.parentElement?.parentElement?.querySelector('button[aria-label^="Remove "]')
    ?.setAttribute('aria-label', 'Remove ' + options.imageName);
}
const clock = { frame: 0 };
function draw() {
  const frame = Math.round(clock.frame);
  const removeHoverFrame = Number(options.removeHoverFrame);
  const removeFrame = Math.max(Number(options.removeFrame), removeHoverFrame + 1);
  const persistedFrame = Math.max(Number(options.persistedFrame), removeFrame + 1);
  const phase = frame < removeHoverFrame ? 0 : frame < removeFrame ? 1 : frame < persistedFrame ? 2 : 3;
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
await copyFile(resolve(source, "visual-context-shelf-logo-enter.png"), resolve(output, "t3-visual-context-logo-enter.png"));
await copyFile(
  resolve(root, "parity/t3-gallery/assets/T3-CODE-LICENSE.txt"),
  resolve(output, "licenses/T3-CODE-LICENSE.txt"),
);
await copyFile(resolve(root, "assets/remocn-additions/REMOCN-LICENSE.txt"), resolve(output, "licenses/REMOCN-LICENSE.txt"));
await copyFile(resolve(source, "thread-rename-t3-third-party-notices.md"), resolve(output, "licenses/T3-THIRD_PARTY_NOTICES.md"));
await writeFile(
  resolve(output, "registry-item.json"),
  `${JSON.stringify(
    {
      $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
      name,
      type: "hyperframes:block",
      title: "T3 Code: Visual Context Remove",
      description:
        "Remove a pasted Hyfrme Logo Enter frame from T3 Code's native composer attachment shelf.",
      tags: ["composition", "app-ui", "t3-code", "visual-context-remove", "hyfrme-port"],
      author: "Hyfrme",
      authorUrl: "https://github.com/AksharP5/hyfrme",
      license: "MIT",
      dimensions: fixture.viewport,
      duration: fixture.frames / fixture.fps,
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
          path: "t3-visual-context-logo-enter.png",
          target: "compositions/t3-visual-context-logo-enter.png",
          type: "hyperframes:asset",
        },
        {
          path: "licenses/REMOCN-LICENSE.txt",
          target: "THIRD_PARTY_LICENSES/remocn/REMOCN-LICENSE.txt",
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
  )}\n`,
);
await writeFile(
  resolve(output, "README.md"),
  `# T3 Code: Visual Context Remove

This four-second block reproduces the real T3 Code v${fixture.sourceTag.slice(1)} composer image removal at 1200 × 659 and 30 fps. The attached image is the final frame of Hyfrme's verified Logo Enter render. The native remove button clears the attachment shelf; the removed state remains after reload.

Change imageSrc to a path relative to the project root or an absolute URL, and imageName to its filename. contextPrompt controls the composer text. Set project, branch, thread, and age variables to match adjacent T3 Code clips. removeHoverFrame, removeFrame, and persistedFrame place the real state changes. The supplied frame comes from Hyfrme Logo Enter, which derives from MIT-licensed Remocn source; its license is included. T3 Code source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. The T3 Code MIT license and third-party icon notice are included. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.
`,
);
console.log(`Generated ${name} from four pinned T3 Code attachment-removal states.`);
