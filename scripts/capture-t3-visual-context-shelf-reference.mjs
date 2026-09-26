import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const url = process.env.T3_REFERENCE_URL;
const storageState = process.env.T3_STORAGE_STATE;
if (!url || !storageState) {
  throw new Error("Set T3_REFERENCE_URL and T3_STORAGE_STATE for the isolated T3 Code v0.0.35 fixture.");
}

const source = resolve(root, "assets/t3-code/v0.0.35");
const baseFixture = JSON.parse(await readFile(resolve(source, "brief-fixture.json"), "utf8"));
const image = resolve(source, "visual-context-shelf-logo-enter.png");
const imageBytes = await readFile(image);
const imageName = "hyfrme-logo-enter-final.png";
const promptBefore = "Use this Hyfrme Logo Enter frame as the reference.";
const promptAfter = `${promptBefore} Keep the last frame still for 18 frames.`;
const frames = 120;
const pasteFrame = 40;
const instructionFrame = 85;
const work = resolve(root, ".work/t3-visual-context-shelf-reference");
const reference = resolve(root, "parity/t3-visual-context-shelf-reference.mkv");
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
let threadAges;
try {
  const page = await browser.newPage({
    viewport: baseFixture.viewport,
    deviceScaleFactor: 1,
    colorScheme: "dark",
    storageState,
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  const editor = page.locator('[data-testid="composer-editor"]');
  await editor.waitFor({ timeout: 15000 });
  await page.waitForTimeout(3000);
  const closeToast = async () => {
    const count = await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => {
      buttons.forEach((button) => button.click());
      return buttons.length;
    });
    if (count) await page.waitForTimeout(600);
  };
  await closeToast();
  await editor.fill(promptBefore);
  await editor.evaluate((element) => element.blur());
  await page.mouse.move(800, 50);
  await page.waitForTimeout(250);
  threadAges = await page.locator('[data-testid="sidebar-row-card"]')
    .evaluateAll((rows) => rows.map((row) => row.querySelector('span.tabular-nums.text-secondary-label')?.textContent.trim()));

  let nativeImageUrl;
  const snapshot = async (phase) => {
    let html = await page.locator("#root").evaluate((element) => element.innerHTML);
    if (nativeImageUrl) html = html.replaceAll(nativeImageUrl, "t3-visual-context-logo-enter.png");
    if (/\/home\/|\/tmp\/hyfrme-t3|127\.0\.0\.1:38\d\d|blob:|playwright-state|auth[_-]?token|session[_-]?token/i.test(html)) {
      throw new Error(`Local or private content in ${phase} source snapshot`);
    }
    await writeFile(resolve(source, `visual-context-shelf-${phase}.html`), html);
  };
  await snapshot("before");

  for (let frame = 0; frame < frames; frame++) {
    if (frame === pasteFrame) {
      await editor.focus();
      await editor.evaluate((element, payload) => {
        const bytes = Uint8Array.from(atob(payload.base64), (character) => character.charCodeAt(0));
        const file = new File([bytes], payload.name, { type: "image/png" });
        const clipboardData = new DataTransfer();
        clipboardData.items.add(file);
        element.dispatchEvent(new ClipboardEvent("paste", {
          bubbles: true,
          cancelable: true,
          clipboardData,
        }));
      }, { base64: imageBytes.toString("base64"), name: imageName });
      const preview = page.locator(`img[alt="${imageName}"]`);
      await preview.waitFor({ timeout: 15000 });
      nativeImageUrl = await preview.getAttribute("src");
      if (!nativeImageUrl?.startsWith("blob:")) {
        throw new Error("T3 Code did not create its native pasted-image preview");
      }
      await editor.evaluate((element) => element.blur());
      await page.waitForTimeout(250);
      await snapshot("attached");
    }
    if (frame === instructionFrame) {
      await editor.fill(promptAfter);
      await editor.evaluate((element) => element.blur());
      await page.waitForTimeout(250);
      await snapshot("final");
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
await writeFile(resolve(source, "visual-context-shelf-fixture.json"),
  `${JSON.stringify({
    sourceTag: baseFixture.sourceTag,
    sourceCommit: baseFixture.sourceCommit,
    sourceHashes: baseFixture.sourceHashes,
    viewport: baseFixture.viewport,
    fps: 30,
    frames,
    promptBefore,
    promptAfter,
    imageName,
    pasteFrame,
    instructionFrame,
    threadAges,
    imageSource: "public/previews/logo-enter/hyperframes.mp4#frame=89",
    imageSha256: hash(imageBytes),
    sourceDomHashes: Object.fromEntries(await Promise.all(
      ["before", "attached", "final"].map(async (phase) => [
        phase,
        hash(await readFile(resolve(source, `visual-context-shelf-${phase}.html`))),
      ]),
    )),
    referenceSha256: hash(await readFile(reference)),
  }, null, 2)}\n`);
console.log(`Captured ${frames} native T3 Code pasted-image frames.`);
