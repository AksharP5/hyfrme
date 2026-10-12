import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-fast-service-tier";
const theme = process.env.T3_CUSTOM_THEME ?? "dark";
if (theme !== "dark" && theme !== "light") throw new Error("T3_CUSTOM_THEME must be dark or light");
const block = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, ".work/t3-fast-tier-v0042-candidate"));
const project = resolve(root, `.work/t3-fast-tier-v0042-${theme}-custom`);
const overrides = {
  theme,
  projectName: "hyfrme-studio",
  projectAvatar: "HS",
  activeBranch: "feature/custom-motion",
  threadOne: "Build Hyfrme opener",
  threadTwo: "Review Hyfrme timing",
  threadOneAge: "3h",
  threadTwoAge: "5h",
  modelName: "GPT-6-Sol+",
  reasoningLevel: "Ultra",
  serviceBefore: "Fast",
  serviceAfter: "Standard",
  heroLead: "What should we make in ",
  prompt: "Build a four-second Hyfrme logo reveal with a still final frame.",
  openFrame: 20,
  hoverFrame: 45,
  selectFrame: 95,
};
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
await mkdir(resolve(project, "compositions"), { recursive: true });
for (const file of [
  `${name}.html`, "t3-code-gsap.min.js",
  ...["dark", "light"].flatMap((appearance) => ["menu", "hover"].map((phase) => `fast-tier-v0042-${appearance}-${phase}-raster.png`)),
]) {
  await copyFile(resolve(block, file), resolve(project, "compositions", file));
}
await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:${theme === "light" ? "#fff" : "#0a0a0a"}}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-fast-tier-v0042-custom-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div id="t3-fast-tier-custom-slot" data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escapeAttribute(JSON.stringify(overrides))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-fast-tier-v0042-custom-fixture']=gsap.timeline({paused:true});</script></body></html>`);
await writeFile(resolve(project, "overrides.json"), JSON.stringify(overrides, null, 2) + "\n");
const motionChanges = {};
if (!process.env.T3_CUSTOM_REUSE) {
  const checked = spawnSync("npx", ["--yes", "hyperframes@0.8.75", "check", project, "--json"], {
    encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
  });
  const check = JSON.parse(checked.stdout.slice(checked.stdout.indexOf("{")));
  await writeFile(resolve(project, "check.json"), JSON.stringify(check, null, 2) + "\n");
  if (checked.status !== 0 || !check.ok || ["lint", "runtime", "layout", "motion", "contrast"].some((gate) => check[gate]?.findings?.length)) {
    const findings = Object.entries(check).flatMap(([gate, value]) => value?.findings?.map((finding) => `${gate}: ${finding.message}`) ?? []);
    throw new Error(`Customized ${theme} full check failed: ${findings.slice(0, 8).join("; ")}`);
  }
  const rendered = spawnSync("npx", ["--yes", "hyperframes@0.8.75", "render", project, "--format=png-sequence", "-o", resolve(project, "render"), "--strict", "--workers=2"], {
    encoding: "utf8", maxBuffer: 8 * 1024 * 1024,
  });
  if (rendered.status !== 0) throw new Error(`Customized ${theme} strict render failed: ${rendered.stderr}`);
  const frames = (await readdir(resolve(project, "render"))).filter((file) => file.endsWith(".png"));
  if (frames.length !== 120) throw new Error(`Customized ${theme} render has ${frames.length} frames`);
  for (const [label, frame, minimumChangedPixels] of [["open", 20, 1000], ["hover", 45, 100], ["select", 95, 1000]]) {
    const before = resolve(project, "render", `frame_${String(frame).padStart(6, "0")}.png`);
    const after = resolve(project, "render", `frame_${String(frame + 1).padStart(6, "0")}.png`);
    const difference = spawnSync("magick", ["compare", "-metric", "AE", before, after, "null:"], { encoding: "utf8" });
    const changed = Number(difference.stderr.match(/^[\d.]+/)?.[0]);
    if (!(changed >= minimumChangedPixels)) throw new Error(`${theme} customized ${label} did not change at frame ${frame}: ${difference.stderr}`);
    motionChanges[label] = { frame, changedPixels: changed };
  }
}
if (!process.env.T3_CUSTOM_REUSE) {
  const result = spawnSync("npx", ["--yes", "hyperframes@0.8.75", "snapshot", project, "--at", "0.3,1.8,3.4", "--no-end", "-o", resolve(project, "snapshots")], {
    encoding: "utf8", maxBuffer: 8 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(`${result.stderr}\n${result.stdout}`);
}
const composition = await readFile(resolve(project, "compositions", `${name}.html`), "utf8");
if (!composition.includes("data-composition-variables")) throw new Error("Block has no editable variables");
for (const [file, words] of [
  ["frame-00-at-0.3s.png", ["hyfrme-studio", "What should we make in hyfrme-studio?", "Build a four-second"]],
  ["frame-01-at-1.8s.png", ["Build a four-second"]],
  ["frame-02-at-3.4s.png", ["hyfrme-studio", "Build a four-second Hyfrme logo reveal"]],
]) {
  const image = resolve(project, "snapshots", file);
  const ocr = spawnSync("tesseract", [image, "stdout"], { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 });
  if (ocr.status !== 0) throw new Error(`OCR failed for ${file}: ${ocr.stderr}`);
  for (const word of words) if (!ocr.stdout.includes(word)) {
    throw new Error(`${file} lacks ${word}; OCR: ${ocr.stdout.slice(0, 500)}`);
  }
}
const controls = resolve(project, "snapshots/controls-custom-ocr.png");
const controlsCrop = spawnSync("magick", [resolve(project, "snapshots/frame-02-at-3.4s.png"), "-crop", "430x56+354+342", "+repage", "-resize", "400%", controls], { encoding: "utf8" });
if (controlsCrop.status !== 0) throw new Error(controlsCrop.stderr);
const controlsOcr = spawnSync("tesseract", [controls, "stdout"], { encoding: "utf8" });
if (controlsOcr.status !== 0 || !controlsOcr.stdout.includes("GPT-6-Sol+") || !/\bUltra\b/.test(controlsOcr.stdout)) {
  throw new Error(`Customized model or reasoning setting is missing from controls: ${controlsOcr.stdout}`);
}
const popup = resolve(project, "snapshots/frame-01-at-1.8s.png");
const popupCrop = resolve(project, "snapshots/popup-custom-ocr.png");
const crop = spawnSync("magick", [popup, "-crop", "260x330+490+30", "+repage", "-resize", "300%", popupCrop], { encoding: "utf8" });
if (crop.status !== 0) throw new Error(crop.stderr);
const popupOcr = spawnSync("tesseract", [popupCrop, "stdout"], { encoding: "utf8" });
if (popupOcr.status !== 0 || !["Reasoning", "Ultra", "Service Tier", "Standard", "Fast"].every((word) => popupOcr.stdout.includes(word))) {
  throw new Error(`Customized service-tier selection is missing from popup: ${popupOcr.stdout}`);
}
const beforeIcon = resolve(project, "snapshots/fast-before.png");
const afterIcon = resolve(project, "snapshots/fast-after.png");
for (const [frame, target] of [["frame-00-at-0.3s.png", beforeIcon], ["frame-02-at-3.4s.png", afterIcon]]) {
  const cropped = spawnSync("magick", [resolve(project, "snapshots", frame), "-crop", "100x34+480+351", "+repage", target], { encoding: "utf8" });
  if (cropped.status !== 0) throw new Error(cropped.stderr);
}
const iconChange = spawnSync("magick", ["compare", "-metric", "AE", beforeIcon, afterIcon, "null:"], { encoding: "utf8" });
const changedIconPixels = Number(iconChange.stderr.match(/^[\d.]+/)?.[0]);
if (!(changedIconPixels >= 50)) throw new Error(`Customized Fast-to-Standard lightning state did not change: ${iconChange.stderr}`);
const pixel = spawnSync("magick", [resolve(project, "snapshots/frame-00-at-0.3s.png"), "-format", "%[pixel:p{800,100}]", "info:"], { encoding: "utf8" });
if (pixel.status !== 0) throw new Error(pixel.stderr);
const match = pixel.stdout.match(/\((\d+),\s*(\d+),\s*(\d+)/);
if (!match) throw new Error(`Cannot read background pixel: ${pixel.stdout}`);
const level = Number(match[1]);
if (theme === "light" ? level < 230 : level > 40) throw new Error(`Unexpected ${theme} appearance: ${pixel.stdout}`);
await writeFile(resolve(project, "proof.json"), JSON.stringify({
  theme, snapshots: ["frame-00-at-0.3s.png", "frame-01-at-1.8s.png", "frame-02-at-3.4s.png"],
  fullCheck: true, strictRenderFrames: 120,
  motionChanges, changedIconPixels,
  checked: ["project", "hero", "prompt", "model", "reasoning-level", "service-before", "service-after", "lightning-state", "open-hover-select-timing", "appearance"],
}, null, 2) + "\n");
console.log(`Customized ${theme} full check, strict 120-frame render, and three interaction snapshots passed.`);
