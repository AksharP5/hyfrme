import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const url = process.env.T3_REFERENCE_URL;
const storageState = process.env.T3_STORAGE_STATE;
if (!url || !storageState) throw new Error("Set T3_REFERENCE_URL and T3_STORAGE_STATE for the isolated pinned fixture.");

const source = resolve(root, "assets/t3-code/v0.0.35");
const baseFixture = JSON.parse(await readFile(resolve(source, "brief-fixture.json"), "utf8"));
const work = resolve(root, ".work/t3-commit-creation-reference");
const project = resolve(root, ".work/t3-commit-creation-project/hyfrme");
const reference = resolve(root, "parity/t3-commit-creation-reference.mkv");
const phases = ["before", "menu", "dialog", "typed", "committed"];
const events = { menu: 20, dialog: 30, typed: 55, committed: 85 };
const frames = 120;
const commitMessage = "Tighten Hyfrme logo hold";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const git = (...args) => {
  const result = spawnSync("git", ["-C", project, ...args], { encoding: "utf8", maxBuffer: 1024 * 1024 });
  if (result.status !== 0) throw new Error(`git ${args[0]} failed: ${result.stderr}`);
  return result.stdout.trim();
};
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
const beforeOid = git("rev-parse", "HEAD");
if (git("remote") !== "") throw new Error("The isolated commit fixture must have no Git remote");
if (!git("status", "--short").includes("registry/blocks/logo-enter/logo-enter.html")) {
  throw new Error("The isolated Hyfrme Logo Enter change is missing");
}
await mkdir(work, { recursive: true });

let afterOid;
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
  const dismissToasts = async () => {
    await page.locator('button[data-slot="toast-close"], button[aria-label="Dismiss notification"]')
      .evaluateAll((buttons) => buttons.forEach((button) => button.click()));
  };
  await page.waitForTimeout(2500);
  for (let attempt = 0; attempt < 8; attempt++) {
    await dismissToasts();
    await page.waitForTimeout(300);
    if (await page.locator('[data-slot="toast-close"]').count() === 0) break;
  }
  if (await page.locator('[data-slot="toast-close"]').count() > 0) {
    throw new Error("A native notification remains over the clean commit reference");
  }
  await page.mouse.move(800, 50);

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
          .filter((portal) => portal.children.length > 0 && getComputedStyle(portal).display !== "none")
          .map(cloneWithValues),
      };
    });
    const sanitize = (html) => html
      .replaceAll(project, "hyfrme-project")
      .replaceAll("/tmp/hyfrme-t3-demo/registry/blocks/", "registry/blocks/")
      .replaceAll("/tmp/hyfrme-t3-demo", "hyfrme-project");
    const safe = { html: sanitize(state.html), portals: state.portals.map(sanitize) };
    const serialized = JSON.stringify(safe);
    if (/\/home\/|\/tmp\/hyfrme-t3|127\.0\.0\.1:38\d\d|blob:|playwright-state|auth[_-]?token|session[_-]?token/i.test(serialized)) {
      throw new Error(`Local or private content in ${phase} source snapshot`);
    }
    await writeFile(resolve(source, `commit-creation-${phase}.html`), safe.html);
    await writeFile(resolve(source, `commit-creation-${phase}-portals.json`), `${JSON.stringify(safe.portals)}\n`);
  };
  await snapshot("before");

  for (let frame = 0; frame < frames; frame++) {
    if (frame === events.menu) {
      await page.getByRole("button", { name: "Git action options" }).click();
      await page.getByRole("menuitem", { name: "Commit", exact: true }).waitFor();
      await page.waitForTimeout(150);
      await snapshot("menu");
    }
    if (frame === events.dialog) {
      await page.getByRole("menuitem", { name: "Commit", exact: true }).click();
      await page.getByText("Commit changes", { exact: true }).waitFor();
      await page.waitForTimeout(180);
      await snapshot("dialog");
    }
    if (frame === events.typed) {
      await page.getByRole("dialog").getByPlaceholder("Leave empty to auto-generate").fill(commitMessage);
      await page.waitForTimeout(180);
      await snapshot("typed");
    }
    if (frame === events.committed) {
      await page.getByRole("dialog").getByRole("button", { name: "Commit", exact: true }).click();
      const deadline = Date.now() + 12000;
      while (Date.now() < deadline) {
        afterOid = git("rev-parse", "HEAD");
        if (afterOid !== beforeOid) break;
        await page.waitForTimeout(150);
      }
      if (!afterOid || afterOid === beforeOid) throw new Error("T3 Code did not create a local Git commit");
      await page.waitForTimeout(250);
      await page.mouse.move(800, 50);
      await snapshot("committed");
    }
    await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
} finally {
  await browser.close();
}

if (git("log", "-1", "--format=%s") !== commitMessage) throw new Error("The local commit has the wrong message");
if (git("status", "--short") !== "") throw new Error("The isolated Git project is not clean after commit");
if (git("remote") !== "") throw new Error("A Git remote appeared during the capture");
const changedFiles = git("diff-tree", "--no-commit-id", "--name-only", "-r", afterOid).split("\n");
if (changedFiles.length !== 1 || changedFiles[0] !== "registry/blocks/logo-enter/logo-enter.html") {
  throw new Error(`Unexpected committed files: ${changedFiles.join(", ")}`);
}
const encode = spawnSync("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y", "-framerate", "30",
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3",
  "-pix_fmt", "gbrp", reference,
], { encoding: "utf8" });
if (encode.status !== 0) throw new Error(encode.stderr);
await writeFile(resolve(source, "commit-creation-fixture.json"), `${JSON.stringify({
  sourceTag: baseFixture.sourceTag,
  sourceCommit: baseFixture.sourceCommit,
  sourceHashes: baseFixture.sourceHashes,
  viewport: baseFixture.viewport,
  fps: 30,
  frames,
  phases,
  events,
  commitMessage,
  gitProof: { beforeOid, afterOid, branch: "hyfrme/logo-intro", changedFiles, noRemote: true },
  sourceDomHashes: Object.fromEntries(await Promise.all(phases.map(async (phase) => [
    phase, hash(await readFile(resolve(source, `commit-creation-${phase}.html`))),
  ]))),
  portalHashes: Object.fromEntries(await Promise.all(phases.map(async (phase) => [
    phase, hash(await readFile(resolve(source, `commit-creation-${phase}-portals.json`))),
  ]))),
  referenceSha256: hash(await readFile(reference)),
}, null, 2)}\n`);
console.log(`Captured ${frames} native T3 Code commit frames; local commit ${afterOid.slice(0, 12)} on hyfrme/logo-intro.`);
