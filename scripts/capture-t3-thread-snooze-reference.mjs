import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.35");
const base = JSON.parse(await readFile(resolve(source, "brief-fixture.json"), "utf8"));
const url = process.env.T3_REFERENCE_URL;
const serverLog = process.env.T3_SERVER_LOG;
const executablePath = process.env.HYFRME_CHROMIUM;
if (!url || !serverLog || !executablePath) throw new Error("Set isolated T3 URL, server log, and HyperFrames Chromium path.");
const pairingUrl = (await readFile(serverLog, "utf8")).match(/Pairing URL: (\S+)/)?.[1];
if (!pairingUrl || new URL(pairingUrl).origin !== new URL(url).origin) throw new Error("Missing or mismatched T3 pairing URL");
const browserVersion = spawnSync(executablePath, ["--version"], { encoding: "utf8" });
if (browserVersion.status !== 0 || browserVersion.stdout.trim() !== "Google Chrome for Testing 152.0.7977.30") {
  throw new Error(`Unexpected Chromium version: ${browserVersion.stdout.trim()}`);
}
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
for (const [path, expected] of [
  ["/", base.sourceHashes.index],
  ["/assets/index-DSuALXPn.css", base.sourceHashes.css],
  ["/assets/index-CI6tzIRc.js", base.sourceHashes.js],
]) {
  const response = await fetch(new URL(path, url));
  if (!response.ok || hash(Buffer.from(await response.arrayBuffer())) !== expected) {
    throw new Error(`${path} differs from pinned T3 Code v0.0.35`);
  }
}

