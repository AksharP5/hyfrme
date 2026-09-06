import { createHash } from "node:crypto";
import { cp, readFile, readdir } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";

export const root = resolve(import.meta.dirname, "..");
export const manifestPath = resolve(root, "src/generated/media.json");

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
      sha256: createHash("sha256").update(content).digest("hex"),
    });
  }
  return files;
}

export function blobPath(file) {
  return `media/${file.sha256}${file.path}`;
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
    const sha256 = url.pathname.split("/")[2];
    if (
      url.protocol !== "https:" ||
      !/^[a-z0-9]+\.public\.blob\.vercel-storage\.com$/.test(url.hostname) ||
      !/^[a-f0-9]{64}$/.test(sha256 ?? "") ||
      url.pathname !== `/${blobPath({ path, sha256 })}` ||
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
    filter: (source) =>
      !isHostedMedia(
        `/${relative(publicDirectory, source).split(sep).join("/")}`,
      ),
  });
}

export function hostedMedia() {
  let publicDirectory;
  let outputDirectory;
  return {
    name: "hosted-media",
    apply: "build",
    config: () => ({ build: { copyPublicDir: false } }),
    async configResolved(config) {
      publicDirectory = config.publicDir;
      outputDirectory = resolve(config.root, config.build.outDir);
      const files = await readMediaFiles(publicDirectory);
      const manifest = await readMediaManifest();
      const vercel = JSON.parse(
        await readFile(resolve(root, "vercel.json"), "utf8"),
      );
      validateMedia(files, manifest, vercel.redirects);
    },
    async writeBundle() {
      await copyPublicWithoutMedia(publicDirectory, outputDirectory);
    },
  };
}
