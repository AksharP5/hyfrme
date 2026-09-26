import { spawnSync } from "node:child_process";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const theme = process.argv[2] ?? "dark";
if (theme !== "dark" && theme !== "light") throw new Error("Expected dark or light theme");
const root = resolve(import.meta.dirname, "..");
const name = "t3-source-file-open";
const candidate = resolve(root, ".work/t3-source-file-open-v0042-candidate");
const project = resolve(root, `.work/t3-source-file-open-v0042-custom-${theme}`);
const output = resolve(project, "render");
const values = {
  theme,
  projectName: "hyfrme-lab",
  projectAvatar: "HL",
  draftTitle: "New Hyfrme",
  threadOne: "Build catalog opener",
  threadTwo: "Audit source frames",
  thread1Age: "3h",
  thread3Branch: "logo/new",
  modelName: "GPT-6-Sol",
  composerPlaceholder: "Ask Hyfrme to inspect a file",
  folderOne: "modules",
  folderTwo: "pieces",
  folderThree: "logo-motion",
  fileName: "logo-motion.html",
  sourceClass: "logo-motion",
  sourceText: "Hyfrme Lab",
  sourceCaption: "Logo Motion",
  registryFrame: 10,
  blocksFrame: 35,
  logoEnterFrame: 60,
  openFileFrame: 90,
};
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stderr.slice(-2500)}\n${result.stdout.slice(-1200)}`);
  return result.stdout;
};
await mkdir(resolve(project, "compositions"), { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js"]) {
  await copyFile(resolve(candidate, file), resolve(project, "compositions", file));
}
const encoded = JSON.stringify(values).replaceAll("&", "&amp;").replaceAll("'", "&#39;");
await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:${theme === "light" ? "#fff" : "#0a0a0a"}}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-source-file-open-v0042-custom" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${encoded}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-source-file-open-v0042-custom']=gsap.timeline({paused:true});</script></body></html>`);
const checkOutput = run("npx", ["--yes", "hyperframes@0.8.75", "check", project, "--json"]);
const check = JSON.parse(checkOutput.slice(checkOutput.indexOf("{")));
if (!check.ok) throw new Error("Custom variable full check failed");
await writeFile(resolve(project, "check.json"), JSON.stringify(check, null, 2) + "\n");
run("npx", ["--yes", "hyperframes@0.8.75", "render", project, "--format=png-sequence", "-o", output, "--strict", "--workers=1"]);
for (const [frame, required] of [
  [5, ["hyfrme-lab", "Build catalog opener"]],
  [20, ["modules"]],
  [45, ["pieces"]],
  [75, ["logo-motion"]],
]) {
  const path = resolve(output, `frame_${String(frame + 1).padStart(6, "0")}.png`);
  const result = run("tesseract", [path, "stdout", "--psm", "11"]).toLowerCase();
  for (const label of required) {
    if (!result.includes(label.toLowerCase())) throw new Error(`Custom frame ${frame} missing ${label}: ${result.slice(0, 900)}`);
  }
}
const final = resolve(output, "frame_000106.png");
const fileCrop = resolve(project, "file-crop.png");
const codeCrop = resolve(project, "code-crop.png");
run("magick", [final, "-crop", "240x80+960+140", "+repage", "-resize", "300%", fileCrop]);
run("magick", [final, "-crop", "285x260+660+91", "+repage", "-resize", "300%", codeCrop]);
const fileText = run("tesseract", [fileCrop, "stdout", "--psm", "6"]).toLowerCase();
const codeText = run("tesseract", [codeCrop, "stdout", "--psm", "6"]).toLowerCase().replace(/\s+/g, " ");
if (!fileText.includes("logo-motion.html") ||
    !codeText.includes('class="logo-motion"') ||
    !codeText.includes("hyfrme lab") ||
    !codeText.includes("logo motion")) {
  throw new Error(`Custom source or selected file is missing: ${fileText} | ${codeText}`);
}
console.log(`Source File Open v0.0.42 ${theme}: custom project, tree, source text, and frame times passed.`);
