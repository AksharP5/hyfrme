import { spawn } from "node:child_process";
import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const workbench = resolve(root, ".work", "icon-showcases");
const showcaseScale = 8;
const fixtures = JSON.parse(
  await readFile(resolve(root, "catalog", "icon-fixtures.json"), "utf8"),
);
const onlyIndex = process.argv.indexOf("--only");
const requested =
  onlyIndex === -1 ? null : new Set(process.argv[onlyIndex + 1].split(","));
const selected = requested
  ? fixtures.filter((entry) => requested.has(entry.slug))
  : fixtures;
const reuseReference = process.argv.includes("--reuse-reference");
const resume = process.argv.includes("--resume");

if (requested && selected.length !== requested.size) {
  throw new Error(
    `Expected ${requested.size} fixtures, found ${selected.length}`,
  );
}

const run = (command, args, options = {}) =>
  new Promise((accept, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? root,
      env: { ...process.env, ...options.env },
      stdio: options.quiet ? "pipe" : "inherit",
    });
    let output = "";
    if (options.quiet) {
      child.stdout.on("data", (chunk) => (output += chunk));
      child.stderr.on("data", (chunk) => (output += chunk));
    }
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) accept(output);
      else reject(new Error(`${command} exited ${code}\n${output}`));
    });
  });

const makeShowcaseHtml = (source, entry) => {
  const { width, height, props } = entry.fixture;
  const showcaseWidth = width * showcaseScale;
  const showcaseHeight = height * showcaseScale;
  const showcaseSize = props.size * showcaseScale;
  const schemaMatch = source.match(/data-composition-variables='([^']+)'/);

  if (!schemaMatch) {
    throw new Error(`Missing variable schema in ${entry.slug}`);
  }

  const schema = JSON.parse(schemaMatch[1]);
  const sizeVariable = schema.find((variable) => variable.id === "size");
  if (!sizeVariable) {
    throw new Error(`Missing size variable in ${entry.slug}`);
  }
  sizeVariable.default = showcaseSize;

  const replacements = [
    [schemaMatch[0], `data-composition-variables='${JSON.stringify(schema)}'`],
    [
      `html, body { width: ${width}px; height: ${height}px;`,
      `html, body { width: ${showcaseWidth}px; height: ${showcaseHeight}px;`,
    ],
    [
      `#hyfrme-icon-root { width: ${props.size}px; height: ${props.size}px;`,
      `#hyfrme-icon-root { width: ${showcaseSize}px; height: ${showcaseSize}px;`,
    ],
    [
      `data-width="${width}" data-height="${height}"`,
      `data-width="${showcaseWidth}" data-height="${showcaseHeight}"`,
    ],
  ];

  let showcase = source;
  for (const [from, to] of replacements) {
    if (!showcase.includes(from)) {
      throw new Error(
        `Could not apply showcase replacement in ${entry.slug}: ${from}`,
      );
    }
    showcase = showcase.replace(from, to);
  }
  return showcase;
};

if (!reuseReference) {
  await run("node", ["scripts/generate-icon-reference.mjs"]);
  await run(
    "bun",
    [
      "scripts/hyfrme-render-icons.mts",
      "--only",
      selected.map((entry) => entry.slug).join(","),
      "--showcase",
    ],
    { cwd: resolve(root, ".work", "remocn") },
  );
}

