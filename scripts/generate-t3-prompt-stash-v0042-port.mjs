import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { isDeepStrictEqual } from "node:util";
import { assertT3CaptureImages } from "./t3-capture-images.mjs";
import { nativeT3MonoFaces } from "./t3-native-fonts.mjs";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-prompt-stash";
const output = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, `.work/${name}-v0042-candidate`));
const fixtures = Object.fromEntries(await Promise.all(["dark", "light"].map(async (theme) => [theme,
  JSON.parse(await readFile(resolve(source, `prompt-stash-v0042-${theme}-fixture.json`), "utf8")),
])));
const { dark, light } = fixtures;
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const replayPath = resolve(source, "prompt-stash-v0042-dark-replay.json");
const replayBytes = await readFile(replayPath);
const replay = JSON.parse(replayBytes);
const nativeFrames = replay.themes.dark;
assertT3CaptureImages(replay, dark, "dark");
if (hash(replayBytes) !== dark.darkReplayMetadataSha256 || replay.slug !== name ||
  replay.captureVersion !== dark.captureVersion ||
  hash(await readFile(resolve(root, replay.clockProvenance.path))) !== replay.clockProvenance.sha256 ||
  hash(await readFile(resolve(root, nativeFrames.reference))) !== nativeFrames.referenceSha256 ||
  dark.referenceSha256 !== nativeFrames.referenceSha256) throw new Error("Native Prompt Stash replay pin changed");
for (const fixture of [dark, light]) {
  if (hash(await readFile(resolve(root, fixture.captureAuthority.provenance))) !== fixture.captureProvenanceSha256) {
    throw new Error('Native Prompt Stash capture provenance changed');
  }
}
const originalBytes = await readFile(resolve(root, nativeFrames.originalFixture));
const { captureVersion, captureAuthority, captureProvenanceSha256, captureSpriteSha256, captureSpriteFrameCount,
  captureFrameImageIndices, darkReplayMetadataSha256, ...originalFields } = dark;
originalFields.referenceSha256 = JSON.parse(originalBytes).referenceSha256;
if (hash(originalBytes) !== nativeFrames.originalFixtureSha256 ||
  !isDeepStrictEqual(originalFields, JSON.parse(originalBytes))) throw new Error("Original Prompt Stash fields changed");
const rgbaFrames = path => execFileSync("ffmpeg", ["-v", "error", "-i", path,
  "-pix_fmt", "rgba", "-f", "framehash", "-hash", "sha256", "-"], { encoding: "utf8" })
  .split("\n").filter(line => line && !line.startsWith("#"))
  .map(line => line.split(",").at(-1).trim());
