import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const release = resolve(root, ".work/t3-v0042-bin/t3-0.0.42-linux-x64");
const source = resolve(root, "assets/t3-code/v0.0.42");
const project = resolve(root, ".work/t3-v0042-composer-project");
const theme = process.env.T3_CAPTURE_THEME ?? "dark";
const probeOnly = process.env.T3_PROBE_ONLY === "1";
if (!["dark", "light"].includes(theme)) throw new Error("T3_CAPTURE_THEME must be dark or light");
const prefix = `reasoning-v0042-${theme}`;
const work = resolve(root, `.work/t3-reasoning-v0042-${theme}-reference`);
const reference = resolve(root, `parity/t3-reasoning-level-v0042-${theme}-reference.mkv`);
const executablePath = process.env.HYFRME_CHROMIUM;
if (!executablePath) throw new Error("Set HYFRME_CHROMIUM to the pinned Chrome executable");
const log = await readFile(resolve(root, ".work/t3-v0042-composer-server.log"), "utf8");
const pairingUrl = log.match(/Pairing URL: (\S+)/)?.[1];
if (!pairingUrl) throw new Error("Start the isolated v0.0.42 composer server before capture");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const brief = JSON.parse(await readFile(resolve(source, "brief-v0042-fixture.json"), "utf8"));
for (const [key, path] of [["index", "/"], ["css", "/assets/main-x9o7QJ8O.css"], ["js", "/assets/index-BMH8bO9q.js"]]) {
  const response = await fetch(new URL(path, pairingUrl));
  if (!response.ok || hash(Buffer.from(await response.arrayBuffer())) !== brief.sourceHashes[key]) {
    throw new Error(`${key} differs from the official T3 Code v0.0.42 release`);
  }
}
const version = spawnSync(resolve(release, "t3"), ["--version"], { encoding: "utf8" });
if (version.status !== 0 || version.stdout.trim() !== "t3 v0.0.42") throw new Error("Unexpected T3 Code build");
const chromeVersion = spawnSync(executablePath, ["--version"], { encoding: "utf8" });
if (chromeVersion.status !== 0 || chromeVersion.stdout.trim() !== "Google Chrome for Testing 152.0.7977.30") {
  throw new Error("Unexpected Chrome build");
}

