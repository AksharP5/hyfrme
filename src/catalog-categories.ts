export const categoryLabels = {
  all: "All",
  components: "Components",
  primitives: "Primitives",
  shaders: "Shaders",
  icons: "Icons",
  templates: "Templates",
} as const;

export type CatalogCategory = keyof typeof categoryLabels;
