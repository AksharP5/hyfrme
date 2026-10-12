import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-thread-pin";
const source = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, `registry/blocks/${name}`));
const project = resolve(root, ".work/t3-thread-pin-custom");
const overrides = {
  projectName: "hyfrme-studio",
  branchName: "feature/motion",
  activeBranch: "feature/motion",
  firstThread: "Build Hyfrme opener",
  pinThread: "Audit Hyfrme motion",
  pinAge: "3m",
  pinQuestion: "Which Hyfrme component needs a closer frame review?",
  pinReply: "Logo Enter needs a fresh frame-by-frame comparison before release.",
  composerPlaceholder: "Ask Hyfrme to check another component",
  pinAction: "Pin this thread",
  unpinAction: "Remove pin",
  snoozeAction: "Save for later",
  selectFrame: 12,
  menuFrame: 30,
  pinFrame: 60,
  confirmFrame: 90,
};
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
await mkdir(resolve(project, "compositions"), { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js"]) {
  await copyFile(resolve(source, file), resolve(project, "compositions", file));
}
await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:#0a0a0a}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-thread-pin-custom-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escapeAttribute(JSON.stringify(overrides))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-thread-pin-custom-fixture']=gsap.timeline({paused:true});</script></body></html>`);
await writeFile(resolve(project, "overrides.json"), `${JSON.stringify(overrides, null, 2)}\n`);
const result = spawnSync("npx", ["hyperframes", "snapshot", project, "--at", "0.2,0.7,1.2,2.3,3.3", "--no-end", "-o", resolve(project, "snapshots")], {
  encoding: "utf8", maxBuffer: 8 * 1024 * 1024,
});
if (result.status !== 0) throw new Error(`${result.stderr}\n${result.stdout}`);
const composition = await readFile(resolve(project, "compositions", `${name}.html`), "utf8");
if (!composition.includes('data-composition-variables')) throw new Error("Installed block has no variables");
for (const [frame, words] of [
  ["frame-00-at-0.2s.png", ["Build Hyfrme opener", "hyfrme-studio"]],
  ["frame-02-at-1.2s.png", ["Audit Hyfrme motion", "Pin this thread", "Which Hyfrme component needs a closer frame review?"]],
  ["frame-03-at-2.3s.png", ["Audit Hyfrme motion", "Build Hyfrme opener"]],
  ["frame-04-at-3.3s.png", ["Remove pin", "Save for later"]],
]) {
  const image = resolve(project, "snapshots", frame);
  const ocr = spawnSync("tesseract", [image, "stdout"], { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 });
  if (ocr.status !== 0) throw new Error(`OCR failed for ${frame}: ${ocr.stderr}`);
  for (const word of words) {
    if (!ocr.stdout.includes(word)) throw new Error(`Custom ${frame} does not visibly show ${word}`);
  }
}
console.log(result.stdout.trim());
console.log("Custom project, thread, copy, menu, and timing overrides are visible in four captured beats.");
