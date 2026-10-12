import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-thread-switch";
const output = resolve(root, ".work/t3-thread-switch-v0042-candidate");
const fixture = JSON.parse(
  await readFile(resolve(source, "thread-switch-v0042-dark-fixture.json"), "utf8"),
);
const lightFixture = JSON.parse(await readFile(resolve(source, "thread-switch-v0042-light-fixture.json"), "utf8"));
if (fixture.sourceCommit !== lightFixture.sourceCommit || fixture.frames !== lightFixture.frames || fixture.fps !== lightFixture.fps) {
  throw new Error("Official dark and light fixture metadata differs");
}
for (const phase of fixture.phases) {
  const [dark, light] = await Promise.all(["dark", "light"].map((appearance) =>
    readFile(resolve(source, `thread-switch-v0042-${appearance}-${phase}.html`), "utf8")));
  const normalize = (html) => html.replace(/_r_[^_]+_/g, "_r_X_").replace("rgb(255, 163, 89)", "rgb(212, 118, 40)");
  if (normalize(dark) !== normalize(light)) throw new Error(`Native ${phase} DOM differs beyond theme color and generated IDs`);
}
const theme = JSON.parse(
  await readFile(resolve(source, "dark-theme.json"), "utf8"),
);
const lightTheme = JSON.parse(await readFile(resolve(source, "light-theme.json"), "utf8"));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const sprite = (await readFile(resolve(source, "file-surface-tree.html"), "utf8"))
  .match(/<symbol id="file-tree-builtin-html"[\s\S]*?<\/symbol>/)?.[0];
