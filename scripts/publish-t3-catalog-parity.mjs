import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import {
  copyFile,
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  writeFile,
} from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { assertT3CaptureImages } from "./t3-capture-images.mjs";
import { parseHyperframesVariables } from "./hyperframes-variables.mjs";
import {
  assertExactFrameHashes,
  assertVerifiedBlockFiles,
} from "./parity-evidence.mjs";

const root = resolve(import.meta.dirname, "..");
const sourceCommit = "719a76ca1dbf5490f1aa33ffb9966301e02be9a9";
const themes = ["dark", "light"];
const fixture = { width: 1200, height: 659, fps: 30, frameCount: 120 };
const work = ".work/full-parity-audit/t3-catalog-verification";
const source = "assets/t3-code/v0.0.42";
const proofFiles = [
  "proof.json",
  "rgba.json",
  "reference-rgba.sha256",
  "hyperframes-rgba.sha256",
  "ssim.txt",
  "ssim.log",
  "hyperframes-check.json",
  "hyperframes-check.log",
  "hyperframes-render.log",
  "reference-decode.log",
  "install.log",
];
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const json = async (path) => JSON.parse(await readFile(local(path), "utf8"));
function local(path) {
  if (typeof path !== "string" || isAbsolute(path))
    throw new Error(`Expected a repository-relative evidence path: ${path}`);
  const target = resolve(root, path);
  if (!target.startsWith(`${root}${sep}`))
    throw new Error(`Evidence path leaves the repository: ${path}`);
  return target;
}
async function fileHash(path) {
  return new Promise((accept, reject) => {
    const digest = createHash("sha256");
    createReadStream(local(path))
      .on("data", (chunk) => digest.update(chunk))
      .on("end", () => accept(digest.digest("hex")))
      .on("error", reject);
  });
}
async function run(command, args) {
  return new Promise((accept, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    let error = "";
    child.stdout.on("data", (chunk) => (output += chunk));
    child.stderr.on("data", (chunk) => (error = (error + chunk).slice(-4000)));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0)
        return reject(new Error(`${command} exited ${code}: ${error}`));
      accept(output);
    });
  });
}
function requireEqual(actual, expected, label) {
  if (!isDeepStrictEqual(actual, expected))
    throw new Error(`${label} differs from verified evidence`);
}
export function assertT3ProofResult(proof, slug, theme) {
  const result = proof.result;
  if (
    proof.slug !== slug ||
    proof.theme !== theme ||
    proof.sourceCommit !== sourceCommit ||
    proof.status !== "verified" ||
    proof.installedThroughCli !== true ||
    proof.fixture?.width !== fixture.width ||
    proof.fixture.height !== fixture.height ||
    proof.fixture.fps !== fixture.fps ||
    proof.fixture.durationInFrames !== fixture.frameCount ||
    result?.frameCount !== fixture.frameCount ||
    result.meanSsim !== 1 ||
    result.minSsim !== 1 ||
    result.pass !== true ||
    result.exactRgba !== true ||
    !Array.isArray(result.mismatchedFrames) ||
    result.mismatchedFrames.length !== 0
  )
    throw new Error(
      `${slug}/${theme}: complete verified 120-frame exact RGBA/SSIM evidence is required`,
    );
  const check = proof.check;
  if (!check?.ok || check._meta?.version !== proof.tools?.hyperframesVersion)
    throw new Error(
      `${slug}/${theme}: full HyperFrames check evidence is missing`,
    );
  for (const name of ["lint", "runtime", "layout", "motion", "contrast"])
    if (check[name]?.ok !== true || check[name].errorCount !== 0)
      throw new Error(`${slug}/${theme}: full ${name} check did not pass`);
  if (
    proof.tools?.hyperframesVersion !== "0.8.99" ||
    proof.tools?.browserVersion !== "Google Chrome for Testing 152.0.7977.30" ||
    proof.tools?.rasterization !== "native hardware browser, screenshot capture"
  )
    throw new Error(`${slug}/${theme}: unexpected capture profile`);
}
async function assertPng(path) {
  const file = await open(local(path), "r");
  try {
    const bytes = Buffer.alloc(24);
    await file.read(bytes, 0, bytes.length, 0);
    if (
      bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a" ||
      bytes.subarray(12, 16).toString() !== "IHDR" ||
      bytes.readUInt32BE(16) !== fixture.width ||
      bytes.readUInt32BE(20) !== fixture.height
    )
      throw new Error(`${path}: unexpected PNG capture geometry`);
  } finally {
    await file.close();
  }
}

