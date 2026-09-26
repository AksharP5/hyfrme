import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);
const root = resolve(import.meta.dirname, "..");
const name = process.argv[2];
if (!["t3-thread-unpin", "t3-file-surface", "t3-source-file-open", "t3-terminal-check", "t3-permission-choice", "t3-new-worktree-choice", "t3-return-worktree", "t3-project-source-picker", "t3-project-local-open", "t3-thread-switch", "t3-project-switch", "t3-thread-mark-unread", "t3-thread-rename", "t3-thread-archive", "t3-thread-wake", "t3-file-mention", "t3-worked-trace", "t3-prompt-stash", "t3-commit-review", "t3-project-action", "t3-prompt-send", "t3-agent-work", "t3-message-rewind", "t3-agent-answer"].includes(name)) {
  throw new Error("Expected a supported T3 Code v0.0.42 candidate");
}
const candidate = resolve(root, `.work/${name}-v0042-candidate`);
const output = resolve(root, `.work/${name}-v0042-cli`);
const candidateSource = await readFile(resolve(candidate, `${name}.html`), "utf8");
const compositionSha256 = createHash("sha256").update(candidateSource).digest("hex");
const types = { ".html": "text/html", ".json": "application/json", ".js": "text/javascript", ".txt": "text/plain", ".md": "text/markdown", ".webp": "image/webp" };
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  const prefix = `/blocks/${name}/`;
  if (!pathname.startsWith(prefix)) {
    response.writeHead(404).end();
    return;
  }
  const path = resolve(candidate, decodeURIComponent(pathname.slice(prefix.length)));
  if (!path.startsWith(candidate + "/")) {
    response.writeHead(404).end();
    return;
  }
  const bytes = await readFile(path).catch(() => null);
  if (!bytes) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { "content-type": types[extname(path)] ?? "application/octet-stream" }).end(bytes);
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
      maxBuffer: 16 * 1024 * 1024,
    });
    const composition = await readFile(resolve(project, "compositions", `${name}.html`), "utf8");
    const metadata = composition.match(/data-composition-variables='([^']+)'/)?.[1];
    const sourceMetadata = candidateSource.match(/data-composition-variables='([^']+)'/)?.[1];
    if (!metadata || !sourceMetadata) throw new Error(`${theme} installed composition has no variables`);
    const decodeMetadata = (value) => JSON.parse(value.replaceAll("&amp;", "&").replaceAll("&#39;", "'").replaceAll("&quot;", '"'));
    const declarations = decodeMetadata(metadata);
    const expectedDeclarations = decodeMetadata(sourceMetadata);
    expectedDeclarations.find((variable) => variable.id === "theme").default = theme;
    if (JSON.stringify(declarations) !== JSON.stringify(expectedDeclarations)) {
      throw new Error(`${theme} CLI installation changed variable declarations`);
    }
    const normalized = composition
      .replace(`data-composition-variables='${metadata}'`, `data-composition-variables='${sourceMetadata}'`)
      .replace("<script>\n      (() => {\n", "<script>")
      .replace("\n      })();\n    </script>", "</script>");
    if (createHash("sha256").update(normalized).digest("hex") !== compositionSha256) {
      throw new Error(`${theme} CLI installation changed the composition beyond its documented wrapper and theme default`);
    }
    const installedTheme = declarations.find((variable) => variable.id === "theme");
    if (installedTheme?.default !== theme || JSON.stringify(installedTheme.options?.map(({ value }) => value)) !== '["dark","light"]') {
      throw new Error(`${theme} CLI installation lost the theme selector`);
    }
    await readFile(resolve(project, "compositions/t3-code-gsap.min.js"));
    if (name === "t3-project-source-picker") {
      for (const appearance of ["dark", "light"]) {
        const file = `project-source-picker-v0042-${appearance}-menu-crop.png`;
        const source = await readFile(resolve(candidate, file));
        const installed = await readFile(resolve(project, "compositions", file));
        if (!source.equals(installed)) throw new Error(`${theme} CLI installation changed ${file}`);
      }
    }
    if (name === "t3-project-local-open") {
      for (const appearance of ["dark", "light"]) {
        for (const phase of ["source", "browse", "selected"]) {
          const file = `project-local-open-v0042-${appearance}-${phase}-crop.png`;
          const source = await readFile(resolve(candidate, file));
          const installed = await readFile(resolve(project, "compositions", file));
          if (!source.equals(installed)) throw new Error(`${theme} CLI installation changed ${file}`);
        }
      }
    }
    if (name === "t3-project-switch") {
      for (const appearance of ["dark", "light"]) {
        for (const phase of ["menu", "motion-menu", "hyfrme-menu"]) {
          const file = `project-switch-v0042-${appearance}-${phase}-crop.png`;
          const source = await readFile(resolve(candidate, file));
          const installed = await readFile(resolve(project, "compositions", file));
          if (!source.equals(installed)) throw new Error(`${theme} CLI installation changed ${file}`);
        }
      }
    }
    if (name === "t3-thread-mark-unread") {
      for (const appearance of ["dark", "light"]) {
        const file = `thread-mark-unread-v0042-${appearance}-menu-crop.png`;
        const source = await readFile(resolve(candidate, file));
        const installed = await readFile(resolve(project, "compositions", file));
        if (!source.equals(installed)) throw new Error(`${theme} CLI installation changed ${file}`);
      }
    }
    if (name === "t3-thread-rename") {
      for (const appearance of ["dark", "light"]) {
        const file = `thread-rename-v0042-${appearance}-menu-crop.png`;
        const source = await readFile(resolve(candidate, file));
        const installed = await readFile(resolve(project, "compositions", file));
        if (!source.equals(installed)) throw new Error(`${theme} CLI installation changed ${file}`);
      }
    }
    if (name === "t3-thread-archive" || name === "t3-thread-wake") {
      const prefix = name === "t3-thread-archive" ? "thread-archive" : "thread-wake";
      for (const appearance of ["dark", "light"]) {
        const file = `${prefix}-v0042-${appearance}-menu-crop.png`;
        const source = await readFile(resolve(candidate, file));
        const installed = await readFile(resolve(project, "compositions", file));
        if (!source.equals(installed)) throw new Error(`${theme} CLI installation changed ${file}`);
      }
    }
    if (name === "t3-file-mention") {
      for (const appearance of ["dark", "light"]) {
        for (const phase of ["at", "results", "highlight"]) {
          const file = `file-mention-v0042-${appearance}-${phase}-crop.png`;
          const source = await readFile(resolve(candidate, file));
          const installed = await readFile(resolve(project, "compositions", file));
          if (!source.equals(installed)) throw new Error(`${theme} CLI installation changed ${file}`);
        }
      }
    }
    if (name === "t3-commit-review") {
      for (const appearance of ["dark", "light"]) {
        const file = `commit-review-v0042-${appearance}-menu-crop.png`;
        const source = await readFile(resolve(candidate, file));
        const installed = await readFile(resolve(project, "compositions", file));
        if (!source.equals(installed)) throw new Error(`${theme} CLI installation changed ${file}`);
      }
    }
    if (name === "t3-project-action") {
      for (const appearance of ["dark", "light"]) {
        for (const phase of ["dialog", "named", "command", "shortcut"]) {
          const file = `project-action-v0042-${appearance}-${phase}-crop.png`;
          if (!(await readFile(resolve(candidate, file))).equals(await readFile(resolve(project, "compositions", file)))) {
            throw new Error(`${theme} CLI installation changed ${file}`);
          }
        }
        const file = `project-action-v0042-${appearance}-menu-crop.png`;
        if (!(await readFile(resolve(candidate, file))).equals(await readFile(resolve(project, "compositions", file)))) {
          throw new Error(`${theme} CLI installation changed ${file}`);
        }
      }
    }
    if (["t3-permission-choice", "t3-new-worktree-choice", "t3-return-worktree"].includes(name)) {
      for (const appearance of ["dark", "light"]) {
        for (const phase of ["menu", "hover"]) {
          const file = name === "t3-permission-choice"
            ? `permission-choice-${appearance}-${phase}-raster.png`
            : `${name === "t3-return-worktree" ? "return-worktree" : "worktree-choice"}-v0042-${appearance}-${phase}-crop.png`;
          const source = await readFile(resolve(candidate, file));
          const installed = await readFile(resolve(project, "compositions", file));
          if (!source.equals(installed)) throw new Error(`${theme} CLI installation changed ${file}`);
        }
        if (name === "t3-new-worktree-choice" || name === "t3-return-worktree") {
          for (let index = 0; index < 5; index++) {
            const file = `${name === "t3-return-worktree" ? "return-worktree" : "worktree-choice"}-v0042-${appearance}-select-${index}-crop.png`;
            const source = await readFile(resolve(candidate, file));
            const installed = await readFile(resolve(project, "compositions", file));
            if (!source.equals(installed)) throw new Error(`${theme} CLI installation changed ${file}`);
          }
        }
      }
    }
    await readFile(resolve(project, "THIRD_PARTY_LICENSES/t3-code/T3-CODE-LICENSE.txt"));
    await writeFile(resolve(project, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><script src="compositions/t3-code-gsap.min.js"></script><style>html,body{margin:0;width:1200px;height:659px;overflow:hidden;background:${theme === "light" ? "#fff" : "#0a0a0a"}}#root{width:100%;height:100%}</style></head><body><div id="root" data-composition-id="${name}-cli-fixture" data-start="0" data-duration="4" data-fps="30" data-width="1200" data-height="659"><div data-composition-id="${name}" data-composition-src="compositions/${name}.html" data-start="0" data-duration="4" data-track-index="1" data-width="1200" data-height="659"></div></div><script>window.__timelines=window.__timelines||{};window.__timelines['${name}-cli-fixture']=gsap.timeline({paused:true});</script></body></html>`);
    const { stdout } = await exec("npx", ["--yes", "hyperframes@0.8.75", "check", project, "--json"], {
      env: { ...process.env, TMPDIR: resolve(root, ".work/t3-tmp") },
      maxBuffer: 64 * 1024 * 1024,
    });
    const check = JSON.parse(stdout.slice(stdout.indexOf("{")));
    if (!check.ok) throw new Error(`${theme} CLI-installed composition failed full check`);
    await writeFile(resolve(project, "check.json"), JSON.stringify(check, null, 2) + "\n");
  }
  await writeFile(resolve(output, "proof.json"), JSON.stringify({ installedThroughCli: true, name,
    compositionSha256, themes: ["dark", "light"] }, null, 2) + "\n");
} finally {
  server.close();
}
console.log(`CLI-installed ${name} in dark and light; full HyperFrames checks passed.`);
