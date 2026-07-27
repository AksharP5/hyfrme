import { spawn } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const registry = JSON.parse(
  await readFile(resolve(root, "registry", "registry.json"), "utf8"),
);
const iconFixtures = JSON.parse(
  await readFile(resolve(root, "catalog", "icon-fixtures.json"), "utf8"),
);
const iconNames = new Set(iconFixtures.map((entry) => entry.slug));
const representativeTimes = new Map([
  ["slide-swap", 5.8],
  ["spring-settle", 5.8],
]);

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
  const representativeTime = representativeTimes.get(item.name);
  await mkdir(previewDirectory, { recursive: true });
  await run([
    "-y",
    "-v",
    "error",
    ...(representativeTime === undefined
      ? ["-sseof", "-0.05"]
      : ["-ss", String(representativeTime)]),
    "-i",
    resolve(previewDirectory, "hyperframes.mp4"),
    "-vf",
    iconNames.has(item.name)
      ? "scale=384:384:flags=lanczos"
      : "scale=384:216:flags=lanczos",
    "-frames:v",
    "1",
    resolve(previewDirectory, "thumbnail.png"),
  ]);
  process.stdout.write(`\rThumbnails ${index + 1}/${registry.items.length}`);
}

process.stdout.write("\n");
