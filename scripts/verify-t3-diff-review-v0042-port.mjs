import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-diff-review";
const shortName = "diff-review";
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
  const rendered = resolve(work, "hyperframes");
  const native = resolve(root, `.work/${name}-v0042-${theme}-reference`);
  const reference = resolve(root, `parity/${name}-v0042-${theme}-reference.mkv`);
  if (fixture.sourceTag !== "v0.0.42" || fixture.sourceCommit !== atlas.sourceCommit || fixture.theme !== theme ||
      fixture.frames !== 120 || fixture.fps !== 30 || fixture.captureSpriteFrameCount !== 120 ||
      fixture.referenceSha256 !== hash(await readFile(reference)) || atlas.themes[theme].meanSsim !== 1) {
    throw new Error(`${theme} Diff Review fixture is not pinned to the lossless T3 v0.0.42 atlas`);
  }
  for (const [row, expected] of Object.entries(fixture.captureSpriteSha256)) {
    if (hash(await readFile(resolve(source, `${prefix}-capture-${row}.webp`))) !== expected) throw new Error(`${theme} atlas strip ${row} changed`);
  }
  for (const [phase, expected] of Object.entries(fixture.sourceDomHashes)) {
    if (hash(await readFile(resolve(source, `${prefix}-${phase}.html`))) !== expected.root ||
        hash(await readFile(resolve(source, `${prefix}-${phase}-shadows.json`))) !== expected.shadows) throw new Error(`${theme} ${phase} native DOM snapshot changed`);
  }

  await rm(work, { recursive: true, force: true });
  await mkdir(resolve(project, "compositions"), { recursive: true });
  for (const file of await readdir(candidate)) {
    if (["registry-item.json", "README.md", "licenses"].includes(file)) continue;
    await copyFile(resolve(candidate, file), resolve(project, "compositions", file));
  }
  await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:${theme === "light" ? "#fff" : "#0a0a0a"}}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="${name}-fixture-${theme}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html"${theme === "light" ? ` data-variable-values='{"theme":"light"}'` : ""} data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['${name}-fixture-${theme}']=gsap.timeline({paused:true});</script></body></html>`);

  const checkText = run("npx", ["--yes", "hyperframes@0.8.75", "check", project, "--json"]);
  const check = JSON.parse(checkText.slice(checkText.indexOf("{")));
  await writeFile(resolve(work, "hyperframes-check-raw.json"), `${JSON.stringify(check, null, 2)}\n`);
  if (!check.ok) throw new Error(`${theme} full HyperFrames check failed: ${JSON.stringify(check.layout?.findings ?? check).slice(0, 3000)}`);
  run("npx", ["--yes", "hyperframes@0.8.75", "render", project, "--format=png-sequence", "-o", rendered, "--strict", "--workers=2"]);
  const nativeFiles = (await readdir(native)).filter((file) => /^frame-\d{4}\.png$/.test(file));
  const renderedFiles = (await readdir(rendered)).filter((file) => file.endsWith(".png"));
  if (nativeFiles.length !== 120 || renderedFiles.length !== 120) throw new Error(`${theme} strict render did not return 120 frames`);
  const stats = resolve(work, "ssim.txt");
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-framerate", "30", "-start_number", "0", "-i", resolve(native, "frame-%04d.png"),
    "-framerate", "30", "-start_number", "1", "-i", resolve(rendered, "frame_%06d.png"), "-lavfi", `ssim=stats_file=${stats}`, "-frames:v", "120", "-f", "null", "-"]);
  const scores = [...(await readFile(stats, "utf8")).matchAll(/^n:\d+ .*?All:([\d.]+)/gm)].map((match) => Number(match[1]));
  const sorted = [...scores].sort((a, b) => a - b);
  const result = { frameCount: scores.length, meanSsim: scores.reduce((sum, score) => sum + score, 0) / scores.length,
    minSsim: sorted[0], p05Ssim: sorted[6], p95Ssim: sorted[114], worstFrame: scores.indexOf(sorted[0]),
    pass: scores.length === 120 && sorted[0] >= 0.98 };
  if (!result.pass) throw new Error(`${theme} all-frame native parity failed: ${JSON.stringify(result)}`);
  const compositionSha256 = hash(await readFile(resolve(candidate, `${name}.html`)));
  await writeFile(resolve(work, "result.json"), `${JSON.stringify({ fixture: { theme, sourceCommit: fixture.sourceCommit,
    referenceSha256: fixture.referenceSha256, compositionSha256 }, result }, null, 2)}\n`);
  console.log(`${name} ${theme}: 120 frames, mean=${result.meanSsim.toFixed(6)}, min=${result.minSsim.toFixed(6)}; full HyperFrames check passed.`);
}
