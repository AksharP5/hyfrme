import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const release = resolve(root, ".work/t3-v0042-bin/t3-0.0.42-linux-x64/t3");
const theme = process.env.T3_REFERENCE_THEME ?? "dark";
if (!["dark", "light"].includes(theme)) throw new Error("T3_REFERENCE_THEME must be dark or light");
const probeOnly = process.env.T3_PROBE_ONLY === "1";
const fixtureDir = resolve(root, `.work/t3-visual-context-v0042-${theme}-fixture`);
const work = resolve(root, `.work/t3-visual-context-v0042-${theme}-reference`);
const reference = resolve(root, `parity/t3-visual-context-shelf-v0042-${theme}-reference.mkv`);
const chrome = process.env.HYFRME_CHROMIUM;
if (!chrome) throw new Error("Set HYFRME_CHROMIUM to pinned Chrome 152");
const baseline = JSON.parse(await readFile(resolve(source, "brief-v0042-fixture.json"), "utf8"));
const image = resolve(source, "visual-context-shelf-logo-enter.png");
const imageBytes = await readFile(image);
const imageName = "hyfrme-logo-enter-final.png";
const promptBefore = "Use this Hyfrme Logo Enter frame as the reference.";
const promptAfter = `${promptBefore} Keep the last frame still for 18 frames.`;
const frames = 120;
const fps = 30;
const pasteFrame = 40;
const instructionFrame = 85;
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
if (spawnSync(release, ["--version"], { encoding: "utf8" }).stdout.trim() !== "t3 v0.0.42") throw new Error("Wrong official T3 release");
if (spawnSync(chrome, ["--version"], { encoding: "utf8" }).stdout.trim() !== "Google Chrome for Testing 152.0.7977.30") throw new Error("Wrong pinned browser");
await mkdir(work, { recursive: true });
await rm(fixtureDir, { recursive: true, force: true });
await cp(resolve(root, ".work/t3-v0042-composer-fixture"), fixtureDir, { recursive: true });
const server = spawn(release, ["serve", "--mode", "desktop", "--base-dir", fixtureDir,
  "--port", theme === "dark" ? "3972" : "3973", "--host", "127.0.0.1", "--no-browser"],
{ cwd: root, stdio: ["ignore", "pipe", "pipe"] });
let serverText = "";
for (const stream of [server.stdout, server.stderr]) stream.on("data", (chunk) => { serverText += chunk; });
let url;
for (let attempt = 0; attempt < 120; attempt++) {
  url = serverText.match(/Pairing URL: (\S+)/)?.[1];
  if (url) break;
  if (server.exitCode !== null) throw new Error("Official app exited before pairing");
  await new Promise((done) => setTimeout(done, 250));
}
if (!url) throw new Error("Official app did not produce pairing URL");
let browser;
let nativeImageUrl;
let modelName;
let threadAges;
let attachmentBlobUrls = 0;
let thumbnailSha256;
const motion = {};
const phases = ["before", "attached", "final"];
try {
  for (const [key, path] of [["index", "/"], ["css", "/assets/main-x9o7QJ8O.css"], ["js", "/assets/index-BMH8bO9q.js"]]) {
    const response = await fetch(new URL(path, url));
    if (!response.ok || hash(Buffer.from(await response.arrayBuffer())) !== baseline.sourceHashes[key]) {
      throw new Error(`${key} differs from pinned official release`);
    }
  }
  browser = await chromium.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage",
    "--font-render-hinting=none", "--force-color-profile=srgb", "--use-gl=angle", "--use-angle=gl-egl",
    "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer"] });
  const page = await browser.newPage({ viewport: baseline.viewport, deviceScaleFactor: 1, colorScheme: theme });
  await page.addInitScript(() => {
    window.__captureAttachmentMotion = false;
    window.__attachmentAnimations = [];
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const animation = animate.apply(this, args);
      if (window.__captureAttachmentMotion) {
        animation.pause();
        animation.currentTime = 0;
        window.__attachmentAnimations.push(animation);
      }
      return animation;
    };
  });
  await page.clock.setFixedTime(new Date("2026-09-25T11:30:00Z"));
  await page.goto(url, { waitUntil: "domcontentloaded" });
  const editor = page.locator('[data-testid="composer-editor"]');
  await editor.waitFor({ timeout: 20000 });
  await page.waitForTimeout(900);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  const thread = page.locator('[data-testid="sidebar-row-card"]').filter({ hasText: "Build a logo intro" }).first();
  await thread.click();
  await editor.waitFor({ timeout: 20000 });
  await page.waitForTimeout(400);
  await page.evaluate(() => document.fonts.ready);
  const nativeTheme = await page.evaluate(() => ({ className: document.documentElement.className,
    variables: Object.fromEntries(Array.from(getComputedStyle(document.documentElement))
      .filter((key) => key.startsWith("--"))
      .map((key) => [key, getComputedStyle(document.documentElement).getPropertyValue(key).trim()])) }));
  if (theme === "dark" ? !nativeTheme.className.includes("dark") : nativeTheme.className.includes("dark")) {
    throw new Error(`Official app did not enter ${theme} appearance`);
  }
  const expectedTheme = JSON.parse(await readFile(resolve(source, `${theme}-theme.json`), "utf8"));
  const ordered = (values) => JSON.stringify(Object.entries(values).sort(([a], [b]) => a.localeCompare(b)));
  if (ordered(nativeTheme.variables) !== ordered(expectedTheme)) throw new Error("Official theme variables changed");
  const modelLabel = page.locator('[data-chat-provider-model-picker-label="true"]').first();
  modelName = await modelLabel.count() ? await modelLabel.innerText() : "No provider available";
  threadAges = await page.locator('[data-testid="sidebar-row-card"]')
    .evaluateAll((rows) => rows.map((row) => row.querySelector('span.tabular-nums.text-secondary-label')?.textContent.trim() ?? ""));
  await editor.fill(promptBefore);
  await editor.evaluate((element) => element.blur());
  await page.mouse.move(800, 80);
  await page.waitForTimeout(250);
  const saveRoot = async (phase) => {
    const nativeDom = await page.locator("#root").evaluate((element) => element.innerHTML);
    const blobUrls = [...nativeDom.matchAll(/blob:[^"'\s<>)]*/g)].map((match) => match[0]);
    if (phase === "attached") attachmentBlobUrls = new Set(blobUrls).size;
    if (blobUrls.length > 4) throw new Error(`${phase} has ${blobUrls.length} unexpected blob URLs`);
    const dom = nativeDom
      .replaceAll(nativeImageUrl ?? "__never__", "t3-visual-context-logo-enter.png")
      .replace(/blob:[^"'\s<>)]*/g, "t3-visual-context-logo-enter.png")
      .replaceAll(fixtureDir, "hyfrme-project")
      .replaceAll(resolve(root, ".work/t3-v0042-composer-project"), "hyfrme-project");
    const privateKinds = Object.entries({ homePath: /\/home\//, blobUrl: /blob:/,
      authToken: /auth[_-]?token/i, sessionToken: /session[_-]?token/i,
      localPort: /127\.0\.0\.1:\d+/ }).filter(([, pattern]) => pattern.test(dom)).map(([kind]) => kind);
    if (privateKinds.length) {
      throw new Error(`${phase} DOM contains private fixture data: ${privateKinds.join(",")}`);
    }
    await writeFile(resolve(source, `visual-context-v0042-${theme}-${phase}.html`), dom);
  };
  const freeze = async (phase) => {
    motion[phase] = await page.evaluate(() => {
      for (const animation of document.getAnimations()) {
        if (!window.__attachmentAnimations.includes(animation)) window.__attachmentAnimations.push(animation);
      }
      for (const animation of window.__attachmentAnimations) {
        animation.pause();
        animation.currentTime = 0;
      }
      return window.__attachmentAnimations.map((animation) => ({
        type: animation.constructor.name,
        target: animation.effect?.target?.getAttribute("data-slot") ?? animation.effect?.target?.tagName ?? null,
        ariaLabel: animation.effect?.target?.getAttribute("aria-label") ?? null,
        durationMs: animation.effect?.getComputedTiming().duration,
        easing: animation.effect?.getTiming().easing,
        keyframes: animation.effect?.getKeyframes(),
      }));
    });
  };
  const seek = async (elapsed) => page.evaluate((time) => {
    for (const animation of window.__attachmentAnimations) {
      animation.currentTime = Math.min(animation.effect?.getComputedTiming().duration ?? 0, time);
    }
  }, elapsed);
  await saveRoot("before");
  for (let frame = 0; frame < frames; frame++) {
    if (frame === pasteFrame) {
      await page.evaluate(() => { window.__captureAttachmentMotion = true; window.__attachmentAnimations = []; });
      await editor.focus();
      await editor.evaluate((element, payload) => {
        const bytes = Uint8Array.from(atob(payload.base64), (character) => character.charCodeAt(0));
        const clipboardData = new DataTransfer();
        clipboardData.items.add(new File([bytes], payload.name, { type: "image/png" }));
        element.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData }));
      }, { base64: imageBytes.toString("base64"), name: imageName });
      const preview = page.locator(`img[alt="${imageName}"]`).first();
      await preview.waitFor({ state: "visible", timeout: 20000 });
      await preview.evaluate((element) => element.decode());
      nativeImageUrl = await preview.getAttribute("src");
      if (!nativeImageUrl?.startsWith("blob:") && !nativeImageUrl?.startsWith("data:")) {
        throw new Error("Official app did not create a local pasted-image preview");
      }
      thumbnailSha256 = await page.evaluate(async () => {
        const src = document.querySelector('[data-slot="tooltip-trigger"][aria-label^="Image attachment,"] img')?.getAttribute("src");
        if (!src?.startsWith("blob:")) return null;
        const bytes = await (await fetch(src)).arrayBuffer();
        return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)))
          .map((value) => value.toString(16).padStart(2, "0")).join("");
      });
      await page.evaluate(() => { window.__captureAttachmentMotion = false; });
      await editor.evaluate((element) => element.blur());
      await page.mouse.move(800, 80);
      await freeze("paste");
      await saveRoot("attached");
      if (probeOnly) {
        await page.screenshot({ path: resolve(work, "probe.png") });
        await writeFile(resolve(work, "probe.json"), JSON.stringify({ theme, motion, imageName,
          attachmentBlobUrls,
          thumbnailSha256,
          previewSourceKind: nativeImageUrl.startsWith("blob:") ? "blob" : "data" }, null, 2) + "\n");
        break;
      }
    }
    if (frame === instructionFrame) {
      await editor.focus();
      await editor.evaluate((element) => {
        const prompt = element.querySelector('[data-lexical-text]')?.firstChild;
        if (!prompt || prompt.nodeType !== Node.TEXT_NODE) throw new Error("Native prompt text is missing");
        const selection = window.getSelection();
        const range = document.createRange();
        range.setStart(prompt, prompt.textContent.length);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      });
      await page.keyboard.insertText("Keep the last frame still for 18 frames.");
      const editedText = await editor.textContent();
      await writeFile(resolve(work, "native-edited-text.json"), JSON.stringify({ editedText }, null, 2) + "\n");
      if (!editedText?.includes(promptBefore) || !editedText.includes("Keep the last frame still for 18 frames.")) {
        throw new Error("Official composer did not retain both instruction fragments");
      }
      if (!await page.locator(`img[alt="${imageName}"]`).count()) throw new Error("Pasted image disappeared while refining prompt");
      await editor.evaluate((element) => element.blur());
      await page.mouse.move(800, 80);
      motion.instruction = await page.evaluate(() => document.getAnimations()
        .filter((animation) => animation.playState === "running")
        .map((animation) => ({ target: animation.effect?.target?.getAttribute("data-slot") ?? null,
          durationMs: animation.effect?.getComputedTiming().duration })));
      if (motion.instruction.length) throw new Error("Prompt refinement started an unsampled native animation");
      await saveRoot("final");
    }
    if (frame >= pasteFrame && frame < instructionFrame) await seek((frame - pasteFrame) * 1000 / fps);
    await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
} catch (error) {
  throw new Error(String(error).replaceAll(url, "[pairing URL redacted]"));
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
if (probeOnly) {
  console.log(`Probed official ${theme} v0.0.42 pasted-image shelf: ${JSON.stringify(motion.paste?.map((item) => [item.target, item.durationMs]))}`);
  process.exit(0);
}
const encoded = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
if (encoded.status !== 0) throw new Error(encoded.stderr);
await writeFile(resolve(source, `visual-context-v0042-${theme}-fixture.json`), JSON.stringify({
  sourceTag: "v0.0.42", sourceCommit: baseline.sourceCommit, sourceHashes: baseline.sourceHashes,
  viewport: baseline.viewport, theme, fps, frames, promptBefore, promptAfter, imageName,
  pasteFrame, instructionFrame, modelName, motion,
  threadAges,
  attachmentBlobUrls,
  thumbnailSha256,
  imageSource: "Hyfrme Logo Enter final frame; MIT-licensed Remocn source",
  imageSha256: hash(imageBytes),
  sourceDomHashes: Object.fromEntries(await Promise.all(phases.map(async (phase) => [
    phase, hash(await readFile(resolve(source, `visual-context-v0042-${theme}-${phase}.html`))),
  ]))),
  referenceSha256: hash(await readFile(reference)),
  providerState: "Seeded local thread; no provider configured; no AI inference runs.",
}, null, 2) + "\n");
console.log(`Captured 120 official T3 Code v0.0.42 ${theme} pasted-image frames.`);
