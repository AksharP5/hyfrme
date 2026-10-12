import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const theme = process.argv[2];
if (theme !== "dark" && theme !== "light") throw new Error("Pass dark or light");
const name = "t3-thread-search";
const candidate = resolve(root, `.work/${name}-v0042-candidate`);
const project = resolve(root, `.work/${name}-v0042-${theme}-custom`);
const values = {
  theme,
  projectName: "hyfrme-studio",
  projectAvatar: "HY",
  firstThread: "Audit Hyfrme motion",
  secondThread: "Build a Hyfrme intro",
  thirdThread: "Grouped Hyfrme marks",
  fourthThread: "Review Hyfrme hold",
  fifthThread: "Search Hyfrme previews",
  settledThread: "Verify Hyfrme logo",
  secondAge: "4h",
  thirdAge: "6h",
  firstQuery: "intro",
  finalQuery: "grouped",
  firstPrompt: "Build an eight-second Hyfrme intro with a clean final hold.",
  selectedPrompt: "Group the Hyfrme marks into one lockup.",
  selectedReply: "Align the marks and finish with the Hyfrme wordmark.",
  composerPlaceholder: "Ask Hyfrme about this cut",
  focusFrame: 8,
  firstQueryFrame: 14,
  arrowDownFrame: 38,
  arrowUpFrame: 48,
  clearFrame: 58,
  finalQueryFrame: 64,
  selectFrame: 108,
  reloadFrame: 114,
};
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stderr.slice(-3000)}\n${result.stdout.slice(-1000)}`);
  return result.stdout;
};
const escape = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
await rm(project, { recursive: true, force: true });
await mkdir(resolve(project, "compositions"), { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js"]) await copyFile(resolve(candidate, file), resolve(project, "compositions", file));
await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="${name}-${theme}-custom-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escape(JSON.stringify(values))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['${name}-${theme}-custom-fixture']=gsap.timeline({paused:true});</script></body></html>`);
await writeFile(resolve(project, "values.json"), JSON.stringify(values, null, 2) + "\n");
const check = run("npx", ["--yes", "hyperframes@0.8.75", "check", project, "--json"]);
const parsed = JSON.parse(check.slice(check.indexOf("{")));
await writeFile(resolve(project, "check.json"), JSON.stringify(parsed, null, 2) + "\n");
if (!parsed.ok) throw new Error("Edited-input full check failed");
run("npx", ["--yes", "hyperframes@0.8.75", "snapshot", project, "--at", "0.85,1.3,2.1,3.35,3.7,3.9", "--no-end", "-o", resolve(project, "snapshots")]);
const expected = [
  ["frame-00-at-0.85s.png", ["Build a Hyfrme intro"]],
  ["frame-01-at-1.3s.png", ["Build a Hyfrme intro"]],
  ["frame-02-at-2.1s.png", ["Audit Hyfrme motion"]],
  ["frame-03-at-3.35s.png", ["Grouped Hyfrme marks"]],
  ["frame-04-at-3.7s.png", ["Group the Hyfrme marks"]],
  ["frame-05-at-3.9s.png", ["Grouped Hyfrme marks"]],
];
for (const [file, phrases] of expected) {
  const crop = file.includes("3.7s") ? "820x230+300+60" : file.includes("3.9s") ? "256x350+0+0" : "256x210+0+0";
  const focused = resolve(project, `focused-${file}`);
  run("magick", [resolve(project, "snapshots", file), "-crop", crop, "+repage", "-resize", "300%", focused]);
  const result = spawnSync("tesseract", [focused, "stdout", "--psm", "6"], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`OCR failed for ${file}: ${result.stderr}`);
  const visible = result.stdout.replace(/\s+/g, " ");
  for (const phrase of phrases) if (!visible.includes(phrase)) throw new Error(`${file} does not visibly show ${phrase}: ${visible.slice(0, 600)}`);
}
const compositionSha256 = createHash("sha256").update(await readFile(resolve(candidate, `${name}.html`))).digest("hex");
await writeFile(resolve(project, "result.json"), JSON.stringify({ theme, compositionSha256, fullCheck: true, visibleSnapshots: expected.length, values }, null, 2) + "\n");
console.log(`${name} v0.0.42 ${theme} custom text, queries, and timings passed full check and six visible snapshots.`);
