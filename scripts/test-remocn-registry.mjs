import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { readRemocnRegistry } from "./remocn-registry.mjs";

const root = await mkdtemp(resolve(tmpdir(), "hyfrme-registry-"));
const write = async (path, value) => {
  const file = resolve(root, path);
  await mkdir(resolve(file, ".."), { recursive: true });
  await writeFile(file, JSON.stringify(value));
};
try {
  await write("registry.json", {
    include: ["registry/text/registry.json"],
    items: [
      { name: "root-only", files: [{ path: "registry/root-only.tsx" }] },
      { name: "text", files: [{ path: "stale-generated-path.tsx" }] },
    ],
  });
  await write("registry/text/registry.json", {
    items: [{ name: "text", files: [{ path: "text/index.tsx" }] }],
  });
  await write("registry/ui/registry.json", {
    items: [
      { name: "select", files: [{ path: "registry/ui/select/index.tsx" }] },
    ],
  });
  const registry = await readRemocnRegistry(root);
  assert.deepEqual(
    registry.items.map((item) => [item.name, item.files[0].path]),
    [
      ["root-only", "registry/root-only.tsx"],
      ["text", "registry/text/text/index.tsx"],
      ["select", "registry/ui/select/index.tsx"],
    ],
  );
  await rm(resolve(root, "registry/text/registry.json"));
  await assert.rejects(readRemocnRegistry(root), { code: "ENOENT" });
} finally {
  await rm(root, { recursive: true, force: true });
}
console.log(
  "Remocn registry preserves root items and discovers authored families.",
);
