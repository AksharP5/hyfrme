import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  writeFile,
} from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { promisify } from "node:util";

const root = resolve(import.meta.dirname, "..");
const registry = resolve(root, "registry");
const block = resolve(registry, "blocks/screen-lift");
const manifest = JSON.parse(
  await readFile(resolve(block, "registry-item.json"), "utf8"),
);
const fixture = { width: 1280, height: 960, fps: 30, durationInFrames: 120 };
assert.deepEqual(manifest.dimensions, {
  width: fixture.width,
  height: fixture.height,
});
assert.equal(manifest.duration, fixture.durationInFrames / fixture.fps);
const workRoot = resolve(root, ".work/verify-screen-lift");
await mkdir(workRoot, { recursive: true });
const work = await mkdtemp(resolve(workRoot, "run-"));
const installed = resolve(work, "installed");
const source = resolve(work, "source");
const customized = resolve(work, "customized");
const exec = promisify(execFile);
const runId = `screen-lift-${Date.now()}`;
const run = (command, args, cwd = work, env = {}) =>
  exec(command, args, {
    cwd,
    env: {
      ...process.env,
      HYPERFRAMES_RUN_ID: runId,
      ...env,
    },
    maxBuffer: 16 * 1024 * 1024,
  });
const cli = process.env.HYPERFRAMES_CLI;
const hf = (args, cwd) =>
  cli
    ? run(process.execPath, [resolve(cli), ...args], cwd)
    : run("npx", ["--yes", "hyperframes@0.8.30", ...args], cwd);
const writeJson = (path, value) =>
  writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function host(blocks = "compositions", assets = "assets") {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<script src="${assets}/screen-lift/gsap.min.js"></script>
<style>*{box-sizing:border-box}html,body{margin:0;width:1280px;height:960px;overflow:hidden;background:#050607}#root,#screen-lift-slot{position:absolute;inset:0}</style>
</head><body>
<div id="root" data-composition-id="screen-lift-installation" data-start="0" data-duration="4" data-fps="30" data-width="1280" data-height="960">
<div id="screen-lift-slot" data-composition-id="screen-lift" data-composition-src="${blocks}/screen-lift.html" data-start="0" data-duration="4" data-track-index="1" data-width="1280" data-height="960"></div>
</div><script>window.__timelines=window.__timelines||{};window.__timelines['screen-lift-installation']=gsap.timeline({paused:true});</script>
</body></html>\n`;
}

async function project(path, blocks = "compositions", assets = "assets") {
  await mkdir(path, { recursive: true });
  await writeJson(resolve(path, "package.json"), {
    private: true,
    type: "module",
  });
  await writeJson(resolve(path, "hyperframes.json"), {
    paths: { blocks, components: `${blocks}/components`, assets },
  });
  await writeFile(resolve(path, "index.html"), host(blocks, assets));
  await writeJson(resolve(path, "index.motion.json"), {
    duration: 4,
    assertions: [
      { kind: "keepsMoving", withinSelector: ".rig", maxStaticSec: 2 },
    ],
  });
}

await project(installed);
await project(source);
await project(customized, "scenes", "media");
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", "http://localhost");
    const path = resolve(registry, `.${decodeURIComponent(url.pathname)}`);
    if (!path.startsWith(`${registry}${sep}`))
      throw new Error("Unsafe registry path");
    const body = await readFile(path);
    response.writeHead(200, {
      "content-type":
        extname(path) === ".json"
          ? "application/json"
          : "application/octet-stream",
    });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});
await new Promise((accept, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", accept);
});
const address = server.address();
assert(address && typeof address === "object");
const overrides = {
  title: "Inbox",
  chat2Name: "Taylor Park",
  chat2Message: "Every word is editable.",
  chat2Time: "1m",
  chat2Color: "#654080",
  accentColor: "#ad83ff",
  lift: 130,
  angle: 16,
  focusRow: 3,
  rowHeight: 100,
};
try {
  for (const [directory, values] of [
    [installed, {}],
    [customized, overrides],
  ]) {
    await run(
      process.execPath,
      [
        resolve(root, "cli/bin/hyfrme.mjs"),
        "add",
        "screen-lift",
        "--dir",
        directory,
        ...Object.entries(values).flatMap(([key, value]) => [
          "--set",
          `${key}=${value}`,
        ]),
      ],
      root,
      { HYFRME_REGISTRY_URL: `http://127.0.0.1:${address.port}` },
    );
  }
} finally {
  await new Promise((accept, reject) =>
    server.close((error) => (error ? reject(error) : accept())),
  );
}

