import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const name = "t3-commit-review";
const theme = process.env.T3_CUSTOM_THEME ?? "dark";
if (!["dark", "light"].includes(theme)) throw new Error("T3_CUSTOM_THEME must be dark or light");
const executablePath = process.env.HYFRME_CHROMIUM;
if (!executablePath) throw new Error("Set HYFRME_CHROMIUM to the pinned Chrome executable");
const block = resolve(root, `.work/${name}-v0042-candidate`);
const project = resolve(root, `.work/${name}-v0042-${theme}-custom`);
const source = await readFile(resolve(block, `${name}.html`));
const reuse = process.env.T3_CUSTOM_REUSE_RENDER === "1";
if (reuse && !source.equals(await readFile(resolve(project, "compositions", `${name}.html`)))) {
  throw new Error("Cached customized render does not match this candidate");
}
const overrides = {
  theme,
  projectName: "hyfrme-studio",
  projectAvatar: "HS",
  threadOne: "Polish Hyfrme opener",
  threadTwo: "Audit Hyfrme motion",
  threadThree: "Group Hyfrme logos",
  threadOneAge: "3h",
  branchName: "feature/hyfrme-opener",
  changedFile: "registry/blocks/hyfrme-opener/opener.html",
  insertions: 7,
  deletions: 2,
  commitAction: "Save Git commit",
  dialogTitle: "Review Hyfrme commit",
  commitMessage: "Polish the Hyfrme opener timing and final hold",
  menuFrame: 20,
  dialogFrame: 45,
  messageFrame: 80,
};
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stderr.slice(-3000)}\n${result.stdout.slice(-1500)}`);
  return result;
};
await mkdir(resolve(project, "compositions"), { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js", ...["dark", "light"].map((appearance) =>
  `commit-review-v0042-${appearance}-menu-crop.png`)]) {
  await copyFile(resolve(block, file), resolve(project, "compositions", file));
}
await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:${theme === "light" ? "#fff" : "#0a0a0a"}}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-commit-review-v0042-custom-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escapeAttribute(JSON.stringify(overrides))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-commit-review-v0042-custom-fixture']=gsap.timeline({paused:true});</script></body></html>`);
await writeFile(resolve(project, "overrides.json"), JSON.stringify(overrides, null, 2) + "\n");
const checked = reuse ? null : run("npx", ["--yes", "hyperframes@0.8.75", "check", project, "--json"]);
const check = checked
  ? JSON.parse(checked.stdout.slice(checked.stdout.indexOf("{")))
  : JSON.parse(await readFile(resolve(project, "check.json"), "utf8"));
if (checked) await writeFile(resolve(project, "check.json"), JSON.stringify(check, null, 2) + "\n");
if (!check.ok) throw new Error(`Customized ${theme} full check failed`);
if (!reuse) run("npx", ["--yes", "hyperframes@0.8.75", "render", project, "--format=png-sequence", "-o", resolve(project, "render"), "--strict", "--workers=2"]);
const frames = (await readdir(resolve(project, "render"))).filter((file) => file.endsWith(".png"));
if (frames.length !== 120) throw new Error(`Customized ${theme} render has ${frames.length} frames`);
for (const [frame, region, words] of [
  [10, "800x300+0+0", ["hyfrme-studio", "Polish Hyfrme opener"]],
  [35, "250x100+900+35", ["Save Git commit"]],
  [60, "600x600+300+30", ["Review Hyfrme commit", "opener.html", "+7", "-2"]],
  [100, "600x600+300+30", ["Polish the Hyfrme opener timing"]],
]) {
  const original = resolve(project, "render", `frame_${String(frame + 1).padStart(6, "0")}.png`);
  const readable = resolve(project, `state-${frame}-ocr.png`);
  run("magick", [original, "-crop", region, "+repage", "-resize", "200%", readable]);
  const ocr = run("tesseract", [readable, "stdout", "--psm", "6"]).stdout;
  for (const word of words) if (!ocr.toLowerCase().includes(word.toLowerCase())) {
    throw new Error(`Customized ${theme} frame ${frame} lacks ${word}; OCR: ${ocr.slice(0, 900)}`);
  }
}
for (const [before, after] of [[10, 35], [35, 60], [60, 100]]) {
  const first = await readFile(resolve(project, "render", `frame_${String(before + 1).padStart(6, "0")}.png`));
  const next = await readFile(resolve(project, "render", `frame_${String(after + 1).padStart(6, "0")}.png`));
  if (first.equals(next)) throw new Error(`Edited Commit Review states ${before} and ${after} did not change`);
}
const pixel = run("magick", [resolve(project, "render/frame_000011.png"), "-format", "%[pixel:p{800,300}]", "info:"]).stdout;
const level = Number(pixel.match(/\((\d+),\s*(\d+),\s*(\d+)/)?.[1]);
if (!Number.isFinite(level) || (theme === "light" ? level < 230 : level > 40)) {
  throw new Error(`Unexpected ${theme} appearance: ${pixel}`);
}

const template = source.toString().match(/<template>([\s\S]*?)<\/template>/)?.[1];
if (!template) throw new Error("Generated block has no HyperFrames template");
const anchorHarness = resolve(project, "compositions/anchor-harness.html");
await writeFile(anchorHarness, `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden}</style></head><body><script>window.__hyperframes={getVariables:()=>(${JSON.stringify(overrides)})};window.__timelines={};</script>${template}</body></html>`);
const browser = await chromium.launch({ executablePath, headless: true, args: [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
  "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
] });
let menuAnchorDeltaPx;
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 659 }, deviceScaleFactor: 1, colorScheme: theme });
  await page.goto(pathToFileURL(anchorHarness).href, { waitUntil: "load" });
  await page.waitForFunction((id) => Boolean(window.__timelines?.[id]), name);
  menuAnchorDeltaPx = await page.evaluate((id) => {
    window.__timelines[id].progress(35 / 120);
    const stage = document.querySelector(`[data-t3-theme="${window.__hyperframes.getVariables().theme}"]`);
    const menu = stage?.querySelector('[data-t3-state="menu"] [role="menu"]');
    const trigger = stage?.querySelector('[data-t3-state="menu"] [aria-label="Git action options"]');
    if (!menu || !trigger) return NaN;
    return Math.abs(menu.getBoundingClientRect().right - trigger.getBoundingClientRect().right);
  }, name);
} finally {
  await browser.close();
}
if (!Number.isFinite(menuAnchorDeltaPx) || menuAnchorDeltaPx > 2) {
  throw new Error(`Edited Git menu is not anchored to its trigger: ${menuAnchorDeltaPx}px`);
}
await writeFile(resolve(project, "proof.json"), JSON.stringify({ theme,
  compositionSha256: createHash("sha256").update(source).digest("hex"), fullCheck: true, strictRenderFrames: 120,
  menuAnchorDeltaPx, checked: ["project", "threads", "branch", "file path", "diff counts", "message", "menu action", "state timing", "appearance"],
}, null, 2) + "\n");
console.log(`Customized ${theme} full check, strict 120-frame render, OCR, and ${menuAnchorDeltaPx.toFixed(2)}px menu anchor passed.`);
