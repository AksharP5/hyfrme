import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const release = resolve(root, ".work/t3-v0042-bin/t3-0.0.42-linux-x64");
const source = resolve(root, "assets/t3-code/v0.0.42");
const baseFixture = JSON.parse(await readFile(resolve(source, "brief-v0042-fixture.json"), "utf8"));
const theme = process.argv[2] ?? "dark";
if (theme !== "dark" && theme !== "light") throw new Error("Expected dark or light theme");
const suffix = theme === "light" ? "-light" : "";
const prefix = `permission-choice${suffix}`;
const work = resolve(root, `.work/t3-${prefix}-v0042-reference`);
const baseDir = resolve(root, `.work/t3-${prefix}-v0042-fixture`);
const reference = resolve(root, `parity/t3-permission-choice-v0042${suffix}-reference.mkv`);
const executablePath = process.env.HYFRME_CHROMIUM;
if (!executablePath) throw new Error("Set HYFRME_CHROMIUM to Chrome Headless Shell 152");
const browserVersion = spawnSync(executablePath, ["--version"], { encoding: "utf8" });
if (browserVersion.status !== 0 || browserVersion.stdout.trim() !== "Google Chrome for Testing 152.0.7977.30") throw new Error("Unexpected Chrome build");
const version = spawnSync(resolve(release, "t3"), ["--version"], { encoding: "utf8" });
if (version.status !== 0 || version.stdout.trim() !== "t3 v0.0.42") throw new Error("Unexpected T3 Code build");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const frames = 120;
const fps = 30;
const events = { open: 25, hover: 55, select: 85 };
const prompt = "Update the Hyfrme logo component source.";
const permissionBefore = "Full access";
const permissionAfter = "Auto-accept edits";
await cp(resolve(root, ".work/t3-v0042-composer-fixture"), baseDir, { recursive: true, force: true });
await mkdir(work, { recursive: true });
const port = theme === "dark" ? 3923 : 3924;
const server = spawn(resolve(release, "t3"), ["serve", "--base-dir", baseDir, "--host", "127.0.0.1", "--port", String(port), "--no-browser"],
  { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
let serverOutput = "";
server.stdout.on("data", (chunk) => { serverOutput += chunk; });
server.stderr.on("data", (chunk) => { serverOutput += chunk; });
const waitForUrl = async () => {
  for (let attempt = 0; attempt < 120; attempt++) {
    const url = serverOutput.match(/Pairing URL: (\S+)/)?.[1];
    if (url) return url;
    if (server.exitCode !== null) throw new Error("Native v0.0.42 server exited before pairing");
    await new Promise((done) => setTimeout(done, 250));
  }
  throw new Error("Native v0.0.42 server did not produce a pairing URL");
};
const browserFlags = ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
  "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer"];
let browser;
let popupBox;
let triggerBox;
const motion = {};
const phases = ["before", "menu", "hover", "after"];
try {
  const url = await waitForUrl();
  for (const [path, expected] of [["/", baseFixture.sourceHashes.index], ["/assets/main-x9o7QJ8O.css", baseFixture.sourceHashes.css],
    ["/assets/index-BMH8bO9q.js", baseFixture.sourceHashes.js]]) {
    const response = await fetch(new URL(path, url));
    if (!response.ok || hash(Buffer.from(await response.arrayBuffer())) !== expected) throw new Error(`${path} differs from official v0.0.42`);
  }
  browser = await chromium.launch({ executablePath, headless: true, args: browserFlags });
  const page = await browser.newPage({ viewport: baseFixture.viewport, deviceScaleFactor: 1, colorScheme: theme });
  await page.addInitScript(() => {
    window.__permissionAnimations = [];
    window.__capturePermissionAnimations = false;
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const animation = animate.apply(this, args);
      if (window.__capturePermissionAnimations) {
        animation.pause();
        animation.currentTime = 0;
        window.__permissionAnimations.push(animation);
      }
      return animation;
    };
  });
  await page.clock.setFixedTime(new Date("2026-09-25T11:30:00Z"));
  await page.goto(url, { waitUntil: "domcontentloaded" });
  const editor = page.locator('[data-testid="composer-editor"]');
  await editor.waitFor({ timeout: 20000 });
  if (theme === "dark" && !await page.locator("html.dark").count()) throw new Error("Native theme is not dark");
  if (theme === "light" && await page.locator("html.dark").count()) throw new Error("Native theme is not light");
  await page.waitForTimeout(950);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.evaluate(() => document.fonts.ready);
  const trigger = page.getByRole("combobox", { name: "Runtime mode" });
  await trigger.waitFor();
  if (!(await trigger.innerText()).includes(permissionBefore)) {
    await trigger.click();
    await page.getByRole("option", { name: new RegExp(permissionBefore) }).click();
  }
  await editor.fill(prompt);
  await editor.evaluate((element) => element.blur());
  await page.mouse.move(800, 80);
  await page.waitForTimeout(250);
  const saveRoot = async (phase) => {
    const html = (await page.locator("#root").evaluate((element) => element.innerHTML))
      .replaceAll(resolve(root, ".work/t3-v0042-composer-project"), "hyfrme-demo");
    if (/\/home\/|auth[_-]?token|session[_-]?token|127\.0\.0\.1:39\d\d/i.test(html)) throw new Error(`${phase} contains private fixture data`);
    await writeFile(resolve(source, `${prefix}-${phase}.html`), html);
  };
  const savePortal = async (phase) => {
    const html = await page.locator('[data-base-ui-portal]:has([data-slot="select-popup"])').last().evaluate((element) => element.outerHTML);
    if (/\/home\/|auth[_-]?token|session[_-]?token/i.test(html)) throw new Error(`${phase} portal contains private fixture data`);
    await writeFile(resolve(source, `${prefix}-${phase}-portal.html`), html);
  };
  const sampleMotion = async (phase) => {
    motion[phase] = await page.evaluate(() => window.__permissionAnimations.map((animation) => ({
      target: animation.effect?.target?.getAttribute("data-slot") ?? animation.effect?.target?.tagName,
      duration: animation.effect?.getTiming().duration,
      easing: animation.effect?.getTiming().easing,
      keyframes: animation.effect?.getKeyframes(),
    })));
  };
  await saveRoot("before");
  for (let frame = 0; frame < frames; frame++) {
    if (frame === events.open) {
      await page.evaluate(() => { window.__capturePermissionAnimations = true; window.__permissionAnimations = []; });
      await trigger.click();
      const popup = page.locator('[data-slot="select-popup"]').last();
      await popup.waitFor({ state: "visible" });
      await page.evaluate(() => {
        window.__capturePermissionAnimations = false;
        for (const animation of document.getAnimations()) {
          if (!window.__permissionAnimations.includes(animation)) {
            animation.pause(); animation.currentTime = 0; window.__permissionAnimations.push(animation);
          }
        }
      });
      popupBox = await popup.boundingBox();
      triggerBox = await trigger.boundingBox();
      if (!popupBox || !triggerBox || Math.abs(popupBox.x - triggerBox.x) > 30) throw new Error("Permission popup is not attached to the composer control");
      await sampleMotion("open");
      await saveRoot("menu");
      await savePortal("menu");
    }
    if (frame >= events.open && frame < events.hover) {
      await page.evaluate((ms) => { for (const animation of window.__permissionAnimations) animation.currentTime = Math.min(150, ms); },
        (frame - events.open) * 1000 / fps);
    }
    if (frame === events.hover) {
      await page.evaluate(() => { window.__capturePermissionAnimations = true; window.__permissionAnimations = []; });
      await page.getByRole("option", { name: new RegExp(permissionAfter) }).hover();
      await page.evaluate(() => {
        window.__capturePermissionAnimations = false;
        for (const animation of document.getAnimations()) {
          if (!window.__permissionAnimations.includes(animation)) {
            animation.pause(); animation.currentTime = 0; window.__permissionAnimations.push(animation);
          }
        }
      });
      await sampleMotion("hover");
      await saveRoot("hover");
      await savePortal("hover");
    }
    if (frame >= events.hover && frame < events.select) {
      await page.evaluate((ms) => { for (const animation of window.__permissionAnimations) animation.currentTime = Math.min(150, ms); },
        (frame - events.hover) * 1000 / fps);
    }
    if (frame === events.select) {
      await page.getByRole("option", { name: new RegExp(permissionAfter) }).click();
      await page.waitForFunction((expected) => document.querySelector('[aria-label="Runtime mode"]')?.textContent?.includes(expected), permissionAfter);
      await saveRoot("after");
    }
    await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
} catch (error) {
  throw new Error(String(error).replace(/http:\/\/127\.0\.0\.1:\d+\/?\S*/g, "[pairing URL redacted]"));
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
const encode = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
if (encode.status !== 0) throw new Error(encode.stderr);
const popupRasterHashes = {};
for (const [phase, frame] of [["menu", events.open], ["hover", events.hover]]) {
  const file = `permission-choice-${theme}-${phase}-raster.png`;
  const crop = spawnSync("magick", [resolve(work, `frame-${String(frame).padStart(4, "0")}.png`),
    "-crop", "389x266+583+367", "+repage", resolve(source, file)], { encoding: "utf8" });
  if (crop.status !== 0) throw new Error(crop.stderr);
  popupRasterHashes[file] = hash(await readFile(resolve(source, file)));
}
await writeFile(resolve(source, `${prefix}-fixture.json`), JSON.stringify({
  sourceTag: baseFixture.sourceTag, sourceCommit: baseFixture.sourceCommit, sourceHashes: baseFixture.sourceHashes,
  captureBrowser: { version: browserVersion.stdout.trim(), flags: browserFlags },
  viewport: baseFixture.viewport, theme, fps, frames, events, prompt, permissionBefore, permissionAfter,
  popupBox, triggerBox, motion,
  sourceDomHashes: Object.fromEntries(await Promise.all(phases.map(async (phase) => [phase, hash(await readFile(resolve(source, `${prefix}-${phase}.html`)))]))),
  portalHashes: Object.fromEntries(await Promise.all(["menu", "hover"].map(async (phase) => [phase, hash(await readFile(resolve(source, `${prefix}-${phase}-portal.html`)))]))),
  popupRasterHashes,
  referenceSha256: hash(await readFile(reference)),
}, null, 2) + "\n");
console.log(`Captured ${frames} ${theme} native v0.0.42 Permission Choice frames.`);
