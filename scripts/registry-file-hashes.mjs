import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export async function registryFileHashes(directory) {
  const registry = JSON.parse(
    await readFile(resolve(directory, "registry.json"), "utf8"),
  );
  const hashes = {};
  for (const name of registry.items.map((item) => item.name).sort()) {
    const itemDirectory = resolve(directory, "blocks", name);
    const item = JSON.parse(
      await readFile(resolve(itemDirectory, "registry-item.json"), "utf8"),
    );
    for (const path of item.files.map((file) => file.path).sort()) {
      hashes[`blocks/${name}/${path}`] = createHash("sha256")
        .update(await readFile(resolve(itemDirectory, path)))
        .digest("hex");
    }
  }
  return hashes;
}

export async function syncRegistryFileHashes(
  directory,
  { check = false } = {},
) {
  const hashes = await registryFileHashes(directory);
  const path = resolve(directory, "file-hashes.json");
  const content = `${JSON.stringify(hashes, null, 2)}\n`;
  if (check) {
    const current = await readFile(path, "utf8").catch((error) => {
      if (error.code === "ENOENT") return undefined;
      throw error;
    });
    if (current !== content) {
      throw new Error(
        "Registry file hashes are outdated. Run npm run sync:registry.",
      );
    }
  } else {
    await writeFile(path, content);
  }
  return hashes;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const check = process.argv.includes("--check");
  const hashes = await syncRegistryFileHashes(
    resolve(import.meta.dirname, "../registry"),
    { check },
  );
  console.log(
    `${check ? "Checked" : "Generated"} hashes for ${Object.keys(hashes).length} registry files.`,
  );
}
