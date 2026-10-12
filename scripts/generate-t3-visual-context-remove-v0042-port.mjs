import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-visual-context-remove";
const output = resolve(root, ".work/t3-visual-context-remove-v0042-candidate");
const fixture = JSON.parse(
  await readFile(resolve(source, "visual-context-remove-v0042-dark-fixture.json"), "utf8"),
);
const lightFixture = JSON.parse(await readFile(resolve(source, "visual-context-remove-v0042-light-fixture.json"), "utf8"));
for (const key of ["hoverFrame", "confirmOpenFrame", "removeFrame", "imageSha256", "prompt"]) {
  if (fixture[key] !== lightFixture[key]) throw new Error(`Native visual-context ${key} differs between themes`);
}
for (const native of [fixture, lightFixture]) {
  if (native.motion.hover.length ||
      native.motion.confirm.length !== 3 || native.motion.remove.length !== 3 ||
      [...native.motion.confirm, ...native.motion.remove].some((item) =>
        item.durationMs !== 200 || item.easing !== "cubic-bezier(0.4, 0, 0.2, 1)")) {
    throw new Error(`Native ${native.theme} confirmation transition changed`);
  }
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
const attached = await readFile(resolve(source, "visual-context-remove-v0042-dark-attached.html"), "utf8");
const nativePortal = await readFile(resolve(source, "visual-context-remove-v0042-dark-confirm-portal.html"), "utf8");
if (nativePortal.split('data-slot="button">Confirm</button>').length !== 2) {
  throw new Error("Official destructive confirmation button changed");
}
const portalMarkup = nativePortal
  .replace('data-slot="alert-dialog-backdrop"', 'data-slot="alert-dialog-backdrop" data-layout-allow-occlusion="native modal backdrop"')
  .replace('data-slot="alert-dialog-popup"', 'data-slot="alert-dialog-popup" data-layout-allow-occlusion="native modal popup"')
  .replace('data-slot="button">Confirm</button>', 'data-slot="button" data-layout-ignore="native 3.53:1 destructive-button contrast">Confirm</button>');
const state = (() => {
  const html = attached;
  const codeLabel = '<span class="truncate [text-box:trim-both_cap_alphabetic] text-muted-foreground">Code</span>';
  const hitTarget = '<span aria-hidden="true" class="pointer-events-none absolute left-1/2 top-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden">';
  const chipWrapper = 'data-lexical-decorator="true" contenteditable="false"';
  if (html.split(codeLabel).length !== 2 || html.split(hitTarget).length !== 4 || html.split(chipWrapper).length !== 2) {
    throw new Error('Official Code label, sidebar hit targets, or inline image chip changed');
  }
  return html.replace(codeLabel, codeLabel.replace('<span ', '<span data-layout-ignore="native text-box trimming" '))
    .replaceAll(hitTarget, hitTarget.replace('<span ', '<span data-layout-ignore="native 48px hit target" '))
    .replaceAll('src="t3-visual-context-logo-enter.png"', 'src="compositions/t3-visual-context-logo-enter.png"')
    .replace('<img crossorigin="anonymous" alt="" class="size-3.5 shrink-0 rounded-sm object-cover" src="compositions/t3-visual-context-logo-enter.png">',
      '<img crossorigin="anonymous" alt="" class="size-3.5 shrink-0 rounded-sm object-cover" srcset="compositions/t3-visual-context-logo-enter.png 1x">');
})();
if (!nativePortal.includes('data-slot="alert-dialog-popup"') ||
    !nativePortal.includes('data-slot="alert-dialog-backdrop"')) throw new Error('Official confirmation portal is missing');

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
  ["contextPrompt", "Reference instruction", fixture.prompt],
  ["imageSrc", "Reference image path", "compositions/t3-visual-context-logo-enter.png"],
  ["imageName", "Reference image name", fixture.imageName],
  ["imageSize", "Reference image size label", "65 KB"],
  ["confirmDescription", "Removal warning", "It is referenced in your text; removing it also removes every reference."],
  ["confirmButton", "Confirm action", "Confirm"],
  ["cancelButton", "Cancel action", "Cancel"],
  ["providerAction", "Provider settings action", "Open provider settings"],
  ["workspaceMode", "Workspace mode", "Worktree"],
];
const variables = [
  ...fields.map(([id, label, value]) => ({ id, type: "string", label, default: value })),
  { id: "theme", type: "string", label: "T3 Code appearance", default: "dark", options: ["dark", "light"] },
  { id: "hoverFrame", type: "number", label: "Hover remove at frame", default: fixture.hoverFrame, min: 0, max: 100, step: 1 },
  { id: "confirmOpenFrame", type: "number", label: "Open confirmation at frame", default: fixture.confirmOpenFrame, min: 1, max: 110, step: 1 },
  { id: "removeFrame", type: "number", label: "Confirm removal at frame", default: fixture.removeFrame, min: 2, max: 119, step: 1 },
];
const defaults = Object.fromEntries(fields.map(([id, , value]) => [id, value]));
defaults.theme = "dark";
defaults.hoverFrame = fixture.hoverFrame;
defaults.confirmOpenFrame = fixture.confirmOpenFrame;
defaults.removeFrame = fixture.removeFrame;
const textReplacements = Object.fromEntries(
  fields.filter(([id]) => !id.endsWith("Age") && !["contextPrompt", "imageSrc", "imageName", "imageSize", "confirmDescription", "confirmButton", "cancelButton"].includes(id))
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
  .t3-confirm-portal[hidden] { display: none !important; }
  .base-ui-disable-scrollbar { scrollbar-width: none; }
  .base-ui-disable-scrollbar::-webkit-scrollbar { display: none; }
  @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
  @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
  @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
  @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"); }
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
  <div class="dark t3-stage">${state}<div class="t3-confirm-portal" hidden>${portalMarkup}</div></div>
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
const chipImage = decorator?.querySelector('img');
const trailingSpace = decorator?.nextElementSibling;
const removeButton = stage.querySelector('button[aria-label^="Remove "]');
const portal = stage.querySelector('.t3-confirm-portal');
const popup = portal?.querySelector('[data-slot="alert-dialog-popup"]');
const backdrop = portal?.querySelector('[data-slot="alert-dialog-backdrop"]');
const title = portal?.querySelector('[data-slot="alert-dialog-title"]');
const description = portal?.querySelector('[data-slot="alert-dialog-description"]');
const footerButtons = [...(portal?.querySelectorAll('[data-slot="alert-dialog-footer"] button') ?? [])];
if (!prompt || !spacer || !shelf || !decorator || !chipImage || !trailingSpace ||
    !removeButton || !portal || !popup || !backdrop || !title || !description || footerButtons.length !== 2) {
  throw new Error('Official composer shelf or inline image chip is missing');
}
if (options.imageSrc !== defaults.imageSrc) chipImage.srcset = options.imageSrc + ' 1x';
const geometry = options.theme === 'light' ? ${scriptJson(lightFixture.geometry)} : ${scriptJson(fixture.geometry)};
title.textContent = 'Remove ' + options.imageName + ' from the message?';
description.textContent = options.confirmDescription;
footerButtons[0].textContent = options.cancelButton;
footerButtons[1].textContent = options.confirmButton;
for (const element of [popup, backdrop]) {
  element.style.transition = 'none';
  element.style.animation = 'none';
}
const coveredText = [];
const textWalker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
let textNode;
while ((textNode = textWalker.nextNode())) {
  if (textNode.textContent.trim() && !portal.contains(textNode)) coveredText.push(textNode.parentElement);
}
function easeProgress(progress) {
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
const clock = { frame: 0 };
function draw() {
  const frame = Math.round(clock.frame);
  const hover = Number(options.hoverFrame);
  const open = Math.max(Number(options.confirmOpenFrame), hover + 1);
  const remove = Math.max(Number(options.removeFrame), open + 1);
  const removed = frame >= remove;
  shelf.style.display = removed ? 'none' : '';
  decorator.style.display = removed ? 'none' : '';
  trailingSpace.style.display = removed ? 'none' : '';
  spacer.style.height = removed ? '204px' : '280px';
  prompt.textContent = options.contextPrompt + (removed ? '' : ' ');
  removeButton.style.backgroundColor = frame >= hover && frame < open
    ? geometry.hover.removeButton.backgroundColor : geometry.attached.removeButton.backgroundColor;
  portal.hidden = frame < open || frame >= remove + 6;
  for (const element of coveredText) {
    if (portal.hidden) element.removeAttribute('data-layout-allow-occlusion');
    else element.setAttribute('data-layout-allow-occlusion', 'native full-screen confirmation backdrop');
  }
  if (portal.hidden) return;
  const opening = frame < remove;
  const eased = easeProgress((frame - (opening ? open : remove)) * 1000 / 30 / 200);
  const opacity = opening ? eased : 1 - eased;
  backdrop.style.opacity = String(opacity);
  popup.style.opacity = String(opacity);
  popup.style.scale = String(opening ? 0.98 + 0.02 * eased : 1 - 0.02 * eased);
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
      title: "T3 Code: Visual Context Remove",
      description:
        "Confirm removal of a referenced Hyfrme Logo Enter frame from the T3 Code v0.0.42 composer. Seeded local thread; no AI inference runs.",
      tags: ["composition", "app-ui", "t3-code", "visual-context-remove", "hyfrme-port"],
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
  `# T3 Code: Visual Context Remove\n\nThis four-second block reproduces the T3 Code ${fixture.sourceTag} pasted-image removal at 1200 × 659 and 30 fps in dark or light. The pointer hovers over the image's remove control, opens the real destructive confirmation, and confirms removal. T3 Code removes both the image and its inline reference. The reference uses a seeded local thread with no provider configured; this interaction does not send a message or run AI inference.\n\nThe native destructive Confirm button has white text on red at 3.53:1 contrast, below WCAG AA's 4.5:1. This one button is annotated to preserve its official color in the parity render; the visual and contrast limitation is recorded in the parity manifest.\n\nSet theme to dark or light. Change imageSrc to a local path or URL, imageName to its filename, and imageSize to the size label shown in the chip. Change the warning and button labels if needed. Project, branch, thread, age, previous-message, and answer variables can match adjacent T3 Code clips. hoverFrame, confirmOpenFrame, and removeFrame place the three actions. The supplied frame derives from MIT-licensed Remocn source; its license is included. T3 Code source: https://github.com/pingdotgg/t3code/tree/${fixture.sourceCommit}. The T3 Code MIT license and icon notice are included. GSAP 3.14.2 is embedded for offline frame control under its Standard License: https://gsap.com/standard-license/.\n`,
);
console.log(`Generated ${name} from the pinned T3 Code removal confirmation.`);
