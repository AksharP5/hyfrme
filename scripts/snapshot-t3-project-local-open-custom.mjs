import { spawnSync } from "node:child_process";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-project-local-open";
const source = resolve(process.env.T3_BLOCK_DIR ?? resolve(root, `registry/blocks/${name}`));
const project = resolve(root, `.work/${name}-custom`);
const overrides = {
  projectName: "hyfrme-lab",
  newProjectName: "hyfrme-motion-kit",
  folderBasePath: "/var/tmp/hyfrme-workspaces",
  folderSearch: "hyfrme-motion",
  childDirectory: "assets",
  branchName: "motion/review",
  threadOne: "Logo motion review",
  threadTwo: "Catalog polish pass",
  threadOneAge: "3h",
  draftHeading: "What should we explore in",
  composerPlaceholder: "Ask Hyfrme about the motion kit",
  localTitle: "Local Hyfrme folder",
  localDescription: "Choose a folder on disk",
  sourceFrame: 10,
  browseFrame: 25,
  selectedFrame: 50,
  addedFrame: 75,
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
  run("npx", ["hyperframes", "snapshot", project, "--at", "0.1,0.5,1.2,2.0,3.2", "--no-end", "-o", resolve(project, "snapshots")]);

const observed = [];
for (const [index, expected] of [
  [0, ["Logo motion review", "hyfrme-lab"]],
  [1, ["Local Hyfrme folder", "Choose a folder on disk"]],
  [2, ["hyfrme-motion-kit", "Create & Add"]],
  [3, ["hyfrme-motion-kit", "assets", "Add"]],
  [4, ["hyfrme-motion-kit", "What should we explore in", "Ask Hyfrme about the motion kit"]],
]) {
  const time = ["0.1", "0.5", "1.2", "2", "3.2"][index];
  const frame = resolve(project, "snapshots", `frame-0${index}-at-${time}s.png`);
  const crop = resolve(project, `phase-${index}.png`);
  const filter = [0, 4].includes(index) ? "scale=2400:1318:flags=neighbor" : "crop=600:440:300:60,scale=1800:1320:flags=neighbor";
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", frame, "-vf", filter, "-frames:v", "1", crop]);
  const visible = run("tesseract", [crop, "stdout"]);
  for (const text of expected) {
    if (!visible.includes(text)) throw new Error(`Custom phase ${index} does not visibly show ${JSON.stringify(text)}. OCR:\n${visible}`);
  }
  observed.push({ time, expected, ocr: visible.trim() });
}
const pathCrop = (index) => {
  const time = index === 2 ? "1.2" : "2";
  const frame = resolve(project, "snapshots", `frame-0${index}-at-${time}s.png`);
  const crop = resolve(project, `path-${index}.png`);
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", frame, "-vf", "crop=560:60:320:62,scale=1680:180:flags=neighbor", "-frames:v", "1", crop]);
  return run("tesseract", [crop, "stdout"]);
};
const browsePath = pathCrop(2).replace(/\s/g, "");
const selectedPath = pathCrop(3).replace(/\s/g, "");
if (!browsePath.includes("hyfrme-workspaces/hyfrme-motion") ||
    !selectedPath.includes("hyfrme-workspaces/hyfrme-motion-kit/")) {
  throw new Error(`Custom browse path or selected project path is not visible: ${browsePath}; ${selectedPath}`);
}
await writeFile(resolve(project, "visible-proof.json"), `${JSON.stringify({ overrides, observed }, null, 2)}\n`);
console.log(snapshotOutput.trim());
console.log("Custom old/new project, local path, folder listing, chooser copy, draft, and phase timing are visible.");
