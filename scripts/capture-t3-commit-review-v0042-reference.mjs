import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

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
const baseDir = resolve(root, `.work/t3-v0042-commit-review-${theme}-fixture`);
const project = resolve(root, `.work/t3-v0042-commit-review-${theme}-project`);
const work = resolve(root, `.work/t3-v0042-commit-review-${theme}-reference`);
const prefix = `commit-review-v0042-${theme}`;
const reference = resolve(root, `parity/t3-commit-review-v0042-${theme}-reference.mkv`);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const command = (program, args, cwd = root) => {
  const result = spawnSync(program, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${program} ${args[0]} failed: ${result.stderr}`);
  return result.stdout.trim();
};
if (command(resolve(release, "t3"), ["--version"]) !== "t3 v0.0.42") throw new Error("Wrong T3 Code release");
const browserVersion = command(executablePath, ["--version"]);
if (browserVersion !== "Google Chrome for Testing 152.0.7977.30") throw new Error(`Wrong capture browser: ${browserVersion}`);
const seedStatus = command("git", ["status", "--porcelain=v1"], seedProject);
const changedFile = "registry/blocks/logo-enter/logo-enter.html";
if (seedStatus !== `M ${changedFile}` || command("git", ["branch", "--show-current"], seedProject) !== "feature/logo-enter" ||
  command("git", ["diff", "--numstat", "--", changedFile], seedProject) !== `4\t1\t${changedFile}`) {
  throw new Error("The seeded Hyfrme Git repo must have exactly one Logo Enter change (+4/-1) on feature/logo-enter");
}

await rm(baseDir, { recursive: true, force: true });
await rm(project, { recursive: true, force: true });
await cp(seedFixture, baseDir, { recursive: true });
await cp(seedProject, project, { recursive: true });
const fixtureDb = resolve(baseDir, "userdata/state.sqlite");
const sqlPath = (path) => path.replaceAll("'", "''");
command("sqlite3", [fixtureDb, `UPDATE projection_projects SET workspace_root='${sqlPath(project)}' WHERE workspace_root='${sqlPath(seedProject)}';
  UPDATE projection_threads SET worktree_path='${sqlPath(project)}' WHERE worktree_path='${sqlPath(seedProject)}';`]);
if (command("sqlite3", [fixtureDb, `SELECT COUNT(*) FROM projection_projects WHERE workspace_root='${sqlPath(project)}';`]) !== "1" ||
  command("sqlite3", [fixtureDb, `SELECT COUNT(*) FROM projection_threads WHERE worktree_path='${sqlPath(project)}';`]) !== "6") {
  throw new Error("The isolated T3 fixture did not point to the isolated Hyfrme Git repo");
}
const initialHead = command("git", ["rev-parse", "HEAD"], project);
const initialStatus = command("git", ["status", "--porcelain=v1"], project);
const frames = 120;
const fps = 30;
const events = { menu: 25, dialog: 50, message: 85 };
const phases = ["before", "menu", "dialog", "message"];
const commitMessage = "Polish Hyfrme Logo Enter timing and final hold";
const observed = {};
const flags = [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
  "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
];
const server = spawn(resolve(release, "t3"), ["serve", "--mode", "desktop", "--base-dir", baseDir,
  "--port", theme === "dark" ? "4040" : "4041", "--host", "127.0.0.1", "--no-browser"],
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
    const clean = (html) => html.replaceAll(baseDir, "hyfrme-fixture")
      .replaceAll(project, "hyfrme-demo").replaceAll(seedFixture, "hyfrme-fixture")
      .replaceAll(seedProject, "hyfrme-demo").replaceAll(root, "hyfrme-project");
    const save = async (phase, portal) => {
      const html = clean(await page.locator("#root").evaluate((element) => element.innerHTML));
      if (/\/home\/|auth[_-]?token|session[_-]?token|127\.0\.0\.1:\d+/i.test(html)) {
        throw new Error(`Private fixture data in ${phase} root DOM`);
      }
      await writeFile(resolve(source, `${prefix}-${phase}.html`), html);
      if (!portal) return;
      const portalHtml = clean(await portal.evaluate((element) =>
        element.closest("[data-base-ui-portal]")?.outerHTML ?? element.outerHTML));
      if (/\/home\/|auth[_-]?token|session[_-]?token|127\.0\.0\.1:\d+/i.test(portalHtml)) {
        throw new Error(`Private fixture data in ${phase} portal DOM`);
      }
      await writeFile(resolve(source, `${prefix}-${phase}-portal.html`), portalHtml);
    };
    const trigger = page.getByRole("button", { name: "Git action options" });
    await trigger.waitFor({ timeout: 12000 });
    await save("before");
    observed.before = { urlPath: new URL(page.url()).pathname, triggerBox: await trigger.boundingBox() };
    for (let frame = 0; frame < frames; frame++) {
      if (frame === events.menu) {
        await trigger.click();
        const menu = page.getByRole("menu");
        await menu.waitFor();
        await page.mouse.move(700, 80);
        await page.waitForTimeout(400);
        observed.menu = { labels: await menu.getByRole("menuitem").allInnerTexts(), box: await menu.boundingBox() };
        if (!observed.menu.labels.includes("Commit")) throw new Error(`Native Git menu lacks Commit: ${JSON.stringify(observed.menu.labels)}`);
        const { triggerBox } = observed.before;
        const { box } = observed.menu;
        if (!triggerBox || !box || Math.abs(box.x + box.width - (triggerBox.x + triggerBox.width)) > 40 ||
          box.y < triggerBox.y + triggerBox.height - 5 || box.y + box.height > base.viewport.height) {
          throw new Error(`Native Git menu is not anchored to its trigger: ${JSON.stringify({ triggerBox, box })}`);
        }
        await save("menu", menu);
      }
      if (frame === events.dialog) {
        await page.getByRole("menuitem", { name: "Commit", exact: true }).click();
        const dialog = page.getByRole("dialog");
        await dialog.waitFor();
        await page.waitForTimeout(450);
        const text = await dialog.innerText();
        for (const expected of ["Commit changes", "feature/logo-enter", changedFile, "+4", "-1", "Commit message (optional)"]) {
          if (!text.includes(expected)) throw new Error(`Native commit review lacks ${expected}: ${text}`);
        }
        const box = await dialog.boundingBox();
        if (!box || Math.abs(box.x + box.width / 2 - base.viewport.width / 2) > 30 ||
          Math.abs(box.y + box.height / 2 - base.viewport.height / 2) > 50 ||
          box.x < 0 || box.y < 0 || box.x + box.width > base.viewport.width || box.y + box.height > base.viewport.height) {
          throw new Error(`Native commit dialog is misplaced: ${JSON.stringify(box)}`);
        }
        observed.dialog = { text, box };
        await save("dialog", dialog);
      }
      if (frame === events.message) {
        const dialog = page.getByRole("dialog");
        const textarea = dialog.locator("textarea");
        await textarea.fill(commitMessage);
        await textarea.evaluate((element) => element.blur());
        await page.waitForTimeout(350);
        if (await textarea.inputValue() !== commitMessage) throw new Error("Native commit message was not retained");
        observed.message = { value: await textarea.inputValue(), box: await dialog.boundingBox() };
        await save("message", dialog);
      }
      await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
    }
  } finally {
    await browser.close();
  }
  const finalHead = command("git", ["rev-parse", "HEAD"], project);
  const finalStatus = command("git", ["status", "--porcelain=v1"], project);
  if (finalHead !== initialHead || finalStatus !== initialStatus) {
    throw new Error(`Commit Review altered the isolated Git repo: ${JSON.stringify({ initialHead, finalHead, initialStatus, finalStatus })}`);
  }
  const encoded = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
    "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
  if (encoded.status !== 0) throw new Error(encoded.stderr);
  const domFiles = [...phases.map((phase) => `${phase}`), ...phases.slice(1).map((phase) => `${phase}-portal`)];
  const sourceDomHashes = Object.fromEntries(await Promise.all(domFiles.map(async (phase) =>
    [phase, hash(await readFile(resolve(source, `${prefix}-${phase}.html`)))])));
  await writeFile(resolve(source, `${prefix}-fixture.json`), JSON.stringify({
    sourceTag: "v0.0.42", sourceCommit: "719a76ca1dbf5490f1aa33ffb9966301e02be9a9",
    releaseSha256: base.releaseSha256, sourceHashes: base.sourceHashes,
    captureBrowser: { version: browserVersion, flags }, viewport: base.viewport, fps, frames, theme,
    phases, events, branch: "feature/logo-enter", changedFile, insertions: 4, deletions: 1, commitMessage,
    isolatedGit: { initialHead, finalHead, initialStatus, finalStatus, committed: false },
    observed, sourceDomHashes, referenceSha256: hash(await readFile(reference)),
  }, null, 2) + "\n");
  console.log(`Captured ${frames} native T3 Code v0.0.42 Commit Review ${theme} frames; Logo Enter +4/-1, no commit.`);
} finally {
  server.kill("SIGTERM");
}
