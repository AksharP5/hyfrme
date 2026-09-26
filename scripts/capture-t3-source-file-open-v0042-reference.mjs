import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const theme = process.argv[2] ?? "dark";
if (theme !== "dark" && theme !== "light") throw new Error("Expected dark or light theme");
const suffix = theme === "light" ? "-light" : "";
const baseFixture = JSON.parse(await readFile(resolve(source, `file-surface${suffix}-fixture.json`), "utf8"));
const serverLog = resolve(root, ".work/t3-v0042-sidebar-server.log");
const url = (await readFile(serverLog, "utf8")).match(/Pairing URL: (\S+)/)?.[1];
const browserExecutable = process.env.HYFRME_CHROMIUM;
if (!url || !browserExecutable) throw new Error("Start the isolated v0.0.42 sidebar server and set HYFRME_CHROMIUM");
const browserVersionResult = spawnSync(browserExecutable, ["--version"], { encoding: "utf8" });
const browserVersion = browserVersionResult.stdout.trim();
if (browserVersionResult.status !== 0 || browserVersion !== "Google Chrome for Testing 152.0.7977.30") {
  throw new Error(`Expected Chrome Headless Shell 152.0.7977.30; found ${browserVersion}`);
}
const browserFlags = [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none",
  "--force-color-profile=srgb", "--use-gl=angle", "--use-angle=gl-egl",
  "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
for (const [path, expected] of [
  ["/", baseFixture.sourceHashes.index],
  ["/assets/main-x9o7QJ8O.css", baseFixture.sourceHashes.css],
  ["/assets/index-BMH8bO9q.js", baseFixture.sourceHashes.js],
]) {
  const response = await fetch(new URL(path, url));
  if (!response.ok || hash(Buffer.from(await response.arrayBuffer())) !== expected) {
    throw new Error(`${path} differs from the pinned v0.0.42 release`);
  }
}

const fps = 30;
const frames = 120;
const events = { registry: 20, blocks: 40, logoEnter: 60, openFile: 80 };
const prefix = `source-file-open${suffix}`;
const work = resolve(root, `.work/t3-${prefix}-v0042-reference`);
const reference = resolve(root, `parity/t3-source-file-open-v0042${suffix}-reference.mkv`);
const projectPath = resolve(root, ".work/t3-v0042-sidebar-project");
const sourceFile = resolve(projectPath, "registry/blocks/logo-enter/logo-enter.html");
const sourceFileSha256 = hash(await readFile(sourceFile));
await copyFile(sourceFile, resolve(source, "source-file-open-seeded-source.html"));
await mkdir(work, { recursive: true });

const phases = ["files", "registry", "blocks", "logo-enter", "opened"];
const shadowCounts = {};
const rowAnimations = {};
const browser = await chromium.launch({ executablePath: browserExecutable, headless: true, args: browserFlags });
try {
  const page = await browser.newPage({ viewport: baseFixture.viewport, deviceScaleFactor: 1, colorScheme: theme });
  await page.clock.setFixedTime(new Date("2026-09-25T11:30:00Z"));
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  if (theme === "dark" && !await page.locator("html.dark").count()) throw new Error("T3 Code did not enter dark theme");
  if (theme === "light" && await page.locator("html.dark").count()) throw new Error("T3 Code did not enter light theme");
  if (!await page.getByText("GPT-6-Astra", { exact: true }).count()) throw new Error("Seeded composer model differs from File Surface");
  await page.waitForTimeout(1200);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.evaluate(() => document.fonts.ready);
  if (!page.url().includes("/draft/")) throw new Error("Expected a real new-thread draft");
  await page.getByRole("button", { name: "Toggle right panel" }).click();
  await page.locator('[aria-label="Open a surface"]').getByRole("button", { name: /Files/ }).click();
  const tree = page.locator('file-tree-container[aria-label="hyfrme files"]');
  await tree.waitFor();
  await tree.locator('button[data-item-path="registry/"]').waitFor();
  await page.mouse.move(650, 400);
  await page.waitForTimeout(350);

  const save = async (phase) => {
    const result = await page.locator("#root").evaluate((element) => {
      const hosts = [...element.querySelectorAll("*")].filter((host) => host.shadowRoot);
      const shadows = hosts.map((host, index) => {
        const id = `shadow-${index}`;
        host.setAttribute("data-hyfrme-shadow-id", id);
        return {
          id,
          tag: host.tagName,
          html: host.shadowRoot.innerHTML,
          css: [...host.shadowRoot.adoptedStyleSheets]
            .map((sheet) => [...sheet.cssRules].map((rule) => rule.cssText).join("\n")),
        };
      });
      return { html: element.innerHTML, shadows };
    });
    const sanitize = (value) => value.replaceAll(projectPath, "hyfrme-demo")
      .replaceAll("/tmp/hyfrme-t3-demo", "hyfrme-demo");
    const html = sanitize(result.html);
    const shadows = result.shadows.map((shadow) => ({
      ...shadow,
      html: sanitize(shadow.html),
      css: shadow.css.map(sanitize),
    }));
    if (/\/home\/|\/tmp\/hyfrme-t3|127\.0\.0\.1:38\d\d|auth[_-]?token|session[_-]?token/i.test(html + JSON.stringify(shadows))) {
      throw new Error(`${phase} source includes local path or credential text`);
    }
    await writeFile(resolve(source, `${prefix}-${phase}.html`), html);
    await writeFile(resolve(source, `${prefix}-${phase}-shadows.json`), JSON.stringify(shadows) + "\n");
    shadowCounts[phase] = shadows.map(({ tag, html, css }) => ({ tag, htmlBytes: html.length, adoptedSheets: css.length }));
  };
  await save("files");

  const clickTreeRow = async (path, next, phase) => {
    const row = tree.locator(`button[data-item-path="${path}"]`);
    await row.click();
    rowAnimations[phase] = await row.evaluate((element, currentPhase) => element.getAnimations({ subtree: true })
      .map((animation) => {
        const duration = animation.effect?.getComputedTiming().duration;
        if (currentPhase === "opened" && duration === 150) {
          animation.pause();
          animation.currentTime = 0;
        }
        return {
          duration,
          easing: animation.effect?.getTiming().easing,
          keyframes: animation.effect?.getKeyframes(),
          target: animation.effect?.target?.outerHTML.slice(0, 350),
        };
      }).filter(({ duration }) => duration > 0), phase);
    if (rowAnimations[phase].length && (phase !== "opened" ||
      rowAnimations[phase].length !== 1 || rowAnimations[phase][0].duration !== 150 ||
      !rowAnimations[phase][0].target.includes('data-item-section="spacing-item"'))) {
      await writeFile(resolve(work, "motion-debug.json"), JSON.stringify({ phase, animations: rowAnimations[phase] }, null, 2) + "\n");
      throw new Error(`${phase} has native motion that requires frame sampling`);
    }
    if (next) await tree.locator(`button[data-item-path="${next}"]`).waitFor({ timeout: 10000 });
    await page.mouse.move(650, 400);
    await page.waitForTimeout(250);
    if (phase !== "opened") await save(phase);
  };

  for (let frame = 0; frame < frames; frame++) {
    if (frame === events.registry) await clickTreeRow("registry/", "registry/blocks/", "registry");
    if (frame === events.blocks) await clickTreeRow("registry/blocks/", "registry/blocks/logo-enter/", "blocks");
    if (frame === events.logoEnter) await clickTreeRow("registry/blocks/logo-enter/", "registry/blocks/logo-enter/logo-enter.html", "logo-enter");
    if (frame === events.openFile) {
      await clickTreeRow("registry/blocks/logo-enter/logo-enter.html", null, "opened");
      await page.locator("[data-file-breadcrumbs]").waitFor({ timeout: 10000 });
      await page.getByRole("button", { name: "Show HTML source" }).click();
      await page.locator(".file-preview-virtualizer").waitFor({ timeout: 10000 });
      await page.locator("diffs-container").waitFor({ timeout: 10000 });
      const sourceVisible = await page.locator("diffs-container").evaluate((host) => host.shadowRoot?.textContent?.includes("Logo Enter"));
      if (!sourceVisible) throw new Error("Native source file contents did not render");
      await page.mouse.move(650, 400);
      await page.waitForTimeout(400);
      await save("opened");
    }
    if (frame >= events.openFile && frame < events.openFile + 5) {
      await tree.evaluate((element, ms) => {
        const guide = element.shadowRoot.querySelector('[data-item-section="spacing-item"][data-ancestor-path="registry/blocks/logo-enter/"]');
        if (!guide) throw new Error("Missing native file-tree indent guide");
        const animation = guide.getAnimations().find((item) => item.effect?.getComputedTiming().duration === 150);
        if (!animation) throw new Error("Missing native file-open indent fade");
        animation.currentTime = ms;
      }, (frame - events.openFile) * 1000 / fps);
    }
    if (frame === events.openFile + 5) {
      await tree.evaluate((element) => {
        const guide = element.shadowRoot.querySelector('[data-item-section="spacing-item"][data-ancestor-path="registry/blocks/logo-enter/"]');
        guide?.getAnimations().forEach((animation) => animation.finish());
      });
    }
    await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
} catch (error) {
  throw new Error(String(error).replaceAll(url, "[pairing URL redacted]"));
} finally {
  await browser.close();
}

const encode = spawnSync("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3",
  "-pix_fmt", "gbrp", reference,
], { encoding: "utf8" });
if (encode.status !== 0) throw new Error(encode.stderr);
const sourceDomHashes = Object.fromEntries(await Promise.all(phases.map(async (phase) => [
  phase, hash(await readFile(resolve(source, `${prefix}-${phase}.html`))),
])));
const shadowHashes = Object.fromEntries(await Promise.all(phases.map(async (phase) => [
  phase, hash(await readFile(resolve(source, `${prefix}-${phase}-shadows.json`))),
])));
await writeFile(resolve(source, `${prefix}-fixture.json`), JSON.stringify({
  sourceTag: baseFixture.sourceTag,
  sourceCommit: baseFixture.sourceCommit,
  sourceHashes: baseFixture.sourceHashes,
  captureBrowser: { version: browserVersion, flags: browserFlags },
  viewport: baseFixture.viewport,
  theme,
  fps,
  frames,
  events,
  sourceMode: "The native HTML file defaults to rendered preview; this capture clicks Show HTML source immediately after opening it.",
  sourceFile: "registry/blocks/logo-enter/logo-enter.html",
  sourceFileSha256,
  shadowCounts,
  rowAnimations,
  sourceDomHashes,
  shadowHashes,
  referenceSha256: hash(await readFile(reference)),
}, null, 2) + "\n");
console.log(`Captured ${frames} ${theme} native v0.0.42 Source File Open frames.`);
