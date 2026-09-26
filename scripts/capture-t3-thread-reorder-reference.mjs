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
const log = process.env.T3_SERVER_LOG;
const executablePath = process.env.HYFRME_CHROMIUM;
if (!url || !log || !executablePath) throw new Error("Set isolated T3 URL, server log, and Chromium path.");
const pairingUrl = (await readFile(log, "utf8")).match(/Pairing URL: (\S+)/)?.[1];
if (!pairingUrl || new URL(pairingUrl).origin !== new URL(url).origin) throw new Error("Missing isolated pairing URL.");
const version = spawnSync(executablePath, ["--version"], { encoding: "utf8" });
if (version.status !== 0 || version.stdout.trim() !== "Google Chrome for Testing 152.0.7977.30") {
  throw new Error("Unexpected Chromium build for pinned T3 capture.");
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
const phases = ["before", "lifted", "over", "dropped", "persisted"];
const events = { lifted: 25, over: 45, dropped: 65, persisted: 90 };
const movedThread = "Catalog motion audit";
const otherThread = "Build a logo intro";
const project = resolve(root, ".work/t3-thread-pin-project");
const db = resolve(root, ".work/t3-thread-reorder-fixture/userdata/state.sqlite");
const work = resolve(root, ".work/t3-thread-reorder-reference");
const reference = resolve(root, "parity/t3-thread-reorder-reference.mkv");
const flags = [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
  "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
];
const pinnedKeys = () => {
  const result = spawnSync("sqlite3", ["-separator", "|", db,
    "select title,pin_order_key from projection_threads where title in ('Build a logo intro','Catalog motion audit') order by title;"],
  { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`Cannot read isolated T3 pinned order: ${result.stderr}`);
  return Object.fromEntries(result.stdout.trim().split("\n").map((line) => line.split("|")));
};
await mkdir(work, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true, args: flags });
let orderBefore;
let orderAfter;
let keysBefore;
let keysAfter;
const observed = {};
try {
  const context = await browser.newContext({ viewport: base.viewport, deviceScaleFactor: 1, colorScheme: "dark" });
  const page = await context.newPage();
  await page.clock.setFixedTime(new Date());
  await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  await context.storageState({ path: resolve(root, ".work/t3-thread-reorder-fixture/playwright-state.json") });
  await page.getByText(otherThread, { exact: true }).click();
  await page.waitForURL(/hyfrme-fixture-logo-intro/);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(800, 50);
  await page.waitForTimeout(500);

  await page.getByRole("button", { name: `Thread actions for ${otherThread}` }).click();
  const menu = page.locator('.dropdown-glass[data-level="0"]');
  await menu.waitFor();
  await menu.locator("button").filter({ hasText: /^Pin thread$/ }).click();
  const pinnedList = page.getByRole("list", { name: "Pinned threads" });
  const rows = pinnedList.locator('[data-testid="sidebar-row-card"]');
  await rows.filter({ hasText: otherThread }).waitFor();
  await rows.filter({ hasText: movedThread }).waitFor();
  const rowOrder = () => rows.evaluateAll((cards) => cards.map((card) => card.querySelector('div.mt-1 span')?.textContent?.trim()));
  await page.waitForTimeout(600);
  orderBefore = await rowOrder();
  keysBefore = pinnedKeys();
  if (orderBefore.join("|") !== `${otherThread}|${movedThread}`) {
    throw new Error(`Expected two real pinned threads before drag; got ${JSON.stringify(orderBefore)}`);
  }
  const saveRoot = async (phase) => {
    const html = (await page.locator("#root").evaluate((element) => element.innerHTML))
      .replaceAll(project, "hyfrme-project")
      .replaceAll("/tmp/hyfrme-t3-demo/registry/blocks/", "registry/blocks/");
    if (/\/home\/|\/tmp\/hyfrme-t3|127\.0\.0\.1:38\d\d|auth[_-]?token|session[_-]?token/i.test(html)) {
      throw new Error(`Private fixture content in ${phase} root`);
    }
    await writeFile(resolve(source, `thread-reorder-${phase}.html`), html);
    observed[phase] = {
      order: await rowOrder(),
      cardStyles: await rows.evaluateAll((cards) => cards.map((card) => ({
        title: card.querySelector('div.mt-1 span')?.textContent?.trim(),
        transform: card.parentElement?.getAttribute("style") ?? "",
      }))),
    };
  };
  await saveRoot("before");
  const from = await rows.filter({ hasText: movedThread }).boundingBox();
  const to = await rows.filter({ hasText: otherThread }).boundingBox();
  if (!from || !to) throw new Error("Pinned T3 cards have no drag coordinates.");
  const x = from.x + Math.min(80, from.width / 2);
  const y = from.y + from.height / 2;
  for (let frame = 0; frame < frames; frame++) {
    if (frame === events.lifted) {
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x, y - 12, { steps: 4 });
      await page.waitForTimeout(400);
      await saveRoot("lifted");
    }
    if (frame === events.over) {
      await page.mouse.move(x, to.y + to.height / 2 - 12, { steps: 8 });
      await page.waitForTimeout(450);
      await saveRoot("over");
    }
    if (frame === events.dropped) {
      await page.mouse.up();
      await page.waitForFunction((title) => {
        const row = document.querySelector('[aria-label="Pinned threads"] [data-testid="sidebar-row-card"] div.mt-1 span');
        return row?.textContent?.trim() === title;
      }, movedThread, { timeout: 12000 });
      for (let attempt = 0; attempt < 40; attempt++) {
        keysAfter = pinnedKeys();
        if (keysAfter[movedThread] !== keysBefore[movedThread]) break;
        await page.waitForTimeout(100);
      }
      if (keysAfter?.[movedThread] === keysBefore[movedThread]) throw new Error("T3 did not persist moved pin order key.");
      await page.mouse.move(800, 50);
      await page.waitForTimeout(500);
      orderAfter = await rowOrder();
      await saveRoot("dropped");
    }
    if (frame === events.persisted) {
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 15000 });
      await page.waitForFunction((title) => {
        const row = document.querySelector('[aria-label="Pinned threads"] [data-testid="sidebar-row-card"] div.mt-1 span');
        return row?.textContent?.trim() === title;
      }, movedThread, { timeout: 12000 });
      await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
      await page.mouse.move(800, 50);
      await page.waitForTimeout(550);
      await saveRoot("persisted");
    }
    await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
} finally {
  await browser.close();
}
if (orderAfter?.join("|") !== `${movedThread}|${otherThread}` ||
    observed.persisted?.order.join("|") !== orderAfter.join("|")) {
  throw new Error(`Native pinned drag/reload did not preserve order: ${JSON.stringify({ orderBefore, orderAfter, persisted: observed.persisted?.order })}`);
}
const encoded = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
if (encoded.status !== 0) throw new Error(encoded.stderr);
const sourceDomHashes = Object.fromEntries(await Promise.all(phases.map(async (phase) =>
  [phase, hash(await readFile(resolve(source, `thread-reorder-${phase}.html`)))])));
await writeFile(resolve(source, "thread-reorder-fixture.json"), `${JSON.stringify({
  sourceTag: base.sourceTag, sourceCommit: base.sourceCommit, sourceHashes: base.sourceHashes,
  captureBrowser: { version: version.stdout.trim(), flags }, viewport: base.viewport,
  fps, frames, phases, events, movedThread, otherThread, orderBefore, orderAfter,
  keysBefore, keysAfter, observed, sourceDomHashes, referenceSha256: hash(await readFile(reference)),
}, null, 2)}\n`);
console.log(`Captured ${frames} real pinned-thread drag/reorder frames; key and reloaded order persisted.`);