const frames = 120;
const fps = 30;
const openFrame = 30;
const hoverFrame = 60;
const selectFrame = 90;
const reasoningBefore = "Medium";
const reasoningAfter = "High";
const prompt = "Verify the Hyfrme Logo Enter final-frame timing.";
const phases = ["before", "menu", "portal", "hover", "hover-portal", "after"];
await mkdir(work, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true, args: [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none",
  "--force-color-profile=srgb", "--use-gl=angle", "--use-angle=gl-egl",
  "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
] });
let popupBox;
let triggerBox;
let modelName;
let nativeThemeClass;
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
  const nativeTheme = await page.evaluate(() => ({
    className: document.documentElement.className,
    variables: Object.fromEntries(Array.from(getComputedStyle(document.documentElement))
      .filter((key) => key.startsWith("--"))
      .map((key) => [key, getComputedStyle(document.documentElement).getPropertyValue(key).trim()])),
  }));
  nativeThemeClass = nativeTheme.className;
  if (theme === "light" ? nativeThemeClass.includes("dark") : !nativeThemeClass.includes("dark")) {
    throw new Error(`Official app did not enter ${theme} appearance`);
  }
  const expectedTheme = JSON.parse(await readFile(resolve(source, `${theme}-theme.json`), "utf8"));
  const sortedEntries = (values) => JSON.stringify(Object.entries(values).sort(([left], [right]) => left.localeCompare(right)));
  if (sortedEntries(nativeTheme.variables) !== sortedEntries(expectedTheme)) {
    throw new Error(`${theme} release theme variables differ from the pinned fixture`);
  }
  const modelTrigger = page.locator('button[data-chat-provider-model-picker="true"]').first();
  modelName = await modelTrigger.locator('[data-chat-provider-model-picker-label="true"]').innerText();
  const trigger = page.locator('[data-composer-shortcut="composer.effort"]').first();
  await trigger.waitFor();
  const label = async () => (await trigger.innerText()).trim();
  const portal = page.locator('[data-base-ui-portal]:has([data-slot="menu-popup"])').last();
  if (await label() !== reasoningBefore) {
    await trigger.click();
    await portal.getByRole("menuitemradio", { name: /^Medium(?:\s|$)/ }).first().click();
    await page.waitForFunction((expected) => document.querySelector('[data-composer-shortcut="composer.effort"]')?.textContent?.trim() === expected, reasoningBefore);
  }
  await editor.fill(prompt);
  await editor.evaluate((element) => element.blur());
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
  const freezeAnimations = async () => page.evaluate(() => {
    window.__captureT3Animations = false;
    for (const animation of document.getAnimations()) {
      if (!window.__t3CaptureAnimations.includes(animation)) {
        animation.pause();
        animation.currentTime = 0;
        window.__t3CaptureAnimations.push(animation);
      }
    }
  });
  const seekAnimations = async (elapsed) => page.evaluate((time) => {
    for (const animation of window.__t3CaptureAnimations ?? []) animation.currentTime = Math.min(150, time);
  }, elapsed);
  await saveRoot("before");
  for (let frame = 0; frame < frames; frame++) {
    if (frame === openFrame) {
      await page.evaluate(() => { window.__captureT3Animations = true; window.__t3CaptureAnimations = []; });
      await trigger.click();
      await portal.waitFor({ state: "attached" });
      await portal.locator('[data-slot="menu-popup"]').waitFor({ state: "visible" });
      const choices = await portal.getByRole("menuitemradio").allInnerTexts();
      if (probeOnly) {
        await page.screenshot({ path: resolve(work, "probe-open.png") });
        console.log(JSON.stringify({ theme, modelName, choices, trigger: await trigger.boundingBox(), popup: await portal.locator('[data-slot="menu-popup"]').boundingBox() }));
        break;
      }
      if (!choices.some((choice) => /^High(?:\s|$)/.test(choice.trim()))) throw new Error("High reasoning is unavailable in the official picker");
      popupBox = await portal.locator('[data-slot="menu-popup"]').boundingBox();
      triggerBox = await trigger.boundingBox();
      const anchored = popupBox && triggerBox &&
        ((Math.abs(popupBox.x - triggerBox.x) <= 20 &&
          (Math.abs(popupBox.y - triggerBox.y - triggerBox.height) <= 16 ||
           Math.abs(popupBox.y + popupBox.height - triggerBox.y) <= 16)) ||
         (Math.abs(popupBox.y - triggerBox.y) <= 20 &&
          (Math.abs(popupBox.x - triggerBox.x - triggerBox.width) <= 16 ||
           Math.abs(popupBox.x + popupBox.width - triggerBox.x) <= 16)));
      if (!anchored) {
        throw new Error(`Reasoning menu is not anchored to its trigger: ${JSON.stringify({ popupBox, triggerBox })}`);
      }
      await freezeAnimations();
      await recordMotion("open");
      await saveRoot("menu");
      await writeFile(resolve(source, `${prefix}-portal.html`), await portal.evaluate((element) => element.outerHTML));
    }
    if (frame >= openFrame && frame < hoverFrame) await seekAnimations(((frame - openFrame) * 1000) / fps);
    if (frame === hoverFrame) {
      const target = portal.getByRole("menuitemradio", { name: /^High(?:\s|$)/ }).first();
      await page.evaluate(() => { window.__captureT3Animations = true; window.__t3CaptureAnimations = []; });
      await target.hover();
      await freezeAnimations();
      await recordMotion("hover");
      await saveRoot("hover");
      await writeFile(resolve(source, `${prefix}-hover-portal.html`), await portal.evaluate((element) => element.outerHTML));
    }
    if (frame >= hoverFrame && frame < selectFrame) await seekAnimations(((frame - hoverFrame) * 1000) / fps);
    if (frame === selectFrame) {
      await page.evaluate(() => { window.__captureT3Animations = true; window.__t3CaptureAnimations = []; });
      await portal.getByRole("menuitemradio", { name: /^High(?:\s|$)/ }).first().click();
      await freezeAnimations();
      await recordMotion("select");
      await page.waitForFunction((expected) => document.querySelector('[data-composer-shortcut="composer.effort"]')?.textContent?.trim() === expected, reasoningAfter);
      await saveRoot("after");
      if (await portal.count()) {
        await writeFile(resolve(source, `${prefix}-closing-portal.html`), await portal.evaluate((element) => element.outerHTML));
        phases.push("closing-portal");
        closingPortal = true;
      }
      await page.mouse.move(800, 80);
    }
    if (frame >= selectFrame) await seekAnimations(((frame - selectFrame) * 1000) / fps);
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
  theme, nativeThemeClass, viewport: brief.viewport, fps, frames, prompt, openFrame, hoverFrame, selectFrame,
  reasoningBefore, reasoningAfter, modelName,
  providerState: "seeded model and reasoning options; no provider configured",
  interaction: "native v0.0.42 reasoning menu open, hover, and selection; no model inference executed",
  popupBox, triggerBox, closingPortal, motion,
  sourceDomHashes: Object.fromEntries(await Promise.all(phases.map(async (phase) => [
    phase, hash(await readFile(resolve(source, `${prefix}-${phase}.html`))),
  ]))),
  referenceSha256: hash(await readFile(reference)),
}, null, 2) + "\n");
console.log(`Captured ${frames} native T3 Code v0.0.42 ${theme} reasoning frames; selected ${reasoningAfter}.`);
