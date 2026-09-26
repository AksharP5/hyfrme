import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const theme = process.argv[2] ?? "dark";
if (theme !== "dark" && theme !== "light") throw new Error("Expected dark or light theme");
const name = "t3-permission-choice";
const block = resolve(root, ".work/t3-permission-choice-v0042-candidate");
const project = resolve(root, `.work/t3-permission-choice-v0042-custom-${theme}`);
const output = resolve(project, "render");
const overrides = {
  theme,
  projectName: "hyfrme-studio",
  projectAvatar: "HS",
  activeBranch: "feature/custom-motion",
  threadOne: "Build Hyfrme opener",
  threadTwo: "Review Hyfrme timing",
  threadOneAge: "3h",
  threadTwoAge: "5h",
  modelName: "GPT-6-Sol",
  reasoningLevel: "High",
  serviceTier: "Fast",
  permissionBefore: "Full access",
  permissionAfter: "Review edits",
  autoAcceptDetail: "Review changed frames before running commands.",
  prompt: "Build a four-second Hyfrme logo reveal.",
  openFrame: 20,
  hoverFrame: 50,
  selectFrame: 95,
};
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stderr.slice(-2500)}\n${result.stdout.slice(-1200)}`);
  return result.stdout;
};
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;")
  .replaceAll("<", "&lt;").replaceAll(">", "&gt;");
await mkdir(resolve(project, "compositions"), { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js",
  ...["dark", "light"].flatMap((appearance) => ["menu", "hover"].map((phase) => `permission-choice-${appearance}-${phase}-raster.png`))]) {
  await copyFile(resolve(block, file), resolve(project, "compositions", file));
}
await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:${theme === "light" ? "#fff" : "#0a0a0a"}}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-permission-v0042-custom" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escapeAttribute(JSON.stringify(overrides))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-permission-v0042-custom']=gsap.timeline({paused:true});</script></body></html>`);
await writeFile(resolve(project, "overrides.json"), JSON.stringify(overrides, null, 2) + "\n");
const checkOutput = run("npx", ["--yes", "hyperframes@0.8.75", "check", project, "--json"]);
const check = JSON.parse(checkOutput.slice(checkOutput.indexOf("{")));
if (!check.ok) throw new Error("Customized Permission Choice full check failed");
await writeFile(resolve(project, "check.json"), JSON.stringify(check, null, 2) + "\n");
run("npx", ["--yes", "hyperframes@0.8.75", "render", project, "--format=png-sequence", "-o", output, "--strict", "--workers=1"]);
const frames = (await readdir(output)).filter((file) => file.endsWith(".png"));
if (frames.length !== 120) throw new Error(`Expected 120 customized frames; got ${frames.length}`);
const motionChanges = {};
for (const [phase, frame] of [["open", 20], ["hover", 50], ["select", 95]]) {
  const before = resolve(output, `frame_${String(frame).padStart(6, "0")}.png`);
  const after = resolve(output, `frame_${String(frame + 1).padStart(6, "0")}.png`);
  const result = spawnSync("magick", ["compare", "-metric", "AE", before, after, "null:"], { encoding: "utf8" });
  const changed = Number(result.stderr.match(/^[\d.]+/)?.[0]);
  if (!(changed > 100)) throw new Error(`${phase} does not produce a visible customized transition: ${result.stderr}`);
  motionChanges[phase] = changed;
}
const readOcr = (frame, name, bounds) => {
  const screenshot = resolve(output, `frame_${String(frame + 1).padStart(6, "0")}.png`);
  const crop = resolve(project, `${name}.png`);
  run("magick", [screenshot, "-crop", `${bounds.width}x${bounds.height}+${bounds.x}+${bounds.y}`,
    "+repage", "-resize", "300%", crop]);
  return run("tesseract", [crop, "stdout", "--psm", "6"]).toLowerCase().replace(/\s+/g, " ");
};
const before = readOcr(10, "before", { x: 340, y: 180, width: 780, height: 250 });
const menu = readOcr(70, "menu", { x: 600, y: 385, width: 355, height: 230 });
const after = readOcr(105, "after", { x: 595, y: 340, width: 350, height: 65 });
if (!before.includes("hyfrme-studio") || !before.includes("four-second hyfrme") ||
    !menu.includes("review edits") || !menu.includes("changed frames") || !after.includes("review edits")) {
  throw new Error(`Customized Permission Choice text is missing: ${JSON.stringify({ before, menu, after })}`);
}
await writeFile(resolve(project, "proof.json"), JSON.stringify({ theme, fullCheck: true,
  strictRenderFrames: frames.length, motionChanges, checked: ["project", "prompt", "mode", "menu-details", "reasoning", "fast-service-indicator", "event-frames", "theme"] }, null, 2) + "\n");
console.log(`Customized Permission Choice ${theme}: full check, 120-frame render, and visible inputs passed.`);
