import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const theme = process.argv[2];
if (theme !== "dark" && theme !== "light") throw new Error("Pass dark or light");
const release = resolve(root, ".work/t3-v0042-bin/t3-0.0.42-linux-x64");
const source = resolve(root, "assets/t3-code/v0.0.42");
const work = resolve(root, `.work/t3-settle-thread-v0042-${theme}-reference`);
const serverLog = resolve(root, `.work/t3-v0042-settle-${theme}-server.log`);
const reference = resolve(root, `parity/t3-settle-thread-v0042${theme === "light" ? "-light" : ""}-reference.mkv`);
const browserPath = process.env.HYFRME_CHROMIUM;
if (!browserPath) throw new Error("Set HYFRME_CHROMIUM to pinned Chrome");
const pairingUrl = (await readFile(serverLog, "utf8")).match(/Pairing URL: (\S+)/)?.[1];
if (!pairingUrl) throw new Error("Start the isolated Settle Thread fixture server");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const version = spawnSync(resolve(release, "t3"), ["--version"], { encoding: "utf8" });
if (version.status !== 0 || version.stdout.trim() !== "t3 v0.0.42") throw new Error("Wrong T3 release");
const chromeVersion = spawnSync(browserPath, ["--version"], { encoding: "utf8" });
if (chromeVersion.status !== 0 || chromeVersion.stdout.trim() !== "Google Chrome for Testing 152.0.7977.30") throw new Error("Wrong Chrome release");
const releaseFiles = { index: "client/index.html", css: "client/assets/main-x9o7QJ8O.css", js: "client/assets/index-BMH8bO9q.js" };
const sourceHashes = Object.fromEntries(await Promise.all(Object.entries(releaseFiles).map(async ([key, path]) => [key, hash(await readFile(resolve(release, path)))])));
for (const [key, path] of Object.entries(releaseFiles)) {
  const served = await fetch(new URL(`/${path.replace(/^client\//, "")}`, pairingUrl));
  if (!served.ok || hash(Buffer.from(await served.arrayBuffer())) !== sourceHashes[key]) throw new Error(`${key} differs from official T3 release`);
}

