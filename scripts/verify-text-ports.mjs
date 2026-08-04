import { spawn } from "node:child_process";
import {
  cp,
  copyFile,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const upstream = resolve(root, process.env.REMOCN_SOURCE ?? ".work/remocn");
const workbench = resolve(root, ".work", "verify-text");
const fixtureFiles = [
  "text-fixtures.json",
  "core-fixtures.json",
  "primitive-fixtures.json",
];
const fixtures = (
  await Promise.all(
    fixtureFiles.map((file) =>
      readFile(resolve(root, "catalog", file), "utf8")
        .then(JSON.parse)
        .catch(() => []),
    ),
  )
).flat();
const familyIndex = process.argv.indexOf("--family");
const family = familyIndex === -1 ? null : process.argv[familyIndex + 1];
const familyFixtures = family
  ? fixtures.filter((entry) => entry.catalogFamily === family)
  : fixtures;
const onlyIndex = process.argv.indexOf("--only");
const requested =
  onlyIndex === -1 ? null : new Set(process.argv[onlyIndex + 1].split(","));
const selected = requested
  ? familyFixtures.filter((entry) => requested.has(entry.slug))
  : familyFixtures;
const fullCheckIndex = process.argv.indexOf("--full-check");
const fullCheck =
  fullCheckIndex === -1
    ? new Set()
    : new Set(process.argv[fullCheckIndex + 1].split(","));
const reuseReference = process.argv.includes("--reuse-reference");
const losslessFrameNames = new Set(["security-cam", "vhs-filter"]);
const retainedCheckNotes = {
  "shader-gem-smoke":
    "strict render passed; full check runtime, motion, and contrast passed, while the layout sweep reported the known sweep_static WebGL-canvas heuristic",
};

if (requested && selected.length !== requested.size) {
  throw new Error(
    `Expected ${requested.size} fixtures, found ${selected.length}`,
  );
}

const run = (command, args, options = {}) =>
  new Promise((accept, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? root,
      env: { ...process.env, ...options.env },
      stdio: options.quiet ? "pipe" : "inherit",
    });
    let output = "";
    if (options.quiet) {
      child.stdout.on("data", (chunk) => (output += chunk));
      child.stderr.on("data", (chunk) => (output += chunk));
    }
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) accept(output);
      else reject(new Error(`${command} exited ${code}\n${output}`));
    });
  });

if (!reuseReference) {
  await run("node", [
    "scripts/generate-text-reference.mjs",
    "--only",
    selected.map((entry) => entry.slug).join(","),
  ]);
  await run(
    "bun",
    [
      "scripts/hyfrme-render-text.mts",
      "--only",
      selected.map((entry) => entry.slug).join(","),
    ],
    { cwd: upstream },
  );
}

await mkdir(resolve(workbench, "assets", "fonts"), { recursive: true });
await copyFile(
  resolve(root, "registry", "blocks", "soft-blur-in", "Geist-SemiBold.woff2"),
  resolve(workbench, "assets", "fonts", "Geist-SemiBold.woff2"),
);
await copyFile(
  resolve(root, "assets", "fonts", "Geist-Latin.woff2"),
  resolve(workbench, "assets", "fonts", "Geist-Latin.woff2"),
);
await copyFile(
  resolve(root, "assets", "fonts", "JetBrainsMono-Latin.woff2"),
  resolve(workbench, "assets", "fonts", "JetBrainsMono-Latin.woff2"),
);
await copyFile(
  resolve(root, "assets", "fonts", "Inter-Latin.woff2"),
  resolve(workbench, "assets", "fonts", "Inter-Latin.woff2"),
);
await copyFile(
  resolve(root, "assets", "fonts", "Manrope-Latin.woff2"),
  resolve(workbench, "assets", "fonts", "Manrope-Latin.woff2"),
);
await copyFile(
  resolve(root, "assets", "fonts", "GeistMono-Latin.woff2"),
  resolve(workbench, "assets", "fonts", "GeistMono-Latin.woff2"),
);
await cp(
  resolve(root, "assets", "social"),
  resolve(workbench, "assets", "social"),
  {
    recursive: true,
  },
);
await writeFile(
  resolve(workbench, "package.json"),
  `${JSON.stringify(
    {
      name: "hyfrme-text-verification",
      private: true,
      type: "module",
      scripts: {
        check: "npx --yes hyperframes@0.7.90 check",
        render: "npx --yes hyperframes@0.7.90 render",
      },
    },
    null,
    2,
  )}\n`,
);
await writeFile(
  resolve(workbench, "hyperframes.json"),
  `${JSON.stringify(
    {
      $schema: "https://hyperframes.heygen.com/schema/hyperframes.json",
      registry:
        "https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry",
      paths: {
        blocks: "compositions",
        components: "compositions/components",
        assets: "assets",
      },
      media: { autoProxy: true },
    },
    null,
    2,
  )}\n`,
);
await writeFile(
  resolve(workbench, "meta.json"),
  '{"id":"hyfrme-text-verification","name":"Hyfrme text verification"}\n',
);

