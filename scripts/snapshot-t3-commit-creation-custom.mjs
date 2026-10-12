import { spawnSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-commit-creation";
const block = resolve(root, process.env.T3_BLOCK_DIR ?? ".work/t3-commit-creation-candidate");
const work = await mkdtemp(join(tmpdir(), `${name}-custom-`));
const project = resolve(work, "project");
const compositions = resolve(project, "compositions");
const frames = resolve(work, "frames");
const overrides = {
  projectName: "hyfrme-lab",
  selectedThread: "Tune Hyfrme logo",
  branchName: "hyfrme/logo-audit",
  changedFile: "registry/blocks/logo-enter/intro.html",
  insertions: 3,
  deletions: 2,
  commitMessage: "Refine Hyfrme intro hold",
  commitHash: "abc1234",
  menuFrame: 12,
  dialogFrame: 24,
  typedFrame: 47,
  committedFrame: 93,
};
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
await mkdir(compositions, { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js"]) {
  await copyFile(resolve(block, file), resolve(compositions, file));
}
await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:#0a0a0a}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-commit-creation-custom-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escapeAttribute(JSON.stringify(overrides))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-commit-creation-custom-fixture']=gsap.timeline({paused:true});</script></body></html>`);
const render = spawnSync("npx", ["hyperframes", "render", project, "--format=png-sequence", "-o", frames, "--strict", "--workers=2"], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
if (render.status !== 0) throw new Error(`Customized render failed:\n${render.stderr.slice(-4000)}\n${render.stdout.slice(-2000)}`);
const readText = (frame, crop, psm = 6) => {
  const source = resolve(frames, `frame_${String(frame).padStart(6, "0")}.png`);
  const image = spawnSync("magick", [source, "-crop", crop, "+repage", "-resize", "500%", "png:-"], { maxBuffer: 8 * 1024 * 1024 });
  if (image.status !== 0) throw new Error(image.stderr);
  const ocr = spawnSync("tesseract", ["stdin", "stdout", "--psm", String(psm)], { input: image.stdout, encoding: "utf8" });
  if (ocr.status !== 0) throw new Error(ocr.stderr);
  return ocr.stdout;
};
const menu = readText(19, "400x380+760+15");
const dialog = readText(36, "480x300+360+65");
const typed = readText(70, "480x115+360+445");
const committed = readText(107, "360x100+800+80");
const header = readText(107, "310x45+265+3");
for (const [found, expected, phase] of [
  [menu, "Commit", "earlier menu timing"],
  [dialog, "hyfrme/logo-audit", "branch"],
  [dialog, "intro.html", "changed file"],
  [typed, "Refine Hyfrme intro hold", "typed commit message"],
  [committed, "abc1234", "committed hash"],
  [committed, "Refine Hyfrme intro hold", "committed message"],
  [header, "hyfrme-lab", "project"],
  [header, "Tune Hyfrme logo", "thread"],
]) {
  if (!found.includes(expected)) throw new Error(`Missing ${phase} override: ${expected}\nOCR:\n${found}\nWork: ${work}`);
}
const previews = resolve(root, "public/previews", name);
await mkdir(previews, { recursive: true });
await copyFile(resolve(frames, "frame_000070.png"), resolve(previews, "customized.png"));
console.log(`Strict custom T3 commit render passed; content and timing visible. Work: ${work}`);
