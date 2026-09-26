import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-project-source-picker";
const output = resolve(root, ".work/t3-project-source-picker-v0042-candidate");
const fixture = JSON.parse(
  await readFile(resolve(source, "project-source-picker-v0042-dark-fixture.json"), "utf8"),
);
const lightFixture = JSON.parse(await readFile(resolve(source, "project-source-picker-v0042-light-fixture.json"), "utf8"));
if (fixture.sourceCommit !== lightFixture.sourceCommit || fixture.frames !== lightFixture.frames || fixture.fps !== lightFixture.fps) {
  throw new Error("Official dark and light fixture metadata differs");
}
for (const phase of ["before", "open", "portal", "after"]) {
  const [dark, light] = await Promise.all(["dark", "light"].map((appearance) =>
    readFile(resolve(source, `project-source-picker-v0042-${appearance}-${phase}.html`), "utf8")));
  const normalizeIds = (html) => html.replace(/_r_[^_]+_/g, "_r_X_");
  if (normalizeIds(dark) !== normalizeIds(light)) throw new Error(`Native ${phase} DOM differs beyond generated IDs`);
}
const theme = JSON.parse(
  await readFile(resolve(source, "dark-theme.json"), "utf8"),
);
const lightTheme = JSON.parse(await readFile(resolve(source, "light-theme.json"), "utf8"));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(
  resolve(root, "registry/blocks/before-after/gsap.min.js"),
  "utf8",
);
const states = await Promise.all(
  ["before", "open", "portal", "after"].map((phase) =>
    readFile(resolve(source, `project-source-picker-v0042-dark-${phase}.html`), "utf8"),
  ),
);
for (let index = 0; index < states.length; index++) {
  states[index] = states[index]
    .replace(/(<span[^>]*class="[^"]*\[text-box:trim-both_cap_alphabetic\][^"]*")/g, "$1 data-layout-ignore")
    .replace(/(<span[^>]*class="pointer-events-none absolute[^"]*")/g, "$1 data-layout-ignore");
}
for (const index of [0, 1, 3]) {
  states[index] = states[index].replace(
    'class="h-full max-h-[inherit] overflow-auto',
    'data-layout-allow-overflow class="h-full max-h-[inherit] overflow-auto',
  );
  states[index] = states[index].replaceAll(
    '<span class="pointer-events-none absolute left-1/2 top-1/2 size-[max(100%,3rem)]',
    '<span data-layout-allow-overflow class="pointer-events-none absolute left-1/2 top-1/2 size-[max(100%,3rem)]',
  );
}
states[2] = states[2].replace("<div id=", "<div data-layout-ignore id=");
states[1] = states[1].replace(
  '<div class="group/sidebar-wrapper',
  '<div data-layout-ignore class="group/sidebar-wrapper',
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
  ["settledAge", "Settled thread age", "7h"],
  ["modelName", "Model", "GPT-6-Astra"],
  ["reasoningLevel", "Reasoning", "Medium"],
  ["permissionMode", "Permission", "Full access"],
  ["workspaceMode", "Workspace", "Current checkout"],
  ["heroLead", "Empty thread question before project", "What should we build in "],
  ["heroTail", "Empty thread question after project", "?"],
  ["composerPlaceholder", "Composer placeholder", "Ask for changes, send follow-ups, or attach images"],
  ["searchPlaceholder", "Source search placeholder", "Search..."],
  ["sourcesTitle", "Source list heading", "Sources"],
  ["localTitle", "Local source title", "Local folder"],
  ["localDescription", "Local source description", "Browse a folder on disk"],
  ["gitUrlTitle", "Git URL title", "Git URL"],
  ["gitUrlDescription", "Git URL description", "Clone from a remote URL"],
  ["githubTitle", "GitHub title", "GitHub repository"],
  ["githubDescription", "GitHub description", "Clone GitHub owner/repo"],
  ["azureTitle", "Azure DevOps title", "Azure DevOps repository"],
  ["azureDescription", "Azure DevOps description", "Clone Azure DevOps project/repository"],
  ["bitbucketTitle", "Bitbucket title", "Bitbucket repository"],
  ["bitbucketDescription", "Bitbucket description", "Clone Bitbucket workspace/repository"],
  ["forgejoTitle", "Forgejo title", "Forgejo / Gitea repository"],
  ["forgejoDescription", "Forgejo description", "Clone Forgejo / Gitea owner/repo"],
  ["gitlabTitle", "GitLab title", "GitLab repository"],
  ["gitlabDescription", "GitLab description", "Clone GitLab group/project"],
  ["setupRequired", "Unavailable provider badge", "Setup Required"],
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
    id: "openFrame",
    type: "number",
    label: "Open picker at frame",
    default: fixture.events.open,
    min: 0,
    max: 90,
    step: 1,
  },
  {
    id: "closeFrame",
    type: "number",
    label: "Close chooser at frame",
    default: fixture.events.close,
    min: 20,
    max: 119,
    step: 1,
  },
];
const defaults = Object.fromEntries(fields.map(([id, , value]) => [id, value]));
defaults.theme = "dark";
defaults.openFrame = fixture.events.open;
defaults.closeFrame = fixture.events.close;
const textReplacements = Object.fromEntries(
  fields
    .filter(([id]) => !id.endsWith("Age") && !["searchPlaceholder", "projectName", "projectAvatar", "heroLead", "heroTail"].includes(id))
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
  .t3-native-picker { position: absolute; z-index: 300; left: 280px; top: 40px; width: 640px; height: 500px; pointer-events: none; }
  .t3-native-picker[hidden] { display: none !important; }
  .base-ui-disable-scrollbar { scrollbar-width: none; }
  .base-ui-disable-scrollbar::-webkit-scrollbar { display: none; }
  @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
  @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
  @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
  @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"); }
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
  <div class="dark t3-stage">
    <div class="t3-state" data-t3-state="before">${states[0]}</div>
    <div class="t3-state" data-t3-state="open" hidden>${states[1]}${states[2]}</div>
    <div class="t3-state" data-t3-state="after" hidden>${states[3]}</div>
    <img class="t3-native-picker" src="project-source-picker-v0042-dark-menu-crop.png" width="640" height="500" alt="" aria-hidden="true" data-layout-ignore hidden>
  </div>
</div>
<script src="t3-code-gsap.min.js"></script>
<script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
const stage = document.querySelector('#root .t3-stage');
const nativePicker = stage.querySelector('.t3-native-picker');
const nativePickerAllowed = Object.keys(defaults).every(key => ['theme', 'openFrame', 'closeFrame'].includes(key) || options[key] === defaults[key]);
if (options.theme === 'light') {
  stage.classList.remove('dark');
  stage.classList.add('light');
  for (const [key, value] of Object.entries(${scriptJson(lightTheme)})) stage.style.setProperty(key, value);
  nativePicker.src = nativePicker.src.replace('dark-', 'light-');
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
for (const element of stage.querySelectorAll('[aria-label], [title]')) {
  for (const attribute of ['aria-label', 'title']) {
    const value = element.getAttribute(attribute);
    if (value && value.includes(defaults.projectName) && options.projectName !== defaults.projectName) {
      element.setAttribute(attribute, value.replaceAll(defaults.projectName, options.projectName));
    }
  }
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
const search = sections[1].querySelector('input[data-slot="autocomplete-input"]');
if (search) search.setAttribute('placeholder', options.searchPlaceholder);
for (const section of sections) {
  for (const hero of section.querySelectorAll('h1, h2')) {
    if (hero.textContent?.includes(defaults.projectName) && hero.textContent?.startsWith(defaults.heroLead)) {
      for (const child of hero.childNodes) {
        if (child.nodeType !== Node.TEXT_NODE) continue;
        child.textContent = child.textContent.replace(defaults.heroLead, options.heroLead).replace(defaults.heroTail, options.heroTail);
      }
    }
  }
}
const clock = { frame: 0 };
function draw() {
  const frame = Math.round(clock.frame);
  const closeFrame = Math.max(Number(options.closeFrame), Number(options.openFrame) + 1);
  const phase = frame < options.openFrame ? 0 : frame < closeFrame ? 1 : 2;
  for (let index = 0; index < sections.length; index++) sections[index].hidden = index !== phase;
  nativePicker.hidden = phase !== 1 || !nativePickerAllowed;
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
for (const appearance of ["dark", "light"]) {
  await copyFile(resolve(source, `project-source-picker-v0042-${appearance}-menu-crop.png`),
    resolve(output, `project-source-picker-v0042-${appearance}-menu-crop.png`));
}
await copyFile(
  resolve(root, "parity/t3-gallery/assets/T3-CODE-LICENSE.txt"),
  resolve(output, "licenses/T3-CODE-LICENSE.txt"),
);
await writeFile(
  resolve(output, "registry-item.json"),
  `${JSON.stringify(
    {
      $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
      name,
      type: "hyperframes:block",
      title: "T3 Code: Project Source Picker",
      description:
        "Open T3 Code's real New project source chooser in the full Hyfrme workspace, then close it back to the draft.",
      tags: ["composition", "app-ui", "t3-code", "project-source", "hyfrme-port"],
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
        ...["dark", "light"].map((appearance) => ({
          path: `project-source-picker-v0042-${appearance}-menu-crop.png`,
          target: `compositions/project-source-picker-v0042-${appearance}-menu-crop.png`,
          type: "hyperframes:asset",
        })),
        {
          path: "licenses/T3-CODE-LICENSE.txt",
          target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt",
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
  `# T3 Code: Project Source Picker

This four-second block reproduces T3 Code v${fixture.sourceTag.slice(1)} in dark or light mode at 1200 × 659 and 30 fps. It starts in the full Hyfrme workspace, opens the real New project source chooser, and closes it with Escape. The chooser shows Local folder, Git URL, GitHub repository, and the native Setup Required states for Azure DevOps, Bitbucket, Forgejo / Gitea, and GitLab in this seeded fixture. No repository account data is embedded.

The default chooser uses a cropped pixel capture from the pinned native dark/light recording. Editing visible text switches the chooser to source DOM so the content remains customizable. Set the same project, branch, thread, age, and composer variables on adjacent T3 Code blocks for a continuous workspace. The chooser opens at openFrame and closes at closeFrame. Source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. The installed files include the T3 Code MIT license. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.
`,
);
console.log(`Generated ${name} from the pinned T3 Code New project source chooser.`);
