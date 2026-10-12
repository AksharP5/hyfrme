import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import { homedir } from "node:os";
import { createRequire } from "node:module";
import { relative, resolve } from "node:path";
import { captureAgentRunFresh } from "./remocn-fresh-capture.mjs";
import {
  referenceFingerprint,
  root,
  run,
  selectFixtures,
  upstream,
  verificationBrowser,
} from "./remocn-lossless-reference.mjs";
import { hashBlockFiles } from "./parity-evidence.mjs";

const args = process.argv.slice(2);
if (args.includes("--help")) {
  console.log(
    "Usage: REMOCN_SOURCE=<pristine pinned checkout> node scripts/probe-remocn-fresh-frames.mjs --only shader-swirl --frames 0,1,74,149 [--repeat-frames 0,149] [--prepare] [--cpu-rasterization | --disable-yuv-decoding] [--paint-barrier] [--immediate-recapture] --project <installed CLI project> --compiled <actual .debug/job/compiled> --bundle <unchanged native bundle>\nDiagnostic controls only. No canonical proofs or public artifacts are promoted. The compile must come from the current real CLI --debug render. Repeats must select unique frames from --frames. Browser overrides preserve all original arguments through a guarded executable wrapper: CPU rasterization appends --disable-gpu-rasterization; disabled YUV image decoding appends --disable-yuv-image-decoding while retaining hardware ANGLE EGL and GPU rasterization. Select these separately because the YUV switch has no effect without GPU rasterization. The paint barrier awaits two original native requestAnimationFrame callbacks before each official first screenshot and guards unchanged frame/virtual time. Immediate recapture retains first and second raw screenshots with identical parameters, keeps the first as the primary result, and queries image decode only afterward.",
  );
  process.exit(0);
}
const options = {};
for (let index = 0; index < args.length; index++) {
  const flag = args[index];
  assert(
    [
      "--only",
      "--frames",
      "--repeat-frames",
      "--project",
      "--compiled",
      "--bundle",
      "--prepare",
      "--cpu-rasterization",
      "--disable-yuv-decoding",
      "--paint-barrier",
      "--immediate-recapture",
    ].includes(flag),
    `Unknown option ${flag}`,
  );
  const key = flag.slice(2);
  assert(!Object.hasOwn(options, key), `Specify ${flag} once`);
  if (
    [
      "prepare",
      "cpu-rasterization",
      "disable-yuv-decoding",
      "paint-barrier",
      "immediate-recapture",
    ].includes(key)
  )
    options[key] = true;
  else {
    options[key] = args[++index];
    assert(
      options[key] && !options[key].startsWith("--"),
      `${flag} requires a value`,
    );
  }
}
assert(
  options.only && !options.only.includes(","),
  "Select one source fixture",
);
const [entry] = await selectFixtures(["--only", options.only]);
const frames = (options.frames ?? "0,1,74,149").split(",").map((frame) => {
  assert(/^\d+$/.test(frame), "Invalid source frame");
  return Number(frame);
});
assert(frames.length && new Set(frames).size === frames.length);
assert(
  frames.every((frame) => frame >= 0 && frame < entry.fixture.durationInFrames),
  "Source frame is outside fixture",
);
const repeatFrames = options["repeat-frames"]
  ? options["repeat-frames"].split(",").map((frame) => {
      assert(/^\d+$/.test(frame), "Invalid repeat frame");
      return Number(frame);
    })
  : [];
assert(
  new Set(repeatFrames).size === repeatFrames.length &&
    repeatFrames.every((frame) => frames.includes(frame)),
  "Repeats must select unique frames from --frames",
);
const captureFrames = [...frames, ...repeatFrames];
const paintBarrier = options["paint-barrier"] === true;
const immediateRecapture = options["immediate-recapture"] === true;
assert(
  !(options["cpu-rasterization"] && options["disable-yuv-decoding"]),
  "Select CPU rasterization and disabled YUV decoding separately; the YUV switch requires GPU rasterization",
);
const appendedArguments = options["cpu-rasterization"]
  ? ["--disable-gpu-rasterization"]
  : options["disable-yuv-decoding"]
    ? ["--disable-yuv-image-decoding"]
    : [];
