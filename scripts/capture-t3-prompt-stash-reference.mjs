import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const url = process.env.T3_REFERENCE_URL;
const storageFile = process.env.T3_STORAGE_STATE;
if (!url || !storageFile) {
  throw new Error("Set T3_REFERENCE_URL and T3_STORAGE_STATE for an isolated, paired T3 Code fixture.");
}

const source = resolve(root, "assets/t3-code/v0.0.35");
const baseFixture = JSON.parse(await readFile(resolve(source, "brief-fixture.json"), "utf8"));
const frames = 120;
const fps = 30;
const prompt = "Make a Hyfrme Logo Enter cut with a longer final hold.";
const phases = ["draft", "stashed", "menu", "recalled"];
const sampleFrames = { draft: 0, stashed: 30, menu: 60, recalled: 90 };
const work = resolve(root, ".work/t3-prompt-stash-reference");
const reference = resolve(root, "parity/t3-prompt-stash-reference.mkv");
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
const storageState = JSON.parse(await readFile(storageFile, "utf8"));
storageState.origins = (storageState.origins ?? []).map((origin) => ({
  ...origin,
  origin: new URL(url).origin,
}));

const browser = await chromium.launch({
  executablePath: process.env.HYFRME_CHROMIUM ?? "/usr/bin/chromium",
  headless: true,
  args: [
    "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none",
    "--force-color-profile=srgb", "--use-gl=angle", "--use-angle=gl-egl",
    "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
  ],
});
const capture = async (page, phase) => {
  await writeFile(resolve(source, `prompt-stash-${phase}.html`),
    await page.locator("#root").evaluate((element) => element.innerHTML));
  if (phase === "menu") {
    await writeFile(resolve(source, "prompt-stash-menu-portal.html"),
      await page.locator('[data-composer-stash-drawer="true"]')
        .evaluate((element) => element.closest("body > *")?.outerHTML ?? element.outerHTML));
  }
  await page.screenshot({ path: resolve(work, `sample-${phase}.png`) });
};
const status = {};
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
  await page.waitForTimeout(900);
  await page.locator('button[data-slot="toast-close"]')
    .evaluateAll((buttons) => buttons.forEach((button) => button.click()));

  await editor.fill(prompt);
  await editor.evaluate((element) => element.blur());
  await page.mouse.move(650, 80);
  await page.waitForTimeout(250);
  await capture(page, "draft");

  await page.keyboard.press("Control+s");
  await page.waitForFunction(() =>
    document.querySelector('[data-testid="composer-editor"]')?.textContent?.trim() === "", null,
    { timeout: 5000 });
  await page.waitForTimeout(200);
  status.badge = await page.locator('[data-prompt-stash-badge="true"]').count();
  if (!status.badge) throw new Error("Native stash badge did not appear after Control+S");
  await capture(page, "stashed");

  await page.keyboard.press("Control+s");
  const menu = page.locator('[data-composer-stash-drawer="true"]');
  await menu.waitFor({ timeout: 5000 });
  await page.waitForTimeout(180);
  if (!(await menu.innerText()).includes(prompt)) {
    throw new Error("Native stash menu did not contain the Hyfrme prompt");
  }
  await capture(page, "menu");

  await page.keyboard.press("Enter");
  await page.waitForFunction((text) =>
    document.querySelector('[data-testid="composer-editor"]')?.textContent?.includes(text),
    prompt, { timeout: 5000 });
  await page.waitForTimeout(200);
  status.recalled = await editor.innerText();
  if (await menu.count()) throw new Error("Native stash menu stayed open after recall");
  await editor.evaluate((element) => element.blur());
  await page.mouse.move(650, 80);
  await capture(page, "recalled");
} finally {
  await browser.close();
}

for (let frame = 0; frame < frames; frame++) {
  const phase = frame < sampleFrames.stashed ? "draft"
    : frame < sampleFrames.menu ? "stashed"
    : frame < sampleFrames.recalled ? "menu" : "recalled";
  await copyFile(resolve(work, `sample-${phase}.png`),
    resolve(work, `frame-${String(frame).padStart(4, "0")}.png`));
}
const encode = spawnSync("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3",
  "-pix_fmt", "gbrp", reference,
], { encoding: "utf8" });
if (encode.status !== 0) throw new Error(encode.stderr);
await writeFile(resolve(source, "prompt-stash-fixture.json"), `${JSON.stringify({
  sourceTag: baseFixture.sourceTag,
  sourceCommit: baseFixture.sourceCommit,
  sourceHashes: baseFixture.sourceHashes,
  viewport: baseFixture.viewport,
  fps,
  frames,
  sampleFrames,
  referenceMode: "native-interaction-beats-held",
  prompt,
  status,
  sourceDomHashes: Object.fromEntries(await Promise.all(phases.map(async (phase) => [
    phase, hash(await readFile(resolve(source, `prompt-stash-${phase}.html`))),
  ]))),
  portalSha256: hash(await readFile(resolve(source, "prompt-stash-menu-portal.html")),
  referenceSha256: hash(await readFile(reference)),
}, null, 2)}\n`);
const clips = resolve(root, "parity/t3-gallery/t3-clips");
const stills = resolve(root, "parity/t3-gallery/t3-frames");
await mkdir(clips, { recursive: true });
await mkdir(stills, { recursive: true });
const clip = spawnSync("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y", "-i", reference,
  "-vf", "pad=1200:660:0:0:black", "-c:v", "libx264", "-preset", "slow",
  "-crf", "18", "-pix_fmt", "yuv420p", "-an", resolve(clips, "34.mp4"),
], { encoding: "utf8" });
if (clip.status !== 0) throw new Error(clip.stderr);
for (const [still, phase] of [["a", "draft"], ["b", "menu"], ["c", "recalled"]]) {
  const image = spawnSync("magick", [
    resolve(work, `sample-${phase}.png`), "-define", "webp:lossless=true",
    resolve(stills, `34-${still}.webp`),
  ], { encoding: "utf8" });
  if (image.status !== 0) throw new Error(image.stderr);
}
console.log(`Captured ${frames} native T3 Code Prompt Stash frames from the Hyfrme demo thread.`);
