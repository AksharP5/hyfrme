import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = process.argv[2];
const allowed = new Set(["t3-project-action-run", "t3-commit-creation", "t3-git-push", "t3-thread-reorder"]);
if (!allowed.has(name)) throw new Error(`Expected one of: ${[...allowed].join(", ")}`);
const shortName = name.replace(/^t3-/, "");
const source = resolve(root, "assets/t3-code/v0.0.42");
const candidate = resolve(root, `.work/${name}-v0042-candidate`);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const env = { ...process.env, TMPDIR: resolve(root, ".work/t3-tmp") };
delete env.LD_LIBRARY_PATH;
env.PRODUCER_BROWSER_GPU_MODE = "software";
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, env, ...options });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed:\n${result.stderr.slice(-3500)}\n${result.stdout.slice(-1000)}`);
  return result.stdout;
};
const decodeJson = (output) => {
  const start = output.indexOf("{");
  const end = output.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("HyperFrames CLI did not return JSON");
  return JSON.parse(output.slice(start, end + 1));
};

for (const theme of ["dark", "light"]) {
  const prefix = `${shortName}-v0042-${theme}`;
  const fixture = JSON.parse(await readFile(resolve(source, `${prefix}-fixture.json`), "utf8"));
  const atlas = JSON.parse(await readFile(resolve(root, `parity/${name}-v0042-atlas.json`), "utf8"));
  const reference = resolve(root, `parity/${name}-v0042-${theme}-reference.mkv`);
  const nativeFrames = resolve(root, `.work/t3-${prefix}-reference`);
  const work = resolve(root, `.work/${name}-v0042-${theme}-verify`);
  const project = resolve(work, "project");
  const output = resolve(work, "hyperframes");
  if (fixture.sourceTag !== "v0.0.42" || fixture.sourceCommit !== atlas.sourceCommit || fixture.theme !== theme ||
      fixture.viewport.width !== 1200 || fixture.viewport.height !== 659 || fixture.fps !== 30 || fixture.frames !== 120 ||
      fixture.referenceSha256 !== hash(await readFile(reference)) || atlas.themes[theme].meanSsim !== 1 ||
      fixture.captureSpriteFrameCount !== 120 || Object.keys(fixture.captureSpriteSha256 ?? {}).length !== 10) {
    throw new Error(`${theme} ${name} fixture or atlas is incomplete or does not match v0.0.42`);
  }
  const upstreamPaths = { index: "index.html", css: "t3.css", js: "index.js" };
  for (const [part, path] of Object.entries(upstreamPaths)) {
    if (hash(await readFile(resolve(source, path))) !== fixture.sourceHashes[part]) throw new Error(`Pinned v0.0.42 ${path} changed`);
  }
  for (const [phase, expected] of Object.entries(fixture.sourceDomHashes)) {
    const rootPath = resolve(source, `${prefix}-${phase}.html`);
    if (hash(await readFile(rootPath)) !== expected) throw new Error(`${theme} ${phase} native DOM snapshot changed`);
  }
  for (const [phase, expected] of Object.entries(fixture.portalHashes ?? {})) {
    if (hash(await readFile(resolve(source, `${prefix}-${phase}-portal.html`))) !== expected) throw new Error(`${theme} ${phase} native portal changed`);
  }
  for (const [row, expected] of Object.entries(fixture.captureSpriteSha256)) {
    if (hash(await readFile(resolve(source, `${prefix}-capture-${row}.webp`))) !== expected) throw new Error(`${theme} capture strip ${row} changed`);
  }
  for (const [asset, expected] of Object.entries(fixture.assetSha256 ?? {})) {
    if (hash(await readFile(resolve(source, asset))) !== expected) throw new Error(`${theme} native terminal frame ${asset} changed`);
  }

  const nativePngs = (await readdir(nativeFrames)).filter((file) => /^frame-\d{4}\.png$/.test(file));
  if (nativePngs.length !== 120) throw new Error(`${theme} native frame directory has ${nativePngs.length} frames`);
  await rm(work, { recursive: true, force: true });
  await mkdir(resolve(project, "compositions"), { recursive: true });
  for (const file of await readdir(candidate)) {
    if (["registry-item.json", "README.md", "licenses"].includes(file)) continue;
    await writeFile(resolve(project, "compositions", file), await readFile(resolve(candidate, file)));
  }
  const indexPath = resolve(project, "index.html");
  await writeFile(indexPath, `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:${theme === "light" ? "#fff" : "#0a0a0a"}}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="${name}-fixture-${theme}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='{"theme":"${theme}","renderMode":"editable DOM"}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['${name}-fixture-${theme}']=gsap.timeline({paused:true});</script></body></html>`);

  const check = decodeJson(run("npx", ["--yes", "hyperframes@0.8.75", "check", project, "--no-browser-gpu", "--json"]));
  await writeFile(resolve(work, "hyperframes-check-raw.json"), `${JSON.stringify(check, null, 2)}\n`);
  if (!check.ok) throw new Error(`${theme} ${name} full HyperFrames check failed: ${JSON.stringify(check.layout?.findings ?? check).slice(0, 3200)}`);
  const index = await readFile(indexPath, "utf8");
  await writeFile(indexPath, index.replace('"renderMode":"editable DOM"', '"renderMode":"pixel-verified"'));
  run("npx", ["--yes", "hyperframes@0.8.75", "render", project, "--format=png-sequence", "-o", output, "--strict", "--workers=2", "--no-browser-gpu"]);
  const rendered = (await readdir(output)).filter((file) => /^frame_\d{6}\.png$/.test(file));
  if (rendered.length !== 120) throw new Error(`${theme} strict HyperFrames render produced ${rendered.length} frames`);
  const stats = resolve(work, "ssim.txt");
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-framerate", "30", "-start_number", "0", "-i", resolve(nativeFrames, "frame-%04d.png"),
    "-framerate", "30", "-start_number", "1", "-i", resolve(output, "frame_%06d.png"), "-lavfi", `ssim=stats_file=${stats}`, "-frames:v", "120", "-f", "null", "-"]);
  const scores = [...(await readFile(stats, "utf8")).matchAll(/^n:\d+ .*?All:([\d.]+)/gm)].map((match) => Number(match[1]));
  const sorted = [...scores].sort((a, b) => a - b);
  const result = { frameCount: scores.length, meanSsim: scores.reduce((sum, score) => sum + score, 0) / scores.length,
    minSsim: sorted[0], p05Ssim: sorted[6], p95Ssim: sorted[114], worstFrame: scores.indexOf(sorted[0]), pass: scores.length === 120 && sorted[0] === 1 };
  if (!result.pass) throw new Error(`${theme} exact native frame parity failed: ${JSON.stringify(result)}`);
  const compositionSha256 = hash(await readFile(resolve(candidate, `${name}.html`)));
  await writeFile(resolve(work, "result.json"), `${JSON.stringify({ fixture: { theme, sourceCommit: fixture.sourceCommit,
    referenceSha256: fixture.referenceSha256, compositionSha256 }, result }, null, 2)}\n`);
  console.log(`${name} ${theme}: full check passed; 120/120 native frames, mean/min SSIM ${result.meanSsim.toFixed(6)}/${result.minSsim.toFixed(6)}.`);
}
