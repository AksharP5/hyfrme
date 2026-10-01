import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { snapcnSources } from "./run-snapcn.mjs";

const root = resolve(import.meta.dirname, "..");
const repository = "https://github.com/snapcndev/snapcn";

async function fixture(
  t,
  { cssCommit = "current-pin", publishedAudit = true } = {},
) {
  const directory = await mkdtemp(
    resolve(tmpdir(), "hyfrme-snapcn-generation-"),
  );
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(resolve(directory, "catalog"));
  await mkdir(resolve(directory, "scripts"));
  await copyFile(
    resolve(root, "scripts/run-snapcn.mjs"),
    resolve(directory, "scripts/run-snapcn.mjs"),
  );
  await writeFile(
    resolve(directory, "catalog/snapcn-fixtures.json"),
    JSON.stringify([
      { slug: "snapcn-base", origin: { repository, commit: "base-pin" } },
      { slug: "snapcn-current", origin: { repository, commit: "current-pin" } },
    ]),
  );
  await writeFile(
    resolve(directory, "catalog/snapcn-upstream.json"),
    JSON.stringify({
      repository,
      commit: "base-pin",
      ...(publishedAudit && {
        publishedAudit: { repository, commit: cssCommit },
      }),
    }),
  );
  const recorder = `import {appendFile} from "node:fs/promises";
await appendFile("events.jsonl", JSON.stringify({script:import.meta.filename.split("/").at(-1),args:process.argv.slice(2),source:process.env.SNAPCN_SOURCE})+"\\n");
`;
  for (const script of [
    "generate-snapcn-reference.mjs",
    "generate-snapcn-ports.mjs",
    "verify-snapcn-ports.mjs",
  ]) {
    await writeFile(resolve(directory, "scripts", script), recorder);
  }
  async function invoke(args, source) {
    await writeFile(resolve(directory, "events.jsonl"), "");
    const env = { ...process.env };
    delete env.SNAPCN_SOURCE;
    if (source) env.SNAPCN_SOURCE = source;
    const result = spawnSync(
      process.execPath,
      [resolve(directory, "scripts/run-snapcn.mjs"), ...args],
      { cwd: directory, env, encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr);
    return (await readFile(resolve(directory, "events.jsonl"), "utf8"))
      .trim()
      .split("\n")
      .map(JSON.parse);
  }
  return { directory, invoke };
}

test("the recorded published pin owns shared CSS across full and partial generation", async (t) => {
  const { directory, invoke } = await fixture(t);
  const base = resolve(directory, ".work/snapcn");
  const current = resolve(directory, ".work/snapcn-current-pin");
  const expectedCss = {
    script: "generate-snapcn-reference.mjs",
    args: ["--css-only"],
    source: current,
  };
  assert.deepEqual(await invoke(["generate"]), [
    expectedCss,
    {
      script: "generate-snapcn-ports.mjs",
      args: ["--only", "snapcn-base"],
      source: base,
    },
    {
      script: "generate-snapcn-ports.mjs",
      args: ["--only", "snapcn-current"],
      source: current,
    },
  ]);
  assert.deepEqual(await invoke(["generate", "--only", "snapcn-base"]), [
    expectedCss,
    {
      script: "generate-snapcn-ports.mjs",
      args: ["--only", "snapcn-base"],
      source: base,
    },
  ]);
  const override = resolve(directory, "custom-checkout");
  const olderOverride = await invoke(
    ["generate", "--only", "snapcn-base"],
    override,
  );
  assert.deepEqual(olderOverride[0], expectedCss);
  assert.equal(olderOverride[1].source, override);
  const currentOverride = await invoke(
    ["generate", "--only", "snapcn-current"],
    override,
  );
  assert.equal(currentOverride[0].source, override);
  assert.equal(currentOverride[1].source, override);
  assert.deepEqual(await invoke(["verify", "--only", "snapcn-base"]), [
    {
      script: "verify-snapcn-ports.mjs",
      args: ["--only", "snapcn-base"],
      source: base,
    },
  ]);
});

test("setup includes the CSS pin even without a fixture and older inventories use their base pin", async (t) => {
  const { directory, invoke } = await fixture(t, { cssCommit: "css-only-pin" });
  const { snapcnSources: sourcesForFixture } = await import(
    pathToFileURL(resolve(directory, "scripts/run-snapcn.mjs"))
  );
  const sources = await sourcesForFixture();
  assert.deepEqual(
    sources.find((source) => source.previewCss),
    {
      repository,
      commit: "css-only-pin",
      directory: resolve(directory, ".work/snapcn-css-only-pin"),
      slugs: [],
      previewCss: true,
    },
  );
  const events = await invoke(["generate"]);
  assert.equal(
    events[0].source,
    resolve(directory, ".work/snapcn-css-only-pin"),
  );
  assert.equal(
    events.length,
    3,
    "the CSS-only pin must not generate any ports",
  );

  const legacy = await fixture(t, { publishedAudit: false });
  const legacyEvents = await legacy.invoke([
    "generate",
    "--only",
    "snapcn-current",
  ]);
  assert.equal(
    legacyEvents[0].source,
    resolve(legacy.directory, ".work/snapcn"),
  );
});

test("the current catalog selects its published audit pin and retains every fixture pin", async () => {
  const inventory = JSON.parse(
    await readFile(resolve(root, "catalog/snapcn-upstream.json")),
  );
  const fixtures = JSON.parse(
    await readFile(resolve(root, "catalog/snapcn-fixtures.json")),
  );
  const sources = await snapcnSources();
  const css = sources.find((source) => source.previewCss);
  assert.equal(css.repository, inventory.publishedAudit.repository);
  assert.equal(css.commit, inventory.publishedAudit.commit);
  for (const { slug, origin } of fixtures) {
    const source = sources.find((source) => source.slugs.includes(slug));
    assert.equal(source.repository, origin.repository);
    assert.equal(source.commit, origin.commit);
  }
});