await mkdir(workbench, { recursive: true });
await writeFile(
  resolve(workbench, "package.json"),
  `${JSON.stringify(
    {
      name: "hyfrme-icon-showcases",
      private: true,
      type: "module",
      scripts: {
        check: "npx --yes hyperframes@0.7.68 check",
        render: "npx --yes hyperframes@0.7.68 render",
      },
    },
    null,
    2,
  )}\n`,
);
await writeFile(
  resolve(workbench, "hyperframes.json"),
  `${JSON.stringify(
    {
      $schema: "https://hyperframes.heygen.com/schema/hyperframes.json",
      registry:
        "https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry",
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
  resolve(workbench, "meta.json"),
  '{"id":"hyfrme-icon-showcases","name":"Hyfrme icon showcases"}\n',
);

const diffScript = resolve(
  "/Users/aksharpatel/.agents/skills/remotion-to-hyperframes/scripts/render_diff.sh",
);
const staged = [];
const failures = [];

const reusableResult = async (renderDirectory) => {
  if (!resume) return null;
  try {
    const [reference, port, summary] = await Promise.all([
      stat(resolve(renderDirectory, "remocn-showcase.mp4")),
      stat(resolve(renderDirectory, "hyperframes-showcase.mp4")),
      readFile(
        resolve(renderDirectory, "showcase-diff", "summary.json"),
        "utf8",
      ),
    ]);
    const parsed = JSON.parse(summary);
    return reference.size > 0 && port.size > 0 && parsed.pass ? parsed : null;
  } catch {
    return null;
  }
};

for (const [index, entry] of selected.entries()) {
  const label = `[${index + 1}/${selected.length}] ${entry.slug}`;
  const renderDirectory = resolve(
    root,
    ".work",
    "renders",
    "icons",
    entry.slug,
  );
  const cachedSummary = await reusableResult(renderDirectory);
  if (cachedSummary) {
    staged.push({ entry, renderDirectory, summary: cachedSummary });
    process.stdout.write(`${label} reused ${cachedSummary.mean.toFixed(6)}\n`);
    continue;
  }
  const source = await readFile(
    resolve(root, "registry", "blocks", entry.slug, `${entry.slug}.html`),
    "utf8",
  );
  await writeFile(
    resolve(workbench, "index.html"),
    makeShowcaseHtml(source, entry),
  );
  await mkdir(renderDirectory, { recursive: true });

  process.stdout.write(`${label} render… `);
  const renderArgs = [
    "run",
    "render",
    "--",
    "--output",
    resolve(renderDirectory, "hyperframes-showcase.mp4"),
    "--quality",
    "high",
    "--strict-all",
    "--workers",
    "1",
    "--no-browser-gpu",
    "--protocol-timeout",
    "30000",
    "--quiet",
  ];
  let renderError;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await run("npm", renderArgs, { cwd: workbench, quiet: true });
      renderError = undefined;
      break;
    } catch (error) {
      renderError = error;
      if (attempt === 1) process.stdout.write("retry… ");
    }
  }
  if (renderError) throw renderError;

  process.stdout.write("compare… ");
  const diffDirectory = resolve(renderDirectory, "showcase-diff");
  await run(
    diffScript,
    [
      resolve(renderDirectory, "remocn-showcase.mp4"),
      resolve(renderDirectory, "hyperframes-showcase.mp4"),
      diffDirectory,
    ],
    { env: { R2HF_SSIM_THRESHOLD: "0.95" }, quiet: true },
  );
  const summary = JSON.parse(
    await readFile(resolve(diffDirectory, "summary.json"), "utf8"),
  );

  if (!summary.pass) {
    failures.push({ slug: entry.slug, summary });
    process.stdout.write(`FAILED ${summary.mean.toFixed(6)}\n`);
    continue;
  }

  staged.push({ entry, renderDirectory, summary });
  process.stdout.write(`passed ${summary.mean.toFixed(6)}\n`);
}

if (failures.length > 0) {
  console.error(JSON.stringify({ failures }, null, 2));
  process.exit(1);
}

for (const { entry, renderDirectory, summary } of staged) {
  const previewDirectory = resolve(root, "public", "previews", entry.slug);
  await mkdir(previewDirectory, { recursive: true });
  await copyFile(
    resolve(renderDirectory, "remocn-showcase.mp4"),
    resolve(previewDirectory, "remocn.mp4"),
  );
  await copyFile(
    resolve(renderDirectory, "hyperframes-showcase.mp4"),
    resolve(previewDirectory, "hyperframes.mp4"),
  );

  const parityPath = resolve(root, "parity", `${entry.slug}.json`);
  const parity = JSON.parse(await readFile(parityPath, "utf8"));
  parity.showcase = {
    fixture: {
      width: entry.fixture.width * showcaseScale,
      height: entry.fixture.height * showcaseScale,
      scale: showcaseScale,
      props: {
        ...entry.fixture.props,
        size: entry.fixture.props.size * showcaseScale,
      },
    },
    result: {
      frameCount: summary.frame_count,
      meanSsim: summary.mean,
      minSsim: summary.min,
      p05Ssim: summary.p05,
      p95Ssim: summary.p95,
      pass: summary.pass,
    },
  };
  await writeFile(parityPath, `${JSON.stringify(parity, null, 2)}\n`);
}

console.log(
  `Published ${staged.length} verified ${fixtures[0].fixture.width * showcaseScale}x${fixtures[0].fixture.height * showcaseScale} icon showcase(s).`,
);
