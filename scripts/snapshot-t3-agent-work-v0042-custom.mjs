import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-agent-work";
const candidate = resolve(root, `.work/${name}-v0042-candidate`);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll('"', "&quot;");
const run = (program, args) => {
  const result = spawnSync(program, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${program} failed:\n${result.stderr.slice(-3000)}\n${result.stdout.slice(-1000)}`);
  return result.stdout;
};

for (const theme of ["dark", "light"]) {
  const project = resolve(root, `.work/${name}-v0042-${theme}-custom`);
  const composition = await readFile(resolve(candidate, `${name}.html`));
  const overrides = {
    theme,
    renderMode: "editable DOM",
    projectName: "hyfrme-studio",
    branchName: "hyfrme/main",
    threadOne: "Build a Hyfrme opener",
    threadTwo: "Audit Hyfrme motion",
    threadThree: "Logo lockup review",
    threadFour: "Check motion timing",
    threadFive: "New reveal study",
    userMessage: "Create a Hyfrme opener with a longer final hold.",
    command: "npm run check",
    workingDuration: "1m 12s",
    messageTime: "just now",
    composerPlaceholder: "Continue the Hyfrme motion review",
    thread1Age: "4m",
    thread2Age: "1h",
    thread3Age: "2h",
    thread4Age: "1d",
    thread5Age: "2d",
    thread6Age: "3d",
    commandFrame: 20,
    detailFrame: 48,
    collapseFrame: 102,
  };
  await mkdir(resolve(project, "compositions"), { recursive: true });
  for (const file of await readdir(candidate)) {
    if (file === "registry-item.json" || file === "README.md" || file === "licenses") continue;
    await copyFile(resolve(candidate, file), resolve(project, "compositions", file));
  }
  await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:${theme === "light" ? "#fff" : "#0a0a0a"}}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="${name}-v0042-custom-${theme}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div id="${name}" data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escapeAttribute(JSON.stringify(overrides))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['${name}-v0042-custom-${theme}']=gsap.timeline({paused:true});</script></body></html>`);
  await writeFile(resolve(project, "overrides.json"), JSON.stringify(overrides, null, 2) + "\n");
  const checked = run("npx", ["--yes", "hyperframes@0.8.75", "check", project, "--json"]);
  const check = JSON.parse(checked.slice(checked.indexOf("{")));
  await writeFile(resolve(project, "check.json"), JSON.stringify(check, null, 2) + "\n");
  if (!check.ok) throw new Error(`${theme} customized Agent Work full check failed`);
  run("npx", ["--yes", "hyperframes@0.8.75", "render", project, "--format=png-sequence", "-o", resolve(project, "render"), "--strict", "--workers=2"]);
  const frames = (await readdir(resolve(project, "render"))).filter((file) => file.endsWith(".png"));
  if (frames.length !== 120) throw new Error(`${theme} customized render has ${frames.length} frames`);
  const ocr = (frame) => run("tesseract", [resolve(project, "render", `frame_${String(frame + 1).padStart(6, "0")}.png`), "stdout", "--psm", "11"]);
  const promptText = ocr(10);
  const commandText = ocr(50);
  const normalize = (value) => value.toLowerCase().replaceAll(/[^a-z0-9]+/g, " ");
  const promptNormalized = normalize(promptText);
  const commandNormalized = normalize(commandText);
  for (const word of ["Create", "Hyfrme", "opener", "longer", "final", "hold"]) {
    if (!promptNormalized.includes(word.toLowerCase())) throw new Error(`${theme} custom prompt frame lacks ${word}: ${promptText.slice(0, 600)}`);
  }
  for (const word of ["npm", "run", "check"]) {
    if (!commandNormalized.includes(word)) throw new Error(`${theme} expanded custom command frame lacks ${word}: ${commandText.slice(0, 600)}`);
  }
  const sampleFrames = [10, 30, 60, 108];
  const hashes = Object.fromEntries(await Promise.all(sampleFrames.map(async (frame) => [
    frame, hash(await readFile(resolve(project, "render", `frame_${String(frame + 1).padStart(6, "0")}.png`))),
  ])));
  if (new Set(Object.values(hashes)).size !== Object.keys(hashes).length) throw new Error(`${theme} edited events did not produce distinct rendered states`);
  await writeFile(resolve(project, "proof.json"), JSON.stringify({ theme, fullCheck: true,
    strictRenderFrames: frames.length, compositionSha256: hash(composition), renderMode: overrides.renderMode,
    customVariables: overrides, sampleFrameSha256: hashes, promptOcr: promptText.trim(), commandOcr: commandText.trim() }, null, 2) + "\n");
  console.log(`${theme} editable-DOM Agent Work passed custom prompt, command, timing, full check and strict 120-frame render.`);
}
