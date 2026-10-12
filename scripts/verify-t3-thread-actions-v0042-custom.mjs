import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-thread-actions";
const source = resolve(root, `.work/${name}-v0042-candidate`);
const theme = process.argv[2];
if (theme !== "dark" && theme !== "light") throw new Error("Pass dark or light");
const project = resolve(root, `.work/${name}-v0042-${theme}-custom`);
const values = {
  theme,
  projectName: "hyfrme-studio",
  branchName: "feature/motion",
  activeBranch: "feature/hyfrme-sequence",
  threadOne: "Review Hyfrme frames",
  threadTwo: "Audit Hyfrme catalog",
  userMessage: "Review the Hyfrme logo motion for a new video.",
  workedDuration: "Worked for 4m",
  composerPlaceholder: "Ask Hyfrme about this sequence",
  menuItem2: "Keep thread on top",
  snoozePreset1: "Pause until tomorrow",
  openFrame: 35,
  submenuFrame: 72,
  closeFrame: 105,
};
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stderr.slice(-3000)}\n${result.stdout.slice(-1000)}`);
  return result.stdout;
};
const escape = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
await rm(project, { recursive: true, force: true });
await mkdir(resolve(project, "compositions"), { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js"]) {
  await copyFile(resolve(source, file), resolve(project, "compositions", file));
}
await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="${name}-${theme}-custom-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escape(JSON.stringify(values))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['${name}-${theme}-custom-fixture']=gsap.timeline({paused:true});</script></body></html>`);
await writeFile(resolve(project, "values.json"), JSON.stringify(values, null, 2) + "\n");
const check = run("npx", ["--yes", "hyperframes@0.8.75", "check", project, "--json"]);
await writeFile(resolve(project, "check.json"), check.slice(check.indexOf("{")));
if (!JSON.parse(check.slice(check.indexOf("{"))).ok) throw new Error("Custom full check failed");
run("npx", ["--yes", "hyperframes@0.8.75", "snapshot", project, "--at", "0.8,1.6,2.6,3.7", "--no-end", "-o", resolve(project, "snapshots")]);
const expected = [
  ["frame-00-at-0.8s.png", ["Review Hyfrme frames"]],
  ["frame-01-at-1.6s.png", ["Keep thread on top"]],
  ["frame-02-at-2.6s.png", ["Pause until tomorrow"]],
  ["frame-03-at-3.7s.png", ["Review Hyfrme frames"]],
];
for (const [file, phrases] of expected) {
  const result = spawnSync("tesseract", [resolve(project, "snapshots", file), "stdout"], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`OCR failed for ${file}: ${result.stderr}`);
  for (const phrase of phrases) if (!result.stdout.includes(phrase)) throw new Error(`${file} does not visibly show ${phrase}: ${result.stdout.slice(0, 1500)}`);
}
const compositionSha256 = createHash("sha256").update(await readFile(resolve(source, `${name}.html`))).digest("hex");
await writeFile(resolve(project, "result.json"), JSON.stringify({ theme, compositionSha256, fullCheck: true, visibleSnapshots: expected.length, values }, null, 2) + "\n");
console.log(`${name} v0.0.42 ${theme} custom text and action timings passed full check and four visible snapshots.`);
