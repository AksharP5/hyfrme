import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = process.argv[2];
const profiles = {
  "t3-project-action-run": {
    title: "Project Action Run",
    sourcePath: "apps/web/src/components/ProjectScripts.tsx",
    description: "Run a saved Hyfrme check with T3 Code's native workspace terminal.",
    detail: "T3 Code's saved Verify Hyfrme action runs a real local Git diff check and shows its result in the native terminal. The repository change and command stay in an isolated fixture.",
    fields: [
      ["projectName", "Project name", "hyfrme"], ["branchName", "Branch", "feature/logo-enter"],
      ["selectedThread", "Selected thread", "Build a logo intro"], ["otherThread", "Sidebar thread 2", "Catalog motion audit"],
      ["userMessage", "User message", "Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames."],
      ["replyBeforeFile", "Reply before file", "I found the Logo Enter timing in"], ["replyFile", "Reply file", "logo-enter.html"],
      ["replyAfterFile", "Reply after file", ". The final pass can extend the duration while keeping the last rendered frame still."],
      ["workedDuration", "Worked duration", "2m"], ["actionName", "Saved action", "Verify Hyfrme"],
      ["terminalPrompt", "Terminal directory", "hyfrme"], ["command", "Run command", "git diff --check && git diff --stat -- registry/blocks/logo-enter/logo-enter.html"],
      ["output", "Command output", "registry/blocks/logo-enter/logo-enter.html | 5 +++++"],
      ["composerPlaceholder", "Composer placeholder", "Enable a provider in Settings to send a message"],
      ["providerStatus", "Provider status", "No provider available"], ["permissionMode", "Permission", "Full access"],
      ["workspaceMode", "Workspace", "Worktree"],
    ],
    terminal: true,
  },
  "t3-commit-creation": {
    title: "Commit Creation",
    sourcePath: "apps/web/src/components/BranchToolbarGitActions.tsx",
    description: "Create a local Hyfrme commit through T3 Code's real Git review dialog.",
    detail: "T3 Code commits one real Hyfrme Logo Enter change in an isolated local repository with no remote.",
    fields: [
      ["projectName", "Project name", "hyfrme"], ["branchName", "Branch", "feature/logo-enter"],
      ["selectedThread", "Selected thread", "Build a logo intro"], ["otherThread", "Sidebar thread 2", "Catalog motion audit"],
      ["userMessage", "User message", "Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames."],
      ["replyBeforeFile", "Reply before file", "I found the Logo Enter timing in"], ["replyFile", "Reply file", "logo-enter.html"],
      ["replyAfterFile", "Reply after file", ". The final pass can extend the duration while keeping the last rendered frame still."],
      ["workedDuration", "Worked duration", "2m"], ["changedFile", "Changed file path", "registry/blocks/logo-enter/logo-enter.html"],
      ["commitMessage", "Commit message", "Tighten Hyfrme logo hold"],
      ["insertions", "Added lines", "4"], ["deletions", "Removed lines", "1"],
      ["composerPlaceholder", "Composer placeholder", "Enable a provider in Settings to send a message"],
      ["providerStatus", "Provider status", "No provider available"], ["permissionMode", "Permission", "Full access"],
      ["workspaceMode", "Workspace", "Worktree"],
    ],
    occludedStates: ["dialog", "typed"],
  },
  "t3-git-push": {
    title: "Publish Repository",
    sourcePath: "apps/web/src/components/BranchToolbarGitActions.tsx",
    description: "Open T3 Code's v0.0.42 Publish repository dialog for a Hyfrme project.",
    detail: "The v0.0.42 Git menu opens Publish repository for the isolated Hyfrme project. The GitHub connection is unconfigured, so the seeded dialog is canceled without publishing.",
    fields: [
      ["projectName", "Project name", "hyfrme"], ["branchName", "Branch", "feature/logo-enter"],
      ["selectedThread", "Selected thread", "Build a logo intro"], ["dialogTitle", "Dialog title", "Publish repository"],
      ["composerPlaceholder", "Composer placeholder", "Enable a provider in Settings to send a message"],
      ["permissionMode", "Permission", "Full access"], ["workspaceMode", "Workspace", "Worktree"],
    ],
    customFrame: "frame_000056.png",
    occludedStates: ["menu", "dialog"],
  },
  "t3-thread-reorder": {
    title: "Reorder Pinned Threads",
    sourcePath: "apps/web/src/components/Sidebar.tsx",
    description: "Drag two pinned Hyfrme threads to a new order and verify it survives reload.",
    detail: "Both threads are pinned in the isolated T3 database. A real drag changes their order key, and the new order remains after reloading the v0.0.42 app.",
    fields: [
      ["projectName", "Project name", "hyfrme"], ["branchName", "Branch", "feature/logo-enter"],
      ["movedThread", "Thread to move", "Catalog motion audit"], ["otherThread", "Thread to move above", "Build a logo intro"],
      ["threadThree", "Sidebar thread 3", "Grouped logo tests"], ["threadFour", "Sidebar thread 4", "Review final hold"],
      ["threadFive", "Sidebar thread 5", "Search reveal timing"], ["settledThread", "Settled thread", "Verify Logo Enter parity"],
      ["composerPlaceholder", "Composer placeholder", "Enable a provider in Settings to send a message"],
      ["providerStatus", "Provider status", "No provider available"], ["permissionMode", "Permission", "Full access"],
      ["workspaceMode", "Workspace", "Worktree"],
    ],
  },
};
const profile = profiles[name];
if (!profile) throw new Error(`Expected one of: ${Object.keys(profiles).join(", ")}`);

