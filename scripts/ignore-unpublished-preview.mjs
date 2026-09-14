import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  readMediaFiles,
  readMediaManifest,
  root,
  validateMedia,
} from "./media.mjs";

// Vercel skips a deployment on exit 0 and builds on exit 1.
if (process.env.VERCEL_ENV !== "preview") process.exit(1);

try {
  const files = await readMediaFiles(resolve(root, "public"));
  const manifest = await readMediaManifest();
  const vercel = JSON.parse(
    await readFile(resolve(root, "vercel.json"), "utf8"),
  );
  validateMedia(files, manifest, vercel.redirects);
} catch (error) {
  console.log(`Hosted preview skipped: ${error.message}`);
  console.log(
    "Review with npm run build and npm run preview. PR CI still runs.",
  );
  process.exit(0);
}

process.exit(1);
