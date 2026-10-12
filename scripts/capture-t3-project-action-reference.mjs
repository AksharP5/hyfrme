import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const url = process.env.T3_REFERENCE_URL;
const storageState = process.env.T3_STORAGE_STATE;
if (!url || !storageState) throw new Error("Set T3_REFERENCE_URL and T3_STORAGE_STATE for the isolated pinned T3 Code fixture.");

const source = resolve(root, "assets/t3-code/v0.0.35");
const baseFixture = JSON.parse(await readFile(resolve(source, "brief-fixture.json"), "utf8"));
const work = resolve(root, ".work/t3-project-action-reference");
const reference = resolve(root, "parity/t3-project-action-reference.mkv");
const phases = ["before", "dialog", "named", "command", "shortcut", "saved", "menu"];
const events = [
  ["dialog", 20], ["named", 45], ["command", 65],
  ["shortcut", 85], ["saved", 100], ["menu", 110],
];
const frames = 120;
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
for (const [path, expected] of [
  ["/", baseFixture.sourceHashes.index],
  ["/assets/index-DSuALXPn.css", baseFixture.sourceHashes.css],
  ["/assets/index-CI6tzIRc.js", baseFixture.sourceHashes.js],
]) {
  const response = await fetch(new URL(path, url));
  if (!response.ok || hash(Buffer.from(await response.arrayBuffer())) !== expected) {
    throw new Error(`${path} differs from the pinned T3 Code build`);
  }
}
await mkdir(work, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.HYFRME_CHROMIUM ?? "/usr/bin/chromium",
  headless: true,
  args: [
    "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none",
    "--force-color-profile=srgb", "--use-gl=angle", "--use-angle=gl-egl",
    "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
  ],
});
try {
  const page = await browser.newPage({
    viewport: baseFixture.viewport,
    deviceScaleFactor: 1,
    colorScheme: "dark",
    storageState,
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  await page.getByText("Build a logo intro", { exact: true }).click();
  await page.waitForURL(/hyfrme-fixture-logo-intro/);
  await page.waitForTimeout(1500);
  await page.locator('button[aria-label="Dismiss notification"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.mouse.move(800, 50);
  await page.waitForTimeout(400);

  const snapshot = async (phase) => {
    const state = await page.evaluate(() => {
      const cloneWithValues = (element) => {
        const clone = element.cloneNode(true);
        const inputs = element.querySelectorAll("input, textarea");
        const clonedInputs = clone.querySelectorAll("input, textarea");
        inputs.forEach((input, index) => {
          const target = clonedInputs[index];
          if (input instanceof HTMLTextAreaElement) target.textContent = input.value;
          else target.setAttribute("value", input.value);
        });
        return clone.outerHTML;
      };
      return {
        html: document.querySelector("#root").innerHTML,
        portals: [...document.querySelectorAll("[data-base-ui-portal]")]
          .filter((portal) => portal.children.length > 0 && !portal.getAttribute("data-slot")?.startsWith("toast-portal") && getComputedStyle(portal).display !== "none")
          .map(cloneWithValues),
      };
    });
    const sanitize = (html) => html
      .replaceAll("/tmp/hyfrme-t3-demo/registry/blocks/", "registry/blocks/")
      .replaceAll("/tmp/hyfrme-t3-demo", "hyfrme-project");
    const safe = { html: sanitize(state.html), portals: state.portals.map(sanitize) };
    const serialized = JSON.stringify(safe);
    if (/\/home\/|\/tmp\/hyfrme-t3|127\.0\.0\.1:38\d\d|blob:|playwright-state|auth[_-]?token|session[_-]?token/i.test(serialized)) {
      throw new Error(`Local or private content in ${phase} source snapshot`);
    }
    await writeFile(resolve(source, `project-action-${phase}.html`), safe.html);
    await writeFile(resolve(source, `project-action-${phase}-portals.json`), `${JSON.stringify(safe.portals)}\n`);
  };
  await snapshot("before");

  for (let frame = 0; frame < frames; frame++) {
    if (frame === 20) {
      await page.getByRole("button", { name: "Add action", exact: true }).click();
      await page.locator("#script-name").waitFor({ timeout: 10000 });
      await page.waitForTimeout(220);
      await snapshot("dialog");
    }
    if (frame === 45) {
      await page.locator("#script-name").fill("Verify Hyfrme");
      await page.waitForTimeout(150);
      await snapshot("named");
    }
    if (frame === 65) {
      await page.locator("#script-command").fill("npm run check");
      await page.waitForTimeout(150);
      await snapshot("command");
    }
    if (frame === 85) {
      await page.locator("#script-keybinding").press("Control+Shift+V");
      await page.waitForTimeout(150);
      await snapshot("shortcut");
    }
    if (frame === 100) {
      await page.getByRole("button", { name: "Save action" }).click();
      await page.locator("#script-name").waitFor({ state: "hidden", timeout: 12000 });
      await page.locator('button[aria-label="Dismiss notification"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
      await page.mouse.move(800, 50);
      await page.waitForTimeout(180);
      await snapshot("saved");
    }
    if (frame === 110) {
      await page.getByRole("button", { name: "Script actions" }).click();
      await page.getByRole("menuitem", { name: /Verify Hyfrme/ }).waitFor({ timeout: 10000 });
      await page.waitForTimeout(180);
      await snapshot("menu");
    }
    await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
} finally {
  await browser.close();
}

const encode = spawnSync("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y", "-framerate", "30",
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3",
  "-pix_fmt", "gbrp", reference,
], { encoding: "utf8" });
if (encode.status !== 0) throw new Error(encode.stderr);
await writeFile(resolve(source, "project-action-fixture.json"), `${JSON.stringify({
  sourceTag: baseFixture.sourceTag,
  sourceCommit: baseFixture.sourceCommit,
  sourceHashes: baseFixture.sourceHashes,
  viewport: baseFixture.viewport,
  fps: 30,
  frames,
  phases,
  events: Object.fromEntries(events),
  sourceDomHashes: Object.fromEntries(await Promise.all(phases.map(async (phase) => [
    phase, hash(await readFile(resolve(source, `project-action-${phase}.html`))),
  ]))),
  portalHashes: Object.fromEntries(await Promise.all(phases.map(async (phase) => [
    phase, hash(await readFile(resolve(source, `project-action-${phase}-portals.json`))),
  ]))),
  referenceSha256: hash(await readFile(reference)),
}, null, 2)}\n`);
console.log(`Captured ${frames} native T3 Code Project Action frames.`);
