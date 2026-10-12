import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = process.argv[2];
const profiles = {
  "t3-project-action-run": {
    overrides: {
      projectName: "hyfrme-lab", branchName: "motion/logo-review", selectedThread: "Review frame hold",
      otherThread: "Catalog type audit", userMessage: "Check the Hyfrme logo hold at 24 frames.",
      replyBeforeFile: "I adjusted the Hyfrme timing in", replyFile: "logo-enter-v2.html",
      replyAfterFile: ". Keep the last frame visible for 24 frames.", workedDuration: "3m",
      actionName: "Verify Logo Frames", terminalPrompt: "hyfrme-lab",
      command: "git diff --check && git diff --stat -- registry/blocks/logo-enter/logo-enter.html",
      output: "registry/blocks/logo-enter/logo-enter.html | 7 +++++++",
      composerPlaceholder: "Enable a provider in Settings to send a message", providerStatus: "No provider available",
      permissionMode: "Full access", workspaceMode: "Worktree", openedFrame: 28, outputFrame: 70,
    },
    assertions: ["hyfrme-lab", "git diff --check", "7 +++++++"],
    sampleFrames: { before: 8, opened: 38, output: 96 },
    evidenceFrame: "frame_000096.png",
  },
  "t3-commit-creation": {
    overrides: {
      projectName: "hyfrme-lab", branchName: "hyfrme/logo-audit", selectedThread: "Tune Hyfrme logo",
      otherThread: "Catalog preview audit", userMessage: "Tighten the Hyfrme mark and hold the final frame.",
      replyBeforeFile: "The Hyfrme logo lives in", replyFile: "logo-enter-v2.html",
      replyAfterFile: ". Keep the final mark steady for 24 frames.", workedDuration: "4m",
      changedFile: "registry/blocks/logo-enter/intro.html", commitMessage: "Refine Hyfrme logo hold",
      insertions: "7", deletions: "2",
      composerPlaceholder: "Enable a provider in Settings to send a message", providerStatus: "No provider available",
      permissionMode: "Full access", workspaceMode: "Worktree", menuFrame: 14, dialogFrame: 27,
      typedFrame: 52, committedFrame: 91,
    },
    assertionFrames: {
      "frame_000069.png": ["hyfrme/logo-audit", "Refine Hyfrme logo hold"],
      "frame_000107.png": ["hyfrme-lab"],
    },
    sampleFrames: { before: 8, menu: 19, dialog: 38, typed: 68, committed: 106 },
    evidenceFrame: "frame_000069.png",
  },
  "t3-git-push": {
    overrides: {
      projectName: "hyfrme-lab", branchName: "motion/logo-review", selectedThread: "Review frame hold",
      dialogTitle: "Publish Hyfrme repository", composerPlaceholder: "Enable a provider in Settings to send a message",
      permissionMode: "Full access", workspaceMode: "Worktree", menuFrame: 14, dialogFrame: 42, cancelledFrame: 98,
    },
    assertionFrames: {
      "frame_000064.png": ["Publish Hyfrme repository"],
      "frame_000109.png": ["hyfrme-lab", "Review frame hold"],
    },
    sampleFrames: { before: 8, menu: 25, dialog: 64, cancelled: 108 },
    expectedIdenticalPhases: [["before", "cancelled"]],
    evidenceFrame: "frame_000064.png",
  },
  "t3-thread-reorder": {
    overrides: {
      projectName: "hyfrme-lab", branchName: "motion/logo-review", movedThread: "Review logo timing",
      otherThread: "Catalog preview audit", threadThree: "Hyfrme export QA", threadFour: "Review final hold",
      threadFive: "Logo search timing", settledThread: "Verify logo frames",
      composerPlaceholder: "Enable a provider in Settings to send a message", providerStatus: "No provider available",
      permissionMode: "Full access", workspaceMode: "Worktree", liftedFrame: 18, overFrame: 40,
      droppedFrame: 66, persistedFrame: 94,
    },
    assertions: ["hyfrme-lab", "Review logo timing", "Catalog preview audit"],
    sampleFrames: { before: 8, lifted: 30, over: 52, dropped: 78, persisted: 105 },
    expectedIdenticalPhases: [["dropped", "persisted"]],
    evidenceFrame: "frame_000105.png",
  },
};
const profile = profiles[name];
if (!profile) throw new Error(`Expected one of: ${Object.keys(profiles).join(", ")}`);
const candidate = resolve(root, `.work/${name}-v0042-candidate`);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const cleanEnv = { ...process.env, TMPDIR: resolve(root, ".work/t3-tmp") };
delete cleanEnv.LD_LIBRARY_PATH;
cleanEnv.PRODUCER_BROWSER_GPU_MODE = "software";
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, env: cleanEnv });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed:\n${result.stderr.slice(-3500)}\n${result.stdout.slice(-1200)}`);
  return result.stdout;
};
const parseJsonOutput = (output) => {
  const start = output.indexOf("{");
  const end = output.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("HyperFrames CLI did not return JSON");
  return JSON.parse(output.slice(start, end + 1));
};
const escapeAttribute = (value) => JSON.stringify(value).replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

for (const theme of ["dark", "light"]) {
  const project = resolve(root, `.work/${name}-v0042-${theme}-custom`);
  const composition = await readFile(resolve(candidate, `${name}.html`));
  const overrides = { theme, renderMode: "editable DOM", ...profile.overrides };
  await mkdir(resolve(project, "compositions"), { recursive: true });
  for (const file of await readdir(candidate)) {
    if (["registry-item.json", "README.md", "licenses"].includes(file)) continue;
    await copyFile(resolve(candidate, file), resolve(project, "compositions", file));
  }
  await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:${theme === "light" ? "#fff" : "#0a0a0a"}}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="${name}-custom-${theme}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escapeAttribute(overrides)}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['${name}-custom-${theme}']=gsap.timeline({paused:true});</script></body></html>`);
  await writeFile(resolve(project, "overrides.json"), `${JSON.stringify(overrides, null, 2)}\n`);

  const check = parseJsonOutput(run("npx", ["--yes", "hyperframes@0.8.75", "check", project, "--no-browser-gpu", "--json"]));
  await writeFile(resolve(project, "check.json"), `${JSON.stringify(check, null, 2)}\n`);
  if (!check.ok) throw new Error(`${theme} custom ${name} full HyperFrames check failed: ${JSON.stringify(check.layout?.findings ?? check).slice(0, 2600)}`);
  const renderDir = resolve(project, "render");
  run("npx", ["--yes", "hyperframes@0.8.75", "render", project, "--format=png-sequence", "-o", renderDir, "--strict", "--workers=2", "--no-browser-gpu"]);
  const frames = (await readdir(renderDir)).filter((file) => /^frame_\d{6}\.png$/.test(file));
  if (frames.length !== 120) throw new Error(`${theme} custom ${name} produced ${frames.length} strict frames`);

  const hashes = {};
  for (const [phase, frame] of Object.entries(profile.sampleFrames)) hashes[phase] = hash(await readFile(resolve(renderDir, `frame_${String(frame + 1).padStart(6, "0")}.png`)));
  const identicalPairs = new Set((profile.expectedIdenticalPhases ?? []).map(([first, second]) => [first, second].sort().join(":")));
  for (const [index, first] of Object.keys(hashes).entries()) {
    for (const second of Object.keys(hashes).slice(index + 1)) {
      if (hashes[first] === hashes[second] && !identicalPairs.has([first, second].sort().join(":"))) {
        throw new Error(`${theme} custom ${name} event phases ${first}/${second} rendered identically`);
      }
    }
  }
  for (const [first, second] of profile.expectedIdenticalPhases ?? []) {
    if (hashes[first] !== hashes[second]) throw new Error(`${theme} custom ${name} expected phases ${first}/${second} to return to the same visible state`);
  }
  const evidencePath = resolve(renderDir, profile.evidenceFrame);
  const assertions = profile.assertionFrames ?? { [profile.evidenceFrame]: profile.assertions };
  const visibleText = {};
  for (const [frame, expectedValues] of Object.entries(assertions)) {
    const ocr = run("tesseract", [resolve(renderDir, frame), "stdout", "--psm", "11"]);
    const normalized = ocr.toLowerCase().replaceAll(/[^a-z0-9]+/g, " ");
    for (const expected of expectedValues) {
      const token = expected.toLowerCase().replaceAll(/[^a-z0-9]+/g, " ").trim();
      if (!normalized.includes(token)) throw new Error(`${theme} custom ${name} does not visibly show ${expected} in ${frame}; OCR: ${ocr.slice(0, 1800)}`);
    }
    visibleText[frame] = ocr.trim();
  }
  await copyFile(evidencePath, resolve(project, "customized-state.png"));
  await writeFile(resolve(project, "proof.json"), `${JSON.stringify({ theme, fullCheck: true, strictRenderFrames: frames.length,
    compositionSha256: hash(composition), renderMode: overrides.renderMode, customVariables: overrides,
    sampleFrameSha256: hashes, evidenceFrame: profile.evidenceFrame, visibleText }, null, 2)}\n`);
  console.log(`${name} ${theme}: editable DOM, ${frames.length} strict frames, custom text and phase timing verified.`);
}
