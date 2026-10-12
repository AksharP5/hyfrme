import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { homedir } from "node:os";
import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { assertExactFrameHashes } from "./parity-evidence.mjs";
import {
  captureProfile,
  fileHash,
  hash,
  hashes,
  json,
  prepareBrowser,
  prepareReference,
  prepareSource,
  referenceGl,
  remotionVersion,
  renderProducerFresh,
  renderReference,
  root,
  run,
  save,
  upstream,
  work,
} from "./showcase-lossless-reference.mjs";

const args = process.argv.slice(2);
if (args.includes("--help")) {
  console.log(
    "Usage: node scripts/verify-showcase-lossless.mjs [--only slug,...] [--resume] [--prepare]\n--prepare validates pinned inputs and compiles source/standalone projects without browser capture.\nFull installed CLI check/render and separate fresh-context native/production-producer frame proofs are required. Public videos/posters and canonical proof metadata update only after every RGBA frame and RGB SSIM match exactly.",
  );
  process.exit(0);
}
const prepare = args.includes("--prepare");
const resume = args.includes("--resume");
const onlyIndex = args.indexOf("--only");
if (
  onlyIndex !== -1 &&
  (!args[onlyIndex + 1] || args[onlyIndex + 1].startsWith("--"))
)
  throw new Error("--only requires comma-separated Collection demo names");
const requested =
  onlyIndex === -1 ? null : new Set(args[onlyIndex + 1].split(","));
const all = await json(resolve(root, "catalog/showcase-fixtures.json"));
const fixtures = all.filter((entry) => !requested || requested.has(entry.slug));
if (!fixtures.length || (requested && requested.size !== fixtures.length))
  throw new Error("--only contains an unknown Collection demo");
if (new Set(all.map((entry) => entry.slug)).size !== all.length)
  throw new Error("Collection fixture names must be unique");
for (const entry of fixtures) {
  if (
    !/^[a-z0-9-]+$/.test(entry.slug) ||
    !/^[A-Za-z][A-Za-z0-9]+$/.test(entry.componentName)
  )
    throw new Error("Invalid Collection fixture name");
  for (const key of ["width", "height", "fps", "durationInFrames"])
    if (!Number.isInteger(entry.fixture[key]) || entry.fixture[key] < 1)
      throw new Error(`${entry.slug}: invalid fixture ${key}`);
}

const hyperframesVersion = "0.8.99";
let hyperframes;
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
      ?.version === hyperframesVersion
  ) {
    hyperframes = candidate;
    break;
  }
}
if (!hyperframes)
  throw new Error(
    "HyperFrames 0.8.99 is not cached; dependency installation is disabled",
  );
const hyperframesCli = resolve(hyperframes, "bin/hyperframes.mjs");
const compilerFile = (await readdir(resolve(hyperframes, "dist"))).find(
  (file) => /^bundleWithLocalizedFonts-.*\.js$/.test(file),
);
if (!compilerFile) throw new Error("Cached HyperFrames compiler is missing");
const { bundleWithLocalizedFonts } = await import(
  pathToFileURL(resolve(hyperframes, "dist", compilerFile)).href
);
const browserPath = resolve(
  homedir(),
  ".cache/hyperframes/chrome/chrome-headless-shell/linux-152.0.7977.30/chrome-headless-shell-linux64/chrome-headless-shell",
);
const browserVersion = (await run(browserPath, ["--version"])).trim();
if (browserVersion !== "Google Chrome for Testing 152.0.7977.30")
  throw new Error("Unexpected pinned Headless Shell version");
