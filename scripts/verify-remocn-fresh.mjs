import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
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
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { assertExactCompiledParity } from "./compiled-parity.mjs";
import {
  assertHardwareGpuProbe,
  browserGpuProbeEvidence,
} from "./browser-gpu-evidence.mjs";
import { assertExactFrameHashes, hashBlockFiles } from "./parity-evidence.mjs";
import {
  freshCaptureProfile,
  captureAgentRunFresh,
} from "./remocn-fresh-capture.mjs";
import {
  referenceFingerprint,
  selectFixtures,
  root,
  upstream,
  run,
  verificationBrowser,
  workbench,
} from "./remocn-lossless-reference.mjs";

export function parseFreshVerificationArgs(args) {
  const options = { resume: false, prepare: false, coldReferenceBrowser: false, iconShowcase: false, only: null };
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === "--cold-reference-browser") {
      assert.equal(options.coldReferenceBrowser, false, "Specify --cold-reference-browser once");
      options.coldReferenceBrowser = true;
      continue;
    }
    if (argument === "--icon-showcase") {
      assert.equal(options.iconShowcase, false, "Specify --icon-showcase once");
      options.iconShowcase = true;
      continue;
    }
    if (argument === "--resume" || argument === "--prepare") {
      const key = argument.slice(2);
      assert.equal(options[key], false, `Specify ${argument} once`);
      options[key] = true;
      continue;
    }
    assert.equal(
      argument,
      "--only",
      `Unknown verification argument: ${argument}`,
    );
    assert.equal(options.only, null, "Specify --only once");
    const value = args[++index];
    assert(value && !value.startsWith("--"), "--only requires fixture names");
    const slugs = value.split(",");
    assert(
      slugs.every((slug) => /^[a-z0-9-]+$/.test(slug)),
      "Invalid fixture name",
    );
    assert.equal(
      new Set(slugs).size,
      slugs.length,
      "Fixture names must be unique",
    );
    options.only = value;
  }
  assert(options.only, "--only requires comma-separated Remocn fixture names");
  assert(
    !options.iconShowcase || options.coldReferenceBrowser,
    "Authored icon fresh verification requires --cold-reference-browser",
  );
  return options;
}

export function freshVerificationPaths(iconShowcase = false) {
  return {
    parityRoot: iconShowcase ? "parity/remocn-icon-showcases" : "parity",
    installedWorkbench: iconShowcase
      ? ".work/verify-remocn-icon-showcases"
      : ".work/verify-remocn-lossless",
    freshWorkbench: iconShowcase
      ? ".work/verify-remocn-fresh-icon-showcases"
      : ".work/verify-remocn-fresh",
    referenceWorkbench: iconShowcase
      ? ".work/remocn-icon-showcase-reference"
      : ".work/remocn-lossless-reference",
    sequentialScript: iconShowcase
      ? "scripts/verify-icon-ports.mjs"
      : "scripts/verify-text-ports.mjs",
    sequentialArgs: iconShowcase ? ["--icon-showcase"] : [],
  };
}

export function freshRepeatFrames(frameCount) {
  assert(Number.isInteger(frameCount) && frameCount > 0, "Invalid frame count");
  return [
    ...new Set([
      0,
      Math.floor(frameCount / 4),
      Math.floor(frameCount / 2),
      Math.floor((frameCount * 3) / 4),
      frameCount - 1,
    ]),
  ];
}

const json = async (path) => JSON.parse(await readFile(path, "utf8"));
const save = async (path, value) =>
  writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
const fileHash = (path) =>
  new Promise((accept, reject) => {
    const digest = createHash("sha256");
    createReadStream(path)
      .on("data", (chunk) => digest.update(chunk))
      .on("end", () => accept(digest.digest("hex")))
      .on("error", reject);
  });
