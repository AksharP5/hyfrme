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
const baseDir = resolve(root, `.work/t3-v0042-worked-trace-${theme}-fixture`);
const executablePath = process.env.HYFRME_CHROMIUM;
if (!executablePath) throw new Error("Set HYFRME_CHROMIUM to the pinned Chrome executable");
const prefix = `worked-trace-v0042-${theme}`;
const work = resolve(root, `.work/t3-${prefix}-reference`);
const reference = resolve(root, `parity/t3-worked-trace-v0042-${theme}-reference.mkv`);
const base = JSON.parse(await readFile(resolve(source, "brief-v0042-fixture.json"), "utf8"));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const version = spawnSync(resolve(release, "t3"), ["--version"], { encoding: "utf8" });
if (version.status !== 0 || version.stdout.trim() !== "t3 v0.0.42") throw new Error("Wrong T3 Code release");
const chromeVersion = spawnSync(executablePath, ["--version"], { encoding: "utf8" });
if (chromeVersion.status !== 0 || chromeVersion.stdout.trim() !== "Google Chrome for Testing 152.0.7977.30") {
  throw new Error("Wrong capture browser");
}
const server = spawn(resolve(release, "t3"), ["serve", "--mode", "desktop", "--base-dir", baseDir,
  "--port", theme === "dark" ? "4002" : "4003", "--host", "127.0.0.1", "--no-browser"],
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
  const phases = ["closed", "fold-open", "command-open", "reclosed", "persisted"];
  const events = { open: 20, expand: 40, close: 80, persisted: 100 };
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
    await page.locator('[data-testid="sidebar-row-card"]').filter({ hasText: "Build a logo intro" })
      .getByText("Build a logo intro", { exact: true }).click();
    await page.waitForTimeout(900);
    await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
    await page.mouse.move(800, 60);
    await page.waitForTimeout(450);
    await page.evaluate(() => document.fonts.ready);
    const currentTheme = await page.evaluate(() => document.documentElement.className.includes("dark") ? "dark" : "light");
    if (currentTheme !== theme) throw new Error(`Official app displayed ${currentTheme} under ${theme} capture`);
    const fold = page.locator('[data-timeline-row-kind="turn-fold"] button').first();
    await fold.waitFor();
    if (!(await fold.innerText()).includes("Worked for")) throw new Error("Completed work disclosure is absent");
    const save = async (phase) => {
      const html = (await page.locator("#root").evaluate((element) => element.innerHTML))
        .replaceAll(baseDir, "hyfrme-fixture").replaceAll(root, "hyfrme-project");
      if (/\/home\/|auth[_-]?token|session[_-]?token|127\.0\.0\.1:\d+/i.test(html)) {
        throw new Error(`Private fixture data in ${phase} root DOM`);
      }
      await writeFile(resolve(source, `${prefix}-${phase}.html`), html);
      observed[phase] = {
        foldLabel: await fold.innerText(),
        foldExpanded: await fold.getAttribute("aria-expanded"),
        workRows: await page.locator('[data-timeline-row-kind="work"]').allInnerTexts(),
        commandExpanded: await page.locator('[data-timeline-row-kind="work"] [role="button"]').first()
          .getAttribute("aria-expanded").catch(() => null),
      };
    };
    await save("closed");
    for (let frame = 0; frame < frames; frame++) {
      if (frame === events.open) {
        await fold.click();
        await page.mouse.move(800, 60);
        await page.waitForTimeout(350);
        await save("fold-open");
        if (!observed["fold-open"].workRows.some((row) => row.includes("npm run verify:showcases"))) {
          throw new Error(`Native command is absent after disclosure: ${JSON.stringify(observed["fold-open"])}`);
        }
      }
      if (frame === events.expand) {
        await page.locator('[data-timeline-row-kind="work"] [role="button"]').first().click();
        await page.locator('[data-timeline-row-kind="work"] [role="button"][aria-expanded="true"]').first().waitFor();
        await page.mouse.move(800, 60);
        await page.waitForTimeout(350);
        await save("command-open");
      }
      if (frame === events.close) {
        await fold.click();
        await page.locator('[data-timeline-row-kind="work"]').first().waitFor({ state: "hidden" });
        await page.mouse.move(800, 60);
        await page.waitForTimeout(350);
        await save("reclosed");
      }
      if (frame === events.persisted) {
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
        await fold.waitFor();
        await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
        await page.mouse.move(800, 60);
        await page.waitForTimeout(400);
        await save("persisted");
      }
      await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
    }
  } finally {
    await browser.close();
  }
  if (observed.closed.foldExpanded !== "false" || observed["fold-open"].foldExpanded !== "true" ||
    !observed["fold-open"].workRows.some((label) => label.includes("npm run verify:showcases")) ||
    observed["fold-open"].commandExpanded !== "false" || observed["command-open"].commandExpanded !== "true" ||
    observed.reclosed.foldExpanded !== "false" || observed.persisted.foldExpanded !== "false") {
    throw new Error(`Native work disclosure differed: ${JSON.stringify(observed)}`);
  }
  const encode = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
    "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
  if (encode.status !== 0) throw new Error(encode.stderr);
  const sourceDomHashes = Object.fromEntries(await Promise.all(phases.map(async (phase) =>
    [phase, hash(await readFile(resolve(source, `${prefix}-${phase}.html`)))])));
  await writeFile(resolve(source, `${prefix}-fixture.json`), JSON.stringify({
    sourceTag: "v0.0.42", sourceCommit: "719a76ca1dbf5490f1aa33ffb9966301e02be9a9",
    releaseSha256: base.releaseSha256, sourceHashes: base.sourceHashes,
    viewport: base.viewport, fps, frames, theme, phases, events, observed,
    sourceDomHashes, referenceSha256: hash(await readFile(reference)),
  }, null, 2) + "\n");
  console.log(`Captured ${frames} native T3 Code v0.0.42 Worked Trace ${theme} frames.`);
} finally {
  server.kill("SIGTERM");
}
