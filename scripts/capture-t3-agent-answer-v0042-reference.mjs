import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createT3V0042Capture, flags } from "./t3-v0042-capture-common.mjs";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const theme = process.env.T3_REFERENCE_THEME ?? "dark";
if (!["dark", "light"].includes(theme))
  throw new Error("T3_REFERENCE_THEME must be dark or light");
const prefix = `agent-answer-v0042-${theme}`;
const baseline = JSON.parse(
  await readFile(resolve(source, `${prefix}-fixture.json`), "utf8"),
);
const output = resolve(process.env.T3_CAPTURE_OUTPUT_DIR ?? source);
const work = resolve(
  process.env.T3_CAPTURE_WORK_DIR ??
    resolve(root, `.work/t3-${prefix}-reference`),
);
const reference = resolve(
  process.env.T3_CAPTURE_REFERENCE ??
    resolve(root, `parity/t3-agent-answer-v0042-${theme}-reference.mkv`),
);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const fps = 30;
const frames = 120;
const fixedDate = "2026-09-25T11:30:00Z";
const actions = { hover: 30, hoverCopy: 55, copy: 80, pointerExit: 95 };
const domSampleFrames = {
  before: 0,
  hover: 37,
  tooltip: 79,
  "copied-entry": 80,
  copied: 90,
  ending: 110,
  clear: 119,
};
const phases = Object.keys(domSampleFrames);
const expectedClipboard =
  "I found the Logo Enter timing in `registry/blocks/logo-enter/logo-enter.html`. The final pass can extend the duration while keeping the last rendered frame still.";
const activeThreadTitles = [
  "Build a logo intro",
  "Catalog motion audit",
  "Grouped logo tests",
  "Review final hold",
  "Search reveal timing",
];
await mkdir(output, { recursive: true });
await mkdir(work, { recursive: true });
const capture = await createT3V0042Capture({
  slug: "t3-agent-answer-clock",
  theme,
  seed: "answer",
  chromium: process.env.HYFRME_CHROMIUM,
});
const samples = [];
const frameHashes = [];
const interactionTargets = {
  pointerStart: { x: 800, y: 50 },
  pointerExit: { x: 800, y: 50 },
};
let answerText,
  clipboardText,
  threadAges,
  messageTimes,
  branchName,
  effectiveFlags;
