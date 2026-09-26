import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-visual-context-shelf";
const output = resolve(root, ".work/t3-visual-context-v0042-candidate");
const fixture = JSON.parse(
  await readFile(resolve(source, "visual-context-v0042-dark-fixture.json"), "utf8"),
);
const lightFixture = JSON.parse(await readFile(resolve(source, "visual-context-v0042-light-fixture.json"), "utf8"));
for (const key of ["pasteFrame", "instructionFrame", "imageSha256", "promptBefore", "promptAfter"]) {
  if (fixture[key] !== lightFixture[key]) throw new Error(`Native visual-context ${key} differs between themes`);
}
for (const native of [fixture, lightFixture]) {
  if (native.motion.paste.length !== 6 || native.motion.paste.some((item) => item.target !== "tooltip-trigger" ||
      !item.ariaLabel?.startsWith("Image attachment,") || item.durationMs !== 150)) {
    throw new Error(`Native ${native.theme} attachment-chip transition changed`);
  }
  if (native.motion.instruction.length) throw new Error(`Native ${native.theme} prompt edit has uncaptured motion`);
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
const nativeStates = await Promise.all(
  ["before", "attached", "final"].map((phase) =>
    readFile(resolve(source, `visual-context-v0042-dark-${phase}.html`), "utf8"),
  ),
);
const states = nativeStates.map((html, phase) => {
  const codeLabel = '<span class="truncate [text-box:trim-both_cap_alphabetic] text-muted-foreground">Code</span>';
  const hitTarget = '<span aria-hidden="true" class="pointer-events-none absolute left-1/2 top-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden">';
  const messageHover = 'opacity-0 transition-opacity duration-200 pointer-coarse:opacity-100 focus-within:opacity-100 group-hover:opacity-100';
  const chipWrapper = 'data-lexical-decorator="true" contenteditable="false"';
  if (html.split(codeLabel).length !== 2 || html.split(hitTarget).length !== 4 || html.split(messageHover).length !== 2 ||
      html.split(chipWrapper).length !== (phase === 0 ? 1 : 2)) {
    throw new Error('Official Code label, sidebar hit targets, or visible message timestamp changed');
  }
  return html.replace(codeLabel, codeLabel.replace('<span ', '<span data-layout-ignore="native text-box trimming" '))
    .replaceAll(hitTarget, hitTarget.replace('<span ', '<span data-layout-ignore="native 48px hit target" '))
    .replace(messageHover, messageHover.replace('opacity-0', 'opacity-100'))
    .replaceAll('src="t3-visual-context-logo-enter.png"', 'src="compositions/t3-visual-context-logo-enter.png"')
    .replace('<img crossorigin="anonymous" alt="" class="size-3.5 shrink-0 rounded-sm object-cover" src="compositions/t3-visual-context-logo-enter.png">',
      '<img crossorigin="anonymous" alt="" class="size-3.5 shrink-0 rounded-sm object-cover" srcset="compositions/t3-visual-context-logo-enter.png 1x">');
});

const fields = [
  ["projectName", "Project name", "hyfrme"],
  ["projectAvatar", "Project avatar letters", "HE"],
  ["branchName", "Branch name", "main"],
  ["activeBranch", "Active thread branch", "feature/logo-enter"],
  ["threadOne", "Thread 1", "Build a logo intro"],
  ["threadTwo", "Thread 2", "Catalog motion audit"],
  ["threadThree", "Thread 3", "Grouped logo tests"],
  ["threadFour", "Thread 4", "Review final hold"],
  ["threadFive", "Thread 5", "Search reveal timing"],
  ...fixture.threadAges.map((age, index) => [`thread${index + 1}Age`, `Thread ${index + 1} age`, age]),
  ["messagePrompt", "Existing user message", "Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames."],
  ["messageTime", "Existing message timestamp", "yesterday at 9:22 PM"],
  ["workDuration", "Existing work duration", "Worked for 2m"],
  ["answerLead", "Existing answer before file", "I found the Logo Enter timing in"],
  ["answerFile", "Existing answer file", "logo-enter.html"],
  ["answerTail", "Existing answer after file", ". The final pass can extend the duration while keeping the last rendered frame still."],
  ["contextPrompt", "Reference instruction", fixture.promptBefore],
  ["finalInstruction", "Final-frame instruction", "Keep the last frame still for 18 frames."],
  ["imageSrc", "Reference image path", "compositions/t3-visual-context-logo-enter.png"],
  ["imageName", "Reference image name", fixture.imageName],
  ["imageSize", "Reference image size label", "65 KB"],
  ["providerAction", "Provider settings action", "Open provider settings"],
  ["workspaceMode", "Workspace mode", "Worktree"],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "theme", type: "string", label: "T3 Code appearance", default: "dark", options: ["dark", "light"] },
  { id: "pasteFrame", type: "number", label: "Attach at frame", default: fixture.pasteFrame, min: 0, max: 100, step: 1 },
  { id: "instructionFrame", type: "number", label: "Add instruction at frame", default: fixture.instructionFrame, min: 1, max: 119, step: 1 },
];
const defaults = Object.fromEntries(fields.map(([id, , value]) => [id, value]));
defaults.theme = "dark";
defaults.pasteFrame = fixture.pasteFrame;
defaults.instructionFrame = fixture.instructionFrame;
const textReplacements = Object.fromEntries(
  fields.filter(([id]) => !id.endsWith("Age") && !["contextPrompt", "finalInstruction", "imageSrc", "imageName", "imageSize"].includes(id))
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
  .base-ui-disable-scrollbar { scrollbar-width: none; }
  .base-ui-disable-scrollbar::-webkit-scrollbar { display: none; }
  @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
  @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
  @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
  @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"); }
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
  <div class="dark t3-stage">${states[2]}</div>
</div>
<script src="t3-code-gsap.min.js"></script>
<script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
const stage = document.querySelector('#root .t3-stage');
if (options.theme === 'light') {
  stage.classList.remove('dark');
  stage.classList.add('light');
  for (const [key, value] of Object.entries(${scriptJson(lightTheme)})) stage.style.setProperty(key, value);
}
for (const [key, value] of Object.entries(${scriptJson(fontTheme)})) stage.style.setProperty(key, value);
stage.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
const replacements = ${scriptJson(textReplacements)};
const ageKeys = ['thread1Age', 'thread2Age', 'thread3Age', 'thread4Age', 'thread5Age'];
function applyVariables() {
  const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const current = node.textContent.trim();
    const key = replacements[current];
    if (key && options[key] !== defaults[key]) node.textContent = node.textContent.replace(current, options[key]);
  }
  for (const element of stage.querySelectorAll('[aria-label], [title]')) {
    for (const attribute of ['aria-label', 'title']) {
      const original = element.getAttribute(attribute);
      if (!original) continue;
      let updated = original;
      for (const key of ['projectName', 'projectAvatar', 'branchName', 'activeBranch', 'answerFile', 'providerAction']) {
        if (options[key] !== defaults[key]) updated = updated.replaceAll(defaults[key], String(options[key]));
      }
      if (updated !== original) element.setAttribute(attribute, updated);
    }
  }
  stage.querySelectorAll('[data-testid="sidebar-row-card"]').forEach((row, index) => {
    const age = row.querySelector('span.tabular-nums.text-secondary-label');
    if (age && ageKeys[index]) age.textContent = options[ageKeys[index]];
  });
  for (const img of stage.querySelectorAll('img[src="compositions/t3-visual-context-logo-enter.png"]')) {
    if (options.imageSrc !== defaults.imageSrc) img.src = options.imageSrc;
  }
  if (options.imageName !== defaults.imageName) {
    const preview = stage.querySelector('img[alt="hyfrme-logo-enter-final.png"]');
    if (preview) preview.alt = options.imageName;
    preview?.closest('button')?.setAttribute('aria-label', 'Preview ' + options.imageName);
    stage.querySelector('button[aria-label="Remove hyfrme-logo-enter-final.png"]')
      ?.setAttribute('aria-label', 'Remove ' + options.imageName);
    for (const chip of stage.querySelectorAll('[data-slot="tooltip-trigger"][aria-label^="Image attachment,"]')) {
      const label = chip.getAttribute('aria-label');
      if (label) chip.setAttribute('aria-label', label.replace(defaults.imageName, options.imageName));
      const filename = [...chip.querySelectorAll('span')].find((span) => span.textContent.trim() === defaults.imageName);
      if (filename) filename.textContent = options.imageName;
    }
  }
  if (options.imageSize !== defaults.imageSize) {
    for (const chip of stage.querySelectorAll('[data-slot="tooltip-trigger"][aria-label^="Image attachment,"]')) {
      const label = chip.getAttribute('aria-label');
      if (label) chip.setAttribute('aria-label', label.replace(defaults.imageSize, options.imageSize));
      const size = [...chip.querySelectorAll('span')].find((span) => span.textContent.trim() === defaults.imageSize);
      if (size) size.textContent = options.imageSize;
    }
  }
}
applyVariables();
const prompt = stage.querySelector('[data-testid="composer-editor"] [data-lexical-text]');
const spacer = stage.querySelector('div[style="height: 280px;"]');
const shelf = stage.querySelector('[data-chat-composer-body] > .mb-3');
const decorator = stage.querySelector('[data-lexical-decorator]');
const pastedChip = decorator?.querySelector('[data-slot="tooltip-trigger"][aria-label^="Image attachment,"]');
const chipImage = decorator?.querySelector('img');
const trailingSpace = decorator?.nextElementSibling;
if (!prompt || !spacer || !shelf || !decorator || !pastedChip || !chipImage || !trailingSpace) {
  throw new Error('Official composer shelf or inline image chip is missing');
}
if (options.imageSrc !== defaults.imageSrc) chipImage.srcset = options.imageSrc + ' 1x';
const pasteMotion = options.theme === 'light'
  ? ${scriptJson(lightFixture.motion.paste)}
  : ${scriptJson(fixture.motion.paste)};
