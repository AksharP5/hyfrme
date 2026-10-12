import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  installSnoozeTransitionReadiness,
  beginSnoozeTransitions,
  awaitSnoozeTransitions,
} from "./t3-snooze-transition-readiness.mjs";
import {
  installSourceClock,
  setSourceFrame,
  seekSourceClock,
  readSnoozeSourceEffects,
} from "./t3-snooze-source-clock.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core",
);
const root = resolve(import.meta.dirname, "..");
const theme = process.argv[2];
if (theme !== "dark" && theme !== "light")
  throw new Error("Pass dark or light");
const release = resolve(root, ".work/t3-v0042-bin/t3-0.0.42-linux-x64");
const captureRun =
  process.env.T3_CAPTURE_RUN && resolve(process.env.T3_CAPTURE_RUN);
const source = captureRun
  ? resolve(captureRun, "source")
  : resolve(root, "assets/t3-code/v0.0.42");
const work = captureRun
  ? resolve(captureRun, "frames")
  : resolve(root, `.work/t3-thread-snooze-v0042-${theme}-reference`);
const serverLog = captureRun
  ? resolve(captureRun, "backend.log")
  : resolve(root, `.work/t3-v0042-snooze-${theme}-server.log`);
const reference = captureRun
  ? resolve(captureRun, "reference.mkv")
  : resolve(
      root,
      `parity/t3-thread-snooze-v0042${theme === "light" ? "-light" : ""}-reference.mkv`,
    );
const observedEffects = JSON.parse(
  await readFile(
    new URL("./t3-snooze-observed-effects.json", import.meta.url),
    "utf8",
  ),
);
const sourceDefinition = observedEffects.themes[theme];
const browserPath = process.env.HYFRME_CHROMIUM;
if (!browserPath) throw new Error("Set HYFRME_CHROMIUM to pinned Chrome");
const pairingUrl = (await readFile(serverLog, "utf8")).match(
  /Pairing URL: (\S+)/,
)?.[1];
if (!pairingUrl)
  throw new Error("Start the isolated Snooze Thread fixture server");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const version = spawnSync(resolve(release, "t3"), ["--version"], {
  encoding: "utf8",
});
if (version.status !== 0 || version.stdout.trim() !== "t3 v0.0.42")
  throw new Error("Wrong T3 release");
const chromeVersion = spawnSync(browserPath, ["--version"], {
  encoding: "utf8",
});
if (
  chromeVersion.status !== 0 ||
  chromeVersion.stdout.trim() !== "Google Chrome for Testing 152.0.7977.30"
)
  throw new Error("Wrong Chrome release");
const releaseFiles = {
  index: "client/index.html",
  css: "client/assets/main-x9o7QJ8O.css",
  js: "client/assets/index-BMH8bO9q.js",
};
const sourceHashes = Object.fromEntries(
  await Promise.all(
    Object.entries(releaseFiles).map(async ([key, path]) => [
      key,
      hash(await readFile(resolve(release, path))),
    ]),
  ),
);
for (const [key, path] of Object.entries(releaseFiles)) {
  const served = await fetch(
    new URL(`/${path.replace(/^client\//, "")}`, pairingUrl),
  );
  if (
    !served.ok ||
    hash(Buffer.from(await served.arrayBuffer())) !== sourceHashes[key]
  )
    throw new Error(`${key} differs from official T3 release`);
}

