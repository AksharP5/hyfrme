import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-project-action";
const output = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, `.work/${name}-v0042-candidate`));
const fixtures = Object.fromEntries(await Promise.all(["dark", "light"].map(async (theme) => [theme,
  JSON.parse(await readFile(resolve(source, `project-action-v0042-${theme}-fixture.json`), "utf8")),
])));
const { dark, light } = fixtures;
const boxesMatchWithin = (left, right, tolerance) =>
  ["x", "y", "width", "height"].every((key) => Math.abs(left[key] - right[key]) <= tolerance);
if (dark.sourceCommit !== light.sourceCommit || dark.frames !== light.frames || dark.fps !== light.fps ||
  JSON.stringify(dark.events) !== JSON.stringify(light.events) ||
  !boxesMatchWithin(dark.observed.dialog.box, light.observed.dialog.box, 2) ||
  !boxesMatchWithin(dark.observed.menu.box, light.observed.menu.box, 0.25)) {
  throw new Error("Official T3 Code Project Action theme fixtures differ");
}
const themes = Object.fromEntries(await Promise.all(["dark", "light"].map(async (theme) => [theme,
  JSON.parse(await readFile(resolve(source, `${theme}-theme.json`), "utf8")),
])));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const sprite = (await readFile(resolve(source, "file-surface-tree.html"), "utf8"))
  .match(/<symbol id="file-tree-builtin-html"[\s\S]*?<\/symbol>/)?.[0];
