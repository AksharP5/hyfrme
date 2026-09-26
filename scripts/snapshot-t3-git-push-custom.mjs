import { spawnSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-git-push";
const block = resolve(root, process.env.T3_BLOCK_DIR ?? ".work/t3-git-push-candidate");
const work = await mkdtemp(join(tmpdir(), `${name}-custom-`));
const project = resolve(work, "project");
const compositions = resolve(project, "compositions");
const frames = process.env.T3_CUSTOM_FRAMES ? resolve(process.env.T3_CUSTOM_FRAMES) : resolve(work, "frames");
const overrides = {
  projectName: "hyfrme-lab",
  selectedThread: "Tune Hyfrme logo",
  branchName: "hyfrme/logo-audit",
  pushTarget: "origin/hyfrme/logo-audit",
  quickBefore: "Push Hyfrme",
  quickAfter: "Review branch",
  progressLabel: "Pushing Hyfrme...",
  successCta: "View Hyfrme branch",
  successDuration: "8s",
  menuFrame: 12,
  pushingFrame: 30,
  pushedFrame: 90,
};
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
await mkdir(compositions, { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js"]) {
  await copyFile(resolve(block, file), resolve(compositions, file));
}
await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:#0a0a0a}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-git-push-custom-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escapeAttribute(JSON.stringify(overrides))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-git-push-custom-fixture']=gsap.timeline({paused:true});</script></body></html>`);
if (!process.env.T3_CUSTOM_FRAMES) {
  const render = spawnSync("npx", ["hyperframes", "render", project, "--format=png-sequence", "-o", frames, "--strict", "--workers=2"], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  if (render.status !== 0) throw new Error(`Customized render failed:\n${render.stderr.slice(-4000)}\n${render.stdout.slice(-2000)}`);
}
const readText = (frame, crop, psm = 6) => {
  const source = resolve(frames, `frame_${String(frame).padStart(6, "0")}.png`);
  const image = spawnSync("magick", [source, "-crop", crop, "+repage", "-resize", "500%", "png:-"], { maxBuffer: 8 * 1024 * 1024 });
  if (image.status !== 0) throw new Error(image.stderr);
  const ocr = spawnSync("tesseract", ["stdin", "stdout", "--psm", String(psm)], { input: image.stdout, encoding: "utf8" });
  if (ocr.status !== 0) throw new Error(ocr.stderr);
  return ocr.stdout;
};
const menu = readText(19, "400x380+760+15");
const progress = readText(56, "370x90+800+80");
const success = readText(107, "370x105+800+80");
const successAction = readText(107, "150x30+1010+142", 7);
const header = readText(107, "315x45+265+3");
const toolbarBefore = readText(19, "190x45+925+3");
const toolbarAfter = readText(107, "190x45+925+3");
for (const [found, expected, phase] of [
  [menu, "Push", "earlier menu timing"],
  [progress, "Pushing Hyfrme", "progress toast"],
  [success, "origin/hyfrme/logo-audit", "push target"],
  [success, "Running for 8s", "push duration"],
  [successAction, "View Hyfrme branch", "success action"],
  [toolbarBefore, "Push Hyfrme", "pre-push toolbar"],
  [toolbarAfter, "Review branch", "post-push toolbar"],
  [header, "hyfrme-lab", "project"],
  [header, "Tune Hyfrme logo", "thread"],
]) {
  if (!found.replaceAll(/\s/g, "").includes(expected.replaceAll(/\s/g, ""))) throw new Error(`Missing ${phase} override: ${expected}\nOCR:\n${found}\nWork: ${work}`);
}
const previews = resolve(root, "public/previews", name);
await mkdir(previews, { recursive: true });
await copyFile(resolve(frames, "frame_000107.png"), resolve(previews, "customized.png"));
console.log(`Strict custom T3 Git Push render passed; content and timing visible. Work: ${work}`);
