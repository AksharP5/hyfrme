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
const theme = process.env.T3_REFERENCE_THEME ?? "dark";
if (!["dark", "light"].includes(theme)) throw new Error("T3_REFERENCE_THEME must be dark or light");
const executablePath = process.env.HYFRME_CHROMIUM;
if (!executablePath) throw new Error("Set HYFRME_CHROMIUM to the pinned Chrome executable");
const baseDir = resolve(root, `.work/t3-v0042-prompt-stash-${theme}-fixture`);
const prefix = `prompt-stash-v0042-${theme}`;
const work = resolve(root, `.work/t3-${prefix}-reference`);
const reference = resolve(root, `parity/t3-prompt-stash-v0042-${theme}-reference.mkv`);
const base = JSON.parse(await readFile(resolve(source, "brief-v0042-fixture.json"), "utf8"));
const prompt = "Make a Hyfrme Logo Enter cut with a longer final hold.";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const version = spawnSync(resolve(release, "t3"), ["--version"], { encoding: "utf8" });
if (version.status !== 0 || version.stdout.trim() !== "t3 v0.0.42") throw new Error("Wrong T3 Code release");
const chromeVersion = spawnSync(executablePath, ["--version"], { encoding: "utf8" });
if (chromeVersion.status !== 0 || chromeVersion.stdout.trim() !== "Google Chrome for Testing 152.0.7977.30") {
  throw new Error("Wrong capture browser");
}
await cp(resolve(root, ".work/t3-v0042-sidebar-fixture"), baseDir,
  { recursive: true, errorOnExist: true, force: false });
