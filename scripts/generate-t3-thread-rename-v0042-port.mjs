import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-thread-rename";
const output = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, `.work/${name}-v0042-candidate`));
const fixtures = Object.fromEntries(await Promise.all(["dark", "light"].map(async (theme) => [theme,
  JSON.parse(await readFile(resolve(source, `thread-rename-v0042-${theme}-fixture.json`), "utf8")),
])));
const { dark, light } = fixtures;
if (dark.sourceCommit !== light.sourceCommit || dark.frames !== light.frames || dark.fps !== light.fps ||
  JSON.stringify(dark.events) !== JSON.stringify(light.events)) throw new Error("Official theme fixtures differ");
const themes = Object.fromEntries(await Promise.all(["dark", "light"].map(async (theme) => [theme,
  JSON.parse(await readFile(resolve(source, `${theme}-theme.json`), "utf8")),
])));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const sprite = (await readFile(resolve(source, "file-surface-tree.html"), "utf8"))
  .match(/<symbol id="file-tree-builtin-html"[\s\S]*?<\/symbol>/)?.[0];
if (!sprite) throw new Error("Official T3 Code HTML file icon is missing");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const states = Object.fromEntries(await Promise.all(["dark", "light"].map(async (theme) => [theme,
  await Promise.all(dark.phases.map(async (phase) => {
    let body = await readFile(resolve(source, `thread-rename-v0042-${theme}-${phase}.html`), "utf8");
    body = body.replace('class="h-full max-h-[inherit] overflow-auto', 'data-layout-allow-overflow class="h-full max-h-[inherit] overflow-auto')
      .replace(/(<span[^>]*class="[^"]*\[text-box:trim-both_cap_alphabetic\][^"]*")/g, "$1 data-layout-ignore")
      .replace(/(<span[^>]*class="pointer-events-none absolute[^"]*")/g, "$1 data-layout-allow-overflow");
    if (phase === "menu") {
      body = body.replace('<div class="group/sidebar-wrapper', '<div data-layout-ignore class="group/sidebar-wrapper');
      const portal = await readFile(resolve(source, `thread-rename-v0042-${theme}-menu-portal.html`), "utf8");
      body += portal.replace('<div ', '<div data-layout-ignore ');
    }
    return body;
  })),
])));
const fields = [
  ["projectName", "Project", "hyfrme"],
  ["projectAvatar", "Project avatar", "HE"],
  ["oldTitle", "Original thread title", dark.oldTitle],
  ["newTitle", "Renamed thread title", dark.newTitle],
  ["secondThread", "Second thread", "Catalog motion audit"],
  ["thirdThread", "Third thread", "Grouped logo tests"],
  ["fourthThread", "Fourth thread", "Review final hold"],
  ["fifthThread", "Fifth thread", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ["firstAge", "First thread age", "10h"],
  ["secondAge", "Second thread age", "12h"],
  ["thirdAge", "Third thread age", "17h"],
  ["fourthAge", "Fourth thread age", "1d"],
  ["fifthAge", "Fifth thread age", "2d"],
  ["branchName", "Branch", "main"],
  ["activeBranch", "Selected branch", "feature/logo-enter"],
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
  ["newThreadAction", "New thread menu action", "New thread on main"],
  ["pinAction", "Pin menu action", "Pin thread"],
  ["settleAction", "Settle menu action", "Settle thread"],
  ["snoozeAction", "Snooze menu action", "Snooze"],
  ["renameAction", "Rename menu action", "Rename thread"],
  ["regenerateAction", "Regenerate menu action", "Regenerate title"],
  ["unreadAction", "Unread menu action", "Mark unread"],
  ["copyAction", "Copy menu action", "Copy"],
  ["projectSettingsAction", "Project settings action", "Project settings"],
  ["archiveAction", "Archive menu action", "Archive thread"],
  ["deleteAction", "Delete menu action", "Delete"],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "theme", type: "string", label: "T3 Code appearance", default: "dark", options: ["dark", "light"] },
  { id: "menuFrame", type: "number", label: "Open title menu at frame", default: dark.events.menu, min: 1, max: 110, step: 1 },
  { id: "renameFrame", type: "number", label: "Enter title editor at frame", default: dark.events.rename, min: 2, max: 114, step: 1 },
  { id: "typedFrame", type: "number", label: "Type new title at frame", default: dark.events.typed, min: 3, max: 116, step: 1 },
  { id: "commitFrame", type: "number", label: "Commit title at frame", default: dark.events.commit, min: 4, max: 118, step: 1 },
  { id: "persistedFrame", type: "number", label: "Show persisted title at frame", default: dark.events.persisted, min: 5, max: 119, step: 1 },
];
const defaults = Object.fromEntries(variables.map(({ id, default: value }) => [id, value]));
const replacements = Object.fromEntries(fields.filter(([id]) => !id.endsWith("Age") &&
  !["projectName", "projectAvatar", "branchName"].includes(id)).map(([id, , value]) => [value, id]));
const themeStyles = Object.fromEntries(Object.entries(themes).map(([theme, values]) => [theme,
  Object.entries(values).map(([key, value]) => `${key}:${value};`).join(""),
]));
const fontTheme = Object.fromEntries(Object.entries(themes.dark).filter(([key]) =>
  key.includes("font-family") || key === "--font-sans" || key === "--font-mono"));
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const scriptJson = (value) => JSON.stringify(value).replaceAll("</", "<\\/");

const html = `<!doctype html><html lang="en" data-composition-variables='${escapeAttribute(JSON.stringify(variables))}'>
<head><meta charset="utf-8"></head><body><template>
<style>${css}</style><style>
#root { position:relative; width:100%; height:100%; overflow:hidden; }
.t3-stage { position:relative; width:100%; height:100%; overflow:hidden; background:var(--background); color:var(--foreground); font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif; }
.t3-stage[hidden], .t3-state[hidden], .t3-native-popup[hidden] { display:none !important; }
.t3-state:not([hidden]) { display:contents; }
.t3-native-popup { position:absolute; left:363px; top:37px; width:185px; height:353px; z-index:10001; pointer-events:none; }
.base-ui-disable-scrollbar { scrollbar-width:none; }
.base-ui-disable-scrollbar::-webkit-scrollbar { display:none; }
@font-face { font-family:"Apple Color Emoji"; src:local("Apple Color Emoji"); }
@font-face { font-family:"Segoe UI Emoji"; src:local("Segoe UI Emoji"); }
@font-face { font-family:"Segoe UI Symbol"; src:local("Segoe UI Symbol"); }
@font-face { font-family:"SFMono-Regular"; src:local("SFMono-Regular"); }
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;overflow:hidden" aria-hidden="true" data-layout-ignore>${sprite}</svg>
${["dark", "light"].map((theme) => `<div class="t3-stage ${theme}" data-t3-theme="${theme}" style="${themeStyles[theme].replaceAll('"', '&quot;')}"${theme === "light" ? " hidden" : ""}>
${states[theme].map((body, index) => `<div class="t3-state" data-t3-state="${dark.phases[index]}"${index ? " hidden" : ""}>${body}</div>`).join("\n")}
<img class="t3-native-popup" data-t3-popup="menu" src="thread-rename-v0042-${theme}-menu-crop.png" alt="" aria-hidden="true" data-layout-ignore hidden>
</div>`).join("\n")}</div>
<script src="t3-code-gsap.min.js"></script><script>
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
    if (current === defaults.projectAvatar && options.projectAvatar !== defaults.projectAvatar) {
      node.textContent = node.textContent.replace(current, String(options.projectAvatar));
      continue;
    }
    if (current === defaults.projectName && options.projectName !== defaults.projectName) {
      node.textContent = node.textContent.replace(current, String(options.projectName));
      continue;
    }
    if (current === defaults.branchName && options.branchName !== defaults.branchName) {
      node.textContent = node.textContent.replace(current, String(options.branchName));
      continue;
    }
    if (current === defaults.newThreadAction && options.newThreadAction === defaults.newThreadAction && options.branchName !== defaults.branchName) {
      node.textContent = node.textContent.replace(defaults.branchName, String(options.branchName));
      continue;
    }
    const key = replacements[current];
    if (key && options[key] !== defaults[key]) node.textContent = node.textContent.replace(current, String(options[key]));
    for (const id of ['replyLead', 'replyTail']) {
      if (options[id] !== defaults[id] && node.textContent.includes(defaults[id])) {
        node.textContent = node.textContent.replaceAll(defaults[id], String(options[id]));
      }
    }
  }
  for (const section of stage.querySelectorAll('[data-t3-state]')) {
    const editor = section.querySelector('[data-testid="composer-editor"]');
    if (editor) editor.setAttribute('aria-placeholder', options.composerPlaceholder);
    const ageKeys = ['firstAge', 'secondAge', 'thirdAge', 'fourthAge', 'fifthAge'];
    section.querySelectorAll('[data-testid="sidebar-row-card"]').forEach((row, index) => {
      const age = row.querySelector('span.tabular-nums.text-secondary-label');
      if (age && ageKeys[index] && !age.querySelector('[role="status"]')) age.textContent = options[ageKeys[index]];
    });
    for (const element of section.querySelectorAll('[aria-label], [title]')) {
      for (const attribute of ['aria-label', 'title']) {
        const value = element.getAttribute(attribute);
        if (!value) continue;
        let next = value;
        for (const id of ['projectName', 'oldTitle', 'newTitle', 'secondThread', 'thirdThread', 'fourthThread', 'fifthThread', 'branchName', 'activeBranch', 'thirdBranch', 'fourthBranch']) {
          if (options[id] !== defaults[id]) next = next.replaceAll(defaults[id], String(options[id]));
        }
        if (next !== value) element.setAttribute(attribute, next);
      }
    }
    const titleInput = section.querySelector('input[aria-label="Thread title"]');
    if (titleInput) {
      const title = section.dataset.t3State === 'typed' ? options.newTitle : options.oldTitle;
      titleInput.value = title;
      titleInput.setAttribute('value', title);
    }
  }
}
const clock = { frame:0 };
function draw() {
  const frame = Math.round(clock.frame);
  const menuFrame = Number(options.menuFrame);
  const renameFrame = Math.max(Number(options.renameFrame), menuFrame + 1);
  const typedFrame = Math.max(Number(options.typedFrame), renameFrame + 1);
  const commitFrame = Math.max(Number(options.commitFrame), typedFrame + 1);
  const persistedFrame = Math.max(Number(options.persistedFrame), commitFrame + 1);
  const active = frame < menuFrame ? 0 : frame < renameFrame ? 1 : frame < typedFrame ? 2 : frame < commitFrame ? 3 : frame < persistedFrame ? 4 : 5;
  for (const stage of stages) {
    const sections = [...stage.querySelectorAll('[data-t3-state]')];
    for (let index = 0; index < sections.length; index++) sections[index].hidden = index !== active;
    stage.querySelector('.t3-native-popup').hidden = !nativePopupAllowed || active !== 1;
    if (stage.hidden) continue;
    if (active === 1 && !nativePopupAllowed) {
      const trigger = sections[active].querySelector('[aria-label^="Thread actions for "]');
      const menu = sections[active].querySelector('.dropdown-glass[data-level="0"]');
      if (trigger && menu) {
        const bounds = trigger.getBoundingClientRect();
        const origin = stage.getBoundingClientRect();
        menu.style.position = 'absolute';
        menu.style.left = (bounds.left - origin.left) + 'px';
        menu.style.top = (bounds.bottom - origin.top + 4) + 'px';
      }
    }
    const titleInput = sections[active].querySelector('input[aria-label="Thread title"]');
    if (titleInput && document.activeElement !== titleInput) {
      titleInput.focus({ preventScroll:true });
      if (active === 2) titleInput.select();
      if (active === 3) titleInput.setSelectionRange(titleInput.value.length, titleInput.value.length);
    }
    if (!titleInput && document.activeElement?.matches?.('input[aria-label="Thread title"]')) document.activeElement.blur();
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
for (const theme of ["dark", "light"]) {
  const file = `thread-rename-v0042-${theme}-menu-crop.png`;
  await copyFile(resolve(source, file), resolve(output, file));
}
await copyFile(resolve(root, "parity/t3-gallery/assets/T3-CODE-LICENSE.txt"), resolve(output, "licenses/T3-CODE-LICENSE.txt"));
for (const file of ["T3-THIRD_PARTY_NOTICES.md", "PIERRE-TREES-LICENSE.md", "PIERRE-TREES-NOTICE.md"]) {
  await copyFile(resolve(root, "registry/blocks/t3-thread-switch/licenses", file), resolve(output, "licenses", file));
}
await writeFile(resolve(output, "registry-item.json"), JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: Thread Rename",
  description: "Rename a T3 Code thread through its native v0.0.42 title menu and inline editor, then show the persisted title.",
  tags: ["composition", "app-ui", "t3-code", "thread-rename", "hyfrme-port"],
  author: "Hyfrme", authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT",
  dimensions: dark.viewport, duration: dark.frames / dark.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    ...["dark", "light"].map((theme) => ({ path: `thread-rename-v0042-${theme}-menu-crop.png`,
      target: `compositions/thread-rename-v0042-${theme}-menu-crop.png`, type: "hyperframes:asset" })),
    { path: "licenses/T3-CODE-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt", type: "hyperframes:asset" },
    ...["T3-THIRD_PARTY_NOTICES.md", "PIERRE-TREES-LICENSE.md", "PIERRE-TREES-NOTICE.md"].map((file) => ({
      path: `licenses/${file}`, target: `THIRD_PARTY_LICENSES/t3-code/${file}`, type: "hyperframes:asset",
    })),
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2) + "\n");
await writeFile(resolve(output, "README.md"), `# T3 Code: Thread Rename\n\nThis four-second HyperFrames block reproduces official T3 Code v0.0.42 at 1200 × 659 and 30 fps in dark or light mode. The native title menu opens beneath the thread header at (367, 40). Rename opens the inline editor; Enter commits the new title in the header and sidebar. The title survives a native reload. The project and completed messages are seeded; rename and local persistence execute. No AI provider or GitHub account runs.\n\nCustomize project, both titles, conversation, sidebar, action-menu labels, theme, and all five event frames. The default menu uses cropped official dark/light pixels; changed visible content uses source DOM. Use matching values with adjacent T3 blocks. Source: https://github.com/pingdotgg/t3code/tree/${dark.sourceCommit}. Installed licenses include T3 Code MIT and Pierre Trees notices for the file icon. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.\n`);
console.log(`Generated ${name} from native T3 Code v0.0.42 dark/light rename states.`);
