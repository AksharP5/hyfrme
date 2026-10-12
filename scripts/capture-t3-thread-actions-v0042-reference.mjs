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
const work = resolve(root, `.work/t3-thread-actions-v0042-${theme}-reference`);
const serverLog = resolve(root, ".work/t3-v0042-actions-server.log");
const reference = resolve(root, `parity/t3-thread-actions-v0042${theme === "light" ? "-light" : ""}-reference.mkv`);
const browserPath = process.env.HYFRME_CHROMIUM;
if (!browserPath) throw new Error("Set HYFRME_CHROMIUM to pinned Chrome");
const pairingUrl = (await readFile(serverLog, "utf8")).match(/Pairing URL: (\S+)/)?.[1];
if (!pairingUrl) throw new Error("Start the isolated Thread Actions fixture server");
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
const events = { open: 30, submenu: 60, close: 90 };
const phases = ["before", "menu", "snooze", "after"];
const targetThread = "Build a logo intro";
const browser = await chromium.launch({ executablePath: browserPath, headless: true, args: [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
  "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
] });
let menuBox;
let submenuBox;
let rowBox;
let menuLabels;
let snoozeLabels;
const transitions = {};
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
  const menu = page.locator('.dropdown-glass[data-level="0"]');
  const submenu = page.locator('.dropdown-glass[data-level="1"]');
  const saveRoot = async (phase) => {
    const dom = (await page.locator("#root").evaluate((element) => element.innerHTML))
      .replaceAll(resolve(root, ".work/t3-v0042-actions-project"), "hyfrme-project")
      .replaceAll(resolve(root, ".work/t3-v0042-pin-project"), "hyfrme-project")
      .replaceAll(root, "hyfrme-project");
    if (/\/home\/|auth[_-]?token|session[_-]?token|127\.0\.0\.1:3917/i.test(dom)) throw new Error(`Private data in ${phase} DOM`);
    await writeFile(resolve(source, `thread-actions-${theme}-${phase}.html`), dom);
  };
  const savePortal = async (phase) => {
    const html = await page.locator('.dropdown-glass[data-level]').evaluateAll((menus) => menus.map((element) => element.outerHTML).join(""));
    if (/\/home\/|auth[_-]?token|session[_-]?token/i.test(html)) throw new Error(`Private data in ${phase} portal`);
    await writeFile(resolve(source, `thread-actions-${theme}-${phase}-portal.html`), html);
  };
  const pauseTransitions = async (phase) => {
    transitions[phase] = await page.evaluate((name) => {
      window.__threadActionAnimations ??= {};
      const animations = document.getAnimations().filter((animation) => {
        const target = animation.effect?.target;
        return target instanceof Element && target.closest('.dropdown-glass, [data-thread-item="true"]');
      });
      window.__threadActionAnimations[name] = animations;
      return animations.map((animation) => {
        const timing = animation.effect?.getComputedTiming();
        const target = animation.effect?.target;
        const record = {
          target: target?.getAttribute?.("class")?.slice(0, 140),
          row: target?.closest?.('[data-thread-item="true"]')?.querySelector?.('[data-testid="sidebar-row-card"]')?.textContent?.trim().slice(0, 100) ?? null,
          label: target?.closest?.("button")?.innerText?.trim() ?? null,
          menuLevel: target?.closest?.("[data-level]")?.getAttribute("data-level") ?? null,
          durationMs: timing?.duration,
          easing: animation.effect?.getTiming().easing,
          keyframes: animation.effect?.getKeyframes(),
        };
        animation.pause();
        animation.currentTime = 0;
        return record;
      });
    }, phase);
  };
  await saveRoot("before");
  for (let frame = 0; frame < frames; frame++) {
    if (frame === events.open) {
      await row.click({ button: "right" });
      await menu.waitFor();
      menuLabels = await menu.locator("button").allInnerTexts();
      for (const label of ["Pin thread", "Settle thread", "Snooze", "Rename thread", "Project settings", "Archive thread"]) {
        if (!menuLabels.includes(label)) throw new Error(`Native row menu lacks ${label}`);
      }
      rowBox = await row.boundingBox();
      menuBox = await menu.boundingBox();
      if (!rowBox || !menuBox || menuBox.x > rowBox.x + rowBox.width + 30 || menuBox.y < rowBox.y - 30) throw new Error("Menu is detached from its row");
      await saveRoot("menu");
      await savePortal("menu");
      await pauseTransitions("open");
    }
    if (frame === events.submenu) {
      await menu.getByRole("button", { name: "Snooze", exact: true }).hover();
      await submenu.waitFor();
      snoozeLabels = await submenu.locator("button").allInnerTexts();
      if (!snoozeLabels.some((label) => label.startsWith("Custom"))) throw new Error("Native custom Snooze option missing");
      submenuBox = await submenu.boundingBox();
      await saveRoot("snooze");
      await savePortal("snooze");
      await pauseTransitions("submenu");
    }
    if (frame === events.close) {
      await page.mouse.click(800, 350);
      await menu.waitFor({ state: "detached" });
      await page.waitForFunction(() => !document.querySelector('[data-testid="sidebar-row-card"][data-popup-open]'), null, { timeout: 1500 });
      await page.waitForTimeout(200);
      await saveRoot("after");
      await pauseTransitions("close");
    }
    for (const [name, start] of Object.entries(events)) {
      if (frame >= start && frame < start + 5) {
        await page.evaluate(({ name, ms }) => {
          for (const animation of window.__threadActionAnimations?.[name] ?? []) animation.currentTime = ms;
        }, { name, ms: (frame - start) * 1000 / fps });
      }
      if (frame === start + 5) {
        await page.evaluate((name) => {
          for (const animation of window.__threadActionAnimations?.[name] ?? []) animation.cancel();
        }, name);
      }
    }
    await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
} catch (error) {
  throw new Error(String(error).replaceAll(pairingUrl, "[pairing URL redacted]"));
} finally {
  await browser.close();
}
const encoded = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps), "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
if (encoded.status !== 0) throw new Error(encoded.stderr);
const sourceDomHashes = Object.fromEntries(await Promise.all(phases.map(async (phase) => [phase, hash(await readFile(resolve(source, `thread-actions-${theme}-${phase}.html`)))])));
const portalHashes = Object.fromEntries(await Promise.all(["menu", "snooze"].map(async (phase) => [phase, hash(await readFile(resolve(source, `thread-actions-${theme}-${phase}-portal.html`)))])));
await writeFile(resolve(source, `thread-actions-${theme}-fixture.json`), JSON.stringify({
  sourceTag: "v0.0.42", sourceCommit: "719a76ca1dbf5490f1aa33ffb9966301e02be9a9",
  releaseSha256: "f504e931ee4406bfe76754147cb0e2a0f300d75c6c505a0e174a1e79f65ceea3",
  sourceHashes, viewport: { width: 1200, height: 659 }, fps, frames, phases, events, theme, targetThread,
  provenance: {
    app: "official desktop T3 Code v0.0.42 binary and bundled client",
    interaction: "live native sidebar row right-click, Snooze hover, and blank-workspace click to close",
    data: "seeded local Hyfrme project and conversation; provider unavailable",
    clock: "2026-09-25T11:30:00Z",
    pointerTarget: "sidebar-row-card for Build a logo intro",
  },
  rowBox, menuBox, submenuBox, menuLabels, snoozeLabels, transitions, sourceDomHashes, portalHashes,
  referenceSha256: hash(await readFile(reference)),
}, null, 2) + "\n");
console.log(`Captured ${frames} native v0.0.42 Thread Actions ${theme} frames with row menu and Snooze submenu.`);
