import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
for (const theme of ["dark", "light"]) {
  const project = resolve(root, `.work/t3-model-swap-v0042-cli/${theme}`);
  const result = spawnSync("npx", ["--yes", "hyperframes@0.8.75", "check", project, "--json"], {
    encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
  });
  await writeFile(resolve(project, "check.json"), result.stdout);
  const check = JSON.parse(result.stdout.slice(result.stdout.indexOf("{")));
  if (result.status !== 0 || !check.ok) {
    throw new Error(`${theme} CLI-installed T3 model swap failed the full check: ${result.stderr.slice(-1500)}`);
  }
  for (const [name, gate] of Object.entries({ lint: check.lint, runtime: check.runtime, layout: check.layout, motion: check.motion, contrast: check.contrast })) {
    if (gate?.findings?.length) throw new Error(`${theme} installed ${name} has ${gate.findings.length} findings`);
  }
  const composition = await readFile(resolve(project, "compositions/t3-model-swap.html"), "utf8");
  if (!composition.includes("GPT-6-Sol") || !composition.includes("data-chat-provider-model-picker")) {
    throw new Error(`${theme} CLI-installed model picker is incomplete`);
  }
  console.log(`${theme} CLI-installed T3 model swap full check passed with zero findings.`);
}
