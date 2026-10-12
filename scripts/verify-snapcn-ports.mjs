import { createHash } from "node:crypto";
import { createServer } from "node:http";
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { isDeepStrictEqual } from "node:util";
import {
  compareAlphaFrames,
  compareRgbaFrames,
  normalizeSnapshotFrames,
} from "./snapcn-alpha.mjs";
import { frameRateArgument } from "./frame-rate.mjs";
import { assertExactFrameHashes, hashBlockFiles } from "./parity-evidence.mjs";
import { assertExactCompiledParity } from "./compiled-parity.mjs";
import {
  assertHardwareGpuProbe,
  browserGpuProbeEvidence,
} from "./browser-gpu-evidence.mjs";
const args = process.argv.slice(2);
const profileIndex = args.indexOf("--source-profile");
const profile = profileIndex === -1 ? "snapcn" : args[profileIndex + 1];
if (!["snapcn", "remocn"].includes(profile)) {
  throw new Error(`Unknown lossless source profile: ${profile}`);
}
const {
  renderReferences,
  referenceFingerprint,
  remotionVersion,
  hyperframesVersion,
  referenceGl,
  verificationBrowser,
  root,
  run,
  selectFixtures,
  workbench: referenceWorkbench,
} = await import(
  profile === "remocn"
    ? "./remocn-lossless-reference.mjs"
    : "./generate-snapcn-reference.mjs"
);
const label = profile === "remocn" ? "Remocn" : "Snapcn";
const browserFallback = args.includes("--browser-fallback");
const iconShowcase = args.includes("--icon-showcase");
if (iconShowcase && (profile !== "remocn" || browserFallback)) {
  throw new Error("--icon-showcase requires the canonical Remocn profile");
}
if (browserFallback && profile !== "remocn") {
  throw new Error("--browser-fallback requires the Remocn source profile");
}
const parityRoot = iconShowcase
  ? "parity/remocn-icon-showcases"
  : browserFallback
    ? "parity/remocn-browser-fallback"
    : "parity";
const previewsRoot = browserFallback
  ? `${parityRoot}/previews`
  : "public/previews";
const workbench = resolve(
  root,
  iconShowcase
    ? ".work/verify-remocn-icon-showcases"
    : browserFallback
      ? ".work/verify-remocn-browser-fallback"
      : profile === "remocn"
        ? ".work/verify-remocn-lossless"
        : ".work/verify-snapcn",
);
const fixtures = await selectFixtures(args);
const resume = args.includes("--resume");
const reuseReference = resume || args.includes("--reuse-reference");
const threshold = 1;
const browserGpu = !args.includes("--no-browser-gpu");
const sourceCheckExceptions = await readFile(
  resolve(root, `catalog/${profile}-check-exceptions.json`),
  "utf8",
)
  .then(JSON.parse)
  .catch((error) => {
    if (profile === "remocn" && error.code === "ENOENT") return [];
    throw error;
  });
await mkdir(workbench, { recursive: true });
if (browserFallback || iconShowcase)
  await mkdir(resolve(root, parityRoot), { recursive: true });

async function fingerprint(entry) {
  const hash = createHash("sha256")
    .update(await referenceFingerprint(entry))
    .update(hyperframesVersion)
    .update(JSON.stringify({ browserGpu }))
    .update(await readFile(import.meta.filename))
    .update(await readFile(resolve(root, "scripts/snapcn-alpha.mjs")))
    .update(await readFile(resolve(root, "scripts/parity-evidence.mjs")))
    .update(await readFile(resolve(root, "scripts/compiled-parity.mjs")))
    .update(await readFile(resolve(root, "scripts/browser-gpu-evidence.mjs")))
    .update(await readFile(resolve(root, "cli/bin/hyfrme.mjs")))
    .update(
      JSON.stringify(
        sourceCheckExceptions.filter(
          (exception) => exception.slug === entry.slug,
        ),
      ),
    );
  const block = resolve(root, "registry/blocks", entry.slug);
  const manifest = JSON.parse(
    await readFile(resolve(block, "registry-item.json"), "utf8"),
  );
  hash.update(JSON.stringify(manifest));
  for (const file of manifest.files)
    hash.update(await readFile(resolve(block, file.path)));
  return hash.digest("hex");
}

