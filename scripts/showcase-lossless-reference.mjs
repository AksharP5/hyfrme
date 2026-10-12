import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import {
  cp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import { basename, dirname, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

export const root = resolve(import.meta.dirname, "..");
export const work = resolve(root, ".work/showcase-lossless");
export const upstream = resolve(
  root,
  process.env.REMOCN_COLLECTIONS_SOURCE ??
    ".work/collections-parity-audit/source-current",
);
const dependencies = resolve(
  root,
  process.env.REMOCN_COLLECTIONS_DEPENDENCIES ??
    "../hyfrme/.work/remocn-collections-showcase-review/node_modules",
);
export const remotionVersion = "4.0.481";
export const referenceGl = "angle-egl";
export const captureProfile = {
  rasterization: "cpu",
  webgl: "hardware ANGLE EGL",
  chromiumFlags: ["--disable-gpu-rasterization"],
  screenshot: {
    fromSurface: true,
    captureBeyondViewport: false,
    optimizeForSpeed: false,
  },
};
const require = createRequire(resolve(dependencies, "../package.json"));
const tailwindLoader = require.resolve("@tailwindcss/webpack");
export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
export const json = async (path) => JSON.parse(await readFile(path, "utf8"));
export const save = (path, value) =>
  writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
export const fileHash = (path) =>
  new Promise((accept, reject) => {
    const digest = createHash("sha256");
    createReadStream(path)
      .on("data", (chunk) => digest.update(chunk))
      .on("end", () => accept(digest.digest("hex")))
      .on("error", reject);
  });

export async function prepareBrowser(browserPath) {
  const path = resolve(work, "browser-cpu-raster");
  await mkdir(work, { recursive: true });
  await writeFile(
    path,
    `#!/bin/sh\nexec '${browserPath.replaceAll("'", "'\\''")}' "$@" ${captureProfile.chromiumFlags.join(" ")}\n`,
    { mode: 0o755 },
  );
  return path;
}

export async function run(command, args, { cwd = root, log, env = {} } = {}) {
  const result = await new Promise((accept, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", reject);
    child.on("close", (code) => accept({ code, stdout, stderr }));
  });
  if (log) await writeFile(log, result.stdout + result.stderr);
  if (result.code !== 0)
    throw new Error(
      `${basename(command)} exited ${result.code}: ${result.stderr.slice(-3000)} ${result.stdout.slice(-1000)}`,
    );
  return result.stdout;
}

export async function hashes(directory) {
  const result = {};
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort(
    (a, b) => a.name.localeCompare(b.name),
  )) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) Object.assign(result, await hashes(path));
    if (entry.isFile()) result[relative(root, path)] = await fileHash(path);
  }
  return result;
}

