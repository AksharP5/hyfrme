import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, symlink, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";

const root = resolve(import.meta.dirname, "..");
const slug = "t3-sidebar-focus";
const args = process.argv.slice(2);
const panelMs = Number(process.env.T3_PANEL_MS ?? 200);
if (![0, 200].includes(panelMs)) throw new Error("T3_PANEL_MS must be 0 or 200");
if (process.env.T3_VERIFY_THEME) throw new Error("The current strict verifier checks both themes; omit T3_VERIFY_THEME");
const isolationIndex = args.indexOf("--isolation");
const allowed = new Set(["--prepare", "--resume", "--isolation"]);
for (let i = 0; i < args.length; i++) {
  if (!allowed.has(args[i])) throw new Error(`Unknown argument: ${args[i]}`);
  if (args[i] === "--isolation") {
    if (!args[++i]) throw new Error("--isolation requires a path");
  }
}
function run(script, flags) {
  const result = spawnSync(process.execPath, [script, ...flags], { cwd: root, stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${script} failed (${result.status})`);
}
if (panelMs === 0) {
  if (isolationIndex !== -1) throw new Error("Default verification uses the canonical repository");
  run(resolve(root, "scripts/verify-t3-catalog-ports.mjs"), ["--only", slug, ...args]);
} else {
  const hash = bytes => createHash("sha256").update(bytes).digest("hex");
  const work = resolve(root, ".work/full-parity-audit/sidebar-settings-enabled");
  await mkdir(work, { recursive: true });
  const isolated = isolationIndex === -1 ? await mkdtemp(join(work, "isolated-")) : resolve(root, args[isolationIndex + 1]);
  const scripts = ["verify-t3-catalog-ports.mjs", "publish-t3-catalog-parity.mjs", "t3-capture-images.mjs", "parity-evidence.mjs", "hyperframes-variables.mjs"];
  if (isolationIndex === -1) {
    for (const directory of ["scripts", "registry/blocks", "assets/t3-code", "parity"]) await mkdir(resolve(isolated, directory), { recursive: true });
    for (const file of scripts) await copyFile(resolve(root, "scripts", file), resolve(isolated, "scripts", file));
    await copyFile(resolve(root, "registry/registry.json"), resolve(isolated, "registry/registry.json"));
    for (const path of [`registry/blocks/${slug}`, "assets/t3-code/v0.0.42", "cli"]) await symlink(resolve(root, path), resolve(isolated, path), "dir");
    const parity = JSON.parse(await readFile(resolve(root, `parity/${slug}.json`), "utf8"));
    const source = resolve(root, "assets/t3-code/v0.0.42");
    for (const theme of ["dark", "light"]) {
      const native = JSON.parse(await readFile(resolve(source, `sidebar-focus-v0042-${theme}-animated-fixture.json`), "utf8"));
      assert.equal(native.panelMs, 200);
      assert.equal(native.variant, "animated");
      assert.deepEqual(native.events, { collapse: 30, restore: 90 });
      const recording = parity.themes[theme].settingsEnabled200.artifacts.nativeRecording;
      assert.equal(hash(await readFile(resolve(root, recording))), native.referenceSha256);
      await symlink(resolve(root, recording), resolve(isolated, recording));
      Object.assign(parity.themes[theme], { status: "pending", referenceSha256: native.referenceSha256, sourceDomHashes: native.sourceDomHashes });
      parity.themes[theme].result.pass = false;
      parity.themes[theme].artifacts.nativeRecording = recording;
    }
    parity.status = "pending";
    parity.result.pass = false;
    parity.fixture.compositionSha256 = hash(await readFile(resolve(root, `registry/blocks/${slug}/${slug}.html`)));
    Object.assign(parity.fixture.props, { transitionMs: 200, panelMs: 200, variant: "animated" });
    parity.fixture.referenceSha256 = parity.themes.dark.referenceSha256;
    await writeFile(resolve(isolated, `parity/${slug}.json`), JSON.stringify(parity, null, 2) + "\n");
  }
  for (const file of scripts) assert.equal(hash(await readFile(resolve(isolated, "scripts", file))), hash(await readFile(resolve(root, "scripts", file))), `${file}: isolated engine is stale`);
  console.log(`Sidebar settingsEnabled200 isolation: ${isolated}`);
  run(resolve(isolated, "scripts/verify-t3-catalog-ports.mjs"), ["--only", slug, ...args.filter(arg => ["--prepare", "--resume"].includes(arg))]);
  if (!args.includes("--prepare")) run(resolve(isolated, "scripts/publish-t3-catalog-parity.mjs"), ["--only", slug, "--prepare"]);
}
