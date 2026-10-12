import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "assets/t3-code/v0.0.42");
for (const theme of ["dark", "light"]) {
  const native = resolve(root, `parity/t3-return-worktree-v0042-${theme}-reference.mkv`);
  const phases = [
    ["menu", 35, "225:150:360:430"],
    ["hover", 65, "225:150:360:430"],
    ...Array.from({ length: 5 }, (_, index) => [`select-${index}`, 90 + index, "240:180:360:395"]),
  ];
  for (const [phase, frame, region] of phases) {
    const file = resolve(source, `return-worktree-v0042-${theme}-${phase}-crop.png`);
    const result = spawnSync("ffmpeg", ["-v", "error", "-y", "-i", native,
      "-vf", `select=eq(n\\,${frame}),crop=${region}`, "-frames:v", "1", file], { encoding: "utf8" });
    if (result.status !== 0) throw new Error(`Cannot extract ${theme} ${phase}: ${result.stderr}`);
  }
}
console.log("Extracted official dark/light Return to Worktree control pixels.");
