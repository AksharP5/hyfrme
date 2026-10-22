import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const inventory = JSON.parse(
  await readFile(resolve(root, "catalog/hyperframes-upstream.json"), "utf8"),
);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const fontFamilies = [
  { font: /\/Caveat-[^/]+\.woff2$/i, notices: ["Caveat-OFL.txt"] },
  {
    font: /\/BarlowCondensed-[^/]+\.woff2$/i,
    notices: ["BarlowCondensed-OFL.txt"],
  },
  { font: /\/courier-prime-[^/]+\.woff2$/i, notices: ["CourierPrime-OFL.txt"] },
  {
    font: /\/permanent-marker-[^/]+\.woff2$/i,
    notices: ["PermanentMarker-LICENSE.txt", "PermanentMarker-NOTICE.txt"],
  },
];

test("bundled native fonts install their notices with pinned provenance", async () => {
  const coveredFamilies = new Set();
  for (const item of inventory.items) {
    const families = fontFamilies.filter(({ font }) =>
      item.files.some((file) => font.test(file.path)),
    );
    if (!families.length) continue;
    const directory = resolve(root, "registry/blocks", item.name);
    const manifest = JSON.parse(
      await readFile(resolve(directory, "registry-item.json"), "utf8"),
    );
    for (const family of families) {
      coveredFamilies.add(family);
      for (const name of family.notices) {
        const path = `licenses/${name}`;
        const label = `${item.name}: ${name}`;
        const declared = manifest.files.filter((file) => file.path === path);
        assert.equal(declared.length, 1, `${label} must be installed once`);
        assert.deepEqual(declared[0], {
          path,
          target: `THIRD_PARTY_LICENSES/hyperframes/fonts/${name}`,
          type: "hyperframes:asset",
        });
        const record = item.files.find((file) => file.path === path);
        assert.ok(record, `${label} must have import evidence`);
        assert.equal(
          record.source.repository,
          "https://github.com/google/fonts",
        );
        assert.equal(
          record.source.commit,
          "45e3d5269e4a17d823f6d84470bc084dc5ae46f6",
        );
        assert.equal(
          record.source.localPath,
          `assets/fonts/hyperframes/${name}`,
        );
        assert.match(
          record.source.path,
          /^(?:ofl|apache)\/[a-z]+\/(?:OFL\.txt|LICENSE\.txt|METADATA\.pb)$/,
        );
        if (name === "PermanentMarker-NOTICE.txt")
          assert.equal(
            record.source.extraction,
            "fonts.copyright, followed by LF",
          );
        assert.deepEqual(
          await readFile(resolve(directory, path)),
          await readFile(resolve(root, record.source.localPath)),
          `${label} must retain the vendored notice bytes`,
        );
      }
    }
  }
  assert.equal(coveredFamilies.size, fontFamilies.length);
});

test("native manifest and file hashes include supplemental font notices", async () => {
  let installedFiles = 0;
  let sourceFiles = 0;
  let supplementalFontNotices = 0;
  for (const item of inventory.items) {
    const directory = resolve(root, "registry/blocks", item.name);
    const manifestBytes = await readFile(
      resolve(directory, "registry-item.json"),
    );
    const manifest = JSON.parse(manifestBytes);
    assert.equal(sha256(manifestBytes), item.localManifest.sha256, item.name);
    assert.equal(manifest.files.length, item.files.length, item.name);
    assert.equal(
      manifest.origin.commit,
      item.origin?.commit ?? inventory.summary.upstream.commit,
    );
    for (const file of item.files) {
      const bytes = await readFile(resolve(directory, file.path));
      const label = `${item.name}: ${file.path}`;
      assert.equal(sha256(bytes), file.sha256, label);
      assert.equal(bytes.length, file.bytes, label);
      installedFiles++;
      if (file.source.repository === "https://github.com/google/fonts") {
        supplementalFontNotices++;
      } else if (!["LICENSE", "NOTICE"].includes(file.source.path)) {
        sourceFiles++;
      }
    }
  }
  assert.equal(installedFiles, inventory.summary.installedFiles);
  assert.equal(sourceFiles, inventory.summary.sourceFiles);
  assert.equal(
    supplementalFontNotices,
    inventory.summary.supplementalFontNotices,
  );
});

test("supplemental font notice targets coexist with the rest of the catalog", async () => {
  const notices = inventory.items
    .flatMap((item) => item.files)
    .filter(
      (file) => file.source.repository === "https://github.com/google/fonts",
    );
  const targets = new Map();
  for (const notice of notices) {
    const existing = targets.get(notice.target);
    if (existing) assert.equal(notice.sha256, existing, notice.target);
    targets.set(notice.target, notice.sha256);
  }
  for (const name of await readdir(resolve(root, "registry/blocks"))) {
    const directory = resolve(root, "registry/blocks", name);
    const manifest = await readFile(
      resolve(directory, "registry-item.json"),
      "utf8",
    )
      .then(JSON.parse)
      .catch((error) => {
        if (error.code === "ENOENT") return null;
        throw error;
      });
    if (!manifest) continue;
    for (const file of manifest.files) {
      if (!targets.has(file.target)) continue;
      assert.equal(
        sha256(await readFile(resolve(directory, file.path))),
        targets.get(file.target),
        `${name} conflicts at ${file.target}`,
      );
    }
  }
});
