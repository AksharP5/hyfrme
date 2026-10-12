import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { nativeT3MonoFaces } from "./t3-native-fonts.mjs";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-project-switch";
const output = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, `.work/${name}-v0042-candidate`));
const fixtures = Object.fromEntries(await Promise.all(["dark", "light"].map(async (theme) => [
  theme, JSON.parse(await readFile(resolve(source, `project-switch-v0042-${theme}-fixture.json`), "utf8")),
])));
const { dark, light } = fixtures;
if (dark.sourceCommit !== light.sourceCommit || dark.frames !== light.frames || dark.fps !== light.fps ||
  JSON.stringify(dark.events) !== JSON.stringify(light.events)) throw new Error("Official theme fixtures differ");
const themes = Object.fromEntries(await Promise.all(["dark", "light"].map(async (theme) => [
  theme, JSON.parse(await readFile(resolve(source, `${theme}-theme.json`), "utf8")),
])));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const sprite = (await readFile(resolve(source, "file-surface-tree.html"), "utf8"))
  .match(/<symbol id="file-tree-builtin-html"[\s\S]*?<\/symbol>/)?.[0];
if (!sprite) throw new Error("Official T3 Code HTML file icon is missing");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const popupPhases = ["menu", "motion-menu", "hyfrme-menu"];
const dropdownClass = "dropdown-glass relative flex max-h-full min-w-(--anchor-width) origin-(--transform-origin) rounded-lg shadow-[0_16px_40px_-18px_rgb(0_0_0/55%)] transition-[scale,opacity] dark:shadow-[0_18px_44px_-18px_rgb(0_0_0/80%)] max-w-[min(18rem,var(--available-width))] overflow-hidden";
const states = Object.fromEntries(await Promise.all(["dark", "light"].map(async (theme) => [theme,
  await Promise.all(dark.phases.map(async (phase) => {
    let body = await readFile(resolve(source, `project-switch-v0042-${theme}-${phase}.html`), "utf8");
    body = body.replace('class="h-full max-h-[inherit] overflow-auto', 'data-layout-allow-overflow class="h-full max-h-[inherit] overflow-auto')
      .replace(/(<span[^>]*class="[^"]*\[text-box:trim-both_cap_alphabetic\][^"]*")/g, "$1 data-layout-ignore")
      .replace(/(<span[^>]*class="pointer-events-none absolute[^"]*")/g, "$1 data-layout-allow-overflow");
    body = body.replaceAll('data-message-role="user"', 'data-message-role="user" data-t3-native-hover');
    if (popupPhases.includes(phase)) {
      body = body.replace('<div class="group/sidebar-wrapper', '<div data-layout-ignore class="group/sidebar-wrapper');
      const portal = await readFile(resolve(source, `project-switch-v0042-${theme}-${phase}-portal.html`), "utf8");
      body += `<div class="t3-project-positioner z-[130] select-none" data-slot="combobox-positioner" data-layout-ignore><span class="${dropdownClass}">${portal}</span></div>`;
    }
    return body;
  })),
])));
const fields = [
  ["projectName", "First project", "hyfrme"],
  ["motionProject", "Second project", "hyfrme-motion-lab"],
  ["allProjects", "All projects option", "All projects"],
  ["emptyMessage", "Second project empty state", "No threads in hyfrme-motion-lab yet"],
  ["projectAvatar", "First project avatar", "HE"],
  ["motionAvatar", "Second project avatar", "HL"],
  ["firstThread", "Selected thread", "Build a logo intro"],
  ["secondThread", "Second thread", "Catalog motion audit"],
  ["thirdThread", "Third thread", "Grouped logo tests"],
  ["fourthThread", "Fourth thread", "Review final hold"],
  ["fifthThread", "Fifth thread", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ["branchName", "Selected branch", "feature/logo-enter"],
  ["thirdBranch", "Third thread branch", "logo/assemble"],
  ["fourthBranch", "Fourth thread branch", "logo/hold-final"],
  ["question", "User message", "Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames."],
  ["replyLead", "Answer opening", "I found the Logo Enter timing in"],
  ["fileMention", "Answer file mention", "logo-enter.html"],
  ["replyTail", "Answer ending", "The final pass can extend the duration while keeping the last rendered frame still."],
  ["workedDuration", "Agent duration", "Worked for 2m"],
  ["composerPlaceholder", "Composer placeholder", "Enable a provider in Settings to send a message"],
  ["providerStatus", "Provider status", "Open provider settings"],
  ["workspaceMode", "Workspace mode", "Worktree"],
  ["searchProjects", "Project search placeholder", "Search projects..."],
  ["sidebarSearch", "Sidebar search label", "Search"],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "theme", type: "string", label: "T3 Code appearance", default: "dark", options: ["dark", "light"] },
  ...Object.entries(dark.events).map(([id, value]) => ({ id: `${id}Frame`, type: "number",
    label: `${id.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)} at frame`, default: value,
    min: 1, max: 119, step: 1 })),
];
const defaults = Object.fromEntries(variables.map(({ id, default: value }) => [id, value]));
const replacementFields = fields.filter(([id]) => !["projectName", "motionProject", "projectAvatar", "motionAvatar", "emptyMessage", "sidebarSearch"].includes(id));
const replacements = Object.fromEntries(replacementFields.map(([id, , value]) => [value, id]));
const themeStyles = Object.fromEntries(Object.entries(themes).map(([theme, values]) => [theme,
  Object.entries(values).map(([key, value]) => `${key}:${value};`).join(""),
]));
const fontTheme = Object.fromEntries(Object.entries(themes.dark).filter(([key]) =>
  key.includes("font-family") || key === "--font-sans" || key === "--font-mono"));
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const scriptJson = (value) => JSON.stringify(value).replaceAll("</", "<\\/");

const html = `<!doctype html>
<html lang="en" data-composition-variables='${escapeAttribute(JSON.stringify(variables))}'>
<head><meta charset="utf-8"></head><body><template>
<style>${css}</style>
<style>
#root { position:relative; width:100%; height:100%; overflow:hidden; }
.t3-stage { position:relative; width:100%; height:100%; overflow:hidden; background:var(--background); color:var(--foreground); font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif; }
/* Preserve native T3 typography when HyperFrames compiles the block. */
  .t3-stage, .t3-stage *:not([text-rendering]) { text-rendering: auto; }
  /* Native Submit buttons must not animate inherited clip visibility. */
  .t3-stage button[type="submit"].transition-all { transition-property: background-color, color, box-shadow, transform, scale, opacity; }
.t3-state[hidden], .t3-stage[hidden], .t3-native-popup[hidden] { display:none !important; }
.t3-state:not([hidden]) { display:contents; }
.t3-project-positioner { position:fixed; top:0; left:0; }
.t3-stage [data-t3-native-hover] .opacity-0.transition-opacity { opacity:1; }
.t3-native-popup { position:absolute; left:6px; top:90px; z-index:300; width:240px; height:153px; pointer-events:none; }
.base-ui-disable-scrollbar { scrollbar-width:none; }
.base-ui-disable-scrollbar::-webkit-scrollbar { display:none; }
@font-face { font-family:"Apple Color Emoji"; src:local("Apple Color Emoji"); }
@font-face { font-family:"Segoe UI Emoji"; src:local("Segoe UI Emoji"); }
@font-face { font-family:"Segoe UI Symbol"; src:local("Segoe UI Symbol"); }
@font-face { font-family:"SFMono-Regular"; src:local("SFMono-Regular"); }
${nativeT3MonoFaces}
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;overflow:hidden" aria-hidden="true" data-layout-ignore>${sprite}</svg>
${["dark", "light"].map((theme) => `<div class="t3-stage ${theme}" data-t3-theme="${theme}" style="${themeStyles[theme].replaceAll('"', '&quot;')}"${theme === "light" ? " hidden" : ""}>
${states[theme].map((body, index) => `<div class="t3-state" data-t3-state="${dark.phases[index]}"${index ? " hidden" : ""}>${body}</div>`).join("\n")}
${popupPhases.map((phase) => `<img class="t3-native-popup" data-t3-popup="${phase}" src="project-switch-v0042-${theme}-${phase}-crop.png" alt="" aria-hidden="true" data-layout-ignore hidden>`).join("\n")}
</div>`).join("\n")}
</div>
<script src="t3-code-gsap.min.js"></script>
<script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
const replacements = ${scriptJson(replacements)};
const stages = [...document.querySelectorAll('#root [data-t3-theme]')];
const nativePopupAllowed = Object.keys(defaults).every(key => key === 'theme' || key.endsWith('Frame') || options[key] === defaults[key]);
for (const stage of stages) {
  stage.hidden = stage.dataset.t3Theme !== options.theme;
  for (const [key, value] of Object.entries(${scriptJson(fontTheme)})) stage.style.setProperty(key, value);
  stage.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
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
    if (current === defaults.projectAvatar && options.projectAvatar !== defaults.projectAvatar) {
      node.textContent = node.textContent.replace(current, String(options.projectAvatar));
      continue;
    }
    if (current === defaults.motionAvatar && options.motionAvatar !== defaults.motionAvatar) {
      node.textContent = node.textContent.replace(current, String(options.motionAvatar));
      continue;
    }
    if (current === defaults.projectName && options.projectName !== defaults.projectName) {
      node.textContent = node.textContent.replace(current, String(options.projectName));
      continue;
    }
    if (current === defaults.sidebarSearch && options.sidebarSearch !== defaults.sidebarSearch) {
      node.textContent = node.textContent.replace(current, String(options.sidebarSearch));
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
  for (const section of stage.querySelectorAll('[data-t3-state]')) {
    const editor = section.querySelector('[data-testid="composer-editor"]');
    if (editor) editor.setAttribute('aria-placeholder', options.composerPlaceholder);
    const search = section.querySelector('[data-slot="combobox-popup"] input[aria-label="Search projects"]');
    if (search) search.setAttribute('placeholder', options.searchProjects);
    for (const element of section.querySelectorAll('[aria-label], [title]')) {
      for (const attribute of ['aria-label', 'title']) {
        const value = element.getAttribute(attribute);
        if (!value) continue;
        let next = value;
        for (const id of ['projectName', 'motionProject', 'firstThread', 'secondThread', 'thirdThread', 'fourthThread', 'fifthThread', 'branchName', 'thirdBranch', 'fourthBranch']) {
          if (options[id] !== defaults[id]) next = next.replaceAll(defaults[id], String(options[id]));
        }
        if (next !== value) element.setAttribute(attribute, next);
      }
    }
  }
}
for (const stage of stages) {
  const stageRect = stage.getBoundingClientRect();
  for (const section of stage.querySelectorAll('[data-t3-state]')) {
    const positioner = section.querySelector('.t3-project-positioner');
    if (!positioner) continue;
    const trigger = section.querySelector('[role="combobox"][aria-label^="Filter threads by project"]');
    if (!trigger) throw new Error('Captured project scope trigger is missing');
    // Hidden captured phases share the sidebar anchor of their visible source shell.
    const anchor = stages.find(stage => !stage.hidden)?.querySelector('input[aria-label="Search threads"]')?.closest('div.flex.h-8');
    if (!anchor) throw new Error('Captured native search-field anchor is missing');
    const rect = anchor.getBoundingClientRect();
    positioner.style.transform = 'translate(' + (rect.left - stageRect.left) + 'px, ' + (rect.bottom - stageRect.top + 4) + 'px)';
    positioner.style.setProperty('--anchor-width', rect.width + 'px');
    positioner.style.setProperty('--available-width', (1200 - rect.left) + 'px');
    positioner.style.setProperty('--available-height', (659 - rect.bottom - 4) + 'px');
  }
}
const clock = { frame: 0 };
function draw() {
  const frame = Math.round(clock.frame);
  const boundaries = [options.menuFrame, options.motionFrame, options.motionMenuFrame, options.hyfrmeFrame, options.hyfrmeMenuFrame];
  for (let index = 1; index < boundaries.length; index++) boundaries[index] = Math.max(Number(boundaries[index]), Number(boundaries[index - 1]) + 1);
  const phase = boundaries.findIndex(boundary => frame < boundary);
  const active = phase === -1 ? 5 : phase;
  for (const stage of stages) {
    const sections = [...stage.querySelectorAll('[data-t3-state]')];
    for (let index = 0; index < sections.length; index++) sections[index].hidden = index !== active;
    for (const image of stage.querySelectorAll('[data-t3-popup]')) image.hidden = !nativePopupAllowed || image.dataset.t3Popup !== sections[active].dataset.t3State;
  }
}
draw();
const timeline = gsap.timeline({ paused:true });
timeline.to(clock, { frame:120, duration:4, ease:'none', onUpdate:draw });
window.__timelines['${name}'] = timeline;
</script></template></body></html>`;

await mkdir(resolve(output, "licenses"), { recursive: true });
await writeFile(resolve(output, `${name}.html`), html);
await writeFile(resolve(output, "t3-code-gsap.min.js"), gsap);
for (const theme of ["dark", "light"]) for (const phase of popupPhases) {
  const file = `project-switch-v0042-${theme}-${phase}-crop.png`;
  await copyFile(resolve(source, file), resolve(output, file));
}
await copyFile(resolve(root, "parity/t3-gallery/assets/T3-CODE-LICENSE.txt"), resolve(output, "licenses/T3-CODE-LICENSE.txt"));
for (const file of ["T3-THIRD_PARTY_NOTICES.md", "PIERRE-TREES-LICENSE.md", "PIERRE-TREES-NOTICE.md"]) {
  await copyFile(resolve(root, "registry/blocks/t3-thread-switch/licenses", file), resolve(output, "licenses", file));
}
await writeFile(resolve(output, "registry-item.json"), JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: Project Scope",
  description: "Open the real v0.0.42 sidebar project combobox, scope threads to an empty Hyfrme project, and restore the original project.",
  tags: ["composition", "app-ui", "t3-code", "project-switch", "hyfrme-port"],
  author: "Hyfrme", authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT",
  dimensions: dark.viewport, duration: dark.frames / dark.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    ...["dark", "light"].flatMap((theme) => popupPhases.map((phase) => ({
      path: `project-switch-v0042-${theme}-${phase}-crop.png`,
      target: `compositions/project-switch-v0042-${theme}-${phase}-crop.png`, type: "hyperframes:asset",
    }))),
    { path: "licenses/T3-CODE-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt", type: "hyperframes:asset" },
    ...["T3-THIRD_PARTY_NOTICES.md", "PIERRE-TREES-LICENSE.md", "PIERRE-TREES-NOTICE.md"].map((file) => ({
      path: `licenses/${file}`, target: `THIRD_PARTY_LICENSES/t3-code/${file}`, type: "hyperframes:asset",
    })),
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2) + "\n");
await writeFile(resolve(output, "README.md"), `# T3 Code: Project Scope\n\nThis four-second HyperFrames block reproduces the official T3 Code v0.0.42 desktop sidebar at 1200 × 659 and 30 fps in dark or light mode. The native project combobox opens beneath the sidebar search field, selects hyfrme-motion-lab, and then restores hyfrme. T3 Code retains the chosen scope after reload. The isolated workspace contains two real projects and seeded Hyfrme threads; choosing the scope is a live local action. No AI provider or GitHub account runs.\n\nCustomize project names, avatars, thread and conversation copy, empty state, theme, and all five action frames. The default popup uses cropped official dark/light pixels; edited content uses source DOM with the captured native glass wrapper. The capture parks the pointer over the user message, so its timestamp and copy control remain visible. Use matching values with adjacent T3 blocks for a seamless video. Source: https://github.com/pingdotgg/t3code/tree/${dark.sourceCommit}. The installed files include T3 Code's MIT license and Pierre Trees notices for the source icon. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.\n`);
console.log(`Generated ${name} from official v0.0.42 dark/light project-scope states.`);
