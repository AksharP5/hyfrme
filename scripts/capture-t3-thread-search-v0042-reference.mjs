import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
const release = resolve(root, ".work/t3-v0042-bin/t3-0.0.42-linux-x64");
const seed = resolve(root, ".work/t3-v0042-actions-fixture");
const theme = process.argv[2];
if (theme !== "dark" && theme !== "light") throw new Error("Pass dark or light");
const suffix = theme === "light" ? "-light" : "";
const work = resolve(root, `.work/t3-thread-search-v0042-${theme}-reference`);
const fixtureDir = resolve(root, `.work/t3-v0042-thread-search-${theme}-fixture`);
const reference = resolve(root, `parity/t3-thread-search-v0042${suffix}-reference.mkv`);
const executablePath = process.env.HYFRME_CHROMIUM;
if (!executablePath) throw new Error("Set HYFRME_CHROMIUM to the pinned browser");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const version = spawnSync(resolve(release, "t3"), ["--version"], { encoding: "utf8" });
if (version.status !== 0 || version.stdout.trim() !== "t3 v0.0.42") throw new Error("Wrong T3 Code release");
const browserVersion = spawnSync(executablePath, ["--version"], { encoding: "utf8" });
if (browserVersion.status !== 0 || browserVersion.stdout.trim() !== "Google Chrome for Testing 152.0.7977.30") throw new Error("Wrong Chrome release");
const releaseFiles = { index: "client/index.html", css: "client/assets/main-x9o7QJ8O.css", js: "client/assets/index-BMH8bO9q.js" };
const sourceHashes = Object.fromEntries(await Promise.all(Object.entries(releaseFiles).map(async ([key, path]) => [key, hash(await readFile(resolve(release, path)))])));
const expectedTheme = JSON.parse(await readFile(resolve(source, `${theme}-theme.json`), "utf8"));
const fps = 30;
const frames = 120;
const events = { focus: 10, firstQuery: 16, arrowDown: 40, arrowUp: 50, clear: 60, finalQuery: 66, select: 110, reload: 116 };
const queryEvents = new Map([
  [16, "l"], [20, "lo"], [24, "log"], [28, "logo"],
  [66, "g"], [70, "gr"], [74, "gro"], [78, "grou"], [82, "group"], [86, "grouped"],
  [90, "grouped "], [94, "grouped l"], [98, "grouped lo"], [102, "grouped log"], [106, "grouped logo"],
]);
await mkdir(work, { recursive: true });
await rm(fixtureDir, { recursive: true, force: true });
await cp(seed, fixtureDir, { recursive: true });
const port = theme === "dark" ? 3972 : 3973;
const server = spawn(resolve(release, "t3"), ["serve", "--mode", "desktop", "--base-dir", fixtureDir, "--host", "127.0.0.1", "--port", String(port), "--no-browser"],
  { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
let serverOutput = "";
for (const stream of [server.stdout, server.stderr]) stream.on("data", (chunk) => { serverOutput += chunk; });
let pairingUrl;
for (let attempt = 0; attempt < 120; attempt++) {
  pairingUrl = serverOutput.match(/Pairing URL: (\S+)/)?.[1];
  if (pairingUrl) break;
  if (server.exitCode !== null) throw new Error("Official v0.0.42 server exited before pairing");
  await new Promise((done) => setTimeout(done, 250));
}
if (!pairingUrl) throw new Error("Official v0.0.42 server did not produce a pairing URL");
const browser = await chromium.launch({ executablePath, headless: true, args: [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb",
  "--use-gl=angle", "--use-angle=gl-egl", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
] });
const states = {};
const stateKeys = [];
const transitions = {};
const boxes = {};
const threadRows = {};
const nativeAges = {};
let previousRoute;
let selectedRoute;
let stateKey = "before";
try {
  for (const [key, path] of Object.entries(releaseFiles)) {
    const response = await fetch(new URL(`/${path.replace(/^client\//, "")}`, pairingUrl));
    if (!response.ok || hash(Buffer.from(await response.arrayBuffer())) !== sourceHashes[key]) throw new Error(`${key} differs from official v0.0.42 release`);
  }
  const page = await browser.newPage({ viewport: { width: 1200, height: 659 }, deviceScaleFactor: 1, colorScheme: theme });
  await page.clock.setFixedTime(new Date("2026-09-25T11:30:00Z"));
  await page.goto(pairingUrl, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  const nativeTheme = await page.evaluate(() => ({
    className: document.documentElement.className,
    variables: Object.fromEntries(Array.from(getComputedStyle(document.documentElement))
      .filter((key) => key.startsWith("--"))
      .map((key) => [key, getComputedStyle(document.documentElement).getPropertyValue(key).trim()])),
  }));
  if (theme === "light" ? nativeTheme.className.includes("dark") : !nativeTheme.className.includes("dark")) throw new Error(`Native ${theme} theme missing`);
  const sorted = (values) => JSON.stringify(Object.entries(values).sort(([a], [b]) => a.localeCompare(b)));
  if (sorted(nativeTheme.variables) !== sorted(expectedTheme)) throw new Error("Official theme tokens changed");
  await page.locator('[data-testid="sidebar-row-card"]').filter({ hasText: "Build a logo intro" }).first().click();
  await page.waitForTimeout(900);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.mouse.move(800, 80);
  await page.waitForTimeout(450);
  await page.evaluate(() => document.fonts.ready);
  const input = page.locator('input[aria-label="Search threads"]');
  boxes.input = await input.boundingBox();
  if (!boxes.input || boxes.input.x !== 40 || boxes.input.y !== 57) throw new Error("Official search input moved");
  await page.mouse.move(boxes.input.x + boxes.input.width / 2, boxes.input.y + boxes.input.height / 2);
  await page.waitForTimeout(300);
  previousRoute = new URL(page.url()).pathname;
  const results = page.locator('#sidebar-thread-search-results [role="option"]');
  for (const row of await page.locator('[data-testid="sidebar-row-card"]').all()) {
    const title = await row.locator('span.min-w-0.flex-1.text-sm').first().textContent().catch(() => null);
    const age = await row.locator('span.tabular-nums.text-secondary-label').first().textContent().catch(() => null);
    if (title && age) nativeAges[title.trim()] = age.trim();
  }
  const clean = (value) => value.replaceAll(resolve(root, ".work/t3-v0042-actions-project"), "hyfrme-project").replaceAll(root, "hyfrme-project");
  const saveState = async (key) => {
    const html = clean(await page.locator("#root").evaluate((element) => element.innerHTML));
    if (/\/home\/|auth[_-]?token|session[_-]?token|127\.0\.0\.1:397[23]/i.test(html)) throw new Error(`${key} DOM contains private fixture data`);
    const file = `thread-search-${theme}-${key}.html`;
    await writeFile(resolve(source, file), html);
    states[key] = {
      file, sha256: hash(Buffer.from(html)),
      query: await input.inputValue(),
      options: await results.evaluateAll((rows) => rows.map((row) => ({ label: row.getAttribute("aria-label"), selected: row.getAttribute("aria-selected") }))),
      activeDescendant: await input.getAttribute("aria-activedescendant"),
      route: new URL(page.url()).pathname,
      focused: await input.evaluate((element) => document.activeElement === element),
    };
    stateKey = key;
  };
  const sampleAnimations = async (key) => {
    transitions[key] = await page.evaluate(() => document.getAnimations().filter((animation) => {
      const target = animation.effect?.target;
      return target instanceof Element && target.closest('#root');
    }).map((animation) => ({
      target: animation.effect?.target?.getAttribute?.("class")?.slice(0, 120),
      durationMs: animation.effect?.getTiming().duration,
      easing: animation.effect?.getTiming().easing,
      currentTimeMs: animation.currentTime,
      keyframes: animation.effect?.getKeyframes(),
    })));
  };
  await saveState("before");
  for (let frame = 0; frame < frames; frame++) {
    if (frame === events.focus) {
      await input.click();
      await sampleAnimations("focus");
      await saveState("focused");
    }
    if (queryEvents.has(frame)) {
      const query = queryEvents.get(frame);
      await input.fill(query);
      await page.waitForFunction((value) => document.querySelector('input[aria-label="Search threads"]')?.value === value, query);
      if (query.trim()) await results.first().waitFor({ timeout: 5000 });
      const key = `query-${String(frame).padStart(3, "0")}`;
      await saveState(key);
      if (frame === 28) {
        const labels = await results.evaluateAll((rows) => rows.map((row) => row.getAttribute("aria-label")));
        if (labels.length !== 3 || !labels.some((label) => label?.startsWith("Grouped logo tests"))) throw new Error("Native logo results changed");
        boxes.results = await page.locator('#sidebar-thread-search-results').boundingBox();
      }
      if (frame === 106) {
        const labels = await results.evaluateAll((rows) => rows.map((row) => row.getAttribute("aria-label")));
        if (labels.length !== 1 || !labels[0]?.startsWith("Grouped logo tests")) throw new Error("Native final search result changed");
        boxes.selectedResult = await results.first().boundingBox();
      }
    }
    if (frame === events.arrowDown || frame === events.arrowUp) {
      await input.press(frame === events.arrowDown ? "ArrowDown" : "ArrowUp");
      const expected = frame === events.arrowDown ? "sidebar-thread-search-result-1" : "sidebar-thread-search-result-0";
      await page.waitForFunction((id) => document.querySelector('input[aria-label="Search threads"]')?.getAttribute("aria-activedescendant") === id, expected);
      await saveState(frame === events.arrowDown ? "arrow-down" : "arrow-up");
    }
    if (frame === events.clear) {
      await page.getByRole("button", { name: "Clear thread search" }).click();
      await page.waitForFunction(() => document.querySelector('input[aria-label="Search threads"]')?.value === "");
      await saveState("cleared");
    }
    if (frame === events.select) {
      await input.press("Enter");
      await page.waitForURL((url) => url.pathname !== previousRoute, { timeout: 10000 });
      await page.waitForFunction(() => document.querySelector('input[aria-label="Search threads"]')?.value === "");
      selectedRoute = new URL(page.url()).pathname;
      if (!selectedRoute.endsWith("/hyfrme-fixture-grouped-logos")) throw new Error("Native search selected the wrong thread");
      await page.getByText("Gather the source marks into a Hyfrme logo lockup.").waitFor({ timeout: 10000 });
      await page.waitForTimeout(250);
      await sampleAnimations("select");
      await saveState("selected");
    }
    if (frame === events.reload) {
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 10000 });
      await page.getByText("Gather the source marks into a Hyfrme logo lockup.").waitFor({ timeout: 10000 });
      await page.waitForTimeout(250);
      if (new URL(page.url()).pathname !== selectedRoute || await input.inputValue() !== "") throw new Error("Selected route or cleared query failed after reload");
      await saveState("reloaded");
    }
    stateKeys.push(stateKey);
    await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
  for (const title of ["Build a logo intro", "Catalog motion audit", "Grouped logo tests", "Review final hold", "Search reveal timing", "Verify Logo Enter parity"]) {
    await input.fill(title);
    await results.first().waitFor({ timeout: 5000 });
    const html = clean(await page.locator('#sidebar-thread-search-results li').first().evaluate((element) => element.outerHTML));
    if (/\/home\/|auth[_-]?token|session[_-]?token/i.test(html)) throw new Error(`${title} result row contains private fixture data`);
    threadRows[title] = html;
    const age = await results.first().locator('span.tabular-nums').last().textContent().catch(() => null);
    if (age) nativeAges[title] = age.trim();
  }
} catch (error) {
  throw new Error(String(error).replaceAll(pairingUrl, "[pairing URL redacted]"));
} finally {
  await browser.close();
  server.kill("SIGTERM");
}
const encoded = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps), "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
if (encoded.status !== 0) throw new Error(encoded.stderr);
const fixture = {
  sourceTag: "v0.0.42", sourceCommit: "719a76ca1dbf5490f1aa33ffb9966301e02be9a9", sourceHashes,
  viewport: { width: 1200, height: 659 }, fps, frames, theme, events, queries: Object.fromEntries(queryEvents),
  provenance: { app: "official desktop T3 Code v0.0.42 binary and bundled client", data: "seeded local Hyfrme project and conversation; provider unavailable", interaction: "native header search, query typing, keyboard highlight, clear, Enter selection, and route reload", clock: "2026-09-25T11:30:00Z" },
  states, stateKeys, transitions, boxes, threadRows, nativeAges, previousRoute, selectedRoute,
  persisted: { selectedRoute: true, query: false },
  referenceSha256: hash(await readFile(reference)),
};
await writeFile(resolve(source, `thread-search-${theme}-fixture.json`), JSON.stringify(fixture, null, 2) + "\n");
console.log(`Captured ${frames} official T3 Code v0.0.42 Thread Search ${theme} frames, real keyboard selection, and route reload.`);
