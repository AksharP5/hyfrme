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
const project = resolve(root, ".work/t3-thread-wake-project");
const database = resolve(root, ".work/t3-thread-wake-fixture/userdata/state.sqlite");
const frames = 120;
const fps = 30;
const events = { expanded: 25, menu: 50, woke: 75 };
const phases = ["collapsed", "expanded", "menu", "woke"];
const work = resolve(root, ".work/t3-thread-wake-reference");
const reference = resolve(root, "parity/t3-thread-wake-reference.mkv");
await mkdir(work, { recursive: true });
const dbValue = () => spawnSync("sqlite3", [database,
  `select coalesce(snoozed_until, ''), coalesce(snoozed_at, '') from projection_threads where title='${targetThread}';`],
  { encoding: "utf8" }).stdout.trim();
const before = dbValue();
if (!before.split("|")[0] || Date.parse(before.split("|")[0]) <= Date.now()) {
  throw new Error(`Isolated fixture lacks a future Snooze state: ${before}`);
}

const browser = await chromium.launch({ executablePath, headless: true, args: [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
  "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
] });
let orderBefore;
let orderAfter;
let portalHtml;
try {
  const page = await browser.newPage({ viewport: base.viewport, deviceScaleFactor: 1, colorScheme: "dark" });
  await page.clock.setFixedTime(new Date());
  await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  await page.waitForTimeout(1700);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  const shelf = page.locator('[data-testid="sidebar-snoozed-shelf-toggle"]');
  await shelf.waitFor({ timeout: 12000 });
  if (await shelf.getAttribute("aria-expanded") !== "true") await shelf.click();
  await page.getByText(targetThread, { exact: true }).first().click();
  await page.waitForURL(/hyfrme-fixture-catalog-audit/);
  await page.waitForTimeout(450);
  if (await shelf.getAttribute("aria-expanded") === "true") await shelf.click();
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(800, 50);
  await page.waitForTimeout(350);
  const rowOrder = () => page.locator('[data-testid="sidebar-row-card"]').evaluateAll((rows) =>
    rows.map((row) => row.querySelector('div.mt-1 span')?.textContent?.trim()));
  const clean = (html) => html.replaceAll(project, "hyfrme-project")
    .replaceAll("/tmp/hyfrme-t3-demo/registry/blocks/", "registry/blocks/");
  const save = async (phase) => {
    const html = clean(await page.locator("#root").evaluate((element) => element.innerHTML));
    if (/\/home\/|\/tmp\/hyfrme-t3|127\.0\.0\.1:38\d\d|auth[_-]?token|session[_-]?token/i.test(html)) {
      throw new Error(`Private fixture content in ${phase} DOM`);
    }
    await writeFile(resolve(source, `thread-wake-${phase}.html`), html);
  };
  orderBefore = await rowOrder();
  if (orderBefore.includes(targetThread)) throw new Error("Snoozed thread already appears in Active rows");
  await save("collapsed");
  for (let frame = 0; frame < frames; frame++) {
    if (frame === events.expanded) {
      await shelf.click();
      await page.locator('button[aria-label="Wake thread now"]').waitFor({ timeout: 12000 });
      await page.mouse.move(800, 50);
      await page.waitForTimeout(300);
      await save("expanded");
    }
    if (frame === events.menu) {
      await page.getByRole("button", { name: `Thread actions for ${targetThread}` }).click();
      const menu = page.locator('.dropdown-glass[data-level="0"]');
      await menu.waitFor();
      if (!(await menu.locator("button").allInnerTexts()).includes("Wake thread")) {
        throw new Error("Native menu lacks Wake thread");
      }
      await page.mouse.move(800, 80);
      await page.waitForTimeout(300);
      await save("menu");
      portalHtml = clean(await menu.evaluate((element) => element.outerHTML));
      await writeFile(resolve(source, "thread-wake-menu-portal.html"), portalHtml);
    }
    if (frame === events.woke) {
      await page.locator('.dropdown-glass[data-level="0"] button').filter({ hasText: /^Wake thread$/ }).click();
      await page.getByText(targetThread, { exact: true }).first().waitFor({ timeout: 12000 });
      await page.waitForTimeout(300);
      await page.mouse.move(800, 80);
      orderAfter = await rowOrder();
      if (!orderAfter.includes(targetThread)) throw new Error(`Wake did not restore Active row: ${orderAfter}`);
      await save("woke");
    }
    await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
} finally { await browser.close(); }
const after = dbValue();
if (after !== "|" || !orderAfter?.includes(targetThread)) {
  throw new Error(`Native Wake did not clear persisted Snooze and restore Active row: ${JSON.stringify({ before, after, orderAfter })}`);
}
const encoded = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
if (encoded.status !== 0) throw new Error(encoded.stderr);
const sourceDomHashes = Object.fromEntries(await Promise.all(phases.map(async (phase) =>
  [phase, hash(await readFile(resolve(source, `thread-wake-${phase}.html`)))])));
await writeFile(resolve(source, "thread-wake-fixture.json"), `${JSON.stringify({
  sourceTag: base.sourceTag, sourceCommit: base.sourceCommit, sourceHashes: base.sourceHashes,
  viewport: base.viewport, fps, frames, phases, events, targetThread,
  orderBefore, orderAfter, snoozedBefore: before, snoozedAfter: after,
  sourceDomHashes, portalHashes: { menu: hash(await readFile(resolve(source, "thread-wake-menu-portal.html"))) },
  referenceSha256: hash(await readFile(reference)),
}, null, 2)}\n`);
console.log(`Captured ${frames} native T3 Wake frames; ${targetThread} returned to Active and persisted.`);
