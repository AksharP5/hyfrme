import { createHash } from "node:crypto";
import { cp, readFile, readdir, stat } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import { Readable } from "node:stream";
import {
  isHostedRegistry,
  readRegistrySource,
  registryContentType,
  registryOrigin,
  validateRegistry,
} from "./registry-hosting.mjs";

export const root = resolve(import.meta.dirname, "..");
export const manifestPath = resolve(root, "src/generated/media.json");
const encodingVersion = "h264-v1";

export function isHostedMedia(path) {
  return (
    /^\/previews\/.+\.mp4$/.test(path) || /^\/showcases\/[^/]+\.mp4$/.test(path)
  );
}

export async function readMediaFiles(publicDirectory) {
  const paths = (await readdir(publicDirectory, { recursive: true }))
    .map((path) => `/${path.split(sep).join("/")}`)
    .filter(isHostedMedia)
    .sort();
  const files = [];
  for (const path of paths) {
    const filename = resolve(publicDirectory, `.${path}`);
    const content = await readFile(filename);
    files.push({
      path,
      filename,
      size: content.byteLength,
      sha256: createHash("sha256").update(content).digest("hex"),
    });
  }
  return files;
}

export function blobPath(file) {
  const variant = shouldEncodeMedia(file) ? `${encodingVersion}/` : "";
  return `media/${variant}${file.sha256}${file.path}`;
}

export function shouldEncodeMedia(file) {
  return file.path.startsWith("/previews/") && file.size >= 5_000_000;
}

export async function readMediaManifest(path = manifestPath) {
  const manifest = JSON.parse(await readFile(path, "utf8"));
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new Error("Invalid media manifest. Run npm run sync:media.");
  }
  for (const [path, value] of Object.entries(manifest)) {
    if (!isHostedMedia(path) || typeof value !== "string") {
      throw new Error(`Invalid media manifest entry: ${path}`);
    }
    const url = new URL(value);
    const pathname = url.pathname.replace(
      /^\/media\/h264-v[1-9]\d*\//,
      "/media/",
    );
    const sha256 = pathname.split("/")[2];
    if (
      url.protocol !== "https:" ||
      !/^[a-z0-9]+\.public\.blob\.vercel-storage\.com$/.test(url.hostname) ||
      !/^[a-f0-9]{64}$/.test(sha256 ?? "") ||
      pathname !== `/media/${sha256}${path}` ||
      url.search ||
      url.hash ||
      url.username ||
      url.password ||
      url.port
    ) {
      throw new Error(`Invalid Blob URL for ${path}`);
    }
  }
  return manifest;
}

export function mediaRedirects(manifest) {
  return Object.entries(manifest).map(([source, url]) => ({
    source,
    destination: url,
    permanent: false,
  }));
}

export function matchesMedia(file, url) {
  return url?.endsWith(`/${blobPath(file)}`) ?? false;
}

export function unusedMedia(blobs, manifests, before) {
  if (manifests.some((manifest) => !Object.keys(manifest).length)) {
    throw new Error("Refusing to prune with an empty media manifest.");
  }
  const retained = new Set(manifests.flatMap(Object.values));
  if (!retained.size) throw new Error("No media manifests to retain.");
  const stores = new Set([...retained].map((url) => new URL(url).hostname));
  if (stores.size !== 1) {
    throw new Error("Retained media manifests must use the same Blob store.");
  }
  const available = new Set(blobs.map((blob) => blob.url));
  for (const url of retained) {
    if (!available.has(url)) {
      throw new Error(`Retained media is missing from this Blob store: ${url}`);
    }
  }
  const [store] = stores;
  return blobs.filter((blob) => {
    const url = new URL(blob.url);
    const match = blob.pathname.match(
      /^media\/(?:h264-v[1-9]\d*\/)?[a-f0-9]{64}(\/.+)$/,
    );
    return (
      url.hostname === store &&
      url.pathname === `/${blob.pathname}` &&
      match &&
      isHostedMedia(match[1]) &&
      !retained.has(blob.url) &&
      new Date(blob.uploadedAt).getTime() < before
    );
  });
}

export function validateMedia(files, manifest, redirects) {
  for (const file of files) {
    if (!matchesMedia(file, manifest[file.path])) {
      throw new Error(
        `Missing or outdated media: ${file.path}. Run npm run sync:media and commit the generated files.`,
      );
    }
  }
  if (Object.keys(manifest).length !== files.length) {
    throw new Error(
      "Media manifest contains removed files. Run npm run sync:media.",
    );
  }
  const actual = (redirects ?? []).filter(({ source }) =>
    isHostedMedia(source),
  );
  if (JSON.stringify(actual) !== JSON.stringify(mediaRedirects(manifest))) {
    throw new Error("Media redirects are outdated. Run npm run sync:media.");
  }
}

export async function copyPublicWithoutMedia(publicDirectory, outputDirectory) {
  await cp(publicDirectory, outputDirectory, {
    recursive: true,
    filter: async (source) => {
      const path = `/${relative(publicDirectory, source).split(sep).join("/")}`;
      if (isHostedRegistry(path)) return (await stat(source)).isDirectory();
      return !isHostedMedia(path) && !/^\/previews\/.+\.png$/.test(path);
    },
  });
}

export function hostedMedia() {
  let publicDirectory;
  let outputDirectory;
  return {
    name: "hosted-media",
    config: () => ({ build: { copyPublicDir: false } }),
    async configResolved(config) {
      if (config.command !== "build") return;
      publicDirectory = config.publicDir;
      outputDirectory = resolve(config.root, config.build.outDir);
      const files = await readMediaFiles(publicDirectory);
      const manifest = await readMediaManifest();
      const vercel = JSON.parse(
        await readFile(resolve(root, "vercel.json"), "utf8"),
      );
      validateMedia(files, manifest, vercel.redirects);
      await validateRegistry(
        resolve(publicDirectory, "registry"),
        await readRegistrySource(),
        vercel,
      );
    },
    async configurePreviewServer(server) {
      const manifest = await readMediaManifest();
      const registrySource = await readRegistrySource();
      server.middlewares.use((request, response, next) => {
        const path = new URL(request.url, "http://localhost").pathname;
        const destination = manifest[path];
        if (destination) {
          response.writeHead(307, { Location: destination });
          response.end();
          return;
        }
        if (!isHostedRegistry(path)) return next();
        fetch(
          `${registryOrigin(registrySource)}${path.slice("/registry".length)}`,
          {
            method: request.method,
            headers: {
              "Accept-Encoding": "identity",
              ...(request.headers.range
                ? { Range: request.headers.range }
                : {}),
            },
          },
        )
          .then((upstream) => {
            const headers = {
              "Content-Type": registryContentType(path),
              "Cache-Control": "public, max-age=0, must-revalidate",
            };
            for (const name of ["Content-Range", "Accept-Ranges"]) {
              const value = upstream.headers.get(name);
              if (value) headers[name] = value;
            }
            if (!upstream.headers.has("Content-Encoding")) {
              const length = upstream.headers.get("Content-Length");
              if (length) headers["Content-Length"] = length;
            }
            response.writeHead(upstream.status, headers);
            if (!upstream.body) return response.end();
            Readable.fromWeb(upstream.body)
              .on("error", (error) => response.destroy(error))
              .pipe(response);
          })
          .catch(next);
      });
    },
    async writeBundle() {
      await copyPublicWithoutMedia(publicDirectory, outputDirectory);
    },
  };
}
