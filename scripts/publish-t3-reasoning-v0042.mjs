import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFile, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-reasoning-level";
const candidate = resolve(root, ".work/t3-reasoning-v0042-candidate");
const source = resolve(root, "assets/t3-code/v0.0.42");
const preview = resolve(root, "public/previews", name);
const diff = resolve(root, "parity", `${name}-diff`);
const hash = async (path) => createHash("sha256").update(await readFile(path)).digest("hex");
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command}: ${result.stderr.slice(-3000)}`);
};
const fixture = JSON.parse(await readFile(resolve(source, "reasoning-v0042-dark-fixture.json"), "utf8"));
const oldManifestPath = resolve(root, `parity/${name}.json`);
const oldManifest = JSON.parse(await readFile(oldManifestPath, "utf8"));
if (!["f925d639421844f02b3166d29281905dbba6d529", fixture.sourceCommit].includes(oldManifest.origin.commit)) {
  throw new Error("Unexpected existing block source commit");
}
const candidateHash = await hash(resolve(candidate, `${name}.html`));
const cliProof = JSON.parse(await readFile(resolve(root, ".work/t3-reasoning-v0042-cli/proof.json"), "utf8"));
if (!cliProof.installedThroughCli || cliProof.themes.join(",") !== "dark,light" || cliProof.compositionSha256 !== candidateHash) {
  throw new Error("Missing CLI installation or exact-source proof");
}

const themes = {};
for (const theme of ["dark", "light"]) {
  const suffix = theme === "light" ? "-light" : "";
  const nativeFixture = JSON.parse(await readFile(resolve(source, `reasoning-v0042-${theme}-fixture.json`), "utf8"));
  const reference = resolve(root, `parity/${name}-v0042-${theme}-reference.mkv`);
  const work = resolve(root, `.work/t3-reasoning-v0042-${theme}-verify`);
  const verification = JSON.parse(await readFile(resolve(work, "result.json"), "utf8"));
  const check = JSON.parse((await readFile(resolve(work, "hyperframes-check-raw.json"), "utf8")).replace(/^[^{]*/, ""));
  const installedCheck = JSON.parse((await readFile(resolve(root, `.work/t3-reasoning-v0042-cli/${theme}/check.json`), "utf8")).replace(/^[^{]*/, ""));
  const custom = JSON.parse(await readFile(resolve(root, `.work/t3-reasoning-v0042-${theme}-custom/proof.json`), "utf8"));
  const customCheck = JSON.parse(await readFile(resolve(root, `.work/t3-reasoning-v0042-${theme}-custom/check.json`), "utf8"));
  const regions = JSON.parse(await readFile(resolve(work, "region-result.json"), "utf8"));
  if (!verification.result.pass || verification.result.frameCount !== 120 || !check.ok || !installedCheck.ok ||
      !customCheck.ok || custom.theme !== theme || !custom.fullCheck || custom.strictRenderFrames !== 120 ||
      !["open", "hover", "select"].every((beat) => custom.motionChanges?.[beat]?.changedPixels > 0) ||
      Object.values(regions).some((region) => !region.pass)) {
    throw new Error(`${theme} verification incomplete`);
  }
  if (verification.fixture.compositionSha256 !== candidateHash) throw new Error(`${theme} source differs from verified candidate`);
  if (await hash(reference) !== nativeFixture.referenceSha256) throw new Error(`${theme} native recording changed`);
  if (nativeFixture.sourceCommit !== fixture.sourceCommit || JSON.stringify(nativeFixture.sourceDomHashes) !== JSON.stringify(fixture.sourceDomHashes)) {
    throw new Error(`${theme} source build or DOM differs`);
  }
  const themeDir = resolve(diff, theme);
  await mkdir(themeDir, { recursive: true });
  await copyFile(resolve(work, "ssim.txt"), resolve(themeDir, "ssim.txt"));
  await copyFile(resolve(work, "hyperframes-check-raw.json"), resolve(themeDir, "hyperframes-check.json"));
  await copyFile(resolve(root, `.work/t3-reasoning-v0042-cli/${theme}/check.json`), resolve(themeDir, "installed-check.json"));
  await copyFile(resolve(root, `.work/t3-reasoning-v0042-${theme}-custom/check.json`), resolve(themeDir, "custom-check.json"));
  await copyFile(resolve(root, `.work/t3-reasoning-v0042-${theme}-custom/snapshots/frame-02-at-3.4s.png`), resolve(themeDir, "customized.png"));
  for (const region of Object.keys(regions)) {
    await copyFile(resolve(work, `${region}-ssim.txt`), resolve(themeDir, `${region}-ssim.txt`));
  }
  const worst = verification.result.worstFrame;
  run("ffmpeg", ["-v", "error", "-y", "-i", resolve(work, `native/frame-${String(worst).padStart(4, "0")}.png`),
    "-i", resolve(work, `hyperframes/frame_${String(worst + 1).padStart(6, "0")}.png`),
    "-filter_complex", "[0:v][1:v]hstack=inputs=2[v]", "-map", "[v]", "-frames:v", "1", resolve(themeDir, "worst-frame.png")]);
  const scores = [...(await readFile(resolve(work, "ssim.txt"), "utf8")).matchAll(/^n:\d+ .*?All:([\d.]+)/gm)]
    .map((match) => Number(match[1])).sort((a, b) => a - b);
  if (scores.length !== 120) throw new Error(`${theme} frame score count changed`);
  themes[theme] = {
    referenceSha256: nativeFixture.referenceSha256,
    themeSha256: await hash(resolve(source, `${theme}-theme.json`)),
    result: { ...verification.result, p05Ssim: scores[6], p95Ssim: scores[114] },
    regions,
    popupBox: nativeFixture.popupBox,
    triggerBox: nativeFixture.triggerBox,
    motion: nativeFixture.motion,
    artifacts: {
      referenceVideo: `public/previews/${name}/reference${suffix}.mp4`,
      hyperframesVideo: `public/previews/${name}/hyperframes${suffix}.mp4`,
      frameSsim: `parity/${name}-diff/${theme}/ssim.txt`,
      regionSsim: Object.fromEntries(Object.keys(regions).map((region) => [region, `parity/${name}-diff/${theme}/${region}-ssim.txt`])),
      hyperframesCheck: `parity/${name}-diff/${theme}/hyperframes-check.json`,
      installedCheck: `parity/${name}-diff/${theme}/installed-check.json`,
      customCheck: `parity/${name}-diff/${theme}/custom-check.json`,
      worstFrame: `parity/${name}-diff/${theme}/worst-frame.png`,
      customized: `parity/${name}-diff/${theme}/customized.png`,
    },
  };
}

if (oldManifest.origin.commit !== fixture.sourceCommit) {
  await mkdir(resolve(root, "parity/legacy"), { recursive: true });
  await copyFile(oldManifestPath, resolve(root, `parity/legacy/${name}-v0035.json`));
  await cp(resolve(root, "registry/blocks", name), resolve(root, `parity/legacy/${name}-v0035-block`), { recursive: true });
  await cp(preview, resolve(root, `parity/legacy/${name}-v0035-preview`), { recursive: true });
}
await cp(candidate, resolve(root, "registry/blocks", name), { recursive: true, force: true });

for (const theme of ["dark", "light"]) {
  const suffix = theme === "light" ? "-light" : "";
  const work = resolve(root, `.work/t3-reasoning-v0042-${theme}-verify`);
  const reference = resolve(root, `parity/${name}-v0042-${theme}-reference.mkv`);
  run("ffmpeg", ["-v", "error", "-y", "-i", reference, "-vf", `pad=1200:660:0:0:${theme === "light" ? "white" : "black"}`,
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-an", resolve(preview, `reference${suffix}.mp4`)]);
  run("ffmpeg", ["-v", "error", "-y", "-framerate", "30", "-start_number", "1", "-i", resolve(work, "hyperframes/frame_%06d.png"),
    "-vf", `pad=1200:660:0:0:${theme === "light" ? "white" : "black"}`,
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-an", resolve(preview, `hyperframes${suffix}.mp4`)]);
  await copyFile(resolve(work, "hyperframes/frame_000100.png"), resolve(preview, `thumbnail${suffix}.png`));
  run("magick", [resolve(preview, `thumbnail${suffix}.png`), "-quality", "85", resolve(preview, `thumbnail${suffix}.webp`)]);
}

const parity = {
  slug: name,
  origin: { repository: "https://github.com/pingdotgg/t3code", commit: fixture.sourceCommit,
    source: "apps/web/src/components/chat/TraitsPicker.tsx", license: "MIT" },
  fixture: { width: fixture.viewport.width, height: fixture.viewport.height, fps: fixture.fps,
    durationInFrames: fixture.frames, props: { projectName: "hyfrme", prompt: fixture.prompt,
      modelName: fixture.modelName, reasoningBefore: fixture.reasoningBefore, reasoningAfter: fixture.reasoningAfter,
      openFrame: fixture.openFrame, hoverFrame: fixture.hoverFrame, selectFrame: fixture.selectFrame, theme: "dark" },
    sourceHashes: fixture.sourceHashes, sourceDomHashes: fixture.sourceDomHashes,
    referenceSha256: fixture.referenceSha256, compositionSha256: candidateHash },
  providerState: fixture.providerState,
  interaction: fixture.interaction,
  intentionalOcclusion: "The native Reasoning menu covers the empty-thread title and prompt. Only those underlying text elements carry layout overlap/occlusion annotations; focused menu-region SSIM measures the overlay itself.",
  focusedMenuBenchmark: { targetMeanSsim: 0.98, darkMeanSsim: themes.dark.regions["reasoning-menu"].meanSsim,
    lightMeanSsim: themes.light.regions["reasoning-menu"].meanSsim,
    passed: themes.dark.regions["reasoning-menu"].meanSsim >= 0.98 && themes.light.regions["reasoning-menu"].meanSsim >= 0.98,
    note: "The menu remains below the original 0.980 crop target. Native and port computed font family, size, weight, line height, colors, and menu fills match; the native font-smoothing property was restored without changing SSIM. The remaining text-edge difference is unresolved. This crop is not pixel-identical." },
  classification: "source-dom-port", measurement: "lossless-png", status: "verified",
  thresholds: { meanSsim: 0.989, minSsim: 0.985,
    regions: Object.fromEntries(Object.entries(themes.dark.regions).map(([name, region]) => [name, region.thresholds])) },
  result: themes.dark.result,
  themes,
  checks: { hyperframes: "full check and strict 120-frame render passed in both themes",
    hyperframesVersion: "0.8.75", sourceBrowser: "Chrome Headless Shell 152.0.7977.30",
    installedThroughCli: true, customVariables: "dark and light project, hero, model, before/after reasoning, prompt, and open/hover/select timing overrides passed full check, strict 120-frame render, three snapshots, OCR, and exact configured-frame change assertions" },
  artifacts: { ...themes.dark.artifacts, thumbnail: `public/previews/${name}/thumbnail.png`,
    lightThumbnail: `public/previews/${name}/thumbnail-light.png` },
};
await writeFile(oldManifestPath, JSON.stringify(parity, null, 2) + "\n");
console.log(`Published ${name} v0.0.42 in dark and light; means ${themes.dark.result.meanSsim.toFixed(6)} / ${themes.light.result.meanSsim.toFixed(6)}.`);
