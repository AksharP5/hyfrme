import assert from "node:assert/strict";

const { default: puppeteer } = await import(
  process.env.HYFRME_PUPPETEER_CORE ?? "puppeteer-core"
);
const browser = await puppeteer.launch({
  executablePath: process.env.HYFRME_CHROMIUM ?? "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--mute-audio"],
});
const page = await browser.newPage();
const mediaRequests = [];
page.on("request", (request) => {
  if (new URL(request.url()).pathname.endsWith(".mp4"))
    mediaRequests.push(request.url());
});
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const home = process.env.HYFRME_TEST_URL ?? "http://localhost:5173";

try {
  await page.setViewport({ width: 1440, height: 900 });
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await page.goto(home, { waitUntil: "networkidle0" });
  assert.equal(mediaRequests.length, 0, "Reduced motion loaded video");
  assert.equal(
    await page.$$eval(".landing-preview-card video", (videos) =>
      videos.every((video) => video.paused && !video.hasAttribute("src")),
    ),
    true,
  );

  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "no-preference" },
  ]);
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".landing-preview-card video")].every(
      (video) => !video.paused && video.currentTime > 0,
    ),
  );
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await page.waitForFunction(() =>
    [...document.querySelectorAll("video")].every((video) => video.paused),
  );

  await page.setViewport({ width: 390, height: 844 });
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "no-preference" },
  ]);
  await page.goto(home, { waitUntil: "networkidle0" });
  const mobile = await page.$$eval(".landing-preview-card video", (videos) =>
    videos.map((video) => ({
      loaded: video.hasAttribute("src"),
      paused: video.paused,
    })),
  );
  assert.deepEqual(mobile, [
    { loaded: true, paused: false },
    { loaded: false, paused: true },
    { loaded: false, paused: true },
  ]);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".landing-preview-card video")].every(
      (video) => video.paused,
    ),
  );
  assert.deepEqual(errors, []);
  console.log(
    "Landing playback passed: reduced motion, preference changes, hidden mobile previews, and offscreen pause.",
  );
} finally {
  await browser.close();
}
