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
const project = resolve(root, `.work/t3-v0042-thread-switch-${theme}-fixture`);
const executablePath = process.env.HYFRME_CHROMIUM;
if (!executablePath) throw new Error("Set HYFRME_CHROMIUM to the pinned Chrome executable");
const prefix = `thread-switch-v0042-${theme}`;
const work = resolve(root, `.work/t3-${prefix}-reference`);
const reference = resolve(root, `parity/t3-thread-switch-v0042-${theme}-reference.mkv`);
const base = JSON.parse(await readFile(resolve(source, "brief-v0042-fixture.json"), "utf8"));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const version = spawnSync(resolve(release, "t3"), ["--version"], { encoding: "utf8" });
if (version.status !== 0 || version.stdout.trim() !== "t3 v0.0.42") throw new Error("Wrong T3 Code release");
const chromeVersion = spawnSync(executablePath, ["--version"], { encoding: "utf8" });
if (chromeVersion.status !== 0 || chromeVersion.stdout.trim() !== "Google Chrome for Testing 152.0.7977.30") throw new Error("Wrong capture browser");
const server = spawn(resolve(release, "t3"), ["serve", "--mode", "desktop", "--base-dir", project,
  "--port", theme === "dark" ? "3994" : "3995", "--host", "127.0.0.1", "--no-browser"],
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
  const phases = ["before", "first", "second"];
  const events = { first: 30, second: 75 };
  const observed = {};
  await mkdir(work, { recursive: true });
  const browser = await chromium.launch({ executablePath, headless: true, args: [
    "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
    "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist",
    "--disable-software-rasterizer",
  ] });
  try {
    const page = await browser.newPage({ viewport: base.viewport, deviceScaleFactor: 1, colorScheme: theme });
    await page.clock.setFixedTime(new Date("2026-09-25T11:30:00Z"));
    await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
    await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
    await page.waitForTimeout(900);
    await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
    await page.waitForTimeout(2500);
    await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
    await page.waitForTimeout(250);
    await page.evaluate(() => document.fonts.ready);
    const currentTheme = await page.evaluate(() => document.documentElement.className.includes("dark") ? "dark" : "light");
    if (currentTheme !== theme) throw new Error(`Official app displayed ${currentTheme} under ${theme} capture`);
    await page.locator('[data-testid="composer-editor"]').fill("");
    await page.mouse.move(800, 80);
    const savePhase = async (phase) => {
      const dom = (await page.locator("#root").evaluate((node) => node.innerHTML))
        .replaceAll(project, "hyfrme-fixture").replaceAll(root, "hyfrme-project");
      if (/\/home\/|auth[_-]?token|session[_-]?token|127\.0\.0\.1:\d+/i.test(dom)) {
        throw new Error(`Private data in ${phase} DOM`);
      }
      await writeFile(resolve(source, `${prefix}-${phase}.html`), dom);
      observed[phase] = {
        route: new URL(page.url()).pathname,
        heading: await page.locator("h1, h2").allTextContents(),
        threadOneVisible: await page.getByText("Build a logo intro", { exact: true }).count() > 0,
        threadTwoVisible: await page.getByText("Catalog motion audit", { exact: true }).count() > 0,
      };
    };
    await savePhase("before");
    for (let frame = 0; frame < frames; frame++) {
      if (frame === events.first) {
        await page.getByText("Build a logo intro", { exact: true }).first().click();
        await page.getByText("I found the Logo Enter timing", { exact: false }).waitFor({ timeout: 20000 });
        await page.mouse.move(800, 80);
        await page.waitForTimeout(250);
        await savePhase("first");
      }
      if (frame === events.second) {
        await page.getByText("Catalog motion audit", { exact: true }).first().click();
        await page.getByText("Logo Enter and Answer Stream", { exact: false }).waitFor({ timeout: 20000 });
        await page.mouse.move(800, 80);
        await page.waitForTimeout(250);
        await savePhase("second");
      }
      await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
    }
  } finally {
    await browser.close();
  }
  if (observed.before?.route === observed.first?.route || observed.first?.route === observed.second?.route) {
    throw new Error("Native thread switches did not change routes");
  }
  const encode = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
    "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
  if (encode.status !== 0) throw new Error(encode.stderr);
  await writeFile(resolve(source, `${prefix}-fixture.json`), JSON.stringify({
    sourceTag: "v0.0.42", sourceCommit: "719a76ca1dbf5490f1aa33ffb9966301e02be9a9",
    releaseSha256: base.releaseSha256, sourceHashes: base.sourceHashes,
    viewport: base.viewport, fps, frames, theme, phases, events, observed,
    sourceDomHashes: Object.fromEntries(await Promise.all(phases.map(async (phase) => [phase, hash(await readFile(resolve(source, `${prefix}-${phase}.html`)))]))),
    referenceSha256: hash(await readFile(reference)),
  }, null, 2) + "\n");
  console.log(`Captured ${frames} native T3 Code v0.0.42 Thread Switch ${theme} frames.`);
} finally {
  server.kill("SIGTERM");
}
