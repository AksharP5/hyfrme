import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-commit-review";
const output = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, `.work/${name}-v0042-candidate`));
const fixtures = Object.fromEntries(await Promise.all(["dark", "light"].map(async (theme) => [theme,
  JSON.parse(await readFile(resolve(source, `commit-review-v0042-${theme}-fixture.json`), "utf8")),
])));
const { dark, light } = fixtures;
if (dark.sourceCommit !== light.sourceCommit || dark.frames !== light.frames || dark.fps !== light.fps ||
  JSON.stringify(dark.events) !== JSON.stringify(light.events) ||
  JSON.stringify(dark.observed.menu.box) !== JSON.stringify(light.observed.menu.box) ||
  JSON.stringify(dark.observed.dialog.box) !== JSON.stringify(light.observed.dialog.box)) {
  throw new Error("Official T3 Code Commit Review theme fixtures differ");
}
const themes = Object.fromEntries(await Promise.all(["dark", "light"].map(async (theme) => [theme,
  JSON.parse(await readFile(resolve(source, `${theme}-theme.json`), "utf8")),
])));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const sprite = (await readFile(resolve(source, "file-surface-tree.html"), "utf8"))
  .match(/<symbol id="file-tree-builtin-html"[\s\S]*?<\/symbol>/)?.[0];
