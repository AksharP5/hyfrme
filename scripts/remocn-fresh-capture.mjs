import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const agentRunCaptureProfile = {
  reference: "Remotion renderStill; fresh page per frame in one browser",
  hyperframes: "Production producer API; fresh session/page per frame",
  sequential:
    "Full installed CLI check and strict sequential PNG render retained separately",
  rasterization:
    "browser-default; requested hardware ANGLE EGL; DPR 1; fresh capture backend unobserved",
  referenceScreenshot: {
    fromSurface: true,
    captureBeyondViewport: true,
    optimizeForSpeed: true,
  },
  producerScreenshot: {
    fromSurface: true,
    captureBeyondViewport: false,
    optimizeForSpeed: false,
  },
  virtualTime:
    "Unchanged pinned CLI virtual-time shim; seedRandomFromFrame:false",
};

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const frameName = (ordinal) =>
  `frame_${String(ordinal + 1).padStart(6, "0")}.png`;

async function inspectCaptureReadiness(
  page,
  reference,
  frame,
  { paintBarrier = false, images = false, decodeImages = false } = {},
) {
  const evidence = await page.evaluate(
    async ({ reference, paintBarrier, images, decodeImages }) => {
      const clock = window.__HF_VIRTUAL_TIME__;
      if (reference ? Boolean(clock) : typeof clock?.getTime !== "function")
        throw new Error("Unexpected capture clock for native paint barrier");
      const paint = reference
        ? window.requestAnimationFrame.bind(window)
        : clock.originalRequestAnimationFrame;
      if (typeof paint !== "function")
        throw new Error("Original native requestAnimationFrame is unavailable");
      const state = () => {
        const clocks = [];
        const visit = (context, path) => {
          const virtual = context.__HF_VIRTUAL_TIME__;
          if (virtual)
            clocks.push({
              path,
              virtualTimeMs: virtual.getTime(),
              performanceNowMs: context.performance.now(),
              dateNowMs: context.Date.now(),
            });
          for (let index = 0; index < context.frames.length; index++)
            visit(context.frames[index], `${path}/${index}`);
        };
        visit(window, "main");
        return {
          initialFrame: window.remotion_initialFrame ?? null,
          attempt: window.remotion_attempt ?? null,
          renderReady: window.remotion_renderReady ?? null,
          clocks,
        };
      };
      const elements = [];
      const collectImages = (context, path) => {
        for (const [index, image] of Array.from(
          context.document.images,
        ).entries())
          elements.push({ image, path: `${path}/img/${index}` });
        for (let index = 0; index < context.frames.length; index++)
          collectImages(context.frames[index], `${path}/${index}`);
      };
      if (images) collectImages(window, "main");
      const imageReadiness = () =>
        elements.map(({ image, path }) => ({
          path,
          source: image.getAttribute("src"),
          currentSrc: image.currentSrc,
          complete: image.complete,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
          decoding: image.decoding,
        }));
      const before = state();
      const imageReadinessBefore = images ? imageReadiness() : undefined;
      const acknowledgements = [];
      for (let index = 0; index < (paintBarrier ? 2 : 0); index++) {
        const timestampMs = await new Promise((resolve) => paint(resolve));
        acknowledgements.push({ timestampMs, state: state() });
      }
      const decoded = decodeImages
        ? await Promise.all(
            elements.map(async ({ image, path }) => {
              try {
                await image.decode();
                return { path, status: "fulfilled" };
              } catch (error) {
                return { path, status: "rejected", message: error.message };
              }
            }),
          )
        : undefined;
      return {
        ...(paintBarrier && {
          scheduler: reference
            ? "window.requestAnimationFrame"
            : "window.__HF_VIRTUAL_TIME__.originalRequestAnimationFrame",
        }),
        before,
        acknowledgements,
        after: state(),
        ...(images && {
          imageReadinessBefore,
          imageReadinessAfter: imageReadiness(),
        }),
        ...(decodeImages && { decodeQueriedAfterScreenshots: true, decoded }),
      };
    },
    { reference, paintBarrier, images, decodeImages },
  );
  assert.equal(evidence.acknowledgements.length, paintBarrier ? 2 : 0);
  for (const acknowledgement of evidence.acknowledgements) {
    assert(Number.isFinite(acknowledgement.timestampMs));
    assert.deepEqual(
      acknowledgement.state,
      evidence.before,
      "Frame or virtual time changed during native paint barrier",
    );
  }
  if (paintBarrier)
    assert(
      evidence.acknowledgements[1].timestampMs >
        evidence.acknowledgements[0].timestampMs,
      "Native paint callbacks did not acknowledge distinct browser frames",
    );
  assert.deepEqual(evidence.after, evidence.before);
  if (reference) {
    assert.equal(evidence.before.initialFrame, frame);
    assert.equal(evidence.before.renderReady, true);
  } else assert(evidence.before.clocks.length > 0);
  return evidence;
}

