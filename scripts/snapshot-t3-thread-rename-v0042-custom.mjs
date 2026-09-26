import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-thread-rename";
const theme = process.env.T3_CUSTOM_THEME ?? "dark";
if (!["dark", "light"].includes(theme)) throw new Error("T3_CUSTOM_THEME must be dark or light");
const block = resolve(root, ".work/t3-thread-rename-v0042-candidate");
const project = resolve(root, `.work/t3-thread-rename-v0042-${theme}-custom`);
const source = await readFile(resolve(block, `${name}.html`));
const reuse = process.env.T3_CUSTOM_REUSE_RENDER === "1";
if (reuse && !source.equals(await readFile(resolve(project, "compositions", `${name}.html`)))) {
  throw new Error("The cached render does not match this candidate");
}
const overrides = {
  theme,
  projectName: "hyfrme-studio",
  projectAvatar: "HS",
  oldTitle: "Build a Hyfrme opener",
  newTitle: "Polish Hyfrme opener",
  secondThread: "Audit Hyfrme motion",
  branchName: "hyfrme/main",
  question: "Build a Hyfrme product opener. Hold the final frame for 24 frames.",
  replyLead: "I checked the motion timing in",
  fileMention: "hyfrme-opener.html",
  replyTail: "The final frame can remain still while the clip runs longer.",
  workedDuration: "Worked for 3m",
  renameAction: "Change thread name",
  projectSettingsAction: "Project preferences",
  menuFrame: 15,
  renameFrame: 35,
  typedFrame: 55,
  commitFrame: 75,
  persistedFrame: 95,
};
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stderr.slice(-3000)}\n${result.stdout.slice(-1500)}`);
  return result;
};
await mkdir(resolve(project, "compositions"), { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js", ...["dark", "light"].flatMap((appearance) =>
  ["menu"].map((phase) => `thread-rename-v0042-${appearance}-${phase}-crop.png`))]) {
  await copyFile(resolve(block, file), resolve(project, "compositions", file));
}
await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:${theme === "light" ? "#fff" : "#0a0a0a"}}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-thread-rename-v0042-custom-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escapeAttribute(JSON.stringify(overrides))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-thread-rename-v0042-custom-fixture']=gsap.timeline({paused:true});</script></body></html>`);
await writeFile(resolve(project, "overrides.json"), JSON.stringify(overrides, null, 2) + "\n");
const checked = reuse ? null : run("npx", ["--yes", "hyperframes@0.8.75", "check", project, "--json"]);
const check = checked
  ? JSON.parse(checked.stdout.slice(checked.stdout.indexOf("{")))
  : JSON.parse(await readFile(resolve(project, "check.json"), "utf8"));
if (checked) await writeFile(resolve(project, "check.json"), JSON.stringify(check, null, 2) + "\n");
if (!check.ok) throw new Error(`Customized ${theme} full check failed`);
if (!reuse) run("npx", ["--yes", "hyperframes@0.8.75", "render", project, "--format=png-sequence", "-o", resolve(project, "render"), "--strict", "--workers=2"]);
const frames = (await readdir(resolve(project, "render"))).filter((file) => file.endsWith(".png"));
if (frames.length !== 120) throw new Error(`Customized ${theme} render has ${frames.length} frames`);
if (!source.includes("data-composition-variables")) throw new Error("Block has no editable variables");
for (const [frame, words, region] of [
  [10, ["hyfrme-studio", "Hyfrme opener"], null],
  [25, ["Change thread name", "Project preferences"], "300x353+350+37"],
  [65, ["Polish Hyfrme opener"], "520x45+360+2"],
  [85, ["Polish Hyfrme opener"], "520x45+360+2"],
  [110, ["Polish Hyfrme opener"], "520x45+360+2"],
]) {
  const framePath = resolve(project, "render", `frame_${String(frame + 1).padStart(6, "0")}.png`);
  const readable = region ? resolve(project, `state-${frame}-ocr.png`) : framePath;
  if (region) run("magick", [framePath, "-crop", region, "+repage", "-resize", "300%", readable]);
  const ocr = run("tesseract", [readable, "stdout", ...(region ? ["--psm", "6"] : [])]).stdout;
  for (const word of words) if (!ocr.toLowerCase().includes(word.toLowerCase())) {
    throw new Error(`Customized ${theme} frame ${frame} lacks ${word}; OCR: ${ocr.slice(0, 700)}`);
  }
}
const selection = run("magick", [resolve(project, "render/frame_000046.png"),
  "-format", "%[pixel:p{420,25}]", "info:"]).stdout;
const channels = selection.match(/\((\d+),\s*(\d+),\s*(\d+)/)?.slice(1).map(Number);
if (!channels || channels[2] < channels[0] + 80) {
  throw new Error(`Customized ${theme} editor did not select the old title: ${selection}`);
}
const menuImage = resolve(project, "render/frame_000026.png");
const menuEdges = run("magick", [menuImage, "-format",
  "%[pixel:p{367,55}]|%[pixel:p{408,55}]|%[pixel:p{409,55}]", "info:"]).stdout.split("|");
if (menuEdges[0] !== menuEdges[1] || menuEdges[1] === menuEdges[2]) {
  throw new Error(`Customized ${theme} menu is not anchored beneath the shifted title: ${menuEdges}`);
}
const before = await readFile(resolve(project, "render/frame_000011.png"));
const open = await readFile(resolve(project, "render/frame_000026.png"));
const editing = await readFile(resolve(project, "render/frame_000046.png"));
const typed = await readFile(resolve(project, "render/frame_000066.png"));
const committed = await readFile(resolve(project, "render/frame_000086.png"));
if (before.equals(open) || open.equals(editing) || editing.equals(typed) || typed.equals(committed)) {
  throw new Error("Edited menu, title editor, or commit has no visible state transition");
}
const pixel = run("magick", [resolve(project, "render/frame_000011.png"), "-format", "%[pixel:p{800,300}]", "info:"]).stdout;
const level = Number(pixel.match(/\((\d+),\s*(\d+),\s*(\d+)/)?.[1]);
if (!Number.isFinite(level) || (theme === "light" ? level < 230 : level > 40)) {
  throw new Error(`Unexpected ${theme} appearance: ${pixel}`);
}
await writeFile(resolve(project, "proof.json"), JSON.stringify({ theme, fullCheck: true, strictRenderFrames: 120,
  checked: ["project", "old and new titles", "conversation", "menu actions", "menu anchor", "state timing", "appearance"] }, null, 2) + "\n");
console.log(`Customized ${theme} full check, strict 120-frame render, and visible state assertions passed.`);
