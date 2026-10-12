import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");

const root = resolve(import.meta.dirname, "..");
const name = "t3-file-mention";
const theme = process.env.T3_CUSTOM_THEME ?? "dark";
if (!["dark", "light"].includes(theme)) throw new Error("T3_CUSTOM_THEME must be dark or light");
const block = resolve(root, ".work/t3-file-mention-v0042-candidate");
const project = resolve(root, `.work/t3-file-mention-v0042-${theme}-custom`);
const source = await readFile(resolve(block, `${name}.html`));
const reuse = process.env.T3_CUSTOM_REUSE_RENDER === "1";
if (reuse && !source.equals(await readFile(resolve(project, "compositions", `${name}.html`)))) {
  throw new Error("The cached render does not match this candidate");
}
const overrides = {
  theme,
  projectName: "hyfrme-studio",
  projectAvatar: "HS",
  selectedThread: "Build a Hyfrme opener",
  secondThread: "Audit Hyfrme motion",
  branchName: "hyfrme/main",
  question: "Build a Hyfrme product opener. Hold the last frame for 24 frames.",
  replyLead: "I checked the motion timing in",
  replyFile: "hyfrme-timing.html",
  replyFilePath: "registry/blocks/hyfrme-timing/hyfrme-timing.html",
  replyTail: "The final frame can remain still while the clip runs longer.",
  workedFor: "Worked for 3m",
  inputPrefix: "Inspect",
  query: "hyfrme",
  resultOneLabel: "hyfrme-opener.html",
  resultOneDirectory: "registry/blocks/hyfrme-opener",
  resultTwoLabel: "hyfrme-opener",
  resultTwoDirectory: "registry/blocks",
  resultThreeLabel: "timeline.ts",
  resultThreeDirectory: "src",
  resultFourLabel: "hyfrme.json",
  resultFourDirectory: "configs",
  selectedFileLabel: "hyfrme-opener.html",
  selectedFilePath: "registry/blocks/hyfrme-opener/hyfrme-opener.html",
  atFrame: 16,
  resultsFrame: 36,
  highlightFrame: 62,
  chipFrame: 88,
};
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stderr.slice(-3000)}\n${result.stdout.slice(-1500)}`);
  return result;
};
await mkdir(resolve(project, "compositions"), { recursive: true });
for (const file of [`${name}.html`, "t3-code-gsap.min.js", ...["dark", "light"].flatMap((appearance) =>
  ["at", "results", "highlight"].map((phase) => `file-mention-v0042-${appearance}-${phase}-crop.png`))]) {
  await copyFile(resolve(block, file), resolve(project, "compositions", file));
}
await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:${theme === "light" ? "#fff" : "#0a0a0a"}}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-file-mention-v0042-custom-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escapeAttribute(JSON.stringify(overrides))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-file-mention-v0042-custom-fixture']=gsap.timeline({paused:true});</script></body></html>`);
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
const metadata = source.toString().match(/data-composition-variables='([^']+)'/)?.[1];
if (!metadata) throw new Error("Block has no editable variables");
const variables = JSON.parse(metadata.replaceAll("&amp;", "&").replaceAll("&#39;", "'"));
for (const key of Object.keys(overrides)) {
  if (!variables.some((variable) => variable.id === key)) throw new Error(`${key} is not an editable HyperFrames variable`);
}
for (const [frame, words, region] of [
  [10, ["Hyfrme opener"], null],
  [25, ["Inspect @"], "700x60+350+470"],
  [45, ["hyfrme-opener.html", "timeline"], "740x180+360+305"],
  [75, ["hyfrme-opener.html"], "740x180+360+305"],
  [105, ["hyfrme-opener.html"], "500x65+350+470"],
]) {
  const framePath = resolve(project, "render", `frame_${String(frame + 1).padStart(6, "0")}.png`);
  const readable = region ? resolve(project, `state-${frame}-ocr.png`) : framePath;
  if (region) run("magick", [framePath, "-crop", region, "+repage", "-resize", "300%", readable]);
  const ocr = run("tesseract", [readable, "stdout", ...(region ? ["--psm", "6"] : [])]).stdout;
  for (const word of words) if (!ocr.toLowerCase().includes(word.toLowerCase())) {
    throw new Error(`Customized ${theme} frame ${frame} lacks ${word}; OCR: ${ocr.slice(0, 700)}`);
  }
}
const projectHeader = resolve(project, "project-header-ocr.png");
run("magick", [resolve(project, "render/frame_000011.png"), "-crop", "220x45+270+0", "+repage", "-resize", "500%", projectHeader]);
const headerOcr = run("tesseract", [projectHeader, "stdout", "--psm", "6"]).stdout;
if (!headerOcr.includes(overrides.projectName)) throw new Error(`Customized ${theme} project header was not visible: ${headerOcr}`);
const before = await readFile(resolve(project, "render/frame_000011.png"));
const at = await readFile(resolve(project, "render/frame_000026.png"));
const results = await readFile(resolve(project, "render/frame_000046.png"));
const highlight = await readFile(resolve(project, "render/frame_000076.png"));
const chip = await readFile(resolve(project, "render/frame_000106.png"));
if (before.equals(at) || at.equals(results) || highlight.equals(chip)) {
  throw new Error("Edited file mention states have no visible transition");
}
const pixel = run("magick", [resolve(project, "render/frame_000011.png"), "-format", "%[pixel:p{800,300}]", "info:"]).stdout;
const level = Number(pixel.match(/\((\d+),\s*(\d+),\s*(\d+)/)?.[1]);
if (!Number.isFinite(level) || (theme === "light" ? level < 230 : level > 40)) {
  throw new Error(`Unexpected ${theme} appearance: ${pixel}`);
}
const debug = source.toString()
  .replace("<template>", "")
  .replace("</template>", "")
  .replace("<body>", `<body><script>window.__hyperframes={getVariables:()=>(${JSON.stringify(overrides).replaceAll("</", "<\\/")})};</script>`);
const debugPath = resolve(project, "compositions/debug-file-mention.html");
await writeFile(debugPath, debug);
const browser = await chromium.launch({ executablePath: process.env.HYFRME_CHROMIUM, headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb"] });
const geometry = {};
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 659 }, deviceScaleFactor: 1, colorScheme: theme });
  await page.goto(`file://${debugPath}`, { waitUntil: "load" });
  for (const [phase, frame] of [["at", 25], ["results", 45], ["highlight", 75]]) {
    const boxes = await page.evaluate(({ name, frame }) => {
      window.__timelines[name].progress(frame / 120);
      const stage = document.querySelector('.t3-stage:not([hidden])');
      const state = stage.querySelector('.t3-state:not([hidden])');
      const popup = state.querySelector('[data-composer-drawer-layer="true"]');
      const editor = state.querySelector('[data-testid="composer-editor"]');
      const rect = (element) => {
        const { x, y, width, height, bottom } = element.getBoundingClientRect();
        return { x, y, width, height, bottom };
      };
      return { state: state.dataset.t3State, popup: rect(popup), editor: rect(editor),
        rows: [...state.querySelectorAll('[data-composer-item-id]')].map((row) => row.textContent?.trim()) };
    }, { name, frame });
    if (boxes.state !== phase || Math.abs(boxes.popup.x - boxes.editor.x - 5) > 1 ||
      Math.abs(boxes.popup.bottom - boxes.editor.y) > 1 || boxes.popup.y >= boxes.editor.y ||
      boxes.popup.width < boxes.editor.width - 20) {
      throw new Error(`Edited ${theme} ${phase} popup is detached from its composer: ${JSON.stringify(boxes)}`);
    }
    if (phase !== "at" && (!boxes.rows[0]?.includes(overrides.resultOneLabel) ||
      !boxes.rows[3]?.includes(overrides.resultFourDirectory))) {
      throw new Error(`Edited ${theme} drawer results did not reflect the controls: ${JSON.stringify(boxes.rows)}`);
    }
    geometry[phase] = boxes;
  }
} finally {
  await browser.close();
}
await writeFile(resolve(project, "proof.json"), JSON.stringify({ theme, fullCheck: true, strictRenderFrames: 120,
  variableCount: variables.length, popupGeometry: geometry,
  checked: ["project", "conversation", "prompt", "query", "result rows", "chip", "state timing", "appearance", "edited popup anchor"] }, null, 2) + "\n");
console.log(`Customized ${theme} full check, strict 120-frame render, and visible state assertions passed.`);
