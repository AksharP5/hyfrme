import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-visual-context-remove";
const theme = process.env.T3_CUSTOM_THEME ?? "dark";
if (!["dark", "light"].includes(theme)) throw new Error("T3_CUSTOM_THEME must be dark or light");
const block = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, ".work/t3-visual-context-remove-v0042-candidate"));
const work = resolve(root, `.work/t3-visual-context-remove-v0042-${theme}-custom`);
const project = resolve(work, "project");
const output = resolve(work, "render");
const reuseRender = process.env.T3_CUSTOM_REUSE === "1";
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
  imageSrc: "compositions/hyfrme-custom-logo.png",
  imageName: "hyfrme-storyboard.png",
  imageSize: "11 KB",
  confirmDescription: "Remove its inline mention too.",
  confirmButton: "Remove frame",
  cancelButton: "Keep frame",
  hoverFrame: 20,
  confirmOpenFrame: 50,
  removeFrame: 82,
};
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;")
  .replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr.slice(-3500)} ${result.stdout.slice(-500)}`);
  return result;
};
if (!reuseRender) {
  await rm(work, { recursive: true, force: true });
  await mkdir(resolve(project, "compositions"), { recursive: true });
  for (const file of [`${name}.html`, "t3-code-gsap.min.js", "t3-visual-context-logo-enter.png"]) {
    await copyFile(resolve(block, file), resolve(project, "compositions", file));
  }
  await copyFile(resolve(root, "public/previews/logo-enter/thumbnail.png"), resolve(project, "compositions/hyfrme-custom-logo.png"));
} else if (createHash("sha256").update(await readFile(resolve(project, "compositions", `${name}.html`))).digest("hex") !==
           createHash("sha256").update(await readFile(resolve(block, `${name}.html`))).digest("hex") ||
           JSON.stringify(JSON.parse(await readFile(resolve(work, "overrides.json"), "utf8"))) !== JSON.stringify(overrides)) {
  throw new Error("Cannot reuse a render from different source or variable values");
}
const customImageSha256 = createHash("sha256").update(
  await readFile(resolve(project, "compositions/hyfrme-custom-logo.png"))).digest("hex");
const defaultImageSha256 = createHash("sha256").update(
  await readFile(resolve(block, "t3-visual-context-logo-enter.png"))).digest("hex");
if (customImageSha256 === defaultImageSha256) throw new Error("Customized image must differ from the native reference");
if (!reuseRender) await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:${theme === "light" ? "#fff" : "#0a0a0a"}}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-visual-context-custom-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div id="t3-visual-context-custom-slot" data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escapeAttribute(JSON.stringify(overrides))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-visual-context-custom-fixture']=gsap.timeline({paused:true});</script></body></html>`);
await writeFile(resolve(work, "overrides.json"), JSON.stringify(overrides, null, 2) + "\n");
const checked = reuseRender ? { stdout: await readFile(resolve(work, "check.json"), "utf8") } :
  run("npx", ["--yes", "hyperframes@0.8.75", "check", project, "--json"]);
const check = JSON.parse(checked.stdout.slice(checked.stdout.indexOf("{")));
await writeFile(resolve(work, "check.json"), JSON.stringify(check, null, 2) + "\n");
if (!check.ok || ["lint", "runtime", "layout", "motion", "contrast"].some((gate) => check[gate]?.findings?.length)) {
  const findings = Object.entries(check).flatMap(([gate, value]) => value?.findings?.map((finding) => `${gate}: ${finding.message}`) ?? []);
  throw new Error(`Customized ${theme} full check failed: ${findings.slice(0, 8).join("; ")}`);
}
if (!reuseRender) run("npx", ["--yes", "hyperframes@0.8.75", "render", project, "--format=png-sequence", "-o", output, "--strict", "--workers=2"]);
const rendered = (await readdir(output)).filter((file) => file.endsWith(".png"));
if (rendered.length !== 120) throw new Error(`Customized ${theme} render has ${rendered.length} frames`);
const image = (frame) => resolve(output, `frame_${String(frame).padStart(6, "0")}.png`);
const changed = (before, after) => {
  const difference = spawnSync("magick", ["compare", "-metric", "AE", image(before), image(after), "null:"], { encoding: "utf8" });
  const pixels = Number(difference.stderr.match(/^[\d.]+/)?.[0]);
  if (!Number.isFinite(pixels)) throw new Error(`Cannot compare customized frames ${before}/${after}`);
  return pixels;
};
const motionChanges = { hover: changed(20, 21), confirmation: changed(50, 51), removal: changed(82, 83),
  beforeToRemoved: changed(10, 105) };