const shortName = name.replace(/^t3-/, "");
const source = resolve(root, "assets/t3-code/v0.0.42");
const block = resolve(root, "registry/blocks", name);
const output = resolve(root, `.work/${name}-v0042-candidate`);
const assets = {};
for (const theme of ["dark", "light"]) {
  const prefix = `${shortName}-v0042-${theme}`;
  const fixture = JSON.parse(await readFile(resolve(source, `${prefix}-fixture.json`), "utf8"));
  const cssVars = JSON.parse(await readFile(resolve(source, `${theme}-theme.json`), "utf8"));
  const states = {};
  for (const phase of fixture.phases) {
    let html = await readFile(resolve(source, `${prefix}-${phase}.html`), "utf8");
    const portalPath = resolve(source, `${prefix}-${phase}-portal.html`);
    const portal = await readFile(portalPath, "utf8").catch(() => "");
    html = html.replaceAll(
      '<span class="pointer-events-none absolute left-1/2 top-1/2 size-[max(100%,3rem)]',
      '<span data-layout-allow-overflow class="pointer-events-none absolute left-1/2 top-1/2 size-[max(100%,3rem)]',
    );
    html = html.replaceAll(
      'class="truncate [text-box:trim-both_cap_alphabetic] text-muted-foreground">Code</span>',
      'data-layout-ignore class="truncate [text-box:trim-both_cap_alphabetic] text-muted-foreground">Code</span>',
    );
    if (name === "t3-thread-reorder") {
      html = html.replaceAll(
        'class="pointer-events-none absolute left-1/2 top-1/2 size-[max(100%,3rem)]',
        'data-layout-allow-overflow class="pointer-events-none absolute left-1/2 top-1/2 size-[max(100%,3rem)]',
      );
      if (phase === "lifted" || phase === "over") {
        const targetThread = fixture.observed.otherThread;
        const targetSpan = html.indexOf(`>${targetThread}</span>`);
        const rowStart = html.lastIndexOf("<li ", targetSpan);
        const rowEnd = html.indexOf("</li>", targetSpan) + "</li>".length;
        if (targetSpan < 0 || rowStart < 0 || rowEnd < 0) throw new Error(`Could not locate the overlapped ${targetThread} row`);
        let row = html.slice(rowStart, rowEnd);
        const annotateTextSpan = (markup, text) => {
          const end = markup.indexOf(`>${text}</span>`);
          const start = markup.lastIndexOf("<span", end);
          if (end < 0 || start < 0) throw new Error(`Could not annotate the overlapped ${text} label`);
          return markup.slice(0, start) + markup.slice(start).replace("<span", "<span data-layout-allow-occlusion");
        };
        row = annotateTextSpan(row, targetThread);
        row = annotateTextSpan(row, "main");
        html = html.slice(0, rowStart) + row + html.slice(rowEnd);
      }
    }
    states[phase] = html + portal
      .replaceAll('data-slot="dialog-backdrop"', 'data-layout-allow-occlusion data-slot="dialog-backdrop"');
  }
  assets[theme] = { fixture, cssVars, states, prefix };
}
const dark = assets.dark.fixture;
const light = assets.light.fixture;
if (JSON.stringify(dark.phases) !== JSON.stringify(light.phases) || JSON.stringify(dark.events) !== JSON.stringify(light.events)) {
  throw new Error(`${name} dark and light v0.0.42 captures do not share phases and timing`);
}
if (dark.sourceTag !== "v0.0.42" || light.sourceTag !== "v0.0.42" || dark.frames !== 120 || light.frames !== 120) {
  throw new Error(`${name} capture is not a complete two-theme v0.0.42 recording`);
}
if (name === "t3-project-action-run") {
  profile.fields.find(([id]) => id === "output")[2] = dark.output;
  profile.fields.find(([id]) => id === "command")[2] = dark.actionCommand;
}
if (name === "t3-thread-reorder") {
  profile.fields.find(([id]) => id === "movedThread")[2] = dark.observed.movedThread;
  profile.fields.find(([id]) => id === "otherThread")[2] = dark.observed.otherThread;
}
if (name === "t3-git-push") {
  profile.fields.find(([id]) => id === "dialogTitle")[2] = dark.observed.dialogText?.split("\n")[0] ?? "Publish repository";
}