export async function prepareT3CatalogPublication(args = []) {
  const onlyIndex = args.indexOf("--only");
  if (
    onlyIndex !== -1 &&
    (!args[onlyIndex + 1] || args[onlyIndex + 1].startsWith("--"))
  )
    throw new Error("--only requires comma-separated active T3 block names");
  if (onlyIndex !== -1 && args.indexOf("--only", onlyIndex + 1) !== -1)
    throw new Error("Specify --only once");
  const requested =
    onlyIndex === -1
      ? null
      : new Set(args[onlyIndex + 1].split(",").map((name) => name.trim()));
  const registry = await json("registry/registry.json");
  const published = new Set(registry.items.map((item) => item.name));
  const active = (await readdir(local("registry/blocks")))
    .filter((slug) => slug.startsWith("t3-") && published.has(slug))
    .sort();
  if (!requested && active.length !== 41)
    throw new Error(
      `Full T3 publication requires all 41 active blocks; found ${active.length}`,
    );
  const names = requested
    ? active.filter((slug) => requested.has(slug))
    : active;
  if (!names.length || (requested && names.length !== requested.size))
    throw new Error("--only contains an unknown or inactive T3 block");
  const allowedArguments = new Set(["--only", "--prepare"]);
  if (
    args.some(
      (arg, index) =>
        !(onlyIndex !== -1 && index === onlyIndex + 1) &&
        !allowedArguments.has(arg),
    )
  )
    throw new Error("Expected only --only and --prepare publication options");
  const hashes = new Map();
  const currentHash = (path) => {
    if (!hashes.has(path)) hashes.set(path, fileHash(path));
    return hashes.get(path);
  };
  const assertHash = async (path, expected) => {
    if (
      !/^[a-f0-9]{64}$/.test(expected ?? "") ||
      (await currentHash(path)) !== expected
    )
      throw new Error(`${path}: evidence hash changed`);
  };
  const plan = [];
  for (const slug of names) {
    const previous = await json(`parity/${slug}.json`);
    const block = `registry/blocks/${slug}`;
    const manifest = await json(`${block}/registry-item.json`);
    const composition = manifest.files.find(
      (file) => file.type === "hyperframes:composition",
    );
    if (
      !composition ||
      previous.origin?.commit !== sourceCommit ||
      manifest.name !== slug
    )
      throw new Error(
        `${slug}: current pinned source or composition is missing`,
      );
    requireEqual(
      manifest.dimensions,
      { width: fixture.width, height: fixture.height },
      `${slug} dimensions`,
    );
    if (manifest.duration !== 4)
      throw new Error(`${slug}: expected a four-second composition`);
    const variables = parseHyperframesVariables(
      await readFile(local(`${block}/${composition.path}`), "utf8"),
    );
    if (!variables?.length)
      throw new Error(`${slug}: public variable defaults are missing`);
    const defaults = Object.fromEntries(
      variables.map((variable) => [variable.id, variable.default]),
    );
    const entries = [];
    for (const theme of themes) {
      const directory = `parity/t3-catalog/${slug}/${theme}`;
      const proof = await json(`${directory}/proof.json`);
      assertT3ProofResult(proof, slug, theme);
      requireEqual(
        proof.manifest,
        manifest,
        `${slug}/${theme} registry manifest`,
      );
      await assertVerifiedBlockFiles(local(block), manifest, proof.filesSha256);
      const values = { ...defaults, theme };
      for (const [key, value] of Object.entries(proof.fixture.props ?? {}))
        if (
          Object.hasOwn(defaults, key) &&
          value !== null &&
          typeof value === typeof defaults[key]
        )
          values[key] = value;
      values.theme = theme;
      requireEqual(proof.values, values, `${slug}/${theme} captured variables`);
      const input = Object.fromEntries(
        [
          "slug",
          "theme",
          "sourceCommit",
          "reference",
          "referenceSha256",
          "nativeStream",
          "nativeFixture",
          "immutable",
          "historicalMetadataIssues",
          "fixture",
          "values",
          "eventMetadata",
          "manifest",
          "filesSha256",
          "tools",
        ].map((key) => [key, proof[key]]),
      );
      if (sha256(JSON.stringify(input)) !== proof.fingerprint)
        throw new Error(
          `${slug}/${theme}: verification fingerprint is invalid`,
        );
      const inputHashes = {};
      for (const [path, hash] of Object.entries(proof.filesSha256))
        inputHashes[`${block}/${path}`] = hash;
      for (const [path, expected] of Object.entries({
        "scripts/verify-t3-catalog-ports.mjs": proof.tools.verifierSha256,
        "scripts/t3-capture-images.mjs": proof.tools.captureImagesHelperSha256,
        "scripts/parity-evidence.mjs": proof.tools.evidenceHelperSha256,
        "cli/bin/hyfrme.mjs": proof.tools.cliSha256,
      })) {
        await assertHash(path, expected);
        inputHashes[path] = expected;
      }
      if (!proof.immutable?.length)
        throw new Error(
          `${slug}/${theme}: immutable source evidence is missing`,
        );
      for (const asset of proof.immutable) {
        if (!asset.paths?.length)
          throw new Error(`${slug}/${theme}: immutable source path is missing`);
        for (const path of asset.paths) {
          const captureAtlas =
            asset.label === "captureAtlas" &&
            path === proof.fixture.captureAtlas &&
            path === `parity/${slug}-v0042-atlas.json`;
          if (!path.startsWith(`${source}/`) && !captureAtlas)
            throw new Error(
              `${slug}/${theme}: unexpected immutable source path`,
            );
          await assertHash(path, asset.sha256);
          inputHashes[path] = asset.sha256;
          if (captureAtlas) {
            const atlas = await json(path);
            assertT3CaptureImages(
              atlas,
              await json(proof.nativeFixture),
              theme,
            );
          }
        }
      }
      const native = await json(proof.nativeFixture);
      if (
        native.sourceCommit !== sourceCommit ||
        native.sourceTag !== "v0.0.42" ||
        native.viewport?.width !== fixture.width ||
        native.viewport.height !== fixture.height ||
        native.fps !== fixture.fps ||
        native.frames !== fixture.frameCount ||
        (native.theme && native.theme !== theme) ||
        native.referenceSha256 !== proof.referenceSha256 ||
        !proof.immutable.some(
          (asset) =>
            asset.label === "nativeFixture" &&
            asset.paths.includes(proof.nativeFixture),
        )
      )
        throw new Error(
          `${slug}/${theme}: immutable native fixture is invalid`,
        );
      requireEqual(
        proof.fixture.sourceHashes,
        native.sourceHashes,
        `${slug}/${theme} native source hashes`,
      );
      for (const [part, filename] of Object.entries({
        index: "index.html",
        css: "t3.css",
        js: "index.js",
      })) {
        await assertHash(`${source}/${filename}`, native.sourceHashes[part]);
        inputHashes[`${source}/${filename}`] = native.sourceHashes[part];
      }
      await assertHash(proof.reference, proof.referenceSha256);
      inputHashes[proof.reference] = proof.referenceSha256;
      const sourceTheme = `${source}/${theme}-theme.json`;
      const themeSha256 = await currentHash(sourceTheme);
      if (
        !proof.immutable.some(
          (asset) =>
            asset.label === "sourceTheme" &&
            asset.sha256 === themeSha256 &&
            asset.paths.includes(sourceTheme),
        )
      )
        throw new Error(`${slug}/${theme}: native theme evidence is invalid`);
      inputHashes[sourceTheme] = themeSha256;
      if (
        !Object.keys(proof.installedFileHashes ?? {}).length ||
        !proof.compiledSha256 ||
        !proof.artifacts ||
        !proof.artifactHashes
      )
        throw new Error(
          `${slug}/${theme}: installed capture evidence is missing`,
        );
      const installed = `${work}/${slug}/${theme}/installed`;
      requireEqual(
        proof.artifacts.installedProject,
        installed,
        `${slug}/${theme} installed project`,
      );
      requireEqual(
        Object.keys(proof.installedFileHashes).sort(),
        [
          "index.html",
          "hyperframes.json",
          ...manifest.files.map((file) => file.target),
        ]
          .map((path) => `${installed}/${path}`)
          .sort(),
        `${slug}/${theme} complete installed file coverage`,
      );
      for (const [path, expected] of Object.entries(proof.artifactHashes ?? {}))
        await assertHash(path, expected);
      for (const [path, expected] of Object.entries(
        proof.installedFileHashes,
      )) {
        await assertHash(path, expected);
        if (proof.artifactHashes[path] !== expected)
          throw new Error(`${path}: installed proof hash is missing`);
      }
      await assertHash(proof.artifacts.compiledHtml, proof.compiledSha256);
      if (
        proof.artifactHashes[proof.artifacts.compiledHtml] !==
        proof.compiledSha256
      )
        throw new Error(`${slug}/${theme}: compiled capture hash is missing`);
      const artifactHashes = {};
      for (const filename of proofFiles) {
        const path = `${directory}/${filename}`;
        const actual = await currentHash(path);
        if (filename !== "proof.json" && proof.artifactHashes[path] !== actual)
          throw new Error(`${path}: portable proof artifact hash is missing`);
        artifactHashes[path] = actual;
      }
      inputHashes[`${directory}/proof.json`] =
        artifactHashes[`${directory}/proof.json`];
      requireEqual(
        await json(`${directory}/hyperframes-check.json`),
        proof.check,
        `${slug}/${theme} full check`,
      );
      const renderLog = await readFile(
        local(`${directory}/hyperframes-render.log`),
        "utf8",
      );
      const traces = renderLog
        .split("\n")
        .filter((line) => line.includes("[Render:trace] "))
        .map((line) =>
          JSON.parse(line.slice(line.indexOf("[Render:trace] ") + 15)),
        );
      if (
        !traces.some(
          (trace) =>
            trace.phase === "capture_disk" &&
            trace.status === "end" &&
            trace.totalFrames === 120 &&
            trace.framesCompleted === 120 &&
            trace.captureMode === "screenshot",
        ) ||
        !traces.some(
          (trace) =>
            trace.phase === "encode" &&
            trace.status === "end" &&
            trace.framesCompleted === 120,
        )
      )
        throw new Error(
          `${slug}/${theme}: completed strict screenshot capture evidence is missing`,
        );
      const ssim = [
        ...(await readFile(local(`${directory}/ssim.txt`), "utf8")).matchAll(
          /^n:(\d+) .*?All:([\d.]+)/gm,
        ),
      ];
      if (
        ssim.length !== 120 ||
        ssim.some(
          (row, index) => Number(row[1]) !== index + 1 || Number(row[2]) !== 1,
        )
      )
        throw new Error(
          `${slug}/${theme}: SSIM is not exactly one on all 120 frames`,
        );
      await assertExactFrameHashes(
        local(`${directory}/reference-rgba.sha256`),
        local(`${directory}/hyperframes-rgba.sha256`),
        fixture,
      );
      const frames = await json(`${directory}/rgba.json`);
      const rgbaRows = (
        await readFile(local(`${directory}/reference-rgba.sha256`), "utf8")
      )
        .split("\n")
        .filter((line) => line.trim() && !line.startsWith("#"))
        .map((line) => line.split(",").map((part) => part.trim()));
      if (
        rgbaRows.some(
          (row, index) =>
            Number(row[1]) !== index ||
            Number(row[2]) !== index ||
            Number(row[3]) !== 1,
        )
      )
        throw new Error(
          `${slug}/${theme}: RGBA hashes do not cover consecutive frame times`,
        );
      if (
        frames.length !== 120 ||
        frames.some(
          (frame, index) =>
            frame.frame !== index ||
            frame.exact !== true ||
            frame.referenceSha256 !== rgbaRows[index][5] ||
            frame.hyperframesSha256 !== frame.referenceSha256,
        )
      )
        throw new Error(
          `${slug}/${theme}: complete exact RGBA frame evidence is missing`,
        );
      const captures = {};
      for (const [kind, first] of [
        ["reference", 0],
        ["hyperframes", 1],
      ]) {
        const path = `${work}/${slug}/${theme}/${kind}-frames`;
        if (proof.artifacts[`${kind}Frames`] !== path)
          throw new Error(`${slug}/${theme}: unexpected capture path`);
        const names = (await readdir(local(path)))
          .filter((name) => name.endsWith(".png"))
          .sort();
        if (
          names.length !== 120 ||
          names.some(
            (name, index) =>
              name !== `frame_${String(index + first).padStart(6, "0")}.png`,
          )
        )
          throw new Error(`${slug}/${theme}: capture sequence is incomplete`);
        for (const frame of frames) {
          const filename = `${path}/frame_${String(frame.frame + first).padStart(6, "0")}.png`;
          await assertHash(filename, frame[`${kind}PngSha256`]);
          await assertPng(filename);
          captures[filename] = frame[`${kind}PngSha256`];
        }
      }
      const nativeCrop = manifest.files.some(
        (file) => file.path === `native-source-code-v0042-${theme}.png` ||
          file.path === `native-thread-search-input-v0042-${theme}.png`,
      );
      let defaultMode = proof.values.renderMode ??
        (nativeCrop ? "pixel-verified" : "source DOM");
      const replayAsset = proof.immutable.find(
        (asset) => asset.label === "native.darkReplayMetadataSha256",
      );
      if (replayAsset) {
        const replay = await json(replayAsset.paths[0]);
        requireEqual(replay.slug, slug, `${slug}/${theme} native replay block`);
        requireEqual(
          replay.defaultReplayTheme,
          theme,
          `${slug}/${theme} native replay theme`,
        );
        assertT3CaptureImages(replay, native, theme);
        defaultMode = "pixel-verified";
      }
      entries.push({
        theme,
        defaultMode,
        proof,
        native,
        themeSha256,
        inputHashes,
        artifactHashes,
        captures,
      });
    }
    requireEqual(
      entries[0].proof.filesSha256,
      entries[1].proof.filesSha256,
      `${slug} theme source files`,
    );
    const modes = new Set(
      entries.map((entry) => entry.defaultMode),
    );
    if (
      modes.size !== 1 &&
      !entries.some((entry) => entry.native.darkReplayMetadataSha256)
    )
      throw new Error(`${slug}: rendering mode differs between theme fixtures`);
    if ([...modes].some((mode) => typeof mode !== "string" || !mode))
      throw new Error(`${slug}: invalid default rendering mode`);
    const defaultTheme = defaults.theme ?? "dark";
    if (!themes.includes(defaultTheme))
      throw new Error(`${slug}: unsupported default theme`);
    plan.push({
      slug,
      previous,
      manifest,
      composition,
      entries,
      defaultMode: entries.find((entry) => entry.theme === defaultTheme).defaultMode,
      defaultTheme,
      previousSha256: await currentHash(`parity/${slug}.json`),
    });
  }
  return plan;
}