const fps = 30;
const frames = 120;
const events = {
  menu: 20,
  submenu: 36,
  snooze: 52,
  postSnooze: 67,
  expand: 78,
  expanded: 85,
  closeToast: 88,
  toastClosed: 104,
  openThread: 106,
};
const phases = [
  "before",
  "menu",
  "submenu",
  "snoozing",
  "snoozed",
  "expanding",
  "expanded",
  "toast-closing",
  "toast-closed",
  "inline-banner",
];
const targetThread = "Build a logo intro";
const browser = await chromium.launch({
  executablePath: browserPath,
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--font-render-hinting=none",
    "--force-color-profile=srgb",
    "--use-gl=angle",
    "--use-angle=gl-egl",
    "--enable-gpu-rasterization",
    "--ignore-gpu-blocklist",
    "--disable-software-rasterizer",
  ],
});
const transitions = {};
const boxes = {};
const state = {};
let sourceEffects;
let sourceReversal;
let selectedPreset;
let orderBefore;
let orderAfter;
let snoozedUntil;
try {
  await mkdir(source, { recursive: true });
  await mkdir(work, { recursive: true });
  const page = await browser.newPage({
    viewport: { width: 1200, height: 659 },
    deviceScaleFactor: 1,
    colorScheme: theme,
  });
  await page.clock.setFixedTime(new Date("2026-09-25T18:00:00Z"));
  await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
  await page
    .locator('[data-testid="composer-editor"]')
    .waitFor({ timeout: 20000 });
  const row = page
    .locator('[data-testid="sidebar-row-card"]')
    .filter({ hasText: targetThread })
    .first();
  await row.click();
  await page.waitForTimeout(900);
  await page
    .locator('button[data-slot="toast-close"]')
    .evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.mouse.move(800, 80);
  await page.waitForTimeout(450);
  const menu = page.locator('.dropdown-glass[data-level="0"]');
  const submenu = page.locator('.dropdown-glass[data-level="1"]');
  const shelf = page.locator('[data-testid="sidebar-snoozed-shelf-toggle"]');
  const rowTitles = () =>
    page
      .locator('[data-testid="sidebar-row-card"]')
      .evaluateAll((rows) => rows.map((item) => item.textContent?.trim()));
  const clean = (value) =>
    value
      .replaceAll(
        resolve(root, ".work/t3-v0042-actions-project"),
        "hyfrme-project",
      )
      .replaceAll(root, "hyfrme-project")
      .replaceAll(resolve(root, "../hyfrme"), "hyfrme-project");
  const saveState = async (phase) => {
    const dom = clean(
      await page.locator("#root").evaluate((element) => element.innerHTML),
    );
    const portals = clean(
      await page
        .locator('.dropdown-glass[data-level], [data-slot="toast-portal"]')
        .evaluateAll((elements) =>
          elements
            .filter(
              (element) =>
                !elements.some(
                  (candidate) =>
                    candidate !== element && candidate.contains(element),
                ),
            )
            .map((element) => element.outerHTML)
            .join(""),
        ),
    );
    if (
      /\/home\/|auth[_-]?token|session[_-]?token|127\.0\.0\.1:392[45]/i.test(
        dom + portals,
      )
    )
      throw new Error(`Private data in ${phase} DOM`);
    await writeFile(
      resolve(source, `thread-snooze-${theme}-${phase}.html`),
      dom,
    );
    await writeFile(
      resolve(source, `thread-snooze-${theme}-${phase}-portal.html`),
      portals,
    );
    state[phase] = {
      cards: await rowTitles(),
      snoozedRows: await page
        .locator('[data-testid="sidebar-row-slim"]')
        .allTextContents(),
      shelf: await shelf.allTextContents(),
      toast: await page.getByText(/^Snoozed until /).allTextContents(),
      banner: await page
        .getByText("This thread is snoozed", { exact: true })
        .allTextContents(),
      route: new URL(page.url()).pathname,
    };
  };
  const pauseAnimations = async (phase) => {
    await awaitSnoozeTransitions(page, phase);
    transitions[phase] = await page.evaluate(async (name) => {
      window.__snoozeAnimations ??= {};
      const observed = window.__snoozeReadiness.observed[name].map(
        (entry) => entry.animation,
      );
      const previous = new Set(Object.values(window.__snoozeAnimations).flat());
      const animations = [
        ...new Set([
          ...observed,
          ...window.__snoozeListAnimations,
          ...document.getAnimations(),
        ]),
      ].filter((animation) => {
        const target = animation.effect?.target;
        return (
          !previous.has(animation) &&
          animation.playState !== "idle" &&
          target instanceof Element &&
          target.isConnected &&
          !!target.closest(
            'ul[role="list"].relative, .dropdown-glass[data-level], [data-slot="toast-portal"], [data-composer-banner-drawer]',
          )
        );
      });
      if (
        animations.some(
          (animation) =>
            animation instanceof CSSTransition && !observed.includes(animation),
        )
      ) {
        throw new Error(
          `Native ${name} transition was not observed at creation`,
        );
      }
      window.__snoozeAnimations[name] = animations;
      const records = [];
      for (const animation of animations) {
        const target = animation.effect?.target;
        const timing = animation.effect?.getComputedTiming();
        const record = {
          target: target?.getAttribute?.("class")?.slice(0, 140),
          slot: target?.getAttribute?.("data-slot") ?? null,
          listChildIndex: target?.parentElement?.matches?.(
            'ul[role="list"].relative',
          )
            ? [...target.parentElement.children].indexOf(target)
            : null,
          listChildText: target?.parentElement?.matches?.(
            'ul[role="list"].relative',
          )
            ? target.textContent?.trim().slice(0, 100)
            : null,
          menuLevel:
            target?.closest?.("[data-level]")?.getAttribute("data-level") ??
            null,
          menuLabel:
            target?.closest?.("button")?.textContent?.trim().slice(0, 80) ??
            null,
          toast: !!target?.closest?.('[data-slot="toast-portal"]'),
          durationMs: timing?.duration,
          observedTimeMs:
            window.__snoozeReadiness.observed[name].find(
              (entry) => entry.animation === animation,
            )?.observedTimeMs ?? animation.currentTime,
          easing: animation.effect?.getTiming().easing,
          keyframes: animation.effect?.getKeyframes(),
        };
        animation.pause();
        animation.currentTime = 0;
        await animation.ready;
        if (
          animation.pending ||
          animation.playState !== "paused" ||
          animation.currentTime !== 0
        )
          throw new Error(
            `Native ${name} effect did not acknowledge its pause`,
          );
        records.push(record);
      }
      window.__snoozeReadiness.phase = null;
      return records;
    }, phase);
  };
  const pauseListAnimationsAtCreation = () =>
    page.evaluate(() => {
      const original = Element.prototype.animate;
      Element.prototype.animate = function (...args) {
        const animation = original.apply(this, args);
        if (this.parentElement?.matches('ul[role="list"].relative')) {
          animation.pause();
          animation.currentTime = 0;
          window.__snoozeListAnimations.push(animation);
        }
        return animation;
      };
      window.__restoreSnoozeAnimate = () => {
        Element.prototype.animate = original;
      };
    });
  await installSnoozeTransitionReadiness(page);
  orderBefore = await rowTitles();
  boxes.row = await row.boundingBox();
  await saveState("before");
  await installSourceClock(
    page,
    sourceDefinition.effects,
    sourceDefinition.sidebarEffects,
  );
  const initialRoute = new URL(page.url()).pathname;
  for (let frame = 0; frame < frames; frame++) {
    await setSourceFrame(page, frame);
    if (frame === events.menu) {
      await beginSnoozeTransitions(page, "menu");
      await row.click({ button: "right" });
      await menu.waitFor();
      const labels = await menu.locator("button").allInnerTexts();
      if (!labels.includes("Snooze") || !labels.includes("Settle thread"))
        throw new Error("Native row menu lacks Snooze");
      boxes.menu = await menu.boundingBox();
      if (
        !boxes.menu ||
        boxes.menu.x > boxes.row.x + boxes.row.width + 30 ||
        boxes.menu.y < boxes.row.y - 30
      )
        throw new Error("Menu detached from row");
      await pauseAnimations("menu");
      await saveState("menu");
    }
    if (frame === events.submenu) {
      await beginSnoozeTransitions(page, "submenu");
      await menu.getByRole("button", { name: "Snooze", exact: true }).hover();
      await submenu.waitFor();
      const labels = await submenu.locator("button").allInnerTexts();
      selectedPreset = labels.find((label) => label.startsWith("In 3 hours"));
      if (
        !selectedPreset ||
        !labels.some((label) => label.startsWith("Custom"))
      )
        throw new Error("Native three-hour Snooze preset missing");
      boxes.submenu = await submenu.boundingBox();
      await pauseAnimations("submenu");
      await saveState("submenu");
    }
    if (frame === events.snooze) {
      await page.evaluate(() => {
        window.__snoozeSourceClock.action52NaturalTransaction = true;
      });
      await beginSnoozeTransitions(page, "snooze");
      await pauseListAnimationsAtCreation();
      await submenu.getByRole("button", { name: /^In 3 hours/ }).click();
      await page.waitForFunction(
        () =>
          document
            .getAnimations()
            .some((animation) =>
              animation.effect?.target?.parentElement?.matches?.(
                'ul[role="list"].relative',
              ),
            ),
        null,
        { timeout: 5000 },
      );
      await page.waitForURL((url) => url.pathname !== initialRoute, {
        timeout: 15000,
      });
      await page
        .getByText(/^Snoozed until /)
        .first()
        .waitFor({ timeout: 5000 });
      boxes.toast = await page
        .locator('[data-slot="toast-portal"] .dropdown-glass')
        .boundingBox();
      boxes.shelf = await shelf.boundingBox();
      await pauseAnimations("snooze");
      await saveState("snoozing");
    }
    if (frame === events.snooze + 6) {
      await page.evaluate(() => {
        window.__restoreSnoozeAnimate?.();
      });
      await row.waitFor({ state: "detached", timeout: 5000 });
    }
    if (frame === events.postSnooze) {
      await page.mouse.move(800, 80);
      orderAfter = await rowTitles();
      await saveState("snoozed");
    }
    if (frame === events.expand) {
      await beginSnoozeTransitions(page, "expand");
      await pauseListAnimationsAtCreation();
      if ((await shelf.getAttribute("aria-expanded")) !== "true")
        await shelf.click();
      await pauseAnimations("expand");
      await page
        .locator('[data-testid="sidebar-row-slim"]')
        .filter({ hasText: targetThread })
        .waitFor({ timeout: 5000 });
      boxes.expandedShelf = await shelf.boundingBox();
      boxes.snoozedRow = await page
        .locator('[data-testid="sidebar-row-slim"]')
        .filter({ hasText: targetThread })
        .boundingBox();
      await saveState("expanding");
    }
    if (frame === events.expand + 6) {
      await page.evaluate(() => {
        for (const animation of window.__snoozeAnimations?.expand ?? []) {
          if (
            !animation.effect?.target?.parentElement?.matches?.(
              'ul[role="list"].relative',
            )
          )
            animation.cancel();
        }
        window.__restoreSnoozeAnimate?.();
      });
    }
    if (frame === events.expanded) {
      await page.mouse.move(800, 80);
      await saveState("expanded");
    }
    if (frame === events.closeToast) {
      await beginSnoozeTransitions(page, "closeToast");
      await page.locator('button[data-slot="toast-close"]').first().click();
      await pauseAnimations("closeToast");
      if (
        !transitions.closeToast.some(
          (transition) =>
            transition.target?.startsWith("dropdown-glass") &&
            transition.durationMs === 500,
        )
      ) {
        throw new Error("Native toast close transition was not captured");
      }
      await saveState("toast-closing");
    }
    if (frame === events.toastClosed) {
      await page.evaluate(() => {
        for (const animation of window.__snoozeAnimations?.closeToast ?? [])
          animation.finish();
      });
      await page
        .locator('[data-slot="toast-portal"] .dropdown-glass')
        .first()
        .waitFor({ state: "detached", timeout: 5000 });
      await page.mouse.move(800, 80);
      await saveState("toast-closed");
      if (state["toast-closed"].toast.length)
        throw new Error("Native toast remained open after close transition");
    }
    if (frame === events.openThread) {
      await beginSnoozeTransitions(page, "openThread");
      await page
        .locator('[data-testid="sidebar-row-slim"]')
        .filter({ hasText: targetThread })
        .click();
      await page.waitForURL((url) => url.pathname === initialRoute, {
        timeout: 15000,
      });
      await page
        .getByText("This thread is snoozed", { exact: true })
        .waitFor({ timeout: 5000 });
      boxes.banner = await page
        .getByText("This thread is snoozed", { exact: true })
        .boundingBox();
      await pauseAnimations("openThread");
      await saveState("inline-banner");
    }
    for (const [name, start] of Object.entries(events)) {
      if (frame < start) continue;
      await page.evaluate(
        ({ name, ms }) => {
          for (const animation of window.__snoozeAnimations?.[name] ?? []) {
            const duration =
              animation.effect?.getComputedTiming().duration ?? 0;
            if (ms <= duration) animation.currentTime = ms;
            else if (
              name === "snooze" ||
              name === "expand" ||
              name === "closeToast"
            ) {
              if (
                animation.playState === "paused" ||
                animation.playState === "running"
              )
                animation.finish();
            } else animation.cancel();
          }
        },
        { name, ms: ((frame - start) * 1000) / fps },
      );
    }
    if (
      sourceDefinition.effects.some((effect) => effect.actionFrame === frame)
    ) {
      await page.waitForFunction(
        (frame) =>
          window.__snoozeSourceClock.errors.length ||
          window.__snoozeSourceClock.effects.some(
            (entry) => entry.spec.actionFrame === frame,
          ),
        frame,
        { timeout: 2000 },
      );
    }
    if (frame === events.expanded) {
      await page.waitForFunction(
        () =>
          window.__snoozeSourceClock.errors.length ||
          window.__snoozeSourceClock.effects.filter((entry) =>
            entry.spec.event.startsWith("expanded-sidebar-"),
          ).length === 3,
        null,
        { timeout: 2000 },
      );
    }
    await seekSourceClock(page, frame);
    await page.screenshot({
      path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`),
    });
  }
  const captured = await readSnoozeSourceEffects(page);
  sourceEffects = captured.effects;
  sourceReversal = captured.sourceReversal;
  await writeFile(
    resolve(source, `thread-snooze-${theme}-source-clock-history.json`),
    JSON.stringify(captured.history, null, 2),
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await page
    .locator('[data-testid="sidebar-snoozed-shelf-toggle"]')
    .waitFor({ timeout: 15000 });
  const slim = await page
    .locator('[data-testid="sidebar-row-slim"]')
    .allTextContents();
  const banner = await page
    .getByText("This thread is snoozed", { exact: true })
    .allTextContents();
  state.afterReload = { slim, banner, route: new URL(page.url()).pathname };
  if (
    !slim.some((text) => text.includes(targetThread)) ||
    banner.length === 0 ||
    state.afterReload.route !== initialRoute
  )
    throw new Error("Native Snooze state did not persist after reload");
} catch (error) {
  throw new Error(
    String(error).replaceAll(pairingUrl, "[pairing URL redacted]"),
  );
} finally {
  await browser.close();
}
if (
  !orderBefore.some((text) => text.includes(targetThread)) ||
  orderAfter.some((text) => text.includes(targetThread))
)
  throw new Error("Native Snooze did not leave active rows");
const stateDb = captureRun
  ? resolve(captureRun, "backend/userdata/state.sqlite")
  : resolve(
      root,
      `.work/t3-v0042-snooze-${theme}-fixture/userdata/state.sqlite`,
    );
const snoozeState = spawnSync(
  "sqlite3",
  [
    stateDb,
    `select snoozed_at || '|' || snoozed_until from projection_threads where title='${targetThread}';`,
  ],
  { encoding: "utf8" },
);
if (snoozeState.status !== 0 || !snoozeState.stdout.includes("|"))
  throw new Error("Native Snooze was not persisted in the isolated database");
snoozedUntil = snoozeState.stdout.trim().split("|")[1];
if (Date.parse(snoozedUntil) <= Date.parse("2026-09-25T18:00:00Z"))
  throw new Error("Native Snooze wake time was not in the future");
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
      hash(
        await readFile(resolve(source, `thread-snooze-${theme}-${phase}.html`)),
      ),
    ]),
  ),
);
const portalHashes = Object.fromEntries(
  await Promise.all(
    phases.map(async (phase) => [
      phase,
      hash(
        await readFile(
          resolve(source, `thread-snooze-${theme}-${phase}-portal.html`),
        ),
      ),
    ]),
  ),
);
await writeFile(
  resolve(source, `thread-snooze-${theme}-fixture.json`),
  JSON.stringify(
    {
      sourceTag: "v0.0.42",
      sourceCommit: "719a76ca1dbf5490f1aa33ffb9966301e02be9a9",
      sourceHashes,
      viewport: { width: 1200, height: 659 },
      fps,
      frames,
      phases,
      events,
      theme,
      targetThread,
      provenance: {
        app: "official desktop T3 Code v0.0.42 binary and bundled client",
        interaction:
          "native sidebar-row right-click, Snooze preset, toast, shelf, and open-thread banner",
        data: "seeded local Hyfrme project and conversation; provider unavailable",
        clock: "2026-09-25T18:00:00Z",
      },
      boxes,
      state,
      selectedPreset,
      orderBefore,
      orderAfter,
      snoozedUntil,
      transitions,
      sourceEffects,
      sourceReversal,
      sourceDomHashes,
      portalHashes,
      referenceSha256: hash(await readFile(reference)),
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Captured ${frames} native v0.0.42 Snooze Thread ${theme} frames with post-reload state verified.`,
);