const hash = (value) => createHash("sha256").update(value).digest("hex");
async function treeHashes(directory) {
  const hashes = {};
  async function visit(path) {
    for (const item of (await readdir(path, { withFileTypes: true })).sort(
      (a, b) => a.name.localeCompare(b.name),
    )) {
      const child = resolve(path, item.name);
      if (item.isDirectory()) await visit(child);
      else if (item.isFile())
        hashes[relative(directory, child)] = await fileHash(child);
      else
        throw new Error(`Unexpected non-file in verification inputs: ${child}`);
    }
  }
  await visit(directory);
  return hashes;
}
export async function verifyFreshRemocn(options) {
  const paths = freshVerificationPaths(options.iconShowcase);
  assert.equal(
    workbench,
    resolve(root, paths.referenceWorkbench),
    "Reference profile must match the verifier process arguments",
  );
  const referenceBrowserPerFrame = options.coldReferenceBrowser ?? false;
  const captureProfile = freshCaptureProfile(referenceBrowserPerFrame);
  const captureLifecycle = referenceBrowserPerFrame
    ? "fresh-browser native/production-producer"
    : "fresh-page native/production-producer";
  const entries = await selectFixtures(["--only", options.only]);
  assert(
    entries.every(
      (entry) =>
        entry.origin.source.startsWith("registry/remocn-icons/") ===
        Boolean(options.iconShowcase),
    ),
    "Authored icons require --icon-showcase; canonical icons remain in the sequential verifier",
  );
  let sdk;
  for (const directory of (
    await readdir(resolve(homedir(), ".npm/_npx"))
  ).sort()) {
    const candidate = resolve(
      homedir(),
      ".npm/_npx",
      directory,
      "node_modules/hyperframes",
    );
    if (
      (await json(resolve(candidate, "package.json")).catch(() => null))
        ?.version === "0.8.99"
    ) {
      sdk = candidate;
      break;
    }
  }
  assert(
    sdk,
    "HyperFrames 0.8.99 is not cached; dependency installation is disabled",
  );
  const browser = await verificationBrowser();
  assert.equal(browser.version, "Google Chrome for Testing 152.0.7977.42");
  const cli = resolve(sdk, "bin/hyperframes.mjs");
  async function sdkHashes() {
    return {
      "package.json": await fileHash(resolve(sdk, "package.json")),
      "bin/hyperframes.mjs": await fileHash(cli),
      dist: await treeHashes(resolve(sdk, "dist")),
    };
  }
  const failures = [];
  for (const entry of entries) {
    try {
      const { slug, fixture } = entry;
      const frameCount = fixture.durationInFrames;
      const repeatFrames = freshRepeatFrames(frameCount);
      const block = resolve(root, "registry/blocks", slug);
      const manifest = await json(resolve(block, "registry-item.json"));
      async function inputState() {
        return {
          referenceFingerprint: await referenceFingerprint(entry),
          filesSha256: await hashBlockFiles(block, manifest),
          sourceHashes: Object.fromEntries(
            await Promise.all(
              [
                ...new Set(
                  [
                    entry.origin.source,
                    entry.origin.config,
                    entry.origin.entry,
                  ].filter((path) => typeof path === "string"),
                ),
              ].map(async (path) => [
                path,
                await fileHash(resolve(upstream, path)),
              ]),
            ),
          ),
          browserSha256: await fileHash(browser.path),
          verifierSha256: await fileHash(import.meta.filename),
          captureHelperSha256: await fileHash(
            resolve(root, "scripts/remocn-fresh-capture.mjs"),
          ),
          evidenceHelperSha256: await fileHash(
            resolve(root, "scripts/parity-evidence.mjs"),
          ),
          gpuEvidenceHelperSha256: await fileHash(
            resolve(root, "scripts/browser-gpu-evidence.mjs"),
          ),
          acceptanceHelperSha256: await fileHash(
            resolve(root, "scripts/compiled-parity.mjs"),
          ),
          sequentialVerifierSha256: await fileHash(
            resolve(root, "scripts/verify-snapcn-ports.mjs"),
          ),
          sequentialWrapperSha256: await fileHash(
            resolve(root, "scripts/verify-text-ports.mjs"),
          ),
          cliInstallerSha256: await fileHash(
            resolve(root, "cli/bin/hyfrme.mjs"),
          ),
          sourceCheckExceptions: (
            await json(resolve(root, "catalog/remocn-check-exceptions.json"))
          ).filter(
            (exception) =>
              exception.slug === entry.slug &&
              exception.origin.commit === entry.origin.commit &&
              exception.origin.source === entry.origin.source,
          ),
          sdkHashes: await sdkHashes(),
          captureProfile,
          proofPaths: paths,
          repeatFrames,
        };
      }
      const inputs = await inputState();
      const fingerprint = hash(JSON.stringify(inputs));
      const parityPath = resolve(root, paths.parityRoot, `${slug}.json`);
      if (options.resume && !options.prepare) {
        const previous = await json(parityPath).catch(() => null);
        if (
          previous?.fingerprint === fingerprint &&
          previous.checks?.captureLifecycle === captureLifecycle
        ) {
          assertExactCompiledParity(previous, entry.fixture);
          assert.equal(previous.checks.strictSequentialCaptureComplete, true);
          assert.deepEqual(previous.checks.freshRepeatFrames, repeatFrames);
          for (const key of [
            "freshCapture",
            "freshInputs",
            "freshRepeatability",
            "sequentialParity",
            "sequentialComparison",
            "referenceLossless",
            "hyperframesLossless",
            "referenceArchiveRgba",
            "hyperframesArchiveRgba",
            "referenceRgba",
            "hyperframesRgba",
          ]) {
            const path = previous.artifacts[key];
            assert.equal(typeof path, "string", `Missing ${key} artifact`);
            assert.match(
              previous.artifactHashes[path] ?? "",
              /^[a-f0-9]{64}$/,
              `Missing ${key} artifact fingerprint`,
            );
          }
          for (const [path, recorded] of Object.entries(
            previous.artifactHashes,
          ))
            assert.equal(await fileHash(resolve(root, path)), recorded, path);
          await assertExactFrameHashes(
            resolve(root, previous.artifacts.referenceRgba),
            resolve(root, previous.artifacts.hyperframesRgba),
            {
              width: entry.fixture.width,
              height: entry.fixture.height,
              frameCount: frameCount,
            },
          );
          console.log(
            `${slug}: fresh-page proof is complete at the current input and artifact fingerprints`,
          );
          continue;
        }
      }

      if (options.prepare) {
        console.log(
          JSON.stringify({
            slug,
            source: entry.origin,
            fixture,
            fingerprint,
            repeatFrames,
            captureProfile,
            proofPaths: paths,
          }),
        );
        continue;
      }

      const base = resolve(root, paths.freshWorkbench, slug);
      await mkdir(base, { recursive: true });
      const work = await mkdtemp(resolve(base, "run-"));
      const proof = resolve(work, "proof");
      const sequential = resolve(proof, "sequential");
      await mkdir(sequential, { recursive: true });
      const env = {
        HYPERFRAMES_NO_TELEMETRY: "1",
        npm_config_offline: "true",
        REMOCN_SOURCE: upstream,
        HYFRME_BROWSER_EXECUTABLE: browser.path,
        HYPERFRAMES_BROWSER_PATH: browser.path,
      };
      console.log(
        "Remocn fresh: full pinned native reference, CLI installation, full check and strict sequential render",
      );
      const precedingParity = await json(parityPath).catch((error) => {
        if (error.code === "ENOENT") return null;
        throw error;
      });
      if (precedingParity) {
        await save(resolve(proof, "preceding-parity.json"), precedingParity);
      }
      let precedingHashes;
      if (
        options.iconShowcase &&
        precedingParity?.status === "failed" &&
        precedingParity.result?.rgba
      ) {
        const preceding = resolve(proof, "preceding");
        for (const [path, expected] of Object.entries(precedingParity.artifactHashes)) {
          assert(!path.startsWith("/") && !path.split("/").includes(".."));
          assert.equal(await fileHash(resolve(root, path)), expected, path);
          const target = resolve(preceding, "artifacts", path);
          await mkdir(dirname(target), { recursive: true });
          await cp(resolve(root, path), target);
          assert.equal(await fileHash(target), expected, path);
        }
        for (const [side, frames] of [
          ["reference", resolve(workbench, "renders", slug, "reference-frames")],
          ["hyperframes", resolve(root, paths.installedWorkbench, slug, "hyperframes-frames")],
        ]) {
          assert.equal(
            (await readdir(frames)).filter((name) => name.endsWith(".png")).length,
            frameCount,
            "Historical failed showcase capture was incomplete",
          );
          const originalHashes = await treeHashes(frames);
          await cp(frames, resolve(preceding, side), { recursive: true });
          assert.deepEqual(await treeHashes(resolve(preceding, side)), originalHashes);
        }
        precedingHashes = await treeHashes(preceding);
        await save(resolve(proof, "preceding-hashes.json"), precedingHashes);
      }
      const original = await run(
        process.execPath,
        [
          resolve(root, paths.sequentialScript),
          ...paths.sequentialArgs,
          "--only",
          slug,
          "--reuse-reference",
        ],
        { env, allowFailure: true },
      );
      await writeFile(resolve(sequential, "verification.log"), original.output);
      const sequentialParity = await json(parityPath);
      await save(resolve(sequential, "parity.json"), sequentialParity);
      assert.equal(
        sequentialParity.result?.frameCount,
        frameCount,
        "Sequential verification was incomplete",
      );
      assert.equal(sequentialParity.checks?.installedThroughCli, true);
      assert.equal(
        sequentialParity.status,
        original.code === 0 ? "verified" : "failed",
      );
      assert(
        !sequentialParity.error,
        "Sequential verification failed before comparison",
      );
      const project = resolve(
        root,
        `${paths.installedWorkbench}/${slug}/installed`,
      );
      const checkText = await readFile(
        resolve(root, sequentialParity.artifacts.hyperframesCheck),
        "utf8",
      );
      const check = JSON.parse(checkText.slice(checkText.indexOf("{")));
      assert.equal(check.lint.ok, true);
      assert.equal(check.runtime.ok, true);
      const exceptions = inputs.sourceCheckExceptions;
      const errors = Object.values(check)
        .flatMap((section) => section?.findings ?? [])
        .filter((finding) => finding.severity === "error");
      assert(
        errors.every((finding) =>
          exceptions.some((exception) =>
            Object.entries(exception.finding).every(
              ([key, value]) => finding[key] === value,
            ),
          ),
        ),
        "Full check contains an unreviewed error",
      );
      for (const [key, path] of Object.entries(sequentialParity.artifacts))
        await cp(
          resolve(root, path),
          resolve(sequential, `${key}-${path.split("/").at(-1)}`),
        );
      const installedHashes = await treeHashes(project);
      for (const file of manifest.files) {
        const installedHash = await fileHash(resolve(project, file.target));
        // The existing CLI namespaces/inlines composition and runtime source.
        if (
          file.type !== "hyperframes:composition" &&
          !file.path.endsWith(".runtime.js")
        )
          assert.equal(
            installedHash,
            sequentialParity.filesSha256[file.path],
            file.path,
          );
      }

      console.log(
        "Remocn fresh: retain the actual CLI compile from a complete strict debug render",
      );
      const sequentialFrames = resolve(work, "sequential-frames");
      const rendered = await run(
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
          sequentialFrames,
          "--strict-all",
          "--workers",
          "1",
          "--browser-gpu",
          "--debug",
        ],
        {
          cwd: project,
          env: { ...env, PRODUCER_RENDERS_DIR: resolve(work, "renders") },
        },
      );
      await writeFile(resolve(sequential, "debug-render.log"), rendered.output);
      const debugGpuProbe = browserGpuProbeEvidence(rendered.output);
      await save(resolve(sequential, "debug-gpu-probe.json"), debugGpuProbe);
      assertHardwareGpuProbe(debugGpuProbe, `${slug} actual CLI debug render`);
      const debugRoot = resolve(work, ".debug");
      const debugRuns = await readdir(debugRoot);
      assert.equal(
        debugRuns.length,
        1,
        "Expected exactly one actual CLI render job",
      );
      const compiledDir = resolve(debugRoot, debugRuns[0], "compiled");
      const compiledHashes = await treeHashes(compiledDir);
      const bundle = resolve(workbench, `${slug}/bundle`);
      const nativeBundleHashes = await treeHashes(bundle);
      await save(resolve(proof, "inputs.json"), {
        ...inputs,
        fingerprint,
        installedHashes,
        compiledHashes,
        nativeBundleHashes,
        nativeRootSha256: await fileHash(
          resolve(workbench, `${slug}/root.tsx`),
        ),
      });
      const captures = await captureAgentRunFresh({
        entry,
        upstream,
        sdk,
        browserPath: browser.path,
        bundle,
        project,
        compiledDir,
        output: resolve(work, "fresh"),
        repeatFrames,
        referenceBrowserPerFrame,
      });
      assert.equal(captures.complete, true, "Fresh capture was incomplete");
      assert.deepEqual(
        captures.frames,
        [
          ...Array.from({ length: frameCount }, (_, frame) => frame),
          ...repeatFrames,
        ],
        "Capture helper must honor the full fixture and source-valid repeat frames",
      );
      await cp(
        resolve(work, "fresh/capture.json"),
        resolve(proof, "capture.json"),
      );
      const freshReference = resolve(work, "fresh/reference");
      const freshPort = resolve(work, "fresh/hyperframes");
      async function rgbaFrames(directory, path, algorithm = "sha256") {
        assert.equal(
          (await readdir(directory)).filter((name) =>
            /^frame_\d{6}\.png$/.test(name),
          ).length,
          directory === sequentialFrames
            ? frameCount
            : frameCount + repeatFrames.length,
        );
        await run("ffmpeg", [
          "-y",
          "-v",
          "error",
          "-framerate",
          String(fixture.fps),
          "-start_number",
          "1",
          "-i",
          resolve(directory, "frame_%06d.png"),
          "-frames:v",
          String(frameCount),
          "-pix_fmt",
          "rgba",
          "-f",
          "framemd5",
          "-hash",
          algorithm,
          path,
        ]);
        const rows = (await readFile(path, "utf8"))
          .split("\n")
          .filter((line) => line && !line.startsWith("#"))
          .map((line) => line.split(",").map((field) => field.trim()));
        assert.equal(rows.length, frameCount);
        rows.forEach((row, frame) => assert.equal(Number(row[2]), frame));
        return rows.map((row) => row[5]);
      }
      const referenceRgba = resolve(proof, "reference-rgba.framemd5");
      const portRgba = resolve(proof, "hyperframes-rgba.framemd5");
      const sequentialRgba = resolve(sequential, "debug-render-rgba.framemd5");
      const referenceHashes = await rgbaFrames(freshReference, referenceRgba);
      const portHashes = await rgbaFrames(freshPort, portRgba);
      const sequentialHashes = await rgbaFrames(
        sequentialFrames,
        sequentialRgba,
      );
      await assertExactFrameHashes(referenceRgba, portRgba, {
        width: fixture.width,
        height: fixture.height,
        frameCount,
      });
      const require = createRequire(resolve(sdk, "package.json"));
      const sharp = require("sharp");
      const repeats = [];
      for (const [index, frame] of captures.frames
        .slice(frameCount)
        .entries()) {
        const name = (ordinal) =>
          `frame_${String(ordinal + 1).padStart(6, "0")}.png`;
        const decoded = await Promise.all(
          [freshReference, freshPort].flatMap((directory) =>
            [frame, frameCount + index].map((ordinal) =>
              sharp(resolve(directory, name(ordinal)))
                .ensureAlpha()
                .raw()
                .toBuffer(),
            ),
          ),
        );
        assert(
          decoded.every((bytes) => bytes.equals(decoded[0])),
          `Fresh repeat frame ${frame} differs`,
        );
        repeats.push({ frame, exact: true, rgbaSha256: hash(decoded[0]) });
      }
      await save(resolve(proof, "repeatability.json"), repeats);
      const ssimPath = resolve(proof, "ssim.log");
      await run("ffmpeg", [
        "-y",
        "-v",
        "error",
        "-threads",
        "1",
        "-filter_complex_threads",
        "1",
        "-framerate",
        String(fixture.fps),
        "-start_number",
        "1",
        "-i",
        resolve(freshReference, "frame_%06d.png"),
        "-framerate",
        String(fixture.fps),
        "-start_number",
        "1",
        "-i",
        resolve(freshPort, "frame_%06d.png"),
        "-filter_complex",
        `[0:v]trim=end_frame=${frameCount},format=rgb24[left];[1:v]trim=end_frame=${frameCount},format=rgb24[right];[left][right]ssim=stats_file=${ssimPath}`,
        "-frames:v",
        String(frameCount),
        "-f",
        "null",
        "-",
      ]);
      const samples = [
        ...(await readFile(ssimPath, "utf8")).matchAll(/All:([\d.]+)/g),
      ].map((match) => Number(match[1]));
      assert.equal(samples.length, frameCount);
      assert(
        samples.every((score) => score === 1),
        "Every RGB SSIM score must be 1",
      );
      const sequentialMismatches = referenceHashes.flatMap((recorded, frame) =>
        recorded === sequentialHashes[frame] ? [] : [frame],
      );
      const originalProducerRgba = resolve(
        sequential,
        `hyperframesRgba-${sequentialParity.artifacts.hyperframesRgba.split("/").at(-1)}`,
      );
      const originalAlgorithm = (await readFile(originalProducerRgba, "utf8"))
        .match(/^#hash: (MD5|SHA256)$/m)?.[1];
      assert(originalAlgorithm, "Original sequential RGBA hash algorithm is missing");
      const debugHistoryRgba = resolve(sequential, "debug-producer-history-rgba.framemd5");
      await rgbaFrames(sequentialFrames, debugHistoryRgba, originalAlgorithm.toLowerCase());
      await assertExactFrameHashes(originalProducerRgba, debugHistoryRgba, {
        width: fixture.width,
        height: fixture.height,
        frameCount,
      });
      const summary = {
        frame_count: frameCount,
        mean: 1,
        min: 1,
        max: 1,
        p05: 1,
        p95: 1,
        threshold: 1,
        alpha: { frameCount: frameCount, mismatchedFrames: [], pass: true },
        rgba: { frameCount: frameCount, mismatchedFrames: [], pass: true },
        pass: true,
      };
      await save(resolve(proof, "summary.json"), summary);
      await save(resolve(proof, "sequential-comparison.json"), {
        frameCount: frameCount,
        captureLifecycle: "strict sequential CLI",
        exactRgba: sequentialMismatches.length === 0,
        mismatchedFrames: sequentialMismatches,
        originalParityStatus: sequentialParity.status,
        originalFingerprint: sequentialParity.fingerprint,
        originalReferenceVsOriginalProducerMismatchedFrames:
          sequentialParity.result.rgba.mismatchedFrames,
        freshReferenceVsDebugProducerMismatchedFrames: sequentialMismatches,
        debugProducerMatchesOriginalSequentialProducer: true,
        freshCaptureLifecycle: captureProfile,
      });
      for (const [directory, name] of [
        [freshReference, "reference"],
        [freshPort, "hyperframes"],
      ]) {
        await run("ffmpeg", [
          "-y",
          "-v",
          "error",
          "-framerate",
          String(fixture.fps),
          "-start_number",
          "1",
          "-i",
          resolve(directory, "frame_%06d.png"),
          "-frames:v",
          String(frameCount),
          "-c:v",
          "libx264",
          "-preset",
          "fast",
          "-crf",
          "18",
          "-pix_fmt",
          "yuv420p",
          "-movflags",
          "+faststart",
          resolve(work, `${name}.mp4`),
        ]);
        await run("ffmpeg", [
          "-y",
          "-v",
          "error",
          "-framerate",
          String(fixture.fps),
          "-start_number",
          "1",
          "-i",
          resolve(directory, "frame_%06d.png"),
          "-frames:v",
          String(frameCount),
          "-c:v",
          "ffv1",
          "-level",
          "3",
          "-pix_fmt",
          "bgra",
          resolve(proof, `${name}-lossless.mkv`),
        ]);
        const archiveHashes = resolve(proof, `${name}-archive-rgba.framemd5`);
        await run("ffmpeg", [
          "-y",
          "-v",
          "error",
          "-i",
          resolve(proof, `${name}-lossless.mkv`),
          "-pix_fmt",
          "rgba",
          "-f",
          "framemd5",
          "-hash",
          "sha256",
          archiveHashes,
        ]);
        await assertExactFrameHashes(referenceRgba, archiveHashes, {
          width: fixture.width,
          height: fixture.height,
          frameCount: frameCount,
        });
      }
      assert.deepEqual(
        await inputState(),
        inputs,
        "Verification inputs changed during fresh capture",
      );
      assert.deepEqual(
        await treeHashes(project),
        installedHashes,
        "Installed source changed during fresh capture",
      );
      assert.deepEqual(
        await treeHashes(compiledDir),
        compiledHashes,
        "CLI compiled artifacts changed during fresh capture",
      );
      assert.deepEqual(
        await treeHashes(bundle),
        nativeBundleHashes,
        "Native source bundle changed during fresh capture",
      );
      if (precedingHashes)
        assert.deepEqual(await treeHashes(resolve(proof, "preceding")), precedingHashes);
      const proofRoot = `${paths.parityRoot}/${slug}-diff`;
      const target = resolve(root, proofRoot);
      await cp(sequential, resolve(target, "sequential"), { recursive: true });
      await cp(proof, resolve(target, "fresh"), { recursive: true });
      for (const file of [
        "summary.json",
        "ssim.log",
        "reference-rgba.framemd5",
        "hyperframes-rgba.framemd5",
      ])
        await cp(resolve(proof, file), resolve(target, file));
      const poster = Math.floor(frameCount * 0.6);
      await cp(
        resolve(
          freshReference,
          `frame_${String(poster + 1).padStart(6, "0")}.png`,
        ),
        resolve(work, "thumbnail.png"),
      );
      await run("ffmpeg", [
        "-y",
        "-v",
        "error",
        "-i",
        resolve(work, "thumbnail.png"),
        "-i",
        resolve(freshPort, `frame_${String(poster + 1).padStart(6, "0")}.png`),
        "-filter_complex",
        "hstack",
        "-frames:v",
        "1",
        resolve(target, "worst-frame.png"),
      ]);
      for (const name of ["reference.mp4", "hyperframes.mp4", "thumbnail.png"])
        await cp(
          resolve(work, name),
          resolve(root, "public/previews", slug, name),
        );
      const artifacts = {
        ...sequentialParity.artifacts,
        ...(precedingParity && {
          precedingParity: `${proofRoot}/fresh/preceding-parity.json`,
        }),
        ...(precedingHashes && {
          precedingHashes: `${proofRoot}/fresh/preceding-hashes.json`,
        }),
        hyperframesDebugRender: `${proofRoot}/sequential/debug-render.log`,
        freshCapture: `${proofRoot}/fresh/capture.json`,
        freshInputs: `${proofRoot}/fresh/inputs.json`,
        freshRepeatability: `${proofRoot}/fresh/repeatability.json`,
        sequentialParity: `${proofRoot}/sequential/parity.json`,
        sequentialComparison: `${proofRoot}/fresh/sequential-comparison.json`,
        referenceLossless: `${proofRoot}/fresh/reference-lossless.mkv`,
        hyperframesLossless: `${proofRoot}/fresh/hyperframes-lossless.mkv`,
        referenceArchiveRgba: `${proofRoot}/fresh/reference-archive-rgba.framemd5`,
        hyperframesArchiveRgba: `${proofRoot}/fresh/hyperframes-archive-rgba.framemd5`,
      };
      const artifactHashes = Object.fromEntries(
        await Promise.all(
          Object.values(artifacts).map(async (path) => [
            path,
            await fileHash(resolve(root, path)),
          ]),
        ),
      );
      for (const [name, recorded] of Object.entries(
        await treeHashes(resolve(target, "sequential")),
      ))
        artifactHashes[`${proofRoot}/sequential/${name}`] = recorded;
      for (const [name, recorded] of Object.entries(
        await treeHashes(resolve(target, "fresh")),
      ))
        artifactHashes[`${proofRoot}/fresh/${name}`] = recorded;
      const parity = {
        ...sequentialParity,
        status: "verified",
        fingerprint,
        result: {
          frameCount: frameCount,
          meanSsim: 1,
          minSsim: 1,
          p05Ssim: 1,
          p95Ssim: 1,
          alpha: summary.alpha,
          rgba: summary.rgba,
          pass: true,
        },
        checks: {
          ...sequentialParity.checks,
          browserGpuProbes: {
            ...sequentialParity.checks.browserGpuProbes,
            debugRender: debugGpuProbe,
          },
          captureBackend: "unobserved",
          frameCapture:
            `${captureLifecycle}; strict sequential CLI render retained separately`,
          captureLifecycle,
          captureProfile,
          repeatFrames,
          strictSequentialCaptureComplete: true,
          sequentialRgbaExact: sequentialMismatches.length === 0,
          sequentialMismatchedFrames: sequentialMismatches,
          originalReferenceVsOriginalProducerMismatchedFrames:
            sequentialParity.result.rgba.mismatchedFrames,
          freshReferenceVsDebugProducerMismatchedFrames: sequentialMismatches,
          debugProducerMatchesOriginalSequentialProducer: true,
          freshRepeatFrames: repeats.map((repeat) => repeat.frame),
        },
        artifacts,
        artifactHashes,
      };
      assertExactCompiledParity(parity, fixture);
      await save(parityPath, parity);
      console.log(
        `Remocn fresh ${slug} PASS: all ${frameCount} fresh-page RGBA frames and RGB SSIM are exact; ${repeats.length} repeat controls exact; ${sequentialMismatches.length} sequential residual frames remain disclosed`,
      );
    } catch (error) {
      failures.push({ slug: entry.slug, error: error.message });
      console.error(`${entry.slug}: ${error.message}`);
    }
  }
  if (failures.length) throw new Error(JSON.stringify({ failures }, null, 2));
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log(
      "Usage: REMOCN_SOURCE=<pristine pinned checkout> node scripts/verify-remocn-fresh.mjs --only slug,... [--resume] [--prepare] [--cold-reference-browser] [--icon-showcase]\n--prepare validates current pinned inputs without rendering or publication. Every render keeps the complete CLI check and sequential proof, uses the CLI's actual debug compilation in fresh production capture sessions, and requires full exact RGBA/SSIM1, source-valid repeats, immutable input fingerprints and lossless archives. Canonical48 icon proofs remain in verify-icon-ports.mjs; --icon-showcase selects the separate authored384 proof paths and requires --cold-reference-browser.",
    );
  } else {
    await verifyFreshRemocn(parseFreshVerificationArgs(args));
  }
}
