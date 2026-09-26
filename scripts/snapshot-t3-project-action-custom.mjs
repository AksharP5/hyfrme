import { spawnSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-project-action";
const block = resolve(root, process.env.T3_BLOCK_DIR ?? resolve(root, "registry/blocks", name));
const work = await mkdtemp(join(tmpdir(), `${name}-custom-`));
const project = resolve(work, "project");
const compositions = resolve(project, "compositions");
const frames = resolve(work, "frames");
const renderFrames = process.env.T3_CUSTOM_FRAMES
  ? resolve(root, process.env.T3_CUSTOM_FRAMES)
  : frames;
const overrides = {
  projectName: "hyfrme-lab",
  threadOne: "Tune Hyfrme logo",
  actionName: "Audit Hyfrme",
  actionCommand: "npm run build",
  keybinding: "mod+alt+v",
  dialogFrame: 10,
  namedFrame: 30,
  commandFrame: 50,
  shortcutFrame: 70,
  savedFrame: 90,
  persistedFrame: 100,
  menuFrame: 105,
  theme: process.env.T3_CUSTOM_THEME ?? "dark",
};
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
await mkdir(compositions, { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js",
  ...["dark", "light"].flatMap((appearance) => [
    ...["dialog", "named", "command", "shortcut"].map((phase) => `project-action-v0042-${appearance}-${phase}-crop.png`),
    `project-action-v0042-${appearance}-menu-crop.png`,
  ])]) {
  await copyFile(resolve(block, file), resolve(compositions, file));
}
await writeFile(
  resolve(project, "index.html"),
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:#0a0a0a}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-project-action-custom-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escapeAttribute(JSON.stringify(overrides))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-project-action-custom-fixture']=gsap.timeline({paused:true});</script></body></html>`,
);
if (!process.env.T3_CUSTOM_FRAMES) {
  const render = spawnSync(
    "npx",
    ["--yes", "hyperframes@0.8.75", "render", project, "--format=png-sequence", "-o", frames, "--strict", "--workers=2"],
    { encoding: "utf8", maxBuffer: 16 * 1024 * 1024, env: { ...process.env, TMPDIR: resolve(root, ".work/t3-tmp") } },
  );
  if (render.status !== 0) throw new Error(`Customized render failed:\n${render.stderr.slice(-4000)}\n${render.stdout.slice(-2000)}`);
}
const readText = (frame, crop, invert = false) => {
  const source = resolve(renderFrames, `frame_${String(frame).padStart(6, "0")}.png`);
  const conversion = spawnSync("magick", [source, "-crop", crop, "+repage", "-resize", "500%", ...(invert ? ["-colorspace", "Gray", "-negate"] : []), "png:-"], { maxBuffer: 5 * 1024 * 1024 });
  if (conversion.status !== 0) throw new Error(conversion.stderr);
  const ocr = spawnSync("tesseract", ["stdin", "stdout", "--psm", "7"], { input: conversion.stdout, encoding: "utf8" });
  if (ocr.status !== 0) throw new Error(ocr.stderr);
  return ocr.stdout;
};
const named = readText(31, "260x28+418+153", true);
const earlyCommand = readText(31, "462x70+368+342");
const command = readText(51, "462x70+368+342");
const shortcut = readText(71, "465x40+365+222");
const saved = readText(91, "145x35+770+8");
const menu = readText(106, "165x42+741+42");
const projectLabel = readText(106, "100x32+275+8");
const thread = readText(106, "220x26+18+130");
for (const [found, expected, phase] of [
  [named, "Audit Hyfrme", "action name"],
  [command, "npm run build", "command"],
  [shortcut, "mod+alt+v", "shortcut"],
  [saved, "Audit Hyfrme", "saved toolbar action"],
  [menu, "Audit Hyfrme", "menu action"],
  [projectLabel, "hyfrme-lab", "project name"],
  [thread, "Hyfrme logo", "sidebar thread"],
]) {
  if (!found.includes(expected)) throw new Error(`Missing ${phase} override: ${expected}\nOCR:\n${found}`);
}
if (earlyCommand.includes("npm run build")) throw new Error("Custom command appeared before its configured frame");
const proofDir = resolve(root, `.work/${name}-v0042-${overrides.theme}-custom`);
await mkdir(proofDir, { recursive: true });
await copyFile(resolve(renderFrames, "frame_000081.png"), resolve(proofDir, "customized.png"));
await writeFile(resolve(proofDir, "proof.json"), JSON.stringify({ theme: overrides.theme, overrides,
  checks: { actionName: "Audit Hyfrme", command: "npm run build", keybinding: "mod+alt+v",
    projectName: "hyfrme-lab", threadOne: "Tune Hyfrme logo" } }, null, 2) + "\n");
console.log(`Verified customized T3 Code project-action ${overrides.theme} render. Work: ${proofDir}`);
