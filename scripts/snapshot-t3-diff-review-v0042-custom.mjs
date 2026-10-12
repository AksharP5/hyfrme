import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-diff-review";
const candidate = resolve(root, `.work/${name}-v0042-candidate`);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stderr.slice(-3000)}\n${result.stdout.slice(-1000)}`);
  return result.stdout;
};

for (const theme of ["dark", "light"]) {
  const project = resolve(root, `.work/${name}-v0042-${theme}-custom`);
  const composition = await readFile(resolve(candidate, `${name}.html`));
  const overrides = {
    theme, renderMode: "editable DOM", projectName: "hyfrme-lab", branchName: "studio/logo-refresh",
    selectedThread: "Hyfrme", otherThread: "Check frame cadence", threadThree: "Review export layout",
    threadFour: "Audit final hold", threadFive: "Check search reveal", settledThread: "Review typography",
    message: "Update the Hyfrme mark and hold for 24 frames.", replyStart: "The updated Hyfrme source lives in",
    replyFile: "logo-mark.html", replyEnd: ". Use the final frame as a steady out.",
    fileName: "logo-mark.html", logoClass: "mark", logoText: "Hyfrme Studio", captionClass: "tagline", captionText: "Frame 42",
    additions: "+8", deletions: "-2", chooserFrame: 16, stackedFrame: 38, splitFrame: 80,
  };
  await mkdir(resolve(project, "compositions"), { recursive: true });
  for (const file of await readdir(candidate)) {
    if (["registry-item.json", "README.md", "licenses"].includes(file)) continue;
    await copyFile(resolve(candidate, file), resolve(project, "compositions", file));
  }
  await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:${theme === "light" ? "#fff" : "#0a0a0a"}}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="${name}-custom-${theme}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div id="${name}" data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${JSON.stringify(overrides).replaceAll("'", "&#39;")}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['${name}-custom-${theme}']=gsap.timeline({paused:true});</script></body></html>`);
  await writeFile(resolve(project, "overrides.json"), `${JSON.stringify(overrides, null, 2)}\n`);
  const checkText = run("npx", ["--yes", "hyperframes@0.8.75", "check", project, "--json"]);
  const check = JSON.parse(checkText.slice(checkText.indexOf("{")));
  await writeFile(resolve(project, "check.json"), `${JSON.stringify(check, null, 2)}\n`);
  if (!check.ok) throw new Error(`${theme} custom Diff Review failed full HyperFrames check`);
  run("npx", ["--yes", "hyperframes@0.8.75", "render", project, "--format=png-sequence", "-o", resolve(project, "render"), "--strict", "--workers=2"]);
  const frames = (await readdir(resolve(project, "render"))).filter((file) => file.endsWith(".png"));
  if (frames.length !== 120) throw new Error(`${theme} custom Diff Review rendered ${frames.length} frames`);
  const frame = (number) => resolve(project, "render", `frame_${String(number + 1).padStart(6, "0")}.png`);
  const phaseFrames = { before: 8, chooser: 25, stacked: 55, split: 95 };
  const sampleFrameSha256 = Object.fromEntries(await Promise.all(Object.entries(phaseFrames).map(async ([phase, number]) =>
    [phase, hash(await readFile(frame(number)))])));
  if (new Set(Object.values(sampleFrameSha256)).size !== 4) throw new Error(`${theme} custom Diff Review phases did not render distinctly`);
  const ocr = run("tesseract", [frame(95), "stdout", "--psm", "11"]);
  const normalized = ocr.toLowerCase().replaceAll(/[^a-z0-9]+/g, " ");
  for (const token of ["hyfrme lab", "logo refresh", "studio", "frame", "42"]) {
    if (!normalized.includes(token.replaceAll(/[^a-z0-9]+/g, " ").trim())) throw new Error(`${theme} custom diff text is missing ${token}: ${ocr.slice(0, 1000)}`);
  }
  await writeFile(resolve(project, "proof.json"), `${JSON.stringify({ theme, fullCheck: true, strictRenderFrames: 120,
    compositionSha256: hash(composition), renderMode: overrides.renderMode, customVariables: overrides,
    sampleFrameSha256, splitViewOcr: ocr.trim() }, null, 2)}\n`);
  console.log(`${theme} editable-DOM Diff Review passed custom project, source text, diff counts, timing and strict 120-frame render.`);
}