const historicalContract =
  "Previously measured customization, crop, variant, and continuity evidence; these measurements are outside the exact current default-fixture claim.";
export function t3CatalogPublicationRecord(entry, mediaHashes) {
  const { slug, previous, entries, composition, defaultTheme, defaultMode } =
    entry;
  const thresholds = { meanSsim: 1, minSsim: 1, exactRgba: true };
  const inputHashes = Object.assign(
    {},
    ...entries.map((theme) => theme.inputHashes),
  );
  const artifactHashes = {
    ...Object.assign({}, ...entries.map((theme) => theme.artifactHashes)),
    ...mediaHashes,
  };
  const promotedThemes = Object.fromEntries(
    entries.map(({ theme, proof, native, themeSha256, defaultMode }) => {
      const directory = `parity/t3-catalog/${slug}/${theme}`;
      const suffix = theme === "dark" ? "" : "-light";
      const old = previous.themes?.[theme] ?? {};
      const custom = Object.fromEntries(
        Object.entries(old).filter(
          ([key]) =>
            ![
              "fixture",
              "result",
              "status",
              "artifacts",
              "sourceCommit",
              "sourceHashes",
              "sourceDomHashes",
              "referenceSha256",
              "themeSha256",
              "historicalCustomizationEvidence",
            ].includes(key),
        ),
      );
      const variants = Object.fromEntries(
        Object.entries(custom)
          .filter(([key]) => key === "settingsEnabled200")
          .map(([key, value]) => [
            key,
            { ...value, measurementContract: historicalContract },
          ]),
      );
      const result = {
        ...proof.result,
        rgba: { pass: true, frameCount: 120, mismatchedFrames: [] },
        p05Ssim: 1,
        p95Ssim: 1,
      };
      return [
        theme,
        {
          sourceCommit,
          defaultMode,
          status: "verified",
          thresholds,
          values: proof.values,
          fixture: {
            ...proof.fixture,
            sourceHashes: native.sourceHashes,
            referenceSha256: proof.referenceSha256,
            compositionSha256: proof.filesSha256[composition.path],
          },
          sourceHashes: native.sourceHashes,
          sourceDomHashes: native.sourceDomHashes ?? old.sourceDomHashes,
          referenceSha256: proof.referenceSha256,
          themeSha256,
          result,
          artifacts: {
            referenceVideo: `public/previews/${slug}/reference${suffix}.mp4`,
            hyperframesVideo: `public/previews/${slug}/hyperframes${suffix}.mp4`,
            thumbnail: `public/previews/${slug}/thumbnail${suffix}.png`,
            nativeRecording: proof.reference,
            nativeFixture: proof.nativeFixture,
            proof: `${directory}/proof.json`,
            rgba: `${directory}/rgba.json`,
            referenceRgba: `${directory}/reference-rgba.sha256`,
            hyperframesRgba: `${directory}/hyperframes-rgba.sha256`,
            frameSsim: `${directory}/ssim.txt`,
            hyperframesCheck: `${directory}/hyperframes-check.json`,
            strictRender: `${directory}/hyperframes-render.log`,
          },
          ...variants,
          ...(Object.keys(custom).length ||
          old.result ||
          old.historicalCustomizationEvidence
            ? {
                historicalCustomizationEvidence: {
                  contract: historicalContract,
                  ...old.historicalCustomizationEvidence,
                  result:
                    old.historicalCustomizationEvidence?.result ?? old.result,
                  fixture:
                    old.historicalCustomizationEvidence?.fixture ?? old.fixture,
                  fields: {
                    ...old.historicalCustomizationEvidence?.fields,
                    ...custom,
                  },
                },
              }
            : {}),
        },
      ];
    }),
  );
  const selected = promotedThemes[defaultTheme];
  const excluded = new Set([
    "slug",
    "origin",
    "fixture",
    "classification",
    "measurement",
    "status",
    "thresholds",
    "result",
    "themes",
    "checks",
    "artifacts",
    "filesSha256",
    "inputHashes",
    "artifactHashes",
    "defaultMode",
    "defaultTheme",
    "historicalCustomizationEvidence",
  ]);
  const historical = Object.fromEntries(
    Object.entries(previous).filter(([key]) => !excluded.has(key)),
  );
  return {
    slug,
    origin: previous.origin,
    fixture: selected.fixture,
    classification: "source-dom-port",
    measurement: "lossless-png",
    status: "verified",
    defaultMode,
    defaultTheme,
    thresholds,
    result: selected.result,
    themes: promotedThemes,
    checks: {
      hyperframes:
        "full check and strict 120-frame screenshot render passed in dark and light",
      sourceBrowser: entries[0].proof.tools.browserVersion,
      installedThroughCli: true,
      strictRender: true,
    },
    artifacts: selected.artifacts,
    filesSha256: entries[0].proof.filesSha256,
    inputHashes,
    artifactHashes,
    previewEncoding: {
      codec: "h264",
      pixelFormat: "yuv420p",
      width: 1200,
      height: 660,
      fps: 30,
      frameCount: 120,
      bottomPadding: 1,
      thumbnailFrame: 90,
    },
    historicalCustomizationEvidence: {
      contract: historicalContract,
      ...(previous.historicalCustomizationEvidence ?? {}),
      result:
        previous.historicalCustomizationEvidence?.result ?? previous.result,
      fixture:
        previous.historicalCustomizationEvidence?.fixture ?? previous.fixture,
      checks:
        previous.historicalCustomizationEvidence?.checks ?? previous.checks,
      fields: {
        ...historical,
        ...previous.historicalCustomizationEvidence?.fields,
      },
    },
  };
}