if (options.prepare && !options.compiled) {
  console.log(
    JSON.stringify({
      slug: entry.slug,
      frames,
      repeatFrames,
      paintBarrier,
      immediateRecapture,
      fixture: entry.fixture,
      source: entry.origin,
      referenceFingerprint: await referenceFingerprint(entry),
      diagnosticBrowserOverride: appendedArguments.length
        ? { appendedArguments }
        : null,
      requires: [
        "Current installed CLI project",
        "Actual current CLI --debug compiled directory",
        "Unmodified native reference bundle",
      ],
    }),
  );
  process.exit(0);
}
for (const key of ["project", "compiled", "bundle"])
  assert(options[key], `--${key} is required`);
const project = resolve(options.project);
const compiledDir = resolve(options.compiled);
const bundle = resolve(options.bundle);
assert(
  /\/\.debug\/[^/]+\/compiled$/.test(compiledDir),
  "Supply the actual CLI debug compilation",
);
async function hashes(directory) {
  const result = {};
  async function visit(path) {
    for (const item of (await readdir(path, { withFileTypes: true })).sort(
      (a, b) => a.name.localeCompare(b.name),
    )) {
      const child = resolve(path, item.name);
      if (item.isDirectory()) await visit(child);
      else {
        assert(item.isFile(), `Unexpected verification input ${child}`);
        result[relative(directory, child)] = createHash("sha256")
          .update(await readFile(child))
          .digest("hex");
      }
    }
  }
  await visit(directory);
  return result;
}
const json = async (path) => JSON.parse(await readFile(path, "utf8"));
const summary = await json(resolve(compiledDir, "summary.json"));
for (const key of ["width", "height"])
  assert.equal(summary[key], entry.fixture[key]);
assert.equal(
  summary.staticDuration,
  entry.fixture.durationInFrames / entry.fixture.fps,
);
assert(summary.subCompositions.includes(`compositions/${entry.slug}.html`));
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
assert(sdk, "Cached pinned HyperFrames SDK is required");
const browser = await verificationBrowser();
assert.equal(browser.version, "Google Chrome for Testing 152.0.7977.42");
const base = resolve(root, ".work/probe-remocn-fresh-frames", entry.slug);
let output;
let captureBrowserPath = browser.path;
if (!options.prepare || appendedArguments.length) {
  await mkdir(base, { recursive: true });
  output = await mkdtemp(resolve(base, "run-"));
}
const diagnosticBrowserOverride = appendedArguments.length
  ? {
      rasterization: options["cpu-rasterization"]
        ? "CPU rasterization diagnostic; hardware ANGLE EGL; DPR 1"
        : "Unchanged GPU rasterization; hardware ANGLE EGL; DPR 1",
      ...(options["disable-yuv-decoding"] && {
        imageDecoding:
          "Disabled YUV image decoding diagnostic; cause not established",
      }),
      executable: resolve(
        output,
        options["cpu-rasterization"]
          ? "chrome-cpu-rasterization"
          : "chrome-disable-yuv-decoding",
      ),
      actualExecutable: browser.path,
      appendedArguments,
      helperProfile: "Retained unchanged in capture evidence; overridden here",
      argumentEvidence:
        "browser-arguments-<pid>.nul records the effective command",
    }
  : null;
