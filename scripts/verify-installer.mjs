import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import {
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { extname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const registry = resolve(root, "registry");
const workbench = resolve(root, ".work", "verify-installer");
const renderDirectory = resolve(root, ".work", "renders", "installer");
const renderPath = resolve(renderDirectory, "matrix-decode-customized.mp4");
const runId = `hyfrme-installer-${Date.now()}`;

const contentTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".json": "application/json",
  ".js": "text/javascript",
  ".ttf": "font/ttf",
  ".txt": "text/plain",
  ".woff2": "font/woff2",
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", "http://localhost");
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

const run = (command, args, options = {}) =>
  new Promise((accept, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? root,
      env: {
        ...process.env,
        HYPERFRAMES_RUN_ID: runId,
        ...options.env,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", (chunk) => (output += chunk));
    child.stderr.on("data", (chunk) => (output += chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) accept(output);
      else reject(new Error(`${command} exited ${code}\n${output}`));
    });
  });

const findPngs = async (directory) => {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) found.push(...(await findPngs(path)));
    else if (entry.name.endsWith(".png")) found.push(path);
  }
  return found;
};

await rm(workbench, { recursive: true, force: true });
await rm(renderDirectory, { recursive: true, force: true });
await mkdir(workbench, { recursive: true });
await mkdir(renderDirectory, { recursive: true });

await writeFile(
  resolve(workbench, "hyperframes.json"),
  `${JSON.stringify(
    {
      $schema: "https://hyperframes.heygen.com/schema/hyperframes.json",
      paths: {
        blocks: "compositions",
        components: "compositions/components",
        assets: "assets",
      },
      media: { autoProxy: true },
    },
    null,
    2,
  )}\n`,
);
await writeFile(
  resolve(workbench, "package.json"),
  `${JSON.stringify(
    {
      name: "hyfrme-installer-verification",
      private: true,
      type: "module",
    },
    null,
    2,
  )}\n`,
);
await writeFile(
  resolve(workbench, "meta.json"),
  '{"id":"hyfrme-installer-verification","name":"Hyfrme installer verification"}\n',
);
await writeFile(
  resolve(workbench, "index.html"),
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * { box-sizing: border-box; }
      html, body { width: 1280px; height: 720px; margin: 0; overflow: hidden; }
      #root { position: absolute; inset: 0; background: white; }
      #matrix-decode { position: absolute; inset: 0; }
      #icon-activity {
        position: absolute;
        left: 64px;
        top: 64px;
        width: 48px;
        height: 48px;
      }
    </style>
  </head>
  <body>
    <div
      id="root"
      data-composition-id="installer-verification"
      data-start="0"
      data-duration="3"
      data-fps="30"
      data-width="1280"
      data-height="720"
    >
      <div
        id="matrix-decode"
        data-composition-id="matrix-decode"
        data-composition-src="compositions/matrix-decode.html"
        data-start="0"
        data-duration="3"
        data-track-index="1"
        data-width="1280"
        data-height="720"
      ></div>
      <div
        id="icon-activity"
        data-composition-id="icon-activity"
        data-composition-src="compositions/icon-activity.html"
        data-start="0"
        data-duration="3"
        data-track-index="2"
        data-width="48"
        data-height="48"
      ></div>
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      window.__timelines["installer-verification"] = gsap.timeline({ paused: true });
    </script>
  </body>
</html>
`,
);

await new Promise((resolveListening) => server.listen(0, resolveListening));
const address = server.address();
assert(address && typeof address === "object");
const registryUrl = `http://127.0.0.1:${address.port}`;

try {
  const installOutput = await run(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "matrix-decode",
      "--dir",
      workbench,
      "--set",
      "text=HELLO WORLD",
      "--set",
      "fontSize=31",
      "--set",
      "color=#176b33",
    ],
    { env: { HYFRME_REGISTRY_URL: registryUrl } },
  );
  assert.match(installOutput, /customized: text=HELLO WORLD, fontSize=31/);
  const iconInstallOutput = await run(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "icon-activity",
      "--dir",
      workbench,
      "--set",
      "color=#176b33",
    ],
    { env: { HYFRME_REGISTRY_URL: registryUrl } },
  );
  assert.match(iconInstallOutput, /customized: color=#176b33/);
  const kineticInstallOutput = await run(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "kinetic-warp",
      "--dir",
      workbench,
      "--set",
      "text=HYPER\\nFRAMES",
    ],
    { env: { HYFRME_REGISTRY_URL: registryUrl } },
  );
  assert.match(kineticInstallOutput, /customized: text=HYPER\\nFRAMES/);
  const stretchInstallOutput = await run(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "stretch-in",
      "--dir",
      workbench,
    ],
    { env: { HYFRME_REGISTRY_URL: registryUrl } },
  );
  assert.match(stretchInstallOutput, /Added Stretch In/);
  await Promise.all(
    [
      "PassionOne.css",
      "PassionOne-400.ttf",
      "PassionOne-700.ttf",
      "PassionOne-900.ttf",
      "Anton-Latin.ttf",
    ].map((file) => stat(resolve(workbench, "assets", "fonts", file))),
  );

  const checkOutput = await run(
    "npx",
    ["--yes", "hyperframes@0.7.107", "check", "--at", "1.5,2.8", "--json"],
    { cwd: workbench },
  );
  const jsonStart = checkOutput.indexOf("{");
  assert(jsonStart >= 0, `Expected JSON check output:\n${checkOutput}`);
  const checkEnvelope = JSON.parse(checkOutput.slice(jsonStart));
  assert.equal(checkEnvelope.ok, true, checkOutput);

  await run(
    "npx",
    ["--yes", "hyperframes@0.7.107", "snapshot", "--at", "1.5,2.8"],
    { cwd: workbench },
  );
  const snapshots = await findPngs(workbench);
  assert(snapshots.length >= 2, "Expected at least two installer snapshots");

  await run(
    "npx",
    [
      "--yes",
      "hyperframes@0.7.107",
      "render",
      "--output",
      renderPath,
      "--quality",
      "high",
      "--strict-all",
      "--strict-variables",
      "--workers",
      "4",
      "--quiet",
    ],
    { cwd: workbench },
  );
  assert((await stat(renderPath)).size > 0, "Installer render is empty");

  const probe = await run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    renderPath,
  ]);
  const duration = Number(probe.trim());
  assert(
    duration >= 2.9 && duration <= 3.1,
    `Expected a 3 second render, received ${duration}`,
  );

  console.log(
    "Installed customized blocks passed check, snapshots, and render.",
  );
  console.log(`Render: ${renderPath}`);
  console.log(`Snapshots: ${snapshots.join(", ")}`);
} finally {
  server.close();
}
