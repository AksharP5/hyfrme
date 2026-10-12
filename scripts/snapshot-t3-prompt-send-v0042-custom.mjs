import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-prompt-send";
const candidate = resolve(root, `.work/${name}-v0042-candidate`);
const proofRoot = resolve(root, `.work/${name}-v0042-custom`);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll('"', "&quot;");
const run = (program, args, cwd = root) => {
  const result = spawnSync(program, args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`${program} ${args.join(" ")} failed:\n${result.stderr.slice(-3000)}\n${result.stdout.slice(-1000)}`);
  }
  return result;
};

for (const theme of ["dark", "light"]) {
  const project = resolve(proofRoot, theme);
  const composition = await readFile(resolve(candidate, `${name}.html`));
  const overrides = {
    theme,
    renderMode: "editable DOM",
    projectName: "hyfrme-studio",
    branchName: "hyfrme/main",
    draftThreadTitle: "New thread",
    agentThreadTitle: "Build a Hyfrme opener",
    threadOne: "Build a Hyfrme opener",
    threadTwo: "Audit Hyfrme motion",
    prompt: "Create a Hyfrme opener with a longer final hold.",
    sendFrame: 20,
    completeFrame: 110,
  };
  await mkdir(resolve(project, "compositions"), { recursive: true });
  for (const file of await readdir(candidate)) {
    if (file === "registry-item.json" || file === "README.md" || file === "licenses") continue;
    await copyFile(resolve(candidate, file), resolve(project, "compositions", file));
  }
  await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:${theme === "light" ? "#fff" : "#0a0a0a"}}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="${name}-v0042-custom-${theme}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escapeAttribute(JSON.stringify(overrides))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['${name}-v0042-custom-${theme}']=gsap.timeline({paused:true});</script></body></html>`);
  await writeFile(resolve(project, "overrides.json"), JSON.stringify(overrides, null, 2) + "\n");

  const checked = run("npx", ["--yes", "hyperframes@0.8.75", "check", project, "--json"]);
  const check = JSON.parse(checked.stdout.slice(checked.stdout.indexOf("{")));
  if (!check.ok) throw new Error(`${theme} custom Prompt Send full check failed`);
  await writeFile(resolve(project, "check.json"), JSON.stringify(check, null, 2) + "\n");
  run("npx", ["--yes", "hyperframes@0.8.75", "render", project, "--format=png-sequence", "-o", resolve(project, "render"), "--strict", "--workers=2"]);
  const frames = (await readdir(resolve(project, "render"))).filter((file) => file.endsWith(".png"));
  if (frames.length !== 120) throw new Error(`${theme} custom render has ${frames.length} frames`);

  const draft = resolve(project, "render/frame_000011.png");
  const ocr = run("tesseract", [draft, "stdout", "--psm", "11"]).stdout;
  const normalized = ocr.toLowerCase().replaceAll(/[^a-z0-9]+/g, " ");
  for (const word of ["Create", "Hyfrme", "opener", "longer", "final", "hold"]) {
    if (!normalized.includes(word.toLowerCase())) {
      throw new Error(`${theme} customized draft frame lacks ${word}; OCR: ${ocr.slice(0, 700)}`);
    }
  }
  const frameHash = await hash(await readFile(draft));
  const afterSendHash = await hash(await readFile(resolve(project, "render/frame_000026.png")));
  if (frameHash === afterSendHash) throw new Error(`${theme} send timing did not change the customized frame`);

  await writeFile(resolve(project, "proof.json"), JSON.stringify({
    theme,
    fullCheck: true,
    strictRenderFrames: frames.length,
    compositionSha256: hash(composition),
    renderMode: overrides.renderMode,
    customVariables: overrides,
    customizedPromptFrameSha256: frameHash,
    postSendFrameSha256: afterSendHash,
    promptOcr: ocr.trim(),
  }, null, 2) + "\n");
  console.log(`${theme} editable-DOM custom variables passed full check, strict render, and prompt assertions.`);
}
