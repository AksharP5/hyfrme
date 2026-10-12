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
if (!url || !serverLog || !executablePath) throw new Error("Set the isolated T3 URL, server log, and HyperFrames Chromium path.");
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

const name = "t3-visual-context-remove";
const phases = ["attached", "remove-hover", "removed", "persisted"];
const events = { removeHover: 25, remove: 50, persisted: 85 };
const frames = 120;
const fps = 30;
const imageName = "hyfrme-logo-enter-final.png";
const prompt = "Use this Hyfrme Logo Enter frame as the reference.";
const image = resolve(source, "visual-context-shelf-logo-enter.png");
const imageBytes = await readFile(image);
const work = resolve(root, ".work/t3-visual-context-remove-reference");
const reference = resolve(root, `parity/${name}-reference.mkv`);
const fixtureProject = resolve(root, ".work/t3-visual-context-remove-fixture");
await mkdir(work, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true, args: [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
  "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
] });
let nativeImageUrl;
let threadAges;
try {
  const page = await browser.newPage({ viewport: base.viewport, deviceScaleFactor: 1, colorScheme: "dark" });
  await page.clock.setFixedTime(new Date());
  await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
  const editor = page.locator('[data-testid="composer-editor"]');
  await editor.waitFor({ timeout: 20000 });
  await page.locator('[data-testid="sidebar-row-card"]').filter({ hasText: "Build a logo intro" })
    .getByText("Build a logo intro", { exact: true }).click();
  await page.waitForURL(/hyfrme-fixture-logo-intro/);
  await page.waitForTimeout(2200);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.evaluate(() => document.fonts.ready);
  await editor.fill(prompt);
  await editor.focus();
  await editor.evaluate((element, payload) => {
    const bytes = Uint8Array.from(atob(payload.base64), (character) => character.charCodeAt(0));
    const file = new File([bytes], payload.name, { type: "image/png" });
    const clipboardData = new DataTransfer();
    clipboardData.items.add(file);
    element.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData }));
  }, { base64: imageBytes.toString("base64"), name: imageName });
  const preview = page.locator(`img[alt="${imageName}"]`);
  await preview.waitFor({ timeout: 15000 });
  nativeImageUrl = await preview.getAttribute("src");
  if (!nativeImageUrl?.startsWith("blob:")) throw new Error("T3 did not create its real pasted-image thumbnail");
  await editor.evaluate((element) => element.blur());
  await page.mouse.move(800, 50);
  await page.waitForTimeout(750);
  if (await page.getByText(/Updates Available/).isVisible().catch(() => false)) throw new Error("Provider toast remained visible");
  threadAges = await page.locator('[data-testid="sidebar-row-card"]')
    .evaluateAll((rows) => rows.map((row) => row.querySelector('span.tabular-nums.text-secondary-label')?.textContent?.trim()));
  const saveRoot = async (phase) => {
    const html = (await page.locator("#root").evaluate((element) => element.innerHTML))
      .replaceAll(nativeImageUrl, "t3-visual-context-logo-enter.png")
      .replaceAll(fixtureProject, "hyfrme-project")
      .replaceAll("/tmp/hyfrme-t3-demo/registry/blocks/", "registry/blocks/");
    if (/\/home\/|\/tmp\/hyfrme-t3|127\.0\.0\.1:38\d\d|blob:|auth[_-]?token|session[_-]?token/i.test(html)) {
      throw new Error(`Private fixture content in ${phase} DOM`);
    }
    await writeFile(resolve(source, `visual-context-remove-${phase}.html`), html);
  };
  const removeButton = page.getByRole("button", { name: `Remove ${imageName}` });
  await removeButton.waitFor();
  await saveRoot("attached");
  for (let frame = 0; frame < frames; frame++) {
    if (frame === events.removeHover) {
      await removeButton.hover();
      await page.waitForTimeout(450);
      await saveRoot("remove-hover");
    }
    if (frame === events.remove) {
      await removeButton.click();
      await preview.waitFor({ state: "detached", timeout: 15000 });
      await page.mouse.move(800, 50);
      await page.waitForTimeout(450);
      await saveRoot("removed");
    }
    if (frame === events.persisted) {
      await page.reload({ waitUntil: "domcontentloaded" });
      await editor.waitFor({ timeout: 20000 });
      await page.waitForTimeout(2200);
      await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
      await page.mouse.move(800, 50);
      await page.waitForTimeout(450);
      if (await preview.isVisible().catch(() => false)) throw new Error("Removed attachment reappeared after reload");
      if (await page.getByText(/Updates Available/).isVisible().catch(() => false)) throw new Error("Provider toast remained visible after reload");
      await saveRoot("persisted");
    }
    await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
} finally { await browser.close(); }

const encoded = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
if (encoded.status !== 0) throw new Error(encoded.stderr);
const sourceDomHashes = Object.fromEntries(await Promise.all(phases.map(async (phase) =>
  [phase, hash(await readFile(resolve(source, `visual-context-remove-${phase}.html`)))])));
await writeFile(resolve(source, "visual-context-remove-fixture.json"), `${JSON.stringify({
  sourceTag: base.sourceTag, sourceCommit: base.sourceCommit, sourceHashes: base.sourceHashes,
  viewport: base.viewport, fps, frames, phases, events, imageName, prompt, threadAges,
  imageSha256: hash(imageBytes), imageSource: "public/previews/logo-enter/hyperframes.mp4#frame=89",
  sourceDomHashes, referenceSha256: hash(await readFile(reference)),
}, null, 2)}\n`);
console.log(`Captured ${frames} native T3 visual-context attachment removal frames.`);
