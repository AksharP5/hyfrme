import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const name = "t3-visual-context-shelf";
const theme = process.env.T3_VERIFY_THEME ?? "dark";
if (!["dark", "light"].includes(theme)) throw new Error("T3_VERIFY_THEME must be dark or light");
const block = resolve(root, ".work/t3-visual-context-v0042-candidate");
const work = resolve(root, `.work/t3-visual-context-v0042-${theme}-verify`);
const project = resolve(work, "project");
const nativeFrames = resolve(work, "native");
const outputFrames = resolve(work, "hyperframes");
const reference = resolve(root, `parity/${name}-v0042-${theme}-reference.mkv`);
const fixture = JSON.parse(await readFile(resolve(source, `visual-context-v0042-${theme}-fixture.json`), "utf8"));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const fileHash = async (path) => hash(await readFile(path));
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stderr.slice(-3000)}\n${result.stdout.slice(-1500)}`);
  return result;
};
if (fixture.sourceCommit !== "719a76ca1dbf5490f1aa33ffb9966301e02be9a9") throw new Error("Wrong source commit");
for (const [key, file] of [["index", "index.html"], ["css", "t3.css"], ["js", "index.js"]]) {
  if (await fileHash(resolve(source, file)) !== fixture.sourceHashes[key]) throw new Error(`${file} differs from T3 v0.0.42 release`);
}
for (const [phase, expected] of Object.entries(fixture.sourceDomHashes)) {
  if (await fileHash(resolve(source, `visual-context-v0042-${theme}-${phase}.html`)) !== expected) {
    throw new Error(`${theme} ${phase} native DOM changed`);
  }
}
if (await fileHash(reference) !== fixture.referenceSha256) throw new Error("Native v0.0.42 recording changed");
if (await fileHash(resolve(source, "visual-context-shelf-logo-enter.png")) !== fixture.imageSha256 ||
    await fileHash(resolve(block, "t3-visual-context-logo-enter.png")) !== fixture.imageSha256) {
  throw new Error("Pasted Hyfrme Logo Enter image differs from the native capture");
}

await rm(work, { recursive: true, force: true });
await mkdir(resolve(project, "compositions"), { recursive: true });
await mkdir(nativeFrames, { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js", "t3-visual-context-logo-enter.png"]) {
  await copyFile(resolve(block, file), resolve(project, "compositions", file));
}
const variables = JSON.stringify({ theme });
await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:${theme === "light" ? "#fff" : "#0a0a0a"}}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-visual-context-v0042-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div id="t3-visual-context-slot" data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${variables}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-visual-context-v0042-fixture']=gsap.timeline({paused:true});</script></body></html>`);
const checked = spawnSync("npx", ["--yes", "hyperframes@0.8.75", "check", project, "--json"], {
  encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
});
await writeFile(resolve(work, "hyperframes-check-raw.json"), checked.stdout);
const checkJson = JSON.parse(checked.stdout.slice(checked.stdout.indexOf("{")));
if (checked.status !== 0 || !checkJson.ok || ["lint", "runtime", "layout", "motion", "contrast"].some((gate) => checkJson[gate]?.findings?.length)) {
  const findings = Object.entries(checkJson).flatMap(([gate, value]) => value?.findings?.map((finding) => `${gate}: ${finding.message}`) ?? []);
  throw new Error(`Full HyperFrames check has findings: ${findings.slice(0, 12).join("; ")}`);
}
run("npx", ["--yes", "hyperframes@0.8.75", "render", project, "--format=png-sequence", "-o", outputFrames, "--strict", "--workers=2"]);
run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", reference, "-start_number", "0", resolve(nativeFrames, "frame-%04d.png")]);
const rendered = (await readdir(outputFrames)).filter((file) => file.endsWith(".png"));
const native = (await readdir(nativeFrames)).filter((file) => file.endsWith(".png"));
if (rendered.length !== fixture.frames || native.length !== fixture.frames) {
  throw new Error(`Expected ${fixture.frames} frames; got native=${native.length}, HyperFrames=${rendered.length}`);
}
const stats = resolve(work, "ssim.txt");
run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-framerate", String(fixture.fps), "-start_number", "0", "-i", resolve(nativeFrames, "frame-%04d.png"), "-framerate", String(fixture.fps), "-start_number", "1", "-i", resolve(outputFrames, "frame_%06d.png"), "-lavfi", `ssim=stats_file=${stats}`, "-f", "null", "-"]);
const scores = [...(await readFile(stats, "utf8")).matchAll(/^n:\d+ .*?All:([\d.]+)/gm)].map((match) => Number(match[1]));
if (scores.length !== fixture.frames) throw new Error(`Expected ${fixture.frames} scores`);
const meanSsim = scores.reduce((sum, score) => sum + score, 0) / scores.length;
const minSsim = Math.min(...scores);
const cropResults = {};
for (const [label, geometry, startFrame, endFrame, minGate] of [
  ["composer", "860:260:330:380", 0, 119, 0.980],
  ["thumbnail", "130:100:345:390", fixture.pasteFrame, 119, 0.980],
  ["chip-before-edit", "300:55:670:470", fixture.pasteFrame, fixture.instructionFrame - 1,
    theme === "light" ? 0.960 : 0.970],
  ["chip-after-edit", "330:55:345:495", fixture.instructionFrame, 119,
    theme === "light" ? 0.975 : 0.980],
]) {
  const cropStats = resolve(work, `${label}-ssim.txt`);
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-framerate", String(fixture.fps), "-start_number", "0", "-i", resolve(nativeFrames, "frame-%04d.png"), "-framerate", String(fixture.fps), "-start_number", "1", "-i", resolve(outputFrames, "frame_%06d.png"), "-filter_complex", `[0:v]crop=${geometry}[native];[1:v]crop=${geometry}[port];[native][port]ssim=stats_file=${cropStats}`, "-f", "null", "-"]);
  const cropScores = [...(await readFile(cropStats, "utf8")).matchAll(/^n:\d+ .*?All:([\d.]+)/gm)].map((match) => Number(match[1]));
  if (cropScores.length !== fixture.frames) throw new Error(`Expected ${fixture.frames} ${label} crop scores`);
  const activeScores = cropScores.slice(startFrame, endFrame + 1);
  const cropMin = Math.min(...activeScores);
  cropResults[label] = { geometry, frameRange: [startFrame, endFrame],
    meanSsim: activeScores.reduce((sum, score) => sum + score, 0) / activeScores.length,
    minSsim: cropMin, worstFrame: startFrame + activeScores.indexOf(cropMin),
    minGate, pass: cropMin >= minGate };
}
const result = { frameCount: scores.length, meanSsim, minSsim, worstFrame: scores.indexOf(minSsim), crops: cropResults,
  pass: meanSsim >= 0.989 && minSsim >= 0.985 && Object.values(cropResults).every((crop) => crop.pass) };
await writeFile(resolve(work, "result.json"), JSON.stringify({ fixture: { theme, sourceCommit: fixture.sourceCommit, referenceSha256: fixture.referenceSha256, compositionSha256: await fileHash(resolve(block, `${name}.html`)) }, result }, null, 2) + "\n");
  console.log(`${name} v0.0.42 ${theme}: ${scores.length} frames, mean=${meanSsim.toFixed(6)}, min=${minSsim.toFixed(6)}, worst=${result.worstFrame}, pass=${result.pass}`);
if (!result.pass) throw new Error("T3 v0.0.42 visual-context parity did not pass");
