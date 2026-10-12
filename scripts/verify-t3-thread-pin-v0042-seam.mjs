import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const work = resolve(root, ".work/t3-thread-pin-v0042-seam-verify");
const candidate = resolve(root, ".work/t3-thread-pin-v0042-candidate/t3-thread-pin.html");
const hash = async (path) => createHash("sha256").update(await readFile(path)).digest("hex");
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr.slice(-2000)} ${result.stdout.slice(-1000)}`);
  return result;
};

await mkdir(work, { recursive: true });
const results = {};
for (const theme of ["dark", "light"]) {
  const project = resolve(root, `.work/t3-thread-pin-v0042-seam-${theme}`);
  const output = resolve(work, theme);
  const native = resolve(root, `.work/t3-thread-unpin-v0042${theme === "light" ? "-light" : ""}-reference/frame-0000.png`);
  await mkdir(output, { recursive: true });
  run("npx", ["--yes", "hyperframes@0.8.75", "snapshot", project, "--at=3.98", "--browser-gpu", "-o", output]);
  const frame = (await readdir(output)).find((file) => /^frame-00-at-3\.98s\.png$/.test(file));
  if (!frame) throw new Error(`${theme} seam snapshot missing at 3.98 s`);
  const shot = resolve(output, frame);
  const comparison = run("ffmpeg", ["-hide_banner", "-loglevel", "info", "-i", shot, "-i", native, "-lavfi", "ssim", "-f", "null", "-"]);
  const ssim = Number(comparison.stderr.match(/All:([\d.]+)/)?.[1]);
  if (!Number.isFinite(ssim)) throw new Error(`${theme} seam SSIM missing`);
  results[theme] = { ssim, hyperframesFrame: relative(root, shot), unpinNativeFrame: relative(root, native), unpinNativeSha256: await hash(native) };
}
const result = { candidateSha256: await hash(candidate), themes: results, pass: results.dark.ssim >= 0.985 && results.light.ssim >= 0.985 };
await writeFile(resolve(work, "result.json"), JSON.stringify(result, null, 2) + "\n");
console.log(`Pin→Unpin seam: dark SSIM ${results.dark.ssim.toFixed(6)}, light ${results.light.ssim.toFixed(6)}, pass=${result.pass}`);
if (!result.pass) throw new Error("Pin→Unpin cut is not seamless enough");