const frames = 120;
const fps = 30;
const events = { hover: 25, details: 27, tooltip: 40, settle: 55, expand: 78, collapse: 98 };
const phases = ["before", "hover", "details", "tooltip", "settling", "settled", "expanded", "collapsed", "collapsed-done"];
const targetThread = "Build a logo intro";
const browser = await chromium.launch({ executablePath: browserPath, headless: true, args: [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
  "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
] });
const transitions = {};
const boxes = {};
const state = {};
try {
  await mkdir(source, { recursive: true });
  await mkdir(work, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 659 }, deviceScaleFactor: 1, colorScheme: theme });
  await page.clock.setFixedTime(new Date("2026-09-25T11:30:00Z"));
  await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  const row = page.locator('[data-testid="sidebar-row-card"]').filter({ hasText: targetThread }).first();
  await row.click();
  await page.waitForTimeout(900);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.mouse.move(800, 80);
  await page.waitForTimeout(450);
  const shelf = page.locator('[data-testid="sidebar-settled-shelf-toggle"]');
  const saveState = async (phase) => {
    const dom = (await page.locator("#root").evaluate((element) => element.innerHTML))
      .replaceAll(resolve(root, ".work/t3-v0042-actions-project"), "hyfrme-project")
      .replaceAll(resolve(root, ".work/t3-v0042-pin-project"), "hyfrme-project")
      .replaceAll(root, "hyfrme-project");
    if (/\/home\/|auth[_-]?token|session[_-]?token|127\.0\.0\.1:3918/i.test(dom)) throw new Error(`Private data in ${phase} DOM`);
    await writeFile(resolve(source, `settle-thread-${theme}-${phase}.html`), dom);
    const portal = await page.locator('[data-slot="tooltip-positioner"]').evaluateAll((elements) => elements.map((element) => element.outerHTML).join(""));
    if (/\/home\/|auth[_-]?token|session[_-]?token/i.test(portal)) throw new Error(`Private data in ${phase} portal`);
    await writeFile(resolve(source, `settle-thread-${theme}-${phase}-portal.html`), portal);
    state[phase] = {
      cards: await page.locator('[data-testid="sidebar-row-card"]').allTextContents(),
      slim: await page.locator('[data-testid="sidebar-row-slim"]').allTextContents(),
      shelf: await shelf.allTextContents(),
      selected: await page.locator('[aria-current="page"]').allTextContents(),
      route: new URL(page.url()).pathname,
      tooltipStyle: await page.locator('[data-slot="tooltip-popup"]').evaluateAll((elements) => elements.map((element) => {
        const style = getComputedStyle(element);
        return {
          text: element.textContent?.trim().slice(0, 100),
          transitionProperty: style.transitionProperty,
          transitionDuration: style.transitionDuration,
          opacity: style.opacity,
          scale: style.scale,
          instant: element.hasAttribute('data-instant'),
        };
      })),
    };
  };
  const pauseTransitions = async (phase) => {
    transitions[phase] = await page.evaluate((name) => {
      window.__settleAnimations ??= {};
      const animations = document.getAnimations().filter((animation) => {
        const target = animation.effect?.target;
        if (!(target instanceof Element)) return false;
        const inList = target.closest('ul[role="list"].relative');
        const inShelf = target.closest('[data-testid="sidebar-settled-shelf-toggle"]');
        const inTooltip = target.closest('[data-slot="tooltip-positioner"]');
        if (name === 'details' || name === 'tooltip') return !!inTooltip;
        if (name === 'hover') return !!inList;
        return !!(inList || inShelf || inTooltip);
      });
      window.__settleAnimations[name] = animations;
      return animations.map((animation) => {
        const timing = animation.effect?.getComputedTiming();
        const target = animation.effect?.target;
        const record = {
          target: target?.getAttribute?.("class")?.slice(0, 140),
          slot: target?.getAttribute?.("data-slot") ?? null,
          row: target?.closest?.('[data-thread-item]')?.textContent?.trim().slice(0, 100) ?? null,
          listChildIndex: target?.parentElement?.matches?.('ul[role="list"].relative') ? [...target.parentElement.children].indexOf(target) : null,
          listChildText: target?.parentElement?.matches?.('ul[role="list"].relative') ? target.textContent?.trim().slice(0, 100) : null,
          durationMs: timing?.duration,
          observedTimeMs: animation.currentTime,
          observedProgress: timing?.progress,
          easing: animation.effect?.getTiming().easing,
          keyframes: animation.effect?.getKeyframes(),
        };
        animation.pause();
        animation.currentTime = 0;
        return record;
      });
    }, phase);
  };
  const pauseListAnimationsAtCreation = () => page.evaluate(() => {
    window.__settleListAnimations = [];
    const original = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const animation = original.apply(this, args);
      if (this.parentElement?.matches('ul[role="list"].relative')) {
        animation.pause();
        animation.currentTime = 0;
        window.__settleListAnimations.push(animation);
      }
      return animation;
    };
    window.__restoreSettleAnimate = () => { Element.prototype.animate = original; };
  });
  await saveState("before");
  const beforeRoute = new URL(page.url()).pathname;
  boxes.row = await row.boundingBox();
  for (let frame = 0; frame < frames; frame++) {
    if (frame === events.hover) {
      await row.hover();
      await saveState("hover");
      await pauseTransitions("hover");
    }
    if (frame === events.details) {
      const details = page.locator('[data-slot="tooltip-popup"]').filter({ hasText: targetThread });
      await details.waitFor({ timeout: 5000 });
      boxes.details = await details.boundingBox();
      await saveState("details");
      await pauseTransitions("details");
    }
    if (frame === events.tooltip) {
      await row.getByRole("button", { name: "Settle thread" }).hover();
      await page.locator('[data-slot="tooltip-popup"]').filter({ hasText: "Settle thread" }).waitFor({ timeout: 5000 });
      boxes.tooltip = await page.locator('[data-slot="tooltip-popup"]').filter({ hasText: "Settle thread" }).boundingBox();
      await saveState("tooltip");
      await pauseTransitions("tooltip");
    }
    if (frame === events.settle) {
      await pauseListAnimationsAtCreation();
      await row.getByRole("button", { name: "Settle thread" }).click();
      await page.waitForFunction(() => window.__settleListAnimations?.length > 0, null, { timeout: 5000 });
      await page.waitForURL((url) => url.pathname !== beforeRoute, { timeout: 15000 });
      await saveState("settling");
      await pauseTransitions("settle");
      boxes.shelf = await shelf.boundingBox();
    }
    if (frame === events.settle + 6) {
      await row.waitFor({ state: "detached", timeout: 15000 });
      await page.waitForURL((url) => url.pathname !== beforeRoute, { timeout: 15000 });
      await page.mouse.move(800, 80);
      await page.waitForTimeout(200);
      await saveState("settled");
    }
    if (frame === events.expand) {
      await pauseListAnimationsAtCreation();
      await shelf.click();
      await pauseTransitions("expand");
      await page.locator('[data-testid="sidebar-row-slim"]').filter({ hasText: targetThread }).waitFor({ timeout: 5000 });
      await page.mouse.move(800, 80);
      await saveState("expanded");
      boxes.expandedShelf = await shelf.boundingBox();
      boxes.settledRow = await page.locator('[data-testid="sidebar-row-slim"]').filter({ hasText: targetThread }).boundingBox();
    }
    if (frame === events.collapse) {
      await pauseListAnimationsAtCreation();
      await shelf.click();
      await pauseTransitions("collapse");
      await page.locator('[data-testid="sidebar-row-slim"]').filter({ hasText: targetThread }).waitFor({ state: "detached", timeout: 5000 });
      await page.mouse.move(800, 80);
      await saveState("collapsed");
    }
    if (frame === events.collapse + 6) await saveState("collapsed-done");
    for (const [name, start] of Object.entries(events)) {
      if (frame >= start && frame < start + 5) {
        await page.evaluate(({ name, ms }) => {
          for (const animation of window.__settleAnimations?.[name] ?? []) animation.currentTime = ms;
        }, { name, ms: (frame - start) * 1000 / fps });
      }
      if (frame === start + 5) {
        await page.evaluate((name) => {
          for (const animation of window.__settleAnimations?.[name] ?? []) {
            if (animation.effect?.target?.parentElement?.matches?.('ul[role="list"].relative')) animation.finish();
            else animation.cancel();
          }
          if (name === 'settle' || name === 'expand' || name === 'collapse') window.__restoreSettleAnimate?.();
        }, name);
      }
    }
    await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  await page.locator('[data-testid="sidebar-row-card"]').filter({ hasText: targetThread }).waitFor({ state: "detached", timeout: 10000 });
  await shelf.click();
  await page.locator('[data-testid="sidebar-row-slim"]').filter({ hasText: targetThread }).waitFor({ timeout: 10000 });
  if (new URL(page.url()).pathname !== state.settled.route) throw new Error("Selected next thread did not survive reload");
  state.afterReload = {
    cards: await page.locator('[data-testid="sidebar-row-card"]').allTextContents(),
    slim: await page.locator('[data-testid="sidebar-row-slim"]').allTextContents(),
    shelf: await shelf.allTextContents(),
    route: new URL(page.url()).pathname,
  };
} catch (error) {
  throw new Error(String(error).replaceAll(pairingUrl, "[pairing URL redacted]"));
} finally {
  await browser.close();
}
const encoded = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps), "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
if (encoded.status !== 0) throw new Error(encoded.stderr);
const sourceDomHashes = Object.fromEntries(await Promise.all(phases.map(async (phase) => [phase, hash(await readFile(resolve(source, `settle-thread-${theme}-${phase}.html`)))])));
const portalHashes = Object.fromEntries(await Promise.all(phases.map(async (phase) => [phase, hash(await readFile(resolve(source, `settle-thread-${theme}-${phase}-portal.html`)))])));
await writeFile(resolve(source, `settle-thread-${theme}-fixture.json`), JSON.stringify({
  sourceTag: "v0.0.42", sourceCommit: "719a76ca1dbf5490f1aa33ffb9966301e02be9a9",
  releaseSha256: "f504e931ee4406bfe76754147cb0e2a0f300d75c6c505a0e174a1e79f65ceea3",
  sourceHashes, viewport: { width: 1200, height: 659 }, fps, frames, phases, events, theme, targetThread,
  provenance: {
    app: "official desktop T3 Code v0.0.42 binary and bundled client",
    interaction: "live native sidebar Settle control, shelf expand/collapse, and persisted state after reload",
    data: "seeded local Hyfrme project and conversation; provider unavailable",
    clock: "2026-09-25T11:30:00Z",
  },
  boxes, state, transitions, sourceDomHashes, portalHashes, referenceSha256: hash(await readFile(reference)),
}, null, 2) + "\n");
console.log(`Captured ${frames} native v0.0.42 Settle Thread ${theme} frames with post-reload state verified.`);
