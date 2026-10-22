import assert from "node:assert/strict";
const { default: puppeteer } = await import(
  process.env.HYFRME_PUPPETEER_CORE ?? "puppeteer-core"
);

const browser = await puppeteer.launch({
  executablePath: process.env.HYFRME_CHROMIUM ?? "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--mute-audio"],
});
const errors = [];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function setup() {
  const page = await browser.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setCacheEnabled(false);
  const requests = [];
  let holding = true;
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (holding && request.url().includes(".mp4")) requests.push(request);
    else request.continue().catch(() => {});
  });
  await page.evaluateOnNewDocument(() => {
    const play = HTMLMediaElement.prototype.play;
    window.mediaPlays = [];
    window.pendingPlays = [];
    HTMLMediaElement.prototype.play = function () {
      window.mediaPlays.push({
        video: this,
        connected: this.isConnected,
        time: this.currentTime,
      });
      const result = play.call(this);
      if (!window.holdPlay) return result;
      result.catch(() => {});
      return new Promise((resolve, reject) =>
        window.pendingPlays.push({ resolve, reject }),
      );
    };
    const add = EventTarget.prototype.addEventListener;
    const remove = EventTarget.prototype.removeEventListener;
    window.mediaListeners = new Map();
    EventTarget.prototype.addEventListener = function (type, fn, options) {
      if (
        this instanceof HTMLVideoElement &&
        ["canplay", "seeked", "error"].includes(type)
      ) {
        if (!window.mediaListeners.has(this))
          window.mediaListeners.set(this, new Map());
        const listeners = window.mediaListeners.get(this);
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type).add(fn);
      }
      return add.call(this, type, fn, options);
    };
    EventTarget.prototype.removeEventListener = function (type, fn, options) {
      window.mediaListeners.get(this)?.get(type)?.delete(fn);
      return remove.call(this, type, fn, options);
    };
  });
  await page.goto(
    new URL(
      "/components/matrix-decode",
      process.env.HYFRME_TEST_URL ?? "http://localhost:5173",
    ).href,
    { waitUntil: "domcontentloaded" },
  );
  await page.waitForSelector(".verification-details summary");
  await page.click(".verification-details summary");
  await page.waitForSelector(".comparison-player video");
  await page.evaluate(() => {
    window.originalVideos = [
      ...document.querySelectorAll(".comparison-player video"),
    ];
    window.baselineListeners = window.originalVideos.map((video) =>
      Object.fromEntries(
        [...window.mediaListeners.get(video)].map(([type, listeners]) => [
          type,
          listeners.size,
        ]),
      ),
    );
  });
  const release = async () => {
    holding = false;
    await Promise.all(
      requests.splice(0).map((request) => request.continue().catch(() => {})),
    );
  };
  return { page, release };
}
async function snapshot(page) {
  return page.evaluate(() => ({
    button: document
      .querySelector(".comparison-player .play-button")
      ?.textContent.trim(),
    time: document.querySelector(".comparison-player .timecode")?.textContent,
    videos: [...document.querySelectorAll(".comparison-player video")].map(
      (v) => ({
        time: v.currentTime,
        paused: v.paused,
        ready: v.readyState,
        duration: v.duration,
      }),
    ),
    oldVideos: window.originalVideos.map((v) => ({
      time: v.currentTime,
      paused: v.paused,
      connected: v.isConnected,
    })),
    plays: window.mediaPlays
      .filter((x) => window.originalVideos.includes(x.video))
      .map(({ connected, time }) => ({ connected, time })),
    listeners: window.originalVideos.map((video) =>
      Object.fromEntries(
        [...window.mediaListeners.get(video)].map(([type, listeners]) => [
          type,
          listeners.size,
        ]),
      ),
    ),
    baseline: window.baselineListeners,
  }));
}
const play = (page) => page.click(".comparison-player .play-button");
const seek = (page, time) =>
  page.$eval(
    '[aria-label="Seek both renders"]',
    (input, time) => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      ).set.call(input, String(time));
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    },
    time,
  );
async function loaded(page) {
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll(".comparison-player video")].length === 2 &&
      [...document.querySelectorAll(".comparison-player video")].every(
        (video) => video.readyState >= 3,
      ),
  );
  await sleep(300);
}
try {
  for (const action of ["seek", "view", "pause", "unmount", "error"]) {
    const { page, release } = await setup();
    await play(page);
    let state = await snapshot(page);
    assert.match(state.button, /Pause/);
    assert(state.videos.every((video) => video.ready === 0));
    if (action === "seek") await seek(page, 1.2);
    if (action === "error")
      await page.$eval(".comparison-player video", (video) =>
        video.dispatchEvent(new Event("error")),
      );
    if (action === "view")
      await page.$eval(
        ".comparison-toolbar .segmented-control button:nth-child(2)",
        (button) => button.click(),
      );
    if (action === "pause") await play(page);
    if (action === "unmount")
      await page.$eval(".verification-details summary", (button) =>
        button.click(),
      );
    await sleep(30);
    state = await snapshot(page);
    assert.equal(state.plays.length, 0);
    assert.deepEqual(
      state.listeners,
      state.baseline,
      "waiting listeners must be removed on cancellation",
    );
    await release();
    if (action !== "unmount") await loaded(page);
    else await sleep(600);
    state = await snapshot(page);
    assert.equal(state.plays.length, 0, "cancelled startup called play");
    assert(state.oldVideos.every((video) => video.paused));
    assert(state.videos.every((video) => video.paused));
    if (action === "seek")
      assert(state.videos.every((video) => Math.abs(video.time - 1.2) < 0.01));
    if (action !== "unmount") assert.match(state.button, /Play/);
    console.log(`Passed delayed Play -> ${action}`);
    if (action === "seek") {
      await play(page);
      await page.waitForFunction(() =>
        [...document.querySelectorAll(".comparison-player video")].every(
          (video) => !video.paused && video.currentTime > 1.35,
        ),
      );
      await play(page);
      state = await snapshot(page);
      assert(state.videos.every((video) => video.paused && video.time > 1.35));
      assert.match(state.button, /Play/);
      console.log("Passed ordinary play/pause from seek position");
    }
    await page.close();
  }
  {
    const { page, release } = await setup();
    await release();
    await loaded(page);
    await page.evaluate(() => (window.holdPlay = true));
    await play(page);
    await page.waitForFunction(() => window.pendingPlays.length === 2);
    await play(page);
    await page.evaluate(() => (window.holdPlay = false));
    await play(page);
    await page.waitForFunction(() =>
      [...document.querySelectorAll(".comparison-player video")].every(
        (video) => !video.paused && video.currentTime > 0.15,
      ),
    );
    await page.evaluate(() =>
      window.pendingPlays.forEach(({ reject }) =>
        reject(new DOMException("Older play interrupted", "AbortError")),
      ),
    );
    await sleep(200);
    let state = await snapshot(page);
    assert.match(state.button, /Pause/);
    assert(
      state.videos.every((video) => !video.paused && video.time > 0.25),
      "stale catch paused newer playback",
    );
    console.log("Passed late rejection while newer playback is active");
    await page.$eval(".verification-details summary", (button) =>
      button.click(),
    );
    await sleep(100);
    state = await snapshot(page);
    assert(state.oldVideos.every((video) => video.paused));
    console.log("Passed unmount while playing");
    await page.close();
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
