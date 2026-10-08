import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  registryFingerprint,
  registryHeaders,
  registryOrigin,
  registryRewrite,
  registrySourcePath,
} from "./registry-hosting.mjs";

const root = resolve(import.meta.dirname, "..");
const commit =
  process.argv[2] ??
  execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  }).trim();
if (!/^[a-f0-9]{40}$/.test(commit)) {
  throw new Error("Pass the full reviewed commit SHA.");
}
execFileSync("git", ["diff", "--exit-code", commit, "--", "registry"], {
  cwd: root,
  stdio: "ignore",
});
if (
  execFileSync("git", ["ls-files", "--others", "registry"], {
    cwd: root,
    encoding: "utf8",
  }).trim()
) {
  throw new Error("Commit all registry files before pinning the source.");
}
const source = {
  commit,
  sha256: await registryFingerprint(resolve(root, "registry")),
};
const published = await fetch(`${registryOrigin(source)}/registry.json`);
if (!published.ok) {
  throw new Error(
    `Registry commit is not public on GitHub: HTTP ${published.status}. Push it before pinning.`,
  );
}
const expected = await readFile(resolve(root, "registry/registry.json"));
if (!Buffer.from(await published.arrayBuffer()).equals(expected)) {
  throw new Error(
    "Published registry manifest does not match the reviewed checkout.",
  );
}
const path = resolve(root, "vercel.json");
const vercel = JSON.parse(await readFile(path, "utf8"));
vercel.rewrites = [
  registryRewrite(source),
  ...(vercel.rewrites ?? []).filter(
    ({ source }) => !source.startsWith("/registry/"),
  ),
];
vercel.headers = [
  registryHeaders(source),
  (vercel.headers ?? []).filter(
    ({ source }) => !source.startsWith("/registry/"),
  ),
].flat();
await writeFile(registrySourcePath, `${JSON.stringify(source, null, 2)}\n`);
await writeFile(path, `${JSON.stringify(vercel, null, 2)}\n`);
console.log(
  `Registry pinned to ${commit}. Commit src/generated/registry-source.json and vercel.json.`,
);
