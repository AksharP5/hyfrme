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
const phases = ["before", "at", "results", "highlight", "chip"];
const events = { at: 15, results: 35, highlight: 60, chip: 85 };
const query = "logo";
const selectedFile = "logo-flicker.html";
const selectedPath = "registry/blocks/logo-flicker/logo-flicker.html";
const project = resolve(root, ".work/t3-file-mention-project");
const work = resolve(root, ".work/t3-file-mention-reference");
const reference = resolve(root, "parity/t3-file-mention-reference.mkv");
const flags = [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
  "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
];
await mkdir(work, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true, args: flags });
const observed = {};
try {
  const page = await browser.newPage({ viewport: base.viewport, deviceScaleFactor: 1, colorScheme: "dark" });
  await page.clock.setFixedTime(new Date());
  await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  await page.getByText("Build a logo intro", { exact: true }).click();
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
    await writeFile(resolve(source, `file-mention-${phase}.html`), html);
    observed[phase] = {
      editorText: await page.locator('[data-testid="composer-editor"]').innerText(),
      drawerItems: await page.locator('[data-composer-command-drawer] [data-composer-item-id]')
        .evaluateAll((items) => items.map((item) => item.textContent?.trim())),
    };
  };
  const savePortal = async (phase, locator) => {
    const html = await locator.evaluate((element) => element.outerHTML);
    if (/\/home\/|\/tmp\/hyfrme-t3|auth[_-]?token|session[_-]?token/i.test(html)) {
      throw new Error(`Private ${phase} portal content`);
    }
    await writeFile(resolve(source, `file-mention-${phase}-portal.html`), html);
  };
  await saveRoot("before");
  for (let frame = 0; frame < frames; frame++) {
    if (frame === events.at) {
      const editor = page.locator('[data-testid="composer-editor"]');
      await editor.click();
      await page.keyboard.type("Review @");
      await page.locator('[data-composer-command-drawer="true"]').waitFor();
      await page.getByText("No matching files or folders.", { exact: true }).waitFor();
      await page.waitForTimeout(400);
      await saveRoot("at");
      await savePortal("at", page.locator('[data-composer-drawer-layer="true"]'));
    }
    if (frame === events.results) {
      await page.keyboard.type(query);
      const item = page.locator('[data-composer-command-drawer] [data-composer-item-id]')
        .filter({ hasText: selectedFile });
      await item.waitFor({ timeout: 12000 });
      await page.waitForTimeout(450);
      await saveRoot("results");
      await savePortal("results", page.locator('[data-composer-drawer-layer="true"]'));
    }
    if (frame === events.highlight) {
      const item = page.locator('[data-composer-command-drawer] [data-composer-item-id]')
        .filter({ hasText: selectedFile });
      await item.hover();
      await page.waitForTimeout(350);
      await saveRoot("highlight");
      await savePortal("highlight", page.locator('[data-composer-drawer-layer="true"]'));
    }
    if (frame === events.chip) {
      await page.locator('[data-composer-command-drawer] [data-composer-item-id]')
        .filter({ hasText: selectedFile }).click();
      const chip = page.locator('[data-composer-mention-chip="true"]');
      await chip.waitFor({ timeout: 12000 });
      if (!(await chip.innerText()).includes(selectedFile)) throw new Error("Native file mention chip has wrong label");
      await page.locator('[data-composer-drawer-layer="true"]').waitFor({ state: "detached", timeout: 12000 });
      await page.mouse.move(800, 50);
      await page.waitForTimeout(450);
      await saveRoot("chip");
    }
    await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
} finally { await browser.close(); }
if (!observed.results.drawerItems?.some((item) => item?.includes(selectedFile)) ||
    !observed.chip.editorText.includes(selectedFile)) {
  throw new Error("Native T3 file search/selection did not produce the expected Hyfrme mention");
}
const encoded = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
if (encoded.status !== 0) throw new Error(encoded.stderr);
const sourceDomHashes = Object.fromEntries(await Promise.all(phases.map(async (phase) =>
  [phase, hash(await readFile(resolve(source, `file-mention-${phase}.html`)))])));
const portalHashes = Object.fromEntries(await Promise.all(["at", "results", "highlight"].map(async (phase) =>
  [phase, hash(await readFile(resolve(source, `file-mention-${phase}-portal.html`)))])));
await writeFile(resolve(source, "file-mention-fixture.json"), `${JSON.stringify({
  sourceTag: base.sourceTag, sourceCommit: base.sourceCommit, sourceHashes: base.sourceHashes,
  captureBrowser: { version: browserVersion.stdout.trim(), flags },
  viewport: base.viewport, fps, frames, phases, events, query, selectedFile, selectedPath,
  observed, sourceDomHashes, portalHashes, referenceSha256: hash(await readFile(reference)),
}, null, 2)}\n`);
console.log(`Captured ${frames} native T3 Code @ file mention frames and selected a real Hyfrme file.`);
