import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const pairingUrl = (await readFile(resolve(root, ".work/t3-v0042-pin-server.log"), "utf8")).match(/Pairing URL: (\S+)/)?.[1];
if (!pairingUrl || !process.env.HYFRME_CHROMIUM) throw new Error("Pin server and Chrome required");
const output = resolve(root, ".work/t3-thread-pin-v0042-motion-probe");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.HYFRME_CHROMIUM, headless: true, args: [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
  "--disable-gpu",
] });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 659 }, deviceScaleFactor: 1, colorScheme: "dark" });
  await page.addInitScript(() => {
    window.__pinAnimations = [];
    window.__capturePinMotion = false;
    const originalAnimate = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const animation = originalAnimate.apply(this, args);
      if (window.__capturePinMotion && this.matches?.('[data-thread-item="true"]')) {
        animation.pause();
        animation.currentTime = 0;
        window.__pinAnimations.push(animation);
      }
      return animation;
    };
  });
  await page.clock.setFixedTime(new Date("2026-09-25T11:30:00Z"));
  await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  const target = page.locator('[data-testid="sidebar-row-card"]').filter({ hasText: "Catalog motion audit" }).first();
  await target.click();
  const menu = page.locator('.dropdown-glass[data-level="0"]');
  await target.click({ button: "right" });
  await menu.waitFor();
  const unpin = menu.getByRole("button", { name: "Unpin thread", exact: true });
  if (await unpin.count()) await unpin.click();
  else await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  await target.click({ button: "right" });
  await menu.getByRole("button", { name: "Pin thread", exact: true }).waitFor();
  const menuAnimations = await page.evaluate(() => {
    const menu = document.querySelector('.dropdown-glass[data-level="0"]');
    const button = [...menu.querySelectorAll('button')].find((item) => item.textContent.trim() === 'Pin thread');
    const measure = (element) => {
      const style = getComputedStyle(element);
      return { transitionProperty: style.transitionProperty, transitionDuration: style.transitionDuration,
        animationName: style.animationName, animationDuration: style.animationDuration };
    };
    return { menu: measure(menu), button: measure(button), active: document.getAnimations().map((animation) => ({
      target: animation.effect?.target?.getAttribute?.('class')?.slice(0, 120) ?? null,
      duration: animation.effect?.getComputedTiming().duration, playState: animation.playState,
    })) };
  });
  await page.evaluate(() => { window.__capturePinMotion = true; window.__pinAnimations = []; });
  await page.evaluate(() => {
    const button = [...document.querySelectorAll('.dropdown-glass[data-level="0"] button')]
      .find((item) => item.textContent.trim() === "Pin thread");
    if (!button) throw new Error("Pin action missing");
    button.click();
  });
  await page.waitForFunction(() => [...document.querySelectorAll('[data-testid="sidebar-row-card"]')][0]?.textContent?.includes('Catalog motion audit'), null, { timeout: 5000 });
  const info = await page.evaluate(() => window.__pinAnimations.map((animation) => ({
      targetText: animation.effect?.target?.textContent?.trim().slice(0, 80),
      keyframes: animation.effect?.getKeyframes(),
      duration: animation.effect?.getComputedTiming().duration,
      playState: animation.playState,
    })));
  const frames = [];
  for (const ms of [0, 33, 66, 99, 132, 150]) {
    const rows = await page.evaluate((time) => {
      for (const animation of window.__pinAnimations) animation.currentTime = time;
      return [...document.querySelectorAll('[data-testid="sidebar-row-card"]')].slice(0, 4).map((row) => ({
        title: row.textContent?.trim().slice(0, 80), top: row.getBoundingClientRect().top,
        opacity: getComputedStyle(row).opacity,
      }));
    }, ms);
    await page.screenshot({ path: resolve(output, `frame-${String(ms).padStart(3, "0")}.png`) });
    frames.push({ ms, rows });
  }
  await writeFile(resolve(output, "metrics.json"), JSON.stringify({ menuAnimations, pinAnimations: info, frames }, null, 2) + "\n");
  console.log(`Native Pin has ${info.length} sidebar animations; menu-open had ${menuAnimations.active.length} active animations.`);
} catch (error) {
  throw new Error(String(error).replaceAll(pairingUrl, "[pairing URL redacted]"));
} finally {
  await browser.close();
}
