import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HYFRME_PLAYWRIGHT_CORE ?? "playwright-core");
const root = resolve(import.meta.dirname, "..");
const url = process.env.T3_REFERENCE_URL;
const storageState = process.env.T3_STORAGE_STATE;
if (!url || !storageState) {
  throw new Error("Set T3_REFERENCE_URL and T3_STORAGE_STATE for an isolated T3 Code v0.0.35 fixture.");
}

const source = resolve(root, "assets/t3-code/v0.0.35");
const baseFixture = JSON.parse(await readFile(resolve(source, "brief-fixture.json"), "utf8"));
const prompt = "Compare the Hyfrme Logo Enter final frame with the pinned reference; fix any mismatch.";
const frames = 120;
const openFrame = 30;
const selectFrame = 90;
const resumeFrom = Number(process.env.T3_CAPTURE_RESUME_FROM ?? 0);
const work = resolve(root, ".work/t3-return-worktree-reference");
const reference = resolve(root, "parity/t3-return-worktree-reference.mkv");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
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
await mkdir(work, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.HYFRME_CHROMIUM ?? "/usr/bin/chromium",
  headless: true,
  args: [
    "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none",
    "--force-color-profile=srgb", "--use-gl=angle", "--use-angle=gl-egl",
    "--enable-gpu-rasterization", "--ignore-gpu-blocklist",
    "--disable-software-rasterizer",
  ],
});
let previousWorktree;
try {
  const page = await browser.newPage({
    viewport: baseFixture.viewport,
    deviceScaleFactor: 1,
    colorScheme: "dark",
    storageState,
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  const editor = page.locator('[data-testid="composer-editor"]');
  await editor.waitFor({ timeout: 15000 });
  await page.waitForTimeout(3000);
  const workspace = page.getByRole("combobox", { name: "Workspace" });
  if (!(await workspace.innerText()).includes("Current checkout")) {
    throw new Error("Start from a fresh T3 Code draft in Current checkout before capturing.");
  }
  const dismissNotifications = async () => {
    const count = await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => {
      buttons.forEach((button) => button.click());
      return buttons.length;
    });
    if (count) await page.waitForTimeout(600);
  };
  await dismissNotifications();
  await editor.fill(prompt);
  await editor.evaluate((element) => element.blur());
  await page.mouse.move(800, 50);
  await page.waitForTimeout(250);
  await writeFile(resolve(source, "return-worktree-before.html"),
    await page.locator("#root").evaluate((element) => element.innerHTML));

  for (let frame = 0; frame < frames; frame++) {
    await dismissNotifications();
    if (frame === openFrame) {
      await workspace.click();
      const option = page.getByRole("option", { name: /^Previous worktree/ });
      await option.waitFor();
      previousWorktree = (await option.innerText()).trim();
      await writeFile(resolve(source, "return-worktree-menu.html"),
        await page.locator("#root").evaluate((element) => element.innerHTML));
      await writeFile(resolve(source, "return-worktree-portal.html"),
        await page.locator('[data-base-ui-portal]:has([data-slot="select-popup"])')
          .evaluate((element) => element.outerHTML));
    }
    if (frame === selectFrame) {
      await page.getByRole("option", { name: /^Previous worktree/ }).click();
      await workspace.getByText("Current worktree").waitFor();
      await page.mouse.move(800, 50);
      await page.waitForTimeout(250);
      await writeFile(resolve(source, "return-worktree-after.html"),
        await page.locator("#root").evaluate((element) => element.innerHTML));
    }
    if (frame >= resumeFrom) {
      await page.screenshot({
        path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`),
      });
    }
  }
} finally {
  await browser.close();
}

const encode = spawnSync("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y", "-framerate", "30",
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3",
  "-pix_fmt", "gbrp", reference,
], { encoding: "utf8" });
if (encode.status !== 0) throw new Error(encode.stderr);
await writeFile(resolve(source, "return-worktree-fixture.json"),
  `${JSON.stringify({
    sourceTag: baseFixture.sourceTag,
    sourceCommit: baseFixture.sourceCommit,
    sourceHashes: baseFixture.sourceHashes,
    viewport: baseFixture.viewport,
    fps: 30,
    frames,
    prompt,
    openFrame,
    selectFrame,
    workspaceBefore: "Current checkout",
    workspaceAfter: "Current worktree",
    previousWorktree,
    sourceDomHashes: Object.fromEntries(await Promise.all(
      ["before", "menu", "portal", "after"].map(async (phase) => [
        phase,
        hash(await readFile(resolve(source, `return-worktree-${phase}.html`))),
      ]),
    )),
    referenceSha256: hash(await readFile(reference)),
  }, null, 2)}\n`);
console.log(`Captured ${frames} native T3 Code return-worktree frames.`);
