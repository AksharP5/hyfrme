import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { readRegistrySource, validateRegistry } from "./registry-hosting.mjs";
import {
  readMediaFiles,
  readMediaManifest,
  root,
  validateMedia,
} from "./media.mjs";

// Vercel skips a deployment on exit 0 and builds on exit 1.
if (process.env.VERCEL_ENV !== "preview") process.exit(1);

const previous = process.env.VERCEL_GIT_PREVIOUS_SHA;
if (/^[a-f0-9]{40}$/i.test(previous ?? "")) {
  const diff = spawnSync(
    "git",
    ["diff", "--no-renames", "--name-only", "-z", previous, "HEAD", "--"],
    { cwd: root, encoding: "utf8" },
  );
  const paths =
    diff.status === 0 ? diff.stdout.split("\0").filter(Boolean) : [];
  const documentation = new Set(["README.md", "AGENTS.md"]);
  const directories = ["docs/", "fixtures/", "examples/", ".github/"];
  if (
    paths.length > 0 &&
    paths.every(
      (path) =>
        documentation.has(path) ||
        directories.some((directory) => path.startsWith(directory)) ||
        (path.startsWith("parity/") && path.slice(7).includes("/")),
    )
  ) {
    console.log(
      "Hosted preview skipped: only documentation or audit files changed.",
    );
    process.exit(0);
  }
}

try {
  const files = await readMediaFiles(resolve(root, "public"));
  const manifest = await readMediaManifest();
  const vercel = JSON.parse(
    await readFile(resolve(root, "vercel.json"), "utf8"),
  );
  validateMedia(files, manifest, vercel.redirects);
  await validateRegistry(
    resolve(root, "registry"),
    await readRegistrySource(),
    vercel,
  );
} catch (error) {
  console.log(`Hosted preview skipped: ${error.message}`);
  console.log(
    "Review with npm run build and npm run preview. PR CI still runs.",
  );
  process.exit(0);
}

process.exit(1);