try {
  const { page } = capture;
  const cdp = await page.context().newCDPSession(page);
  const commandLine = await cdp.send("Browser.getBrowserCommandLine");
  effectiveFlags = commandLine.arguments.filter(
    (argument) =>
      argument.startsWith("--") &&
      !argument.startsWith("--user-data-dir") &&
      !argument.startsWith("--remote-debugging"),
  );
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(capture.pairingUrl).origin,
  });
  const answer = page
    .locator('[data-timeline-row-kind="message"]')
    .filter({ hasText: "I found the Logo Enter timing" });
  await answer.waitFor({ timeout: 12000 });
  const copy = answer.getByRole("button", { name: "Copy link" });
  await copy.waitFor({ timeout: 8000 });
  // Git-status hydration changes the toolbar after the answer first mounts.
  await page
    .getByRole("button", { name: "Commit, push & PR", exact: true })
    .waitFor({ timeout: 12000 });
  await page.mouse.move(800, 50);
  await page.waitForTimeout(700);
  const rows = await page
    .locator('[data-testid="sidebar-row-card"]')
    .allTextContents();
  if (
    rows.length !== activeThreadTitles.length ||
    rows.some((text, index) => !text.includes(activeThreadTitles[index]))
  ) {
    throw new Error(
      "Native answer seed differs from the canonical five active threads",
    );
  }
  threadAges = await page
    .locator('[data-testid="sidebar-row-card"]')
    .evaluateAll((rows) =>
      rows.map((row) =>
        row
          .querySelector("span.tabular-nums.text-secondary-label")
          ?.textContent.trim(),
      ),
    );
  messageTimes = await page
    .locator('[data-timeline-row-kind="message"]')
    .evaluateAll((rows) =>
      rows.map(
        (row) => row.querySelector("p.tabular-nums")?.textContent.trim() ?? "",
      ),
    );
  answerText = await answer.innerText();
  branchName = await page
    .locator('input[id$="-hidden-input"]')
    .evaluateAll((inputs) =>
      inputs.map((input) => input.value).find((value) => value !== "all"),
    );
  if (!branchName) throw new Error("Native branch selector did not settle");
  await page.evaluate(() => {
    if (document.getAnimations().length)
      throw new Error(
        "Native answer animations did not settle before capture: " +
          JSON.stringify(
            document.getAnimations().map((animation) => ({
              type: animation.constructor.name,
              property: animation.transitionProperty,
              timing: animation.effect.getTiming(),
              target:
                animation.effect.target.getAttribute("data-slot") ??
                String(animation.effect.target.className).slice(0, 100),
            })),
          ),
      );
    window.__hyfrmeNativeCaptureAnimations = new WeakMap();
  });
  // Keep Date fixed for ages while source JS timers and rAF use the video clock.
  await cdp.send("Animation.enable");
  await cdp.send("Animation.setPlaybackRate", { playbackRate: 0 });
  await page.clock.pauseAt(new Date(fixedDate));
  await page.clock.runFor(0);
  const ticks = await page.evaluate(() => performance.now());
  await page.clock.runFor(Math.ceil(ticks / 16) * 16 - ticks);
  let previousMilliseconds = 0;
  for (let frame = 0; frame < frames; frame++) {
    const milliseconds = Math.ceil((frame * 1000) / fps);
    await page.clock.runFor(milliseconds - previousMilliseconds);
    previousMilliseconds = milliseconds;
    if (frame === actions.hover) {
      await answer.hover();
      const box = await answer.boundingBox();
      interactionTargets.answer = {
        x: box.x + box.width / 2,
        y: box.y + box.height / 2,
      };
    }
    if (frame === actions.hoverCopy) {
      await copy.hover();
      const box = await copy.boundingBox();
      interactionTargets.copy = {
        x: box.x + box.width / 2,
        y: box.y + box.height / 2,
      };
    }
    if (frame === actions.copy) {
      await copy.click();
      await page
        .getByText("Copied!", { exact: true })
        .waitFor({ timeout: 4000 });
      clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      if (clipboardText !== expectedClipboard)
        throw new Error("Native Copy link did not copy the seeded reply");
    }
    if (frame === actions.pointerExit) await page.mouse.move(800, 50);
    const sample = await page.evaluate(
      async ({ frame, fps, milliseconds }) => {
        const copy = document
          .querySelector("[data-assistant-citation-source]")
          ?.closest('[data-timeline-row-kind="message"]')
          ?.querySelector('button[aria-label="Copy link"]');
        const controls = copy?.closest('[class~="opacity-0"]');
        const tooltip = document.querySelector('[data-slot="tooltip-popup"]');
        const toast = document.querySelector('[data-slot="toast-popup"]');
        for (const element of [controls, tooltip, toast].filter(Boolean))
          getComputedStyle(element).opacity;
        const animations = [];
        for (const animation of document.getAnimations()) {
          let firstFrame =
            window.__hyfrmeNativeCaptureAnimations.get(animation);
          if (firstFrame === undefined) {
            firstFrame = frame;
            window.__hyfrmeNativeCaptureAnimations.set(animation, firstFrame);
          }
          animation.pause();
          animation.currentTime = ((frame - firstFrame) * 1000) / fps;
          await animation.ready;
          const target = animation.effect.target;
          const timing = animation.effect.getTiming();
          // Base UI waits for native transition completion before removing a popup.
          if (
            animation.currentTime >=
            animation.effect.getComputedTiming().endTime
          )
            animation.finish();
          animations.push({
            type: animation.constructor.name,
            property: animation.transitionProperty ?? null,
            target:
              target === controls
                ? "controls"
                : target === tooltip
                  ? "tooltip"
                  : target === toast
                    ? "toast"
                    : (target.getAttribute("data-slot") ?? target.tagName),
            firstFrame,
            currentTime: animation.currentTime,
            duration: timing.duration,
            easing: timing.easing,
            keyframes: animation.effect
              .getKeyframes()
              .map(({ opacity, scale, transform }) => ({
                opacity,
                scale,
                transform,
              })),
          });
        }
        const popup = (element) =>
          element
            ? {
                opacity: getComputedStyle(element).opacity,
                scale: getComputedStyle(element).scale,
                rect: JSON.stringify(element.getBoundingClientRect()),
                origin: getComputedStyle(element).transformOrigin,
                backdropFilter: getComputedStyle(element).backdropFilter,
                font: getComputedStyle(element).font,
                fontSmooth: getComputedStyle(element).webkitFontSmoothing,
                starting: element.hasAttribute("data-starting-style"),
                ending: element.hasAttribute("data-ending-style"),
              }
            : null;
        return {
          frame,
          milliseconds,
          copyHovered: copy?.matches(":hover"),
          copyBackground: copy ? getComputedStyle(copy).backgroundColor : null,
          controlsOpacity: controls ? getComputedStyle(controls).opacity : null,
          tooltip: popup(tooltip),
          toast: popup(toast),
          animations,
        };
      },
      { frame, fps, milliseconds },
    );
    samples.push(sample);
    for (const [phase, sampleFrame] of Object.entries(domSampleFrames)) {
      if (frame !== sampleFrame) continue;
      const html = capture.clean(
        await page.locator("#root").evaluate((element) => element.innerHTML),
      );
      const portal = capture.clean(
        await page.evaluate(() =>
          [...document.body.children]
            .filter(
              (element) =>
                element.id !== "root" && element.tagName !== "SCRIPT",
            )
            .map((element) => element.outerHTML)
            .join(""),
        ),
      );
      if (
        /\/home\/|\/tmp\/|127\.0\.0\.1:\d+|auth[_-]?token|session[_-]?token/i.test(
          html + portal,
        )
      )
        throw new Error(`Private data in native ${phase} DOM`);
      await writeFile(resolve(output, `${prefix}-${phase}.html`), html);
      await writeFile(
        resolve(output, `${prefix}-${phase}-portal.html`),
        portal,
      );
    }
    // Flush the compositor at the same paused source clock before recording.
    await page.screenshot({
      clip: { x: 0, y: 0, ...baseline.viewport },
      scale: "css",
    });
    const png = await page.screenshot({
      clip: { x: 0, y: 0, ...baseline.viewport },
      scale: "css",
      path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`),
    });
    frameHashes.push(hash(png));
  }
} finally {
  await capture.stop();
}
const encoded = spawnSync(
  "ffmpeg",
  [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-framerate",
    String(fps),
    "-i",
    resolve(work, "frame-%04d.png"),
    "-c:v",
    "ffv1",
    "-level",
    "3",
    "-pix_fmt",
    "gbrp",
    reference,
  ],
  { encoding: "utf8" },
);
if (encoded.status !== 0) throw new Error(encoded.stderr);
const sourceDomHashes = Object.fromEntries(
  await Promise.all(
    phases.map(async (phase) => [
      phase,
      {
        root: hash(await readFile(resolve(output, `${prefix}-${phase}.html`))),
        portal: hash(
          await readFile(resolve(output, `${prefix}-${phase}-portal.html`)),
        ),
      },
    ]),
  ),
);
const tooltip = samples.find((sample) => sample.tooltip)?.frame;
const copiedTimeout = samples.find((sample) => sample.toast?.ending)?.frame;
const clear = samples.find(
  (sample) => sample.frame > actions.copy && !sample.toast,
)?.frame;
const events = { ...actions, tooltip, copiedTimeout, clear };
const clock = {
  method: "native-js-timers-and-css-animation-current-time",
  animationPlaybackRate: 0,
  frameStepMilliseconds: 1000 / fps,
  timerSampling: "ceil(frame * 1000 / fps), rAF aligned at capture start",
  copiedTimeoutMilliseconds: 1000,
  samples,
};
await writeFile(
  resolve(work, "capture.json"),
  JSON.stringify(
    { sourceCommit: baseline.sourceCommit, theme, events, clock, frameHashes },
    null,
    2,
  ) + "\n",
);
if (tooltip === undefined || copiedTimeout === undefined || clear === undefined)
  throw new Error(
    "Source tooltip or natural copied timeout did not complete on the frame clock",
  );
await writeFile(
  resolve(output, `${prefix}-fixture.json`),
  JSON.stringify(
    {
      sourceTag: baseline.sourceTag,
      sourceCommit: baseline.sourceCommit,
      releaseSha256: capture.base.releaseSha256,
      sourceHashes: baseline.sourceHashes,
      captureBrowser: {
        version: "Google Chrome for Testing 152.0.7977.30",
        flags,
        effectiveFlags,
        animationPlaybackRate: 0,
        screenshot: {
          clip: baseline.viewport,
          scale: "css",
          captureBeyondViewport: false,
          compositorFlushes: 1,
        },
      },
      viewport: baseline.viewport,
      fps,
      frames,
      theme,
      phases,
      events,
      interactionTargets,
      threadAges,
      messageTimes,
      answerText,
      clipboardText,
      sourceDomHashes,
      referenceSha256: hash(await readFile(reference)),
      captureClock: clock,
      captureSeed: { activeThreadTitles, fixedDate },
      domSampleFrames,
      branchName,
      providerState: baseline.providerState,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Captured ${frames} native Agent Answer ${theme} frames with source JS timers and CSS motion; natural timeout=${copiedTimeout}, clear=${clear}.`,
);