const decoded = rgbaFrames(resolve(root, nativeFrames.reference));
if (decoded.length !== 120 || nativeFrames.images.length !== 3) throw new Error("Native Prompt Stash frames incomplete");
for (const [index, image] of nativeFrames.images.entries()) {
  if (hash(await readFile(resolve(source, image.file))) !== image.pngSha256 ||
    rgbaFrames(resolve(source, image.file))[0] !== image.rgbaSha256 ||
    nativeFrames.frameImageIndices[image.firstFrame] !== index) throw new Error("Native Prompt Stash PNG changed");
}
for (const [frame, rgba] of decoded.entries()) {
  const image = nativeFrames.images[nativeFrames.frameImageIndices[frame]];
  if (rgba !== nativeFrames.rgbaSha256[frame] || rgba !== image.rgbaSha256 ||
    nativeFrames.sourcePngSha256[frame] !== image.pngSha256) throw new Error("Native Prompt Stash frame changed: " + frame);
}
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
    let body = await readFile(resolve(source, `prompt-stash-v0042-${theme}-${phase}.html`), "utf8");
    body = body.replace('class="h-full max-h-[inherit] overflow-auto', 'data-layout-allow-overflow class="h-full max-h-[inherit] overflow-auto')
      .replace(/(<span[^>]*class="[^"]*\[text-box:trim-both_cap_alphabetic\][^"]*")/g, "$1 data-layout-ignore")
      .replace(/(<span[^>]*class="pointer-events-none absolute[^"]*")/g, "$1 data-layout-allow-overflow")
      .replace('data-prompt-stash-badge="true"', 'data-layout-ignore data-prompt-stash-badge="true"');
    if (phase === "menu" || phase === "persisted-menu") {
      const portal = await readFile(resolve(source, `prompt-stash-v0042-${theme}-${phase}-portal.html`), "utf8");
      body += portal.replace('<div ', '<div data-layout-ignore ');
    }
    return body;
  })),
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
  ["prompt", "Prompt to stash", dark.prompt],
  ["stashLabel", "Stash label", "Stash"],
  ["stashAge", "Stash item age", "just now"],
  ["composerPlaceholder", "Empty composer placeholder", "Enable a provider in Settings to send a message"],
  ["providerStatus", "Provider status", "Open provider settings"],
  ["workspaceMode", "Workspace mode", "Worktree"],
  ["activeBranch", "Workspace branch", "feature/logo-enter"],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "theme", type: "string", label: "T3 Code appearance", default: "dark", options: ["dark", "light"] },
  { id: "stashFrame", type: "number", label: "Stash prompt at frame", default: dark.events.stash, min: 1, max: 108, step: 1 },
  { id: "menuFrame", type: "number", label: "Open badge drawer at frame", default: dark.events.menu, min: 2, max: 109, step: 1 },
  { id: "persistedMenuFrame", type: "number", label: "Show reloaded drawer at frame", default: dark.events.persistedMenu, min: 3, max: 110, step: 1 },
  { id: "recallFrame", type: "number", label: "Restore from drawer at frame", default: dark.events.recall, min: 4, max: 111, step: 1 },
  { id: "stashAgainFrame", type: "number", label: "Stash again at frame", default: dark.events.stashAgain, min: 5, max: 118, step: 1 },
  { id: "directRecallFrame", type: "number", label: "Restore directly at frame", default: dark.events.directRecall, min: 6, max: 119, step: 1 },
];
const defaults = Object.fromEntries(variables.map(({ id, default: value }) => [id, value]));
const replacements = Object.fromEntries(fields.filter(([id]) => (!id.endsWith("Age") || id === "stashAge") &&
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
/* Preserve native T3 typography when HyperFrames compiles the block. */
  .t3-stage, .t3-stage *:not([text-rendering]) { text-rendering: auto; }
  /* Native Submit buttons must not animate inherited clip visibility. */
  .t3-stage button[type="submit"].transition-all { transition-property: background-color, color, box-shadow, transform, scale, opacity; }
.t3-stage[hidden], .t3-state[hidden], .t3-native-capture[hidden] { display:none !important; }
.t3-native-capture { position:absolute; inset:0; width:1200px; height:659px; pointer-events:none; }
.t3-state:not([hidden]) { display:contents; }
.base-ui-disable-scrollbar { scrollbar-width:none; }
.base-ui-disable-scrollbar::-webkit-scrollbar { display:none; }
@font-face { font-family:"Apple Color Emoji"; src:local("Apple Color Emoji"); }
@font-face { font-family:"Segoe UI Emoji"; src:local("Segoe UI Emoji"); }
@font-face { font-family:"Segoe UI Symbol"; src:local("Segoe UI Symbol"); }
@font-face { font-family:"SFMono-Regular"; src:local("SFMono-Regular"); }
${nativeT3MonoFaces}
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
<canvas class="t3-native-capture" width="1200" height="659" data-layout-ignore hidden></canvas>
<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;overflow:hidden" aria-hidden="true" data-layout-ignore>${sprite}</svg>
${["dark", "light"].map((theme) => `<div class="t3-stage ${theme}" data-t3-theme="${theme}" style="${themeStyles[theme].replaceAll('"', '&quot;')}"${theme === "light" ? " hidden" : ""}>
${states[theme].map((body, index) => `<div class="t3-state" data-t3-state="${dark.phases[index]}"${index ? " hidden" : ""}>${body}</div>`).join("\n")}</div>`).join("\n")}
</div><script src="t3-code-gsap.min.js"></script><script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
const pixelMode = options.theme === 'dark' && Object.entries(defaults).every(([key, value]) => key === 'theme' || options[key] === value);
const nativeFrames = ${scriptJson({ images: nativeFrames.images.map(({ file }) => 'compositions/' + file), mapping: nativeFrames.frameImageIndices })};
const replacements = ${scriptJson(replacements)};
const stages = [...document.querySelectorAll('#root [data-t3-theme]')];
for (const stage of stages) {
  stage.hidden = pixelMode || stage.dataset.t3Theme !== options.theme;
  stage.style.colorScheme = options.theme;
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
    for (const id of ['replyLead', 'replyTail', 'prompt']) {
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
        for (const id of ['projectName', 'firstThread', 'secondThread', 'thirdThread', 'fourthThread', 'fifthThread', 'firstBranch', 'thirdBranch', 'fourthBranch', 'activeBranch', 'prompt']) {
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
const capture = document.querySelector('canvas.t3-native-capture');
const captureContext = pixelMode ? capture.getContext('2d') : null;
if (pixelMode && !captureContext) throw new Error('Native Prompt Stash capture requires Canvas 2D');
if (captureContext) captureContext.imageSmoothingEnabled = false;
let captureImages = [];
const starts = [Number(options.stashFrame), Number(options.menuFrame), Number(options.persistedMenuFrame),
  Number(options.recallFrame), Number(options.stashAgainFrame), Number(options.directRecallFrame)];
for (let index = 1; index < starts.length; index++) starts[index] = Math.max(starts[index], starts[index - 1] + 1);
function badgePulse(section, elapsed, expanded) {
  const badge = section.querySelector('[data-prompt-stash-badge]');
  if (!badge) return;
  const count = badge.querySelector('[data-slot="composer-banner-actions"] span');
  const pulsing = elapsed < 1200;
  if (count) {
    count.classList.toggle('text-primary', pulsing);
    count.classList.toggle('text-muted-foreground', !pulsing);
    count.classList.toggle('animate-[prompt-stash-count-enter_180ms_ease-out_both]', pulsing);
    count.classList.toggle('motion-reduce:animate-none', pulsing);
    for (const animation of count.getAnimations()) {
      if (animation.animationName === 'prompt-stash-count-enter') animation.finish();
    }
  }
  badge.classList.remove('text-muted-foreground', 'hover:text-foreground');
  badge.classList.add('text-foreground');
  getComputedStyle(badge).color;
  for (const animation of badge.getAnimations()) {
    if (animation.transitionProperty === 'color') animation.finish();
  }
  if (pulsing || expanded) return;
  badge.classList.remove('text-foreground');
  badge.classList.add('text-muted-foreground', 'hover:text-foreground');
  getComputedStyle(badge).color;
  for (const animation of badge.getAnimations()) {
    if (animation.transitionProperty !== 'color') continue;
    animation.pause();
    animation.currentTime = Math.min(200, Math.max(0, elapsed - 1200));
    if (elapsed >= 1400) animation.finish();
  }
}
const clock = { frame:0 };
function draw() {
  const frame = Math.min(119, Math.max(0, Math.round(clock.frame)));
  capture.hidden = !pixelMode;
  if (pixelMode) {
    const image = captureImages[nativeFrames.mapping[frame]];
    if (image) captureContext.drawImage(image, 0, 0, 1200, 659);
    return;
  }
  const active = starts.findIndex((start) => frame < start);
  const phase = active === -1 ? 6 : active;
  for (const stage of stages) {
    const sections = [...stage.querySelectorAll('[data-t3-state]')];
    for (let index = 0; index < sections.length; index++) sections[index].hidden = index !== phase;
    if (stage.hidden) continue;
    const videoMilliseconds = Math.ceil(frame * 1000 / 30);
    if (phase === 1 || phase === 2) {
      const elapsed = videoMilliseconds - Math.ceil(starts[0] * 1000 / 30) + 350 + (phase === 2 ? 200 : 0);
      badgePulse(sections[phase], elapsed, phase === 2);
    }
    if (phase === 3) badgePulse(sections[phase], 1200, true);
    if (phase === 5) badgePulse(sections[phase], videoMilliseconds - Math.ceil(starts[4] * 1000 / 30) + 250, false);
  }
}
draw();
const captureReady = pixelMode ? Promise.all(nativeFrames.images.map(async source => {
  const image = new Image();
  image.src = source;
  await image.decode();
  return image;
})) : Promise.resolve([]);
window.__hyfrmeReady = captureReady.then(images => {
  captureImages = images;
  draw();
  const timeline = gsap.timeline({ paused:true });
  timeline.to(clock, { frame:120, duration:4, ease:'none', onUpdate:draw });
  window.__timelines['${name}'] = timeline;
  window.__hfForceTimelineRebind?.();
});
</script></template></body></html>`;

await mkdir(resolve(output, "licenses"), { recursive: true });
await writeFile(resolve(output, `${name}.html`), html);
await writeFile(resolve(output, "t3-code-gsap.min.js"), gsap);
for (const { file } of nativeFrames.images) await copyFile(resolve(source, file), resolve(output, file));
await copyFile(resolve(root, "parity/t3-gallery/assets/T3-CODE-LICENSE.txt"), resolve(output, "licenses/T3-CODE-LICENSE.txt"));
for (const file of ["T3-THIRD_PARTY_NOTICES.md", "PIERRE-TREES-LICENSE.md", "PIERRE-TREES-NOTICE.md"]) {
  await copyFile(resolve(root, "registry/blocks/t3-thread-switch/licenses", file), resolve(output, "licenses", file));
}
await writeFile(resolve(output, "registry-item.json"), JSON.stringify({
  $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
  name, type: "hyperframes:block", title: "T3 Code: Prompt Stash and Recall",
  description: "Stash a Hyfrme prompt, inspect the anchored drawer, restore it after reload, and show direct single-entry recall.",
  tags: ["composition", "app-ui", "t3-code", "prompt", "stash", "hyfrme-port"],
  author: "Hyfrme", authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT",
  dimensions: dark.viewport, duration: dark.frames / dark.fps,
  files: [
    { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
    { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
    ...nativeFrames.images.map(({ file }) => ({ path: file, target: `compositions/${file}`, type: "hyperframes:asset" })),
    { path: "licenses/T3-CODE-LICENSE.txt", target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt", type: "hyperframes:asset" },
    ...["T3-THIRD_PARTY_NOTICES.md", "PIERRE-TREES-LICENSE.md", "PIERRE-TREES-NOTICE.md"].map((file) => ({
      path: `licenses/${file}`, target: `THIRD_PARTY_LICENSES/t3-code/${file}`, type: "hyperframes:asset",
    })),
    { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
  ],
}, null, 2) + "\n");
await writeFile(resolve(output, "README.md"), `# T3 Code: Prompt Stash and Recall\n\nThis four-second block uses official T3 Code v0.0.42 at 1200 × 659 and 30 fps. A Hyfrme prompt is stashed with Ctrl+S, inspected in the drawer, restored after reload, and restored directly with Ctrl+S when there is one entry. The conversation is seeded; stash and persistence execute in the native reference app without an AI provider or GitHub account.\n\nUnchanged dark defaults replay three pristine full-size native PNG states. Light defaults use source DOM. Editing any content or any of the six event frames automatically uses editable DOM. Editable DOM preserves the genuine 1200 ms pulse and native 200 ms badge color transition, including the original action settling time and reload lifecycle. Customized output is editable source, not a pixel-parity claim.\n\nCustomize project, thread, conversation, prompt, stash labels, theme, and event frames. Source: https://github.com/pingdotgg/t3code/tree/${dark.sourceCommit}. Installed licenses include T3 Code MIT and Pierre Trees notices. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.\n`);
console.log(`Generated ${name} from native T3 Code v0.0.42 dark/light Prompt Stash states.`);