async function captureImmediatePair({
  page,
  reference,
  frame,
  send,
  parameters,
  rest,
  output,
  directory,
  ordinal,
}) {
  const before = await inspectCaptureReadiness(page, reference, frame, {
    images: true,
  });
  const first = await send("Page.captureScreenshot", parameters, ...rest);
  const second = await send("Page.captureScreenshot", parameters, ...rest);
  const files = [];
  for (const [index, result] of [first, second].entries()) {
    const data = reference ? result.value?.data : result.data;
    assert.equal(typeof data, "string", "Raw CDP screenshot data is missing");
    const bytes = Buffer.from(data, "base64");
    assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    const path = resolve(
      output,
      index ? "raw-second" : "raw-first",
      directory,
      frameName(ordinal),
    );
    await writeFile(path, bytes);
    files.push({
      path: relative(output, path),
      sha256: hash(bytes),
      parameters,
    });
  }
  const after = await inspectCaptureReadiness(page, reference, frame, {
    images: true,
    decodeImages: true,
  });
  assert.deepEqual(
    after.before,
    before.before,
    "Frame or virtual time changed between same-page screenshots",
  );
  assert.deepEqual(after.after, before.before);
  return {
    result: first,
    evidence: {
      primaryScreenshot: "first",
      betweenScreenshots:
        "Immediate identical CDP call; no seek, readiness query, paint barrier, or sleep",
      first: files[0],
      second: files[1],
      readinessBefore: before,
      readinessAfter: after,
    },
  };
}

export function freshCaptureProfile(referenceBrowserPerFrame = false) {
  if (!referenceBrowserPerFrame) return agentRunCaptureProfile;
  return {
    ...agentRunCaptureProfile,
    reference: "Remotion renderStill; fresh browser and page per frame",
    referenceBrowserLifecycle: "fresh browser per frame",
    producerBrowserLifecycle: "fresh browser per frame required and observed",
  };
}