const selected = [];
async function hashArtifacts(artifacts, canonicalIcon) {
  const deferred = canonicalIcon
    ? new Set(["referenceVideo", "hyperframesVideo", "thumbnail"])
    : new Set();
  return Object.fromEntries(
    await Promise.all(
      Object.entries(artifacts)
        .filter(([key]) => !deferred.has(key))
        .map(async ([, path]) => [
          path,
          createHash("sha256")
            .update(await readFile(resolve(root, path)))
            .digest("hex"),
        ]),
    ),
  );
}
for (const entry of fixtures) {
  if (resume) {
    const parity = await readFile(
      resolve(root, parityRoot, `${entry.slug}.json`),
      "utf8",
    )
      .then(JSON.parse)
      .catch(() => null);
    const canonicalIcon =
      profile === "remocn" &&
      !iconShowcase &&
      entry.origin.source.startsWith("registry/remocn-icons/");
    const artifactsIntact =
      parity?.artifactHashes &&
      isDeepStrictEqual(
        await hashArtifacts(parity.artifacts, canonicalIcon).catch(() => null),
        parity.artifactHashes,
      );
    let exactEvidence = false;
    try {
      assertExactCompiledParity(parity, entry.fixture);
      await assertExactFrameHashes(
        resolve(root, parity.artifacts.referenceRgba),
        resolve(root, parity.artifacts.hyperframesRgba),
        {
          width: entry.fixture.width,
          height: entry.fixture.height,
          frameCount: entry.fixture.durationInFrames,
        },
      );
      exactEvidence = true;
    } catch (error) {
      if (parity) console.log(`Rechecking ${entry.slug}: ${error.message}`);
    }
    if (
      parity?.status === "verified" &&
      exactEvidence &&
      artifactsIntact &&
      parity.fingerprint === (await fingerprint(entry))
    ) {
      console.log(`Reusing verified ${entry.slug}`);
      continue;
    }
  }
  selected.push(entry);
}
if (!selected.length) {
  console.log(
    `All ${fixtures.length} selected ${label} ports already verified at current fingerprints.`,
  );
  process.exit(0);
}
const registry = resolve(root, "registry");
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", "http://localhost");
    const path = resolve(registry, `.${decodeURIComponent(url.pathname)}`);
    if (!path.startsWith(`${registry}${sep}`)) throw new Error("Unsafe path");
    const contentTypes = {
      ".json": "application/json",
      ".html": "text/html",
      ".js": "text/javascript",
      ".woff2": "font/woff2",
      ".css": "text/css",
    };
    const body = await readFile(path);
    response.writeHead(200, {
      "content-type": contentTypes[extname(path)] ?? "application/octet-stream",
    });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});
await new Promise((accept) => server.listen(0, "127.0.0.1", accept));
const registryUrl = `http://127.0.0.1:${server.address().port}`;
const failures = [];
const browser = await verificationBrowser();

async function pngs(directory, expected) {
  const names = (await readdir(directory))
    .filter((name) => name.endsWith(".png"))
    .sort();
  if (names.length !== expected)
    throw new Error(
      `${directory}: expected ${expected} PNG frames, found ${names.length}`,
    );
  return names;
}

