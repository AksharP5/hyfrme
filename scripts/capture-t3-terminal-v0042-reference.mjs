import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const release = resolve(root, ".work/t3-v0042-bin/t3-0.0.42-linux-x64");
const source = resolve(root, "assets/t3-code/v0.0.42");
const theme = process.argv[2] ?? "dark";
if (theme !== "dark" && theme !== "light") throw new Error("Expected dark or light theme");
const suffix = theme === "light" ? "-light" : "";
const baseFixture = JSON.parse(await readFile(resolve(source, `source-file-open${suffix}-fixture.json`), "utf8"));
const executablePath = process.env.HYFRME_CHROMIUM;
if (!executablePath) throw new Error("Set HYFRME_CHROMIUM to Chrome Headless Shell 152");
const browserVersion = spawnSync(executablePath, ["--version"], { encoding: "utf8" });
if (browserVersion.status !== 0 || browserVersion.stdout.trim() !== "Google Chrome for Testing 152.0.7977.30") {
  throw new Error("Unexpected Chrome build");
}
const t3Version = spawnSync(resolve(release, "t3"), ["--version"], { encoding: "utf8" });
if (t3Version.status !== 0 || t3Version.stdout.trim() !== "t3 v0.0.42") throw new Error("Unexpected T3 Code build");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const frames = 120;
const fps = 30;
const events = { addSurface: 20, terminal: 40, type: 70, run: 95 };
const command = "git status --short";
const expectedOutput = " M registry/blocks/logo-enter/logo-enter.html";
const prefix = `terminal-check${suffix}`;
const work = resolve(root, `.work/t3-${prefix}-v0042-reference`);
const baseDir = resolve(root, `.work/t3-${prefix}-v0042-fixture`);
const projectPath = resolve(root, ".work/hyfrme-t3-demo");
const reference = resolve(root, `parity/t3-terminal-check-v0042${suffix}-reference.mkv`);
await cp(resolve(root, ".work/t3-v0042-sidebar-project"), projectPath, { recursive: true, force: true });
await cp(resolve(root, ".work/t3-v0042-sidebar-fixture"), baseDir, { recursive: true, force: true });
const changedProject = spawnSync("sqlite3", [resolve(baseDir, "userdata/state.sqlite"),
  `update projection_projects set workspace_root='${projectPath}' where title='hyfrme';`], { encoding: "utf8" });
if (changedProject.status !== 0) throw new Error(`Could not seed Hyfrme workspace: ${changedProject.stderr}`);
await mkdir(work, { recursive: true });

const port = theme === "dark" ? 3921 : 3922;
const server = spawn(resolve(release, "t3"), ["serve", "--base-dir", baseDir, "--host", "127.0.0.1", "--port", String(port), "--no-browser"], {
  cwd: root,
  stdio: ["ignore", "pipe", "pipe"],
});
let serverOutput = "";
server.stdout.on("data", (chunk) => { serverOutput += chunk; });
server.stderr.on("data", (chunk) => { serverOutput += chunk; });
const waitForUrl = async () => {
  for (let attempt = 0; attempt < 120; attempt++) {
    const url = serverOutput.match(/Pairing URL: (\S+)/)?.[1];
    if (url) return url;
    if (server.exitCode !== null) throw new Error("Native v0.0.42 server exited before pairing");
    await new Promise((done) => setTimeout(done, 250));
  }
  throw new Error("Native v0.0.42 server did not produce a pairing URL");
};

