import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-worked-trace";
const output = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, `.work/${name}-v0042-candidate`));
const fixtures = Object.fromEntries(await Promise.all(["dark", "light"].map(async (theme) => [theme,
  JSON.parse(await readFile(resolve(source, `worked-trace-v0042-${theme}-fixture.json`), "utf8")),
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
  await Promise.all(dark.phases.map(async (phase) => (await readFile(resolve(source, `worked-trace-v0042-${theme}-${phase}.html`), "utf8"))
    .replace('class="h-full max-h-[inherit] overflow-auto', 'data-layout-allow-overflow class="h-full max-h-[inherit] overflow-auto')
    .replace(/(<span[^>]*class="[^"]*\[text-box:trim-both_cap_alphabetic\][^"]*")/g, "$1 data-layout-ignore")
    .replace(/(<span[^>]*class="pointer-events-none absolute[^"]*")/g, "$1 data-layout-allow-overflow"))),
])));
const fields = [
  ["projectName", "Project", "hyfrme"],
  ["projectAvatar", "Project avatar", "HE"],
  ["firstThread", "Selected thread", "Build a logo intro"],
  ["secondThread", "Sidebar thread 2", "Catalog motion audit"],
  ["thirdThread", "Sidebar thread 3", "Grouped logo tests"],
  ["fourthThread", "Sidebar thread 4", "Review final hold"],
  ["fifthThread", "Sidebar thread 5", "Search reveal timing"],
  ["firstAge", "Selected thread age", "10h"],
  ["secondAge", "Second thread age", "12h"],
  ["thirdAge", "Third thread age", "17h"],
  ["fourthAge", "Fourth thread age", "1d"],
  ["fifthAge", "Fifth thread age", "2d"],
  ["firstBranch", "Selected thread branch", "main"],
  ["thirdBranch", "Third thread branch", "logo/assemble"],
  ["fourthBranch", "Fourth thread branch", "logo/hold-final"],
  ["question", "User message", "Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames."],
  ["questionTime", "User message time", "yesterday at 9:22 PM"],
  ["replyLead", "Answer opening", "I found the Logo Enter timing in"],
  ["fileMention", "Answer file mention", "logo-enter.html"],
  ["replyTail", "Answer ending", ". The final pass can extend the duration while keeping the last rendered frame still."],
  ["replyTime", "Answer time", "yesterday at 9:24 PM"],
  ["workedDuration", "Worked duration", "2m"],
  ["command", "Command", "npm run verify:showcases"],
  ["composerPlaceholder", "Composer placeholder", "Enable a provider in Settings to send a message"],
  ["providerStatus", "Provider status", "Open provider settings"],
  ["workspaceMode", "Workspace mode", "Worktree"],
  ["activeBranch", "Workspace branch", "feature/logo-enter"],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "theme", type: "string", label: "T3 Code appearance", default: "dark", options: ["dark", "light"] },
  { id: "openFrame", type: "number", label: "Open Worked trace at frame", default: dark.events.open, min: 1, max: 110, step: 1 },
  { id: "expandFrame", type: "number", label: "Rotate command disclosure at frame", default: dark.events.expand, min: 2, max: 115, step: 1 },
  { id: "closeFrame", type: "number", label: "Close Worked trace at frame", default: dark.events.close, min: 3, max: 118, step: 1 },
  { id: "persistedFrame", type: "number", label: "Show reloaded closed state at frame", default: dark.events.persisted, min: 4, max: 119, step: 1 },
];
const defaults = Object.fromEntries(variables.map(({ id, default: value }) => [id, value]));
const replacements = Object.fromEntries(fields.filter(([id]) => !id.endsWith("Age") &&
  !["projectName", "projectAvatar", "firstBranch", "workedDuration"].includes(id))
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
.t3-stage[hidden], .t3-state[hidden] { display:none !important; }
.t3-state:not([hidden]) { display:contents; }
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
${states[theme].map((body, index) => `<div class="t3-state" data-t3-state="${dark.phases[index]}"${index ? " hidden" : ""}>${body}</div>`).join("\n")}</div>`).join("\n")}
</div><script src="t3-code-gsap.min.js"></script><script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
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
    if (current === defaults.projectName && options.projectName !== defaults.projectName) {
      node.textContent = node.textContent.replace(current, String(options.projectName));
      continue;
    }
    if (current === defaults.projectAvatar && options.projectAvatar !== defaults.projectAvatar) {
      node.textContent = node.textContent.replace(current, String(options.projectAvatar));
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
      if (index === 0 && options.firstBranch !== defaults.firstBranch) {
        const branchWalker = document.createTreeWalker(row, NodeFilter.SHOW_TEXT);
        let branchNode;
        while ((branchNode = branchWalker.nextNode())) {
          if (branchNode.textContent.trim() === defaults.firstBranch) {
            branchNode.textContent = branchNode.textContent.replace(defaults.firstBranch, String(options.firstBranch));
          }
        }
      }
    });
    const worked = [...section.querySelectorAll('[data-timeline-row-kind="turn-fold"] button span')]
      .find((element) => element.textContent.trim() === 'Worked for 2m');
    if (worked) worked.textContent = 'Worked for ' + options.workedDuration;
    for (const element of section.querySelectorAll('[aria-label], [title]')) {
      for (const attribute of ['aria-label', 'title']) {
        const value = element.getAttribute(attribute);
        if (!value) continue;
        let next = value;
        for (const id of ['projectName', 'firstThread', 'secondThread', 'thirdThread', 'fourthThread', 'fifthThread', 'firstBranch', 'thirdBranch', 'fourthBranch', 'activeBranch', 'command']) {
          if (options[id] !== defaults[id]) next = next.replaceAll(defaults[id], String(options[id]));
        }
        if (next !== value) element.setAttribute(attribute, next);
      }
    }
    if (options.activeBranch !== defaults.activeBranch) {
      for (const input of section.querySelectorAll('input[value="feature/logo-enter"]')) {
        input.value = String(options.activeBranch);
        input.setAttribute('value', String(options.activeBranch));
      }
    }
  }
}
const clock = { frame:0 };
function draw() {
  const frame = Math.round(clock.frame);
  const open = Number(options.openFrame);
  const expand = Math.max(Number(options.expandFrame), open + 1);
  const close = Math.max(Number(options.closeFrame), expand + 1);
  const persisted = Math.max(Number(options.persistedFrame), close + 1);
  const active = frame < open ? 0 : frame < expand ? 1 : frame < close ? 2 : frame < persisted ? 3 : 4;
  for (const stage of stages) {
    const sections = [...stage.querySelectorAll('[data-t3-state]')];
    for (let index = 0; index < sections.length; index++) sections[index].hidden = index !== active;
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
await copyFile(resolve(root, "public/ideas/assets/T3-CODE-LICENSE.txt"), resolve(output, "licenses/T3-CODE-LICENSE.txt"));
for (const file of ["T3-THIRD_PARTY_NOTICES.md", "PIERRE-TREES-LICENSE.md", "PIERRE-TREES-NOTICE.md"]) {
  await copyFile(resolve(root, "registry/blocks/t3-thread-switch/licenses", file), resolve(output, "licenses", file));
}
await writeFile(resolve(output, "registry-item.json"), JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: Worked Trace",
  description: "Open a native v0.0.42 completed-turn trace, reveal its one command, rotate the command disclosure, close, and reload.",
  tags: ["composition", "app-ui", "t3-code", "agent", "worked-trace", "hyfrme-port"],
  author: "Hyfrme", authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT",
  dimensions: dark.viewport, duration: dark.frames / dark.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    { path: "licenses/T3-CODE-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt", type: "hyperframes:asset" },
    ...["T3-THIRD_PARTY_NOTICES.md", "PIERRE-TREES-LICENSE.md", "PIERRE-TREES-NOTICE.md"].map((file) => ({
      path: `licenses/${file}`, target: `THIRD_PARTY_LICENSES/t3-code/${file}`, type: "hyperframes:asset",
    })),
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2) + "\n");
await writeFile(resolve(output, "README.md"), `# T3 Code: Worked Trace\n\nThis four-second HyperFrames block reproduces official T3 Code v0.0.42 at 1200 × 659 and 30 fps in dark or light mode. A completed turn's Worked for 2m row opens directly to one command. The command disclosure rotates without a separate body for this seeded activity. The trace closes and stays closed after a native reload. The Hyfrme conversation and command result are seeded; disclosure clicks and reload run in the official app. No AI provider or GitHub account runs.\n\nCustomize project, threads, conversation, command, appearance, and all four event frames. Use matching values with adjacent T3 Code blocks. Source: https://github.com/pingdotgg/t3code/tree/${dark.sourceCommit}. Installed licenses include T3 Code MIT and Pierre Trees notices for the file icon. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.\n`);
console.log(`Generated ${name} from native T3 Code v0.0.42 dark/light Worked Trace states.`);
