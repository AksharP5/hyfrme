import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { isDeepStrictEqual } from "node:util";
import { assertExactFrameHashes } from "./parity-evidence.mjs";

const execFileAsync = promisify(execFile);
const root = resolve(import.meta.dirname, "..");
const catalog = JSON.parse(
  await readFile(resolve(root, "catalog", "showcases.json"), "utf8"),
);
const fixtures = JSON.parse(
  await readFile(resolve(root, "catalog/showcase-fixtures.json"), "utf8"),
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
  const fixture = fixtures.find((fixture) => fixture.slug === entry.slug);
  const verification = parity.verification;
  if (
    !fixture ||
    parity.slug !== entry.slug ||
    parity.source.commit !== entry.sourceCommit ||
    !isDeepStrictEqual(parity.source, {
      repository: fixture.origin.repository,
      commit: fixture.origin.commit,
      path: fixture.origin.path,
    }) ||
    parity.frameCount !== entry.durationInFrames ||
    parity.frameCount !== fixture.fixture.durationInFrames ||
    parity.meanSsim !== 1 ||
    parity.minimumSsim !== 1 ||
    parity.threshold !== 1 ||
    parity.pass !== true ||
    verification?.exactRgba !== true ||
    verification.fullCheckPassed !== true ||
    verification.strictCaptureComplete !== true ||
    verification.proof !== `parity/showcases/${entry.slug}-lossless/proof.json`
  ) {
    throw new Error(`${entry.slug} has stale or failing parity metadata`);
  }
  const proof = JSON.parse(
    await readFile(resolve(root, verification.proof), "utf8"),
  );
  if (
    proof.status !== "verified" ||
    proof.pass !== true ||
    proof.fingerprint !== verification.fingerprint ||
    !isDeepStrictEqual(proof.fixture, fixture.fixture) ||
    proof.result?.exactRgba !== true ||
    proof.result.frameCount !== parity.frameCount ||
    proof.result.meanSsim !== 1 ||
    proof.result.minSsim !== 1
  )
    throw new Error(`${entry.slug}: full lossless proof is incomplete`);
  const inputs = verification.inputs ?? {};
  const artifacts = verification.artifactHashes ?? {};
  for (const required of [
    entry.sourcePath,
    `showcases/compositions/${entry.slug}.runtime.js`,
    "showcases/package.json",
    "showcases/hyperframes.json",
    "catalog/showcase-fixtures.json",
    "assets/remocn-collections/manifest.json",
  ])
    if (!inputs[required])
      throw new Error(`${entry.slug}: missing verified input ${required}`);
  for (const required of [
    `public/showcases/${entry.slug}.mp4`,
    `public/showcases/${entry.slug}.png`,
    `parity/showcases/${entry.slug}-lossless/reference-rgba.sha256`,
    `parity/showcases/${entry.slug}-lossless/hyperframes-rgba.sha256`,
  ])
    if (!artifacts[required])
      throw new Error(`${entry.slug}: missing verified artifact ${required}`);
  for (const [files, recorded] of [
    [inputs, proof.inputHashes],
    [artifacts, proof.artifactHashes],
  ]) {
    for (const [path, checksum] of Object.entries(files)) {
      if (
        !/^(assets|catalog|showcases|parity|public)\//.test(path) ||
        path.split("/").includes("..") ||
        !/^[a-f0-9]{64}$/.test(checksum) ||
        recorded[path] !== checksum
      )
        throw new Error(`${entry.slug}: invalid portable proof hash ${path}`);
      const actual = createHash("sha256")
        .update(await readFile(resolve(root, path)))
        .digest("hex");
      if (actual !== checksum)
        throw new Error(`${entry.slug}: verified file changed: ${path}`);
    }
  }
  await assertExactFrameHashes(
    resolve(
      root,
      `parity/showcases/${entry.slug}-lossless/reference-rgba.sha256`,
    ),
    resolve(
      root,
      `parity/showcases/${entry.slug}-lossless/hyperframes-rgba.sha256`,
    ),
    {
      width: fixture.fixture.width,
      height: fixture.fixture.height,
      frameCount: parity.frameCount,
    },
  );

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
  `Verified ${catalog.length} showcase ports, shipped file hashes and every exact RGBA frame.`,
);
