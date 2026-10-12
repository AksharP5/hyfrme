import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const hash = async (path) => createHash("sha256").update(await readFile(path)).digest("hex");
const results = {};
for (const theme of ["dark", "light"]) {
  const suffix = theme === "light" ? "-light" : "";
  const prefix = `terminal-check${suffix}`;
  const fixture = JSON.parse(await readFile(resolve(root, `assets/t3-code/v0.0.42/${prefix}-fixture.json`), "utf8"));
  const reference = resolve(root, `parity/t3-terminal-check-v0042${suffix}-reference.mkv`);
  if (await hash(reference) !== fixture.referenceSha256) throw new Error(`${theme} native reference changed`);
  const work = resolve(root, `.work/t3-${prefix}-v0042-reference`);
  const ocrPath = resolve(work, "verified-terminal-output.png");
  const crop = spawnSync("magick", [resolve(work, "frame-0119.png"), "-crop", "539x607+661+52", "+repage", "-resize", "200%", ocrPath], { encoding: "utf8" });
  if (crop.status !== 0) throw new Error(crop.stderr);
  const ocr = spawnSync("tesseract", [ocrPath, "stdout", "--psm", "6"], { encoding: "utf8" });
  if (ocr.status !== 0 || !ocr.stdout.includes(fixture.command) || !ocr.stdout.includes(fixture.expectedOutput.trim()) ||
      !ocr.stdout.includes("hyfrme-t3-demo")) {
    throw new Error(`${theme} native shell did not show the live Hyfrme command and status`);
  }
  const sourceFinal = resolve(root, `.work/t3-source-file-open-v0042-${theme}-verify/native/frame-0119.png`);
  const terminalStart = resolve(work, "frame-0000.png");
  const seam = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "info", "-i", sourceFinal, "-i", terminalStart,
    "-lavfi", "ssim", "-f", "null", "-"], { encoding: "utf8" });
  if (seam.status !== 0) throw new Error(seam.stderr);
  const seamSsim = Number(seam.stderr.match(/All:([\d.]+)/)?.[1]);
  if (!Number.isFinite(seamSsim) || seamSsim < 0.999) throw new Error(`${theme} Source File Open → Terminal Check jump`);
  results[theme] = { referenceSha256: fixture.referenceSha256, liveCommand: fixture.command,
    output: fixture.expectedOutput, finalFrameSha256: await hash(resolve(work, "frame-0119.png")), seamSsim };
}
await writeFile(resolve(root, "parity/t3-terminal-check-v0042-native-proof.json"), JSON.stringify({ themes: results, pass: true }, null, 2) + "\n");
console.log(`Native v0.0.42 Terminal Check: live local command/output and source-file seam passed in both themes.`);
