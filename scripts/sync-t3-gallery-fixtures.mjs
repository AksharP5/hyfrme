import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { isAbsolute, join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { assertVerifiedBlockFiles } from "./parity-evidence.mjs";
import { ideas } from "../parity/t3-gallery/data.js";

const root = resolve(import.meta.dirname, "..");

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr}`);
  return result.stdout;
}

async function sha256(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

function rgbHash(path) {
  return run("ffmpeg", ["-v", "error", "-i", path, "-frames:v", "1", "-pix_fmt", "rgb24", "-f", "hash", "-hash", "sha256", "-"]).trim();
}

export async function galleryNativeAuthority(idea, repository = root) {
  const local = path => {
    if (typeof path !== "string" || isAbsolute(path) || !resolve(repository, path).startsWith(repository + sep)) {
      throw new Error(`${idea.block}: invalid native evidence path`);
    }
    return resolve(repository, path);
  };
  const parity = JSON.parse(await readFile(local(`parity/${idea.block}.json`), "utf8"));
  if (parity.status !== "verified" || parity.result?.pass !== true || parity.result.frameCount !== 120 ||
      parity.checks?.installedThroughCli !== true || parity.fixture?.width !== 1200 ||
      parity.fixture.height !== 659 || parity.fixture.fps !== 30) {
    throw new Error(`${idea.block}: current verified native authority is required`);
  }
  const block = local(`registry/blocks/${idea.block}`);
  const manifest = JSON.parse(await readFile(join(block, "registry-item.json"), "utf8"));
  const composition = manifest.files.find(file => file.type === "hyperframes:composition");
  if (!composition || await sha256(join(block, composition.path)) !== parity.fixture.compositionSha256) {
    throw new Error(`${idea.block}: composition changed after verification`);
  }
  if (parity.filesSha256) await assertVerifiedBlockFiles(block, manifest, parity.filesSha256);
  for (const [path, expected] of Object.entries(parity.inputHashes ?? {})) {
    if (await sha256(local(path)) !== expected) throw new Error(`${idea.block}: native proof input changed: ${path}`);
  }
  const selected = idea.previewVariant ? parity.themes?.dark?.[idea.previewVariant] : parity.themes?.dark;
  if (idea.previewVariant && (selected?.result?.pass !== true || selected.result.frameCount !== 120 ||
      selected.fixture?.compositionSha256 !== parity.fixture.compositionSha256)) {
    throw new Error(`${idea.block}/${idea.previewVariant}: current verified variant evidence is required`);
  }
  if (!idea.previewVariant && selected?.result?.pass !== true) throw new Error(`${idea.block}: dark native authority is unverified`);
  if (idea.previewVariant) {
    if (selected.status !== "verified" || selected.checks?.installedThroughCli !== true ||
        selected.checks.strictRender !== true || !Object.keys(selected.inputHashes ?? {}).length) {
      throw new Error(`${idea.block}/${idea.previewVariant}: current verified variant inputs are required`);
    }
    for (const [path, expected] of Object.entries(selected.inputHashes)) {
      if (await sha256(local(path)) !== expected) throw new Error(`${idea.block}/${idea.previewVariant}: variant proof input changed: ${path}`);
    }
  }
  const sourceVideo = selected?.artifacts?.nativeRecording;
  const sourceVideoSha256 = selected?.referenceSha256;
  if (!sourceVideoSha256 || await sha256(local(sourceVideo)) !== sourceVideoSha256) {
    throw new Error(`${idea.block}: native authority changed after verification`);
  }
  return { sourceVideo, sourceVideoSha256 };
}

async function main() {
  const manifestPath = resolve(root, "parity/t3code-ideas.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const selected = new Set(process.argv.slice(2).map(Number));
  const plan = [];
  for (const idea of ideas) {
    if (selected.size && !selected.has(idea.id)) continue;
    const frames = manifest.frames.filter(frame => frame.idea === idea.id);
    const recording = manifest.recordings.find(entry => entry.idea === idea.id);
    if (frames.length !== 3 || !recording || frames.some(frame => !Number.isInteger(frame.sourceFrame) || frame.sourceFrame < 0 || frame.sourceFrame >= 120)) {
      throw new Error(`Missing native frame mapping for ${idea.id}`);
    }
    plan.push({ idea, frames, recording, ...await galleryNativeAuthority(idea) });
  }
  const work = await mkdtemp(join(tmpdir(), "hyfrme-t3-gallery-"));
  try {
    for (const { idea, frames, recording, sourceVideo, sourceVideoSha256 } of plan) {
      const native = resolve(root, sourceVideo);
      const source = JSON.parse(run("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate,nb_read_frames", "-of", "json", native])).streams[0];
      if (source.width !== 1200 || source.height !== 659 || source.r_frame_rate !== "30/1" || Number(source.nb_read_frames) !== 120) {
        throw new Error(`Unexpected native fixture dimensions or duration for ${idea.id}`);
      }

      for (const frame of frames) {
        const png = join(work, `${idea.id}-${frame.step}.png`);
        const webp = resolve(root, frame.reference);
        run("ffmpeg", ["-v", "error", "-y", "-i", native, "-vf", `select=eq(n\\,${frame.sourceFrame})`, "-frames:v", "1", png]);
        run("ffmpeg", ["-v", "error", "-y", "-i", png, "-frames:v", "1", "-c:v", "libwebp", "-lossless", "1", webp]);
        if (rgbHash(png) !== rgbHash(webp)) throw new Error(`Gallery still ${idea.id}-${frame.step} changed native pixels`);
        frame.sourceVideo = sourceVideo;
        frame.sha256 = await sha256(webp);
        frame.nativeFramePngSha256 = await sha256(png);
        delete frame.capturePngSha256;
        frame.ssim = 1;
      }

      const clip = resolve(root, recording.path);
      run("ffmpeg", ["-v", "error", "-y", "-i", native, "-vf", "pad=1200:660:0:0:black", "-frames:v", "120", "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart", clip]);
      const video = JSON.parse(run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name,width,height,r_frame_rate,nb_frames,duration", "-of", "json", clip])).streams[0];
      if (video.width !== 1200 || video.height !== 660 || video.r_frame_rate !== "30/1" || Number(video.nb_frames) !== 120) {
        throw new Error(`Unexpected gallery clip dimensions or duration for ${idea.id}`);
      }
      const comparison = spawnSync("ffmpeg", [
        "-hide_banner", "-i", native, "-i", clip,
        "-filter_complex", "[0:v]format=rgb24[a];[1:v]format=rgb24,crop=1200:659:0:0[b];[a][b]ssim",
        "-f", "null", "-",
      ], { encoding: "utf8" });
      const sourceMeanSsim = Number([...comparison.stderr.matchAll(/All:([\d.]+)/g)].at(-1)?.[1]);
      if (comparison.status !== 0 || !Number.isFinite(sourceMeanSsim) || sourceMeanSsim < 0.99) {
        throw new Error(`Gallery clip ${idea.id} failed native recording comparison: ${sourceMeanSsim}`);
      }
      Object.assign(recording, {
        sourceVideo, sourceVideoSha256,
        sha256: await sha256(clip), codec: video.codec_name, width: video.width,
        height: video.height, fps: video.r_frame_rate, frames: Number(video.nb_frames),
        durationSeconds: Number(video.duration), sourceMeanSsim,
      });
      console.log(`Synced T3 Code gallery fixture ${idea.id}`);
    }
    manifest.verification.frameCount = manifest.frames.length;
    manifest.verification.videoSampleCount = manifest.frames.length;
    manifest.verification.minimumEncodedSourceSsim = Math.min(...manifest.recordings.map((entry) => entry.sourceMeanSsim));
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  } finally {
    await rm(work, { recursive: true, force: true });
  }

}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
