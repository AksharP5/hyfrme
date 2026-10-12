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
if (!url || !serverLog || !executablePath) throw new Error("Set the isolated T3 URL, server log, and Chromium path.");
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
const phases = ["before", "menu", "archived", "archived-list", "unarchived"];
const events = { menu: 25, archive: 50, archivedList: 75, unarchive: 100 };
const targetThread = "Build a logo intro";
const project = resolve(root, ".work/t3-thread-archive-project");
const fixtureDb = resolve(root, ".work/t3-thread-archive-fixture/userdata/state.sqlite");
const work = resolve(root, ".work/t3-thread-archive-reference");
const reference = resolve(root, "parity/t3-thread-archive-reference.mkv");
const flags = [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
  "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
];
await mkdir(work, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true, args: flags });
const recorded = {};
let menuLabels;
let persistedArchivedAt;
try {
  const page = await browser.newPage({ viewport: base.viewport, deviceScaleFactor: 1, colorScheme: "dark" });
  await page.clock.setFixedTime(new Date());
  await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  await page.getByText(targetThread, { exact: true }).click();
  await page.waitForURL(/hyfrme-fixture-logo-intro/);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.mouse.move(800, 50);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  const saveRoot = async (phase) => {
    const html = (await page.locator("#root").evaluate((element) => element.innerHTML))
      .replaceAll(project, "hyfrme-demo")
      .replaceAll("/tmp/hyfrme-t3-demo/registry/blocks/", "registry/blocks/");
    if (/\/home\/|\/tmp\/hyfrme-t3|127\.0\.0\.1:38\d\d|auth[_-]?token|session[_-]?token/i.test(html)) {
      throw new Error(`Private fixture content in ${phase} DOM`);
    }
    await writeFile(resolve(source, `thread-archive-${phase}.html`), html);
    recorded[phase] = {
      title: await page.title(),
      urlPath: new URL(page.url()).pathname,
      sidebarRows: await page.locator('[data-testid="sidebar-row-card"]').evaluateAll((rows) =>
        rows.map((row) => row.querySelector('div.mt-1 span')?.textContent?.trim())),
    };
  };
  await saveRoot("before");
  for (let frame = 0; frame < frames; frame++) {
    if (frame === events.menu) {
      await page.getByRole("button", { name: `Thread actions for ${targetThread}` }).click();
      const menu = page.locator('.dropdown-glass[data-level="0"]');
      await menu.waitFor();
      menuLabels = await menu.locator("button").allInnerTexts();
      if (!menuLabels.includes("Archive thread")) throw new Error("Native T3 menu lacks Archive thread");
      await page.mouse.move(800, 80);
      await page.waitForTimeout(450);
      await saveRoot("menu");
      const portal = await menu.evaluate((node) => node.outerHTML);
      if (/\/home\/|\/tmp\/hyfrme-t3|auth[_-]?token|session[_-]?token/i.test(portal)) throw new Error("Private menu content");
      await writeFile(resolve(source, "thread-archive-menu-portal.html"), portal);
    }
    if (frame === events.archive) {
      await page.locator('.dropdown-glass[data-level="0"] button').filter({ hasText: /^Archive thread$/ }).click();
      if (await page.getByRole("alertdialog").count()) {
        throw new Error("Archive confirmation is enabled; capture its native state before proceeding");
      }
      await page.waitForURL((next) => !next.pathname.includes("hyfrme-fixture-logo-intro"), { timeout: 12000 });
      await page.getByText(targetThread, { exact: true }).waitFor({ state: "detached", timeout: 12000 });
      await page.mouse.move(800, 50);
      await page.waitForTimeout(600);
      const archivedAt = spawnSync("sqlite3", [fixtureDb,
        "select coalesce(archived_at,'') from projection_threads where thread_id='hyfrme-fixture-logo-intro';"], { encoding: "utf8" });
      persistedArchivedAt = archivedAt.stdout.trim();
      if (archivedAt.status !== 0 || !persistedArchivedAt) throw new Error("Native T3 did not persist archive state");
      await saveRoot("archived");
    }
    if (frame === events.archivedList) {
      await page.goto(new URL("/settings/archived", url).href, { waitUntil: "domcontentloaded" });
      await page.getByText(targetThread, { exact: true }).waitFor({ timeout: 12000 });
      await page.getByRole("button", { name: "Unarchive" }).waitFor();
      await page.mouse.move(800, 50);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(500);
      await saveRoot("archived-list");
    }
    if (frame === events.unarchive) {
      await page.getByRole("button", { name: "Unarchive" }).click();
      await page.getByText(targetThread, { exact: true }).waitFor({ state: "detached", timeout: 12000 });
      await page.getByText("No archived threads", { exact: true }).waitFor({ timeout: 12000 });
      await page.mouse.move(800, 50);
      await page.waitForTimeout(500);
      await saveRoot("unarchived");
    }
    await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
} finally { await browser.close(); }

const archiveState = spawnSync("sqlite3", [fixtureDb,
  "select coalesce(archived_at,'') from projection_threads where thread_id='hyfrme-fixture-logo-intro';"], { encoding: "utf8" });
if (archiveState.status !== 0 || archiveState.stdout.trim()) throw new Error("Native T3 did not unarchive the thread");
if (recorded.archived.sidebarRows.includes(targetThread) || !recorded.before.sidebarRows.includes(targetThread)) {
  throw new Error("Native archive did not remove the target from the sidebar");
}
const encoded = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
if (encoded.status !== 0) throw new Error(encoded.stderr);
const sourceDomHashes = Object.fromEntries(await Promise.all(phases.map(async (phase) =>
  [phase, hash(await readFile(resolve(source, `thread-archive-${phase}.html`)))])));
await writeFile(resolve(source, "thread-archive-fixture.json"), `${JSON.stringify({
  sourceTag: base.sourceTag, sourceCommit: base.sourceCommit, sourceHashes: base.sourceHashes,
  captureBrowser: { version: browserVersion.stdout.trim(), flags },
  viewport: base.viewport, fps, frames, phases, events, targetThread, menuLabels, persistedArchivedAt, recorded,
  sourceDomHashes, menuPortalSha256: hash(await readFile(resolve(source, "thread-archive-menu-portal.html"))),
  referenceSha256: hash(await readFile(reference)),
}, null, 2)}\n`);
console.log(`Captured ${frames} native T3 Code Thread Archive frames, including genuine Settings unarchive.`);
