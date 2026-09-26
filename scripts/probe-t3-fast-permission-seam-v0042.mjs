import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const name = "t3-permission-choice";
const source = resolve(root, "registry/blocks", name);
const prompt = JSON.parse(await readFile(resolve(root, "assets/t3-code/v0.0.42/fast-tier-v0042-dark-fixture.json"), "utf8")).prompt;
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&#39;")
  .replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const results = {};
for (const theme of ["dark", "light"]) {
  const project = resolve(root, `.work/t3-fast-permission-seam/${theme}`);
  const compositions = resolve(project, "compositions");
  await mkdir(compositions, { recursive: true });
  for (const file of [
    `${name}.html`, "t3-code-gsap.min.js",
    ...["dark", "light"].flatMap((appearance) => ["menu", "hover"].map((phase) => `permission-choice-${appearance}-${phase}-raster.png`)),
  ]) await copyFile(resolve(source, file), resolve(compositions, file));
  const overrides = { theme, prompt, reasoningLevel: "High", serviceTier: "Fast" };
  await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-fast-permission-seam" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='${escapeAttribute(JSON.stringify(overrides))}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-fast-permission-seam']=gsap.timeline({paused:true});</script></body></html>`);
  await writeFile(resolve(project, "overrides.json"), JSON.stringify(overrides, null, 2) + "\n");
  const snapshot = spawnSync("npx", ["--yes", "hyperframes@0.8.75", "snapshot", project, "--at", "0", "--no-end", "-o", resolve(project, "snapshot")], { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  if (snapshot.status !== 0) throw new Error(`${theme} seam snapshot failed: ${snapshot.stderr.slice(-1500)}`);
  const first = (await readdir(resolve(project, "snapshot"))).find((file) => file.endsWith(".png"));
  if (!first) throw new Error(`${theme} seam snapshot missing`);
  const next = resolve(project, "snapshot", first);
  const previous = resolve(root, `.work/t3-fast-tier-v0042-${theme}-verify/hyperframes/frame_000120.png`);
  const compared = spawnSync("magick", ["compare", "-metric", "AE", previous, next, "null:"], { encoding: "utf8" });
  const changedPixels = Number(compared.stderr.match(/^[\d.]+/)?.[0]);
  if (!Number.isFinite(changedPixels)) throw new Error(`${theme} seam AE failed: ${compared.stderr}`);
  const scored = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "info", "-i", previous, "-i", next,
    "-filter_complex", "[0:v][1:v]ssim", "-frames:v", "1", "-f", "null", "-"], { encoding: "utf8" });
  const ssim = Number(scored.stderr.match(/All:([\d.]+)/)?.[1]);
  if (scored.status !== 0 || !Number.isFinite(ssim)) throw new Error(`${theme} seam SSIM failed: ${scored.stderr.slice(-500)}`);
  results[theme] = { changedPixels, ssim, exact: changedPixels === 0, overrides, previous, next };
  console.log(`${theme} ID16 final to ID17 High/Fast first frame: AE=${changedPixels}, SSIM=${ssim.toFixed(6)}`);
}
await writeFile(resolve(root, ".work/t3-fast-permission-seam/result.json"), JSON.stringify(results, null, 2) + "\n");