const frames = 120;
const fps = 30;
const phases = ["selected", "menu", "submenu", "snoozed-toast", "expanded", "wake-menu"];
const events = { menu: 20, submenu: 40, snoozed: 60, expanded: 85, wakeMenu: 100 };
const targetThread = "Catalog motion audit";
const work = resolve(root, ".work/t3-thread-snooze-reference");
const reference = resolve(root, "parity/t3-thread-snooze-reference.mkv");
const project = resolve(root, ".work/t3-thread-snooze-project");
await mkdir(work, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true, args: [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
  "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
] });
let presetLabel;
let orderBefore;
let orderAfter;
try {
  const page = await browser.newPage({ viewport: base.viewport, deviceScaleFactor: 1, colorScheme: "dark" });
  await page.clock.setFixedTime(new Date());
  await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  await page.getByText(targetThread, { exact: true }).click();
  await page.waitForURL(/hyfrme-fixture-catalog-audit/);
  await page.waitForTimeout(2200);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(800, 50);
  await page.waitForTimeout(500);
  if (await page.getByText(/Updates Available/).isVisible().catch(() => false)) {
    throw new Error("Native update toast remained visible after initial cleanup");
  }
  const rowOrder = () => page.locator('[data-testid="sidebar-row-card"]').evaluateAll((rows) =>
    rows.map((row) => row.querySelector('div.mt-1 span')?.textContent?.trim()));
  const clean = (html) => html.replaceAll(project, "hyfrme-project")
    .replaceAll("/tmp/hyfrme-t3-demo/registry/blocks/", "registry/blocks/");
  const save = async (phase) => {
    const html = clean(await page.locator("#root").evaluate((element) => element.innerHTML));
    if (/\/home\/|\/tmp\/hyfrme-t3|127\.0\.0\.1:38\d\d|auth[_-]?token|session[_-]?token/i.test(html)) {
      throw new Error(`Private fixture content in ${phase} DOM`);
    }
    await writeFile(resolve(source, `thread-snooze-${phase}.html`), html);
  };
  const savePortal = async (phase, selector) => {
    const html = clean(await page.locator(selector).evaluate((element) => element.outerHTML));
    if (/\/home\/|\/tmp\/hyfrme-t3|auth[_-]?token|session[_-]?token/i.test(html)) {
      throw new Error(`Private fixture content in ${phase} portal`);
    }
    await writeFile(resolve(source, `thread-snooze-${phase}-portal.html`), html);
  };
  orderBefore = await rowOrder();
  await save("selected");
  for (let frame = 0; frame < frames; frame++) {
    if (frame === events.menu) {
      await page.getByRole("button", { name: `Thread actions for ${targetThread}` }).click();
      await page.locator('.dropdown-glass[data-level="0"]').waitFor();
      await page.mouse.move(800, 80);
      await page.waitForTimeout(300);
      await save("menu");
      await savePortal("menu", '.dropdown-glass[data-level="0"]');
    }
    if (frame === events.submenu) {
      await page.locator('.dropdown-glass[data-level="0"] button').filter({ hasText: /^Snooze$/ }).hover();
      await page.locator('.dropdown-glass[data-level="1"]').waitFor();
      const presets = await page.locator('.dropdown-glass[data-level="1"] button').allInnerTexts();
      presetLabel = presets.find((label) => label.startsWith("In 3 hours"));
      if (!presetLabel) throw new Error(`Native Snooze submenu lacks three-hour preset: ${presets}`);
      await page.mouse.move(800, 80);
      await page.waitForTimeout(300);
      await save("submenu");
      await savePortal("submenu", '.dropdown-glass[data-level="0"]');
      await savePortal("preset", '.dropdown-glass[data-level="1"]');
    }
    if (frame === events.snoozed) {
      await page.locator('.dropdown-glass[data-level="1"] button').filter({ hasText: /^In 3 hours/ }).click();
      await page.locator('[data-testid="sidebar-snoozed-shelf-toggle"]').waitFor({ timeout: 12000 });
      await page.getByText(/^Snoozed until /).waitFor({ timeout: 12000 });
      await page.mouse.move(800, 50);
      await page.waitForTimeout(350);
      orderAfter = await rowOrder();
      await save("snoozed-toast");
      const toastTitle = page.getByText(/^Snoozed until /).first();
      const toast = await toastTitle.evaluate((element) => {
        let current = element;
        while (current.parentElement && current.parentElement !== document.body && current.parentElement.id !== "root") {
          current = current.parentElement;
        }
        return current.outerHTML;
      });
      await writeFile(resolve(source, "thread-snooze-toast-portal.html"), clean(toast));
    }
    if (frame === events.expanded) {
      await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
      const shelf = page.locator('[data-testid="sidebar-snoozed-shelf-toggle"]');
      if (await shelf.getAttribute("aria-expanded") !== "true") await shelf.click();
      await page.locator('button[aria-label="Wake thread now"]').waitFor({ timeout: 12000 });
      await page.mouse.move(800, 50);
      await page.waitForTimeout(350);
      await save("expanded");
    }
    if (frame === events.wakeMenu) {
      await page.getByRole("button", { name: `Thread actions for ${targetThread}` }).click();
      const menu = page.locator('.dropdown-glass[data-level="0"]');
      await menu.waitFor();
      if (!(await menu.locator("button").allInnerTexts()).includes("Wake thread")) throw new Error("Native Snooze did not expose Wake thread");
      await page.mouse.move(800, 80);
      await page.waitForTimeout(350);
      await save("wake-menu");
      await savePortal("wake-menu", '.dropdown-glass[data-level="0"]');
    }
    await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
} finally { await browser.close(); }
if (!orderBefore.includes(targetThread) || orderAfter.includes(targetThread)) {
  throw new Error(`Native Snooze did not move ${targetThread} out of active rows: ${JSON.stringify({ orderBefore, orderAfter })}`);
}
const snoozedUntil = spawnSync("sqlite3", [resolve(root, ".work/t3-thread-snooze-fixture/userdata/state.sqlite"),
  `select snoozed_until from projection_threads where title='${targetThread}';`], { encoding: "utf8" });
if (snoozedUntil.status !== 0 || !snoozedUntil.stdout.trim() || Date.parse(snoozedUntil.stdout.trim()) <= Date.now()) {
  throw new Error("T3 server did not persist a future Snooze time");
}
const encoded = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
if (encoded.status !== 0) throw new Error(encoded.stderr);
const sourceDomHashes = Object.fromEntries(await Promise.all(phases.map(async (phase) =>
  [phase, hash(await readFile(resolve(source, `thread-snooze-${phase}.html`)))])));
const portalPhases = ["menu", "submenu", "preset", "toast", "wake-menu"];
const portalHashes = Object.fromEntries(await Promise.all(portalPhases.map(async (phase) =>
  [phase, hash(await readFile(resolve(source, `thread-snooze-${phase}-portal.html`)))])));
await writeFile(resolve(source, "thread-snooze-fixture.json"), `${JSON.stringify({
  sourceTag: base.sourceTag, sourceCommit: base.sourceCommit, sourceHashes: base.sourceHashes,
  viewport: base.viewport, fps, frames, phases, events, targetThread, presetLabel,
  orderBefore, orderAfter, snoozedUntil: snoozedUntil.stdout.trim(),
  sourceDomHashes, portalHashes, referenceSha256: hash(await readFile(reference)),
}, null, 2)}\n`);
console.log(`Captured ${frames} native T3 Snooze frames; ${targetThread} moved to Snoozed and persisted.`);
