import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const run = (program, args) => {
  const result = spawnSync(program, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${program} failed:\n${result.stderr.slice(-3000)}`);
  return result.stdout;
};

const report = {
  sourceTag: "v0.0.42",
  sourceCommit: "719a76ca1dbf5490f1aa33ffb9966301e02be9a9",
  atlas: { width: 14400, height: 659, columns: 12, rows: 10, frames: 120, fps: 30, encoding: "lossless WebP strips" },
  themes: {},
};

for (const theme of ["dark", "light"]) {
  const fixturePath = resolve(source, `prompt-send-v0042-${theme}-fixture.json`);
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
  const reference = resolve(root, `parity/t3-prompt-send-v0042-${theme}-reference.mkv`);
  if (fixture.referenceSha256 !== hash(await readFile(reference))) throw new Error(`${theme} native recording changed`);

  const work = resolve(root, `.work/t3-prompt-send-v0042-${theme}`);
  const frames = resolve(work, "frames");
  const roundTrip = resolve(work, "atlas-roundtrip");
  await mkdir(frames, { recursive: true });
  await rm(roundTrip, { recursive: true, force: true });
  await mkdir(roundTrip, { recursive: true });
  const savedFrames = (await readdir(frames)).filter((file) => /^frame-\d{4}\.png$/.test(file));
  if (savedFrames.length !== fixture.frames) {
    await rm(frames, { recursive: true, force: true });
    await mkdir(frames, { recursive: true });
    run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", reference, "-fps_mode", "passthrough",
      "-start_number", "0", resolve(frames, "frame-%04d.png")]);
  }

  const pngFrames = (await readdir(frames)).filter((file) => /^frame-\d{4}\.png$/.test(file));
  if (pngFrames.length !== fixture.frames) throw new Error(`${theme} reference did not decode to 120 frames`);
  const spriteHashes = {};
  for (let row = 0; row < 10; row++) {
    const name = `prompt-send-v0042-${theme}-capture-${String(row).padStart(2, "0")}.webp`;
    const atlas = resolve(source, name);
    run("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-framerate", String(fixture.fps),
      "-start_number", String(row * 12), "-i", resolve(frames, "frame-%04d.png"), "-vf",
      "tile=layout=12x1:nb_frames=12:padding=0:margin=0", "-frames:v", "1", "-c:v", "libwebp",
      "-lossless", "1", "-compression_level", "6", "-q:v", "100", atlas]);
    const dimensions = run("ffprobe", ["-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", atlas]).trim();
    if (dimensions !== "14400,659") throw new Error(`${theme} strip ${row} is ${dimensions}, expected 14400,659`);
    spriteHashes[String(row).padStart(2, "0")] = hash(await readFile(atlas));
    run("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", atlas, "-vf", "untile=layout=12x1",
      "-start_number", String(row * 12), resolve(roundTrip, "frame-%04d.png")]);
  }
  const roundTripFrames = (await readdir(roundTrip)).filter((file) => /^frame-\d{4}\.png$/.test(file));
  if (roundTripFrames.length !== fixture.frames) throw new Error(`${theme} atlas decoded to ${roundTripFrames.length} frames`);
  const stats = resolve(work, "capture-atlas-ssim.txt");
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-framerate", String(fixture.fps), "-start_number", "0",
    "-i", resolve(frames, "frame-%04d.png"), "-framerate", String(fixture.fps), "-start_number", "0",
    "-i", resolve(roundTrip, "frame-%04d.png"), "-lavfi", `ssim=stats_file=${stats}`, "-frames:v",
    String(fixture.frames), "-f", "null", "-"]);
  const scores = [...(await readFile(stats, "utf8")).matchAll(/^n:\d+ .*?All:([\d.]+)/gm)]
    .map((match) => Number(match[1]));
  const meanSsim = scores.reduce((sum, value) => sum + value, 0) / scores.length;
  if (scores.length !== fixture.frames || meanSsim !== 1 || Math.min(...scores) !== 1) {
    throw new Error(`${theme} lossless atlas round trip failed: ${scores.length} frames, SSIM ${meanSsim}`);
  }
  fixture.captureSpriteSha256 = spriteHashes;
  fixture.captureSpriteFrameCount = fixture.frames;
  await writeFile(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
  report.themes[theme] = { sha256: fixture.captureSpriteSha256, frameCount: scores.length, meanSsim, minSsim: Math.min(...scores) };
}

await writeFile(resolve(root, "parity/t3-prompt-send-v0042-atlas.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Built dark/light native capture atlases. Every frame round-tripped at SSIM 1.0.`);
