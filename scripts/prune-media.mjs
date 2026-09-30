import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { del, list } from "@vercel/blob";
import { readMediaManifest, root, unusedMedia } from "./media.mjs";

const { values } = parseArgs({
  options: {
    delete: { type: "boolean", default: false },
    keep: { type: "string", multiple: true, default: [] },
  },
});
const envPath = resolve(root, ".env.local");
if (existsSync(envPath)) process.loadEnvFile(envPath);
const manifests = await Promise.all([
  readMediaManifest(),
  ...values.keep.map((path) => readMediaManifest(resolve(path))),
]);

const blobs = [];
let cursor;
do {
  const page = await list({ prefix: "media/", limit: 1000, cursor });
  blobs.push(...page.blobs);
  cursor = page.hasMore ? page.cursor : undefined;
} while (cursor);

const before = Date.now() - 14 * 24 * 60 * 60 * 1000;
const unused = unusedMedia(blobs, manifests, before);
const bytes = unused.reduce((total, blob) => total + blob.size, 0);
for (const blob of unused) {
  console.log(`${blob.pathname} ${(blob.size / 1e6).toFixed(2)} MB`);
}
console.log(
  `${values.delete ? "Deleting" : "Would delete"} ${unused.length} unused videos, ${(bytes / 1e6).toFixed(2)} MB. Retaining referenced videos and uploads from the last 14 days.`,
);
if (!values.delete) {
  console.log("Dry run. Pass --delete to remove these files after deployment.");
  process.exit(0);
}
for (let offset = 0; offset < unused.length; offset += 100) {
  await del(unused.slice(offset, offset + 100).map((blob) => blob.url));
}
console.log("Media cleanup complete.");
