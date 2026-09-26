import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const block = resolve(root, ".work/t3-thread-pin-v0042-candidate");
const project = resolve(root, ".work/t3-thread-pin-v0042-cli-installed");
const darkProject = resolve(root, ".work/t3-thread-pin-v0042-cli-installed-dark");
const name = "t3-thread-pin";
const types = { ".html": "text/html", ".json": "application/json", ".js": "text/javascript", ".md": "text/markdown", ".txt": "text/plain" };
const server = createServer(async (request, response) => {
  const prefix = `/blocks/${name}/`;
  if (!request.url?.startsWith(prefix)) {
    response.writeHead(404).end();
    return;
  }
  const path = resolve(block, decodeURIComponent(request.url.slice(prefix.length)));
  if (!path.startsWith(`${block}${sep}`)) {
    response.writeHead(403).end();
    return;
  }
  const bytes = await readFile(path).catch(() => null);
  if (!bytes) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { "content-type": types[extname(path)] ?? "application/octet-stream" }).end(bytes);
});

await rm(project, { recursive: true, force: true });
await mkdir(project, { recursive: true });
await writeFile(resolve(project, "hyperframes.json"), JSON.stringify({ paths: { blocks: "compositions", components: "compositions/components", assets: "assets" } }));
await new Promise((resolveListening) => server.listen(0, "127.0.0.1", resolveListening));
try {
  const address = server.address();
  assert(address && typeof address === "object");
  const child = spawn(process.execPath, [
    resolve(root, "cli/bin/hyfrme.mjs"), "add", name, "--dir", project,
    "--set", "theme=light", "--set", "pinThread=Audit sidebar menu", "--set", "pinFrame=68",
  ], { env: { ...process.env, HYFRME_REGISTRY_URL: `http://127.0.0.1:${address.port}` } });
  let output = "";
  for await (const chunk of child.stdout) output += chunk;
  let error = "";
  for await (const chunk of child.stderr) error += chunk;
  const exit = await new Promise((resolveExit) => child.on("close", resolveExit));
  assert.equal(exit, 0, error);
  assert.match(output, /T3 Code: Thread Pin/);
  const installed = await readFile(resolve(project, "compositions", `${name}.html`), "utf8");
  const schema = installed.match(/data-composition-variables='([^']*)'/)?.[1];
  assert(schema);
  const variables = JSON.parse(schema.replaceAll("&amp;", "&").replaceAll("&#39;", "'"));
  for (const [id, value] of [["theme", "light"], ["pinThread", "Audit sidebar menu"], ["pinFrame", 68]]) {
    assert.equal(variables.find((variable) => variable.id === id)?.default, value);
  }
  assert.deepEqual(variables.find((variable) => variable.id === "theme")?.options, ["dark", "light"]);
  await readFile(resolve(project, "compositions/t3-code-gsap.min.js"));
  await readFile(resolve(project, "compositions/t3-thread-pin.README.md"));
  const index = (id, values = "") => `<!doctype html><html><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="${id}" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" ${values} data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['${id}']=gsap.timeline({paused:true});</script></body></html>`;
  await writeFile(resolve(project, "index.html"), index("t3-thread-pin-v0042-cli-installed"));
  await rm(darkProject, { recursive: true, force: true });
  await mkdir(darkProject, { recursive: true });
  await cp(resolve(project, "compositions"), resolve(darkProject, "compositions"), { recursive: true });
  await writeFile(resolve(darkProject, "index.html"), index("t3-thread-pin-v0042-cli-installed-dark", `data-variable-values='{"theme":"dark"}'`));
  console.log(`CLI installed ${name} with light theme, custom title, and frame 68; dark override fixture and files passed.`);
} finally {
  server.close();
}
