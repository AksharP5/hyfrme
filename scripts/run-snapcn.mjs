import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");

export async function snapcnSources() {
  const fixtures = JSON.parse(
    await readFile(resolve(root, "catalog/snapcn-fixtures.json"), "utf8"),
  );
  const { commit: baseCommit } = JSON.parse(
    await readFile(resolve(root, "catalog/snapcn-upstream.json"), "utf8"),
  );
  const sources = new Map();
  for (const { slug, origin } of fixtures) {
    const key = `${origin.repository}@${origin.commit}`;
    if (!sources.has(key))
      sources.set(key, {
        repository: origin.repository,
        commit: origin.commit,
        directory: resolve(
          root,
          origin.commit === baseCommit
            ? ".work/snapcn"
            : `.work/snapcn-${origin.commit}`,
        ),
        slugs: [],
      });
    sources.get(key).slugs.push(slug);
  }
  return [...sources.values()];
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const [task, ...args] = process.argv.slice(2);
  const script = {
    generate: "generate-snapcn-ports.mjs",
    verify: "verify-snapcn-ports.mjs",
  }[task];
  if (!script) throw new Error("Expected generate or verify.");
  const onlyIndex = args.indexOf("--only");
  if (
    onlyIndex !== -1 &&
    (!args[onlyIndex + 1] || args[onlyIndex + 1].startsWith("--"))
  ) {
    throw new Error("--only requires comma-separated fixture slugs.");
  }
  const only =
    onlyIndex === -1 ? null : new Set(args[onlyIndex + 1].split(","));
  const sources = (await snapcnSources())
    .map((source) => ({
      ...source,
      slugs: source.slugs.filter((slug) => !only || only.has(slug)),
    }))
    .filter((source) => source.slugs.length);
  if (
    !sources.length ||
    (only &&
      sources.reduce((count, source) => count + source.slugs.length, 0) !==
        only.size)
  ) {
    throw new Error("Expected a nonempty selection of known Snapcn slugs.");
  }
  if (process.env.SNAPCN_SOURCE && sources.length > 1) {
    throw new Error(
      "SNAPCN_SOURCE supplies one checkout; select fixtures from one source pin with --only.",
    );
  }
  const forwarded = args.filter(
    (_, index) =>
      onlyIndex === -1 || (index !== onlyIndex && index !== onlyIndex + 1),
  );
  if (task === "generate") {
    const css = spawnSync(
      process.execPath,
      [resolve(root, "scripts/generate-snapcn-reference.mjs"), "--css-only"],
      {
        cwd: root,
        stdio: "inherit",
        env: process.env,
      },
    );
    if (css.error) throw css.error;
    if (css.status !== 0)
      throw new Error("Snapcn preview CSS generation failed.");
  }
  for (const source of sources) {
    console.log(
      `${task}: ${source.slugs.length} Snapcn fixtures at ${source.commit}`,
    );
    const result = spawnSync(
      process.execPath,
      [
        resolve(root, "scripts", script),
        ...forwarded,
        "--only",
        source.slugs.join(","),
      ],
      {
        cwd: root,
        stdio: "inherit",
        env: {
          ...process.env,
          SNAPCN_SOURCE: process.env.SNAPCN_SOURCE ?? source.directory,
        },
      },
    );
    if (result.error) throw result.error;
    if (result.status !== 0) process.exitCode = 1;
  }
}
