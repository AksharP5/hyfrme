import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-thread-snooze";
const source = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, `registry/blocks/${name}`));
const project = resolve(root, ".work/t3-thread-snooze-custom");
const overrides = {
  projectName: "hyfrme-studio",
  branchName: "feature/motion",
  activeBranch: "feature/motion",
  firstThread: "Build Hyfrme opener",
  snoozeThread: "Review Hyfrme transitions",
  snoozeAge: "4m",
  question: "Which Hyfrme component should wait for a closer review?",
  reply: "Logo Enter can wait until the next frame-by-frame comparison.",
  composerPlaceholder: "Ask Hyfrme to check another component",
  preset2: "In 3 hours (9:30 AM)",
  toastTitle: "Snoozed until 9:30 AM",
  toastUndo: "Restore",
  bannerTitle: "This Hyfrme review is snoozed",
  bannerDescription: "Wake it to continue the Hyfrme review.",
  bannerWake: "Continue now",
  wakeAction: "Wake review",
  snoozedShelf: "Snoozed reviews",
  wakeCountdown: "2h",
  menuFrame: 12,
  submenuFrame: 30,
  snoozedFrame: 58,
  expandedFrame: 82,
  wakeMenuFrame: 98,
};
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
await mkdir(resolve(project, "compositions"), { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js"]) {
  await copyFile(resolve(source, file), resolve(project, "compositions", file));
}
await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:#0a0a0a}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-thread-snooze-custom-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escapeAttribute(JSON.stringify(overrides))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-thread-snooze-custom-fixture']=gsap.timeline({paused:true});</script></body></html>`);
await writeFile(resolve(project, "overrides.json"), `${JSON.stringify(overrides, null, 2)}\n`);
const result = spawnSync("npx", ["hyperframes", "snapshot", project, "--at", "0.2,0.8,1.5,2.2,2.9,3.4", "--no-end", "-o", resolve(project, "snapshots")], {
  encoding: "utf8", maxBuffer: 8 * 1024 * 1024,
});
if (result.status !== 0) throw new Error(`${result.stderr}\n${result.stdout}`);
const composition = await readFile(resolve(project, "compositions", `${name}.html`), "utf8");
if (!composition.includes('data-composition-variables')) throw new Error("Installed block has no variables");
for (const [frame, words] of [
  ["frame-00-at-0.2s.png", ["Build Hyfrme opener", "hyfrme-studio"]],
  ["frame-02-at-1.5s.png", ["Review Hyfrme transitions", "In 3 hours (9:30 AM)"]],
  ["frame-03-at-2.2s.png", ["Snoozed until 9:30 AM"]],
  ["frame-04-at-2.9s.png", ["Snoozed reviews", "Review Hyfrme transitions"]],
  ["frame-05-at-3.4s.png", ["Wake review"]],
]) {
  const image = resolve(project, "snapshots", frame);
  const ocr = spawnSync("tesseract", [image, "stdout"], { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 });
  if (ocr.status !== 0) throw new Error(`OCR failed for ${frame}: ${ocr.stderr}`);
  for (const word of words) {
    if (!ocr.stdout.toLowerCase().includes(word.toLowerCase())) throw new Error(`Custom ${frame} does not visibly show ${word}`);
  }
}
for (const [frame, filter, word] of [
  ["frame-03-at-2.2s.png", "crop=80:40:1085:115,scale=640:320:flags=neighbor", "Restore"],
  ["frame-05-at-3.4s.png", "crop=100:35:980:422,scale=800:280:flags=neighbor", "Continue now"],
]) {
  const crop = resolve(project, `crop-${frame}`);
  const render = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", resolve(project, "snapshots", frame), "-vf", filter, "-frames:v", "1", crop], { encoding: "utf8" });
  if (render.status !== 0) throw new Error(`Could not inspect ${word}: ${render.stderr}`);
  const ocr = spawnSync("tesseract", [crop, "stdout", "--psm", "7"], { encoding: "utf8" });
  if (ocr.status !== 0 || !ocr.stdout.includes(word)) throw new Error(`Custom ${frame} does not visibly show ${word}`);
}
console.log(result.stdout.trim());
console.log("Custom project, thread, preset, toast, banner, Wake action, and timing overrides are visible across five captured beats.");
