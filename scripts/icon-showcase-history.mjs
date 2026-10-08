import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function iconShowcaseThreshold(root, slug, parity) {
  const showcase = parity.showcase;
  if (showcase?.provenance?.kind !== "historical-preview") {
    return parity.thresholds.meanSsim;
  }

  const { originalReport } = showcase.provenance;
  assert.equal(originalReport.path, `parity/historical-showcases/${slug}.json`);
  const bytes = await readFile(resolve(root, originalReport.path));
  assert.equal(sha(bytes), originalReport.sha256, `${slug}: historical report changed`);
  const original = JSON.parse(bytes);
  assert.equal(original.slug, slug);
  assert.equal(original.origin.commit, "ea730a20b4ab09430ee7292aebc847c002375151");
  assert.deepEqual(original.thresholds, { meanSsim: 0.95 });
  assert.deepEqual(showcase.origin, original.origin);
  assert.deepEqual(showcase.thresholds, original.thresholds);
  assert.deepEqual(showcase.fixture, original.showcase.fixture);
  assert.deepEqual(showcase.result, original.showcase.result);
  for (const field of ["measurement", "checks"]) {
    assert.deepEqual(showcase[field], original.showcase[field]);
  }

  const artifacts = {
    ...original.showcase.artifacts,
    referenceVideo: original.artifacts.remocnVideo,
    hyperframesVideo: original.artifacts.hyperframesVideo,
  };
  assert.equal(artifacts.referenceVideo, `public/previews/${slug}/remocn.mp4`);
  assert.equal(artifacts.hyperframesVideo, `public/previews/${slug}/hyperframes.mp4`);
  assert.deepEqual(showcase.artifacts, artifacts);
  assert.deepEqual(Object.keys(showcase.artifactHashes).sort(), Object.values(artifacts).sort());
  for (const path of Object.values(artifacts)) {
    assert.ok(!path.startsWith("/") && !path.split("/").includes(".."));
    assert.equal(sha(await readFile(resolve(root, path))), showcase.artifactHashes[path], `${slug}: historical artifact changed`);
  }
  return original.thresholds.meanSsim;
}
