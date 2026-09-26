import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const output = resolve(root, ".work/t3-thread-search-v0042-candidate");
const name = "t3-thread-search";
const variants = ["dark", "light"];
const fixtures = await Promise.all(variants.map(async (theme) =>
  JSON.parse(await readFile(resolve(source, `thread-search-${theme}-fixture.json`), "utf8"))));
if (JSON.stringify(fixtures[0].events) !== JSON.stringify(fixtures[1].events) ||
  JSON.stringify(fixtures[0].stateKeys) !== JSON.stringify(fixtures[1].stateKeys)) {
  throw new Error("Official dark and light search events differ");
}
const themes = await Promise.all(variants.map(async (theme) =>
  JSON.parse(await readFile(resolve(source, `${theme}-theme.json`), "utf8"))));
const snapshots = await Promise.all(fixtures.map(async (fixture) => Object.fromEntries(await Promise.all(
  Object.entries(fixture.states).map(async ([key, state]) => [key, (await readFile(resolve(source, state.file), "utf8"))
    .replace(/(<span[^>]*class="[^"]*\[text-box:trim-both_cap_alphabetic\][^"]*")/g, "$1 data-layout-ignore")
    .replaceAll('<span class="pointer-events-none absolute', '<span data-layout-allow-overflow class="pointer-events-none absolute')]),
))));
const css = await readFile(resolve(source, "t3.css"), "utf8");
const gsap = await readFile(resolve(root, "registry/blocks/before-after/gsap.min.js"), "utf8");
const icons = await readFile(resolve(root, ".work/t3-v0042-bin/t3-0.0.42-linux-x64/client/assets/pierre-icons-vHQ4qnbe.js"), "utf8");
const htmlIcon = icons.match(/<symbol id="file-tree-builtin-html"[\s\S]*?<\/symbol>/)?.[0];
if (!htmlIcon) throw new Error("Official T3 file icon is missing");
const ages = fixtures[0].nativeAges;
const strings = [
  ["projectName", "Project name", "hyfrme"],
  ["projectAvatar", "Project avatar", "HE"],
  ["branchName", "Current branch", "main"],
  ["firstThread", "First thread", "Catalog motion audit"],
  ["secondThread", "Second thread", "Build a logo intro"],
  ["thirdThread", "Third thread", "Grouped logo tests"],
  ["fourthThread", "Fourth thread", "Review final hold"],
  ["fifthThread", "Fifth thread", "Search reveal timing"],
  ["settledThread", "Settled thread", "Verify Logo Enter parity"],
  ["firstAge", "First thread age", ages["Catalog motion audit"]],
  ["secondAge", "Second thread age", ages["Build a logo intro"]],
  ["thirdAge", "Third thread age", ages["Grouped logo tests"]],
  ["fourthAge", "Fourth thread age", ages["Review final hold"]],
  ["fifthAge", "Fifth thread age", ages["Search reveal timing"]],
  ["settledAge", "Settled thread age", ages["Verify Logo Enter parity"]],
  ["firstQuery", "First search query", "logo"],
  ["finalQuery", "Selected search query", "grouped logo"],
  ["firstPrompt", "First thread prompt", "Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames."],
  ["firstReplyLead", "First reply before file", "I found the Logo Enter timing in"],
  ["firstReplyFile", "First reply file", "logo-enter.html"],
  ["firstReplyTail", "First reply after file", ". The final pass can extend the duration while keeping the last rendered frame still."],
  ["selectedPrompt", "Selected thread prompt", "Gather the source marks into a Hyfrme logo lockup."],
  ["selectedReply", "Selected thread reply", "The marks should arrive separately, align on the same baseline, and resolve into the Hyfrme wordmark. Keep the source credit visible at the final hold."],
  ["composerPlaceholder", "Composer placeholder", "Enable a provider in Settings to send a message"],
];
const timing = Object.entries(fixtures[0].events).map(([event, frame]) => [
  `${event}Frame`, `${event[0].toUpperCase()}${event.slice(1)} at frame`, frame,
]);
const variables = [
  { id: "theme", type: "string", label: "Theme", default: "dark", options: variants },
  ...strings.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  ...timing.map(([id, label, value]) => ({ id, type: "number", label, default: value, min: 0, max: 119, step: 1 })),
];
const defaults = Object.fromEntries(variables.map(({ id, default: value }) => [id, value]));
const themeStyles = themes.map((theme) => Object.entries(theme).map(([key, value]) => `${key}:${value};`).join(""));
const fontThemes = themes.map((theme) => Object.fromEntries(Object.entries(theme).filter(([key]) =>
  key.includes("font-family") || key === "--font-sans" || key === "--font-mono")));
