import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-message-rewind";
const shortName = "message-rewind";
const candidate = resolve(root, `.work/${name}-v0042-candidate`);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stderr.slice(-3000)}\n${result.stdout.slice(-1000)}`);
  return result.stdout;
};

for (const theme of ["dark", "light"]) {
  const prefix = `${shortName}-v0042-${theme}`;
  const fixture = JSON.parse(await readFile(resolve(source, `${prefix}-fixture.json`), "utf8"));
  const atlas = JSON.parse(await readFile(resolve(root, `parity/${name}-v0042-atlas.json`), "utf8"));
  const work = resolve(root, `.work/${name}-v0042-${theme}-verify`);
  const project = resolve(work, "project");
  const native = resolve(work, "native");
  const rendered = resolve(work, "hyperframes");
  const reference = resolve(root, `parity/${name}-v0042-${theme}-reference.mkv`);
  if (fixture.sourceTag !== "v0.0.42" || fixture.sourceCommit !== atlas.sourceCommit || fixture.theme !== theme ||
      fixture.frames !== 120 || fixture.fps !== 30 || fixture.events.confirm !== 65 ||
      fixture.providerState.includes("live") || hash(await readFile(reference)) !== fixture.referenceSha256) {
    throw new Error(`${theme} Message Rewind source fixture is incomplete or not release-pinned`);
  }
  for (const [phase, expected] of Object.entries(fixture.sourceDomHashes)) {
    if (hash(await readFile(resolve(source, `${prefix}-${phase}.html`))) !== expected.root ||
        hash(await readFile(resolve(source, `${prefix}-${phase}-portal.html`))) !== expected.portal) throw new Error(`${theme} ${phase} captured DOM changed`);
  }
  for (const [row, expected] of Object.entries(fixture.captureSpriteSha256 ?? {})) {
    if (hash(await readFile(resolve(source, `${prefix}-capture-${row}.webp`))) !== expected) throw new Error(`${theme} capture strip ${row} changed`);
  }
  if (Object.keys(fixture.captureSpriteSha256 ?? {}).length !== 10 || fixture.captureSpriteFrameCount !== 120) throw new Error(`${theme} native atlas is incomplete`);

  await rm(work, { recursive: true, force: true });
  await mkdir(resolve(project, "compositions"), { recursive: true });
  await mkdir(native, { recursive: true });
  for (const file of await readdir(candidate)) {
    if (["registry-item.json", "README.md", "licenses"].includes(file)) continue;
    await copyFile(resolve(candidate, file), resolve(project, "compositions", file));
  }
  await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:${theme === "light" ? "#fff" : "#0a0a0a"}}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="${name}-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div id="${name}" data-composition-id="${name}" data-composition-src="compositions/${name}.html"${theme === "light" ? ` data-variable-values='{"theme":"light"}'` : ""} data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['${name}-fixture']=gsap.timeline({paused:true});</script></body></html>`);
  const checkRun = spawnSync("npx", ["--yes", "hyperframes@0.8.75", "check", project, "--json"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const checkOutput = checkRun.stdout;
  const check = JSON.parse(checkOutput.slice(checkOutput.indexOf("{")));
  await writeFile(resolve(work, "hyperframes-check-raw.json"), JSON.stringify(check, null, 2) + "\n");
  if (checkRun.status !== 0 || !check.ok) throw new Error(`${theme} Message Rewind full HyperFrames check failed: ${JSON.stringify(check.layout?.findings?.filter(({ severity }) => severity === "error") ?? check).slice(0, 3000)}`);
  run("npx", ["--yes", "hyperframes@0.8.75", "render", project, "--format=png-sequence", "-o", rendered, "--strict", "--workers=2"]);
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", reference, "-start_number", "0", resolve(native, "frame-%04d.png")]);
  const nativeCount = (await readdir(native)).filter((file) => file.endsWith(".png")).length;
  const renderedCount = (await readdir(rendered)).filter((file) => file.endsWith(".png")).length;
  if (nativeCount !== 120 || renderedCount !== 120) throw new Error(`${theme} strict render did not produce 120 frames`);
  const stats = resolve(work, "ssim.txt");
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-framerate", "30", "-start_number", "0", "-i", resolve(native, "frame-%04d.png"),
    "-framerate", "30", "-start_number", "1", "-i", resolve(rendered, "frame_%06d.png"), "-lavfi", `ssim=stats_file=${stats}`, "-f", "null", "-"]);
  const scores = [...(await readFile(stats, "utf8")).matchAll(/^n:\d+ .*?All:([\d.]+)/gm)].map((match) => Number(match[1]));
  const sorted = [...scores].sort((a, b) => a - b);
  const result = { frameCount: scores.length, meanSsim: scores.reduce((sum, score) => sum + score, 0) / scores.length,
    minSsim: sorted[0], p05Ssim: sorted[6], p95Ssim: sorted[114], worstFrame: scores.indexOf(sorted[0]),
    pass: scores.length === 120 && sorted[0] >= 0.980 };
  const phaseFrames = { before: 0, hover: fixture.events.hover, tooltip: fixture.events.tooltip,
    confirm: fixture.events.confirm, closed: fixture.events.cancel };
  result.phaseFrames = Object.fromEntries(Object.entries(phaseFrames).map(([phase, frame]) => [phase, { frame, ssim: scores[frame] }]));
  await writeFile(resolve(work, "result.json"), JSON.stringify({ fixture: { theme, sourceCommit: fixture.sourceCommit,
    referenceSha256: fixture.referenceSha256, compositionSha256: hash(await readFile(resolve(candidate, `${name}.html`))) }, result }, null, 2) + "\n");
  if (!result.pass) throw new Error(`${theme} all-frame parity failed: mean=${result.meanSsim}, min=${result.minSsim}`);
  console.log(`${name} ${theme}: ${scores.length} frames, mean=${result.meanSsim.toFixed(6)}, min=${result.minSsim.toFixed(6)}; full check passed.`);
}
