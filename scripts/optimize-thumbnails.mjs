import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);
const root = resolve(import.meta.dirname, "..");
const registry = JSON.parse(
  await readFile(resolve(root, "registry/registry.json"), "utf8"),
);
let originalBytes = 0;
let optimizedBytes = 0;

for (const { name } of registry.items) {
  const directory = resolve(root, "public/previews", name);
  const input = resolve(directory, "thumbnail.png");
  const original = await readFile(input);
  const { stdout: metadata } = await exec("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,color_transfer",
    "-of",
    "json",
    input,
  ]);
  const {
    streams: [{ width, color_transfer: transfer }],
  } = JSON.parse(metadata);
  const filters = [];
  // WebP drops PNG transfer metadata; bake the displayed colors into sRGB.
  if (transfer && transfer !== "unknown" && transfer !== "iec61966-2-1") {
    filters.push(
      "zscale=transfer=iec61966-2-1:primaries=bt709:matrix=gbr:range=full",
    );
  }
  if (width > 1024) {
    // Resize premultiplied colors so transparent pixels cannot create dark edges.
    filters.push(
      "format=gbrapf32le",
      "premultiply=inplace=1",
      "scale=1024:-2:flags=lanczos",
      "unpremultiply=inplace=1",
      "format=rgba",
    );
  }
  const { stdout } = await exec(
    "ffmpeg",
    [
      "-v",
      "error",
      "-i",
      input,
      "-frames:v",
      "1",
      ...(filters.length ? ["-vf", filters.join(",")] : []),
      "-c:v",
      "libwebp",
      "-lossless",
      "1",
      "-f",
      "image2pipe",
      "pipe:1",
    ],
    { encoding: "buffer" },
  );
  await writeFile(resolve(directory, "thumbnail.webp"), stdout);
  originalBytes += original.byteLength;
  optimizedBytes += stdout.byteLength;
}

console.log(
  `Optimized ${registry.items.length} thumbnails: ${(originalBytes / 1e6).toFixed(2)} MB → ${(optimizedBytes / 1e6).toFixed(2)} MB.`,
);
