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
if (!url || !serverLog || !executablePath) throw new Error("Set isolated T3 URL, server log, and Chromium path.");
const pairingUrl = (await readFile(serverLog, "utf8")).match(/Pairing URL: (\S+)/)?.[1];
if (!pairingUrl || new URL(pairingUrl).origin !== new URL(url).origin) throw new Error("Missing or mismatched pairing URL");
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
const browserVersion = spawnSync(executablePath, ["--version"], { encoding: "utf8" });
if (browserVersion.status !== 0 || browserVersion.stdout.trim() !== "Google Chrome for Testing 152.0.7977.30") {
  throw new Error(`Unexpected Chromium version: ${browserVersion.stdout.trim()}`);
}

const targetThread = "Catalog motion audit";
const project = resolve(root, ".work/t3-thread-snooze-undo-project");
const oldProject = resolve(root, ".work/t3-thread-snooze-project");
const database = resolve(root, ".work/t3-thread-snooze-undo-fixture/userdata/state.sqlite");
const work = resolve(root, ".work/t3-thread-snooze-undo-reference");
const reference = resolve(root, "parity/t3-thread-snooze-undo-reference.mkv");
const phases = ["selected", "menu", "submenu", "toast", "undone", "persisted"];
const events = { menu: 20, submenu: 40, snoozed: 60, undone: 78, persisted: 100 };
const frames = 120;
const fps = 30;
await mkdir(work, { recursive: true });
const dbValue = () => {
  const result = spawnSync("sqlite3", [database,
    `select coalesce(snoozed_until, ''), coalesce(snoozed_at, '') from projection_threads where title='${targetThread}';`],
    { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout.trim();
};
if (dbValue() !== "|") throw new Error("Isolated fixture target is not active before capture");

const browser = await chromium.launch({ executablePath, headless: true, args: [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
  "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
] });
let orderBefore;
let orderSnoozed;
let orderUndone;
let orderPersisted;
let snoozedValue;
let toastTitle;
try {
  const page = await browser.newPage({ viewport: base.viewport, deviceScaleFactor: 1, colorScheme: "dark" });
  await page.clock.setFixedTime(new Date());
  await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  await page.getByText(targetThread, { exact: true }).first().click();
  await page.waitForURL(/hyfrme-fixture-catalog-audit/);
  await page.waitForTimeout(1800);
  const updateToast = page.getByText(/^Updates Available/).first();
  if (await updateToast.isVisible().catch(() => false)) {
    const dismissed = await updateToast.evaluate((title) => {
      let parent = title.parentElement;
      while (parent && parent !== document.body) {
        const close = parent.querySelector('button[data-slot="toast-close"][aria-label="Dismiss notification"]');
        if (close) { close.click(); return true; }
        parent = parent.parentElement;
      }
      return false;
    });
    if (!dismissed) throw new Error("Native provider-update toast has no Dismiss notification action");
    await page.waitForFunction(() => {
      try {
        const value = JSON.parse(localStorage.getItem("t3code:provider-update-dismissals:v1") ?? "null");
        return Array.isArray(value?.keys) && value.keys.length > 0;
      } catch { return false; }
    }, null, { timeout: 5000 });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  }
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(800, 50);
  await page.waitForTimeout(500);
  if (await updateToast.isVisible().catch(() => false)) {
    throw new Error("Native update toast remained visible after initial cleanup");
  }
  const rowOrder = () => page.locator('[data-testid="sidebar-row-card"]').evaluateAll((rows) =>
    rows.map((row) => row.querySelector('div.mt-1 span')?.textContent?.trim()));
  const clean = (html) => html.replaceAll(project, "hyfrme-project")
    .replaceAll(oldProject, "hyfrme-project")
    .replaceAll("/tmp/hyfrme-t3-demo/registry/blocks/", "registry/blocks/");
  const save = async (phase) => {
    const html = clean(await page.locator("#root").evaluate((element) => element.innerHTML));
    if (/\/home\/|\/tmp\/hyfrme-t3|127\.0\.0\.1:38\d\d|auth[_-]?token|session[_-]?token/i.test(html)) {
      throw new Error(`Private fixture content in ${phase} DOM`);
    }
    await writeFile(resolve(source, `thread-snooze-undo-${phase}.html`), html);
  };
  const savePortal = async (phase, selector) => {
    const html = clean(await page.locator(selector).evaluate((element) => element.outerHTML));
    if (/\/home\/|\/tmp\/hyfrme-t3|auth[_-]?token|session[_-]?token/i.test(html)) {
      throw new Error(`Private fixture content in ${phase} portal`);
    }
    await writeFile(resolve(source, `thread-snooze-undo-${phase}-portal.html`), html);
  };
  orderBefore = await rowOrder();
  if (!orderBefore.includes(targetThread)) throw new Error("Active thread absent before Snooze");
  await save("selected");
  for (let frame = 0; frame < frames; frame++) {
    if (frame === events.menu) {
      await page.getByRole("button", { name: `Thread actions for ${targetThread}` }).click();
      await page.locator('.dropdown-glass[data-level="0"]').waitFor();
      await page.mouse.move(800, 80);
      await page.waitForTimeout(250);
      await save("menu");
      await savePortal("menu", '.dropdown-glass[data-level="0"]');
    }
    if (frame === events.submenu) {
      await page.locator('.dropdown-glass[data-level="0"] button').filter({ hasText: /^Snooze$/ }).hover();
      await page.locator('.dropdown-glass[data-level="1"]').waitFor();
      const presets = await page.locator('.dropdown-glass[data-level="1"] button').allInnerTexts();
      if (!presets.some((label) => label.startsWith("In 3 hours"))) {
        throw new Error(`Native Snooze submenu lacks three-hour preset: ${presets}`);
      }
      await page.mouse.move(800, 80);
      await page.waitForTimeout(250);
      await save("submenu");
      await savePortal("submenu", '.dropdown-glass[data-level="0"]');
      await savePortal("preset", '.dropdown-glass[data-level="1"]');
    }
    if (frame === events.snoozed) {
      await page.locator('.dropdown-glass[data-level="1"] button').filter({ hasText: /^In 3 hours/ }).click();
      await page.locator('[data-testid="sidebar-snoozed-shelf-toggle"]').waitFor({ timeout: 12000 });
      const toast = page.getByText(/^Snoozed until /).first();
      await toast.waitFor({ timeout: 12000 });
      await page.getByRole("button", { name: "Undo", exact: true }).waitFor({ timeout: 5000 });
      toastTitle = await toast.innerText();
      await page.waitForFunction((title) => ![...document.querySelectorAll('[data-testid="sidebar-row-card"]')]
        .some((row) => row.querySelector('div.mt-1 span')?.textContent?.trim() === title),
      targetThread, { timeout: 12000 });
      orderSnoozed = await rowOrder();
      snoozedValue = dbValue();
      if (orderSnoozed.includes(targetThread) || !snoozedValue.split("|")[0] ||
          Date.parse(snoozedValue.split("|")[0]) <= Date.now()) {
        throw new Error(`Native Snooze did not persist or hide the row: ${JSON.stringify({ orderSnoozed, snoozedValue })}`);
      }
      await page.mouse.move(800, 50);
      await page.waitForTimeout(550);
      await save("toast");
      const toastPortal = await toast.evaluate((element) => {
        let current = element;
        while (current.parentElement && current.parentElement !== document.body && current.parentElement.id !== "root") {
          current = current.parentElement;
        }
        return current.outerHTML;
      });
      await writeFile(resolve(source, "thread-snooze-undo-toast-portal.html"), clean(toastPortal));
    }
    if (frame === events.undone) {
      await page.getByRole("button", { name: "Undo", exact: true }).click({ timeout: 3000 });
      await page.locator('[data-testid="sidebar-row-card"]').filter({ hasText: targetThread }).waitFor({ timeout: 12000 });
      for (let attempt = 0; attempt < 50 && dbValue() !== "|"; attempt++) await page.waitForTimeout(50);
      orderUndone = await rowOrder();
      if (dbValue() !== "|" || !orderUndone.includes(targetThread)) {
        throw new Error(`Native Undo did not restore the row and clear Snooze: ${JSON.stringify({ orderUndone, db: dbValue() })}`);
      }
      await page.mouse.move(800, 50);
      await page.waitForTimeout(550);
      await save("undone");
    }
    if (frame === events.persisted) {
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
      await page.waitForTimeout(350);
      orderPersisted = await rowOrder();
      if (dbValue() !== "|" || !orderPersisted.includes(targetThread)) {
        throw new Error(`Undo did not survive reload: ${JSON.stringify({ orderPersisted, db: dbValue() })}`);
      }
      await page.mouse.move(800, 50);
      await save("persisted");
    }
    await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
} finally { await browser.close(); }

if (!orderBefore?.includes(targetThread) || orderSnoozed?.includes(targetThread) ||
    !orderUndone?.includes(targetThread) || !orderPersisted?.includes(targetThread) || dbValue() !== "|") {
  throw new Error("Native Snooze→Undo persistence assertions did not complete");
}
const encoded = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
if (encoded.status !== 0) throw new Error(encoded.stderr);
const sourceDomHashes = Object.fromEntries(await Promise.all(phases.map(async (phase) =>
  [phase, hash(await readFile(resolve(source, `thread-snooze-undo-${phase}.html`)))])));
const portalPhases = ["menu", "submenu", "preset", "toast"];
const portalHashes = Object.fromEntries(await Promise.all(portalPhases.map(async (phase) =>
  [phase, hash(await readFile(resolve(source, `thread-snooze-undo-${phase}-portal.html`)))])));
await writeFile(resolve(source, "thread-snooze-undo-fixture.json"), `${JSON.stringify({
  sourceTag: base.sourceTag, sourceCommit: base.sourceCommit, sourceHashes: base.sourceHashes,
  captureBrowser: { version: browserVersion.stdout.trim(), flags: [
    "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
    "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
  ] },
  viewport: base.viewport, fps, frames, phases, events, targetThread, toastTitle,
  orderBefore, orderSnoozed, orderUndone, orderPersisted, snoozedValue,
  sourceDomHashes, portalHashes, referenceSha256: hash(await readFile(reference)),
}, null, 2)}\n`);
console.log(`Captured ${frames} real T3 Snooze→Undo frames; SQLite and reload restore ${targetThread}.`);
