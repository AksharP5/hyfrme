import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);
const root = resolve(import.meta.dirname, "..");
const registry = resolve(root, "public/registry");
const output = resolve(root, "parity/t3-brief-worktree-v0042-sequence");
const names = ["t3-brief-to-prompt", "t3-new-worktree-choice"];
const hash = async (path) => createHash("sha256").update(await readFile(path)).digest("hex");
const run = async (command, args, options = {}) => exec(command, args, {
  env: { ...process.env, TMPDIR: resolve(root, ".work/t3-tmp"), ...options.env },
  maxBuffer: 64 * 1024 * 1024,
});

for (const name of names) {
  const manifest = JSON.parse(await readFile(resolve(root, `parity/${name}.json`), "utf8"));
  if (manifest.status !== "verified" || manifest.origin.commit !== "719a76ca1dbf5490f1aa33ffb9966301e02be9a9" ||
      !manifest.themes?.dark?.result?.pass || !manifest.themes?.light?.result?.pass) {
    throw new Error(`${name} needs published v0.0.42 dark/light parity before sequence verification`);
  }
}

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  if (!pathname.startsWith("/registry/")) return void response.writeHead(404).end();
  const path = resolve(registry, decodeURIComponent(pathname.slice("/registry/".length)));
  if (!path.startsWith(registry + sep)) return void response.writeHead(404).end();
  const bytes = await readFile(path).catch(() => null);
  if (!bytes) return void response.writeHead(404).end();
  response.writeHead(200).end(bytes);
});
await new Promise((ready) => server.listen(0, "127.0.0.1", ready));
const address = server.address();
if (!address || typeof address === "string") throw new Error("Local registry failed to bind");
await mkdir(output, { recursive: true });

const themes = {};
try {
  for (const theme of ["dark", "light"]) {
    const project = theme === "dark"
      ? resolve(root, "examples/t3-code-v0042-brief-worktree")
      : resolve(root, ".work/t3-code-v0042-brief-worktree-light");
    await mkdir(project, { recursive: true });
    await writeFile(resolve(project, "hyperframes.json"), JSON.stringify({
      paths: { blocks: "compositions", assets: "assets" },
    }) + "\n");
    await run(process.execPath, [resolve(root, "cli/bin/hyfrme.mjs"), "add", ...names, "--dir", project, "--force"], {
      env: { HYFRME_REGISTRY_URL: `http://127.0.0.1:${address.port}/registry` },
    });
    const themeValues = theme === "light" ? ` data-variable-values='{"theme":"light"}'` : "";
    const index = `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:${theme === "light" ? "#fff" : "#0a0a0a"}}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-v0042-brief-worktree-sequence" data-start="0" data-duration="8" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="t3-brief-to-prompt" data-composition-src="compositions/t3-brief-to-prompt.html"${themeValues} data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div><div data-composition-id="t3-new-worktree-choice" data-composition-src="compositions/t3-new-worktree-choice.html"${themeValues} data-start="4" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines["t3-v0042-brief-worktree-sequence"]=gsap.timeline({paused:true});</script></body></html>`;
    await writeFile(resolve(project, "index.html"), index);
    const checked = await run("npx", ["--yes", "hyperframes@0.8.75", "check", project, "--json"]);
    const check = JSON.parse(checked.stdout.slice(checked.stdout.indexOf("{")));
    if (!check.ok) throw new Error(`${theme} installed sequence failed full HyperFrames check`);
    await writeFile(resolve(output, `${theme}-check.json`), JSON.stringify(check, null, 2) + "\n");

    const frames = resolve(root, `.work/t3-code-v0042-brief-worktree-${theme}-frames`);
    await run("npx", ["--yes", "hyperframes@0.8.75", "render", project,
      "--format=png-sequence", "-o", frames, "--strict", "--workers=2"]);
    const count = (await readdir(frames)).filter((file) => file.endsWith(".png")).length;
    if (count !== 240) throw new Error(`${theme} installed sequence rendered ${count} instead of 240 frames`);
    const before = resolve(output, `${theme}-before-cut.png`);
    const after = resolve(output, `${theme}-after-cut.png`);
    await copyFile(resolve(frames, "frame_000120.png"), before);
    await copyFile(resolve(frames, "frame_000121.png"), after);
    const comparison = await run("ffmpeg", ["-hide_banner", "-i", before, "-i", after, "-lavfi", "ssim", "-f", "null", "-"]);
    const cutSsim = Number(comparison.stderr.match(/All:([\d.]+)/)?.[1]);
    if (!Number.isFinite(cutSsim) || cutSsim < 0.9999) {
      throw new Error(`${theme} installed sequence cut is discontinuous: ${cutSsim}`);
    }
    const video = resolve(output, `${theme}.mp4`);
    await run("ffmpeg", ["-v", "error", "-y", "-framerate", "30", "-start_number", "1",
      "-i", resolve(frames, "frame_%06d.png"), "-vf", `pad=1200:660:0:0:${theme === "light" ? "white" : "black"}`,
      "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-an", video]);
    if (theme === "light") {
      await copyFile(resolve(project, "index.html"), resolve(root, "examples/t3-code-v0042-brief-worktree/index-light.html"));
    }
    themes[theme] = {
      fullCheck: true, strictRenderFrames: count, cutSsim,
      hashes: {
        example: await hash(resolve(project, "index.html")),
        briefInstalled: await hash(resolve(project, `compositions/${names[0]}.html`)),
        worktreeInstalled: await hash(resolve(project, `compositions/${names[1]}.html`)),
        beforeCut: await hash(before), afterCut: await hash(after), video: await hash(video),
      },
    };
  }
} finally {
  server.close();
}
await writeFile(resolve(root, "parity/t3-brief-worktree-v0042-sequence.json"), JSON.stringify({
  sourceCommit: "719a76ca1dbf5490f1aa33ffb9966301e02be9a9",
  blocks: names, viewport: { width: 1200, height: 659 }, fps: 30, cutFrame: 120,
  installedThroughCli: true, themes,
}, null, 2) + "\n");
console.log(`Installed 8-second v0.0.42 sequence passed dark/light strict renders; cut SSIM ${themes.dark.cutSsim}/${themes.light.cutSsim}`);