export async function captureAgentRunFresh({
  entry,
  upstream,
  sdk,
  browserPath,
  bundle,
  project,
  compiledDir,
  output,
  repeatFrames = [13, 14, 204, 231, 235],
  frames: selectedFrames,
  paintBarrier = false,
  immediateRecapture = false,
  referenceBrowserPerFrame = false,
}) {
  const { fixture } = entry;
  assert.equal(typeof paintBarrier, "boolean");
  assert.equal(typeof immediateRecapture, "boolean");
  assert.equal(typeof referenceBrowserPerFrame, "boolean");
  const profile = freshCaptureProfile(referenceBrowserPerFrame);
  assert(
    repeatFrames.every(
      (frame) =>
        Number.isInteger(frame) &&
        frame >= 0 &&
        frame < fixture.durationInFrames,
    ),
    "Repeat frame is outside the source fixture",
  );
  const selected =
    selectedFrames ??
    Array.from({ length: fixture.durationInFrames }, (_, frame) => frame);
  assert(
    selected.length > 0 &&
      new Set(selected).size === selected.length &&
      selected.every(
        (frame) =>
          Number.isInteger(frame) &&
          frame >= 0 &&
          frame < fixture.durationInFrames,
      ),
    "Selected frames must be unique source-valid frame indices",
  );
  const frames = [...selected, ...repeatFrames];
  const native = resolve(output, "reference");
  const port = resolve(output, "hyperframes");
  await mkdir(native, { recursive: true });
  await mkdir(port, { recursive: true });
  if (immediateRecapture)
    for (const raw of ["raw-first", "raw-second"])
      for (const directory of ["reference", "hyperframes"])
        await mkdir(resolve(output, raw, directory), { recursive: true });
  const require = createRequire(resolve(upstream, "package.json"));
  assert.equal(require("remotion/package.json").version, "4.0.513");
  const {
    openBrowser,
    selectComposition,
    renderStill,
  } = require("@remotion/renderer");
  const evidence = {
    profile:
      paintBarrier || immediateRecapture
        ? {
            ...profile,
            ...(paintBarrier && {
              paintBarrier:
                "Two original native requestAnimationFrame acknowledgements immediately before each official first Page.captureScreenshot; source frame and all virtual clocks remain unchanged",
            }),
            ...(immediateRecapture && {
              immediateRecapture:
                "Diagnostic only: retain official first screenshot and immediate identical second CDP screenshot from the same already-seeked page; image decode is queried only afterward; no favorable screenshot selection",
            }),
          }
        : profile,
    frames,
    referenceCaptures: [],
    referenceBrowserStarts: [],
    producerCaptures: [],
    referenceErrors: [],
    producerErrors: [],
    externalRequests: [],
    complete: false,
  };
  const observeRequest = (request) => {
    const url = new URL(request.url());
    if (
      ["http:", "https:"].includes(url.protocol) &&
      !["localhost", "127.0.0.1"].includes(url.hostname)
    )
      evidence.externalRequests.push(url.href);
  };
  let browser;
  let currentFrame;
  let currentBrowserPid;
  let ordinal = 0;
  try {
    async function startReferenceBrowser() {
      browser = await openBrowser("chrome", {
        browserExecutable: browserPath,
        chromeMode: "headless-shell",
        chromiumOptions: { gl: "angle-egl" },
      });
      const newPage = browser.newPage.bind(browser);
      browser.newPage = async (options) => {
        const page = await newPage(options);
        const pageOrdinal = ++ordinal;
        page.on("pageerror", (error) =>
          evidence.referenceErrors.push({
            frame: currentFrame,
            message: error.message,
          }),
        );
        page.on("request", observeRequest);
        const client = page._client();
        const send = client.send.bind(client);
        client.send = async (method, parameters, ...rest) => {
          if (method === "Page.captureScreenshot") {
            const barrier = paintBarrier
              ? await inspectCaptureReadiness(page, true, currentFrame, {
                  paintBarrier: true,
                })
              : undefined;
            const capture = {
              frame: currentFrame,
              browserPid: currentBrowserPid,
              pageOrdinal,
              parameters,
              ...(barrier && { paintBarrier: barrier }),
            };
            evidence.referenceCaptures.push(capture);
            if (immediateRecapture) {
              const pair = await captureImmediatePair({
                page,
                reference: true,
                frame: currentFrame,
                send,
                parameters,
                rest,
                output,
                directory: "reference",
                ordinal: evidence.referenceCaptures.length - 1,
              });
              capture.immediateRecapture = pair.evidence;
              return pair.result;
            }
          }
          return send(method, parameters, ...rest);
        };
        return page;
      };
      const options = {
        serveUrl: bundle,
        puppeteerInstance: browser,
        chromiumOptions: { gl: "angle-egl" },
        timeoutInMilliseconds: 120000,
        onBrowserDownload() {
          throw new Error("Browser downloads are disabled");
        },
      };
      const composition = await selectComposition({
        ...options,
        id: entry.slug,
        inputProps: {},
      });
      for (const key of ["width", "height", "fps", "durationInFrames"])
        assert.equal(composition[key], fixture[key], key);
      const processes = await browser.connection.send(
        "SystemInfo.getProcessInfo",
      );
      const pid = processes.value.processInfo.find(
        (process) => process.type === "browser",
      )?.id;
      const browserArguments = (
        await readFile(`/proc/${pid}/cmdline`, "utf8")
      )
        .split("\0")
        .filter(Boolean);
      currentBrowserPid = pid;
      evidence.referenceBrowserArguments ??= browserArguments;
      evidence.referenceBrowserStarts.push({ browserPid: pid, arguments: browserArguments });
      return { options, composition };
    }
    let reference;
    if (!referenceBrowserPerFrame) reference = await startReferenceBrowser();
    for (const [index, frame] of frames.entries()) {
      if (referenceBrowserPerFrame) reference = await startReferenceBrowser();
      const { options, composition } = reference;
      currentFrame = frame;
      await renderStill({
        ...options,
        composition,
        inputProps: {},
        frame,
        imageFormat: "png",
        output: resolve(native, frameName(index)),
      });
      if (referenceBrowserPerFrame) {
        await browser.close({ silent: true });
        browser = null;
      }
    }
    assert.equal(
      new Set(evidence.referenceCaptures.map((capture) => capture.pageOrdinal))
        .size,
      frames.length,
    );
    assert.equal(evidence.referenceCaptures.length, frames.length);
    if (browser) await browser.close({ silent: true });
    browser = null;

    const dist = resolve(sdk, "dist");
    const files = await readdir(dist);
    const loader = files.find((file) => /^producer-.*\.js$/.test(file));
    assert(loader, "Pinned producer loader is missing");
    const { loadProducer } = await import(
      pathToFileURL(resolve(dist, loader)).href
    );
    const producer = await loadProducer();
    const { drainBrowserPool, getCdpSession } = await import(
      pathToFileURL(resolve(dist, "chunk-VW5OMJNG.js")).href
    );
    const cli = await readFile(resolve(dist, "chunk-JXXE3SWC.js"), "utf8");
    const start = cli.indexOf("function buildVirtualTimeShim(options) {");
    const end = cli.indexOf("\nvar VIRTUAL_TIME_SHIM =", start);
    assert(
      start >= 0 && end > start,
      "Pinned CLI virtual-time shim is missing",
    );
    // Serve the exact normal CLI clock; no runtime or SDK source is patched.
    const clock = new Function(
      `${cli.slice(start, end)};return buildVirtualTimeShim({seedRandomFromFrame:false});`,
    )();
    evidence.virtualTimeShimSha256 = hash(clock);
    const config = producer.resolveConfig({
      chromePath: browserPath,
      browserGpuMode: "hardware",
      forceScreenshot: true,
      useDrawElement: false,
      enableBrowserPool: true,
    });
    const captureOptions = {
      width: fixture.width,
      height: fixture.height,
      fps: { num: fixture.fps, den: 1 },
      format: "png",
      quality: 100,
      deviceScaleFactor: 1,
      captureBeyondViewport: false,
    };
    const server = await producer.createFileServer({
      projectDir: project,
      compiledDir,
      fps: captureOptions.fps,
      preHeadScripts: [clock],
    });
    const pages = new WeakSet();
    try {
      const served = await (await fetch(`${server.url}/index.html`)).text();
      evidence.compiledSha256 = hash(
        await readFile(resolve(compiledDir, "index.html")),
      );
      evidence.servedHtmlSha256 = hash(served);
      evidence.captureOptions = captureOptions;
      await writeFile(resolve(output, "served.html"), served);
      for (const [index, frame] of frames.entries()) {
        const session = await producer.createCaptureSession(
          server.url,
          port,
          captureOptions,
          null,
          config,
        );
        try {
          assert(!pages.has(session.page), "Producer reused a frame page");
          pages.add(session.page);
          const process = session.browser.process();
          assert(
            Number.isInteger(process?.pid),
            "Producer browser PID is missing",
          );
          evidence.producerBrowserArguments ??= process.spawnargs;
          session.page.on("pageerror", (error) =>
            evidence.producerErrors.push({ frame, message: error.message }),
          );
          session.page.on("request", observeRequest);
          await producer.initializeSession(session);
          assert.equal(session.captureMode, "screenshot");
          const client = await getCdpSession(session.page);
          const send = client.send.bind(client);
          let screenshot;
          let barrier;
          let recapture;
          client.send = async (method, parameters, ...rest) => {
            if (method === "Page.captureScreenshot") {
              assert.equal(
                screenshot,
                undefined,
                "Multiple screenshots for one producer frame",
              );
              screenshot = parameters;
              if (paintBarrier)
                barrier = await inspectCaptureReadiness(
                  session.page,
                  false,
                  frame,
                  { paintBarrier: true },
                );
              if (immediateRecapture) {
                const pair = await captureImmediatePair({
                  page: session.page,
                  reference: false,
                  frame,
                  send,
                  parameters,
                  rest,
                  output,
                  directory: "hyperframes",
                  ordinal: index,
                });
                recapture = pair.evidence;
                return pair.result;
              }
            }
            return send(method, parameters, ...rest);
          };
          const { buffer } = await producer.captureFrameToBuffer(
            session,
            frame,
            frame / fixture.fps,
          );
          assert(
            screenshot,
            "Producer screenshot parameters were not recorded",
          );
          const errors = session.browserConsoleBuffer.filter((line) =>
            /\[(?:Browser:ERROR|Browser:PAGEERROR|FrameCapture:ERROR)\]/.test(
              line,
            ),
          );
          assert.deepEqual(errors, []);
          await writeFile(resolve(port, frameName(index)), buffer);
          evidence.producerCaptures.push({
            frame,
            browserPid: process.pid,
            freshPage: true,
            parameters: screenshot,
            ...(barrier && { paintBarrier: barrier }),
            ...(recapture && { immediateRecapture: recapture }),
          });
        } finally {
          await producer.closeCaptureSession(session);
        }
        if ((index + 1) % 100 === 0)
          console.log(
            `Agent Run fresh producer: ${index + 1}/${frames.length}`,
          );
      }
    } finally {
      await drainBrowserPool();
      await server.close();
    }
    assert.equal(evidence.producerCaptures.length, frames.length);
    for (const capture of evidence.referenceCaptures) {
      for (const [key, value] of Object.entries(
        agentRunCaptureProfile.referenceScreenshot,
      ))
        assert.equal(capture.parameters[key], value, key);
    }
    for (const capture of evidence.producerCaptures) {
      for (const [key, value] of Object.entries(
        agentRunCaptureProfile.producerScreenshot,
      ))
        assert.equal(capture.parameters[key], value, key);
    }
    assert.deepEqual(evidence.referenceErrors, []);
    assert.deepEqual(evidence.producerErrors, []);
    assert.deepEqual(evidence.externalRequests, []);
    evidence.observedProducerBrowserCount = new Set(
      evidence.producerCaptures.map((capture) => capture.browserPid),
    ).size;
    if (referenceBrowserPerFrame) {
      assert.equal(evidence.referenceBrowserStarts.length, frames.length);
      assert.equal(new Set(evidence.referenceCaptures.map((capture) => capture.browserPid)).size, frames.length);
      assert.equal(evidence.observedProducerBrowserCount, frames.length);
    }
    evidence.complete = true;
    return evidence;
  } finally {
    if (browser) await browser.close({ silent: true });
    await writeFile(
      resolve(output, "capture.json"),
      `${JSON.stringify(evidence, null, 2)}\n`,
    );
  }
}