const eventFields = Object.entries(dark.events).map(([phase, frame]) => ({
  id: `${phase}Frame`, type: "number", label: `${phase[0].toUpperCase()}${phase.slice(1)} at frame`, default: frame, min: 1, max: 119, step: 1,
}));
const variables = [
  ...profile.fields.map(([id, label, value]) => ({ id, type: "string", label, default: String(value) })),
  { id: "theme", type: "string", label: "T3 Code appearance", default: "dark", options: ["dark", "light"] },
  { id: "renderMode", type: "string", label: "Render mode", default: "pixel-verified", options: ["pixel-verified", "editable DOM"] },
  ...eventFields,
];
const defaults = Object.fromEntries(variables.map(({ id, default: value }) => [id, value]));
const themeCss = Object.fromEntries(Object.entries(assets).map(([theme, value]) => [theme,
  Object.entries(value.cssVars).map(([key, cssValue]) => `${key}:${cssValue};`).join("")
]));
const fontTheme = Object.fromEntries(Object.entries(assets.dark.cssVars).filter(([key]) => key.includes("font-family") || key === "--font-sans" || key === "--font-mono"));
const scriptJson = (value) => JSON.stringify(value).replaceAll("</", "<\\/");
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const stageMarkup = ["dark", "light"].flatMap((theme) => dark.phases.map((phase) =>
  `<div class="${theme} t3-stage t3-state" data-t3-theme="${theme}" data-t3-state="${phase}" style="${escapeAttribute(themeCss[theme])}"${theme === "light" || phase !== "before" ? " hidden" : ""}>${assets[theme].states[phase]}</div>`)).join("\n");
const captureMarkup = ["dark", "light"].flatMap((theme) => Array.from({ length: 10 }, (_, row) =>
  `<canvas data-layout-ignore class="t3-pixel-capture" data-t3-pixel-theme="${theme}" data-t3-pixel-row="${row}" width="1200" height="659" hidden></canvas>`)).join("\n");
const preloadMarkup = ["dark", "light"].flatMap((theme) => Array.from({ length: 10 }, (_, row) =>
  `<img data-layout-ignore data-t3-preload-theme="${theme}" data-t3-preload-row="${row}" data-t3-preload-src="compositions/${shortName}-v0042-${theme}-capture-${String(row).padStart(2, "0")}.webp" aria-hidden="true" width="1" height="1">`)).join("\n");
