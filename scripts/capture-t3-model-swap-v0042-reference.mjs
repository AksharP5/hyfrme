import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const theme = process.env.T3_CAPTURE_THEME ?? "dark";
const probeOnly = process.env.T3_PROBE_ONLY === "1";
if (theme !== "dark" && theme !== "light") throw new Error("T3_CAPTURE_THEME must be dark or light");
const serverLog = resolve(root, ".work/t3-v0042-composer-server.log");
const project = resolve(root, ".work/t3-v0042-composer-project");
const work = resolve(root, `.work/t3-model-swap-v0042-${theme}-reference`);
const reference = resolve(root, `parity/t3-model-swap-v0042-${theme}-reference.mkv`);
const executablePath = process.env.HYFRME_CHROMIUM;
if (!executablePath) throw new Error("Set HYFRME_CHROMIUM to the pinned Chrome executable");
const pairingUrl = (await readFile(serverLog, "utf8")).match(/Pairing URL: (\S+)/)?.[1];
if (!pairingUrl) throw new Error("Start the isolated composer server before capture");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const brief = JSON.parse(await readFile(resolve(source, "brief-v0042-fixture.json"), "utf8"));
for (const [key, path] of [["index", "/"], ["css", "/assets/main-x9o7QJ8O.css"], ["js", "/assets/index-BMH8bO9q.js"]]) {
  const served = await fetch(new URL(path, pairingUrl));
  if (!served.ok || hash(Buffer.from(await served.arrayBuffer())) !== brief.sourceHashes[key]) {
    throw new Error(`${key} differs from official T3 Code v0.0.42 release`);
  }
}
const chromeVersion = spawnSync(executablePath, ["--version"], { encoding: "utf8" });
if (chromeVersion.status !== 0 || chromeVersion.stdout.trim() !== "Google Chrome for Testing 152.0.7977.30") {
  throw new Error("Unexpected Chrome build");
}
const frames = 120;
const fps = 30;
const openFrame = 30;
const hoverFrame = 60;
const selectFrame = 90;
const modelBefore = "GPT-6-Astra";
const modelAfter = "GPT-6-Sol";
const prompt = brief.prompt;
const phases = ["before", "menu", "portal", "hover", "hover-portal", "after"];
const prefix = `model-swap-v0042-${theme}`;
await mkdir(work, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true, args: [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none",
  "--force-color-profile=srgb", "--use-gl=angle", "--use-angle=gl-egl",
  "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
] });
let popupBox;
let triggerBox;
let hoverStyles;
let closingPortal = false;
const motion = {};
try {
  const page = await browser.newPage({ viewport: brief.viewport, deviceScaleFactor: 1, colorScheme: theme });
  await page.addInitScript(() => {
    window.__t3CaptureAnimations = [];
    window.__captureT3Animations = false;
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const animation = animate.apply(this, args);
      if (window.__captureT3Animations) {
        animation.pause();
        animation.currentTime = 0;
        window.__t3CaptureAnimations.push(animation);
      }
      return animation;
    };
  });
  await page.clock.setFixedTime(new Date("2026-09-25T11:30:00Z"));
  await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
  const editor = page.locator('[data-testid="composer-editor"]');
  await editor.waitFor({ timeout: 20000 });
  await page.waitForTimeout(950);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.evaluate(() => document.fonts.ready);
  const trigger = page.locator('button[data-chat-provider-model-picker="true"]').first();
  await trigger.waitFor();
  const picker = page.locator('[data-base-ui-portal]:has([data-model-picker-content="true"])').first();
  const modelLabel = () => trigger.locator('[data-chat-provider-model-picker-label="true"]').innerText();
  if (await modelLabel() !== modelBefore) {
    await trigger.click();
    await picker.getByRole("option", { name: new RegExp(modelBefore) }).first().click();
    await page.waitForFunction((expected) => document.querySelector('[data-chat-provider-model-picker-label="true"]')?.textContent?.trim() === expected, modelBefore);
  }
  await editor.fill(prompt);
  if (process.env.T3_KEEP_EDITOR_FOCUS !== "1") await editor.evaluate((element) => element.blur());
  await page.mouse.move(800, 80);
  await page.waitForTimeout(250);
  const saveRoot = async (phase) => {
    const dom = (await page.locator("#root").evaluate((element) => element.innerHTML)).replaceAll(project, "hyfrme-project");
    if (/\/home\/|auth[_-]?token|session[_-]?token|127\.0\.0\.1:3906/i.test(dom)) {
      throw new Error(`Private data in ${phase} DOM`);
    }
    await writeFile(resolve(source, `${prefix}-${phase}.html`), dom);
  };
  const recordMotion = async (phase) => {
    motion[phase] = await page.evaluate(() => (window.__t3CaptureAnimations ?? []).map((animation) => ({
      target: animation.effect?.target?.getAttribute("data-slot") ?? animation.effect?.target?.getAttribute("role") ?? animation.effect?.target?.tagName ?? null,
      type: animation.constructor.name,
      duration: animation.effect?.getTiming().duration ?? null,
      easing: animation.effect?.getTiming().easing ?? null,
      keyframes: animation.effect?.getKeyframes().map(({ offset, easing, ...styles }) => ({ offset, easing, styles })) ?? [],
    })));
  };
  await saveRoot("before");
  for (let frame = 0; frame < frames; frame++) {
    if (frame === openFrame) {
      await page.evaluate(() => { window.__captureT3Animations = true; window.__t3CaptureAnimations = []; });
      await trigger.click();
      const expandedImmediately = await trigger.getAttribute("aria-expanded");
      if (probeOnly || !await picker.count()) await page.waitForTimeout(300);
      if (!await picker.count()) {
        const state = await page.evaluate(() => ({
          trigger: [...document.querySelectorAll('button[data-chat-provider-model-picker="true"]')].map((button) => ({
            expanded: button.getAttribute("aria-expanded"), disabled: button.disabled,
          })),
          popups: [...document.querySelectorAll('[data-slot="popover-popup"]')].map((popup) => ({
            visible: Boolean(popup.getClientRects().length), hidden: popup.closest("[hidden]") !== null,
            modelContent: popup.querySelector('[data-model-picker-content="true"]') !== null,
          })),
          modelContents: document.querySelectorAll('[data-model-picker-content="true"]').length,
        }));
        await page.screenshot({ path: resolve(work, "debug-open.png") });
        throw new Error(`Model picker did not open: ${JSON.stringify({ expandedImmediately, ...state })}`);
      }
      await picker.waitFor({ state: "attached" });
      await picker.locator('[data-slot="popover-popup"]').waitFor({ state: "visible" });
      if (probeOnly) {
        const state = await page.evaluate(() => ({
          expanded: document.querySelector('button[data-chat-provider-model-picker="true"]')?.getAttribute("aria-expanded"),
          options: [...document.querySelectorAll('[data-model-picker-content="true"] [role="option"]')].map((option) => option.textContent?.trim().slice(0, 80)),
          popupCount: document.querySelectorAll('[data-slot="popover-popup"]:not([hidden])').length,
        }));
        await page.screenshot({ path: resolve(work, "debug-open.png") });
        console.log(`Native picker probe: ${JSON.stringify({ expandedImmediately, ...state })}`);
        break;
      }
      const target = picker.getByRole("option", { name: new RegExp(modelAfter) }).first();
      if (!await target.count()) throw new Error(`${modelAfter} not available in native v0.0.42 picker`);
      popupBox = await picker.locator('[data-slot="popover-popup"]').boundingBox();
      triggerBox = await trigger.boundingBox();
      const anchored = popupBox && triggerBox &&
        (Math.abs(popupBox.x - triggerBox.x - triggerBox.width) <= 12 ||
          Math.abs(popupBox.x + popupBox.width - triggerBox.x) <= 12 ||
          Math.abs(popupBox.y + popupBox.height - triggerBox.y) <= 12 ||
          Math.abs(popupBox.y - triggerBox.y - triggerBox.height) <= 12);
      if (!anchored) {
        throw new Error(`Model popup not anchored to trigger: ${JSON.stringify({ popupBox, triggerBox })}`);
      }
      await page.evaluate(() => {
        window.__captureT3Animations = false;
        for (const animation of document.getAnimations()) {
          if (!window.__t3CaptureAnimations.includes(animation)) {
            animation.pause();
            animation.currentTime = 0;
            window.__t3CaptureAnimations.push(animation);
          }
        }
      });
      await recordMotion("open");
      await saveRoot("menu");
      const portal = await picker.evaluate((element) => element.outerHTML);
      if (/\/home\/|auth[_-]?token|session[_-]?token/i.test(portal)) throw new Error("Private data in model portal");
      await writeFile(resolve(source, `${prefix}-portal.html`), portal);
    }
    if (frame >= openFrame && frame < hoverFrame) {
      await page.evaluate((elapsed) => {
        for (const animation of window.__t3CaptureAnimations ?? []) animation.currentTime = Math.min(150, elapsed);
      }, ((frame - openFrame) * 1000) / fps);
    }
    if (frame === hoverFrame) {
      const target = picker.getByRole("option", { name: new RegExp(modelAfter) }).first();
      await page.evaluate(() => { window.__captureT3Animations = true; window.__t3CaptureAnimations = []; });
      await target.hover();
      await page.evaluate(() => {
        window.__captureT3Animations = false;
        for (const animation of document.getAnimations()) {
          if (!window.__t3CaptureAnimations.includes(animation)) {
            animation.pause();
            animation.currentTime = 0;
            window.__t3CaptureAnimations.push(animation);
          }
        }
      });
      await recordMotion("hover");
      await saveRoot("hover");
      await writeFile(resolve(source, `${prefix}-hover-portal.html`), await picker.evaluate((element) => element.outerHTML));
    }
    if (frame >= hoverFrame && frame < selectFrame) {
      await page.evaluate((elapsed) => {
        for (const animation of window.__t3CaptureAnimations ?? []) animation.currentTime = Math.min(150, elapsed);
      }, ((frame - hoverFrame) * 1000) / fps);
    }
    if (frame === hoverFrame + 5) {
      hoverStyles = await picker.getByRole("option", { name: new RegExp(modelAfter) }).first().evaluate((element) => ({
        backgroundColor: getComputedStyle(element).backgroundColor,
        color: getComputedStyle(element).color,
      }));
    }
    if (frame === selectFrame) {
      await page.evaluate(() => { window.__captureT3Animations = true; window.__t3CaptureAnimations = []; });
      await picker.getByRole("option", { name: new RegExp(modelAfter) }).first().click();
      await page.evaluate(() => {
        window.__captureT3Animations = false;
        for (const animation of document.getAnimations()) {
          if (!window.__t3CaptureAnimations.includes(animation)) {
            animation.pause();
            animation.currentTime = 0;
            window.__t3CaptureAnimations.push(animation);
          }
        }
      });
      await recordMotion("select");
      await page.waitForFunction((expected) => document.querySelector('[data-chat-provider-model-picker-label="true"]')?.textContent?.trim() === expected, modelAfter);
      await saveRoot("after");
      if (await picker.count()) {
        await writeFile(resolve(source, `${prefix}-closing-portal.html`), await picker.evaluate((element) => element.outerHTML));
        phases.push("closing-portal");
        closingPortal = true;
      }
    }
    if (frame >= selectFrame) {
      await page.evaluate((elapsed) => {
        for (const animation of window.__t3CaptureAnimations ?? []) animation.currentTime = Math.min(150, elapsed);
      }, ((frame - selectFrame) * 1000) / fps);
    }
    if (!probeOnly) await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
} finally {
  await browser.close();
}
if (probeOnly) process.exit(0);
const encode = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
if (encode.status !== 0) throw new Error(encode.stderr);
await writeFile(resolve(source, `${prefix}-fixture.json`), JSON.stringify({
  sourceTag: "v0.0.42", sourceCommit: brief.sourceCommit, sourceHashes: brief.sourceHashes,
  theme, viewport: brief.viewport, fps, frames, prompt, openFrame, hoverFrame, selectFrame, modelBefore, modelAfter,
  providerState: "seeded model availability; no provider configured",
  interaction: "native v0.0.42 picker open, hover, and selection; no model inference executed",
  popupBox, triggerBox, hoverStyles, closingPortal, motion,
  sourceDomHashes: Object.fromEntries(await Promise.all(phases.map(async (phase) => [
    phase, hash(await readFile(resolve(source, `${prefix}-${phase}.html`))),
  ]))),
  referenceSha256: hash(await readFile(reference)),
}, null, 2) + "\n");
console.log(`Captured ${frames} native T3 Code v0.0.42 ${theme} model picker frames; selected ${modelAfter}.`);
