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
const menuFrame = 30;
const dialogFrame = 60;
const messageFrame = 90;
const commitMessage = "Polish Hyfrme Logo Enter timing and final hold";
const work = resolve(root, ".work/t3-commit-review-reference");
const reference = resolve(root, "parity/t3-commit-review-reference.mkv");
const fixturePath = resolve(root, ".work/t3-commit-review-project");
await mkdir(work, { recursive: true });

const browser = await chromium.launch({ executablePath: browserExecutable, headless: true, args: browserFlags });
let threadAges;
let threadBranches;
let settledAge;
let menuLabels;
let dialogText;
try {
  const page = await browser.newPage({ viewport: baseFixture.viewport, deviceScaleFactor: 1, colorScheme: "dark", storageState });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  await page.waitForTimeout(1300);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(700, 80);
  await page.waitForTimeout(300);
  if (!page.url().includes("/draft/")) throw new Error("Commit Review must begin on a real new-thread draft");
  threadAges = await page.locator('[data-testid="sidebar-row-card"]')
    .evaluateAll((rows) => rows.map((row) => row.querySelector('span.tabular-nums.text-secondary-label')?.textContent.trim()));
  threadBranches = await page.locator('[data-testid="sidebar-row-card"]')
    .evaluateAll((rows) => rows.map((row) => row.querySelector('span.whitespace-nowrap')?.textContent.trim()));
  settledAge = (await page.locator('[data-testid="sidebar-row-slim"] span.text-xs').textContent()).trim();
  const scrub = (html) => html.replaceAll(fixturePath, "hyfrme-demo").replaceAll("t3-commit-review-project", "hyfrme-demo");
  const save = async (phase, portal = false) => {
    const raw = portal
      ? await page.locator(`[data-base-ui-portal]:has([role="${phase === "menu" ? "menu" : "dialog"}"])`).evaluate((element) => element.outerHTML)
      : await page.locator("#root").evaluate((element) => element.innerHTML);
    const html = scrub(raw);
    if (/\/home\/|\/tmp\/hyfrme-t3|127\.0\.0\.1:38\d\d|auth[_-]?token|session[_-]?token/i.test(html)) {
      throw new Error(`Captured ${phase} ${portal ? "portal" : "root"} contains local fixture or credential text`);
    }
    await writeFile(resolve(source, `commit-review-${phase}${portal ? "-portal" : ""}.html`), html);
  };
  await save("before");

  for (let frame = 0; frame < frames; frame++) {
    if (frame === menuFrame) {
      await page.getByRole("button", { name: "Git action options" }).click();
      const menu = page.getByRole("menu");
      await menu.waitFor();
      menuLabels = await menu.getByRole("menuitem").allTextContents();
      if (!menuLabels.includes("Commit")) throw new Error(`Native T3 Git menu lacks Commit: ${JSON.stringify(menuLabels)}`);
      await page.mouse.move(700, 80);
      await page.waitForTimeout(350);
      await save("menu");
      await save("menu", true);
    }
    if (frame === dialogFrame) {
      await page.getByRole("menuitem", { name: "Commit", exact: true }).click();
      const dialog = page.getByRole("dialog");
      await dialog.waitFor();
      await page.waitForTimeout(450);
      dialogText = await dialog.innerText();
      for (const expected of ["feature/logo-enter", "registry/blocks/logo-enter/logo-enter.html", "+4 / -1"]) {
        if (!dialogText.includes(expected)) throw new Error(`Native commit review lacks ${expected}`);
      }
      await save("dialog");
      await save("dialog", true);
    }
    if (frame === messageFrame) {
      const textarea = page.getByRole("dialog").locator("textarea");
      await textarea.fill(commitMessage);
      await textarea.evaluate((element) => element.blur());
      await page.waitForTimeout(350);
      await save("message");
      await save("message", true);
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
const phases = ["before", "menu", "menu-portal", "dialog", "dialog-portal", "message", "message-portal"];
const sourceDomHashes = Object.fromEntries(await Promise.all(phases.map(async (phase) => [
  phase, hash(await readFile(resolve(source, `commit-review-${phase}.html`))),
])));
await writeFile(resolve(source, "commit-review-fixture.json"), `${JSON.stringify({
  sourceTag: baseFixture.sourceTag,
  sourceCommit: baseFixture.sourceCommit,
  sourceHashes: baseFixture.sourceHashes,
  captureBrowser: { executable: browserExecutable.split("/").at(-1), version: browserVersion, flags: browserFlags },
  viewport: baseFixture.viewport,
  fps,
  frames,
  menuFrame,
  dialogFrame,
  messageFrame,
  commitMessage,
  branch: "feature/logo-enter",
  changedFile: "registry/blocks/logo-enter/logo-enter.html",
  insertions: 4,
  deletions: 1,
  threadAges,
  threadBranches,
  settledAge,
  menuLabels,
  dialogText,
  sourceDomHashes,
  referenceSha256: hash(await readFile(reference)),
}, null, 2)}\n`);
console.log(`Captured ${frames} native T3 Code Commit Review frames; the dialog reports Logo Enter +4/-1.`);