export async function prepareSource(fixtures) {
  const commit = fixtures[0].origin.commit;
  if (
    fixtures.some((entry) => entry.origin.commit !== commit) ||
    (await run("git", ["rev-parse", "HEAD"], { cwd: upstream })).trim() !==
      commit ||
    (
      await run("git", ["status", "--porcelain", "--untracked-files=no"], {
        cwd: upstream,
      })
    ).trim()
  )
    throw new Error(
      "Collections reference must be an unmodified pinned checkout",
    );
  const versions = {};
  for (const name of [
    "remotion",
    "@remotion/bundler",
    "@remotion/renderer",
    "@remotion/google-fonts",
    "@remotion/transitions",
    "@remotion/tailwind-v4",
  ]) {
    versions[name] = (
      await json(resolve(dependencies, name, "package.json"))
    ).version;
    if (versions[name] !== remotionVersion)
      throw new Error(`${name}: expected cached ${remotionVersion}`);
  }
  for (const name of [
    "react",
    "react-dom",
    "@paper-design/shaders-react",
    "tailwindcss",
    "@tailwindcss/postcss",
    "@tailwindcss/webpack",
  ])
    versions[name] = (
      await json(resolve(dependencies, name, "package.json"))
    ).version;
  const nativeTailwind = createRequire(tailwindLoader);
  for (const name of [
    "@tailwindcss/node",
    "@tailwindcss/oxide",
    "tailwindcss",
  ]) {
    let directory = dirname(nativeTailwind.resolve(name));
    let metadata;
    while (directory !== dirname(directory)) {
      metadata = await json(resolve(directory, "package.json")).catch(
        (error) => {
          if (error.code === "ENOENT") return null;
          throw error;
        },
      );
      if (metadata?.name === name) break;
      directory = dirname(directory);
    }
    if (metadata?.name !== name || metadata.version !== "4.2.0")
      throw new Error(`${name}: expected native Tailwind compiler 4.2.0`);
    versions[`native/${name}`] = metadata.version;
  }
  if (versions["@tailwindcss/webpack"] !== "4.2.0")
    throw new Error("Expected native @tailwindcss/webpack 4.2.0");
  const manifest = await json(
    resolve(root, "assets/remocn-collections/manifest.json"),
  );
  if (
    manifest.commit !== commit ||
    manifest.remotionVersion !== remotionVersion
  )
    throw new Error("Frozen Collection assets differ from the pinned fixture");
  const assetHashes = {};
  for (const asset of [...manifest.fonts, ...manifest.media]) {
    if ((await fileHash(resolve(root, asset.path))) !== asset.sha256)
      throw new Error(`Frozen asset checksum differs: ${asset.path}`);
    assetHashes[asset.path] = asset.sha256;
    if (asset.licensePath) {
      if (
        (await fileHash(resolve(root, asset.licensePath))) !==
        asset.licenseSha256
      )
        throw new Error(`Frozen font license differs: ${asset.licensePath}`);
      assetHashes[asset.licensePath] = asset.licenseSha256;
    }
    if (asset.upstreamPath) {
      if (
        (await fileHash(resolve(upstream, asset.upstreamPath))) !== asset.sha256
      )
        throw new Error(
          `Frozen media differs from pristine source: ${asset.path}`,
        );
    }
  }
  for (const entry of fixtures) {
    const requests = manifest.fontRequests[entry.slug];
    if (!Array.isArray(requests) || !requests.length)
      throw new Error(`${entry.slug}: frozen font requests are missing`);
    for (const request of requests) {
      const metadata = require(
        `@remotion/google-fonts/${request.module}`,
      ).getInfo();
      for (const subset of request.subsets) {
        const asset = manifest.fonts.find(
          (font) =>
            font.module === request.module &&
            font.style === request.style &&
            font.subset === subset,
        );
        for (const weight of request.weights)
          if (
            !asset ||
            metadata.fontFamily !== asset.family ||
            metadata.fonts[request.style][weight][subset] !== asset.source ||
            metadata.unicodeRanges[subset] !== asset.unicodeRange
          )
            throw new Error(
              `${entry.slug}: frozen ${request.module}/${weight}/${subset} descriptor differs from source`,
            );
      }
    }
  }
  await mkdir(work, { recursive: true });
  const source = resolve(work, "reference-source");
  await rm(source, { recursive: true, force: true });
  await mkdir(source, { recursive: true });
  const sourceHashes = {};
  for (const part of [
    "src",
    "styles",
    "public",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "remotion.config.ts",
  ]) {
    const input = resolve(upstream, part);
    await cp(input, resolve(source, part), {
      recursive: true,
      preserveTimestamps: true,
    });
  }
  const tracked = await run("git", ["ls-files", "-z"], { cwd: upstream });
  for (const path of tracked.split("\0").filter(Boolean)) {
    const input = resolve(upstream, path);
    if ((await stat(input)).isFile())
      sourceHashes[relative(root, input)] = await fileHash(input);
  }
  await symlink(dependencies, resolve(source, "node_modules"), "dir");
  for (const font of manifest.fonts) {
    const path = resolve(
      source,
      "public/assets/frozen-fonts",
      basename(font.path),
    );
    await mkdir(dirname(path), { recursive: true });
    await cp(resolve(root, font.path), path, { preserveTimestamps: true });
  }
  return { source, manifest, versions, sourceHashes, assetHashes };
}

