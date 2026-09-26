import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { access, copyFile, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const profiles = {
  "t3-diff-review": {
    id: 33,
    title: "Diff Review",
    source: "apps/web/src/components/DiffPanel.tsx",
    snapshotKind: "shadow",
    interaction: "Native v0.0.42 opens the Working tree diff for a seeded +4/-1 Hyfrme Logo Enter change, then switches from stacked to split review.",
    capture: "The isolated Hyfrme project and single Logo Enter change are seeded. T3 Code's real right-panel chooser opens the diff surface, stacked view, and split view; no provider or external service runs.",
    customizationDescription: "Editable DOM mode changed Hyfrme project, branch, thread, prompt, reply, changed file, source labels, diff counts, theme, and event timing; full checks, text assertions, and strict 120-frame renders passed in both themes.",
    ideaReplacements: [],
  },
  "t3-message-rewind": {
    id: 38,
    title: "Message Rewind",
    source: "apps/web/src/components/chat/MessagesTimeline.tsx",
    interaction: "Native v0.0.42 Edit from here reveals its tooltip and opens the checkpoint dialog with Revert files too and Revert and keep changes. The seeded conversation is left unchanged by canceling the dialog.",
    capture: "The completed Hyfrme conversation and checkpoint are seeded. The real Edit from here control opens its native tooltip and dialog with both revert options; Cancel closes it. No rewind or file restore executes, and no AI provider runs.",
    ideaReplacements: [
      ["Reveal T3 Code's checkpoint rollback confirmation from a real Hyfrme prompt.", "Open T3 Code's Edit from here control and checkpoint dialog in a seeded Hyfrme thread."],
      ["Hover exposes Revert to this message and its tooltip.", "Hover reveals the native Edit from here control and tooltip."],
      ["The real confirmation opens, then Cancel returns to the thread.", "The current checkpoint dialog opens, then Cancel returns to the unchanged thread."],
      ["confirmation, phase timing", "dialog copy, theme, phase timing"],
    ],
  },
  "t3-agent-answer": {
    id: 37,
    title: "Agent Answer",
    source: "apps/web/src/components/chat/MessagesTimeline.tsx",
    interaction: "Native v0.0.42 completed-answer controls reveal Copy link, show its tooltip, copy the seeded Hyfrme reply to the browser clipboard, and display copied feedback.",
    capture: "The completed Hyfrme answer is seeded. T3 Code's native Copy link action wrote the reply to the browser clipboard and showed copied feedback; no AI provider runs.",
    ideaReplacements: [
      ["Show the completed reply and copy it from T3 Code's real thread controls.", "Copy a seeded completed Hyfrme reply with T3 Code's native thread controls."],
      ["Hover reveals reply controls and the Copy to clipboard tooltip.", "Hover reveals the reply's Copy link control and Copy to clipboard tooltip."],
      ["Copy changes the control feedback before returning to the normal reply.", "Copy places the answer on the clipboard, shows copied feedback, and returns to the reply."],
    ],
  },
  "t3-project-action-run": {
    id: 36,
    title: "Project Action Run",
    source: "apps/web/src/components/ProjectScriptsControl.tsx",
    snapshotKind: "flat",
    interaction: "Native v0.0.42 runs the saved Verify Hyfrme action in the workspace terminal. Its real git diff --check and scoped git diff --stat output come from an isolated local repository.",
    capture: "The project action was created and run through T3 Code's toolbar in an isolated Hyfrme repository. The local command and output are live; no provider, GitHub account, or remote is used.",
    customizationDescription: "Editable DOM mode changed Hyfrme project and branch, thread and reply copy, action name, terminal command/output, theme, and run timing; full checks, visible-text assertions, and strict 120-frame renders passed in both themes.",
    ideaReplacements: [
      ["Running it opens the terminal and executes npm run check.", "Running it opens the terminal and executes git diff --check plus a scoped diff stat."],
      ["TypeScript finishes cleanly and the shell prompt returns.", "The real Logo Enter diff output appears in the terminal."],
    ],
    docInsertion: "Project Action Run creates and executes Verify Hyfrme from the real v0.0.42 toolbar. The isolated command runs `git diff --check` and a scoped Logo Enter diff stat; the displayed result comes from the local repository. Both desktop themes and its editable terminal content have strict 120-frame renders.\n\n",
  },
  "t3-commit-creation": {
    id: 40,
    title: "Commit Creation",
    source: "apps/web/src/components/GitActionsControl.tsx",
    snapshotKind: "flat",
    interaction: "Native v0.0.42 creates a local commit for one real Hyfrme Logo Enter change through T3 Code's Git review dialog. The isolated repository has no remote.",
    capture: "T3 Code's actual Git review and commit actions run against an isolated local Hyfrme repository. The commit OID and changed file are read from Git; no external remote, account, or provider is used.",
    customizationDescription: "Editable DOM mode changed Hyfrme project, branch, thread and reply copy, changed file and diff counts, commit message, theme, and every Git phase time; full checks, visible-text assertions, and strict 120-frame renders passed in both themes.",
    ideaReplacements: [
      ["The changed Logo Enter file is ready on the local branch.", "One changed Logo Enter file is ready on the isolated local branch."],
      ["The commit completes and T3 Code confirms it in the workspace.", "T3 Code creates the local commit and confirms it in the workspace."],
      ["Project, thread, branch, changed file, diff counts, message, commit hash, phase timing", "Project, thread, branch, changed file, diff counts, message, phase timing"],
    ],
    customFrame: "frame_000069.png",
    docReplacement: [
      "Commit Creation uses an isolated local Git repository with one Hyfrme Logo\nEnter change. T3 Code created commit `65ac016` on `hyfrme/logo-intro`; no\nremote was configured or contacted. Its project, branch, changed file, diff\ncounts, message, hash, and phase timing have a separate custom strict render.",
      "Commit Creation uses T3 Code v0.0.42 to create a local commit for one Hyfrme\nLogo Enter change on `feature/logo-enter`. The captured Git OID, changed file,\nmessage, and diff counts come from the isolated repository, which has no remote.\nCustom project, branch, file, message, and timing pass in both themes.",
    ],
  },
  "t3-git-push": {
    id: 43,
    title: "Publish Repository",
    previousTitle: "Git Push",
    ideaTitle: "Publish Repository",
    source: "apps/web/src/components/GitActionsControl.tsx",
    snapshotKind: "flat",
    interaction: "In the unconnected v0.0.42 project, the native Git menu offers Publish repository. Its provider selection dialog opens, then is canceled without publishing.",
    capture: "This v0.0.42 fixture has no connected GitHub account. The real Git menu and first Publish repository provider step are captured, then Cancel closes it without contacting or publishing to a remote.",
    providerState: "Seeded unconnected GitHub account; the v0.0.42 Publish repository dialog is opened and canceled. No external account or remote is contacted.",
    customizationDescription: "Editable DOM mode changed the Hyfrme project, branch, selected thread, dialog title, theme, and menu/dialog/cancel timing; full checks, visible-text assertions, and strict 120-frame renders passed in both themes. GitHub remains an explicitly seeded unconnected account state.",
    ideaReplacements: [
      ["Push the committed Hyfrme change from T3 Code to its repository.", "Open T3 Code's v0.0.42 Publish repository dialog for an isolated Hyfrme project."],
      ["The local branch is ready to push from the real Git action menu.", "The v0.0.42 Git menu offers Publish repository for this unconnected project."],
      ["T3 Code shows Pushing to origin while the local bare remote accepts the commit.", "The first provider-selection step opens for the unconnected GitHub account."],
      ["A success toast confirms Pushed to origin/hyfrme/logo-intro.", "Cancel closes the dialog; no repository is published."],
      ["Project, thread, branch, remote, progress, result actions, phase timing", "Project, thread, branch, dialog title, theme, menu/dialog/cancel timing"],
    ],
    customFrame: "frame_000065.png",
    docReplacement: [
      "Git Push uses T3 Code's real action with a local bare remote. The isolated\nremote advanced from `d70e55c` to `65ac016`, and no external remote was\ncontacted. A separate strict custom render verifies the branch, target,\nprogress, result actions, and phase timing.",
      "Publish Repository reflects the actual v0.0.42 menu for an unconnected\nproject. T3 Code opens its provider and repository dialog; the isolated fixture\nshows a seeded GitHub connection state and cancels without publishing. Dark/light\nnative frames and the editable project, dialog title, and timing are checked.",
    ],
  },
  "t3-thread-reorder": {
    id: 50,
    title: "Pinned Thread Reorder",
    source: "apps/web/src/components/Sidebar.tsx",
    snapshotKind: "flat",
    interaction: "Two Hyfrme threads are pinned in the real v0.0.42 sidebar. Dragging Catalog motion audit above Build a logo intro changes the stored order and persists after reload.",
    capture: "Both threads were pinned through T3 Code in the isolated local database. A real sidebar drag changes the moved thread's order key; reloading the v0.0.42 app confirms the new order. No AI provider or external account is used.",
    customizationDescription: "Editable DOM mode changed Hyfrme project and branch, both dragged thread titles, surrounding pinned rows, theme, and lift/over/drop/persist timing; full checks, visible-text assertions, and strict 120-frame renders passed in both themes.",
    ideaReplacements: [
      ["Two pinned threads begin in their stored order.", "Two Hyfrme threads are pinned in their stored sidebar order."],
      ["The native drag lifts Catalog motion audit over Build a logo intro.", "The native drag moves Catalog motion audit above Build a logo intro."],
      ["The reordered pinned list remains after reload.", "T3 Code retains the reordered pinned list after reload."],
    ],
    customFrame: "frame_000106.png",
    docReplacement: [
      "The older Pinned Thread Reorder fixture uses T3 Code's drag control on two actually pinned\nthreads. The isolated database changes the dragged thread's pin-order key,\nand a reload retains the new order. Its hover and drag-over frames are included\nin the all-frame parity gate, and a separate render checks edited content and\ntiming. That v0.0.35 result does not cover v0.0.42's active-thread drag path.",
      "Pinned Thread Reorder uses two genuinely pinned Hyfrme threads in T3 Code\nv0.0.42. The real sidebar drag updates the moved thread's stored order key and\nreload preserves it. Dark/light 120-frame comparison includes lift, drag-over,\ndrop, and persistence; custom thread labels and event timing are also rendered.",
    ],
  },
};
const name = process.argv[2];
const profile = profiles[name];
if (!profile) throw new Error(`Expected one of: ${Object.keys(profiles).join(", ")}`);
const root = resolve(import.meta.dirname, "..");
const shortName = name.replace(/^t3-/, "");
const source = resolve(root, "assets/t3-code/v0.0.42");
const candidate = resolve(root, `.work/${name}-v0042-candidate`);
const block = resolve(root, "registry/blocks", name);
const previews = resolve(root, "public/previews", name);
const diff = resolve(root, `parity/${name}-diff`);
const manifestPath = resolve(root, `parity/${name}.json`);
const legacyManifest = resolve(root, `parity/legacy/${name}-v0035.json`);
const legacyBlock = resolve(root, `parity/legacy/${name}-v0035-block`);
const legacyPreviews = resolve(root, `parity/legacy/${name}-v0035-preview`);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const exists = async (path) => access(path).then(() => true, () => false);
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stderr.slice(-2500)}\n${result.stdout.slice(-800)}`);
  return result.stdout;
};

const currentManifest = await readJson(manifestPath);
const legacy = currentManifest.origin.commit === "f925d639421844f02b3166d29281905dbba6d529"
  ? currentManifest
  : await readJson(legacyManifest);
if (legacy.origin.commit !== "f925d639421844f02b3166d29281905dbba6d529") throw new Error(`${name} manifest is not the pinned v0.0.35 version`);
const compositionSha256 = hash(await readFile(resolve(candidate, `${name}.html`)));
const cli = await readJson(resolve(root, `.work/${name}-v0042-cli/proof.json`));
const atlas = await readJson(resolve(root, `parity/${name}-v0042-atlas.json`));
if (cli.name !== name || !cli.installedThroughCli || cli.compositionSha256 !== compositionSha256 ||
    cli.themes.join(",") !== "dark,light" || atlas.sourceCommit !== "719a76ca1dbf5490f1aa33ffb9966301e02be9a9") {
  throw new Error(`${name} CLI install or native capture-atlas proof is incomplete`);
}

const themes = {};
for (const theme of ["dark", "light"]) {
  const fixture = await readJson(resolve(source, `${shortName}-v0042-${theme}-fixture.json`));
  const work = resolve(root, `.work/${name}-v0042-${theme}-verify`);
  const custom = await readJson(resolve(root, `.work/${name}-v0042-${theme}-custom/proof.json`));
  const customCheck = await readJson(resolve(root, `.work/${name}-v0042-${theme}-custom/check.json`));
  const installedCheck = await readJson(resolve(root, `.work/${name}-v0042-cli/${theme}/check.json`));
  const check = await readJson(resolve(work, "hyperframes-check-raw.json"));
  const verification = await readJson(resolve(work, "result.json"));
  const reference = resolve(root, `parity/${name}-v0042-${theme}-reference.mkv`);
  if (fixture.sourceTag !== "v0.0.42" || fixture.sourceCommit !== atlas.sourceCommit || fixture.theme !== theme ||
      fixture.frames !== 120 || fixture.fps !== 30 || hash(await readFile(reference)) !== fixture.referenceSha256 ||
      verification.fixture.compositionSha256 !== compositionSha256 || !verification.result.pass ||
      verification.result.frameCount !== 120 || verification.result.meanSsim < 0.985 || verification.result.minSsim < 0.980 ||
      !check.ok || !customCheck.ok || !installedCheck.ok || custom.theme !== theme ||
      custom.compositionSha256 !== compositionSha256 || custom.renderMode !== "editable DOM" || custom.strictRenderFrames !== 120) {
    throw new Error(`${theme} ${name} native parity, custom-variable, or installed check is incomplete`);
  }
  for (const [phase, expected] of Object.entries(fixture.sourceDomHashes)) {
    const phaseFiles = profile.snapshotKind === "shadow"
      ? [`${shortName}-v0042-${theme}-${phase}.html`, `${shortName}-v0042-${theme}-${phase}-shadows.json`]
      : [`${shortName}-v0042-${theme}-${phase}.html`];
    const hashes = await Promise.all(phaseFiles.map(async (file) => hash(await readFile(resolve(source, file)))));
    const expectedHashes = profile.snapshotKind === "shadow" ? [expected.root, expected.shadows] : [expected];
    if (hashes.some((value, index) => value !== expectedHashes[index])) throw new Error(`${theme} ${phase} native DOM snapshot changed`);
  }
  for (const [phase, expected] of Object.entries(fixture.portalHashes ?? {})) {
    if (profile.snapshotKind === "shadow" || hash(await readFile(resolve(source, `${shortName}-v0042-${theme}-${phase}-portal.html`))) !== expected) {
      throw new Error(`${theme} ${phase} native portal snapshot changed`);
    }
  }
  for (const [row, expected] of Object.entries(fixture.captureSpriteSha256 ?? {})) {
    if (hash(await readFile(resolve(source, `${shortName}-v0042-${theme}-capture-${row}.webp`))) !== expected) throw new Error(`${theme} capture strip ${row} changed`);
  }
  if (Object.keys(fixture.captureSpriteSha256 ?? {}).length !== 10 || fixture.captureSpriteFrameCount !== 120) throw new Error(`${theme} native atlas is incomplete`);

  await mkdir(resolve(diff, theme), { recursive: true });
  await copyFile(resolve(work, "ssim.txt"), resolve(diff, theme, "ssim.txt"));
  await copyFile(resolve(work, "hyperframes-check-raw.json"), resolve(diff, theme, "hyperframes-check.json"));
  await copyFile(resolve(root, `.work/${name}-v0042-cli/${theme}/check.json`), resolve(diff, theme, "installed-check.json"));
  await copyFile(resolve(root, `.work/${name}-v0042-${theme}-custom/check.json`), resolve(diff, theme, "custom-check.json"));
  const customFrame = profile.customFrame ?? "frame_000096.png";
  await copyFile(resolve(root, `.work/${name}-v0042-${theme}-custom/render/${customFrame}`), resolve(diff, theme, "customized-state.png"));
  const scores = [...(await readFile(resolve(work, "ssim.txt"), "utf8")).matchAll(/^n:\d+ .*?All:([\d.]+)/gm)].map((match) => Number(match[1])).sort((a, b) => a - b);
  if (scores.length !== 120) throw new Error(`${theme} SSIM report does not contain 120 frames`);
  const suffix = theme === "light" ? "-light" : "";
  themes[theme] = {
    sourceCommit: fixture.sourceCommit,
    referenceSha256: fixture.referenceSha256,
    sourceHashes: fixture.sourceHashes,
    sourceDomHashes: fixture.sourceDomHashes,
    themeSha256: hash(await readFile(resolve(source, `${theme}-theme.json`))),
    result: { ...verification.result, p05Ssim: scores[6], p95Ssim: scores[114] },
    providerState: profile.providerState ?? fixture.providerState,
    events: fixture.events,
    artifacts: {
      nativeRecording: `parity/${name}-v0042-${theme}-reference.mkv`,
      referenceVideo: `public/previews/${name}/reference${suffix}.mp4`,
      hyperframesVideo: `public/previews/${name}/hyperframes${suffix}.mp4`,
      frameSsim: `parity/${name}-diff/${theme}/ssim.txt`,
      hyperframesCheck: `parity/${name}-diff/${theme}/hyperframes-check.json`,
      installedCheck: `parity/${name}-diff/${theme}/installed-check.json`,
      customCheck: `parity/${name}-diff/${theme}/custom-check.json`,
      customized: `parity/${name}-diff/${theme}/customized-state.png`,
    },
  };
}

await mkdir(resolve(root, "parity/legacy"), { recursive: true });
if (!await exists(legacyManifest)) await copyFile(manifestPath, legacyManifest);
if (!await exists(legacyBlock)) await cp(block, legacyBlock, { recursive: true });
if (!await exists(legacyPreviews)) await cp(previews, legacyPreviews, { recursive: true });
await rm(block, { recursive: true, force: true });
await cp(candidate, block, { recursive: true });

for (const theme of ["dark", "light"]) {
  const suffix = theme === "light" ? "-light" : "";
  const work = resolve(root, `.work/${name}-v0042-${theme}-verify`);
  const reference = resolve(root, `parity/${name}-v0042-${theme}-reference.mkv`);
  run("ffmpeg", ["-v", "error", "-y", "-i", reference, "-vf", `pad=1200:660:0:0:${theme === "light" ? "white" : "black"}`,
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-an", resolve(previews, `reference${suffix}.mp4`)]);
  run("ffmpeg", ["-v", "error", "-y", "-framerate", "30", "-start_number", "1", "-i", resolve(work, "hyperframes/frame_%06d.png"),
    "-vf", `pad=1200:660:0:0:${theme === "light" ? "white" : "black"}`, "-c:v", "libx264", "-preset", "slow", "-crf", "18",
    "-pix_fmt", "yuv420p", "-an", resolve(previews, `hyperframes${suffix}.mp4`)]);
  await copyFile(resolve(work, "hyperframes/frame_000046.png"), resolve(previews, `thumbnail${suffix}.png`));
  run("magick", [resolve(previews, `thumbnail${suffix}.png`), "-quality", "85", resolve(previews, `thumbnail${suffix}.webp`)]);
}

const dark = await readJson(resolve(source, `${shortName}-v0042-dark-fixture.json`));
const manifest = {
  slug: name,
  origin: { repository: "https://github.com/pingdotgg/t3code", commit: dark.sourceCommit, source: profile.source, license: "MIT" },
  fixture: { width: dark.viewport.width, height: dark.viewport.height, fps: dark.fps,
    durationInFrames: dark.frames, props: { theme: "dark", ...dark.events }, sourceHashes: dark.sourceHashes,
    captureAtlas: `parity/${name}-v0042-atlas.json`, compositionSha256 },
  interaction: profile.interaction,
  providerState: dark.providerState,
  classification: "source-dom-port with lossless native-frame default",
  measurement: "lossless PNG; every native capture strip round-trips at SSIM 1.0",
  status: "verified",
  thresholds: { meanSsim: 0.985, minSsim: 0.980 },
  result: themes.dark.result,
  themes,
  checks: { hyperframes: "full checks and strict 120-frame renders passed in dark and light",
    hyperframesVersion: "0.8.75", sourceBrowser: "Google Chrome for Testing 152.0.7977.30", installedThroughCli: true,
    customVariables: profile.customizationDescription ?? "Editable DOM mode changed Hyfrme project and thread text, prompt, visible action or dialog, theme, and event timing; full checks, text assertions, and strict 120-frame renders passed in both themes." },
  artifacts: { ...themes.dark.artifacts, thumbnail: `public/previews/${name}/thumbnail.png`, lightThumbnail: `public/previews/${name}/thumbnail-light.png` },
};
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const ideasPath = resolve(root, "parity/t3-gallery/data.js");
let ideasSource = await readFile(ideasPath, "utf8");
if (profile.ideaTitle) {
  const lineStart = `  idea(${profile.id}, `;
  const lines = ideasSource.split("\n");
  const index = lines.findIndex((line) => line.startsWith(lineStart));
  if (index < 0) throw new Error(`${profile.title} catalog idea is missing`);
  lines[index] = lines[index].replace(/^(\s*idea\(\d+,\s*"[^"]+",\s*)"[^"]+"/, `$1"${profile.ideaTitle}"`);
  ideasSource = lines.join("\n");
}
const entry = `  [${profile.id}, { themes: ["dark", "light"], coverage: "frame parity (seeded local state)", capture: "${profile.capture}" }],\n`;
if (ideasSource.includes(`  [${profile.id}, {`)) {
  if (!ideasSource.includes(entry)) throw new Error(`${profile.title} release metadata exists with different content`);
} else {
  const nextRelease = [...ideasSource.matchAll(/^  \[(\d+), \{/gm)].find((match) => Number(match[1]) > profile.id);
  const insertAt = nextRelease?.index ?? ideasSource.lastIndexOf("]);\n");
  ideasSource = ideasSource.slice(0, insertAt) + entry + ideasSource.slice(insertAt);
}
for (const [before, after] of profile.ideaReplacements) {
  if (ideasSource.includes(before)) ideasSource = ideasSource.replace(before, after);
  else if (!ideasSource.includes(after)) throw new Error(`Could not find catalog copy to update: ${before}`);
}
await writeFile(ideasPath, ideasSource);

const galleryPath = resolve(root, "parity/t3code-ideas.json");
const gallery = await readJson(galleryPath);
const recording = gallery.recordings.find((item) => item.idea === profile.id);
if (!recording) throw new Error(`${profile.title} gallery recording is missing`);
for (const frame of gallery.frames.filter((item) => item.idea === profile.id)) frame.sourceVideo = `parity/${name}-v0042-dark-reference.mkv`;
recording.sourceVideo = `parity/${name}-v0042-dark-reference.mkv`;
await writeFile(galleryPath, `${JSON.stringify(gallery, null, 2)}\n`);

const coveragePath = resolve(root, "docs/T3_CODE_COVERAGE.md");
let coverage = await readFile(coveragePath, "utf8");
const intro = coverage.match(/except ([\s\S]*?), which\n/);
if (!intro) throw new Error("Could not find the T3 coverage introduction");
const coveredNames = intro[1].replaceAll(/\s+/g, " ").split(", ");
if (!coveredNames.includes(profile.title)) coveredNames.unshift(profile.title);
if (profile.previousTitle) {
  const oldName = coveredNames.indexOf(profile.previousTitle);
  if (oldName >= 0) coveredNames.splice(oldName, 1);
}
coverage = coverage.replace(intro[0], `except ${coveredNames.join(", ")}, which\n`);
const darkScore = themes.dark.result;
const lightScore = themes.light.result;
const row = `| ${profile.title} (v0.0.42, dark + light) | ${profile.id} | \`${name}\` | dark mean/min ${darkScore.meanSsim.toFixed(6)}/${darkScore.minSsim.toFixed(6)}; light ${lightScore.meanSsim.toFixed(6)}/${lightScore.minSsim.toFixed(6)}, 120 frames each |`;
const coverageLines = coverage.split("\n");
const rowIndex = coverageLines.findIndex((line) => {
  const cells = line.split("|").map((cell) => cell.trim());
  const title = cells[1] ?? "";
  return (title === profile.title || title === profile.previousTitle || title.startsWith(`${profile.title} (v0.0.42`)) &&
    cells[2] === String(profile.id) && cells[3] === `\`${name}\``;
});
if (rowIndex < 0) throw new Error(`${profile.title} coverage row is missing`);
coverageLines[rowIndex] = row;
coverage = coverageLines.join("\n");
await writeFile(coveragePath, coverage);
if (profile.docReplacement) {
  let updated = await readFile(coveragePath, "utf8");
  const [before, after] = profile.docReplacement;
  if (updated.includes(before)) updated = updated.replace(before, after);
  else if (!updated.includes(after)) throw new Error(`Could not find coverage text to update for ${profile.title}`);
  await writeFile(coveragePath, updated);
}
if (profile.docInsertion) {
  let updated = await readFile(coveragePath, "utf8");
  if (!updated.includes(profile.docInsertion.trim())) {
    const marker = "Agent Answer uses a completed reply seeded";
    const index = updated.indexOf(marker);
    if (index < 0) throw new Error(`Could not find the insertion point for ${profile.title} documentation`);
    updated = updated.slice(0, index) + profile.docInsertion + updated.slice(index);
    await writeFile(coveragePath, updated);
  }
}
run(process.execPath, [resolve(root, "scripts/sync-t3-gallery-fixtures.mjs"), String(profile.id)]);
console.log(`Published ${name} v0.0.42 in both themes; the v0.0.35 block, manifest, and previews are archived.`);
