import { spawnSync } from "node:child_process";
import {
  copyFile,
  lstat,
  mkdir,
  readFile,
  readlink,
  symlink,
} from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const { upstream } = JSON.parse(
  await readFile(
    resolve(
      root,
      process.env.REMOCN_ASSET_MANIFEST ??
        "assets/remocn-additions/manifest.json",
    ),
    "utf8",
  ),
);
const source = resolve(
  root,
  process.env.REMOCN_SOURCE ?? `.work/remocn-${upstream.commit}`,
);
const dependencies = resolve(
  root,
  process.env.REMOCN_DEPENDENCIES ?? ".work/remocn-latest-deps",
);
const run = (command, args, cwd = root) => {
  const result = spawnSync(command, args, {
    cwd,
    stdio: ["ignore", "pipe", "inherit"],
    encoding: "utf8",
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`${command} exited ${result.status}`);
  return result.stdout.trim();
};
const exists = (path) =>
  lstat(path).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });

if (!(await exists(source))) {
  await mkdir(source, { recursive: true });
  run("git", ["init"], source);
  run("git", ["remote", "add", "origin", upstream.repository], source);
  run("git", ["fetch", "--depth", "1", "origin", upstream.commit], source);
  run("git", ["checkout", "--detach", "FETCH_HEAD"], source);
}
if (run("git", ["rev-parse", "HEAD"], source) !== upstream.commit) {
  throw new Error(`Existing Remocn checkout does not match ${upstream.commit}`);
}
if (run("git", ["status", "--porcelain", "--untracked-files=no"], source)) {
  throw new Error("Existing Remocn checkout has modified tracked files");
}
const nodeModules = resolve(source, "node_modules");
const target = resolve(dependencies, "node_modules");
const existing = await exists(nodeModules);
if (
  existing &&
  (!existing.isSymbolicLink() ||
    resolve(dirname(nodeModules), await readlink(nodeModules)) !== target)
) {
  throw new Error(
    `Existing ${nodeModules} belongs to another dependency install; choose a fresh checkout or matching REMOCN_DEPENDENCIES.`,
  );
}
await mkdir(dependencies, { recursive: true });
for (const file of ["package.json", "package-lock.json"]) {
  await copyFile(
    resolve(root, "fixtures/remocn-latest", file),
    resolve(dependencies, file),
  );
}
run("npm", ["ci", "--no-audit", "--no-fund"], dependencies);
if (!existing)
  await symlink(relative(dirname(nodeModules), target), nodeModules, "dir");
console.log(
  `Pinned Remocn checkout and reference dependencies ready: ${source}`,
);
console.log(
  `Use REMOCN_SOURCE=${relative(root, source)} with --lossless verification.`,
);