if (!sprite) throw new Error("Official T3 Code HTML file icon is missing");
const gsap = await readFile(
  resolve(root, "registry/blocks/before-after/gsap.min.js"),
  "utf8",
);
const states = await Promise.all(
  ["before", "first", "second"].map((phase) =>
    readFile(resolve(source, `thread-switch-v0042-dark-${phase}.html`), "utf8"),
  ),
);
for (let index = 0; index < states.length; index++) {
  states[index] = states[index]
    .replace(/(<span[^>]*class="[^"]*\[text-box:trim-both_cap_alphabetic\][^"]*")/g, "$1 data-layout-ignore")
    .replace(/(<span[^>]*class="pointer-events-none absolute[^"]*")/g, "$1 data-layout-ignore")
    .replace('class="h-full max-h-[inherit] overflow-auto', 'data-layout-allow-overflow class="h-full max-h-[inherit] overflow-auto')
    .replaceAll('<span class="pointer-events-none absolute left-1/2 top-1/2 size-[max(100%,3rem)]',
      '<span data-layout-allow-overflow class="pointer-events-none absolute left-1/2 top-1/2 size-[max(100%,3rem)]');
}


const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["projectAvatar", "Project avatar letters", "HE"],
  ["branchName", "Branch name", "main"],
  ["activeBranch", "Current thread branch", "feature/logo-enter"],
  ["thirdBranch", "Third thread branch", "logo/assemble"],
  ["fourthBranch", "Fourth thread branch", "logo/hold-final"],
  ["threadOne", "First thread title", "Build a logo intro"],
  ["threadTwo", "Second thread title", "Catalog motion audit"],
  ["threadThree", "Sidebar thread 3", "Grouped logo tests"],
  ["threadFour", "Sidebar thread 4", "Review final hold"],
  ["threadFive", "Sidebar thread 5", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ...["10h", "12h", "17h", "1d", "2d"].map((age, index) => [`thread${index + 1}Age`, `Thread ${index + 1} age`, age]),
  ["settledAge", "Settled thread age", "7h"],
  ["messageOne", "First user message", "Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames."],
  ["replyOneStart", "First reply before file", "I found the Logo Enter timing in"],
  ["replyOneFile", "First reply file", "logo-enter.html"],
  ["replyOneEnd", "First reply after file", ". The final pass can extend the duration while keeping the last rendered frame still."],
  ["messageTwo", "Second user message", "Which Hyfrme motion blocks need a fresh parity render?"],
  ["replyTwo", "Second reply", "Logo Enter and Answer Stream should be checked at their final frames. Their pinned reference and Hyfrme output must use matching dimensions, frame rate, and input values."],
  ["workedDuration", "Worked duration", "2m"],
  ["messageOneTime", "First message time", "yesterday at 9:22 PM"],
  ["replyOneTime", "First reply time", "yesterday at 9:24 PM"],
  ["messageTwoTime", "Second message time", "yesterday at 7:24 PM"],
  ["replyTwoTime", "Second reply time", "yesterday at 7:26 PM"],
  ["heroLead", "Empty thread heading before project", "What should we build in "],
  ["heroTail", "Empty thread heading after project", "?"],
  ["draftComposerPlaceholder", "Draft composer placeholder", "Ask for changes, send follow-ups, or attach images"],
  ["composerPlaceholder", "Composer placeholder", "Enable a provider in Settings to send a message"],
  ["providerStatus", "Provider status", "Open provider settings"],
  ["permissionMode", "Permission", "Full access"],
  ["workspaceMode", "Workspace", "Worktree"],
  ["modelName", "Model", "GPT-6-Astra"],
  ["reasoningLevel", "Reasoning", "Medium"],
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
    id: "firstSwitchFrame",
    type: "number",
    label: "Open first thread at frame",
    default: fixture.events.first,
    min: 0,
    max: 90,
    step: 1,
  },
  {
    id: "secondSwitchFrame",
    type: "number",
    label: "Open second thread at frame",
    default: fixture.events.second,
    min: 20,
    max: 119,
    step: 1,
  },
];
const defaults = Object.fromEntries(fields.map(([id, , value]) => [id, value]));
defaults.firstSwitchFrame = fixture.events.first;
defaults.secondSwitchFrame = fixture.events.second;
defaults.theme = "dark";
const textReplacements = Object.fromEntries(
  fields.filter(([id]) => !id.endsWith("Age") && !["workedDuration", "projectName", "projectAvatar", "heroLead", "heroTail"].includes(id))
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
  .t3-stage { ${stageTheme} position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--background); color: var(--foreground); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
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
  <div class="dark t3-stage"><svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;overflow:hidden" aria-hidden="true" data-layout-ignore>${sprite}</svg>
    <div class="t3-state" data-t3-state="before">${states[0]}</div>
    <div class="t3-state" data-t3-state="first" hidden>${states[1]}</div>
    <div class="t3-state" data-t3-state="second" hidden>${states[2]}</div>
  </div>
</div>
<script src="t3-code-gsap.min.js"></script>
<script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
const stage = document.querySelector('#root .t3-stage');
if (options.theme === 'light') {
  stage.classList.remove('dark');
  stage.classList.add('light');
  for (const [key, value] of Object.entries(${scriptJson(lightTheme)})) stage.style.setProperty(key, value);
  for (const element of stage.querySelectorAll('[style*="rgb(255, 163, 89)"]')) {
    element.style.color = 'rgb(212, 118, 40)';
  }
}
for (const [key, value] of Object.entries(${scriptJson(fontTheme)})) stage.style.setProperty(key, value);
stage.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
const replacements = ${scriptJson(textReplacements)};
const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
let node;
while ((node = walker.nextNode())) {
  const current = node.textContent.trim();
  if (current === defaults.projectName && options.projectName !== defaults.projectName) {
    node.textContent = node.textContent.replace(current, options.projectName);
    continue;
  }
  if (current === defaults.projectAvatar && options.projectAvatar !== defaults.projectAvatar) {
    node.textContent = node.textContent.replace(current, options.projectAvatar);
    continue;
  }
  const key = replacements[current];
  if (key && options[key] !== defaults[key]) node.textContent = node.textContent.replace(current, options[key]);
}
const sections = [...stage.querySelectorAll('[data-t3-state]')];
const ageKeys = ['thread1Age', 'thread2Age', 'thread3Age', 'thread4Age', 'thread5Age'];
for (const [sectionIndex, section] of sections.entries()) {
  section.querySelectorAll('[data-testid="sidebar-row-card"]').forEach((row, index) => {
    const age = row.querySelector('span.tabular-nums.text-secondary-label');
    if (age && ageKeys[index]) age.textContent = options[ageKeys[index]];
  });
  const settledAge = section.querySelector('[data-testid="sidebar-row-slim"] .text-xs');
  if (settledAge) settledAge.textContent = options.settledAge;
  for (const element of section.querySelectorAll('[data-testid="composer-editor"]')) {
    element.setAttribute('aria-placeholder', sectionIndex === 0 ? options.draftComposerPlaceholder : options.composerPlaceholder);
  }
}
for (const hero of sections[0].querySelectorAll('h1, h2')) {
  if (!hero.textContent?.startsWith(defaults.heroLead)) continue;
  for (const child of hero.childNodes) {
    if (child.nodeType !== Node.TEXT_NODE) continue;
    child.textContent = child.textContent.replace(defaults.heroLead, options.heroLead).replace(defaults.heroTail, options.heroTail);
  }
}
const worked = [...sections[1].querySelectorAll('span')]
  .find((element) => element.textContent === 'Worked for 2m');
if (worked) worked.textContent = 'Worked for ' + options.workedDuration;
const clock = { frame: 0 };
function draw() {
  const frame = Math.round(clock.frame);
  const secondSwitchFrame = Math.max(Number(options.secondSwitchFrame), Number(options.firstSwitchFrame) + 1);
  const phase = frame < options.firstSwitchFrame ? 0 : frame < secondSwitchFrame ? 1 : 2;
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
await copyFile(
  resolve(root, "public/ideas/assets/T3-CODE-LICENSE.txt"),
  resolve(output, "licenses/T3-CODE-LICENSE.txt"),
);
for (const file of ["T3-THIRD_PARTY_NOTICES.md", "PIERRE-TREES-LICENSE.md", "PIERRE-TREES-NOTICE.md"]) {
  await copyFile(resolve(root, "registry/blocks/t3-source-file-open/licenses", file), resolve(output, "licenses", file));
}
await writeFile(
  resolve(output, "registry-item.json"),
  `${JSON.stringify(
    {
      $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
      name,
      type: "hyperframes:block",
      title: "T3 Code: Thread Switch",
      description:
        "Switch from a new draft to two real T3 Code conversations in the full project workspace.",
      tags: ["composition", "app-ui", "t3-code", "thread-switch", "hyfrme-port"],
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
          path: "licenses/T3-CODE-LICENSE.txt",
          target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt",
          type: "hyperframes:asset",
        },
        ...["T3-THIRD_PARTY_NOTICES.md", "PIERRE-TREES-LICENSE.md", "PIERRE-TREES-NOTICE.md"].map((file) => ({
          path: `licenses/${file}`,
          target: `THIRD_PARTY_LICENSES/t3-code/${file}`,
          type: "hyperframes:asset",
        })),
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
  `# T3 Code: Thread Switch

This four-second block reproduces T3 Code v${fixture.sourceTag.slice(1)} in dark or light mode at 1200 × 659 and 30 fps. It opens a real Hyfrme fixture thread from the new-thread draft, then selects a second thread. The sidebar selection, breadcrumb, user messages, agent replies, and composer all come from pinned T3 Code DOM and CSS.

Set the same project, branch, thread, age, and message variables on adjacent T3 Code blocks for continuous clips. firstSwitchFrame and secondSwitchFrame control the two native hard switches. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. The installed files include the T3 Code MIT license and Pierre tree-icon Apache-2.0 license and notice. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.
`,
);
console.log(`Generated ${name} from the pinned T3 Code thread UI.`);