const captureBrowserPath = await prepareBrowser(browserPath);
const env = {
  HYPERFRAMES_BROWSER_PATH: captureBrowserPath,
  PRODUCER_BROWSER_GPU_MODE: "hardware",
  PRODUCER_FORCE_SCREENSHOT: "true",
};
const tools = {
  hyperframesVersion,
  hyperframesCliSha256: await fileHash(hyperframesCli),
  remotionVersion,
  browserVersion,
  browserPath,
  browserSha256: await fileHash(browserPath),
  browserWrapperSha256: await fileHash(captureBrowserPath),
  referenceGl,
  rasterization: "CPU rasterization, hardware WebGL, screenshot capture, DPR 1",
  captureProfile,
  captureLifecycle: {
    reference: "Remotion renderStill; fresh page per frame in one browser",
    hyperframes:
      "Production producer API; fresh capture session/page per frame; observed browser PIDs recorded",
    installedValidation:
      "Full CLI check and complete strict sequential CLI PNG render, separately archived",
  },
  producerHashes: Object.fromEntries(
    await Promise.all(
      [
        "package.json",
        "dist/producer-LGG3TOUI.js",
        "dist/src-QF6RYX76.js",
        "dist/chunk-JXXE3SWC.js",
        "dist/chunk-VW5OMJNG.js",
        "dist/hyperframe.runtime.iife.js",
      ].map(async (path) => [path, await fileHash(resolve(hyperframes, path))]),
    ),
  ),
  verifierSha256: await fileHash(import.meta.filename),
  referenceHelperSha256: await fileHash(
    resolve(root, "scripts/showcase-lossless-reference.mjs"),
  ),
  evidenceHelperSha256: await fileHash(
    resolve(root, "scripts/parity-evidence.mjs"),
  ),
  ffmpegVersion: (await run("ffmpeg", ["-version"])).split("\n")[0],
};
const context = await prepareSource(fixtures);
const sourceInputs = {
  ...context.sourceHashes,
  ...context.assetHashes,
  "assets/remocn-collections/manifest.json": await fileHash(
    resolve(root, "assets/remocn-collections/manifest.json"),
  ),
  "catalog/showcase-fixtures.json": await fileHash(
    resolve(root, "catalog/showcase-fixtures.json"),
  ),
};
const standalone = resolve(root, "showcases");
const projectInputs = {
  ...(await hashes(resolve(standalone, "assets"))),
  "showcases/hyperframes.json": await fileHash(
    resolve(standalone, "hyperframes.json"),
  ),
  "showcases/package.json": await fileHash(resolve(standalone, "package.json")),
};
const failures = [];

async function assertUnchanged(recorded) {
  for (const [path, checksum] of Object.entries(recorded))
    if ((await fileHash(resolve(root, path))) !== checksum)
      throw new Error(`Pinned input changed during verification: ${path}`);
}

async function assertFrames(directory, count, first) {
  const files = (await readdir(directory))
    .filter((file) => file.endsWith(".png"))
    .sort();
  if (
    files.length !== count ||
    files.some(
      (file, index) =>
        file !== `frame_${String(index + first).padStart(6, "0")}.png`,
    )
  )
    throw new Error(
      `${directory}: expected exactly ${count} consecutive PNG frames`,
    );
}

async function rgba(directory, fps, first, output) {
  await run("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-framerate",
    String(fps),
    "-start_number",
    String(first),
    "-i",
    resolve(directory, "frame_%06d.png"),
    "-pix_fmt",
    "rgba",
    "-f",
    "framehash",
    "-hash",
    "sha256",
    output,
  ]);
  return (await readFile(output, "utf8"))
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("#"))
    .map((line) => line.split(",").at(-1).trim());
}

async function archiveFrames(
  directory,
  fps,
  first,
  archive,
  expectedHashes,
  fixture,
) {
  await run("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-framerate",
    String(fps),
    "-start_number",
    String(first),
    "-i",
    resolve(directory, "frame_%06d.png"),
    "-c:v",
    "ffv1",
    "-level",
    "3",
    "-coder",
    "1",
    "-context",
    "1",
    "-g",
    "1",
    "-pix_fmt",
    "bgra",
    archive,
  ]);
  const decoded = `${archive}.rgba.sha256`;
  await run("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-i",
    archive,
    "-pix_fmt",
    "rgba",
    "-f",
    "framehash",
    "-hash",
    "sha256",
    decoded,
  ]);
  await assertExactFrameHashes(expectedHashes, decoded, fixture);
}

