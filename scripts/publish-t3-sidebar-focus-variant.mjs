import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { resolve, isAbsolute, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { ideas } from "../parity/t3-gallery/data.js";
import { galleryNativeAuthority } from "./sync-t3-gallery-fixtures.mjs";

const root = resolve(import.meta.dirname, "..");
const slug = "t3-sidebar-focus";
const variant = "settingsEnabled200";
const args = process.argv.slice(2);
if (![1, 2].includes(args.length) || (args[1] && args[1] !== "--publish")) throw new Error("Usage: node scripts/publish-t3-sidebar-focus-variant.mjs <isolation> [--publish]");
const isolated = resolve(root, args[0]);
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const json = async path => JSON.parse(await readFile(path, "utf8"));
for (const file of ["verify-t3-catalog-ports.mjs", "publish-t3-catalog-parity.mjs", "t3-capture-images.mjs", "parity-evidence.mjs", "hyperframes-variables.mjs"]) {
  assert.equal(hash(await readFile(resolve(isolated, "scripts", file))), hash(await readFile(resolve(root, "scripts", file))), `${file}: isolated engine is stale`);
}
const publisher = await import(pathToFileURL(resolve(isolated, "scripts/publish-t3-catalog-parity.mjs")));
const [entry] = await publisher.prepareT3CatalogPublication(["--only", slug]);
for (const { proof } of entry.entries) assert.equal(proof.values.transitionMs, 200, "Variant proof must use transitionMs=200");
const pending = [];
for (const block of new Set(ideas.map(idea => idea.block))) {
  const parity = await json(resolve(root, `parity/${block}.json`));
  if (parity.status !== "verified" || parity.measurement !== "lossless-png" ||
      parity.result?.pass !== true || parity.result.frameCount !== 120 ||
      parity.result.rgba?.pass !== true || parity.result.rgba.frameCount !== 120 ||
      parity.checks?.installedThroughCli !== true || parity.checks.strictRender !== true ||
      !Object.keys(parity.inputHashes ?? {}).length || !Object.keys(parity.filesSha256 ?? {}).length) pending.push(block);
}
console.log(JSON.stringify({ variant, exactFrames: 240, pendingDefaultPublication: pending, writes: 0 }, null, 2));
if (!args.includes("--publish")) process.exit(0);
assert.equal(pending.length, 0, "Publish all canonical default ports before binding this variant");
for (const block of new Set(ideas.map(idea => idea.block))) await galleryNativeAuthority({ block });
const canonicalPath = resolve(root, `parity/${slug}.json`);
const original = await readFile(canonicalPath);
const defaults = JSON.parse(original);
assert.equal(defaults.fixture.compositionSha256, entry.entries[0].proof.filesSha256[entry.composition.path], "Default proof must match variant source");
const published = spawnSync(process.execPath, [resolve(isolated, "scripts/publish-t3-catalog-parity.mjs"), "--only", slug], { cwd: isolated, stdio: "inherit" });
if (published.status !== 0) throw new Error("Isolated variant publication failed");
const record = await json(resolve(isolated, `parity/${slug}.json`));
const archive = `parity/t3-catalog-variants/${slug}/${variant}`;
const media = `public/previews/${slug}`;
try {
  await stat(resolve(root, archive));
  throw new Error("Variant archive already exists; preserve it and select a new version before publishing");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
await mkdir(resolve(root, archive), { recursive: true });
await mkdir(resolve(root, media), { recursive: true });
const relocate = path => path.startsWith(`parity/t3-catalog/${slug}/`) ? path.replace(`parity/t3-catalog/${slug}`, archive) : path.startsWith(`public/previews/${slug}/`) ? path.replace(/(reference|hyperframes|thumbnail)(-light)?\.(mp4|png)$/, "$1-settings-enabled$2.$3") : path;
for (const theme of ["dark", "light"]) {
  const directory = `parity/t3-catalog/${slug}/${theme}`;
  await mkdir(resolve(root, archive, theme), { recursive: true });
  for (const file of await readdir(resolve(isolated, directory))) await copyFile(resolve(isolated, directory, file), resolve(root, archive, theme, file));
}
for (const file of await readdir(resolve(isolated, `public/previews/${slug}`))) await copyFile(resolve(isolated, `public/previews/${slug}`, file), resolve(root, relocate(`public/previews/${slug}/${file}`)));
for (const { theme, proof, inputHashes, artifactHashes } of entry.entries) {
  const inputs = Object.fromEntries(Object.entries(inputHashes).map(([path, sha]) => [relocate(path), sha]));
  for (const [path, expected] of Object.entries(inputs)) {
    assert.ok(!isAbsolute(path) && resolve(root, path).startsWith(root + sep), "Variant evidence must stay within repository");
    assert.equal(hash(await readFile(resolve(root, path))), expected, `Variant input changed: ${path}`);
  }
  const { settingsEnabled200, historicalCustomizationEvidence, ...current } = record.themes[theme];
  defaults.themes[theme][variant] = {
    ...current,
    measurementContract: "Current installed CLI full check and strict 120-frame lossless PNG render; exact native RGBA and SSIM 1",
    fingerprint: proof.fingerprint,
    checks: record.checks,
    filesSha256: proof.filesSha256,
    inputHashes: inputs,
    artifactHashes: Object.fromEntries(Object.entries({ ...artifactHashes, ...record.artifactHashes }).map(([path, sha]) => [relocate(path), sha])),
    artifacts: Object.fromEntries(Object.entries(record.themes[theme].artifacts).map(([key, path]) => [key, relocate(path)])),
  };
}
await writeFile(resolve(root, archive, "publication.json"), JSON.stringify({ ...record, archiveNote: "Raw proofs retain original isolated repository-relative capture paths and unchanged fingerprints; canonical variant binding relocates portable proof/media paths only." }, null, 2) + "\n");
assert.equal(hash(await readFile(canonicalPath)), hash(original), "Default publication changed during variant binding");
await writeFile(canonicalPath, JSON.stringify(defaults, null, 2) + "\n");
console.log("Bound settingsEnabled200; default proofs and media preserved.");
