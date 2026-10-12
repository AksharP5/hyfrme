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
const serverLog = process.env.T3_SERVER_LOG;
const executablePath = process.env.HYFRME_CHROMIUM;
if (!url || !serverLog || !executablePath) throw new Error("Set isolated T3 URL, server log, and Chromium path.");
const pairingUrl = (await readFile(serverLog, "utf8")).match(/Pairing URL: (\S+)/)?.[1];
if (!pairingUrl || new URL(pairingUrl).origin !== new URL(url).origin) throw new Error("Missing or mismatched pairing URL");
const version = spawnSync(executablePath, ["--version"], { encoding: "utf8" });
if (version.status !== 0 || version.stdout.trim() !== "Google Chrome for Testing 152.0.7977.30") {
  throw new Error(`Unexpected Chromium version: ${version.stdout.trim()}`);
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
const database = resolve(root, ".work/t3-project-switch-fixture/userdata/state.sqlite");
const dbProjects = () => {
  const result = spawnSync("sqlite3", [database, "select title from projection_projects where deleted_at is null order by title;"], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout.trim().split("\n");
};
const projectsBefore = dbProjects();
if (projectsBefore.join("|") !== "hyfrme|hyfrme-motion-lab") {
  throw new Error(`Expected two real isolated Hyfrme projects: ${projectsBefore}`);
}

const frames = 120;
const fps = 30;
const phases = ["all", "menu", "motion", "motion-menu", "hyfrme", "hyfrme-menu"];
const events = { menu: 20, motion: 40, motionMenu: 60, hyfrme: 80, hyfrmeMenu: 100 };
const work = resolve(root, ".work/t3-project-switch-reference");
const reference = resolve(root, "parity/t3-project-switch-reference.mkv");
const workspace = resolve(root, ".work/t3-project-switch-workspaces");
await mkdir(work, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true, args: [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
  "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
] });
const observed = {};
try {
  const page = await browser.newPage({ viewport: base.viewport, deviceScaleFactor: 1, colorScheme: "dark" });
  await page.clock.setFixedTime(new Date());
  await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  await page.getByText("Build a logo intro", { exact: true }).first().click();
  await page.waitForTimeout(2500);
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
    await page.waitForTimeout(750);
  }
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(800, 50);
  await page.waitForTimeout(500);
  if (await page.getByText(/Updates Available/).isVisible().catch(() => false)) {
    await page.screenshot({ path: resolve(work, "undismissed-toast.png") });
    await writeFile(resolve(work, "undismissed-toast.html"), await page.getByText(/Updates Available/).first()
      .evaluate((element) => element.closest('[data-slot="toast"]')?.outerHTML ?? element.parentElement?.outerHTML ?? ""));
    throw new Error("Native update toast remained visible after initial cleanup");
  }
  const trigger = page.getByRole("button", { name: "Filter threads by project" });
  const item = (name) => page.getByRole("menuitemradio").filter({ hasText: name }).first();
  const clean = (html) => html.replaceAll(resolve(workspace, "hyfrme-motion-lab"), "hyfrme-motion-lab")
    .replaceAll(resolve(workspace, "hyfrme"), "hyfrme-project")
    .replaceAll("/tmp/hyfrme-t3-demo/registry/blocks/", "registry/blocks/")
    .replaceAll("/tmp/hyfrme-t3-demo", "hyfrme-demo")
    .replaceAll("/var/tmp/hyfrme-motion-lab", "hyfrme-motion-lab");
  const save = async (phase) => {
    const html = clean(await page.locator("#root").evaluate((element) => element.innerHTML));
    if (/\/home\/|\/tmp\/hyfrme-t3|127\.0\.0\.1:38\d\d|auth[_-]?token|session[_-]?token/i.test(html)) {
      throw new Error(`Private fixture content in ${phase} root`);
    }
    await writeFile(resolve(source, `project-switch-${phase}.html`), html);
    observed[phase] = {
      trigger: (await trigger.innerText()).trim(),
      rowTitles: await page.locator('[data-testid="sidebar-row-card"] div.mt-1 span').allTextContents(),
    };
  };
  const savePortal = async (phase) => {
    const popup = page.getByRole("menu").filter({ has: page.getByRole("menuitemradio") }).first();
    const html = clean(await popup.evaluate((element) => element.outerHTML));
    if (/\/home\/|auth[_-]?token|session[_-]?token/i.test(html)) throw new Error(`Private ${phase} menu`);
    await writeFile(resolve(source, `project-switch-${phase}-portal.html`), html);
    observed[phase].selected = await page.getByRole("menuitemradio").evaluateAll((items) =>
      items.filter((item) => item.getAttribute("aria-checked") === "true").map((item) => item.textContent?.trim()));
  };
  await save("all");
  for (let frame = 0; frame < frames; frame++) {
    if (frame === events.menu) {
      await trigger.click();
      await item("hyfrme-motion-lab").waitFor();
      await page.mouse.move(800, 50);
      await page.waitForTimeout(300);
      await save("menu");
      await savePortal("menu");
    }
    if (frame === events.motion) {
      await item("hyfrme-motion-lab").click();
      await page.waitForFunction(() => document.querySelector('button[aria-label="Filter threads by project"]')?.textContent?.includes("hyfrme-motion-lab"));
      await page.mouse.move(800, 50);
      await page.waitForTimeout(300);
      await save("motion");
    }
    if (frame === events.motionMenu) {
      await trigger.click();
      await item("hyfrme-motion-lab").waitFor();
      await page.mouse.move(800, 50);
      await page.waitForTimeout(300);
      await save("motion-menu");
      await savePortal("motion-menu");
    }
    if (frame === events.hyfrme) {
      await page.getByRole("menuitemradio").filter({ hasText: "hyfrme" })
        .filter({ hasNotText: "hyfrme-motion-lab" }).first().click();
      await page.waitForFunction(() => document.querySelector('button[aria-label="Filter threads by project"]')?.textContent?.trim() === "hyfrme");
      await page.mouse.move(800, 50);
      await page.waitForTimeout(300);
      await save("hyfrme");
    }
    if (frame === events.hyfrmeMenu) {
      await trigger.click();
      await item("hyfrme-motion-lab").waitFor();
      await page.mouse.move(800, 50);
      await page.waitForTimeout(300);
      await save("hyfrme-menu");
      await savePortal("hyfrme-menu");
    }
    await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  observed.reloadScope = (await page.getByRole("button", { name: "Filter threads by project" }).innerText()).trim();
} finally { await browser.close(); }
const projectsAfter = dbProjects();
await writeFile(resolve(work, "observed.json"), `${JSON.stringify({ observed, projectsBefore, projectsAfter }, null, 2)}\n`);
if (observed.all?.trigger !== "All projects" || observed.motion?.trigger !== "hyfrme-motion-lab" ||
    observed.hyfrme?.trigger !== "hyfrme" || !observed["motion-menu"]?.selected?.some((text) => text.includes("hyfrme-motion-lab")) ||
    !observed["hyfrme-menu"]?.selected?.some((text) => text === "hyfrme") ||
    observed.motion?.rowTitles.includes("Build a logo intro") || !observed.hyfrme?.rowTitles.includes("Build a logo intro") ||
    observed.reloadScope !== "All projects" || projectsAfter.join("|") !== projectsBefore.join("|")) {
  throw new Error(`Native project scope flow differs from source: ${JSON.stringify({ observed, projectsBefore, projectsAfter })}`);
}
const encoded = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
if (encoded.status !== 0) throw new Error(encoded.stderr);
const sourceDomHashes = Object.fromEntries(await Promise.all(phases.map(async (phase) =>
  [phase, hash(await readFile(resolve(source, `project-switch-${phase}.html`)))])));
const portalHashes = Object.fromEntries(await Promise.all(["menu", "motion-menu", "hyfrme-menu"].map(async (phase) =>
  [phase, hash(await readFile(resolve(source, `project-switch-${phase}-portal.html`)))])));
await writeFile(resolve(source, "project-switch-fixture.json"), `${JSON.stringify({
  sourceTag: base.sourceTag, sourceCommit: base.sourceCommit, sourceHashes: base.sourceHashes,
  captureBrowser: version.stdout.trim(), viewport: base.viewport, fps, frames, phases, events,
  projectsBefore, projectsAfter, observed, sourceDomHashes, portalHashes,
  referenceSha256: hash(await readFile(reference)),
}, null, 2)}\n`);
console.log(`Captured ${frames} native T3 project-scope frames; both project choices verified, reload reset documented.`);
