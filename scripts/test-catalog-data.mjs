import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { hashBlockFiles } from "./parity-evidence.mjs";

test("scoped catalog updates preserve other items and enforce the full proof gate", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "hyfrme-catalog-"));
  const write = async (path, value) => {
    await mkdir(resolve(root, path, ".."), { recursive: true });
    await writeFile(
      resolve(root, path),
      typeof value === "string" ? value : JSON.stringify(value, null, 2) + "\n",
    );
  };
  const run = (...args) =>
    spawnSync(
      process.execPath,
      [resolve(root, "scripts/build-catalog-data.mjs"), ...args],
      { encoding: "utf8" },
    );
  const publishRegistry = () =>
    spawnSync(process.execPath, [resolve(root, "scripts/build-verified-catalog.mjs")], { encoding: "utf8" });
  try {
    await mkdir(resolve(root, "scripts"));
    for (const name of ["build-catalog-data.mjs", "build-verified-catalog.mjs", "compiled-parity.mjs", "parity-evidence.mjs"])
      await cp(resolve(import.meta.dirname, name), resolve(root, "scripts", name));
    await write("registry/registry.json", {
      items: [{ name: "ready" }, { name: "pending" }],
    });
    for (const name of ["ready", "pending"]) {
      await write(`registry/blocks/${name}/registry-item.json`, {
        name,
        title: name,
        description: "Current description",
        type: "hyperframes:block",
        tags: [],
        files: [
          {
            path: "index.html",
            target: "index.html",
            type: "hyperframes:composition",
          },
        ],
      });
      await write(
        `registry/blocks/${name}/index.html`,
        "<!doctype html><div></div>",
      );
      await write(`parity/${name}.json`, {
        slug: name,
        status: name === "ready" ? "verified" : "pending",
        kind: "port",
        classification: "compiled-source-port",
        measurement: "lossless-png",
        fixture: { width: 1, height: 1, fps: 30, durationInFrames: 120 },
        thresholds: { exactRgba: true, meanSsim: 1, minSsim: 1 },
        checks: { installedThroughCli: true },
        filesSha256: await hashBlockFiles(
          resolve(root, "registry/blocks", name),
          JSON.parse(await readFile(resolve(root, "registry/blocks", name, "registry-item.json"))),
        ),
        origin: {
          repository: "https://example.com/source",
          commit: "pinned",
          source: "source.tsx",
        },
        artifacts: {
          referenceVideo: "public/previews/reference.mp4",
          hyperframesVideo: "public/previews/port.mp4",
        },
        result: {
          pass: name === "ready",
          frameCount: 120,
          meanSsim: 1,
          minSsim: 1,
          rgba: { pass: true, frameCount: 120, mismatchedFrames: [] },
        },
      });
    }
    for (const family of ["text", "core", "primitive", "icon", "snapcn"])
      await write(`catalog/${family}-fixtures.json`, family === "text" ? [{ slug: "ready" }, { slug: "pending" }] : []);
    const registryBefore = await readFile(resolve(root, "registry/registry.json"));
    const registryResult = publishRegistry();
    assert.equal(registryResult.status, 0, registryResult.stderr);
    assert.deepEqual(JSON.parse(await readFile(resolve(root, "registry/registry.json"))).items, [{ name: "ready", type: "hyperframes:block" }]);
    await writeFile(resolve(root, "registry/registry.json"), registryBefore);
    const other = {
      item: {
        name: "pending",
        title: "pending",
        description: "Preserve this historical summary",
      },
      sourceRepository: "old",
    };
    const summaries = [
      { item: { name: "ready", title: "ready", description: "stale" } },
      other,
    ];
    await write("src/generated/catalog-data.json", summaries);
    await write(
      "public/registry/blocks/pending/catalog.json",
      "Unselected bytes\n",
    );
    const before = await readFile(
      resolve(root, "src/generated/catalog-data.json"),
    );
    for (const args of [
      ["--only", "unknown"],
      ["--only", "pending"],
      [],
      ["--only"],
      ["--only", "ready,"],
    ]) {
      const result = run(...args);
      assert.notEqual(result.status, 0, args.join(" "));
      assert.deepEqual(
        await readFile(resolve(root, "src/generated/catalog-data.json")),
        before,
      );
    }
    assert.notEqual(run("--check", "--only", "ready").status, 0);
    const result = run("--only", "ready");
    assert.equal(result.status, 0, result.stderr);
    const updated = JSON.parse(
      await readFile(resolve(root, "src/generated/catalog-data.json")),
    );
    assert.deepEqual(
      updated.find((entry) => entry.item.name === "pending"),
      other,
    );
    assert.equal(
      updated.find((entry) => entry.item.name === "ready").item.description,
      "Current description",
    );
    assert.equal(
      await readFile(
        resolve(root, "public/registry/blocks/pending/catalog.json"),
        "utf8",
      ),
      "Unselected bytes\n",
    );
    const details = JSON.parse(
      await readFile(
        resolve(root, "public/registry/blocks/ready/catalog.json"),
      ),
    );
    assert.equal(details.parity.result.pass, true);
    assert.equal(run("--check", "--only", "ready").status, 0);
    const currentSummary = await readFile(resolve(root, "src/generated/catalog-data.json"));
    const currentDetail = await readFile(resolve(root, "public/registry/blocks/ready/catalog.json"));
    const source = await readFile(resolve(root, "registry/blocks/ready/index.html"), "utf8");
    await write("registry/blocks/ready/index.html", source + "<!-- edited -->");
    const staleRegistry = publishRegistry();
    assert.notEqual(staleRegistry.status, 0);
    assert.match(staleRegistry.stderr, /installed source changed after verification/);
    assert.deepEqual(await readFile(resolve(root, "registry/registry.json")), registryBefore);
    for (const args of [["--only", "ready"], ["--check", "--only", "ready"]]) {
      const stale = run(...args);
      assert.notEqual(stale.status, 0);
      assert.match(stale.stderr, /installed source changed after verification/);
      assert.deepEqual(await readFile(resolve(root, "src/generated/catalog-data.json")), currentSummary);
      assert.deepEqual(await readFile(resolve(root, "public/registry/blocks/ready/catalog.json")), currentDetail);
    }
    await write("registry/blocks/ready/index.html", source);
    const proof = JSON.parse(await readFile(resolve(root, "parity/ready.json")));
    const weak = structuredClone(proof);
    delete weak.result.rgba;
    await write("parity/ready.json", weak);
    const incompleteRegistry = publishRegistry();
    assert.notEqual(incompleteRegistry.status, 0);
    assert.match(incompleteRegistry.stderr, /exact lossless parity evidence is incomplete/);
    assert.deepEqual(await readFile(resolve(root, "registry/registry.json")), registryBefore);
    const incomplete = run("--only", "ready");
    assert.notEqual(incomplete.status, 0);
    assert.match(incomplete.stderr, /exact lossless parity evidence is incomplete/);
    assert.deepEqual(await readFile(resolve(root, "src/generated/catalog-data.json")), currentSummary);
    await write("parity/ready.json", proof);
    await rm(resolve(root, "public/registry/blocks/ready/catalog.json"));
    const missingDetail = run("--check", "--only", "ready");
    assert.notEqual(missingDetail.status, 0);
    assert.match(missingDetail.stderr, /ready: catalog details are stale/);
    assert.notEqual(
      run("--check").status,
      0,
      "full check must still reject pending ports",
    );
    const published = await readFile(
      resolve(root, "src/generated/catalog-data.json"),
    );
    await rm(resolve(root, "parity/ready.json"));
    assert.notEqual(
      run("--only", "ready").status,
      0,
      "missing proof must reject",
    );
    assert.deepEqual(
      await readFile(resolve(root, "src/generated/catalog-data.json")),
      published,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
