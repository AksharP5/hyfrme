import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const release = resolve(root, ".work/t3-v0042-bin/t3-0.0.42-linux-x64");
const source = resolve(root, "assets/t3-code/v0.0.42");
const fixtureSeed = resolve(root, ".work/t3-v0042-composer-fixture");
const projectSeed = resolve(root, ".work/t3-v0042-composer-project");
const theme = process.env.T3_REFERENCE_THEME ?? "dark";
if (!["dark", "light"].includes(theme)) throw new Error("T3_REFERENCE_THEME must be dark or light");
const baseName = theme === "light" ? "brief-v0042-light-fixture.json" : "brief-v0042-fixture.json";
const base = JSON.parse(await readFile(resolve(source, baseName), "utf8"));
const runDir = resolve(root, ".work/t3-prompt-send-v0042-" + theme);
const fixtureDir = resolve(runDir, "fixture");
const projectDir = resolve(runDir, "project");
const work = resolve(runDir, "frames");
const prefix = "prompt-send-v0042-" + theme;
const reference = resolve(root, "parity/t3-prompt-send-v0042-" + theme + "-reference.mkv");
const fixtureDb = resolve(fixtureDir, "userdata/state.sqlite");
const prompt = "Build a four-second Hyfrme Logo Enter preview with a clean final hold.";
const completeFrame = 119;
const frames = 120;
const fps = 30;
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
const command = (program, args, cwd = root) => {
  const result = spawnSync(program, args, { cwd, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(program + " failed: " + result.stderr.slice(-3000));
  return result.stdout.trim();
};
const checkBrowser = command(process.env.HYFRME_CHROMIUM, ["--version"]);
if (checkBrowser !== "Google Chrome for Testing 152.0.7977.30") throw new Error("Unexpected capture browser: " + checkBrowser);
if (command(resolve(release, "t3"), ["--version"]) !== "t3 v0.0.42") throw new Error("Wrong T3 Code release");
await rm(runDir, { recursive: true, force: true });
await cp(fixtureSeed, fixtureDir, { recursive: true });
await cp(projectSeed, projectDir, { recursive: true });
const escapedProject = projectDir.replaceAll("'", "''");
const escapedSeed = projectSeed.replaceAll("'", "''");
command("sqlite3", [fixtureDb, "UPDATE projection_projects SET workspace_root='" + escapedProject +
  "' WHERE workspace_root='" + escapedSeed + "'; UPDATE projection_threads SET worktree_path='" +
  escapedProject + "' WHERE worktree_path='" + escapedSeed + "';"]);
await mkdir(work, { recursive: true });
const server = spawn(resolve(release, "t3"), ["serve", "--mode", "desktop", "--base-dir", fixtureDir,
  "--port", theme === "dark" ? "4080" : "4081", "--host", "127.0.0.1", "--no-browser"],
{ cwd: root, stdio: ["ignore", "pipe", "pipe"] });
let output = "";
let capturedDomHashes;
for (const stream of [server.stdout, server.stderr]) stream.on("data", (chunk) => { output += chunk; });
let browser;
try {
  let pairingUrl;
  for (let attempt = 0; attempt < 120; attempt++) {
    pairingUrl = output.match(/Pairing URL: (\S+)/)?.[1];
    if (pairingUrl) break;
    if (server.exitCode !== null) throw new Error("T3 Code exited before pairing: " + output);
    await sleep(250);
  }
  if (!pairingUrl) throw new Error("T3 Code server did not produce a pairing URL");
  for (const [key, path] of [["index", "/"], ["css", "/assets/main-x9o7QJ8O.css"], ["js", "/assets/index-BMH8bO9q.js"]]) {
    const response = await fetch(new URL(path, pairingUrl));
    if (!response.ok || hash(Buffer.from(await response.arrayBuffer())) !== base.sourceHashes[key]) {
      throw new Error(key + " differs from official T3 Code v0.0.42");
    }
  }
  browser = await chromium.launch({ executablePath: process.env.HYFRME_CHROMIUM, headless: true, args: [
    "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
    "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist",
    "--disable-software-rasterizer",
  ] });
  const page = await browser.newPage({ viewport: base.viewport, deviceScaleFactor: 1, colorScheme: theme });
  await page.clock.setFixedTime(new Date("2026-09-25T11:30:00Z"));
  await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
  const editor = page.locator('[data-testid="composer-editor"]');
  await editor.waitFor({ timeout: 20000 });
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(800, 80);
  await sleep(500);
  const initial = await page.locator("#root").innerText();
  if (!initial.includes("What should we build in hyfrme?")) throw new Error("Expected an empty native composer");
  await editor.fill(prompt);
  await editor.evaluate((element) => element.blur());
  const send = page.getByRole("button", { name: "Send message" });
  if (await send.isDisabled()) throw new Error("Send remains disabled after drafting the prompt");
  const stateVisuals = {};
  const stateHashes = {};
  const transitionKeys = new Map();
  const transitionSequence = [];
  const responseProgress = Array(frames).fill(0);
  let responseStartFrame = null;
  const getState = async () => page.locator("#root").evaluate((root, expected) => {
    const promptBody = [...root.querySelectorAll("[data-user-message-body]")]
      .find((element) => element.textContent.trim() === expected);
    let messageOpacity = null;
    if (promptBody) {
      for (let node = promptBody; node && node !== root; node = node.parentElement) {
        if (node.style.opacity !== "") {
          messageOpacity = Number(getComputedStyle(node).opacity);
          break;
        }
      }
    }
    return {
      html: root.innerHTML,
      scrollPositions: Object.fromEntries([...root.querySelectorAll("[data-id]")]
        .filter((element) => element.scrollTop > 0)
        .map((element) => [element.getAttribute("data-id"), element.scrollTop])),
      messageOpacity,
    };
  }, prompt);
  const sanitize = (html, phase) => {
    const safe = html.replaceAll(runDir, "hyfrme-fixture").replaceAll(projectDir, "hyfrme-demo");
    if (/\/home\/|auth[_-]?token|session[_-]?token|127\.0\.0\.1:408\d/i.test(safe)) {
      throw new Error("Private fixture data in " + phase + " DOM");
    }
    return safe;
  };
  const save = async (phase) => {
    const state = await getState();
    const safe = sanitize(state.html, phase);
    await writeFile(resolve(source, prefix + "-" + phase + ".html"), safe);
    stateVisuals[phase] = { scrollPositions: state.scrollPositions, messageOpacity: state.messageOpacity };
    stateHashes[phase] = hash(Buffer.from(safe));
  };
  const captureStartedAt = Date.now();
  for (let frame = 0; frame < frames; frame++) {
    const scheduledAt = captureStartedAt + frame * 1000 / fps;
    await sleep(Math.max(0, scheduledAt - Date.now()));
    if (frame === 30) {
      await send.click();
      await page.mouse.move(800, 80);
    }
    await page.screenshot({ path: resolve(work, "frame-" + String(frame).padStart(4, "0") + ".png") });
    if (frame === 0) await save("draft");
    if (frame >= 30 && frame <= 45) {
      const state = await getState();
      const safe = sanitize(state.html, "transition frame " + frame);
      const key = hash(Buffer.from(JSON.stringify({ html: safe, ...state })).toString());
      let phase = transitionKeys.get(key);
      if (!phase) {
        phase = "transition-" + String(transitionKeys.size).padStart(2, "0");
        transitionKeys.set(key, phase);
        await writeFile(resolve(source, prefix + "-" + phase + ".html"), safe);
        stateVisuals[phase] = { scrollPositions: state.scrollPositions, messageOpacity: state.messageOpacity };
        stateHashes[phase] = hash(Buffer.from(safe));
      }
      transitionSequence.push(phase);
    }
    if (frame === 46) await save("active");
    const assistantMessages = page.locator('#root [data-message-role="assistant"] .chat-markdown');
    const assistantText = (await assistantMessages.count()) ? (await assistantMessages.last().innerText()).trim() : "";
    responseProgress[frame] = Array.from(assistantText).length;
    if (assistantText && responseStartFrame === null) {
      responseStartFrame = frame;
      await save("stream");
    }
    if (frame === completeFrame) await save("complete");
  }
  if (!transitionSequence.length || transitionSequence.length !== 16) throw new Error("Native send transition was not captured for all sixteen frames");
  base.events = { send: 30, active: 46, transitionFrames: transitionSequence.length,
    responseStart: responseStartFrame, complete: completeFrame };
  base.transitionSequence = transitionSequence;
  base.stateVisuals = stateVisuals;
  base.responseProgress = responseProgress;
  capturedDomHashes = stateHashes;
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
await new Promise((done) => {
  if (server.exitCode !== null) return done();
  server.once("exit", done);
});
const encoded = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
if (encoded.status !== 0) throw new Error(encoded.stderr);
const sourceDomHashes = capturedDomHashes;
const latestThread = "(SELECT thread_id FROM projection_threads ORDER BY created_at DESC LIMIT 1)";
const provider = command("sqlite3", [fixtureDb, `SELECT COALESCE(provider_name,'') || ':' || COALESCE(status,'') FROM provider_session_runtime WHERE thread_id=${latestThread} LIMIT 1;`]);
const response = command("sqlite3", [fixtureDb, `SELECT text FROM projection_thread_messages WHERE thread_id=${latestThread} AND role='assistant' ORDER BY created_at DESC LIMIT 1;`]);
const providerName = provider.split(":")[0];
if (!providerName) throw new Error("T3 Code did not record the provider used for this turn");
await writeFile(resolve(source, prefix + "-fixture.json"), JSON.stringify({
  sourceTag: "v0.0.42", sourceCommit: "719a76ca1dbf5490f1aa33ffb9966301e02be9a9",
  releaseSha256: base.releaseSha256, sourceHashes: base.sourceHashes, viewport: base.viewport,
  fps, frames, theme, events: base.events, prompt, response,
  referenceMode: response ? `native send with live ${providerName} provider response` : `native send with live ${providerName} turn; response pending`,
  providerState: response
    ? `T3 Code sent the prompt to its live ${providerName} provider and recorded the returned answer.`
    : `T3 Code sent the prompt to its live ${providerName} provider. No answer arrived in the four-second capture; the turn remained in Thinking.`,
  sourceDomHashes, stateVisuals: base.stateVisuals, transitionSequence: base.transitionSequence,
  responseProgress: base.responseProgress, referenceSha256: hash(await readFile(reference)),
}, null, 2) + "\n");
console.log("Captured 120 native T3 Code v0.0.42 Prompt Send frames in " + theme + " mode.");
