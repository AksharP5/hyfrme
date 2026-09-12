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
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { mediaContent } from "./encode-media.mjs";
import { frameRateArgument } from "./frame-rate.mjs";
import {
  blobPath,
  copyPublicWithoutMedia,
  hostedMedia,
  mediaRedirects,
  readMediaFiles,
  readMediaManifest,
  validateMedia,
} from "./media.mjs";

test("render and encoder arguments preserve exact source frame rates", () => {
  assert.equal(frameRateArgument(60), "60");
  assert.equal(frameRateArgument(60000 / 1001), "60000/1001");
  for (const fps of [59.94, 0, Infinity, NaN]) {
    assert.throws(() => frameRateArgument(fps), /Unsupported frame rate/);
  }
});

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

test("production preview redirects video requests and serves other assets normally", async (t) => {
  const manifest = await readMediaManifest();
  const path = Object.keys(manifest)[0];
  let middleware;
  await hostedMedia().configurePreviewServer({
    middlewares: {
      use: (handler) => {
        middleware = handler;
      },
    },
  });
  const server = createServer((request, response) => {
    middleware(request, response, () => {
      response.writeHead(200, { "Content-Type": "text/plain" });
      response.end("static asset");
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const video = await fetch(`${origin}${path}?v=preview`, {
    method: "HEAD",
    redirect: "manual",
    headers: { Range: "bytes=0-1" },
  });
  assert.equal(video.status, 307);
  assert.equal(video.headers.get("location"), manifest[path]);
  assert.equal(
    await (await fetch(`${origin}/registry/block.html`)).text(),
    "static asset",
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

test("large preview derivatives remain tied to the original render and encoding recipe", async (t) => {
  const { directory, publicDirectory, manifest } = await fixture(t);
  const originalPath = resolve(
    publicDirectory,
    "previews/demo/hyperframes.mp4",
  );
  await writeFile(originalPath, Buffer.alloc(5_000_000));
  const files = await readMediaFiles(publicDirectory);
  const preview = files.find((file) => file.path.startsWith("/previews/"));
  const originalUrl = `https://test.public.blob.vercel-storage.com/media/${preview.sha256}${preview.path}`;
  manifest[preview.path] = originalUrl;
  assert.throws(
    () => validateMedia(files, manifest, mediaRedirects(manifest)),
    /outdated media/,
  );
  manifest[preview.path] =
    `https://test.public.blob.vercel-storage.com/${blobPath(preview)}`;
  const manifestFile = resolve(directory, "media.json");
  await writeFile(manifestFile, JSON.stringify(manifest));
  const parsed = await readMediaManifest(manifestFile);
  validateMedia(files, parsed, mediaRedirects(parsed));
  await writeFile(originalPath, Buffer.alloc(5_000_000, 1));
  const changed = await readMediaFiles(publicDirectory);
  assert.throws(
    () => validateMedia(changed, parsed, mediaRedirects(parsed)),
    /outdated media/,
  );
  assert.throws(
    () =>
      validateMedia(
        files,
        {
          ...parsed,
          [preview.path]: originalUrl.replace("/media/", "/media/h264-v2/"),
        },
        mediaRedirects(parsed),
      ),
    /outdated media/,
  );

  const otherVersion = {
    ...parsed,
    [preview.path]: originalUrl.replace("/media/", "/media/h264-v2/"),
  };
  await writeFile(manifestFile, JSON.stringify(otherVersion));
  assert.deepEqual(await readMediaManifest(manifestFile), otherVersion);

  const showcase = files.find((file) => file.path.startsWith("/showcases/"));
  assert.deepEqual(
    await mediaContent(showcase),
    await readFile(showcase.filename),
  );
});
