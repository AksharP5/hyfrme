import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-thread-mark-unread";
const source = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, "registry/blocks/t3-thread-mark-unread"));
const project = resolve(root, ".work/t3-thread-mark-unread-custom");
const overrides = {
  projectName: "hyfrme-studio",
  branchName: "feature/motion",
  activeBranch: "feature/motion",
  firstThread: "Build Hyfrme opener",
  targetThread: "Audit Hyfrme motion",
  targetAge: "3m",
  firstQuestion: "Build a polished Hyfrme intro and hold the final frame.",
  firstReplyLead: "I reviewed the Hyfrme timing in",
  firstReplyFile: "intro-motion.html",
  firstReplyTail: ". The closing frame can stay on screen longer for the final cut.",
  composerPlaceholder: "Ask Hyfrme to check another component",
  pinAction: "Pin this thread",
  unreadAction: "Mark for review",
  doneStatus: "Reviewed",
  snoozeAction: "Save for later",
  menuFrame: 30,
  markUnreadFrame: 60,
  persistedFrame: 90,
};
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
await mkdir(resolve(project, "compositions"), { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js"]) {
  await copyFile(resolve(source, file), resolve(project, "compositions", file));
}
await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:#0a0a0a}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-thread-mark-unread-custom-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escapeAttribute(JSON.stringify(overrides))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-thread-mark-unread-custom-fixture']=gsap.timeline({paused:true});</script></body></html>`);
await writeFile(resolve(project, "overrides.json"), `${JSON.stringify(overrides, null, 2)}\n`);
const result = spawnSync("npx", ["hyperframes", "snapshot", project, "--at", "0.2,1.2,2.3,3.3", "--no-end", "-o", resolve(project, "snapshots")], {
  encoding: "utf8", maxBuffer: 8 * 1024 * 1024,
});
if (result.status !== 0) throw new Error(`${result.stderr}\n${result.stdout}`);
const composition = await readFile(resolve(project, "compositions", `${name}.html`), "utf8");
if (!composition.includes('data-composition-variables')) throw new Error("Installed block has no variables");
for (const [frame, words] of [
  ["frame-00-at-0.2s.png", ["Audit Hyfrme motion", "hyfrme-studio", "Build a polished Hyfrme intro"]],
  ["frame-01-at-1.2s.png", ["Build Hyfrme opener", "Mark for review", "Save for later"]],
  ["frame-02-at-2.3s.png", ["Audit Hyfrme motion", "Build Hyfrme opener", "Reviewed"]],
  ["frame-03-at-3.3s.png", ["Audit Hyfrme motion", "Reviewed", "Ask Hyfrme to check another component"]],
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
parity.artifacts.customProof = ".work/t3-thread-mark-unread-custom/snapshots";
await writeFile(parityPath, `${JSON.stringify(parity, null, 2)}\n`);
console.log(result.stdout.trim());
console.log("Custom project, thread, copy, menu, and timing overrides are visible in four captured beats.");
