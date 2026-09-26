import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { copyFile, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const name = "t3-thread-archive";
const theme = process.env.T3_CUSTOM_THEME ?? "dark";
if (!["dark", "light"].includes(theme)) throw new Error("T3_CUSTOM_THEME must be dark or light");
const executablePath = process.env.HYFRME_CHROMIUM;
if (!executablePath) throw new Error("Set HYFRME_CHROMIUM to the pinned Chrome executable");
const project = resolve(root, `.work/${name}-v0042-${theme}-custom`);
const candidate = await readFile(resolve(root, `.work/${name}-v0042-candidate/${name}.html`));
const installed = await readFile(resolve(project, "compositions", `${name}.html`));
if (!candidate.equals(installed)) throw new Error("Custom proof composition differs from the current candidate");
const overrides = JSON.parse(await readFile(resolve(project, "overrides.json"), "utf8"));
const template = candidate.toString().match(/<template>([\s\S]*?)<\/template>/)?.[1];
if (!template) throw new Error("Candidate composition template is missing");
const pageFile = resolve(project, "compositions", "archive-menu-anchor.html");
await writeFile(pageFile, `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden}</style></head><body><script>window.__hyperframes={getVariables:()=>(${JSON.stringify(overrides).replaceAll("</", "<\\/")})}</script>${template}</body></html>`);
const browser = await chromium.launch({ executablePath, headless: true, args: [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
  "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
] });
let geometry;
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 659 }, deviceScaleFactor: 1, colorScheme: theme });
  await page.goto(pathToFileURL(pageFile).href, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  geometry = await page.evaluate(({ name, time }) => {
    window.__timelines[name].seek(time, false);
    const stage = document.querySelector(`#root [data-t3-theme="${window.__hyperframes.getVariables().theme}"]`);
    const menuState = stage.querySelector('[data-t3-state="menu"]');
    const trigger = menuState.querySelector('[aria-label^="Thread actions for "]');
    const menu = menuState.querySelector('.dropdown-glass[data-level="0"]');
    const box = (element) => {
      const bounds = element.getBoundingClientRect();
      return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
    };
    return { trigger: box(trigger), menu: box(menu), menuText: menu.textContent,
      triggerLabel: trigger.getAttribute("aria-label"), nativePopupHidden: stage.querySelector('.t3-native-popup').hidden,
      stageHidden: stage.hidden, menuStateHidden: menuState.hidden, timelineTime: window.__timelines[name].time() };
  }, { name, time: (overrides.menuFrame + 10) / 30 });
} finally {
  await browser.close();
}
const horizontalError = Math.abs(geometry.menu.x - geometry.trigger.x);
const verticalError = Math.abs(geometry.menu.y - geometry.trigger.y - geometry.trigger.height - 4);
if (horizontalError > 1 || verticalError > 1 || !geometry.nativePopupHidden ||
    geometry.trigger.x < 380 || !geometry.triggerLabel.includes(overrides.targetThread) ||
    !geometry.menuText.includes(overrides.archiveAction)) {
  throw new Error(`Edited ${theme} menu is not attached to its title trigger: ${JSON.stringify(geometry)}`);
}
await copyFile(resolve(project, "render/frame_000031.png"), resolve(project, "archive-menu-anchor.png"));
const proofPath = resolve(project, "proof.json");
const proof = JSON.parse(await readFile(proofPath, "utf8"));
const compositionSha256 = createHash("sha256").update(candidate).digest("hex");
if (proof.compositionSha256 !== compositionSha256) throw new Error("Custom render proof is stale");
proof.menuAnchor = { horizontalError, verticalError, trigger: geometry.trigger, menu: geometry.menu,
  nativePopupHidden: geometry.nativePopupHidden, screenshot: `archive-menu-anchor.png` };
await writeFile(proofPath, JSON.stringify(proof, null, 2) + "\n");
console.log(`Edited ${theme} menu anchored to title trigger: horizontal=${horizontalError.toFixed(3)}px, vertical=${verticalError.toFixed(3)}px`);
