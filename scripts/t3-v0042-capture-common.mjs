import { spawn, spawnSync } from "node:child_process";
import { createServer as createPortServer } from "node:net";
import { cp, mkdir, readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const release = resolve(root, ".work/t3-v0042-bin/t3-0.0.42-linux-x64");
const source = resolve(root, "assets/t3-code/v0.0.42");
const base = JSON.parse(await readFile(resolve(source, "brief-v0042-fixture.json"), "utf8"));
const flags = ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
  "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer"];

async function freePort() {
  const server = createPortServer();
  await new Promise((done, fail) => server.once("error", fail).listen(0, "127.0.0.1", done));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not reserve a T3 capture port");
  await new Promise((done) => server.close(done));
  return address.port;
}

export async function createT3V0042Capture({ slug, theme, seed = "composer", chromium }) {
  if (!new Set(["dark", "light"]).has(theme)) throw new Error("Capture theme must be dark or light");
  if (!chromium) throw new Error("Set HYFRME_CHROMIUM to the pinned Chrome executable");
  const version = spawnSync(resolve(release, "t3"), ["--version"], { encoding: "utf8" });
  if (version.status !== 0 || version.stdout.trim() !== "t3 v0.0.42") throw new Error("Capture target is not T3 Code v0.0.42");
  const browserVersion = spawnSync(chromium, ["--version"], { encoding: "utf8" });
  if (browserVersion.status !== 0 || browserVersion.stdout.trim() !== "Google Chrome for Testing 152.0.7977.30") {
    throw new Error(`Unexpected capture browser: ${browserVersion.stdout.trim()}`);
  }
  const seeds = {
    composer: ["t3-v0042-composer-fixture", "t3-v0042-composer-project"],
    actions: ["t3-v0042-actions-fixture", "t3-v0042-actions-project"],
    pin: ["t3-v0042-pin-fixture", "t3-v0042-pin-project"],
  };
  const selectedSeed = seeds[seed];
  if (!selectedSeed) throw new Error(`Unknown T3 capture seed: ${seed}`);
  const fixture = resolve(root, `.work/${slug}-v0042-${theme}-fixture`);
  const project = resolve(root, `.work/${slug}-v0042-${theme}-project`);
  await rm(fixture, { recursive: true, force: true });
  await rm(project, { recursive: true, force: true });
  await cp(resolve(root, `.work/${selectedSeed[0]}`), fixture, { recursive: true });
  await cp(resolve(root, `.work/${selectedSeed[1]}`), project, { recursive: true });
  const db = resolve(fixture, "userdata/state.sqlite");
  const escapedProject = project.replaceAll("'", "''");
  const relocated = spawnSync("sqlite3", [db, `UPDATE projection_projects SET workspace_root='${escapedProject}' WHERE title='hyfrme';
UPDATE projection_threads SET worktree_path='${escapedProject}' WHERE project_id=(SELECT project_id FROM projection_projects WHERE title='hyfrme');`], { encoding: "utf8" });
  if (relocated.status !== 0) throw new Error(`Could not relocate the isolated T3 workspace: ${relocated.stderr}`);

  const port = await freePort();
  const server = spawn(resolve(release, "t3"), ["serve", "--mode", "desktop", "--base-dir", fixture,
    "--port", String(port), "--host", "127.0.0.1", "--no-browser"], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
  let serverOutput = "";
  for (const stream of [server.stdout, server.stderr]) stream.on("data", (chunk) => { serverOutput += chunk; });
  let pairingUrl;
  for (let attempt = 0; attempt < 120; attempt++) {
    pairingUrl = serverOutput.match(/Pairing URL: (\S+)/)?.[1];
    if (pairingUrl) break;
    if (server.exitCode !== null) throw new Error(`Pinned T3 server exited: ${serverOutput.slice(-1200)}`);
    await new Promise((done) => setTimeout(done, 250));
  }
  if (!pairingUrl) {
    server.kill("SIGTERM");
    throw new Error(`Pinned T3 server did not produce a pairing URL: ${serverOutput.slice(-1200)}`);
  }
  const fileMap = { index: "index.html", css: "assets/main-x9o7QJ8O.css", js: "assets/index-BMH8bO9q.js" };
  for (const [key, path] of Object.entries(fileMap)) {
    const response = await fetch(new URL(key === "index" ? "/" : `/${path}`, pairingUrl));
    const expected = base.sourceHashes[key];
    const actual = await response.arrayBuffer();
    const { createHash } = await import("node:crypto");
    if (!response.ok || createHash("sha256").update(Buffer.from(actual)).digest("hex") !== expected) {
      server.kill("SIGTERM");
      throw new Error(`Served ${key} differs from pinned T3 v0.0.42`);
    }
  }

  const { createRequire } = await import("node:module");
  const require = createRequire(import.meta.url);
  const { chromium: playwright } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
  const browser = await playwright.launch({ executablePath: chromium, headless: true, args: flags });
  const page = await browser.newPage({ viewport: base.viewport, deviceScaleFactor: 1, colorScheme: theme });
  await page.clock.setFixedTime(new Date("2026-09-25T11:30:00Z"));
  await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  const actualTheme = await page.evaluate(() => document.documentElement.classList.contains("dark") ? "dark" : "light");
  if (actualTheme !== theme) throw new Error(`T3 served ${actualTheme} to the ${theme} fixture`);
  await page.getByText("Build a logo intro", { exact: true }).click();
  await page.waitForURL(/hyfrme-fixture-logo-intro/);
  await page.waitForTimeout(500);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(700, 50);
  const clean = (html) => html.replaceAll(fixture, "hyfrme-fixture").replaceAll(project, "hyfrme-project").replaceAll(root, "hyfrme-project");
  const stop = async () => {
    await browser.close();
    server.kill("SIGTERM");
  };
  return { root, release, source, base, theme, fixture, project, db, pairingUrl, server, browser, page, clean, stop };
}

export { flags, root as t3Root, release as t3Release, source as t3Source, base as t3Base };