if (diagnosticBrowserOverride) {
  // exec preserves the browser's PID, argument order and debugging pipe FDs.
  const executable = browser.path.replaceAll("'", "'\\''");
  const argumentFile = resolve(output, "browser-arguments-").replaceAll(
    "'",
    "'\\''",
  );
  await writeFile(
    diagnosticBrowserOverride.executable,
    `#!/bin/sh\nprintf '%s\\0' '${executable}' "$@" ${appendedArguments.join(" ")} > '${argumentFile}'"$$".nul || exit $?\nexec '${executable}' "$@" ${appendedArguments.join(" ")}\n`,
  );
  await chmod(diagnosticBrowserOverride.executable, 0o755);
  captureBrowserPath = diagnosticBrowserOverride.executable;
}
const manifest = await json(
  resolve(root, "registry/blocks", entry.slug, "registry-item.json"),
);
async function inputState() {
  return {
    referenceFingerprint: await referenceFingerprint(entry),
    blockHashes: await hashBlockFiles(
      resolve(root, "registry/blocks", entry.slug),
      manifest,
    ),
    installedHashes: await hashes(project),
    compiledHashes: await hashes(compiledDir),
    nativeBundleHashes: await hashes(bundle),
    sdkHashes: await hashes(resolve(sdk, "dist")),
    helperSha256: createHash("sha256")
      .update(await readFile(resolve(root, "scripts/remocn-fresh-capture.mjs")))
      .digest("hex"),
    browserSha256: createHash("sha256")
      .update(await readFile(browser.path))
      .digest("hex"),
    diagnosticBrowserOverride,
    browserWrapperSha256: diagnosticBrowserOverride
      ? createHash("sha256")
          .update(await readFile(diagnosticBrowserOverride.executable))
          .digest("hex")
      : null,
    frames,
    repeatFrames,
    paintBarrier,
    immediateRecapture,
  };
}
const inputs = await inputState();
if (options.prepare) {
  console.log(
    JSON.stringify({
      slug: entry.slug,
      fixture: entry.fixture,
      project,
      compiledDir,
      bundle,
      diagnosticBrowserOverride,
      output,
      inputs,
    }),
  );
  process.exit(0);
}
assert(output, "Capture output directory was not created");
await writeFile(
  resolve(output, "inputs.json"),
  `${JSON.stringify({ source: entry.origin, fixture: entry.fixture, project, compiledDir, bundle, inputs }, null, 2)}\n`,
);
const captures = await captureAgentRunFresh({
  entry,
  upstream,
  sdk,
  browserPath: captureBrowserPath,
  project,
  compiledDir,
  bundle,
  output,
  frames,
  repeatFrames,
  paintBarrier,
  immediateRecapture,
});
assert.equal(captures.complete, true);
assert.deepEqual(captures.frames, captureFrames);
const effectiveBrowserArguments = [];
if (diagnosticBrowserOverride) {
  for (const name of (await readdir(output)).filter((name) =>
    /^browser-arguments-\d+\.nul$/.test(name),
  )) {
    const raw = await readFile(resolve(output, name));
    const command = raw.toString("utf8").split("\0");
    assert.equal(command.pop(), "");
    assert.equal(command[0], browser.path);
    assert.deepEqual(
      command.slice(-appendedArguments.length),
      appendedArguments,
    );
    effectiveBrowserArguments.push({
      path: name,
      sha256: createHash("sha256").update(raw).digest("hex"),
      command,
    });
  }
  assert(effectiveBrowserArguments.length, "Missing wrapper argument evidence");
}
const sharp = createRequire(resolve(sdk, "package.json"))("sharp");
function pixelDifference(left, right) {
  assert.equal(left.data.length, right.data.length);
  let pixels = 0;
  let maxChannelDelta = 0;
  let alphaPixels = 0;
  let leftBound = Infinity;
  let top = Infinity;
  let rightBound = -1;
  let bottom = -1;
  for (let index = 0; index < left.data.length; index += 4) {
    let changed = false;
    for (let channel = 0; channel < 4; channel++) {
      const delta = Math.abs(
        left.data[index + channel] - right.data[index + channel],
      );
      if (!delta) continue;
      changed = true;
      maxChannelDelta = Math.max(maxChannelDelta, delta);
      if (channel === 3) alphaPixels++;
    }
    if (!changed) continue;
    pixels++;
    const position = index / 4;
    const x = position % left.info.width;
    const y = Math.floor(position / left.info.width);
    leftBound = Math.min(leftBound, x);
    top = Math.min(top, y);
    rightBound = Math.max(rightBound, x);
    bottom = Math.max(bottom, y);
  }
  return {
    pixels,
    maxChannelDelta,
    alphaPixels,
    bounds: pixels ? { left: leftBound, top, right: rightBound, bottom } : null,
  };
}
const comparisons = [];
const decoded = [];
const samePageRecaptures = [];
const secondDecoded = [];
async function decode(path) {
  const image = await sharp(path)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert.equal(image.info.width, entry.fixture.width);
  assert.equal(image.info.height, entry.fixture.height);
  assert.equal(image.info.channels, 4);
  return image;
}
for (const [index, frame] of captureFrames.entries()) {
  const name = `frame_${String(index + 1).padStart(6, "0")}.png`;
  const [left, right] = await Promise.all(
    ["reference", "hyperframes"].map((directory) =>
      decode(resolve(output, directory, name)),
    ),
  );
  decoded.push({ reference: left, hyperframes: right });
  comparisons.push({
    frame,
    exactRgba: left.data.equals(right.data),
    referenceSha256: createHash("sha256").update(left.data).digest("hex"),
    hyperframesSha256: createHash("sha256").update(right.data).digest("hex"),
    difference: pixelDifference(left, right),
  });
  if (immediateRecapture) {
    const pair = await Promise.all(
      ["reference", "hyperframes"].map(async (directory) => {
        const capture =
          captures[
            directory === "reference" ? "referenceCaptures" : "producerCaptures"
          ][index];
        const recapture = capture.immediateRecapture;
        assert.equal(recapture.primaryScreenshot, "first");
        assert.deepEqual(recapture.first.parameters, capture.parameters);
        assert.deepEqual(recapture.second.parameters, capture.parameters);
        const images = await Promise.all(
          [recapture.first, recapture.second].map(async (item) => {
            const path = resolve(output, item.path);
            assert.equal(
              createHash("sha256")
                .update(await readFile(path))
                .digest("hex"),
              item.sha256,
            );
            return decode(path);
          }),
        );
        const primary = directory === "reference" ? left : right;
        assert(
          primary.data.equals(images[0].data),
          "Official primary output is not the raw first screenshot",
        );
        return { first: images[0], second: images[1] };
      }),
    );
    secondDecoded.push({
      reference: pair[0].second,
      hyperframes: pair[1].second,
    });
    const own = ({ first, second }) => ({
      exactRgba: first.data.equals(second.data),
      difference: pixelDifference(first, second),
    });
    samePageRecaptures.push({
      frame,
      reference: own(pair[0]),
      hyperframes: own(pair[1]),
      secondCross: {
        exactRgba: pair[0].second.data.equals(pair[1].second.data),
        difference: pixelDifference(pair[0].second, pair[1].second),
      },
    });
  }
}
const repeats = (images) =>
  repeatFrames.map((frame, index) => {
    const first = images[frames.indexOf(frame)];
    const repeat = images[frames.length + index];
    return {
      frame,
      reference: {
        exactRgba: first.reference.data.equals(repeat.reference.data),
        difference: pixelDifference(first.reference, repeat.reference),
      },
      hyperframes: {
        exactRgba: first.hyperframes.data.equals(repeat.hyperframes.data),
        difference: pixelDifference(first.hyperframes, repeat.hyperframes),
      },
    };
  });