export async function prepareReference(entry, context) {
  const directory = resolve(work, entry.slug, "reference");
  await mkdir(directory, { recursive: true });
  const loader = resolve(directory, "frozen-urls.cjs");
  const replacements = context.manifest.fonts.map((font) => [
    font.source,
    `/public/assets/frozen-fonts/${basename(font.path)}`,
  ]);
  for (const media of context.manifest.media) {
    const path = media.upstreamPath.replace(/^public\//, "");
    replacements.push([media.source, `/public/${path}`]);
    replacements.push([media.source.slice(0, -(path.length + 1)), "/public"]);
  }
  await writeFile(
    loader,
    `const replacements=${JSON.stringify(replacements)};module.exports=function(source){for(const [url,path] of replacements)source=source.split(url).join(path);return source;};\n`,
  );
  const entryPoint = resolve(directory, "root.tsx");
  await writeFile(
    entryPoint,
    `import React from "react";import {Composition,registerRoot} from "remotion";import ${JSON.stringify(resolve(context.source, "styles/global.css"))};import {${entry.componentName} as Source} from ${JSON.stringify(resolve(context.source, entry.origin.path))};registerRoot(()=> <Composition id=${JSON.stringify(entry.slug)} component={Source} width={${entry.fixture.width}} height={${entry.fixture.height}} fps={${entry.fixture.fps}} durationInFrames={${entry.fixture.durationInFrames}} defaultProps={${JSON.stringify(entry.fixture.props)}}/>);\n`,
  );
  const { bundle } = require("@remotion/bundler");
  const { enableTailwind } = require("@remotion/tailwind-v4");
  const resources = new Set();
  const serveUrl = await bundle({
    entryPoint,
    rootDir: context.source,
    publicDir: resolve(context.source, "public"),
    outDir: resolve(directory, "bundle"),
    enableCaching: false,
    webpackOverride: (config) => {
      const configured = enableTailwind(config);
      const cssRule = configured.module.rules.find((rule) =>
        rule.test?.test("global.css"),
      );
      cssRule.use = cssRule.use.map((loader) =>
        loader === tailwindLoader
          ? { loader, options: { base: upstream, optimize: false } }
          : loader,
      );
      return {
        ...configured,
        plugins: [
          ...(configured.plugins ?? []),
          {
            apply(compiler) {
              compiler.hooks.compilation.tap(
                "showcase-source-hashes",
                (compilation) => {
                  compilation.hooks.finishModules.tap(
                    "showcase-source-hashes",
                    (modules) => {
                      for (const module of modules)
                        if (module.resource)
                          resources.add(module.resource.split("?")[0]);
                    },
                  );
                },
              );
            },
          },
        ],
        module: {
          ...configured.module,
          rules: [
            ...(configured.module?.rules ?? []),
            { test: /\.[cm]?[jt]sx?$/, enforce: "pre", use: [loader] },
          ],
        },
        resolve: {
          ...configured.resolve,
          modules: [
            dependencies,
            ...(configured.resolve?.modules ?? ["node_modules"]),
          ],
          alias: {
            ...(configured.resolve?.alias ?? {}),
            "@": resolve(context.source, "src"),
            react$: require.resolve("react"),
            "react-dom$": require.resolve("react-dom"),
            "react/jsx-runtime$": require.resolve("react/jsx-runtime"),
          },
        },
      };
    },
  });
  const moduleHashes = {};
  for (const asset of [...context.manifest.fonts, ...context.manifest.media]) {
    const target = asset.upstreamPath
      ? asset.upstreamPath
      : `public/assets/frozen-fonts/${basename(asset.path)}`;
    if ((await fileHash(resolve(serveUrl, target))) !== asset.sha256)
      throw new Error(`Bundled frozen asset differs or is missing: ${target}`);
  }
  for (const path of [...resources].sort()) {
    const input = path.startsWith(`${context.source}${sep}`)
      ? resolve(upstream, relative(context.source, path))
      : path;
    moduleHashes[relative(root, input)] = await fileHash(input);
  }
  const files = {
    ...moduleHashes,
    ...(await hashes(serveUrl)),
    [relative(root, entryPoint)]: await fileHash(entryPoint),
    [relative(root, loader)]: await fileHash(loader),
  };
  return { serveUrl, files, moduleCount: resources.size, replacements };
}

export async function renderReference(
  entry,
  prepared,
  browserPath,
  outputDir,
  { freshPages = false } = {},
) {
  const {
    openBrowser,
    selectComposition,
    renderFrames,
    renderStill,
  } = require("@remotion/renderer");
  const browser = await openBrowser("chrome", {
    browserExecutable: browserPath,
    chromeMode: "headless-shell",
    chromiumOptions: { gl: referenceGl },
    forceDeviceScaleFactor: 1,
  });
  const externalRequests = [];
  const logs = [];
  let screenshotParameters;
  let screenshotCount = 0;
  let currentFrame;
  let pageCount = 0;
  const capturedFrames = [];
  const newPage = browser.newPage.bind(browser);
  browser.newPage = async (options) => {
    const page = await newPage(options);
    const pageOrdinal = ++pageCount;
    const client = page._client();
    const send = client.send.bind(client);
    client.send = (method, parameters, ...options) => {
      if (method !== "Page.captureScreenshot")
        return send(method, parameters, ...options);
      const aligned = { ...parameters, ...captureProfile.screenshot };
      if (
        screenshotParameters &&
        JSON.stringify(aligned) !== JSON.stringify(screenshotParameters)
      )
        throw new Error(
          "Reference screenshot parameters changed between frames",
        );
      screenshotParameters = aligned;
      screenshotCount += 1;
      if (freshPages) capturedFrames.push({ frame: currentFrame, pageOrdinal });
      return send(method, aligned, ...options);
    };
    client.on("Fetch.requestPaused", async ({ requestId, request }) => {
      const url = new URL(request.url);
      if (
        ["http:", "https:"].includes(url.protocol) &&
        !["localhost", "127.0.0.1"].includes(url.hostname)
      ) {
        externalRequests.push(request.url);
        await client.send("Fetch.failRequest", {
          requestId,
          errorReason: "BlockedByClient",
        });
      } else await client.send("Fetch.continueRequest", { requestId });
    });
    await client.send("Fetch.enable", { patterns: [{ urlPattern: "*" }] });
    return page;
  };
  try {
    const options = {
      serveUrl: prepared.serveUrl,
      puppeteerInstance: browser,
      chromiumOptions: { gl: referenceGl },
      timeoutInMilliseconds: 120000,
      onBrowserDownload: () => {
        throw new Error("Browser downloads are disabled");
      },
      onBrowserLog: (log) => logs.push(log),
    };
    const composition = await selectComposition({
      ...options,
      id: entry.slug,
      inputProps: entry.fixture.props,
    });
    for (const key of ["width", "height", "fps", "durationInFrames"])
      if (composition[key] !== entry.fixture[key])
        throw new Error(`Reference ${key} differs from fixture`);
    let browserPid;
    let browserLaunchArguments;
    if (freshPages) {
      const processInfo = await browser.connection.send(
        "SystemInfo.getProcessInfo",
      );
      browserPid = processInfo.value.processInfo.find(
        (entry) => entry.type === "browser",
      )?.id;
      if (!Number.isInteger(browserPid))
        throw new Error("Native browser PID is missing");
      browserLaunchArguments = (
        await readFile(`/proc/${browserPid}/cmdline`, "utf8")
      )
        .split("\0")
        .filter(Boolean);
      for (let frame = 0; frame < entry.fixture.durationInFrames; frame++) {
        currentFrame = frame;
        await renderStill({
          ...options,
          composition,
          inputProps: entry.fixture.props,
          frame,
          imageFormat: "png",
          output: resolve(
            outputDir,
            `frame_${String(frame).padStart(6, "0")}.png`,
          ),
        });
        if ((frame + 1) % 100 === 0)
          console.log(
            `${entry.slug}: fresh reference ${frame + 1}/${entry.fixture.durationInFrames}`,
          );
      }
      if (
        capturedFrames.some((entry, frame) => entry.frame !== frame) ||
        new Set(capturedFrames.map((entry) => entry.pageOrdinal)).size !==
          entry.fixture.durationInFrames
      )
        throw new Error(
          "Native fresh-page capture did not use one distinct page per frame",
        );
    } else {
      await renderFrames({
        ...options,
        composition,
        inputProps: entry.fixture.props,
        imageFormat: "png",
        imageSequencePattern: "frame_[frame].png",
        outputDir,
        concurrency: 1,
        onStart() {},
        onFrameUpdate(framesRendered) {
          if (framesRendered % 100 === 0)
            console.log(
              `${entry.slug}: reference ${framesRendered}/${entry.fixture.durationInFrames}`,
            );
        },
      });
    }
    if (externalRequests.length)
      throw new Error(
        `Reference requested external assets: ${externalRequests.join(", ")}`,
      );
    if (screenshotCount !== entry.fixture.durationInFrames)
      throw new Error(
        "Reference did not capture exactly one screenshot per frame",
      );
    return {
      externalRequests,
      logs,
      screenshotParameters,
      screenshotCount,
      ...(freshPages
        ? {
            lifecycle:
              "Remotion renderStill; one provided browser, one fresh page per frame",
            browserPid,
            browserLaunchArguments,
            capturedFrames,
          }
        : {}),
    };
  } finally {
    await browser.close({ silent: true });
  }
}

export async function renderProducerFresh(
  entry,
  hyperframes,
  project,
  compiledDir,
  outputDir,
  browserPath,
) {
  const dist = resolve(hyperframes, "dist");
  const files = await readdir(dist);
  const loader = files.find((file) => /^producer-.*\.js$/.test(file));
  if (!loader) throw new Error("Cached production producer loader is missing");
  const { loadProducer } = await import(
    pathToFileURL(resolve(dist, loader)).href
  );
  const producer = await loadProducer();
  const poolModule = "chunk-VW5OMJNG.js";
  if (!files.includes(poolModule))
    throw new Error("Pinned producer browser-pool module is missing");
  const { drainBrowserPool } = await import(
    pathToFileURL(resolve(dist, poolModule)).href
  );
  const compiled = await readFile(resolve(compiledDir, "index.html"), "utf8");
  const cli = await readFile(resolve(dist, "chunk-JXXE3SWC.js"), "utf8");
  const clockStart = cli.indexOf("function buildVirtualTimeShim(options) {");
  const clockEnd = cli.indexOf("\nvar VIRTUAL_TIME_SHIM =", clockStart);
  if (clockStart < 0 || clockEnd <= clockStart)
    throw new Error("Pinned CLI virtual-time shim is missing");
  const clock = new Function(
    `${cli.slice(clockStart, clockEnd)};return buildVirtualTimeShim({seedRandomFromFrame:false});`,
  )();
  const { fixture } = entry;
  const fps = { num: fixture.fps, den: 1 };
  const server = await producer.createFileServer({
    projectDir: project,
    compiledDir,
    fps,
    preHeadScripts: [clock],
  });
  const capturedFrames = [];
  const pages = new WeakSet();
  const logs = [];
  const externalRequests = [];
  const servedPath = resolve(dirname(outputDir), "producer-served.html");
  const captureEvidence = {
    lifecycle:
      "Production producer API; one fresh capture session/page per frame",
    requestedBrowserPool: true,
    capturedFrames,
    logs,
    pageErrors: [],
    externalRequests,
    compiledSha256: hash(compiled),
    compiledDir: relative(root, compiledDir),
    virtualTimeShimSha256: hash(clock),
    servedBodyPath: relative(root, servedPath),
    captureMode: "screenshot",
  };
  try {
    const served = await (await fetch(`${server.url}/index.html`)).text();
    await writeFile(servedPath, served);
    captureEvidence.servedBodySha256 = hash(served);
    const config = producer.resolveConfig({
      chromePath: browserPath,
      browserGpuMode: "hardware",
      forceScreenshot: true,
      useDrawElement: false,
      enableBrowserPool: true,
    });
    const options = {
      width: fixture.width,
      height: fixture.height,
      fps,
      format: "png",
      quality: 100,
      deviceScaleFactor: 1,
      captureBeyondViewport: captureProfile.screenshot.captureBeyondViewport,
    };
    captureEvidence.captureOptions = options;
    for (let frame = 0; frame < fixture.durationInFrames; frame++) {
      const session = await producer.createCaptureSession(
        server.url,
        outputDir,
        options,
        null,
        config,
      );
      try {
        if (pages.has(session.page))
          throw new Error("Producer reused a frame page");
        pages.add(session.page);
        const browserProcess = session.browser.process();
        if (!Number.isInteger(browserProcess?.pid))
          throw new Error("Producer browser PID is missing");
        captureEvidence.browserLaunchArguments ??= browserProcess.spawnargs;
        const pageErrors = [];
        session.page.on("pageerror", (error) => {
          const message = error.message ?? String(error);
          pageErrors.push(message);
          captureEvidence.pageErrors.push({
            frame,
            browserPid: browserProcess.pid,
            message,
          });
        });
        session.page.on("request", (request) => {
          const url = new URL(request.url());
          if (
            ["http:", "https:"].includes(url.protocol) &&
            !["localhost", "127.0.0.1"].includes(url.hostname)
          )
            externalRequests.push(request.url());
        });
        const assertNoFatalErrors = (stage) => {
          const fatalLogs = session.browserConsoleBuffer.filter((line) =>
            /\[(?:Browser:ERROR|Browser:PAGEERROR|FrameCapture:ERROR)\]/.test(
              line,
            ),
          );
          if (pageErrors.length || fatalLogs.length)
            throw new Error(
              `Producer frame ${frame} ${stage} failed: ${[...pageErrors, ...fatalLogs].join("; ")}`,
            );
          if (externalRequests.length)
            throw new Error(
              `Producer frame ${frame} requested external assets: ${[...new Set(externalRequests)].join(", ")}`,
            );
        };
        await producer.initializeSession(session);
        assertNoFatalErrors("initialization");
        if (session.captureMode !== "screenshot")
          throw new Error("Producer changed capture mode");
        const { buffer } = await producer.captureFrameToBuffer(
          session,
          frame,
          frame / fixture.fps,
        );
        assertNoFatalErrors("capture");
        await writeFile(
          resolve(outputDir, `frame_${String(frame + 1).padStart(6, "0")}.png`),
          buffer,
        );
        capturedFrames.push({
          frame,
          browserPid: browserProcess.pid,
          freshPage: true,
        });
        if ((frame + 1) % 100 === 0)
          console.log(
            `${entry.slug}: fresh producer ${frame + 1}/${fixture.durationInFrames}`,
          );
      } finally {
        logs.push(...session.browserConsoleBuffer);
        await producer.closeCaptureSession(session);
      }
    }
    if (capturedFrames.length !== fixture.durationInFrames)
      throw new Error("Producer capture is incomplete");
    if (externalRequests.length)
      throw new Error(
        `Producer requested external assets: ${[...new Set(externalRequests)].join(", ")}`,
      );
    return captureEvidence;
  } finally {
    captureEvidence.observedBrowserCount = new Set(
      capturedFrames.map((frame) => frame.browserPid),
    ).size;
    try {
      await save(
        resolve(dirname(outputDir), "producer-capture-diagnostic.json"),
        captureEvidence,
      );
    } finally {
      await drainBrowserPool();
      server.close();
    }
  }
}
