import { spawnSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-project-action-run";
const block = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, "registry/blocks", name));
const fixture = JSON.parse(await readFile(resolve(root, "assets/t3-code/v0.0.35/project-action-run-fixture.json"), "utf8"));
const work = await mkdtemp(join(tmpdir(), `${name}-custom-`));
const project = resolve(work, "project");
const compositions = resolve(project, "compositions");
const frames = resolve(work, "frames");
const overrides = {
  projectName: "hyfrme-lab",
  selectedThread: "Tune Hyfrme logo",
  actionName: "Audit Hyfrme",
  terminalPrompt: "hyfrme-lab",
  command: "npm run build",
  output: "> build\n> vite build\nBuild complete",
  runFrame: 12,
  resultFrame: 40,
};
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
await mkdir(compositions, { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js", ...Object.keys(fixture.assetSha256)]) {
  await copyFile(resolve(block, file), resolve(compositions, file));
}
await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:#0a0a0a}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-project-action-run-custom-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escapeAttribute(JSON.stringify(overrides))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-project-action-run-custom-fixture']=gsap.timeline({paused:true});</script></body></html>`);
const render = spawnSync("npx", ["hyperframes", "render", project, "--format=png-sequence", "-o", frames, "--strict", "--workers=2"], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
if (render.status !== 0) throw new Error(`Customized render failed:\n${render.stderr.slice(-4000)}\n${render.stdout.slice(-2000)}`);

const readText = (frame, crop, psm = 6) => {
  const source = resolve(frames, `frame_${String(frame).padStart(6, "0")}.png`);
  const conversion = spawnSync("magick", [source, "-crop", crop, "+repage", "-resize", "350%", "png:-"], { maxBuffer: 12 * 1024 * 1024 });
  if (conversion.status !== 0) throw new Error(conversion.stderr);
  const ocr = spawnSync("tesseract", ["stdin", "stdout", "--psm", String(psm)], { input: conversion.stdout, encoding: "utf8" });
  if (ocr.status !== 0) throw new Error(ocr.stderr);
  return ocr.stdout;
};
const before = readText(7, "300x45+275+0");
const action = readText(7, "145x35+770+8");
const early = readText(22, "790x270+256+380");
const earlyOutput = readText(45, "790x270+256+380");
const output = readText(65, "790x270+256+380");
for (const [found, expected, label] of [
  [before, "hyfrme-lab", "project"],
  [before, "Tune Hyfrme logo", "thread"],
  [action, "Audit Hyfrme", "saved action"],
  [early, "npm run build", "early command"],
  [earlyOutput, "vite build", "early output beat"],
  [output, "vite build", "output"],
  [output, "Build complete", "completion"],
]) {
  if (!found.toLowerCase().includes(expected.toLowerCase())) throw new Error(`Missing ${label} override: ${expected}\nOCR:\n${found}`);
}
const previews = resolve(root, "public/previews", name);
await mkdir(previews, { recursive: true });
await copyFile(resolve(frames, "frame_000065.png"), resolve(previews, "customized.png"));
console.log(`Saved customized T3 Code project-action-run snapshot. Work: ${work}`);
