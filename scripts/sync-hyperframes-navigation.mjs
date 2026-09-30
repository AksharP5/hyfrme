import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const target = new URL(
  "../catalog/hyperframes-navigation.json",
  import.meta.url,
);
const previous = JSON.parse(await readFile(target, "utf8"));
const commit = process.argv[2] ?? previous.origin.commit;
if (!/^[a-f0-9]{40}$/.test(commit))
  throw new Error("Pass an exact upstream commit SHA.");
const source = "docs/docs.json";
const response = await fetch(
  `https://raw.githubusercontent.com/heygen-com/hyperframes/${commit}/${source}`,
);
if (!response.ok)
  throw new Error(`Unable to load upstream navigation: ${response.status}`);
const bytes = Buffer.from(await response.arrayBuffer());
const docs = JSON.parse(bytes.toString("utf8"));
const catalog = docs.navigation.tabs.find((tab) => tab.tab === "Catalog");
const groups = catalog.groups[0].pages
  .filter((page) => typeof page !== "string")
  .map((section) => ({
    label: section.group,
    items: section.pages.filter((page) => typeof page === "string"),
    groups: section.pages
      .filter((page) => typeof page !== "string")
      .map((group) => {
        if (group.pages.some((page) => typeof page !== "string"))
          throw new Error(`Unsupported nested navigation: ${group.group}`);
        return { label: group.group, items: group.pages };
      }),
  }));
await writeFile(
  target,
  `${JSON.stringify({ origin: { repository: "https://github.com/heygen-com/hyperframes", commit, source, sha256: createHash("sha256").update(bytes).digest("hex") }, groups }, null, 2)}\n`,
);
console.log(`Saved ${groups.length} upstream catalog groups at ${commit}.`);
