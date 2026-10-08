import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { extname, relative, resolve, sep } from "node:path";

export const registrySourcePath = resolve(
  import.meta.dirname,
  "../src/generated/registry-source.json",
);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".mp4": "video/mp4",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".glb": "model/gltf-binary",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
};

export function isHostedRegistry(path) {
  return path.startsWith("/registry/") && !path.endsWith("/catalog.json");
}

export function registryContentType(path) {
  return contentTypes[extname(path)] ?? "application/octet-stream";
}

export async function registryFingerprint(directory) {
  const entries = await readdir(directory, {
    recursive: true,
    withFileTypes: true,
  });
  if (entries.some((entry) => entry.isSymbolicLink())) {
    throw new Error("Registry files must not contain symbolic links.");
  }
  const paths = entries
    .filter((entry) => entry.isFile() && entry.name !== "catalog.json")
    .map((entry) => resolve(entry.parentPath, entry.name))
    .sort();
  const hash = createHash("sha256");
  for (const path of paths) {
    const name = relative(directory, path).split(sep).join("/");
    const contentHash = createHash("sha256")
      .update(await readFile(path))
      .digest("hex");
    hash.update(`${name}\0${contentHash}\n`);
  }
  return hash.digest("hex");
}

export async function readRegistrySource(path = registrySourcePath) {
  const source = JSON.parse(await readFile(path, "utf8"));
  if (
    !/^[a-f0-9]{40}$/.test(source?.commit) ||
    !/^[a-f0-9]{64}$/.test(source?.sha256)
  ) {
    throw new Error("Invalid registry source pin. Run npm run pin:registry.");
  }
  return source;
}

export function registryOrigin(source) {
  return `https://raw.githubusercontent.com/AksharP5/hyfrme/${source.commit}/registry`;
}

export function registryRewrite(source) {
  return {
    source: "/registry/:path*",
    destination: `${registryOrigin(source)}/:path*`,
  };
}

export function registryHeaders(source) {
  return [
    {
      source: "/registry/:path*",
      headers: [
        { key: "Content-Type", value: "application/octet-stream" },
        { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        { key: "Vercel-CDN-Cache-Control", value: "public, max-age=86400" },
        { key: "x-vercel-enable-rewrite-caching", value: "1" },
        { key: "Vercel-Cache-Tag", value: `hyfrme-registry-${source.commit}` },
        { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
      ],
    },
    ...Object.entries(contentTypes).map(([extension, value]) => ({
      source: `/registry/:path(.*\\${extension})`,
      headers: [{ key: "Content-Type", value }],
    })),
  ];
}

export async function validateRegistry(directory, source, vercel) {
  if ((await registryFingerprint(directory)) !== source.sha256) {
    throw new Error(
      "Registry source pin is outdated. Commit and push registry changes, then run npm run pin:registry -- <reviewed-commit>.",
    );
  }
  const rewrites = (vercel.rewrites ?? []).filter(({ source }) =>
    source.startsWith("/registry/"),
  );
  const headers = (vercel.headers ?? []).filter(({ source }) =>
    source.startsWith("/registry/"),
  );
  if (
    JSON.stringify(rewrites) !== JSON.stringify([registryRewrite(source)]) ||
    JSON.stringify(headers) !== JSON.stringify(registryHeaders(source))
  ) {
    throw new Error("Registry routing is outdated. Run npm run pin:registry.");
  }
}
