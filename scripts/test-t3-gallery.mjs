import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { ideas, references } from "../public/ideas/data.js";
import { renderT3Scene } from "../public/ideas/t3-scenes.js";

const root = resolve(import.meta.dirname, "..");
const galleryParity = JSON.parse(
  await readFile(resolve(root, "parity/t3code-ideas.json"), "utf8"),
);
const registry = JSON.parse(
  await readFile(resolve(root, "registry/registry.json"), "utf8"),
);
const registered = new Set(registry.items.map((item) => item.name));
const referenceIds = new Set(references.map((reference) => reference.slug));
const ids = new Set();
const mapped = new Set();

for (const idea of ideas) {
  if (ids.has(idea.id) || !referenceIds.has(idea.reference)) {
    throw new Error(`T3 Code gallery idea ${idea.id} has a duplicate ID or missing source`);
  }
  ids.add(idea.id);
  if (!renderT3Scene(idea).includes(`/ideas/t3-clips/${idea.id}.mp4`)) {
    throw new Error(`T3 Code gallery idea ${idea.id} has no native animation`);
  }
  if (idea.themes.includes("light")) {
    const lightName = idea.previewVariant === "settingsEnabled200" ? "reference-settings-enabled-light.mp4" : "reference-light.mp4";
    if (!renderT3Scene(idea, "light").includes(`/previews/${idea.block}/${lightName}`)) {
      throw new Error(`T3 Code gallery idea ${idea.id} has no light native animation`);
    }
    await stat(resolve(root, "public/previews", idea.block, lightName));
  }
  for (const path of [
    `public/ideas/t3-clips/${idea.id}.mp4`,
    ...["a", "b", "c"].map((step) => `public/ideas/t3-frames/${idea.id}-${step}.webp`),
  ]) {
    await stat(resolve(root, path));
  }
  if (!idea.block) continue;
  if (!registered.has(idea.block) || mapped.has(idea.block)) {
    throw new Error(`T3 Code gallery block ${idea.block} is missing or repeated`);
  }
  mapped.add(idea.block);
  await stat(resolve(root, "registry/blocks", idea.block, "registry-item.json"));
  const parity = JSON.parse(
    await readFile(resolve(root, "parity", `${idea.block}.json`), "utf8"),
  );
  if (
    parity.status !== "verified" ||
    parity.origin?.commit !== (idea.version === "v0.0.42" ? "719a76ca1dbf5490f1aa33ffb9966301e02be9a9" : galleryParity.source.sourceCommit) ||
    parity.fixture?.width !== galleryParity.viewport.width ||
    parity.fixture?.height !== galleryParity.viewport.height ||
    parity.fixture?.fps !== 30 ||
    parity.result?.pass !== true ||
    parity.result?.frameCount !== 120 ||
    parity.checks?.installedThroughCli !== true
  ) {
    throw new Error(`${idea.block} is linked before full parity and CLI installation`);
  }
  const recording = galleryParity.recordings.find((entry) => entry.idea === idea.id);
  const sourcePrefix = `parity/${idea.block}${idea.version === "v0.0.42" ? "-v0042" : ""}`;
  const variant = idea.previewVariant === "settingsEnabled200" ? parity.themes?.dark?.settingsEnabled200 : null;
  const referenceSha256 = variant?.referenceSha256 ?? parity.themes?.dark?.referenceSha256 ?? parity.fixture.referenceSha256;
  const sourceNames = variant
    ? new Set([`${sourcePrefix}-dark-animated-reference.mkv`])
    : new Set([`${sourcePrefix}-reference.mkv`, `${sourcePrefix}-dark-reference.mkv`]);
  if (idea.previewVariant && (!variant?.result?.pass || variant.result.frameCount !== 120)) {
    throw new Error(`${idea.block} gallery variant has no verified parity result`);
  }
  if (
    !sourceNames.has(recording?.sourceVideo) ||
    recording.sourceVideoSha256 !== referenceSha256 ||
    galleryParity.frames.filter((frame) => frame.idea === idea.id).some((frame) => frame.sourceVideo !== recording.sourceVideo)
  ) {
    throw new Error(`${idea.block} gallery media differs from its verified native fixture`);
  }
  const composition = await readFile(
    resolve(root, "registry/blocks", idea.block, `${idea.block}.html`),
  );
  const sha256 = createHash("sha256").update(composition).digest("hex");
  if (sha256 !== parity.fixture.compositionSha256) {
    throw new Error(`${idea.block} differs from its verified composition`);
  }
  for (const state of parity.result.criticalStates ?? []) {
    const native = resolve(root, state.native);
    const hyperframes = resolve(root, state.hyperframes);
    const nativeSha = createHash("sha256").update(await readFile(native)).digest("hex");
    const hyperframesSha = createHash("sha256").update(await readFile(hyperframes)).digest("hex");
    const result = spawnSync("ffmpeg", [
      "-hide_banner", "-i", native, "-i", hyperframes,
      "-lavfi", "ssim", "-f", "null", "-",
    ], { encoding: "utf8" });
    const score = Number(result.stderr.match(/All:([\d.]+)/)?.[1]);
    if (
      nativeSha !== state.nativeSha256 ||
      hyperframesSha !== state.hyperframesSha256 ||
      result.status !== 0 ||
      !Number.isFinite(score) ||
      score < state.minimumSsim ||
      Math.abs(score - state.ssim) > 0.000001
    ) {
      throw new Error(`${idea.block} failed its ${state.name} region check`);
    }
  }
}

for (const { name } of registry.items) {
  if (name.startsWith("t3-") && !mapped.has(name)) {
    throw new Error(`${name} is installable but absent from the T3 Code gallery`);
  }
}

console.log(`${ideas.length} T3 Code references; ${mapped.size} working catalog links.`);
