import { spawnSync } from "node:child_process";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-thread-archive";
const source = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, `registry/blocks/${name}`));
const project = resolve(root, ".work/t3-thread-archive-custom");
const overrides = {
  projectName: "hyfrme-studio",
  branchName: "logo/review",
  targetThread: "Review Logo Flicker",
  threadTwo: "Motion catalog audit",
  userMessage: "Review Hyfrme Logo Flicker and hold its final frame.",
  replyLead: "I reviewed Logo Flicker in",
  replyFile: "logo-flicker.html",
  replyFilePath: "registry/blocks/logo-flicker/logo-flicker.html",
  replyTail: ". Its last frame can stay visible for 24 frames.",
  draftTitle: "Start another thread",
  draftHeadingPrefix: "What should we prototype in",
  draftComposer: "Ask Hyfrme for a follow-up",
  selectedComposer: "Ask Hyfrme to revisit this",
  archiveAge: "Archived moments ago · Created 3h ago",
  archiveAction: "Archive Hyfrme thread",
  unarchiveAction: "Bring back",
  emptyTitle: "Archive is empty",
  emptyDescription: "Archived Hyfrme threads appear here.",
  menuFrame: 20,
  archiveFrame: 45,
  archiveListFrame: 70,
  unarchiveFrame: 95,
};
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
await mkdir(resolve(project, "compositions"), { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js"]) {
  await copyFile(resolve(source, file), resolve(project, "compositions", file));
}
await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:#0a0a0a}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-thread-archive-custom-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escapeAttribute(JSON.stringify(overrides))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-thread-archive-custom-fixture']=gsap.timeline({paused:true});</script></body></html>`);
await writeFile(resolve(project, "overrides.json"), `${JSON.stringify(overrides, null, 2)}\n`);
const result = spawnSync("npx", ["hyperframes", "snapshot", project, "--at", "0.2,0.9,1.7,2.5,3.7", "--no-end", "-o", resolve(project, "snapshots")], {
  encoding: "utf8", maxBuffer: 8 * 1024 * 1024,
});
if (result.status !== 0) throw new Error(`${result.stderr}\n${result.stdout}`);
for (const [frame, words] of [
  ["frame-00-at-0.2s.png", ["hyfrme-studio", "Review Logo Flicker", "Ask Hyfrme to revisit this"]],
  ["frame-01-at-0.9s.png", ["Review Logo Flicker", "Archive Hyfrme thread"]],
  ["frame-02-at-1.7s.png", ["What should we prototype in", "hyfrme-studio", "Ask Hyfrme for a follow-up"]],
  ["frame-03-at-2.5s.png", ["Review Logo Flicker", "Bring back"]],
  ["frame-04-at-3.7s.png", ["Archive is empty"]],
]) {
  const image = resolve(project, "snapshots", frame);
  const ocr = spawnSync("tesseract", [image, "stdout"], { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 });
  if (ocr.status !== 0) throw new Error(`OCR failed for ${frame}: ${ocr.stderr}`);
  for (const word of words) {
    if (!ocr.stdout.includes(word)) throw new Error(`Custom ${frame} does not visibly show ${word}`);
  }
}
console.log(result.stdout.trim());
console.log("Custom project, thread, conversation, archive, unarchive, empty state, and timing values are visible.");
