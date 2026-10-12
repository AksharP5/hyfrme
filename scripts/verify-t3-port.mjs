import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const variant = process.argv[2] ?? "brief";
if (variant === "new-worktree-choice") {
  throw new Error("New Worktree Choice uses the v0.0.42 dark/light verifier: scripts/verify-t3-worktree-choice-v0042-port.mjs");
}
if (variant === "return-worktree") {
  throw new Error("Return to a Worktree uses the v0.0.42 dark/light verifier: scripts/verify-t3-return-worktree-v0042-port.mjs");
}
const ports = {
  brief: {
    name: "t3-brief-to-prompt",
    fixtureFile: "brief-fixture.json",
    thresholds: { meanSsim: 0.99, minSsim: 0.985 },
    props: (fixture) => ({
      projectName: "hyfrme",
      branchName: "main",
      prompt: fixture.prompt,
      typingStart: fixture.typingStart,
      typingEnd: fixture.typingEnd,
    }),
  },
  "model-swap": {
    name: "t3-model-swap",
    fixtureFile: "model-swap-fixture.json",
    thresholds: { meanSsim: 0.9895, minSsim: 0.985 },
    props: (fixture) => ({
      projectName: "hyfrme",
      branchName: "main",
      prompt: fixture.prompt,
      modelBefore: fixture.modelBefore,
      modelAfter: fixture.modelAfter,
      openFrame: fixture.openFrame,
      selectFrame: fixture.selectFrame,
    }),
  },
  "reasoning-level": {
    name: "t3-reasoning-level",
    fixtureFile: "reasoning-level-fixture.json",
    thresholds: { meanSsim: 0.9895, minSsim: 0.985 },
    props: (fixture) => ({
      projectName: "hyfrme",
      branchName: "main",
      prompt: fixture.prompt,
      reasoningBefore: fixture.reasoningBefore,
      reasoningAfter: fixture.reasoningAfter,
      openFrame: fixture.openFrame,
      selectFrame: fixture.selectFrame,
    }),
  },
  "fast-service-tier": {
    name: "t3-fast-service-tier",
    fixtureFile: "fast-service-tier-fixture.json",
    thresholds: { meanSsim: 0.9895, minSsim: 0.985 },
    props: (fixture) => ({
      projectName: "hyfrme",
      branchName: "main",
      prompt: fixture.prompt,
      reasoningLevel: fixture.reasoning,
      serviceBefore: fixture.serviceBefore,
      serviceAfter: fixture.serviceAfter,
      openFrame: fixture.openFrame,
      selectFrame: fixture.selectFrame,
    }),
  },
  "new-worktree-choice": {
    name: "t3-new-worktree-choice",
    fixtureFile: "new-worktree-choice-fixture.json",
    thresholds: { meanSsim: 0.989, minSsim: 0.988 },
    props: (fixture) => ({
      projectName: "hyfrme",
      branchName: "main",
      prompt: fixture.prompt,
      workspaceBefore: fixture.workspaceBefore,
      workspaceAfter: fixture.workspaceAfter,
      baseBranch: fixture.baseBranch,
      openFrame: fixture.openFrame,
      selectFrame: fixture.selectFrame,
    }),
  },
  "permission-choice": {
    name: "t3-permission-choice",
    fixtureFile: "permission-choice-fixture.json",
    thresholds: { meanSsim: 0.9895, minSsim: 0.985 },
    props: (fixture) => ({
      projectName: "hyfrme",
      branchName: "main",
      prompt: fixture.prompt,
      modelName: "GPT-5.6-Sol",
      reasoningLevel: fixture.reasoning,
      permissionBefore: fixture.permissionBefore,
      permissionAfter: fixture.permissionAfter,
      openFrame: fixture.openFrame,
      selectFrame: fixture.selectFrame,
    }),
  },
  "thread-switch": {
    name: "t3-thread-switch",
    fixtureFile: "thread-switch-fixture.json",
    thresholds: { meanSsim: 0.989, minSsim: 0.985 },
    props: (fixture) => ({
      projectName: "hyfrme",
      branchName: "main",
      threadOne: "Build a logo intro",
      threadTwo: "Catalog motion audit",
      firstSwitchFrame: fixture.firstSwitchFrame,
      secondSwitchFrame: fixture.secondSwitchFrame,
    }),
  },
  "thread-search": {
    name: "t3-thread-search",
    fixtureFile: "thread-search-fixture.json",
    thresholds: { meanSsim: 0.99, minSsim: 0.985 },
    props: (fixture) => ({
      firstQuery: fixture.firstQuery,
      finalQuery: fixture.finalQuery,
    }),
  },
  "sidebar-focus": {
    name: "t3-sidebar-focus",
    fixtureFile: "sidebar-focus-fixture.json",
    thresholds: { meanSsim: 0.989, minSsim: 0.985 },
    props: (fixture) => ({
      projectName: "hyfrme",
      branchName: "main",
      prompt: fixture.prompt,
      sidebarWidth: fixture.sidebarWidth,
      collapseFrame: fixture.collapseFrame,
      restoreFrame: fixture.restoreFrame,
      transitionMs: fixture.transitionMs,
    }),
  },
  "return-worktree": {
    name: "t3-return-worktree",
    fixtureFile: "return-worktree-fixture.json",
    thresholds: { meanSsim: 0.989, minSsim: 0.985 },
    props: (fixture) => ({
      projectName: "hyfrme",
      branchName: "main",
      prompt: fixture.prompt,
      workspaceBefore: fixture.workspaceBefore,
      workspaceAfter: fixture.workspaceAfter,
      previousWorktree: fixture.previousWorktree,
      openFrame: fixture.openFrame,
      selectFrame: fixture.selectFrame,
    }),
  },
  "worked-trace": {
    name: "t3-worked-trace",
    fixtureFile: "worked-trace-fixture.json",
    thresholds: { meanSsim: 0.989, minSsim: 0.985 },
    props: (fixture) => ({
      openFrame: fixture.openFrame,
      groupFrame: fixture.groupFrame,
      closeFrame: fixture.closeFrame,
    }),
  },
  "visual-context-shelf": {
    name: "t3-visual-context-shelf",
    fixtureFile: "visual-context-shelf-fixture.json",
    thresholds: { meanSsim: 0.989, minSsim: 0.985 },
    assets: ["t3-visual-context-logo-enter.png"],
    props: (fixture) => ({
      projectName: "hyfrme",
      branchName: "main",
      contextPrompt: fixture.contextPrompt,
      finalInstruction: fixture.finalInstruction,
      imageSrc: fixture.imageSrc,
      imageName: fixture.imageName,
      pasteFrame: fixture.pasteFrame,
      instructionFrame: fixture.instructionFrame,
    }),
  },
  "project-source-picker": {
    name: "t3-project-source-picker",
    fixtureFile: "project-source-picker-fixture.json",
    thresholds: { meanSsim: 0.989, minSsim: 0.985 },
    props: (fixture) => ({
      projectName: "hyfrme",
      branchName: "main",
      openFrame: fixture.openFrame,
      closeFrame: fixture.closeFrame,
    }),
  },
  "thread-actions": {
    name: "t3-thread-actions",
    fixtureFile: "thread-actions-fixture.json",
    thresholds: { meanSsim: 0.989, minSsim: 0.985 },
    props: (fixture) => ({
      projectName: "hyfrme",
      branchName: "main",
      openFrame: fixture.openFrame,
      submenuFrame: fixture.submenuFrame,
      closeFrame: fixture.closeFrame,
    }),
  },
  "settle-thread": {
    name: "t3-settle-thread",
    fixtureFile: "settle-thread-fixture.json",
    thresholds: { meanSsim: 0.989, minSsim: 0.985 },
    props: (fixture) => ({
      projectName: "hyfrme",
      branchName: "main",
      settledThreadTitle: "Build a logo intro",
      nextThreadTitle: "Catalog motion audit",
      settledCount: 2,
      hoverFrame: fixture.hoverFrame,
      settleFrame: fixture.settleFrame,
      collapseFrame: fixture.collapseFrame,
      expandFrame: fixture.expandFrame,
    }),
  },
  "terminal-check": {
    name: "t3-terminal-check",
    fixtureFile: "terminal-check-fixture.json",
    thresholds: { meanSsim: 0.989, minSsim: 0.985 },
    assets: [
      "terminal-check-canvas-ready-0.png",
      "terminal-check-canvas-ready-1.png",
      "terminal-check-canvas-typed-0.png",
      "terminal-check-canvas-typed-1.png",
      "terminal-check-canvas-output-0.png",
      "terminal-check-canvas-output-1.png",
    ],
    props: (fixture) => ({
      projectName: "hyfrme",
      branchName: "main",
      command: fixture.command,
      output: fixture.output,
      openFrame: fixture.openFrame,
      typeFrame: fixture.typeFrame,
      runFrame: fixture.runFrame,
    }),
  },
  "file-surface": {
    name: "t3-file-surface",
    fixtureFile: "file-surface-fixture.json",
    thresholds: { meanSsim: 0.989, minSsim: 0.985 },
    props: (fixture) => ({
      projectName: "hyfrme",
      branchName: "main",
      openFrame: fixture.openFrame,
      hoverFrame: fixture.hoverFrame,
      filesFrame: fixture.filesFrame,
    }),
  },
  "source-file-open": {
    name: "t3-source-file-open",
    fixtureFile: "source-file-open-fixture.json",
    thresholds: { meanSsim: 0.989, minSsim: 0.985 },
    extraSources: (fixture) => [
      ...Object.entries(fixture.shadowHashes).map(([phase, sha256]) => [
        `source-file-open-${phase}-shadows.json`,
        sha256,
      ]),
      ["source-file-open-logo-enter.html", fixture.sourceFileSha256],
    ],
    props: (fixture) => ({
      projectName: "hyfrme",
      branchName: "main",
      sourceDuration: "3.6",
      filesFrame: fixture.filesFrame,
      expandFrame: fixture.expandFrame,
      openFrame: fixture.openFrame,
    }),
  },
  "commit-review": {
    name: "t3-commit-review",
    fixtureFile: "commit-review-fixture.json",
    thresholds: { meanSsim: 0.989, minSsim: 0.985 },
    extraSources: (fixture) => Object.entries(fixture.thirdPartySourceHashes),
    props: (fixture) => ({
      branchName: fixture.branch,
      changedFile: fixture.changedFile,
      insertions: fixture.insertions,
      deletions: fixture.deletions,
      commitMessage: fixture.commitMessage,
      menuFrame: fixture.menuFrame,
      dialogFrame: fixture.dialogFrame,
      messageFrame: fixture.messageFrame,
    }),
  },
};
const port = ports[variant];
if (!port) throw new Error(`Unknown T3 Code port: ${variant}`);
const { name } = port;
const block = resolve(root, "registry/blocks", name);
const reference = resolve(root, `parity/${name}-reference.mkv`);
const source = resolve(root, "assets/t3-code/v0.0.35");
const fixture = JSON.parse(
  await readFile(resolve(source, port.fixtureFile), "utf8"),
);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const fileHash = async (path) => hash(await readFile(path));
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    ...options,
  });
  if (result.status !== 0)
    throw new Error(
      `${command} ${args.join(" ")} failed:\n${result.stderr.slice(-4000)}\n${result.stdout.slice(-2000)}`,
    );
  return result;
};

