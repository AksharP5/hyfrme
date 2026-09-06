import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { BlobNotFoundError, head, put } from "@vercel/blob";
import { mediaContent } from "./encode-media.mjs";
import {
  blobPath,
  isHostedMedia,
  manifestPath,
  matchesMedia,
  mediaRedirects,
  readMediaFiles,
  readMediaManifest,
  root,
} from "./media.mjs";

const envPath = resolve(root, ".env.local");
if (existsSync(envPath)) process.loadEnvFile(envPath);
const manifest = await readMediaManifest();
const files = await readMediaFiles(resolve(root, "public"));
const vercelPath = resolve(root, "vercel.json");
const vercel = JSON.parse(await readFile(vercelPath, "utf8"));
const otherRedirects = (vercel.redirects ?? []).filter(
  ({ source }) => !isHostedMedia(source),
);
if (files.length + otherRedirects.length > 2048) {
  throw new Error(
    "Media redirects exceed Vercel's 2,048-rule limit. Split media routing before adding more files.",
  );
}
const changed = files.filter(
  (file) => !matchesMedia(file, manifest[file.path]),
);
if (changed.length && !process.env.BLOB_READ_WRITE_TOKEN) {
  throw new Error(
    "Set BLOB_READ_WRITE_TOKEN in .env.local or the environment to upload media.",
  );
}

for (const file of changed) {
  const pathname = blobPath(file);
  const blob = await head(pathname).catch(async (error) => {
    if (!(error instanceof BlobNotFoundError)) throw error;
    return put(pathname, await mediaContent(file), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: "video/mp4",
      cacheControlMaxAge: 31536000,
    });
  });
  manifest[file.path] = blob.url;
  // Checkpoint uploads so an interrupted sync resumes without re-uploading files.
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Synced ${file.path}`);
}

const current = Object.fromEntries(
  files.map(({ path }) => [path, manifest[path]]),
);
await writeFile(manifestPath, `${JSON.stringify(current, null, 2)}\n`);
vercel.redirects = [...mediaRedirects(current), ...otherRedirects];
await writeFile(vercelPath, `${JSON.stringify(vercel, null, 2)}\n`);
console.log(
  `Media ready: ${files.length} videos, ${changed.length} synced. Commit src/generated/media.json and vercel.json.`,
);
