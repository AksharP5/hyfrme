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
const serverLog = process.env.T3_SERVER_LOG;
const browserExecutable = process.env.HYFRME_CHROMIUM;
if (!url || !serverLog || !browserExecutable) {
  throw new Error("Set T3_REFERENCE_URL, T3_SERVER_LOG, and HYFRME_CHROMIUM for an isolated pinned T3 Code fixture.");
}
const pairingUrl = (await readFile(serverLog, "utf8")).match(/Pairing URL: (\S+)/)?.[1];
if (!pairingUrl || new URL(pairingUrl).origin !== new URL(url).origin) throw new Error("Fixture pairing URL is absent or mismatched");
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
const menuFrame = 25;
const renameFrame = 50;
const typedFrame = 70;
const commitFrame = 95;
const oldTitle = "Build a logo intro";
const newTitle = "Polish Hyfrme logo intro";
const work = resolve(root, ".work/t3-thread-rename-reference");
const reference = resolve(root, "parity/t3-thread-rename-reference.mkv");
const fixturePath = resolve(root, ".work/t3-thread-rename-project");
await mkdir(work, { recursive: true });

const browser = await chromium.launch({ executablePath: browserExecutable, headless: true, args: browserFlags });
let threadAges;
let threadBranches;
let settledAge;
let messageTimes;
let menuLabels;
try {
  const page = await browser.newPage({ viewport: baseFixture.viewport, deviceScaleFactor: 1, colorScheme: "dark" });
  const fixedNow = new Date();
  await page.clock.setFixedTime(fixedNow);
  await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  await page.getByText(oldTitle, { exact: true }).click();
  await page.waitForURL(/hyfrme-fixture-logo-intro/);
  await page.waitForTimeout(900);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.mouse.move(800, 50);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  threadAges = await page.locator('[data-testid="sidebar-row-card"]')
    .evaluateAll((rows) => rows.map((row) => row.querySelector('span.tabular-nums.text-secondary-label')?.textContent.trim()));
  threadBranches = await page.locator('[data-testid="sidebar-row-card"]')
    .evaluateAll((rows) => rows.map((row) => row.querySelector('span.whitespace-nowrap')?.textContent.trim()));
  settledAge = (await page.locator('[data-testid="sidebar-row-slim"] span.text-xs').textContent()).trim();
  messageTimes = await page.locator('[data-timeline-row-kind="message"]')
    .evaluateAll((rows) => rows.map((row) => row.querySelector('p.tabular-nums')?.textContent.trim() ?? ""));
  const saveRoot = async (phase) => {
    const html = (await page.locator("#root").evaluate((element) => element.innerHTML))
      .replaceAll(fixturePath, "hyfrme-demo")
      .replaceAll("/tmp/hyfrme-t3-demo/registry/blocks/", "registry/blocks/");
    if (/\/home\/|\/tmp\/hyfrme-t3|127\.0\.0\.1:38\d\d|auth[_-]?token|session[_-]?token/i.test(html)) {
      throw new Error(`Captured ${phase} root contains local fixture or credential text`);
    }
    await writeFile(resolve(source, `thread-rename-${phase}.html`), html);
  };
  const savePortal = async (phase) => {
    const html = await page.locator('.dropdown-glass[data-level="0"]').evaluate((menu) => menu.outerHTML);
    if (/\/home\/|\/tmp\/hyfrme-t3|auth[_-]?token|session[_-]?token/i.test(html)) {
      throw new Error(`Captured ${phase} menu contains local fixture or credential text`);
    }
    await writeFile(resolve(source, `thread-rename-${phase}-portal.html`), html);
  };
  await saveRoot("before");
  for (let frame = 0; frame < frames; frame++) {
    if (frame === menuFrame) {
      await page.getByRole("button", { name: `Thread actions for ${oldTitle}` }).click();
      const menu = page.locator('.dropdown-glass[data-level="0"]');
      await menu.waitFor();
      menuLabels = await menu.locator("button").allInnerTexts();
      if (!menuLabels.includes("Rename thread")) throw new Error(`Native T3 menu lacks Rename thread: ${JSON.stringify(menuLabels)}`);
      await page.mouse.move(800, 80);
      await page.waitForTimeout(500);
      await saveRoot("menu");
      await savePortal("menu");
    }
    if (frame === renameFrame) {
      await page.locator('.dropdown-glass[data-level="0"] button').filter({ hasText: /^Rename thread$/ }).click();
      const input = page.getByRole("textbox", { name: "Thread title" });
      await input.waitFor();
      if (await input.inputValue() !== oldTitle) throw new Error("Native rename input did not start with selected thread title");
      await input.press("ArrowRight");
      await page.waitForTimeout(350);
      await saveRoot("editing");
    }
    if (frame === typedFrame) {
      const input = page.getByRole("textbox", { name: "Thread title" });
      await input.fill(newTitle);
      await page.waitForTimeout(350);
      await saveRoot("typed");
    }
    if (frame === commitFrame) {
      await page.getByRole("textbox", { name: "Thread title" }).press("Enter");
      await page.getByRole("button", { name: `Thread actions for ${newTitle}` }).waitFor({ timeout: 12000 });
      await page.getByText(newTitle, { exact: true }).first().waitFor();
      await page.mouse.move(800, 50);
      await page.waitForTimeout(500);
      await saveRoot("renamed");
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
  ["before", "menu", "menu-portal", "editing", "typed", "renamed"].map(async (phase) => [
    phase, hash(await readFile(resolve(source, `thread-rename-${phase}.html`))),
  ]),
));
await writeFile(resolve(source, "thread-rename-fixture.json"), `${JSON.stringify({
  sourceTag: baseFixture.sourceTag,
  sourceCommit: baseFixture.sourceCommit,
  sourceHashes: baseFixture.sourceHashes,
  captureBrowser: { executable: browserExecutable, version: browserVersion, flags: browserFlags },
  viewport: baseFixture.viewport,
  fps,
  frames,
  menuFrame,
  renameFrame,
  typedFrame,
  commitFrame,
  oldTitle,
  newTitle,
  threadAges,
  threadBranches,
  settledAge,
  messageTimes,
  menuLabels,
  sourceDomHashes,
  referenceSha256: hash(await readFile(reference)),
}, null, 2)}\n`);
console.log(`Captured ${frames} native T3 Code Thread Rename frames, including the action menu, inline editor, and committed title.`);
