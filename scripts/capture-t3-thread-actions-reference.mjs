import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.35");
const baseFixture = JSON.parse(await readFile(resolve(source, "brief-fixture.json"), "utf8"));
const url = process.env.T3_REFERENCE_URL;
const storageState = process.env.T3_STORAGE_STATE;
const browserExecutable = process.env.HYFRME_CHROMIUM;
if (!url || !storageState || !browserExecutable) {
  throw new Error("Set T3_REFERENCE_URL, T3_STORAGE_STATE, and HYFRME_CHROMIUM for an isolated pinned T3 Code fixture.");
}
const browserVersionResult = spawnSync(browserExecutable, ["--version"], { encoding: "utf8" });
const browserVersion = browserVersionResult.stdout.trim();
if (browserVersionResult.status !== 0 || browserVersion !== "Google Chrome for Testing 152.0.7977.30") {
  throw new Error(`Expected HyperFrames Chrome Headless Shell 152.0.7977.30; found ${browserVersion}`);
}
const browserFlags = [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none",
  "--force-color-profile=srgb", "--use-gl=angle", "--use-angle=gl-egl",
  "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
];
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

const frames = 120;
const fps = 30;
const openFrame = 30;
const submenuFrame = 60;
const closeFrame = 90;
const work = resolve(root, ".work/t3-thread-actions-reference");
const reference = resolve(root, "parity/t3-thread-actions-reference.mkv");
await mkdir(work, { recursive: true });

const browser = await chromium.launch({ executablePath: browserExecutable, headless: true, args: browserFlags });
let threadAges;
let messageTimes;
let menuLabels;
let snoozeLabels;
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
  await page.waitForTimeout(1600);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.mouse.move(800, 80);
  await page.waitForTimeout(500);
  threadAges = await page.locator('[data-testid="sidebar-row-card"]')
    .evaluateAll((rows) => rows.map((row) => row.querySelector('span.tabular-nums.text-secondary-label')?.textContent.trim()));
  messageTimes = await page.locator('[data-timeline-row-kind="message"]')
    .evaluateAll((rows) => rows.map((row) => row.querySelector('p.tabular-nums')?.textContent.trim() ?? ""));

  const saveRoot = async (phase) => {
    const html = (await page.locator("#root").evaluate((element) => element.innerHTML))
      .replaceAll("/tmp/hyfrme-t3-demo/registry/blocks/", "registry/blocks/");
    if (/\/home\/|\/tmp\/hyfrme-t3|auth[_-]?token|session[_-]?token/i.test(html)) {
      throw new Error(`Captured ${phase} DOM includes local fixture or credential text`);
    }
    await writeFile(resolve(source, `thread-actions-${phase}.html`), html);
  };
  const savePortals = async (phase) => {
    const html = await page.locator('.dropdown-glass[data-level]')
      .evaluateAll((menus) => menus.map((menu) => menu.outerHTML).join(""));
    if (/\/home\/|\/tmp\/hyfrme-t3|auth[_-]?token|session[_-]?token/i.test(html)) {
      throw new Error(`Captured ${phase} menu includes local fixture or credential text`);
    }
    await writeFile(resolve(source, `thread-actions-${phase}-portal.html`), html);
  };
  await saveRoot("before");
  for (let frame = 0; frame < frames; frame++) {
    if (frame === openFrame) {
      await page.getByRole("button", { name: "Thread actions for Build a logo intro" }).click();
      const menu = page.locator('.dropdown-glass[data-level="0"]');
      await menu.waitFor();
      menuLabels = await menu.locator("button").allInnerTexts();
      for (const label of ["Pin thread", "Settle thread", "Snooze", "Rename thread", "Archive thread"]) {
        if (!menuLabels.includes(label)) throw new Error(`Native T3 menu lacks ${label}: ${JSON.stringify(menuLabels)}`);
      }
      await page.mouse.move(800, 80);
      await page.waitForTimeout(500);
      await saveRoot("menu");
      await savePortals("menu");
    }
    if (frame === submenuFrame) {
      await page.locator('.dropdown-glass[data-level="0"] button').filter({ hasText: /^Snooze$/ }).hover();
      const submenu = page.locator('.dropdown-glass[data-level="1"]');
      await submenu.waitFor();
      snoozeLabels = await submenu.locator("button").allInnerTexts();
      if (snoozeLabels.length < 2) throw new Error("Native Snooze submenu has no presets");
      await page.waitForTimeout(500);
      await saveRoot("snooze");
      await savePortals("snooze");
    }
    if (frame === closeFrame) {
      await page.keyboard.press("Escape");
      await page.locator('.dropdown-glass[data-level="0"]').waitFor({ state: "detached" });
      await page.mouse.click(800, 80);
      await page.waitForTimeout(500);
      await saveRoot("after");
    }
    await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
} finally {
  await browser.close();
}

const encode = spawnSync("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3",
  "-pix_fmt", "gbrp", reference,
], { encoding: "utf8" });
if (encode.status !== 0) throw new Error(encode.stderr);
const sourceDomHashes = Object.fromEntries(await Promise.all(
  ["before", "menu", "menu-portal", "snooze", "snooze-portal", "after"].map(async (phase) => [
    phase, hash(await readFile(resolve(source, `thread-actions-${phase}.html`))),
  ]),
));
await writeFile(resolve(source, "thread-actions-fixture.json"), `${JSON.stringify({
  sourceTag: baseFixture.sourceTag,
  sourceCommit: baseFixture.sourceCommit,
  sourceHashes: baseFixture.sourceHashes,
  captureBrowser: { executable: browserExecutable.split("/").at(-1), version: browserVersion, flags: browserFlags },
  viewport: baseFixture.viewport,
  fps,
  frames,
  openFrame,
  submenuFrame,
  closeFrame,
  threadAges,
  messageTimes,
  menuLabels,
  snoozeLabels,
  sourceDomHashes,
  referenceSha256: hash(await readFile(reference)),
}, null, 2)}\n`);
console.log(`Captured ${frames} native T3 Code Thread Actions frames and the real Snooze submenu.`);
