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
const hoverFrame = 60;
const filesFrame = 80;
const work = resolve(root, ".work/t3-file-surface-reference");
const reference = resolve(root, "parity/t3-file-surface-reference.mkv");
const fixturePath = resolve(root, ".work/t3-file-surface-project");
await mkdir(work, { recursive: true });

const browser = await chromium.launch({ executablePath: browserExecutable, headless: true, args: browserFlags });
let threadAges;
let threadBranches;
let settledAge;
let surfaceLabels;
let fileRows;
try {
  const page = await browser.newPage({
    viewport: baseFixture.viewport,
    deviceScaleFactor: 1,
    colorScheme: "dark",
    storageState,
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  await page.waitForTimeout(1200);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(800, 50);
  await page.waitForTimeout(350);
  if (!page.url().includes("/draft/")) throw new Error("File Surface must begin on a real new-thread draft");
  threadAges = await page.locator('[data-testid="sidebar-row-card"]')
    .evaluateAll((rows) => rows.map((row) => row.querySelector('span.tabular-nums.text-secondary-label')?.textContent.trim()));
  threadBranches = await page.locator('[data-testid="sidebar-row-card"]')
    .evaluateAll((rows) => rows.map((row) => row.querySelector('span.whitespace-nowrap')?.textContent.trim()));
  settledAge = await page.locator('[data-testid="sidebar-row-slim"] span.text-xs').textContent();

  const saveRoot = async (phase) => {
    const html = (await page.locator("#root").evaluate((element) => element.innerHTML))
      .replaceAll(fixturePath, "hyfrme-demo")
      .replaceAll("/tmp/hyfrme-t3-demo", "hyfrme-demo");
    if (/\/home\/|\/tmp\/hyfrme-t3|127\.0\.0\.1:38\d\d|auth[_-]?token|session[_-]?token/i.test(html)) {
      throw new Error(`Captured ${phase} DOM includes local fixture or credential text`);
    }
    await writeFile(resolve(source, `file-surface-${phase}.html`), html);
  };
  await saveRoot("before");

  for (let frame = 0; frame < frames; frame++) {
    if (frame === openFrame) {
      await page.getByRole("button", { name: "Toggle right panel" }).click();
      const launcher = page.locator('[aria-label="Open a surface"]');
      await launcher.waitFor();
      surfaceLabels = await launcher.locator("button").allTextContents();
      if (!surfaceLabels.some((label) => /Files/.test(label))) throw new Error("Native T3 surface chooser has no Files option");
      await page.mouse.move(650, 50);
      await page.waitForTimeout(450);
      await saveRoot("chooser");
    }
    if (frame === hoverFrame) {
      await page.locator('[aria-label="Open a surface"]').getByRole("button", { name: /Files/ }).hover();
      await page.waitForTimeout(350);
      await saveRoot("hover");
    }
    if (frame === filesFrame) {
      await page.locator('[aria-label="Open a surface"]').getByRole("button", { name: /Files/ }).click();
      await page.locator('[data-file-browser-panel]').waitFor();
      await page.waitForTimeout(1000);
      await page.mouse.move(650, 400);
      await page.waitForTimeout(350);
      const tree = await page.locator('file-tree-container[aria-label="hyfrme files"]').evaluate((element) => {
        if (!element.shadowRoot) throw new Error("Native Files tree has no shadow root");
        return {
          html: element.shadowRoot.innerHTML,
          css: element.shadowRoot.adoptedStyleSheets.map((sheet) => [...sheet.cssRules].map((rule) => rule.cssText).join("\n")).join("\n"),
          rows: [...element.shadowRoot.querySelectorAll('button[data-type="item"]')].map((row) => row.getAttribute("data-item-path") ?? row.getAttribute("aria-label")),
        };
      });
      if (!tree.rows.some((row) => row.includes("registry"))) throw new Error("Native Files tree did not load the Hyfrme demo tree");
      fileRows = tree.rows;
      for (const [suffix, value] of [["tree", tree.html], ["tree-css", tree.css]]) {
        if (/\/home\/|\/tmp\/hyfrme-t3|127\.0\.0\.1:38\d\d|auth[_-]?token|session[_-]?token/i.test(value)) {
          throw new Error(`Captured ${suffix} includes local fixture or credential text`);
        }
        await writeFile(resolve(source, `file-surface-${suffix}.html`), value);
      }
      await saveRoot("files");
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
const phases = ["before", "chooser", "hover", "files", "tree", "tree-css"];
const sourceDomHashes = Object.fromEntries(await Promise.all(phases.map(async (phase) => [
  phase, hash(await readFile(resolve(source, `file-surface-${phase}.html`))),
])));
await writeFile(resolve(source, "file-surface-fixture.json"), `${JSON.stringify({
  sourceTag: baseFixture.sourceTag,
  sourceCommit: baseFixture.sourceCommit,
  sourceHashes: baseFixture.sourceHashes,
  captureBrowser: { executable: browserExecutable.split("/").at(-1), version: browserVersion, flags: browserFlags },
  viewport: baseFixture.viewport,
  fps,
  frames,
  openFrame,
  hoverFrame,
  filesFrame,
  threadAges,
  threadBranches,
  settledAge: settledAge.trim(),
  surfaceLabels,
  fileRows,
  sourceDomHashes,
  referenceSha256: hash(await readFile(reference)),
}, null, 2)}\n`);
console.log(`Captured ${frames} native T3 Code File Surface frames and the real Files shadow tree.`);
