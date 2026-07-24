import { execFile } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = resolve(import.meta.dirname, "..");
const catalog = JSON.parse(
  await readFile(resolve(root, "catalog", "showcases.json"), "utf8"),
);
const componentCatalog = JSON.parse(
  await readFile(
    resolve(root, "src", "generated", "catalog-data.json"),
    "utf8",
  ),
);
const componentNames = new Set(
  componentCatalog.map((entry) => entry.item.name),
);
const expectedSlugs = [
  "introducing-nextjs",
  "introducing-tenkit",
  "paper-shaders",
  "introducing-videorc",
  "introducing-shadcn",
  "introducing-remocn",
];

if (
  catalog.length !== expectedSlugs.length ||
  expectedSlugs.some((slug) => !catalog.some((entry) => entry.slug === slug))
) {
  throw new Error("Showcase catalog does not contain the six pinned films");
}

for (const entry of catalog) {
  const missingComponents = entry.components.filter(
    (component) => !componentNames.has(component),
  );
  if (missingComponents.length > 0) {
    throw new Error(
      `${entry.slug} links missing components: ${missingComponents.join(", ")}`,
    );
  }

  const htmlPath = resolve(root, entry.sourcePath);
  const runtimePath = resolve(
    root,
    "showcases",
    "compositions",
    `${entry.slug}.runtime.js`,
  );
  const videoPath = resolve(root, "public", "showcases", `${entry.slug}.mp4`);
  const posterPath = resolve(root, "public", "showcases", `${entry.slug}.png`);
  const parityPath = resolve(root, "parity", "showcases", `${entry.slug}.json`);

  await Promise.all(
    [htmlPath, runtimePath, videoPath, posterPath, parityPath].map((path) =>
      access(path),
    ),
  );

  const runtime = await readFile(runtimePath, "utf8");
  if (
    runtime.includes("node_modules/remotion") ||
    runtime.includes("@remotion/")
  ) {
    throw new Error(`${entry.slug} includes a Remotion runtime dependency`);
  }

  const parity = JSON.parse(await readFile(parityPath, "utf8"));
  if (
    parity.slug !== entry.slug ||
    parity.source.commit !== entry.sourceCommit ||
    parity.frameCount !== entry.durationInFrames ||
    parity.meanSsim < parity.threshold ||
    parity.pass !== true
  ) {
    throw new Error(`${entry.slug} has stale or failing parity metadata`);
  }

  const { stdout } = await execFileAsync(
    "ffprobe",
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height,avg_frame_rate,nb_frames",
      "-of",
      "json",
      videoPath,
    ],
    { maxBuffer: 1024 * 1024 },
  );
  const stream = JSON.parse(stdout).streams?.[0];
  if (
    stream?.width !== entry.width ||
    stream?.height !== entry.height ||
    stream?.avg_frame_rate !== `${entry.fps}/1` ||
    Number(stream?.nb_frames) !== entry.durationInFrames
  ) {
    throw new Error(`${entry.slug} render metadata does not match its catalog`);
  }
}

console.log(
  `Verified ${catalog.length} HyperFrames showcase port(s), rendered artifacts, and SSIM manifests.`,
);