const captureFiles = [
  ...(
  variant === "brief"
    ? [
        ["brief-base.html", fixture.domSha256],
        ["brief-shell.html", fixture.shellSha256],
      ]
    : variant === "thread-search"
      ? Object.values(fixture.stateFiles).map(({ file, sha256 }) => [file, sha256])
      : Object.entries(fixture.sourceDomHashes).map(([phase, sha256]) => [
          `${variant}-${phase}.html`,
          sha256,
        ])
  ),
  ...(port.extraSources?.(fixture) ?? []),
];
const themeFixture =
  variant === "brief"
    ? fixture
    : JSON.parse(await readFile(resolve(source, "brief-fixture.json"), "utf8"));
for (const [file, expected] of [
  ...captureFiles,
  ["dark-theme.json", themeFixture.themeSha256],
  ["t3.css", fixture.sourceHashes.css],
]) {
  if ((await fileHash(resolve(source, file))) !== expected)
    throw new Error(`${file} differs from its pinned T3 Code capture`);
}
if ((await fileHash(reference)) !== fixture.referenceSha256)
  throw new Error("Native T3 Code reference changed since capture");

const work = await mkdtemp(join(tmpdir(), `hyfrme-${name}-`));
const project = resolve(work, "project");
const compositions = resolve(project, "compositions");
const nativeFrames = resolve(work, "native");
const outputFrames = resolve(work, "hyperframes");
await mkdir(compositions, { recursive: true });
await mkdir(nativeFrames);
for (const file of [`${name}.html`, "t3-code-gsap.min.js", ...(port.assets ?? [])]) {
  await copyFile(resolve(block, file), resolve(compositions, file));
}
await writeFile(
  resolve(project, "index.html"),
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:#0a0a0a}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-brief-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-brief-fixture']=gsap.timeline({paused:true});</script></body></html>`,
);