if (!sprite) throw new Error("Official T3 Code file icon is missing");
const phases = dark.phases;
const portalPhases = new Set(["dialog", "named", "command", "shortcut", "menu"]);
const states = Object.fromEntries(await Promise.all(["dark", "light"].map(async (theme) => [theme,
  await Promise.all(phases.map(async (phase) => {
    let body = await readFile(resolve(source, `project-action-v0042-${theme}-${phase}.html`), "utf8");
    body = body.replace(/^<div id="root"[^>]*>/, "").replace(/<\/div>$/, "")
      .replace('class="h-full max-h-[inherit] overflow-auto', 'data-layout-allow-overflow class="h-full max-h-[inherit] overflow-auto')
      .replace(/(<span[^>]*class="[^"]*\[text-box:trim-both_cap_alphabetic\][^"]*")/g, "$1 data-layout-ignore")
      .replace(/(<span[^>]*class="pointer-events-none absolute[^"]*")/g, "$1 data-layout-allow-overflow")
      .replaceAll("hyfrme-fixture/project", "hyfrme-demo");
    if (portalPhases.has(phase)) {
      body = body.replace('<div class="group/sidebar-wrapper', '<div data-layout-ignore class="group/sidebar-wrapper');
    }
    return body;
  })),
])));
const portals = Object.fromEntries(await Promise.all(["dark", "light"].map(async (theme) => [theme,
  Object.fromEntries(await Promise.all([...portalPhases].map(async (phase) => [phase,
    await readFile(resolve(source, `project-action-v0042-${theme}-${phase}-portal.html`), "utf8"),
  ]))),
])));

const fields = [
  ["projectName", "Project", "hyfrme"],
  ["projectAvatar", "Project avatar", "HE"],
  ["threadOne", "Sidebar thread 1", "Build a logo intro"],
  ["threadTwo", "Sidebar thread 2", "Catalog motion audit"],
  ["threadThree", "Sidebar thread 3", "Grouped logo tests"],
  ["threadFour", "Sidebar thread 4", "Review final hold"],
  ["threadFive", "Sidebar thread 5", "Search reveal timing"],
  ["threadOneAge", "Sidebar thread 1 age", "10h"],
  ["threadTwoAge", "Sidebar thread 2 age", "12h"],
  ["threadThreeAge", "Sidebar thread 3 age", "17h"],
  ["threadFourAge", "Sidebar thread 4 age", "1d"],
  ["threadFiveAge", "Sidebar thread 5 age", "2d"],
  ["threadOneBranch", "Sidebar thread 1 branch", "main"],
  ["threadTwoBranch", "Sidebar thread 2 branch", "main"],
  ["threadThreeBranch", "Sidebar thread 3 branch", "logo/assemble"],
  ["threadFourBranch", "Sidebar thread 4 branch", "logo/hold-final"],
  ["threadFiveBranch", "Sidebar thread 5 branch", "main"],
  ["settledSection", "Settled section", "Settled (1)"],
  ["heading", "New thread heading", "What should we build in"],
  ["composerPlaceholder", "Composer placeholder", "Ask for changes, send follow-ups, or attach images"],
  ["modelName", "Model", "GPT-6-Astra"],
  ["reasoningLevel", "Reasoning", "Medium"],
  ["permissionMode", "Permission", "Full access"],
  ["checkoutLabel", "Checkout", "Current checkout"],
  ["actionName", "Saved action", dark.action.name],
  ["actionCommand", "Action command", dark.action.command],
  ["keybinding", "Entered keybinding", dark.observed.shortcut.value],
  ["dialogTitle", "Dialog title", "Add Action"],
  ["dialogDescription", "Dialog description", "Actions are project-scoped commands you can run from the top bar or keybindings."],
  ["nameLabel", "Name label", "Name"],
  ["keybindingLabel", "Keybinding label", "Keybinding"],
  ["commandLabel", "Command label", "Command"],
  ["previewUrlLabel", "Preview URL label", "Preview URL (optional)"],
  ["saveLabel", "Save button", "Save action"],
  ["cancelLabel", "Cancel button", "Cancel"],
  ["menuAddLabel", "Menu Add action", "Add action"],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "theme", type: "string", label: "T3 Code appearance", default: "dark", options: ["dark", "light"] },
  ...Object.entries(dark.events).map(([phase, frame]) => ({ id: `${phase}Frame`, type: "number",
    label: `${phase[0].toUpperCase()}${phase.slice(1)} at frame`, default: frame, min: 1, max: 119, step: 1 })),
];
const defaults = Object.fromEntries(variables.map(({ id, default: value }) => [id, value]));
const replacements = Object.fromEntries(fields.filter(([id]) => ![
  "threadOneAge", "threadTwoAge", "threadThreeAge", "threadFourAge", "threadFiveAge",
  "threadOneBranch", "threadTwoBranch", "threadThreeBranch", "threadFourBranch", "threadFiveBranch",
  "composerPlaceholder", "actionCommand", "keybinding", "heading", "projectAvatar",
].includes(id)).map(([id, , value]) => [value, id]));
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
.t3-stage[hidden], .t3-state[hidden] { display:none !important; }
.t3-state:not([hidden]) { display:contents; }
[data-t3-portal-theme][hidden] { display:none !important; }
.t3-action-dialog-crop[hidden] { display:none !important; }
.t3-action-dialog-crop { position:absolute; left:344px; top:16px; z-index:2147483647; width:512px !important; height:627px !important; max-width:none !important; object-fit:fill; pointer-events:none; }
.t3-action-menu-crop[hidden] { display:none !important; }
.t3-action-menu-crop { position:absolute; left:744px; top:42px; z-index:2147483647; width:162px !important; height:70px !important; max-width:none !important; object-fit:fill; pointer-events:none; }
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
${states[theme].map((body, index) => `<div class="t3-state" data-t3-state="${phases[index]}"${index ? " hidden" : ""}>${body}</div>`).join("\n")}
</div>`).join("\n")}
${["dark", "light"].flatMap((theme) => [...portalPhases].map((phase) =>
  portals[theme][phase].replace('data-base-ui-portal=""',
    `data-base-ui-portal="" data-t3-portal-theme="${theme}" data-t3-portal-phase="${phase}" class="${theme}" style="${themeStyles[theme].replaceAll('"', '&quot;')};font-family:-apple-system,BlinkMacSystemFont,Segoe UI,system-ui,sans-serif" data-layout-ignore hidden`))).join("\n")}
${["dark", "light"].flatMap((theme) => ["dialog", "named", "command", "shortcut"].map((phase) =>
  `<img class="t3-action-dialog-crop" data-t3-dialog-crop-theme="${theme}" data-t3-dialog-crop-phase="${phase}" src="project-action-v0042-${theme}-${phase}-crop.png" width="512" height="627" alt="" aria-hidden="true" data-layout-ignore hidden>`)).join("\n")}
