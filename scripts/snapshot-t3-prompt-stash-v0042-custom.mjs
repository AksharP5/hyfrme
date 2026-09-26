import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const name = "t3-prompt-stash";
const theme = process.env.T3_CUSTOM_THEME ?? "dark";
if (!["dark", "light"].includes(theme)) throw new Error("T3_CUSTOM_THEME must be dark or light");
const block = resolve(root, `.work/${name}-v0042-candidate`);
const project = resolve(root, `.work/${name}-v0042-${theme}-custom`);
const source = await readFile(resolve(block, `${name}.html`));
const reuse = process.env.T3_CUSTOM_REUSE_RENDER === "1";
if (reuse && !source.equals(await readFile(resolve(project, "compositions", `${name}.html`)))) {
  throw new Error("The cached render does not match this candidate");
}
const overrides = {
  theme,
  projectName: "hyfrme-studio",
  projectAvatar: "HS",
  firstThread: "Build a Hyfrme opener",
  secondThread: "Audit Hyfrme motion",
  firstAge: "11h",
  firstBranch: "hyfrme/main",
  question: "Build a Hyfrme product opener. Hold the final frame for 24 frames.",
  replyLead: "I checked the motion timing in",
  fileMention: "hyfrme-opener.html",
  replyTail: ". The final frame can remain still while the clip runs longer.",
  prompt: "Create a Hyfrme opener with a longer final hold.",
  stashLabel: "Saved drafts",
  stashAge: "a moment ago",
  composerPlaceholder: "Enable a provider to continue in Hyfrme",
  providerStatus: "Open Hyfrme settings",
  activeBranch: "feature/hyfrme-opener",
  stashFrame: 15,
  menuFrame: 35,
  persistedMenuFrame: 55,
  recallFrame: 75,
  stashAgainFrame: 95,
  directRecallFrame: 110,
};
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stderr.slice(-3000)}\n${result.stdout.slice(-1500)}`);
  return result;
};
await mkdir(resolve(project, "compositions"), { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js"]) {
  await copyFile(resolve(block, file), resolve(project, "compositions", file));
}
await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:${theme === "light" ? "#fff" : "#0a0a0a"}}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-prompt-stash-v0042-custom-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escapeAttribute(JSON.stringify(overrides))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-prompt-stash-v0042-custom-fixture']=gsap.timeline({paused:true});</script></body></html>`);
await writeFile(resolve(project, "overrides.json"), JSON.stringify(overrides, null, 2) + "\n");
const checked = reuse ? null : run("npx", ["--yes", "hyperframes@0.8.75", "check", project, "--json"]);
const check = checked ? JSON.parse(checked.stdout.slice(checked.stdout.indexOf("{")))
  : JSON.parse(await readFile(resolve(project, "check.json"), "utf8"));
if (checked) await writeFile(resolve(project, "check.json"), JSON.stringify(check, null, 2) + "\n");
if (!check.ok) throw new Error(`Customized ${theme} full check failed`);
if (!reuse) run("npx", ["--yes", "hyperframes@0.8.75", "render", project, "--format=png-sequence", "-o", resolve(project, "render"), "--strict", "--workers=2"]);
const frames = (await readdir(resolve(project, "render"))).filter((file) => file.endsWith(".png"));
if (frames.length !== 120) throw new Error(`Customized ${theme} render has ${frames.length} frames`);
const sample = async (frame, crop, words) => {
  const image = resolve(project, "render", `frame_${String(frame + 1).padStart(6, "0")}.png`);
  const readable = resolve(project, `state-${frame}-ocr.png`);
  run("magick", [image, "-crop", crop, "+repage", "-resize", "250%", readable]);
  const ocr = run("tesseract", [readable, "stdout", "--psm", "6"]).stdout;
  const normalized = ocr.toLowerCase().replaceAll(/\s+/g, "");
  for (const word of words) if (!normalized.includes(word.toLowerCase().replaceAll(/\s+/g, ""))) {
    throw new Error(`Customized ${theme} frame ${frame} lacks ${word}; OCR: ${ocr.slice(0, 700)}`);
  }
};
await sample(10, "750x150+360+460", ["Create a Hyfrme opener"]);
await sample(25, "750x210+360+400", ["Saved drafts"]);
await sample(45, "735x82+360+402", ["Saved drafts", "Create a Hyfrme opener", "a moment ago"]);
await sample(65, "735x82+360+402", ["Saved drafts", "Create a Hyfrme opener"]);
await sample(85, "750x150+360+460", ["Create a Hyfrme opener"]);
await sample(103, "750x210+360+400", ["Saved drafts"]);
await sample(115, "750x150+360+460", ["Create a Hyfrme opener"]);
const frame = async (n) => readFile(resolve(project, "render", `frame_${String(n + 1).padStart(6, "0")}.png`));
const [draft, stashed, menu, persistedMenu, recalled, directStashed, directRecalled] =
  await Promise.all([10, 25, 45, 65, 85, 103, 115].map(frame));