async function assertCompleteExactCapture(evidence, fixture, proof) {
  const count = fixture.durationInFrames;
  if (
    evidence.pass !== true ||
    evidence.result?.pass !== true ||
    evidence.result?.exactRgba !== true ||
    evidence.result?.meanSsim !== 1 ||
    evidence.result?.minSsim !== 1 ||
    evidence.result?.frameCount !== count ||
    !Array.isArray(evidence.result?.mismatchedFrames) ||
    evidence.result.mismatchedFrames.length !== 0 ||
    evidence.fullCheckPassed !== true ||
    evidence.strictCaptureComplete !== true ||
    evidence.strictSequentialCaptureComplete !== true
  )
    throw new Error("Incomplete exact capture proof");
  const frames = await json(resolve(proof, "rgba.json"));
  if (
    !Array.isArray(frames) ||
    frames.length !== count ||
    frames.some(
      (frame, index) =>
        frame.frame !== index ||
        frame.exact !== true ||
        !/^[a-f0-9]{64}$/.test(frame.referenceSha256) ||
        frame.referenceSha256 !== frame.hyperframesSha256,
    )
  )
    throw new Error("Incomplete or unordered RGBA proof");
  const paths = ["reference-rgba.sha256", "hyperframes-rgba.sha256"].map(
    (file) => resolve(proof, file),
  );
  await assertExactFrameHashes(paths[0], paths[1], {
    frameCount: count,
    width: fixture.width,
    height: fixture.height,
  });
  for (const path of paths) {
    const rows = (await readFile(path, "utf8"))
      .split("\n")
      .filter((line) => line.trim() && !line.startsWith("#"))
      .map((line) => line.split(",").map((field) => field.trim()));
    // PNG sequence hashes use frame-index timestamps; archive timestamps may round.
    if (
      rows.some(
        (row, index) =>
          Number(row[1]) !== index ||
          Number(row[2]) !== index ||
          Number(row[3]) !== 1 ||
          row[5] !== frames[index].referenceSha256,
      )
    )
      throw new Error(`${path}: unordered or inconsistent RGBA frame hashes`);
  }
}

