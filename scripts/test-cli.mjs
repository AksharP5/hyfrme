import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createServer } from "node:http";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { extname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import { runInNewContext } from "node:vm";

const exec = promisify(execFile);
const root = resolve(import.meta.dirname, "..");
const registry = resolve(root, "registry");
const temporary = await mkdtemp(resolve(tmpdir(), "hyfrme-cli-"));
const allTemporary = await mkdtemp(resolve(tmpdir(), "hyfrme-cli-all-"));
const linkedTemporary = await mkdtemp(resolve(tmpdir(), "hyfrme-cli-linked-"));
const nativeTemporary = await mkdtemp(resolve(tmpdir(), "hyfrme-cli-native-"));

const contentTypes = {
  ".html": "text/html",
  ".json": "application/json",
  ".js": "text/javascript",
  ".txt": "text/plain",
  ".woff2": "font/woff2",
};

const registryFixtures = new Map([
  [
    "/blocks/multiline/registry-item.json",
    JSON.stringify({
      name: "multiline",
      title: "Multiline",
      files: [
        {
          path: "multiline.html",
          target: "compositions/multiline.html",
          type: "hyperframes:composition",
        },
        {
          path: "multiline.runtime.js",
          target: "compositions/multiline.runtime.js",
          type: "hyperframes:asset",
        },
      ],
    }),
  ],
  [
    "/blocks/multiline/multiline.html",
    '<html><head></head><body><script src="./multiline.runtime.js"></script></body></html>',
  ],
  [
    "/blocks/multiline/multiline.runtime.js",
    "window.lines = window.__hyperframes.getVariables().text.split(`\n`);\nwindow.defaultText = `first\nsecond`;",
  ],
  [
    "/blocks/boundary/registry-item.json",
    JSON.stringify({
      name: "boundary",
      files: [
        {
          path: "boundary.html",
          target: "compositions/boundary.html",
          type: "hyperframes:composition",
        },
      ],
    }),
  ],
  [
    "/blocks/boundary/boundary.html",
    `<html data-composition-variables='[{"id":"amount","type":"number","default":1,"min":0,"max":4},{"id":"mode","type":"string","default":"one","options":["one","two"]}]'><head></head><body>fixture</body></html>`,
  ],
]);

const nativeBlockSource = `<!doctype html>
<html data-composition-variables='[{"id":"label","type":"string","default":"Hyfrm","maxLength":5},{"id":"mode","type":"enum","default":"one","options":[{"value":"one","label":"One"},{"value":"two","label":"Two"}]}]'><head><style>body { background: black; }</style></head><body><div data-composition-id="original-native-block"><img src="assets/native.txt?v=1#demo"><img src="../assets/native.txt"></div><script src="./native.runtime.js"></script></body></html>`;
const nativeRuntimeSource =
  'window.__hyfrmeRenderFrame = () => "assets/native.txt";';
const nativeSnippetSource =
  '<div class="hyfrme-snippet">Hyfrme</div><style>.hyfrme-snippet { color: red; }</style>';
const nativeTemplateSource =
  '<!doctype html><html><head></head><body><div data-composition-id="native-project" data-composition-src="compositions/native-scene.html"></div></body></html>';
const nativeSceneSource =
  '<!doctype html><html><head></head><body><div data-composition-id="native-scene">Hyfrme</div></body></html>';
const mediaTemplateSource =
  '<html><head></head><body data-duration="__VIDEO_DURATION__"><video src="__VIDEO_SRC__"><source></video><audio src="__VIDEO_SRC__"></audio><video src="assets/owned.mp4"></video></body></html>';
const hostedSource =
  '<html><head></head><body><img src="https://example.com/hyfrme/hosted.txt"><img src="https://example.com/hyfrme/unlisted.txt"></body></html>';
const decisionTreeSource =
  '<html><head></head><body><script>window.hold = tl.labels["hold5"];</script></body></html>';

const registerNativeFixture = (name, type, files, metadata = {}) => {
  registryFixtures.set(
    `/blocks/${name}/registry-item.json`,
    JSON.stringify({
      name,
      type,
      origin: {
        repository: "https://github.com/heygen-com/hyperframes",
        name: name.replace(/^hyperframes-/, ""),
      },
      ...metadata,
      files: files.map(({ body, ...file }) => file),
    }),
  );
  for (const file of files) {
    registryFixtures.set(`/blocks/${name}/${file.path}`, file.body);
  }
};

registerNativeFixture("hyperframes-native-component", "hyperframes:component", [
  {
    path: "native-component.html",
    target: "compositions/components/native-component.html",
    type: "hyperframes:snippet",
    body: nativeSnippetSource,
  },
]);
registerNativeFixture(
  "hyperframes-native-block",
  "hyperframes:block",
  [
    {
      path: "native-block.html",
      target: "compositions/native-block.html",
      type: "hyperframes:composition",
      body: nativeBlockSource,
    },
    {
      path: "native.runtime.js",
      target: "compositions/native.runtime.js",
      type: "hyperframes:asset",
      body: nativeRuntimeSource,
    },
    {
      path: "assets/native.txt",
      target: "assets/native.txt",
      type: "hyperframes:asset",
      body: "Hyfrme native asset",
    },
  ],
  {
    title: "Native Block",
    dimensions: { width: 1920, height: 1080 },
    duration: 10,
    registryDependencies: ["hyperframes-native-component"],
  },
);
registerNativeFixture("hyperframes-native-template", "hyperframes:example", [
  {
    path: "index.html",
    target: "index.html",
    type: "hyperframes:composition",
    body: nativeTemplateSource,
  },
  {
    path: "compositions/native-scene.html",
    target: "compositions/native-scene.html",
    type: "hyperframes:composition",
    body: nativeSceneSource,
  },
]);
registerNativeFixture("hyperframes-media-template", "hyperframes:example", [
  {
    path: "index.html",
    target: "index.html",
    type: "hyperframes:composition",
    body: mediaTemplateSource,
  },
]);
for (const name of ["hyperframes-decision-tree", "hyperframes-label-template"]) {
  registerNativeFixture(name, "hyperframes:example", [
    {
      path: "index.html",
      target: "index.html",
      type: "hyperframes:composition",
      body: nativeTemplateSource.replace(
        "compositions/native-scene.html",
        "compositions/decision_tree.html",
      ),
    },
    {
      path: "compositions/decision_tree.html",
      target: "compositions/decision_tree.html",
      type: "hyperframes:composition",
      body: decisionTreeSource,
    },
  ]);
}
registerNativeFixture(
  "hyperframes-css-only",
  "hyperframes:block",
  [
    {
      path: "css-only.html",
      target: "compositions/css-only.html",
      type: "hyperframes:composition",
      body: "<html><head><style>body { background: #000; }</style></head><body>Hyfrme</body></html>",
    },
  ],
  { params: [{ key: "--bg-color", type: "color", default: "#000" }] },
);
registerNativeFixture("hyperframes-hosted-block", "hyperframes:block", [
  {
    path: "hosted.html",
    target: "compositions/hosted.html",
    type: "hyperframes:composition",
    body: hostedSource,
  },
  {
    path: "hosted.txt",
    target: "assets/hosted.txt",
    type: "hyperframes:asset",
    url: "https://example.com/hyfrme/hosted.txt",
    body: "Hyfrme locally frozen asset",
  },
]);
for (const [name, dependency] of [
  ["hyperframes-cycle-a", "hyperframes-cycle-b"],
  ["hyperframes-cycle-b", "hyperframes-cycle-a"],
]) {
  registerNativeFixture(
    name,
    "hyperframes:component",
    [
      {
        path: "cycle.html",
        target: "compositions/components/cycle.html",
        type: "hyperframes:snippet",
        body: nativeSnippetSource,
      },
    ],
    { registryDependencies: [dependency] },
  );
}

let requestCount = 0;
const server = createServer(async (request, response) => {
  requestCount += 1;
  try {
    const url = new URL(request.url ?? "/", "http://localhost");
    if (registryFixtures.has(url.pathname)) {
      response.writeHead(200, {
        "content-type": contentTypes[extname(url.pathname)],
      });
      response.end(registryFixtures.get(url.pathname));
      return;
    }
    if (url.pathname === "/registry.json") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          name: "hyfrme",
          items: [
            { name: "soft-blur-in", type: "hyperframes:block" },
            { name: "matrix-decode", type: "hyperframes:block" },
            { name: "hyperframes-native-block", type: "hyperframes:block" },
            { name: "hyperframes-native-component", type: "hyperframes:component" },
            { name: "hyperframes-native-template", type: "hyperframes:example" },
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
const runCli = (args) =>
  exec(process.execPath, [resolve(root, "cli/bin/hyfrme.mjs"), ...args], {
    env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl },
  });

try {
  for (const command of ["add", "init"]) {
    for (const options of [["--dir"], ["--dir", "--force"], ["--dir="]]) {
      await assert.rejects(
        exec(
          process.execPath,
          [
            resolve(root, "cli/bin/hyfrme.mjs"),
            command,
            "hyperframes-native-template",
            ...options,
          ],
          {
            cwd: temporary,
            env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl },
          },
        ),
        (error) => error.code === 1 && /--dir requires a path/.test(error.stderr),
      );
    }
  }
  assert.equal(requestCount, 0);
  assert.deepEqual(await readdir(temporary), []);

  for (const name of [
    "hyperframes-week-in-merges",
    "hyperframes-simulated-cursor",
    "hyperframes-touch-indicator",
    "hyperframes-caption-texture",
    "hyperframes-carousel-circle-1",
  ]) {
    const project = resolve(nativeTemporary, name);
    await mkdir(project, { recursive: true });
    await writeFile(resolve(project, "hyperframes.json"), "{}\n");
    const manifest = JSON.parse(
      await readFile(
        resolve(registry, "blocks", name, "registry-item.json"),
        "utf8",
      ),
    );
    await runCli(["add", name, "--dir", project]);
    for (const file of manifest.files) {
      assert.deepEqual(
        await readFile(resolve(project, file.target)),
        await readFile(resolve(registry, "blocks", name, file.path)),
      );
    }
  }


  const touchSource = await readFile(
    resolve(
      registry,
      "blocks/hyperframes-touch-indicator/touch-indicator.html",
    ),
    "utf8",
  );
  const touchExample = `<!-- data-composition-variables='[{"id":"gesture","type":"enum","default":"tap","options":[{"value":"tap"},{"value":"swipe"}]}]' -->\n`;
  registryFixtures.set(
    "/blocks/hyperframes-touch-indicator/touch-indicator.html",
    `${touchExample}${touchSource}`,
  );
  await runCli([
    "add",
    "hyperframes-touch-indicator",
    "--dir",
    resolve(nativeTemporary, "hyperframes-touch-indicator"),
    "--force",
    "--set",
    "gesture=swipe",
    "--set",
    "targetX=42",
  ]);
  registryFixtures.delete(
    "/blocks/hyperframes-touch-indicator/touch-indicator.html",
  );
  const customizedTouch = await readFile(
    resolve(
      nativeTemporary,
      "hyperframes-touch-indicator/compositions/components/touch-indicator.html",
    ),
    "utf8",
  );
  assert(customizedTouch.startsWith(touchExample));
  const touchCarriers = [
    ...customizedTouch
      .replace(/<!--[\s\S]*?-->/g, "")
      .matchAll(/data-composition-variables='([^']*)'/g),
  ];
  assert.equal(touchCarriers.length, 2);
  for (const [, metadata] of touchCarriers) {
    const variables = JSON.parse(metadata);
    assert.equal(
      variables.find((variable) => variable.id === "gesture").default,
      "swipe",
    );
    assert.equal(
      variables.find((variable) => variable.id === "targetX").default,
      42,
    );
  }

  const relocatedProject = resolve(nativeTemporary, "relocated");
  await mkdir(relocatedProject);
  const relocatedPaths = {
    blocks: "motion/blocks #?'()%",
    components: "motion/components #?'()%",
    assets: "static/media #?'()%",
  };
  const fileForUrl = (value) => {
    const url = new URL(value, "https://hyfrme.test/");
    return resolve(relocatedProject, `.${decodeURIComponent(url.pathname)}`);
  };
  await writeFile(
    resolve(relocatedProject, "hyperframes.json"),
    JSON.stringify({ paths: relocatedPaths }),
  );
  await runCli([
    "add",
    "hyperframes-caption-texture",
    "hyperframes-carousel-circle-1",
    "--dir",
    relocatedProject,
  ]);
  const texture = await readFile(
    resolve(relocatedProject, relocatedPaths.components, "caption-texture.html"),
    "utf8",
  );
  const texturePath = runInNewContext(
    `${texture.match(/var TEXTURE_URL[^;]+;/)[0]} TEXTURE_URL;`,
    { TEXTURE: "lava" },
  );
  assert.deepEqual(
    await readFile(fileForUrl(texturePath)),
    await readFile(
      resolve(registry, "blocks/hyperframes-caption-texture/lava.png"),
    ),
  );
  const carousel = await readFile(
    resolve(relocatedProject, relocatedPaths.blocks, "carousel-circle-1.html"),
    "utf8",
  );
  const carouselPrefix = carousel.match(/varUrl\(V\[id\]\) \|\| "([^"]+)"/)[1];
  assert.deepEqual(
    await readFile(fileForUrl(`${carouselPrefix}artist-bob-seger.jpg`)),
    await readFile(
      resolve(
        registry,
        "blocks/hyperframes-carousel-circle-1/assets/carousel-images/artist-bob-seger.jpg",
      ),
    ),
  );
  assert.doesNotMatch(carousel, /"assets\/carousel-images\/"/);

  await runCli([
    "add",
    "hyperframes-heygen-avatar-promo-card",
    "--dir",
    relocatedProject,
  ]);
  const avatarCard = await readFile(
    resolve(
      relocatedProject,
      relocatedPaths.blocks,
      "heygen-avatar-promo-card.html",
    ),
    "utf8",
  );
  for (const match of avatarCard.matchAll(
    /src="([^"]+heygen-logo\.svg\?t=\d+)"/g,
  )) {
    assert.match(match[1], /^static\/media%20%23%3F%27%28%29%25\//);
    await readFile(fileForUrl(match[1]));
  }
  assert.doesNotMatch(avatarCard, /src="assets\/heygen-logo\.svg\?/);

  const reservedNative = await runCli([
    "add",
    "hyperframes-native-block",
    "--dir",
    relocatedProject,
  ]);
  const nativeWiring = reservedNative.stdout.match(
    /data-composition-src="([^"]+)"/,
  )[1];
  const reservedNativeSource = await readFile(fileForUrl(nativeWiring), "utf8");
  const nativeMedia = new URL(
    reservedNativeSource.match(/src="([^"]+native\.txt\?v=1#demo)"/)[1],
    "https://hyfrme.test/",
  );
  assert.equal(nativeMedia.search, "?v=1");
  assert.equal(nativeMedia.hash, "#demo");
  assert.equal(
    await readFile(fileForUrl(nativeMedia), "utf8"),
    "Hyfrme native asset",
  );

  const reservedPort = await runCli([
    "add",
    "matrix-decode",
    "--dir",
    relocatedProject,
  ]);
  const portWiring = reservedPort.stdout.match(
    /data-composition-src="([^"]+)"/,
  )[1];
  const reservedPortSource = await readFile(fileForUrl(portWiring), "utf8");
  const fontUrl = reservedPortSource.match(
    /url\("([^"]+Geist-SemiBold\.woff2)"\)/,
  )[1];
  assert.deepEqual(
    await readFile(fileForUrl(fontUrl)),
    await readFile(resolve(registry, "blocks/matrix-decode/Geist-SemiBold.woff2")),
  );
  assert.doesNotMatch(
    reservedPortSource,
    /src="[^"]+matrix-decode\.runtime\.js"/,
  );
  assert.match(
    reservedPortSource,
    /window\.__hyfrmeRenderers\["matrix-decode"\]/,
  );

  for (const blocks of ["motion/blocks", "compositions/hyfrme"]) {
    const project = resolve(nativeTemporary, blocks.replaceAll("/", "-"));
    await mkdir(project);
    await writeFile(
      resolve(project, "hyperframes.json"),
      JSON.stringify({ paths: { blocks } }),
    );
    await runCli([
      "add",
      "t3-commit-creation",
      "t3-fast-service-tier",
      "t3-visual-context-shelf",
      "--dir",
      project,
    ]);
    const commitCreation = await readFile(
      resolve(project, blocks, "t3-commit-creation.html"),
      "utf8",
    );
    const preloads = [
      ...commitCreation.matchAll(/data-t3-preload-src="([^"]+)"/g),
    ];
    assert.equal(preloads.length, 20);
    for (const [, path] of preloads) {
      assert(path.startsWith(`${blocks}/`));
      await readFile(resolve(project, path));
    }
    const fastTier = await readFile(
      resolve(project, blocks, "t3-fast-service-tier.html"),
      "utf8",
    );
    const rasterPath = runInNewContext(
      `${fastTier.match(/raster\.src = [^;]+;/)[0]} raster.src;`,
      {
        raster: {},
        options: { theme: "dark" },
        section: { dataset: { t3Popup: "hover" } },
      },
    );
    assert(rasterPath.startsWith(`${blocks}/`));
    await readFile(resolve(project, rasterPath));
    const shelf = await readFile(
      resolve(project, blocks, "t3-visual-context-shelf.html"),
      "utf8",
    );
    const variables = JSON.parse(
      shelf.match(/data-composition-variables='([^']+)'/)[1],
    );
    const imageSrc = variables.find(
      (variable) => variable.id === "imageSrc",
    ).default;
    assert(imageSrc.startsWith(`${blocks}/`));
    await readFile(resolve(project, imageSrc));
  }


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

  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-brief-to-prompt",
      "--dir",
      temporary,
      "--set",
      "projectName=motion-lab",
      "--set",
      "prompt=Audit this animation frame by frame.",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const t3Installed = await readFile(
    resolve(temporary, "motion/hyfrme/t3-brief-to-prompt.html"),
    "utf8",
  );
  const t3Variables = JSON.parse(
    t3Installed
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  assert.equal(
    t3Variables.find((variable) => variable.id === "projectName").default,
    "motion-lab",
  );
  assert.equal(
    t3Variables.find((variable) => variable.id === "prompt").default,
    "Audit this animation frame by frame.",
  );
  assert.match(t3Installed, /src="t3-code-gsap\.min\.js"/);
  await readFile(resolve(temporary, "motion/hyfrme/t3-code-gsap.min.js"));
  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-new-worktree-choice",
      "--dir",
      temporary,
      "--set",
      "projectName=motion-lab",
      "--set",
      "baseBranch=origin/feature",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const t3Worktree = await readFile(
    resolve(temporary, "motion/hyfrme/t3-new-worktree-choice.html"),
    "utf8",
  );
  const worktreeVariables = JSON.parse(
    t3Worktree
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  assert.equal(
    worktreeVariables.find((variable) => variable.id === "baseBranch").default,
    "origin/feature",
  );
  assert.match(t3Worktree, /src="t3-code-gsap\.min\.js"/);
  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-return-worktree",
      "--dir",
      temporary,
      "--set",
      "projectName=motion-lab",
      "--set",
      "previousWorktree=logo/final-frame",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const t3ReturnWorktree = await readFile(
    resolve(temporary, "motion/hyfrme/t3-return-worktree.html"),
    "utf8",
  );
  const returnWorktreeVariables = JSON.parse(
    t3ReturnWorktree
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  assert.equal(
    returnWorktreeVariables.find((variable) => variable.id === "previousWorktree").default,
    "logo/final-frame",
  );

  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-model-swap",
      "--dir",
      temporary,
      "--set",
      "projectName=motion-lab",
      "--set",
      "threadOneAge=2h",
      "--set",
      "modelAfter=GPT-6-Astra",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const t3Model = await readFile(
    resolve(temporary, "motion/hyfrme/t3-model-swap.html"),
    "utf8",
  );
  const modelVariables = JSON.parse(
    t3Model
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  assert.equal(
    modelVariables.find((variable) => variable.id === "threadOneAge").default,
    "2h",
  );
  assert.equal(
    modelVariables.find((variable) => variable.id === "modelAfter").default,
    "GPT-6-Astra",
  );
  assert.match(t3Model, /src="t3-code-gsap\.min\.js"/);
  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-reasoning-level",
      "--dir",
      temporary,
      "--set",
      "projectName=motion-lab",
      "--set",
      "reasoningAfter=Ultra",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const t3Reasoning = await readFile(
    resolve(temporary, "motion/hyfrme/t3-reasoning-level.html"),
    "utf8",
  );
  const reasoningVariables = JSON.parse(
    t3Reasoning
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  assert.equal(
    reasoningVariables.find((variable) => variable.id === "reasoningAfter").default,
    "Ultra",
  );
  assert.match(t3Reasoning, /src="t3-code-gsap\.min\.js"/);
  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-fast-service-tier",
      "--dir",
      temporary,
      "--set",
      "projectName=motion-lab",
      "--set",
      "selectFrame=90",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const t3FastTier = await readFile(
    resolve(temporary, "motion/hyfrme/t3-fast-service-tier.html"),
    "utf8",
  );
  const fastTierVariables = JSON.parse(
    t3FastTier
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  assert.equal(
    fastTierVariables.find((variable) => variable.id === "selectFrame").default,
    90,
  );
  assert.match(t3FastTier, /src="t3-code-gsap\.min\.js"/);
  await readFile(resolve(temporary, "motion/hyfrme/fast-tier-v0042-dark-menu-raster.png"));
  await readFile(resolve(temporary, "motion/hyfrme/fast-tier-v0042-light-hover-raster.png"));
  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-permission-choice",
      "--dir",
      temporary,
      "--set",
      "projectName=motion-lab",
      "--set",
      "permissionAfter=Full access",
      "--set",
      "openFrame=20",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const t3Permission = await readFile(
    resolve(temporary, "motion/hyfrme/t3-permission-choice.html"),
    "utf8",
  );
  const permissionVariables = JSON.parse(
    t3Permission
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  assert.equal(
    permissionVariables.find((variable) => variable.id === "permissionAfter").default,
    "Full access",
  );
  assert.equal(
    permissionVariables.find((variable) => variable.id === "openFrame").default,
    20,
  );
  await readFile(resolve(temporary, "motion/hyfrme/permission-choice-dark-menu-raster.png"));
  await readFile(resolve(temporary, "motion/hyfrme/permission-choice-light-hover-raster.png"));
  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-thread-switch",
      "--dir",
      temporary,
      "--set",
      "projectName=motion-lab",
      "--set",
      "threadOne=Logo intro review",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const t3ThreadSwitch = await readFile(
    resolve(temporary, "motion/hyfrme/t3-thread-switch.html"),
    "utf8",
  );
  const threadSwitchVariables = JSON.parse(
    t3ThreadSwitch
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  assert.equal(
    threadSwitchVariables.find((variable) => variable.id === "threadOne").default,
    "Logo intro review",
  );
  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-thread-search",
      "--dir",
      temporary,
      "--set",
      "projectName=motion-lab",
      "--set",
      "finalQuery=logo enter",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const t3ThreadSearch = await readFile(
    resolve(temporary, "motion/hyfrme/t3-thread-search.html"),
    "utf8",
  );
  const threadSearchVariables = JSON.parse(
    t3ThreadSearch
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  assert.equal(
    threadSearchVariables.find((variable) => variable.id === "finalQuery").default,
    "logo enter",
  );
  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-sidebar-focus",
      "--dir",
      temporary,
      "--set",
      "projectName=motion-lab",
      "--set",
      "sidebarWidth=300",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const t3SidebarFocus = await readFile(
    resolve(temporary, "motion/hyfrme/t3-sidebar-focus.html"),
    "utf8",
  );
  const sidebarFocusVariables = JSON.parse(
    t3SidebarFocus
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  assert.equal(
    sidebarFocusVariables.find((variable) => variable.id === "sidebarWidth").default,
    300,
  );
  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-visual-context-shelf",
      "--dir",
      temporary,
      "--set",
      "projectName=motion-lab",
      "--set",
      "imageName=logo-enter-reference.png",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const t3VisualContext = await readFile(
    resolve(temporary, "motion/hyfrme/t3-visual-context-shelf.html"),
    "utf8",
  );
  const visualContextVariables = JSON.parse(
    t3VisualContext
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  assert.equal(
    visualContextVariables.find((variable) => variable.id === "imageName").default,
    "logo-enter-reference.png",
  );
  await readFile(resolve(temporary, "motion/hyfrme/t3-visual-context-logo-enter.png"));
  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-worked-trace",
      "--dir",
      temporary,
      "--set",
      "projectName=motion-lab",
      "--set",
      "command=npm run check",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const t3WorkedTrace = await readFile(
    resolve(temporary, "motion/hyfrme/t3-worked-trace.html"),
    "utf8",
  );
  const workedTraceVariables = JSON.parse(
    t3WorkedTrace
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&quot;", '"')
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  assert.equal(
    workedTraceVariables.find((variable) => variable.id === "command").default,
    "npm run check",
  );
  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-thread-actions",
      "--dir",
      temporary,
      "--set",
      "branchName=logo/final-frame",
      "--set",
      "menuItem2=Pin this thread",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const t3ThreadActions = await readFile(
    resolve(temporary, "motion/hyfrme/t3-thread-actions.html"),
    "utf8",
  );
  const threadActionVariables = JSON.parse(
    t3ThreadActions
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  assert.equal(
    threadActionVariables.find((variable) => variable.id === "branchName").default,
    "logo/final-frame",
  );
  assert.equal(
    threadActionVariables.find((variable) => variable.id === "menuItem2").default,
    "Pin this thread",
  );
  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-settle-thread",
      "--dir",
      temporary,
      "--set",
      "settledThread=Verify motion parity",
      "--set",
      "settledCount=4",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const t3SettleThread = await readFile(
    resolve(temporary, "motion/hyfrme/t3-settle-thread.html"),
    "utf8",
  );
  const settleThreadVariables = JSON.parse(
    t3SettleThread
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  assert.equal(
    settleThreadVariables.find((variable) => variable.id === "settledThread").default,
    "Verify motion parity",
  );
  assert.equal(
    settleThreadVariables.find((variable) => variable.id === "settledCount").default,
    4,
  );
  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-project-source-picker",
      "--dir",
      temporary,
      "--set",
      "sourcesTitle=Choose a source",
      "--set",
      "searchPlaceholder=Search source types",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const t3ProjectSourcePicker = await readFile(
    resolve(temporary, "motion/hyfrme/t3-project-source-picker.html"),
    "utf8",
  );
  const sourcePickerVariables = JSON.parse(
    t3ProjectSourcePicker
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  assert.equal(
    sourcePickerVariables.find((variable) => variable.id === "sourcesTitle").default,
    "Choose a source",
  );
  assert.equal(
    sourcePickerVariables.find((variable) => variable.id === "searchPlaceholder").default,
    "Search source types",
  );
  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-terminal-check",
      "--dir",
      temporary,
      "--set",
      "command=git diff --stat",
      "--set",
      "output=1 file changed",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const t3TerminalCheck = await readFile(
    resolve(temporary, "motion/hyfrme/t3-terminal-check.html"),
    "utf8",
  );
  const terminalCheckVariables = JSON.parse(
    t3TerminalCheck
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  assert.equal(
    terminalCheckVariables.find((variable) => variable.id === "command").default,
    "git diff --stat",
  );
  assert.equal(
    terminalCheckVariables.find((variable) => variable.id === "output").default,
    "1 file changed",
  );
  await readFile(resolve(temporary, "motion/hyfrme/terminal-check-canvas-ready-0.png"));
  await readFile(resolve(temporary, "motion/hyfrme/terminal-check-canvas-output-12.png"));
  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-file-surface",
      "--dir",
      temporary,
      "--set",
      "filesLabel=Project files",
      "--set",
      "treeRow4=HYFRME.md",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const t3FileSurface = await readFile(
    resolve(temporary, "motion/hyfrme/t3-file-surface.html"),
    "utf8",
  );
  const fileSurfaceVariables = JSON.parse(
    t3FileSurface
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  assert.equal(
    fileSurfaceVariables.find((variable) => variable.id === "filesLabel").default,
    "Project files",
  );
  assert.equal(
    fileSurfaceVariables.find((variable) => variable.id === "treeRow4").default,
    "HYFRME.md",
  );
  await readFile(resolve(temporary, "THIRD_PARTY_LICENSES/t3-code/PIERRE-TREES-LICENSE.md"));
  await readFile(resolve(temporary, "THIRD_PARTY_LICENSES/pierre/PIERRE-TREES-NOTICE.md"));
  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-source-file-open",
      "--dir",
      temporary,
      "--set",
      "sourceCaption=Logo Motion",
      "--set",
      "fileName=logo-enter-v2.html",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const t3SourceFileOpen = await readFile(
    resolve(temporary, "motion/hyfrme/t3-source-file-open.html"),
    "utf8",
  );
  const sourceFileVariables = JSON.parse(
    t3SourceFileOpen
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  assert.equal(
    sourceFileVariables.find((variable) => variable.id === "sourceCaption").default,
    "Logo Motion",
  );
  assert.equal(
    sourceFileVariables.find((variable) => variable.id === "fileName").default,
    "logo-enter-v2.html",
  );
  await readFile(resolve(temporary, "THIRD_PARTY_LICENSES/t3-code/PIERRE-DIFFS-LICENSE.md"));
  await readFile(resolve(temporary, "THIRD_PARTY_LICENSES/t3-code/T3-THIRD_PARTY_NOTICES.md"));
  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-commit-review",
      "--dir",
      temporary,
      "--set",
      "branchName=feature/logo-polish",
      "--set",
      "commitMessage=Tune Hyfrme logo motion",
      "--set",
      "insertions=12",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const t3CommitReview = await readFile(
    resolve(temporary, "motion/hyfrme/t3-commit-review.html"),
    "utf8",
  );
  const commitReviewVariables = JSON.parse(
    t3CommitReview
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&quot;", '"')
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  assert.equal(
    commitReviewVariables.find((variable) => variable.id === "branchName").default,
    "feature/logo-polish",
  );
  assert.equal(
    commitReviewVariables.find((variable) => variable.id === "commitMessage").default,
    "Tune Hyfrme logo motion",
  );
  assert.equal(
    commitReviewVariables.find((variable) => variable.id === "insertions").default,
    12,
  );
  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-prompt-send",
      "--dir",
      temporary,
      "--set",
      "projectName=hyfrme-studio",
      "--set",
      "prompt=Refine the Hyfrme Logo Enter hold",
      "--set",
      "sendFrame=20",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const promptSend = await readFile(
    resolve(temporary, "motion/hyfrme/t3-prompt-send.html"),
    "utf8",
  );
  const promptSendVariables = JSON.parse(
    promptSend
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  assert.equal(
    promptSendVariables.find((variable) => variable.id === "projectName").default,
    "hyfrme-studio",
  );
  assert.equal(
    promptSendVariables.find((variable) => variable.id === "prompt").default,
    "Refine the Hyfrme Logo Enter hold",
  );
  assert.equal(
    promptSendVariables.find((variable) => variable.id === "sendFrame").default,
    20,
  );
  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-agent-work",
      "--dir",
      temporary,
      "--set",
      "projectName=hyfrme-demo",
      "--set",
      "command=bun run verify:logo-enter",
      "--set",
      "detailFrame=62",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const agentWork = await readFile(
    resolve(temporary, "motion/hyfrme/t3-agent-work.html"),
    "utf8",
  );
  const agentWorkVariables = JSON.parse(
    agentWork
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  assert.equal(
    agentWorkVariables.find((variable) => variable.id === "projectName").default,
    "hyfrme-demo",
  );
  assert.equal(
    agentWorkVariables.find((variable) => variable.id === "command").default,
    "bun run verify:logo-enter",
  );
  assert.equal(
    agentWorkVariables.find((variable) => variable.id === "detailFrame").default,
    62,
  );
  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-agent-answer",
      "--dir",
      temporary,
      "--set",
      "threadOne=Review Logo Flicker",
      "--set",
      "answerLead=I checked the logo timing in",
      "--set",
      "copyFrame=76",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const agentAnswer = await readFile(
    resolve(temporary, "motion/hyfrme/t3-agent-answer.html"),
    "utf8",
  );
  const agentAnswerVariables = JSON.parse(
    agentAnswer
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  assert.equal(
    agentAnswerVariables.find((variable) => variable.id === "threadOne").default,
    "Review Logo Flicker",
  );
  assert.equal(
    agentAnswerVariables.find((variable) => variable.id === "answerLead").default,
    "I checked the logo timing in",
  );
  assert.equal(
    agentAnswerVariables.find((variable) => variable.id === "copyFrame").default,
    76,
  );
  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-message-rewind",
      "--dir",
      temporary,
      "--set",
      "threadOne=Review Hyfrme logo",
      "--set",
      "dialogTitle=Revert this Hyfrme thread?",
      "--set",
      "confirmFrame=70",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const messageRewind = await readFile(
    resolve(temporary, "motion/hyfrme/t3-message-rewind.html"),
    "utf8",
  );
  const messageRewindVariables = JSON.parse(
    messageRewind
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  for (const [id, value] of [
    ["threadOne", "Review Hyfrme logo"],
    ["dialogTitle", "Revert this Hyfrme thread?"],
    ["confirmFrame", 70],
  ]) {
    assert.equal(messageRewindVariables.find((variable) => variable.id === id).default, value);
  }
  await readFile(resolve(temporary, "THIRD_PARTY_LICENSES/t3-code/PIERRE-DIFFS-LICENSE.md"));
  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-project-action",
      "--dir",
      temporary,
      "--set",
      "actionName=Audit Hyfrme",
      "--set",
      "actionCommand=npm run build",
      "--set",
      "shortcutFrame=75",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const projectAction = await readFile(
    resolve(temporary, "motion/hyfrme/t3-project-action.html"),
    "utf8",
  );
  const projectActionVariables = JSON.parse(
    projectAction
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  assert.equal(
    projectActionVariables.find((variable) => variable.id === "actionName").default,
    "Audit Hyfrme",
  );
  assert.equal(
    projectActionVariables.find((variable) => variable.id === "actionCommand").default,
    "npm run build",
  );
  assert.equal(
    projectActionVariables.find((variable) => variable.id === "shortcutFrame").default,
    75,
  );
  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-project-action-run",
      "--dir",
      temporary,
      "--set",
      "projectName=hyfrme-lab",
      "--set",
      "actionName=Audit Hyfrme",
      "--set",
      "command=npm run build",
      "--set",
      "outputFrame=20",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const projectActionRun = await readFile(
    resolve(temporary, "motion/hyfrme/t3-project-action-run.html"),
    "utf8",
  );
  const projectActionRunVariables = JSON.parse(
    projectActionRun
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  for (const [id, value] of [
    ["projectName", "hyfrme-lab"],
    ["actionName", "Audit Hyfrme"],
    ["command", "npm run build"],
    ["outputFrame", 20],
  ]) {
    assert.equal(projectActionRunVariables.find((variable) => variable.id === id).default, value);
  }
  for (const theme of ["dark", "light"]) {
    for (const index of Array.from({ length: 10 }, (_, index) =>
      String(index).padStart(2, "0"),
    )) {
      await readFile(
        resolve(
          temporary,
          `motion/hyfrme/project-action-run-v0042-${theme}-capture-${index}.webp`,
        ),
      );
    }
    for (const index of ["00", "01"]) {
      await readFile(
        resolve(
          temporary,
          `motion/hyfrme/project-action-run-v0042-${theme}-terminal-${index}.png`,
        ),
      );
    }
  }
  await readFile(resolve(temporary, "THIRD_PARTY_LICENSES/t3-code/GHOSTTY-LICENSE.txt"));
  await readFile(resolve(temporary, "THIRD_PARTY_LICENSES/t3-code/SYMBOLS-NERD-FONT-LICENSE.txt"));
  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-thread-rename",
      "--dir",
      temporary,
      "--set",
      "oldTitle=Review Logo Enter",
      "--set",
      "newTitle=Logo Enter parity approved",
      "--set",
      "typedFrame=72",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const threadRename = await readFile(
    resolve(temporary, "motion/hyfrme/t3-thread-rename.html"),
    "utf8",
  );
  const threadRenameVariables = JSON.parse(
    threadRename
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  assert.equal(
    threadRenameVariables.find((variable) => variable.id === "oldTitle").default,
    "Review Logo Enter",
  );
  assert.equal(
    threadRenameVariables.find((variable) => variable.id === "newTitle").default,
    "Logo Enter parity approved",
  );
  assert.equal(
    threadRenameVariables.find((variable) => variable.id === "typedFrame").default,
    72,
  );
  await readFile(resolve(temporary, "motion/hyfrme/thread-rename-v0042-dark-menu-crop.png"));
  await readFile(resolve(temporary, "motion/hyfrme/thread-rename-v0042-light-menu-crop.png"));
  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-thread-pin",
      "--dir",
      temporary,
      "--set",
      "pinThread=Review Logo Enter",
      "--set",
      "activeBranch=logo/parity",
      "--set",
      "pinFrame=68",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const threadPin = await readFile(
    resolve(temporary, "motion/hyfrme/t3-thread-pin.html"),
    "utf8",
  );
  const threadPinVariables = JSON.parse(
    threadPin
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  for (const [id, value] of [
    ["pinThread", "Review Logo Enter"],
    ["activeBranch", "logo/parity"],
    ["pinFrame", 68],
  ]) {
    assert.equal(threadPinVariables.find((variable) => variable.id === id).default, value);
  }
  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-commit-creation",
      "--dir",
      temporary,
      "--set",
      "branchName=hyfrme/brand-pass",
      "--set",
      "commitMessage=Refine Hyfrme intro timing",
      "--set",
      "insertions=7",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const commitCreation = await readFile(
    resolve(temporary, "motion/hyfrme/t3-commit-creation.html"),
    "utf8",
  );
  const commitCreationVariables = JSON.parse(
    commitCreation
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  for (const [id, value] of [
    ["branchName", "hyfrme/brand-pass"],
    ["commitMessage", "Refine Hyfrme intro timing"],
    ["insertions", "7"],
  ]) {
    assert.equal(commitCreationVariables.find((variable) => variable.id === id).default, value);
  }
  await readFile(resolve(temporary, "THIRD_PARTY_LICENSES/t3-code/VSCODE-ICONS-LICENSE.txt"));
  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-thread-snooze",
      "--dir",
      temporary,
      "--set",
      "snoozeThread=Review Hyfrme frames",
      "--set",
      "toastTitle=Thread snoozed for review",
      "--set",
      "expandFrame=88",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const threadSnooze = await readFile(
    resolve(temporary, "motion/hyfrme/t3-thread-snooze.html"),
    "utf8",
  );
  const threadSnoozeVariables = JSON.parse(
    threadSnooze
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&quot;", '"')
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  for (const [id, value] of [
    ["snoozeThread", "Review Hyfrme frames"],
    ["toastTitle", "Thread snoozed for review"],
    ["expandFrame", 88],
  ]) {
    assert.equal(threadSnoozeVariables.find((variable) => variable.id === id).default, value);
  }
  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-thread-archive",
      "--dir",
      temporary,
      "--set",
      "targetThread=Review Hyfrme hold",
      "--set",
      "archiveSection=Stored Hyfrme threads",
      "--set",
      "unarchiveFrame=92",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const threadArchive = await readFile(
    resolve(temporary, "motion/hyfrme/t3-thread-archive.html"),
    "utf8",
  );
  const threadArchiveVariables = JSON.parse(
    threadArchive
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&quot;", '"')
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  for (const [id, value] of [
    ["targetThread", "Review Hyfrme hold"],
    ["archiveSection", "Stored Hyfrme threads"],
    ["unarchiveFrame", 92],
  ]) {
    assert.equal(threadArchiveVariables.find((variable) => variable.id === id).default, value);
  }
  await readFile(resolve(temporary, "motion/hyfrme/thread-archive-v0042-dark-menu-crop.png"));
  await readFile(resolve(temporary, "motion/hyfrme/thread-archive-v0042-light-menu-crop.png"));
  await readFile(resolve(temporary, "THIRD_PARTY_LICENSES/pierre/PIERRE-TREES-LICENSE.md"));
  for (const [slug, overrides] of [
    [
      "t3-git-push",
      [
        ["branchName", "hyfrme/brand-pass"],
        ["selectedThread", "Review logo motion"],
        ["dialogTitle", "Publish Hyfrme project?"],
        ["menuFrame", 18],
        ["dialogFrame", 44],
        ["cancelledFrame", 96],
      ],
    ],
    [
      "t3-file-mention",
      [
        ["projectName", "hyfrme-lab"],
        ["query", "motion"],
        ["selectedFileLabel", "logo-motion.html"],
        ["chipFrame", 90],
      ],
    ],
    [
      "t3-thread-unpin",
      [
        ["projectName", "hyfrme-lab"],
        ["targetThread", "Review logo motion"],
        ["menuFrame", 0],
        ["unpinFrame", 60],
      ],
    ],
    [
      "t3-thread-wake",
      [
        ["projectName", "hyfrme-lab"],
        ["wakeThread", "Resume logo review"],
        ["expandedFrame", 12],
        ["menuFrame", 32],
        ["wakeFrame", 82],
      ],
    ],
    [
      "t3-project-local-open",
      [
        ["newProjectName", "hyfrme-studio"],
        ["folderSearch", "hyfrme-studio"],
        ["addedFrame", 92],
      ],
    ],
    [
      "t3-thread-mark-unread",
      [
        ["projectName", "hyfrme-lab"],
        ["targetThread", "Review logo motion"],
        ["markUnreadFrame", 60],
      ],
    ],
    [
      "t3-project-switch",
      [
        ["projectName", "hyfrme-studio"],
        ["motionProject", "hyfrme-motion"],
        ["motionFrame", 72],
      ],
    ],
    [
      "t3-thread-reorder",
      [
        ["projectName", "hyfrme-lab"],
        ["movedThread", "Review logo motion"],
        ["droppedFrame", 72],
      ],
    ],
    [
      "t3-visual-context-remove",
      [
        ["projectName", "hyfrme-lab"],
        ["imageName", "hyfrme-motion.png"],
        ["removeFrame", 72],
      ],
    ],
  ]) {
    await exec(
      process.execPath,
      [
        resolve(root, "cli/bin/hyfrme.mjs"),
        "add",
        slug,
        "--dir",
        temporary,
        ...overrides.flatMap(([id, value]) => ["--set", `${id}=${value}`]),
      ],
      { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
    );
    const source = await readFile(
      resolve(temporary, "motion/hyfrme", `${slug}.html`),
      "utf8",
    );
    const variables = JSON.parse(
      source
        .match(/data-composition-variables='([^']*)'/)[1]
        .replaceAll("&quot;", '"')
        .replaceAll("&amp;", "&")
        .replaceAll("&#39;", "'"),
    );
    for (const [id, value] of overrides) {
      assert.equal(variables.find((variable) => variable.id === id).default, value);
    }
  }
  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-diff-review",
      "--dir",
      temporary,
      "--set",
      "fileName=hyfrme-intro.html",
      "--set",
      "logoText=Hyfrme Studio",
      "--set",
      "splitFrame=70",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const diffReview = await readFile(
    resolve(temporary, "motion/hyfrme/t3-diff-review.html"),
    "utf8",
  );
  const diffReviewVariables = JSON.parse(
    diffReview
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  for (const [id, value] of [
    ["fileName", "hyfrme-intro.html"],
    ["logoText", "Hyfrme Studio"],
    ["splitFrame", 70],
  ]) {
    assert.equal(diffReviewVariables.find((variable) => variable.id === id).default, value);
  }
  for (const theme of ["dark", "light"]) {
    for (const index of Array.from({ length: 10 }, (_, index) =>
      String(index).padStart(2, "0"),
    )) {
      await readFile(
        resolve(
          temporary,
          `motion/hyfrme/t3-diff-review-capture-${theme}-${index}.webp`,
        ),
      );
    }
  }
  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "t3-prompt-stash",
      "--dir",
      temporary,
      "--set",
      "prompt=Make a Hyfrme Logo Enter cut with a clean final hold",
      "--set",
      "stashLabel=Saved Logo Enter draft",
      "--set",
      "recallFrame=82",
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  const promptStash = await readFile(
    resolve(temporary, "motion/hyfrme/t3-prompt-stash.html"),
    "utf8",
  );
  const promptStashVariables = JSON.parse(
    promptStash
      .match(/data-composition-variables='([^']*)'/)[1]
      .replaceAll("&quot;", '"')
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'"),
  );
  assert.equal(
    promptStashVariables.find((variable) => variable.id === "prompt").default,
    "Make a Hyfrme Logo Enter cut with a clean final hold",
  );
  assert.equal(
    promptStashVariables.find((variable) => variable.id === "stashLabel").default,
    "Saved Logo Enter draft",
  );
  assert.equal(
    promptStashVariables.find((variable) => variable.id === "recallFrame").default,
    82,
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

  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "multiline",
      "--dir",
      temporary,
    ],
    {
      env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl },
    },
  );
  const multiline = await readFile(
    resolve(temporary, "motion/hyfrme/multiline.html"),
    "utf8",
  );
  const preview = {
    __hyperframes: { getVariables: () => ({ text: "first\nsecond" }) },
  };
  for (const [, script] of multiline.matchAll(
    /<script>([\s\S]*?)<\/script>/g,
  )) {
    runInNewContext(script, { window: preview });
  }
  assert.deepEqual(Array.from(preview.lines), ["first", "second"]);
  assert.equal(preview.defaultText, "first\nsecond");

  await writeFile(resolve(nativeTemporary, "hyperframes.json"), "{}");
  const nativeBlock = await runCli([
    "add",
    "hyperframes-native-block",
    "--dir",
    nativeTemporary,
  ]);
  assert.match(nativeBlock.stdout, /data-composition-id="original-native-block"/);
  assert.equal(
    await readFile(
      resolve(nativeTemporary, "compositions/native-block.html"),
      "utf8",
    ),
    nativeBlockSource,
  );
  assert.equal(
    await readFile(
      resolve(nativeTemporary, "compositions/native.runtime.js"),
      "utf8",
    ),
    nativeRuntimeSource,
  );
  assert.equal(
    await readFile(
      resolve(nativeTemporary, "compositions/components/native-component.html"),
      "utf8",
    ),
    nativeSnippetSource,
  );
  const nativeComponent = await runCli([
    "add",
    "hyperframes-native-component",
    "--dir",
    nativeTemporary,
  ]);
  assert.match(nativeComponent.stdout, /Paste the installed snippet/);
  assert.doesNotMatch(nativeComponent.stdout, /data-composition-src/);
  await runCli(["add", "hyperframes-hosted-block", "--dir", nativeTemporary]);
  assert.equal(
    await readFile(resolve(nativeTemporary, "compositions/hosted.html"), "utf8"),
    hostedSource.replace(
      "https://example.com/hyfrme/hosted.txt",
      "assets/hosted.txt",
    ),
  );
  assert.equal(
    await readFile(resolve(nativeTemporary, "assets/hosted.txt"), "utf8"),
    "Hyfrme locally frozen asset",
  );

  await runCli([
    "add",
    "hyperframes-native-block",
    "--dir",
    temporary,
    "--set",
    "mode=two",
  ]);
  const relocatedNative = await readFile(
    resolve(temporary, "motion/hyfrme/native-block.html"),
    "utf8",
  );
  assert.match(relocatedNative, /"type":"enum","default":"two"/);
  assert.match(relocatedNative, /src="static\/hyfrme\/native\.txt\?v=1#demo"/);
  assert.match(relocatedNative, /src="\.\.\/\.\.\/static\/hyfrme\/native\.txt"/);
  assert.match(relocatedNative, /src="\.\/native\.runtime\.js"/);
  assert.doesNotMatch(relocatedNative, /<template>/);
  assert.equal(
    await readFile(resolve(temporary, "motion/hyfrme/native.runtime.js"), "utf8"),
    'window.__hyfrmeRenderFrame = () => "static/hyfrme/native.txt";',
  );
  for (const [setting, error] of [
    ["mode=unsupported", /"mode" must be one of: one, two/],
    ["label=Hyfrme is longer", /"label" must be at most 5 characters/],
  ]) {
    await assert.rejects(
      runCli([
        "add",
        "hyperframes-native-block",
        "--dir",
        nativeTemporary,
        "--force",
        "--set",
        setting,
      ]),
      error,
    );
  }
  await assert.rejects(
    runCli([
      "add",
      "hyperframes-css-only",
      "--dir",
      nativeTemporary,
      "--set",
      "--bg-color=#fff",
    ]),
    /Edit native CSS parameters directly/,
  );
  await assert.rejects(
    runCli(["add", "hyperframes-cycle-a", "--dir", nativeTemporary]),
    /circular registry dependencies: hyperframes-cycle-a -> hyperframes-cycle-b -> hyperframes-cycle-a/,
  );
  await assert.rejects(
    runCli(["add", "hyperframes-native-template", "--dir", nativeTemporary]),
    /Use hyfrme init hyperframes-native-template/,
  );
  await assert.rejects(
    runCli(["init", "hyperframes-native-block", "--dir", nativeTemporary]),
    /is not a project template/,
  );

  const initializedProject = resolve(nativeTemporary, "initialized");
  const initialized = await runCli([
    "init",
    "hyperframes-native-template",
    "--dir",
    initializedProject,
  ]);
  assert.match(initialized.stdout, /Initialized hyperframes-native-template/);
  assert.equal(
    await readFile(resolve(initializedProject, "index.html"), "utf8"),
    nativeTemplateSource,
  );
  assert.equal(
    await readFile(
      resolve(initializedProject, "compositions/native-scene.html"),
      "utf8",
    ),
    nativeSceneSource,
  );
  const initializedConfig = JSON.parse(
    await readFile(resolve(initializedProject, "hyperframes.json"), "utf8"),
  );
  assert.equal(initializedConfig.paths.blocks, "compositions");
  await writeFile(
    resolve(initializedProject, "index.html"),
    "Hyfrme edited project",
  );
  await writeFile(
    resolve(initializedProject, "compositions/native-scene.html"),
    "Hyfrme edited scene",
  );
  await writeFile(resolve(initializedProject, "notes.txt"), "Keep Hyfrme notes");
  await writeFile(
    resolve(initializedProject, "hyperframes.json"),
    '{"userSetting":"keep"}',
  );
  await assert.rejects(
    runCli(["init", "hyperframes-native-template", "--dir", initializedProject]),
    /already exists. Re-run with --force/,
  );
  assert.equal(
    await readFile(resolve(initializedProject, "index.html"), "utf8"),
    "Hyfrme edited project",
  );
  assert.equal(
    await readFile(
      resolve(initializedProject, "compositions/native-scene.html"),
      "utf8",
    ),
    "Hyfrme edited scene",
  );
  await runCli([
    "init",
    "hyperframes-native-template",
    "--dir",
    initializedProject,
    "--force",
  ]);
  assert.equal(
    await readFile(resolve(initializedProject, "index.html"), "utf8"),
    nativeTemplateSource,
  );
  assert.equal(
    await readFile(resolve(initializedProject, "hyperframes.json"), "utf8"),
    '{"userSetting":"keep"}',
  );
  assert.equal(
    await readFile(resolve(initializedProject, "notes.txt"), "utf8"),
    "Keep Hyfrme notes",
  );

  const conflictingProject = resolve(nativeTemporary, "conflicting");
  await mkdir(conflictingProject);
  await writeFile(
    resolve(conflictingProject, "index.html"),
    "Hyfrme user source",
  );
  await assert.rejects(
    runCli(["init", "hyperframes-native-template", "--dir", conflictingProject]),
    /already exists/,
  );
  await assert.rejects(
    readFile(resolve(conflictingProject, "hyperframes.json")),
    { code: "ENOENT" },
  );
  await assert.rejects(
    readFile(resolve(conflictingProject, "compositions/native-scene.html")),
    { code: "ENOENT" },
  );

  const mediaProject = resolve(nativeTemporary, "media");
  await runCli(["init", "hyperframes-media-template", "--dir", mediaProject]);
  assert.equal(
    await readFile(resolve(mediaProject, "index.html"), "utf8"),
    '<html><head></head><body data-duration="10"><video src="assets/owned.mp4"></video></body></html>',
  );
  for (const name of ["hyperframes-decision-tree", "hyperframes-label-template"]) {
    const project = resolve(nativeTemporary, name);
    await runCli(["init", name, "--dir", project]);
    const source = await readFile(
      resolve(project, "compositions/decision_tree.html"),
      "utf8",
    );
    assert.equal(
      source,
      name === "hyperframes-decision-tree"
        ? decisionTreeSource.replace(
            'tl.labels["hold5"]',
            '(tl.labels?.["hold5"] ?? 6.25)',
          )
        : decisionTreeSource,
    );
    if (name !== "hyperframes-decision-tree") continue;
    for (const [timeline, expected] of [[{}, 6.25], [{ labels: { hold5: 7 } }, 7]]) {
      const window = {};
      runInNewContext(source.match(/<script>([\s\S]*?)<\/script>/)[1], {
        window,
        tl: timeline,
      });
      assert.equal(window.hold, expected);
    }
  }

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
  assert.match(installAllResult.stdout, /1 project templates use hyfrme init/);
  assert.match(installAllResult.stdout, /Adding 4 Hyfrme components/);
  assert.match(installAllResult.stdout, /1\/4 Soft Blur In/);
  assert.match(installAllResult.stdout, /2\/4 Matrix Decode/);
  assert.match(installAllResult.stdout, /Added 4 Hyfrme components/);
  await assert.rejects(readFile(resolve(allTemporary, "index.html")), { code: "ENOENT" });
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

  await assert.rejects(
    exec(
      process.execPath,
      [
        resolve(root, "cli/bin/hyfrme.mjs"),
        "add",
        "chat-gpt",
        "--dir",
        temporary,
        "--set",
        "speed=0.75",
      ],
      { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
    ),
    /"speed" must be at least 1, received 0.75/,
  );

  await assert.rejects(
    exec(
      process.execPath,
      [
        resolve(root, "cli/bin/hyfrme.mjs"),
        "add",
        "chat-gpt",
        "--dir",
        temporary,
        "--set",
        "speed=4.25",
      ],
      { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
    ),
    /"speed" must be at most 4, received 4.25/,
  );

  for (const setting of ["amount=", "amount=   ", "mode=unsupported"]) {
    await assert.rejects(
      exec(
        process.execPath,
        [
          resolve(root, "cli/bin/hyfrme.mjs"),
          "add",
          "boundary",
          "--dir",
          temporary,
          "--set",
          setting,
        ],
        { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
      ),
      setting.startsWith("amount=")
        ? /"amount" requires a number/
        : /"mode" must be one of: one, two/,
    );
  }

  const directoryCollision = resolve(nativeTemporary, "directory-collision");
  await mkdir(resolve(directoryCollision, "compositions"), { recursive: true });
  await writeFile(resolve(directoryCollision, "hyperframes.json"), "{}");
  const ownedSource = "Hyfrme user-owned source";
  const sourcePath = resolve(
    directoryCollision,
    "compositions/soft-blur-in.html",
  );
  await writeFile(sourcePath, ownedSource);
  const fontDirectory = resolve(
    directoryCollision,
    "assets/fonts/Geist-SemiBold.woff2",
  );
  await mkdir(fontDirectory, { recursive: true });
  await writeFile(resolve(fontDirectory, "notes.txt"), "Keep Hyfrme notes");
  await assert.rejects(
    runCli(["add", "soft-blur-in", "--dir", directoryCollision, "--force"]),
    /cannot install assets\/fonts\/Geist-SemiBold\.woff2 in soft-blur-in: target is not a file/,
  );
  assert.equal(await readFile(sourcePath, "utf8"), ownedSource);
  assert.equal(
    await readFile(resolve(fontDirectory, "notes.txt"), "utf8"),
    "Keep Hyfrme notes",
  );
  await assert.rejects(
    readFile(resolve(directoryCollision, "THIRD_PARTY_LICENSES/Geist-OFL.txt")),
    { code: "ENOENT" },
  );

  const linkedProject = resolve(linkedTemporary, "project");
  const outside = resolve(linkedTemporary, "outside");
  await mkdir(linkedProject);
  await mkdir(outside);
  await writeFile(
    resolve(linkedProject, "hyperframes.json"),
    JSON.stringify({ paths: { blocks: "motion" } }),
  );
  await symlink(outside, resolve(linkedProject, "motion"));
  await assert.rejects(
    exec(
      process.execPath,
      [
        resolve(root, "cli/bin/hyfrme.mjs"),
        "add",
        "boundary",
        "--dir",
        linkedProject,
        "--force",
      ],
      { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
    ),
    /unsafe target path in boundary/,
  );
  await assert.rejects(readFile(resolve(outside, "boundary.html")), {
    code: "ENOENT",
  });

  await rm(resolve(linkedProject, "motion"));
  await mkdir(resolve(linkedProject, "motion"));
  await symlink(
    resolve(outside, "boundary.html"),
    resolve(linkedProject, "motion/boundary.html"),
  );
  await assert.rejects(
    exec(
      process.execPath,
      [
        resolve(root, "cli/bin/hyfrme.mjs"),
        "add",
        "boundary",
        "--dir",
        linkedProject,
        "--force",
      ],
      { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
    ),
    /unsafe target path in boundary/,
  );
  await assert.rejects(readFile(resolve(outside, "boundary.html")), {
    code: "ENOENT",
  });

  await rm(resolve(linkedProject, "motion"), { recursive: true });
  const local = resolve(linkedProject, "local");
  await mkdir(local);
  await symlink(local, resolve(linkedProject, "motion"));
  await exec(
    process.execPath,
    [
      resolve(root, "cli/bin/hyfrme.mjs"),
      "add",
      "boundary",
      "--dir",
      linkedProject,
    ],
    { env: { ...process.env, HYFRME_REGISTRY_URL: registryUrl } },
  );
  assert.match(await readFile(resolve(local, "boundary.html"), "utf8"), /fixture/);

  console.log("CLI customization tests passed.");
} finally {
  server.close();
  await rm(temporary, { recursive: true, force: true });
  await rm(allTemporary, { recursive: true, force: true });
  await rm(linkedTemporary, { recursive: true, force: true });
  await rm(nativeTemporary, { recursive: true, force: true });
}
