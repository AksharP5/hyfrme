import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-prompt-send";
const source = resolve(root, "assets/t3-code/v0.0.42");
const theme = process.env.T3_VERIFY_THEME ?? "dark";
if (!["dark", "light"].includes(theme)) throw new Error("T3_VERIFY_THEME must be dark or light");
const fixturePrefix = "prompt-send-v0042-" + theme;
const fixture = JSON.parse(await readFile(resolve(source, fixturePrefix + "-fixture.json"), "utf8"));
const block = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, ".work/" + name + "-v0042-candidate"));
const work = resolve(root, ".work/" + name + "-v0042-" + theme + "-verify");
const project = resolve(work, "project");
const nativeFrames = resolve(work, "native");
const outputFrames = resolve(work, "hyperframes");
const reference = resolve(root, "parity/" + name + "-v0042-" + theme + "-reference.mkv");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const fileHash = async (path) => hash(await readFile(path));
const run = (program, args) => {
  const result = spawnSync(program, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(program + " failed:\n" + result.stderr.slice(-3000) + "\n" + result.stdout.slice(-1000));
  return result;
};
if (fixture.sourceTag !== "v0.0.42" || fixture.sourceCommit !== "719a76ca1dbf5490f1aa33ffb9966301e02be9a9" ||
  fixture.frames !== 120 || fixture.fps !== 30 || fixture.theme !== theme ||
  fixture.events.send !== 30 || fixture.events.active !== fixture.events.send + fixture.events.transitionFrames ||
  fixture.events.transitionFrames !== 16 || fixture.events.complete !== 119 ||
  (fixture.events.responseStart !== null && (!Number.isInteger(fixture.events.responseStart) ||
    fixture.events.responseStart < fixture.events.active || fixture.events.responseStart >= fixture.events.complete)) ||
  typeof fixture.response !== "string" || !Array.isArray(fixture.transitionSequence) ||
  fixture.transitionSequence.length !== fixture.events.transitionFrames ||
  !Array.isArray(fixture.responseProgress) || fixture.responseProgress.length !== fixture.frames ||
  fixture.transitionSequence.some((phase) => !(phase in fixture.sourceDomHashes)) ||
  !fixture.sourceDomHashes.draft || !fixture.sourceDomHashes.active || !fixture.sourceDomHashes.complete ||
  fixture.captureSpriteFrameCount !== fixture.frames || Object.keys(fixture.captureSpriteSha256 ?? {}).length !== 10 ||
  !fixture.providerState.includes("live")) throw new Error("Incomplete pinned Prompt Send fixture");
if (await fileHash(reference) !== fixture.referenceSha256) throw new Error("Native Prompt Send recording changed");
for (const [phase, expected] of Object.entries(fixture.sourceDomHashes)) {
  const file = fixturePrefix + "-" + phase + ".html";
  if (await fileHash(resolve(source, file)) !== expected) throw new Error(theme + " native DOM changed: " + phase);
}
for (let row = 0; row < 10; row++) {
  const path = resolve(source, `prompt-send-v0042-${theme}-capture-${String(row).padStart(2, "0")}.webp`);
  if (await fileHash(path) !== fixture.captureSpriteSha256[String(row).padStart(2, "0")]) {
    throw new Error(theme + " capture atlas changed: row " + row);
  }
}
const release = resolve(root, ".work/t3-v0042-bin/t3-0.0.42-linux-x64/client");
for (const [key, path] of [["index", "index.html"], ["css", "assets/main-x9o7QJ8O.css"], ["js", "assets/index-BMH8bO9q.js"]]) {
  if (await fileHash(resolve(release, path)) !== fixture.sourceHashes[key]) throw new Error("Pinned T3 Code release asset changed: " + path);
}

await rm(work, { recursive: true, force: true });
await mkdir(resolve(project, "compositions"), { recursive: true });
await mkdir(nativeFrames, { recursive: true });
for (const file of [name + ".html", "t3-code-gsap.min.js", ...["dark", "light"].flatMap((captureTheme) =>
  Array.from({ length: 10 }, (_, row) => `t3-prompt-send-capture-${captureTheme}-${String(row).padStart(2, "0")}.webp`))]) {
  await copyFile(resolve(block, file), resolve(project, "compositions", file));
}
const themeValue = theme === "light" ? " data-variable-values='{\"theme\":\"light\"}'" : "";
await writeFile(resolve(project, "index.html"),
  "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><script src=\"compositions/t3-code-gsap.min.js\"></script>" +
  "<style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:" +
  (theme === "light" ? "#fff" : "#0a0a0a") +
  "}#root{width:100%;height:100%}</style></head><body><div id=\"root\" data-composition-id=\"" + name +
  "-v0042-fixture\" data-start=\"0\" data-duration=\"4\" data-fps=\"30\" data-width=\"1200\" data-height=\"659\">" +
  "<div data-composition-id=\"" + name + "\" data-composition-src=\"compositions/" + name +
  ".html\"" + themeValue + " data-start=\"0\" data-duration=\"4\" data-track-index=\"1\" data-width=\"1200\" data-height=\"659\"></div>" +
  "</div><script>window.__timelines=window.__timelines||{};window.__timelines['" + name +
  "-v0042-fixture']=gsap.timeline({paused:true});</script></body></html>");
const check = run("npx", ["--yes", "hyperframes@0.8.75", "check", project, "--json"]);
await writeFile(resolve(work, "hyperframes-check-raw.json"), check.stdout);
const checkJson = JSON.parse(check.stdout.slice(check.stdout.indexOf("{")));
if (!checkJson.ok) throw new Error("Full HyperFrames check failed for " + theme);
run("npx", ["--yes", "hyperframes@0.8.75", "render", project, "--format=png-sequence", "-o", outputFrames, "--strict", "--workers=2"]);
run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", reference,
  resolve(nativeFrames, "frame-%04d.png")]);
