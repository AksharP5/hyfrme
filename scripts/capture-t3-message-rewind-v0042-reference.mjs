import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { spawn, spawnSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const release = resolve(root, ".work/t3-v0042-bin/t3-0.0.42-linux-x64");
const source = resolve(root, "assets/t3-code/v0.0.42");
const theme = process.env.T3_REFERENCE_THEME ?? "dark";
if (!new Set(["dark", "light"]).has(theme)) throw new Error("T3_REFERENCE_THEME must be dark or light");
const originalFixture = resolve(root, ".work/t3-message-rewind-fixture");
const originalProject = resolve(root, ".work/t3-message-rewind-project");
const fixture = await mkdtemp(resolve(root, `.work/t3-message-rewind-v0042-${theme}-fixture-`));
const project = join(fixture, "hyfrme-project");
const db = resolve(fixture, "userdata/state.sqlite");
const prefix = `message-rewind-v0042-${theme}`;
const work = resolve(root, `.work/t3-${prefix}-reference`);
const reference = resolve(root, `parity/t3-message-rewind-v0042-${theme}-reference.mkv`);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const run = (program, args, cwd = root) => {
  const result = spawnSync(program, args, { cwd, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${program} failed: ${result.stderr.slice(-2000)}`);
  return result.stdout.trim();
};
const browserExecutable = process.env.HYFRME_CHROMIUM;
if (!browserExecutable || run(resolve(release, "t3"), ["--version"]) !== "t3 v0.0.42" ||
    run(browserExecutable, ["--version"]) !== "Google Chrome for Testing 152.0.7977.30") {
  throw new Error("Expected T3 Code v0.0.42 and the pinned Chrome capture browser");
}
await cp(originalFixture, fixture, { recursive: true });
await cp(originalProject, project, { recursive: true });
run("sqlite3", [db, `UPDATE projection_projects SET workspace_root='${project.replaceAll("'", "''")}' WHERE title='hyfrme';
UPDATE projection_threads SET worktree_path='${project.replaceAll("'", "''")}' WHERE project_id=(SELECT project_id FROM projection_projects WHERE title='hyfrme');`]);
const files = { index: "index.html", css: "assets/main-x9o7QJ8O.css", js: "assets/index-BMH8bO9q.js" };
const sourceHashes = {};
for (const [key, path] of Object.entries(files)) sourceHashes[key] = hash(await readFile(resolve(release, "client", path)));
const server = spawn(resolve(release, "t3"), ["serve", "--mode", "desktop", "--base-dir", fixture,
  "--port", theme === "dark" ? "4310" : "4311", "--host", "127.0.0.1", "--no-browser"], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
let serverOutput = "";
for (const stream of [server.stdout, server.stderr]) stream.on("data", (chunk) => { serverOutput += chunk; });
const phases = ["before", "hover", "tooltip", "confirm", "closed"];
const events = { hover: 25, tooltip: 45, confirm: 65, cancel: 95 };
const frames = 120;
const fps = 30;
const flags = ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
  "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer"];
let pairingUrl;
try {
  for (let attempt = 0; attempt < 120; attempt++) {
    pairingUrl = serverOutput.match(/Pairing URL: (\S+)/)?.[1];
    if (pairingUrl) break;
    if (server.exitCode !== null) throw new Error(`T3 server exited: ${serverOutput.slice(-1600)}`);
    await new Promise((done) => setTimeout(done, 250));
  }
  if (!pairingUrl) throw new Error("T3 Code did not produce its local pairing URL");
  for (const [key, path] of Object.entries(files)) {
    const response = await fetch(new URL(key === "index" ? "/" : `/${path.replace(/^assets\//, "assets/")}`, pairingUrl));
    if (!response.ok || hash(Buffer.from(await response.arrayBuffer())) !== sourceHashes[key]) throw new Error(`${key} differs from the release capture source`);
  }
  await mkdir(source, { recursive: true });
  await mkdir(work, { recursive: true });
  const browser = await chromium.launch({ executablePath: browserExecutable, headless: true, args: flags });
  let modalCopy;
  let beforeMessages;
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 659 }, deviceScaleFactor: 1, colorScheme: theme });
    await page.clock.setFixedTime(new Date("2026-09-25T11:30:00Z"));
    await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
    await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
    if ((await page.evaluate(() => document.documentElement.classList.contains("dark"))) !== (theme === "dark")) throw new Error(`Unexpected ${theme} theme`);
    await page.getByText("Build a logo intro", { exact: true }).click();
    await page.waitForURL(/hyfrme-fixture-logo-intro/);
    const prompt = page.locator('[data-timeline-row-kind="message"]').filter({ hasText: "Build a six-second Hyfrme logo intro" });
    await prompt.waitFor({ timeout: 12000 });
    const rewind = prompt.getByRole("button", { name: "Edit from here" });
    await rewind.waitFor({ timeout: 8000 });
    await page.waitForTimeout(650);
    await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
    await page.mouse.move(800, 50);
    await page.evaluate(() => document.fonts.ready);
    const saved = async (phase) => {
      const html = (await page.locator("#root").evaluate((element) => element.innerHTML))
        .replaceAll(fixture, "hyfrme-fixture").replaceAll(project, "hyfrme-project").replaceAll(root, "hyfrme-project");
      if (/\/home\/|\/tmp\/|127\.0\.0\.1:\d+|auth[_-]?token|session[_-]?token/i.test(html)) throw new Error(`Private path or token in ${phase} DOM`);
      await writeFile(resolve(source, `${prefix}-${phase}.html`), html);
      const portal = await page.evaluate(() => [...document.body.children]
        .filter((element) => element.id !== "root" && element.tagName !== "SCRIPT")
        .map((element) => element.outerHTML).join(""));
      const safePortal = portal.replaceAll(fixture, "hyfrme-fixture").replaceAll(project, "hyfrme-project").replaceAll(root, "hyfrme-project");
      if (/\/home\/|\/tmp\/|127\.0\.0\.1:\d+|auth[_-]?token|session[_-]?token/i.test(safePortal)) throw new Error(`Private path or token in ${phase} portal`);
      await writeFile(resolve(source, `${prefix}-${phase}-portal.html`), safePortal);
    };
    await saved("before");
    for (let frame = 0; frame < frames; frame++) {
      if (frame === events.hover) { await prompt.hover(); await page.waitForTimeout(250); await saved("hover"); }
      if (frame === events.tooltip) {
        await rewind.hover();
        await page.getByText("Edit from here", { exact: true }).waitFor({ timeout: 4000 });
        await page.waitForTimeout(120); await saved("tooltip");
      }
      if (frame === events.confirm) {
        await rewind.click();
        const dialog = page.locator('[data-slot="alert-dialog-popup"]');
        await dialog.waitFor({ state: "visible", timeout: 6000 });
        modalCopy = (await dialog.innerText()).trim();
        for (const phrase of ["Edit from here?", "Rewind chat to before this message.", "Revert files too", "Revert and keep changes"]) {
          if (!modalCopy.includes(phrase)) throw new Error(`Current v0.0.42 dialog missing ${phrase}: ${modalCopy}`);
        }
        await page.waitForTimeout(250); await saved("confirm");
      }
      if (frame === events.cancel) {
        await page.locator('[data-slot="alert-dialog-popup"]').getByRole("button", { name: "Cancel" }).click();
        await page.locator('[data-slot="alert-dialog-popup"]').waitFor({ state: "detached", timeout: 5000 });
        await page.mouse.move(800, 50); await page.waitForTimeout(250); await saved("closed");
      }
      await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
    }
    beforeMessages = await page.locator('[data-timeline-row-kind="message"]').count();
  } finally { await browser.close(); }
  const encoded = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps), "-i",
    resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
  if (encoded.status !== 0) throw new Error(encoded.stderr);
  const sourceDomHashes = Object.fromEntries(await Promise.all(phases.map(async (phase) => [phase, {
    root: hash(await readFile(resolve(source, `${prefix}-${phase}.html`))),
    portal: hash(await readFile(resolve(source, `${prefix}-${phase}-portal.html`))),
  }])));
  await writeFile(resolve(source, `${prefix}-fixture.json`), `${JSON.stringify({
    sourceTag: "v0.0.42", sourceCommit: "719a76ca1dbf5490f1aa33ffb9966301e02be9a9", sourceHashes,
    captureBrowser: { version: run(browserExecutable, ["--version"]), flags }, viewport: { width: 1200, height: 659 },
    fps, frames, theme, phases, events, modalCopy, beforeMessages, sourceDomHashes,
    referenceSha256: hash(await readFile(reference)), providerState: "The completed conversation and checkpoint are seeded; the confirmation was opened and canceled, so no rewind ran." }, null, 2)}\n`);
  console.log(`Captured v0.0.42 Message Rewind in ${theme}; opened and canceled the native dialog without restoring files.`);
} finally { server.kill("SIGTERM"); }