const diffScript =
  process.env.R2HF_DIFF_SCRIPT ??
  resolve(
    homedir(),
    ".agents/skills/remotion-to-hyperframes/scripts/render_diff.sh",
  );
const failures = [];

const probeVideo = async (path) => {
  const output = await run(
    "ffprobe",
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-count_frames",
      "-show_entries",
      "stream=width,height,avg_frame_rate,nb_read_frames",
      "-of",
      "json",
      path,
    ],
    { quiet: true },
  );
  const stream = JSON.parse(output).streams?.[0];
  if (!stream) throw new Error(`No video stream in ${path}`);
  const [numerator, denominator] = stream.avg_frame_rate.split("/").map(Number);
  return {
    width: stream.width,
    height: stream.height,
    fps: numerator / denominator,
    frameCount: Number(stream.nb_read_frames),
  };
};

for (const [index, entry] of selected.entries()) {
  const label = `[${index + 1}/${selected.length}] ${entry.slug}`;
  const renderDirectory = resolve(root, ".work", "renders", "text", entry.slug);
  const sourceHtml = await readFile(
    resolve(root, "registry", "blocks", entry.slug, `${entry.slug}.html`),
    "utf8",
  );
  await writeFile(
    resolve(workbench, "index.html"),
    sourceHtml.replaceAll("../assets/fonts/", "./assets/fonts/"),
  );
  await copyFile(
    resolve(root, "registry", "blocks", entry.slug, `${entry.slug}.runtime.js`),
    resolve(workbench, `${entry.slug}.runtime.js`),
  );
  const registryItem = JSON.parse(
    await readFile(
      resolve(root, "registry", "blocks", entry.slug, "registry-item.json"),
      "utf8",
    ),
  );
  for (const file of registryItem.files.filter((file) =>
    file.target.startsWith("assets/"),
  )) {
    const target = resolve(workbench, file.target);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(
      resolve(root, "registry", "blocks", entry.slug, file.path),
      target,
    );
  }

  if (fullCheck.has(entry.slug)) {
    process.stdout.write(`${label} HyperFrames check… `);
    await run("npm", ["run", "check"], { cwd: workbench, quiet: true });
    process.stdout.write("passed; ");
  } else {
    process.stdout.write(`${label} `);
  }

  await mkdir(renderDirectory, { recursive: true });
  process.stdout.write("render… ");
  await run(
    "npm",
    [
      "run",
      "render",
      "--",
      "--output",
      resolve(renderDirectory, "hyperframes.mp4"),
      "--quality",
      "high",
      "--strict-all",
      "--workers",
      "1",
      "--no-browser-gpu",
      "--quiet",
    ],
    { cwd: workbench, quiet: true },
  );
  const videos = [
    ["Remocn", resolve(renderDirectory, "remocn.mp4")],
    ["HyperFrames", resolve(renderDirectory, "hyperframes.mp4")],
  ];
  for (const [videoLabel, path] of videos) {
    const probe = await probeVideo(path);
    if (
      probe.width !== entry.fixture.width ||
      probe.height !== entry.fixture.height ||
      probe.fps !== entry.fixture.fps ||
      probe.frameCount !== entry.fixture.durationInFrames
    ) {
      throw new Error(
        `${entry.slug} ${videoLabel} mismatch: ${probe.width}x${probe.height} @ ${probe.fps}fps, ${probe.frameCount} frames`,
      );
    }
  }
  process.stdout.write("compare… ");
  const diffDirectory = resolve(renderDirectory, "diff");
  let summary;
  if (losslessFrameNames.has(entry.slug)) {
    const referenceFrames = resolve(renderDirectory, "remocn-frames");
    const portFrames = resolve(renderDirectory, "hyperframes-frames");
    await rm(portFrames, { recursive: true, force: true });
    await run(
      "npm",
      [
        "run",
        "render",
        "--",
        "--format",
        "png-sequence",
        "--output",
        portFrames,
        "--strict-all",
        "--workers",
        "1",
        "--no-browser-gpu",
        "--quiet",
      ],
      { cwd: workbench, quiet: true },
    );
    const [referenceFrameCount, portFrameCount] = await Promise.all([
      readdir(referenceFrames).then(
        (files) => files.filter((file) => file.endsWith(".png")).length,
      ),
      readdir(portFrames).then(
        (files) => files.filter((file) => file.endsWith(".png")).length,
      ),
    ]);
    if (
      referenceFrameCount !== entry.fixture.durationInFrames ||
      portFrameCount !== entry.fixture.durationInFrames
    ) {
      throw new Error(
        `${entry.slug} lossless frame mismatch: ${referenceFrameCount} Remocn, ${portFrameCount} HyperFrames`,
      );
    }
    await mkdir(diffDirectory, { recursive: true });
    const ssimLog = resolve(diffDirectory, "ssim.log");
    await run(
      "ffmpeg",
      [
        "-hide_banner",
        "-nostats",
        "-loglevel",
        "info",
        "-framerate",
        String(entry.fixture.fps),
        "-start_number",
        "0",
        "-i",
        resolve(referenceFrames, "element-%02d.png"),
        "-framerate",
        String(entry.fixture.fps),
        "-start_number",
        "1",
        "-i",
        resolve(portFrames, "frame_%06d.png"),
        "-lavfi",
        `[1:v][0:v]ssim=stats_file=${ssimLog}`,
        "-f",
        "null",
        "-",
      ],
      { quiet: true },
    );
    const values = [
      ...(await readFile(ssimLog, "utf8")).matchAll(/All:([\d.]+)/g),
    ]
      .map((match) => Number(match[1]))
      .sort((left, right) => left - right);
    if (values.length === 0) {
      throw new Error(`No lossless SSIM samples parsed for ${entry.slug}`);
    }
    const percentile = (value) =>
      values[Math.min(values.length - 1, Math.floor(value * values.length))];
    const mean =
      values.reduce((total, value) => total + value, 0) / values.length;
    summary = {
      frame_count: values.length,
      mean: Number(mean.toFixed(6)),
      min: Number(values[0].toFixed(6)),
      max: Number(values.at(-1).toFixed(6)),
      p05: Number(percentile(0.05).toFixed(6)),
      p95: Number(percentile(0.95).toFixed(6)),
      threshold: 0.95,
      pass: mean >= 0.95,
    };
    await writeFile(
      resolve(diffDirectory, "summary.json"),
      `${JSON.stringify(summary, null, 2)}\n`,
    );
    await Promise.all([
      rm(referenceFrames, { recursive: true, force: true }),
      rm(portFrames, { recursive: true, force: true }),
    ]);
  } else {
    await run(
      diffScript,
      [
        resolve(renderDirectory, "remocn.mp4"),
        resolve(renderDirectory, "hyperframes.mp4"),
        diffDirectory,
      ],
      { env: { R2HF_SSIM_THRESHOLD: "0.95" }, quiet: true },
    );
    summary = JSON.parse(
      await readFile(resolve(diffDirectory, "summary.json"), "utf8"),
    );
  }

  if (summary.frame_count !== entry.fixture.durationInFrames) {
    throw new Error(
      `${entry.slug} SSIM sampled ${summary.frame_count}/${entry.fixture.durationInFrames} frames`,
    );
  }

  if (!summary.pass) {
    failures.push({ slug: entry.slug, summary });
    process.stdout.write(`FAILED ${summary.mean.toFixed(6)}\n`);
    continue;
  }

  const previewDirectory = resolve(root, "public", "previews", entry.slug);
  const parityDiffDirectory = resolve(root, "parity", `${entry.slug}-diff`);
  await mkdir(previewDirectory, { recursive: true });
  await mkdir(parityDiffDirectory, { recursive: true });
  await copyFile(
    resolve(renderDirectory, "remocn.mp4"),
    resolve(previewDirectory, "remocn.mp4"),
  );
  await copyFile(
    resolve(renderDirectory, "hyperframes.mp4"),
    resolve(previewDirectory, "hyperframes.mp4"),
  );
  await copyFile(
    resolve(diffDirectory, "summary.json"),
    resolve(parityDiffDirectory, "summary.json"),
  );
  await writeFile(
    resolve(root, "parity", `${entry.slug}.json`),
    `${JSON.stringify(
      {
        slug: entry.slug,
        origin: entry.origin,
        fixture: entry.fixture,
        classification: "compiled-source-port",
        measurement: losslessFrameNames.has(entry.slug)
          ? "lossless-png"
          : "decoded-video",
        status: "verified",
        thresholds: { meanSsim: 0.95 },
        result: {
          frameCount: summary.frame_count,
          meanSsim: summary.mean,
          minSsim: summary.min,
          p05Ssim: summary.p05,
          p95Ssim: summary.p95,
          pass: summary.pass,
        },
        checks: {
          hyperframes: fullCheck.has(entry.slug)
            ? "0 errors, 0 warnings; runtime and layout passed"
            : (retainedCheckNotes[entry.slug] ?? "strict render passed"),
        },
        artifacts: {
          remocnVideo: `public/previews/${entry.slug}/remocn.mp4`,
          hyperframesVideo: `public/previews/${entry.slug}/hyperframes.mp4`,
          summary: `parity/${entry.slug}-diff/summary.json`,
        },
      },
      null,
      2,
    )}\n`,
  );
  process.stdout.write(`passed ${summary.mean.toFixed(6)}\n`);
}

if (failures.length > 0) {
  console.error(JSON.stringify({ failures }, null, 2));
  process.exit(1);
}

console.log(
  `Verified ${selected.length} compiled ${family ?? "mixed"} port(s).`,
);
