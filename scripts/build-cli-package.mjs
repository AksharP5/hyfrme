import { execFile } from "node:child_process";
import { rm, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);
const root = resolve(import.meta.dirname, "..");
const destination = resolve(root, "public", "cli.tgz");

await rm(destination, { force: true });
const { stdout } = await exec(
  "npm",
  [
    "pack",
    resolve(root, "cli"),
    "--pack-destination",
    resolve(root, "public"),
    "--json",
  ],
  { cwd: root },
);
const [packed] = JSON.parse(stdout);
if (!packed?.filename) throw new Error("npm pack did not return a filename");
await rename(resolve(root, "public", packed.filename), destination);
console.log(`Built ${relativePath(destination)} (${packed.size} bytes).`);

function relativePath(path) {
  return path.slice(root.length + 1);
}
