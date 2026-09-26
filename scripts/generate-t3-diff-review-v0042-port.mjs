import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-diff-review";
const shortName = "diff-review";
const output = resolve(root, `.work/${name}-v0042-candidate`);
const themes = {};
for (const theme of ["dark", "light"]) {
  const prefix = `${shortName}-v0042-${theme}`;
  themes[theme] = {
    fixture: JSON.parse(await readFile(resolve(source, `${prefix}-fixture.json`), "utf8")),
    cssVars: JSON.parse(await readFile(resolve(source, `${theme}-theme.json`), "utf8")),
    states: {}, shadows: {},
  };
  for (const phase of themes[theme].fixture.phases) {
    themes[theme].states[phase] = (await readFile(resolve(source, `${prefix}-${phase}.html`), "utf8"))
      .replaceAll('class="overflow-auto', 'data-layout-allow-overflow class="overflow-auto')
      .replace(/(<span[^>]*class="[^"]*\[text-box:trim-both_cap_alphabetic\][^"]*")/g, "$1 data-layout-ignore");
    themes[theme].shadows[phase] = JSON.parse(await readFile(resolve(source, `${prefix}-${phase}-shadows.json`), "utf8"));
  }
}
const dark = themes.dark.fixture;
const light = themes.light.fixture;
if (JSON.stringify(dark.phases) !== JSON.stringify(light.phases) || JSON.stringify(dark.events) !== JSON.stringify(light.events)) {
  throw new Error("Dark and light Diff Review captures have different phases or timing");
}
const phases = dark.phases;
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["branchName", "Branch name", "feature/logo-enter"],
  ["selectedThread", "Selected thread", "Build a logo intro"],
  ["otherThread", "Next thread", "Catalog motion audit"],
  ["threadThree", "Sidebar thread 3", "Grouped logo tests"],
  ["threadFour", "Sidebar thread 4", "Review final hold"],
  ["threadFive", "Sidebar thread 5", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ["message", "User message", "Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames."],
  ["replyStart", "Reply before file", "I found the Logo Enter timing in"],
  ["replyFile", "Reply file", "logo-enter.html"],
  ["replyEnd", "Reply after file", ". The final pass can extend the duration while keeping the last rendered frame still."],
  ["workedDuration", "Worked duration", "2m"],
  ["composerPlaceholder", "Composer placeholder", "Enable a provider in Settings to send a message"],
  ["providerStatus", "Provider status", "No provider available"],
  ["permissionMode", "Permission", "Full access"],
  ["workspaceMode", "Workspace", "Worktree"],
  ["diffScope", "Diff scope", "Working tree"],
  ["fileName", "Changed file name", "logo-enter.html"],
  ["logoClass", "HTML logo class", "logo"],
  ["logoText", "Changed logo text", "Hyfrme"],
  ["captionClass", "HTML caption class", "caption"],
  ["captionText", "Added caption text", "Logo Enter"],
  ["additions", "Added line count", "+4"],
  ["deletions", "Deleted line count", "-1"],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "theme", type: "string", label: "T3 Code appearance", default: "dark", options: ["dark", "light"] },
  { id: "renderMode", type: "string", label: "Render mode", default: "pixel-verified", options: ["pixel-verified", "editable DOM"] },
  ...Object.entries(dark.events).map(([phase, frame]) => ({ id: `${phase}Frame`, type: "number",
    label: `${phase[0].toUpperCase()}${phase.slice(1)} at frame`, default: frame, min: 0, max: 119, step: 1 })),
];
const defaults = Object.fromEntries(variables.map(({ id, default: value }) => [id, value]));
const replacements = Object.fromEntries(fields.filter(([id]) => !["replyFile", "workedDuration", "composerPlaceholder", "fileName",
  "logoClass", "logoText", "captionClass", "captionText", "additions", "deletions"].includes(id)).map(([id, , value]) => [value, id]));
const themesCss = Object.fromEntries(Object.entries(themes).map(([theme, info]) => [theme,
  Object.entries(info.cssVars).map(([key, value]) => `${key}:${value};`).join("")
]));
const fontTheme = Object.fromEntries(Object.entries(themes.dark.cssVars).filter(([key]) => key.includes("font-family") || key === "--font-sans" || key === "--font-mono"));
const scriptJson = (value) => JSON.stringify(value).replaceAll("</", "<\\/");
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const stages = ["dark", "light"].flatMap((theme) => phases.map((phase) =>
  `<div class="${theme} t3-stage t3-state" data-t3-theme="${theme}" data-t3-state="${phase}" style="${escapeAttribute(themesCss[theme])}"${theme === "light" || (theme === "dark" && phase !== "before") ? " hidden" : ""}>${themes[theme].states[phase]}</div>`)).join("\n");
