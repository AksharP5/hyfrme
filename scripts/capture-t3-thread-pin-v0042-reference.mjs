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
const work = resolve(root, ".work/t3-thread-pin-v0042-reference");
const state = resolve(root, ".work/t3-v0042-pin-fixture/userdata/state.sqlite");
const serverLog = resolve(root, ".work/t3-v0042-pin-server.log");
const reference = resolve(root, "parity/t3-thread-pin-v0042-reference.mkv");
const executablePath = process.env.HYFRME_CHROMIUM;
if (!executablePath) throw new Error("Set HYFRME_CHROMIUM to pinned Chrome");
const pairingUrl = (await readFile(serverLog, "utf8")).match(/Pairing URL: (\S+)/)?.[1];
if (!pairingUrl) throw new Error("Start the isolated Pin fixture server");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const version = spawnSync(resolve(release, "t3"), ["--version"], { encoding: "utf8" });
if (version.status !== 0 || version.stdout.trim() !== "t3 v0.0.42") throw new Error("Wrong T3 release");
const chromeVersion = spawnSync(executablePath, ["--version"], { encoding: "utf8" });
if (chromeVersion.status !== 0 || chromeVersion.stdout.trim() !== "Google Chrome for Testing 152.0.7977.30") throw new Error("Wrong Chrome release");
const releaseFiles = { index: "client/index.html", css: "client/assets/main-x9o7QJ8O.css", js: "client/assets/index-BMH8bO9q.js" };
const sourceHashes = Object.fromEntries(await Promise.all(Object.entries(releaseFiles).map(async ([key, path]) => [key, hash(await readFile(resolve(release, path)))])));
for (const [key, path] of Object.entries(releaseFiles)) {
  const served = await fetch(new URL(`/${path.replace(/^client\//, "")}`, pairingUrl));
  if (!served.ok || hash(Buffer.from(await served.arrayBuffer())) !== sourceHashes[key]) throw new Error(`${key} differs from official T3 release`);
}

