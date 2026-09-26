import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const release = resolve(root, ".work/t3-v0042-bin/t3-0.0.42-linux-x64");
const source = resolve(root, "assets/t3-code/v0.0.42");
const theme = process.env.T3_REFERENCE_THEME ?? "dark";
if (!["dark", "light"].includes(theme)) throw new Error("T3_REFERENCE_THEME must be dark or light");
const project = resolve(root, `.work/t3-v0042-project-switch-${theme}-fixture`);
const executablePath = process.env.HYFRME_CHROMIUM;
if (!executablePath) throw new Error("Set HYFRME_CHROMIUM to the pinned Chrome executable");
const prefix = `project-switch-v0042-${theme}`;
const work = resolve(root, `.work/t3-${prefix}-reference`);
const reference = resolve(root, `parity/t3-project-switch-v0042-${theme}-reference.mkv`);
const base = JSON.parse(await readFile(resolve(source, "brief-v0042-fixture.json"), "utf8"));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const version = spawnSync(resolve(release, "t3"), ["--version"], { encoding: "utf8" });
if (version.status !== 0 || version.stdout.trim() !== "t3 v0.0.42") throw new Error("Wrong T3 Code release");
const chromeVersion = spawnSync(executablePath, ["--version"], { encoding: "utf8" });
if (chromeVersion.status !== 0 || chromeVersion.stdout.trim() !== "Google Chrome for Testing 152.0.7977.30") throw new Error("Wrong capture browser");
const database = resolve(project, "userdata/state.sqlite");
const projectTitles = () => {
  const result = spawnSync("sqlite3", [database, "select title from projection_projects where deleted_at is null order by title;"], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout.trim().split("\n");
};
const projectsBefore = projectTitles();
if (projectsBefore.join("|") !== "hyfrme|hyfrme-motion-lab") throw new Error(`Expected two isolated Hyfrme projects: ${projectsBefore}`);
const server = spawn(resolve(release, "t3"), ["serve", "--mode", "desktop", "--base-dir", project,
  "--port", theme === "dark" ? "3996" : "3997", "--host", "127.0.0.1", "--no-browser"],
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
  const phases = ["all", "menu", "motion", "motion-menu", "hyfrme", "hyfrme-menu"];
  const menuPhases = ["menu", "motion-menu", "hyfrme-menu"];
  const events = { menu: 20, motion: 40, motionMenu: 60, hyfrme: 80, hyfrmeMenu: 100 };
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
    await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
    await page.getByText("Build a logo intro", { exact: true }).first().click();
    await page.waitForTimeout(900);
    await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
    await page.waitForTimeout(2500);
    await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
    await page.waitForTimeout(250);
    await page.evaluate(() => document.fonts.ready);
    const currentTheme = await page.evaluate(() => document.documentElement.className.includes("dark") ? "dark" : "light");
    if (currentTheme !== theme) throw new Error(`Official app displayed ${currentTheme} under ${theme} capture`);
    const trigger = page.getByRole("combobox", { name: /Filter threads by project/ });
    const item = (title) => page.getByRole("option", { name: title, exact: true });
    const clean = (html) => html.replaceAll(project, "hyfrme-fixture")
      .replaceAll(root, "hyfrme-project").replaceAll("/var/tmp/hyfrme-motion-lab", "hyfrme-motion-lab");
    const savePhase = async (phase, withMenu = false) => {
      const html = clean(await page.locator("#root").evaluate((element) => element.innerHTML));
      if (/\/home\/|auth[_-]?token|session[_-]?token|127\.0\.0\.1:\d+/i.test(html)) {
        throw new Error(`Private data in ${phase} root DOM`);
      }
      await writeFile(resolve(source, `${prefix}-${phase}.html`), html);
      observed[phase] = {
        trigger: await trigger.getAttribute("aria-label"),
        rowTitles: await page.locator('[data-testid="sidebar-row-card"] div.mt-1 span').allTextContents(),
      };
      if (!withMenu) return;
      const popup = page.locator('[data-slot="combobox-popup"]').filter({ has: page.getByRole("option") }).first();
      const portal = clean(await popup.evaluate((element) => element.outerHTML));
      if (/\/home\/|auth[_-]?token|session[_-]?token/i.test(portal)) throw new Error(`Private ${phase} menu DOM`);
      await writeFile(resolve(source, `${prefix}-${phase}-portal.html`), portal);
      observed[phase].popupBox = await popup.boundingBox();
      observed[phase].selected = await page.getByRole("option").evaluateAll((items) =>
        items.filter((entry) => entry.getAttribute("aria-selected") === "true").map((entry) => entry.textContent?.trim()));
    };
    await page.mouse.move(800, 80);
    await savePhase("all");
    for (let frame = 0; frame < frames; frame++) {
      if (frame === events.menu) {
        await trigger.click();
        await item("hyfrme-motion-lab").waitFor();
        await page.mouse.move(800, 80);
        await page.waitForTimeout(250);
        await savePhase("menu", true);
      }
      if (frame === events.motion) {
        await item("hyfrme-motion-lab").click();
        await page.waitForFunction(() => document.querySelector('[role="combobox"][aria-label*="Filter threads by project"]')?.getAttribute("aria-label")?.includes("hyfrme-motion-lab"));
        await page.mouse.move(800, 80);
        await page.waitForTimeout(250);
        await savePhase("motion");
      }
      if (frame === events.motionMenu) {
        await trigger.click();
        await item("hyfrme-motion-lab").waitFor();
        await page.mouse.move(800, 80);
        await page.waitForTimeout(250);
        await savePhase("motion-menu", true);
      }
      if (frame === events.hyfrme) {
        await item("hyfrme").click();
        await page.waitForFunction(() => document.querySelector('[role="combobox"][aria-label*="Filter threads by project"]')?.getAttribute("aria-label") === "Filter threads by project: hyfrme");
        await page.mouse.move(800, 80);
        await page.waitForTimeout(250);
        await savePhase("hyfrme");
      }
      if (frame === events.hyfrmeMenu) {
        await trigger.click();
        await item("hyfrme-motion-lab").waitFor();
        await page.mouse.move(800, 80);
        await page.waitForTimeout(250);
        await savePhase("hyfrme-menu", true);
      }
      await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
    }
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
    observed.reloadScope = await page.getByRole("combobox", { name: /Filter threads by project/ }).getAttribute("aria-label");
  } finally {
    await browser.close();
  }
  const projectsAfter = projectTitles();
  if (observed.all?.trigger !== "Filter threads by project" || observed.motion?.trigger !== "Filter threads by project: hyfrme-motion-lab" ||
      observed.hyfrme?.trigger !== "Filter threads by project: hyfrme" || !observed["motion-menu"]?.selected?.some((title) => title.includes("hyfrme-motion-lab")) ||
      !observed["hyfrme-menu"]?.selected?.some((title) => title.endsWith("hyfrme")) ||
      observed.motion?.rowTitles.includes("Build a logo intro") || !observed.hyfrme?.rowTitles.includes("Build a logo intro") ||
      observed.reloadScope !== "Filter threads by project: hyfrme" || projectsAfter.join("|") !== projectsBefore.join("|")) {
    throw new Error(`Native scope behavior differed: ${JSON.stringify({ observed, projectsBefore, projectsAfter })}`);
  }
  const encode = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
    "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
  if (encode.status !== 0) throw new Error(encode.stderr);
  const domPhases = [...phases, ...menuPhases.map((phase) => `${phase}-portal`)];
  await writeFile(resolve(source, `${prefix}-fixture.json`), JSON.stringify({
    sourceTag: "v0.0.42", sourceCommit: "719a76ca1dbf5490f1aa33ffb9966301e02be9a9",
    releaseSha256: base.releaseSha256, sourceHashes: base.sourceHashes,
    viewport: base.viewport, fps, frames, theme, phases, events, projectsBefore, projectsAfter, observed,
    sourceDomHashes: Object.fromEntries(await Promise.all(domPhases.map(async (phase) => [phase, hash(await readFile(resolve(source, `${prefix}-${phase}.html`)))]))),
    referenceSha256: hash(await readFile(reference)),
  }, null, 2) + "\n");
  console.log(`Captured ${frames} native T3 Code v0.0.42 Project Scope ${theme} frames.`);
} finally {
  server.kill("SIGTERM");
}