const captures = ["dark", "light"].flatMap((theme) => Array.from({ length: 10 }, (_, row) =>
  `<div data-layout-ignore class="t3-pixel-capture" data-t3-pixel-theme="${theme}" data-t3-pixel-row="${row}" style="background-image:url(compositions/${name}-capture-${theme}-${String(row).padStart(2, "0")}.webp)" hidden></div>`)).join("\n");
const html = `<!doctype html>
<html lang="en" data-composition-variables='${escapeAttribute(JSON.stringify(variables))}'>
<head><meta charset="utf-8"></head><body><template>
<style>${css}</style><style>
  #root { position: relative; width: 100%; height: 100%; overflow: hidden; }
  .t3-stage { position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--background); color: var(--foreground); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
  .t3-stage[hidden], .t3-state[hidden] { display: none !important; }
  .t3-state:not([hidden]) { display: contents; }
  .t3-pixel-capture { position: absolute; inset: 0; z-index: 100; pointer-events: none; background-repeat: no-repeat; background-size: 14400px 659px; background-position: 0 0; }
  .t3-pixel-capture[hidden] { display: none !important; }
  .base-ui-disable-scrollbar { scrollbar-width: none; }
  .base-ui-disable-scrollbar::-webkit-scrollbar { display: none; }
  @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
  @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
  @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
  @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"); }
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
${stages}
${captures}
</div>
<script src="t3-code-gsap.min.js"></script><script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
const replacements = ${scriptJson(replacements)};
const shadowStates = ${scriptJson(Object.fromEntries(Object.entries(themes).map(([theme, info]) => [theme, info.shadows])))};
for (const stage of document.querySelectorAll('#root .t3-stage')) {
  for (const [key, value] of Object.entries(${scriptJson(fontTheme)})) stage.style.setProperty(key, value);
  stage.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
  const phase = stage.dataset.t3State;
  for (const shadow of shadowStates[stage.dataset.t3Theme][phase]) {
    const host = stage.querySelector('[data-hyfrme-shadow-id="' + shadow.id + '"]');
    if (!host) continue;
    const shadowRoot = host.attachShadow({ mode: 'open' });
    shadowRoot.innerHTML = shadow.html;
    if (host.tagName === 'DIFFS-CONTAINER') {
      for (const code of shadowRoot.querySelectorAll('pre[data-diff]')) code.style.fontFamily = '"Liberation Mono", monospace';
    }
    shadowRoot.adoptedStyleSheets = shadow.adoptedCss.map((css) => { const sheet = new CSSStyleSheet(); sheet.replaceSync(css); return sheet; });
  }
}
for (const stage of document.querySelectorAll('#root .t3-stage')) {
  const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const current = node.textContent.trim();
    const key = replacements[current];
    if (key && options[key] !== defaults[key]) node.textContent = node.textContent.replace(current, String(options[key]));
  }
  for (const editor of stage.querySelectorAll('[data-testid="composer-editor"]')) editor.setAttribute('aria-placeholder', String(options.composerPlaceholder));
  const replyFile = stage.querySelector('.chat-markdown-file-link .truncate');
  if (replyFile) replyFile.textContent = String(options.replyFile);
  const worked = [...stage.querySelectorAll('span')].find((element) => element.textContent === 'Worked for 2m');
  if (worked) worked.textContent = 'Worked for ' + options.workedDuration;
  for (const stat of stage.querySelectorAll('[role="group"][aria-label="4 additions, 1 deletions"]')) {
    const additions = stat.querySelector('.text-success');
    const deletions = stat.querySelector('.text-destructive');
    if (additions && deletions) {
      additions.textContent = options.additions;
      deletions.textContent = options.deletions;
      stat.setAttribute('aria-label', options.additions + ' additions, ' + options.deletions + ' deletions');
    }
  }
  for (const host of stage.querySelectorAll('diffs-container')) {
    const shadow = host.shadowRoot;
    if (!shadow) continue;
    for (const count of shadow.querySelectorAll('[data-additions-count]')) count.textContent = options.additions;
    for (const count of shadow.querySelectorAll('[data-deletions-count]')) count.textContent = options.deletions;
    const title = shadow.querySelector('[data-title] bdi');
    if (title) title.textContent = options.fileName;
    const codeWalker = document.createTreeWalker(shadow, NodeFilter.SHOW_TEXT);
    let codeNode;
    while ((codeNode = codeWalker.nextNode())) {
      if (!codeNode.parentElement?.closest('[data-code]')) continue;
      codeNode.textContent = codeNode.textContent.replaceAll('class="logo"', 'class="' + options.logoClass + '"')
        .replaceAll('class="caption"', 'class="' + options.captionClass + '"')
        .replaceAll('Hyfrme', options.logoText).replaceAll('Logo Enter', options.captionText);
    }
  }
}
const clock = { frame: 0 };
function draw() {
  const frame = Math.min(119, Math.max(0, Math.round(clock.frame)));
  const chooser = Number(options.chooserFrame);
  const stacked = Math.max(Number(options.stackedFrame), chooser + 1);
  const split = Math.max(Number(options.splitFrame), stacked + 1);
  const phase = frame < chooser ? 'before' : frame < stacked ? 'chooser' : frame < split ? 'stacked' : 'split';
  for (const stage of document.querySelectorAll('#root .t3-stage')) stage.hidden = stage.dataset.t3Theme !== options.theme || stage.dataset.t3State !== phase;
  const pixelMode = options.renderMode === 'pixel-verified';
  const row = Math.floor(frame / 12);
  for (const capture of document.querySelectorAll('[data-t3-pixel-theme]')) {
    const active = pixelMode && capture.dataset.t3PixelTheme === options.theme && Number(capture.dataset.t3PixelRow) === row;
    capture.hidden = !active;
    if (active) capture.style.backgroundPosition = '-' + ((frame % 12) * 1200) + 'px 0px';
  }
}
draw();
const timeline = gsap.timeline({ paused: true });
timeline.to(clock, { frame: 120, duration: 4, ease: 'none', onUpdate: draw });
window.__timelines['${name}'] = timeline;
</script></template></body></html>`;

