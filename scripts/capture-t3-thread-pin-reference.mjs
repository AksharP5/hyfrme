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
const phases = ["before", "selected", "menu", "pinned", "pinned-menu"];
const events = { select: 20, menu: 40, pinned: 65, pinnedMenu: 95 };
const targetThread = "Catalog motion audit";
const work = resolve(root, ".work/t3-thread-pin-reference");
const reference = resolve(root, "parity/t3-thread-pin-reference.mkv");
const project = resolve(root, ".work/t3-thread-pin-project");
await mkdir(work, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true, args: [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
  "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
] });
let orderBefore;
let orderAfter;
try {
  const page = await browser.newPage({ viewport: base.viewport, deviceScaleFactor: 1, colorScheme: "dark" });
  await page.clock.setFixedTime(new Date());
  await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  await page.getByText("Build a logo intro", { exact: true }).click();
  await page.waitForURL(/hyfrme-fixture-logo-intro/);
  await page.waitForTimeout(900);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(800, 50);
  await page.waitForTimeout(350);
  const rowOrder = () => page.locator('[data-testid="sidebar-row-card"]').evaluateAll((rows) =>
    rows.map((row) => row.querySelector('div.mt-1 span')?.textContent?.trim()));
  const saveRoot = async (phase) => {
    const html = (await page.locator("#root").evaluate((element) => element.innerHTML))
      .replaceAll(project, "hyfrme-project")
      .replaceAll("/tmp/hyfrme-t3-demo/registry/blocks/", "registry/blocks/");
    if (/\/home\/|\/tmp\/hyfrme-t3|127\.0\.0\.1:38\d\d|auth[_-]?token|session[_-]?token/i.test(html)) {
      throw new Error(`Private fixture content in ${phase} DOM`);
    }
    await writeFile(resolve(source, `thread-pin-${phase}.html`), html);
  };
  const saveMenu = async (phase) => {
    const html = await page.locator('.dropdown-glass[data-level="0"]').evaluate((menu) => menu.outerHTML);
    if (/\/home\/|\/tmp\/hyfrme-t3|auth[_-]?token|session[_-]?token/i.test(html)) throw new Error(`Private menu content in ${phase}`);
    await writeFile(resolve(source, `thread-pin-${phase}-portal.html`), html);
  };
  orderBefore = await rowOrder();
  await saveRoot("before");
  for (let frame = 0; frame < frames; frame++) {
    if (frame === events.select) {
      await page.getByText(targetThread, { exact: true }).click();
      await page.waitForURL(/hyfrme-fixture-catalog-audit/);
      await page.mouse.move(800, 50);
      await page.waitForTimeout(450);
      await saveRoot("selected");
    }
    if (frame === events.menu) {
      await page.getByRole("button", { name: `Thread actions for ${targetThread}` }).click();
      const menu = page.locator('.dropdown-glass[data-level="0"]');
      await menu.waitFor();
      if (!(await menu.locator("button").allInnerTexts()).includes("Pin thread")) throw new Error("Native action menu lacks Pin thread");
      await page.mouse.move(800, 80);
      await page.waitForTimeout(450);
      await saveRoot("menu");
      await saveMenu("menu");
    }
    if (frame === events.pinned) {
      await page.locator('.dropdown-glass[data-level="0"] button').filter({ hasText: /^Pin thread$/ }).click();
      await page.getByRole("button", { name: `Thread actions for ${targetThread}` }).waitFor();
      await page.locator('[data-testid="sidebar-row-card"] [aria-label="Unpin thread"]').waitFor({ timeout: 12000 });
      await page.mouse.move(800, 50);
      await page.waitForTimeout(700);
      orderAfter = await rowOrder();
      await saveRoot("pinned");
    }
    if (frame === events.pinnedMenu) {
      await page.getByRole("button", { name: `Thread actions for ${targetThread}` }).click();
      const menu = page.locator('.dropdown-glass[data-level="0"]');
      await menu.waitFor();
      if (!(await menu.locator("button").allInnerTexts()).includes("Unpin thread")) throw new Error("Native pin did not switch menu to Unpin thread");
      await page.mouse.move(800, 80);
      await page.waitForTimeout(450);
      await saveRoot("pinned-menu");
      await saveMenu("pinned-menu");
    }
    await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
} finally { await browser.close(); }
if (orderBefore?.[0] === targetThread || orderAfter?.[0] !== targetThread) {
  throw new Error(`Native pin did not move ${targetThread} from active list to top: ${JSON.stringify({ orderBefore, orderAfter })}`);
}
const pinnedAt = spawnSync("sqlite3", [resolve(root, ".work/t3-thread-pin-fixture/userdata/state.sqlite"),
  `select pinned_at from projection_threads where title='${targetThread}';`], { encoding: "utf8" });
if (pinnedAt.status !== 0 || !pinnedAt.stdout.trim()) throw new Error("T3 server did not persist the pinned thread");
const encoded = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
if (encoded.status !== 0) throw new Error(encoded.stderr);
const sourceDomHashes = Object.fromEntries(await Promise.all(phases.map(async (phase) =>
  [phase, hash(await readFile(resolve(source, `thread-pin-${phase}.html`)))])));
const portalHashes = Object.fromEntries(await Promise.all(["menu", "pinned-menu"].map(async (phase) =>
  [phase, hash(await readFile(resolve(source, `thread-pin-${phase}-portal.html`)))])));
await writeFile(resolve(source, "thread-pin-fixture.json"), `${JSON.stringify({
  sourceTag: base.sourceTag, sourceCommit: base.sourceCommit, sourceHashes: base.sourceHashes,
  viewport: base.viewport, fps, frames, phases, events, targetThread, orderBefore, orderAfter,
  sourceDomHashes, portalHashes, referenceSha256: hash(await readFile(reference)),
}, null, 2)}\n`);
console.log(`Captured ${frames} native T3 Code Thread Pin frames; ${targetThread} moved to top and persisted.`);
