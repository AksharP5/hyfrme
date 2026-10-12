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
const prompt = "Review Hyfrme's Logo Enter source and verify its final-frame hold.";
const frames = 120;
const collapseFrame = 30;
const restoreFrame = 90;
const transitionMs = 200;
const work = resolve(root, ".work/t3-sidebar-focus-reference");
const reference = resolve(root, "parity/t3-sidebar-focus-reference.mkv");
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
let sidebarWidth;
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
  await editor.fill(prompt);
  await editor.evaluate((element) => element.blur());
  await page.mouse.move(800, 50);
  await page.waitForTimeout(250);
  sidebarWidth = await page.locator('[data-slot="sidebar-gap"]').evaluate((element) => element.getBoundingClientRect().width);
  threadAges = await page.locator('[data-testid="sidebar-row-card"]')
    .evaluateAll((rows) => rows.map((row) => row.querySelector('span.tabular-nums.text-secondary-label')?.textContent.trim()));
  const snapshot = async (phase) => {
    const html = await page.locator("#root").evaluate((element) => element.innerHTML);
    if (/\/home\/|\/tmp\/hyfrme-t3|127\.0\.0\.1:3855|playwright-state|auth[_-]?token|session[_-]?token/i.test(html)) {
      throw new Error(`Local or private content in ${phase} source snapshot`);
    }
    await writeFile(resolve(source, `sidebar-focus-${phase}.html`), html);
  };
  await snapshot("open");

  for (let frame = 0; frame < frames; frame++) {
    if (frame === collapseFrame || frame === restoreFrame) {
      if (frame === restoreFrame) {
        await page.evaluate(() => window.__t3SidebarAnimations.forEach((animation) => animation.finish()));
      }
      await page.getByRole("button", { name: "Toggle main sidebar" }).click();
      await page.evaluate(() => {
        window.__t3SidebarAnimations = document.getAnimations().filter((animation) => {
          const target = animation.effect?.target;
          const slot = target?.getAttribute?.("data-slot");
          return ["sidebar-gap", "sidebar-container", "sidebar-rail"].includes(slot)
            || animation.effect?.getKeyframes().some((keyframe) => "paddingLeft" in keyframe);
        });
        for (const animation of window.__t3SidebarAnimations) {
          animation.pause();
          animation.currentTime = 0;
        }
      });
      await snapshot(frame === collapseFrame ? "collapsed" : "restored");
    }
    if (frame >= collapseFrame && frame < restoreFrame) {
      await page.evaluate((elapsed) => {
        for (const animation of window.__t3SidebarAnimations) {
          animation.currentTime = Math.min(200, elapsed);
        }
      }, ((frame - collapseFrame) * 1000) / 30);
    }
    if (frame >= restoreFrame) {
      await page.evaluate((elapsed) => {
        for (const animation of window.__t3SidebarAnimations) {
          animation.currentTime = Math.min(200, elapsed);
        }
      }, ((frame - restoreFrame) * 1000) / 30);
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
await writeFile(resolve(source, "sidebar-focus-fixture.json"),
  `${JSON.stringify({
    sourceTag: baseFixture.sourceTag,
    sourceCommit: baseFixture.sourceCommit,
    sourceHashes: baseFixture.sourceHashes,
    viewport: baseFixture.viewport,
    fps: 30,
    frames,
    prompt,
    collapseFrame,
    restoreFrame,
    transitionMs,
    sidebarWidth,
    threadAges,
    sourceDomHashes: Object.fromEntries(await Promise.all(
      ["open", "collapsed", "restored"].map(async (phase) => [
        phase,
        hash(await readFile(resolve(source, `sidebar-focus-${phase}.html`))),
      ]),
    )),
    referenceSha256: hash(await readFile(reference)),
  }, null, 2)}\n`);
console.log(`Captured ${frames} native T3 Code sidebar-focus frames.`);
