import { createHash } from "node:crypto";
import { createServer } from "node:http";
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { compareAlphaFrames } from "./snapcn-alpha.mjs";
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
const workbench = resolve(
  root,
  profile === "remocn" ? ".work/verify-remocn-lossless" : ".work/verify-snapcn",
);
const fixtures = await selectFixtures(args);
const resume = args.includes("--resume");
const reuseReference = resume || args.includes("--reuse-reference");
const threshold = 0.99;
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

async function fingerprint(entry) {
  const hash = createHash("sha256")
    .update(await referenceFingerprint(entry))
    .update(hyperframesVersion)
    .update(JSON.stringify({ browserGpu }))
    .update(await readFile(import.meta.filename))
    .update(await readFile(resolve(root, "scripts/snapcn-alpha.mjs")))
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
for (const entry of fixtures) {
  if (resume) {
    const parity = await readFile(
      resolve(root, "parity", `${entry.slug}.json`),
      "utf8",
    )
      .then(JSON.parse)
      .catch(() => null);
    const artifactsExist =
      parity?.artifacts &&
      (
        await Promise.all(
          Object.values(parity.artifacts).map((path) =>
            stat(resolve(root, path))
              .then((s) => s.size > 0)
              .catch(() => false),
          ),
        )
      ).every(Boolean);
    if (
      parity?.status === "verified" &&
      artifactsExist &&
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
    String(fixture.fps),
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
      const duration = fixture.durationInFrames / fixture.fps;
      await writeFile(
        resolve(project, "index.html"),
        `<!doctype html><html lang="en"><head><meta charset="UTF-8"><script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script><style>html,body{margin:0;width:${fixture.width}px;height:${fixture.height}px;overflow:hidden}#root,#scene{position:absolute;inset:0}</style></head><body><div id="root" data-composition-id="verify-${slug}" data-no-timeline data-start="0" data-duration="${duration}" data-width="${fixture.width}" data-height="${fixture.height}" data-fps="${fixture.fps}"><div id="scene" class="clip" data-composition-id="${slug}" data-composition-src="compositions/${slug}.html" data-start="0" data-duration="${duration}" data-track-index="1" data-width="${fixture.width}" data-height="${fixture.height}"></div></div></body></html>\n`,
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
      await writeFile(
        resolve(diff, "hyperframes-render.log"),
        render.output.replaceAll(root, "<project>"),
      );
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
          String(fixture.fps),
          "-pattern_type",
          "glob",
          "-i",
          resolve(referenceFrames, "*.png"),
          "-framerate",
          String(fixture.fps),
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
        pass: mean >= threshold && sorted[0] >= 0.95 && alpha.pass,
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
      const parityDiff = resolve(root, "parity", `${slug}-diff`);
      const previews = resolve(root, "public/previews", slug);
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
      ])
        await copyFile(resolve(diff, name), resolve(parityDiff, name));
      for (const name of ["reference.mp4", "hyperframes.mp4", "thumbnail.png"])
        await copyFile(resolve(directory, name), resolve(previews, name));
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
        classification: "compiled-source-port",
        measurement: "lossless-png",
        status: pass ? "verified" : "failed",
        fingerprint: inputFingerprint,
        thresholds: { meanSsim: threshold, minSsim: 0.95 },
        result: {
          frameCount: samples.length,
          meanSsim: mean,
          minSsim: summary.min,
          p05Ssim: summary.p05,
          p95Ssim: summary.p95,
          alpha,
          pass,
        },
        checks: {
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
          browserGpuMode: browserGpu ? "hardware" : "software",
          installedThroughCli: true,
        },
        artifacts: {
          referenceVideo: `public/previews/${slug}/reference.mp4`,
          hyperframesVideo: `public/previews/${slug}/hyperframes.mp4`,
          thumbnail: `public/previews/${slug}/thumbnail.png`,
          summary: `parity/${slug}-diff/summary.json`,
          perFrameSsim: `parity/${slug}-diff/ssim.log`,
          hyperframesCheck: `parity/${slug}-diff/hyperframes-check.log`,
          worstFrame: `parity/${slug}-diff/worst-frame.png`,
          referenceAlpha: `parity/${slug}-diff/reference-alpha.framemd5`,
          hyperframesAlpha: `parity/${slug}-diff/hyperframes-alpha.framemd5`,
        },
      };
      if (inputFingerprint !== (await fingerprint(entry))) {
        throw new Error(
          `${slug}: verification inputs changed before saving parity`,
        );
      }
      await writeFile(
        resolve(root, "parity", `${slug}.json`),
        `${JSON.stringify(parity, null, 2)}\n`,
      );
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
        resolve(root, "parity", `${slug}.json`),
        `${JSON.stringify({ slug, origin: entry.origin, fixture, classification: "compiled-source-port", measurement: "lossless-png", status: "failed", result: { pass: false }, checks: { hyperframesVersion, remotionVersion }, error: error.message.replaceAll(root, "<project>") }, null, 2)}\n`,
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
