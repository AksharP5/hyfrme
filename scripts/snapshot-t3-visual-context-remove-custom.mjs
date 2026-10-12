import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-visual-context-remove";
const source = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, "registry/blocks/t3-visual-context-remove"));
const project = resolve(root, ".work/t3-visual-context-remove-custom");
const reuseSnapshots = process.env.T3_REUSE_SNAPSHOTS === "1";
const overrides = {
  projectName: "hyfrme-studio",
  branchName: "feature/motion",
  threadOne: "Build Hyfrme opener",
  threadTwo: "Audit Hyfrme motion",
  thread1Age: "3m",
  openQuestion: "Build a polished Hyfrme intro and hold the final frame.",
  replyLead: "I reviewed the Hyfrme timing in",
  replyFile: "intro-motion.html",
  replyTail: ". The closing frame can stay on screen longer for the final cut.",
  contextPrompt: "Use this Hyfrme Search Reveal frame as the reference.",
  imageSrc: "compositions/custom-search-reveal.png",
  imageName: "hyfrme-search-reveal.png",
  composerPlaceholder: "Ask Hyfrme to check another component",
  removeHoverFrame: 30,
  removeFrame: 65,
  persistedFrame: 95,
};
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
let snapshotOutput = "Reusing four previously rendered HyperFrames snapshots from the identical block.";
if (reuseSnapshots) {
  for (const [installed, rendered] of [
    [resolve(source, `${name}.html`), resolve(project, "compositions", `${name}.html`)],
    [resolve(root, "public/previews/search-reveal/thumbnail.png"), resolve(project, "compositions/custom-search-reveal.png")],
  ]) {
    if (!(await readFile(installed)).equals(await readFile(rendered))) throw new Error(`Rendered custom proof uses a different asset: ${rendered}`);
  }
  if (JSON.stringify(JSON.parse(await readFile(resolve(project, "overrides.json"), "utf8"))) !== JSON.stringify(overrides)) {
    throw new Error("Rendered custom proof uses different variable overrides");
  }
} else {
  await mkdir(resolve(project, "compositions"), { recursive: true });
  for (const file of [`${name}.html`, "t3-code-gsap.min.js", "t3-visual-context-logo-enter.png"]) {
    await copyFile(resolve(source, file), resolve(project, "compositions", file));
  }
  await copyFile(resolve(root, "public/previews/search-reveal/thumbnail.png"), resolve(project, "compositions/custom-search-reveal.png"));
  await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:#0a0a0a}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-visual-context-remove-custom-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escapeAttribute(JSON.stringify(overrides))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-visual-context-remove-custom-fixture']=gsap.timeline({paused:true});</script></body></html>`);
  await writeFile(resolve(project, "overrides.json"), `${JSON.stringify(overrides, null, 2)}\n`);
  await rm(resolve(project, "snapshots"), { recursive: true, force: true });
  const result = spawnSync("npx", ["hyperframes", "snapshot", project, "--at", "0.2,1.2,2.4,3.3", "--no-end", "-o", resolve(project, "snapshots")], {
    encoding: "utf8", maxBuffer: 8 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(`${result.stderr}\n${result.stdout}`);
  snapshotOutput = result.stdout.trim();
}
const composition = await readFile(resolve(project, "compositions", `${name}.html`), "utf8");
if (!composition.includes('data-composition-variables')) throw new Error("Installed block has no variables");
const tile = (file) => {
  const result = spawnSync("ffmpeg", ["-v", "error", "-i", file, "-vf", "crop=62:62:362:406", "-pix_fmt", "rgb24", "-f", "rawvideo", "-"], {
    maxBuffer: 62 * 62 * 3 + 1024,
  });
  if (result.status !== 0) throw new Error(`Cannot inspect image tile in ${file}: ${result.stderr}`);
  return result.stdout;
};
const customizedTile = tile(resolve(project, "snapshots/frame-00-at-0.2s.png"));
const sourceTile = tile(resolve(root, ".work/t3-visual-context-remove-reference/frame-0000.png"));
const removedTile = tile(resolve(project, "snapshots/frame-02-at-2.4s.png"));
if (customizedTile.equals(sourceTile) || customizedTile.equals(removedTile)) {
  throw new Error("Custom image source or attachment removal is not visible in the HyperFrames snapshots");
}
const purplePixels = (pixels) => {
  let count = 0;
  for (let index = 0; index < pixels.length; index += 3) {
    if (pixels[index] > 100 && pixels[index + 1] < 100 && pixels[index + 2] > 100) count++;
  }
  return count;
};
if (purplePixels(customizedTile) < 100 || purplePixels(removedTile) > 10) {
  throw new Error("Custom Search Reveal pixels must appear before removal and disappear afterward");
}
for (const [frame, words] of [
  ["frame-00-at-0.2s.png", ["Audit Hyfrme motion", "hyfrme-studio", "Use this Hyfrme Search Reveal frame"]],
  ["frame-01-at-1.2s.png", ["Build Hyfrme opener", "Search Reveal frame as the reference"]],
  ["frame-02-at-2.4s.png", ["Audit Hyfrme motion", "Build Hyfrme opener", "Use this Hyfrme Search Reveal frame"]],
  ["frame-03-at-3.3s.png", ["Audit Hyfrme motion", "Use this Hyfrme Search Reveal frame"]],
]) {
  const image = resolve(project, "snapshots", frame);
  const ocr = spawnSync("tesseract", [image, "stdout"], { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 });
  if (ocr.status !== 0) throw new Error(`OCR failed for ${frame}: ${ocr.stderr}`);
  for (const word of words) {
    if (!ocr.stdout.includes(word)) throw new Error(`Custom ${frame} does not visibly show ${word}`);
  }
}
const parityPath = resolve(root, `parity/${name}.json`);
const parity = JSON.parse(await readFile(parityPath, "utf8"));
parity.checks.customVariables = "nested data-variable-values; four HyperFrames snapshots and OCR assertions passed";
parity.artifacts.customProof = ".work/t3-visual-context-remove-custom/snapshots";
await writeFile(parityPath, `${JSON.stringify(parity, null, 2)}\n`);
console.log(snapshotOutput);
console.log("Custom project, thread, prompt, image, and timing overrides are visible in four captured beats.");
