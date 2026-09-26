import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-thread-snooze-undo";
const source = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, `registry/blocks/${name}`));
const project = resolve(root, ".work/t3-thread-snooze-undo-custom");
const overrides = {
  projectName: "hyfrme-studio",
  branchName: "feature/motion",
  activeBranch: "feature/motion",
  firstThread: "Build Hyfrme opener",
  snoozeThread: "Review Hyfrme transitions",
  firstAge: "2h",
  snoozeAge: "4m",
  snoozedRemaining: "2h",
  settledAge: "6h",
  question: "Which Hyfrme component should wait for a closer review?",
  reply: "Logo Enter can wait until the next frame-by-frame comparison.",
  composerPlaceholder: "Ask Hyfrme to check another component",
  preset2: "In 3 hours (9:30 AM)",
  toastTitle: "Snoozed until 9:30 AM",
  toastUndo: "Restore",
  snoozedShelfCount: "Snoozed reviews (1)",
  bannerTitle: "This Hyfrme review is snoozed",
  bannerDescription: "Restore it to continue the Hyfrme review.",
  bannerWake: "Wake review now",
  menuFrame: 12,
  submenuFrame: 30,
  snoozedFrame: 58,
  undoFrame: 80,
  persistFrame: 105,
};
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
await mkdir(resolve(project, "compositions"), { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js"]) {
  await copyFile(resolve(source, file), resolve(project, "compositions", file));
}
await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:#0a0a0a}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-thread-snooze-undo-custom-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escapeAttribute(JSON.stringify(overrides))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-thread-snooze-undo-custom-fixture']=gsap.timeline({paused:true});</script></body></html>`);
await writeFile(resolve(project, "overrides.json"), `${JSON.stringify(overrides, null, 2)}\n`);
const result = spawnSync("npx", ["hyperframes", "snapshot", project, "--at", "0.1,0.6,1.2,2.1,2.8,3.6", "--no-end", "-o", resolve(project, "snapshots")], {
  encoding: "utf8", maxBuffer: 8 * 1024 * 1024,
});
if (result.status !== 0) throw new Error(`${result.stderr}\n${result.stdout}`);
const composition = await readFile(resolve(project, "compositions", `${name}.html`), "utf8");
if (!composition.includes('data-composition-variables')) throw new Error("Installed block has no variables");
for (const [frame, words] of [
  ["frame-00-at-0.1s.png", ["Review Hyfrme transitions", "hyfrme-studio"]],
  ["frame-02-at-1.2s.png", ["Review Hyfrme transitions", "In 3 hours (9:30 AM)"]],
  ["frame-03-at-2.1s.png", ["Snoozed until 9:30 AM", "Snoozed reviews"]],
  ["frame-04-at-2.8s.png", ["Review Hyfrme transitions", "Build Hyfrme opener"]],
  ["frame-05-at-3.6s.png", ["Review Hyfrme transitions", "Build Hyfrme opener"]],
]) {
  const image = resolve(project, "snapshots", frame);
  const ocr = spawnSync("tesseract", [image, "stdout"], { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 });
  if (ocr.status !== 0) throw new Error(`OCR failed for ${frame}: ${ocr.stderr}`);
  for (const word of words) {
    if (!ocr.stdout.toLowerCase().includes(word.toLowerCase())) throw new Error(`Custom ${frame} does not visibly show ${word}`);
  }
}
for (const [frame, filter, word, pageSegmentation] of [
  ["frame-03-at-2.1s.png", "crop=110:43:1070:111,scale=880:344:flags=lanczos", "Restore", "7"],
  ["frame-03-at-2.1s.png", "crop=360:46:398:413,scale=1440:184:flags=lanczos", "This Hyfrme review is snoozed", "6"],
]) {
  const crop = resolve(project, `crop-${frame}`);
  const render = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", resolve(project, "snapshots", frame), "-vf", filter, "-frames:v", "1", crop], { encoding: "utf8" });
  if (render.status !== 0) throw new Error(`Could not inspect ${word}: ${render.stderr}`);
  const ocr = spawnSync("tesseract", [crop, "stdout", "--psm", pageSegmentation], { encoding: "utf8" });
  if (ocr.status !== 0 || !ocr.stdout.includes(word)) throw new Error(`Custom ${frame} does not visibly show ${word}`);
}
console.log(result.stdout.trim());
console.log("Custom project, thread, conversation, preset, toast Undo, banner, and timing overrides are visible across all six beats.");
