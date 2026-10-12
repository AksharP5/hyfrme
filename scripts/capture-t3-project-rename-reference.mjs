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

const database = resolve(root, ".work/t3-project-rename-fixture/userdata/state.sqlite");
const dbProjects = () => {
  const result = spawnSync("sqlite3", [database,
    "select title from projection_projects where deleted_at is null order by title;"], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout.trim().split("\n");
};
const projectsBefore = dbProjects();
if (projectsBefore.join("|") !== "hyfrme|hyfrme-motion-lab") {
  throw new Error(`Expected clean isolated Hyfrme projects: ${projectsBefore}`);
}
const phases = ["workspace", "menu", "settings", "editing", "renamed", "returned"];
const events = { menu: 20, settings: 35, editing: 55, renamed: 75, returned: 95 };
const frames = 120;
const fps = 30;
const work = resolve(root, ".work/t3-project-rename-reference");
const reference = resolve(root, "parity/t3-project-rename-reference.mkv");
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
  await page.waitForTimeout(1400);
  const dismiss = async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const buttons = page.locator('button[data-slot="toast-close"]');
      if (!await buttons.count()) break;
      await buttons.first().click();
      await page.waitForTimeout(350);
    }
  };
  await dismiss();
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(800, 50);
  const clean = (html) => html.replaceAll("/tmp/hyfrme-t3-demo", "hyfrme-demo");
  const save = async (phase) => {
    const html = clean(await page.locator("#root").evaluate((element) => {
      const clone = element.cloneNode(true);
      const live = element.querySelectorAll("input,textarea");
      const copied = clone.querySelectorAll("input,textarea");
      for (let index = 0; index < live.length; index++) {
        if (copied[index] instanceof HTMLInputElement) copied[index].setAttribute("value", live[index].value);
        if (copied[index] instanceof HTMLTextAreaElement) copied[index].textContent = live[index].value;
      }
      return clone.innerHTML;
    }));
    if (/\/home\/|\/tmp\/hyfrme-t3|127\.0\.0\.1:39\d\d|auth[_-]?token|session[_-]?token/i.test(html)) {
      throw new Error(`Private fixture content in ${phase} root`);
    }
    await writeFile(resolve(source, `project-rename-${phase}.html`), html);
    observed[phase] = { path: new URL(page.url()).pathname, title: await page.title() };
  };
  const savePortal = async () => {
    const popup = page.getByRole("menu").filter({ has: page.getByRole("menuitemradio") }).first();
    const html = clean(await popup.evaluate((element) => element.outerHTML));
    if (/\/home\/|auth[_-]?token|session[_-]?token/i.test(html)) throw new Error("Private project menu content");
    await writeFile(resolve(source, "project-rename-menu-portal.html"), html);
  };
  await save("workspace");
  const nameInput = page.getByRole("textbox", { name: "Project name" });
  for (let frame = 0; frame < frames; frame++) {
    await dismiss();
    if (frame === events.menu) {
      await page.getByRole("button", { name: "Filter threads by project" }).click();
      await page.getByRole("button", { name: "Project settings for hyfrme", exact: true }).waitFor();
      await page.mouse.move(800, 50);
      await page.waitForTimeout(250);
      await save("menu");
      await savePortal();
    }
    if (frame === events.settings) {
      await page.getByRole("button", { name: "Project settings for hyfrme", exact: true }).click();
      await nameInput.waitFor({ timeout: 10000 });
      if (await nameInput.inputValue() !== "hyfrme") throw new Error("Native project settings opened on wrong group");
      await page.mouse.move(800, 50);
      await page.waitForTimeout(300);
      await save("settings");
    }
    if (frame === events.editing) {
      await nameInput.fill("hyfrme-studio");
      if (await nameInput.inputValue() !== "hyfrme-studio") throw new Error("Native project name input did not edit");
      await page.mouse.move(800, 50);
      await save("editing");
    }
    if (frame === events.renamed) {
      await nameInput.press("Enter");
      await page.getByRole("textbox", { name: "Project name" }).waitFor();
      await page.waitForFunction(() => document.querySelector('input[aria-label="Project name"]')?.value === "hyfrme-studio");
      await page.waitForTimeout(400);
      await save("renamed");
      if (dbProjects().join("|") !== "hyfrme-motion-lab|hyfrme-studio") {
        throw new Error(`Native project rename did not persist: ${dbProjects()}`);
      }
    }
    if (frame === events.returned) {
      await page.keyboard.press("Escape");
      await page.getByText("Build a logo intro", { exact: true }).first().waitFor({ timeout: 10000 });
      await page.mouse.move(800, 50);
      await page.waitForTimeout(350);
      await save("returned");
    }
    if (await page.getByText(/Updates Available/).isVisible().catch(() => false)) {
      throw new Error(`Native update toast remained visible at frame ${frame}`);
    }
    await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  observed.reloadProject = (await page.getByRole("button", { name: "Filter threads by project" }).innerText()).trim();
} finally {
  await browser.close();
}
const projectsAfter = dbProjects();
await writeFile(resolve(work, "observed.json"), `${JSON.stringify({ observed, projectsBefore, projectsAfter }, null, 2)}\n`);
if (projectsAfter.join("|") !== "hyfrme-motion-lab|hyfrme-studio" ||
    !observed.settings?.path.startsWith("/projects/") ||
    !observed.renamed?.path.startsWith("/projects/") ||
    observed.returned?.path !== observed.workspace?.path) {
  throw new Error(`Native project rename flow differed: ${JSON.stringify({ observed, projectsAfter })}`);
}
const encoded = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
if (encoded.status !== 0) throw new Error(encoded.stderr);
const sourceDomHashes = Object.fromEntries(await Promise.all(phases.map(async (phase) =>
  [phase, hash(await readFile(resolve(source, `project-rename-${phase}.html`)))])));
await writeFile(resolve(source, "project-rename-fixture.json"), `${JSON.stringify({
  sourceTag: base.sourceTag, sourceCommit: base.sourceCommit, sourceHashes: base.sourceHashes,
  captureBrowser: version.stdout.trim(), viewport: base.viewport, fps, frames, phases, events,
  projectsBefore, projectsAfter, observed, sourceDomHashes,
  portalHash: hash(await readFile(resolve(source, "project-rename-menu-portal.html"))),
  referenceSha256: hash(await readFile(reference)),
}, null, 2)}\n`);
console.log(`Captured ${frames} native T3 project-rename frames and verified persisted Hyfrme title.`);
