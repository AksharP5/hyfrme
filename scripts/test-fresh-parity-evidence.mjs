import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import {
  assertFreshCompiledEvidence,
  hasFreshCompiledEvidence,
} from "./fresh-parity-evidence.mjs";

const root = resolve(import.meta.dirname, "..");
const accepted = JSON.parse(
  await readFile(resolve(root, "parity/switch.json")),
);
const manifest = JSON.parse(
  await readFile(resolve(root, "registry/blocks/switch/registry-item.json")),
);
const fixtures = JSON.parse(
  await readFile(resolve(root, "catalog/primitive-fixtures.json")),
);
const { fixture, origin } = fixtures.find((entry) => entry.slug === "switch");
const files = new Map();
for (const path of [
  ...Object.keys(accepted.artifactHashes),
  ...["registry-item.json", ...manifest.files.map((file) => file.path)].map(
    (path) => `registry/blocks/switch/${path}`,
  ),
]) {
  files.set(path, await readFile(resolve(root, path)));
}
const verify = (
  parity = structuredClone(accepted),
  item = structuredClone(manifest),
  contents = new Map(files),
) =>
  assertFreshCompiledEvidence({
    parity,
    manifest: item,
    fixture,
    origin,
    readBytes: async (path) => {
      assert(contents.has(path), `Missing evidence: ${path}`);
      return contents.get(path);
    },
  });
const rehash = (parity, contents, path, bytes) => {
  contents.set(path, bytes);
  parity.artifactHashes[path] = createHash("sha256")
    .update(bytes)
    .digest("hex");
};

test("accepts exact fresh Switch while preserving all 47 strict residuals and unobserved backend", async () => {
  const result = await verify();
  assert.equal(result.frameCount, 100);
  assert.equal(result.strictResidual.length, 47);
  assert.equal(result.originalResidual.length, 47);
  assert.deepEqual(result.nativeHistoryResidual, []);
  assert.equal(result.backend, "unobserved");
});

test("digest row tampering fails even after its artifact checksum is refreshed", async () => {
  const parity = structuredClone(accepted),
    contents = new Map(files),
    path = parity.artifacts.freshProducerWithRepeatsRgba;
  const bytes = Buffer.from(
    contents
      .get(path)
      .toString()
      .replace(
        /^0, 100, 100, 1, 3686400, [a-f0-9]+$/m,
        "0, 100, 100, 1, 3686400, ffffffffffffffffffffffffffffffff",
      ),
  );
  rehash(parity, contents, path, bytes);
  await assert.rejects(
    verify(parity, manifest, contents),
    /Fresh RGBA\/repeat mismatch/,
  );
});

test("consistent replacement of both full SHA256 sequences contradicts canonical source/archive rows", async () => {
  const parity = structuredClone(accepted),
    contents = new Map(files);
  for (const key of [
    "freshReferenceWithRepeatsSha256",
    "freshProducerWithRepeatsSha256",
  ]) {
    const path = parity.artifacts[key];
    rehash(
      parity,
      contents,
      path,
      Buffer.from(
        contents
          .get(path)
          .toString()
          .replace(
            /^0, 1, 1, 1, 3686400, [a-f0-9]+$/m,
            `0, 1, 1, 1, 3686400, ${"f".repeat(64)}`,
          ),
      ),
    );
  }
  await assert.rejects(
    verify(parity, manifest, contents),
    /Fresh full sequence differs from canonical source\/archive SHA256/,
  );
});

test("missing repeated capture rows and missing original strict baseline fail", async () => {
  for (const key of [
    "freshReferenceWithRepeatsRgba",
    "freshReferenceWithRepeatsSha256",
    "freshProducerWithRepeatsSha256",
    "originalStrictRgba",
    "originalStrictParity",
  ]) {
    const parity = structuredClone(accepted);
    delete parity.artifacts[key];
    await assert.rejects(verify(parity), /Missing proof artifact/);
  }
  const parity = structuredClone(accepted),
    contents = new Map(files),
    path = parity.artifacts.freshReferenceWithRepeatsRgba;
  rehash(
    parity,
    contents,
    path,
    Buffer.from(
      contents
        .get(path)
        .toString()
        .replace(/^0, 104, 104,.*\n/m, ""),
    ),
  );
  await assert.rejects(
    verify(parity, manifest, contents),
    /Incomplete ordered RGBA sequence/,
  );
});

