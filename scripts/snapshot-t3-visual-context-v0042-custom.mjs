import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-visual-context-shelf";
const theme = process.env.T3_CUSTOM_THEME ?? "dark";
if (!["dark", "light"].includes(theme)) throw new Error("T3_CUSTOM_THEME must be dark or light");
const block = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, ".work/t3-visual-context-v0042-candidate"));
const work = resolve(root, `.work/t3-visual-context-v0042-${theme}-custom`);
const project = resolve(work, "project");
const output = resolve(work, "render");
const overrides = {
  theme,
  projectName: "hyfrme-studio",
  projectAvatar: "HS",
  branchName: "storyboard",
  threadOne: "Build Hyfrme opener",
  threadTwo: "Review Hyfrme frames",
  thread1Age: "3h",
  thread2Age: "5h",
  messagePrompt: "Build a four-second Hyfrme title reveal with a still finish.",
  messageTime: "today at 9:10 AM",
  answerLead: "I found the Hyfrme cut in",
  answerFile: "logo-intro.html",
  answerTail: ". The clip can hold its final mark before the next scene.",
  contextPrompt: "Use this Hyfrme storyboard frame as the reference.",
  finalInstruction: "Keep the opening frame still for 24 frames.",
  imageSrc: "compositions/hyfrme-custom-logo.png",
  imageName: "hyfrme-storyboard.png",
  imageSize: "11 KB",
  pasteFrame: 24,
  instructionFrame: 76,
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
for (const file of [`${name}.html`, "t3-code-gsap.min.js", "t3-visual-context-logo-enter.png"]) {
  await copyFile(resolve(block, file), resolve(project, "compositions", file));
}
await copyFile(resolve(root, "public/previews/logo-enter/thumbnail.png"), resolve(project, "compositions/hyfrme-custom-logo.png"));
const customImageSha256 = createHash("sha256").update(
  await readFile(resolve(project, "compositions/hyfrme-custom-logo.png"))).digest("hex");
const defaultImageSha256 = createHash("sha256").update(
  await readFile(resolve(block, "t3-visual-context-logo-enter.png"))).digest("hex");
if (customImageSha256 === defaultImageSha256) throw new Error("Customized image must differ from the native reference");
await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:${theme === "light" ? "#fff" : "#0a0a0a"}}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-visual-context-custom-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div id="t3-visual-context-custom-slot" data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escapeAttribute(JSON.stringify(overrides))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-visual-context-custom-fixture']=gsap.timeline({paused:true});</script></body></html>`);
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
const motionChanges = { attachment: changed(24, 25), instruction: changed(76, 77), beforeToAttached: changed(10, 50) };
if (motionChanges.attachment < 100 || motionChanges.instruction < 100 ||
    motionChanges.beforeToAttached < (theme === "light" ? 1000 : 3000)) {
  throw new Error(`Customized pasted-image or prompt state is missing: ${JSON.stringify(motionChanges)}`);
}
const ocr = (frame) => run("tesseract", [image(frame), "stdout"]).stdout;
const beforeText = ocr(10);
const attachedText = ocr(50);
const finalText = ocr(105);
const breadcrumbCrop = resolve(work, "breadcrumb-upsampled.png");
run("magick", [image(10), "-crop", "350x90+250+0", "+repage", "-resize", "1400x360", breadcrumbCrop]);
const breadcrumbText = run("tesseract", [breadcrumbCrop, "stdout", "--psm", "6"]).stdout;
for (const [label, text, value] of [["project", breadcrumbText, "hyfrme-studio"],
  ["thread", beforeText, "Build Hyfrme opener"],
  ["prompt", attachedText, "Use this Hyfrme storyboard frame"],
  ["final instruction", finalText, "Keep the opening frame still"]]) {
  if (!text.includes(value)) throw new Error(`Customized ${label} is missing from its rendered frame`);
}
const chipCrop = resolve(work, "edited-chip-upsampled.png");
run("magick", [image(105), "-crop", "240x26+358+503", "+repage", "-resize", "1440x156", chipCrop]);
const chipText = run("tesseract", [chipCrop, "stdout", "--psm", "6"]).stdout;
if (!chipText.includes(overrides.imageName) || !chipText.replaceAll("&", "B").includes(overrides.imageSize)) {
  throw new Error("Customized image filename or size is missing from the edited chip");
}
const background = run("magick", [image(10), "-format", "%[pixel:p{800,100}]", "info:"]).stdout;
const channel = Number(background.match(/\((\d+),/)?.[1]);
if (!Number.isFinite(channel) || (theme === "light" ? channel < 230 : channel > 40)) {
  throw new Error(`Customized ${theme} appearance did not render: ${background}`);
}
await writeFile(resolve(work, "proof.json"), JSON.stringify({ theme, fullCheck: true, strictFrames: 120,
  compositionSha256: createHash("sha256").update(await readFile(resolve(block, `${name}.html`))).digest("hex"),
  overrides, customImageSha256, motionChanges, checked: ["appearance", "project", "thread", "prompt", "image-source", "image-name", "action-frames"] }, null, 2) + "\n");
console.log(`Customized ${theme} Visual Context Shelf full check, strict render, and visible state changes passed.`);