const rendered = (await readdir(outputFrames)).filter((file) => file.endsWith(".png"));
const native = (await readdir(nativeFrames)).filter((file) => file.endsWith(".png"));
if (rendered.length !== fixture.frames || native.length !== fixture.frames) {
  throw new Error("Expected 120 frames; native=" + native.length + ", HyperFrames=" + rendered.length);
}
const stats = resolve(work, "ssim.txt");
run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-framerate", String(fixture.fps), "-start_number", "0",
  "-i", resolve(nativeFrames, "frame-%04d.png"), "-framerate", String(fixture.fps), "-start_number", "1",
  "-i", resolve(outputFrames, "frame_%06d.png"), "-lavfi", "ssim=stats_file=" + stats, "-f", "null", "-"]);
const scores = [...(await readFile(stats, "utf8")).matchAll(/^n:\d+ .*?All:([\d.]+)/gm)].map((match) => Number(match[1]));
if (scores.length !== fixture.frames) throw new Error("Expected 120 full-frame SSIM values");
const sorted = [...scores].sort((a, b) => a - b);
const result = { frameCount: scores.length, meanSsim: scores.reduce((sum, score) => sum + score, 0) / scores.length,
  minSsim: sorted[0], p05Ssim: sorted[5], p95Ssim: sorted[114], worstFrame: scores.indexOf(sorted[0]) };
result.pass = result.meanSsim >= 0.989 && result.minSsim >= 0.985;
await writeFile(resolve(work, "result.json"), JSON.stringify({ fixture: { theme, sourceCommit: fixture.sourceCommit,
  referenceSha256: fixture.referenceSha256, compositionSha256: await fileHash(resolve(block, name + ".html")) }, result }, null, 2) + "\n");
console.log(name + " v0.0.42 " + theme + ": " + result.frameCount + " frames, mean=" +
  result.meanSsim.toFixed(6) + ", min=" + result.minSsim.toFixed(6) + ", pass=" + result.pass);
if (!result.pass) throw new Error("T3 v0.0.42 Prompt Send parity did not pass");
