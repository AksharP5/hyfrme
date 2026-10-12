import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { cp, rm } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const release = resolve(root, ".work/t3-v0042-bin/t3-0.0.42-linux-x64/t3");
const fixture = resolve(root, ".work/t3-v0042-thread-search-probe-fixture");
await rm(fixture, { recursive: true, force: true });
await cp(resolve(root, ".work/t3-v0042-actions-fixture"), fixture, { recursive: true });
const server = spawn(release, ["serve", "--mode", "desktop", "--base-dir", fixture, "--host", "127.0.0.1", "--port", "3971", "--no-browser"], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
let output = "";
for (const stream of [server.stdout, server.stderr]) stream.on("data", (chunk) => { output += chunk; });
let pairingUrl;
for (let attempt = 0; attempt < 120; attempt++) {
  pairingUrl = output.match(/Pairing URL: (\S+)/)?.[1];
  if (pairingUrl) break;
  if (server.exitCode !== null) throw new Error("Official T3 Code server exited before pairing");
  await new Promise((done) => setTimeout(done, 250));
}
if (!pairingUrl) throw new Error("Official T3 Code server did not produce a pairing URL");
const browser = await chromium.launch({ executablePath: process.env.HYFRME_CHROMIUM, headless: true, args: [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
  "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
] });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 659 }, deviceScaleFactor: 1, colorScheme: "dark" });
  await page.clock.setFixedTime(new Date("2026-09-25T11:30:00Z"));
  await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  await page.locator('[data-testid="sidebar-row-card"]').filter({ hasText: "Build a logo intro" }).first().click();
  await page.waitForTimeout(350);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  const input = page.locator('input[aria-label="Search threads"]');
  const searchBox = await input.boundingBox();
  await input.click();
  const focusAnimations = await page.evaluate(() => document.getAnimations().map((animation) => ({ target: animation.effect?.target?.getAttribute?.("class")?.slice(0, 80), duration: animation.effect?.getTiming().duration })));
  await input.fill("logo");
  await page.locator('#sidebar-thread-search-results [role="option"]').first().waitFor({ timeout: 5000 });
  const logo = await page.locator('#sidebar-thread-search-results [role="option"]').evaluateAll((rows) => rows.map((row) => ({ text: row.textContent.trim(), selected: row.getAttribute("aria-selected") })));
  await input.press("ArrowDown");
  const arrow = { active: await input.getAttribute("aria-activedescendant"), selected: await page.locator('#sidebar-thread-search-results [aria-selected="true"]').allTextContents() };
  await input.fill("grouped logo");
  const grouped = await page.locator('#sidebar-thread-search-results [role="option"]').allTextContents();
  const resultBox = await page.locator('#sidebar-thread-search-results [role="option"]').first().boundingBox();
  await input.press("Enter");
  await page.waitForTimeout(250);
  const selected = { route: new URL(page.url()).pathname, query: await input.inputValue(), rows: await page.locator('[data-testid="sidebar-row-card"][data-active="true"]').allTextContents() };
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 10000 });
  const reloaded = { route: new URL(page.url()).pathname, query: await page.locator('input[aria-label="Search threads"]').inputValue(), rows: await page.locator('[data-testid="sidebar-row-card"][data-active="true"]').allTextContents() };
  console.log(JSON.stringify({ searchBox, focusAnimations, logo, arrow, grouped, resultBox, selected, reloaded }, null, 2));
} catch (error) {
  throw new Error(String(error).replaceAll(pairingUrl, "[pairing URL redacted]"));
} finally {
  await browser.close();
  server.kill("SIGTERM");
}
