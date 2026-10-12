import { spawnSync } from "node:child_process";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-thread-reorder";
const source = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, `registry/blocks/${name}`));
const project = resolve(root, `.work/${name}-custom`);
const overrides = {
  projectName: "hyfrme-studio",
  branchName: "motion/review",
  activeBranch: "motion/intro",
  firstThread: "Logo intro review",
  pinThread: "Catalog preview audit",
  thirdThread: "Grouped logo QA",
  firstAge: "2h",
  pinAge: "4h",
  firstQuestion: "Build a Hyfrme logo opener and hold the final frame.",
  firstReplyLead: "I checked the logo timing in",
  firstReplyFile: "logo-enter-v2.html",
  firstReplyTail: ". Its final frame can stay visible for 24 frames.",
  composerPlaceholder: "Ask Hyfrme for a follow-up",
  topAction: "Review changes",
  liftFrame: 15,
  overFrame: 35,
  dropFrame: 60,
  persistFrame: 85,
};
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr}\n${result.stdout}`);
  return result.stdout;
};
await mkdir(resolve(project, "compositions"), { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js"]) {
  await copyFile(resolve(source, file), resolve(project, "compositions", file));
}
await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:#0a0a0a}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="${name}-custom-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escapeAttribute(JSON.stringify(overrides))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['${name}-custom-fixture']=gsap.timeline({paused:true});</script></body></html>`);
await writeFile(resolve(project, "overrides.json"), `${JSON.stringify(overrides, null, 2)}\n`);
const snapshotOutput = process.argv.includes("--verify-only") ? "Using previously rendered custom snapshots." :
  run("npx", ["hyperframes", "snapshot", project, "--at", "0.1,0.8,1.6,2.5,3.4", "--no-end", "-o", resolve(project, "snapshots")]);

const observed = [];
for (const [index, expected] of [
  [0, ["Logo intro review", "Catalog preview audit", "hyfrme-studio"]],
  [1, ["Logo intro review", "Catalog preview audit"]],
  [2, ["Logo intro review", "Catalog preview audit"]],
  [3, ["Logo intro review", "Catalog preview audit"]],
  [4, ["Logo intro review", "Catalog preview audit"]],
]) {
  const time = ["0.1", "0.8", "1.6", "2.5", "3.4"][index];
  const frame = resolve(project, "snapshots", `frame-0${index}-at-${time}s.png`);
  const crop = resolve(project, `phase-${index}.png`);
  const filter = "scale=2400:1318:flags=neighbor";
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", frame, "-vf", filter, "-frames:v", "1", crop]);
  const visible = run("tesseract", [crop, "stdout"]);
  for (const text of expected) {
    if (!visible.includes(text)) throw new Error(`Custom phase ${index} does not visibly show ${JSON.stringify(text)}. OCR:\n${visible}`);
  }
  observed.push({ time, expected, ocr: visible.trim() });
}
for (const text of [
  "Build a Hyfrme logo opener and hold the final frame.",
  "logo-enter-v2.html",
  "24 frames",
  "motion/review",
  "Reviewchanges",
]) {
  if (!observed[0].ocr.includes(text)) throw new Error(`Custom conversation/header does not visibly show ${JSON.stringify(text)}`);
}
if (!observed[1].ocr.includes("Ask Hyfrme for a follow-up")) {
  throw new Error("Custom composer placeholder is not visible in the lifted state");
}
const sidebarText = (index) => {
  const time = ["0.1", "0.8", "1.6", "2.5", "3.4"][index];
  const frame = resolve(project, "snapshots", `frame-0${index}-at-${time}s.png`);
  const crop = resolve(project, `sidebar-${index}.png`);
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", frame, "-vf", "crop=245:185:8:135,scale=735:555:flags=neighbor", "-frames:v", "1", crop]);
  return run("tesseract", [crop, "stdout"]);
};
const initialOrder = sidebarText(0);
const liftedOrder = sidebarText(1);
const overOrder = sidebarText(2);
const droppedOrder = sidebarText(3);
const persistedOrder = sidebarText(4);
const orderOf = (value) => [value.indexOf("Logo intro review"), value.indexOf("Catalog preview audit")];
const [initialFirst, initialMoved] = orderOf(initialOrder);
const [liftedFirst, liftedMoved] = orderOf(liftedOrder);
const [overFirst, overMoved] = orderOf(overOrder);
const [droppedFirst, droppedMoved] = orderOf(droppedOrder);
const [persistedFirst, persistedMoved] = orderOf(persistedOrder);
if (Math.min(initialFirst, initialMoved, liftedFirst, liftedMoved, overFirst, overMoved, droppedFirst, droppedMoved, persistedFirst, persistedMoved) < 0 ||
    !(initialFirst < initialMoved && liftedFirst < liftedMoved && overMoved < overFirst && droppedMoved < droppedFirst && persistedMoved < persistedFirst)) {
  throw new Error(`Custom drag/drop timing and order did not visibly change and persist: ${initialOrder}; ${liftedOrder}; ${overOrder}; ${droppedOrder}; ${persistedOrder}`);
}
await writeFile(resolve(project, "visible-proof.json"), `${JSON.stringify({ overrides, observed }, null, 2)}\n`);
console.log(snapshotOutput.trim());
console.log("Custom project, branch, thread labels, conversation, drag beats, and persisted pinned order are visible.");
