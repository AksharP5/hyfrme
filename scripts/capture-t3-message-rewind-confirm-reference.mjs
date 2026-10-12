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
const browserExecutable = process.env.HYFRME_CHROMIUM;
if (!url || !serverLog || !browserExecutable) {
  throw new Error("Set T3_REFERENCE_URL, T3_SERVER_LOG, and HYFRME_CHROMIUM for the isolated pinned T3 Code fixture.");
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
const hoverFrame = 25;
const tooltipFrame = 45;
const confirmFrame = 65;
const applyFrame = 85;
const persistedFrame = 105;
const work = resolve(root, ".work/t3-message-rewind-confirm-reference");
const reference = resolve(root, "parity/t3-message-rewind-confirm-reference.mkv");
const fixturePath = resolve(root, ".work/t3-message-rewind-confirm-project");
const database = resolve(root, ".work/t3-message-rewind-confirm-fixture/userdata/state.sqlite");
const projectFile = resolve(fixturePath, "registry/blocks/logo-enter/logo-enter.html");
const threadId = "hyfrme-fixture-logo-intro";
const query = (sql) => {
  const result = spawnSync("sqlite3", [database, sql], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout.trim();
};
const baselineResult = spawnSync("git", ["-C", fixturePath, "show", "refs/t3/checkpoints/aHlmcm1lLWZpeHR1cmUtbG9nby1pbnRybw/turn/0:registry/blocks/logo-enter/logo-enter.html"], { encoding: "utf8" });
if (baselineResult.status !== 0) throw new Error(baselineResult.stderr);
const baselineFile = baselineResult.stdout;
if ((await readFile(projectFile, "utf8")) === baselineFile ||
    query(`select count(*) from projection_turns where thread_id='${threadId}'`) !== "1" ||
    query(`select count(*) from projection_thread_messages where thread_id='${threadId}'`) !== "2") {
  throw new Error("Confirm fixture needs one checkpointed turn, two messages, and a changed Hyfrme file");
}
await mkdir(work, { recursive: true });

const browser = await chromium.launch({ executablePath: browserExecutable, headless: true, args: browserFlags });
let threadAges;
let messageTimes;
let modalCopy;
let afterState;
let persistedState;
const phases = ["before", "hover", "tooltip", "dialog", "rewound", "persisted"];
try {
  const page = await browser.newPage({ viewport: baseFixture.viewport, deviceScaleFactor: 1, colorScheme: "dark" });
  await page.clock.setFixedTime(new Date());
  await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  await page.getByText("Build a logo intro", { exact: true }).click();
  await page.waitForURL(/hyfrme-fixture-logo-intro/);
  const prompt = page.locator('[data-timeline-row-kind="message"]').filter({ hasText: "Build a six-second Hyfrme logo intro" });
  await prompt.waitFor({ timeout: 12000 });
  const rewind = prompt.getByRole("button", { name: "Revert to this message" });
  if (!(await rewind.count())) throw new Error("Native T3 did not expose Revert to this message for the checkpointed user prompt");
  await page.waitForTimeout(2200);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.mouse.move(800, 50);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  if (await page.getByText(/Updates Available/).isVisible().catch(() => false)) {
    throw new Error("Provider-update toast remained visible before native capture");
  }
  threadAges = await page.locator('[data-testid="sidebar-row-card"]')
    .evaluateAll((rows) => rows.map((row) => row.querySelector('span.tabular-nums.text-secondary-label')?.textContent.trim()));
  messageTimes = await page.locator('[data-timeline-row-kind="message"]')
    .evaluateAll((rows) => rows.map((row) => row.querySelector('p.tabular-nums')?.textContent.trim() ?? ""));
  const save = async (phase) => {
    const html = (await page.locator("#root").evaluate((element) => element.innerHTML))
      .replaceAll(fixturePath, "hyfrme-demo")
      .replaceAll("/tmp/hyfrme-t3-demo/registry/blocks/", "registry/blocks/");
    if (/\/home\/|\/tmp\/hyfrme-t3|127\.0\.0\.1:\d{4,5}|auth[_-]?token|session[_-]?token/i.test(html)) {
      throw new Error(`Captured ${phase} DOM includes local fixture or credential text`);
    }
    await writeFile(resolve(source, `message-rewind-confirm-${phase}.html`), html);
    const portal = await page.evaluate(() => [...document.body.children]
      .filter((element) => element.id !== "root" && element.tagName !== "SCRIPT")
      .map((element) => element.outerHTML).join(""));
    if (/\/home\/|\/tmp\/hyfrme-t3|127\.0\.0\.1:\d{4,5}|auth[_-]?token|session[_-]?token/i.test(portal)) {
      throw new Error(`Captured ${phase} portal includes local fixture or credential text`);
    }
    await writeFile(resolve(source, `message-rewind-confirm-${phase}-portal.html`), portal);
  };
  await save("before");
  for (let frame = 0; frame < frames; frame++) {
    if (frame === hoverFrame) {
      await prompt.hover();
      await page.waitForTimeout(300);
      await save("hover");
    }
    if (frame === tooltipFrame) {
      await rewind.hover();
      await page.getByText("Revert to this message", { exact: true }).waitFor({ timeout: 4000 });
      await page.waitForTimeout(150);
      await save("tooltip");
    }
    if (frame === confirmFrame) {
      await rewind.click();
      const dialog = page.locator('[data-slot="alert-dialog-popup"]');
      await dialog.waitFor({ state: "visible", timeout: 6000 });
      modalCopy = (await dialog.innerText()).trim();
      if (!modalCopy.includes("Revert this thread to checkpoint 0?") || !modalCopy.includes("This action cannot be undone.")) {
        throw new Error(`Native T3 confirmation differs from source: ${modalCopy}`);
      }
      await page.waitForTimeout(350);
      await save("dialog");
    }
    if (frame === applyFrame) {
      await page.locator('[data-slot="alert-dialog-popup"]').getByRole("button", { name: "Confirm" }).click();
      await page.locator('[data-slot="alert-dialog-popup"]').waitFor({ state: "detached", timeout: 5000 });
      await page.mouse.move(800, 50);
      for (let attempt = 0; attempt < 50; attempt++) {
        if ((await readFile(projectFile, "utf8")) === baselineFile &&
            Number(query(`select count(*) from projection_turns where thread_id='${threadId}'`)) < 1 &&
            Number(query(`select count(*) from projection_thread_messages where thread_id='${threadId}'`)) < 2) break;
        await page.waitForTimeout(200);
      }
      afterState = {
        turns: Number(query(`select count(*) from projection_turns where thread_id='${threadId}'`)),
        messages: Number(query(`select count(*) from projection_thread_messages where thread_id='${threadId}'`)),
        fileSha256: hash(await readFile(projectFile)),
      };
      if (afterState.fileSha256 !== hash(Buffer.from(baselineFile)) || afterState.turns !== 0 || afterState.messages >= 2) {
        await page.screenshot({ path: resolve(work, "diagnostic-confirm-failure.png") });
        const bodyText = (await page.locator("#root").innerText()).slice(-2500);
        throw new Error(`Native confirm did not rewind the thread/worktree: ${JSON.stringify(afterState)}; UI: ${bodyText}`);
      }
      await page.waitForTimeout(450);
      await save("rewound");
    }
    if (frame === persistedFrame) {
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
      await page.waitForTimeout(2200);
      await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
      await page.mouse.move(800, 50);
      await page.waitForTimeout(450);
      persistedState = {
        turns: Number(query(`select count(*) from projection_turns where thread_id='${threadId}'`)),
        messages: Number(query(`select count(*) from projection_thread_messages where thread_id='${threadId}'`)),
        fileSha256: hash(await readFile(projectFile)),
      };
      if (JSON.stringify(persistedState) !== JSON.stringify(afterState)) {
        throw new Error(`Native confirmed rewind did not survive reload: ${JSON.stringify(persistedState)}`);
      }
      if (await page.getByText(/Updates Available/).isVisible().catch(() => false)) {
        throw new Error("Provider-update toast remained visible after reload");
      }
      await save("persisted");
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
const sourceDomHashes = Object.fromEntries(await Promise.all(phases.map(async (phase) => [
  phase, {
    root: hash(await readFile(resolve(source, `message-rewind-confirm-${phase}.html`))),
    portal: hash(await readFile(resolve(source, `message-rewind-confirm-${phase}-portal.html`))),
  },
])));
await writeFile(resolve(source, "message-rewind-confirm-fixture.json"), `${JSON.stringify({
  sourceTag: baseFixture.sourceTag,
  sourceCommit: baseFixture.sourceCommit,
  sourceHashes: baseFixture.sourceHashes,
  captureBrowser: { executable: browserExecutable, version: browserVersion, flags: browserFlags },
  viewport: baseFixture.viewport,
  fps,
  frames,
  hoverFrame,
  tooltipFrame,
  confirmFrame,
  applyFrame,
  persistedFrame,
  baselineFileSha256: hash(Buffer.from(baselineFile)),
  afterState,
  persistedState,
  threadAges,
  messageTimes,
  modalCopy,
  sourceDomHashes,
  referenceSha256: hash(await readFile(reference)),
}, null, 2)}\n`);
console.log(`Captured ${frames} native T3 Code Message Rewind Confirm frames across hover, dialog, confirmed worktree rewind, and reload.`);
