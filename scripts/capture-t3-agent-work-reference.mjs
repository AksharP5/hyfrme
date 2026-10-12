import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.35");
const baseFixture = JSON.parse(await readFile(resolve(source, "brief-fixture.json"), "utf8"));
const url = process.env.T3_REFERENCE_URL;
const serverLog = process.env.T3_SERVER_LOG;
const fixtureDb = process.env.T3_FIXTURE_DB;
const browserExecutable = process.env.HYFRME_CHROMIUM;
if (!url || !serverLog || !fixtureDb || !browserExecutable) {
  throw new Error("Set T3_REFERENCE_URL, T3_SERVER_LOG, T3_FIXTURE_DB, and HYFRME_CHROMIUM for the isolated pinned T3 Code fixture.");
}
const pairingUrl = (await readFile(serverLog, "utf8")).match(/Pairing URL: (\S+)/)?.[1];
if (!pairingUrl || new URL(pairingUrl).origin !== new URL(url).origin) throw new Error("Fixture pairing URL is absent or mismatched");
const browserVersionResult = spawnSync(browserExecutable, ["--version"], { encoding: "utf8" });
const browserVersion = browserVersionResult.stdout.trim();
if (browserVersionResult.status !== 0 || browserVersion !== "Google Chrome for Testing 152.0.7977.30") {
  throw new Error(`Expected HyperFrames Chrome Headless Shell 152.0.7977.30; found ${browserVersion}`);
}
const browserFlags = [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none",
  "--force-color-profile=srgb", "--use-gl=angle", "--use-angle=gl-egl",
  "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
for (const [path, expected] of [
  ["/", baseFixture.sourceHashes.index],
  ["/assets/index-DSuALXPn.css", baseFixture.sourceHashes.css],
  ["/assets/index-CI6tzIRc.js", baseFixture.sourceHashes.js],
]) {
  const response = await fetch(new URL(path, url));
  if (!response.ok || hash(Buffer.from(await response.arrayBuffer())) !== expected) {
    throw new Error(`${path} differs from the pinned T3 Code build`);
  }
}

const frames = 120;
const fps = 30;
const commandFrame = 30;
const detailFrame = 55;
const collapseFrame = 90;
const work = resolve(root, ".work/t3-agent-work-reference");
const reference = resolve(root, "parity/t3-agent-work-reference.mkv");
const fixedNow = new Date();
const startedAt = new Date(fixedNow.getTime() - 125_000).toISOString();
await mkdir(work, { recursive: true });

const setProjection = (phase) => {
  const script = `
import sqlite3, sys
c=sqlite3.connect(sys.argv[1])
phase=sys.argv[2]
started=sys.argv[3]
c.execute("update projection_thread_sessions set status='running',active_turn_id='hyfrme-fixture-logo-intro-turn',last_error=NULL where thread_id='hyfrme-fixture-logo-intro'")
c.execute("update projection_turns set state='running',started_at=?,completed_at=NULL where turn_id='hyfrme-fixture-logo-intro-turn'",(started,))
c.execute("update projection_thread_messages set text='',is_streaming=1 where message_id='hyfrme-fixture-logo-intro-answer'")
kind={'thinking':'tool.started','command':'tool.updated'}[phase]
c.execute("update projection_thread_activities set kind=?,payload_json=json_set(payload_json,'$.status','inProgress') where activity_id='hyfrme-read-source'",(kind,))
c.commit()
`;
  const result = spawnSync("python3", ["-c", script, fixtureDb, phase, startedAt], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr);
};
setProjection("thinking");
const browser = await chromium.launch({ executablePath: browserExecutable, headless: true, args: browserFlags });
let threadAges;
let messageTimes;
let workingDuration;
let activityRows;
let collapsedRows;
try {
  const page = await browser.newPage({ viewport: baseFixture.viewport, deviceScaleFactor: 1, colorScheme: "dark" });
  await page.clock.setFixedTime(fixedNow);
  await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  await page.getByText("Build a logo intro", { exact: true }).click();
  await page.waitForURL(/hyfrme-fixture-logo-intro/);
  await page.waitForTimeout(600);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.mouse.move(800, 50);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  threadAges = await page.locator('[data-testid="sidebar-row-card"]')
    .evaluateAll((rows) => rows.map((row) => row.querySelector('span.tabular-nums.text-secondary-label')?.textContent.trim()));
  messageTimes = await page.locator('[data-timeline-row-kind="message"]')
    .evaluateAll((rows) => rows.map((row) => row.querySelector('p.tabular-nums')?.textContent.trim() ?? ""));
  const thinking = page.locator('[data-timeline-row-kind="working"]');
  if (!(await thinking.innerText()).includes("Thinking")) throw new Error("Native T3 working row lacks Thinking");
  workingDuration = (await thinking.innerText()).match(/Working for ([^\n]+)/)?.[1]?.trim();
  const save = async (phase) => {
    const html = (await page.locator("#root").evaluate((element) => element.innerHTML))
      .replaceAll(resolve(root, ".work/t3-agent-work-project"), "hyfrme-demo")
      .replaceAll("/tmp/hyfrme-t3-demo/registry/blocks/", "registry/blocks/");
    if (/\/home\/|\/tmp\/hyfrme-t3|127\.0\.0\.1:38\d\d|auth[_-]?token|session[_-]?token/i.test(html)) {
      throw new Error(`Captured ${phase} DOM includes local fixture or credential text`);
    }
    await writeFile(resolve(source, `agent-work-${phase}.html`), html);
  };
  await save("thinking");
  for (let frame = 0; frame < frames; frame++) {
    if (frame === commandFrame) {
      setProjection("command");
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
      activityRows = await page.locator('[data-timeline-row-kind="work"]').allInnerTexts();
      if (!activityRows.some((row) => row.includes("npm run verify:showcases"))) {
        throw new Error(`Native expanded Agent Work lacks the command: ${JSON.stringify(activityRows)}`);
      }
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
const encode = spawnSync("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3",
  "-pix_fmt", "gbrp", reference,
], { encoding: "utf8" });
if (encode.status !== 0) throw new Error(encode.stderr);
const sourceDomHashes = Object.fromEntries(await Promise.all(
  ["thinking", "command", "detail", "collapsed"].map(async (phase) => [
    phase, hash(await readFile(resolve(source, `agent-work-${phase}.html`))),
  ]),
));
await writeFile(resolve(source, "agent-work-fixture.json"), `${JSON.stringify({
  sourceTag: baseFixture.sourceTag,
  sourceCommit: baseFixture.sourceCommit,
  sourceHashes: baseFixture.sourceHashes,
  captureBrowser: { executable: browserExecutable, version: browserVersion, flags: browserFlags },
  viewport: baseFixture.viewport,
  fps,
  frames,
  commandFrame,
  detailFrame,
  collapseFrame,
  fixedNow: fixedNow.toISOString(),
  startedAt,
  workingDuration,
  threadAges,
  messageTimes,
  activityRows,
  collapsedRows,
  sourceDomHashes,
  referenceSha256: hash(await readFile(reference)),
}, null, 2)}\n`);
console.log(`Captured ${frames} native T3 Code Agent Work frames across Thinking, live command, expanded detail, and collapsed detail.`);
