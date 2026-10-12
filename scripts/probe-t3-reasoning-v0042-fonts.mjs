import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const work = resolve(root, ".work/t3-reasoning-v0042-fonts");
const candidate = resolve(root, ".work/t3-reasoning-v0042-candidate");
const executablePath = process.env.HYFRME_CHROMIUM;
if (!executablePath) throw new Error("Set HYFRME_CHROMIUM to the pinned Chrome executable");
const log = await readFile(resolve(root, ".work/t3-v0042-composer-server.log"), "utf8");
const pairingUrl = log.match(/Pairing URL: (\S+)/)?.[1];
if (!pairingUrl) throw new Error("Start the isolated composer server before probing fonts");
const reference = JSON.parse(await readFile(resolve(root, "assets/t3-code/v0.0.42/brief-v0042-fixture.json"), "utf8"));
console.log("probe: official CSS fetch");
const response = await fetch(new URL("/assets/main-x9o7QJ8O.css", pairingUrl), { signal: AbortSignal.timeout(15000) });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
if (!response.ok || hash(Buffer.from(await response.arrayBuffer())) !== reference.sourceHashes.css) {
  throw new Error("Native font probe is not using the official v0.0.42 CSS");
}
console.log("probe: official CSS verified");
await mkdir(work, { recursive: true });
const block = await readFile(resolve(candidate, "t3-reasoning-level.html"), "utf8");
const template = block.match(/<template>([\s\S]*?)<\/template>/)?.[1];
if (!template) throw new Error("Candidate template missing");
await copyFile(resolve(candidate, "t3-code-gsap.min.js"), resolve(work, "t3-code-gsap.min.js"));
await writeFile(resolve(work, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden}</style></head><body>${template}</body></html>`);

const sample = async (page) => page.evaluate(() => {
  const menu = document.querySelector('[data-slot="menu-popup"]:not([hidden])') ?? document.querySelector('[data-slot="menu-popup"]');
  const row = [...document.querySelectorAll('[data-slot="menu-radio-item"]')].find((item) => item.textContent?.trim().startsWith("Medium"));
  const label = row?.querySelector(".truncate");
  const title = [...document.querySelectorAll('[data-slot="menu-group"]')].find((group) => group.textContent?.includes("Reasoning"))?.querySelector(".font-medium");
  const badge = row?.querySelector('[data-slot="badge"]');
  const trigger = document.querySelector('[data-composer-shortcut="composer.effort"]');
  const fields = (element) => {
    if (!element) return null;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      fontFamily: style.fontFamily, fontSize: style.fontSize, fontWeight: style.fontWeight,
      lineHeight: style.lineHeight, letterSpacing: style.letterSpacing, fontKerning: style.fontKerning,
      fontSynthesis: style.fontSynthesis, fontVariationSettings: style.fontVariationSettings,
      textRendering: style.textRendering, webkitFontSmoothing: style.webkitFontSmoothing,
      color: style.color, backgroundColor: style.backgroundColor,
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    };
  };
  return {
    devicePixelRatio: devicePixelRatio,
    html: fields(document.documentElement), body: fields(document.body),
    stage: fields(document.querySelector(".t3-stage")), menu: fields(menu),
    row: fields(row), label: fields(label), title: fields(title), badge: fields(badge), trigger: fields(trigger),
  };
});

console.log("probe: launch browser");
const browser = await chromium.launch({ executablePath, headless: true, args: [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none",
  "--force-color-profile=srgb", "--use-gl=angle", "--use-angle=gl-egl",
  "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
] });
console.log("probe: browser launched");
const results = {};
try {
  console.log("probe: native page");
  const native = await browser.newPage({ viewport: reference.viewport, deviceScaleFactor: 1, colorScheme: "dark" });
  await native.clock.setFixedTime(new Date("2026-09-25T11:30:00Z"));
  console.log("probe: native navigation");
  await native.goto(pairingUrl, { waitUntil: "domcontentloaded" });
  console.log("probe: native editor");
  await native.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  await native.waitForTimeout(900);
  await native.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  console.log("probe: native fonts");
  await native.evaluate(() => document.fonts.ready);
  const trigger = native.locator('[data-composer-shortcut="composer.effort"]').first();
  console.log("probe: native trigger", (await trigger.innerText()).trim());
  if ((await trigger.innerText()).trim() !== "Medium") {
    await trigger.click();
    await native.getByRole("menuitemradio", { name: /^Medium(?:\s|$)/ }).first().click();
  }
  await trigger.click();
  console.log("probe: native menu");
  await native.locator('[data-slot="menu-popup"]').waitFor({ state: "visible" });
  results.native = await sample(native);
  await writeFile(resolve(work, "native.json"), JSON.stringify(results.native, null, 2) + "\n");

  console.log("probe: port page");
  const port = await browser.newPage({ viewport: reference.viewport, deviceScaleFactor: 1, colorScheme: "dark" });
  console.log("probe: port navigation");
  await port.goto(pathToFileURL(resolve(work, "index.html")).href, { waitUntil: "domcontentloaded" });
  console.log("probe: port fonts");
  await port.evaluate(() => document.fonts.ready);
  console.log("probe: port hidden-menu style sample");
  console.log("probe: port sample");
  results.port = await sample(port);
  console.log("probe: close browser");
} finally {
  await browser.close();
}
await writeFile(resolve(work, "result.json"), JSON.stringify(results, null, 2) + "\n");
for (const element of ["html", "body", "stage", "menu", "row", "label", "title", "badge", "trigger"]) {
  const native = results.native[element];
  const port = results.port[element];
  if (!native && !port) continue;
  console.log(`${element}: ${JSON.stringify({ native, port })}`);
}
