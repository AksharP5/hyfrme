import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { cp, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const release = resolve(root, ".work/t3-v0042-bin/t3-0.0.42-linux-x64");
const source = resolve(root, "assets/t3-code/v0.0.42");
const theme = process.env.T3_REFERENCE_THEME ?? "dark";
if (!["dark", "light"].includes(theme)) throw new Error("T3_REFERENCE_THEME must be dark or light");
const seedFixture = resolve(root, `.work/t3-v0042-worked-trace-${theme}-fixture`);
const seedProject = resolve(root, ".work/t3-v0042-sidebar-project");
const base = JSON.parse(await readFile(resolve(source, "brief-v0042-fixture.json"), "utf8"));
const fixture = await mkdtemp(resolve(root, `.work/t3-agent-work-v0042-${theme}-fixture-`));
const project = join(fixture, "hyfrme-project");
const db = resolve(fixture, "userdata/state.sqlite");
const prefix = `agent-work-v0042-${theme}`;
const work = resolve(root, `.work/t3-${prefix}-reference`);
const reference = resolve(root, `parity/t3-agent-work-v0042-${theme}-reference.mkv`);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const run = (program, args, cwd = root) => {
  const result = spawnSync(program, args, { cwd, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${program} ${args[0]} failed:\n${result.stderr.slice(-2000)}`);
  return result.stdout.trim();
};
const executablePath = process.env.HYFRME_CHROMIUM;
if (!executablePath) throw new Error("Set HYFRME_CHROMIUM to the pinned HyperFrames Chrome executable");
if (run(resolve(release, "t3"), ["--version"]) !== "t3 v0.0.42") throw new Error("Wrong T3 Code release");
if (run(executablePath, ["--version"]) !== "Google Chrome for Testing 152.0.7977.30") throw new Error("Wrong capture browser");
await cp(seedFixture, fixture, { recursive: true });
await cp(seedProject, project, { recursive: true });
const sqlPath = (path) => path.replaceAll("'", "''");
run("sqlite3", [db, `UPDATE projection_projects SET workspace_root='${sqlPath(project)}' WHERE title='hyfrme';
  UPDATE projection_threads SET worktree_path='${sqlPath(project)}' WHERE project_id=(SELECT project_id FROM projection_projects WHERE title='hyfrme');`]);

const fixedNow = new Date("2026-09-25T11:30:00Z");
const startedAt = new Date(fixedNow.getTime() - 125_000).toISOString();
const commandFrame = 30;
const detailFrame = 55;
const collapseFrame = 90;
const updateProjection = (phase) => {
  const script = `
import sqlite3,sys
import json
c=sqlite3.connect(sys.argv[1]); phase=sys.argv[2]; started=sys.argv[3]
c.execute("UPDATE projection_thread_sessions SET status='running',active_turn_id='hyfrme-fixture-logo-intro-turn',last_error=NULL,updated_at=? WHERE thread_id='hyfrme-fixture-logo-intro'",(started,))
c.execute("UPDATE projection_turns SET state='running',started_at=?,completed_at=NULL WHERE turn_id='hyfrme-fixture-logo-intro-turn'",(started,))
c.execute("UPDATE projection_thread_messages SET text='',is_streaming=1 WHERE message_id='hyfrme-fixture-logo-intro-answer'")
if phase=='thinking':
  c.execute("DELETE FROM projection_thread_activities WHERE activity_id='hyfrme-read-source'")
else:
  payload=json.dumps({"itemType":"command_execution","title":"Verify Logo Enter parity","detail":"npm run verify:showcases","status":"inProgress","data":{"item":{"command":"npm run verify:showcases"}}})
  c.execute("INSERT OR REPLACE INTO projection_thread_activities(activity_id,thread_id,turn_id,tone,kind,summary,payload_json,created_at,sequence) VALUES(?,?,?,?,?,?,?,?,?)",
    ("hyfrme-read-source","hyfrme-fixture-logo-intro","hyfrme-fixture-logo-intro-turn","tool","tool.updated","Verify Logo Enter parity",payload,started,1))
c.commit()
`;
  run("python3", ["-c", script, db, phase, startedAt]);
};
const server = spawn(resolve(release, "t3"), ["serve", "--mode", "desktop", "--base-dir", fixture,
  "--port", theme === "dark" ? "4300" : "4301", "--host", "127.0.0.1", "--no-browser"],
{ cwd: root, stdio: ["ignore", "pipe", "pipe"] });
let output = "";
for (const stream of [server.stdout, server.stderr]) stream.on("data", (chunk) => { output += chunk; });
try {
  let pairingUrl;
  for (let attempt = 0; attempt < 120; attempt++) {
    pairingUrl = output.match(/Pairing URL: (\S+)/)?.[1];
    if (pairingUrl) break;
    if (server.exitCode !== null) throw new Error(`Pinned T3 server exited: ${output.slice(-2000)}`);
    await new Promise((done) => setTimeout(done, 250));
  }
  if (!pairingUrl) throw new Error("Pinned T3 server did not produce a pairing URL");
  for (const [key, path] of [["index", "index.html"], ["css", "assets/main-x9o7QJ8O.css"], ["js", "assets/index-BMH8bO9q.js"]]) {
    const response = await fetch(new URL(key === "index" ? "/" : `/${path}`, pairingUrl));
    if (!response.ok || hash(Buffer.from(await response.arrayBuffer())) !== base.sourceHashes[key]) {
      throw new Error(`${key} differs from the pinned v0.0.42 release`);
    }
  }

  const flags = ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
    "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer"];
  const browser = await chromium.launch({ executablePath, headless: true, args: flags });
  let workingDuration;
  let composerPlaceholder;
  let threadAges;
  let messageTimes;
  let activityRows;
  let collapsedRows;
  try {
    const page = await browser.newPage({ viewport: base.viewport, deviceScaleFactor: 1, colorScheme: theme });
    await page.clock.setFixedTime(fixedNow);
    await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
    await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
    const displayedTheme = await page.evaluate(() => document.documentElement.className.includes("dark") ? "dark" : "light");
    if (displayedTheme !== theme) throw new Error(`Official app displayed ${displayedTheme} under ${theme} capture`);
    await page.getByText("Build a logo intro", { exact: true }).click();
    await page.waitForURL(/hyfrme-fixture-logo-intro/);
    updateProjection("thinking");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator('[data-timeline-row-kind="thinking"]').waitFor({ timeout: 10000 });
    await page.waitForTimeout(600);
    await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
    await page.mouse.move(800, 50);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    threadAges = await page.locator('[data-testid="sidebar-row-card"]')
      .evaluateAll((rows) => rows.map((row) => row.querySelector('span.tabular-nums.text-secondary-label')?.textContent.trim()));
    messageTimes = await page.locator('[data-timeline-row-kind="message"]')
      .evaluateAll((rows) => rows.map((row) => row.querySelector('p.tabular-nums')?.textContent.trim() ?? ""));
    composerPlaceholder = await page.locator('[data-testid="composer-editor"]').getAttribute("aria-placeholder");
    workingDuration = (await page.locator('[data-timeline-row-kind="working"]').innerText())
      .match(/Working for ([^\n]+)/)?.[1]?.trim() ?? "0s";
    const thinking = page.locator('[data-timeline-row-kind="thinking"]');
    const rowDebug = await page.locator("[data-timeline-row-kind]").evaluateAll((rows) => rows.map((row) => ({
      kind: row.getAttribute("data-timeline-row-kind"), text: row.innerText.slice(0, 180),
    })));
    if (!(await thinking.count())) {
      await page.screenshot({ path: resolve(fixture, "agent-work-state-debug.png") });
      throw new Error(`Native running fixture has no Thinking row: ${JSON.stringify(rowDebug)}`);
    }
    const save = async (phase) => {
      const html = (await page.locator("#root").evaluate((element) => element.innerHTML))
        .replaceAll(fixture, "hyfrme-fixture").replaceAll(project, "hyfrme-demo").replaceAll(root, "hyfrme-project");
      if (/\/home\/|\/tmp\/|127\.0\.0\.1:\d+|auth[_-]?token|session[_-]?token/i.test(html)) {
        throw new Error(`Captured ${phase} DOM contains a private fixture path or token`);
      }
      await writeFile(resolve(source, `${prefix}-${phase}.html`), html);
    };
    await save("thinking");
    await mkdir(work, { recursive: true });
    for (let frame = 0; frame < 120; frame++) {
      if (frame === commandFrame) {
        updateProjection("command");
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.locator('[data-timeline-row-kind="work-live"] button').waitFor({ timeout: 12000 });
        await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
        await page.mouse.move(800, 50);
        await page.waitForTimeout(350);
        await save("command");
      }
      if (frame === detailFrame) {
        await page.locator('[data-timeline-row-kind="work-live"] button').click();
        await page.locator('[data-timeline-row-kind="work"]').waitFor();
        await page.locator('[data-timeline-row-kind="work"]').getByText("npm run verify:showcases", { exact: false })
          .waitFor({ timeout: 5000 });
        const expandedRows = await page.locator("[data-timeline-row-kind]").evaluateAll((rows) => rows.map((row) => ({
          kind: row.getAttribute("data-timeline-row-kind"), text: row.innerText.slice(0, 300),
        })));
        if (!JSON.stringify(expandedRows).includes("npm run verify:showcases")) {
          await page.screenshot({ path: resolve(fixture, "agent-work-command-debug.png") });
          throw new Error(`Native expanded Agent Work lacks the command: ${JSON.stringify(expandedRows)}`);
        }
        activityRows = expandedRows;
        await page.mouse.move(800, 50);
        await page.waitForTimeout(350);
        await save("detail");
      }
      if (frame === collapseFrame) {
        await page.locator('[data-timeline-row-kind="work-live"] button').click();
        await page.locator('[data-timeline-row-kind="work"]').waitFor({ state: "detached" });
        await page.mouse.move(800, 50);
        await page.waitForTimeout(350);
        collapsedRows = await page.locator('[data-timeline-row-kind]').evaluateAll((rows) => rows.map((row) => row.getAttribute("data-timeline-row-kind")));
        await save("collapsed");
      }
      await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
    }
  } finally {
    await browser.close();
  }
  const encoded = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", "30",
    "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
  if (encoded.status !== 0) throw new Error(encoded.stderr);
  const phases = ["thinking", "command", "detail", "collapsed"];
  const sourceDomHashes = Object.fromEntries(await Promise.all(phases.map(async (phase) => [
    phase, hash(await readFile(resolve(source, `${prefix}-${phase}.html`))),
  ])));
  await writeFile(resolve(source, `${prefix}-fixture.json`), JSON.stringify({
    sourceTag: "v0.0.42", sourceCommit: "719a76ca1dbf5490f1aa33ffb9966301e02be9a9",
    releaseSha256: base.releaseSha256, sourceHashes: base.sourceHashes,
    captureBrowser: { version: run(executablePath, ["--version"]), flags },
    viewport: base.viewport, fps: 30, frames: 120, theme,
    commandFrame, detailFrame, collapseFrame, fixedNow: fixedNow.toISOString(), startedAt,
    workingDuration, threadAges, messageTimes, activityRows, collapsedRows,
    composerPlaceholder,
    sourceDomHashes, referenceSha256: hash(await readFile(reference)),
    providerState: "The T3 conversation and command event are seeded in an isolated local fixture; no AI provider runs.",
  }, null, 2) + "\n");
  console.log(`Captured 120 official v0.0.42 Agent Work ${theme} frames across Thinking, live command, expansion, and collapse.`);
} finally {
  server.kill("SIGTERM");
}
