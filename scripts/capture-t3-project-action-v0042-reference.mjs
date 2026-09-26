import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { cp, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const release = resolve(root, ".work/t3-v0042-bin/t3-0.0.42-linux-x64");
const source = resolve(root, "assets/t3-code/v0.0.42");
const seedFixture = resolve(root, ".work/t3-v0042-composer-fixture");
const seedProject = resolve(root, ".work/t3-v0042-composer-project");
const base = JSON.parse(await readFile(resolve(source, "brief-v0042-fixture.json"), "utf8"));
const theme = process.env.T3_REFERENCE_THEME ?? "dark";
if (!["dark", "light"].includes(theme)) throw new Error("T3_REFERENCE_THEME must be dark or light");
const executablePath = process.env.HYFRME_CHROMIUM;
if (!executablePath) throw new Error("Set HYFRME_CHROMIUM to the pinned Chrome executable");
const runDir = await mkdtemp(resolve(root, `.work/t3-v0042-project-action-${theme}-`));
const baseDir = join(runDir, "fixture");
const project = join(runDir, "project");
const work = resolve(root, `.work/t3-v0042-project-action-${theme}-reference`);
const prefix = `project-action-v0042-${theme}`;
const reference = resolve(root, `parity/t3-project-action-v0042-${theme}-reference.mkv`);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const command = (program, args, cwd = root) => {
  const result = spawnSync(program, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${program} ${args[0]} failed: ${result.stderr}`);
  return result.stdout.trim();
};
if (command(resolve(release, "t3"), ["--version"]) !== "t3 v0.0.42") throw new Error("Wrong T3 Code release");
const browserVersion = command(executablePath, ["--version"]);
if (browserVersion !== "Google Chrome for Testing 152.0.7977.30") throw new Error(`Wrong capture browser: ${browserVersion}`);
await cp(seedFixture, baseDir, { recursive: true });
await cp(seedProject, project, { recursive: true });
const fixtureDb = resolve(baseDir, "userdata/state.sqlite");
const sqlPath = (path) => path.replaceAll("'", "''");
command("sqlite3", [fixtureDb, `UPDATE projection_projects SET workspace_root='${sqlPath(project)}' WHERE workspace_root='${sqlPath(seedProject)}';
  UPDATE projection_threads SET worktree_path='${sqlPath(project)}' WHERE worktree_path='${sqlPath(seedProject)}';`]);
const projectId = command("sqlite3", [fixtureDb, "SELECT project_id FROM projection_projects WHERE title='hyfrme';"]);
const scripts = async () => {
  const settings = JSON.parse(await readFile(resolve(baseDir, "userdata/settings.json"), "utf8"));
  return settings.projectSettingsOverrides?.[projectId]?.defaultProjectScripts ??
    settings.projectScriptOverrides?.[projectId] ?? [];
};
if ((await scripts()).length !== 0) throw new Error("Expected an isolated Hyfrme project with no saved actions");

const frames = 120;
const fps = 30;
const events = { dialog: 20, named: 40, command: 60, shortcut: 80, saved: 100, persisted: 106, menu: 112 };
const phases = ["before", ...Object.keys(events)];
const action = { name: "Verify Hyfrme", command: "npm run check", shortcut: "Control+Shift+V" };
const observed = { dialogMotion: {} };
const flags = [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
  "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
];
const server = spawn(resolve(release, "t3"), ["serve", "--mode", "desktop", "--base-dir", baseDir,
  "--port", theme === "dark" ? "4050" : "4051", "--host", "127.0.0.1", "--no-browser"],
{ cwd: root, stdio: ["ignore", "pipe", "pipe"] });
let output = "";
for (const stream of [server.stdout, server.stderr]) stream.on("data", (chunk) => { output += chunk; });
try {
  let pairingUrl;
  for (let attempt = 0; attempt < 120; attempt++) {
    pairingUrl = output.match(/Pairing URL: (\S+)/)?.[1];
    if (pairingUrl) break;
    if (server.exitCode !== null) throw new Error(`Official server exited before pairing: ${output}`);
    await new Promise((done) => setTimeout(done, 250));
  }
  if (!pairingUrl) throw new Error(`Official server did not produce a pairing URL: ${output}`);
  for (const [key, path] of [["index", "/"], ["css", "/assets/main-x9o7QJ8O.css"], ["js", "/assets/index-BMH8bO9q.js"]]) {
    const response = await fetch(new URL(path, pairingUrl));
    if (!response.ok || hash(Buffer.from(await response.arrayBuffer())) !== base.sourceHashes[key]) {
      throw new Error(`${key} differs from pinned official release`);
    }
  }
  await mkdir(work, { recursive: true });
  const browser = await chromium.launch({ executablePath, headless: true, args: flags });
  try {
    const page = await browser.newPage({ viewport: base.viewport, deviceScaleFactor: 1, colorScheme: theme });
    await page.clock.setFixedTime(new Date("2026-09-25T11:30:00Z"));
    await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
    await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
    await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.move(700, 80);
    await page.waitForTimeout(600);
    const displayedTheme = await page.evaluate(() => document.documentElement.className.includes("dark") ? "dark" : "light");
    if (displayedTheme !== theme) throw new Error(`Official app displayed ${displayedTheme} under ${theme} capture`);
    const clean = (html) => html.replaceAll(runDir, "hyfrme-fixture")
      .replaceAll(seedFixture, "hyfrme-fixture").replaceAll(seedProject, "hyfrme-demo")
      .replaceAll(root, "hyfrme-project");
    const save = async (phase, portal) => {
      const serialize = (element) => {
        const clone = element.cloneNode(true);
        const inputs = element.querySelectorAll("input,textarea");
        const copied = clone.querySelectorAll("input,textarea");
        inputs.forEach((input, index) => {
          if (input instanceof HTMLTextAreaElement) copied[index].textContent = input.value;
          else copied[index].setAttribute("value", input.value);
        });
        return clone.outerHTML;
      };
      const html = clean(await page.locator("#root").evaluate(serialize));
      if (/\/home\/|auth[_-]?token|session[_-]?token|127\.0\.0\.1:\d+/i.test(html)) {
        throw new Error(`Private fixture data in ${phase} root DOM`);
      }
      await writeFile(resolve(source, `${prefix}-${phase}.html`), html);
      if (!portal) return;
      const portalHtml = clean(await portal.evaluate((element) => {
        const source = element.closest("[data-base-ui-portal]") ?? element;
        const clone = source.cloneNode(true);
        const inputs = source.querySelectorAll("input,textarea");
        const copied = clone.querySelectorAll("input,textarea");
        inputs.forEach((input, index) => {
          if (input instanceof HTMLTextAreaElement) copied[index].textContent = input.value;
          else copied[index].setAttribute("value", input.value);
        });
        return clone.outerHTML;
      }));
      if (/\/home\/|auth[_-]?token|session[_-]?token|127\.0\.0\.1:\d+/i.test(portalHtml)) {
        throw new Error(`Private fixture data in ${phase} portal DOM`);
      }
      await writeFile(resolve(source, `${prefix}-${phase}-portal.html`), portalHtml);
    };
    await save("before");
    observed.before = { triggerBox: await page.getByRole("button", { name: "Add action", exact: true }).boundingBox() };
    for (let frame = 0; frame < frames; frame++) {
      if (frame === events.dialog) {
        await page.getByRole("button", { name: "Add action", exact: true }).click();
        const dialog = page.getByRole("dialog");
        await dialog.waitFor();
        await page.waitForTimeout(250);
        observed.dialog = { box: await dialog.boundingBox(), text: (await dialog.innerText()).slice(0, 1000),
          fields: await dialog.evaluate((element) => Object.fromEntries(["script-name", "script-keybinding", "script-command", "script-preview-url"]
            .map((id) => { const rect = element.querySelector(`#${id}`)?.getBoundingClientRect();
              return [id, rect && { x: rect.x, y: rect.y, width: rect.width, height: rect.height }]; })) ),
          typography: await dialog.evaluate((element) => Object.fromEntries(["[data-slot=dialog-title]", "label[for=script-name]", "#script-name", "label[for=script-keybinding]", "label[for=script-command]", "label[for=script-preview-url]"]
            .map((selector) => { const node = element.querySelector(selector); const style = node && getComputedStyle(node);
              const rect = node?.getBoundingClientRect(); return [selector, node && { fontFamily: style.fontFamily, fontSize: style.fontSize,
                fontWeight: style.fontWeight, lineHeight: style.lineHeight, letterSpacing: style.letterSpacing,
                rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } }]; })) ) };
        await save("dialog", dialog);
      }
      if (frame === events.named) {
        await page.locator("#script-name").fill(action.name);
        await page.waitForTimeout(150);
        observed.named = { value: await page.locator("#script-name").inputValue() };
        await save("named", page.getByRole("dialog"));
      }
      if (frame === events.command) {
        await page.locator("#script-command").fill(action.command);
        await page.waitForTimeout(150);
        observed.command = { value: await page.locator("#script-command").inputValue() };
        await save("command", page.getByRole("dialog"));
      }
      if (frame === events.shortcut) {
        await page.locator("#script-keybinding").press(action.shortcut);
        await page.waitForTimeout(150);
        observed.shortcut = { value: await page.locator("#script-keybinding").inputValue() };
        await save("shortcut", page.getByRole("dialog"));
      }
      if (frame === events.saved) {
        await page.getByRole("button", { name: "Save action", exact: true }).click();
        await page.getByRole("dialog").waitFor({ state: "hidden", timeout: 12000 });
        await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
        await page.mouse.move(700, 80);
        await page.waitForTimeout(250);
        observed.saved = { button: await page.getByRole("button", { name: `Run ${action.name}` }).boundingBox(), scripts: await scripts() };
        if (!observed.saved.scripts.some((script) => script.name === action.name && script.command === action.command)) {
          throw new Error("Native Save action did not persist the named command");
        }
        await save("saved");
      }
      if (frame === events.persisted) {
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.getByRole("button", { name: `Run ${action.name}` }).waitFor();
        await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
        await page.mouse.move(700, 80);
        await page.waitForTimeout(200);
        observed.persisted = { scripts: await scripts() };
        await save("persisted");
      }
      if (frame === events.menu) {
        await page.getByRole("button", { name: "Script actions" }).click();
        const menu = page.getByRole("menu");
        await menu.waitFor();
        await page.waitForTimeout(200);
        observed.menu = { box: await menu.boundingBox(), labels: await menu.getByRole("menuitem").allInnerTexts() };
        if (!observed.menu.labels.some((label) => label.includes(action.name))) throw new Error("Saved action absent from native menu");
        await save("menu", menu);
      }
      if ([20, 30, 40, 50, 60, 70, 80, 90, 99].includes(frame)) {
        observed.dialogMotion[frame] = await page.getByRole("dialog").evaluate((element) => {
          const style = getComputedStyle(element);
          const title = element.querySelector('[data-slot="dialog-title"]')?.getBoundingClientRect();
          return { scale: style.scale, translate: style.translate, transform: style.transform,
            title: title && { x: title.x, y: title.y, width: title.width, height: title.height } };
        });
      }
      await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
    }
  } finally {
    await browser.close();
  }
  const finalScripts = await scripts();
  if (finalScripts.length !== 1 || finalScripts[0].name !== action.name || finalScripts[0].command !== action.command) {
    throw new Error("Native action state did not persist exactly one Hyfrme command");
  }
  const encoded = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
    "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
  if (encoded.status !== 0) throw new Error(encoded.stderr);
  const sourceDomHashes = Object.fromEntries(await Promise.all(phases.map(async (phase) =>
    [phase, hash(await readFile(resolve(source, `${prefix}-${phase}.html`)))])));
  const portalHashes = Object.fromEntries(await Promise.all(phases.slice(1).filter((phase) => phase !== "saved" && phase !== "persisted").map(async (phase) =>
    [phase, hash(await readFile(resolve(source, `${prefix}-${phase}-portal.html`)))])));
  const dialogCropFrames = Object.fromEntries(["dialog", "named", "command", "shortcut"].map((phase) =>
    [phase, events[phase] + 10]));
  const dialogCropHashes = {};
  for (const [phase, frame] of Object.entries(dialogCropFrames)) {
    const crop = resolve(source, `${prefix}-${phase}-crop.png`);
    const cropped = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i",
      resolve(work, `frame-${String(frame).padStart(4, "0")}.png`), "-vf", "crop=512:627:344:16",
      "-frames:v", "1", crop], { encoding: "utf8" });
    if (cropped.status !== 0) throw new Error(`Could not crop the native ${phase} dialog: ${cropped.stderr}`);
    dialogCropHashes[phase] = hash(await readFile(crop));
  }
  const menuCropFrame = 115;
  const menuCrop = resolve(source, `${prefix}-menu-crop.png`);
  const menuCropped = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i",
    resolve(work, `frame-${String(menuCropFrame).padStart(4, "0")}.png`), "-vf", "crop=162:70:744:42",
    "-frames:v", "1", menuCrop], { encoding: "utf8" });
  if (menuCropped.status !== 0) throw new Error(`Could not crop the native action menu: ${menuCropped.stderr}`);
  const menuCropHash = hash(await readFile(menuCrop));
  await writeFile(resolve(source, `${prefix}-fixture.json`), JSON.stringify({
    sourceTag: "v0.0.42", sourceCommit: "719a76ca1dbf5490f1aa33ffb9966301e02be9a9",
    releaseSha256: base.releaseSha256, sourceHashes: base.sourceHashes,
    captureBrowser: { version: browserVersion, flags }, viewport: base.viewport, fps, frames, theme,
    phases, events, action, observed, sourceDomHashes, portalHashes, dialogCropFrames, dialogCropHashes,
    menuCropFrame, menuCropHash,
    referenceSha256: hash(await readFile(reference)),
  }, null, 2) + "\n");
  console.log(`Captured ${frames} native T3 Code v0.0.42 Project Action ${theme} frames with persisted local action.`);
} finally {
  server.kill("SIGTERM");
}
