import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const url = process.env.T3_REFERENCE_URL;
const storageState = process.env.T3_STORAGE_STATE;
if (!url || !storageState) throw new Error("Set T3_REFERENCE_URL and T3_STORAGE_STATE for the pinned isolated fixture.");

const source = resolve(root, "assets/t3-code/v0.0.35");
const baseFixture = JSON.parse(await readFile(resolve(source, "brief-fixture.json"), "utf8"));
const work = resolve(root, ".work/t3-project-action-run-reference");
const reference = resolve(root, "parity/t3-project-action-run-reference.mkv");
const frames = 120;
const runFrame = 30;
const resultFrame = 50;
const command = "npm run check";
const output = "> check\n> tsc --noEmit";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
for (const [path, expected] of [
  ["/", baseFixture.sourceHashes.index],
  ["/assets/index-DSuALXPn.css", baseFixture.sourceHashes.css],
  ["/assets/index-CI6tzIRc.js", baseFixture.sourceHashes.js],
]) {
  const response = await fetch(new URL(path, url));
  if (!response.ok || hash(Buffer.from(await response.arrayBuffer())) !== expected) {
    throw new Error(`${path} differs from the pinned T3 Code build`);
  }
}
await mkdir(work, { recursive: true });

let terminalBounds;
const projectPath = resolve(root, ".work/t3-project-action-run-project/hyfrme");
const browser = await chromium.launch({
  executablePath: process.env.HYFRME_CHROMIUM ?? "/usr/bin/chromium",
  headless: true,
  args: [
    "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none",
    "--force-color-profile=srgb", "--use-gl=angle", "--use-angle=gl-egl",
    "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
  ],
});
try {
  const page = await browser.newPage({
    viewport: baseFixture.viewport,
    deviceScaleFactor: 1,
    colorScheme: "dark",
    storageState,
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  await page.getByText("Build a logo intro", { exact: true }).click();
  await page.waitForURL(/hyfrme-fixture-logo-intro/);
  await page.waitForTimeout(1500);
  await page.locator('button[aria-label="Dismiss notification"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.mouse.move(800, 50);
  await page.waitForTimeout(350);

  // The isolated fixture can reconnect to an earlier terminal. Make a fresh
  // terminal before recording so the saved action shows only this check run.
  await page.getByRole("button", { name: "Toggle terminal drawer" }).click();
  const terminalCanvas = page.locator(".thread-terminal-drawer canvas");
  if (!await terminalCanvas.waitFor({ timeout: 3000 }).then(() => true).catch(() => false)) {
    const start = page.locator("button").filter({ hasText: "Start a shell in this workspace." });
    if (!await start.count()) {
      await page.screenshot({ path: resolve(work, "terminal-prep-error.png") });
      throw new Error("Terminal drawer opened without an existing canvas or a new-shell button");
    }
    await start.click();
  }
  await terminalCanvas.waitFor({ timeout: 10000 });
  await page.getByRole("button", { name: /^New Terminal/ }).click();
  await page.waitForTimeout(650);
  const prepImage = resolve(work, "terminal-prep.png");
  await terminalCanvas.screenshot({ path: prepImage });
  const prepOcr = spawnSync("tesseract", [prepImage, "stdout"], { encoding: "utf8" });
  if (prepOcr.status !== 0 || /t3-project-action-run-project|tsc --noEmit|npm run check/i.test(prepOcr.stdout)) {
    throw new Error(`New terminal is not blank: ${prepOcr.stdout.slice(0, 300)}`);
  }
  await page.getByRole("button", { name: "Toggle terminal drawer" }).click();
  await page.mouse.move(800, 50);
  await page.waitForTimeout(200);

  const snapshot = async (phase) => {
    let html = await page.locator("#root").evaluate((element) => element.innerHTML);
    html = html.replaceAll(projectPath, "hyfrme-project")
      .replaceAll("/tmp/hyfrme-t3-demo/registry/blocks/", "registry/blocks/")
      .replaceAll("/tmp/hyfrme-t3-demo", "hyfrme-project");
    if (/\/home\/|\/tmp\/hyfrme-t3|127\.0\.0\.1:38\d\d|blob:|playwright-state|auth[_-]?token|session[_-]?token/i.test(html)) {
      throw new Error(`Local or private content in ${phase} source snapshot`);
    }
    await writeFile(resolve(source, `project-action-run-${phase}.html`), html);
  };
  await snapshot("before");
  for (let frame = 0; frame < frames; frame++) {
    if (frame === runFrame) {
      await page.locator('button[aria-label="Run Verify Hyfrme"]').click();
      const canvas = page.locator(".thread-terminal-drawer canvas");
      await canvas.waitFor({ timeout: 10000 });
      terminalBounds = await canvas.boundingBox();
      await page.locator('button[aria-label="Dismiss notification"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
      await page.mouse.move(800, 50);
      await snapshot("opened");
    }
    if (frame === resultFrame) {
      await page.waitForTimeout(700);
      await page.locator('button[aria-label="Dismiss notification"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
      await page.mouse.move(800, 50);
      await snapshot("output");
    }
    await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
} finally {
  await browser.close();
}

const encode = spawnSync("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y", "-framerate", "30",
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3",
  "-pix_fmt", "gbrp", reference,
], { encoding: "utf8" });
if (encode.status !== 0) throw new Error(encode.stderr);

const canvasSequence = [];
const assetSha256 = {};
const variants = new Map();
const crop = `${Math.round(terminalBounds.width)}x${Math.round(terminalBounds.height)}+${Math.round(terminalBounds.x)}+${Math.round(terminalBounds.y)}`;
for (let frame = 0; frame < frames; frame++) {
  if (frame < runFrame) { canvasSequence.push(null); continue; }
  const screenshot = resolve(work, `frame-${String(frame).padStart(4, "0")}.png`);
  const cropResult = spawnSync("magick", [screenshot, "-crop", crop, "+repage", "png:-"], { maxBuffer: 12 * 1024 * 1024 });
  if (cropResult.status !== 0) throw new Error(cropResult.stderr.toString());
  const imageHash = hash(cropResult.stdout);
  let assetName = variants.get(imageHash);
  if (!assetName) {
    assetName = `project-action-run-canvas-${String(variants.size).padStart(2, "0")}.png`;
    await writeFile(resolve(source, assetName), cropResult.stdout);
    variants.set(imageHash, assetName);
    assetSha256[assetName] = imageHash;
  }
  canvasSequence.push(assetName);
}
await writeFile(resolve(source, "project-action-run-fixture.json"), `${JSON.stringify({
  sourceTag: baseFixture.sourceTag,
  sourceCommit: baseFixture.sourceCommit,
  sourceHashes: baseFixture.sourceHashes,
  viewport: baseFixture.viewport,
  fps: 30,
  frames,
  runFrame,
  resultFrame,
  command,
  output,
  terminalBounds,
  canvasSequence,
  assetSha256,
  sourceDomHashes: Object.fromEntries(await Promise.all(["before", "opened", "output"].map(async (phase) => [
    phase, hash(await readFile(resolve(source, `project-action-run-${phase}.html`))),
  ]))),
  referenceSha256: hash(await readFile(reference)),
}, null, 2)}\n`);
console.log(`Captured ${frames} native T3 Code Project Action Run frames with ${variants.size} terminal canvas states.`);