const browserFlags = [
  "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none",
  "--force-color-profile=srgb", "--use-gl=angle", "--use-angle=gl-egl",
  "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-software-rasterizer",
];
const phases = ["source", "add-menu", "ready", "typed", "output"];
const shadowCounts = {};
let menuBox;
let terminalBounds;
let browser;
try {
  const url = await waitForUrl();
  for (const [path, expected] of [
    ["/", baseFixture.sourceHashes.index],
    ["/assets/main-x9o7QJ8O.css", baseFixture.sourceHashes.css],
    ["/assets/index-BMH8bO9q.js", baseFixture.sourceHashes.js],
  ]) {
    const response = await fetch(new URL(path, url));
    if (!response.ok || hash(Buffer.from(await response.arrayBuffer())) !== expected) {
      throw new Error(`${path} differs from official v0.0.42`);
    }
  }
  browser = await chromium.launch({ executablePath, headless: true, args: browserFlags });
  const page = await browser.newPage({ viewport: baseFixture.viewport, deviceScaleFactor: 1, colorScheme: theme });
  await page.clock.setFixedTime(new Date("2026-09-25T11:30:00Z"));
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 20000 });
  if (theme === "dark" && !await page.locator("html.dark").count()) throw new Error("Native theme is not dark");
  if (theme === "light" && await page.locator("html.dark").count()) throw new Error("Native theme is not light");
  await page.waitForTimeout(1200);
  await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  await page.evaluate(() => document.fonts.ready);
  if (!page.url().includes("/draft/")) throw new Error("Expected the same Hyfrme project draft as Source File Open");
  await page.getByRole("button", { name: "Toggle right panel" }).click();
  await page.locator('[aria-label="Open a surface"]').getByRole("button", { name: /Files/ }).click();
  const tree = page.locator('file-tree-container[aria-label="hyfrme files"]');
  await tree.waitFor();
  for (const path of ["registry/", "registry/blocks/", "registry/blocks/logo-enter/", "registry/blocks/logo-enter/logo-enter.html"]) {
    await tree.locator(`button[data-item-path="${path}"]`).click();
  }
  await page.getByRole("button", { name: "Show HTML source" }).click();
  await page.locator("diffs-container").waitFor();
  await page.mouse.move(650, 400);
  await page.waitForTimeout(450);

  const save = async (phase) => {
    const result = await page.locator("#root").evaluate((element) => {
      const shadows = [...element.querySelectorAll("*")].filter((host) => host.shadowRoot).map((host, index) => {
        const id = `shadow-${index}`;
        host.setAttribute("data-hyfrme-shadow-id", id);
        return { id, tag: host.tagName, html: host.shadowRoot.innerHTML,
          css: [...host.shadowRoot.adoptedStyleSheets].map((sheet) => [...sheet.cssRules].map((rule) => rule.cssText).join("\n")) };
      });
      return { html: element.innerHTML, shadows };
    });
    const sanitize = (value) => value.replaceAll(projectPath, "hyfrme-demo")
      .replaceAll("/tmp/hyfrme-t3-demo", "hyfrme-demo");
    const html = sanitize(result.html);
    const shadows = result.shadows.map((shadow) => ({ ...shadow, html: sanitize(shadow.html), css: shadow.css.map(sanitize) }));
    if (/\/home\/|\/tmp\/hyfrme-t3|127\.0\.0\.1:39\d\d|auth[_-]?token|session[_-]?token/i.test(html + JSON.stringify(shadows))) {
      throw new Error(`${phase} captured private fixture data`);
    }
    await writeFile(resolve(source, `${prefix}-${phase}.html`), html);
    await writeFile(resolve(source, `${prefix}-${phase}-shadows.json`), JSON.stringify(shadows) + "\n");
    shadowCounts[phase] = shadows.map(({ tag, html: content, css }) => ({ tag, htmlBytes: content.length, adoptedSheets: css.length }));
  };
  await save("source");
  for (let frame = 0; frame < frames; frame++) {
    if (frame === events.addSurface) {
      await page.getByRole("button", { name: "Add panel surface" }).click();
      const terminal = page.getByRole("menuitem", { name: /Terminal/ });
      await terminal.waitFor();
      menuBox = await page.getByRole("menu").last().boundingBox();
      await page.mouse.move(650, 400);
      await save("add-menu");
      await writeFile(resolve(source, `${prefix}-add-menu-portal.html`), await page.getByRole("menu").last().evaluate((element) => element.outerHTML));
    }
    if (frame === events.terminal) {
      await page.getByRole("menuitem", { name: /Terminal/ }).click();
      const canvas = page.locator(".thread-terminal-drawer canvas");
      await canvas.waitFor({ timeout: 20000 });
      await page.waitForTimeout(1200);
      await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
      await page.mouse.move(650, 400);
      terminalBounds = await canvas.boundingBox();
      await save("ready");
    }
    if (frame === events.type) {
      await page.locator(".t3-ghostty-input").focus();
      await page.keyboard.type(command);
      await page.waitForTimeout(250);
      await page.mouse.move(650, 400);
      await save("typed");
    }
    if (frame === events.run) {
      await page.keyboard.press("Enter");
      await page.waitForTimeout(500);
      await page.mouse.move(650, 400);
      await save("output");
    }
    await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
} catch (error) {
  throw new Error(String(error).replace(/http:\/\/127\.0\.0\.1:\d+\/?\S*/g, "[pairing URL redacted]"));
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}