const canonicalHtml = await readFile(
  resolve(block, "screen-lift.html"),
  "utf8",
);
assert.doesNotMatch(
  canonicalHtml,
  /<img\b|<canvas\b|screen\.png|data:image\//i,
);
assert(
  manifest.files.every((file) => !/\.(png|jpe?g|webp|svg)$/i.test(file.path)),
);
const installedHtml = await readFile(
  resolve(installed, "compositions/screen-lift.html"),
  "utf8",
);
assert.match(installedHtml, /<template>/);
const variableDefinitions = (html) =>
  JSON.parse(html.match(/data-composition-variables='([^']*)'/)?.[1] ?? "null");
assert.deepEqual(
  variableDefinitions(installedHtml),
  variableDefinitions(canonicalHtml.replaceAll("../assets/", "assets/")),
  "Default installation must preserve the variables with relocated asset paths",
);
for (const file of manifest.files) {
  if (file.type === "hyperframes:composition") continue;
  const canonical = await readFile(resolve(block, file.path));
  assert.deepEqual(
    await readFile(resolve(installed, file.target)),
    canonical,
    `${file.path}: installation changed bytes`,
  );
  const customTarget = file.target
    .replace(/^compositions\//, "scenes/")
    .replace(/^assets\//, "media/");
  assert.deepEqual(
    await readFile(resolve(customized, customTarget)),
    canonical,
    `${file.path}: customized installation changed asset bytes`,
  );
  const target = resolve(source, file.target);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(resolve(block, file.path), target);
}
await writeFile(
  resolve(source, "index.html"),
  canonicalHtml.replaceAll("../assets/", "assets/"),
);
const customizedHtml = await readFile(
  resolve(customized, "scenes/screen-lift.html"),
  "utf8",
);
const variables = variableDefinitions(customizedHtml);
for (const [id, value] of Object.entries(overrides)) {
  assert.equal(
    variables.find((variable) => variable.id === id)?.default,
    value,
    `${id}: installer ignored override`,
  );
}
assert.match(customizedHtml, /media\/screen-lift\/Geist\.woff2/);

async function check(directory) {
  const { stdout } = await hf(["check", "--json"], directory);
  const result = JSON.parse(stdout.slice(stdout.indexOf("{")));
  assert.equal(result.ok, true, JSON.stringify(result));
  return result;
}
console.log("Checking default installation and custom paths/settings…");
const checkResult = await check(installed);
const customCheck = await check(customized);
const videos = {
  source: resolve(work, "source.mp4"),
  installed: resolve(work, "installed.mp4"),
};
for (const [name, directory] of [
  ["source", source],
  ["installed", installed],
]) {
  console.log(`Rendering ${name}…`);
  await hf(
    [
      "render",
      "--output",
      videos[name],
      "--quality",
      "high",
      "--workers",
      "2",
      "--strict-all",
      "--strict-variables",
    ],
    directory,
  );
  const { stdout } = await run("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height,avg_frame_rate,nb_frames,duration",
    "-of",
    "json",
    videos[name],
  ]);
  const stream = JSON.parse(stdout).streams[0];
  assert.equal(stream.width, fixture.width);
  assert.equal(stream.height, fixture.height);
  assert.equal(stream.avg_frame_rate, `${fixture.fps}/1`);
  assert.equal(Number(stream.nb_frames), fixture.durationInFrames);
  assert.equal(Number(stream.duration), manifest.duration);
}
await run("ffmpeg", [
  "-hide_banner",
  "-i",
  videos.source,
  "-i",
  videos.installed,
  "-lavfi",
  "ssim=stats_file=ssim.log",
  "-f",
  "null",
  "-",
]);
const scores = [
  ...(await readFile(resolve(work, "ssim.log"), "utf8")).matchAll(
    /All:([\d.]+)/g,
  ),
].map((match) => Number(match[1]));
assert.equal(
  scores.length,
  fixture.durationInFrames,
  "SSIM must cover every frame",
);
const meanSsim =
  scores.reduce((total, value) => total + value, 0) / scores.length;
assert(meanSsim >= 0.99, `Installed render differs from source: ${meanSsim}`);
await run("ffmpeg", [
  "-y",
  "-v",
  "error",
  "-ss",
  "3.4",
  "-i",
  videos.installed,
  "-frames:v",
  "1",
  resolve(work, "thumbnail.png"),
]);
const { stdout: thumbnailMetadata } = await run("ffprobe", [
  "-v",
  "error",
  "-select_streams",
  "v:0",
  "-show_entries",
  "stream=color_transfer",
  "-of",
  "json",
  resolve(work, "thumbnail.png"),
]);
const transfer = JSON.parse(thumbnailMetadata).streams[0].color_transfer;
const thumbnailFilters = [
  ...(transfer && transfer !== "unknown" && transfer !== "iec61966-2-1"
    ? ["zscale=transfer=iec61966-2-1:primaries=bt709:matrix=gbr:range=full"]
    : []),
  "format=gbrapf32le",
  "premultiply=inplace=1",
  "scale=1024:-2:flags=lanczos",
  "unpremultiply=inplace=1",
  "format=rgba",
];
await run("ffmpeg", [
  "-y",
  "-v",
  "error",
  "-i",
  resolve(work, "thumbnail.png"),
  "-frames:v",
  "1",
  "-vf",
  thumbnailFilters.join(","),
  "-c:v",
  "libwebp",
  "-lossless",
  "1",
  resolve(work, "thumbnail.webp"),
]);
const version = (await hf(["--version"], work)).stdout.trim();
const summary = {
  slug: "screen-lift",
  kind: "original",
  comparison: "canonical-source-to-cli-installation",
  fixture,
  frameCount: scores.length,
  threshold: 0.99,
  meanSsim,
  minSsim: Math.min(...scores),
  sourceSha256: sha256(canonicalHtml),
  installedSha256: sha256(installedHtml),
  hyperframesVersion: version,
  customization: {
    paths: { blocks: "scenes", assets: "media" },
    values: overrides,
    checkPassed: customCheck.ok,
  },
  pass: true,
};
const artifacts = {
  hyperframesVideo: "public/previews/screen-lift/hyperframes.mp4",
  check: "parity/screen-lift-diff/hyperframes-check.json",
  summary: "parity/screen-lift-diff/summary.json",
};
await mkdir(resolve(root, "public/previews/screen-lift"), { recursive: true });
await mkdir(resolve(root, "parity/screen-lift-diff"), { recursive: true });
await copyFile(videos.installed, resolve(root, artifacts.hyperframesVideo));
for (const file of ["thumbnail.png", "thumbnail.webp"]) {
  await copyFile(
    resolve(work, file),
    resolve(root, "public/previews/screen-lift", file),
  );
}
checkResult.motion.specPath = relative(root, checkResult.motion.specPath);
await writeJson(resolve(root, artifacts.check), checkResult);
await writeJson(resolve(root, artifacts.summary), summary);
await writeJson(resolve(root, "parity/screen-lift.json"), {
  slug: "screen-lift",
  kind: "original",
  status: "verified",
  origin: {
    repository: "https://github.com/AksharP5/hyfrme",
    source: "registry/blocks/screen-lift/screen-lift.html",
    license: "MIT",
  },
  fixture,
  result: { frameCount: fixture.durationInFrames, pass: true },
  checks: { hyperframes: { pass: true, version }, installedThroughCli: true },
  artifacts,
});
console.log(
  `Screen Lift verified: ${scores.length} frames, installation SSIM ${meanSsim.toFixed(6)}. Evidence: ${work}`,
);