const browser = await chromium.launch({ executablePath, headless: true, args: [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none",
  "--force-color-profile=srgb", "--use-gl=angle", "--use-angle=gl-egl",
  "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
] });
const frames = 120;
const fps = 30;
const events = { menu: 25, pin: 55, unpinMenu: 85 };
const targetThread = "Catalog motion audit";
const phases = ["unpinned", "pin-menu", "pinned", "unpin-menu"];
let beforeOrder;
let afterOrder;
let menuBox;
let motion;
try {
  await mkdir(source, { recursive: true });
  await mkdir(work, { recursive: true });
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
  const row = page.locator('[data-testid="sidebar-row-card"]').filter({ hasText: targetThread }).first();
  await row.click();
  await page.waitForTimeout(900);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.mouse.move(800, 80);
  await page.waitForTimeout(450);
  const menu = page.locator('.dropdown-glass[data-level="0"]');
  const readOrder = () => page.locator('[data-testid="sidebar-row-card"]').evaluateAll((rows) => rows.map((element) => element.innerText));
  await row.click({ button: "right" });
  await menu.waitFor();
  const initialUnpin = menu.getByRole("button", { name: "Unpin thread", exact: true });
  if (await initialUnpin.count()) {
    await initialUnpin.click();
    await page.waitForTimeout(550);
  } else {
    await page.keyboard.press("Escape");
  }
  await page.mouse.move(800, 80);
  await page.waitForTimeout(300);
  beforeOrder = await readOrder();
  if (beforeOrder[0]?.includes(targetThread)) throw new Error("Pin fixture starts already pinned");
  const saveRoot = async (phase) => {
    const dom = (await page.locator("#root").evaluate((element) => element.innerHTML))
      .replaceAll(resolve(root, ".work/t3-v0042-pin-project"), "hyfrme-project");
    if (/\/home\/|auth[_-]?token|session[_-]?token|127\.0\.0\.1:3916/i.test(dom)) throw new Error(`Private data in ${phase} DOM`);
    await writeFile(resolve(source, `thread-pin-${phase}.html`), dom);
  };
  const saveMenu = async (phase) => {
    const html = await menu.evaluate((element) => element.outerHTML);
    if (/\/home\/|auth[_-]?token|session[_-]?token/i.test(html)) throw new Error(`Private data in ${phase} menu`);
    await writeFile(resolve(source, `thread-pin-${phase}-portal.html`), html);
  };
  await saveRoot("unpinned");
  for (let frame = 0; frame < frames; frame++) {
    if (frame === events.menu) {
      await row.click({ button: "right" });
      await menu.waitFor();
      if (!await menu.getByRole("button", { name: "Pin thread", exact: true }).count()) throw new Error("Native row menu lacks Pin thread");
      const rowBox = await row.boundingBox();
      menuBox = await menu.boundingBox();
      if (!rowBox || !menuBox || menuBox.x > rowBox.x + rowBox.width + 30 || menuBox.y < rowBox.y - 30) throw new Error(`Menu not anchored to row: ${JSON.stringify({ rowBox, menuBox })}`);
      await page.waitForTimeout(350);
      await saveRoot("pin-menu");
      await saveMenu("pin-menu");
    }
    if (frame === events.pin) {
      await page.evaluate(() => { window.__pinAnimations = []; window.__capturePinMotion = true; });
      await menu.getByRole("button", { name: "Pin thread", exact: true }).click();
      await page.waitForFunction((title) => [...document.querySelectorAll('[data-testid="sidebar-row-card"]')][0]?.textContent?.includes(title), targetThread, { timeout: 5000 });
      motion = await page.evaluate(() => window.__pinAnimations.map((animation) => ({
        row: animation.effect?.target?.querySelector('[data-testid="sidebar-row-card"]')?.textContent?.trim().slice(0, 100),
        keyframes: animation.effect?.getKeyframes().map(({ transform }) => transform),
        durationMs: animation.effect?.getComputedTiming().duration,
      })));
      if (motion.length !== 2 || motion.some(({ durationMs }) => durationMs !== 150)) throw new Error(`Unexpected native row motion: ${JSON.stringify(motion)}`);
      afterOrder = await readOrder();
    }
    if (frame >= events.pin && frame < events.pin + 5) {
      await page.evaluate((ms) => { for (const animation of window.__pinAnimations) animation.currentTime = ms; }, (frame - events.pin) * 1000 / fps);
    }
    if (frame === events.pin + 5) {
      await page.evaluate(() => { for (const animation of window.__pinAnimations) animation.cancel(); window.__capturePinMotion = false; });
      await saveRoot("pinned");
    }
    if (frame === events.unpinMenu) {
      await row.click({ button: "right" });
      await menu.waitFor();
      if (!await menu.getByRole("button", { name: "Unpin thread", exact: true }).count()) throw new Error("Native row menu lacks Unpin thread after pinning");
      await page.waitForTimeout(350);
      await saveRoot("unpin-menu");
      await saveMenu("unpin-menu");
    }
    await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
} catch (error) {
  throw new Error(String(error).replaceAll(pairingUrl, "[pairing URL redacted]"));
} finally {
  await browser.close();
}
const persisted = spawnSync("sqlite3", [state, `select pinned_at from projection_threads where title='${targetThread}';`], { encoding: "utf8" });
if (persisted.status !== 0 || !persisted.stdout.trim()) throw new Error("Pin did not persist");
if (!afterOrder?.[0]?.includes(targetThread)) throw new Error("Pin did not move target to first row");
const encoded = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps), "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
if (encoded.status !== 0) throw new Error(encoded.stderr);
const sourceDomHashes = Object.fromEntries(await Promise.all(phases.map(async (phase) => [phase, hash(await readFile(resolve(source, `thread-pin-${phase}.html`)))])));
const portalHashes = Object.fromEntries(await Promise.all(["pin-menu", "unpin-menu"].map(async (phase) => [phase, hash(await readFile(resolve(source, `thread-pin-${phase}-portal.html`)))])));
await writeFile(resolve(source, "thread-pin-fixture.json"), JSON.stringify({
  sourceTag: "v0.0.42", sourceCommit: "719a76ca1dbf5490f1aa33ffb9966301e02be9a9",
  releaseSha256: "f504e931ee4406bfe76754147cb0e2a0f300d75c6c505a0e174a1e79f65ceea3",
  sourceHashes, viewport: { width: 1200, height: 659 }, fps, frames, phases, events,
  targetThread, beforeOrder, afterOrder, menuBox, motion, sourceDomHashes, portalHashes,
  referenceSha256: hash(await readFile(reference)),
}, null, 2) + "\n");
console.log(`Captured ${frames} native v0.0.42 Pin frames; sidebar menu x=${menuBox.x.toFixed(1)} and persisted pin passed.`);
