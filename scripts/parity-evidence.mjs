import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";

export async function hashBlockFiles(directory, manifest) {
  return Object.fromEntries(
    await Promise.all(
      ["registry-item.json", ...manifest.files.map((file) => file.path)].map(
        async (path) => [
          path,
          createHash("sha256")
            .update(await readFile(resolve(directory, path)))
            .digest("hex"),
        ],
      ),
    ),
  );
}

export async function assertVerifiedBlockFiles(directory, manifest, recorded) {
  const actual = await hashBlockFiles(directory, manifest);
  if (!isDeepStrictEqual(actual, recorded))
    throw new Error(
      `${manifest.name}: installed source changed after verification`,
    );
}

export async function assertExactFrameHashes(reference, port, fixture) {
  const hashes = await Promise.all(
    [reference, port].map(async (path) => {
      const rows = (await readFile(path, "utf8"))
        .split("\n")
        .filter((line) => line.trim() && !line.startsWith("#"))
        .map((line) => line.split(",").map((field) => field.trim()));
      if (
        rows.length !== fixture.frameCount ||
        rows.some(
          (row) =>
            row.length !== 6 ||
            row[0] !== "0" ||
            Number(row[4]) !== fixture.width * fixture.height * 4 ||
            !/^(?:[a-f0-9]{32}|[a-f0-9]{64})$/.test(row[5]),
        )
      )
        throw new Error(`${path}: incomplete or invalid RGBA frame hashes`);
      return rows.map((row) => row[5]);
    }),
  );
  if (!isDeepStrictEqual(hashes[0], hashes[1]))
    throw new Error(`${port}: decoded RGBA frames differ from upstream`);
}