if (motionChanges.confirmation < (theme === "light" ? 20 : 100) || motionChanges.removal < 100 ||
    motionChanges.beforeToRemoved < (theme === "light" ? 1000 : 3000)) {
  throw new Error(`Customized confirmation or removal state is missing: ${JSON.stringify(motionChanges)}`);
}
const ocr = (frame) => run("tesseract", [image(frame), "stdout"]).stdout;
const beforeText = ocr(10);
const dialogText = ocr(70);
const finalText = ocr(105);
const breadcrumbCrop = resolve(work, "breadcrumb-upsampled.png");
run("magick", [image(10), "-crop", "350x90+250+0", "+repage", "-resize", "1400x360", breadcrumbCrop]);
const breadcrumbText = run("tesseract", [breadcrumbCrop, "stdout", "--psm", "6"]).stdout;
for (const [label, text, value] of [["project", breadcrumbText, "hyfrme-studio"],
  ["thread", beforeText, "Build Hyfrme opener"],
  ["prompt", beforeText, "Use this Hyfrme storyboard frame"],
  ["remaining prompt", finalText, "Use this Hyfrme storyboard frame"]]) {
  if (!text.includes(value)) throw new Error(`Customized ${label} is missing from its rendered frame`);
}
const dialogCrop = resolve(work, "dialog-upsampled.png");
run("magick", [image(70), "-crop", "550x210+325+225", "+repage", "-resize", "1100x420", dialogCrop]);
const dialogCropText = run("tesseract", [dialogCrop, "stdout", "--psm", "6"]).stdout;
if (!dialogCropText.includes(overrides.imageName) ||
    !dialogCropText.includes(overrides.confirmDescription.replace(/[.!?]$/, ""))) {
  throw new Error(`Customized confirmation copy is missing: ${dialogCropText}`);
}
const cancelTextCrop = resolve(work, "cancel-button-upsampled.png");
run("magick", [dialogCrop, "-crop", "200x60+565+290", "+repage", "-resize", "800x240",
  "-colorspace", "Gray", ...(theme === "dark" ? ["-negate"] : []), "-threshold", "45%", cancelTextCrop]);
const cancelButtonText = run("tesseract", [cancelTextCrop, "stdout", "--psm", "7"]).stdout;
if (!cancelButtonText.includes(overrides.cancelButton)) {
  throw new Error(`Customized cancel button is missing: ${cancelButtonText}`);
}
const confirmTextCrop = resolve(work, "confirm-button-upsampled.png");
run("magick", [dialogCrop, "-crop", "240x60+775+290", "+repage", "-resize", "960x240",
  "-colorspace", "Gray", "-negate", "-threshold", "50%", confirmTextCrop]);
const confirmButtonText = run("tesseract", [confirmTextCrop, "stdout", "--psm", "7"]).stdout;
if (!confirmButtonText.includes(overrides.confirmButton)) {
  throw new Error(`Customized confirm button is missing: ${confirmButtonText}`);
}
const chipCrop = resolve(work, "attached-chip-upsampled.png");
run("magick", [image(10), "-crop", "250x26+675+480", "+repage", "-resize", "1500x156", chipCrop]);
const chipText = run("tesseract", [chipCrop, "stdout", "--psm", "6"]).stdout;
if (!chipText.includes(overrides.imageName) ||
    !chipText.replaceAll("&", "B").replace(/K[E8]/g, "KB").includes(overrides.imageSize)) {
  throw new Error("Customized image filename or size is missing from the attached chip");
}
const background = run("magick", [image(10), "-format", "%[pixel:p{800,100}]", "info:"]).stdout;
const channel = Number(background.match(/\((\d+),/)?.[1]);
if (!Number.isFinite(channel) || (theme === "light" ? channel < 230 : channel > 40)) {
  throw new Error(`Customized ${theme} appearance did not render: ${background}`);
}
await writeFile(resolve(work, "proof.json"), JSON.stringify({ theme, fullCheck: true, strictFrames: 120,
  compositionSha256: createHash("sha256").update(await readFile(resolve(block, `${name}.html`))).digest("hex"),
  overrides, customImageSha256, motionChanges, checked: ["appearance", "project", "thread", "prompt", "image-source", "image-name", "confirmation-copy", "action-frames"] }, null, 2) + "\n");
console.log(`Customized ${theme} Visual Context Remove full check, strict render, and visible state changes passed.`);