test("the no-exception bucket rejects warnings, findings and missing checker counts", async () => {
  for (const [modify, expected] of [
    [
      (check) => {
        check.lint.warningCount = 1;
      },
      /Full check contains warnings/,
    ],
    [
      (check) => {
        check.layout.findings = [{ severity: "warning", ruleId: "test" }];
      },
      /Full check contains findings/,
    ],
    [
      (check) => {
        delete check.runtime.warningCount;
      },
      /Full check contains warnings/,
    ],
    [
      (check) => {
        check.snapshots.findingFiles = ["finding.json"];
      },
      /Full check contains snapshot findings/,
    ],
  ]) {
    const parity = structuredClone(accepted),
      contents = new Map(files),
      path = parity.artifacts.hyperframesCheck;
    const source = contents.get(path).toString(),
      start = source.search(/^\{/m),
      check = JSON.parse(source.slice(start));
    modify(check);
    rehash(
      parity,
      contents,
      path,
      Buffer.from(
        source.slice(0, start) + JSON.stringify(check, null, 2) + "\n",
      ),
    );
    await assert.rejects(verify(parity, manifest, contents), expected);
  }
});

test("RGBA frame reordering fails with unchanged row count and a refreshed checksum", async () => {
  const parity = structuredClone(accepted),
    contents = new Map(files),
    path = parity.artifacts.referenceRgba;
  rehash(
    parity,
    contents,
    path,
    Buffer.from(
      contents
        .get(path)
        .toString()
        .replace(/^0,\s*1,\s*1,/m, "0, 0, 0,"),
    ),
  );
  await assert.rejects(
    verify(parity, manifest, contents),
    /RGBA DTS order changed/,
  );
});

test("changed installed source, font or dependency declarations fail", async () => {
  for (const path of [
    "switch.runtime.js",
    "Geist-Latin.woff2",
    "licenses/culori-LICENSE",
  ]) {
    const contents = new Map(files),
      fullPath = `registry/blocks/switch/${path}`;
    contents.set(
      fullPath,
      Buffer.concat([contents.get(fullPath), Buffer.from("changed")]),
    );
    await assert.rejects(
      verify(accepted, manifest, contents),
      /Installed block\/font\/dependency changed/,
    );
  }
  const item = structuredClone(manifest);
  item.bundledDependencies[0].version = "4.0.1";
  await assert.rejects(
    verify(accepted, item),
    /Installed manifest\/dependency declaration changed/,
  );
});

test("false exact strict or source-relative claims fail", async () => {
  const exact = structuredClone(accepted);
  exact.checks.sequentialRgbaExact = true;
  await assert.rejects(verify(exact), /False exact strict claim/);
  const source = structuredClone(accepted);
  source.checks.freshReferenceVsDebugProducerMismatchedFrames = [];
  await assert.rejects(verify(source), /Strict\/source residual hidden/);
  const original = structuredClone(accepted);
  original.checks.originalReferenceVsOriginalProducerMismatchedFrames = [];
  await assert.rejects(verify(original), /Original residual hidden/);
  const backend = structuredClone(accepted);
  backend.checks.captureBackend = "hardware";
  await assert.rejects(verify(backend), /Fresh backend observation invented/);
});

test("full check errors and incomplete mandatory strict stages fail", async () => {
  const parity = structuredClone(accepted),
    contents = new Map(files),
    path = parity.artifacts.hyperframesCheck;
  rehash(
    parity,
    contents,
    path,
    Buffer.from(
      contents.get(path).toString().replace('"ok": true,', '"ok": false,'),
    ),
  );
  await assert.rejects(verify(parity, manifest, contents), /Full check failed/);
  const incomplete = structuredClone(accepted),
    missing = new Map(files),
    render = incomplete.artifacts.hyperframesRender;
  rehash(
    incomplete,
    missing,
    render,
    Buffer.from(
      missing
        .get(render)
        .toString()
        .replace(/"framesCompleted":100/g, '"framesCompleted":99'),
    ),
  );
  await assert.rejects(
    verify(incomplete, manifest, missing),
    /Strict capture incomplete/,
  );
});

test("actual debug rows must match the ORIGINAL producer, not only a replacement baseline", async () => {
  const parity = structuredClone(accepted),
    contents = new Map(files);
  const path =
    "parity/switch-diff/sequential/debug-producer-history-rgba.framemd5";
  rehash(
    parity,
    contents,
    path,
    Buffer.from(
      contents
        .get(path)
        .toString()
        .replace(
          /^0,\s*0,\s*0,\s*1,\s*3686400,\s*[a-f0-9]+$/m,
          "0, 0, 0, 1, 3686400, ffffffffffffffffffffffffffffffff",
        ),
    ),
  );
  await assert.rejects(
    verify(parity, manifest, contents),
    /Debug differs from ORIGINAL mandatory strict producer/,
  );
});

test("legacy compiled proof retains its existing path and thresholds", () => {
  const legacy = {
    classification: "compiled-source-port",
    thresholds: { meanSsim: 0.95 },
  };
  assert.equal(hasFreshCompiledEvidence(legacy), false);
  assert.deepEqual(legacy.thresholds, { meanSsim: 0.95 });
  assert.equal(hasFreshCompiledEvidence(accepted), true);
  const incomplete = structuredClone(accepted);
  delete incomplete.checks.captureLifecycle;
  assert.equal(hasFreshCompiledEvidence(incomplete), true);
});

test("new mandatory rows cannot replace the independently saved original producer", async () => {
  const parity = structuredClone(accepted),
    contents = new Map(files),
    path = parity.artifacts.mandatoryStrictRgba;
  const bytes = Buffer.from(
    contents
      .get(path)
      .toString()
      .replace(
        /^0,\s*0,\s*0,\s*1,\s*3686400,\s*[a-f0-9]+$/m,
        "0, 0, 0, 1, 3686400, ffffffffffffffffffffffffffffffff",
      ),
  );
  rehash(parity, contents, path, bytes);
  const sequentialPath = parity.artifacts.sequentialParity,
    sequential = JSON.parse(contents.get(sequentialPath));
  sequential.artifactHashes[sequential.artifacts.hyperframesRgba] =
    parity.artifactHashes[path];
  rehash(
    parity,
    contents,
    sequentialPath,
    Buffer.from(JSON.stringify(sequential) + "\n"),
  );
  await assert.rejects(
    verify(parity, manifest, contents),
    /New mandatory differs from ORIGINAL mandatory strict producer/,
  );
});

test("original runtime provenance remains distinct from the reproved installed runtime", async () => {
  const provenancePath = accepted.artifacts.originalStrictProvenance;
  const original = JSON.parse(
      files.get(accepted.artifacts.originalStrictParity),
    ),
    provenance = JSON.parse(files.get(provenancePath));
  assert.notEqual(
    original.filesSha256["switch.runtime.js"],
    accepted.filesSha256["switch.runtime.js"],
  );
  assert.deepEqual(provenance.originalFilesSha256, original.filesSha256);
  const parity = structuredClone(accepted),
    contents = new Map(files);
  provenance.originalFilesSha256["switch.runtime.js"] =
    accepted.filesSha256["switch.runtime.js"];
  rehash(
    parity,
    contents,
    provenancePath,
    Buffer.from(JSON.stringify(provenance) + "\n"),
  );
  await assert.rejects(
    verify(parity, manifest, contents),
    /Original file provenance changed/,
  );
});

test("new sequential proof must authenticate the actual installed runtime", async () => {
  const parity = structuredClone(accepted),
    contents = new Map(files),
    path = parity.artifacts.sequentialParity;
  const sequential = JSON.parse(contents.get(path));
  sequential.filesSha256["switch.runtime.js"] = "f".repeat(64);
  rehash(
    parity,
    contents,
    path,
    Buffer.from(JSON.stringify(sequential) + "\n"),
  );
  await assert.rejects(
    verify(parity, manifest, contents),
    /New mandatory used different installed source/,
  );
});