const selfRepeats = repeats(decoded);
const secondSelfRepeats = immediateRecapture ? repeats(secondDecoded) : [];
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
  `[0:v]format=rgb24[left];[1:v]format=rgb24[right];[left][right]ssim=stats_file=${resolve(output, "ssim.log")}`,
  "-frames:v",
  String(captureFrames.length),
  "-f",
  "null",
  "-",
]);
const scores = [
  ...(await readFile(resolve(output, "ssim.log"), "utf8")).matchAll(
    /All:([\d.]+)/g,
  ),
].map((match) => Number(match[1]));
assert.equal(scores.length, captureFrames.length);
assert.deepEqual(
  await inputState(),
  inputs,
  "Inputs changed during bounded controls",
);
const report = {
  slug: entry.slug,
  scope:
    "Bounded fresh-page diagnostic; does not establish full fixture parity",
  frames,
  repeatFrames,
  captureFrames,
  paintBarrier,
  immediateRecapture,
  comparisons,
  selfRepeats,
  ...(immediateRecapture && {
    samePageRecaptures,
    secondSelfRepeats,
    captureEvidence: "capture.json",
    primaryScreenshot: "first",
  }),
  rgbSsim: scores,
  pass:
    comparisons.every((item) => item.exactRgba) &&
    selfRepeats.every(
      (item) => item.reference.exactRgba && item.hyperframes.exactRgba,
    ) &&
    samePageRecaptures.every(
      (item) =>
        item.reference.exactRgba &&
        item.hyperframes.exactRgba &&
        item.secondCross.exactRgba,
    ) &&
    secondSelfRepeats.every(
      (item) => item.reference.exactRgba && item.hyperframes.exactRgba,
    ) &&
    scores.every((score) => score === 1),
  output,
  diagnosticBrowserOverride,
  rawCaptureProfile: captures.profile,
  rawReferenceBrowserArguments: captures.referenceBrowserArguments,
  rawProducerBrowserArguments: captures.producerBrowserArguments,
  effectiveBrowserArguments,
};
await writeFile(
  resolve(output, "report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report));
assert(
  report.pass,
  "Bounded source/production comparison differs; retained report includes frame hashes",
);
