import { spawnSync } from "node:child_process";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-file-mention";
const source = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, `registry/blocks/${name}`));
const project = resolve(root, `.work/${name}-custom`);
const overrides = {
  projectName: "hyfrme-lab",
  branchName: "motion/review",
  threadOne: "Logo motion review",
  threadTwo: "Catalog polish pass",
  threadOneAge: "3h",
  userMessage: "Review the Hyfrme logo motion and hold the ending for 24 frames.",
  replyLead: "I checked the Logo Enter source in",
  replyFile: "logo-enter-v2.html",
  replyFilePath: "registry/blocks/logo-enter/logo-enter-v2.html",
  replyTail: ". Its last frame can remain still for 24 frames.",
  inputPrefix: "Check",
  query: "enter",
  emptyMessage: "No Hyfrme files match yet.",
  resultOneLabel: "logo-enter-notes.md",
  resultTwoLabel: "logo-enter-motion",
  resultThreeLabel: "logo-enter-icons",
  resultFourLabel: "logo-enter-intro",
  selectedFileLabel: "logo-enter-v2.html",
  selectedFilePath: "registry/blocks/logo-enter/logo-enter-v2.html",
  resultSixLabel: "logo-enter-qa.html",
  resultSevenLabel: "logo-enter-docs.html",
  atFrame: 10,
  resultsFrame: 27,
  highlightFrame: 50,
  chipFrame: 75,
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
const snapshotOutput = process.argv.includes("--verify-only") ? "Using previously rendered strict custom snapshots." :
  run("npx", ["hyperframes", "snapshot", project, "--at", "0.1,0.6,1.2,2.1,3.3", "--no-end", "-o", resolve(project, "snapshots")]);

const observed = [];
for (const [index, expected] of [
  [0, ["Logo motion review", "hyfrme-lab"]],
  [1, ["Check @", "Hyfrme files match yet."]],
  [2, ["Check @enter", "logo-enter-notes.md", "enter-v2.html"]],
  [3, ["Check @enter", "logo-enter-v2.html"]],
  [4, ["Check", "logo-enter-v2.html"]],
]) {
  const time = ["0.1", "0.6", "1.2", "2.1", "3.3"][index];
  const frame = resolve(project, "snapshots", `frame-0${index}-at-${time}s.png`);
  const crop = resolve(project, `phase-${index}.png`);
  const filter = index === 0 ? "scale=2400:1318:flags=neighbor" : "crop=780:500:335:120,scale=1560:1000:flags=neighbor";
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", frame, "-vf", filter, "-frames:v", "1", crop]);
  const visible = run("tesseract", [crop, "stdout"]);
  for (const text of expected) {
    if (!visible.includes(text)) throw new Error(`Custom phase ${index} does not visibly show ${JSON.stringify(text)}. OCR:\n${visible}`);
  }
  observed.push({ time, expected, ocr: visible.trim() });
}
const composer = resolve(project, "composer-chip.png");
run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", resolve(project, "snapshots/frame-04-at-3.3s.png"), "-vf", "crop=765:140:345:465,scale=1530:280:flags=neighbor", "-frames:v", "1", composer]);
const composerText = run("tesseract", [composer, "stdout"]);
if (!composerText.replace(/[^a-z0-9]/gi, "").toLowerCase().includes("checklogoenterv2html")) {
  throw new Error(`Selected file chip is not visible in the composer: ${composerText}`);
}
const highlightCrop = (index) => run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", resolve(project, `snapshots/frame-0${index}-at-${index === 2 ? "1.2" : "2.1"}s.png`), "-vf", "crop=708:31:374:359", "-f", "md5", "-"]);
if (highlightCrop(2) === highlightCrop(3)) throw new Error("Highlighted result did not visibly change at the custom highlight frame");
await writeFile(resolve(project, "visible-proof.json"), `${JSON.stringify({ overrides, observed }, null, 2)}\n`);
console.log(snapshotOutput.trim());
console.log("Custom project, thread, prompt, search results, selected file chip, and phase timing are visible.");
