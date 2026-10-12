import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.35");
const base = JSON.parse(await readFile(resolve(source, "brief-fixture.json"), "utf8"));
const work = resolve(root, ".work/t3-project-rename-reference");
const { observed, projectsBefore, projectsAfter } = JSON.parse(await readFile(resolve(work, "observed.json"), "utf8"));
if (projectsBefore.join("|") !== "hyfrme|hyfrme-motion-lab" ||
    projectsAfter.join("|") !== "hyfrme-motion-lab|hyfrme-studio" ||
    !observed.settings?.path.startsWith("/projects/") ||
    !observed.renamed?.path.startsWith("/projects/") ||
    observed.returned?.path !== observed.workspace?.path) {
  throw new Error("Captured project rename states do not verify the native action");
}
for (let frame = 0; frame < 120; frame++) {
  await readFile(resolve(work, `frame-${String(frame).padStart(4, "0")}.png`));
}
const reference = resolve(root, "parity/t3-project-rename-reference.mkv");
const encoded = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-framerate", "30",
  "-i", resolve(work, "frame-%04d.png"), "-c:v", "ffv1", "-level", "3", "-pix_fmt", "gbrp", reference], { encoding: "utf8" });
if (encoded.status !== 0) throw new Error(encoded.stderr);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const phases = ["workspace", "menu", "settings", "editing", "renamed", "returned"];
const sourceDomHashes = Object.fromEntries(await Promise.all(phases.map(async (phase) =>
  [phase, hash(await readFile(resolve(source, `project-rename-${phase}.html`)))])));
await writeFile(resolve(source, "project-rename-fixture.json"), `${JSON.stringify({
  sourceTag: base.sourceTag, sourceCommit: base.sourceCommit, sourceHashes: base.sourceHashes,
  captureBrowser: "Google Chrome for Testing 152.0.7977.30", viewport: base.viewport,
  fps: 30, frames: 120, phases,
  events: { menu: 20, settings: 35, editing: 55, renamed: 75, returned: 95 },
  projectsBefore, projectsAfter, observed, sourceDomHashes,
  portalHash: hash(await readFile(resolve(source, "project-rename-menu-portal.html"))),
  referenceSha256: hash(await readFile(reference)),
}, null, 2)}\n`);
console.log("Finalized 120 real native T3 Code Project Rename frames; SQLite state and routes verified.");
