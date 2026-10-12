import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import {
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { createServer } from "node:http";
import { homedir } from "node:os";
import { basename, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import {
  assertT3CaptureImages,
  validFrameImageMapping,
} from "./t3-capture-images.mjs";
import {
  assertExactFrameHashes,
  assertVerifiedBlockFiles,
  hashBlockFiles,
} from "./parity-evidence.mjs";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const sourceCommit = "719a76ca1dbf5490f1aa33ffb9966301e02be9a9";
const work = resolve(root, ".work/full-parity-audit/t3-catalog-verification");
const version = "0.8.99";
const browserPath = resolve(
  homedir(),
  ".cache/hyperframes/chrome/chrome-headless-shell/linux-152.0.7977.30/chrome-headless-shell-linux64/chrome-headless-shell",
);
const args = process.argv.slice(2);
if (args.includes("--help")) {
  console.log(
    "Usage: node scripts/verify-t3-catalog-ports.mjs [--only t3-name,...] [--resume] [--prepare]\n--prepare validates immutable references and installs/compiles fixtures without browser capture.\nProofs are saved under parity/t3-catalog; canonical parity records are never rewritten.",
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
  throw new Error("--only requires comma-separated active T3 block names");
const only = onlyIndex === -1 ? null : new Set(args[onlyIndex + 1].split(","));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

const json = async (path) => JSON.parse(await readFile(path, "utf8"));
const save = (path, value) =>
  writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
const fileHash = (path) =>
  new Promise((accept, reject) => {
    const digest = createHash("sha256");
    createReadStream(path)
      .on("data", (chunk) => digest.update(chunk))
      .on("end", () => accept(digest.digest("hex")))
      .on("error", reject);
  });

async function run(command, parameters, { cwd = root, log, env = {} } = {}) {
  const result = await new Promise((accept, reject) => {
    const child = spawn(command, parameters, {
      cwd,
      env: {
        ...process.env,
        HYPERFRAMES_BROWSER_PATH: browserPath,
        PRODUCER_BROWSER_GPU_MODE: "hardware",
        PRODUCER_FORCE_SCREENSHOT: "true",
        ...env,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", reject);
    child.on("close", (code) => accept({ code, stdout, stderr }));
  });
  if (log) await writeFile(log, `${result.stdout}${result.stderr}`);
  if (result.code !== 0)
    throw new Error(
      `${basename(command)} exited ${result.code}: ${result.stderr.slice(-2000)} ${result.stdout.slice(-1000)}`,
    );
  return result.stdout;
}

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
  const manifest = await json(resolve(candidate, "package.json")).catch(
    () => null,
  );
  if (manifest?.version === version) {
    hyperframes = candidate;
    break;
  }
}
if (!hyperframes)
  throw new Error(
    `HyperFrames ${version} is not cached; this verifier does not install dependencies`,
  );
const hyperframesCli = resolve(hyperframes, "bin/hyperframes.mjs");
const compilerFile = (await readdir(resolve(hyperframes, "dist"))).find(
  (file) => /^bundleWithLocalizedFonts-.*\.js$/.test(file),
);
if (!compilerFile)
  throw new Error("Cached HyperFrames font-localizing compiler is missing");
const { bundleWithLocalizedFonts } = await import(
  pathToFileURL(resolve(hyperframes, "dist", compilerFile)).href
);
const browserVersion = (await run(browserPath, ["--version"])).trim();
if (browserVersion !== "Google Chrome for Testing 152.0.7977.30")
  throw new Error(
    `Unexpected pinned Headless Shell version: ${browserVersion}`,
  );
const tools = {
  hyperframesVersion: version,
  hyperframesCliSha256: await fileHash(hyperframesCli),
  browserPath,
  browserVersion,
  browserSha256: await fileHash(browserPath),
  rasterization: "native hardware browser, screenshot capture",
  verifierSha256: await fileHash(import.meta.filename),
  captureImagesHelperSha256: await fileHash(
    resolve(root, "scripts/t3-capture-images.mjs"),
  ),
  evidenceHelperSha256: await fileHash(
    resolve(root, "scripts/parity-evidence.mjs"),
  ),
  cliSha256: await fileHash(resolve(root, "cli/bin/hyfrme.mjs")),
  ffmpegVersion: (await run("ffmpeg", ["-version"])).split("\n")[0],
};

// Asset fixture names vary; immutable recording hashes identify them unambiguously.
const sourceFiles = (await readdir(source, { withFileTypes: true }))
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .sort();
const sourceFixtures = await Promise.all(
  sourceFiles
    .filter((file) => file.endsWith("-fixture.json"))
    .map(async (file) => ({
      path: resolve(source, file),
      value: await json(resolve(source, file)),
    })),
);
const sourceHashes = new Map();
for (const file of sourceFiles) {
  const path = resolve(source, file);
  const sha256 = await fileHash(path);
  sourceHashes.set(sha256, [
    ...(sourceHashes.get(sha256) ?? []),
    relative(root, path),
  ]);
}
function hashLeaves(value, label) {
  if (typeof value === "string" && /^[a-f0-9]{64}$/.test(value))
    return [{ label, sha256: value }];
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, part]) =>
    hashLeaves(part, `${label}.${key}`),
  );
}
function validateHashes(value, label) {
  return hashLeaves(value, label).map((entry) => {
    const paths = sourceHashes.get(entry.sha256);
    if (!paths)
      throw new Error(
        `${entry.label}: pinned source asset hash is missing: ${entry.sha256}`,
      );
    return { ...entry, paths };
  });
}
const registry = resolve(root, "registry");
const published = new Set(
  (await json(resolve(registry, "registry.json"))).items.map(
    (item) => item.name,
  ),
);
const allNames = (await readdir(resolve(registry, "blocks")))
  .filter((name) => name.startsWith("t3-") && published.has(name))
  .sort();
const names = only ? allNames.filter((name) => only.has(name)) : allNames;
if (!names.length || (only && names.length !== only.size))
  throw new Error("--only contains an unknown or inactive T3 block");
const plan = [];
for (const slug of names) {
  const parity = await json(resolve(root, "parity", `${slug}.json`));
  const block = resolve(registry, "blocks", slug);
  const manifest = await json(resolve(block, "registry-item.json"));
  if (
    parity.origin.commit !== sourceCommit ||
    parity.fixture.width !== 1200 ||
    parity.fixture.height !== 659 ||
    parity.fixture.fps !== 30 ||
    parity.fixture.durationInFrames !== 120
  )
    throw new Error(
      `${slug}: expected pinned v0.0.42 1200×659, 30fps, 120-frame fixture`,
    );
  const composition = manifest.files.find(
    (file) => file.type === "hyperframes:composition",
  );
  if (!composition) throw new Error(`${slug}: installable composition missing`);
  const html = await readFile(resolve(block, composition.path), "utf8");
  const attribute = html.match(/data-composition-variables=(['"])([\s\S]*?)\1/);
  if (!attribute)
    throw new Error(`${slug}: composition variable schema missing`);
  const variables = JSON.parse(
    attribute[2]
      .replaceAll("&quot;", '"')
      .replaceAll("&#39;", "'")
      .replaceAll("&amp;", "&"),
  );
  const defaults = Object.fromEntries(
    variables.map((variable) => [variable.id, variable.default]),
  );
  const filesSha256 = await hashBlockFiles(block, manifest);
  for (const [theme, recorded] of Object.entries(parity.themes ?? {})) {
    if (!["dark", "light"].includes(theme))
      throw new Error(`${slug}: unexpected theme ${theme}`);
    const referenceSha256 =
      recorded.referenceSha256 ?? parity.fixture.referenceSha256;
    const matching = sourceFixtures.filter(
      ({ value }) => value.referenceSha256 === referenceSha256,
    );
    if (matching.length !== 1)
      throw new Error(
        `${slug}/${theme}: expected one immutable native fixture, found ${matching.length}`,
      );
    const native = matching[0];
    if (
      native.value.sourceTag !== "v0.0.42" ||
      native.value.sourceCommit !== sourceCommit ||
      native.value.viewport.width !== 1200 ||
      native.value.viewport.height !== 659 ||
      native.value.fps !== 30 ||
      native.value.frames !== 120 ||
      (native.value.theme && native.value.theme !== theme)
    )
      throw new Error(`${slug}/${theme}: invalid pinned native fixture`);
    for (const [part, file] of Object.entries({
      index: "index.html",
      css: "t3.css",
      js: "index.js",
    })) {
      const path = relative(root, resolve(source, file));
      if (
        !sourceHashes.get(native.value.sourceHashes?.[part])?.includes(path) ||
        native.value.sourceHashes[part] !== parity.fixture.sourceHashes?.[part]
      )
        throw new Error(
          `${slug}/${theme}: pinned ${part} bundle differs from its source declaration`,
        );
    }
    if (native.value.captureSpriteSha256) {
      const imageCount = Object.keys(native.value.captureSpriteSha256).length;
      const mapping = native.value.captureFrameImageIndices;
      if (
        native.value.captureSpriteFrameCount !== 120 ||
        (mapping === undefined
          ? imageCount !== 10
          : !validFrameImageMapping(mapping, imageCount))
      ) {
        throw new Error(`${slug}/${theme}: incomplete native capture images`);
      }
    }
    const candidates = recorded.artifacts?.nativeRecording
      ? [recorded.artifacts.nativeRecording]
      : [
          `parity/${slug}-v0042-${theme}-reference.mkv`,
          `parity/${slug}-v0042${theme === "light" ? "-light" : ""}-reference.mkv`,
        ];
    const references = [];
    for (const path of new Set(candidates)) {
      const sha256 = await fileHash(resolve(root, path)).catch((error) => {
        if (error.code === "ENOENT") return null;
        throw error;
      });
      if (sha256 === referenceSha256) references.push(path);
    }
    if (references.length !== 1)
      throw new Error(
        `${slug}/${theme}: pinned native recording missing or ambiguous`,
      );
    const nativeStream = JSON.parse(
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
        resolve(root, references[0]),
      ]),
    ).streams?.[0];
    if (
      nativeStream?.width !== 1200 ||
      nativeStream.height !== 659 ||
      nativeStream.avg_frame_rate !== "30/1" ||
      Number(nativeStream.nb_read_frames) !== 120
    )
      throw new Error(
        `${slug}/${theme}: pinned native recording has unexpected geometry or frame count`,
      );
    const immutable = [
      {
        label: "nativeFixture",
        sha256: await fileHash(native.path),
        paths: [relative(root, native.path)],
      },
    ];
    for (const [key, value] of Object.entries(native.value)) {
      if (
        /hash|sha/i.test(key) &&
        !["referenceSha256", "releaseSha256"].includes(key)
      )
        immutable.push(...validateHashes(value, `native.${key}`));
    }
    immutable.push(
      ...validateHashes(parity.fixture.sourceHashes, "parity.sourceHashes"),
    );
    const sourceThemePath = resolve(source, `${theme}-theme.json`);
    const sourceThemeSha256 = await fileHash(sourceThemePath);
    const historicalMetadataIssues = [];
    if (recorded.themeSha256 && recorded.themeSha256 !== sourceThemeSha256)
      historicalMetadataIssues.push({
        field: "themeSha256",
        recorded: recorded.themeSha256,
        actual: sourceThemeSha256,
        path: relative(root, sourceThemePath),
      });
    immutable.push({
      label: "sourceTheme",
      sha256: sourceThemeSha256,
      paths: [relative(root, sourceThemePath)],
    });
    if (parity.fixture.captureAtlas) {
      const atlas = await json(resolve(root, parity.fixture.captureAtlas));
      assertT3CaptureImages(atlas, native.value, theme);
      immutable.push(
        {
          label: "captureAtlas",
          sha256: await fileHash(resolve(root, parity.fixture.captureAtlas)),
          paths: [parity.fixture.captureAtlas],
        },
        ...validateHashes(atlas.themes[theme].sha256, "atlas"),
      );
    }
    const values = { ...defaults, theme };
    const eventMetadata = {};
    for (const [key, value] of Object.entries(parity.fixture.props ?? {})) {
      // Historical props also contain events such as output=52, not public variables.
      if (
        Object.hasOwn(defaults, key) &&
        typeof value === typeof defaults[key] &&
        value !== null
      )
        values[key] = value;
      else eventMetadata[key] = value;
    }
    values.theme = theme;
    const input = {
      slug,
      theme,
      sourceCommit,
      reference: references[0],
      referenceSha256,
      nativeStream,
      nativeFixture: relative(root, native.path),
      immutable,
      historicalMetadataIssues,
      fixture: parity.fixture,
      values,
      eventMetadata,
      manifest,
      filesSha256,
      tools,
    };
    plan.push({ ...input, fingerprint: hash(JSON.stringify(input)) });
  }
}
await mkdir(work, { recursive: true });
await save(resolve(work, "plan.json"), plan);

const server = createServer(async (request, response) => {
  try {
    const path = resolve(
      registry,
      `.${decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname)}`,
    );
    if (!path.startsWith(`${registry}${sep}`))
      throw new Error("Unsafe registry path");
    response.end(await readFile(path));
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});
await new Promise((accept) => server.listen(0, "127.0.0.1", accept));
const registryUrl = `http://127.0.0.1:${server.address().port}`;

async function assertFrames(directory, first, pattern) {
  const files = (await readdir(directory))
    .filter((file) => file.endsWith(".png"))
    .sort();
  if (
    files.length !== 120 ||
    files.some((file, index) => file !== pattern(index + first))
  )
    throw new Error(
      `${directory}: expected exactly 120 consecutive PNG frames`,
    );
}
async function rgbaHashes(directory, pattern, first, output) {
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
    resolve(directory, pattern),
    "-pix_fmt",
    "rgba",
    "-f",
    "framehash",
    "-hash",
    "sha256",
    output,
  ]);
  const frames = (await readFile(output, "utf8"))
    .split("\n")
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.split(",").map((part) => part.trim()));
  if (
    frames.length !== 120 ||
    frames.some(
      (frame) =>
        Number(frame[4]) !== 1200 * 659 * 4 || !/^[a-f0-9]{64}$/.test(frame[5]),
    )
  )
    throw new Error(`${output}: invalid decoded RGBA frame sequence`);
  return frames.map((frame) => frame[5]);
}

const failures = [];
try {
  for (const [index, entry] of plan.entries()) {
    const { slug, theme } = entry;
    const directory = resolve(work, slug, theme);
    const project = resolve(directory, "installed");
    const proof = resolve(root, "parity/t3-catalog", slug, theme);
    const previous = resume
      ? await json(resolve(proof, "proof.json")).catch(() => null)
      : null;
    if (
      !prepare &&
      previous?.status === "verified" &&
      previous.fingerprint === entry.fingerprint &&
      previous.result?.exactRgba &&
      previous.result?.minSsim === 1
    ) {
      const intact = (
        await Promise.all(
          Object.entries(previous.artifactHashes ?? {}).map(
            async ([path, sha256]) =>
              (await fileHash(resolve(root, path)).catch(() => null)) ===
              sha256,
          ),
        )
      ).every(Boolean);
      if (intact && Object.keys(previous.artifactHashes ?? {}).length >= 5) {
        const frames = await json(resolve(proof, "rgba.json")).catch(() => []);
        const capturesIntact =
          frames.length === 120 &&
          (
            await Promise.all(
              frames.map(async (frame) => {
                const referencePng = resolve(
                  directory,
                  "reference-frames",
                  `frame_${String(frame.frame).padStart(6, "0")}.png`,
                );
                const portPng = resolve(
                  directory,
                  "hyperframes-frames",
                  `frame_${String(frame.frame + 1).padStart(6, "0")}.png`,
                );
                return (
                  (await fileHash(referencePng).catch(() => null)) ===
                    frame.referencePngSha256 &&
                  (await fileHash(portPng).catch(() => null)) ===
                    frame.hyperframesPngSha256
                );
              }),
            )
          ).every(Boolean);
        if (capturesIntact) {
          console.log(`Reusing ${slug}/${theme}`);
          continue;
        }
      }
    }
    console.log(
      `[${index + 1}/${plan.length}] ${prepare ? "Preparing" : "Verifying"} ${slug}/${theme}`,
    );
    await mkdir(directory, { recursive: true });
    if (!prepare) {
      await rm(proof, { recursive: true, force: true });
      await mkdir(proof, { recursive: true });
    }
    const evidence = {
      ...entry,
      status: prepare ? "prepared" : "failed",
      installedThroughCli: true,
    };
    try {
      await rm(project, { recursive: true, force: true });
      await mkdir(project, { recursive: true });
      await save(resolve(project, "hyperframes.json"), {
        paths: {
          blocks: "compositions",
          components: "compositions/components",
          assets: "assets",
        },
      });
      const settings = Object.entries(entry.values).flatMap(([key, value]) => [
        "--set",
        `${key}=${value}`,
      ]);
      const install = await run(
        process.execPath,
        [
          resolve(root, "cli/bin/hyfrme.mjs"),
          "add",
          slug,
          "--dir",
          project,
          ...settings,
        ],
        {
          env: { HYFRME_REGISTRY_URL: registryUrl },
          log: resolve(directory, "install.log"),
        },
      );
      await writeFile(resolve(directory, "install.log"), install);
      const composition = entry.manifest.files.find(
        (file) => file.type === "hyperframes:composition",
      );
      const gsap = entry.manifest.files.find(
        (file) => file.path === "t3-code-gsap.min.js",
      );
      if (!gsap) throw new Error(`${slug}: bundled GSAP is missing`);
      await writeFile(
        resolve(project, "index.html"),
        `<!doctype html><html lang="en"><head><meta charset="UTF-8"><script src="${gsap.target}"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:${theme === "light" ? "#fff" : "#0a0a0a"}}#root,#scene{position:absolute;inset:0}</style></head><body><div id="root" data-composition-id="verify-${slug}-${theme}" data-no-timeline data-start="0" data-duration="4" data-width="1200" data-height="659" data-fps="30"><div id="scene" class="clip" data-composition-id="${slug}" data-composition-src="${composition.target}" data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div></body></html>\n`,
      );
      const compiled = await bundleWithLocalizedFonts(project);
      await writeFile(resolve(directory, "compiled.html"), compiled);
      evidence.compiledSha256 = hash(compiled);
      evidence.installedFileHashes = {};
      for (const target of [
        "index.html",
        "hyperframes.json",
        ...entry.manifest.files.map((file) => file.target),
      ]) {
        const path = resolve(project, target);
        evidence.installedFileHashes[relative(root, path)] =
          await fileHash(path);
      }
      await save(resolve(directory, "inputs.json"), evidence);
      if (prepare) continue;
      await mkdir(proof, { recursive: true });
      await writeFile(resolve(proof, "install.log"), install);
      const output = await run(
        process.execPath,
        [hyperframesCli, "check", "--json", "--browser-gpu"],
        { cwd: project, log: resolve(proof, "hyperframes-check.log") },
      );
      const start = output.indexOf("{");
      if (start === -1) throw new Error("HyperFrames check did not emit JSON");
      evidence.check = JSON.parse(output.slice(start));
      await save(resolve(proof, "hyperframes-check.json"), evidence.check);
      if (!evidence.check.ok) throw new Error("Full HyperFrames check failed");
      const referenceFrames = resolve(directory, "reference-frames");
      const portFrames = resolve(directory, "hyperframes-frames");
      await rm(referenceFrames, { recursive: true, force: true });
      await rm(portFrames, { recursive: true, force: true });
      await mkdir(referenceFrames, { recursive: true });
      await run(
        "ffmpeg",
        [
          "-hide_banner",
          "-loglevel",
          "error",
          "-y",
          "-i",
          resolve(root, entry.reference),
          "-fps_mode",
          "passthrough",
          "-start_number",
          "0",
          resolve(referenceFrames, "frame_%06d.png"),
        ],
        { log: resolve(proof, "reference-decode.log") },
      );
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
          portFrames,
          "--strict",
          "--workers",
          "1",
          "--browser-gpu",
        ],
        { cwd: project, log: resolve(proof, "hyperframes-render.log") },
      );
      await assertFrames(
        referenceFrames,
        0,
        (frame) => `frame_${String(frame).padStart(6, "0")}.png`,
      );
      await assertFrames(
        portFrames,
        1,
        (frame) => `frame_${String(frame).padStart(6, "0")}.png`,
      );
      const referenceHashes = await rgbaHashes(
        referenceFrames,
        "frame_%06d.png",
        0,
        resolve(proof, "reference-rgba.sha256"),
      );
      const portHashes = await rgbaHashes(
        portFrames,
        "frame_%06d.png",
        1,
        resolve(proof, "hyperframes-rgba.sha256"),
      );
      const frames = await Promise.all(
        referenceHashes.map(async (referenceSha256, frame) => ({
          frame,
          referenceSha256,
          hyperframesSha256: portHashes[frame],
          referencePngSha256: await fileHash(
            resolve(
              referenceFrames,
              `frame_${String(frame).padStart(6, "0")}.png`,
            ),
          ),
          hyperframesPngSha256: await fileHash(
            resolve(
              portFrames,
              `frame_${String(frame + 1).padStart(6, "0")}.png`,
            ),
          ),
          exact: referenceSha256 === portHashes[frame],
        })),
      );
      await save(resolve(proof, "rgba.json"), frames);
      const stats = resolve(proof, "ssim.txt");
      await run(
        "ffmpeg",
        [
          "-hide_banner",
          "-loglevel",
          "error",
          "-framerate",
          "30",
          "-start_number",
          "0",
          "-i",
          resolve(referenceFrames, "frame_%06d.png"),
          "-framerate",
          "30",
          "-start_number",
          "1",
          "-i",
          resolve(portFrames, "frame_%06d.png"),
          "-filter_complex",
          `[0:v]format=gbrp[a];[1:v]format=gbrp[b];[a][b]ssim=stats_file=${stats}`,
          "-f",
          "null",
          "-",
        ],
        { log: resolve(proof, "ssim.log") },
      );
      const scores = [
        ...(await readFile(stats, "utf8")).matchAll(/^n:\d+ .*?All:([\d.]+)/gm),
      ].map((match) => Number(match[1]));
      if (scores.length !== 120)
        throw new Error("SSIM did not cover every canonical frame");
      const mismatchedFrames = frames
        .filter((frame) => !frame.exact)
        .map((frame) => frame.frame);
      evidence.result = {
        frameCount: 120,
        meanSsim: scores.reduce((sum, score) => sum + score, 0) / 120,
        minSsim: Math.min(...scores),
        worstFrame: scores.indexOf(Math.min(...scores)),
        exactRgba: mismatchedFrames.length === 0,
        mismatchedFrames,
        pass: mismatchedFrames.length === 0 && Math.min(...scores) === 1,
      };
      if (!evidence.result.pass)
        throw new Error(
          `${mismatchedFrames.length}/120 RGBA frames differ; mean/min SSIM ${evidence.result.meanSsim}/${evidence.result.minSsim}`,
        );
      await assertExactFrameHashes(
        resolve(proof, "reference-rgba.sha256"),
        resolve(proof, "hyperframes-rgba.sha256"),
        { width: 1200, height: 659, frameCount: 120 },
      );
      for (const [path, sha256] of Object.entries(evidence.installedFileHashes))
        if ((await fileHash(resolve(root, path))) !== sha256)
          throw new Error("Installed fixture changed during verification");
      await assertVerifiedBlockFiles(
        resolve(registry, "blocks", slug),
        entry.manifest,
        entry.filesSha256,
      );
      for (const asset of entry.immutable)
        if ((await fileHash(resolve(root, asset.paths[0]))) !== asset.sha256)
          throw new Error(
            `Immutable source asset changed during verification: ${asset.label}`,
          );
      if (
        (await fileHash(resolve(root, entry.reference))) !==
        entry.referenceSha256
      )
        throw new Error("Native recording changed during verification");
      evidence.status = "verified";
      evidence.artifacts = {
        installedProject: relative(root, project),
        compiledHtml: relative(root, resolve(directory, "compiled.html")),
        referenceFrames: relative(root, referenceFrames),
        hyperframesFrames: relative(root, portFrames),
        rgba: relative(root, resolve(proof, "rgba.json")),
        ssim: relative(root, stats),
        check: relative(root, resolve(proof, "hyperframes-check.json")),
      };
      console.log(
        `${slug}/${theme}: full check and strict render passed; 120/120 exact RGBA frames, SSIM 1`,
      );
    } catch (error) {
      evidence.status = "failed";
      evidence.error = error.message;
      failures.push(`${slug}/${theme}: ${error.message}`);
      console.error(failures.at(-1));
    }
    if (!prepare) {
      await mkdir(proof, { recursive: true });
      evidence.artifactHashes = {
        ...evidence.installedFileHashes,
        ...(evidence.compiledSha256
          ? {
              [relative(root, resolve(directory, "compiled.html"))]:
                evidence.compiledSha256,
            }
          : {}),
      };
      for (const file of (await readdir(proof))
        .filter((file) => file !== "proof.json")
        .sort()) {
        const path = resolve(proof, file);
        if ((await stat(path)).isFile())
          evidence.artifactHashes[relative(root, path)] = await fileHash(path);
      }
      await save(resolve(proof, "proof.json"), evidence);
    } else await save(resolve(directory, "inputs.json"), evidence);
  }
} finally {
  await new Promise((accept) => server.close(accept));
}
if (failures.length) {
  console.error(`${failures.length}/${plan.length} T3 theme fixtures failed`);
  process.exitCode = 1;
} else
  console.log(
    `${plan.length} active T3 theme fixtures ${prepare ? "prepared without browser capture" : "verified with exact complete RGBA parity"}.`,
  );
