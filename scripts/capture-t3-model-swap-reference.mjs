import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core",
);
const root = resolve(import.meta.dirname, "..");
const url = process.env.T3_REFERENCE_URL;
const storageState = process.env.T3_STORAGE_STATE;
if (!url || !storageState) {
  throw new Error(
    "Set T3_REFERENCE_URL and T3_STORAGE_STATE for an isolated, paired T3 Code v0.0.35 fixture.",
  );
}

const sourceDir = resolve(root, "assets/t3-code/v0.0.35");
const firstFixture = JSON.parse(
  await readFile(resolve(sourceDir, "brief-fixture.json"), "utf8"),
);
const prompt = firstFixture.prompt;
const frames = 120;
const openFrame = 30;
const selectFrame = 90;
const work = resolve(root, ".work/t3-model-swap-reference");
const reference = resolve(root, "parity/t3-model-swap-reference.mkv");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
await mkdir(work, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.HYFRME_CHROMIUM ?? "/usr/bin/chromium",
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--font-render-hinting=none",
    "--force-color-profile=srgb",
    "--use-gl=angle",
    "--use-angle=gl-egl",
    "--enable-gpu-rasterization",
    "--ignore-gpu-blocklist",
    "--disable-software-rasterizer",
  ],
});
try {
  const page = await browser.newPage({
    viewport: firstFixture.viewport,
    deviceScaleFactor: 1,
    colorScheme: "dark",
    storageState,
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  const editor = page.locator('[data-testid="composer-editor"]');
  await editor.waitFor({ timeout: 15000 });
  await page.waitForTimeout(3000);
  const dismissNotifications = async () => {
    const count = await page
      .locator('button[data-slot="toast-close"]')
      .evaluateAll((buttons) => {
        buttons.forEach((button) => button.click());
        return buttons.length;
      });
    if (count) await page.waitForTimeout(600);
  };
  await dismissNotifications();

  const currentModel = await page
    .locator("button")
    .evaluateAll((buttons) =>
      buttons
        .find(
          (button) =>
            /^GPT-/.test(button.textContent.trim()) &&
            !button.closest('[data-slot="popover-popup"]'),
        )
        ?.textContent.trim(),
    );
  if (currentModel !== "GPT-5.6-Sol") {
    await page.getByRole("button", { name: currentModel, exact: true }).click();
    await page.getByRole("option", { name: /GPT-5\.6-Sol/ }).click();
  }
  await editor.fill(prompt);
  await editor.evaluate((element) => element.blur());
  await page.waitForTimeout(250);
  await writeFile(
    resolve(sourceDir, "model-swap-before.html"),
    await page.locator("#root").evaluate((element) => element.innerHTML),
  );

  for (let frame = 0; frame < frames; frame++) {
    await dismissNotifications();
    if (frame === openFrame) {
      await page
        .getByRole("button", { name: "GPT-5.6-Sol", exact: true })
        .click();
      await page.evaluate(() => {
        window.__t3CaptureAnimations = document.getAnimations();
        for (const animation of window.__t3CaptureAnimations) {
          animation.pause();
          animation.currentTime = 0;
        }
      });
      await writeFile(
        resolve(sourceDir, "model-swap-menu.html"),
        await page.locator("#root").evaluate((element) => element.innerHTML),
      );
      await writeFile(
        resolve(sourceDir, "model-swap-portal.html"),
        await page
          .locator('[data-base-ui-portal]:has([data-slot="popover-popup"])')
          .evaluate((element) => element.outerHTML),
      );
    }
    if (frame >= openFrame && frame < selectFrame) {
      await page.evaluate(
        (elapsed) => {
          for (const animation of window.__t3CaptureAnimations) {
            animation.currentTime = Math.min(150, elapsed);
          }
        },
        ((frame - openFrame) * 1000) / 30,
      );
    }
    if (frame === selectFrame) {
      await page.getByRole("option", { name: /GPT-6-Sol/ }).click();
      await writeFile(
        resolve(sourceDir, "model-swap-after.html"),
        await page.locator("#root").evaluate((element) => element.innerHTML),
      );
    }
    await page.screenshot({
      path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`),
    });
  }
} finally {
  await browser.close();
}

const encode = spawnSync(
  "ffmpeg",
  [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-framerate",
    "30",
    "-i",
    resolve(work, "frame-%04d.png"),
    "-c:v",
    "ffv1",
    "-level",
    "3",
    "-pix_fmt",
    "gbrp",
    reference,
  ],
  { encoding: "utf8" },
);
if (encode.status !== 0) throw new Error(encode.stderr);
await writeFile(
  resolve(sourceDir, "model-swap-fixture.json"),
  `${JSON.stringify(
    {
      sourceTag: firstFixture.sourceTag,
      sourceCommit: firstFixture.sourceCommit,
      sourceHashes: firstFixture.sourceHashes,
      viewport: firstFixture.viewport,
      fps: 30,
      frames,
      prompt,
      openFrame,
      selectFrame,
      modelBefore: "GPT-5.6-Sol",
      modelAfter: "GPT-6-Sol",
      sourceDomHashes: Object.fromEntries(
        await Promise.all(
          ["before", "menu", "portal", "after"].map(async (phase) => [
            phase,
            hash(
              await readFile(resolve(sourceDir, `model-swap-${phase}.html`)),
            ),
          ]),
        ),
      ),
      referenceSha256: hash(await readFile(reference)),
    },
    null,
    2,
  )}\n`,
);
console.log(`Captured ${frames} native T3 Code model-picker frames.`);
