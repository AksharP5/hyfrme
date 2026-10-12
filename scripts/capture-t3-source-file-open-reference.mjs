import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const url = process.env.T3_REFERENCE_URL;
const storageState = process.env.T3_STORAGE_STATE;
if (!url || !storageState) throw new Error("Set T3_REFERENCE_URL and T3_STORAGE_STATE for the isolated pinned T3 Code fixture.");

const source = resolve(root, "assets/t3-code/v0.0.35");
const baseFixture = JSON.parse(await readFile(resolve(source, "brief-fixture.json"), "utf8"));
const work = resolve(root, ".work/t3-source-file-open-reference");
const reference = resolve(root, "parity/t3-source-file-open-reference.mkv");
const phases = ["before", "files", "expanded", "opened"];
const frames = 120;
const filesFrame = 20;
const expandFrame = 50;
const openFrame = 80;
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
await copyFile("/tmp/hyfrme-t3-demo/registry/blocks/logo-enter/logo-enter.html", resolve(source, "source-file-open-logo-enter.html"));

const browser = await chromium.launch({
  executablePath: process.env.HYFRME_CHROMIUM ?? "/usr/bin/chromium",
  headless: true,
  args: [
    "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none",
    "--force-color-profile=srgb", "--use-gl=angle", "--use-angle=gl-egl",
    "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
  ],
});
const shadowCounts = {};
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
  await page.waitForTimeout(500);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.mouse.move(800, 50);
  await page.waitForTimeout(250);

  const snapshot = async (phase) => {
    const { html, shadows } = await page.evaluate(() => {
      const app = document.querySelector("#root");
      const hosts = [...app.querySelectorAll("*")].filter((element) => element.shadowRoot);
      const shadows = hosts.map((host, index) => {
        const id = `shadow-${index}`;
        host.setAttribute("data-hyfrme-shadow-id", id);
        const adoptedCss = [...host.shadowRoot.adoptedStyleSheets].map((sheet) =>
          [...sheet.cssRules].map((rule) => rule.cssText).join("\n"));
        return { id, tag: host.tagName, html: host.shadowRoot.innerHTML, adoptedCss };
      });
      return { html: app.innerHTML, shadows };
    });
    const sanitize = (value) => value.replaceAll("/tmp/hyfrme-t3-demo/registry/blocks/", "registry/blocks/")
      .replaceAll("/tmp/hyfrme-t3-demo", "hyfrme-project");
    const safeHtml = sanitize(html);
    const safeShadows = shadows.map((shadow) => ({ ...shadow, html: sanitize(shadow.html), adoptedCss: shadow.adoptedCss.map(sanitize) }));
    const serialized = `${safeHtml}\n${JSON.stringify(safeShadows)}`;
    if (/\/home\/|\/tmp\/hyfrme-t3|127\.0\.0\.1:38\d\d|blob:|playwright-state|auth[_-]?token|session[_-]?token/i.test(serialized)) {
      throw new Error(`Local or private content in ${phase} source snapshot`);
    }
    await writeFile(resolve(source, `source-file-open-${phase}.html`), safeHtml);
    await writeFile(resolve(source, `source-file-open-${phase}-shadows.json`), `${JSON.stringify(safeShadows)}\n`);
    shadowCounts[phase] = safeShadows.map(({ tag, html, adoptedCss }) => ({ tag, bytes: html.length, adoptedSheets: adoptedCss.length }));
  };
  await snapshot("before");

  for (let frame = 0; frame < frames; frame++) {
    if (frame === filesFrame) {
      await page.getByRole("button", { name: /Toggle right panel/i }).click();
      await page.getByText("Files", { exact: true }).click();
      await page.locator('file-tree-container button[aria-label="registry / blocks / logo-enter"]').waitFor({ timeout: 15000 });
      await page.waitForTimeout(400);
      await page.mouse.move(800, 50);
      await snapshot("files");
    }
    if (frame === expandFrame) {
      await page.locator('file-tree-container button[aria-label="registry / blocks / logo-enter"]').click();
      await page.locator('file-tree-container button[aria-label="logo-enter.html"]').waitFor({ timeout: 10000 });
      await page.waitForTimeout(250);
      await page.mouse.move(800, 50);
      await snapshot("expanded");
    }
    if (frame === openFrame) {
      await page.locator('file-tree-container button[aria-label="logo-enter.html"]').click();
      await page.locator('[data-file-breadcrumbs]').waitFor({ timeout: 10000 });
      await page.locator('diffs-container').waitFor({ timeout: 10000 });
      await page.waitForTimeout(500);
      await page.mouse.move(800, 50);
      await snapshot("opened");
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
await writeFile(resolve(source, "source-file-open-fixture.json"), `${JSON.stringify({
  sourceTag: baseFixture.sourceTag,
  sourceCommit: baseFixture.sourceCommit,
  sourceHashes: baseFixture.sourceHashes,
  viewport: baseFixture.viewport,
  fps: 30,
  frames,
  filesFrame,
  expandFrame,
  openFrame,
  sourceFile: "registry/blocks/logo-enter/logo-enter.html",
  sourceFileSha256: hash(await readFile(resolve(source, "source-file-open-logo-enter.html"))),
  shadowCounts,
  sourceDomHashes: Object.fromEntries(await Promise.all(phases.map(async (phase) => [
    phase, hash(await readFile(resolve(source, `source-file-open-${phase}.html`))),
  ]))),
  shadowHashes: Object.fromEntries(await Promise.all(phases.map(async (phase) => [
    phase, hash(await readFile(resolve(source, `source-file-open-${phase}-shadows.json`))),
  ]))),
  referenceSha256: hash(await readFile(reference)),
}, null, 2)}\n`);
console.log(`Captured ${frames} native T3 Code Source File Open frames.`);