const textMap = Object.fromEntries(strings.filter(([id]) => !id.endsWith("Age") && !["firstQuery", "finalQuery"].includes(id))
  .map(([id, , value]) => [value, id]));
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const scriptJson = (value) => JSON.stringify(value).replaceAll("</", "<\\/");
const html = `<!doctype html>
<html lang="en" data-composition-variables='${escapeAttribute(JSON.stringify(variables))}'>
<head><meta charset="utf-8"></head><body><template>
<style>${css}</style>
<style>
  #root,.t3-stage,.t3-source-root { position:relative; width:100%; height:100%; overflow:hidden; }
  .t3-stage { background:var(--background); color:var(--foreground); font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif; }
  .t3-stage * { transition:none !important; }
  .t3-stage.t3-search-hover .t3-source-root div:has(> span > input[aria-label="Search threads"]):has(> svg.lucide-search) { background-color:var(--sidebar-row-hover); color:var(--sidebar-foreground); }
  .base-ui-disable-scrollbar { scrollbar-width:none; }
  .base-ui-disable-scrollbar::-webkit-scrollbar { display:none; }
  @font-face { font-family:"Apple Color Emoji"; src:local("Apple Color Emoji"); }
  @font-face { font-family:"Segoe UI Emoji"; src:local("Segoe UI Emoji"); }
  @font-face { font-family:"Segoe UI Symbol"; src:local("Segoe UI Symbol"); }
  @font-face { font-family:"SFMono-Regular"; src:local("SFMono-Regular"); }
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
  <div class="dark t3-stage" style='${escapeAttribute(themeStyles[0])}'><svg data-layout-ignore aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden">${htmlIcon}</svg><div class="t3-source-root"></div></div>
</div>
<script src="t3-code-gsap.min.js"></script>
<script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
const snapshots = ${scriptJson(snapshots)};
const fixtures = ${scriptJson(fixtures.map(({ states, stateKeys, threadRows, events }) => ({ states, stateKeys, threadRows, events })))};
const themes = ${scriptJson(themeStyles)};
const fontThemes = ${scriptJson(fontThemes)};
const textMap = ${scriptJson(textMap)};
const entries = ${scriptJson([
  ["firstThread", "firstAge"], ["secondThread", "secondAge"], ["thirdThread", "thirdAge"],
  ["fourthThread", "fourthAge"], ["fifthThread", "fifthAge"], ["settledThread", "settledAge"],
])};
const stage = document.querySelector('#root .t3-stage');
const surface = stage.querySelector('.t3-source-root');
const themeIndex = options.theme === 'light' ? 1 : 0;
stage.classList.toggle('dark', themeIndex === 0);
stage.classList.toggle('light', themeIndex === 1);
stage.style.cssText = themes[themeIndex];
for (const [key, value] of Object.entries(fontThemes[themeIndex])) stage.style.setProperty(key, value);
stage.style.fontFamily = '-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif';
const source = fixtures[themeIndex];
const changedText = Object.entries(textMap).filter(([original, key]) => String(options[key]) !== String(defaults[key]));
const contentChanged = entries.some(([title, age]) => options[title] !== defaults[title] || options[age] !== defaults[age]) || options.projectName !== defaults.projectName || options.projectAvatar !== defaults.projectAvatar;
const queryChanged = options.firstQuery !== defaults.firstQuery || options.finalQuery !== defaults.finalQuery;
const sourceEvents = Object.entries(source.events);
const targetEvents = sourceEvents.map(([event, frame]) => [event, Math.max(0, Math.min(119, Number(options[event + 'Frame']) || 0))]);
const timingChanged = targetEvents.some(([event, frame]) => frame !== source.events[event]);
function sourceFrameAt(frame) {
  if (!timingChanged) return frame;
  const anchors = [[0,0], ...targetEvents.map(([event, targetFrame]) => [targetFrame, source.events[event]]), [119,119]];
  anchors.sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < anchors.length; i++) {
    if (frame > anchors[i][0]) continue;
    const [a, b] = anchors[i-1], [c, d] = anchors[i];
    return Math.max(0, Math.min(119, Math.round(c === a ? d : b + (d-b) * (frame-a) / (c-a))));
  }
  return 119;
}
function replaceText() {
  if (!changedText.length) return;
  const walker = document.createTreeWalker(surface, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const exact = node.textContent.trim();
    const key = textMap[exact];
    if (key && options[key] !== defaults[key]) node.textContent = node.textContent.replace(exact, String(options[key]));
  }
  for (const element of surface.querySelectorAll('[aria-label],[aria-placeholder],[title]')) {
    for (const attribute of ['aria-label','aria-placeholder','title']) {
      let value = element.getAttribute(attribute);
      if (!value) continue;
      for (const [original, key] of changedText) value = value.replaceAll(original, String(options[key]));
      element.setAttribute(attribute, value);
    }
  }
}
function queryFor(nativeQuery, sourceFrame) {
  if (!queryChanged || !nativeQuery) return nativeQuery;
  const first = sourceFrame < source.events.clear;
  const original = first ? defaults.firstQuery : defaults.finalQuery;
  const edited = String(first ? options.firstQuery : options.finalQuery);
  return edited.slice(0, Math.max(1, Math.round(nativeQuery.length * edited.length / original.length)));
}
function rebuildResults(query, nativeState) {
  if (!query || (!queryChanged && !contentChanged)) return;
  const list = surface.querySelector('#sidebar-thread-search-results');
  const input = surface.querySelector('input[aria-label="Search threads"]');
  if (!list || !input) return;
  const matches = entries.filter(([title]) => String(options[title]).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const nativeActive = Number(nativeState.activeDescendant?.match(/-(\\d+)$/)?.[1] ?? 0);
  const active = Math.min(nativeActive, Math.max(0, matches.length-1));
  if (!matches.length) {
    const empty = document.createElement('p');
    empty.className = 'px-2 py-6 text-center text-xs text-sidebar-muted-foreground';
    empty.textContent = 'No threads found';
    list.replaceWith(empty);
  } else {
    list.innerHTML = matches.map(([title, age], index) => {
      const row = document.createElement('div');
      row.innerHTML = source.threadRows[defaults[title]];
      const button = row.querySelector('button[role="option"]');
      button.id = 'sidebar-thread-search-result-' + index;
      button.setAttribute('aria-selected', String(index === active));
      if (index !== active) button.className = button.className.replace('bg-sidebar-row-active text-sidebar-foreground', 'text-sidebar-muted-foreground/75 hover:bg-sidebar-row-hover hover:text-sidebar-foreground');
      const titleNode = button.querySelector('span.min-w-0.flex-1.truncate');
      if (titleNode) titleNode.textContent = String(options[title]);
      const ageNode = button.querySelector('span.tabular-nums');
      if (ageNode) ageNode.textContent = String(options[age]);
      button.setAttribute('aria-label', String(options[title]) + ', ' + String(options.projectName));
      const avatar = button.querySelector('text');
      if (avatar) avatar.textContent = String(options.projectAvatar);
      return row.innerHTML;
    }).join('');
  }
  input.setAttribute('aria-expanded', String(matches.length > 0));
  input.setAttribute('aria-activedescendant', matches.length ? 'sidebar-thread-search-result-' + active : '');
}
function setAges() {
  for (const row of surface.querySelectorAll('[data-testid="sidebar-row-card"]')) {
    const title = row.querySelector('span.min-w-0.flex-1.text-sm')?.textContent?.trim();
    const match = entries.find(([key]) => options[key] === title);
    if (!match) continue;
    const age = row.querySelector('span.tabular-nums.text-secondary-label');
    if (age) age.textContent = String(options[match[1]]);
  }
}
let rendered;
const clock = { frame: 0 };
function draw() {
  const frame = Math.max(0, Math.min(119, Math.round(clock.frame)));
  const sourceFrame = sourceFrameAt(frame);
  const stateKey = source.stateKeys[sourceFrame];
  const nativeState = source.states[stateKey];
  const query = queryFor(nativeState.query, sourceFrame);
  const cacheKey = stateKey + '\\0' + query;
  if (rendered === cacheKey) return;
  rendered = cacheKey;
  stage.classList.toggle('t3-search-hover', sourceFrame < source.events.reload);
  surface.innerHTML = snapshots[themeIndex][stateKey];
  const input = surface.querySelector('input[aria-label="Search threads"]');
  if (input) {
    input.value = query;
    input.setAttribute('value', query);
    if (nativeState.focused) {
      input.style.caretColor = 'transparent';
      input.focus({ preventScroll:true });
      input.setSelectionRange(query.length, query.length);
    }
    if (query.length >= defaults.finalQuery.length) input.style.transform = 'translateX(-2px)';
  }
  replaceText();
  setAges();
  rebuildResults(query, nativeState);
}
draw();
const timeline = gsap.timeline({ paused:true });
timeline.to(clock, { frame:120, duration:4, ease:'none', onUpdate:draw });
window.__timelines['${name}'] = timeline;
</script></template></body></html>`;

