import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createT3V0042Capture } from "./t3-v0042-capture-common.mjs";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const theme = process.env.T3_CAPTURE_THEME ?? "dark";
if (theme !== "dark" && theme !== "light") throw new Error("T3_CAPTURE_THEME must be dark or light");
const prefix = theme === "light" ? "brief-v0042-light" : "brief-v0042";
const fixture = JSON.parse(await readFile(resolve(source, `${prefix}-fixture.json`), "utf8"));
const { viewport, fps, frames, prompt, typingStart, typingEnd } = fixture;
const activeThreadTitles = fixture.captureSeed?.activeThreadTitles ?? [
  "Build a logo intro", "Catalog motion audit", "Grouped logo tests", "Review final hold", "Search reveal timing",
];
const output = resolve(process.env.T3_CAPTURE_OUTPUT_DIR ?? source);
const work = resolve(process.env.T3_CAPTURE_WORK_DIR ?? resolve(root, `.work/t3-brief-v0042-${theme}-reference`));
const reference = resolve(process.env.T3_CAPTURE_REFERENCE ?? resolve(root, `parity/t3-brief-to-prompt-v0042${theme === "light" ? "-light" : ""}-reference.mkv`));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
await mkdir(output, { recursive: true });
await mkdir(work, { recursive: true });
const capture = await createT3V0042Capture({ slug: "t3-brief", theme, seed: "composer", chromium: process.env.HYFRME_CHROMIUM, initialThread: null });
let nativeTheme;
const samples = [];
const frameHashes = [];
try {
  const { page } = capture;
  await page.getByRole("button", { name: "New thread", exact: true }).click();
  const editor = page.locator('[data-testid="composer-editor"]');
  await editor.waitFor({ timeout: 20000 });
  await page.waitForTimeout(300);
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
  if (theme === "light" && nativeTheme.className.includes("dark")) throw new Error("Native T3 Code remained in dark theme");
  const initialText = await page.locator("#root").innerText();
  if (!initialText.includes("What should we build in hyfrme?")) throw new Error("Expected native empty thread composer");
  if ((await editor.innerText()).trim() !== "") throw new Error("Native composer seed retained a draft");
  const rows = await page.locator('[data-testid="sidebar-row-card"]').allTextContents();
  if (rows.length !== activeThreadTitles.length || rows.some((text, index) => !text.includes(activeThreadTitles[index]))) {
    throw new Error("Native sidebar seed differs from the canonical five active threads; restore the isolated synthetic fixture before capture");
  }
  const shell = capture.clean(await page.locator("#root").evaluate((element) => element.innerHTML));
  if (/\/home\/|auth[_-]?token|session[_-]?token|127\.0\.0\.1:/i.test(shell)) throw new Error("Private data in captured composer DOM");
  await writeFile(resolve(output, `${prefix}-shell.html`), shell);
  if (theme === "light") await writeFile(resolve(output, "light-theme.json"), JSON.stringify(nativeTheme.variables, null, 2) + "\n");
  await page.evaluate(() => {
    if (document.getAnimations().length !== 0) throw new Error("Native composer animations did not settle before capture");
    window.__hyfrmeNativeCaptureAnimations = new WeakMap();
  });
  let previousCount = 0;
  for (let frame = 0; frame < frames; frame++) {
    const progress = Math.max(0, Math.min(1, (frame - typingStart) / (typingEnd - typingStart)));
    const count = Math.round(prompt.length * progress);
    if (count !== previousCount) {
      await editor.fill(prompt.slice(0, count));
      await editor.evaluate((element) => element.blur());
      previousCount = count;
    }
    // Date stays fixed for sidebar ages; CSS motion advances only on the source frame clock.
    const sample = await page.evaluate(({ frame, fps, count }) => {
      const button = document.querySelector('button[type="submit"][aria-label="Send message"]');
      if (!button || button.disabled !== (count === 0)) throw new Error("Native Submit state did not settle");
      getComputedStyle(button).opacity;
      const animations = document.getAnimations().map((animation) => {
        let firstFrame = window.__hyfrmeNativeCaptureAnimations.get(animation);
        if (firstFrame === undefined) {
          firstFrame = frame;
          window.__hyfrmeNativeCaptureAnimations.set(animation, firstFrame);
        }
        animation.pause();
        animation.currentTime = (frame - firstFrame) * 1000 / fps;
        const timing = animation.effect.getTiming();
        return { type: animation.constructor.name, property: animation.transitionProperty ?? null,
          firstFrame, currentTime: animation.currentTime, duration: timing.duration, easing: timing.easing };
      });
      return { frame, count, submitOpacity: getComputedStyle(button).opacity, animations };
    }, { frame, fps, count });
    samples.push(sample);
    const png = await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
    frameHashes.push(hash(png));
  }
  if (await editor.innerText() !== prompt) throw new Error("Native composer did not retain full prompt");
} finally {
  await capture.stop();
}
const encode = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
if (encode.status !== 0) throw new Error(encode.stderr);
const clock = { method: "native-css-animation-current-time", frameStepMilliseconds: 1000 / fps, samples };
await writeFile(resolve(work, "capture.json"), JSON.stringify({ sourceCommit: fixture.sourceCommit, theme, clock, frameHashes }, null, 2) + "\n");
await writeFile(resolve(output, `${prefix}-fixture.json`), JSON.stringify({
  sourceTag: fixture.sourceTag, sourceCommit: fixture.sourceCommit, releaseSha256: fixture.releaseSha256,
  sourceHashes: fixture.sourceHashes, viewport, fps, frames, prompt, typingStart, typingEnd,
  theme, nativeThemeClass: nativeTheme.className, captureClock: clock,
  captureSeed: { activeThreadTitles, fixedDate: "2026-09-25T11:30:00Z" },
  shellSha256: hash(await readFile(resolve(output, `${prefix}-shell.html`))), referenceSha256: hash(await readFile(reference)),
}, null, 2) + "\n");
console.log(`Captured ${frames} native T3 Code v0.0.42 Brief to Prompt ${theme} frames on the CSS frame clock.`);
