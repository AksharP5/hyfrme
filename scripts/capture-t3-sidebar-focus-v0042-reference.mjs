import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const release = resolve(root, ".work/t3-v0042-bin/t3-0.0.42-linux-x64");
const seed = resolve(root, ".work/t3-v0042-composer-fixture");
const theme = process.env.T3_REFERENCE_THEME ?? "dark";
if (!["dark", "light"].includes(theme)) throw new Error("T3_REFERENCE_THEME must be dark or light");
const panelMs = Number(process.env.T3_PANEL_MS ?? 200);
if (![0, 200].includes(panelMs)) throw new Error("T3_PANEL_MS must be 0 or 200");
const variant = panelMs === 0 ? "default" : "animated";
const probeOnly = process.env.T3_PROBE_ONLY === "1";
const work = resolve(root, `.work/t3-sidebar-focus-v0042-${theme}-${variant}-reference`);
const project = resolve(root, `.work/t3-sidebar-focus-v0042-${theme}-${variant}-fixture`);
const reference = resolve(root, `parity/t3-sidebar-focus-v0042-${theme}-${variant}-reference.mkv`);
const executablePath = process.env.HYFRME_CHROMIUM;
if (!executablePath) throw new Error("Set HYFRME_CHROMIUM to the pinned Chrome executable");
const brief = JSON.parse(await readFile(resolve(source, "brief-v0042-fixture.json"), "utf8"));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const version = spawnSync(resolve(release, "t3"), ["--version"], { encoding: "utf8" });
if (version.status !== 0 || version.stdout.trim() !== "t3 v0.0.42") throw new Error("Wrong T3 Code binary");
const chromeVersion = spawnSync(executablePath, ["--version"], { encoding: "utf8" });
if (chromeVersion.status !== 0 || chromeVersion.stdout.trim() !== "Google Chrome for Testing 152.0.7977.30") throw new Error("Wrong capture browser");
const frames = 120;
const fps = 30;
const events = { collapse: 30, restore: 90 };
const prompt = "Verify the Hyfrme Logo Enter final-frame timing.";
await mkdir(work, { recursive: true });
await rm(project, { recursive: true, force: true });
await cp(seed, project, { recursive: true });
const port = theme === "dark" ? (panelMs ? 3960 : 3961) : (panelMs ? 3962 : 3963);
const server = spawn(resolve(release, "t3"), ["serve", "--mode", "desktop", "--base-dir", project,
  "--port", String(port), "--host", "127.0.0.1", "--no-browser"], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
let serverOutput = "";
for (const stream of [server.stdout, server.stderr]) stream.on("data", (chunk) => { serverOutput += chunk; });
let pairingUrl;
for (let attempt = 0; attempt < 120; attempt++) {
  pairingUrl = serverOutput.match(/Pairing URL: (\S+)/)?.[1];
  if (pairingUrl) break;
  if (server.exitCode !== null) throw new Error("Official v0.0.42 server exited before pairing");
  await new Promise((done) => setTimeout(done, 250));
}
if (!pairingUrl) throw new Error("Official v0.0.42 server did not produce a pairing URL");
for (const [key, path] of [["index", "/"], ["css", "/assets/main-x9o7QJ8O.css"], ["js", "/assets/index-BMH8bO9q.js"]]) {
  const response = await fetch(new URL(path, pairingUrl), { signal: AbortSignal.timeout(15000) });
  if (!response.ok || hash(Buffer.from(await response.arrayBuffer())) !== brief.sourceHashes[key]) {
    server.kill("SIGTERM");
    throw new Error(`${key} differs from the pinned official release`);
  }
}
const browser = await chromium.launch({ executablePath, headless: true, args: [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none",
  "--force-color-profile=srgb", "--use-gl=angle", "--use-angle=gl-egl",
  "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
] });
const phases = ["open", "collapsed", "restored"];
const motion = {};
let sidebarWidth;
let modelName;
let page;
try {
  page = await browser.newPage({ viewport: brief.viewport, deviceScaleFactor: 1, colorScheme: theme });
  await page.clock.setFixedTime(new Date("2026-09-25T11:30:00Z"));
  await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
  const editor = page.locator('[data-testid="composer-editor"]');
  await editor.waitFor({ timeout: 20000 });
  await page.waitForTimeout(900);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.evaluate(() => document.fonts.ready);
  const nativeTheme = await page.evaluate(() => ({
    className: document.documentElement.className,
    variables: Object.fromEntries(Array.from(getComputedStyle(document.documentElement))
      .filter((key) => key.startsWith("--"))
      .map((key) => [key, getComputedStyle(document.documentElement).getPropertyValue(key).trim()])),
  }));
  if (theme === "light" ? nativeTheme.className.includes("dark") : !nativeTheme.className.includes("dark")) {
    throw new Error(`Official app did not enter ${theme} appearance`);
  }
  const expectedTheme = JSON.parse(await readFile(resolve(source, `${theme}-theme.json`), "utf8"));
  const sorted = (values) => JSON.stringify(Object.entries(values).sort(([a], [b]) => a.localeCompare(b)));
  if (sorted(nativeTheme.variables) !== sorted(expectedTheme)) throw new Error("Official theme variables changed");
  await page.locator('[aria-label="Settings"]').first().click();
  await page.getByRole("button", { name: "Appearance", exact: true }).click();
  const slider = page.getByRole("slider", { name: "Panel animation duration" });
  await slider.waitFor({ state: "visible", timeout: 10000 });
  const releaseDefault = Number(await slider.inputValue());
  if (releaseDefault !== 0) throw new Error(`Release default panel animation was ${releaseDefault} ms, expected 0`);
  await slider.press("Home");
  for (let step = 0; step < panelMs / 25; step++) await slider.press("ArrowRight");
  await page.waitForFunction((expected) => Number(document.querySelector('#panel-animation-duration')?.value) === expected,
    panelMs, { timeout: 5000 });
  await page.goBack({ waitUntil: "domcontentloaded" });
  await editor.waitFor({ timeout: 10000 });
  await page.waitForFunction((expected) => document.querySelector('[data-panel-animations]')?.getAttribute('data-panel-animations') === expected,
    panelMs ? "true" : "false", { timeout: 5000 });
  modelName = await page.locator('button[data-chat-provider-model-picker="true"] [data-chat-provider-model-picker-label="true"]').first().innerText();
  const trigger = page.locator('[data-composer-shortcut="composer.effort"]').first();
  const portal = page.locator('[data-base-ui-portal]:has([data-slot="menu-popup"])').last();
  if ((await trigger.locator(".truncate").innerText()).trim() !== "High") {
    await trigger.click();
    await portal.getByRole("menuitemradio", { name: /^High(?:\s|$)/ }).first().click();
  }
  if (!await trigger.locator(".sr-only", { hasText: "Fast mode on" }).count()) {
    await trigger.click();
    await portal.getByRole("menuitemradio", { name: /^Fast(?:\s|$)/ }).first().click();
  }
  await editor.fill(prompt);
  await editor.evaluate((element) => element.blur());
  await page.mouse.move(800, 80);
  await page.waitForTimeout(350);
  const sidebar = page.locator('[data-slot="sidebar"]').first();
  const state = async () => sidebar.getAttribute("data-state");
  if (await state() !== "expanded") throw new Error("Sidebar starts collapsed");
  sidebarWidth = await page.locator('[data-slot="sidebar-gap"]').first().evaluate((element) => element.getBoundingClientRect().width);
  const toggle = page.getByRole("button", { name: "Toggle main sidebar" }).first();
  const saveRoot = async (phase) => {
    const dom = (await page.locator("#root").evaluate((element) => element.innerHTML))
      .replaceAll(project, "hyfrme-project")
      .replaceAll(resolve(root, ".work/t3-v0042-composer-project"), "hyfrme-project");
    if (/\/home\/|auth[_-]?token|session[_-]?token|127\.0\.0\.1:\d+/i.test(dom)) throw new Error(`Private data in ${phase} DOM`);
    await writeFile(resolve(source, `sidebar-focus-v0042-${theme}-${variant}-${phase}.html`), dom);
  };
  const freeze = async (phase) => {
    const animations = await page.evaluate(() => {
      window.__t3SidebarAnimations = document.getAnimations().filter((animation) => {
        const duration = animation.effect?.getComputedTiming().duration;
        return Number.isFinite(duration) && duration > 0 && duration <= 1000;
      });
      for (const animation of window.__t3SidebarAnimations) {
        animation.pause();
        animation.currentTime = 0;
      }
      return window.__t3SidebarAnimations.map((animation) => ({
        type: animation.constructor.name,
        target: animation.effect?.target?.getAttribute("data-slot") ?? animation.effect?.target?.tagName ?? null,
        durationMs: animation.effect?.getComputedTiming().duration,
        easing: animation.effect?.getTiming().easing,
        keyframes: animation.effect?.getKeyframes().map(({ offset, easing, ...styles }) => ({ offset, easing, styles })),
      }));
    });
    if (panelMs && !animations.length) throw new Error(`No native sidebar ${phase} animations found with ${panelMs} ms setting`);
    if (!panelMs && animations.length) throw new Error(`Unexpected native sidebar ${phase} animations with default 0 ms setting`);
    motion[phase] = animations;
  };
  const seek = async (elapsed) => page.evaluate((time) => {
    for (const animation of window.__t3SidebarAnimations ?? []) {
      const duration = animation.effect?.getComputedTiming().duration;
      animation.currentTime = Math.min(duration, time);
    }
  }, elapsed);
  const finish = async () => page.evaluate(() => {
    for (const animation of window.__t3SidebarAnimations ?? []) animation.finish();
    window.__t3SidebarAnimations = [];
  });
  await saveRoot("open");
  for (let frame = 0; frame < frames; frame++) {
    if (frame === events.collapse || frame === events.restore) {
      if (frame === events.restore) await finish();
      await toggle.click();
      await page.waitForFunction((expected) => document.querySelector('[data-slot="sidebar"]')?.getAttribute("data-state") === expected,
        frame === events.collapse ? "collapsed" : "expanded", { timeout: 5000 });
      await freeze(frame === events.collapse ? "collapse" : "restore");
      await page.mouse.move(800, 80);
      await toggle.evaluate((element) => element.blur());
      if (panelMs) await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
      await saveRoot(frame === events.collapse ? "collapsed" : "restored");
      if (probeOnly) {
        await writeFile(resolve(work, "probe.json"), JSON.stringify({ theme, variant, panelMs, sidebarWidth, motion }, null, 2) + "\n");
        break;
      }
    }
    if (frame >= events.collapse && frame < events.restore) await seek((frame - events.collapse) * 1000 / fps);
    if (frame >= events.restore) await seek((frame - events.restore) * 1000 / fps);
    await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
  if (!probeOnly) await finish();
} catch (error) {
  if (page) await page.screenshot({ path: resolve(work, "diagnostic.png") }).catch(() => {});
  throw new Error(String(error).replaceAll(pairingUrl, "[pairing URL redacted]"));
} finally {
  try {
    await browser.close();
  } finally {
    server.kill("SIGTERM");
  }
}
if (probeOnly) {
  console.log(`Probed official ${theme} ${variant} sidebar motion: ${JSON.stringify(motion.collapse)}`);
  process.exit(0);
}
const encoded = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
if (encoded.status !== 0) throw new Error(encoded.stderr);
const sourceDomHashes = Object.fromEntries(await Promise.all(phases.map(async (phase) => [
  phase, hash(await readFile(resolve(source, `sidebar-focus-v0042-${theme}-${variant}-${phase}.html`))),
])));
await writeFile(resolve(source, `sidebar-focus-v0042-${theme}-${variant}-fixture.json`), JSON.stringify({
  sourceTag: "v0.0.42", sourceCommit: brief.sourceCommit, sourceHashes: brief.sourceHashes,
  viewport: brief.viewport, fps, frames, events, prompt, modelName, reasoningLevel: "High", serviceTier: "Fast", panelMs, variant,
  releaseDefaultPanelMs: 0, settingSource: "apps/web/src/components/settings/SettingsPanels.tsx: Panel animation duration slider",
  sidebarWidth, motion, sourceDomHashes, referenceSha256: hash(await readFile(reference)),
  providerState: "Seeded local provider/model options; no AI inference runs.",
}, null, 2) + "\n");
console.log(`Captured ${frames} official T3 Code v0.0.42 ${theme} Sidebar Focus ${variant} frames.`);
