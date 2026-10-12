import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.35");
const fixtureBase = JSON.parse(await readFile(resolve(source, "brief-fixture.json"), "utf8"));
const url = process.env.T3_REFERENCE_URL;
const storageState = process.env.T3_STORAGE_STATE;
const browserExecutable = process.env.HYFRME_CHROMIUM;
if (!url || !storageState || !browserExecutable) {
  throw new Error("Set T3_REFERENCE_URL, T3_STORAGE_STATE, and HYFRME_CHROMIUM for an isolated, paired T3 Code v0.0.35 fixture.");
}
const browserVersionResult = spawnSync(browserExecutable, ["--version"], { encoding: "utf8" });
if (browserVersionResult.status !== 0) throw new Error(browserVersionResult.stderr);
const browserVersion = browserVersionResult.stdout.trim();
if (browserVersion !== "Google Chrome for Testing 152.0.7977.30") {
  throw new Error(`Expected HyperFrames Chrome Headless Shell 152.0.7977.30; found ${browserVersion}`);
}
const browserFlags = [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none",
  "--force-color-profile=srgb", "--use-gl=angle", "--use-angle=gl-egl",
  "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
];

const name = "thread-search";
const frames = 120;
const fps = 30;
const work = resolve(root, ".work/t3-thread-search-reference");
const reference = resolve(root, "parity/t3-thread-search-reference.mkv");
const hash = (value) => createHash("sha256").update(value).digest("hex");
const queries = [];
const first = "logo";
const final = "grouped logo";
for (let frame = 0; frame < frames; frame++) {
  if (frame < 10) queries.push("");
  else if (frame < 30) queries.push(first.slice(0, Math.min(first.length, Math.floor((frame - 10) / 5) + 1)));
  else if (frame < 56) queries.push(first);
  else if (frame < 60) queries.push(first.slice(0, 59 - frame));
  else queries.push(final.slice(0, Math.min(final.length, Math.floor((frame - 60) / 4) + 1)));
}
await mkdir(work, { recursive: true });

const browser = await chromium.launch({
  executablePath: browserExecutable,
  headless: true,
  args: browserFlags,
});
const stateFiles = {};
const stateKeys = [];
const threadRows = {};
let nativeAges = {};
try {
  const page = await browser.newPage({
    viewport: fixtureBase.viewport,
    deviceScaleFactor: 1,
    colorScheme: "dark",
    storageState,
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 15000 });
  await page.waitForTimeout(1200);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.waitForTimeout(500);
  const input = page.locator('input[aria-label="Search threads"]');
  let previous;
  let currentStateKey;
  for (let frame = 0; frame < frames; frame++) {
    const query = queries[frame];
    if (query !== previous) {
      await input.fill(query);
      await input.evaluate((element) => element.blur());
      await page.waitForTimeout(80);
      currentStateKey = `${frame}:${query}`;
      const file = `${name}-state-${String(Object.keys(stateFiles).length).padStart(2, "0")}.html`;
      await writeFile(resolve(source, file), await page.locator("#root").evaluate((element) => element.outerHTML));
      stateFiles[currentStateKey] = file;
      if (frame === 0) {
        nativeAges = await page.locator('[data-testid="sidebar-row-card"]').evaluateAll((rows) =>
          Object.fromEntries(rows.map((row) => [
            row.textContent.trim().split(/\s{2,}|\n/)[0],
            row.querySelector('span.tabular-nums.text-secondary-label')?.textContent.trim() ?? "",
          ])),
        );
      }
      previous = query;
    }
    stateKeys.push(currentStateKey);
    await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
  for (const title of [
    "Build a logo intro", "Catalog motion audit", "Grouped logo tests",
    "Review final hold", "Search reveal timing", "Verify Logo Enter parity",
  ]) {
    await input.fill(title);
    await page.waitForTimeout(80);
    threadRows[title] = await page.locator("#sidebar-thread-search-results li").first().evaluate((element) => element.outerHTML);
  }
} finally {
  await browser.close();
}

const encoded = spawnSync("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3",
  "-pix_fmt", "gbrp", reference,
], { encoding: "utf8" });
if (encoded.status !== 0) throw new Error(encoded.stderr);
const fixture = {
  sourceTag: fixtureBase.sourceTag,
  sourceCommit: fixtureBase.sourceCommit,
  sourceHashes: fixtureBase.sourceHashes,
  captureBrowser: { executable: browserExecutable, version: browserVersion, flags: browserFlags },
  viewport: fixtureBase.viewport,
  fps,
  frames,
  queries,
  stateKeys,
  firstQuery: first,
  finalQuery: final,
  stateFiles: Object.fromEntries(await Promise.all(Object.entries(stateFiles).map(async ([query, file]) =>
    [query, { file, sha256: hash(await readFile(resolve(source, file))) }],
  ))),
  threadRows,
  nativeAges,
  referenceSha256: hash(await readFile(reference)),
};
await writeFile(resolve(source, `${name}-fixture.json`), `${JSON.stringify(fixture, null, 2)}\n`);
console.log(`Captured ${frames} native T3 Code Thread Search frames and ${Object.keys(stateFiles).length} source DOM states.`);