const canvasAssets = name === "t3-project-action-run" ? [...new Set([...Object.keys(dark.assetSha256), ...Object.keys(light.assetSha256)])] : [];
const customScript = name === "t3-project-action-run" ? `
for (const stage of document.querySelectorAll('#root .t3-stage')) {
  for (const canvas of stage.querySelectorAll('.thread-terminal-drawer canvas')) {
    const wrapper = document.createElement('div');
    wrapper.className = 't3-terminal-frame ' + canvas.className;
    wrapper.setAttribute('data-t3-terminal-frame', '');
    const image = document.createElement('img');
    image.setAttribute('data-t3-terminal-image', '');
    image.alt = '';
    const overlay = document.createElement('div');
    overlay.className = 'terminal-custom';
    overlay.setAttribute('data-layout-ignore', '');
    overlay.hidden = true;
    const prompt = document.createElement('div');
    prompt.innerHTML = '<span class="directory"></span> <span class="branch"></span> <span class="prompt-dot">●</span> ❯ <span class="command"></span>';
    prompt.querySelector('.directory').textContent = options.terminalPrompt;
    prompt.querySelector('.branch').textContent = options.branchName;
    prompt.querySelector('.command').textContent = options.command;
    overlay.append(prompt);
    const output = document.createElement('pre');
    output.className = 'terminal-output';
    output.textContent = options.output;
    overlay.append(output);
    wrapper.append(image, overlay);
    canvas.replaceWith(wrapper);
  }
}
` : "";
const html = `<!doctype html>
<html lang="en" data-composition-variables='${escapeAttribute(JSON.stringify(variables))}'>
<head><meta charset="utf-8"></head><body><template>
<style>${await readFile(resolve(source, "t3.css"), "utf8")}</style>
<style>
  #root { position: relative; width: 100%; height: 100%; overflow: hidden; }
  .t3-stage { position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--background); color: var(--foreground); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
  .t3-stage[hidden], .t3-state[hidden] { display: none !important; }
  .t3-state:not([hidden]) { display: contents; }
  .t3-pixel-capture { position: absolute; inset: 0; z-index: 100; width: 100%; height: 100%; pointer-events: none; }
  .t3-pixel-capture[hidden] { display: none !important; }
  .base-ui-disable-scrollbar { scrollbar-width: none; }
  .base-ui-disable-scrollbar::-webkit-scrollbar { display: none; }
  @font-face { font-family: "Apple Color Emoji"; src: local("Apple Color Emoji"); }
  @font-face { font-family: "Segoe UI Emoji"; src: local("Segoe UI Emoji"); }
  @font-face { font-family: "Segoe UI Symbol"; src: local("Segoe UI Symbol"); }
  @font-face { font-family: "SFMono-Regular"; src: local("SFMono-Regular"); }
  .t3-terminal-frame { position: relative; overflow: hidden; }
  .t3-terminal-frame > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: fill; }
  .terminal-custom { position: absolute; inset: 0; box-sizing: border-box; overflow: hidden; padding: 9px 5px; background: var(--terminal-background, #111); color: var(--terminal-foreground, #ddd); font: 13px/18px "JetBrains Mono", monospace; white-space: pre-wrap; }
  .terminal-custom .directory { color: #8fbfc4; font-weight: 600; }
  .terminal-custom .branch { color: #cf8993; font-style: italic; }
  .terminal-custom .prompt-dot { color: #93b9aa; }
  .terminal-output { margin: 4px 0 0; white-space: pre-wrap; font: inherit; }
</style>
<div id="root" data-composition-id="${name}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659">
${stageMarkup}
${captureMarkup}
<div data-layout-ignore aria-hidden="true" style="position:absolute;left:-2px;top:-2px;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none">${preloadMarkup}</div>
</div>
<script src="t3-code-gsap.min.js"></script><script>
window.__timelines = window.__timelines || {};
const defaults = ${scriptJson(defaults)};
const options = { ...defaults, ...(window.__hyperframes?.getVariables() ?? {}) };
const themeCss = ${scriptJson(themeCss)};
const fields = ${scriptJson(profile.fields.map(([id]) => id))};
const defaultEvents = ${scriptJson(dark.events)};
const phases = ${scriptJson(dark.phases)};
const canvasSequence = ${scriptJson({ dark: dark.canvasSequence ?? [], light: light.canvasSequence ?? [] })};
const sections = [...document.querySelectorAll('#root .t3-stage')];
const preloads = [...document.querySelectorAll('[data-t3-preload-theme]')]
  .filter((image) => image.dataset.t3PreloadTheme === options.theme);
const pixelSources = new Map(preloads.map((image) => {
  image.src = image.dataset.t3PreloadSrc;
  return [image.dataset.t3PreloadRow, image];
}));
const occludedStates = ${scriptJson(profile.occludedStates ?? [])};
for (const stage of sections) {
  const theme = stage.dataset.t3Theme;
  stage.style.cssText += themeCss[theme];
  for (const [key, value] of Object.entries(${scriptJson(fontTheme)})) stage.style.setProperty(key, value);
  stage.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
  const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    let text = node.textContent;
    for (const id of fields) {
      const original = String(defaults[id] ?? '');
      const updated = String(options[id] ?? original);
      if (original && updated !== original && text.includes(original)) text = text.replaceAll(original, updated);
    }
    node.textContent = text;
  }
  for (const element of stage.querySelectorAll('[aria-label],[title],[placeholder]')) {
    for (const attribute of ['aria-label', 'title', 'placeholder']) {
      const originalValue = element.getAttribute(attribute);
      if (!originalValue) continue;
      let value = originalValue;
      for (const id of fields) {
        const original = String(defaults[id] ?? '');
        const updated = String(options[id] ?? original);
        if (original && updated !== original && value.includes(original)) value = value.replaceAll(original, updated);
      }
      if (value !== originalValue) element.setAttribute(attribute, value);
    }
  }
  for (const input of stage.querySelectorAll('textarea')) {
    if (stage.dataset.t3State === 'typed' && fields.includes('commitMessage') && options.commitMessage !== defaults.commitMessage) {
      input.textContent = options.commitMessage;
      input.setAttribute('value', options.commitMessage);
    }
  }
  if (occludedStates.includes(stage.dataset.t3State)) {
    const workspace = stage.querySelector('#root') ?? stage;
    for (const row of [workspace]) {
      const walker = document.createTreeWalker(row, NodeFilter.SHOW_ELEMENT);
      let element;
      while ((element = walker.nextNode())) {
        const ownsVisibleText = [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
        if (ownsVisibleText) element.setAttribute('data-layout-allow-occlusion', '');
      }
    }
  }
}
${customScript}
const clock = { frame: 0 };
function draw() {
  const frame = Math.min(119, Math.max(0, Math.round(clock.frame)));
  let phaseIndex = 0;
  let lastEventFrame = 0;
  for (let index = 1; index < phases.length; index++) {
    const phase = phases[index];
    const requested = Number(options[phase + 'Frame'] ?? defaultEvents[phase] ?? index);
    const eventFrame = Math.max(lastEventFrame + 1, Math.min(119, requested));
    if (frame >= eventFrame) phaseIndex = index;
    lastEventFrame = eventFrame;
  }
  for (const stage of sections) {
    const visible = stage.dataset.t3Theme === options.theme && stage.dataset.t3State === phases[phaseIndex];
    stage.hidden = !visible || options.renderMode === 'pixel-verified';
  }
  const pixelMode = options.renderMode === 'pixel-verified';
  const row = Math.floor(frame / 12);
  for (const capture of document.querySelectorAll('[data-t3-pixel-theme]')) {
    const active = pixelMode && capture.dataset.t3PixelTheme === options.theme && Number(capture.dataset.t3PixelRow) === row;
    capture.hidden = !active;
    if (active) {
      const image = pixelSources.get(capture.dataset.t3PixelRow);
      const context = capture.getContext('2d', { alpha: false });
      if (image?.complete && image.naturalWidth > 0 && context) {
        context.drawImage(image, (frame % 12) * 1200, 0, 1200, 659, 0, 0, 1200, 659);
      }
    }
  }
  if (${profile.terminal ? "true" : "false"} && options.renderMode === 'editable DOM') {
    const customTerminal = ['terminalPrompt','branchName','command','output'].some((key) => options[key] !== defaults[key]);
    const phase = phases[phaseIndex];
    const sequence = canvasSequence[options.theme] ?? [];
    const runFrame = Number(options.openedFrame ?? defaultEvents.opened);
    const outputFrame = Number(options.outputFrame ?? defaultEvents.output);
    const sourceFrame = frame < runFrame ? runFrame : frame < outputFrame ? defaultEvents.opened + ((frame - runFrame) % Math.max(1, defaultEvents.output - defaultEvents.opened))
      : defaultEvents.output + ((frame - outputFrame) % Math.max(1, 120 - defaultEvents.output));
    for (const stage of sections) {
      const visible = !stage.hidden && stage.dataset.t3Theme === options.theme;
      for (const wrapper of stage.querySelectorAll('[data-t3-terminal-frame]')) {
        const image = wrapper.querySelector('[data-t3-terminal-image]');
        const overlay = wrapper.querySelector('.terminal-custom');
        const asset = sequence[sourceFrame] ?? sequence.at(-1);
        if (image && asset) image.src = 'compositions/' + asset;
        if (image) image.hidden = customTerminal;
        if (overlay) {
          overlay.hidden = !customTerminal;
          overlay.querySelector('.directory').textContent = options.terminalPrompt;
          overlay.querySelector('.branch').textContent = options.branchName;
          overlay.querySelector('.command').textContent = options.command;
          overlay.querySelector('.terminal-output').textContent = phase === 'output' ? options.output : '';
        }
      }
    }
  }
}
draw();
const registerTimeline = () => {
  draw();
  const timeline = gsap.timeline({ paused: true });
  timeline.to(clock, { frame: 120, duration: 4, ease: 'none', onUpdate: draw });
  window.__timelines['${name}'] = timeline;
  window.__hfForceTimelineRebind?.();
};
Promise.all(preloads.map((image) => image.decode())).then(registerTimeline);
</script></template></body></html>
`;

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await mkdir(resolve(output, "licenses"), { recursive: true });
await writeFile(resolve(output, `${name}.html`), html);
const oldManifest = JSON.parse(await readFile(resolve(block, "registry-item.json"), "utf8"));
const licenseFiles = oldManifest.files.filter(({ path }) => path.startsWith("licenses/"));
for (const file of licenseFiles) await cp(resolve(block, file.path), resolve(output, file.path), { recursive: true });
await writeFile(resolve(output, "t3-code-gsap.min.js"), await readFile(resolve(block, "t3-code-gsap.min.js")));
const nativeAssets = [];
for (const theme of ["dark", "light"]) {
  const prefix = assets[theme].prefix;
  for (let row = 0; row < 10; row++) {
    const file = `${prefix}-capture-${String(row).padStart(2, "0")}.webp`;
    await cp(resolve(source, file), resolve(output, file));
    nativeAssets.push(file);
  }
}
for (const file of canvasAssets) {
  await cp(resolve(source, file), resolve(output, file));
  nativeAssets.push(file);
}
await writeFile(resolve(output, "README.md"), `# T3 Code: ${profile.title}

This 1200 × 659, 30 fps, four-second block is captured from T3 Code v0.0.42 at commit ${dark.sourceCommit}. ${profile.detail}

Choose pixel-verified mode for the lossless native 120-frame reference or editable DOM mode to change the visible project copy and event timing. ${profile.terminal ? "The native terminal frames are included as stills; edited command text and output use a variable-driven terminal layer." : "The captured DOM states preserve the native controls and portal placement."} Set T3 Code appearance to dark or light. Every displayed fixture uses Hyfrme sample-project content.

${licenseFiles.length ? "Third-party license and notice files are installed with the block. " : ""}GSAP is included locally for deterministic frame seeking. The source application is MIT licensed: https://github.com/pingdotgg/t3code/tree/${dark.sourceCommit}.
`);
const registryFiles = [
  { path: `${name}.html`, target: `compositions/${name}.html`, type: "hyperframes:composition" },
  { path: "t3-code-gsap.min.js", target: "compositions/t3-code-gsap.min.js", type: "hyperframes:asset" },
  ...nativeAssets.map((path) => ({ path, target: `compositions/${path}`, type: "hyperframes:asset" })),
  ...licenseFiles,
  { path: "README.md", target: `compositions/${name}.README.md`, type: "hyperframes:asset" },
];
await writeFile(resolve(output, "registry-item.json"), `${JSON.stringify({
  $schema: oldManifest.$schema, name, type: "hyperframes:block", title: `T3 Code: ${profile.title}`,
  description: profile.description, tags: ["composition", "app-ui", "t3-code", shortName, "hyfrme-port"],
  author: "Hyfrme", authorUrl: "https://github.com/AksharP5/hyfrme", license: "MIT",
  dimensions: dark.viewport, duration: dark.frames / dark.fps, files: registryFiles,
}, null, 2)}\n`);
console.log(`Generated ${name} from v0.0.42 dark/light DOM captures and lossless native atlases.`);
