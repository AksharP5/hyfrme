import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";

const exec = promisify(execFile);
const root = resolve(import.meta.dirname, "..");
const registry = resolve(root, "registry");
const temporary = await mkdtemp(resolve(tmpdir(), "hyfrme-cli-"));
const allTemporary = await mkdtemp(resolve(tmpdir(), "hyfrme-cli-all-"));

const contentTypes = {
  ".html": "text/html",
  ".json": "application/json",
  ".js": "text/javascript",
  ".txt": "text/plain",
  ".woff2": "font/woff2",
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", "http://localhost");
    if (url.pathname === "/registry.json") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          name: "hyfrme",
          items: [
            { name: "soft-blur-in", type: "hyperframes:block" },
            { name: "matrix-decode", type: "hyperframes:block" },
          ],
        }),
      );
      return;
    }
    const path = resolve(registry, `.${decodeURIComponent(url.pathname)}`);
    if (!path.startsWith(registry)) throw new Error("Unsafe registry path");
    const body = await readFile(path);
    response.writeHead(200, {
      "content-type": contentTypes[extname(path)] ?? "application/octet-stream",
    });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});

await new Promise((resolveListening) => server.listen(0, resolveListening));
const address = server.address();
assert(address && typeof address === "object");
const registryUrl = `http://127.0.0.1:${address.port}`;

try {
  await writeFile(
    resolve(temporary, "hyperframes.json"),
    JSON.stringify({
      paths: {
        blocks: "motion/hyfrme",
        components: "compositions/components",
        assets: "static/hyfrme",
      },
    }),
  );
  await writeFile(
    resolve(allTemporary, "hyperframes.json"),
    JSON.stringify({
      paths: {
        blocks: "motion/hyfrme",
        components: "compositions/components",
        assets: "static/hyfrme",
      },
    }),
  );

  const result = await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "matrix-decode",
      "--dir",
      temporary,
      "--set",
      "text=HELLO WORLD",
      "--set",
      "fontSize=31",
      "--set",
      "color=#abcdef",
    ],
    {
      env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl },
    },
  );

  assert.match(result.stdout, /customized: text=HELLO WORLD, fontSize=31/);
  const installed = await readFile(
    resolve(temporary, "motion/hyfrme/matrix-decode.html"),
    "utf8",
  );
  const metadataMatch = installed.match(/data-composition-variables='([^']*)'/);
  assert(metadataMatch);
  const variables = JSON.parse(metadataMatch[1].replaceAll("&amp;", "&"));
  assert.equal(
    variables.find((variable) => variable.id === "text").default,
    "HELLO WORLD",
  );
  assert.equal(
    variables.find((variable) => variable.id === "fontSize").default,
    31,
  );
  assert.equal(
    variables.find((variable) => variable.id === "color").default,
    "#abcdef",
  );
  assert.match(installed, /<template>/);
  assert.match(installed, /#root\s*\{/);
  assert.doesNotMatch(installed, /\/gsap(?:\.min)?\.js/);
  assert.match(installed, /\(\(\) => \{/);
  assert.doesNotMatch(installed, /\.\.\/assets\//);
  assert.match(installed, /static\/hyfrme\/fonts\/Geist-SemiBold\.woff2/);
  assert.doesNotMatch(
    installed,
    /src="motion\/hyfrme\/matrix-decode\.runtime\.js"/,
  );
  assert.match(installed, /Bundled license information/);
  assert.doesNotMatch(installed, /Math\.random\s*\(/);
  assert.doesNotMatch(installed, /Date\.now\s*\(/);
  assert.match(
    installed,
    /window\.__hyfrmeVariables\["matrix-decode"\] = window\.__hyperframes\.getVariables\(\)/,
  );
  assert.match(installed, /window\.__hyfrmeRenderers\["matrix-decode"\]/);
  assert.doesNotMatch(installed, /window\.__hyfrmeRenderFrame/);

  const installedRuntime = await readFile(
    resolve(temporary, "motion/hyfrme/matrix-decode.runtime.js"),
    "utf8",
  );
  assert.match(
    installedRuntime,
    /window\.__hyfrmeRenderers\["matrix-decode"\]/,
  );
  assert.match(
    installedRuntime,
    /window\.__hyfrmeVariables\["matrix-decode"\]/,
  );
  assert.doesNotMatch(
    installedRuntime,
    /window\.__hyperframes\.getVariables\(\)/,
  );
  assert.doesNotMatch(installedRuntime, /window\.__hyfrmeRenderFrame/);
  assert.match(result.stdout, /Use it in your composition/);
  assert.match(result.stdout, /id="matrix-decode"/);
  assert.match(
    result.stdout,
    /data-composition-src="motion\/hyfrme\/matrix-decode\.html"/,
  );

  const installAllResult = await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "--all",
      "--dir",
      allTemporary,
    ],
    {
      env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl },
    },
  );
  assert.match(installAllResult.stdout, /Adding 2 Hyfrme components/);
  assert.match(installAllResult.stdout, /1\/2 Soft Blur In/);
  assert.match(installAllResult.stdout, /2\/2 Matrix Decode/);
  assert.match(installAllResult.stdout, /Added 2 Hyfrme components/);
  await readFile(
    resolve(allTemporary, "motion/hyfrme/soft-blur-in.html"),
    "utf8",
  );
  await readFile(
    resolve(allTemporary, "motion/hyfrme/matrix-decode.html"),
    "utf8",
  );

  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "--all",
      "--dir",
      allTemporary,
    ],
    {
      env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl },
    },
  );

  await assert.rejects(
    exec(
      process.execPath,
      [
        resolve(root, "cli/bin/hyfrme.mjs"),
        "add",
        "matrix-decode",
        "--dir",
        temporary,
        "--force",
        "--set",
        "notARealControl=value",
      ],
      { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
    ),
    /unknown setting "notARealControl"/,
  );

  console.log("CLI customization tests passed.");
} finally {
  server.close();
  await rm(temporary, { recursive: true, force: true });
  await rm(allTemporary, { recursive: true, force: true });
}
