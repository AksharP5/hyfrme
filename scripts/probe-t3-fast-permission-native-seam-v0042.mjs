import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const release = resolve(root, ".work/t3-v0042-bin/t3-0.0.42-linux-x64/t3");
const output = resolve(root, ".work/t3-fast-permission-seam");
const chrome = process.env.HYFRME_CHROMIUM;
if (!chrome) throw new Error("Set HYFRME_CHROMIUM to pinned Chrome 152");
if (spawnSync(release, ["--version"], { encoding: "utf8" }).stdout.trim() !== "t3 v0.0.42") throw new Error("Wrong official T3 Code release");
if (spawnSync(chrome, ["--version"], { encoding: "utf8" }).stdout.trim() !== "Google Chrome for Testing 152.0.7977.30") throw new Error("Wrong capture browser");
const baseline = JSON.parse(await readFile(resolve(source, "brief-v0042-fixture.json"), "utf8"));
const prompt = JSON.parse(await readFile(resolve(source, "fast-tier-v0042-dark-fixture.json"), "utf8")).prompt;
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
await mkdir(output, { recursive: true });
const results = {};
for (const theme of ["dark", "light"]) {
  const fixture = resolve(output, `${theme}-fixture`);
  await rm(fixture, { recursive: true, force: true });
  await cp(resolve(root, ".work/t3-v0042-composer-fixture"), fixture, { recursive: true });
  const port = theme === "dark" ? 3970 : 3971;
  const server = spawn(release, ["serve", "--mode", "desktop", "--base-dir", fixture, "--port", String(port),
    "--host", "127.0.0.1", "--no-browser"], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
  let outputText = "";
  for (const stream of [server.stdout, server.stderr]) stream.on("data", (chunk) => { outputText += chunk; });
  let url;
  for (let attempt = 0; attempt < 120; attempt++) {
    url = outputText.match(/Pairing URL: (\S+)/)?.[1];
    if (url) break;
    if (server.exitCode !== null) throw new Error("Official server exited before pairing");
    await new Promise((done) => setTimeout(done, 250));
  }
  if (!url) throw new Error("Official server did not produce pairing URL");
  let browser;
  try {
    for (const [key, path] of [["index", "/"], ["css", "/assets/main-x9o7QJ8O.css"], ["js", "/assets/index-BMH8bO9q.js"]]) {
      const response = await fetch(new URL(path, url));
      if (!response.ok || sha256(Buffer.from(await response.arrayBuffer())) !== baseline.sourceHashes[key]) {
        throw new Error(`${key} differs from pinned official release`);
      }
    }
    browser = await chromium.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage",
      "--font-render-hinting=none", "--force-color-profile=srgb", "--use-gl=angle", "--use-angle=gl-egl",
      "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer"] });
    const page = await browser.newPage({ viewport: baseline.viewport, deviceScaleFactor: 1, colorScheme: theme });
    await page.clock.setFixedTime(new Date("2026-09-25T11:30:00Z"));
    await page.goto(url, { waitUntil: "domcontentloaded" });
    const editor = page.locator('[data-testid="composer-editor"]');
    await editor.waitFor({ timeout: 20000 });
    await page.waitForTimeout(900);
    await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
    await page.evaluate(() => document.fonts.ready);
    const trigger = page.locator('[data-composer-shortcut="composer.effort"]').first();
    const portal = page.locator('[data-base-ui-portal]:has([data-slot="menu-popup"])').last();
    if ((await trigger.locator(".truncate").innerText()).trim() !== "High") {
      await trigger.click();
      await portal.getByRole("menuitemradio", { name: /^High(?:\s|$)/ }).first().click();
    }
    if (!await trigger.locator(".sr-only", { hasText: "Fast mode on" }).count()) {
      await trigger.click();
      await portal.getByRole("menuitemradio", { name: /^Fast(?:\s|$)/ }).first().click();
    }
    await editor.fill(prompt);
    await editor.evaluate((element) => element.blur());
    await page.mouse.move(800, 80);
    await page.waitForTimeout(350);
    const screenshot = resolve(output, `native-${theme}.png`);
    await page.screenshot({ path: screenshot });
    const previous = resolve(root, `.work/t3-fast-tier-v0042-${theme}-reference/frame-0119.png`);
    const comparison = spawnSync("magick", ["compare", "-metric", "AE", previous, screenshot, "null:"], { encoding: "utf8" });
    const changedPixels = Number(comparison.stderr.match(/^[\d.]+/)?.[0]);
    if (comparison.status !== 0 || changedPixels !== 0) throw new Error(`${theme} native Fast-to-Permission seam changed ${changedPixels} pixels`);
    const permission = page.getByRole("combobox", { name: "Runtime mode" });
    await permission.click();
    const popup = page.locator('[data-slot="select-popup"]').last();
    await popup.waitFor({ state: "visible" });
    const popupBox = await popup.boundingBox();
    const triggerBox = await permission.boundingBox();
    if (!popupBox || !triggerBox || Math.abs(popupBox.x - triggerBox.x) > 30) {
      throw new Error(`${theme} native Permission Choice popup is not attached to composer trigger`);
    }
    results[theme] = { changedPixels, nativeScreenshotSha256: sha256(await readFile(screenshot)),
      previousSha256: sha256(await readFile(previous)), prompt, reasoningLevel: "High", serviceTier: "Fast",
      popupAttachedToComposer: true, popupBox, triggerBox };
  } catch (error) {
    throw new Error(String(error).replaceAll(url, "[pairing URL redacted]"));
  } finally {
    if (browser) await browser.close();
    server.kill("SIGTERM");
  }
}
await writeFile(resolve(output, "native-result.json"), JSON.stringify(results, null, 2) + "\n");
console.log("Official dark and light ID16 Fast-to-ID17 Permission seams are pixel-exact with attached permission popups.");
