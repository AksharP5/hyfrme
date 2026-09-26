import { spawnSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-source-file-open";
const block = resolve(root, "registry/blocks", name);
const work = await mkdtemp(join(tmpdir(), `${name}-custom-`));
const project = resolve(work, "project");
const compositions = resolve(project, "compositions");
const frames = resolve(work, "frames");
const overrides = {
  projectName: "hyfrme-lab",
  selectedThread: "Tune Hyfrme logo",
  folderThree: "logo-motion",
  fileName: "intro.html",
  replyFile: "intro.html",
  componentName: "logo-motion",
  logoClass: "hyfrme-mark",
  sourceDuration: 5.2,
  filesFrame: 10,
  expandFrame: 25,
  openFrame: 55,
};
await mkdir(compositions, { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js"]) {
  await copyFile(resolve(block, file), resolve(compositions, file));
}
await writeFile(
  resolve(project, "index.html"),
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:#0a0a0a}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-source-file-open-custom-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${JSON.stringify(overrides)}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-source-file-open-custom-fixture']=gsap.timeline({paused:true});</script></body></html>`,
);
const result = spawnSync(
  "npx",
  ["hyperframes", "render", project, "--format=png-sequence", "-o", frames, "--strict", "--workers=2"],
  { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
);
if (result.status !== 0) {
  throw new Error(`Customized HyperFrames render failed:\n${result.stderr.slice(-4000)}\n${result.stdout.slice(-2000)}`);
}
const readRenderedText = (frame, crop) => {
  const image = resolve(work, `ocr-${frame}.png`);
  const source = resolve(frames, `frame_${String(frame).padStart(6, "0")}.png`);
  const conversion = spawnSync("magick", [source, ...(crop ? ["-crop", crop, "+repage"] : []), "-resize", "240%", image], { encoding: "utf8" });
  if (conversion.status !== 0) throw new Error(conversion.stderr);
  const ocr = spawnSync("tesseract", [image, "stdout"], { encoding: "utf8" });
  if (ocr.status !== 0) throw new Error(ocr.stderr);
  return ocr.stdout;
};
const expanded = readRenderedText(41, "540x659+660+0");
const opened = readRenderedText(61, "540x659+660+0");
const final = readRenderedText(91);
for (const [text, expected, phase] of [
  [expanded, "intro.html", "expanded source tree"],
  [opened, 'data-duration="5.2"', "early source open"],
  [opened, "logo-motion", "source folder"],
  [final, "hyfrme-lab", "project name"],
  [final, "Tune Hyfrme logo", "thread title"],
]) {
  if (!text.includes(expected)) throw new Error(`Missing ${phase} custom override: ${expected}`);
}
if (expanded.includes('data-duration="5.2"')) throw new Error("Source file opened before the custom open frame");
const previews = resolve(root, "public/previews", name);
await mkdir(previews, { recursive: true });
await copyFile(resolve(frames, "frame_000091.png"), resolve(previews, "customized.png"));
console.log(`Saved customized T3 Code source-file snapshot. Work: ${work}`);
