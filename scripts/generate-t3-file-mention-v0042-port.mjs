import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-file-mention";
const output = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, ".work/t3-file-mention-v0042-candidate"));
const fixtures = Object.fromEntries(await Promise.all(["dark", "light"].map(async (theme) => [theme,
  JSON.parse(await readFile(resolve(source, `file-mention-v0042-${theme}-fixture.json`), "utf8")),
])));
const { dark, light } = fixtures;
if (dark.sourceCommit !== light.sourceCommit || dark.frames !== light.frames || dark.fps !== light.fps ||
  JSON.stringify(dark.events) !== JSON.stringify(light.events) ||
  JSON.stringify(dark.observed.results.drawerItems) !== JSON.stringify(light.observed.results.drawerItems)) {
  throw new Error("Official v0.0.42 file mention fixtures differ across themes");
}
const themes = Object.fromEntries(await Promise.all(["dark", "light"].map(async (theme) => [theme,
  JSON.parse(await readFile(resolve(source, `${theme}-theme.json`), "utf8")),
])));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const sprite = [...(await readFile(resolve(source, "file-surface-tree.html"), "utf8"))
  .matchAll(/<symbol\b[\s\S]*?<\/symbol>/g)].map(([symbol]) => symbol).join("\n");
if (!sprite.includes('id="file-tree-builtin-html"') || !sprite.includes('id="file-tree-builtin-typescript"')) {
  throw new Error("Official T3 Code file icon sprite is incomplete");
}
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const states = Object.fromEntries(await Promise.all(["dark", "light"].map(async (theme) => [theme,
  await Promise.all(dark.phases.map(async (phase) => {
    let body = await readFile(resolve(source, `file-mention-v0042-${theme}-${phase}.html`), "utf8");
    body = body.replace('class="h-full max-h-[inherit] overflow-auto', 'data-layout-allow-overflow class="h-full max-h-[inherit] overflow-auto')
      .replace(/(<span[^>]*class="[^"]*\[text-box:trim-both_cap_alphabetic\][^"]*")/g, "$1 data-layout-ignore")
      .replace(/(<span[^>]*class="pointer-events-none absolute[^"]*")/g, "$1 data-layout-allow-overflow");
    if (["at", "results", "highlight"].includes(phase)) {
      body = body.replace('<main ', '<main data-layout-ignore ');
      const portal = await readFile(resolve(source, `file-mention-v0042-${theme}-${phase}-portal.html`), "utf8");
      body += portal.replace('<div ', '<div data-layout-ignore ');
    }
    return body;
  })),
])));
const fields = [
  ["projectName", "Project", "hyfrme"],
  ["projectAvatar", "Project avatar", "HE"],
  ["selectedThread", "Selected thread", "Build a logo intro"],
  ["secondThread", "Second thread", "Catalog motion audit"],
  ["thirdThread", "Third thread", "Grouped logo tests"],
  ["fourthThread", "Fourth thread", "Review final hold"],
  ["fifthThread", "Fifth thread", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ["firstAge", "Selected thread age", "10h"],
  ["secondAge", "Second thread age", "12h"],
  ["thirdAge", "Third thread age", "17h"],
  ["fourthAge", "Fourth thread age", "1d"],
  ["fifthAge", "Fifth thread age", "2d"],
  ["branchName", "Selected branch", "main"],
  ["activeBranch", "Workspace branch", "feature/logo-enter"],
  ["thirdBranch", "Third thread branch", "logo/assemble"],
  ["fourthBranch", "Fourth thread branch", "logo/hold-final"],
  ["question", "User message", "Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames."],
  ["replyLead", "Answer before file", "I found the Logo Enter timing in"],
  ["replyFile", "Answer file label", "logo-enter.html"],
  ["replyFilePath", "Answer file path", "registry/blocks/logo-enter/logo-enter.html"],
  ["replyTail", "Answer after file", "The final pass can extend the duration while keeping the last rendered frame still."],
  ["workedFor", "Work duration", "Worked for 2m"],
  ["composerPlaceholder", "Composer placeholder", "Enable a provider in Settings to send a message"],
  ["providerStatus", "Provider status", "Open provider settings"],
  ["workspaceMode", "Workspace mode", "Worktree"],
  ["inputPrefix", "Prompt before @", "Review"],
  ["query", "File search query", dark.query],
  ["emptyMessage", "Bare @ message", "No matching files or folders."],
  ["resultOneLabel", "First result", "logo-enter.html"],
  ["resultOneDirectory", "First result directory", "registry/blocks/logo-enter"],
  ["resultTwoLabel", "Second result", "logo-enter"],
  ["resultTwoDirectory", "Second result directory", "registry/blocks"],
  ["resultThreeLabel", "Third result", "catalog.ts"],
  ["resultThreeDirectory", "Third result directory", "src"],
  ["resultFourLabel", "Fourth result", "package.json"],
  ["resultFourDirectory", "Fourth result directory", ""],
  ["selectedFileLabel", "Inserted file chip", dark.selectedFile],
  ["selectedFilePath", "Inserted file path", dark.selectedPath],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "theme", type: "string", label: "T3 Code appearance", default: "dark", options: ["dark", "light"] },
  { id: "atFrame", type: "number", label: "Type @ at frame", default: dark.events.at, min: 1, max: 110, step: 1 },
  { id: "resultsFrame", type: "number", label: "Show file matches at frame", default: dark.events.results, min: 2, max: 113, step: 1 },
  { id: "highlightFrame", type: "number", label: "Highlight file at frame", default: dark.events.highlight, min: 3, max: 116, step: 1 },
  { id: "chipFrame", type: "number", label: "Insert file chip at frame", default: dark.events.chip, min: 4, max: 119, step: 1 },
];
const defaults = Object.fromEntries(variables.map(({ id, default: value }) => [id, value]));
const replacementIds = ["projectName", "projectAvatar", "selectedThread", "secondThread", "thirdThread", "fourthThread", "fifthThread",
  "settledThread", "branchName", "activeBranch", "thirdBranch", "fourthBranch", "question", "replyLead", "replyTail",
  "workedFor", "providerStatus", "workspaceMode", "emptyMessage"];
const replacements = Object.fromEntries(fields.filter(([id]) => replacementIds.includes(id)).map(([id, , value]) => [value, id]));
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
.t3-stage[hidden], .t3-state[hidden], .t3-native-drawer[hidden] { display:none !important; }
.t3-state:not([hidden]) { display:contents; }
.t3-native-drawer { position:absolute; left:362px; z-index:10001; pointer-events:none; }
.t3-native-drawer[data-phase="at"] { top:401px; width:732px; height:83px; }
.t3-native-drawer[data-phase="results"], .t3-native-drawer[data-phase="highlight"] { top:315px; width:732px; height:169px; }
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
${["at", "results", "highlight"].map((phase) => `<img class="t3-native-drawer" data-phase="${phase}" src="file-mention-v0042-${theme}-${phase}-crop.png" alt="" aria-hidden="true" data-layout-ignore hidden>`).join("\n")}
</div>`).join("\n")}</div>
<script src="t3-code-gsap.min.js"></script><script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
const replacements = ${scriptJson(replacements)};
const stages = [...document.querySelectorAll('#root [data-t3-theme]')];
const nativeDrawerAllowed = Object.keys(defaults).every(key => key === 'theme' || key.endsWith('Frame') || options[key] === defaults[key]);
const resultRows = [
  [options.resultOneLabel, options.resultOneDirectory, options.selectedFilePath],
  [options.resultTwoLabel, options.resultTwoDirectory, options.resultTwoDirectory + '/' + options.resultTwoLabel],
  [options.resultThreeLabel, options.resultThreeDirectory, options.resultThreeDirectory + '/' + options.resultThreeLabel],
  [options.resultFourLabel, options.resultFourDirectory, options.resultFourLabel],
];
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
    for (const id of ['replyLead', 'replyTail']) {
      if (options[id] !== defaults[id] && node.textContent.includes(defaults[id])) {
        node.textContent = node.textContent.replaceAll(defaults[id], String(options[id]));
      }
    }
  }
  for (const section of stage.querySelectorAll('[data-t3-state]')) {
    const editor = section.querySelector('[data-testid="composer-editor"]');
    if (editor) {
      editor.setAttribute('aria-placeholder', options.composerPlaceholder);
      const text = editor.querySelector('[data-lexical-text]');
      if (text && section.dataset.t3State === 'at') text.textContent = options.inputPrefix + ' @';
      if (text && ['results', 'highlight'].includes(section.dataset.t3State)) text.textContent = options.inputPrefix + ' @' + options.query;
      if (text && section.dataset.t3State === 'chip') text.textContent = options.inputPrefix + ' ';
    }
    section.querySelectorAll('[data-testid="sidebar-row-card"]').forEach((row, index) => {
      const age = row.querySelector('span.tabular-nums.text-secondary-label');
      const ageKey = ['firstAge', 'secondAge', 'thirdAge', 'fourthAge', 'fifthAge'][index];
      if (age && ageKey && !age.querySelector('[role="status"]')) age.textContent = options[ageKey];
    });
    const answerFile = section.querySelector('.chat-markdown-file-link');
    if (answerFile) {
      const label = answerFile.querySelector('.truncate');
      if (label) label.textContent = options.replyFile;
      answerFile.setAttribute('href', 'hyfrme-demo/' + options.replyFilePath);
      answerFile.setAttribute('data-markdown-copy', '\\x60' + options.replyFilePath + '\\x60');
    }
    const chip = section.querySelector('[data-composer-mention-chip="true"]');
    if (chip) {
      const label = chip.querySelector('.truncate');
      if (label) label.textContent = options.selectedFileLabel;
      chip.setAttribute('aria-label', 'Preview ' + options.selectedFilePath);
    }
    section.querySelectorAll('[data-composer-item-id]').forEach((row, index) => {
      const item = resultRows[index];
      if (!item) return;
      const content = row.querySelector('span.flex');
      const label = content?.children[0];
      let directory = content?.children[1];
      if (!directory && item[1] && content) {
        directory = section.querySelector('[data-composer-item-id] span.flex')?.children[1]?.cloneNode(false);
        if (directory) content.append(directory);
      }
      if (label) label.textContent = item[0];
      if (directory) directory.textContent = item[1];
      const kind = row.getAttribute('data-composer-item-id')?.split(':')[1] ?? 'file';
      row.setAttribute('data-composer-item-id', 'path:' + kind + ':' + item[2]);
    });
    for (const element of section.querySelectorAll('[aria-label], [title]')) {
      for (const attribute of ['aria-label', 'title']) {
        const value = element.getAttribute(attribute);
        if (!value) continue;
        let next = value;
        for (const id of ['projectName', 'selectedThread', 'secondThread', 'thirdThread', 'fourthThread', 'fifthThread', 'branchName', 'activeBranch', 'thirdBranch', 'fourthBranch']) {
          if (options[id] !== defaults[id]) next = next.replaceAll(defaults[id], String(options[id]));
        }
        if (next !== value) element.setAttribute(attribute, next);
      }
    }
  }
}
const clock = { frame:0 };
function draw() {
  const frame = Math.round(clock.frame);
  const atFrame = Number(options.atFrame);
  const resultsFrame = Math.max(Number(options.resultsFrame), atFrame + 1);
  const highlightFrame = Math.max(Number(options.highlightFrame), resultsFrame + 1);
  const chipFrame = Math.max(Number(options.chipFrame), highlightFrame + 1);
  const active = frame < atFrame ? 0 : frame < resultsFrame ? 1 : frame < highlightFrame ? 2 : frame < chipFrame ? 3 : 4;
  for (const stage of stages) {
    const sections = [...stage.querySelectorAll('[data-t3-state]')];
    for (let index = 0; index < sections.length; index++) sections[index].hidden = index !== active;
    for (const drawer of stage.querySelectorAll('.t3-native-drawer')) {
      drawer.hidden = !nativeDrawerAllowed || drawer.dataset.phase !== sections[active].dataset.t3State;
    }
    if (stage.hidden) continue;
    if (active > 0 && active < 4 && !nativeDrawerAllowed) {
      const portal = sections[active].querySelector('[data-composer-drawer-layer="true"]');
      const editor = sections[active].querySelector('[data-testid="composer-editor"]');
      if (portal && editor) {
        const bounds = editor.getBoundingClientRect();
        const origin = stage.getBoundingClientRect();
        portal.style.position = 'absolute';
        portal.style.left = (bounds.left - origin.left + 5) + 'px';
        portal.style.bottom = 'auto';
        portal.style.top = (bounds.top - origin.top - portal.getBoundingClientRect().height) + 'px';
      }
    }
    const editor = sections[active].querySelector('[data-testid="composer-editor"]');
    if (editor && active > 0 && document.activeElement !== editor) editor.focus({ preventScroll:true });
    const chatScroll = sections[active].querySelector('.topbar-scroll-fade');
    if (chatScroll) chatScroll.scrollTop = 9;
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
  for (const phase of ["at", "results", "highlight"]) {
    const file = `file-mention-v0042-${theme}-${phase}-crop.png`;
    await copyFile(resolve(source, file), resolve(output, file));
  }
}
await copyFile(resolve(root, "public/ideas/assets/T3-CODE-LICENSE.txt"), resolve(output, "licenses/T3-CODE-LICENSE.txt"));
for (const file of ["T3-THIRD_PARTY_NOTICES.md", "PIERRE-TREES-LICENSE.md", "PIERRE-TREES-NOTICE.md"]) {
  await copyFile(resolve(root, "registry/blocks/t3-thread-switch/licenses", file), resolve(output, "licenses", file));
}
await writeFile(resolve(output, "registry-item.json"), JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: File Mention",
  description: "Type @ in T3 Code's composer, search a real Hyfrme project file, highlight it, and insert its native chip.",
  tags: ["composition", "app-ui", "t3-code", "file-mention", "hyfrme-port"],
  author: "Hyfrme", authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT",
  dimensions: dark.viewport, duration: dark.frames / dark.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    ...["dark", "light"].flatMap((theme) => ["at", "results", "highlight"].map((phase) => ({
      path: `file-mention-v0042-${theme}-${phase}-crop.png`,
      target: `compositions/file-mention-v0042-${theme}-${phase}-crop.png`, type: "hyperframes:asset",
    }))),
    ...["T3-CODE-LICENSE.txt", "T3-THIRD_PARTY_NOTICES.md", "PIERRE-TREES-LICENSE.md", "PIERRE-TREES-NOTICE.md"]
      .map((file) => ({ path: `licenses/${file}`, target: `THIRD_PARTY_LICENSES/t3-code/${file}`, type: "hyperframes:asset" })),
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2) + "\n");
await writeFile(resolve(output, "README.md"), `# T3 Code: File Mention\n\nThis 1200 × 659, 30 fps, four-second block captures T3 Code v0.0.42 in dark and light. The native local Hyfrme project file drawer opens from @, searches for logo, highlights logo-enter.html, and inserts its Lexical chip. No AI provider is connected; thread and answer copy are seeded.\n\nEditable variables cover the prompt, query, drawer results, selected path and chip, surrounding Hyfrme threads and conversation, appearance, and action frames. The default drawer image uses pixels from the official release; edited content renders from the native captured DOM. Source: https://github.com/pingdotgg/t3code/tree/${dark.sourceCommit}. T3 Code's MIT license and Pierre Trees notices are included. GSAP 3.14.2 controls seekable frames under its Standard License: https://gsap.com/standard-license/.\n`);
console.log(`Generated ${name} v0.0.42 from dark/light native root states and composer drawer portals.`);
