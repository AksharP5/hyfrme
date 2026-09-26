import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);
const root = resolve(import.meta.dirname, "..");
const name = "t3-sidebar-focus";
const candidate = resolve(root, ".work/t3-sidebar-focus-v0042-candidate");
const candidateSource = await readFile(resolve(candidate, `${name}.html`), "utf8");
const output = resolve(root, ".work/t3-sidebar-focus-v0042-cli");
const types = { ".html": "text/html", ".json": "application/json", ".js": "text/javascript", ".png": "image/png", ".txt": "text/plain", ".md": "text/markdown" };
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  const prefix = `/blocks/${name}/`;
  if (!pathname.startsWith(prefix)) {
    response.writeHead(404).end();
    return;
  }
  const relative = decodeURIComponent(pathname.slice(prefix.length));
  const file = resolve(candidate, relative);
  if (!file.startsWith(candidate + "/")) {
    response.writeHead(404).end();
    return;
  }
  const bytes = await readFile(file).catch(() => null);
  if (!bytes) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" }).end(bytes);
});
await new Promise((ready) => server.listen(0, "127.0.0.1", ready));
const address = server.address();
if (!address || typeof address === "string") throw new Error("Local registry failed to bind");
try {
  for (const theme of ["dark", "light"]) {
    const project = resolve(output, theme);
    await mkdir(project, { recursive: true });
    await writeFile(resolve(project, "hyperframes.json"), JSON.stringify({ paths: { blocks: "compositions", assets: "assets" } }) + "\n");
    await exec(process.execPath, [resolve(root, "cli/bin/hyfrme.mjs"), "add", name, "--dir", project, "--force", ...(theme === "light" ? ["--set", "theme=light"] : [])], {
      env: { ...process.env, HYFRME_REGISTRY_URL: `http://127.0.0.1:${address.port}` },
    });
    const composition = await readFile(resolve(project, "compositions", `${name}.html`), "utf8");
    let normalized = composition
      .replace("\n      (() => {\n\n", "\n")
      .replace("\n\n      })();\n    </script>", "\n</script>");
    if (theme === "light") {
      normalized = normalized.replace('"label":"T3 Code appearance","default":"light"', '"label":"T3 Code appearance","default":"dark"');
    }
    if (normalized !== candidateSource) throw new Error(`CLI-installed ${theme} composition differs from the verified source`);
    const declarations = JSON.parse(composition.match(/data-composition-variables='([^']+)'/)?.[1].replaceAll("&amp;", "&").replaceAll("&#39;", "'") ?? "[]");
    const installedTheme = declarations.find((variable) => variable.id === "theme");
    if (installedTheme?.default !== theme || JSON.stringify(installedTheme.options) !== '["dark","light"]') {
      throw new Error(`Installed ${theme} block lost theme customization`);
    }
    for (const file of ["t3-code-gsap.min.js", "t3-sidebar-focus.README.md"]) {
      await readFile(resolve(project, "compositions", file));
    }
    await readFile(resolve(project, "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt"));
    await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:${theme === "light" ? "#fff" : "#0a0a0a"}}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="t3-sidebar-cli-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div id="t3-sidebar-cli-slot" data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['t3-sidebar-cli-fixture']=gsap.timeline({paused:true});</script></body></html>`);
    const checked = await exec("npx", ["--yes", "hyperframes@0.8.75", "check", project, "--json"], { maxBuffer: 64 * 1024 * 1024 });
    const check = JSON.parse(checked.stdout.slice(checked.stdout.indexOf("{")));
    if (!check.ok || ["lint", "runtime", "layout", "motion", "contrast"].some((gate) => check[gate]?.findings?.length)) {
      throw new Error(`CLI-installed ${theme} full HyperFrames check has findings`);
    }
    await writeFile(resolve(project, "check.json"), JSON.stringify(check, null, 2) + "\n");
  }
  await writeFile(resolve(output, "proof.json"), JSON.stringify({ installedThroughCli: true, themes: ["dark", "light"], source: name,
    compositionSha256: createHash("sha256").update(candidateSource).digest("hex") }, null, 2) + "\n");
} finally {
  server.close();
}
console.log(`CLI installed ${name} in dark and light with complete source and selectable theme.`);
