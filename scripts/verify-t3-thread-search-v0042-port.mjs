import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const theme = process.argv[2];
if (theme !== "dark" && theme !== "light") throw new Error("Pass dark or light");
const name = "t3-thread-search";
const source = resolve(root, "assets/t3-code/v0.0.42");
const candidate = resolve(root, ".work/t3-thread-search-v0042-candidate");
const work = resolve(root, `.work/t3-thread-search-v0042-${theme}-verify`);
const project = resolve(work, "project");
const nativeFrames = resolve(work, "native");
const outputFrames = resolve(work, "hyperframes");
const fixture = JSON.parse(await readFile(resolve(source, `thread-search-${theme}-fixture.json`), "utf8"));
const reference = resolve(root, `parity/t3-thread-search-v0042${theme === "light" ? "-light" : ""}-reference.mkv`);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const fileHash = async (path) => hash(await readFile(path));
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stderr.slice(-4000)}\n${result.stdout.slice(-2000)}`);
  return result;
};
if (fixture.sourceCommit !== "719a76ca1dbf5490f1aa33ffb9966301e02be9a9") throw new Error("Wrong T3 Code source commit");
for (const [key, file] of [["index", "index.html"], ["css", "t3.css"], ["js", "index.js"]]) {
  if (await fileHash(resolve(source, file)) !== fixture.sourceHashes[key]) throw new Error(`${file} differs from official v0.0.42 release`);
}
for (const [key, { file, sha256 }] of Object.entries(fixture.states)) {
  if (await fileHash(resolve(source, file)) !== sha256) throw new Error(`Native DOM ${key} changed`);
}
if (fixture.stateKeys.length !== 120 || fixture.frames !== 120 || fixture.fps !== 30) throw new Error("Wrong native frame contract");
if (fixture.states.selected.route !== fixture.selectedRoute || fixture.states.reloaded.route !== fixture.selectedRoute ||
    fixture.states.selected.query !== "" || fixture.states.reloaded.query !== "" ||
    !fixture.persisted.selectedRoute || fixture.persisted.query) throw new Error("Native search selection or reload persistence changed");
if (await fileHash(reference) !== fixture.referenceSha256) throw new Error("Native v0.0.42 recording changed");
await rm(work, { recursive: true, force: true });
await mkdir(resolve(project, "compositions"), { recursive: true });
await mkdir(nativeFrames, { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js"]) await copyFile(resolve(candidate, file), resolve(project, "compositions", file));
await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:#0a0a0a}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-thread-search-v0042-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659" data-variable-values='{"theme":"${theme}"}'></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-thread-search-v0042-fixture']=gsap.timeline({paused:true});</script></body></html>`);
const check = spawnSync("npx", ["--yes", "hyperframes@0.8.75", "check", project, "--json"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
await writeFile(resolve(work, "hyperframes-check-raw.json"), check.stdout);
if (check.status !== 0) throw new Error(`Full HyperFrames check failed: ${check.stderr.slice(-3000)}`);
const checkJson = JSON.parse(check.stdout.slice(check.stdout.indexOf("{")));
if (!checkJson.ok) throw new Error(`Full HyperFrames check failed: ${JSON.stringify(checkJson).slice(0, 3000)}`);
run("npx", ["--yes", "hyperframes@0.8.75", "render", project, "--format=png-sequence", "-o", outputFrames, "--strict", "--workers=1"]);
run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", reference, "-start_number", "0", resolve(nativeFrames, "frame-%04d.png")]);
const rendered = (await readdir(outputFrames)).filter((file) => file.endsWith(".png"));
const native = (await readdir(nativeFrames)).filter((file) => file.endsWith(".png"));
if (rendered.length !== fixture.frames || native.length !== fixture.frames) throw new Error(`Expected ${fixture.frames} frames, got ${native.length}/${rendered.length}`);
const stats = resolve(work, "ssim.txt");
run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-framerate", "30", "-start_number", "0", "-i", resolve(nativeFrames, "frame-%04d.png"), "-framerate", "30", "-start_number", "1", "-i", resolve(outputFrames, "frame_%06d.png"), "-lavfi", `ssim=stats_file=${stats}`, "-f", "null", "-"]);
const scores = [...(await readFile(stats, "utf8")).matchAll(/^n:\d+ .*?All:([\d.]+)/gm)].map((match) => Number(match[1]));
if (scores.length !== fixture.frames) throw new Error(`Expected ${fixture.frames} SSIM scores`);
const meanSsim = scores.reduce((sum, score) => sum + score, 0) / scores.length;
const minSsim = Math.min(...scores);
const result = { frameCount: scores.length, meanSsim, minSsim, worstFrame: scores.indexOf(minSsim), pass: meanSsim >= 0.989 && minSsim >= 0.985 };
await writeFile(resolve(work, "result.json"), JSON.stringify({ theme, sourceCommit: fixture.sourceCommit, sourceHashes: fixture.sourceHashes, referenceSha256: fixture.referenceSha256, compositionSha256: await fileHash(resolve(candidate, `${name}.html`)), check: { ok: checkJson.ok }, result }, null, 2) + "\n");
console.log(`${name} v0.0.42 ${theme}: ${scores.length} frames, mean=${meanSsim.toFixed(6)}, min=${minSsim.toFixed(6)}, worst=${result.worstFrame}, pass=${result.pass}`);
if (!result.pass) throw new Error("Official v0.0.42 parity missed; candidate remains unpublished");
