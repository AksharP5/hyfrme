import { cp, mkdir, rm } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";
import { syncRegistryFileHashes } from "./registry-file-hashes.mjs";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "registry");
const destination = resolve(root, "public", "registry");

await syncRegistryFileHashes(source);
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(source, destination, {
  recursive: true,
  mode: constants.COPYFILE_FICLONE,
});

console.log("Synced registry/ to public/registry/");
