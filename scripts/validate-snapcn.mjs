import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { basename, posix, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const assetRoot = resolve(root, "assets/snapcn");
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const [fixtures, inventory, assets, paper] = await Promise.all([
  readJson(resolve(root, "catalog/snapcn-fixtures.json")),
  readJson(resolve(root, "catalog/snapcn-upstream.json")),
  readJson(resolve(assetRoot, "manifest.json")),
  readJson(resolve(assetRoot, "paper-shaders/provenance.json")),
]);
const hashes = new Map();
const normalizedVideos = new Set();
async function hash(path) {
  if (!hashes.has(path)) {
    hashes.set(
      path,
      createHash("sha256")
        .update(await readFile(path))
        .digest("hex"),
    );
  }
  return hashes.get(path);
}
async function verifyHash(path, expected) {
  assert.match(expected, /^[a-f0-9]{64}$/, `Missing SHA256 for ${path}`);
  assert.equal(await hash(path), expected, `Changed audited file: ${path}`);
}
function sameMembers(actual, expected, label) {
  assert.equal(
    new Set(actual).size,
    actual.length,
    `${label}: duplicate entries`,
  );
  assert.deepEqual([...actual].sort(), [...expected].sort(), label);
}
function attributeJson(html, name) {
  const attribute = html.match(new RegExp(`${name}='([^']*)'`));
  assert.ok(attribute, `Missing ${name}`);
  const entities = {
    amp: "&",
    quot: '"',
    apos: "'",
    "#39": "'",
    lt: "<",
    gt: ">",
  };
  return JSON.parse(
    attribute[1].replace(
      /&(amp|quot|apos|#39|lt|gt);/g,
      (_, entity) => entities[entity],
    ),
  );
}
const visuals = inventory.items.filter((item) => item.kind === "visual");
sameMembers(
  fixtures.map((item) => item.slug),
  visuals.map((item) => item.slug),
  "Snapcn fixture coverage",
);
assert.equal(visuals.length, inventory.summary.visualItems);
assert.equal(inventory.items.length, inventory.summary.totalRegistryItems);
assert.equal(assets.upstream.commit, inventory.commit);

const snapcnLicense = await readFile(
  resolve(assetRoot, "SNAPCN-LICENSE.txt"),
  "utf8",
);
await verifyHash(
  resolve(assetRoot, "SNAPCN-LICENSE.txt"),
  inventory.licenseSha256,
);
assert.ok(
  snapcnLicense.includes(inventory.copyright),
  "Missing Snapcn copyright notice",
);
for (const asset of [...assets.fonts, ...assets.media]) {
  await verifyHash(resolve(assetRoot, asset.path), asset.sha256);
  await verifyHash(resolve(assetRoot, asset.licensePath), asset.licenseSha256);
  if (asset.portPath) {
    await verifyHash(resolve(assetRoot, asset.portPath), asset.portSha256);
    await verifyHash(resolve(assetRoot, asset.noticePath), asset.noticeSha256);
    assert.equal(asset.normalization.sourceSha256, asset.sha256);
    assert.equal(asset.normalization.portSha256, asset.portSha256);
    assert.equal(asset.normalization.reencoded, false);
    assert.equal(asset.normalization.portTransfer, "iec61966-2-1");
    assert.equal(asset.normalization.decodedRgbProof.allFramesMatch, true);
    assert.ok(asset.normalization.decodedRgbProof.frames > 0);
    if (!normalizedVideos.has(asset.portPath)) {
      const { streams } = JSON.parse(
        execFileSync(
          "ffprobe",
          [
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=color_transfer,color_space,color_primaries",
            "-of",
            "json",
            resolve(assetRoot, asset.portPath),
          ],
          { encoding: "utf8" },
        ),
      );
      assert.equal(
        streams[0]?.color_transfer,
        asset.normalization.portTransfer,
        `${asset.portPath}: browser playback requires sRGB transfer metadata`,
      );
      assert.equal(streams[0]?.color_space, asset.normalization.colorMatrix);
      assert.equal(
        streams[0]?.color_primaries,
        asset.normalization.colorPrimaries,
      );
      normalizedVideos.add(asset.portPath);
    }
  }
  if (asset.license === "Unsplash License") {
    assert.ok(
      asset.author && asset.photographSource,
      `Missing photographer credit: ${asset.path}`,
    );
  }
}
for (const dependency of assets.dependencies) {
  assert.ok(
    dependency.licenses.length,
    `No audited license: ${dependency.name}`,
  );
  for (const license of dependency.licenses) {
    await verifyHash(resolve(assetRoot, license.path), license.sha256);
  }
  for (const source of dependency.sources ?? []) {
    await verifyHash(resolve(assetRoot, source.path), source.sha256);
  }
}
assert.equal(paper.license, "Apache-2.0");
assert.ok(paper.licenseSource.includes(`/${paper.commit}/LICENSE`));
await verifyHash(
  resolve(assetRoot, "paper-shaders/LICENSE.txt"),
  paper.licenseSha256,
);
sameMembers(
  paper.packageLicenses.map((license) => license.package),
  [...new Set(paper.files.map((source) => source.package))],
  "Paper package-local license coverage",
);
for (const license of paper.packageLicenses) {
  assert.ok(license.source.includes(`/${paper.commit}/packages/`));
  assert.equal(
    license.sha256,
    paper.licenseSha256,
    "Paper package-local license differs from Apache grant",
  );
  await verifyHash(
    resolve(assetRoot, "paper-shaders", license.path),
    license.sha256,
  );
}
await verifyHash(
  resolve(assetRoot, "paper-shaders", paper.notice.path),
  paper.notice.sha256,
);
for (const source of paper.files) {
  assert.ok(
    source.source.includes(`/${paper.commit}/packages/`),
    `Unpinned Apache source: ${source.path}`,
  );
  await verifyHash(
    resolve(assetRoot, "paper-shaders", source.path),
    source.sha256,
  );
  if (source.npmSourceMap)
    assert.equal(source.matchesPinnedNpmSourceExactly, true);
}

const generated = (await readdir(resolve(root, "registry/blocks"))).filter(
  (name) => name.startsWith("snapcn-"),
);
sameMembers(
  generated,
  fixtures.map((item) => item.slug),
  "Generated Snapcn block coverage",
);
for (const fixture of fixtures) {
  const { slug } = fixture;
  const directory = resolve(root, "registry/blocks", slug);
  const block = await readJson(resolve(directory, "registry-item.json"));
  const upstream = visuals.find((item) => item.slug === slug);
  assert.equal(block.name, slug);
  assert.equal(
    fixture.origin.source,
    upstream.source,
    `${slug}: source mismatch`,
  );
  assert.equal(
    fixture.origin.commit,
    upstream.commit ?? inventory.commit,
    `${slug}: fixture pin mismatch`,
  );
  assert.deepEqual(
    block.origin,
    fixture.origin,
    `${slug}: generated origin mismatch`,
  );
  assert.ok(block.tags.includes("snapcn"), `${slug}: missing source tag`);
  const files = new Map(block.files.map((file) => [file.path, file]));
  const targets = new Set(block.files.map((file) => file.target));
  assert.equal(files.size, block.files.length, `${slug}: duplicate file paths`);
  assert.equal(
    targets.size,
    block.files.length,
    `${slug}: duplicate installation targets`,
  );
  for (const file of block.files) await hash(resolve(directory, file.path));

  async function packagedLicense(path, expectedHash) {
    const file = files.get(path);
    assert.ok(file, `${slug}: missing license ${path}`);
    assert.ok(
      file.target.startsWith("THIRD_PARTY_LICENSES/snapcn/"),
      `${slug}: license is not installed: ${path}`,
    );
    await verifyHash(resolve(directory, path), expectedHash);
  }
  await packagedLicense("licenses/Snapcn-MIT.txt", inventory.licenseSha256);
  const runtime = await readFile(
    resolve(directory, `${slug}.runtime.js`),
    "utf8",
  );
  assert.ok(
    runtime.includes(snapcnLicense.trim()),
    `${slug}: runtime lost full Snapcn notice`,
  );
  assert.ok(
    !runtime.includes("PolyForm Shield License"),
    `${slug}: restricted dependency bundled`,
  );
  const expectedLicenses = new Set(["MIT"]);
  for (const name of fixture.inlineDependencies ?? []) {
    assert.ok(
      block.bundledDependencies.some((dependency) => dependency.name === name),
      `${slug}: missing inline dependency notice for ${name}`,
    );
  }
  for (const dependency of block.bundledDependencies) {
    assert.ok(
      !dependency.name.includes("remotion"),
      `${slug}: Remotion runtime bundled`,
    );
    assert.ok(
      !dependency.license.includes("PolyForm"),
      `${slug}: restricted dependency license`,
    );
    if (dependency.name.startsWith("@paper-design/")) {
      assert.equal(
        dependency.version,
        paper.commit,
        `${slug}: Paper source is not the Apache pin`,
      );
      assert.equal(dependency.license, paper.license);
      await packagedLicense("paper-shaders/LICENSE.txt", paper.licenseSha256);
      await packagedLicense(
        `paper-shaders/${paper.notice.path}`,
        paper.notice.sha256,
      );
      await packagedLicense(
        "paper-shaders/provenance.json",
        await hash(resolve(assetRoot, "paper-shaders/provenance.json")),
      );
    } else {
      const audited = assets.dependencies.find(
        (item) => item.name === dependency.name,
      );
      assert.ok(audited, `${slug}: unaudited dependency ${dependency.name}`);
      assert.equal(
        dependency.version,
        audited.version,
        `${slug}: dependency version changed`,
      );
      assert.equal(
        dependency.license,
        audited.license,
        `${slug}: dependency license changed`,
      );
      for (const license of audited.licenses) {
        await packagedLicense(
          `licenses/${basename(license.path)}`,
          license.sha256,
        );
      }
    }
    expectedLicenses.add(dependency.license);
  }
  const bundledAssets = [...assets.fonts, ...assets.media].filter((asset) =>
    files.has(asset.portPath ?? asset.path),
  );
  for (const asset of assets.media.filter((asset) =>
    asset.slugs?.includes(slug),
  )) {
    assert.ok(
      files.has(asset.portPath ?? asset.path),
      `${slug}: missing default media ${asset.portPath ?? asset.path}`,
    );
  }
  for (const asset of bundledAssets) {
    await verifyHash(
      resolve(directory, asset.portPath ?? asset.path),
      asset.portSha256 ?? asset.sha256,
    );
    await packagedLicense(asset.licensePath, asset.licenseSha256);
    if (asset.portPath)
      await packagedLicense(asset.noticePath, asset.noticeSha256);
    expectedLicenses.add(
      asset.license === "Unsplash License"
        ? "LicenseRef-Unsplash"
        : asset.license,
    );
  }
  sameMembers(
    block.license.split(" AND "),
    [...expectedLicenses],
    `${slug}: combined license omits bundled terms`,
  );
  const html = await readFile(resolve(directory, `${slug}.html`), "utf8");
  const variables = attributeJson(html, "data-composition-variables");
  sameMembers(
    variables.map((variable) => variable.id),
    Object.keys(fixture.controls),
    `${slug}: source control coverage`,
  );
  for (const variable of variables) {
    const control = fixture.controls[variable.id];
    assert.deepEqual(
      variable.default,
      control.default,
      `${slug}.${variable.id}: changed default`,
    );
    for (const key of ["label", "min", "max", "step", "options"]) {
      assert.deepEqual(
        variable[key],
        control[key],
        `${slug}.${variable.id}: changed ${key}`,
      );
    }
  }
  if (html.includes("tailwindcss v")) {
    assert.ok(
      block.bundledDependencies.some(
        (dependency) => dependency.name === "tailwindcss",
      ),
      `${slug}: compiled Tailwind CSS is missing its dependency license`,
    );
  }
  for (const [, path] of html.matchAll(
    /(?:\.\.\/assets\/snapcn\/)([^"\s<)]+)/g,
  )) {
    assert.ok(
      targets.has(`assets/snapcn/${path}`),
      `${slug}: asset reference is not installed: ${path}`,
    );
  }
  const mediaMap = attributeJson(html, "data-hyfrme-assets");
  for (const [source, target] of Object.entries(mediaMap)) {
    const asset = assets.media.find((item) => item.source === source);
    assert.ok(
      asset && files.has(asset.portPath ?? asset.path),
      `${slug}: unaudited media mapping ${source}`,
    );
    assert.equal(
      posix.normalize(`compositions/${target}`),
      `assets/snapcn/${asset.portPath ?? asset.path}`,
      `${slug}: incorrect media target`,
    );
  }
}
console.log(
  `Snapcn audit passed: ${fixtures.length} blocks, ${new Set([...assets.fonts, ...assets.media].flatMap((asset) => [asset.path, asset.portPath].filter(Boolean))).size} frozen assets, complete licenses and Apache source provenance.`,
);
