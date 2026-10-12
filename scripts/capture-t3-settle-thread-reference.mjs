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
  throw new Error("Set T3_REFERENCE_URL and T3_STORAGE_STATE for the isolated pinned T3 Code fixture.");
}

const source = resolve(root, "assets/t3-code/v0.0.35");
const baseFixture = JSON.parse(await readFile(resolve(source, "brief-fixture.json"), "utf8"));
const work = resolve(root, ".work/t3-settle-thread-reference");
const reference = resolve(root, "parity/t3-settle-thread-reference.mkv");
const frames = 120;
const hoverFrame = 30;
const settleFrame = 45;
const collapseFrame = 75;
const expandFrame = 95;
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
    "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
  ],
});
const phases = ["selected", "hover", "settled", "collapsed", "expanded"];
const rowTitles = {};
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
  await page.waitForURL(/hyfrme-fixture-logo-intro/, { timeout: 15000 });
  await page.waitForTimeout(800);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.mouse.move(800, 50);
  await page.waitForTimeout(300);

  const snapshot = async (phase) => {
    let html = await page.locator("#root").evaluate((element) => element.innerHTML);
    html = html.replaceAll("/tmp/hyfrme-t3-demo/registry/blocks/", "registry/blocks/");
    if (/\/home\/|\/tmp\/hyfrme-t3|127\.0\.0\.1:38\d\d|blob:|playwright-state|auth[_-]?token|session[_-]?token/i.test(html)) {
      throw new Error(`Local or private content in ${phase} source snapshot`);
    }
    await writeFile(resolve(source, `settle-thread-${phase}.html`), html);
    rowTitles[phase] = {
      cards: await page.locator('[data-testid="sidebar-row-card"]').allTextContents(),
      slim: await page.locator('[data-testid="sidebar-row-slim"]').allTextContents(),
      shelf: await page.locator('[data-testid="sidebar-settled-shelf-toggle"]').allTextContents(),
    };
  };
  await snapshot("selected");

  for (let frame = 0; frame < frames; frame++) {
    if (frame === hoverFrame) {
      const row = page.locator('[data-testid="sidebar-row-card"]').filter({ hasText: "Build a logo intro" });
      await row.hover();
      await row.getByRole("button", { name: "Settle thread" }).hover();
      await page.waitForTimeout(250);
      await snapshot("hover");
    }
    if (frame === settleFrame) {
      const row = page.locator('[data-testid="sidebar-row-card"]').filter({ hasText: "Build a logo intro" });
      await row.getByRole("button", { name: "Settle thread" }).click();
      await page.locator('[data-testid="sidebar-row-slim"]').filter({ hasText: "Build a logo intro" }).waitFor({ timeout: 15000 });
      await page.waitForTimeout(450);
      await page.mouse.move(800, 50);
      await snapshot("settled");
    }
    if (frame === collapseFrame) {
      await page.locator('[data-testid="sidebar-settled-shelf-toggle"]').click();
      await page.waitForTimeout(300);
      await page.mouse.move(800, 50);
      await snapshot("collapsed");
    }
    if (frame === expandFrame) {
      await page.locator('[data-testid="sidebar-settled-shelf-toggle"]').click();
      await page.waitForTimeout(300);
      await page.mouse.move(800, 50);
      await snapshot("expanded");
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
await writeFile(resolve(source, "settle-thread-fixture.json"), `${JSON.stringify({
  sourceTag: baseFixture.sourceTag,
  sourceCommit: baseFixture.sourceCommit,
  sourceHashes: baseFixture.sourceHashes,
  viewport: baseFixture.viewport,
  fps: 30,
  frames,
  hoverFrame,
  settleFrame,
  collapseFrame,
  expandFrame,
  rowTitles,
  sourceDomHashes: Object.fromEntries(await Promise.all(phases.map(async (phase) => [
    phase, hash(await readFile(resolve(source, `settle-thread-${phase}.html`))),
  ]))),
  referenceSha256: hash(await readFile(reference)),
}, null, 2)}\n`);
console.log(`Captured ${frames} native T3 Code Settle Thread frames.`);
