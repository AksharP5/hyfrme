import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const url = process.env.T3_REFERENCE_URL;
const log = process.env.T3_SERVER_LOG;
const executablePath = process.env.HYFRME_CHROMIUM;
if (!url || !log || !executablePath) throw new Error("Set isolated T3 URL, server log, and Chromium path.");
const pairingUrl = (await readFile(log, "utf8")).match(/Pairing URL: (\S+)/)?.[1];
if (!pairingUrl || new URL(pairingUrl).origin !== new URL(url).origin) throw new Error("Missing isolated pairing URL.");
const storagePath = resolve(root, ".work/t3-project-local-open-fixture/playwright-state.json");
const flags = [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
  "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
];
const browser = await chromium.launch({ executablePath, headless: true, args: flags });
try {
  const context = await browser.newContext({ viewport: { width: 1200, height: 659 }, deviceScaleFactor: 1, colorScheme: "dark" });
  const page = await context.newPage();
  await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  await context.storageState({ path: storagePath });
  await page.getByText("Build a logo intro", { exact: true }).click();
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.mouse.move(800, 50);
  await page.getByRole("button", { name: "New project" }).click();
  const palette = page.getByTestId("command-palette");
  await palette.getByText("Local folder", { exact: true }).click();
  const input = palette.locator("input").first();
  await input.fill("/var/tmp/hyfrme-motion");
  await page.waitForTimeout(700);
  const options = await palette.getByRole("option").allTextContents();
  const buttons = await palette.getByRole("button").allTextContents();
  const snapshot = { query: await input.inputValue(), options, buttons };
  const folder = palette.getByRole("option").filter({ hasText: "hyfrme-motion-lab" }).first();
  if (await folder.count()) {
    await folder.click();
    await page.waitForTimeout(500);
    snapshot.afterSelection = {
      query: await palette.locator("input").first().inputValue(),
      options: await palette.getByRole("option").allTextContents(),
      buttons: await palette.getByRole("button").allTextContents(),
    };
  }
  await writeFile(resolve(root, ".work/t3-project-local-open-probe.json"), `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(JSON.stringify(snapshot));
} finally {
  await browser.close();
}