${["dark", "light"].map((theme) => `<img class="t3-action-menu-crop" data-t3-menu-crop-theme="${theme}" src="project-action-v0042-${theme}-menu-crop.png" width="162" height="70" alt="" aria-hidden="true" data-layout-ignore hidden>`).join("\n")}
</div>
<script src="t3-code-gsap.min.js"></script><script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
const defaultDialogContent = ${scriptJson(Object.fromEntries(fields.map(([id, , value]) => [id, value])))};
const showNativeDialogPixels = Object.entries(defaultDialogContent).every(([key, value]) => options[key] === value);
const showNativeMenuPixels = options.actionName === defaults.actionName;
const replacements = ${scriptJson(replacements)};
const stages = [...document.querySelectorAll('#root [data-t3-theme]')];
for (const stage of stages) {
  stage.hidden = stage.dataset.t3Theme !== options.theme;
  for (const [key, value] of Object.entries(${scriptJson(fontTheme)})) stage.style.setProperty(key, value);
  stage.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
  const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const current = node.textContent.trim();
    const key = replacements[current];
    if (key && options[key] !== defaults[key]) node.textContent = node.textContent.replace(current, String(options[key]));
    if (current === defaults.projectAvatar && options.projectAvatar !== defaults.projectAvatar) {
      node.textContent = node.textContent.replace(current, String(options.projectAvatar));
    }
    if (current.includes(defaults.heading) && options.heading !== defaults.heading) {
      node.textContent = node.textContent.replace(defaults.heading, String(options.heading));
    }
  }
  for (const section of stage.querySelectorAll('[data-t3-state]')) {
    const ages = ['threadOneAge', 'threadTwoAge', 'threadThreeAge', 'threadFourAge', 'threadFiveAge'];
    const branches = ['threadOneBranch', 'threadTwoBranch', 'threadThreeBranch', 'threadFourBranch', 'threadFiveBranch'];
    section.querySelectorAll('[data-testid="sidebar-row-card"]').forEach((row, index) => {
      const age = row.querySelector('span.tabular-nums.text-secondary-label');
      if (age && ages[index]) age.textContent = options[ages[index]];
      const branch = row.querySelector('span.whitespace-nowrap');
      if (branch && branches[index]) branch.textContent = options[branches[index]];
    });
    for (const editor of section.querySelectorAll('[data-testid="composer-editor"]')) {
      editor.setAttribute('aria-placeholder', options.composerPlaceholder);
    }
    for (const element of section.querySelectorAll('[aria-label], [title], [value]')) {
      for (const attribute of ['aria-label', 'title', 'value']) {
        const value = element.getAttribute(attribute);
        if (!value) continue;
        let updated = value;
        for (const key of ['projectName', 'threadOne', 'threadTwo', 'threadThree', 'threadFour', 'threadFive', 'actionName']) {
          if (options[key] !== defaults[key]) updated = updated.replaceAll(defaults[key], String(options[key]));
        }
        if (updated !== value) element.setAttribute(attribute, updated);
      }
    }
    const nameInput = section.querySelector('#script-name');
    if (nameInput?.value) { nameInput.value = options.actionName; nameInput.setAttribute('value', options.actionName); }
    const shortcut = section.querySelector('#script-keybinding');
    if (shortcut?.value) { shortcut.value = options.keybinding; shortcut.setAttribute('value', options.keybinding); }
    const command = section.querySelector('#script-command');
    if (command?.value) { command.value = options.actionCommand; command.textContent = options.actionCommand; }
  }
}
for (const portal of document.querySelectorAll('[data-t3-portal-theme]')) {
  const walker = document.createTreeWalker(portal, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const current = node.textContent.trim();
    const key = replacements[current];
    if (key && options[key] !== defaults[key]) node.textContent = node.textContent.replace(current, String(options[key]));
  }
  for (const element of portal.querySelectorAll('[aria-label], [title], [value]')) {
    for (const attribute of ['aria-label', 'title', 'value']) {
      const value = element.getAttribute(attribute);
      if (value?.includes(defaults.actionName) && options.actionName !== defaults.actionName) {
        element.setAttribute(attribute, value.replaceAll(defaults.actionName, String(options.actionName)));
      }
    }
  }
  const nameInput = portal.querySelector('#script-name');
  if (nameInput?.value) { nameInput.value = options.actionName; nameInput.setAttribute('value', options.actionName); }
  const shortcut = portal.querySelector('#script-keybinding');
  if (shortcut?.value) { shortcut.value = options.keybinding; shortcut.setAttribute('value', options.keybinding); }
  const command = portal.querySelector('#script-command');
  if (command?.value) { command.value = options.actionCommand; command.textContent = options.actionCommand; }
}
const clock = { frame:0 };
function draw() {
  const frame = Math.round(clock.frame);
  const starts = ['dialog','named','command','shortcut','saved','persisted','menu'].map(key => Number(options[key + 'Frame']));
  for (let index = 1; index < starts.length; index++) starts[index] = Math.max(starts[index], starts[index - 1] + 1);
  const active = starts.findIndex(start => frame < start);
  const phase = active === -1 ? 7 : active;
  for (const stage of stages) {
    const sections = [...stage.querySelectorAll('[data-t3-state]')];
    for (let index = 0; index < sections.length; index++) sections[index].hidden = index !== phase;
  }
  for (const portal of document.querySelectorAll('[data-t3-portal-theme]')) {
    portal.hidden = portal.dataset.t3PortalTheme !== options.theme || portal.dataset.t3PortalPhase !== ['before','dialog','named','command','shortcut','saved','persisted','menu'][phase];
  }
  for (const crop of document.querySelectorAll('[data-t3-dialog-crop-theme]')) {
    crop.hidden = !showNativeDialogPixels || crop.dataset.t3DialogCropTheme !== options.theme ||
      crop.dataset.t3DialogCropPhase !== ['before','dialog','named','command','shortcut','saved','persisted','menu'][phase];
  }
  for (const crop of document.querySelectorAll('[data-t3-menu-crop-theme]')) {
    crop.hidden = !showNativeMenuPixels || crop.dataset.t3MenuCropTheme !== options.theme || phase !== 7;
  }
  const activeSection = document.querySelector('[data-t3-portal-theme="' + options.theme + '"][data-t3-portal-phase="' + ['before','dialog','named','command','shortcut','saved','persisted','menu'][phase] + '"]');
  const focusId = phase === 1 || phase === 2 ? 'script-name' : phase === 3 ? 'script-command' : phase === 4 ? 'script-keybinding' : null;
  if (focusId) activeSection?.querySelector('#' + focusId)?.focus({ preventScroll:true });
}
draw();
const timeline = gsap.timeline({ paused:true });
timeline.to(clock, { frame:120, duration:4, ease:'none', onUpdate:draw });
window.__timelines['${name}'] = timeline;
</script></template></body></html>`;

await mkdir(resolve(output, "licenses"), { recursive: true });
await writeFile(resolve(output, `${name}.html`), html);
await writeFile(resolve(output, "t3-code-gsap.min.js"), gsap);
const dialogCropFiles = ["dark", "light"].flatMap((theme) => ["dialog", "named", "command", "shortcut"]
  .map((phase) => `project-action-v0042-${theme}-${phase}-crop.png`));
const menuCropFiles = ["dark", "light"].map((theme) => `project-action-v0042-${theme}-menu-crop.png`);
for (const file of [...dialogCropFiles, ...menuCropFiles]) await copyFile(resolve(source, file), resolve(output, file));
for (const [file, target] of [
  ["public/ideas/assets/T3-CODE-LICENSE.txt", "T3-CODE-LICENSE.txt"],
  ["registry/blocks/t3-thread-switch/licenses/T3-THIRD_PARTY_NOTICES.md", "T3-THIRD_PARTY_NOTICES.md"],
  ["registry/blocks/t3-thread-switch/licenses/PIERRE-TREES-LICENSE.md", "PIERRE-TREES-LICENSE.md"],
  ["registry/blocks/t3-thread-switch/licenses/PIERRE-TREES-NOTICE.md", "PIERRE-TREES-NOTICE.md"],
]) await copyFile(resolve(root, file), resolve(output, "licenses", target));
const licenseFiles = ["T3-CODE-LICENSE.txt", "T3-THIRD_PARTY_NOTICES.md", "PIERRE-TREES-LICENSE.md", "PIERRE-TREES-NOTICE.md"];
await writeFile(resolve(output, "registry-item.json"), JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: Project Action",
  description: "Save a real project-scoped Hyfrme check action in T3 Code and reveal its persisted top-bar menu.",
  tags: ["composition", "app-ui", "t3-code", "project-action", "hyfrme-port"],
  author: "Hyfrme", authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT",
  dimensions: dark.viewport, duration: dark.frames / dark.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    ...[...dialogCropFiles, ...menuCropFiles].map((file) => ({ path: file, target: `compositions/${file}`, type: "hyperframes:asset" })),
    ...licenseFiles.map((file) => ({ path: `licenses/${file}`, target: `THIRD_PARTY_LICENSES/t3-code/${file}`, type: "hyperframes:asset" })),
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2) + "\n");
await writeFile(resolve(output, "README.md"), `# T3 Code: Project Action\n\nThis four-second HyperFrames block reproduces official T3 Code v0.0.42 at 1200 × 659 and 30 fps in dark and light. Add Action receives a Hyfrme check name, command, and shortcut. Save stores the project-scoped action; the toolbar and Script actions menu retain it after reload. The action persists in the official app; project and thread copy are seeded. No command is run in this block. The browser fixture captures keybinding entry, while only the desktop Electron app persists the keybinding.\n\nCustomize the project, sidebar, action name, command, entered keybinding, UI labels, theme, and event frames. Native dialog and saved-action menu crops provide exact default pixels; changing visible values switches these areas to editable DOM. Match values with adjacent T3 Code blocks. Source: https://github.com/pingdotgg/t3code/tree/${dark.sourceCommit}. Installed files include T3 Code's MIT license and third-party icon notices. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.\n`);
console.log(`Generated ${name} from eight native T3 Code v0.0.42 states in dark and light.`);
