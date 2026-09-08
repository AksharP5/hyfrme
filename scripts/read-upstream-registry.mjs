import { readdir, readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";

export async function readUpstreamRegistry(sourceRoot) {
  const registryRoot = resolve(sourceRoot, "registry");
  const rootManifest = JSON.parse(
    await readFile(resolve(sourceRoot, "registry.json"), "utf8"),
  );
  const directories = await readdir(registryRoot, { withFileTypes: true });
  const discoveredPaths = directories
    .filter((entry) => entry.isDirectory())
    .map((entry) => resolve(registryRoot, entry.name, "registry.json"))
    .sort();
  const declaredPaths = (rootManifest.include ?? [])
    .filter((path) => path.endsWith("/registry.json"))
    .map((path) => resolve(sourceRoot, path));
  const declared = new Set(declaredPaths);
  const registryPaths = [
    ...declaredPaths,
    ...discoveredPaths.filter((path) => !declared.has(path)),
  ];
  const manifests = await Promise.all(
    registryPaths.map(async (path) => {
      const manifest = await readFile(path, "utf8")
        .then(JSON.parse)
        .catch((error) => {
          if (error?.code === "ENOENT") return null;
          throw error;
        });
      if (!manifest) return [];

      const prefix = relative(sourceRoot, dirname(path)).replaceAll("\\", "/");
      return (manifest.items ?? []).map((item) => ({
        ...item,
        files: (item.files ?? []).map((file) => ({
          ...file,
          path: file.path.startsWith("registry/")
            ? file.path
            : `${prefix}/${file.path}`,
        })),
      }));
    }),
  );
  const items = manifests.flat();
  if (items.length === 0) {
    throw new Error(`No source registry items found in ${registryRoot}.`);
  }

  return { items };
}