await mkdir(resolve(output, "licenses"), { recursive: true });
await writeFile(resolve(output, `${name}.html`), html);
await writeFile(resolve(output, "t3-code-gsap.min.js"), gsap);
await copyFile(resolve(root, "parity/t3-gallery/assets/T3-CODE-LICENSE.txt"), resolve(output, "licenses/T3-CODE-LICENSE.txt"));
await writeFile(resolve(output, "registry-item.json"), `${JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: Thread Search",
  description: "Search real T3 Code v0.0.42 sidebar threads, navigate results, and select a thread in an editable Hyfrme workspace.",
  tags: ["composition", "app-ui", "t3-code", "thread-search", "hyfrme-port"],
  author: "Hyfrme", authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT",
  dimensions: fixtures[0].viewport, duration: 4,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    { path: "licenses/T3-CODE-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt", type: "hyperframes:asset" },
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2)}\n`);
await writeFile(resolve(output, "README.md"), `# T3 Code: Thread Search\n\nThis standalone 120-frame block reproduces the official desktop T3 Code v0.0.42 sidebar search at 1200 × 659 in dark and light. It shows native query filtering, keyboard result navigation, Clear, Enter selection, and the selected thread after reload. The project, conversations, and ages are seeded local Hyfrme data; no provider or GitHub action runs in the block.\n\nCustomize theme, thread titles and ages, both search queries, message copy, composer copy, and beat timing. Installed source has no Hyfrme runtime dependency. Official source: https://github.com/pingdotgg/t3code/tree/719a76ca1dbf5490f1aa33ffb9966301e02be9a9. The T3 Code MIT notice is included. GSAP 3.14.2 is included for offline frame control under its Standard License: https://gsap.com/standard-license/.\n`);
console.log(`Generated ${name} v0.0.42 candidate from ${Object.keys(fixtures[0].states).length} states per theme.`);
