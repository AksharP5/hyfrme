import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const release = resolve(root, ".work/t3-v0042-bin/t3-0.0.42-linux-x64");
const source = resolve(root, "assets/t3-code/v0.0.42");
const work = resolve(root, `.work/t3-brief-v0042-${process.env.T3_CAPTURE_THEME === "light" ? "light" : "dark"}-reference`);
const project = resolve(root, ".work/t3-v0042-composer-project");
const serverLog = resolve(root, ".work/t3-v0042-composer-server.log");
const theme = process.env.T3_CAPTURE_THEME ?? "dark";
if (theme !== "dark" && theme !== "light") throw new Error("T3_CAPTURE_THEME must be dark or light");
const prefix = theme === "light" ? "brief-v0042-light" : "brief-v0042";
const reference = resolve(root, `parity/t3-brief-to-prompt-v0042${theme === "light" ? "-light" : ""}-reference.mkv`);
const executablePath = process.env.HYFRME_CHROMIUM;
if (!executablePath) throw new Error("Set HYFRME_CHROMIUM to the pinned Chrome executable");
const pairingUrl = (await readFile(serverLog, "utf8")).match(/Pairing URL: (\S+)/)?.[1];
if (!pairingUrl) throw new Error("Start the isolated composer server before capture");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const releaseFiles = {
  index: "client/index.html",
  css: "client/assets/main-x9o7QJ8O.css",
  js: "client/assets/index-BMH8bO9q.js",
};
const sourceHashes = Object.fromEntries(await Promise.all(Object.entries(releaseFiles).map(async ([key, path]) => [
  key, hash(await readFile(resolve(release, path))),
])));
for (const [key, path] of Object.entries(releaseFiles)) {
  const served = await fetch(new URL(`/${path.replace(/^client\//, "")}`, pairingUrl));
  if (!served.ok || hash(Buffer.from(await served.arrayBuffer())) !== sourceHashes[key]) {
    throw new Error(`${key} differs from official T3 Code v0.0.42 release`);
  }
}
const version = spawnSync(resolve(release, "t3"), ["--version"], { encoding: "utf8" });
if (version.status !== 0 || version.stdout.trim() !== "t3 v0.0.42") throw new Error("Unexpected T3 Code build");
const chromeVersion = spawnSync(executablePath, ["--version"], { encoding: "utf8" });
if (chromeVersion.status !== 0 || chromeVersion.stdout.trim() !== "Google Chrome for Testing 152.0.7977.30") {
  throw new Error("Unexpected Chrome build");
}

const viewport = { width: 1200, height: 659 };
const fps = 30;
const frames = 120;
const typingStart = 10;
const typingEnd = 101;
const prompt = "Build a six-second Hyfrme logo intro. Hold the final frame for 18 frames.";
await mkdir(work, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true, args: [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none",
  "--force-color-profile=srgb", "--use-gl=angle", "--use-angle=gl-egl",
  "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
] });
let nativeTheme;
try {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1, colorScheme: theme });
  await page.clock.setFixedTime(new Date("2026-09-25T11:30:00Z"));
  await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
  const editor = page.locator('[data-testid="composer-editor"]');
  await editor.waitFor({ timeout: 20000 });
  await page.waitForTimeout(1000);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(800, 80);
  await page.waitForTimeout(300);
  nativeTheme = await page.evaluate(() => ({
    className: document.documentElement.className,
    background: getComputedStyle(document.body).backgroundColor,
    variables: Object.fromEntries(Array.from(getComputedStyle(document.documentElement))
      .filter((key) => key.startsWith("--"))
      .map((key) => [key, getComputedStyle(document.documentElement).getPropertyValue(key).trim()])),
  }));
  if (theme === "light" && nativeTheme.className.includes("dark")) {
    throw new Error("Native T3 Code remained in dark theme under light color scheme");
  }
  if (theme === "light") await writeFile(resolve(source, "light-theme.json"), JSON.stringify(nativeTheme.variables, null, 2) + "\n");
  const initialText = await page.locator("#root").innerText();
  if (!initialText.includes("What should we build in hyfrme?")) throw new Error("Expected native empty thread composer");
  const shell = (await page.locator("#root").evaluate((element) => element.innerHTML)).replaceAll(project, "hyfrme-project");
  if (/\/home\/|auth[_-]?token|session[_-]?token|127\.0\.0\.1:3906/i.test(shell)) {
    throw new Error("Private data in captured composer DOM");
  }
  await writeFile(resolve(source, `${prefix}-shell.html`), shell);
  let previousCount = 0;
  for (let frame = 0; frame < frames; frame++) {
    const progress = Math.max(0, Math.min(1, (frame - typingStart) / (typingEnd - typingStart)));
    const count = Math.round(prompt.length * progress);
    if (count !== previousCount) {
      await editor.fill(prompt.slice(0, count));
      await editor.evaluate((element) => element.blur());
      previousCount = count;
    }
    await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
  const finalText = await editor.innerText();
  if (finalText !== prompt) throw new Error("Native composer did not retain full prompt");
} finally {
  await browser.close();
}
const encode = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
if (encode.status !== 0) throw new Error(encode.stderr);
  await writeFile(resolve(source, `${prefix}-fixture.json`), JSON.stringify({
  sourceTag: "v0.0.42", sourceCommit: "719a76ca1dbf5490f1aa33ffb9966301e02be9a9",
  releaseSha256: "f504e931ee4406bfe76754147cb0e2a0f300d75c6c505a0e174a1e79f65ceea3",
  sourceHashes, viewport, fps, frames, prompt, typingStart, typingEnd,
  theme, nativeThemeClass: nativeTheme.className,
  shellSha256: hash(await readFile(resolve(source, `${prefix}-shell.html`))),
  referenceSha256: hash(await readFile(reference)),
}, null, 2) + "\n");
console.log(`Captured ${frames} native T3 Code v0.0.42 Brief to Prompt ${theme} frames.`);
