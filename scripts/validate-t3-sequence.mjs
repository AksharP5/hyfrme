import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const evidence = JSON.parse(
  await readFile(resolve(root, "parity/t3-sequence.json"), "utf8"),
);
if (
  evidence.result.pass !== true ||
  evidence.checks.hyperframes !== "full check passed with no errors" ||
  evidence.checks.installedThroughCli !== true ||
  evidence.blocks.length !== 5 ||
  evidence.fixture.cutSeconds.join(",") !== "4,8,12,16"
) {
  throw new Error("T3 Code sequence is missing its integration check");
}

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const example = await readFile(
  resolve(root, "examples/t3-code-sequence/index.html"),
  "utf8",
);
if (
  hash(example) !== evidence.hashes.example ||
  !example.includes('data-composition-id="t3-sequence5"') ||
  !example.includes('data-duration="20"')
) {
  throw new Error("T3 Code five-block sequence source changed");
}
const compositionHashes = [
  "briefComposition",
  "modelComposition",
  "reasoningComposition",
  "permissionComposition",
  "sendComposition",
];
for (const [index, block] of evidence.blocks.entries()) {
  const sourcePath =
    block === "t3-brief-to-prompt" ||
    block === "t3-model-swap" ||
    block === "t3-reasoning-level" ||
    block === "t3-permission-choice" ||
    block === "t3-prompt-send"
      ? resolve(root, "parity/legacy", `${block}-v0035-block`, `${block}.html`)
      : resolve(root, "registry/blocks", block, `${block}.html`);
  const source = await readFile(
    sourcePath,
  );
  if (
    hash(source) !== evidence.hashes[compositionHashes[index]] ||
    !example.includes(`data-composition-src="compositions/${block}.html"`)
  ) {
    throw new Error(`${block} differs from the checked T3 Code sequence`);
  }
}

const cuts = [
  ["beforeCut", "afterCut", "briefToModelSsim"],
  ["beforeReasoningCut", "afterReasoningCut", "modelToReasoningSsim"],
  ["beforePermissionCut", "afterPermissionCut", "reasoningToPermissionSsim"],
  ["beforeSendCut", "afterSendCut", "permissionToSendSsim"],
];
for (const [beforeKey, afterKey, scoreKey] of cuts) {
  const before = resolve(root, evidence.artifacts[beforeKey]);
  const after = resolve(root, evidence.artifacts[afterKey]);
  if (
    hash(await readFile(before)) !== evidence.hashes[beforeKey] ||
    hash(await readFile(after)) !== evidence.hashes[afterKey]
  ) {
    throw new Error(`${scoreKey} boundary frames changed`);
  }
  const result = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-i", before, "-i", after, "-lavfi", "ssim", "-f", "null", "-"],
    { encoding: "utf8" },
  );
  const score = Number(result.stderr.match(/All:([\d.]+)/)?.[1]);
  if (
    result.status !== 0 ||
    !Number.isFinite(score) ||
    score < 0.999 ||
    Math.abs(score - evidence.result[scoreKey]) > 0.000001
  ) {
    throw new Error(`${scoreKey} continuity evidence failed: ${score}`);
  }
}

console.log("T3 Code five-block sequence and four cuts validated.");

const agent = JSON.parse(
  await readFile(resolve(root, "parity/t3-agent-sequence.json"), "utf8"),
);
if (
  agent.result.pass !== true ||
  agent.checks.installedThroughCli !== true ||
  agent.checks.hyperframes !== "full check passed with no errors; strict render passed" ||
  agent.fixture.cutFrame !== 120 ||
  agent.blocks.join(",") !== "t3-worked-trace,t3-thread-actions"
) {
  throw new Error("T3 Code agent sequence is missing its integration check");
}
for (const [path, expected] of [
  ["examples/t3-code-agent-sequence/index.html", agent.hashes.example],
  ["parity/legacy/t3-worked-trace-v0035-block/t3-worked-trace.html", agent.hashes.workedTrace],
  ["parity/legacy/t3-thread-actions-v0035-block/t3-thread-actions.html", agent.hashes.threadActions],
  [agent.artifacts.renderedVideo, agent.hashes.renderedVideo],
  [agent.artifacts.beforeCut, agent.hashes.beforeCut],
  [agent.artifacts.afterCut, agent.hashes.afterCut],
]) {
  if (hash(await readFile(resolve(root, path))) !== expected) {
    throw new Error(`${path} differs from the checked T3 Code agent sequence`);
  }
}
const agentCut = spawnSync(
  "ffmpeg",
  ["-hide_banner", "-i", resolve(root, agent.artifacts.beforeCut), "-i", resolve(root, agent.artifacts.afterCut), "-lavfi", "ssim", "-f", "null", "-"],
  { encoding: "utf8" },
);
const agentScore = Number(agentCut.stderr.match(/All:([\d.]+)/)?.[1]);
if (
  agentCut.status !== 0 ||
  !Number.isFinite(agentScore) ||
  agentScore < 0.998 ||
  Math.abs(agentScore - agent.result.boundarySsim) > 0.000001
) {
  throw new Error(`T3 Code agent sequence boundary failed: ${agentScore}`);
}
console.log("T3 Code two-block agent sequence and cut validated.");

