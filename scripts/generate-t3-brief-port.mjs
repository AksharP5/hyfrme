import { readFile, mkdir, writeFile, copyFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourceDir = resolve(root, "assets/t3-code/v0.0.35");
const outputDir = resolve(root, "registry/blocks/t3-brief-to-prompt");
const fixture = JSON.parse(
  await readFile(resolve(sourceDir, "brief-fixture.json"), "utf8"),
);
const theme = JSON.parse(
  await readFile(resolve(sourceDir, "dark-theme.json"), "utf8"),
);
const shell = await readFile(resolve(sourceDir, "brief-shell.html"), "utf8");
const css = await readFile(resolve(sourceDir, "t3.css"), "utf8");
const gsap = await readFile(
  resolve(root, "registry/blocks/before-after/gsap.min.js"),
  "utf8",
);

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["branchName", "Branch name", "main"],
  ["threadOne", "Thread 1", "Build a logo intro"],
  ["threadTwo", "Thread 2", "Catalog motion audit"],
  ["threadThree", "Thread 3", "Grouped logo tests"],
  ["threadFour", "Thread 4", "Review final hold"],
  ["threadFive", "Thread 5", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ["threadOneAge", "Thread 1 age", "2h"],
  ["threadTwoAge", "Thread 2 age", "4h"],
  ["threadThreeAge", "Thread 3 age", "9h"],
  ["threadFourAge", "Thread 4 age", "1d"],
  ["threadFiveAge", "Thread 5 age", "2d"],
  ["settledAge", "Settled thread age", "1h"],
  ["modelName", "Model", "GPT-5.6-Sol"],
  ["reasoningLevel", "Reasoning", "Low"],
  ["permissionMode", "Permission", "Full access"],
  ["workspaceMode", "Workspace", "Current checkout"],
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
defaults.typingStart = fixture.typingStart;
defaults.typingEnd = fixture.typingEnd;
const textReplacements = Object.fromEntries(
  fields
    .filter(([id]) => id !== "prompt" && !id.endsWith("Age"))
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
  .t3-stage { ${stageTheme} width: 100%; height: 100%; overflow: hidden; background: oklch(14.5% 0 0); color: oklch(97% 0 0); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
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
for (const [name, value] of Object.entries(${safeScript(fontTheme)})) stage.style.setProperty(name, value);
stage.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
const replacements = ${safeScript(textReplacements)};
const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
let textNode;
while ((textNode = walker.nextNode())) {
  const current = textNode.textContent.trim();
  const key = replacements[current];
  if (key && options[key] !== defaults[key]) textNode.textContent = textNode.textContent.replace(current, options[key]);
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
  resolve(root, "parity/t3-gallery/assets/T3-CODE-LICENSE.txt"),
  resolve(outputDir, "licenses/T3-CODE-LICENSE.txt"),
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
        "A source-matched T3 Code workspace where a customizable prompt is typed into the composer, with editable project, thread, model, and workspace labels.",
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

This block reproduces the T3 Code v${fixture.sourceTag.slice(1)} dark workspace at 1200 × 659 and 30 fps. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. The T3 Code MIT license is installed with the composition.

Place it on a HyperFrames timeline as a four-second clip. Customize the project, branch, sidebar threads and ages, model, permission, workspace, and prompt through composition variables. Use the same values on adjacent T3 Code clips to keep the UI continuous. The prompt appears between typingStart and typingEnd (frame numbers 0–119).

The default fixture is parity checked against a local, synthetic T3 Code instance. Custom values are rendered with the same source-derived layout but are not independently compared with the live app. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.
`,
);
console.log("Generated t3-brief-to-prompt from pinned T3 Code DOM and CSS.");
