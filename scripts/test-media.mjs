import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import test from "node:test";
import {
  blobPath,
  copyPublicWithoutMedia,
  mediaRedirects,
  readMediaFiles,
  readMediaManifest,
  validateMedia,
} from "./media.mjs";

async function fixture(t) {
  const directory = await mkdtemp(resolve(tmpdir(), "hyfrme-media-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const publicDirectory = resolve(directory, "public");
  for (const path of [
    "previews/demo/hyperframes.mp4",
    "previews/demo/thumbnail.png",
    "showcases/demo.mp4",
    "showcases/demo/asset.mp4",
    "registry/blocks/demo/asset.mp4",
    "cli.tgz",
  ]) {
    const target = resolve(publicDirectory, path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, path);
  }
  const files = await readMediaFiles(publicDirectory);
  const manifest = Object.fromEntries(
    files.map((file) => [
      file.path,
      `https://test.public.blob.vercel-storage.com/${blobPath(file)}`,
    ]),
  );
  return { directory, publicDirectory, files, manifest };
}

test("production requires uploaded current media and matching legacy redirects", async (t) => {
  const { files, manifest, publicDirectory } = await fixture(t);
  const redirects = mediaRedirects(manifest);
  validateMedia(files, manifest, redirects);
  assert.throws(
    () => validateMedia(files, {}, []),
    /Missing or outdated media/,
  );
  await writeFile(
    resolve(publicDirectory, "previews/demo/hyperframes.mp4"),
    "new render",
  );
  assert.throws(
    () => validateMedia(files, manifest, []),
    /redirects are outdated/,
  );
  assert.throws(
    () => validateMedia(files.slice(1), manifest, redirects),
    /removed files/,
  );
  const changed = await readMediaFiles(publicDirectory);
  assert.throws(
    () => validateMedia(changed, manifest, redirects),
    /Missing or outdated media/,
  );
});

test("production omits only catalog videos and preserves installable assets and source", async (t) => {
  const { directory, publicDirectory, files } = await fixture(t);
  assert.deepEqual(
    files.map(({ path }) => path),
    ["/previews/demo/hyperframes.mp4", "/showcases/demo.mp4"],
  );
  const output = resolve(directory, "dist");
  await copyPublicWithoutMedia(publicDirectory, output);
  const emitted = await readdir(output, { recursive: true });
  assert(!emitted.includes("previews/demo/hyperframes.mp4"));
  assert(!emitted.includes("showcases/demo.mp4"));
  for (const path of [
    "registry/blocks/demo/asset.mp4",
    "showcases/demo/asset.mp4",
    "previews/demo/thumbnail.png",
    "cli.tgz",
  ]) {
    assert.equal(await readFile(resolve(output, path), "utf8"), path);
  }
  assert.equal(
    await readFile(files[0].filename, "utf8"),
    "previews/demo/hyperframes.mp4",
  );
});

test("manifest accepts only public immutable Blob URLs matching the file hash", async (t) => {
  const { directory, manifest } = await fixture(t);
  const path = resolve(directory, "media.json");
  await writeFile(path, JSON.stringify(manifest));
  assert.deepEqual(await readMediaManifest(path), manifest);
  manifest["/showcases/demo.mp4"] = "https://example.com/video.mp4";
  await writeFile(path, JSON.stringify(manifest));
  await assert.rejects(readMediaManifest(path), /Invalid Blob URL/);
  manifest["/showcases/demo.mp4"] =
    `https://test.public.blob.vercel-storage.com/media/wrong/showcases/demo.mp4`;
  await writeFile(path, JSON.stringify(manifest));
  await assert.rejects(readMediaManifest(path), /Invalid Blob URL/);
});