if (draft.equals(stashed) || stashed.equals(menu) || menu.equals(recalled) ||
  recalled.equals(directStashed) || directStashed.equals(directRecalled)) {
  throw new Error("Edited stash, drawer, or restore states differ from expected timing");
}
const pixel = run("magick", [resolve(project, "render/frame_000011.png"), "-format", "%[pixel:p{800,300}]", "info:"]).stdout;
const level = Number(pixel.match(/\((\d+),\s*(\d+),\s*(\d+)/)?.[1]);
if (!Number.isFinite(level) || (theme === "light" ? level < 230 : level > 40)) {
  throw new Error(`Unexpected ${theme} appearance: ${pixel}`);
}
const playwrightPath = process.env.HYFRME_PLAYWRIGHT_CORE;
const executablePath = process.env.HYFRME_CHROMIUM;
if (!playwrightPath || !executablePath) throw new Error("Set pinned HYFRME_PLAYWRIGHT_CORE and HYFRME_CHROMIUM for drawer geometry proof");
const require = createRequire(import.meta.url);
const { chromium } = require(playwrightPath);
const preview = resolve(project, "compositions/custom-anchor-preview.html");
await writeFile(preview, source.toString().replace("<template>", "").replace("</template>", "")
  .replace("<head>", `<head><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden}</style><script>window.__hyperframes={getVariables:()=>(${JSON.stringify(overrides)})}</script>`));
const browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const popupGeometry = {};
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 659 }, deviceScaleFactor: 1, colorScheme: theme });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(pathToFileURL(preview).href, { waitUntil: "load" });
  const initialized = await page.evaluate(() => ({
    timeline: Boolean(window.__timelines?.["t3-prompt-stash"]),
    root: Boolean(document.querySelector('#root [data-t3-theme]')),
    gsap: Boolean(window.gsap),
  }));
  if (!initialized.timeline) throw new Error(`Edited drawer preview did not initialize: ${JSON.stringify({ ...initialized, pageErrors })}`);
  for (const [phase, frame] of [["menu", 45], ["persisted-menu", 65]]) {
    await page.evaluate((seconds) => {
      const timeline = window.__timelines["t3-prompt-stash"];
      timeline.time(seconds);
      for (const tween of timeline.getChildren()) tween.vars.onUpdate?.();
    }, frame / 30);
    const box = await page.locator(`[data-t3-theme="${theme}"] [data-t3-state="${phase}"] [data-composer-stash-drawer="true"]`).boundingBox();
    if (!box || Math.abs(box.x - 366) > 0.5 || Math.abs(box.y - 407) > 0.5 ||
      Math.abs(box.width - 724) > 0.5 || Math.abs(box.height - 73) > 0.5) {
      throw new Error(`Customized ${theme} ${phase} drawer moved: ${JSON.stringify(box)}`);
    }
    popupGeometry[phase] = box;
  }
} finally {
  await browser.close();
}
await writeFile(resolve(project, "proof.json"), JSON.stringify({ theme, fullCheck: true, strictRenderFrames: 120,
  compositionSha256: createHash("sha256").update(source).digest("hex"),
  popupGeometry, popupGeometrySource: "Pinned Chrome Headless Shell Playwright at 1200x659 with the edited candidate",
  checked: ["project", "threads", "conversation", "prompt", "stash drawer", "direct restore", "state timing", "appearance"] }, null, 2) + "\n");
console.log(`Customized ${theme} full check, strict 120-frame render, and visible state assertions passed.`);
