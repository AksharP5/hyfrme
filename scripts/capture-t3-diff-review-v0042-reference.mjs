import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createT3V0042Capture } from "./t3-v0042-capture-common.mjs";

const root = resolve(import.meta.dirname, "..");
const theme = process.env.T3_REFERENCE_THEME ?? "dark";
const capture = await createT3V0042Capture({ slug: "t3-diff-review", theme, chromium: process.env.HYFRME_CHROMIUM });
const { page, project, source, base, stop, clean } = capture;
const name = "t3-diff-review";
const prefix = `diff-review-v0042-${theme}`;
const work = resolve(root, `.work/${name}-v0042-${theme}-reference`);
const reference = resolve(root, `parity/${name}-v0042-${theme}-reference.mkv`);
const changedFile = "registry/blocks/logo-enter/logo-enter.html";
const gitDiff = spawnSync("git", ["diff", "--numstat", "--", changedFile], { cwd: project, encoding: "utf8" });
if (gitDiff.status !== 0 || !/^4\s+1\s+registry\/blocks\/logo-enter\/logo-enter\.html\s*$/m.test(gitDiff.stdout)) {
  await stop();
  throw new Error(`Expected the isolated Hyfrme Logo Enter diff (+4/-1): ${gitDiff.stdout} ${gitDiff.stderr}`);
}
const phases = ["before", "chooser", "stacked", "split"];
const events = { chooser: 20, stacked: 45, split: 80 };
const shadowCounts = {};
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
await mkdir(work, { recursive: true });

const snapshot = async (phase) => {
  const { html, shadows } = await page.evaluate(() => {
    const app = document.querySelector("#root");
    const hosts = [...app.querySelectorAll("*")].filter((element) => element.shadowRoot);
    const shadows = hosts.map((host, index) => {
      const id = `shadow-${index}`;
      host.setAttribute("data-hyfrme-shadow-id", id);
      return { id, tag: host.tagName, html: host.shadowRoot.innerHTML,
        adoptedCss: [...host.shadowRoot.adoptedStyleSheets].map((sheet) => [...sheet.cssRules].map((rule) => rule.cssText).join("\n")) };
    });
    return { html: app.innerHTML, shadows };
  });
  const safeHtml = clean(html);
  const safeShadows = shadows.map((shadow) => ({ ...shadow, html: clean(shadow.html), adoptedCss: shadow.adoptedCss.map(clean) }));
  if (/\/home\/|\/tmp\/|127\.0\.0\.1:\d+|auth[_-]?token|session[_-]?token/i.test(`${safeHtml}\n${JSON.stringify(safeShadows)}`)) {
    throw new Error(`Local/private content in ${phase} T3 snapshot`);
  }
  await writeFile(resolve(source, `${prefix}-${phase}.html`), safeHtml);
  await writeFile(resolve(source, `${prefix}-${phase}-shadows.json`), `${JSON.stringify(safeShadows)}\n`);
  shadowCounts[phase] = safeShadows.map(({ tag, html: shadowHtml, adoptedCss }) => ({ tag, bytes: shadowHtml.length, adoptedSheets: adoptedCss.length }));
};

try {
  const baseDirDiff = spawnSync("git", ["status", "--porcelain=v1", "--", changedFile], { cwd: project, encoding: "utf8" });
  if (baseDirDiff.status !== 0 || !baseDirDiff.stdout.includes(changedFile)) throw new Error("The seeded change is not present in the pinned project");
  await snapshot("before");
  for (let frame = 0; frame < 120; frame++) {
    if (frame === events.chooser) {
      await page.getByRole("button", { name: "Toggle right panel" }).click();
      const surfacePicker = page.locator('[aria-label="Open a surface"]');
      await surfacePicker.getByRole("button", { name: /Diff/ }).waitFor();
      await page.waitForTimeout(300);
      await snapshot("chooser");
    }
    if (frame === events.stacked) {
      const surfacePicker = page.locator('[aria-label="Open a surface"]');
      await surfacePicker.getByRole("button", { name: /Diff/ }).click();
      const diffs = page.locator("diffs-container");
      await diffs.waitFor({ timeout: 15000 });
      await page.waitForFunction(() => Boolean(document.querySelector("diffs-container")?.shadowRoot?.querySelector("[data-diffs-header]")));
      await page.waitForTimeout(400);
      await page.locator('button[data-slot="toast-close"]').evaluateAll((buttons) => buttons.forEach((button) => button.click()));
      await page.mouse.move(700, 50);
      await snapshot("stacked");
    }
    if (frame === events.split) {
      await page.locator('[aria-label="Split diff view"]').click();
      await page.waitForTimeout(350);
      await page.mouse.move(700, 50);
      await snapshot("split");
    }
    await page.screenshot({ path: resolve(work, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
} finally {
  await stop();
}

const encoded = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", "30", "-i",
  resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
if (encoded.status !== 0) throw new Error(encoded.stderr);
const sourceDomHashes = Object.fromEntries(await Promise.all(phases.map(async (phase) => [phase, {
  root: hash(await readFile(resolve(source, `${prefix}-${phase}.html`))),
  shadows: hash(await readFile(resolve(source, `${prefix}-${phase}-shadows.json`))),
}])));
const baseDir = resolve(root, `.work/t3-diff-review-v0042-${theme}-fixture`);
const databaseDiff = spawnSync("git", ["diff", "--numstat", "--", changedFile], { cwd: project, encoding: "utf8" });
await writeFile(resolve(source, `${prefix}-fixture.json`), `${JSON.stringify({ sourceTag: "v0.0.42",
  sourceCommit: "719a76ca1dbf5490f1aa33ffb9966301e02be9a9", releaseSha256: base.releaseSha256,
  sourceHashes: base.sourceHashes, viewport: base.viewport, fps: 30, frames: 120, theme, phases, events,
  changedFile, additions: 4, deletions: 1, gitNumstat: databaseDiff.stdout.trim(), shadowCounts, sourceDomHashes,
  referenceSha256: hash(await readFile(reference)), providerState: "The Hyfrme project and single Logo Enter change are seeded in an isolated local repository; no AI provider runs." }, null, 2)}\n`);
console.log(`Captured T3 Code v0.0.42 Diff Review in ${theme}; the real +4/-1 Hyfrme change is open in stacked and split views.`);
