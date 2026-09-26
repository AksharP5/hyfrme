import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import { ideas } from "../public/ideas/data.js";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const manifest = JSON.parse(await readFile("parity/t3code-ideas.json", "utf8"));
const selectedId = Number(process.argv.find((argument) => argument.startsWith("--idea="))?.slice(7));
const selected = (idea) => !Number.isInteger(selectedId) || idea === selectedId;
const browser = await chromium.launch({
  executablePath: process.env.HYFRME_CHROMIUM ?? "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const work = await mkdtemp(join(tmpdir(), "hyfrme-t3-parity-"));

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, colorScheme: "light" });
  await page.goto(process.env.HYFRME_PREVIEW_URL ?? "http://127.0.0.1:5173/ideas/index.html", { waitUntil: "domcontentloaded" });

  for (const { idea, step, reference, sha256, sourceVideo, sourceFrame, nativeFramePngSha256 } of manifest.frames.filter((frame) => selected(frame.idea))) {
    const source = resolve(reference);
    const hash = createHash("sha256").update(await readFile(source)).digest("hex");
    if (hash !== sha256) throw new Error(`${reference} changed since capture`);

    const nativeFrame = join(work, `${idea}-${step}-native.png`);
    const extraction = spawnSync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-y", "-i", resolve(sourceVideo),
      "-vf", `select=eq(n\\,${sourceFrame})`, "-frames:v", "1", nativeFrame,
    ], { encoding: "utf8" });
    if (extraction.status !== 0) throw new Error(`Native frame ${idea}-${step}: ${extraction.stderr}`);
    const nativeHash = createHash("sha256").update(await readFile(nativeFrame)).digest("hex");
    const nativeComparison = spawnSync("ffmpeg", [
      "-hide_banner", "-i", nativeFrame, "-i", source, "-lavfi", "ssim", "-f", "null", "-",
    ], { encoding: "utf8" });
    const nativeScore = Number(nativeComparison.stderr.match(/All:([\d.]+)/)?.[1]);
    if (nativeHash !== nativeFramePngSha256 || nativeComparison.status !== 0 || nativeScore < 0.999999) {
      throw new Error(`Gallery still ${idea}-${step} differs from its native parity fixture: ${nativeScore}`);
    }

    if (step === "a") await page.locator(`[data-idea="${idea}"] [data-open="${idea}"]`).first().click();
    await page.locator("#detail-scene img").evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
    await page.locator("#detail-scene").evaluate((scene, step) => {
      const video = scene.querySelector("video");
      video.pause();
      video.style.display = "none";
      scene.querySelectorAll(".t3-shot").forEach((image) => {
        image.style.opacity = image.classList.contains(`t3-shot-${step}`) ? "1" : "0";
      });
    }, step);

    const box = await page.locator("#detail-scene").boundingBox();
    if (Math.round(box.width) !== 1200 || Math.round(box.height) !== 659) {
      throw new Error(`Concept ${idea} rendered at ${box.width} × ${box.height}, expected 1200 × 659`);
    }

    const rendered = join(work, `${idea}-${step}.png`);
    await page.locator("#detail-scene").screenshot({ path: rendered });
    const result = spawnSync("ffmpeg", ["-hide_banner", "-i", source, "-i", rendered, "-lavfi", "ssim", "-f", "null", "-"], { encoding: "utf8" });
    const score = Number(result.stderr.match(/All:([\d.]+)/)?.[1]);
    if (result.status !== 0 || !Number.isFinite(score) || score < 0.999999) {
      throw new Error(`Concept ${idea}-${step} SSIM: ${score}; ${result.stderr.slice(-500)}`);
    }
    if (step === "c") await page.locator("#detail-close").click();
  }

  let minimumVideoSsim = 1;
  for (const { idea, path, sha256, frames, sourceVideo, sourceVideoSha256 } of manifest.recordings.filter((recording) => selected(recording.idea))) {
    const source = resolve(path);
    const hash = createHash("sha256").update(await readFile(source)).digest("hex");
    if (hash !== sha256) throw new Error(`${path} changed since capture`);
    const nativeHash = createHash("sha256").update(await readFile(resolve(sourceVideo))).digest("hex");
    if (nativeHash !== sourceVideoSha256) throw new Error(`${sourceVideo} changed since capture`);

    await page.locator(`[data-idea="${idea}"] [data-open="${idea}"]`).first().click();
    const video = page.locator("#detail-scene video");
    await video.evaluate((element) => new Promise((resolve) => {
      if (element.readyState >= 1) resolve();
      else element.addEventListener("loadedmetadata", resolve, { once: true });
    }));

    for (const frame of [0, Math.floor(frames / 2), frames - 2]) {
      await video.evaluate(async (element, index) => {
        element.pause();
        const time = (index + 0.5) / 30;
        if (Math.abs(element.currentTime - time) > 0.0001) {
          const seeked = new Promise((resolve) => element.addEventListener("seeked", resolve, { once: true }));
          element.currentTime = time;
          await seeked;
        }
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        // Chrome can report seeked before the decoded frame replaces the poster.
        await new Promise((resolve) => setTimeout(resolve, 400));
      }, frame);

      const rendered = join(work, `${idea}-${frame}-gallery.png`);
      const reference = join(work, `${idea}-${frame}-source.png`);
      await page.locator("#detail-scene").screenshot({ path: rendered });
      const extraction = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", source, "-vf", `select=eq(n\\,${frame}),format=rgb24,crop=1200:659:0:0`, "-frames:v", "1", reference], { encoding: "utf8" });
      if (extraction.status !== 0) throw new Error(`Video frame ${idea}-${frame}: ${extraction.stderr}`);
      const comparison = spawnSync("ffmpeg", ["-hide_banner", "-i", reference, "-i", rendered, "-lavfi", "ssim", "-f", "null", "-"], { encoding: "utf8" });
      const score = Number(comparison.stderr.match(/All:([\d.]+)/)?.[1]);
      if (comparison.status !== 0 || !Number.isFinite(score) || score < manifest.verification.videoSsimThreshold) {
        throw new Error(`Video frame ${idea}-${frame} SSIM: ${score}; ${comparison.stderr.slice(-500)}`);
      }
      minimumVideoSsim = Math.min(minimumVideoSsim, score);
    }
    await page.locator("#detail-close").click();
  }
  for (const idea of ideas.filter((idea) => selected(idea.id))) {
    const card = page.locator(`[data-idea="${idea.id}"]`);
    if (await card.count() !== 1) throw new Error(`Missing gallery item ${idea.id}`);
    await card.locator(`[data-open="${idea.id}"]`).first().click();
    const link = await page.locator("#detail-install-link").getAttribute("href");
    if (link !== `/components/${idea.block}`) throw new Error(`Broken catalog link for ${idea.id}: ${link}`);
    await page.locator("#detail-close").click();
    await card.locator(".preview-open").hover();
    await card.locator("video.t3-motion").evaluate((video) => new Promise((resolve, reject) => {
      const started = Date.now();
      const timer = setInterval(() => {
        if (!video.paused && video.currentTime > 0.05) { clearInterval(timer); resolve(); }
        if (Date.now() - started > 5000) { clearInterval(timer); reject(new Error("Hover clip did not play")); }
      }, 50);
    }));
  }
  const count = ideas.filter((idea) => selected(idea.id)).length;
  console.log(`${count * 3} stills match pixel for pixel; ${count * 3} video samples scored at least ${minimumVideoSsim.toFixed(6)} SSIM; ${count} links and hover clips work.`);
} finally {
  await browser.close();
  await rm(work, { recursive: true, force: true });
}
