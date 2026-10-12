import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const release = resolve(root, ".work/t3-v0042-bin/t3-0.0.42-linux-x64");
const source = resolve(root, "assets/t3-code/v0.0.42");
const theme = process.env.T3_REFERENCE_THEME ?? "dark";
if (!["dark", "light"].includes(theme)) throw new Error("T3_REFERENCE_THEME must be dark or light");
const project = resolve(root, `.work/t3-v0042-return-worktree-${theme}-fixture`);
const executablePath = process.env.HYFRME_CHROMIUM;
if (!executablePath) throw new Error("Set HYFRME_CHROMIUM to the pinned Chrome executable");
const prefix = `return-worktree-v0042-${theme}`;
const work = resolve(root, `.work/t3-${prefix}-reference`);
const reference = resolve(root, `parity/t3-return-worktree-v0042-${theme}-reference.mkv`);
const base = JSON.parse(await readFile(resolve(source, "brief-v0042-fixture.json"), "utf8"));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const version = spawnSync(resolve(release, "t3"), ["--version"], { encoding: "utf8" });
if (version.status !== 0 || version.stdout.trim() !== "t3 v0.0.42") throw new Error("Wrong T3 Code release");
const server = spawn(resolve(release, "t3"), ["serve", "--mode", "desktop", "--base-dir", project,
  "--port", theme === "dark" ? "3978" : "3979", "--host", "127.0.0.1", "--no-browser"],
{ cwd: root, stdio: ["ignore", "pipe", "pipe"] });
let serverOutput = "";
for (const stream of [server.stdout, server.stderr]) stream.on("data", (chunk) => { serverOutput += chunk; });
let pairingUrl;
for (let attempt = 0; attempt < 120; attempt++) {
  pairingUrl = serverOutput.match(/Pairing URL: (\S+)/)?.[1];
  if (pairingUrl) break;
  if (server.exitCode !== null) throw new Error("Official server exited before pairing");
  await new Promise((done) => setTimeout(done, 250));
}
if (!pairingUrl) throw new Error("Official server did not produce a pairing URL");
for (const [key, path] of [["index", "/"], ["css", "/assets/main-x9o7QJ8O.css"], ["js", "/assets/index-BMH8bO9q.js"]]) {
  const response = await fetch(new URL(path, pairingUrl));
  if (!response.ok || hash(Buffer.from(await response.arrayBuffer())) !== base.sourceHashes[key]) {
    server.kill("SIGTERM");
    throw new Error(`${key} differs from the pinned official release`);
  }
}
const chromeVersion = spawnSync(executablePath, ["--version"], { encoding: "utf8" });
if (chromeVersion.status !== 0 || chromeVersion.stdout.trim() !== "Google Chrome for Testing 152.0.7977.30") {
  throw new Error("Wrong capture browser");
}
const prompt = "Compare the Hyfrme Logo Enter final frame with the pinned reference; fix any mismatch.";
const frames = 120;
const fps = 30;
const events = { open: 30, hover: 60, select: 90 };
await mkdir(work, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true, args: [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
  "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
] });
let triggerBox;
let popupBox;
let options;
const motion = {};
try {
  const page = await browser.newPage({ viewport: base.viewport, deviceScaleFactor: 1, colorScheme: theme });
  await page.addInitScript(() => {
    window.__hyfrmeAnimations = [];
    window.__captureHyfrmeAnimations = false;
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const animation = animate.apply(this, args);
      if (window.__captureHyfrmeAnimations) {
        animation.pause();
        animation.currentTime = 0;
        window.__hyfrmeAnimations.push(animation);
      }
      return animation;
    };
  });
  await page.clock.setFixedTime(new Date("2026-09-25T11:30:00Z"));
  await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
  const editor = page.locator('[data-testid="composer-editor"]');
  await editor.waitFor({ timeout: 20000 });
  await page.waitForTimeout(900);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.evaluate(() => document.fonts.ready);
  const currentTheme = await page.evaluate(() => document.documentElement.className.includes("dark") ? "dark" : "light");
  if (currentTheme !== theme) throw new Error(`Official app displayed ${currentTheme} under ${theme} capture`);
  const trigger = page.locator('[data-composer-shortcut="composer.workspace"]').first();
  if ((await trigger.innerText()).trim() !== "Current checkout") {
    await trigger.click();
    await page.getByRole("option", { name: "Current checkout" }).click();
  }
  await editor.fill(prompt);
  await editor.evaluate((element) => element.blur());
  await page.mouse.move(800, 80);
  await page.waitForTimeout(250);
  const popup = page.locator('[data-base-ui-portal]:has([data-slot="select-popup"])').last();
  const saveDom = async (phase) => {
    const dom = (await page.locator("#root").evaluate((element) => element.innerHTML)).replaceAll(project, "hyfrme-project");
    if (/\/home\/|auth[_-]?token|session[_-]?token|127\.0\.0\.1:\d+/i.test(dom)) throw new Error(`Private data in ${phase} DOM`);
    await writeFile(resolve(source, `${prefix}-${phase}.html`), dom);
  };
  const freeze = async (phase) => {
    motion[phase] = await page.evaluate(() => {
      window.__captureHyfrmeAnimations = false;
      for (const animation of document.getAnimations()) {
        if (!window.__hyfrmeAnimations.includes(animation)) {
          animation.pause();
          animation.currentTime = 0;
          window.__hyfrmeAnimations.push(animation);
        }
      }
      return window.__hyfrmeAnimations.map((animation) => ({
        target: animation.effect?.target?.getAttribute("data-slot") ?? animation.effect?.target?.getAttribute("role") ?? null,
        duration: animation.effect?.getTiming().duration ?? null,
        easing: animation.effect?.getTiming().easing ?? null,
        keyframes: animation.effect?.getKeyframes().map(({ offset, easing, ...styles }) => ({ offset, easing, styles })) ?? [],
      }));
    });
  };
  await saveDom("before");
  for (let frame = 0; frame < frames; frame++) {
    if (frame === events.open) {
      await page.evaluate(() => { window.__captureHyfrmeAnimations = true; window.__hyfrmeAnimations = []; });
      await trigger.click();
      await popup.locator('[data-slot="select-popup"]').waitFor({ state: "visible" });
      triggerBox = await trigger.boundingBox();
      popupBox = await popup.locator('[data-slot="select-popup"]').boundingBox();
      if (!triggerBox || !popupBox || Math.abs(popupBox.y - triggerBox.y - triggerBox.height) > 12) {
        throw new Error(`Workspace menu is not anchored to its composer trigger: ${JSON.stringify({ triggerBox, popupBox })}`);
      }
      options = await popup.getByRole("option").allInnerTexts();
      if (!options.some((option) => option.includes("Previous worktree (main)"))) throw new Error("Native Previous worktree option absent");
      await freeze("open");
      await saveDom("menu");
      const portal = (await popup.evaluate((element) => element.outerHTML)).replaceAll(project, "hyfrme-project");
      if (/\/home\/|auth[_-]?token|session[_-]?token/i.test(portal)) throw new Error("Private data in workspace portal");
      await writeFile(resolve(source, `${prefix}-portal.html`), portal);
    }
    if (frame >= events.open && frame < events.hover) {
      await page.evaluate((elapsed) => {
        for (const animation of window.__hyfrmeAnimations) animation.currentTime = Math.min(150, elapsed);
      }, (frame - events.open) * 1000 / fps);
    }
    if (frame === events.hover) {
      await page.evaluate(() => { window.__captureHyfrmeAnimations = true; window.__hyfrmeAnimations = []; });
      await popup.getByRole("option", { name: "Previous worktree (main)" }).hover();
      await freeze("hover");
      await saveDom("hover");
    }
    if (frame >= events.hover && frame < events.select) {
      await page.evaluate((elapsed) => {
        for (const animation of window.__hyfrmeAnimations) animation.currentTime = Math.min(150, elapsed);
      }, (frame - events.hover) * 1000 / fps);
    }
    if (frame === events.select) {
      await page.evaluate(() => { window.__captureHyfrmeAnimations = true; window.__hyfrmeAnimations = []; });
      await popup.getByRole("option", { name: "Previous worktree (main)" }).click();
      await freeze("select");
      if ((await trigger.innerText()).trim() !== "Current worktree") throw new Error("Native previous worktree selection failed");
      await saveDom("after");
    }
    if (frame >= events.select) {
      await page.evaluate((elapsed) => {
        for (const animation of window.__hyfrmeAnimations) animation.currentTime = Math.min(150, elapsed);
      }, (frame - events.select) * 1000 / fps);
    }
    await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
} finally {
  await browser.close();
  server.kill("SIGTERM");
}
const encode = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
if (encode.status !== 0) throw new Error(encode.stderr);
const phases = ["before", "menu", "portal", "hover", "after"];
await writeFile(resolve(source, `${prefix}-fixture.json`), JSON.stringify({
  sourceTag: "v0.0.42", sourceCommit: "719a76ca1dbf5490f1aa33ffb9966301e02be9a9",
  releaseSha256: base.releaseSha256, sourceHashes: base.sourceHashes,
  viewport: base.viewport, fps, frames, theme, prompt, events,
  triggerBox, popupBox, options, motion,
  sourceDomHashes: Object.fromEntries(await Promise.all(phases.map(async (phase) => [phase, hash(await readFile(resolve(source, `${prefix}-${phase}.html`)))]))),
  referenceSha256: hash(await readFile(reference)),
}, null, 2) + "\n");
console.log(`Captured ${frames} native T3 Code v0.0.42 Return to Worktree ${theme} frames.`);
