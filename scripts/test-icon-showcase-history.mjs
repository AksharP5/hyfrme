import assert from "node:assert/strict";
import test from "node:test";
import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import { iconShowcaseThreshold } from "./icon-showcase-history.mjs";

const root = resolve(import.meta.dirname, "..");
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path)));

test("historical Mail keeps its recorded .95 gate without lowering the current .99 gate", async () => {
  const parity = await readJson("parity/icon-mail.json");
  const threshold = await iconShowcaseThreshold(root, parity.slug, parity);
  assert.equal(threshold, 0.95);
  assert.ok(parity.showcase.result.pass && parity.showcase.result.meanSsim >= threshold);
  assert.equal(parity.thresholds.meanSsim, 0.99);
  delete parity.showcase.provenance;
  const currentThreshold = await iconShowcaseThreshold(root, parity.slug, parity);
  assert.equal(currentThreshold, 0.99);
  assert.ok(parity.showcase.result.meanSsim < currentThreshold);
});

test("historical acceptance requires unchanged raw proof, original result and actual video hashes", async () => {
  const original = await readJson("parity/icon-mail.json");
  for (const mutate of [
    (showcase) => { showcase.provenance.originalReport.sha256 = "0".repeat(64); },
    (showcase) => { showcase.result.minSsim = 1; },
    (showcase) => { showcase.artifactHashes[showcase.artifacts.referenceVideo] = "0".repeat(64); },
    (showcase) => { showcase.origin.commit = original.origin.commit; },
  ]) {
    const parity = structuredClone(original);
    mutate(parity.showcase);
    await assert.rejects(iconShowcaseThreshold(root, parity.slug, parity));
  }
});

test("Inbox preserves its separate showcase fixture, checks, measurement and sidecars", async () => {
  const parity = await readJson("parity/icon-inbox.json");
  const showcase = parity.showcase;
  assert.equal(await iconShowcaseThreshold(root, parity.slug, parity), 0.95);
  const original = await readJson(showcase.provenance.originalReport.path);
  for (const field of ["fixture", "result", "checks", "measurement"]) {
    assert.deepEqual(showcase[field], original.showcase[field]);
  }
  assert.equal(showcase.artifacts.summary, "parity/icon-inbox-showcase-diff/summary.json");
  assert.equal(showcase.artifacts.ssim, "parity/icon-inbox-showcase-diff/ssim.log");
  assert.ok(!Object.values(showcase.artifacts).includes(original.artifacts.summary));
});

test("the catalog attributes historical videos to their original source and keeps the canonical pin", async () => {
  const sandbox = await mkdtemp(resolve(tmpdir(), "hyfrme-icon-history-"));
  try {
    const slug = "icon-arrow-left";
    const parity = await readJson(`parity/${slug}.json`);
    const manifest = await readJson(`registry/blocks/${slug}/registry-item.json`);
    await mkdir(resolve(sandbox, "scripts"));
    await cp(resolve(root, "scripts/build-catalog-data.mjs"), resolve(sandbox, "scripts/build-catalog-data.mjs"));
    await mkdir(resolve(sandbox, `registry/blocks/${slug}`), { recursive: true });
    await writeFile(resolve(sandbox, "registry/registry.json"), JSON.stringify({ items: [manifest] }));
    await writeFile(resolve(sandbox, `registry/blocks/${slug}/registry-item.json`), JSON.stringify(manifest));
    await cp(resolve(root, `registry/blocks/${slug}/${slug}.html`), resolve(sandbox, `registry/blocks/${slug}/${slug}.html`));
    await mkdir(resolve(sandbox, "parity"));
    await writeFile(resolve(sandbox, `parity/${slug}.json`), JSON.stringify(parity));
    await promisify(execFile)(process.execPath, [resolve(sandbox, "scripts/build-catalog-data.mjs")]);
    const details = JSON.parse(await readFile(resolve(sandbox, `public/registry/blocks/${slug}/catalog.json`)));
    assert.equal(details.parity.origin.commit, parity.showcase.origin.commit);
    assert.notEqual(details.parity.origin.commit, parity.origin.commit);
    assert.equal(details.parity.artifacts.referenceVideo, `/previews/${slug}/remocn.mp4`);
    assert.equal(details.parity.result.meanSsim, parity.showcase.result.meanSsim);
    assert.equal(parity.thresholds.meanSsim, 0.99);
    assert.equal(parity.result.rgba.pass, true);
  } finally {
    await rm(sandbox, { recursive: true });
  }
});