for (const [name, exampleDir, expectedBlocks, requiredOverride] of [
  ["t3-pin-unpin-sequence", "t3-code-pin-unpin", "t3-thread-pin,t3-thread-unpin", '"menuFrame":0'],
  ["t3-snooze-wake-sequence", "t3-code-snooze-wake", "t3-thread-snooze,t3-thread-wake", '"expandedFrame":0,"menuFrame":0'],
]) {
  const sequence = JSON.parse(await readFile(resolve(root, `parity/${name}.json`), "utf8"));
  const examplePath = `examples/${exampleDir}/index.html`;
  const source = await readFile(resolve(root, examplePath), "utf8");
  if (
    sequence.result.pass !== true ||
    sequence.checks.installedThroughCli !== true ||
    sequence.checks.hyperframes !== "full check passed with no errors" ||
    sequence.fixture.cutFrame !== 120 ||
    sequence.blocks.join(",") !== expectedBlocks ||
    hash(source) !== sequence.hashes.example ||
    !source.includes(requiredOverride)
  ) {
    throw new Error(`${name} is missing its checked installed composition`);
  }
  for (const [index, key] of [[0, "first"], [1, "second"]]) {
    const block = sequence.blocks[index];
    for (const [path, expected] of [
      [`examples/${exampleDir}/compositions/${block}.html`, sequence.hashes[`${key}Installed`]],
      [`parity/legacy/${block}-v0035-block/${block}.html`, sequence.hashes[`${key}Source`]],
    ]) {
      if (hash(await readFile(resolve(root, path))) !== expected) {
        throw new Error(`${name}: ${path} changed since verification`);
      }
    }
  }
  for (const [key, path] of Object.entries(sequence.artifacts)) {
    if (hash(await readFile(resolve(root, path))) !== sequence.hashes[key]) {
      throw new Error(`${name}: ${path} changed since verification`);
    }
  }
  const comparison = spawnSync("ffmpeg", [
    "-hide_banner", "-i", resolve(root, sequence.artifacts.beforeCut),
    "-i", resolve(root, sequence.artifacts.afterCut), "-lavfi", "ssim", "-f", "null", "-",
  ], { encoding: "utf8" });
  const score = Number(comparison.stderr.match(/All:([\d.]+)/)?.[1]);
  if (comparison.status !== 0 || score < 0.999 || Math.abs(score - sequence.result.boundarySsim) > 0.000001) {
    throw new Error(`${name} boundary failed: ${score}`);
  }
}
console.log("T3 Code pin/unpin and snooze/wake installed cuts validated.");

const current = JSON.parse(await readFile(resolve(root, "parity/t3-brief-worktree-v0042-sequence.json"), "utf8"));
if (
  current.sourceCommit !== "719a76ca1dbf5490f1aa33ffb9966301e02be9a9" ||
  current.blocks.join(",") !== "t3-brief-to-prompt,t3-new-worktree-choice" ||
  current.viewport.width !== 1200 || current.viewport.height !== 659 ||
  current.fps !== 30 || current.cutFrame !== 120 || !current.installedThroughCli
) {
  throw new Error("T3 Code v0.0.42 Brief → Worktree sequence is missing its installation proof");
}
for (const theme of ["dark", "light"]) {
  const result = current.themes[theme];
  if (!result.fullCheck || result.strictRenderFrames !== 240 || result.cutSsim < 0.9999) {
    throw new Error(`${theme} v0.0.42 sequence did not pass full render and cut checks`);
  }
  const example = `examples/t3-code-v0042-brief-worktree/${theme === "dark" ? "index.html" : "index-light.html"}`;
  const prefix = `parity/t3-brief-worktree-v0042-sequence/${theme}`;
  for (const [path, expected] of [
    [example, result.hashes.example],
    ["examples/t3-code-v0042-brief-worktree/compositions/t3-brief-to-prompt.html", result.hashes.briefInstalled],
    ["examples/t3-code-v0042-brief-worktree/compositions/t3-new-worktree-choice.html", result.hashes.worktreeInstalled],
    [`${prefix}-before-cut.png`, result.hashes.beforeCut],
    [`${prefix}-after-cut.png`, result.hashes.afterCut],
    [`${prefix}.mp4`, result.hashes.video],
  ]) {
    if (hash(await readFile(resolve(root, path))) !== expected) {
      throw new Error(`${theme} v0.0.42 sequence artifact changed: ${path}`);
    }
  }
  const check = JSON.parse(await readFile(resolve(root, `${prefix}-check.json`), "utf8"));
  if (!check.ok) throw new Error(`${theme} v0.0.42 sequence full check failed`);
  const comparison = spawnSync("ffmpeg", ["-hide_banner", "-i", resolve(root, `${prefix}-before-cut.png`),
    "-i", resolve(root, `${prefix}-after-cut.png`), "-lavfi", "ssim", "-f", "null", "-"], { encoding: "utf8" });
  const score = Number(comparison.stderr.match(/All:([\d.]+)/)?.[1]);
  if (comparison.status !== 0 || !Number.isFinite(score) || Math.abs(score - result.cutSsim) > 0.000001) {
    throw new Error(`${theme} v0.0.42 sequence cut no longer matches its measured parity`);
  }
}
console.log("T3 Code v0.0.42 installed dark/light Brief → Worktree sequence validated.");