const encode = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", String(fps),
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
if (encode.status !== 0) throw new Error(encode.stderr);
const outputCrop = resolve(work, "verified-terminal-output.png");
const cropOutput = spawnSync("magick", [resolve(work, "frame-0119.png"), "-crop", "539x607+661+52", "+repage", "-resize", "200%", outputCrop], { encoding: "utf8" });
if (cropOutput.status !== 0) throw new Error(cropOutput.stderr);
const ocr = spawnSync("tesseract", [outputCrop, "stdout", "--psm", "6"], { encoding: "utf8" });
if (ocr.status !== 0 || !ocr.stdout.includes(command) || !ocr.stdout.includes(expectedOutput.trim())) {
  throw new Error("Native T3 terminal did not display the live Hyfrme git status result");
}
const canvasSequence = [];
const canvasAssets = {};
const variants = new Map();
const crop = `${Math.round(terminalBounds.width)}x${Math.round(terminalBounds.height)}+${Math.round(terminalBounds.x)}+${Math.round(terminalBounds.y)}`;
for (let frame = 0; frame < frames; frame++) {
  if (frame < events.terminal) { canvasSequence.push(null); continue; }
  const phase = frame < events.type ? "ready" : frame < events.run ? "typed" : "output";
  const image = resolve(work, `frame-${String(frame).padStart(4, "0")}.png`);
  const asset = resolve(work, `canvas-${String(frame).padStart(4, "0")}.png`);
  const commandResult = spawnSync("magick", [image, "-crop", crop, "+repage", asset], { encoding: "utf8" });
  if (commandResult.status !== 0) throw new Error(commandResult.stderr);
  const bytes = await readFile(asset);
  const key = hash(bytes);
  if (!variants.has(key)) {
    const name = `${prefix}-canvas-${phase}-${variants.size}.png`;
    await writeFile(resolve(source, name), bytes);
    variants.set(key, name);
    canvasAssets[name] = key;
  }
  canvasSequence.push(variants.get(key));
}
await writeFile(resolve(source, `${prefix}-fixture.json`), JSON.stringify({
  sourceTag: baseFixture.sourceTag, sourceCommit: baseFixture.sourceCommit, sourceHashes: baseFixture.sourceHashes,
  captureBrowser: { version: browserVersion.stdout.trim(), flags: browserFlags },
  viewport: baseFixture.viewport, theme, fps, frames, events, command, expectedOutput,
  setup: "Seeded local Hyfrme project; Files > registry > blocks > logo-enter > Show HTML source before frame zero. Terminal command executes in the native T3 Code shell.",
  liveCommandOutputVerified: true,
  menuBox, terminalBounds, canvasSequence, canvasAssets, shadowCounts,
  sourceDomHashes: Object.fromEntries(await Promise.all(phases.map(async (phase) => [phase, hash(await readFile(resolve(source, `${prefix}-${phase}.html`)))]))),
  shadowHashes: Object.fromEntries(await Promise.all(phases.map(async (phase) => [phase, hash(await readFile(resolve(source, `${prefix}-${phase}-shadows.json`)))]))),
  referenceSha256: hash(await readFile(reference)),
}, null, 2) + "\n");
console.log(`Captured ${frames} ${theme} native v0.0.42 Terminal Check frames.`);
