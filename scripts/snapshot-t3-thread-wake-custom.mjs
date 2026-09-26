import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-thread-wake";
const block = resolve(root, process.env.T3_BLOCK_DIR ?? `.work/${name}-candidate`);
const project = resolve(root, ".work/t3-thread-wake-custom");
const frames = process.env.T3_CUSTOM_FRAMES ? resolve(process.env.T3_CUSTOM_FRAMES) : resolve(project, "frames");
const overrides = {
  projectName: "hyfrme-studio",
  firstThread: "Build Hyfrme opener",
  wakeThread: "Review Hyfrme transitions",
  wakeAge: "4m",
  wakeCountdown: "2h",
  question: "Which Hyfrme motion deserves another parity pass?",
  reply: "Review Logo Enter at the exact final frame before publishing the Hyfrme block.",
  composerPlaceholder: "Ask Hyfrme for another review",
  snoozedShelfCount: "Waiting (1)",
  snoozedShelf: "Waiting reviews",
  bannerTitle: "This Hyfrme review is snoozed",
  bannerDescription: "Wake it to continue the Hyfrme review.",
  bannerWake: "Continue review",
  wakeAction: "Wake review",
  expandedFrame: 8,
  menuFrame: 15,
  wakeFrame: 100,
};
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
await mkdir(resolve(project, "compositions"), { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js"]) {
  await copyFile(resolve(block, file), resolve(project, "compositions", file));
}
await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:#0a0a0a}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="${name}-custom-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escapeAttribute(JSON.stringify(overrides))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['${name}-custom-fixture']=gsap.timeline({paused:true});</script></body></html>`);
await writeFile(resolve(project, "overrides.json"), `${JSON.stringify(overrides, null, 2)}\n`);
if (!process.env.T3_CUSTOM_FRAMES) {
  const render = spawnSync("npx", ["hyperframes", "render", project, "--format=png-sequence", "-o", frames, "--strict", "--workers=2"], {
    encoding: "utf8", maxBuffer: 16 * 1024 * 1024,
  });
  if (render.status !== 0) throw new Error(`Customized render failed:\n${render.stderr.slice(-4000)}\n${render.stdout.slice(-2000)}`);
}
const readText = (frame, crop, psm = 6) => {
  const source = resolve(frames, `frame_${String(frame).padStart(6, "0")}.png`);
  const resized = spawnSync("magick", [source, "-crop", crop, "+repage", "-resize", "400%", "png:-"], { maxBuffer: 12 * 1024 * 1024 });
  if (resized.status !== 0) throw new Error(resized.stderr);
  const ocr = spawnSync("tesseract", ["stdin", "stdout", "--psm", String(psm)], { input: resized.stdout, encoding: "utf8" });
  if (ocr.status !== 0) throw new Error(ocr.stderr);
  return ocr.stdout.replaceAll(/\s/g, "").toLowerCase();
};
for (const [frame, crop, value] of [
  [5, "240x105+7+455", "Waiting (1)"],
  [25, "240x105+7+455", "Review Hyfrme transi"],
  [25, "200x400+355+40", "Wake review"],
  [80, "200x400+355+40", "Wake review"],
  [110, "245x310+5+125", "Review Hyfrme transitions"],
  [110, "390x60+270+2", "Review Hyfrme transitions"],
]) {
  const found = readText(frame, crop);
  if (!found.includes(value.replaceAll(/\s/g, "").toLowerCase())) {
    throw new Error(`Custom frame ${frame} lacks ${value}; OCR: ${found}`);
  }
}
const html = await readFile(resolve(project, "compositions", `${name}.html`), "utf8");
if (!html.includes('data-composition-variables')) throw new Error("Installed source lacks editable variables");
await mkdir(resolve(root, "public/previews", name), { recursive: true });
await copyFile(resolve(frames, "frame_000110.png"), resolve(root, "public/previews", name, "customized.png"));
console.log("Strict 120-frame custom T3 Thread Wake render passed; content and altered phase timing are visible.");
