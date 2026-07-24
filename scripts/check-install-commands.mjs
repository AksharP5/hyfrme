import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const publicSurfaces = [
  "README.md",
  "cli/README.md",
  "skills/hyfrme/SKILL.md",
  "src/App.tsx",
  "src/lib/customization.ts",
];

const contents = new Map(
  await Promise.all(
    publicSurfaces.map(async (path) => [
      path,
      await readFile(resolve(root, path), "utf8"),
    ]),
  ),
);

for (const [path, source] of contents) {
  assert.doesNotMatch(
    source,
    /\b(?:npx|pnpm dlx|yarn dlx|bunx|npm exec)\s+(?:--yes\s+)?https?:\/\/hyfrme\.vercel\.app\/cli/,
    `${path} contains a legacy URL-based Hyfrme command`,
  );
  assert.doesNotMatch(
    source,
    /\bnpx\s+hyfrme(?=\s+add\b)/,
    `${path} contains an unversioned Hyfrme npx command`,
  );
}

assert.match(
  contents.get("src/App.tsx"),
  /const cliPackage = "hyfrme@latest";/,
);
assert.match(
  contents.get("src/lib/customization.ts"),
  /pnpm dlx \$\{cliPackage\}/,
);
assert.match(
  contents.get("src/lib/customization.ts"),
  /YARN_NPM_PREAPPROVED_PACKAGES=hyfrme yarn dlx \$\{cliPackage\}/,
);
assert.match(contents.get("src/lib/customization.ts"), /bunx \$\{cliPackage\}/);

for (const path of ["README.md", "cli/README.md", "skills/hyfrme/SKILL.md"]) {
  assert.match(
    contents.get(path),
    /npx hyfrme@latest add /,
    `${path} is missing the canonical npm install command`,
  );
}

assert.match(
  contents.get("README.md"),
  /npx skills@latest add AksharP5\/hyfrme --yes/,
);

console.log(
  "Verified current npm, pnpm, Yarn, Bun, prompt, and agent-skill commands.",
);