if (!sprite) throw new Error("Official T3 Code HTML file icon is missing");
const phases = dark.phases;
const states = Object.fromEntries(await Promise.all(["dark", "light"].map(async (theme) => [theme,
  await Promise.all(phases.map(async (phase) => {
    let body = await readFile(resolve(source, `commit-review-v0042-${theme}-${phase}.html`), "utf8");
    body = body.replace('class="h-full max-h-[inherit] overflow-auto',
      'data-layout-allow-overflow class="h-full max-h-[inherit] overflow-auto')
      .replace(/(<span[^>]*class="[^"]*\[text-box:trim-both_cap_alphabetic\][^"]*")/g, "$1 data-layout-ignore")
      .replace(/(<span[^>]*class="pointer-events-none absolute[^"]*")/g, "$1 data-layout-allow-overflow")
      .replaceAll(`t3-v0042-commit-review-${theme}-project`, "hyfrme-demo");
    if (phase !== "before") {
      body = body.replace('<div class="group/sidebar-wrapper', '<div data-layout-ignore class="group/sidebar-wrapper');
      const portal = await readFile(resolve(source, `commit-review-v0042-${theme}-${phase}-portal.html`), "utf8");
      body += portal.replace('data-base-ui-portal=""', 'data-base-ui-portal="" data-layout-ignore');
    }
    return body;
  })),
])));

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["projectAvatar", "Project avatar", "HE"],
  ["draftTitle", "Draft title", "New thread"],
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
  ["checkoutLabel", "Checkout label", "Current checkout"],
  ["branchName", "Branch", dark.branch],
  ["addAction", "Add action button", "Add action"],
  ["openAction", "Open button", "Open"],
  ["commitAction", "Commit action", "Commit"],
  ["publishAction", "Publish action", "Publish repository..."],
  ["dialogTitle", "Dialog title", "Commit changes"],
  ["dialogDescription", "Dialog description", "Review and confirm your commit. Leave the message blank to auto-generate one."],
  ["branchLabel", "Branch label", "Branch"],
  ["filesLabel", "Files label", "Files"],
  ["editLabel", "Edit files label", "Edit"],
  ["changedFile", "Changed file", dark.changedFile],
  ["insertions", "Added lines", dark.insertions],
  ["deletions", "Removed lines", dark.deletions],
  ["messageLabel", "Commit message label", "Commit message (optional)"],
  ["messagePlaceholder", "Commit message placeholder", "Leave empty to auto-generate"],
  ["commitMessage", "Typed commit message", dark.commitMessage],
  ["cancelLabel", "Cancel button", "Cancel"],
  ["newBranchLabel", "Commit on new branch button", "Commit on new branch"],
];
const variables = [
  ...fields.map(([id, label, value]) => id === "insertions" || id === "deletions"
    ? { id, type: "number", label, default: value, min: 0, max: 9999, step: 1 }
    : { id, type: "string", label, default: value }),
  { id: "theme", type: "string", label: "T3 Code appearance", default: "dark", options: ["dark", "light"] },
  { id: "menuFrame", type: "number", label: "Open Git menu at frame", default: dark.events.menu, min: 1, max: 110, step: 1 },
  { id: "dialogFrame", type: "number", label: "Open review dialog at frame", default: dark.events.dialog, min: 2, max: 115, step: 1 },
  { id: "messageFrame", type: "number", label: "Type commit message at frame", default: dark.events.message, min: 3, max: 119, step: 1 },
];
const defaults = Object.fromEntries(variables.map(({ id, default: value }) => [id, value]));
const replacements = Object.fromEntries(fields.filter(([id]) => !id.endsWith("Age") && !id.endsWith("Branch") &&
  !["insertions", "deletions", "commitMessage", "composerPlaceholder", "messagePlaceholder"].includes(id))
  .map(([id, , value]) => [value, id]));
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
.t3-native-popup { position:absolute; left:948px; top:42px; width:168px; height:66px; z-index:10001; pointer-events:none; }
.base-ui-disable-scrollbar { scrollbar-width:none; }
.base-ui-disable-scrollbar::-webkit-scrollbar { display:none; }
.t3-stage [style*="t3-mobile-draft-headline"] h1 { transform:translateY(1px); }
@font-face { font-family:"Apple Color Emoji"; src:local("Apple Color Emoji"); }
@font-face { font-family:"Segoe UI Emoji"; src:local("Segoe UI Emoji"); }
@font-face { font-family:"Segoe UI Symbol"; src:local("Segoe UI Symbol"); }
@font-face { font-family:"SFMono-Regular"; src:local("SFMono-Regular"); }
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;overflow:hidden" aria-hidden="true" data-layout-ignore>${sprite}</svg>
${["dark", "light"].map((theme) => `<div class="t3-stage ${theme}" data-t3-theme="${theme}" style="${themeStyles[theme].replaceAll('"', '&quot;')}"${theme === "light" ? " hidden" : ""}>
${states[theme].map((body, index) => `<div class="t3-state" data-t3-state="${phases[index]}"${index ? " hidden" : ""}>${body}</div>`).join("\n")}
<img class="t3-native-popup" src="commit-review-v0042-${theme}-menu-crop.png" alt="" aria-hidden="true" data-layout-ignore hidden>
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
    const key = replacements[current];
    if (key && options[key] !== defaults[key]) node.textContent = node.textContent.replace(current, String(options[key]));
  }
  for (const section of stage.querySelectorAll('[data-t3-state]')) {
    const ages = ['threadOneAge', 'threadTwoAge', 'threadThreeAge', 'threadFourAge', 'threadFiveAge'];
    section.querySelectorAll('[data-testid="sidebar-row-card"]').forEach((row, index) => {
      const age = row.querySelector('span.tabular-nums.text-secondary-label');
      if (age && ages[index]) age.textContent = options[ages[index]];
      const branches = ['threadOneBranch', 'threadTwoBranch', 'threadThreeBranch', 'threadFourBranch', 'threadFiveBranch'];
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
        for (const key of ['projectName', 'branchName', 'threadOne', 'threadTwo', 'threadThree', 'threadFour', 'threadFive',
          'threadOneBranch', 'threadTwoBranch', 'threadThreeBranch', 'threadFourBranch', 'threadFiveBranch']) {
          if (options[key] !== defaults[key]) updated = updated.replaceAll(defaults[key], String(options[key]));
        }
        if (updated !== value) element.setAttribute(attribute, updated);
      }
    }
    const textarea = section.querySelector('textarea[data-slot="textarea"]');
    if (textarea) {
      textarea.placeholder = options.messagePlaceholder;
      if (section.dataset.t3State === 'message') {
        textarea.value = options.commitMessage;
        textarea.textContent = options.commitMessage;
      }
    }
    const dialog = section.querySelector('[role="dialog"]');
    if (dialog) {
      for (const path of dialog.querySelectorAll('bdi')) {
        if (path.textContent.trim() === defaults.changedFile) path.textContent = options.changedFile;
      }
      for (const added of dialog.querySelectorAll('.text-diff-addition')) {
        if (added.textContent.trim() === '+' + defaults.insertions) added.textContent = '+' + options.insertions;
      }
      for (const removed of dialog.querySelectorAll('.text-diff-deletion')) {
        if (removed.textContent.trim() === '-' + defaults.deletions) removed.textContent = '-' + options.deletions;
      }
    }
  }
}
const clock = { frame: 0 };
function draw() {
  const frame = Math.round(clock.frame);
  const dialogFrame = Math.max(Number(options.dialogFrame), Number(options.menuFrame) + 1);
  const messageFrame = Math.max(Number(options.messageFrame), dialogFrame + 1);
  const phase = frame < options.menuFrame ? 0 : frame < dialogFrame ? 1 : frame < messageFrame ? 2 : 3;
  for (const stage of stages) {
    const sections = [...stage.querySelectorAll('[data-t3-state]')];
    for (let index = 0; index < sections.length; index++) sections[index].hidden = index !== phase;
    stage.querySelector('.t3-native-popup').hidden = !nativePopupAllowed || phase !== 1;
    if (stage.hidden || phase !== 1) continue;
    const trigger = sections[1].querySelector('[aria-label="Git action options"]');
    const positioner = sections[1].querySelector('[data-slot="menu-positioner"]');
    if (!trigger || !positioner) continue;
    const anchor = trigger.getBoundingClientRect();
    const popup = positioner.querySelector('[role="menu"]');
    if (!popup) continue;
    const width = popup.getBoundingClientRect().width;
    positioner.style.transform = 'translate(' + (anchor.right - width) + 'px, ' + (anchor.bottom + 4) + 'px)';
  }
}
draw();
const timeline = gsap.timeline({ paused: true });
timeline.to(clock, { frame: 120, duration: 4, ease: 'none', onUpdate: draw });
window.__timelines['${name}'] = timeline;
</script>
</template></body></html>`;

await mkdir(resolve(output, "licenses"), { recursive: true });
await writeFile(resolve(output, `${name}.html`), html);
await writeFile(resolve(output, "t3-code-gsap.min.js"), gsap);
for (const theme of ["dark", "light"]) {
  const file = `commit-review-v0042-${theme}-menu-crop.png`;
  await copyFile(resolve(source, file), resolve(output, file));
}
for (const [file, target] of [
  ["public/ideas/assets/T3-CODE-LICENSE.txt", "T3-CODE-LICENSE.txt"],
  ["registry/blocks/t3-thread-switch/licenses/T3-THIRD_PARTY_NOTICES.md", "T3-THIRD_PARTY_NOTICES.md"],
  ["registry/blocks/t3-thread-switch/licenses/PIERRE-TREES-LICENSE.md", "PIERRE-TREES-LICENSE.md"],
  ["registry/blocks/t3-thread-switch/licenses/PIERRE-TREES-NOTICE.md", "PIERRE-TREES-NOTICE.md"],
  ["registry/blocks/t3-thread-archive/licenses/PIERRE-DIFFS-LICENSE.md", "PIERRE-DIFFS-LICENSE.md"],
]) await copyFile(resolve(root, file), resolve(output, "licenses", target));
const licenseFiles = ["T3-CODE-LICENSE.txt", "T3-THIRD_PARTY_NOTICES.md", "PIERRE-TREES-LICENSE.md",
  "PIERRE-TREES-NOTICE.md", "PIERRE-DIFFS-LICENSE.md"];
await writeFile(resolve(output, "registry-item.json"), JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: Commit Review",
  description: "Open T3 Code's real Git action menu and review a changed Hyfrme Logo Enter file and commit message without committing.",
  tags: ["composition", "app-ui", "t3-code", "git", "commit-review", "hyfrme-port"],
  author: "Hyfrme", authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT",
  dimensions: dark.viewport, duration: dark.frames / dark.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    ...["dark", "light"].map((theme) => ({ path: `commit-review-v0042-${theme}-menu-crop.png`, target: `compositions/commit-review-v0042-${theme}-menu-crop.png`, type: "hyperframes:asset" })),
    ...licenseFiles.map((file) => ({ path: `licenses/${file}`, target: `THIRD_PARTY_LICENSES/t3-code/${file}`, type: "hyperframes:asset" })),
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2) + "\n");
await writeFile(resolve(output, "README.md"), `# T3 Code: Commit Review\n\nThis four-second, 1200 × 659 block reproduces official T3 Code v${dark.sourceTag.slice(1)} at 30 fps in dark and light. The native Git action menu opens on a Hyfrme worktree with one real Logo Enter change (+${dark.insertions}/-${dark.deletions}), then the Commit dialog reviews the file and a draft message. No commit is created. The project, thread history, and provider state are seeded; Git status and dialog opening are live.\n\nCustomize the project, sidebar, branch, file path, diff counts, labels, message, theme, and three action frames through HyperFrames variables. The default Git menu uses official pixels; edited visible content uses source DOM reanchored to the trigger. Match project and thread values with adjacent T3 Code blocks for continuity. Source: https://github.com/pingdotgg/t3code/tree/${dark.sourceCommit}. Installed files include T3 Code's MIT license and third-party notices. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.\n`);
console.log(`Generated ${name} from four native T3 Code v0.0.42 states in dark and light.`);
