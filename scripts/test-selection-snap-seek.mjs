import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const block = resolve(root, "registry/blocks/selection-snap");
const project = await mkdtemp(resolve(tmpdir(), "selection-snap-seek-"));
const manifest = JSON.parse(
  await readFile(resolve(block, "registry-item.json"), "utf8"),
);
const source = await readFile(resolve(block, "selection-snap.html"), "utf8");
const regression = `<script>
window.addEventListener("load", () => {
  Promise.resolve(window.__hyfrmeReady).then(() => {
    Object.values(window.__timelines || {}).forEach(timeline => timeline.pause());
    const results = [];
    for (const frame of [0, 25, 40, 25, 0, 25]) {
      window.__hyfrmeRenderFrame(frame);
      const text = [...document.querySelectorAll("span")].find(node => node.textContent === "Frame");
      if (!text) throw new Error("Selection Snap text missing");
      const box = text.parentElement;
      const rect = box.getBoundingClientRect();
      results.push({frame, padding: getComputedStyle(box).padding, width: rect.width, height: rect.height});
    }
    const selected = results.filter(result => result.frame === 25);
    if (selected.some(result => result.padding !== "0px 18px" || result.width !== selected[0].width || result.height !== selected[0].height)) {
      throw new Error("Selection Snap padding depends on seek history: " + JSON.stringify(results));
    }
  });
});
</script>`;

try {
  await writeFile(
    resolve(project, "index.html"),
    source
      .replaceAll("../assets/", "./assets/")
      .replace("</body>", `${regression}</body>`),
  );
  await copyFile(
    resolve(block, "selection-snap.runtime.js"),
    resolve(project, "selection-snap.runtime.js"),
  );
  for (const file of manifest.files.filter((file) =>
    file.target.startsWith("assets/"),
  )) {
    const target = resolve(project, file.target);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(resolve(block, file.path), target);
  }
  const result = spawnSync(
    "npx",
    ["--yes", "hyperframes@0.8.99", "check", project, "--at", "0", "--json"],
    {
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    },
  );
  if (result.error || !result.stdout.includes("{")) {
    throw new Error(
      `Selection Snap seek check failed: ${result.error?.message ?? result.stderr}`,
    );
  }
  const report = JSON.parse(result.stdout.slice(result.stdout.indexOf("{")));
  assert.equal(result.status, 0, JSON.stringify(report.runtime));
  assert.equal(report.ok, true, JSON.stringify(report));
  console.log(
    "Selection Snap keeps the same tight box across direct and backward seeks.",
  );
} finally {
  await rm(project, { recursive: true, force: true });
}
