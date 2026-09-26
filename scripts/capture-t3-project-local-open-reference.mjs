import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.35");
const base = JSON.parse(await readFile(resolve(source, "brief-fixture.json"), "utf8"));
const url = process.env.T3_REFERENCE_URL;
const executablePath = process.env.HYFRME_CHROMIUM;
if (!url || !executablePath) throw new Error("Set isolated T3 URL and Chromium path.");
const storage = resolve(root, ".work/t3-project-local-open-fixture/playwright-state.json");
const version = spawnSync(executablePath, ["--version"], { encoding: "utf8" });
if (version.status !== 0 || version.stdout.trim() !== "Google Chrome for Testing 152.0.7977.30") {
  throw new Error("Unexpected Chromium build for pinned T3 capture.");
}
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
for (const [path, expected] of [
  ["/", base.sourceHashes.index],
  ["/assets/index-DSuALXPn.css", base.sourceHashes.css],
  ["/assets/index-CI6tzIRc.js", base.sourceHashes.js],
]) {
  const response = await fetch(new URL(path, url));
  if (!response.ok || hash(Buffer.from(await response.arrayBuffer())) !== expected) {
    throw new Error(`${path} differs from pinned T3 Code v0.0.35`);
  }
}
const frames = 120;
const fps = 30;
const phases = ["before", "source", "browse", "selected", "added"];
const events = { source: 15, browse: 35, selected: 60, added: 85 };
const projectPath = "/var/tmp/hyfrme-motion-lab";
const work = resolve(root, ".work/t3-project-local-open-reference");
const reference = resolve(root, "parity/t3-project-local-open-reference.mkv");
const flags = [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
  "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
];
await mkdir(work, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true, args: flags });
const observed = {};
try {
  const page = await browser.newPage({ viewport: base.viewport, deviceScaleFactor: 1, colorScheme: "dark", storageState: storage });
  await page.clock.setFixedTime(new Date());
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  await page.getByText("Build a logo intro", { exact: true }).click();
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(800, 50);
  await page.waitForTimeout(550);
  const saveRoot = async (phase) => {
    const html = (await page.locator("#root").evaluate((element) => element.innerHTML))
      .replaceAll("/tmp/hyfrme-t3-demo/registry/blocks/", "registry/blocks/")
      .replaceAll("/tmp/hyfrme-t3-demo", "hyfrme-demo");
    if (/\/home\/|auth[_-]?token|session[_-]?token|127\.0\.0\.1:38\d\d/i.test(html)) {
      throw new Error(`Private fixture content in ${phase} root`);
    }
    await writeFile(resolve(source, `project-local-open-${phase}.html`), html);
    observed[phase] = {
      heading: (await page.locator("h1, h2").allTextContents()).slice(0, 6),
      projectVisible: await page.getByText("hyfrme-motion-lab", { exact: true }).count() > 0,
    };
  };
  const savePortal = async (phase) => {
    const html = await page.locator('[data-base-ui-portal]:has([data-testid="command-palette"])')
      .evaluate((element) => element.outerHTML);
    if (/\/home\/|auth[_-]?token|session[_-]?token/i.test(html)) {
      throw new Error(`Private fixture content in ${phase} palette`);
    }
    await writeFile(resolve(source, `project-local-open-${phase}-portal.html`), html);
    const palette = page.getByTestId("command-palette");
    observed[phase].query = await palette.locator("input").first().inputValue();
    observed[phase].options = await palette.getByRole("option").allTextContents();
    observed[phase].buttons = await palette.getByRole("button").allTextContents();
  };
  await saveRoot("before");
  for (let frame = 0; frame < frames; frame++) {
    if (frame === events.source) {
      await page.getByRole("button", { name: "New project" }).click();
      await page.getByTestId("command-palette").getByText("Local folder", { exact: true }).waitFor();
      await page.mouse.move(800, 50);
      await page.waitForTimeout(300);
      await saveRoot("source");
      await savePortal("source");
    }
    if (frame === events.browse) {
      const palette = page.getByTestId("command-palette");
      await palette.getByText("Local folder", { exact: true }).click();
      await palette.locator("input").first().fill("/var/tmp/hyfrme-motion");
      await palette.getByRole("option").filter({ hasText: "hyfrme-motion-lab" }).first().waitFor();
      await page.mouse.move(800, 50);
      await page.waitForTimeout(400);
      await saveRoot("browse");
      await savePortal("browse");
    }
    if (frame === events.selected) {
      const palette = page.getByTestId("command-palette");
      await palette.getByRole("option").filter({ hasText: "hyfrme-motion-lab" }).first().click();
      await palette.locator("input").first().waitFor();
      await page.waitForFunction(() => {
        const input = document.querySelector('[data-testid="command-palette"] input');
        return input?.value === "/var/tmp/hyfrme-motion-lab/";
      });
      await palette.getByRole("option").filter({ hasText: "docs" }).first().waitFor();
      await page.mouse.move(800, 50);
      await page.waitForTimeout(350);
      await saveRoot("selected");
      await savePortal("selected");
    }
    if (frame === events.added) {
      const palette = page.getByTestId("command-palette");
      await palette.getByRole("button", { name: /^Add/ }).click();
      await palette.waitFor({ state: "hidden", timeout: 20000 });
      await page.getByText("hyfrme-motion-lab", { exact: true }).first().waitFor({ timeout: 20000 });
      await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
      await page.mouse.move(800, 50);
      await page.waitForTimeout(700);
      await saveRoot("added");
    }
    await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
} finally {
  await browser.close();
}
if (observed.browse?.query !== "/var/tmp/hyfrme-motion" ||
    observed.selected?.query !== `${projectPath}/` ||
    !observed.added?.projectVisible) {
  throw new Error("Native local-project browse and add flow did not reach the real result.");
}
const encoded = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
if (encoded.status !== 0) throw new Error(encoded.stderr);
const sourceDomHashes = Object.fromEntries(await Promise.all(phases.map(async (phase) =>
  [phase, hash(await readFile(resolve(source, `project-local-open-${phase}.html`)))])));
const portalHashes = Object.fromEntries(await Promise.all(["source", "browse", "selected"].map(async (phase) =>
  [phase, hash(await readFile(resolve(source, `project-local-open-${phase}-portal.html`)))])));
await writeFile(resolve(source, "project-local-open-fixture.json"), `${JSON.stringify({
  sourceTag: base.sourceTag, sourceCommit: base.sourceCommit, sourceHashes: base.sourceHashes,
  captureBrowser: { version: version.stdout.trim(), flags }, viewport: base.viewport,
  fps, frames, phases, events, projectPath, observed, sourceDomHashes, portalHashes,
  referenceSha256: hash(await readFile(reference)),
}, null, 2)}\n`);
console.log(`Captured ${frames} native T3 Code local-project browse and add frames.`);