if (pasteMotion.length !== 6 || pasteMotion.some((motion) => motion.durationMs !== 150 ||
    motion.easing !== 'cubic-bezier(0.4, 0, 0.2, 1)' || motion.keyframes.length !== 2)) {
  throw new Error('Official pasted-image chip transitions are missing');
}
function easeChip(progress) {
  if (progress <= 0) return 0;
  if (progress >= 1) return 1;
  let low = 0;
  let high = 1;
  for (let index = 0; index < 18; index++) {
    const t = (low + high) / 2;
    const x = 3 * (1 - t) ** 2 * t * 0.4 + 3 * (1 - t) * t ** 2 * 0.2 + t ** 3;
    if (x < progress) low = t;
    else high = t;
  }
  const t = (low + high) / 2;
  return 3 * (1 - t) * t ** 2 + t ** 3;
}
function seekChip(frame) {
  const progress = easeChip((frame - Number(options.pasteFrame)) * 1000 / 30 / 150);
  pastedChip.style.transition = 'none';
  for (const motion of pasteMotion) {
    const first = motion.keyframes[0];
    const last = motion.keyframes[motion.keyframes.length - 1];
    for (const property of ['backgroundColor', 'borderBottomColor', 'borderLeftColor',
      'borderRightColor', 'borderTopColor', 'color']) {
      if (!first[property] || !last[property]) continue;
      pastedChip.style[property] = progress === 0 ? first[property]
        : progress === 1 ? last[property]
        : 'color-mix(in oklab, ' + first[property] + ' ' + ((1 - progress) * 100).toFixed(5)
          + '%, ' + last[property] + ' ' + (progress * 100).toFixed(5) + '%)';
    }
  }
}
const clock = { frame: 0 };
let activePhase = -1;
function draw() {
  const frame = Math.round(clock.frame);
  const instructionFrame = Math.max(Number(options.instructionFrame), Number(options.pasteFrame) + 1);
  const phase = frame < options.pasteFrame ? 0 : frame < instructionFrame ? 1 : 2;
  if (phase !== activePhase) {
    shelf.style.display = phase === 0 ? 'none' : '';
    decorator.style.display = phase === 0 ? 'none' : '';
    trailingSpace.style.display = phase === 0 ? 'none' : '';
    spacer.style.height = phase === 0 ? '204px' : '280px';
    prompt.textContent = phase === 2 ? options.contextPrompt + ' ' + options.finalInstruction
      : phase === 1 ? options.contextPrompt + ' ' : options.contextPrompt;
    activePhase = phase;
  }
  if (phase > 0) seekChip(frame);
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
await copyFile(resolve(source, "visual-context-shelf-logo-enter.png"), resolve(output, "t3-visual-context-logo-enter.png"));
await copyFile(
  resolve(root, "public/ideas/assets/T3-CODE-LICENSE.txt"),
  resolve(output, "licenses/T3-CODE-LICENSE.txt"),
);
await copyFile(resolve(root, "registry/blocks/t3-thread-unpin/licenses/T3-THIRD_PARTY_NOTICES.md"),
  resolve(output, "licenses/T3-THIRD_PARTY_NOTICES.md"));
await copyFile(resolve(root, "assets/remocn-additions/REMOCN-LICENSE.txt"), resolve(output, "licenses/REMOCN-LICENSE.txt"));
await writeFile(
  resolve(output, "registry-item.json"),
  `${JSON.stringify(
    {
      $schema: "https://hyperframes.heygen.com/schema/registry-item.json",
      name,
      type: "hyperframes:block",
      title: "T3 Code: Visual Context Shelf",
      description:
        "Paste a Hyfrme Logo Enter frame into the T3 Code v0.0.42 composer, then refine the instruction. Seeded local thread with no provider; no AI inference runs.",
      tags: ["composition", "app-ui", "t3-code", "visual-context-shelf", "hyfrme-port"],
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
        {
          path: "t3-visual-context-logo-enter.png",
          target: "compositions/t3-visual-context-logo-enter.png",
          type: "hyperframes:asset",
        },
        {
          path: "licenses/REMOCN-LICENSE.txt",
          target: "THIRD_PARTY_LICENSES/remocn/REMOCN-LICENSE.txt",
          type: "hyperframes:asset",
        },
        {
          path: "licenses/T3-CODE-LICENSE.txt",
          target: "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt",
          type: "hyperframes:asset",
        },
        {
          path: "licenses/T3-THIRD_PARTY_NOTICES.md",
          target: "THIRD_PARTY_LICENSES/t3-code/T3-THIRD_PARTY_NOTICES.md",
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
  `# T3 Code: Visual Context Shelf\n\nThis four-second block reproduces the T3 Code ${fixture.sourceTag} pasted-image shelf at 1200 × 659 and 30 fps in dark or light. A verified Hyfrme Logo Enter frame becomes a native composer attachment, then the draft adds a final-frame instruction. The reference uses a seeded local thread with no provider configured; this interaction does not send a message or run AI inference.\n\nThe attached chip's small text is not pixel-identical: native and port fonts, colors, and geometry match in both themes, while rasterized glyph pixels differ. The parity manifest records its focused crop scores alongside all 120 full-frame scores.\n\nSet theme to dark or light. Change imageSrc to a local path or URL, imageName to its filename, and imageSize to the size label shown in the chip. contextPrompt and finalInstruction control the draft. Project, branch, thread, age, previous-message, and answer variables can match adjacent T3 Code clips. pasteFrame and instructionFrame place the two state changes. The supplied frame derives from MIT-licensed Remocn source; its license is included. T3 Code source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. The T3 Code MIT license and icon notice are included. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.\n`,
);
console.log(`Generated ${name} from the pinned T3 Code attachment shelf.`);
