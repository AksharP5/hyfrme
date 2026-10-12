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
if (!url || !storageState) {
  throw new Error("Set T3_REFERENCE_URL and T3_STORAGE_STATE for an isolated pinned T3 Code fixture.");
}

const source = resolve(root, "assets/t3-code/v0.0.35");
const baseFixture = JSON.parse(await readFile(resolve(source, "brief-fixture.json"), "utf8"));
const frames = 120;
const openFrame = 30;
const typeFrame = 60;
const runFrame = 90;
const command = "git status --short";
const output = " M registry/blocks/logo-enter/logo-enter.html";
const work = resolve(root, ".work/t3-terminal-check-reference");
const reference = resolve(root, "parity/t3-terminal-check-reference.mkv");
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

const browser = await chromium.launch({
  executablePath: process.env.HYFRME_CHROMIUM ?? "/usr/bin/chromium",
  headless: true,
  args: [
    "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none",
    "--force-color-profile=srgb", "--use-gl=angle", "--use-angle=gl-egl",
    "--enable-gpu-rasterization", "--ignore-gpu-blocklist",
    "--disable-software-rasterizer",
  ],
});
let terminalBounds;
try {
  const page = await browser.newPage({
    viewport: baseFixture.viewport,
    deviceScaleFactor: 1,
    colorScheme: "dark",
    storageState,
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 15000 });
  await page.waitForTimeout(2000);
  const dismissToasts = async () => {
    await page.locator('button[data-slot="toast-close"]')
      .evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  };
  await dismissToasts();
  await page.waitForTimeout(750);
  const editor = page.locator('[data-testid="composer-editor"]');
  await editor.fill("");
  await editor.evaluate((element) => element.blur());
  await page.mouse.move(640, 55);
  await writeFile(resolve(source, "terminal-check-before.html"),
    await page.locator("#root").evaluate((element) => element.innerHTML));

  for (let frame = 0; frame < frames; frame++) {
    if (frame === openFrame) {
      await page.getByRole("button", { name: "Toggle right panel" }).click();
      await page.waitForTimeout(250);
      if (!await page.locator(".thread-terminal-drawer").count()) {
        await page.locator("button").filter({ hasText: "Start a shell in this workspace." }).click();
      }
      const canvas = page.locator(".thread-terminal-drawer canvas");
      await canvas.waitFor();
      await page.waitForTimeout(1300);
      await dismissToasts();
      await page.waitForTimeout(500);
      await page.mouse.move(640, 55);
      terminalBounds = await canvas.boundingBox();
      await writeFile(resolve(source, "terminal-check-ready.html"),
        await page.locator("#root").evaluate((element) => element.innerHTML));
      await canvas.screenshot({ path: resolve(source, "terminal-check-ready-canvas.png") });
    }
    if (frame === typeFrame) {
      await page.locator(".t3-ghostty-input").focus();
      await page.keyboard.type(command);
      await page.waitForTimeout(350);
      await page.mouse.move(640, 55);
      await writeFile(resolve(source, "terminal-check-typed.html"),
        await page.locator("#root").evaluate((element) => element.innerHTML));
      await page.locator(".thread-terminal-drawer canvas").screenshot({
        path: resolve(source, "terminal-check-typed-canvas.png"),
      });
    }
    if (frame === runFrame) {
      await page.keyboard.press("Enter");
      await page.waitForTimeout(700);
      await page.mouse.move(640, 55);
      await writeFile(resolve(source, "terminal-check-output.html"),
        await page.locator("#root").evaluate((element) => element.innerHTML));
      await page.locator(".thread-terminal-drawer canvas").screenshot({
        path: resolve(source, "terminal-check-output-canvas.png"),
      });
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
const canvasAssets = {};
const canvasVariants = new Map();
const crop = [
  `${Math.round(terminalBounds.width)}x${Math.round(terminalBounds.height)}`,
  `+${Math.round(terminalBounds.x)}+${Math.round(terminalBounds.y)}`,
].join("");
for (let frame = 0; frame < frames; frame++) {
  const phase = frame < openFrame ? null : frame < typeFrame ? "ready" : frame < runFrame ? "typed" : "output";
  if (!phase) {
    canvasSequence.push(null);
    continue;
  }
  const screenshot = resolve(work, `frame-${String(frame).padStart(4, "0")}.png`);
  const imageHash = hash(await readFile(screenshot));
  const variantKey = `${phase}:${imageHash}`;
  let assetName = canvasVariants.get(variantKey);
  if (!assetName) {
    const count = [...canvasVariants.keys()].filter((key) => key.startsWith(`${phase}:`)).length;
    assetName = `terminal-check-canvas-${phase}-${count}.png`;
    const assetPath = resolve(source, assetName);
    const result = spawnSync("magick", [screenshot, "-crop", crop, "+repage", assetPath], { encoding: "utf8" });
    if (result.status !== 0) throw new Error(result.stderr);
    canvasVariants.set(variantKey, assetName);
    canvasAssets[assetName] = hash(await readFile(assetPath));
  }
  canvasSequence.push(assetName);
}
const phases = ["before", "ready", "typed", "output"];
await writeFile(resolve(source, "terminal-check-fixture.json"), `${JSON.stringify({
  sourceTag: baseFixture.sourceTag,
  sourceCommit: baseFixture.sourceCommit,
  sourceHashes: baseFixture.sourceHashes,
  viewport: baseFixture.viewport,
  fps: 30,
  frames,
  openFrame,
  typeFrame,
  runFrame,
  command,
  output,
  terminalBounds,
  canvasSequence,
  canvasAssets,
  sourceDomHashes: Object.fromEntries(await Promise.all(phases.map(async (phase) => [
    phase, hash(await readFile(resolve(source, `terminal-check-${phase}.html`))),
  ]))),
  canvasHashes: Object.fromEntries(await Promise.all(phases.slice(1).map(async (phase) => [
    phase, hash(await readFile(resolve(source, `terminal-check-${phase}-canvas.png`))),
  ]))),
  referenceSha256: hash(await readFile(reference)),
}, null, 2)}\n`);
console.log(`Captured ${frames} native T3 Code terminal-check frames from the Hyfrme demo repository.`);
