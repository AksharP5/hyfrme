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
const groupFrame = 50;
const closeFrame = 85;
const work = resolve(root, ".work/t3-worked-trace-reference");
const reference = resolve(root, "parity/t3-worked-trace-reference.mkv");
await mkdir(work, { recursive: true });

const browser = await chromium.launch({
  executablePath: browserExecutable,
  headless: true,
  args: browserFlags,
});
let threadAges;
let activityRows;
let messageTimes;
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
  await page.waitForTimeout(1800);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.mouse.move(800, 50);
  await page.waitForTimeout(500);
  threadAges = await page.locator('[data-testid="sidebar-row-card"]')
    .evaluateAll((rows) => rows.map((row) => row.querySelector('span.tabular-nums.text-secondary-label')?.textContent.trim()));
  messageTimes = await page.locator('[data-timeline-row-kind="message"]')
    .evaluateAll((rows) => rows.map((row) => row.querySelector('p.tabular-nums')?.textContent.trim() ?? ""));
  const fold = page.locator('[data-timeline-row-kind="turn-fold"] button');
  await fold.waitFor();
  if (!(await fold.innerText()).includes("Worked for")) throw new Error("Native worked row was absent");

  const save = async (phase) => {
    const html = (await page.locator("#root").evaluate((element) => element.innerHTML))
      .replaceAll("/tmp/hyfrme-t3-demo/registry/blocks/", "registry/blocks/");
    if (/\/home\/|\/tmp\/hyfrme-t3|auth[_-]?token|session[_-]?token/i.test(html)) {
      throw new Error(`Captured ${phase} DOM includes local fixture or credential text`);
    }
    await writeFile(resolve(source, `worked-trace-${phase}.html`), html);
  };
  await save("closed");
  for (let frame = 0; frame < frames; frame++) {
    if (frame === openFrame) {
      await fold.click();
      await page.waitForTimeout(500);
      const group = page.locator('[data-timeline-row-kind="work-toggle"] button');
      await group.waitFor();
      if (!(await group.innerText()).includes("Ran 1 command")) {
        throw new Error("Native command-group row was absent");
      }
      await page.mouse.move(800, 50);
      await save("fold-open");
    }
    if (frame === groupFrame) {
      await page.locator('[data-timeline-row-kind="work-toggle"] button').click();
      await page.waitForTimeout(500);
      activityRows = await page.locator('[data-timeline-row-kind="work"]')
        .evaluateAll((rows) => rows.map((row) => row.innerText.trim()));
      if (!activityRows.some((row) => row.includes("npm run verify:showcases"))) {
        throw new Error(`Native expanded trace lacks the command activity: ${JSON.stringify(activityRows)}`);
      }
      await page.mouse.move(800, 50);
      await save("command-open");
    }
    if (frame === closeFrame) {
      await fold.click();
      await page.waitForTimeout(500);
      await page.mouse.move(800, 50);
      await save("reclosed");
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
  ["closed", "fold-open", "command-open", "reclosed"].map(async (phase) => [
    phase, hash(await readFile(resolve(source, `worked-trace-${phase}.html`))),
  ]),
));
await writeFile(resolve(source, "worked-trace-fixture.json"), `${JSON.stringify({
  sourceTag: baseFixture.sourceTag,
  sourceCommit: baseFixture.sourceCommit,
  sourceHashes: baseFixture.sourceHashes,
  captureBrowser: { executable: browserExecutable, version: browserVersion, flags: browserFlags },
  viewport: baseFixture.viewport,
  fps,
  frames,
  openFrame,
  groupFrame,
  closeFrame,
  threadAges,
  messageTimes,
  activityRows,
  sourceDomHashes,
  referenceSha256: hash(await readFile(reference)),
}, null, 2)}\n`);
console.log(`Captured ${frames} native T3 Code Worked Trace frames with ${activityRows.length} activity rows.`);
