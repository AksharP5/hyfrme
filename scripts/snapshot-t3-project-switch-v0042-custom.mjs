import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-project-switch";
const theme = process.env.T3_CUSTOM_THEME ?? "dark";
if (!["dark", "light"].includes(theme)) throw new Error("T3_CUSTOM_THEME must be dark or light");
const block = resolve(root, ".work/t3-project-switch-v0042-candidate");
const project = resolve(root, `.work/t3-project-switch-v0042-${theme}-custom`);
const source = await readFile(resolve(block, `${name}.html`));
const reuse = process.env.T3_CUSTOM_REUSE_RENDER === "1";
if (reuse && !source.equals(await readFile(resolve(project, "compositions", `${name}.html`)))) {
  throw new Error("The cached render does not match this candidate");
}
const overrides = {
  theme,
  projectName: "hyfrme-studio",
  motionProject: "hyfrme-motion-suite",
  allProjects: "Every project",
  emptyMessage: "No Hyfrme video threads here yet",
  projectAvatar: "HS",
  motionAvatar: "HM",
  firstThread: "Build a Hyfrme opener",
  secondThread: "Audit Hyfrme motion",
  question: "Build a Hyfrme product opener. Hold the final frame for 24 frames.",
  replyLead: "I checked the motion timing in",
  fileMention: "hyfrme-opener.html",
  replyTail: "The final frame can remain still while the clip runs longer.",
  workedDuration: "Worked for 3m",
  searchProjects: "Find Hyfrme projects...",
  menuFrame: 15,
  motionFrame: 35,
  motionMenuFrame: 55,
  hyfrmeFrame: 75,
  hyfrmeMenuFrame: 95,
};
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stderr.slice(-3000)}\n${result.stdout.slice(-1500)}`);
  return result;
};
await mkdir(resolve(project, "compositions"), { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js", ...["dark", "light"].flatMap((appearance) =>
  ["menu", "motion-menu", "hyfrme-menu"].map((phase) => `project-switch-v0042-${appearance}-${phase}-crop.png`))]) {
  await copyFile(resolve(block, file), resolve(project, "compositions", file));
}
await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:${theme === "light" ? "#fff" : "#0a0a0a"}}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-project-switch-v0042-custom-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escapeAttribute(JSON.stringify(overrides))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-project-switch-v0042-custom-fixture']=gsap.timeline({paused:true});</script></body></html>`);
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
for (const [frame, words] of [
  [10, ["hyfrme-studio", "Hyfrme opener"]],
  [25, ["Find Hyfrme projects", "Every project", "hyfrme-motion-suite"]],
  [45, ["No Hyfrme video threads"]],
  [65, ["hyfrme-motion-suite", "Every project"]],
  [85, ["hyfrme-studio", "Hyfrme opener"]],
  [105, ["Find Hyfrme projects", "hyfrme-studio"]],
]) {
  const image = resolve(project, "render", `frame_${String(frame + 1).padStart(6, "0")}.png`);
  const menu = [25, 65, 105].includes(frame);
  const empty = frame === 45;
  const readable = menu || empty ? resolve(project, `state-${frame}-ocr.png`) : image;
  if (menu) run("magick", [image, "-crop", "234x147+9+93", "+repage", "-resize", "300%", readable]);
  if (empty) run("magick", [image, "-crop", "230x50+20+100", "+repage", "-resize", "400%", readable]);
  const ocr = run("tesseract", [readable, "stdout", ...(menu || empty ? ["--psm", "6"] : [])]).stdout;
  for (const word of words) if (!ocr.includes(word)) {
    throw new Error(`Customized ${theme} frame ${frame} lacks ${word}; OCR: ${ocr.slice(0, 700)}`);
  }
}
const before = await readFile(resolve(project, "render/frame_000011.png"));
const open = await readFile(resolve(project, "render/frame_000056.png"));
const after = await readFile(resolve(project, "render/frame_000111.png"));
if (before.equals(open) || open.equals(after)) throw new Error("Edited action timing did not change rendered frames");
const pixel = run("magick", [resolve(project, "render/frame_000011.png"), "-format", "%[pixel:p{800,300}]", "info:"]).stdout;
const level = Number(pixel.match(/\((\d+),\s*(\d+),\s*(\d+)/)?.[1]);
if (!Number.isFinite(level) || (theme === "light" ? level < 230 : level > 40)) {
  throw new Error(`Unexpected ${theme} appearance: ${pixel}`);
}
await writeFile(resolve(project, "proof.json"), JSON.stringify({ theme, fullCheck: true, strictRenderFrames: 120,
  checked: ["project names", "avatars", "thread", "conversation", "empty state", "menu labels", "state timing", "appearance"] }, null, 2) + "\n");
console.log(`Customized ${theme} full check, strict 120-frame render, and visible state assertions passed.`);
