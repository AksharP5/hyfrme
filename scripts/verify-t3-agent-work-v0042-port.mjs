import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-agent-work";
const source = resolve(root, "assets/t3-code/v0.0.42");
const candidate = resolve(root, `.work/${name}-v0042-candidate`);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const run = (program, args) => {
  const result = spawnSync(program, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${program} failed:\n${result.stderr.slice(-3000)}\n${result.stdout.slice(-1000)}`);
  return result.stdout;
};
const candidateHash = hash(await readFile(resolve(candidate, `${name}.html`)));
const atlas = JSON.parse(await readFile(resolve(root, `parity/${name}-v0042-atlas.json`), "utf8"));
if (atlas.sourceCommit !== "719a76ca1dbf5490f1aa33ffb9966301e02be9a9") throw new Error("Agent Work atlas uses the wrong source release");

for (const theme of ["dark", "light"]) {
  const prefix = `agent-work-v0042-${theme}`;
  const fixture = JSON.parse(await readFile(resolve(source, `${prefix}-fixture.json`), "utf8"));
  const work = resolve(root, `.work/${name}-v0042-${theme}-verify`);
  const project = resolve(work, "project");
  const nativeFrames = resolve(work, "native");
  const renderedFrames = resolve(work, "hyperframes");
  const reference = resolve(root, `parity/${name}-v0042-${theme}-reference.mkv`);
  if (fixture.sourceTag !== "v0.0.42" || fixture.sourceCommit !== atlas.sourceCommit || fixture.theme !== theme ||
      fixture.frames !== 120 || fixture.fps !== 30 || fixture.commandFrame !== 30 || fixture.detailFrame !== 55 ||
      fixture.collapseFrame !== 90 || !fixture.activityRows?.some((row) => row.text.includes("npm run verify:showcases")) ||
      fixture.providerState !== "The T3 conversation and command event are seeded in an isolated local fixture; no AI provider runs.") {
    throw new Error(`Incomplete or incorrect ${theme} Agent Work native capture`);
  }
  if (hash(await readFile(reference)) !== fixture.referenceSha256) throw new Error(`${theme} native recording changed`);
  for (const [phase, expected] of Object.entries(fixture.sourceDomHashes)) {
    if (hash(await readFile(resolve(source, `${prefix}-${phase}.html`))) !== expected) throw new Error(`${theme} ${phase} DOM changed`);
  }
  for (const [row, expected] of Object.entries(fixture.captureSpriteSha256 ?? {})) {
    if (hash(await readFile(resolve(source, `${prefix}-capture-${row}.webp`))) !== expected) throw new Error(`${theme} capture strip ${row} changed`);
  }
  if (Object.keys(fixture.captureSpriteSha256 ?? {}).length !== 10 || fixture.captureSpriteFrameCount !== 120) {
    throw new Error(`${theme} native capture atlases are incomplete`);
  }
  await rm(work, { recursive: true, force: true });
  await mkdir(resolve(project, "compositions"), { recursive: true });
  await mkdir(nativeFrames, { recursive: true });
  for (const file of await readdir(candidate)) {
    if (file === "registry-item.json" || file === "README.md" || file === "licenses") continue;
    await copyFile(resolve(candidate, file), resolve(project, "compositions", file));
  }
  await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:${theme === "light" ? "#fff" : "#0a0a0a"}}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="${name}-v0042-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div id="${name}" data-composition-id="${name}" data-composition-src="compositions/${name}.html"${theme === "light" ? ` data-variable-values='{"theme":"light"}'` : ""} data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['${name}-v0042-fixture']=gsap.timeline({paused:true});</script></body></html>`);

  const checked = run("npx", ["--yes", "hyperframes@0.8.75", "check", project, "--json"]);
  const check = JSON.parse(checked.slice(checked.indexOf("{")));
  await writeFile(resolve(work, "hyperframes-check-raw.json"), JSON.stringify(check, null, 2) + "\n");
  if (!check.ok) throw new Error(`${theme} Agent Work full HyperFrames check failed`);
  run("npx", ["--yes", "hyperframes@0.8.75", "render", project, "--format=png-sequence", "-o", renderedFrames, "--strict", "--workers=2"]);
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", reference, "-start_number", "0", resolve(nativeFrames, "frame-%04d.png")]);
  const native = (await readdir(nativeFrames)).filter((file) => file.endsWith(".png"));
  const rendered = (await readdir(renderedFrames)).filter((file) => file.endsWith(".png"));
  if (native.length !== 120 || rendered.length !== 120) throw new Error(`${theme} comparison is not 120 frames`);
  const stats = resolve(work, "ssim.txt");
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-framerate", "30", "-start_number", "0", "-i",
    resolve(nativeFrames, "frame-%04d.png"), "-framerate", "30", "-start_number", "1", "-i",
    resolve(renderedFrames, "frame_%06d.png"), "-lavfi", `ssim=stats_file=${stats}`, "-f", "null", "-"]);
  const scores = [...(await readFile(stats, "utf8")).matchAll(/^n:\d+ .*?All:([\d.]+)/gm)].map((match) => Number(match[1]));
  const sorted = [...scores].sort((a, b) => a - b);
  const result = {
    frameCount: scores.length,
    meanSsim: scores.reduce((sum, value) => sum + value, 0) / scores.length,
    minSsim: sorted[0], p05Ssim: sorted[Math.floor(scores.length * 0.05)],
    p95Ssim: sorted[Math.floor(scores.length * 0.95)], worstFrame: scores.indexOf(sorted[0]),
  };
  result.pass = scores.length === 120 && result.meanSsim >= 0.985 && result.minSsim >= 0.980;
  const phaseFrames = { thinking: 0, command: fixture.commandFrame, detail: fixture.detailFrame, collapsed: fixture.collapseFrame };
  result.phaseFrames = {};
  for (const [phase, frame] of Object.entries(phaseFrames)) {
    result.phaseFrames[phase] = {
      frame,
      ssim: scores[frame],
      nativeSha256: hash(await readFile(resolve(nativeFrames, `frame-${String(frame).padStart(4, "0")}.png`))),
      hyperframesSha256: hash(await readFile(resolve(renderedFrames, `frame_${String(frame + 1).padStart(6, "0")}.png`))),
    };
  }
  if (Object.values(result.phaseFrames).some(({ ssim }) => ssim !== 1)) {
    throw new Error(`${theme} default native interaction phase did not preserve exact capture pixels`);
  }
  const proof = { fixture: { theme, sourceCommit: fixture.sourceCommit, referenceSha256: fixture.referenceSha256,
    compositionSha256: candidateHash }, result };
  await writeFile(resolve(work, "result.json"), JSON.stringify(proof, null, 2) + "\n");
  if (!result.pass) throw new Error(`${theme} native parity failed: ${JSON.stringify(result)}`);
  console.log(`${name} v0.0.42 ${theme}: ${scores.length} frames, mean=${result.meanSsim.toFixed(6)}, min=${result.minSsim.toFixed(6)}, four key states exact.`);
}
