import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const release = resolve(root, ".work/t3-v0042-bin/t3-0.0.42-linux-x64");
const source = resolve(root, "assets/t3-code/v0.0.42");
const theme = process.env.T3_REFERENCE_THEME ?? "dark";
if (!["dark", "light"].includes(theme)) throw new Error("T3_REFERENCE_THEME must be dark or light");
const baseDir = resolve(root, `.work/t3-v0042-mark-unread-${theme}-fixture`);
const executablePath = process.env.HYFRME_CHROMIUM;
if (!executablePath) throw new Error("Set HYFRME_CHROMIUM to the pinned Chrome executable");
const prefix = `thread-mark-unread-v0042-${theme}`;
const work = resolve(root, `.work/t3-${prefix}-reference`);
const reference = resolve(root, `parity/t3-thread-mark-unread-v0042-${theme}-reference.mkv`);
const base = JSON.parse(await readFile(resolve(source, "brief-v0042-fixture.json"), "utf8"));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const version = spawnSync(resolve(release, "t3"), ["--version"], { encoding: "utf8" });
if (version.status !== 0 || version.stdout.trim() !== "t3 v0.0.42") throw new Error("Wrong T3 Code release");
const chromeVersion = spawnSync(executablePath, ["--version"], { encoding: "utf8" });
if (chromeVersion.status !== 0 || chromeVersion.stdout.trim() !== "Google Chrome for Testing 152.0.7977.30") throw new Error("Wrong capture browser");
const database = resolve(baseDir, "userdata/state.sqlite");
const thread = spawnSync("sqlite3", [database, "select t.thread_id,p.completed_at,p.state from projection_threads t join projection_turns p on p.thread_id=t.thread_id where t.title='Catalog motion audit';"], { encoding: "utf8" });
if (thread.status !== 0) throw new Error(thread.stderr);
const [threadId, completedAt, turnState] = thread.stdout.trim().split("|");
if (threadId !== "hyfrme-fixture-catalog-audit" || !completedAt || turnState !== "completed") {
  throw new Error("Fixture requires the seeded completed Hyfrme thread");
}
const expectedVisitedAt = new Date(Date.parse(completedAt) - 1).toISOString();
const server = spawn(resolve(release, "t3"), ["serve", "--mode", "desktop", "--base-dir", baseDir,
  "--port", theme === "dark" ? "3998" : "3999", "--host", "127.0.0.1", "--no-browser"],
{ cwd: root, stdio: ["ignore", "pipe", "pipe"] });
let output = "";
for (const stream of [server.stdout, server.stderr]) stream.on("data", (chunk) => { output += chunk; });
try {
  let pairingUrl;
  for (let attempt = 0; attempt < 120; attempt++) {
    pairingUrl = output.match(/Pairing URL: (\S+)/)?.[1];
    if (pairingUrl) break;
    if (server.exitCode !== null) throw new Error("Official server exited before pairing");
    await new Promise((done) => setTimeout(done, 250));
  }
  if (!pairingUrl) throw new Error("Official server did not produce a pairing URL");
  for (const [key, path] of [["index", "/"], ["css", "/assets/main-x9o7QJ8O.css"], ["js", "/assets/index-BMH8bO9q.js"]]) {
    const response = await fetch(new URL(path, pairingUrl));
    if (!response.ok || hash(Buffer.from(await response.arrayBuffer())) !== base.sourceHashes[key]) {
      throw new Error(`${key} differs from pinned official release`);
    }
  }
  const frames = 120;
  const fps = 30;
  const phases = ["read", "menu", "unread", "persisted"];
  const events = { menu: 25, markUnread: 55, persisted: 85 };
  const observed = {};
  await mkdir(work, { recursive: true });
  const browser = await chromium.launch({ executablePath, headless: true, args: [
    "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
    "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
  ] });
  try {
    const page = await browser.newPage({ viewport: base.viewport, deviceScaleFactor: 1, colorScheme: theme });
    await page.clock.setFixedTime(new Date("2026-09-25T11:30:00Z"));
    await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
    await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
    const row = (title) => page.locator('[data-testid="sidebar-row-card"]').filter({ hasText: title }).first();
    await row("Catalog motion audit").getByText("Catalog motion audit", { exact: true }).click();
    await page.waitForTimeout(900);
    await row("Build a logo intro").getByText("Build a logo intro", { exact: true }).click();
    await page.waitForTimeout(900);
    await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
    await page.mouse.move(800, 80);
    await page.waitForTimeout(450);
    await page.evaluate(() => document.fonts.ready);
    const currentTheme = await page.evaluate(() => document.documentElement.className.includes("dark") ? "dark" : "light");
    if (currentTheme !== theme) throw new Error(`Official app displayed ${currentTheme} under ${theme} capture`);
    const target = row("Catalog motion audit");
    const menu = page.locator('.dropdown-glass[data-level="0"]');
    const visitedAt = async () => page.evaluate((id) => {
      const state = JSON.parse(localStorage.getItem("t3code:ui-state:v1") ?? "{}");
      return Object.entries(state.threadLastVisitedAtById ?? {}).find(([key]) => key.endsWith(id))?.[1] ?? null;
    }, threadId);
    const order = () => page.locator('[data-testid="sidebar-row-card"] div.mt-1 span').allTextContents();
    const clean = (html) => html.replaceAll(baseDir, "hyfrme-fixture")
      .replaceAll(root, "hyfrme-project");
    const save = async (phase, withMenu = false) => {
      const html = clean(await page.locator("#root").evaluate((element) => element.innerHTML));
      if (/\/home\/|auth[_-]?token|session[_-]?token|127\.0\.0\.1:\d+/i.test(html)) {
        throw new Error(`Private fixture data in ${phase} root DOM`);
      }
      await writeFile(resolve(source, `${prefix}-${phase}.html`), html);
      observed[phase] = { rowOrder: await order(), visitedAt: await visitedAt(),
        unreadBadge: await target.getByText("Done", { exact: true }).isVisible().catch(() => false) };
      if (!withMenu) return;
      const portal = clean(await menu.evaluate((element) => element.outerHTML));
      if (/\/home\/|auth[_-]?token|session[_-]?token/i.test(portal)) throw new Error("Private menu DOM");
      await writeFile(resolve(source, `${prefix}-${phase}-portal.html`), portal);
      observed[phase].menuBox = await menu.boundingBox();
      observed[phase].rowBox = await target.boundingBox();
    };
    if (await target.getByText("Done", { exact: true }).isVisible().catch(() => false)) {
      throw new Error("Target thread is unread before the action");
    }
    await save("read");
    for (let frame = 0; frame < frames; frame++) {
      if (frame === events.menu) {
        await target.click({ button: "right" });
        await menu.waitFor();
        await menu.getByRole("button", { name: "Mark unread", exact: true }).waitFor();
        await page.mouse.move(800, 80);
        await page.waitForTimeout(350);
        await save("menu", true);
      }
      if (frame === events.markUnread) {
        await menu.getByRole("button", { name: "Mark unread", exact: true }).click();
        await target.getByText("Done", { exact: true }).waitFor({ timeout: 12000 });
        await page.mouse.move(800, 80);
        await page.waitForTimeout(750);
        await save("unread");
      }
      if (frame === events.persisted) {
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
        await page.waitForTimeout(900);
        await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
        await page.mouse.move(800, 80);
        await page.waitForTimeout(400);
        await target.getByText("Done", { exact: true }).waitFor({ timeout: 12000 });
        await save("persisted");
      }
      await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
    }
  } finally {
    await browser.close();
  }
  if (observed.read?.unreadBadge || observed.read?.visitedAt === expectedVisitedAt ||
    observed.menu?.unreadBadge || !observed.unread?.unreadBadge || !observed.persisted?.unreadBadge ||
    observed.unread?.visitedAt !== expectedVisitedAt || observed.persisted?.visitedAt !== expectedVisitedAt ||
    JSON.stringify(observed.read?.rowOrder) !== JSON.stringify(observed.unread?.rowOrder) ||
    JSON.stringify(observed.read?.rowOrder) !== JSON.stringify(observed.persisted?.rowOrder)) {
    throw new Error(`Native unread behavior differed: ${JSON.stringify(observed)}`);
  }
  const box = observed.menu.menuBox;
  const rowBox = observed.menu.rowBox;
  if (!box || !rowBox || box.x > rowBox.x + rowBox.width + 30 || box.y < rowBox.y - 30) {
    throw new Error(`Native sidebar menu is misplaced: ${JSON.stringify({ box, rowBox })}`);
  }
  const encode = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
    "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
  if (encode.status !== 0) throw new Error(encode.stderr);
  const sourceDomHashes = Object.fromEntries(await Promise.all([...phases, "menu-portal"].map(async (phase) =>
    [phase, hash(await readFile(resolve(source, `${prefix}-${phase}.html`)))])));
  await writeFile(resolve(source, `${prefix}-fixture.json`), JSON.stringify({
    sourceTag: "v0.0.42", sourceCommit: "719a76ca1dbf5490f1aa33ffb9966301e02be9a9",
    releaseSha256: base.releaseSha256, sourceHashes: base.sourceHashes,
    viewport: base.viewport, fps, frames, theme, phases, events, threadId, completedAt,
    expectedVisitedAt, observed, sourceDomHashes, referenceSha256: hash(await readFile(reference)),
  }, null, 2) + "\n");
  console.log(`Captured ${frames} native T3 Code v0.0.42 Mark Thread Unread ${theme} frames.`);
} finally {
  server.kill("SIGTERM");
}
