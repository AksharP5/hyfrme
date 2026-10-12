import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const url = process.env.T3_REFERENCE_URL;
const serverLog = process.env.T3_SERVER_LOG;
const executablePath = process.env.HYFRME_CHROMIUM;
if (!url || !serverLog || !executablePath) throw new Error("Set isolated T3 URL, server log, and HyperFrames Chromium path.");
const pairingUrl = (await readFile(serverLog, "utf8")).match(/Pairing URL: (\S+)/)?.[1];
if (!pairingUrl || new URL(pairingUrl).origin !== new URL(url).origin) throw new Error("Missing or mismatched T3 pairing URL");
const browser = await chromium.launch({ executablePath, headless: true, args: [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
  "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
] });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 659 }, deviceScaleFactor: 1, colorScheme: "dark" });
  await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  await page.getByText("Catalog motion audit", { exact: true }).click();
  await page.waitForURL(/hyfrme-fixture-catalog-audit/);
  await page.waitForTimeout(700);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.getByRole("button", { name: "Thread actions for Catalog motion audit" }).click();
  await page.locator('.dropdown-glass[data-level="0"] button').filter({ hasText: /^Snooze$/ }).hover();
  await page.waitForTimeout(450);
  const menus = await page.locator('.dropdown-glass').evaluateAll((elements) => elements.map((element) => ({
    level: element.getAttribute('data-level'), buttons: [...element.querySelectorAll('button')].map((button) => button.innerText),
    html: element.outerHTML,
  })));
  console.log(JSON.stringify(menus.map(({ level, buttons }) => ({ level, buttons })), null, 2));
  await writeFile(resolve(root, ".work/t3-thread-snooze-probe.json"), `${JSON.stringify(menus, null, 2)}\n`);
  await page.screenshot({ path: resolve(root, ".work/t3-thread-snooze-probe.png") });
} finally { await browser.close(); }