async function encodeTheme(entry, stage, mediaHashes) {
  const { slug } = entry;
  for (const { theme, proof } of entry.entries) {
    const suffix = theme === "dark" ? "" : "-light";
    for (const [kind, first] of [
      ["reference", 0],
      ["hyperframes", 1],
    ]) {
      const filename = `${kind}${suffix}.mp4`;
      const output = `${stage}/${slug}/${filename}`;
      await run("ffmpeg", [
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-framerate",
        "30",
        "-start_number",
        String(first),
        "-i",
        local(`${proof.artifacts[`${kind}Frames`]}/frame_%06d.png`),
        "-frames:v",
        "120",
        "-vf",
        "pad=1200:660:0:0:black,format=yuv420p",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "16",
        "-an",
        "-movflags",
        "+faststart",
        local(output),
      ]);
      const stream = JSON.parse(
        await run("ffprobe", [
          "-v",
          "error",
          "-select_streams",
          "v:0",
          "-count_frames",
          "-show_entries",
          "stream=codec_name,pix_fmt,width,height,avg_frame_rate,nb_read_frames",
          "-of",
          "json",
          local(output),
        ]),
      ).streams?.[0];
      if (
        stream?.codec_name !== "h264" ||
        stream.pix_fmt !== "yuv420p" ||
        stream.width !== 1200 ||
        stream.height !== 660 ||
        stream.avg_frame_rate !== "30/1" ||
        Number(stream.nb_read_frames) !== 120
      )
        throw new Error(
          `${slug}/${theme}: encoded preview has unexpected geometry or frame count`,
        );
      mediaHashes[`public/previews/${slug}/${filename}`] =
        await fileHash(output);
    }
    const filename = `thumbnail${suffix}.png`;
    await copyFile(
      local(`${proof.artifacts.hyperframesFrames}/frame_000091.png`),
      local(`${stage}/${slug}/${filename}`),
    );
    mediaHashes[`public/previews/${slug}/${filename}`] = await fileHash(
      `${stage}/${slug}/${filename}`,
    );
  }
}

