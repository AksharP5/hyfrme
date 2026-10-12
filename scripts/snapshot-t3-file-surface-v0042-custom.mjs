import { spawnSync } from "node:child_process";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-file-surface";
const theme = process.argv[2] ?? "dark";
if (theme !== "dark" && theme !== "light") throw new Error("Expected dark or light theme");
const candidate = resolve(root, ".work/t3-file-surface-v0042-candidate");
const project = resolve(root, `.work/t3-file-surface-v0042-custom-${theme}`);
const output = resolve(project, "render");
const values = {
  theme,
  projectName: "hyfrme-lab",
  projectAvatar: "HL",
  draftTitle: "New Hyfrme",
  threadOne: "Build catalog opener",
  threadTwo: "Audit source frames",
  modelName: "GPT-6-Sol",
  chooserTitle: "Open a workspace panel",
  filesLabel: "Project files",
  treeRow1: "assets",
  treeRow2: "source",
  composerPlaceholder: "Ask Hyfrme to inspect a file",
  openFrame: 20,
  hoverFrame: 50,
  filesFrame: 90,
};
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr.slice(-2500)}\n${result.stdout.slice(-1200)}`);
  return result.stdout;
};

await mkdir(resolve(project, "compositions"), { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js"]) {
  await copyFile(resolve(candidate, file), resolve(project, "compositions", file));
}
const encoded = JSON.stringify(values).replaceAll("&", "&amp;").replaceAll("'", "&#39;");
await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:${theme === "light" ? "#fff" : "#0a0a0a"}}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-file-surface-v0042-custom" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${encoded}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-file-surface-v0042-custom']=gsap.timeline({paused:true});</script></body></html>`);
const checkOutput = run("npx", ["--yes", "hyperframes@0.8.75", "check", project, "--json"]);
const check = JSON.parse(checkOutput.slice(checkOutput.indexOf("{")));
if (!check.ok) throw new Error("Custom variable full check failed");
await writeFile(resolve(project, "check.json"), JSON.stringify(check, null, 2) + "\n");
run("npx", ["--yes", "hyperframes@0.8.75", "render", project, "--format=png-sequence", "-o", output, "--strict", "--workers=2"]);
for (const [frame, required] of [
  [10, ["hyfrme-lab", "Build catalog opener", "Audit source frames"]],
  [30, ["Open a workspace panel", "Project files"]],
  [60, ["Open a workspace panel", "Project files"]],
  [105, ["assets", "source"]],
]) {
  const path = resolve(output, `frame_${String(frame + 1).padStart(6, "0")}.png`);
  const result = run("tesseract", [path, "stdout", "--psm", "11"]);
  for (const text of required) {
    if (!result.toLowerCase().includes(text.toLowerCase())) {
      throw new Error(`Custom frame ${frame} missing ${text}: ${result.slice(0, 1000)}`);
    }
  }
}
for (const [frame, geometry, label, file] of [
  [10, "180x40+350+350", "GPT-6-Sol", "model"],
  [105, "190x44+665+0", "Project files", "files-heading"],
]) {
  const path = resolve(output, `frame_${String(frame + 1).padStart(6, "0")}.png`);
  const crop = resolve(project, `${file}-crop.png`);
  run("magick", [path, "-crop", geometry, "+repage", "-resize", "400%", "-colorspace", "Gray", "-contrast-stretch", "1%x1%", crop]);
  const result = run("tesseract", [crop, "stdout", "--psm", "7"]);
  if (!result.toLowerCase().includes(label.toLowerCase())) {
    throw new Error(`Custom frame ${frame} missing ${label}: ${result}`);
  }
}
console.log(`File Surface v0.0.42 ${theme} custom text, file tree, and beat times passed full check and strict render.`);
