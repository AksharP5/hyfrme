import { readFile, readdir } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";

// The generated registry can lag published components. Read its authored inputs.
export async function readRemocnRegistry(sourceRoot) {
  const registry = JSON.parse(
    await readFile(resolve(sourceRoot, "registry.json"), "utf8"),
  );
  const registryRoot = resolve(sourceRoot, "registry");
  const directories = await readdir(registryRoot, { withFileTypes: true });
  const declared = (registry.include ?? [])
    .filter((path) => path.endsWith("/registry.json"))
    .map((path) => resolve(sourceRoot, path));
  const discovered = directories
    .filter((entry) => entry.isDirectory())
    .map((entry) => resolve(registryRoot, entry.name, "registry.json"))
    .sort();
  const declaredPaths = new Set(declared);
  const families = await Promise.all(
    [...new Set([...declared, ...discovered])].map(async (path) => {
      const family = await readFile(path, "utf8")
        .then(JSON.parse)
        .catch((error) => {
          if (error.code === "ENOENT" && !declaredPaths.has(path)) return null;
          throw error;
        });
      if (!family) return [];
      const prefix = relative(sourceRoot, dirname(path)).replaceAll("\\", "/");
      return (family.items ?? []).map((item) => ({
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
  const items = new Map(
    [...(registry.items ?? []), ...families.flat()].map((item) => [
      item.name,
      item,
    ]),
  );
  if (!items.size)
    throw new Error(`No source registry items found in ${registryRoot}.`);
  return { ...registry, items: [...items.values()] };
}
