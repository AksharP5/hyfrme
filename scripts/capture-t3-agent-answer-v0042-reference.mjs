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
const originalFixture = resolve(root, ".work/t3-agent-answer-fixture");
const originalProject = resolve(root, ".work/t3-agent-answer-project");
const fixture = await mkdtemp(resolve(root, `.work/t3-agent-answer-v0042-${theme}-fixture-`));
const project = join(fixture, "hyfrme-project");
const db = resolve(fixture, "userdata/state.sqlite");
const prefix = `agent-answer-v0042-${theme}`;
const work = resolve(root, `.work/t3-${prefix}-reference`);
const reference = resolve(root, `parity/t3-agent-answer-v0042-${theme}-reference.mkv`);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const run = (program, args, cwd = root) => {
  const result = spawnSync(program, args, { cwd, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${program} failed: ${result.stderr.slice(-2000)}`);
  return result.stdout.trim();
};
const executablePath = process.env.HYFRME_CHROMIUM;
if (!executablePath || run(resolve(release, "t3"), ["--version"]) !== "t3 v0.0.42" ||
    run(executablePath, ["--version"]) !== "Google Chrome for Testing 152.0.7977.30") {
  throw new Error("Expected T3 Code v0.0.42 and the pinned Chrome capture browser");
}
await cp(originalFixture, fixture, { recursive: true });
await cp(originalProject, project, { recursive: true });
run("sqlite3", [db, `UPDATE projection_projects SET workspace_root='${project.replaceAll("'", "''")}' WHERE title='hyfrme';
UPDATE projection_threads SET worktree_path='${project.replaceAll("'", "''")}' WHERE project_id=(SELECT project_id FROM projection_projects WHERE title='hyfrme');`]);
const files = { index: "index.html", css: "assets/main-x9o7QJ8O.css", js: "assets/index-BMH8bO9q.js" };
const sourceHashes = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([key, path]) =>
  [key, hash(await readFile(resolve(release, "client", path)))])));
