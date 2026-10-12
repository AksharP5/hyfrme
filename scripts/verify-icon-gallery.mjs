import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { assertExactCompiledParity } from "./compiled-parity.mjs";
import { hashBlockFiles } from "./parity-evidence.mjs";
import { captureAgentRunFresh } from "./remocn-fresh-capture.mjs";
import { freshRepeatFrames } from "./verify-remocn-fresh.mjs";
import {
  referenceFingerprint,
  root,
  run,
  selectFixtures,
  upstream,
  verificationBrowser,
} from "./remocn-lossless-reference.mjs";
import {
  galleryContext,
  galleryNativeRoot,
  galleryProjectHtml,
  galleryStates,
  galleryThemes,
  iconGalleryAuthority,
  wrapInstalledIconGallery,
} from "./remocn-icon-gallery-context.mjs";

const args = process.argv.slice(2);
if (args.includes("--help")) {
  console.log(
    "Usage: REMOCN_SOURCE=<pristine pinned checkout> node scripts/verify-icon-gallery.mjs --only icon-check,... [--themes light,dark] [--states hover,focus] [--prepare]\nRequires current exact canonical icon proofs before rendering. Verifies the separate authored 80px canvas/48px glyph against installed animation; genuine source Static posters cover idle/reduced-motion. Outputs stay under .work/verify-icon-gallery; canonical48 fixtures and public previews are untouched.",
  );
  process.exit(0);
}
const options = { prepare: false };
for (let index = 0; index < args.length; index++) {
  const flag = args[index];
  assert(
    ["--only", "--themes", "--states", "--prepare"].includes(flag),
    `Unknown option ${flag}`,
  );
  const key = flag.slice(2);
  assert(
    !Object.hasOwn(options, key) ||
      (key === "prepare" && options.prepare === false),
    `Specify ${flag} once`,
  );
  if (key === "prepare") options.prepare = true;
  else {
    options[key] = args[++index];
    assert(
      options[key] && !options[key].startsWith("--"),
      `${flag} requires a value`,
    );
  }
}
assert(options.only, "--only requires explicit icon fixture names");
const requested = options.only.split(",");
assert(new Set(requested).size === requested.length);
const themes = options.themes?.split(",") ?? galleryThemes;
const states = options.states?.split(",") ?? galleryStates;
assert(
  themes.length &&
    new Set(themes).size === themes.length &&
    themes.every((theme) => galleryThemes.includes(theme)),
);
assert(
  states.length &&
    new Set(states).size === states.length &&
    states.every((state) => galleryStates.includes(state)),
);
const entries = await selectFixtures(["--only", options.only]);
assert(
  entries.every((entry) =>
    entry.origin.source.startsWith("registry/remocn-icons/"),
  ),
  "Only icon fixtures are supported",
);
const json = async (path) => JSON.parse(await readFile(path, "utf8"));
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const save = async (path, value) =>
  writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
