import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { extname, resolve } from "node:path";
import { promisify } from "node:util";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";

const exec = promisify(execFile);
const root = resolve(import.meta.dirname, "..");
const name = process.argv[2];
const supported = [
  "t3-agent-answer", "t3-message-rewind", "t3-diff-review", "t3-project-action-run",
  "t3-commit-creation", "t3-git-push", "t3-thread-reorder",
];
if (!supported.includes(name)) {
  throw new Error(`Expected one of: ${supported.join(", ")}`);
}
const candidate = resolve(root, `.work/${name}-v0042-candidate`);
const output = resolve(root, `.work/${name}-v0042-cli`);
const candidateSource = await readFile(resolve(candidate, `${name}.html`), "utf8");
const compositionSha256 = createHash("sha256").update(candidateSource).digest("hex");
const cleanEnv = { ...process.env, TMPDIR: resolve(root, ".work/t3-tmp") };
delete cleanEnv.LD_LIBRARY_PATH;
const contentTypes = { ".html": "text/html", ".json": "application/json", ".js": "text/javascript", ".txt": "text/plain", ".md": "text/markdown", ".webp": "image/webp", ".png": "image/png" };

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  const prefix = `/blocks/${name}/`;
  if (!pathname.startsWith(prefix)) {
    response.writeHead(404).end();
    return;
  }
  const file = resolve(candidate, decodeURIComponent(pathname.slice(prefix.length)));
  if (!file.startsWith(candidate + "/")) {
    response.writeHead(404).end();
    return;
  }
  const bytes = await readFile(file).catch(() => null);
  if (!bytes) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { "content-type": contentTypes[extname(file)] ?? "application/octet-stream" }).end(bytes);
});

await mkdir(resolve(root, ".work/t3-tmp"), { recursive: true });
await rm(output, { recursive: true, force: true });
await new Promise((ready) => server.listen(0, "127.0.0.1", ready));
const address = server.address();
if (!address || typeof address === "string") throw new Error("Local registry failed to bind");

try {
  for (const theme of ["dark", "light"]) {
    const project = resolve(output, theme);
    await mkdir(project, { recursive: true });
    await writeFile(resolve(project, "hyperframes.json"), `${JSON.stringify({ paths: { blocks: "compositions", assets: "assets" } })}\n`);
    await exec(process.execPath, [resolve(root, "cli/bin/hyfrme.mjs"), "add", name, "--dir", project, "--force", ...(theme === "light" ? ["--set", "theme=light"] : [])], {
      env: { ...cleanEnv, HYFRME_REGISTRY_URL: `http://127.0.0.1:${address.port}` },
      maxBuffer: 16 * 1024 * 1024,
    });
    const installed = await readFile(resolve(project, "compositions", `${name}.html`), "utf8");
    const installedVariables = installed.match(/data-composition-variables='([^']+)'/)?.[1];
    const sourceVariables = candidateSource.match(/data-composition-variables='([^']+)'/)?.[1];
    if (!installedVariables || !sourceVariables) throw new Error(`${theme} CLI installation lost variable declarations`);
    const decodeVariables = (value) => JSON.parse(value.replaceAll("&amp;", "&").replaceAll("&#39;", "'").replaceAll("&quot;", '"').replaceAll("&lt;", "<").replaceAll("&gt;", ">"));
    const declarations = decodeVariables(installedVariables);
    const expectedDeclarations = decodeVariables(sourceVariables);
    if (theme === "light") expectedDeclarations.find(({ id }) => id === "theme").default = "light";
    if (JSON.stringify(declarations) !== JSON.stringify(expectedDeclarations)) throw new Error(`${theme} CLI install changed variable declarations`);
    let normalized = installed
      .replace(`data-composition-variables='${installedVariables}'`, `data-composition-variables='${sourceVariables}'`)
      .replace("<script>\n      (() => {\n", "<script>")
      .replace("\n      })();\n    </script>", "</script>");
    if (theme === "light") normalized = normalized.replace('"label":"T3 Code appearance","default":"light"', '"label":"T3 Code appearance","default":"dark"');
    if (createHash("sha256").update(normalized).digest("hex") !== compositionSha256) throw new Error(`${theme} CLI-installed source differs from the verified candidate`);
    for (const asset of ["t3-code-gsap.min.js", `${name}.README.md`]) await readFile(resolve(project, "compositions", asset));
    await readFile(resolve(project, "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt"));

    await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:${theme === "light" ? "#fff" : "#0a0a0a"}}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="${name}-cli-fixture-${theme}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-variable-values='{"theme":"${theme}","renderMode":"editable DOM"}' data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['${name}-cli-fixture-${theme}']=gsap.timeline({paused:true});</script></body></html>`);
    const { stdout } = await exec("npx", ["--yes", "hyperframes@0.8.75", "check", project, "--no-browser-gpu", "--json"], { env: { ...cleanEnv, PRODUCER_BROWSER_GPU_MODE: "software" }, maxBuffer: 64 * 1024 * 1024 });
    const check = JSON.parse(stdout.slice(stdout.indexOf("{")));
    if (!check.ok) throw new Error(`${theme} CLI-installed block failed its full HyperFrames check`);
    await writeFile(resolve(project, "check.json"), `${JSON.stringify(check, null, 2)}\n`);
  }
  await writeFile(resolve(output, "proof.json"), `${JSON.stringify({ installedThroughCli: true, name, compositionSha256, themes: ["dark", "light"] }, null, 2)}\n`);
} finally {
  server.close();
}

console.log(`CLI installed ${name} in dark and light; full HyperFrames checks passed.`);