const server = spawn(resolve(release, "t3"), ["serve", "--mode", "desktop", "--base-dir", fixture,
  "--port", theme === "dark" ? "4320" : "4321", "--host", "127.0.0.1", "--no-browser"], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
let serverOutput = "";
for (const stream of [server.stdout, server.stderr]) stream.on("data", (chunk) => { serverOutput += chunk; });
const phases = ["before", "hover", "tooltip", "copied", "clear"];
const events = { hover: 30, tooltip: 55, copy: 80, clear: 95 };
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
    const response = await fetch(new URL(key === "index" ? "/" : `/${path}`, pairingUrl));
    if (!response.ok || hash(Buffer.from(await response.arrayBuffer())) !== sourceHashes[key]) throw new Error(`${key} differs from v0.0.42`);
  }
  await mkdir(source, { recursive: true });
  await mkdir(work, { recursive: true });
  const browser = await chromium.launch({ executablePath, headless: true, args: flags });
  let answerText;
  let clipboardText;
  let threadAges;
  let messageTimes;
  const interactionTargets = { pointerStart: { x: 800, y: 50 }, pointerExit: { x: 800, y: 50 } };
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 659 }, deviceScaleFactor: 1, colorScheme: theme });
    await page.clock.setFixedTime(new Date("2026-09-25T11:30:00Z"));
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(pairingUrl).origin });
    await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
    await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
    if ((await page.evaluate(() => document.documentElement.classList.contains("dark"))) !== (theme === "dark")) throw new Error(`Unexpected ${theme} theme`);
    const dismissProviderUpdate = async () => {
      const title = page.getByText("Updates Available: 2 providers", { exact: true });
      if (!(await title.count())) return;
      const dismiss = page.getByRole("button", { name: "Dismiss notification" });
      if (!(await dismiss.count())) throw new Error("Provider update notice has no native dismiss control");
      await dismiss.first().click();
      await title.first().waitFor({ state: "detached", timeout: 3000 });
    };
    await page.waitForTimeout(750);
    await dismissProviderUpdate();
    if (await page.getByText("Updates Available: 2 providers", { exact: true }).count()) throw new Error("Provider update notification remained in the answer fixture");
    await page.getByText("Build a logo intro", { exact: true }).click();
    await page.waitForURL(/hyfrme-fixture-logo-intro/);
    const answer = page.locator('[data-timeline-row-kind="message"]').filter({ hasText: "I found the Logo Enter timing" });
    await answer.waitFor({ timeout: 12000 });
    await page.waitForTimeout(1200);
    await dismissProviderUpdate();
    if (await page.getByText("Updates Available: 2 providers", { exact: true }).count()) {
      throw new Error("Provider update notification appeared after entering the seeded answer");
    }
    await page.mouse.move(800, 50);
    await page.evaluate(() => document.fonts.ready);
    threadAges = await page.locator('[data-testid="sidebar-row-card"]')
      .evaluateAll((rows) => rows.map((row) => row.querySelector('span.tabular-nums.text-secondary-label')?.textContent.trim()));
    messageTimes = await page.locator('[data-timeline-row-kind="message"]')
      .evaluateAll((rows) => rows.map((row) => row.querySelector('p.tabular-nums')?.textContent.trim() ?? ""));
    answerText = await answer.innerText();
    const copy = answer.getByRole("button", { name: "Copy link" });
    await copy.waitFor({ timeout: 8000 });
    const saved = async (phase) => {
      const html = (await page.locator("#root").evaluate((element) => element.innerHTML))
        .replaceAll(fixture, "hyfrme-fixture").replaceAll(project, "hyfrme-project").replaceAll(root, "hyfrme-project");
      if (/\/home\/|\/tmp\/|127\.0\.0\.1:\d+|auth[_-]?token|session[_-]?token/i.test(html)) throw new Error(`Private path or token in ${phase} DOM`);
      await writeFile(resolve(source, `${prefix}-${phase}.html`), html);
      const portal = await page.evaluate(() => [...document.body.children]
        .filter((element) => element.id !== "root" && element.tagName !== "SCRIPT").map((element) => element.outerHTML).join(""));
      const safePortal = portal.replaceAll(fixture, "hyfrme-fixture").replaceAll(project, "hyfrme-project").replaceAll(root, "hyfrme-project");
      if (/\/home\/|\/tmp\/|127\.0\.0\.1:\d+|auth[_-]?token|session[_-]?token/i.test(safePortal)) throw new Error(`Private path or token in ${phase} portal`);
      await writeFile(resolve(source, `${prefix}-${phase}-portal.html`), safePortal);
    };
    await saved("before");
    for (let frame = 0; frame < frames; frame++) {
      if (frame === events.hover) {
        await answer.hover();
        const box = await answer.boundingBox();
        if (!box) throw new Error("Native assistant reply has no hover target");
        interactionTargets.answer = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        await page.waitForTimeout(250); await saved("hover");
      }
      if (frame === events.tooltip) {
        await copy.hover();
        const box = await copy.boundingBox();
        if (!box) throw new Error("Native Copy link control has no pointer target");
        interactionTargets.copy = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        await page.getByText("Copy to clipboard", { exact: true }).waitFor({ timeout: 4000 });
        await page.waitForTimeout(120); await saved("tooltip");
      }
      if (frame === events.copy) {
        await copy.click();
        await page.getByText("Copied!", { exact: true }).waitFor({ timeout: 4000 });
        clipboardText = await page.evaluate(() => navigator.clipboard.readText());
        if (clipboardText !== "I found the Logo Enter timing in `registry/blocks/logo-enter/logo-enter.html`. The final pass can extend the duration while keeping the last rendered frame still.") {
          throw new Error("Native T3 copy control did not put the completed reply on the clipboard");
        }
        await page.waitForTimeout(120); await saved("copied");
      }
      if (frame === events.clear) {
        await page.getByText("Copied!", { exact: true }).waitFor({ state: "detached", timeout: 5000 });
        await page.mouse.move(800, 50); await page.waitForTimeout(250); await saved("clear");
      }
      await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
    }
  } finally { await browser.close(); }
  const encoded = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps), "-i",
    resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
  if (encoded.status !== 0) throw new Error(encoded.stderr);
  const sourceDomHashes = Object.fromEntries(await Promise.all(phases.map(async (phase) => [phase, {
    root: hash(await readFile(resolve(source, `${prefix}-${phase}.html`))),
    portal: hash(await readFile(resolve(source, `${prefix}-${phase}-portal.html`))),
  }])));
  await writeFile(resolve(source, `${prefix}-fixture.json`), `${JSON.stringify({ sourceTag: "v0.0.42",
    sourceCommit: "719a76ca1dbf5490f1aa33ffb9966301e02be9a9", sourceHashes,
    captureBrowser: { version: run(executablePath, ["--version"]), flags }, viewport: { width: 1200, height: 659 },
    fps, frames, theme, phases, events, interactionTargets, threadAges, messageTimes, answerText, clipboardText, sourceDomHashes,
    referenceSha256: hash(await readFile(reference)), providerState: "The completed Hyfrme answer is seeded. The native Copy link action ran against the browser clipboard; no AI provider runs." }, null, 2)}\n`);
  console.log(`Captured v0.0.42 Agent Answer in ${theme}; native copy placed the seeded response on the clipboard.`);
} finally { server.kill("SIGTERM"); }