async function encode(directory, output, fixture) {
  await run("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-framerate",
    frameRateArgument(fixture.fps),
    "-pattern_type",
    "glob",
    "-i",
    resolve(directory, "*.png"),
    "-vf",
    "format=yuv420p",
    "-c:v",
    "libx264",
    "-crf",
    "16",
    "-colorspace",
    "bt709",
    "-color_primaries",
    "bt709",
    "-color_trc",
    "bt709",
    "-movflags",
    "+faststart",
    output,
  ]);
  const { output: result } = await run("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-count_frames",
    "-show_entries",
    "stream=width,height,avg_frame_rate,nb_read_frames",
    "-of",
    "json",
    output,
  ]);
  const stream = JSON.parse(result).streams?.[0];
  const [numerator, denominator] =
    stream?.avg_frame_rate.split("/").map(Number) ?? [];
  if (
    stream?.width !== fixture.width ||
    stream?.height !== fixture.height ||
    numerator / denominator !== fixture.fps ||
    Number(stream?.nb_read_frames) !== fixture.durationInFrames
  )
    throw new Error(
      `${output}: encoded dimensions, frame count, or fps differ from fixture`,
    );
}

try {
  for (const [index, entry] of selected.entries()) {
    const directory = resolve(workbench, entry.slug);
    const project = resolve(directory, "installed");
    const diff = resolve(directory, "diff");
    const referenceFrames = resolve(
      referenceWorkbench,
      "renders",
      entry.slug,
      "reference-frames",
    );
    const portFrames = resolve(directory, "hyperframes-frames");
    const { fixture, slug } = entry;
    const canonicalIcon =
      profile === "remocn" &&
      entry.origin.source.startsWith("registry/remocn-icons/") &&
      !iconShowcase;
    const previousParity = canonicalIcon
      ? JSON.parse(
          await readFile(resolve(root, "parity", `${slug}.json`), "utf8"),
        )
      : null;
    const browserGpuProbes = {};
    console.log(
      `[${index + 1}/${selected.length}] ${slug}: install, full check, strict PNG render`,
    );
    try {
      const inputFingerprint = await fingerprint(entry);
      await renderReferences([entry], { reuse: reuseReference });
      await rm(project, { recursive: true, force: true });
      await rm(portFrames, { recursive: true, force: true });
      await mkdir(project, { recursive: true });
      await mkdir(diff, { recursive: true });
      await writeFile(
        resolve(project, "hyperframes.json"),
        `${JSON.stringify({ $schema: "https://hyperframes.heygen.com/schema/hyperframes.json", paths: { blocks: "compositions", components: "compositions/components", assets: "assets" } }, null, 2)}\n`,
      );
      await writeFile(
        resolve(project, "package.json"),
        `${JSON.stringify({ private: true, type: "module", scripts: { check: `npx --yes hyperframes@${hyperframesVersion} check`, render: `npx --yes hyperframes@${hyperframesVersion} render` } }, null, 2)}\n`,
      );
      await writeFile(
        resolve(project, "meta.json"),
        `${JSON.stringify({ id: `verify-${slug}`, name: `Verify ${entry.title}` })}\n`,
      );
      const install = await run(
        process.execPath,
        [resolve(root, "cli/bin/hyfrme.mjs"), "add", slug, "--dir", project],
        { env: { HYFRME_REGISTRY_URL: registryUrl } },
      );
      await writeFile(resolve(directory, "install.log"), install.output);
      if (iconShowcase) {
        // The source and port use native 384px geometry, not a scaled 48px canvas.
        const path = resolve(project, "compositions", `${slug}.html`);
        const source = await readFile(path, "utf8");
        const variables = source.match(/data-composition-variables='([^']+)'/);
        if (!variables)
          throw new Error(`${slug}: missing installed icon variables`);
        const schema = JSON.parse(variables[1]);
        const size = schema.find((variable) => variable.id === "size");
        if (!size) throw new Error(`${slug}: missing installed size control`);
        // The showcase is a render fixture beyond the source customizer's 200px limit.
        size.default = fixture.props.size;
        size.max = Math.max(size.max ?? fixture.props.size, fixture.props.size);
        await writeFile(
          path,
          source
            .replace(
              variables[0],
              `data-composition-variables='${JSON.stringify(schema)}'`,
            )
            .replaceAll(
              "width: 48px; height: 48px",
              "width: 384px; height: 384px",
            )
            .replaceAll(
              'data-width="48" data-height="48"',
              'data-width="384" data-height="384"',
            ),
        );
      }
      const duration = fixture.durationInFrames / fixture.fps;
      await writeFile(
        resolve(project, "index.html"),
        `<!doctype html><html lang="en"><head><meta charset="UTF-8"><script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script><style>html,body{margin:0;width:${fixture.width}px;height:${fixture.height}px;overflow:hidden}${profile === "snapcn" ? "html,body,#root{overflow:visible!important}" : ""}#root,#scene{position:absolute;inset:0}</style></head><body><div id="root" data-composition-id="verify-${slug}" data-no-timeline data-start="0" data-duration="${duration}" data-width="${fixture.width}" data-height="${fixture.height}" data-fps="${frameRateArgument(fixture.fps)}"><div id="scene" class="clip" data-composition-id="${slug}" data-composition-src="compositions/${slug}.html" data-start="0" data-duration="${duration}" data-track-index="1" data-width="${fixture.width}" data-height="${fixture.height}"></div></div></body></html>\n`,
      );
      const check = await run(
        "npx",
        ["--yes", `hyperframes@${hyperframesVersion}`, "check", "--json"],
        {
          cwd: project,
          allowFailure: true,
          env: { HYPERFRAMES_BROWSER_PATH: browser.path },
        },
      );
      await writeFile(
        resolve(diff, "hyperframes-check.log"),
        check.output.replaceAll(root, "<project>"),
      );
      const checkStart = check.output.indexOf("{");
      if (checkStart === -1)
        throw new Error(`HyperFrames check returned no JSON: ${check.output}`);
      const checkResult = JSON.parse(check.output.slice(checkStart));
      if (!checkResult.lint?.ok || !checkResult.runtime?.ok)
        throw new Error(
          `HyperFrames lint/runtime failed; see ${resolve(diff, "hyperframes-check.log")}`,
        );
      const render = await run(
        "npx",
        [
          "--yes",
          `hyperframes@${hyperframesVersion}`,
          "render",
          "--format",
          "png-sequence",
          "--quality",
          "high",
          "--video-frame-format",
          "png",
          "--output",
          portFrames,
          "--strict-all",
          "--workers",
          "1",
          browserGpu ? "--browser-gpu" : "--no-browser-gpu",
        ],
        { cwd: project, env: { HYPERFRAMES_BROWSER_PATH: browser.path } },
      );
      const renderLog = render.output.replaceAll(root, "<project>");
      await writeFile(resolve(diff, "hyperframes-render.log"), renderLog);
      browserGpuProbes.render = browserGpuProbeEvidence(renderLog);
      if (browserGpu)
        assertHardwareGpuProbe(browserGpuProbes.render, `${slug} strict render`);
      if (profile === "snapcn") {
        const snapshots = resolve(directory, "snapshots");
        await rm(snapshots, { recursive: true, force: true });
        const capture = await run(
          "npx",
          [
            "--yes",
            `hyperframes@${hyperframesVersion}`,
            "snapshot",
            "--at",
            Array.from(
              { length: fixture.durationInFrames },
              (_, frame) => frame / fixture.fps,
            ).join(","),
            "--no-end",
            "--describe=false",
            browserGpu ? "--browser-gpu" : "--no-browser-gpu",
            "--zoom",
            `0,0,${fixture.width},${fixture.height}`,
            "--zoom-scale",
            "1",
            "--output",
            snapshots,
          ],
          { cwd: project, env: { HYPERFRAMES_BROWSER_PATH: browser.path } },
        );
        const snapshotLog = capture.output.replaceAll(root, "<project>");
        await writeFile(resolve(diff, "hyperframes-snapshot.log"), snapshotLog);
        browserGpuProbes.snapshot = browserGpuProbeEvidence(snapshotLog);
        if (browserGpu)
          assertHardwareGpuProbe(browserGpuProbes.snapshot, `${slug} snapshot`);
        await normalizeSnapshotFrames(snapshots, fixture.durationInFrames);
        await rm(portFrames, { recursive: true, force: true });
        await rename(snapshots, portFrames);
      }
      const [referenceNames, portNames] = await Promise.all([
        pngs(referenceFrames, fixture.durationInFrames),
        pngs(portFrames, fixture.durationInFrames),
      ]);
      await run(
        "ffmpeg",
        [
          "-hide_banner",
          "-nostats",
          "-loglevel",
          "error",
          "-framerate",
          frameRateArgument(fixture.fps),
          "-pattern_type",
          "glob",
          "-i",
          resolve(referenceFrames, "*.png"),
          "-framerate",
          frameRateArgument(fixture.fps),
          "-pattern_type",
          "glob",
          "-i",
          resolve(portFrames, "*.png"),
          "-lavfi",
          "[0:v]format=gbrp[a];[1:v]format=gbrp[b];[a][b]ssim=stats_file=ssim.log",
          "-f",
          "null",
          "-",
        ],
        { cwd: diff },
      );
      const samples = [
        ...(await readFile(resolve(diff, "ssim.log"), "utf8")).matchAll(
          /All:([\d.]+)/g,
        ),
      ].map((match) => Number(match[1]));
      if (samples.length !== fixture.durationInFrames)
        throw new Error(
          `SSIM sampled ${samples.length}/${fixture.durationInFrames} frames`,
        );
      const sorted = [...samples].sort((a, b) => a - b);
      const alpha = await compareAlphaFrames(
        referenceFrames,
        portFrames,
        samples.length,
        diff,
      );
      const rgba = await compareRgbaFrames(
        referenceFrames,
        portFrames,
        samples.length,
        diff,
      );
      const mean =
        samples.reduce((sum, value) => sum + value, 0) / samples.length;
      const summary = {
        frame_count: samples.length,
        mean,
        min: sorted[0],
        max: sorted.at(-1),
        p05: sorted[Math.floor(samples.length * 0.05)],
        p95: sorted[
          Math.min(samples.length - 1, Math.floor(samples.length * 0.95))
        ],
        threshold,
        alpha,
        rgba,
        pass:
          mean >= threshold &&
          sorted[0] >= threshold &&
          alpha.pass &&
          rgba.pass,
      };
      await writeFile(
        resolve(diff, "summary.json"),
        `${JSON.stringify(summary, null, 2)}\n`,
      );
      await encode(
        referenceFrames,
        resolve(directory, "reference.mp4"),
        fixture,
      );
      await encode(portFrames, resolve(directory, "hyperframes.mp4"), fixture);
      const heroFrame = Math.min(
        fixture.durationInFrames - 1,
        Math.floor(fixture.durationInFrames * 0.6),
      );
      await copyFile(
        resolve(portFrames, portNames[heroFrame]),
        resolve(directory, "thumbnail.png"),
      );
      const worstFrame = samples.indexOf(summary.min);
      await run("ffmpeg", [
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        resolve(referenceFrames, referenceNames[worstFrame]),
        "-i",
        resolve(portFrames, portNames[worstFrame]),
        "-filter_complex",
        "[0:v][1:v]hstack=inputs=2[v]",
        "-map",
        "[v]",
        "-frames:v",
        "1",
        resolve(diff, "worst-frame.png"),
      ]);
      if (inputFingerprint !== (await fingerprint(entry))) {
        throw new Error(
          `${slug}: verification inputs changed during rendering`,
        );
      }
      const parityDiff = resolve(root, parityRoot, `${slug}-diff`);
      const videoRoot = canonicalIcon
        ? `${parityRoot}/${slug}-diff`
        : `${previewsRoot}/${slug}`;
      const previews = resolve(root, videoRoot);
      await mkdir(parityDiff, { recursive: true });
      await mkdir(previews, { recursive: true });
      for (const name of [
        "summary.json",
        "ssim.log",
        "hyperframes-check.log",
        "hyperframes-render.log",
        "worst-frame.png",
        "reference-alpha.framemd5",
        "hyperframes-alpha.framemd5",
        "reference-rgba.framemd5",
        "hyperframes-rgba.framemd5",
      ])
        await copyFile(resolve(diff, name), resolve(parityDiff, name));
      for (const name of ["reference.mp4", "hyperframes.mp4", "thumbnail.png"])
        await copyFile(resolve(directory, name), resolve(previews, name));
      if (profile === "snapcn") {
        await copyFile(
          resolve(diff, "hyperframes-snapshot.log"),
          resolve(parityDiff, "hyperframes-snapshot.log"),
        );
      }
      const checkErrors = Object.values(checkResult)
        .flatMap((section) => section?.findings ?? [])
        .filter((finding) => finding.severity === "error");
      const inheritedFindings = sourceCheckExceptions.filter(
        (exception) =>
          exception.slug === slug &&
          exception.origin.commit === entry.origin.commit &&
          exception.origin.source === entry.origin.source,
      );
      const unreviewedErrors = checkErrors.filter(
        (finding) =>
          !inheritedFindings.some((exception) =>
            Object.entries(exception.finding).every(
              ([key, value]) => finding[key] === value,
            ),
          ),
      );
      const sourceChecksOnly =
        checkErrors.length > 0 && unreviewedErrors.length === 0;
      const pass = summary.pass && (check.code === 0 || sourceChecksOnly);
      const parity = {
        slug,
        origin: entry.origin,
        fixture,
        filesSha256: await hashBlockFiles(
          resolve(root, "registry/blocks", slug),
          JSON.parse(
            await readFile(
              resolve(root, "registry/blocks", slug, "registry-item.json"),
              "utf8",
            ),
          ),
        ),
        classification: "compiled-source-port",
        measurement: "lossless-png",
        status: pass ? "verified" : "failed",
        fingerprint: inputFingerprint,
        ...(previousParity?.showcase
          ? { showcase: previousParity.showcase }
          : {}),
        thresholds: {
          meanSsim: threshold,
          minSsim: threshold,
          exactRgba: true,
        },
        result: {
          frameCount: samples.length,
          meanSsim: mean,
          minSsim: summary.min,
          p05Ssim: summary.p05,
          p95Ssim: summary.p95,
          alpha,
          rgba,
          pass,
        },
        checks: {
          ...(profile === "remocn"
            ? {
                canvasMode: browserFallback
                  ? "browser-fallback"
                  : "source-capability",
              }
            : {}),
          hyperframes:
            check.code === 0
              ? "full check passed; strict render passed"
              : `full check reported ${checkErrors.length} ${sourceChecksOnly ? "reviewed source-inherited" : "unreviewed"} errors (exit ${check.code}); strict render passed`,
          ...(sourceChecksOnly
            ? { sourceInheritedFindings: inheritedFindings }
            : {}),
          hyperframesVersion,
          remotionVersion,
          browserVersion: browser.version,
          browserGpuRequestedMode: browserGpu ? "hardware" : "software",
          browserGpuProbes,
          captureBackend: "unobserved",
          rasterization: browser.rasterization,
          frameCapture:
            profile === "snapcn"
              ? "full-canvas screenshot"
              : "strict PNG render",
          referenceGl,
          installedThroughCli: true,
        },
        artifacts: {
          referenceVideo: canonicalIcon
            ? (previousParity?.artifacts?.referenceVideo ??
              previousParity?.artifacts?.remocnVideo ??
              `${previewsRoot}/${slug}/remocn.mp4`)
            : `${videoRoot}/reference.mp4`,
          hyperframesVideo: canonicalIcon
            ? (previousParity?.artifacts?.hyperframesVideo ??
              `${previewsRoot}/${slug}/hyperframes.mp4`)
            : `${videoRoot}/hyperframes.mp4`,
          thumbnail: canonicalIcon
            ? `${previewsRoot}/${slug}/thumbnail.png`
            : `${videoRoot}/thumbnail.png`,
          ...(canonicalIcon
            ? {
                canonicalReferenceVideo: `${videoRoot}/reference.mp4`,
                canonicalHyperframesVideo: `${videoRoot}/hyperframes.mp4`,
              }
            : {}),
          summary: `${parityRoot}/${slug}-diff/summary.json`,
          perFrameSsim: `${parityRoot}/${slug}-diff/ssim.log`,
          hyperframesCheck: `${parityRoot}/${slug}-diff/hyperframes-check.log`,
          hyperframesRender: `${parityRoot}/${slug}-diff/hyperframes-render.log`,
          ...(profile === "snapcn"
            ? {
                hyperframesSnapshot: `${parityRoot}/${slug}-diff/hyperframes-snapshot.log`,
              }
            : {}),
          worstFrame: `${parityRoot}/${slug}-diff/worst-frame.png`,
          referenceAlpha: `${parityRoot}/${slug}-diff/reference-alpha.framemd5`,
          hyperframesAlpha: `${parityRoot}/${slug}-diff/hyperframes-alpha.framemd5`,
          referenceRgba: `${parityRoot}/${slug}-diff/reference-rgba.framemd5`,
          hyperframesRgba: `${parityRoot}/${slug}-diff/hyperframes-rgba.framemd5`,
        },
      };
      if (inputFingerprint !== (await fingerprint(entry))) {
        throw new Error(
          `${slug}: verification inputs changed before saving parity`,
        );
      }
      parity.artifactHashes = await hashArtifacts(
        parity.artifacts,
        canonicalIcon,
      );
      await writeFile(
        resolve(root, parityRoot, `${slug}.json`),
        `${JSON.stringify(parity, null, 2)}\n`,
      );
      if (iconShowcase) {
        const path = resolve(root, "parity", `${slug}.json`);
        const canonical = JSON.parse(await readFile(path, "utf8"));
        canonical.showcase = {
          fixture: { ...fixture, scale: 8, renderScale: 1 },
          measurement: parity.measurement,
          fingerprint: inputFingerprint,
          result: parity.result,
          checks: parity.checks,
          artifacts: parity.artifacts,
          artifactHashes: parity.artifactHashes,
        };
        for (const key of ["referenceVideo", "hyperframesVideo", "thumbnail"]) {
          canonical.artifacts[key] = parity.artifacts[key];
        }
        await writeFile(path, `${JSON.stringify(canonical, null, 2)}\n`);
      }
      console.log(
        `${slug}: ${pass ? "PASS" : "FAIL"} mean=${mean.toFixed(6)}, min=${summary.min.toFixed(6)}, full-check=${check.code}`,
      );
      if (!pass)
        failures.push({
          slug,
          mean,
          min: summary.min,
          fullCheckExit: check.code,
        });
    } catch (error) {
      await mkdir(directory, { recursive: true });
      await writeFile(resolve(directory, "failure.log"), `${error.stack}\n`);
      await writeFile(
        resolve(root, parityRoot, `${slug}.json`),
        `${JSON.stringify({ slug, origin: entry.origin, fixture, classification: "compiled-source-port", measurement: "lossless-png", status: "failed", result: { pass: false }, checks: { hyperframesVersion, remotionVersion, browserGpuRequestedMode: browserGpu ? "hardware" : "software", browserGpuProbes, captureBackend: "unobserved" }, error: error.message.replaceAll(root, "<project>") }, null, 2)}\n`,
      );
      failures.push({ slug, error: error.message });
      console.error(`${slug}: ${error.message}`);
    }
  }
} finally {
  await new Promise((accept) => server.close(accept));
}
if (failures.length) {
  console.error(JSON.stringify({ failures }, null, 2));
  process.exitCode = 1;
} else
  console.log(
    `Verified ${selected.length} ${label} ports against every upstream frame.`,
  );
