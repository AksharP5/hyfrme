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
  ["displacement", 1.2],
  ["ember-burn", 1.33],
  ["fog-rise", 1.5],
  ["glitch-cut", 1.3],
  ["grid-wave", 1.4],
  ["outline-fill-track-text", 1.5],
  ["particle-dissolve", 1.4],
  ["shadow-sweep-text", 0.83],
  ["sheen-slide-in", 0.8],
  ["slide-swap", 5.8],
  ["spring-settle", 5.8],
  ["stage", 5],
  ["tv-power-off", 1.2],
]);
const onlyIndex = process.argv.indexOf("--only");
const only =
  onlyIndex === -1 ? null : new Set(process.argv[onlyIndex + 1].split(","));
const items = only
  ? registry.items.filter((item) => only.has(item.name))
  : registry.items;

if (only && items.length !== only.size) {
  throw new Error(
    `Expected ${only.size} registry items, found ${items.length}`,
  );
}

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

for (const [index, item] of items.entries()) {
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
  process.stdout.write(`\rThumbnails ${index + 1}/${items.length}`);
}

process.stdout.write("\n");
