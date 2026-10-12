import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-agent-answer";
const candidate = resolve(root, `.work/${name}-v0042-candidate`);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const run = (program, args) => {
  const result = spawnSync(program, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${program} failed:\n${result.stderr.slice(-3000)}\n${result.stdout.slice(-1000)}`);
  return result.stdout;
};
for (const theme of ["dark", "light"]) {
  const project = resolve(root, `.work/${name}-v0042-${theme}-custom`);
  const composition = await readFile(resolve(candidate, `${name}.html`));
  const overrides = {
    theme, renderMode: "editable DOM", projectName: "hyfrme-studio", branchName: "hyfrme/main",
    threadOne: "Review a Hyfrme opener", threadTwo: "Audit Hyfrme timing", threadThree: "Check Logo Enter",
    threadFour: "Review final hold", threadFive: "Search reveal timing",
    userMessage: "Create a Hyfrme opener and hold the last frame.",
    answerLead: "The Hyfrme review is ready in", answerFile: "hyfrme-motion.html",
    answerTail: ". Keep the final frame steady.", copyAction: "Copy Hyfrme reply",
    copyTooltip: "Copy Hyfrme reply", copiedFeedback: "Hyfrme copied!",
    composerPlaceholder: "Continue the Hyfrme review", hoverFrame: 22, tooltipFrame: 48, copyFrame: 78, clearFrame: 104,
  };
  await mkdir(resolve(project, "compositions"), { recursive: true });
  for (const file of await readdir(candidate)) {
    if (["registry-item.json", "README.md", "licenses"].includes(file)) continue;
    await copyFile(resolve(candidate, file), resolve(project, "compositions", file));
  }
  await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:${theme === "light" ? "#fff" : "#0a0a0a"}}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="${name}-custom-${theme}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div id="${name}" data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${JSON.stringify(overrides).replaceAll("'", "&#39;")}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['${name}-custom-${theme}']=gsap.timeline({paused:true});</script></body></html>`);
  await writeFile(resolve(project, "overrides.json"), JSON.stringify(overrides, null, 2) + "\n");
  const checkText = run("npx", ["--yes", "hyperframes@0.8.75", "check", project, "--json"]);
  const check = JSON.parse(checkText.slice(checkText.indexOf("{")));
  await writeFile(resolve(project, "check.json"), JSON.stringify(check, null, 2) + "\n");
  if (!check.ok) throw new Error(`${theme} custom Agent Answer check failed`);
  run("npx", ["--yes", "hyperframes@0.8.75", "render", project, "--format=png-sequence", "-o", resolve(project, "render"), "--strict", "--workers=2"]);
  const frames = (await readdir(resolve(project, "render"))).filter((file) => file.endsWith(".png"));
  if (frames.length !== 120) throw new Error(`${theme} custom render has ${frames.length} frames`);
  const ocr = (frame) => run("tesseract", [resolve(project, "render", `frame_${String(frame + 1).padStart(6, "0")}.png`), "stdout", "--psm", "11"]);
  const promptText = ocr(10);
  const tooltipFrame = resolve(project, "render/frame_000061.png");
  const answerCrop = resolve(project, "answer-crop.png");
  const tooltipCrop = resolve(project, "tooltip-crop.png");
  run("magick", [tooltipFrame, "-crop", "700x55+400+155", "-resize", "200%", answerCrop]);
  run("magick", [tooltipFrame, "-crop", "150x75+292+165", "-resize", "300%", tooltipCrop]);
  const tooltipText = run("tesseract", [answerCrop, "stdout", "--psm", "6"]);
  const copiedText = run("tesseract", [tooltipCrop, "stdout", "--psm", "6"]);
  const normalize = (value) => value.toLowerCase().replaceAll(/[^a-z0-9]+/g, " ");
  for (const word of ["Create", "Hyfrme", "opener", "hold", "frame"]) if (!normalize(promptText).includes(word.toLowerCase())) {
    throw new Error(`${theme} customized prompt is absent from the rendered message: ${promptText.slice(0, 500)}`);
  }
  for (const phrase of ["hyfrme motion html", "final frame steady"]) if (!normalize(tooltipText).includes(normalize(phrase))) {
    throw new Error(`${theme} customized answer is absent from the rendered frame: ${tooltipText.slice(0, 800)}`);
  }
  for (const phrase of ["Copy", "Hyfrme reply"]) if (!normalize(copiedText).includes(normalize(phrase))) {
    throw new Error(`${theme} customized copy action is absent from the rendered frame: ${copiedText.slice(0, 800)}`);
  }
  const samples = [10, 23, 49, 79, 105];
  const sampleFrameSha256 = Object.fromEntries(await Promise.all(samples.map(async (frame) => [
    frame, hash(await readFile(resolve(project, "render", `frame_${String(frame + 1).padStart(6, "0")}.png`))),
  ])));
  if (new Set(Object.values(sampleFrameSha256)).size !== samples.length - 1 || sampleFrameSha256[23] !== sampleFrameSha256[105]) {
    throw new Error(`${theme} edited interaction phases did not render as the captured before, hover, tooltip, copied, and cleared states`);
  }
  await writeFile(resolve(project, "proof.json"), `${JSON.stringify({ theme, fullCheck: true, strictRenderFrames: frames.length,
    compositionSha256: hash(composition), renderMode: overrides.renderMode, customVariables: overrides,
    sampleFrameSha256, promptOcr: promptText.trim(), answerOcr: tooltipText.trim(), copiedOcr: copiedText.trim() }, null, 2)}\n`);
  console.log(`${theme} editable-DOM Agent Answer passed custom prompt, answer, copy feedback, timing, full check and strict 120-frame render.`);
}
