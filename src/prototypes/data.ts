import { catalog, categoryFor, categoryLabels } from "../catalog";

const byName = new Map(catalog.map((entry) => [entry.item.name, entry]));

const selections = [
  {
    slug: "snapcn-moodboard-reveal",
    kind: "Scene",
    summary: "Layer images into a reveal that feels like a whole visual world.",
  },
  {
    slug: "screen-lift",
    kind: "Device frame",
    summary: "Bring a product screen forward with camera, light, and depth.",
  },
  {
    slug: "before-after",
    kind: "Hyfrme original",
    summary: "Show the transformation with one precise sweep across the frame.",
  },
  {
    slug: "snapcn-card-rail",
    kind: "Scene",
    summary: "Move through a collection of scenes with a tactile flick.",
  },
  {
    slug: "shader-swirl",
    kind: "Shader",
    summary: "Add a flowing backdrop without losing control of the source.",
  },
] as const;

export const prototypeComponents = selections.map(({ slug, kind, summary }) => {
  const entry = byName.get(slug);
  if (!entry) throw new Error(`Missing prototype component: ${slug}`);
  return {
    slug,
    title: entry.item.title,
    kind,
    summary,
    source: entry.source.label,
    duration: entry.item.duration,
    href: `/components/${slug}`,
    video: `/previews/${slug}/hyperframes.mp4`,
    poster: `/previews/${slug}/thumbnail.webp`,
  };
});

export const prototypeNavigation = [
  { label: "Components", href: "/components?category=components" },
  { label: "Primitives", href: "/components?category=primitives" },
  { label: "Shaders", href: "/components?category=shaders" },
  { label: "Icons", href: "/components?category=icons" },
  { label: "Showcases", href: "/showcases" },
] as const;

const categoryIds = ["components", "primitives", "shaders", "icons"] as const;

export const prototypeCategories = categoryIds.map((id) => ({
  id,
  label: categoryLabels[id],
  count: catalog.filter((entry) => categoryFor(entry) === id).length,
  href: `/components?category=${id}`,
}));

export const prototypeTotal = catalog.length;
