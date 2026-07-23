export type RegistryFile = {
  path: string;
  target: string;
  type: string;
};

export type RegistryItem = {
  name: string;
  title: string;
  description: string;
  tags: string[];
  dimensions: { width: number; height: number };
  duration: number;
  files: RegistryFile[];
};

export type Parity = {
  slug: string;
  origin: { commit: string; source: string };
  fixture: {
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
  };
  result: {
    frameCount: number;
    meanSsim: number;
    pass: boolean;
  };
};

export type CatalogEntry = {
  item: RegistryItem;
  parity: Parity;
  loadSource: () => Promise<string>;
};

export type CatalogCategory =
  "all" | "components" | "primitives" | "shaders" | "icons";

const registryModules = import.meta.glob(
  "../registry/blocks/*/registry-item.json",
  { eager: true, import: "default" },
) as Record<string, RegistryItem>;
const parityModules = import.meta.glob("../parity/*.json", {
  eager: true,
  import: "default",
}) as Record<string, Parity>;
const sourceModules = import.meta.glob("../registry/blocks/*/*.html", {
  import: "default",
  query: "?raw",
}) as Record<string, () => Promise<string>>;

export const catalog = Object.entries(registryModules)
  .map(([path, item]) => {
    const parity = Object.values(parityModules).find(
      (candidate) => candidate.slug === item.name,
    );
    const loadSource = Object.entries(sourceModules).find(([sourcePath]) =>
      sourcePath.endsWith(`/${item.name}/${item.name}.html`),
    )?.[1];
    return parity && loadSource ? { item, parity, loadSource } : null;
  })
  .filter((entry): entry is CatalogEntry => entry !== null)
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
