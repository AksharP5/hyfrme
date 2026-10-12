import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.35");
const base = JSON.parse(await readFile(resolve(source, "brief-fixture.json"), "utf8"));
const url = process.env.T3_REFERENCE_URL;
const storageState = process.env.T3_STORAGE_STATE;
const executablePath = process.env.HYFRME_CHROMIUM;
if (!url || !storageState || !executablePath) throw new Error("Set isolated T3 URL, paired state, and HyperFrames Chromium path.");
const browserVersion = spawnSync(executablePath, ["--version"], { encoding: "utf8" });
if (browserVersion.status !== 0 || browserVersion.stdout.trim() !== "Google Chrome for Testing 152.0.7977.30") {
  throw new Error(`Unexpected Chromium version: ${browserVersion.stdout.trim()}`);
}
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
for (const [path, expected] of [
  ["/", base.sourceHashes.index],
  ["/assets/index-DSuALXPn.css", base.sourceHashes.css],
  ["/assets/index-CI6tzIRc.js", base.sourceHashes.js],
]) {
  const response = await fetch(new URL(path, url));
  if (!response.ok || hash(Buffer.from(await response.arrayBuffer())) !== expected) {
    throw new Error(`${path} differs from the pinned T3 Code build`);
  }
}

const phases = ["before", "chooser", "stacked", "split"];
const events = { chooser: 20, stacked: 45, split: 80 };
const frames = 120;
const fps = 30;
const work = resolve(root, ".work/t3-diff-review-reference");
const reference = resolve(root, "parity/t3-diff-review-reference.mkv");
const fixtureProject = resolve(root, ".work/t3-diff-review-project");
const changedFile = "registry/blocks/logo-enter/logo-enter.html";
await mkdir(work, { recursive: true });
const diff = spawnSync("git", ["diff", "--numstat", "--", changedFile], { cwd: fixtureProject, encoding: "utf8" });
if (diff.status !== 0 || !/^4\s+1\s+registry\/blocks\/logo-enter\/logo-enter\.html\s*$/.test(diff.stdout)) {
  throw new Error(`Expected the real Hyfrme Logo Enter Git change: ${diff.stdout} ${diff.stderr}`);
}

const browser = await chromium.launch({
  executablePath, headless: true,
  args: [
    "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none",
    "--force-color-profile=srgb", "--use-gl=angle", "--use-angle=gl-egl",
    "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
  ],
});
const shadowCounts = {};
try {
  const page = await browser.newPage({ viewport: base.viewport, deviceScaleFactor: 1, colorScheme: "dark", storageState });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  await page.getByText("Build a logo intro", { exact: true }).click();
  await page.waitForTimeout(1200);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(650, 50);
  await page.waitForTimeout(250);

  const snapshot = async (phase) => {
    const { html, shadows } = await page.evaluate(() => {
      const app = document.querySelector("#root");
      const hosts = [...app.querySelectorAll("*")].filter((element) => element.shadowRoot);
      const shadows = hosts.map((host, index) => {
        const id = `shadow-${index}`;
        host.setAttribute("data-hyfrme-shadow-id", id);
        return {
          id, tag: host.tagName, html: host.shadowRoot.innerHTML,
          adoptedCss: [...host.shadowRoot.adoptedStyleSheets].map((sheet) =>
            [...sheet.cssRules].map((rule) => rule.cssText).join("\n")),
        };
      });
      return { html: app.innerHTML, shadows };
    });
    const sanitize = (value) => value
      .replaceAll(fixtureProject, "hyfrme-project")
      .replaceAll("/tmp/hyfrme-t3-demo", "hyfrme-project");
    const safeHtml = sanitize(html);
    const safeShadows = shadows.map((shadow) => ({
      ...shadow, html: sanitize(shadow.html), adoptedCss: shadow.adoptedCss.map(sanitize),
    }));
    if (/\/home\/|\/tmp\/hyfrme-t3|127\.0\.0\.1:38\d\d|blob:|playwright-state|auth[_-]?token|session[_-]?token/i.test(`${safeHtml}\n${JSON.stringify(safeShadows)}`)) {
      throw new Error(`Local or private content in ${phase} snapshot`);
    }
    await writeFile(resolve(source, `diff-review-${phase}.html`), safeHtml);
    await writeFile(resolve(source, `diff-review-${phase}-shadows.json`), `${JSON.stringify(safeShadows)}\n`);
    shadowCounts[phase] = safeShadows.map(({ tag, html, adoptedCss }) => ({ tag, bytes: html.length, adoptedSheets: adoptedCss.length }));
  };
  await snapshot("before");
  for (let frame = 0; frame < frames; frame++) {
    if (frame === events.chooser) {
      await page.getByRole("button", { name: "Toggle right panel" }).click();
      await page.locator('[aria-label="Open a surface"]').getByRole("button", { name: /Diff/ }).waitFor();
      await page.mouse.move(650, 50);
      await page.waitForTimeout(350);
      await snapshot("chooser");
    }
    if (frame === events.stacked) {
      await page.locator('[aria-label="Open a surface"]').getByRole("button", { name: /Diff/ }).click();
      await page.locator('diffs-container').waitFor({ timeout: 15000 });
      await page.waitForFunction(() => {
        const root = document.querySelector('diffs-container')?.shadowRoot;
        return !!root?.querySelector('[data-diffs-header]');
      });
      await page.waitForTimeout(450);
      await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
      await page.mouse.move(650, 50);
      await snapshot("stacked");
    }
    if (frame === events.split) {
      await page.locator('[aria-label="Split diff view"]').click();
      await page.waitForTimeout(400);
      await page.mouse.move(650, 50);
      await snapshot("split");
    }
    await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
} finally {
  await browser.close();
}
const encoded = spawnSync("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference,
], { encoding: "utf8" });
if (encoded.status !== 0) throw new Error(encoded.stderr);
await writeFile(resolve(source, "diff-review-fixture.json"), `${JSON.stringify({
  sourceTag: base.sourceTag,
  sourceCommit: base.sourceCommit,
  sourceHashes: base.sourceHashes,
  viewport: base.viewport,
  fps, frames, phases, events,
  changedFile, additions: 4, deletions: 1, shadowCounts,
  sourceDomHashes: Object.fromEntries(await Promise.all(phases.map(async (phase) =>
    [phase, hash(await readFile(resolve(source, `diff-review-${phase}.html`)))]))),
  shadowHashes: Object.fromEntries(await Promise.all(phases.map(async (phase) =>
    [phase, hash(await readFile(resolve(source, `diff-review-${phase}-shadows.json`)))]))),
  referenceSha256: hash(await readFile(reference)),
}, null, 2)}\n`);
console.log(`Captured ${frames} native T3 Code Diff Review frames.`);
