import { spawnSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-diff-review";
const block = resolve(root, process.env.T3_BLOCK_OUTPUT ?? ".work/t3-diff-review-candidate");
const work = await mkdtemp(join(tmpdir(), `${name}-custom-`));
const project = resolve(work, "project");
const compositions = resolve(project, "compositions");
const frames = resolve(work, "frames");
const overrides = {
  projectName: "hyfrme-lab",
  selectedThread: "Refine logo intro",
  diffScope: "Staged changes",
  fileName: "brand-intro.html",
  logoText: "Hyfrme Studio",
  captionText: "Motion System",
  additions: "+8",
  deletions: "-2",
  chooserFrame: 10,
  stackedFrame: 30,
  splitFrame: 60,
};
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
await mkdir(compositions, { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js", `${name}-stacked.png`, `${name}-split.png`]) {
  await copyFile(resolve(block, file), resolve(compositions, file));
}
await writeFile(resolve(project, "index.html"),
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:#0a0a0a}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-diff-review-custom-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escapeAttribute(JSON.stringify(overrides))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-diff-review-custom-fixture']=gsap.timeline({paused:true});</script></body></html>`);
const render = spawnSync("npx", ["hyperframes", "render", project, "--format=png-sequence", "-o", frames, "--strict", "--workers=2"],
  { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
if (render.status !== 0) throw new Error(`Customized render failed:\n${render.stderr.slice(-4000)}\n${render.stdout.slice(-2000)}`);
const readText = (frame, crop) => {
  const source = resolve(frames, `frame_${String(frame).padStart(6, "0")}.png`);
  const conversion = spawnSync("magick", [source, "-crop", crop, "+repage", "-resize", "500%", "png:-"], { maxBuffer: 6 * 1024 * 1024 });
  if (conversion.status !== 0) throw new Error(conversion.stderr);
  const ocr = spawnSync("tesseract", ["stdin", "stdout", "--psm", "6"], { input: conversion.stdout, encoding: "utf8" });
  if (ocr.status !== 0) throw new Error(ocr.stderr);
  return ocr.stdout;
};
const projectLabel = readText(80, "130x30+270+9");
const thread = readText(80, "220x30+15+164");
const scope = readText(80, "140x32+663+49");
const file = readText(80, "250x31+706+91");
const stackedCode = readText(40, "470x140+700+145");
const splitCode = readText(80, "490x180+700+145");
const counts = readText(80, "80x29+960+53");
for (const [found, expected, label] of [
  [projectLabel, "hyfrme-lab", "project"],
  [thread, "Refine logo intro", "thread"],
  [scope, "Staged changes", "diff scope"],
  [file, "brand-intro.html", "changed file"],
  [stackedCode, "Hyfrme Studio", "stacked code"],
  [stackedCode, "Motion System", "stacked caption"],
  [splitCode, "Motion System", "split code"],
  [counts, "+8", "additions"],
  [counts, "-2", "deletions"],
]) {
  if (!found.replaceAll(/\s+/g, " ").includes(expected)) throw new Error(`Missing ${label} override: ${expected}\nOCR:\n${found}`);
}
const preview = resolve(root, "public/previews", name);
await mkdir(preview, { recursive: true });
for (const [phase, frame] of [["chooser", 20], ["stacked", 40], ["split", 80]]) {
  await copyFile(resolve(frames, `frame_${String(frame).padStart(6, "0")}.png`), resolve(preview, `custom-${phase}.png`));
}
console.log(`Customized T3 Diff Review source, counts, and timing visible. Work: ${work}`);
