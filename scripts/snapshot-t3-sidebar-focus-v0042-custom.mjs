import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-sidebar-focus";
const theme = process.env.T3_CUSTOM_THEME ?? "dark";
if (!["dark", "light"].includes(theme)) throw new Error("T3_CUSTOM_THEME must be dark or light");
const block = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, ".work/t3-sidebar-focus-v0042-candidate"));
const work = resolve(root, `.work/t3-sidebar-focus-v0042-${theme}-custom`);
const project = resolve(work, "project");
const output = resolve(work, "render");
const overrides = {
  theme,
  projectName: "hyfrme-studio",
  projectAvatar: "HS",
  activeBranch: "feature/storyboard",
  threadOne: "Build Hyfrme opener",
  threadTwo: "Review Hyfrme timing",
  threadOneAge: "3h",
  threadTwoAge: "5h",
  prompt: "Build a four-second Hyfrme logo reveal with a still final frame.",
  modelName: "GPT-6-Sol",
  reasoningLevel: "Ultra",
  serviceTier: "Standard",
  sidebarWidth: 280,
  transitionMs: 250,
  collapseFrame: 20,
  restoreFrame: 80,
};
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;")
  .replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr.slice(-3500)} ${result.stdout.slice(-500)}`);
  return result;
};
await rm(work, { recursive: true, force: true });
await mkdir(resolve(project, "compositions"), { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js"]) {
  await copyFile(resolve(block, file), resolve(project, "compositions", file));
}
await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:${theme === "light" ? "#fff" : "#0a0a0a"}}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-sidebar-custom-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div id="t3-sidebar-custom-slot" data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escapeAttribute(JSON.stringify(overrides))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-sidebar-custom-fixture']=gsap.timeline({paused:true});</script></body></html>`);
await writeFile(resolve(work, "overrides.json"), JSON.stringify(overrides, null, 2) + "\n");
const checked = run("npx", ["--yes", "hyperframes@0.8.75", "check", project, "--json"]);
const check = JSON.parse(checked.stdout.slice(checked.stdout.indexOf("{")));
await writeFile(resolve(work, "check.json"), JSON.stringify(check, null, 2) + "\n");
if (!check.ok || ["lint", "runtime", "layout", "motion", "contrast"].some((gate) => check[gate]?.findings?.length)) {
  const findings = Object.entries(check).flatMap(([gate, value]) => value?.findings?.map((finding) => `${gate}: ${finding.message}`) ?? []);
  throw new Error(`Customized ${theme} full check failed: ${findings.slice(0, 8).join("; ")}`);
}
run("npx", ["--yes", "hyperframes@0.8.75", "render", project, "--format=png-sequence", "-o", output, "--strict", "--workers=2"]);
const rendered = (await readdir(output)).filter((file) => file.endsWith(".png"));
if (rendered.length !== 120) throw new Error(`Customized ${theme} render has ${rendered.length} frames`);
const image = (frame) => resolve(output, `frame_${String(frame).padStart(6, "0")}.png`);
const changed = (before, after) => {
  const difference = spawnSync("magick", ["compare", "-metric", "AE", image(before), image(after), "null:"], { encoding: "utf8" });
  const pixels = Number(difference.stderr.match(/^[\d.]+/)?.[0]);
  if (!Number.isFinite(pixels)) throw new Error(`Cannot compare customized frames ${before}/${after}`);
  return pixels;
};
const motionChanges = { collapse: changed(21, 22), restore: changed(81, 82), sidebarHidden: changed(10, 50) };
if (motionChanges.collapse < 100 || motionChanges.restore < 100 || motionChanges.sidebarHidden < 3000) {
  throw new Error(`Customized sidebar motion is missing: ${JSON.stringify(motionChanges)}`);
}
const ocr = (frame) => run("tesseract", [image(frame), "stdout"]).stdout;
const openText = ocr(10);
const restoredText = ocr(105);
for (const [label, value] of [["project", "hyfrme-studio"], ["thread", "Build Hyfrme opener"],
  ["prompt", "Build a four-second Hyfrme logo reveal"]]) {
  if (!openText.includes(value) || !restoredText.includes(value)) throw new Error(`Customized ${label} is missing in open/restored frames`);
}
const controlsCrop = resolve(work, "controls-crop.png");
run("magick", [image(10), "-crop", "440x56+350+342", "+repage", "-resize", "400%", controlsCrop]);
const controlsText = run("tesseract", [controlsCrop, "stdout"]).stdout;
if (!controlsText.includes("GPT-6-Sol") || !/\bUltra\b/.test(controlsText)) {
  throw new Error(`Customized model or reasoning level is missing from composer controls: ${controlsText}`);
}
const background = run("magick", [image(10), "-format", "%[pixel:p{800,100}]", "info:"]).stdout;
const channel = Number(background.match(/\((\d+),/)?.[1]);
if (!Number.isFinite(channel) || (theme === "light" ? channel < 230 : channel > 40)) {
  throw new Error(`Customized ${theme} appearance did not render: ${background}`);
}
await writeFile(resolve(work, "proof.json"), JSON.stringify({ theme, fullCheck: true, strictFrames: 120,
  compositionSha256: createHash("sha256").update(await readFile(resolve(block, `${name}.html`))).digest("hex"),
  overrides, motionChanges, controlsText, checked: ["appearance", "project", "thread", "prompt", "model", "reasoning", "sidebar-width", "transition-duration", "action-frames"] }, null, 2) + "\n");
console.log(`Customized ${theme} Sidebar Focus full check, strict render, and visible motion passed.`);
