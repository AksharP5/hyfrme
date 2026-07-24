export type RegistryFile = {
  path: string;
  target: string;
  type: string;
};

import catalogData from "./generated/catalog-data.json";

export type RegistrySummary = {
  name: string;
  title: string;
  description: string;
  tags: string[];
  dimensions: { width: number; height: number };
  duration: number;
};

export type RegistryItem = RegistrySummary & {
  files: RegistryFile[];
};

export type ParitySummary = {
  slug: string;
  origin: { commit: string; source: string };
  result: {
    frameCount: number;
    meanSsim: number;
    pass: boolean;
  };
};

export type CatalogEntry = {
  item: RegistrySummary;
  parity: ParitySummary;
  loadItem: () => Promise<RegistryItem>;
  loadSource: () => Promise<string>;
};

export type CatalogCategory =
  "all" | "components" | "primitives" | "shaders" | "icons";

async function fetchRequired(path: string) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Unable to load ${path}: ${response.status}`);
  }
  return response;
}

export const catalog = (
  catalogData as Array<{
    item: RegistrySummary;
    parity: ParitySummary;
  }>
)
  .map(({ item, parity }) => {
    const blockRoot = `/registry/blocks/${encodeURIComponent(item.name)}`;
    return {
      item,
      parity,
      loadItem: async () =>
        (await (
          await fetchRequired(`${blockRoot}/registry-item.json`)
        ).json()) as RegistryItem,
      loadSource: async () =>
        (await fetchRequired(`${blockRoot}/${item.name}.html`)).text(),
    };
  })
  .sort((left, right) => left.item.title.localeCompare(right.item.title));

export const categoryLabels: Record<CatalogCategory, string> = {
  all: "All",
  components: "Components",
  primitives: "Primitives",
  shaders: "Shaders",
  icons: "Icons",
};

export function categoryFor(
  entry: CatalogEntry,
): Exclude<CatalogCategory, "all"> {
  if (entry.item.tags.includes("icon")) return "icons";
  if (entry.item.name.startsWith("shader-")) return "shaders";
  if (entry.item.tags.includes("ui") || entry.item.tags.includes("primitive")) {
    return "primitives";
  }
  return "components";
}

export function categoryDescription(category: Exclude<CatalogCategory, "all">) {
  return {
    icons: "Animated icon",
    shaders: "Shader",
    primitives: "UI primitive",
    components: "Motion component",
  }[category];
}

export function cardDescription(entry: CatalogEntry) {
  return entry.item.description
    .replace(
      / Compiled for deterministic HyperFrames playback by Hyfrme\.$/,
      "",
    )
    .replace(/, ported from Remocn for HyperFrames\.$/, ".");
}