async function publish(args) {
  const plan = await prepareT3CatalogPublication(args);
  if (args.includes("--prepare")) {
    console.log(
      JSON.stringify(
        {
          status: "ready",
          blocks: plan.length,
          themes: plan.length * 2,
          exactFrames: plan.length * 240,
          defaultModes: Object.fromEntries(
            plan.map(({ slug, defaultMode }) => [slug, defaultMode]),
          ),
          writes: 0,
        },
        null,
        2,
      ),
    );
    return;
  }
  const stage = `.work/full-parity-audit/t3-catalog-publication-${Date.now()}`;
  const staged = [];
  for (const entry of plan) {
    await mkdir(local(`${stage}/${entry.slug}`), { recursive: true });
    const mediaHashes = {};
    await encodeTheme(entry, stage, mediaHashes);
    const record = t3CatalogPublicationRecord(entry, mediaHashes);
    record.inputHashes[relative(root, import.meta.filename)] = await fileHash(
      relative(root, import.meta.filename),
    );
    await writeFile(
      local(`${stage}/${entry.slug}/parity.json`),
      `${JSON.stringify(record, null, 2)}\n`,
    );
    staged.push({ entry, record });
  }
  // Encoding can take time: reject concurrent source, proof, or capture changes before promotion.
  for (const { entry, record } of staged) {
    if ((await fileHash(`parity/${entry.slug}.json`)) !== entry.previousSha256)
      throw new Error(
        `${entry.slug}: canonical metadata changed during publication`,
      );
    await assertVerifiedBlockFiles(
      local(`registry/blocks/${entry.slug}`),
      entry.manifest,
      record.filesSha256,
    );
    for (const [path, expected] of Object.entries({
      ...record.inputHashes,
      ...Object.assign({}, ...entry.entries.map((theme) => theme.captures)),
    }))
      if ((await fileHash(path)) !== expected)
        throw new Error(`${path}: proof input changed during publication`);
    for (const [path, expected] of Object.entries(
      Object.assign({}, ...entry.entries.map((theme) => theme.artifactHashes)),
    ))
      if ((await fileHash(path)) !== expected)
        throw new Error(`${path}: proof artifact changed during publication`);
  }
  for (const { entry } of staged) {
    const target = `public/previews/${entry.slug}`;
    await mkdir(local(target), { recursive: true });
    for (const filename of [
      "reference.mp4",
      "hyperframes.mp4",
      "reference-light.mp4",
      "hyperframes-light.mp4",
      "thumbnail.png",
      "thumbnail-light.png",
    ])
      await rename(
        local(`${stage}/${entry.slug}/${filename}`),
        local(`${target}/${filename}`),
      );
    await rename(
      local(`${stage}/${entry.slug}/parity.json`),
      local(`parity/${entry.slug}.json`),
    );
  }
  console.log(
    `Published ${plan.length} T3 blocks: ${plan.length * 2} themes, exact 120-frame RGBA parity, current source hashes and previews.`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const args = process.argv.slice(2);
  if (args.includes("--help"))
    console.log(
      "Usage: node scripts/publish-t3-catalog-parity.mjs [--only t3-name,...] [--prepare]\nDefault publication requires all 41 active blocks and both exact 120-frame theme proofs. --prepare validates existing proof, source, installed capture and PNG artifacts without writing or encoding. Publication updates local previews and canonical parity only; it never uploads media or captures a browser.",
    );
  else
    await publish(args).catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
