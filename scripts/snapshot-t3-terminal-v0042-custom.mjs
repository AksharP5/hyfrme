import { spawnSync } from "node:child_process";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const theme = process.argv[2] ?? "dark";
if (theme !== "dark" && theme !== "light") throw new Error("Expected dark or light theme");
const root = resolve(import.meta.dirname, "..");
const name = "t3-terminal-check";
const candidate = resolve(root, `.work/${name}-v0042-candidate`);
const project = resolve(root, `.work/${name}-v0042-custom-${theme}`);
const output = resolve(project, "render");
const values = {
  theme,
  projectName: "hyfrme-lab",
  projectAvatar: "HL",
  draftTitle: "New Hyfrme",
  threadOne: "Build catalog opener",
  threadTwo: "Audit terminal frames",
  thread1Age: "3h",
  thread3Branch: "logo/new",
  modelName: "GPT-6-Sol",
  composerPlaceholder: "Ask Hyfrme to inspect a command",
  folderOne: "modules",
  folderTwo: "pieces",
  folderThree: "logo-new",
  fileName: "logo-new.html",
  sourceClass: "logo-new",
  sourceText: "Hyfrme Lab",
  sourceCaption: "Logo New",
  terminalTab: "Terminal QA",
  terminalPrompt: "hyfrme-lab",
  terminalBranch: "demo",
  command: "git diff --stat",
  output: " modules/pieces/logo-new/logo-new.html | 1 +",
  addSurfaceFrame: 10,
  terminalFrame: 35,
  typeFrame: 65,
  runFrame: 90,
};
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stderr.slice(-2500)}\n${result.stdout.slice(-1200)}`);
  return result.stdout;
};
await mkdir(resolve(project, "compositions"), { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js"]) await copyFile(resolve(candidate, file), resolve(project, "compositions", file));
const encoded = JSON.stringify(values).replaceAll("&", "&amp;").replaceAll("'", "&#39;");
await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:${theme === "light" ? "#fff" : "#0a0a0a"}}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="${name}-v0042-custom" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${encoded}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['${name}-v0042-custom']=gsap.timeline({paused:true});</script></body></html>`);
const checkOutput = run("npx", ["--yes", "hyperframes@0.8.75", "check", project, "--json"]);
const check = JSON.parse(checkOutput.slice(checkOutput.indexOf("{")));
if (!check.ok) throw new Error("Custom variable full check failed");
await writeFile(resolve(project, "check.json"), JSON.stringify(check, null, 2) + "\n");
run("npx", ["--yes", "hyperframes@0.8.75", "render", project, "--format=png-sequence", "-o", output, "--strict", "--workers=1"]);
const readOcr = (frame, crop) => {
  const screenshot = resolve(output, `frame_${String(frame + 1).padStart(6, "0")}.png`);
  const path = resolve(project, `frame-${frame}-${crop.name}.png`);
  run("magick", [screenshot, "-crop", `${crop.width}x${crop.height}+${crop.x}+${crop.y}`, "+repage", "-resize", "300%", path]);
  return run("tesseract", [path, "stdout", "--psm", "6"]).toLowerCase().replace(/\s+/g, " ");
};
const source = readOcr(5, { name: "source", x: 660, y: 42, width: 540, height: 310 });
const menu = readOcr(20, { name: "menu", x: 784, y: 44, width: 187, height: 234 });
const typed = readOcr(78, { name: "typed", x: 661, y: 52, width: 539, height: 125 });
const finished = readOcr(105, { name: "output", x: 661, y: 52, width: 539, height: 160 });
if (!source.includes("logo-new.html") || !source.includes("hyfrme lab") || !menu.includes("terminal") ||
    !typed.includes("git diff --stat") || !finished.includes("modules/pieces/logo-new/logo-new.html")) {
  throw new Error(`Customized Terminal Check is missing visible inputs: ${JSON.stringify({ source, menu, typed, finished })}`);
}
console.log(`Terminal Check v0.0.42 ${theme}: custom source, command/output, and frame timing passed.`);
