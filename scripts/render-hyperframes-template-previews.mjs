import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";

const root = resolve(import.meta.dirname, "..");
const work = resolve(root, ".work/hyperframes-template-previews");
const outputPath = resolve(root, "catalog/hyperframes-template-previews.json");
const version = "0.8.30";
const fps = 30;
const execute = promisify(execFile);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const writeJson = (path, value) =>
  writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
const args = process.argv.slice(2);
const onlyIndex = args.indexOf("--only");
if (
  onlyIndex !== -1 &&
  (!args[onlyIndex + 1] || args[onlyIndex + 1].startsWith("--"))
) {
  throw new Error("--only requires comma-separated template names.");
}
const names = onlyIndex === -1 ? null : new Set(args[onlyIndex + 1].split(","));
const inventory = JSON.parse(
  await readFile(resolve(root, "catalog/hyperframes-upstream.json"), "utf8"),
);
const templates = inventory.items.filter(
  (item) => item.type === "hyperframes:example" && item.status === "imported",
);
const selected = names
  ? templates.filter((item) => names.has(item.name))
  : templates;
if (!selected.length || (names && selected.length !== names.size)) {
  throw new Error(
    "Requested template names do not match the imported catalog.",
  );
}

async function cachedCli() {
  if (process.env.HYPERFRAMES_CLI) return resolve(process.env.HYPERFRAMES_CLI);
  const cache = resolve(homedir(), ".npm/_npx");
  for (const entry of await readdir(cache, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const packageRoot = resolve(cache, entry.name, "node_modules/hyperframes");
    const packageJson = await readFile(
      resolve(packageRoot, "package.json"),
      "utf8",
    ).catch((error) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (packageJson && JSON.parse(packageJson).version === version)
      return resolve(packageRoot, "bin/hyperframes.mjs");
  }
  throw new Error(
    `HyperFrames ${version} is not cached. Set HYPERFRAMES_CLI to an existing installation.`,
  );
}

const cli = await cachedCli();
assert.equal(
  JSON.parse(
    await readFile(resolve(dirname(dirname(cli)), "package.json"), "utf8"),
  ).version,
  version,
);
const run = (
  command,
  commandArgs,
  cwd = root,
  allowFailure = false,
  env = {},
) =>
  execute(command, commandArgs, {
    cwd,
    env: { ...process.env, ...env },
    maxBuffer: 16 * 1024 * 1024,
  })
    .then((result) => ({ ...result, code: 0 }))
    .catch((error) => {
      if (allowFailure && typeof error.code === "number")
        return { stdout: error.stdout, stderr: error.stderr, code: error.code };
      throw error;
    });
const browserPath =
  process.env.HYPERFRAMES_BROWSER_PATH ??
  (await run(process.execPath, [cli, "browser", "path"])).stdout
    .trim()
    .split("\n")
    .at(-1);
const browserVersion = (await run(browserPath, ["--version"])).stdout.trim();
const environment = {
  HYPERFRAMES_BROWSER_PATH: browserPath,
  HYPERFRAMES_RUN_ID: "hyfrme-official-template-previews",
};
const previous = await readFile(outputPath, "utf8")
  .then(JSON.parse)
  .catch((error) => {
    if (error.code === "ENOENT") return { items: [] };
    throw error;
  });
const records = new Map(previous.items.map((item) => [item.name, item]));

// This is the official init.ts no-video scaffold materialization.
function materialize(source, name, path) {
  const initialized = source
    .replace(/<video[^>]*src="__VIDEO_SRC__"[^>]*>[\s\S]*?<\/video>/g, "")
    .replace(/<video[^>]*src="__VIDEO_SRC__"[^>]*>/g, "")
    .replace(/<audio[^>]*src="__VIDEO_SRC__"[^>]*>[\s\S]*?<\/audio>/g, "")
    .replace(/<audio[^>]*src="__VIDEO_SRC__"[^>]*>/g, "")
    .replaceAll("__VIDEO_DURATION__", "10");
  if (
    name !== "hyperframes-decision-tree" ||
    path !== "compositions/decision_tree.html"
  )
    return initialized;
  assert.ok(initialized.includes('tl.labels["hold5"]'));
  return initialized.replace(
    'tl.labels["hold5"]',
    '(tl.labels?.["hold5"] ?? 6.25)',
  );
}

async function artifact(path) {
  const bytes = await readFile(resolve(root, path));
  return { path, sha256: sha256(bytes), bytes: bytes.length };
}

async function saveReport() {
  const items = templates.flatMap((template) =>
    records.has(template.name) ? [records.get(template.name)] : [],
  );
  await writeJson(outputPath, {
    summary: {
      upstream: inventory.summary.upstream,
      verification: "native-template-render",
      hyperframesVersion: version,
      browserVersion,
      totalTemplates: templates.length,
      renderedTemplates: items.filter(
        (item) => item.render?.status === "passed",
      ).length,
      fullCheckPassed: items.filter((item) => item.check?.passed).length,
    },
    items,
  });
}

await mkdir(work, { recursive: true });
for (const template of selected) {
  const manifestBytes = await readFile(
    resolve(root, template.localManifest.path),
  );
  assert.equal(
    sha256(manifestBytes),
    template.localManifest.sha256,
    `${template.name}: manifest changed since import`,
  );
  const manifest = JSON.parse(manifestBytes);
  const project = resolve(work, template.name);
  const staging = resolve(project, "preview");
  const videoPath = resolve(staging, "hyperframes.mp4");
  const preview = `public/previews/${template.name}`;
  const record = {
    name: template.name,
    origin: manifest.origin,
    sourceManifestSha256: template.localManifest.sha256,
    dimensions: manifest.dimensions,
    duration: manifest.duration,
    fps,
    files: [],
    materialization: {
      kind: "official-init-no-video",
      source: "packages/cli/src/commands/init.ts",
      video: null,
      placeholderDuration: 10,
    },
  };
  if (template.name === "hyperframes-decision-tree") {
    assert.equal(
      manifest.origin.commit,
      "daa44fcd753d9055aa3c954ad74f09a4e4389780",
      "Recheck the real GSAP label value before adapting a new source pin.",
    );
    record.materialization.compatibility = {
      file: "compositions/decision_tree.html",
      before: 'tl.labels["hold5"]',
      after: '(tl.labels?.["hold5"] ?? 6.25)',
      reason: "The renderer GSAP proxy does not expose timeline.labels.",
      labelProof: {
        gsapVersion: "3.14.2",
        method:
          "Real GSAP timeline.labels in the installed-source browser fixture",
        labels: {
          hold1: 1,
          hold2: 2.5,
          hold3: 4.45,
          hold4: 5.85,
          hold5: 6.25,
          hold6: 7.05,
          hold7: 9.6,
        },
        timelineDuration: 10.1,
      },
    };
  }
  records.set(template.name, record);
  try {
    await mkdir(project, { recursive: true });
    await mkdir(staging, { recursive: true });
    for (const file of manifest.files) {
      const originalBytes = await readFile(
        resolve(root, "registry/blocks", template.name, file.path),
      );
      const provenance = template.files.find(
        (candidate) => candidate.path === file.path,
      );
      assert.equal(
        sha256(originalBytes),
        provenance.sha256,
        `${template.name}/${file.path}: source changed since import`,
      );
      const bytes = file.path.endsWith(".html")
        ? Buffer.from(
            materialize(
              originalBytes.toString("utf8"),
              template.name,
              file.path,
            ),
          )
        : originalBytes;
      const target = resolve(project, file.target);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, bytes);
      record.files.push({
        path: file.path,
        target: file.target,
        sourceSha256: provenance.sha256,
        installedSha256: sha256(bytes),
        transformed: !bytes.equals(originalBytes),
      });
    }
    await writeJson(resolve(project, "package.json"), {
      private: true,
      type: "module",
    });
    await writeJson(resolve(project, "hyperframes.json"), {
      width: manifest.dimensions.width,
      height: manifest.dimensions.height,
      fps,
      duration: manifest.duration,
    });
    console.log(`${template.name}: full check`);
    const checked = await run(
      process.execPath,
      [cli, "check", "--json"],
      project,
      true,
      environment,
    );
    await writeFile(
      resolve(project, "check.log"),
      checked.stdout + checked.stderr,
    );
    const result = JSON.parse(
      checked.stdout.slice(checked.stdout.indexOf("{")),
    );
    await writeJson(resolve(project, "check.json"), result);
    record.check = {
      passed: checked.code === 0 && result.ok === true,
      exitCode: checked.code,
      result: JSON.parse(JSON.stringify(result).replaceAll(root, "<project>")),
    };
    console.log(
      `${template.name}: render ${manifest.duration}s at ${fps}fps${record.check.passed ? "" : " with upstream check findings"}`,
    );
    const rendered = await run(
      process.execPath,
      [
        cli,
        "render",
        "--output",
        videoPath,
        "--quality",
        "high",
        "--fps",
        String(fps),
        "--workers",
        "1",
        "--browser-gpu",
      ],
      project,
      false,
      environment,
    );
    const renderLog = rendered.stdout + rendered.stderr;
    await writeFile(resolve(project, "render.log"), renderLog);
    assert.ok(
      !/Composition script failed|sub_timeline_readiness_timeout/.test(
        renderLog,
      ),
      `${template.name}: renderer did not initialize every composition timeline`,
    );
    const probe = await run("ffprobe", [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height,avg_frame_rate,nb_frames,duration",
      "-of",
      "json",
      videoPath,
    ]);
    const stream = JSON.parse(probe.stdout).streams[0];
    assert.equal(stream.width, manifest.dimensions.width);
    assert.equal(stream.height, manifest.dimensions.height);
    assert.equal(stream.avg_frame_rate, `${fps}/1`);
    assert.equal(Number(stream.nb_frames), Math.round(manifest.duration * fps));
    assert.ok(Math.abs(Number(stream.duration) - manifest.duration) < 0.002);
    const thumbnailAt = manifest.duration / 2;
    await run("ffmpeg", [
      "-y",
      "-v",
      "error",
      "-ss",
      String(thumbnailAt),
      "-i",
      videoPath,
      "-frames:v",
      "1",
      resolve(staging, "thumbnail.png"),
    ]);
    await run("ffmpeg", [
      "-y",
      "-v",
      "error",
      "-i",
      resolve(staging, "thumbnail.png"),
      "-frames:v",
      "1",
      "-vf",
      "scale=1024:-2:flags=lanczos",
      "-c:v",
      "libwebp",
      "-lossless",
      "1",
      resolve(staging, "thumbnail.webp"),
    ]);
    for (const file of record.files) {
      assert.equal(
        sha256(await readFile(resolve(project, file.target))),
        file.installedSha256,
        `${template.name}/${file.target}: render modified source`,
      );
    }
    await mkdir(resolve(root, preview), { recursive: true });
    for (const file of ["hyperframes.mp4", "thumbnail.png", "thumbnail.webp"]) {
      await copyFile(resolve(staging, file), resolve(root, preview, file));
    }
    record.render = {
      status: "passed",
      frameCount: Number(stream.nb_frames),
      hyperframesVersion: version,
      browserVersion,
      thumbnailAt,
    };
    record.artifacts = {
      video: await artifact(`${preview}/hyperframes.mp4`),
      thumbnail: await artifact(`${preview}/thumbnail.webp`),
      fullThumbnail: await artifact(`${preview}/thumbnail.png`),
    };
    console.log(
      `${template.name}: ${record.render.frameCount} frames rendered`,
    );
  } catch (error) {
    record.render = {
      status: "failed",
      message:
        error instanceof Error
          ? error.message.replaceAll(root, "<project>")
          : String(error),
    };
    console.error(`${template.name}: ${record.render.message}`);
  }
  await saveReport();
}
if ([...records.values()].some((record) => record.render?.status === "failed"))
  process.exitCode = 1;
