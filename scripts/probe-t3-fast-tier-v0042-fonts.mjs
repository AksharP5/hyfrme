import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const work = resolve(root, ".work/t3-fast-tier-v0042-fonts");
const candidate = resolve(root, ".work/t3-fast-tier-v0042-candidate");
const executablePath = process.env.HYFRME_CHROMIUM;
if (!executablePath) throw new Error("Set HYFRME_CHROMIUM to the pinned Chrome executable");
const log = await readFile(resolve(root, ".work/t3-v0042-composer-server.log"), "utf8");
const pairingUrl = log.match(/Pairing URL: (\S+)/)?.[1];
if (!pairingUrl) throw new Error("Start the isolated composer server before probing fonts");
const reference = JSON.parse(await readFile(resolve(root, "assets/t3-code/v0.0.42/brief-v0042-fixture.json"), "utf8"));
const response = await fetch(new URL("/assets/main-x9o7QJ8O.css", pairingUrl), { signal: AbortSignal.timeout(15000) });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
if (!response.ok || hash(Buffer.from(await response.arrayBuffer())) !== reference.sourceHashes.css) {
  throw new Error("Native font probe is not using the official v0.0.42 CSS");
}
await mkdir(work, { recursive: true });
const block = await readFile(resolve(candidate, "t3-fast-service-tier.html"), "utf8");
const template = block.match(/<template>([\s\S]*?)<\/template>/)?.[1];
if (!template) throw new Error("Candidate template missing");
await copyFile(resolve(candidate, "t3-code-gsap.min.js"), resolve(work, "t3-code-gsap.min.js"));
await writeFile(resolve(work, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden}</style></head><body>${template}</body></html>`);

const sample = async (page) => page.evaluate(() => {
  const row = [...document.querySelectorAll('[role="menuitemradio"]')].find((item) =>
    item.textContent?.trim().startsWith("Fast") && item.getBoundingClientRect().width > 0);
  const title = row?.querySelector(".truncate");
  const description = [...(row?.querySelectorAll("span") ?? [])].find((span) => span.textContent?.trim() === "2x speed, increased usage");
  const popup = row?.closest('[data-slot="menu-popup"]');
  const positioner = row?.closest('[data-slot="menu-positioner"]');
  const field = (element) => {
    if (!element) return null;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      text: element.textContent?.trim().slice(0, 80),
      fontFamily: style.fontFamily, fontSize: style.fontSize, fontWeight: style.fontWeight,
      lineHeight: style.lineHeight, letterSpacing: style.letterSpacing, fontKerning: style.fontKerning,
      fontSynthesis: style.fontSynthesis, fontVariationSettings: style.fontVariationSettings,
      fontOpticalSizing: style.fontOpticalSizing, fontFeatureSettings: style.fontFeatureSettings,
      fontStretch: style.fontStretch, fontStyle: style.fontStyle, fontVariant: style.fontVariant,
      textRendering: style.textRendering, webkitFontSmoothing: style.webkitFontSmoothing,
      color: style.color, backgroundColor: style.backgroundColor,
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    };
  };
  return {
    devicePixelRatio, html: field(document.documentElement), body: field(document.body),
    stage: field(document.querySelector(".t3-stage")), positioner: field(positioner), popup: field(popup),
    row: field(row), title: field(title), description: field(description),
  };
});

const browser = await chromium.launch({ executablePath, headless: true, args: [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none",
  "--force-color-profile=srgb", "--use-gl=angle", "--use-angle=gl-egl",
  "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
] });
const results = {};
try {
  const native = await browser.newPage({ viewport: reference.viewport, deviceScaleFactor: 1, colorScheme: "dark" });
  await native.clock.setFixedTime(new Date("2026-09-25T11:30:00Z"));
  await native.goto(pairingUrl, { waitUntil: "domcontentloaded" });
  await native.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  await native.waitForTimeout(900);
  await native.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await native.evaluate(() => document.fonts.ready);
  const trigger = native.locator('[data-composer-shortcut="composer.effort"]').first();
  const portal = native.locator('[data-base-ui-portal]:has([data-slot="menu-popup"])').last();
  if ((await trigger.locator(".truncate").innerText()).trim() !== "High") {
    await trigger.click();
    await portal.getByRole("menuitemradio", { name: /^High(?:\s|$)/ }).first().click();
  }
  await trigger.click();
  await portal.getByRole("menuitemradio", { name: /^Fast(?:\s|$)/ }).first().hover();
  results.native = await sample(native);

  const port = await browser.newPage({ viewport: reference.viewport, deviceScaleFactor: 1, colorScheme: "dark" });
  await port.goto(pathToFileURL(resolve(work, "index.html")).href, { waitUntil: "domcontentloaded" });
  await port.evaluate(() => document.fonts.ready);
  await port.evaluate(() => {
    const states = [...document.querySelectorAll('[data-t3-popup]')];
    states[0].hidden = true;
    states[1].hidden = false;
  });
  results.port = await sample(port);
} finally {
  await browser.close();
}
await writeFile(resolve(work, "result.json"), JSON.stringify(results, null, 2) + "\n");
for (const element of ["html", "body", "stage", "positioner", "popup", "row", "title", "description"]) {
  const native = results.native[element];
  const port = results.port[element];
  if (!native && !port) continue;
  console.log(`${element}: ${JSON.stringify({ native, port })}`);
}