for (const entry of fixtures) {
  const { slug, fixture } = entry;
  const directory = resolve(work, slug);
  const project = resolve(directory, "installed");
  const proof = resolve(root, "parity/showcases", `${slug}-lossless`);
  console.log(
    `${prepare ? "Preparing" : "Verifying"} ${slug}: ${fixture.durationInFrames} frames`,
  );
  await mkdir(directory, { recursive: true });
  const evidence = {
    slug,
    source: entry.origin,
    fixture,
    tools,
    status: "failed",
    pass: false,
  };
  try {
    const htmlPath = `showcases/compositions/${slug}.html`;
    const runtimePath = `showcases/compositions/${slug}.runtime.js`;
    const html = await readFile(resolve(root, htmlPath), "utf8");
    for (const [name, expected] of Object.entries({
      width: fixture.width,
      height: fixture.height,
      fps: fixture.fps,
      duration: fixture.durationInFrames / fixture.fps,
    })) {
      const value = Number(
        html.match(new RegExp(`data-${name}=["']([^"']+)["']`))?.[1],
      );
      if (!Number.isFinite(value) || Math.abs(value - expected) > 1e-8)
        throw new Error(
          `${slug}: standalone ${name} differs from current fixture`,
        );
    }
    const inputHashes = {
      ...sourceInputs,
      ...projectInputs,
      [htmlPath]: await fileHash(resolve(root, htmlPath)),
      [runtimePath]: await fileHash(resolve(root, runtimePath)),
    };
    const reference = await prepareReference(entry, context);
    Object.assign(inputHashes, reference.files);
    evidence.inputHashes = inputHashes;
    evidence.dependencyVersions = context.versions;
    evidence.referenceModuleCount = reference.moduleCount;
    evidence.frozenUrlReplacements = reference.replacements;
    evidence.fingerprint = hash(
      JSON.stringify({ entry, inputHashes, versions: context.versions, tools }),
    );
    const previous =
      resume && !prepare
        ? await json(resolve(proof, "proof.json")).catch(() => null)
        : null;
    if (
      previous?.status === "verified" &&
      previous.fingerprint === evidence.fingerprint
    ) {
      let exactEvidence = false;
      try {
        await assertCompleteExactCapture(previous, fixture, proof);
        exactEvidence = true;
      } catch (error) {
        console.log(`Rechecking ${slug}: ${error.message}`);
      }
      const checksums = Object.entries(previous.artifactHashes ?? {});
      if (
        exactEvidence &&
        checksums.length >= 8 &&
        (
          await Promise.all(
            checksums.map(
              async ([path, checksum]) =>
                (await fileHash(resolve(root, path)).catch(() => null)) ===
                checksum,
            ),
          )
        ).every(Boolean)
      ) {
        console.log(
          `Reusing ${slug}: complete exact proof and archives unchanged`,
        );
        continue;
      }
    }
    await rm(project, { recursive: true, force: true });
    await cp(standalone, project, { recursive: true });
    await cp(resolve(root, htmlPath), resolve(project, "index.html"));
    let compiled = await bundleWithLocalizedFonts(project);
    await writeFile(resolve(directory, "compiled.html"), compiled);
    evidence.compiledSha256 = hash(compiled);
    evidence.installedFileHashes = await hashes(project);
    await save(resolve(directory, "inputs.json"), evidence);
    if (prepare) {
      evidence.status = "prepared";
      await save(resolve(directory, "inputs.json"), evidence);
      continue;
    }
    await rm(proof, { recursive: true, force: true });
    await mkdir(proof, { recursive: true });
    const check = await run(
      process.execPath,
      [hyperframesCli, "check", "--json", "--browser-gpu"],
      { cwd: project, env, log: resolve(proof, "hyperframes-check.log") },
    );
    evidence.check = JSON.parse(check.slice(check.indexOf("{")));
    await save(resolve(proof, "hyperframes-check.json"), evidence.check);
    if (!evidence.check.ok) throw new Error("Full HyperFrames check failed");
    evidence.fullCheckPassed = true;
    const referenceFrames = resolve(directory, "reference-frames");
    const portFrames = resolve(directory, "hyperframes-frames");
    const sequentialFrames = resolve(
      directory,
      "hyperframes-sequential-frames",
    );
    const cliCapture = await mkdtemp(resolve(directory, "cli-capture-"));
    await rm(referenceFrames, { recursive: true, force: true });
    await rm(portFrames, { recursive: true, force: true });
    await rm(sequentialFrames, { recursive: true, force: true });
    await mkdir(referenceFrames, { recursive: true });
    await mkdir(portFrames, { recursive: true });
    await run(
      process.execPath,
      [
        hyperframesCli,
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
        env: { ...env, PRODUCER_RENDERS_DIR: resolve(cliCapture, "renders") },
        log: resolve(proof, "hyperframes-render.log"),
      },
    );
    await assertFrames(sequentialFrames, fixture.durationInFrames, 1);
    const debugRuns = await readdir(resolve(cliCapture, ".debug"));
    if (debugRuns.length !== 1)
      throw new Error("Expected one actual CLI debug compiler output");
    const compiledDir = resolve(cliCapture, ".debug", debugRuns[0], "compiled");
    compiled = await readFile(resolve(compiledDir, "index.html"), "utf8");
    await writeFile(resolve(directory, "compiled.html"), compiled);
    evidence.compiledSha256 = hash(compiled);
    evidence.compiledFiles = await hashes(compiledDir);
    evidence.strictSequentialCaptureComplete = true;
    evidence.sequentialCliCapture = {
      frameCount: fixture.durationInFrames,
      lifecycle: "Full strict installed CLI sequential PNG render",
      exactComparison:
        "Separate fresh-context native/production-producer proof below; this render is not labelled pixel-exact",
    };
    await save(
      resolve(proof, "hyperframes-sequential-capture.json"),
      evidence.sequentialCliCapture,
    );
    evidence.referenceCapture = await renderReference(
      entry,
      reference,
      captureBrowserPath,
      referenceFrames,
      { freshPages: true },
    );
    await save(
      resolve(proof, "reference-capture.json"),
      evidence.referenceCapture,
    );
    for (const file of (await readdir(referenceFrames)).filter((name) =>
      name.endsWith(".png"),
    )) {
      const frame = Number(file.match(/^frame_(\d+)\.png$/)?.[1]);
      if (!Number.isInteger(frame))
        throw new Error("Unexpected native PNG filename");
      const target = `frame_${String(frame).padStart(6, "0")}.png`;
      if (file !== target)
        await rename(
          resolve(referenceFrames, file),
          resolve(referenceFrames, target),
        );
    }
    evidence.hyperframesCapture = await renderProducerFresh(
      entry,
      hyperframes,
      project,
      compiledDir,
      portFrames,
      captureBrowserPath,
    );
    await save(
      resolve(proof, "hyperframes-fresh-capture.json"),
      evidence.hyperframesCapture,
    );
    await assertFrames(referenceFrames, fixture.durationInFrames, 0);
    await assertFrames(portFrames, fixture.durationInFrames, 1);
    evidence.strictCaptureComplete = true;
    const referenceRgba = resolve(proof, "reference-rgba.sha256");
    const portRgba = resolve(proof, "hyperframes-rgba.sha256");
    const sequentialRgba = resolve(proof, "hyperframes-sequential-rgba.sha256");
    const left = await rgba(referenceFrames, fixture.fps, 0, referenceRgba);
    const right = await rgba(portFrames, fixture.fps, 1, portRgba);
    await rgba(sequentialFrames, fixture.fps, 1, sequentialRgba);
    const frames = left.map((referenceSha256, frame) => ({
      frame,
      referenceSha256,
      hyperframesSha256: right[frame],
      exact: referenceSha256 === right[frame],
    }));
    await save(resolve(proof, "rgba.json"), frames);
    const stats = resolve(proof, "ssim.txt");
    await run(
      "ffmpeg",
      [
        "-hide_banner",
        "-loglevel",
        "error",
        "-framerate",
        String(fixture.fps),
        "-start_number",
        "0",
        "-i",
        resolve(referenceFrames, "frame_%06d.png"),
        "-framerate",
        String(fixture.fps),
        "-start_number",
        "1",
        "-i",
        resolve(portFrames, "frame_%06d.png"),
        "-filter_complex",
        `[0:v]format=gbrp,settb=1/${fixture.fps},setpts=N[a];[1:v]format=gbrp,settb=1/${fixture.fps},setpts=N[b];[a][b]ssim=stats_file=${stats}`,
        "-f",
        "null",
        "-",
      ],
      { log: resolve(proof, "ssim.log") },
    );
    const scores = [
      ...(await readFile(stats, "utf8")).matchAll(/^n:\d+ .*?All:([\d.]+)/gm),
    ].map((match) => Number(match[1]));
    if (scores.length !== fixture.durationInFrames)
      throw new Error("SSIM does not cover every frame");
    const mismatchedFrames = frames
      .filter((frame) => !frame.exact)
      .map((frame) => frame.frame);
    evidence.result = {
      lifecycle:
        "Fresh native renderStill pages and production producer capture sessions",
      frameCount: scores.length,
      exactRgba: mismatchedFrames.length === 0,
      pass: mismatchedFrames.length === 0 && Math.min(...scores) === 1,
      mismatchedFrames,
      meanSsim: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      minSsim: Math.min(...scores),
      worstFrame: scores.indexOf(Math.min(...scores)),
    };
    const hashFixture = {
      frameCount: fixture.durationInFrames,
      width: fixture.width,
      height: fixture.height,
    };
    const referenceArchive = resolve(directory, "reference.mkv");
    const portArchive = resolve(directory, "hyperframes.mkv");
    const sequentialArchive = resolve(directory, "hyperframes-sequential.mkv");
    await archiveFrames(
      referenceFrames,
      fixture.fps,
      0,
      referenceArchive,
      referenceRgba,
      hashFixture,
    );
    await archiveFrames(
      portFrames,
      fixture.fps,
      1,
      portArchive,
      portRgba,
      hashFixture,
    );
    await archiveFrames(
      sequentialFrames,
      fixture.fps,
      1,
      sequentialArchive,
      sequentialRgba,
      hashFixture,
    );
    await rm(sequentialFrames, { recursive: true, force: true });
    evidence.losslessArchives = {
      reference: relative(root, referenceArchive),
      hyperframes: relative(root, portArchive),
      sequentialHyperframes: relative(root, sequentialArchive),
    };
    if (!evidence.result.exactRgba || evidence.result.minSsim !== 1) {
      await run("ffmpeg", [
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        resolve(
          referenceFrames,
          `frame_${String(evidence.result.worstFrame).padStart(6, "0")}.png`,
        ),
        "-i",
        resolve(
          portFrames,
          `frame_${String(evidence.result.worstFrame + 1).padStart(6, "0")}.png`,
        ),
        "-filter_complex",
        "[0:v][1:v]hstack",
        "-frames:v",
        "1",
        resolve(proof, "worst-frame.png"),
      ]);
      await rm(referenceFrames, { recursive: true, force: true });
      await rm(portFrames, { recursive: true, force: true });
      throw new Error(
        `${mismatchedFrames.length}/${fixture.durationInFrames} RGBA frames differ; minimum SSIM ${evidence.result.minSsim}`,
      );
    }
    await assertExactFrameHashes(referenceRgba, portRgba, hashFixture);
    await assertUnchanged(inputHashes);
    await assertUnchanged(evidence.installedFileHashes);
    await assertUnchanged(evidence.compiledFiles);
    for (const [path, checksum] of Object.entries(tools.producerHashes))
      if ((await fileHash(resolve(hyperframes, path))) !== checksum)
        throw new Error(`Renderer changed during verification: ${path}`);
    await assertUnchanged({
      [relative(root, browserPath)]: tools.browserSha256,
      [relative(root, captureBrowserPath)]: tools.browserWrapperSha256,
      [relative(root, import.meta.filename)]: tools.verifierSha256,
      "scripts/showcase-lossless-reference.mjs": tools.referenceHelperSha256,
      "scripts/parity-evidence.mjs": tools.evidenceHelperSha256,
    });
    const video = resolve(directory, `${slug}.mp4`);
    const poster = resolve(directory, `${slug}.png`);
    const posterFrame = Math.min(120, fixture.durationInFrames - 1);
    await run("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-framerate",
      String(fixture.fps),
      "-start_number",
      "1",
      "-i",
      resolve(portFrames, "frame_%06d.png"),
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-crf",
      "18",
      "-pix_fmt",
      "yuv420p",
      "-an",
      video,
    ]);
    await cp(
      resolve(
        portFrames,
        `frame_${String(posterFrame + 1).padStart(6, "0")}.png`,
      ),
      poster,
    );
    await cp(video, resolve(root, "public/showcases", `${slug}.mp4`));
    await cp(poster, resolve(root, "public/showcases", `${slug}.png`));
    evidence.status = "verified";
    evidence.pass = true;
    evidence.posterFrame = posterFrame;
    evidence.published = {
      video: `public/showcases/${slug}.mp4`,
      poster: `public/showcases/${slug}.png`,
    };
    await rm(referenceFrames, { recursive: true, force: true });
    await rm(portFrames, { recursive: true, force: true });
    console.log(
      `${slug}: full check and strict CLI capture passed; fresh-context native/production-producer ${fixture.durationInFrames}/${fixture.durationInFrames} exact RGBA frames, RGB SSIM 1`,
    );
  } catch (error) {
    evidence.error = error.message;
    failures.push(`${slug}: ${error.message}`);
    console.error(failures.at(-1));
  }
  if (!prepare) {
    await mkdir(proof, { recursive: true });
    evidence.artifactHashes = { ...evidence.installedFileHashes };
    if (evidence.compiledSha256)
      evidence.artifactHashes[
        relative(root, resolve(directory, "compiled.html"))
      ] = evidence.compiledSha256;
    if (evidence.hyperframesCapture) {
      evidence.artifactHashes[evidence.hyperframesCapture.servedBodyPath] =
        evidence.hyperframesCapture.servedBodySha256;
      Object.assign(evidence.artifactHashes, evidence.compiledFiles);
    }
    for (const file of await readdir(proof))
      if (file !== "proof.json")
        evidence.artifactHashes[relative(root, resolve(proof, file))] =
          await fileHash(resolve(proof, file));
    for (const path of Object.values(evidence.losslessArchives ?? {})) {
      evidence.artifactHashes[path] = await fileHash(resolve(root, path));
      evidence.artifactHashes[`${path}.rgba.sha256`] = await fileHash(
        resolve(root, `${path}.rgba.sha256`),
      );
    }
    for (const path of Object.values(evidence.published ?? {}))
      evidence.artifactHashes[path] = await fileHash(resolve(root, path));
    await save(resolve(proof, "proof.json"), evidence);
    if (evidence.pass)
      await save(resolve(root, "parity/showcases", `${slug}.json`), {
        slug,
        source: {
          repository: entry.origin.repository,
          commit: entry.origin.commit,
          path: entry.origin.path,
        },
        frameCount: fixture.durationInFrames,
        fps: fixture.fps,
        width: fixture.width,
        height: fixture.height,
        metric: "Decoded RGBA SHA-256 and RGB SSIM",
        meanSsim: 1,
        minimumSsim: 1,
        threshold: 1,
        pass: true,
        verification: {
          ...tools,
          measurement:
            "all fresh-page native/production-producer PNG frames, paired by frame index; complete strict installed CLI render retained separately",
          fingerprint: evidence.fingerprint,
          sourceEntrySha256:
            evidence.inputHashes[
              relative(root, resolve(upstream, entry.origin.path))
            ],
          inputs: Object.fromEntries(
            Object.entries(evidence.inputHashes).filter(([path]) =>
              /^(?:assets|catalog|showcases)\//.test(path),
            ),
          ),
          exactRgba: true,
          fullCheckPassed: evidence.fullCheckPassed,
          strictCaptureComplete: evidence.strictCaptureComplete,
          strictSequentialCaptureComplete:
            evidence.strictSequentialCaptureComplete,
          proof: relative(root, resolve(proof, "proof.json")),
          artifactHashes: Object.fromEntries(
            Object.entries(evidence.artifactHashes).filter(([path]) =>
              /^(?:parity|public)\//.test(path),
            ),
          ),
          posterFrame: evidence.posterFrame,
        },
      });
  } else await save(resolve(directory, "inputs.json"), evidence);
}
await save(
  resolve(work, prepare ? "prepare-summary.json" : "verification-summary.json"),
  {
    status: failures.length ? "failed" : prepare ? "prepared" : "verified",
    demos: fixtures.map((entry) => entry.slug),
    frames: fixtures.reduce(
      (sum, entry) => sum + entry.fixture.durationInFrames,
      0,
    ),
    failures,
    browserCapture: !prepare,
  },
);
if (failures.length) process.exitCode = 1;
else
  console.log(
    `${fixtures.length} Collection demos ${prepare ? "prepared without browser capture" : "verified with complete exact RGBA parity"}.`,
  );
