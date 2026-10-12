import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createT3V0042Capture,
  flags,
  t3Root,
  t3Source,
} from "./t3-v0042-capture-common.mjs";

export async function captureNativeThreadRow(action) {
  if (!["pin", "unpin"].includes(action))
    throw new Error("Capture action must be pin or unpin");
  const theme = process.env.T3_REFERENCE_THEME ?? "dark";
  const prefix = `thread-${action}${theme === "light" ? "-light" : ""}`;
  const baseline = JSON.parse(
    await readFile(resolve(t3Source, `${prefix}-fixture.json`), "utf8"),
  );
  const output = resolve(process.env.T3_CAPTURE_OUTPUT_DIR ?? t3Source);
  const work = resolve(
    process.env.T3_CAPTURE_WORK_DIR ??
      resolve(t3Root, `.work/t3-thread-${action}-${theme}-clock-reference`),
  );
  const reference = resolve(
    process.env.T3_CAPTURE_REFERENCE ??
      resolve(
        t3Root,
        `parity/t3-thread-${action}-v0042${theme === "light" ? "-light" : ""}-reference.mkv`,
      ),
  );
  const targetThread = baseline.targetThread;
  const activeThreadTitles = [
    "Build a logo intro",
    "Catalog motion audit",
    "Grouped logo tests",
    "Review final hold",
    "Search reveal timing",
  ];
  const frames = baseline.frames;
  const fps = baseline.fps;
  const phases = baseline.phases;
  const events = baseline.events;
  const after = action === "pin" ? "unpin" : "pin";
  const domSampleFrames = {
    [phases[0]]: 0,
    [phases[1]]: 35,
    [phases[2]]: 75,
    [phases[3]]: 95,
  };
  const pointerStart =
    action === "pin" ? { x: 800, y: 80 } : { x: 650, y: 400 };
  const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
  await mkdir(output, { recursive: true });
  await mkdir(work, { recursive: true });
  const capture = await createT3V0042Capture({
    slug: `t3-thread-${action}-clock`,
    theme,
    seed: "answer",
    chromium: process.env.HYFRME_CHROMIUM,
    initialThread: null,
  });
  const samples = [];
  const frameHashes = [];
  let beforeOrder, afterOrder, menuBox, motion, effectiveFlags;
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
    await page
      .getByText("Updates Available: 2 providers", { exact: true })
      .waitFor({ timeout: 20000 });
    await page
      .locator('button[data-slot="toast-close"]')
      .evaluateAll((buttons) => buttons.forEach((button) => button.click()));
    await page.waitForFunction(
      () => !document.querySelector('button[data-slot="toast-close"]'),
      undefined,
      { timeout: 5000 },
    );
    await page.waitForTimeout(700);
    const activeTitles = await page
      .locator('[data-testid="sidebar-row-card"]')
      .allTextContents();
    if (
      activeTitles.length !== activeThreadTitles.length ||
      activeThreadTitles.some(
        (title) => !activeTitles.some((text) => text.includes(title)),
      )
    )
      throw new Error(
        "Native row seed does not have the canonical five active threads",
      );
    const row = page
      .locator('[data-testid="sidebar-row-card"]')
      .filter({ hasText: targetThread })
      .first();
    await row.click();
    await page
      .getByRole("button", { name: "Commit, push & PR", exact: true })
      .waitFor({ timeout: 12000 });
    await page.waitForTimeout(900);
    await page
      .locator('button[data-slot="toast-close"]')
      .evaluateAll((buttons) => buttons.forEach((button) => button.click()));
    const menu = page.locator('.dropdown-glass[data-level="0"]');
    await row.click({ button: "right" });
    await menu.waitFor();
    const reset = menu.getByRole("button", {
      name: `${action === "pin" ? "Unpin" : "Pin"} thread`,
      exact: true,
    });
    if (await reset.count()) await reset.click();
    else await page.keyboard.press("Escape");
    await page.mouse.move(pointerStart.x, pointerStart.y);
    await page.waitForTimeout(700);
    const readOrder = () =>
      page.locator('[data-testid="sidebar-row-card"]').allTextContents();
    beforeOrder = await readOrder();
    const expectedOrder =
      action === "pin"
        ? activeThreadTitles
        : [
            targetThread,
            ...activeThreadTitles.filter((title) => title !== targetThread),
          ];
    if (
      beforeOrder.length !== expectedOrder.length ||
      beforeOrder.some((text, index) => !text.includes(expectedOrder[index]))
    ) {
      throw new Error(
        "Native sidebar seed differs from the canonical five-thread order",
      );
    }
    if (beforeOrder[0]?.includes(targetThread) !== (action === "unpin"))
      throw new Error("Native row fixture starts with the wrong pin state");
    await page.evaluate(() => {
      if (document.getAnimations().length)
        throw new Error(
          "Native sidebar animations did not settle before capture",
        );
      window.__hyfrmeNativeRowAnimations = new WeakMap();
    });
    await cdp.send("Animation.enable");
    await cdp.send("Animation.setPlaybackRate", { playbackRate: 0 });
    await page.clock.pauseAt(new Date("2026-09-25T11:30:00Z"));
    await page.clock.runFor(0);
    const ticks = await page.evaluate(() => performance.now());
    await page.clock.runFor(Math.ceil(ticks / 16) * 16 - ticks);
    let previousMilliseconds = 0;
    for (let frame = 0; frame < frames; frame++) {
      const milliseconds = Math.ceil((frame * 1000) / fps);
      await page.clock.runFor(milliseconds - previousMilliseconds);
      previousMilliseconds = milliseconds;
      if (frame === events.menu || frame === events[`${after}Menu`]) {
        await row.click({ button: "right" });
        await menu.waitFor();
        const label = frame === events.menu ? action : after;
        if (
          !(await menu
            .getByRole("button", {
              name: `${label[0].toUpperCase()}${label.slice(1)} thread`,
              exact: true,
            })
            .count())
        )
          throw new Error("Native sidebar menu has the wrong pin action");
        menuBox = await menu.boundingBox();
      }
      if (frame === events[action]) {
        await menu
          .getByRole("button", {
            name: `${action[0].toUpperCase()}${action.slice(1)} thread`,
            exact: true,
          })
          .click();
        if (action === "unpin")
          await page.mouse.move(pointerStart.x, pointerStart.y);
        await page.waitForFunction(
          ({ targetThread, pinned }) =>
            [
              ...document.querySelectorAll('[data-testid="sidebar-row-card"]'),
            ][0]?.textContent.includes(targetThread) === pinned,
          { targetThread, pinned: action === "pin" },
        );
        afterOrder = await readOrder();
      }
      const sample = await page.evaluate(
        async ({ frame, fps, milliseconds }) => {
          for (const row of document.querySelectorAll(
            '[data-testid="sidebar-row-card"]',
          ))
            getComputedStyle(row).backgroundColor;
          const animations = [];
          for (const animation of document.getAnimations()) {
            let firstFrame = window.__hyfrmeNativeRowAnimations.get(animation);
            if (firstFrame === undefined) {
              firstFrame = frame;
              window.__hyfrmeNativeRowAnimations.set(animation, firstFrame);
            }
            animation.pause();
            animation.currentTime = ((frame - firstFrame) * 1000) / fps;
            await animation.ready;
            const target = animation.effect.target;
            const timing = animation.effect.getTiming();
            if (
              animation.currentTime >=
              animation.effect.getComputedTiming().endTime
            )
              animation.finish();
            animations.push({
              type: animation.constructor.name,
              property: animation.transitionProperty ?? null,
              firstFrame,
              thread: target
                .closest('[data-thread-item="true"]')
                ?.querySelector('[data-testid="sidebar-row-card"]')
                ?.textContent.trim(),
              classes:
                typeof target.className === "string" ? target.className : null,
              ariaLabel: target.getAttribute("aria-label"),
              rowMotion: target.matches('[data-thread-item="true"]'),
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
          const rows = [
            ...document.querySelectorAll('[data-testid="sidebar-row-card"]'),
          ].map((row) => ({
            text: row.textContent.trim(),
            backgroundColor: getComputedStyle(row).backgroundColor,
            controls: [
              ...row.querySelectorAll(
                '[class*="group-hover/sidebar-row:opacity-"], [aria-label="Unpin thread"]',
              ),
            ].map((element) => ({
              classes: element.className,
              ariaLabel: element.getAttribute("aria-label"),
              opacity: getComputedStyle(element).opacity,
              position: getComputedStyle(element).position,
            })),
          }));
          const hoverCards = [
            ...document.querySelectorAll('[data-slot="tooltip-positioner"]'),
          ].map((element) => {
            const popup = element.querySelector('[data-slot="tooltip-popup"]');
            const rect = element.getBoundingClientRect();
            return {
              text: element.textContent.trim(),
              open: popup?.hasAttribute("data-open") ?? false,
              instant: popup?.getAttribute("data-instant") ?? null,
              opacity: popup ? getComputedStyle(popup).opacity : null,
              scale: popup ? getComputedStyle(popup).scale : null,
              rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            };
          });
          return { frame, milliseconds, animations, rows, hoverCards };
        },
        { frame, fps, milliseconds },
      );
      samples.push(sample);
      if (frame === events[action]) {
        motion = sample.animations
          .filter((animation) => animation.rowMotion)
          .map((animation) => ({
            row: animation.thread,
            keyframes: animation.keyframes.map(({ transform }) => transform),
            durationMs: animation.duration,
          }));
        if (
          motion.length !== 2 ||
          motion.some(({ durationMs }) => durationMs !== 150)
        )
          throw new Error(
            "Native row motion differs from the immutable 150 ms source animation",
          );
      }
      for (const [phase, sampleFrame] of Object.entries(domSampleFrames)) {
        if (frame !== sampleFrame) continue;
        const html = capture.clean(
          await page.locator("#root").evaluate((element) => element.innerHTML),
        );
        let portal = "";
        if (phase.includes("menu"))
          portal = capture.clean(await menu.evaluate((element) => element.outerHTML));
        if (action === "pin" && phase === phases[2]) {
          const hoverCard = page
            .locator('[data-slot="tooltip-positioner"]')
            .filter({ hasText: activeThreadTitles[2] });
          if ((await hoverCard.count()) !== 1)
            throw new Error("Native pinned phase is missing the third-thread hover card");
          portal = capture.clean(await hoverCard.evaluate((element) => element.outerHTML));
        }
        if (
          /\/home\/|\/tmp\/|127\.0\.0\.1:\d+|auth[_-]?token|session[_-]?token/i.test(
            html + portal,
          )
        )
          throw new Error("Private data in native row fixture");
        await writeFile(resolve(output, `${prefix}-${phase}.html`), html);
        if (portal)
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
        hash(await readFile(resolve(output, `${prefix}-${phase}.html`))),
      ]),
    ),
  );
  const portalHashes = Object.fromEntries(
    await Promise.all(
      phases
        .filter((phase) => phase.includes("menu") || (action === "pin" && phase === phases[2]))
        .map(async (phase) => [
          phase,
          hash(
            await readFile(resolve(output, `${prefix}-${phase}-portal.html`)),
          ),
        ]),
    ),
  );
  const clock = {
    method: "native-js-timers-and-css-animation-current-time",
    animationPlaybackRate: 0,
    frameStepMilliseconds: 1000 / fps,
    samples,
  };
  let hoverCard;
  if (action === "pin") {
    const visibleFrames = samples
      .filter((sample) => sample.hoverCards.some((card) => card.text.includes(activeThreadTitles[2])))
      .map((sample) => sample.frame);
    if (!visibleFrames.length || visibleFrames.some((frame, index) => frame !== visibleFrames[0] + index))
      throw new Error("Native pinned hover card did not have one continuous lifetime");
    hoverCard = {
      thread: activeThreadTitles[2],
      firstFrame: visibleFrames[0],
      lastFrame: visibleFrames.at(-1),
      portalPhase: phases[2],
    };
  }
  await writeFile(
    resolve(work, "capture.json"),
    JSON.stringify({ action, theme, events, clock, frameHashes }, null, 2) +
      "\n",
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
        providerHydration: {
          notice: "Updates Available: 2 providers",
          dismissal:
            "Native close action completed before selecting the thread or freezing the source clock",
        },
        targetThread,
        beforeOrder,
        afterOrder,
        menuBox,
        motion,
        ...(hoverCard ? { hoverCard } : {}),
        sourceDomHashes,
        portalHashes,
        referenceSha256: hash(await readFile(reference)),
        captureClock: clock,
        interactionTargets: { pointerStart },
        domSampleFrames,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `Captured ${frames} native ${action}/${theme} frames with deterministic source CSS and JS clocks.`,
  );
}
