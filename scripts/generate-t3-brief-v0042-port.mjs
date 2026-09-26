import { readFile, mkdir, writeFile, copyFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourceDir = resolve(root, "assets/t3-code/v0.0.42");
const outputDir = resolve(root, ".work/t3-brief-v0042-candidate");
const fixture = JSON.parse(
  await readFile(resolve(sourceDir, "brief-v0042-fixture.json"), "utf8"),
);
const theme = JSON.parse(
  await readFile(resolve(sourceDir, "dark-theme.json"), "utf8"),
);
const lightTheme = JSON.parse(await readFile(resolve(sourceDir, "light-theme.json"), "utf8"));
const shell = (await readFile(resolve(sourceDir, "brief-v0042-shell.html"), "utf8"))
  .replace(/(<span[^>]*class="[^"]*\[text-box:trim-both_cap_alphabetic\][^"]*")/g, "$1 data-layout-ignore")
  .replace(/(<span[^>]*class="pointer-events-none absolute[^"]*")/g, "$1 data-layout-ignore");
const css = await readFile(resolve(sourceDir, "t3.css"), "utf8");
const gsap = await readFile(
  resolve(root, "registry/blocks/before-after/gsap.min.js"),
  "utf8",
);

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["projectAvatar", "Project avatar letters", "HE"],
  ["branchName", "Branch name", "main"],
  ["activeBranch", "Active branch", "feature/logo-enter"],
  ["thirdBranch", "Third thread branch", "logo/assemble"],
  ["fourthBranch", "Fourth thread branch", "logo/hold-final"],
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
  ["modelName", "Model", "GPT-6-Astra"],
  ["reasoningLevel", "Reasoning", "Medium"],
  ["permissionMode", "Permission", "Full access"],
  ["workspaceMode", "Workspace", "Current checkout"],
  ["heroLead", "Empty thread question before project", "What should we build in "],
  ["heroTail", "Empty thread question after project", "?"],
  ["newThreadTitle", "Thread title", "New thread"],
  [
    "placeholder",
    "Prompt placeholder",
    "Ask for changes, send follow-ups, or attach images",
  ],
  ["prompt", "Typed prompt", fixture.prompt],
];
const variables = [
  ...fields.map(([id, label, value]) => ({
    id,
    type: "string",
    label,
    default: value,
  })),
  { id: "theme", type: "string", label: "T3 Code appearance", default: "dark", options: ["dark", "light"] },
  {
    id: "typingStart",
    type: "number",
    label: "Typing starts at frame",
    default: fixture.typingStart,
    min: 0,
    max: 90,
    step: 1,
  },
  {
    id: "typingEnd",
    type: "number",
    label: "Typing ends at frame",
    default: fixture.typingEnd,
    min: 20,
    max: 119,
    step: 1,
  },
];
const defaults = Object.fromEntries(fields.map(([id, , value]) => [id, value]));
defaults.theme = "dark";
defaults.typingStart = fixture.typingStart;
defaults.typingEnd = fixture.typingEnd;
const textReplacements = Object.fromEntries(fields
  .filter(([id]) => id !== "prompt" && !id.endsWith("Age") && id !== "projectName" && id !== "projectAvatar" && id !== "heroLead" && id !== "heroTail")
  .map(([id, , value]) => [value, id]));
const fontTheme = Object.fromEntries(
  Object.entries(theme).filter(
    ([name]) =>
      name.includes("font-family") ||
      name === "--font-sans" ||
      name === "--font-mono",
  ),
);
const escapeAttribute = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const safeScript = (value) => JSON.stringify(value).replaceAll("</", "<\\/");
const stageTheme = Object.entries(theme)
  .map(([name, value]) => `${name}:${value};`)
  .join("");

const html = `<!doctype html>
<html lang="en" data-composition-variables='${escapeAttribute(JSON.stringify(variables))}'>
<head><meta charset="utf-8"></head>
<body>
<template>
<style>${css}</style>
<style>
  #root { position: relative; width: 100%; height: 100%; overflow: hidden; }
  .t3-stage { ${stageTheme} position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--background); color: var(--foreground); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
  .base-ui-disable-scrollbar { scrollbar-width: none; }
  .base-ui-disable-scrollbar::-webkit-scrollbar { display: none; }
  @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
  @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
  @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
  @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"); }
</style>
<div id="root" data-composition-id="t3-brief-to-prompt" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
  <div class="dark t3-stage">${shell}</div>
</div>
<script src="t3-code-gsap.min.js"></script>
<script>
window.__timelines = window.__timelines || {};
const defaults = ${safeScript(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
const stage = document.querySelector('#root .t3-stage');
if (options.theme === 'light') {
  stage.classList.remove('dark');
  stage.classList.add('light');
  for (const [key, value] of Object.entries(${safeScript(lightTheme)})) stage.style.setProperty(key, value);
}
for (const [name, value] of Object.entries(${safeScript(fontTheme)})) stage.style.setProperty(name, value);
stage.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
const replacements = ${safeScript(textReplacements)};
const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
let textNode;
while ((textNode = walker.nextNode())) {
  const current = textNode.textContent.trim();
  if (current === defaults.projectName && options.projectName !== defaults.projectName) {
    textNode.textContent = textNode.textContent.replace(current, options.projectName);
    continue;
  }
  if (current === defaults.projectAvatar && options.projectAvatar !== defaults.projectAvatar) {
    textNode.textContent = textNode.textContent.replace(current, options.projectAvatar);
    continue;
  }
  const key = replacements[current];
  if (key && options[key] !== defaults[key]) textNode.textContent = textNode.textContent.replace(current, options[key]);
}
for (const element of stage.querySelectorAll('[aria-label], [title]')) {
  for (const attribute of ['aria-label', 'title']) {
    const original = element.getAttribute(attribute);
    if (!original) continue;
    let updated = original;
    for (const key of ['projectName', 'projectAvatar', 'branchName', 'activeBranch', 'newThreadTitle']) {
      if (options[key] !== defaults[key]) updated = updated.replaceAll(defaults[key], String(options[key]));
    }
    if (updated !== original) element.setAttribute(attribute, updated);
  }
}
const hero = stage.querySelector('h1');
if (hero) {
  if (hero.firstChild?.nodeType === Node.TEXT_NODE) hero.firstChild.textContent = options.heroLead;
  if (hero.lastChild?.nodeType === Node.TEXT_NODE) hero.lastChild.textContent = options.heroTail;
}
const ageKeys = ['threadOneAge', 'threadTwoAge', 'threadThreeAge', 'threadFourAge', 'threadFiveAge'];
stage.querySelectorAll('[data-testid="sidebar-row-card"]').forEach((row, index) => {
  const age = row.querySelector('span.tabular-nums.text-secondary-label');
  if (age && ageKeys[index]) age.textContent = options[ageKeys[index]];
});
const settledAge = stage.querySelector('[data-testid="sidebar-row-slim"] .text-xs');
if (settledAge) settledAge.textContent = options.settledAge;
const editor = stage.querySelector('[data-testid="composer-editor"]');
const paragraph = editor.querySelector('p');
const placeholder = editor.parentElement.querySelector('.pointer-events-none.absolute');
const submit = editor.closest('form').querySelector('button[type="submit"]');
const clock = { frame: 0 };
function draw() {
  const frame = Math.round(clock.frame);
  const progress = Math.max(0, Math.min(1, (frame - options.typingStart) / Math.max(1, options.typingEnd - options.typingStart)));
  const count = Math.round(options.prompt.length * progress);
  if (count === 0) {
    paragraph.innerHTML = '<br>';
    placeholder.hidden = false;
    submit.disabled = true;
    return;
  }
  let span = paragraph.querySelector('[data-lexical-text]');
  if (!span) {
    span = document.createElement('span');
    span.setAttribute('data-lexical-text', 'true');
    paragraph.replaceChildren(span);
  }
  span.textContent = options.prompt.slice(0, count);
  placeholder.hidden = true;
  submit.disabled = false;
}
draw();
const timeline = gsap.timeline({ paused: true });
timeline.to(clock, { frame: 119, duration: 4, ease: 'none', onUpdate: draw });
window.__timelines['t3-brief-to-prompt'] = timeline;
</script>
</template>
</body>
</html>
`;

await mkdir(resolve(outputDir, "licenses"), { recursive: true });
await writeFile(resolve(outputDir, "t3-brief-to-prompt.html"), html);
await writeFile(resolve(outputDir, "t3-code-gsap.min.js"), gsap);
await copyFile(
  resolve(root, "public/ideas/assets/T3-CODE-LICENSE.txt"),
  resolve(outputDir, "licenses/T3-CODE-LICENSE.txt"),
);
await copyFile(
  resolve(root, "registry/blocks/t3-thread-unpin/licenses/T3-THIRD_PARTY_NOTICES.md"),
  resolve(outputDir, "licenses/T3-THIRD_PARTY_NOTICES.md"),
);
await writeFile(
  resolve(outputDir, "registry-item.json"),
  `${JSON.stringify(
    {
      $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
      name: "t3-brief-to-prompt",
      type: "hyperframes:block",
      title: "T3 Code: Brief to Prompt",
      description:
        "A T3 Code v0.0.42 workspace where a customizable prompt is typed into the native composer, with editable project, thread, model, and workspace labels.",
      tags: ["composition", "app-ui", "t3-code", "prompt", "hyfrme-port"],
      author: "Hyfrme",
      authorUrl: "https://github.com/AksharP5/hyfrme",
      license: "MIT",
      dimensions: fixture.viewport,
      duration: fixture.frames / fixture.fps,
      files: [
        {
          path: "t3-brief-to-prompt.html",
          target: "compositions/t3-brief-to-prompt.html",
          type: "hyperframes:composition",
        },
        {
          path: "t3-code-gsap.min.js",
          target: "compositions/t3-code-gsap.min.js",
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
          target: "compositions/t3-brief-to-prompt.README.md",
          type: "hyperframes:asset",
        },
      ],
    },
    null,
    2,
  )}\n`,
);
await writeFile(
  resolve(outputDir, "README.md"),
  `# T3 Code: Brief to Prompt

This block reproduces the T3 Code ${fixture.sourceTag} workspace in dark or light at 1200 × 659 and 30 fps. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. T3 Code's MIT license and third-party icon notice are installed with the composition.

Place it on a HyperFrames timeline as a four-second clip. Set theme to dark or light, and customize the project, avatar, branch, sidebar threads and ages, model, permission, workspace, empty-thread copy, and prompt through composition variables. Use the same values on adjacent T3 Code clips to keep the UI continuous. The prompt appears between typingStart and typingEnd (frame numbers 0–119).

The default dark and light fixtures were each checked against 120 native frames captured from the official T3 Code ${fixture.sourceTag} release. Custom values were checked in HyperFrames but have no native T3 Code reference. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.
`,
);
console.log("Generated t3-brief-to-prompt candidate from native T3 Code v0.0.42 DOM and CSS.");