const check = JSON.parse(
  run("npx", ["hyperframes", "check", project, "--json"]).stdout,
);
if (!check.ok)
  throw new Error(
    `HyperFrames full check failed: ${JSON.stringify(check).slice(0, 3000)}`,
  );
run("npx", [
  "hyperframes",
  "render",
  project,
  "--format=png-sequence",
  "-o",
  outputFrames,
  "--strict",
  "--workers=2",
]);
run("ffmpeg", [
  "-hide_banner",
  "-loglevel",
  "error",
  "-i",
  reference,
  resolve(nativeFrames, "frame-%04d.png"),
]);

const renderedFiles = (await readdir(outputFrames)).filter((file) =>
  file.endsWith(".png"),
);
if (renderedFiles.length !== fixture.frames)
  throw new Error(
    `Expected ${fixture.frames} rendered frames; got ${renderedFiles.length}`,
  );
const stats = resolve(work, "ssim.txt");
run("ffmpeg", [
  "-hide_banner",
  "-loglevel",
  "error",
  "-framerate",
  String(fixture.fps),
  "-start_number",
  "0",
  "-i",
  resolve(nativeFrames, "frame-%04d.png"),
  "-framerate",
  String(fixture.fps),
  "-start_number",
  "1",
  "-i",
  resolve(outputFrames, "frame_%06d.png"),
  "-lavfi",
  `ssim=stats_file=${stats}`,
  "-f",
  "null",
  "-",
]);
const frameScores = [
  ...(await readFile(stats, "utf8")).matchAll(/^n:\d+ .*?All:([\d.]+)/gm),
].map((match) => Number(match[1]));
if (frameScores.length !== fixture.frames)
  throw new Error(
    `Expected ${fixture.frames} SSIM scores; got ${frameScores.length}`,
  );
