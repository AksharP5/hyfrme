import { spawnSync } from "node:child_process";
import { copyFile, mkdir, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { snapcnSources } from "./run-snapcn.mjs";

const root = resolve(import.meta.dirname, "..");
const dependencies = resolve(root, ".work/snapcn-deps");
const run = (command, args, cwd = root) => {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`${command} exited ${result.status}`);
};
for (const { repository, commit, directory: source } of await snapcnSources()) {
  const exists = await stat(source)
    .then(() => true)
    .catch((error) => {
      if (error.code === "ENOENT") return false;
      throw error;
    });
  if (!exists) {
    await mkdir(source, { recursive: true });
    run("git", ["init"], source);
    run("git", ["remote", "add", "origin", repository], source);
    run("git", ["fetch", "--depth", "1", "origin", commit], source);
    run("git", ["checkout", "--detach", "FETCH_HEAD"], source);
  }
}
await mkdir(dependencies, { recursive: true });
for (const file of ["package.json", "package-lock.json"]) {
  await copyFile(
    resolve(root, "fixtures/snapcn", file),
    resolve(dependencies, file),
  );
}
run("npm", ["ci", "--no-audit", "--no-fund"], dependencies);
console.log(
  "Snapcn reference dependencies installed. Generators verify the source pin before use.",
);
