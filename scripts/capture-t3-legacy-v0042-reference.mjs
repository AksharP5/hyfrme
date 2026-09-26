import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createT3V0042Capture } from "./t3-v0042-capture-common.mjs";

const root = resolve(import.meta.dirname, "..");
const name = process.argv[2];
const theme = process.env.T3_REFERENCE_THEME ?? "dark";
const profiles = {
  "t3-project-action-run": { seed: "actions", phases: ["before", "opened", "output"], events: { opened: 30, output: 52 } },
  "t3-commit-creation": { seed: "composer", phases: ["before", "menu", "dialog", "typed", "committed"], events: { menu: 20, dialog: 30, typed: 55, committed: 85 } },
  "t3-git-push": { seed: "composer", phases: ["before", "menu", "dialog", "cancelled"], events: { menu: 20, dialog: 45, cancelled: 95 } },
  "t3-thread-reorder": { seed: "pin", phases: ["before", "lifted", "over", "dropped", "persisted"], events: { lifted: 25, over: 45, dropped: 65, persisted: 90 } },
};
const profile = profiles[name];
if (!profile) throw new Error(`Expected one of: ${Object.keys(profiles).join(", ")}`);
const assetName = name.replace(/^t3-/, "");
const captureName = `${assetName}-v0042-${theme}`;
const source = resolve(root, "assets/t3-code/v0.0.42");
const prefix = `${captureName}`;
const work = resolve(root, `.work/t3-${captureName}-reference`);
const reference = resolve(root, `parity/${name}-v0042-${theme}-reference.mkv`);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024, ...options });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed:\n${result.stderr}`);
  return result.stdout.trim();
};
const git = (cwd, ...args) => run("git", ["-C", cwd, ...args]);
const files = ["registry/blocks/logo-enter/logo-enter.html"];
const commitMessage = "Tighten Hyfrme logo hold";
const actionName = "Verify Hyfrme";
const actionCommand = "git diff --check && git diff --stat -- registry/blocks/logo-enter/logo-enter.html";

const capture = await createT3V0042Capture({ slug: name, theme, seed: profile.seed, chromium: process.env.HYFRME_CHROMIUM });
const { page, project, source: releaseSource, base, db, stop, clean } = capture;
await mkdir(work, { recursive: true });

const cloneWithValues = (element) => {
  const clone = element.cloneNode(true);
  const inputs = element.querySelectorAll("input,textarea");
  const copied = clone.querySelectorAll("input,textarea");
  inputs.forEach((input, index) => {
    if (input instanceof HTMLTextAreaElement) copied[index].textContent = input.value;
    else copied[index].setAttribute("value", input.value);
  });
  return clone.outerHTML;
};
const sanitize = (html) => {
  return clean(html).replaceAll("/tmp/hyfrme-t3-demo/registry/blocks/", "registry/blocks/")
    .replaceAll("/tmp/hyfrme-t3-demo", "hyfrme-project")
    .replaceAll("AksharP5/", "hyfrme/");
};
const snapshot = async (phase, portal = null) => {
  const html = sanitize(await page.locator("#root").evaluate(cloneWithValues));
  const portals = portal ? await portal.evaluate((element) => {
    const source = element.closest("[data-base-ui-portal]") ?? element;
    const clone = source.cloneNode(true);
    const inputs = source.querySelectorAll("input,textarea");
    const copied = clone.querySelectorAll("input,textarea");
    inputs.forEach((input, index) => {
      if (input instanceof HTMLTextAreaElement) copied[index].textContent = input.value;
      else copied[index].setAttribute("value", input.value);
    });
    return clone.outerHTML;
  }) : null;
  const safePortal = portals && sanitize(portals);
  const combined = `${html}\n${safePortal ?? ""}`;
  if (/\/home\/|\/tmp\/|127\.0\.0\.1:\d+|blob:|auth[_-]?token|session[_-]?token/i.test(combined)) {
    throw new Error(`Local/private content in ${phase} T3 snapshot`);
  }
  await writeFile(resolve(source, `${prefix}-${phase}.html`), html);
  if (safePortal) await writeFile(resolve(source, `${prefix}-${phase}-portal.html`), safePortal);
  return { root: hash(Buffer.from(html)), portal: safePortal ? hash(Buffer.from(safePortal)) : null };
};
const frame = async (number) => page.screenshot({ path: resolve(work, `frame-${String(number).padStart(4, "0")}.png`) });
const dismissToasts = async () => page.locator('button[data-slot="toast-close"],button[aria-label="Dismiss notification"]')
  .evaluateAll((buttons) => buttons.forEach((button) => button.click()));
const sourceDomHashes = {};
const portalHashes = {};
const observed = {};
let canvasBounds;
let canvasSequence = [];
const canvasHashes = new Map();
const canvasAssets = {};

const save = async (phase, portal) => {
  const result = await snapshot(phase, portal);
  sourceDomHashes[phase] = result.root;
  if (result.portal) portalHashes[phase] = result.portal;
};

try {
  if (name === "t3-project-action-run") {
    const runButton = page.getByRole("button", { name: `Run ${actionName}`, exact: true });
    if (!await runButton.count()) {
      await page.getByRole("button", { name: "Add action", exact: true }).click();
      await page.locator("#script-name").fill(actionName);
      await page.locator("#script-command").fill(actionCommand);
      await page.getByRole("button", { name: "Save action", exact: true }).click();
      await page.getByRole("button", { name: `Run ${actionName}`, exact: true }).waitFor();
      await dismissToasts();
    }
    const terminalButton = page.getByRole("button", { name: "Toggle terminal drawer" });
    await terminalButton.click();
    let terminalCanvas = page.locator(".thread-terminal-drawer canvas").first();
    if (!await terminalCanvas.count()) {
      const start = page.getByRole("button", { name: "Start a shell in this workspace." });
      if (await start.count()) await start.click();
      terminalCanvas = page.locator(".thread-terminal-drawer canvas").first();
      await terminalCanvas.waitFor({ timeout: 10000 });
    }
    await page.getByRole("button", { name: /^New Terminal/ }).click();
    await page.waitForTimeout(250);
    await terminalButton.click();
    await page.mouse.move(700, 50);
    await save("before");

    for (let index = 0; index < 120; index++) {
      if (index === profile.events.opened) {
        await page.getByRole("button", { name: `Run ${actionName}`, exact: true }).click();
        terminalCanvas = page.locator(".thread-terminal-drawer canvas").first();
        await terminalCanvas.waitFor({ timeout: 10000 });
        canvasBounds = await terminalCanvas.boundingBox();
        await page.waitForTimeout(900);
        await dismissToasts();
        await page.mouse.move(700, 50);
        await save("opened");
      }
      if (index === profile.events.output) {
        await page.waitForTimeout(500);
        await dismissToasts();
        await page.mouse.move(700, 50);
        await save("output");
        const text = run("tesseract", ["stdin", "stdout", "--psm", "6"], { input: await terminalCanvas.screenshot() });
        if (!/registry\/blocks\/logo-enter/i.test(text)) throw new Error(`The live terminal did not show the real Git diff output: ${text}`);
      }
      await frame(index);
      if (index >= profile.events.opened) {
        terminalCanvas = page.locator(".thread-terminal-drawer canvas").first();
        const bytes = await terminalCanvas.screenshot();
        const digest = hash(bytes);
        let asset = canvasHashes.get(digest);
        if (!asset) {
          asset = `${assetName}-v0042-${theme}-terminal-${String(canvasHashes.size).padStart(2, "0")}.png`;
          await writeFile(resolve(source, asset), bytes);
          canvasHashes.set(digest, asset);
          canvasAssets[asset] = digest;
        }
        canvasSequence[index] = asset;
      } else {
        canvasSequence[index] = null;
      }
    }
  }

  if (name === "t3-commit-creation") {
    const beforeOid = git(project, "rev-parse", "HEAD");
    if (git(project, "remote") !== "" || !git(project, "status", "--short").includes(files[0])) {
      throw new Error("Commit capture requires exactly the isolated uncommitted Hyfrme source change and no remote");
    }
    sourceDomHashes.before = (await snapshot("before")).root;
    for (let index = 0; index < 120; index++) {
      let portal = null;
      if (index === profile.events.menu) {
        await page.getByRole("button", { name: "Git action options" }).click();
        const menu = page.getByRole("menu");
        await menu.waitFor();
        await menu.getByRole("menuitem", { name: "Commit", exact: true }).waitFor();
        portal = menu;
      }
      if (index === profile.events.dialog) {
        await page.getByRole("menuitem", { name: "Commit", exact: true }).click();
        const dialog = page.getByRole("dialog");
        await dialog.waitFor();
        for (const expected of ["Commit changes", "feature/logo-enter", files[0], "+4", "-1"]) {
          if (!(await dialog.innerText()).includes(expected)) throw new Error(`Commit dialog omitted ${expected}`);
        }
        portal = dialog;
      }
      if (index === profile.events.typed) {
        const dialog = page.getByRole("dialog");
        await dialog.locator("textarea").fill(commitMessage);
        portal = dialog;
      }
      if (index === profile.events.committed) {
        const dialog = page.getByRole("dialog");
        await dialog.getByRole("button", { name: "Commit", exact: true }).click();
        const deadline = Date.now() + 12000;
        let afterOid = beforeOid;
        while (Date.now() < deadline && afterOid === beforeOid) {
          afterOid = git(project, "rev-parse", "HEAD");
          if (afterOid === beforeOid) await page.waitForTimeout(150);
        }
        if (afterOid === beforeOid) throw new Error("T3 Code did not create the local Git commit");
        if (git(project, "log", "-1", "--format=%s") !== commitMessage || git(project, "status", "--short") !== "" || git(project, "remote") !== "") {
          throw new Error("The native commit did not leave the isolated project clean and remote-free");
        }
        const changed = git(project, "diff-tree", "--no-commit-id", "--name-only", "-r", afterOid).split("\n");
        if (changed.length !== 1 || changed[0] !== files[0]) throw new Error(`Unexpected committed files: ${changed.join(", ")}`);
        observed.gitProof = { beforeOid, afterOid, branch: "feature/logo-enter", changedFiles: changed, noRemote: true };
        await dismissToasts();
        await page.mouse.move(700, 50);
      }
      if (index === profile.events.menu || index === profile.events.dialog || index === profile.events.typed || index === profile.events.committed) {
        await page.waitForTimeout(100);
        await save(profile.phases[profile.phases.findIndex((phase) => profile.events[phase] === index)] ?? "before", portal);
      }
      await frame(index);
    }
  }

  if (name === "t3-git-push") {
    if (git(project, "remote") !== "") throw new Error("Publish Repository must start from the native unlinked-project state");
    sourceDomHashes.before = (await snapshot("before")).root;
    for (let index = 0; index < 120; index++) {
      let portal = null;
      if (index === profile.events.menu) {
        await page.getByRole("button", { name: "Git action options" }).click();
        const menu = page.getByRole("menu");
        await menu.waitFor();
        const labels = await menu.getByRole("menuitem").allInnerTexts();
        if (!labels.includes("Commit") || !labels.includes("Publish repository...")) {
          throw new Error(`T3 Code v0.0.42 Git menu changed: ${JSON.stringify(labels)}`);
        }
        observed.menuLabels = labels;
        portal = menu;
      }
      if (index === profile.events.dialog) {
        await page.getByRole("menuitem", { name: "Publish repository...", exact: true }).click();
        const dialog = page.getByRole("dialog");
        await dialog.waitFor();
        await page.waitForTimeout(250);
        observed.dialogText = await dialog.innerText();
        observed.dialogFields = await dialog.locator("input,textarea,select").evaluateAll((elements) => elements.map((element) => ({
          tag: element.tagName, type: element.getAttribute("type"), id: element.id, name: element.getAttribute("name"), placeholder: element.getAttribute("placeholder"),
          value: (element.value ?? "").replaceAll("AksharP5/", "hyfrme/"), label: element.labels?.[0]?.textContent?.trim() ?? "",
        })));
        portal = dialog;
      }
      if (index === profile.events.cancelled) {
        const dialog = page.getByRole("dialog");
        await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
        await dialog.waitFor({ state: "hidden" });
        if (git(project, "remote") !== "") throw new Error("Cancel unexpectedly changed the isolated repository remote");
        observed.gitHubState = "unconnected; dialog canceled without publishing";
        await page.mouse.move(700, 50);
      }
      if (index === profile.events.menu || index === profile.events.dialog) {
        await page.waitForTimeout(100);
        const phase = profile.phases[profile.phases.findIndex((phase) => profile.events[phase] === index)];
        await save(phase, portal);
      }
      if (index === profile.events.cancelled) await save("cancelled");
      await frame(index);
    }
  }

  if (name === "t3-thread-reorder") {
    const threadToPin = "Build a logo intro";
    const unpinnedRow = page.locator('[data-testid="sidebar-row-card"]').filter({ hasText: threadToPin }).first();
    await unpinnedRow.click({ button: "right" });
    const menu = page.locator('.dropdown-glass[data-level="0"]');
    await menu.waitFor();
    await menu.getByRole("button", { name: "Pin thread", exact: true }).click();
    const rows = page.locator('[data-testid="sidebar-row-card"]');
    await rows.filter({ hasText: threadToPin }).waitFor();
    await rows.filter({ hasText: "Catalog motion audit" }).waitFor();
    const rowOrder = () => rows.evaluateAll((cards) => cards.map((card) => card.querySelector("div.mt-1 span")?.textContent?.trim()));
    await page.waitForTimeout(350);
    const orderBefore = await rowOrder();
    const targetOrder = orderBefore.filter((title) => [threadToPin, "Catalog motion audit"].includes(title));
    if (targetOrder.length !== 2) throw new Error(`Need two pinned threads for real v0.0.42 drag reorder, got ${JSON.stringify(orderBefore)}`);
    const movedThread = targetOrder.at(-1);
    const otherThread = targetOrder[0];
    const pinnedKeys = () => Object.fromEntries(run("sqlite3", ["-separator", "|", db,
      `select title,pin_order_key from projection_threads where title in ('${movedThread.replaceAll("'", "''")}','${otherThread.replaceAll("'", "''")}') order by title;`])
      .split("\n").map((line) => line.split("|")));
    const keysBefore = pinnedKeys();
    const saveOrder = async (phase) => {
      observed[phase] = { order: await rowOrder(), keys: pinnedKeys() };
      await save(phase);
    };
    await saveOrder("before");
    const from = await rows.filter({ hasText: movedThread }).boundingBox();
    const to = await rows.filter({ hasText: otherThread }).boundingBox();
    if (!from || !to) throw new Error("Pinned v0.0.42 sidebar cards lack drag coordinates");
    const x = from.x + Math.min(80, from.width / 2);
    const y = from.y + from.height / 2;
    for (let index = 0; index < 120; index++) {
      if (index === profile.events.lifted) {
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x, y - 12, { steps: 4 });
        await page.waitForTimeout(250);
        await saveOrder("lifted");
      }
      if (index === profile.events.over) {
        await page.mouse.move(x, to.y + to.height / 2 - 12, { steps: 8 });
        await page.waitForTimeout(250);
        await saveOrder("over");
      }
      if (index === profile.events.dropped) {
        await page.mouse.up();
        await page.waitForFunction((title) => document.querySelector('[data-testid="sidebar-row-card"] div.mt-1 span')?.textContent?.trim() === title,
          movedThread, { timeout: 12000 });
        let keysAfter = keysBefore;
        for (let attempt = 0; attempt < 40; attempt++) {
          keysAfter = pinnedKeys();
          if (keysAfter[movedThread] !== keysBefore[movedThread]) break;
          await page.waitForTimeout(100);
        }
        if (keysAfter[movedThread] === keysBefore[movedThread]) throw new Error("T3 Code did not persist the v0.0.42 pin order key");
        await page.mouse.move(700, 50);
        await page.waitForTimeout(250);
        observed.orderBefore = orderBefore;
        observed.orderAfter = await rowOrder();
        observed.keysBefore = keysBefore;
        observed.keysAfter = keysAfter;
        const targetAfter = observed.orderAfter.filter((title) => [movedThread, otherThread].includes(title));
        if (targetAfter.join("|") !== `${movedThread}|${otherThread}`) throw new Error(`Pinned drag did not move ${movedThread} ahead of ${otherThread}`);
        await saveOrder("dropped");
      }
      if (index === profile.events.persisted) {
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.locator('[data-testid="composer-editor"]').waitFor({ timeout: 15000 });
        await page.waitForFunction((title) => document.querySelector('[data-testid="sidebar-row-card"] div.mt-1 span')?.textContent?.trim() === title,
          movedThread, { timeout: 12000 });
        await dismissToasts();
        await page.mouse.move(700, 50);
        await page.waitForTimeout(300);
        await saveOrder("persisted");
      }
      await frame(index);
    }
    if (observed.persisted?.order.join("|") !== observed.orderAfter.join("|")) throw new Error("Pinned order did not survive reload");
    observed.movedThread = movedThread;
    observed.otherThread = otherThread;
  }

  const encoded = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", "30", "-i",
    resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
  if (encoded.status !== 0) throw new Error(encoded.stderr);
  const fixture = {
    sourceTag: base.sourceTag,
    sourceCommit: base.sourceCommit,
    releaseSha256: base.releaseSha256,
    sourceHashes: base.sourceHashes,
    viewport: base.viewport,
    fps: 30,
    frames: 120,
    theme,
    phases: profile.phases,
    events: profile.events,
    sourceDomHashes,
    portalHashes,
    observed,
    referenceSha256: hash(await readFile(reference)),
    providerState: "Hyfrme project and Git changes are isolated fixtures; no AI provider, GitHub account, or external remote is used.",
  };
  if (name === "t3-project-action-run") Object.assign(fixture, {
    actionName, actionCommand, output: git(project, "diff", "--stat", "--", files[0]), canvasBounds, canvasSequence, assetSha256: canvasAssets,
  });
  if (name === "t3-commit-creation") Object.assign(fixture, { commitMessage, gitProof: observed.gitProof });
  await writeFile(resolve(source, `${prefix}-fixture.json`), `${JSON.stringify(fixture, null, 2)}\n`);
  console.log(`Captured T3 Code v0.0.42 ${name} ${theme}: 120 native frames; ${Object.keys(sourceDomHashes).length} source DOM states.`);
} finally {
  await stop();
}
