import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-new-worktree-choice";
const theme = process.env.T3_CUSTOM_THEME ?? "dark";
if (theme !== "dark" && theme !== "light") throw new Error("T3_CUSTOM_THEME must be dark or light");
const block = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, ".work/t3-new-worktree-choice-v0042-candidate"));
const project = resolve(root, `.work/t3-new-worktree-choice-v0042-${theme}-custom`);
const overrides = {
  theme,
  projectName: "hyfrme-lab",
  projectAvatar: "HL",
  activeBranch: "feature/frame-check",
  threadOne: "Build a Hyfrme opener",
  threadTwo: "Review Hyfrme timing",
  threadOneAge: "3h",
  threadTwoAge: "5h",
  modelName: "GPT-6-Sol",
  reasoningLevel: "High",
  heroLead: "What should we make in ",
  prompt: "Build a four-second Hyfrme logo reveal with a still final frame.",
  workspaceBefore: "Project checkout",
  workspaceAfter: "Fresh worktree",
  previousWorktree: "Previous worktree (frame-check)",
  baseBranch: "origin/feature/frame-check",
  openFrame: 20,
  hoverFrame: 45,
  selectFrame: 95,
};
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
await mkdir(resolve(project, "compositions"), { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js", ...["dark", "light"].flatMap((appearance) => [
  ...["menu", "hover"].map((phase) => `worktree-choice-v0042-${appearance}-${phase}-crop.png`),
  ...Array.from({ length: 5 }, (_, index) => `worktree-choice-v0042-${appearance}-select-${index}-crop.png`),
])]) {
  await copyFile(resolve(block, file), resolve(project, "compositions", file));
}
await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:${theme === "light" ? "#fff" : "#0a0a0a"}}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-new-worktree-choice-v0042-custom-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div id="t3-new-worktree-choice-custom-slot" data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escapeAttribute(JSON.stringify(overrides))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-new-worktree-choice-v0042-custom-fixture']=gsap.timeline({paused:true});</script></body></html>`);
await writeFile(resolve(project, "overrides.json"), JSON.stringify(overrides, null, 2) + "\n");
if (!process.env.T3_CUSTOM_REUSE) {
  const checked = spawnSync("npx", ["--yes", "hyperframes@0.8.75", "check", project, "--json"], {
    encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
  });
  const check = JSON.parse(checked.stdout.slice(checked.stdout.indexOf("{")));
  await writeFile(resolve(project, "check.json"), JSON.stringify(check, null, 2) + "\n");
  if (checked.status !== 0 || !check.ok) {
    const findings = Object.entries(check).flatMap(([gate, value]) => value?.findings?.map((finding) => `${gate}: ${finding.message}`) ?? []);
    throw new Error(`Customized ${theme} full check failed: ${findings.slice(0, 8).join("; ")}`);
  }
  const rendered = spawnSync("npx", ["--yes", "hyperframes@0.8.75", "render", project, "--format=png-sequence", "-o", resolve(project, "render"), "--strict", "--workers=2"], {
    encoding: "utf8", maxBuffer: 8 * 1024 * 1024,
  });
  if (rendered.status !== 0) throw new Error(`Customized ${theme} strict render failed: ${rendered.stderr}`);
  const frames = (await readdir(resolve(project, "render"))).filter((file) => file.endsWith(".png"));
  if (frames.length !== 120) throw new Error(`Customized ${theme} render has ${frames.length} frames`);
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
  ["frame-00-at-0.3s.png", ["hyfrme-lab", "Build a four-second"]],
  ["frame-01-at-1.8s.png", ["Build a four-second"]],
  ["frame-02-at-3.4s.png", ["hyfrme-lab", "Build a four-second Hyfrme logo reveal"]],
]) {
  const image = resolve(project, "snapshots", file);
  const ocr = spawnSync("tesseract", [image, "stdout"], { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 });
  if (ocr.status !== 0) throw new Error(`OCR failed for ${file}: ${ocr.stderr}`);
  for (const word of words) if (!ocr.stdout.includes(word)) {
    throw new Error(`${file} lacks ${word}; OCR: ${ocr.stdout.slice(0, 500)}`);
  }
}
for (const [file, crop, words] of [
  ["frame-00-at-0.3s.png", "425x75+355+350", ["GPT-6-Sol", "High", "Project checkout"]],
  ["frame-01-at-1.8s.png", "245x165+360+425", ["Project checkout", "Fresh worktree", "frame-check"]],
  ["frame-02-at-3.4s.png", "220x60+360+395", ["Fresh worktree"]],
  ["frame-02-at-3.4s.png", "320x65+850+390", ["feature/frame-check"]],
]) {
  const image = resolve(project, "snapshots", file);
  const region = resolve(project, "snapshots", file.replace(".png", `-${crop.replaceAll(/[+x]/g, "-")}-crop.png`));
  const cut = spawnSync("magick", [image, "-crop", crop, "+repage", "-resize", "400%", region], { encoding: "utf8" });
  if (cut.status !== 0) throw new Error(cut.stderr);
  const ocr = spawnSync("tesseract", [region, "stdout"], { encoding: "utf8" });
  if (ocr.status !== 0 || words.some((word) => !ocr.stdout.includes(word))) {
    throw new Error(`Customized workspace content missing from ${file}: ${ocr.stdout}`);
  }
}
const pixel = spawnSync("magick", [resolve(project, "snapshots/frame-00-at-0.3s.png"), "-format", "%[pixel:p{800,100}]", "info:"], { encoding: "utf8" });
if (pixel.status !== 0) throw new Error(pixel.stderr);
const match = pixel.stdout.match(/\((\d+),\s*(\d+),\s*(\d+)/);
if (!match) throw new Error(`Cannot read background pixel: ${pixel.stdout}`);
const level = Number(match[1]);
if (theme === "light" ? level < 230 : level > 40) throw new Error(`Unexpected ${theme} appearance: ${pixel.stdout}`);
await writeFile(resolve(project, "proof.json"), JSON.stringify({
  theme, snapshots: ["frame-00-at-0.3s.png", "frame-01-at-1.8s.png", "frame-02-at-3.4s.png"],
  fullCheck: true, strictRenderFrames: 120,
  checked: ["project", "hero", "prompt", "model", "reasoning", "workspace-before-and-after", "previous-worktree", "base-branch", "open-hover-select-timing", "appearance"],
}, null, 2) + "\n");
console.log(`Customized ${theme} full check, strict 120-frame render, and three interaction snapshots passed.`);
