import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ideas } from "../parity/t3-gallery/data.js";

const root = resolve(import.meta.dirname, "..");
const manifestPath = resolve(root, "parity/t3code-ideas.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const selected = new Set(process.argv.slice(2).map(Number));
const work = await mkdtemp(join(tmpdir(), "hyfrme-t3-gallery-"));

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

try {
  for (const idea of ideas) {
    if (selected.size && !selected.has(idea.id)) continue;
    const frames = manifest.frames.filter((frame) => frame.idea === idea.id);
    const recording = manifest.recordings.find((entry) => entry.idea === idea.id);
    if (frames.length !== 3 || !recording) throw new Error(`Missing gallery manifest for ${idea.id}`);
    const sourceVideo = frames[0].sourceVideo;
    if (!sourceVideo || frames.some((frame) => frame.sourceVideo !== sourceVideo || !Number.isInteger(frame.sourceFrame))) {
      throw new Error(`Missing native frame mapping for ${idea.id}`);
    }
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
      sourceVideo, sourceVideoSha256: await sha256(native),
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
