import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFile, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-sidebar-focus";
const source = resolve(root, "assets/t3-code/v0.0.42");
const candidate = resolve(root, ".work/t3-sidebar-focus-v0042-candidate");
const preview = resolve(root, "public/previews", name);
const diff = resolve(root, `parity/${name}-diff`);
const manifestPath = resolve(root, `parity/${name}.json`);
const sha256 = async (path) => createHash("sha256").update(await readFile(path)).digest("hex");
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr.slice(-3000)}`);
  return result;
};
const scoreList = async (path) => [...(await readFile(path, "utf8")).matchAll(/^n:\d+ .*?All:([\d.]+)/gm)]
  .map((match) => Number(match[1]));
const sourceCommit = "719a76ca1dbf5490f1aa33ffb9966301e02be9a9";
const candidateHash = await sha256(resolve(candidate, `${name}.html`));
const oldManifest = JSON.parse(await readFile(manifestPath, "utf8"));
if (!["f925d639421844f02b3166d29281905dbba6d529", sourceCommit].includes(oldManifest.origin.commit)) {
  throw new Error("Unexpected existing sidebar source commit");
}
const cli = JSON.parse(await readFile(resolve(root, ".work/t3-sidebar-focus-v0042-cli/proof.json"), "utf8"));
if (!cli.installedThroughCli || cli.themes.join(",") !== "dark,light" || cli.compositionSha256 !== candidateHash) {
  throw new Error("CLI-installed source or theme proof is missing");
}
const capture = {};
for (const theme of ["dark", "light"]) {
  const custom = JSON.parse(await readFile(resolve(root, `.work/t3-sidebar-focus-v0042-${theme}-custom/proof.json`), "utf8"));
  const customCheck = JSON.parse(await readFile(resolve(root, `.work/t3-sidebar-focus-v0042-${theme}-custom/check.json`), "utf8"));
  const installedCheck = JSON.parse(await readFile(resolve(root, `.work/t3-sidebar-focus-v0042-cli/${theme}/check.json`), "utf8"));
  if (!custom.fullCheck || custom.strictFrames !== 120 || custom.compositionSha256 !== candidateHash ||
      !customCheck.ok || !installedCheck.ok || custom.motionChanges?.collapse < 100 || custom.motionChanges?.restore < 100) {
    throw new Error(`${theme} edited-value or CLI-installed proof incomplete`);
  }
  capture[theme] = {};
  for (const variant of ["default", "animated"]) {
    const fixture = JSON.parse(await readFile(resolve(source, `sidebar-focus-v0042-${theme}-${variant}-fixture.json`), "utf8"));
    const work = resolve(root, `.work/t3-sidebar-focus-v0042-${theme}-${variant}-verify`);
    const reference = resolve(root, `parity/${name}-v0042-${theme}-${variant}-reference.mkv`);
    const verification = JSON.parse(await readFile(resolve(work, "result.json"), "utf8"));
    const checkRaw = await readFile(resolve(work, "hyperframes-check-raw.json"), "utf8");
    const check = JSON.parse(checkRaw.slice(checkRaw.indexOf("{")));
    if (fixture.sourceCommit !== sourceCommit || fixture.variant !== variant || fixture.panelMs !== (variant === "default" ? 0 : 200)) {
      throw new Error(`${theme} ${variant} is not the pinned official interaction`);
    }
    if (fixture.referenceSha256 !== await sha256(reference)) throw new Error(`${theme} ${variant} native reference changed`);
    if (verification.fixture.compositionSha256 !== candidateHash || !verification.result.pass ||
        verification.result.frameCount !== 120 || !check.ok ||
        ["lint", "runtime", "layout", "motion", "contrast"].some((gate) => check[gate]?.findings?.length)) {
      throw new Error(`${theme} ${variant} final-source strict parity or full check failed`);
    }
    for (const [phase, expected] of Object.entries(fixture.sourceDomHashes)) {
      if (await sha256(resolve(source, `sidebar-focus-v0042-${theme}-${variant}-${phase}.html`)) !== expected) {
        throw new Error(`${theme} ${variant} ${phase} native DOM changed`);
      }
    }
    const motions = [fixture.motion.collapse, fixture.motion.restore];
    if (variant === "default" ? motions.some((items) => items.length !== 0) :
      motions.some((items) => items.length !== 5 || items.some((item) => item.durationMs !== 200 || item.easing !== "cubic-bezier(0, 0, 0.2, 1)"))) {
      throw new Error(`${theme} ${variant} native panel motion differs from release settings`);
    }
    const scores = await scoreList(resolve(work, "ssim.txt"));
    if (scores.length !== 120) throw new Error(`${theme} ${variant} frame scores incomplete`);
    const folder = resolve(diff, theme, variant);
    await mkdir(folder, { recursive: true });
    for (const file of ["ssim.txt", "sidebar-ssim.txt", "header-ssim.txt", "hyperframes-check-raw.json"]) {
      await copyFile(resolve(work, file), resolve(folder, file === "hyperframes-check-raw.json" ? "hyperframes-check.json" : file));
    }
    const worst = verification.result.worstFrame;
    run("ffmpeg", ["-v", "error", "-y", "-i", resolve(work, `native/frame-${String(worst).padStart(4, "0")}.png`),
      "-i", resolve(work, `hyperframes/frame_${String(worst + 1).padStart(6, "0")}.png`),
      "-filter_complex", "[0:v][1:v]hstack=inputs=2[v]", "-map", "[v]", "-frames:v", "1", resolve(folder, "worst-frame.png")]);
    const ordered = [...scores].sort((a, b) => a - b);
    capture[theme][variant] = {
      label: variant === "default" ? "Release default: instant sidebar toggle (0 ms)" :
        "Settings-enabled: Appearance panel animation (200 ms)",
      panelMs: fixture.panelMs,
      referenceSha256: fixture.referenceSha256,
      sourceDomHashes: fixture.sourceDomHashes,
      themeSha256: await sha256(resolve(source, `${theme}-theme.json`)),
      nativeMotion: fixture.motion,
      result: { ...verification.result, p05Ssim: ordered[6], p95Ssim: ordered[114] },
      artifacts: {
        nativeRecording: `parity/${name}-v0042-${theme}-${variant}-reference.mkv`,
        referenceVideo: `public/previews/${name}/reference${variant === "animated" ? "-settings-enabled" : ""}${theme === "light" ? "-light" : ""}.mp4`,
        hyperframesVideo: `public/previews/${name}/hyperframes${variant === "animated" ? "-settings-enabled" : ""}${theme === "light" ? "-light" : ""}.mp4`,
        frameSsim: `parity/${name}-diff/${theme}/${variant}/ssim.txt`,
        sidebarSsim: `parity/${name}-diff/${theme}/${variant}/sidebar-ssim.txt`,
        headerSsim: `parity/${name}-diff/${theme}/${variant}/header-ssim.txt`,
        hyperframesCheck: `parity/${name}-diff/${theme}/${variant}/hyperframes-check.json`,
        worstFrame: `parity/${name}-diff/${theme}/${variant}/worst-frame.png`,
      },
    };
  }
  const folder = resolve(diff, theme);
  await copyFile(resolve(root, `.work/t3-sidebar-focus-v0042-${theme}-custom/check.json`), resolve(folder, "custom-check.json"));
  await copyFile(resolve(root, `.work/t3-sidebar-focus-v0042-cli/${theme}/check.json`), resolve(folder, "installed-check.json"));
  await copyFile(resolve(root, `.work/t3-sidebar-focus-v0042-${theme}-custom/render/frame_000106.png`), resolve(folder, "customized.png"));
}
const seams = {};
for (const theme of ["dark", "light"]) {
  const previousNative = resolve(root, `.work/t3-fast-tier-v0042-${theme}-reference/frame-0119.png`);
  const currentNative = resolve(root, `.work/t3-sidebar-focus-v0042-${theme}-default-verify/native/frame-0000.png`);
  const previousPort = resolve(root, `.work/t3-fast-tier-v0042-${theme}-verify/hyperframes/frame_000120.png`);
  const currentPort = resolve(root, `.work/t3-sidebar-focus-v0042-${theme}-default-verify/hyperframes/frame_000001.png`);
  seams[theme] = {};
  for (const [kind, before, after] of [["native", previousNative, currentNative], ["hyperframes", previousPort, currentPort]]) {
    const comparison = spawnSync("magick", ["compare", "-metric", "AE", before, after, "null:"], { encoding: "utf8" });
    const changedPixels = Number(comparison.stderr.match(/^[\d.]+/)?.[0]);
    if (comparison.status !== 0 || changedPixels !== 0) throw new Error(`${theme} ${kind} Fast-to-Sidebar seam changed ${changedPixels} pixels`);
    seams[theme][kind] = { changedPixels };
  }
}
if (oldManifest.origin.commit !== sourceCommit) {
  await mkdir(resolve(root, "parity/legacy"), { recursive: true });
  await copyFile(manifestPath, resolve(root, `parity/legacy/${name}-v0035.json`));
  await cp(resolve(root, "registry/blocks", name), resolve(root, `parity/legacy/${name}-v0035-block`), { recursive: true });
  await cp(preview, resolve(root, `parity/legacy/${name}-v0035-preview`), { recursive: true });
}
await cp(candidate, resolve(root, "registry/blocks", name), { recursive: true, force: true });
await mkdir(preview, { recursive: true });
for (const theme of ["dark", "light"]) {
  for (const variant of ["default", "animated"]) {
    const work = resolve(root, `.work/t3-sidebar-focus-v0042-${theme}-${variant}-verify`);
    const reference = resolve(root, `parity/${name}-v0042-${theme}-${variant}-reference.mkv`);
    const suffix = `${variant === "animated" ? "-settings-enabled" : ""}${theme === "light" ? "-light" : ""}`;
    const pad = `pad=1200:660:0:0:${theme === "light" ? "white" : "black"}`;
    run("ffmpeg", ["-v", "error", "-y", "-i", reference, "-vf", pad, "-c:v", "libx264", "-preset", "slow", "-threads", "2", "-crf", "18", "-pix_fmt", "yuv420p", "-an", resolve(preview, `reference${suffix}.mp4`)]);
    run("ffmpeg", ["-v", "error", "-y", "-framerate", "30", "-start_number", "1", "-i", resolve(work, "hyperframes/frame_%06d.png"),
      "-vf", pad, "-c:v", "libx264", "-preset", "slow", "-threads", "2", "-crf", "18", "-pix_fmt", "yuv420p", "-an", resolve(preview, `hyperframes${suffix}.mp4`)]);
    await copyFile(resolve(work, "hyperframes", `frame_${variant === "animated" ? "000034" : "000061"}.png`), resolve(preview, `thumbnail${suffix}.png`));
    run("magick", [resolve(preview, `thumbnail${suffix}.png`), "-quality", "85", resolve(preview, `thumbnail${suffix}.webp`)]);
  }
}
const baseline = JSON.parse(await readFile(resolve(source, "sidebar-focus-v0042-dark-default-fixture.json"), "utf8"));
await writeFile(manifestPath, JSON.stringify({
  slug: name,
  origin: { repository: "https://github.com/pingdotgg/t3code", commit: sourceCommit,
    source: "apps/web/src/components/AppSidebarLayout.tsx; apps/web/src/components/ui/sidebar.tsx", license: "MIT" },
  fixture: { width: baseline.viewport.width, height: baseline.viewport.height, fps: baseline.fps,
    durationInFrames: baseline.frames, props: { theme: "dark", transitionMs: 0, sidebarWidth: baseline.sidebarWidth,
      collapseFrame: baseline.events.collapse, restoreFrame: baseline.events.restore, prompt: baseline.prompt,
      modelName: baseline.modelName, reasoningLevel: baseline.reasoningLevel, serviceTier: baseline.serviceTier },
    sourceHashes: baseline.sourceHashes, sourceDomHashes: baseline.sourceDomHashes,
    referenceSha256: baseline.referenceSha256, compositionSha256: candidateHash },
  providerState: baseline.providerState,
  releaseDefaultPanelMs: 0,
  settingsRangeMs: { min: 0, max: 400, step: 25 },
  settingsEnabledPreviewMs: 200,
  sourceBehavior: "The official release defaults to an instant sidebar toggle. Appearance > Motion enables a 200 ms cubic-bezier(0, 0, 0.2, 1) transition for the separately captured preview.",
  intentionalOffcanvas: "During Settings-enabled collapse, the native sidebar container leaves the canvas. Only that collapsed container and native clipped labels are annotated for layout; strict whole-frame and focused sidebar crops still score the visible transition.",
  sidebarRowTiming: "Official dark and light 200 ms captures hold virtualized row content for one sampled frame after restore, then reveal it at the next frame. The port reproduces that sampled release behavior.",
  classification: "source-dom-port", measurement: "lossless-png", status: "verified",
  thresholds: { meanSsim: 0.989, minSsim: 0.985, sidebarMinSsim: 0.98, headerMinSsim: 0.98 },
  result: capture.dark.default.result,
  themes: Object.fromEntries(["dark", "light"].map((theme) => [theme,
    { ...capture[theme].default, settingsEnabled200: capture[theme].animated }])),
  fastToSidebarSeam: seams,
  checks: { hyperframes: "full check without findings and strict 120-frame render passed for both themes and both settings paths",
    hyperframesVersion: "0.8.75", sourceBrowser: "Chrome Headless Shell 152.0.7977.30",
    installedThroughCli: true,
    customVariables: "Dark/light edited project, thread, prompt, model, reasoning, service tier, sidebar width, transition duration, and action frames passed full check and strict render." },
  artifacts: { ...capture.dark.default.artifacts, thumbnail: `public/previews/${name}/thumbnail.png`,
    settingsEnabledThumbnail: `public/previews/${name}/thumbnail-settings-enabled.png`,
    lightThumbnail: `public/previews/${name}/thumbnail-light.png`,
    lightSettingsEnabledThumbnail: `public/previews/${name}/thumbnail-settings-enabled-light.png` },
}, null, 2) + "\n");
console.log(`Published ${name} v0.0.42 default and Settings-enabled motion in dark and light.`);
