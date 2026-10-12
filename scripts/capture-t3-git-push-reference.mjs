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
const work = resolve(root, ".work/t3-git-push-reference");
const project = resolve(root, ".work/t3-git-push-project/hyfrme");
const bare = resolve(root, ".work/t3-git-push-remote.git");
const remoteRef = "refs/heads/hyfrme/logo-intro";
const reference = resolve(root, "parity/t3-git-push-reference.mkv");
const phases = ["before", "menu", "pushing", "pushed"];
const events = { menu: 20, pushing: 35, pushed: 75 };
const frames = 120;
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const git = (cwd, ...args) => {
  const result = spawnSync("git", ["-C", cwd, ...args], { encoding: "utf8", maxBuffer: 1024 * 1024 });
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
const localOid = git(project, "rev-parse", "HEAD");
const beforeRemoteOid = git(bare, "rev-parse", remoteRef);
if (git(project, "remote") !== "origin" || git(project, "remote", "get-url", "--push", "origin") !== bare) {
  throw new Error("The isolated push fixture must use its local bare repository as its only remote");
}
if (git(project, "status", "--short") !== "") throw new Error("The isolated push project must be clean");
if (git(project, "rev-list", "--count", "origin/hyfrme/logo-intro..HEAD") !== "1") {
  throw new Error("The isolated branch must be exactly one commit ahead of its local upstream");
}
if (beforeRemoteOid === localOid) throw new Error("The local bare remote has already received this commit");
await mkdir(work, { recursive: true });

let toastTitle = "";
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
    throw new Error("A native notification remains over the clean Git push reference");
  }
  await page.mouse.move(800, 50);

  const snapshot = async (phase) => {
    const state = await page.evaluate(() => ({
      html: document.querySelector("#root").innerHTML,
      portals: [...document.querySelectorAll("[data-base-ui-portal]")]
        .filter((portal) => portal.children.length > 0 && getComputedStyle(portal).display !== "none")
        .map((portal) => portal.outerHTML),
    }));
    const sanitize = (html) => html
      .replaceAll(project, "hyfrme-project")
      .replaceAll(bare, "hyfrme-local-remote")
      .replaceAll("/tmp/hyfrme-t3-demo/registry/blocks/", "registry/blocks/")
      .replaceAll("/tmp/hyfrme-t3-demo", "hyfrme-project");
    const safe = { html: sanitize(state.html), portals: state.portals.map(sanitize) };
    const serialized = JSON.stringify(safe);
    if (/\/home\/|\/tmp\/hyfrme-t3|127\.0\.0\.1:38\d\d|blob:|playwright-state|auth[_-]?token|session[_-]?token/i.test(serialized)) {
      throw new Error(`Local or private content in ${phase} source snapshot`);
    }
    await writeFile(resolve(source, `git-push-${phase}.html`), safe.html);
    await writeFile(resolve(source, `git-push-${phase}-portals.json`), `${JSON.stringify(safe.portals)}\n`);
  };
  await snapshot("before");

  for (let frame = 0; frame < frames; frame++) {
    if (frame === events.menu) {
      await page.getByRole("button", { name: "Git action options" }).click();
      const push = page.getByRole("menuitem", { name: "Push", exact: true });
      await push.waitFor();
      if (!(await push.isEnabled())) throw new Error("T3 Code did not enable Push for the local upstream branch");
      await page.waitForTimeout(150);
      await snapshot("menu");
    }
    if (frame === events.pushing) {
      await page.getByRole("menuitem", { name: "Push", exact: true }).click();
      await page.getByText("Pushing...", { exact: true }).waitFor({ timeout: 8000 });
      await page.waitForTimeout(180);
      await snapshot("pushing");
    }
    if (frame === events.pushed) {
      const deadline = Date.now() + 15000;
      while (Date.now() < deadline && git(bare, "rev-parse", remoteRef) !== localOid) {
        await page.waitForTimeout(150);
      }
      if (git(bare, "rev-parse", remoteRef) !== localOid) throw new Error("T3 Code did not push to the local bare remote");
      const success = page.locator('[data-slot="toast-title"][data-type="success"]');
      await success.waitFor({ timeout: 8000 });
      toastTitle = await success.innerText();
      await page.waitForTimeout(250);
      await page.mouse.move(800, 50);
      await snapshot("pushed");
    }
    await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
} finally {
  await browser.close();
}

if (git(bare, "rev-parse", remoteRef) !== localOid) throw new Error("The local bare remote ref does not match the pushed commit");
if (git(project, "rev-list", "--count", "origin/hyfrme/logo-intro..HEAD") !== "0") {
  throw new Error("T3 Code did not refresh the branch to its pushed upstream state");
}
if (git(project, "status", "--short") !== "") throw new Error("The isolated Git project is dirty after push");
if (git(project, "remote", "get-url", "--push", "origin") !== bare) throw new Error("Push remote changed from the isolated local bare repository");
const encode = spawnSync("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y", "-framerate", "30",
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3",
  "-pix_fmt", "gbrp", reference,
], { encoding: "utf8" });
if (encode.status !== 0) throw new Error(encode.stderr);
await writeFile(resolve(source, "git-push-fixture.json"), `${JSON.stringify({
  sourceTag: baseFixture.sourceTag,
  sourceCommit: baseFixture.sourceCommit,
  sourceHashes: baseFixture.sourceHashes,
  viewport: baseFixture.viewport,
  fps: 30,
  frames,
  phases,
  events,
  gitProof: { beforeRemoteOid, localOid, afterRemoteOid: git(bare, "rev-parse", remoteRef), branch: "hyfrme/logo-intro", remote: "isolated-local-bare", toastTitle },
  sourceDomHashes: Object.fromEntries(await Promise.all(phases.map(async (phase) => [
    phase, hash(await readFile(resolve(source, `git-push-${phase}.html`))),
  ]))),
  portalHashes: Object.fromEntries(await Promise.all(phases.map(async (phase) => [
    phase, hash(await readFile(resolve(source, `git-push-${phase}-portals.json`))),
  ]))),
  referenceSha256: hash(await readFile(reference)),
}, null, 2)}\n`);
console.log(`Captured ${frames} native T3 Code Push frames; bare local ref ${localOid.slice(0, 12)}, toast "${toastTitle}".`);