const sorted = [...frameScores].sort((a, b) => a - b);
const result = {
  frameCount: frameScores.length,
  meanSsim:
    frameScores.reduce((sum, score) => sum + score, 0) / frameScores.length,
  minSsim: sorted[0],
  p05Ssim: sorted[Math.floor(sorted.length * 0.05)],
  p95Ssim: sorted[Math.floor(sorted.length * 0.95)],
};
result.pass =
  result.meanSsim >= port.thresholds.meanSsim &&
  result.minSsim >= port.thresholds.minSsim;
if (!result.pass)
  throw new Error(`T3 Code parity failed: ${JSON.stringify(result)}`);

const previews = resolve(root, "public/previews", name);
await mkdir(previews, { recursive: true });
run("ffmpeg", [
  "-hide_banner",
  "-loglevel",
  "error",
  "-y",
  "-i",
  reference,
  "-vf",
  "pad=1200:660:0:0:black",
  "-c:v",
  "libx264",
  "-preset",
  "slow",
  "-crf",
  "18",
  "-pix_fmt",
  "yuv420p",
  "-an",
  resolve(previews, "reference.mp4"),
]);
run("ffmpeg", [
  "-hide_banner",
  "-loglevel",
  "error",
  "-y",
  "-framerate",
  String(fixture.fps),
  "-start_number",
  "1",
  "-i",
  resolve(outputFrames, "frame_%06d.png"),
  "-vf",
  "pad=1200:660:0:0:black",
  "-c:v",
  "libx264",
  "-preset",
  "slow",
  "-crf",
  "18",
  "-pix_fmt",
  "yuv420p",
  "-an",
  resolve(previews, "hyperframes.mp4"),
]);
await copyFile(
  resolve(outputFrames, "frame_000061.png"),
  resolve(previews, "thumbnail.png"),
);
await copyFile(stats, resolve(root, `parity/${name}-ssim.txt`));
await writeFile(
  resolve(root, `parity/${name}.json`),
  `${JSON.stringify(
    {
      slug: name,
      origin: {
        repository: "https://github.com/pingdotgg/t3code",
        commit: fixture.sourceCommit,
        source: "apps/web",
        license: "MIT",
      },
      fixture: {
        width: fixture.viewport.width,
        height: fixture.viewport.height,
        fps: fixture.fps,
        durationInFrames: fixture.frames,
        props: port.props(fixture),
        sourceHashes: fixture.sourceHashes,
        domSha256: fixture.domSha256 ?? fixture.sourceDomHashes ?? Object.fromEntries(Object.entries(fixture.stateFiles).map(([query, { sha256 }]) => [query, sha256])),
        referenceSha256: fixture.referenceSha256,
        compositionSha256: await fileHash(resolve(block, `${name}.html`)),
        ...(port.assets?.length
          ? {
              assetSha256: Object.fromEntries(
                await Promise.all(
                  port.assets.map(async (asset) => [asset, await fileHash(resolve(block, asset))]),
                ),
              ),
            }
          : {}),
      },
      classification: "source-dom-port",
      measurement: "lossless-png",
      status: "verified",
      thresholds: port.thresholds,
      result,
      checks: {
        hyperframes: "full check passed with no errors; strict render passed",
        hyperframesVersion: "0.8.75",
        sourceBrowser: fixture.captureBrowser?.version ?? "Chrome Headless Shell 152.0.7977.30",
        ...(fixture.captureBrowser?.flags
          ? { sourceBrowserFlags: fixture.captureBrowser.flags }
          : {}),
        browserGpuMode: "hardware",
        installedThroughCli: true,
        ...(variant !== "brief" && variant !== "thread-search" && variant !== "thread-switch" && variant !== "sidebar-focus" && variant !== "worked-trace" && variant !== "visual-context-shelf"
          ? {
              intentionalLayoutIgnore:
                variant === "new-worktree-choice"
                  ? "The native Workspace menu covers the composer; only the underlying text regions are excluded from HyperFrames layout-overlap checks."
                  : variant === "return-worktree"
                    ? "The native Workspace menu covers the composer; only the underlying text regions are excluded from HyperFrames layout-overlap checks."
                  : variant === "permission-choice"
                    ? "The native access popup covers the composer footer; the popup and the form beneath it are excluded from the layout-overlap audit."
                    : "The native popover intentionally covers the heading and composer; only those underlying text regions are excluded from HyperFrames layout-overlap checks.",
            }
          : {}),
      },
      artifacts: {
        referenceVideo: `public/previews/${name}/reference.mp4`,
        hyperframesVideo: `public/previews/${name}/hyperframes.mp4`,
        thumbnail: `public/previews/${name}/thumbnail.png`,
        frameSsim: `parity/${name}-ssim.txt`,
      },
    },
    null,
    2,
  )}\n`,
);
console.log(
  `${name}: ${result.frameCount} frames, mean SSIM ${result.meanSsim.toFixed(6)}, min ${result.minSsim.toFixed(6)}. Work: ${work}`,
);