async function treeHashes(directory) {
  const hashes = {};
  async function visit(path) {
    for (const item of (await readdir(path, { withFileTypes: true })).sort(
      (a, b) => a.name.localeCompare(b.name),
    )) {
      const child = resolve(path, item.name);
      if (item.isDirectory()) await visit(child);
      else {
        assert(item.isFile(), `Unexpected verification input ${child}`);
        hashes[relative(directory, child)] = digest(await readFile(child));
      }
    }
  }
  await visit(directory);
  return hashes;
}
const plans = [];
for (const entry of entries) {
  const authority = await iconGalleryAuthority(upstream, entry);
  plans.push({
    entry,
    authority,
    contexts: themes.flatMap((theme) =>
      states.map((state) => galleryContext(authority, theme, state)),
    ),
  });
}
if (options.prepare) {
  for (const { entry, authority, contexts } of plans) {
    const canonical = await json(
      resolve(root, "parity", `${entry.slug}.json`),
    ).catch(() => null);
    console.log(
      JSON.stringify({
        slug: entry.slug,
        source: entry.origin,
        canonicalFixture: entry.fixture,
        canonicalStatus: canonical?.status ?? "missing",
        canonicalSourceCurrent:
          canonical?.origin?.commit === entry.origin.commit,
        authority,
        contexts,
        animatedFrameCount: entry.fixture.durationInFrames,
        repeatFrames: freshRepeatFrames(entry.fixture.durationInFrames),
        staticPoster: {
          export: authority.staticExport,
          props: authority.staticProps,
          states: ["idle", "reduced-motion"],
          scope: "Native reference only; installed source has no Static export",
        },
      }),
    );
  }
  process.exit(0);
}
let sdk;
for (const name of (await readdir(resolve(homedir(), ".npm/_npx"))).sort()) {
  const path = resolve(
    homedir(),
    ".npm/_npx",
    name,
    "node_modules/hyperframes",
  );
  if (
    (await json(resolve(path, "package.json")).catch(() => null))?.version ===
    "0.8.99"
  ) {
    sdk = path;
    break;
  }
}
assert(
  sdk,
  "Pinned cached HyperFrames SDK is required; installation is disabled",
);
const browser = await verificationBrowser();
assert.equal(browser.version, "Google Chrome for Testing 152.0.7977.42");
const nativeRequire = createRequire(resolve(upstream, "package.json"));
const { bundle: buildBundle } = nativeRequire("@remotion/bundler");
const { selectComposition, renderStill } = nativeRequire("@remotion/renderer");
const { tsconfigWebpackAlias } = await import(
  pathToFileURL(resolve(upstream, "scripts/tsconfig-webpack-alias.mts")).href
);
const esbuildLoader = resolve(
  dirname(nativeRequire.resolve("@remotion/bundler/package.json")),
  "dist/esbuild-loader/index.js",
);
const sharp = createRequire(resolve(sdk, "package.json"))("sharp");
const failures = [];
for (const { entry, authority, contexts } of plans) {
  for (const context of contexts) {
    try {
      const canonicalPath = resolve(root, "parity", `${entry.slug}.json`);
      const canonical = await json(canonicalPath);
      assertExactCompiledParity(canonical, entry.fixture);
      assert.deepEqual(
        canonical.origin,
        entry.origin,
        "Canonical source authority is stale",
      );
      const block = resolve(root, "registry/blocks", entry.slug);
      const manifest = await json(resolve(block, "registry-item.json"));
      assert.deepEqual(
        await hashBlockFiles(block, manifest),
        canonical.filesSha256,
        "Canonical installed source changed",
      );
      const base = resolve(
        root,
        ".work/verify-icon-gallery",
        entry.slug,
        `${context.theme}-${context.state}`,
      );
      await mkdir(base, { recursive: true });
      const work = await mkdtemp(resolve(base, "run-"));
      const project = resolve(work, "installed");
      const canonicalProject = resolve(
        root,
        ".work/verify-remocn-lossless",
        entry.slug,
        "installed",
      );
      const canonicalInstalledHashes = await treeHashes(canonicalProject);
      await cp(canonicalProject, project, { recursive: true });
      const adaptation = await wrapInstalledIconGallery(
        resolve(project, "compositions", `${entry.slug}.html`),
        entry,
        context,
      );
      await writeFile(
        resolve(project, "index.html"),
        galleryProjectHtml(entry, context),
      );
      const fixture = {
        ...entry.fixture,
        width: authority.canvas,
        height: authority.canvas,
        props: authority.animatedProps,
        background: context.colors.background,
      };
      const galleryEntry = { ...entry, fixture };
      const entryPoint = resolve(work, "root.tsx");
      await writeFile(
        entryPoint,
        galleryNativeRoot(
          entry,
          authority,
          context,
          resolve(upstream, entry.origin.source),
        ),
      );
      const bundle = await buildBundle({
        entryPoint,
        rootDir: upstream,
        outDir: resolve(work, "bundle"),
        publicDir: null,
        webpackOverride: (config) => ({
          ...config,
          module: {
            ...config.module,
            rules: (config.module?.rules ?? []).map((rule) =>
              !Array.isArray(rule.use)
                ? rule
                : {
                    ...rule,
                    use: rule.use.map((loader) =>
                      loader.loader === esbuildLoader
                        ? {
                            ...loader,
                            options: { ...loader.options, jsx: "automatic" },
                          }
                        : loader,
                    ),
                  },
            ),
          },
          resolve: {
            ...config.resolve,
            modules: [
              resolve(upstream, "node_modules"),
              ...(config.resolve?.modules ?? ["node_modules"]),
            ],
            alias: [
              ...["react", "react-dom", "react/jsx-runtime"].map((name) => ({
                name,
                alias: nativeRequire.resolve(name),
                onlyModule: true,
              })),
              ...tsconfigWebpackAlias(upstream),
            ],
          },
        }),
      });
      async function inputState() {
        return {
          referenceFingerprint: await referenceFingerprint(entry),
          authority: await iconGalleryAuthority(upstream, entry),
          blockHashes: await hashBlockFiles(block, manifest),
          canonicalSha256: digest(await readFile(canonicalPath)),
          canonicalInstalledHashes: await treeHashes(canonicalProject),
          sdkHashes: await treeHashes(resolve(sdk, "dist")),
          browserSha256: digest(await readFile(browser.path)),
          helpers: Object.fromEntries(
            await Promise.all(
              [
                "verify-icon-gallery.mjs",
                "remocn-icon-gallery-context.mjs",
                "remocn-fresh-capture.mjs",
              ].map(async (name) => [
                name,
                digest(await readFile(resolve(root, "scripts", name))),
              ]),
            ),
          ),
        };
      }
      const inputs = await inputState();
      assert.deepEqual(
        inputs.canonicalInstalledHashes,
        canonicalInstalledHashes,
      );
      const env = {
        HYPERFRAMES_NO_TELEMETRY: "1",
        HYPERFRAMES_BROWSER_PATH: browser.path,
        npm_config_offline: "true",
        PRODUCER_RENDERS_DIR: resolve(work, "renders"),
      };
      const cli = resolve(sdk, "bin/hyperframes.mjs");
      const check = await run(process.execPath, [cli, "check", "--json"], {
        cwd: project,
        env,
        allowFailure: true,
      });
      await writeFile(resolve(work, "check.log"), check.output);
      const result = JSON.parse(check.output.slice(check.output.indexOf("{")));
      assert.equal(result.lint?.ok, true);
      assert.equal(result.runtime?.ok, true);
      assert(
        Object.values(result)
          .flatMap((section) => section?.findings ?? [])
          .every((finding) => finding.severity !== "error"),
        "Gallery check contains an error",
      );
      const render = await run(
        process.execPath,
        [
          cli,
          "render",
          "--format",
          "png-sequence",
          "--quality",
          "high",
          "--video-frame-format",
          "png",
          "--output",
          resolve(work, "sequential-frames"),
          "--strict-all",
          "--workers",
          "1",
          "--browser-gpu",
          "--debug",
        ],
        { cwd: project, env },
      );
      await writeFile(resolve(work, "debug-render.log"), render.output);
      const debugRuns = await readdir(resolve(work, ".debug"));
      assert.equal(debugRuns.length, 1);
      const compiledDir = resolve(work, ".debug", debugRuns[0], "compiled");
      const frozen = {
        installed: await treeHashes(project),
        compiled: await treeHashes(compiledDir),
        native: await treeHashes(bundle),
      };
      await save(resolve(work, "inputs.json"), {
        inputs,
        frozen,
        context,
        fixture,
        source: entry.origin,
        adaptation,
        canonicalInstalledSource: canonicalProject,
      });
      const repeatFrames = freshRepeatFrames(fixture.durationInFrames);
      const output = resolve(work, "fresh");
      const captures = await captureAgentRunFresh({
        entry: galleryEntry,
        upstream,
        sdk,
        browserPath: browser.path,
        bundle,
        project,
        compiledDir,
        output,
        repeatFrames,
      });
      assert.equal(captures.complete, true);
      const allFrames = [
        ...Array.from(
          { length: fixture.durationInFrames },
          (_, frame) => frame,
        ),
        ...repeatFrames,
      ];
      assert.deepEqual(captures.frames, allFrames);
      const comparisons = [];
      const sequentialMismatchedFrames = [];
      const firstHashes = new Map();
      for (const [ordinal, frame] of allFrames.entries()) {
        const name = `frame_${String(ordinal + 1).padStart(6, "0")}.png`;
        const [native, port] = await Promise.all(
          ["reference", "hyperframes"].map((directory) =>
            sharp(resolve(output, directory, name))
              .ensureAlpha()
              .raw()
              .toBuffer({ resolveWithObject: true }),
          ),
        );
        for (const image of [native, port]) {
          assert.equal(image.info.width, authority.canvas);
          assert.equal(image.info.height, authority.canvas);
          assert.equal(image.info.channels, 4);
        }
        const nativeHash = digest(native.data);
        const portHash = digest(port.data);
        if (ordinal < fixture.durationInFrames) {
          firstHashes.set(frame, nativeHash);
          const sequential = await sharp(
            resolve(work, "sequential-frames", name),
          )
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });
          assert.equal(sequential.info.width, authority.canvas);
          assert.equal(sequential.info.height, authority.canvas);
          assert.equal(sequential.info.channels, 4);
          if (!sequential.data.equals(native.data))
            sequentialMismatchedFrames.push(frame);
        }
        comparisons.push({
          frame,
          ordinal,
          exactRgba: native.data.equals(port.data),
          referenceSha256: nativeHash,
          hyperframesSha256: portHash,
          repeatExact:
            ordinal < fixture.durationInFrames ||
            firstHashes.get(frame) === nativeHash,
        });
      }
      await save(resolve(work, "rgba.json"), comparisons);
      await run("ffmpeg", [
        "-y",
        "-v",
        "error",
        "-threads",
        "1",
        "-filter_complex_threads",
        "1",
        "-i",
        resolve(output, "reference/frame_%06d.png"),
        "-i",
        resolve(output, "hyperframes/frame_%06d.png"),
        "-filter_complex",
        `[0:v]format=rgb24[left];[1:v]format=rgb24[right];[left][right]ssim=stats_file=${resolve(work, "ssim.log")}`,
        "-frames:v",
        String(allFrames.length),
        "-f",
        "null",
        "-",
      ]);
      const scores = [
        ...(await readFile(resolve(work, "ssim.log"), "utf8")).matchAll(
          /All:([\d.]+)/g,
        ),
      ].map((match) => Number(match[1]));
      assert.equal(scores.length, allFrames.length);
      const nativeOptions = {
        serveUrl: bundle,
        browserExecutable: browser.path,
        chromeMode: "headless-shell",
        chromiumOptions: { gl: "angle-egl" },
        timeoutInMilliseconds: 120000,
        onBrowserDownload() {
          throw new Error("Browser downloads are disabled");
        },
      };
      const staticPosters = [];
      for (const state of ["idle", "reduced-motion"]) {
        const staticComposition = await selectComposition({
          ...nativeOptions,
          id: `${entry.slug}-static-${state}`,
          inputProps: {},
        });
        const poster = resolve(work, `native-static-${state}.png`);
        await renderStill({
          ...nativeOptions,
          composition: staticComposition,
          inputProps: {},
          frame: 0,
          imageFormat: "png",
          output: poster,
        });
        const posterInfo = await sharp(poster).metadata();
        assert.equal(posterInfo.width, authority.canvas);
        assert.equal(posterInfo.height, authority.canvas);
        staticPosters.push({
          source: entry.origin,
          export: authority.staticExport,
          props: authority.staticProps,
          state,
          theme: context.theme,
          interaction: state === "idle" ? "idle" : context.state,
          inheritedColor:
            state === "idle"
              ? context.colors["muted-foreground"]
              : context.color,
          path: relative(root, poster),
          sha256: digest(await readFile(poster)),
          scope:
            "Unmodified upstream Static export rendered natively; no installed Static parity claim",
        });
      }
      await save(resolve(work, "native-static-posters.json"), staticPosters);
      assert.deepEqual(
        await inputState(),
        inputs,
        "Gallery inputs changed during capture",
      );
      assert.deepEqual(
        {
          installed: await treeHashes(project),
          compiled: await treeHashes(compiledDir),
          native: await treeHashes(bundle),
        },
        frozen,
        "Gallery installed/compiled/native source changed during capture",
      );
      const report = {
        slug: entry.slug,
        context,
        fixture,
        scope: authority.scope,
        fullFrameCount: fixture.durationInFrames,
        repeatFrames,
        exactRgba: comparisons.every((frame) => frame.exactRgba),
        repeatable: comparisons.every((frame) => frame.repeatExact),
        exactRgbSsim: scores.every((score) => score === 1),
        sequentialRgbaExact: sequentialMismatchedFrames.length === 0,
        sequentialMismatchedFrames,
        staticPosters,
        output: relative(root, work),
      };
      await save(resolve(work, "report.json"), report);
      console.log(JSON.stringify(report));
      assert(
        report.exactRgba && report.repeatable && report.exactRgbSsim,
        "Authored icon gallery comparison differs; retained frame evidence includes exact mismatches",
      );
    } catch (error) {
      failures.push({
        slug: entry.slug,
        theme: context.theme,
        state: context.state,
        error: error.message,
      });
      console.error(
        `${entry.slug} ${context.theme}/${context.state}: ${error.message}`,
      );
    }
  }
}
if (failures.length) throw new Error(JSON.stringify({ failures }, null, 2));