const server = spawn(resolve(release, "t3"), ["serve", "--mode", "desktop", "--base-dir", baseDir,
  "--port", theme === "dark" ? "4004" : "4005", "--host", "127.0.0.1", "--no-browser"],
{ cwd: root, stdio: ["ignore", "pipe", "pipe"] });
let output = "";
for (const stream of [server.stdout, server.stderr]) stream.on("data", (chunk) => { output += chunk; });
try {
  let pairingUrl;
  for (let attempt = 0; attempt < 120; attempt++) {
    pairingUrl = output.match(/Pairing URL: (\S+)/)?.[1];
    if (pairingUrl) break;
    if (server.exitCode !== null) throw new Error("Official server exited before pairing");
    await new Promise((done) => setTimeout(done, 250));
  }
  if (!pairingUrl) throw new Error("Official server did not produce a pairing URL");
  for (const [key, path] of [["index", "/"], ["css", "/assets/main-x9o7QJ8O.css"], ["js", "/assets/index-BMH8bO9q.js"]]) {
    const response = await fetch(new URL(path, pairingUrl));
    if (!response.ok || hash(Buffer.from(await response.arrayBuffer())) !== base.sourceHashes[key]) {
      throw new Error(`${key} differs from pinned official release`);
    }
  }
  const frames = 120;
  const fps = 30;
  const phases = ["draft", "stashed", "menu", "persisted-menu", "recalled", "direct-stashed", "direct-recalled"];
  const events = { stash: 20, menu: 40, persistedMenu: 60, recall: 80, stashAgain: 100, directRecall: 110 };
  const observed = {};
  await mkdir(work, { recursive: true });
  const browser = await chromium.launch({ executablePath, headless: true, args: [
    "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
    "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
  ] });
  try {
    const page = await browser.newPage({ viewport: base.viewport, deviceScaleFactor: 1, colorScheme: theme });
    await page.clock.setFixedTime(new Date("2026-09-25T11:30:00Z"));
    await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
    const editor = page.locator('[data-testid="composer-editor"]');
    await editor.waitFor({ timeout: 20000 });
    await page.locator('[data-testid="sidebar-row-card"]').filter({ hasText: "Build a logo intro" })
      .getByText("Build a logo intro", { exact: true }).click();
    await page.waitForTimeout(900);
    await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
    await page.evaluate(() => document.fonts.ready);
    if ((await page.evaluate(() => document.documentElement.className.includes("dark") ? "dark" : "light")) !== theme) {
      throw new Error(`Official app displayed the wrong ${theme} theme`);
    }
    const badge = page.locator('[data-prompt-stash-badge="true"]');
    const drawer = page.locator('[data-composer-stash-drawer="true"]');
    const stashEntries = () => page.evaluate(() => {
      const raw = localStorage.getItem("t3code:prompt-stash:v2");
      return raw ? JSON.parse(raw).state.entries : [];
    });
    const clean = (html) => html.replaceAll(baseDir, "hyfrme-fixture").replaceAll(root, "hyfrme-project");
    const save = async (phase) => {
      const html = clean(await page.locator("#root").evaluate((element) => element.innerHTML));
      if (/\/home\/|auth[_-]?token|session[_-]?token|127\.0\.0\.1:\d+/i.test(html)) {
        throw new Error(`Private fixture data in ${phase} root DOM`);
      }
      await writeFile(resolve(source, `${prefix}-${phase}.html`), html);
      const entries = await stashEntries();
      const drawerVisible = await drawer.isVisible().catch(() => false);
      observed[phase] = {
        editorText: (await editor.innerText()).trim(),
        badgeVisible: await badge.isVisible().catch(() => false),
        stashCount: entries.length,
        stashedPrompt: entries[0]?.prompt ?? null,
        drawerVisible,
      };
      if (!drawerVisible) return;
      const layer = clean(await page.locator('[data-composer-drawer-layer="true"]').evaluate((element) => element.outerHTML));
      if (/\/home\/|auth[_-]?token|session[_-]?token|127\.0\.0\.1:\d+/i.test(layer)) {
        throw new Error(`Private fixture data in ${phase} drawer`);
      }
      await writeFile(resolve(source, `${prefix}-${phase}-portal.html`), layer);
      observed[phase].drawerRect = await drawer.boundingBox();
      observed[phase].drawerText = await drawer.innerText();
    };
    await editor.fill(prompt);
    await editor.evaluate((element) => element.blur());
    await page.mouse.move(800, 60);
    await page.waitForTimeout(300);
    await save("draft");
    for (let frame = 0; frame < frames; frame++) {
      if (frame === events.stash) {
        await page.keyboard.press("Control+s");
        await page.waitForFunction(() => document.querySelector('[data-testid="composer-editor"]')?.textContent?.trim() === "");
        await badge.waitFor();
        await page.waitForTimeout(350);
        await save("stashed");
        if (observed.stashed.stashCount !== 1 || observed.stashed.stashedPrompt !== prompt) {
          throw new Error("Native stash did not write the Hyfrme prompt to durable local storage");
        }
      }
      if (frame === events.menu) {
        await badge.click();
        await drawer.waitFor();
        await page.mouse.move(800, 60);
        await page.waitForTimeout(200);
        await save("menu");
        if (!observed.menu.drawerText.includes(prompt)) throw new Error("Native stash drawer omitted the saved prompt");
      }
      if (frame === events.persistedMenu) {
        await page.reload({ waitUntil: "domcontentloaded" });
        await editor.waitFor({ timeout: 20000 });
        await badge.waitFor({ timeout: 5000 });
        await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
        await badge.click();
        await drawer.waitFor();
        await page.mouse.move(800, 60);
        await page.waitForTimeout(250);
        await save("persisted-menu");
        if (observed["persisted-menu"].stashCount !== 1 || observed["persisted-menu"].stashedPrompt !== prompt ||
          !observed["persisted-menu"].drawerText.includes(prompt)) {
          throw new Error("Native stash did not survive reload");
        }
      }
      if (frame === events.recall) {
        await page.locator('[data-stash-restore]').first().click();
        await page.waitForFunction((value) =>
          document.querySelector('[data-testid="composer-editor"]')?.textContent?.includes(value), prompt);
        await editor.evaluate((element) => element.blur());
        await page.mouse.move(800, 60);
        await page.waitForTimeout(250);
        await save("recalled");
        if (observed.recalled.stashCount !== 0 || observed.recalled.editorText !== prompt ||
          observed.recalled.drawerVisible) throw new Error("Native drawer recall did not consume the entry");
      }
      if (frame === events.stashAgain) {
        await page.keyboard.press("Control+s");
        await page.waitForFunction(() => document.querySelector('[data-testid="composer-editor"]')?.textContent?.trim() === "");
        await badge.waitFor();
        await page.mouse.move(800, 60);
        await page.waitForTimeout(250);
        await save("direct-stashed");
        if (observed["direct-stashed"].stashCount !== 1) throw new Error("Second native stash failed");
      }
      if (frame === events.directRecall) {
        await page.keyboard.press("Control+s");
        await page.waitForFunction((value) =>
          document.querySelector('[data-testid="composer-editor"]')?.textContent?.includes(value), prompt);
        await editor.evaluate((element) => element.blur());
        await page.mouse.move(800, 60);
        await page.waitForTimeout(250);
        await save("direct-recalled");
        if (observed["direct-recalled"].stashCount !== 0 || observed["direct-recalled"].editorText !== prompt ||
          observed["direct-recalled"].drawerVisible) throw new Error("Single-entry Ctrl+S did not restore directly");
      }
      await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
    }
  } finally {
    await browser.close();
  }
  const encode = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
    "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference],
  { encoding: "utf8" });
  if (encode.status !== 0) throw new Error(encode.stderr);
  const sourceDomHashes = Object.fromEntries(await Promise.all(phases.map(async (phase) =>
    [phase, hash(await readFile(resolve(source, `${prefix}-${phase}.html`)))])));
  const portalHashes = Object.fromEntries(await Promise.all(["menu", "persisted-menu"].map(async (phase) =>
    [phase, hash(await readFile(resolve(source, `${prefix}-${phase}-portal.html`)))])));
  await writeFile(resolve(source, `${prefix}-fixture.json`), JSON.stringify({
    sourceTag: "v0.0.42", sourceCommit: "719a76ca1dbf5490f1aa33ffb9966301e02be9a9",
    releaseSha256: base.releaseSha256, sourceHashes: base.sourceHashes,
    viewport: base.viewport, fps, frames, theme, phases, events, prompt, observed,
    sourceDomHashes, portalHashes, referenceSha256: hash(await readFile(reference)),
  }, null, 2) + "\n");
  console.log(`Captured ${frames} official T3 Code v0.0.42 Prompt Stash ${theme} frames with reload and direct restore.`);
} finally {
  server.kill("SIGTERM");
}
