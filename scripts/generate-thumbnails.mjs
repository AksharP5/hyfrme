import { spawn } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const registry = JSON.parse(
  await readFile(resolve(root, "registry", "registry.json"), "utf8"),
);

const run = (args) =>
  new Promise((accept, reject) => {
    const child = spawn("ffmpeg", args, { stdio: "pipe" });
    let error = "";
    child.stderr.on("data", (chunk) => (error += chunk));
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? accept() : reject(new Error(error)),
    );
  });

for (const [index, item] of registry.items.entries()) {
  const previewDirectory = resolve(root, "public", "previews", item.name);
  await mkdir(previewDirectory, { recursive: true });
  await run([
    "-y",
    "-v",
    "error",
    "-sseof",
    "-0.05",
    "-i",
    resolve(previewDirectory, "hyperframes.mp4"),
    ...(item.name === "soft-blur-in"
      ? []
      : ["-vf", "scale=192:192:flags=lanczos"]),
    "-frames:v",
    "1",
    resolve(previewDirectory, "thumbnail.png"),
  ]);
  process.stdout.write(`\rThumbnails ${index + 1}/${registry.items.length}`);
}

process.stdout.write("\n");
