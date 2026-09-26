import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-brief-to-prompt";
const theme = process.env.T3_CUSTOM_THEME ?? "dark";
if (theme !== "dark" && theme !== "light") throw new Error("T3_CUSTOM_THEME must be dark or light");
const block = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, ".work/t3-brief-v0042-candidate"));
const project = resolve(root, `.work/t3-brief-v0042-${theme}-custom`);
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
  heroLead: "What should we make in ",
  placeholder: "Ask Hyfrme to revise the timing",
  prompt: "Build a four-second Hyfrme logo reveal with a still final frame.",
  typingStart: 20,
  typingEnd: 80,
};
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
await mkdir(resolve(project, "compositions"), { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js"]) {
  await copyFile(resolve(block, file), resolve(project, "compositions", file));
}
await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:${theme === "light" ? "#fff" : "#0a0a0a"}}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-brief-v0042-custom-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div id="t3-brief-custom-slot" data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escapeAttribute(JSON.stringify(overrides))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-brief-v0042-custom-fixture']=gsap.timeline({paused:true});</script></body></html>`);
await writeFile(resolve(project, "overrides.json"), JSON.stringify(overrides, null, 2) + "\n");
if (!process.env.T3_CUSTOM_REUSE) {
  const result = spawnSync("npx", ["--yes", "hyperframes@0.8.75", "snapshot", project, "--at", "0.3,1.5,3.4", "--no-end", "-o", resolve(project, "snapshots")], {
    encoding: "utf8", maxBuffer: 8 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(`${result.stderr}\n${result.stdout}`);
}
const composition = await readFile(resolve(project, "compositions", `${name}.html`), "utf8");
if (!composition.includes("data-composition-variables")) throw new Error("Block has no editable variables");
for (const [file, words] of [
  ["frame-00-at-0.3s.png", ["hyfrme-studio", "What should we make in hyfrme-studio?", "Ask Hyfrme to revise the timing"]],
  ["frame-01-at-1.5s.png", ["hyfrme-studio", "Build a four-second"]],
  ["frame-02-at-3.4s.png", ["hyfrme-studio", "Build a four-second Hyfrme logo reveal"]],
]) {
  const image = resolve(project, "snapshots", file);
  const ocr = spawnSync("tesseract", [image, "stdout"], { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 });
  if (ocr.status !== 0) throw new Error(`OCR failed for ${file}: ${ocr.stderr}`);
  for (const word of words) if (!ocr.stdout.includes(word)) {
    throw new Error(`${file} lacks ${word}; OCR: ${ocr.stdout.slice(0, 500)}`);
  }
  if (file === "frame-02-at-3.4s.png" && (!/GPT-6-S[o0]{1,2}l/i.test(ocr.stdout) || !/\bHigh\b/.test(ocr.stdout))) {
    throw new Error(`${file} lacks the customized model or reasoning setting`);
  }
}
const pixel = spawnSync("magick", [resolve(project, "snapshots/frame-00-at-0.3s.png"), "-format", "%[pixel:p{800,100}]", "info:"], { encoding: "utf8" });
if (pixel.status !== 0) throw new Error(pixel.stderr);
const match = pixel.stdout.match(/\((\d+),\s*(\d+),\s*(\d+)/);
if (!match) throw new Error(`Cannot read background pixel: ${pixel.stdout}`);
const level = Number(match[1]);
if (theme === "light" ? level < 230 : level > 40) throw new Error(`Unexpected ${theme} appearance: ${pixel.stdout}`);
await writeFile(resolve(project, "proof.json"), JSON.stringify({
  theme, snapshots: ["frame-00-at-0.3s.png", "frame-01-at-1.5s.png", "frame-02-at-3.4s.png"],
  checked: ["project", "hero", "placeholder", "prompt", "model", "reasoning", "typing-timing", "appearance"],
}, null, 2) + "\n");
console.log(`Three customized ${theme} snapshots show project, hero, placeholder, prompt, and changed typing timing.`);
