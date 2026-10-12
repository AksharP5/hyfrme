import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-thread-wake";
const theme = process.env.T3_CUSTOM_THEME ?? "dark";
if (!["dark", "light"].includes(theme)) throw new Error("T3_CUSTOM_THEME must be dark or light");
const block = resolve(root, ".work/t3-thread-wake-v0042-candidate");
const project = resolve(root, `.work/t3-thread-wake-v0042-${theme}-custom`);
const source = await readFile(resolve(block, `${name}.html`));
const reuse = process.env.T3_CUSTOM_REUSE_RENDER === "1";
if (reuse && !source.equals(await readFile(resolve(project, "compositions", `${name}.html`)))) {
  throw new Error("The cached render does not match this candidate");
}
const overrides = {
  theme,
  projectName: "hyfrme-studio",
  projectAvatar: "HS",
  selectedThread: "Audit Hyfrme motion",
  wakeThread: "Build a Hyfrme opener",
  thirdThread: "Group Hyfrme logos",
  branchName: "hyfrme/main",
  question: "Which Hyfrme blocks need another v0.0.42 render?",
  reply: "Check Hyfrme logo motion and answer timing with matching frame rates.",
  snoozedShelfCollapsed: "Snoozed Hyfrme (1)",
  snoozedShelfExpanded: "Snoozed Hyfrme",
  wakeCountdown: "2h",
  wakeAction: "Wake Hyfrme thread",
  projectSettingsAction: "Project preferences",
  expandedFrame: 15,
  menuFrame: 35,
  wakeFrame: 65,
  persistedFrame: 90,
};
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stderr.slice(-3000)}\n${result.stdout.slice(-1500)}`);
  return result;
};
await mkdir(resolve(project, "compositions"), { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js", ...["dark", "light"].flatMap((appearance) =>
  ["menu"].map((phase) => `thread-wake-v0042-${appearance}-${phase}-crop.png`))]) {
  await copyFile(resolve(block, file), resolve(project, "compositions", file));
}
await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:${theme === "light" ? "#fff" : "#0a0a0a"}}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-thread-wake-v0042-custom-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escapeAttribute(JSON.stringify(overrides))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-thread-wake-v0042-custom-fixture']=gsap.timeline({paused:true});</script></body></html>`);
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
  [10, ["hyfrme-studio", "Audit Hyfrme motion"]],
  [25, ["Snoozed Hyfrme", "Build a Hyfrme opener"]],
  [45, ["Wake Hyfrme thread", "Project preferences"]],
  [75, ["Build a Hyfrme opener", "Group Hyfrme logos"]],
  [105, ["Build a Hyfrme opener", "Group Hyfrme logos"]],
]) {
  const image = resolve(project, "render", `frame_${String(frame + 1).padStart(6, "0")}.png`);
  const menu = frame === 45;
  const sidebar = [25, 75, 105].includes(frame);
  const readable = menu || sidebar ? resolve(project, `state-${frame}-ocr.png`) : image;
  if (menu) run("magick", [image, "-crop", "185x353+124+306", "+repage", "-resize", "250%", readable]);
  if (sidebar) run("magick", [image, "-crop", "250x460+0+145", "+repage", "-resize", "250%", readable]);
  const ocr = run("tesseract", [readable, "stdout", ...(menu || sidebar ? ["--psm", "6"] : [])]).stdout;
  for (const word of words) if (!ocr.toLowerCase().includes(word.toLowerCase())) {
    throw new Error(`Customized ${theme} frame ${frame} lacks ${word}; OCR: ${ocr.slice(0, 700)}`);
  }
}
const before = await readFile(resolve(project, "render/frame_000011.png"));
const expanded = await readFile(resolve(project, "render/frame_000026.png"));
const open = await readFile(resolve(project, "render/frame_000046.png"));
const after = await readFile(resolve(project, "render/frame_000076.png"));
const persisted = await readFile(resolve(project, "render/frame_000106.png"));
if (before.equals(expanded) || expanded.equals(open) || open.equals(after) || !after.equals(persisted)) {
  throw new Error("Edited shelf, menu, wake action, or persisted display differs from expected timing");
}
const pixel = run("magick", [resolve(project, "render/frame_000011.png"), "-format", "%[pixel:p{800,300}]", "info:"]).stdout;
const level = Number(pixel.match(/\((\d+),\s*(\d+),\s*(\d+)/)?.[1]);
if (!Number.isFinite(level) || (theme === "light" ? level < 230 : level > 40)) {
  throw new Error(`Unexpected ${theme} appearance: ${pixel}`);
}
await writeFile(resolve(project, "proof.json"), JSON.stringify({ theme, fullCheck: true, strictRenderFrames: 120,
  checked: ["project", "threads", "conversation", "snoozed shelf", "wake action", "menu actions", "state timing", "appearance"] }, null, 2) + "\n");
console.log(`Customized ${theme} full check, strict 120-frame render, and visible state assertions passed.`);
