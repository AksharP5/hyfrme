import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-agent-answer";
const block = resolve(root, "registry/blocks", name);
const project = await mkdtemp(join(tmpdir(), `${name}-direct-preview-`));
const source = await readFile(resolve(block, `${name}.html`), "utf8");
const template = /<template(?:\s[^>]*)?>([\s\S]*?)<\/template>/i;

if (!template.test(source)) throw new Error(`${name} registry source has no preview template`);

const preview = source
  .replace(template, "$1")
  .replace(
    "<head>",
    `<head><script>window.__hyperframes = { getVariables: () => ({ theme: "dark" }) };</script>`,
  )
  .replace(
    "</head>",
    `<style>html{width:100%;height:100%;overflow:hidden}body{width:1200px!important;height:659px!important;transform-origin:0 0}</style></head>`,
  )
  .replace(
    "</body>",
    `<script>window.__timelines?.[${JSON.stringify(name)}]?.play(0);</script></body>`,
  );

try {
  await writeFile(resolve(project, "index.html"), preview);
  await copyFile(resolve(block, "t3-code-gsap.min.js"), resolve(project, "t3-code-gsap.min.js"));

  const result = spawnSync(
    "npx",
    ["--yes", "hyperframes@0.8.75", "check", project, "--json"],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  const jsonStart = result.stdout.indexOf("{");

  if (result.error || jsonStart < 0) {
    throw new Error(
      `${name} direct catalog preview check failed:\n${result.error?.message ?? result.stderr.slice(-3000)}\n${result.stdout.slice(-1000)}`,
    );
  }

  const report = JSON.parse(result.stdout.slice(jsonStart));
  if (result.status !== 0 || !report.ok) {
    const errors = report.layout?.findings?.filter(({ severity }) => severity === "error") ?? [];
    throw new Error(`${name} direct catalog preview check failed (exit ${result.status}): ${JSON.stringify(errors).slice(0, 3000)}`);
  }

  console.log(`${name} direct catalog preview root passed the full HyperFrames check.`);
} finally {
  await rm(project, { recursive: true, force: true });
}