await mkdir(resolve(output, "licenses"), { recursive: true });
await writeFile(resolve(output, `${name}.html`), html);
await writeFile(resolve(output, "t3-code-gsap.min.js"), gsap);
for (const theme of ["dark", "light"]) for (let row = 0; row < 10; row++) await copyFile(
  resolve(source, `${shortName}-v0042-${theme}-capture-${String(row).padStart(2, "0")}.webp`),
  resolve(output, `${name}-capture-${theme}-${String(row).padStart(2, "0")}.webp`));
for (const [src, dst] of [
  [resolve(root, "public/ideas/assets/T3-CODE-LICENSE.txt"), resolve(output, "licenses/T3-CODE-LICENSE.txt")],
  [resolve(root, "assets/t3-code/v0.0.35/source-file-open-t3-third-party-notices.md"), resolve(output, "licenses/T3-THIRD_PARTY_NOTICES.md")],
  [resolve(root, "assets/t3-code/v0.0.35/source-file-open-pierre-diffs-license.md"), resolve(output, "licenses/PIERRE-DIFFS-LICENSE.md")],
]) await copyFile(src, dst);
await writeFile(resolve(output, "README.md"), `# T3 Code: Diff Review\n\nThis four-second block reproduces the T3 Code v0.0.42 Working tree diff for a real Hyfrme Logo Enter +4/-1 change, then switches from stacked to split review. Desktop dark and light captures use the pinned T3 release at 1200 × 659 and 30 fps.\n\nPixel-verified mode matches the native recording frame for frame. Editable DOM mode exposes project, thread, prompt, reply, changed file and code, diff counts, theme, view states, and timing. The diff viewer is restored from captured shadow DOM and styles. Source: https://github.com/pingdotgg/t3code/tree/${dark.sourceCommit}.\n`);
await writeFile(resolve(output, "registry-item.json"), `${JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json", name, type: "hyperframes:block", title: "T3 Code: Diff Review",
  description: "Open a seeded Hyfrme source change in T3 Code’s Working tree diff, then change from stacked to split review.",
  tags: ["composition", "app-ui", "t3-code", "diff-review", "hyfrme-port"], author: "Hyfrme",
  authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT", dimensions: dark.viewport, duration: dark.frames / dark.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    ...["dark", "light"].flatMap((theme) => Array.from({ length: 10 }, (_, row) => ({ path: `${name}-capture-${theme}-${String(row).padStart(2, "0")}.webp`, target: `compositions/${name}-capture-${theme}-${String(row).padStart(2, "0")}.webp`, type: "hyperframes:asset" }))),
    { path: "licenses/T3-CODE-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt", type: "hyperframes:asset" },
    { path: "licenses/T3-THIRD_PARTY_NOTICES.md", target: "THIRD_PARTY_LICENSES/t3-code/T3-THIRD_PARTY_NOTICES.md", type: "hyperframes:asset" },
    { path: "licenses/PIERRE-DIFFS-LICENSE.md", target: "THIRD_PARTY_LICENSES/pierre/PIERRE-DIFFS-LICENSE.md", type: "hyperframes:asset" },
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2)}\n`);
console.log(`Generated ${name} from native v0.0.42 captures in desktop dark and light.`);
