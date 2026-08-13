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

export type CatalogTaxonomyGroup = {
  id: string;
  label: string;
  description?: string;
  slugs: string[];
};

export type CatalogTaxonomySection = {
  id: string;
  label: string;
  description: string;
  featuredSlug: string;
  slugs?: string[];
  groups?: CatalogTaxonomyGroup[];
};

export type CatalogTaxonomy = {
  category: Exclude<CatalogCategory, "all">;
  section: CatalogTaxonomySection;
  group?: CatalogTaxonomyGroup;
};

const componentTaxonomy: CatalogTaxonomySection[] = [
  {
    id: "layout",
    label: "Layout",
    description: "Scene scaffolding, camera framing, and split-screen layouts.",
    featuredSlug: "chat-to-preview-layout",
    groups: [
      {
        id: "scene-framing",
        label: "Scene Framing",
        slugs: ["backdrop"],
      },
      {
        id: "camera-motion",
        label: "Camera Motion",
        slugs: ["drift"],
      },
      {
        id: "split-layouts",
        label: "Split Layouts",
        slugs: ["chat-to-preview-layout"],
      },
    ],
  },
  {
    id: "typography",
    label: "Typography",
    description:
      "Text reveals, highlights, dynamic values, transitions, and kinetic type.",
    featuredSlug: "soft-blur-in",
    groups: [
      {
        id: "reveals",
        label: "Reveals",
        slugs: [
          "soft-blur-in",
          "per-character-rise",
          "bottom-up-letters",
          "top-down-letters",
          "spring-scale-in",
          "micro-scale-fade",
          "scale-down-fade",
          "blur-out-up",
          "focus-blur-resolve",
          "line-by-line-slide",
          "staggered-fade-up",
          "mask-reveal-up",
          "tracking-in",
          "handwrite",
          "stretch-in",
        ],
      },
      {
        id: "highlights",
        label: "Highlights",
        slugs: [
          "inline-highlight",
          "marker-highlight",
          "ink-underline",
          "shimmer-sweep",
        ],
      },
      {
        id: "dynamic-text",
        label: "Dynamic Text",
        slugs: [
          "typewriter",
          "hand-count",
          "slot-machine-roll",
          "number-wheel",
          "rolling-number",
          "rolodex-flip",
          "value-swap",
        ],
      },
      {
        id: "hero-display",
        label: "Hero & Display",
        slugs: ["infinite-marquee", "perspective-marquee", "extrude-pop"],
      },
      {
        id: "tech-glitch",
        label: "Tech & Glitch",
        slugs: ["matrix-decode", "rgb-glitch-text", "chromatic-wave"],
      },
      {
        id: "text-transitions",
        label: "Text Transitions",
        slugs: [
          "per-word-crossfade",
          "fade-through",
          "shared-axis-y",
          "shared-axis-z",
          "strikethrough-replace",
          "gooey-morph",
        ],
      },
      {
        id: "kinetic",
        label: "Kinetic",
        slugs: [
          "short-slide-right",
          "kinetic-center-build",
          "short-slide-down",
          "kinetic-warp",
          "perspective-squeeze",
        ],
      },
    ],
  },
  {
    id: "ui-blocks",
    label: "UI Blocks",
    description:
      "Prebuilt code, terminal, data, workflow, and paper interface scenes.",
    featuredSlug: "terminal-simulator",
    groups: [
      {
        id: "code-cli",
        label: "Code & CLI",
        slugs: [
          "glass-code-block",
          "glass-code-walk",
          "terminal-simulator",
          "terminal-cursor-zoom",
        ],
      },
      {
        id: "data-system",
        label: "Data & System",
        slugs: ["animated-line-chart", "animated-bar-chart"],
      },
      {
        id: "paper-scrapbook",
        label: "Paper & Scrapbook",
        slugs: ["paper-sticker", "polaroid", "check-list", "reel"],
      },
    ],
  },
  {
    id: "ai",
    label: "AI",
    description: "Animated AI chat composers and coding-agent interfaces.",
    featuredSlug: "claude-chat",
    groups: [
      {
        id: "chat-composers",
        label: "Chat Composers",
        slugs: ["claude-chat", "chat-gpt", "v0"],
      },
      {
        id: "coding-agents",
        label: "Coding Agents",
        slugs: ["claude-code", "opencode"],
      },
    ],
  },
  {
    id: "transitions",
    label: "Transitions",
    description:
      "Scene transitions, camera moves, shader cuts, and stylized wipes.",
    featuredSlug: "ripple-zoom",
    groups: [
      {
        id: "camera-motion",
        label: "Camera Motion",
        slugs: [
          "whip-pan",
          "push-through",
          "focus-pull",
          "zoom-blur",
          "lens-zoom",
          "page-turn",
        ],
      },
      {
        id: "shader",
        label: "Shader",
        slugs: [
          "grain-dissolve",
          "wave-wipe",
          "ripple-zoom",
          "warp-dissolve",
          "swirl-dissolve",
          "dither-dissolve",
          "perlin-dissolve",
          "smoke-dissolve",
          "displacement",
          "ember-burn",
          "glitch-cut",
          "grid-wave",
          "particle-dissolve",
        ],
      },
      {
        id: "stylized",
        label: "Stylized",
        slugs: ["ascii-dissolve", "caret-wipe", "icon-scatter"],
      },
      {
        id: "scene-sequencers",
        label: "Scene Sequencers",
        slugs: ["slide-swap", "spring-settle"],
      },
    ],
  },
  {
    id: "social",
    label: "Social",
    description: "Milestones, social proof, profiles, and brand moments.",
    featuredSlug: "github-stars",
    groups: [
      {
        id: "github",
        label: "GitHub",
        slugs: ["github-stars", "github-sponsors"],
      },
      {
        id: "x",
        label: "X",
        slugs: ["x-follow-card", "x-followers-overview"],
      },
      {
        id: "brand",
        label: "Brand",
        slugs: ["logo-enter"],
      },
    ],
  },
  {
    id: "effects",
    label: "Effects",
    description:
      "Scene filters, display treatments, physical overlays, and interaction cues.",
    featuredSlug: "confetti",
    groups: [
      {
        id: "celebration",
        label: "Celebration",
        slugs: ["confetti"],
      },
      {
        id: "paper-ink",
        label: "Paper & Ink",
        slugs: ["paper-wobble", "ink-arrow", "scribble-circle", "crumple-toss"],
      },
      {
        id: "interaction",
        label: "Interaction",
        slugs: ["simulated-cursor"],
      },
      {
        id: "canvas-filters",
        label: "Canvas Filters",
        slugs: [
          "ascii-render",
          "camera-lens",
          "crt-screen",
          "halftone-print",
          "hologram",
          "pixelate-region",
          "security-cam",
          "sustained-glitch",
          "underwater-ripple",
          "vhs-filter",
        ],
      },
      {
        id: "shutdown",
        label: "Shutdown",
        slugs: ["tv-power-off"],
      },
    ],
  },
  {
    id: "compositions",
    label: "Compositions",
    description:
      "Full scenes composed from reusable motion and interface blocks.",
    featuredSlug: "live-code-compilation",
    groups: [
      {
        id: "hero-outro",
        label: "Hero & Outro",
        slugs: ["ecosystem-constellation", "infinite-bento-pan"],
      },
      {
        id: "product-showcases",
        label: "Product Showcases",
        slugs: ["live-code-compilation"],
      },
    ],
  },
];

const primitiveTaxonomy: CatalogTaxonomySection[] = [
  {
    id: "components",
    label: "Components",
    description:
      "Timeline-driven controls, overlays, feedback, and layout primitives.",
    featuredSlug: "button",
    groups: [
      {
        id: "controls-input",
        label: "Controls & Input",
        slugs: [
          "button",
          "checkbox",
          "radio",
          "switch",
          "input",
          "field",
          "select",
          "combobox",
          "slider",
          "toggle-group",
          "stepper",
        ],
      },
      {
        id: "overlays-menus",
        label: "Overlays & Menus",
        slugs: [
          "alert-dialog",
          "dialog",
          "sheet",
          "drawer",
          "dropdown-menu",
          "command-menu",
          "context-menu",
          "popover",
          "tooltip",
          "toast",
        ],
      },
      {
        id: "feedback-status",
        label: "Feedback & Status",
        slugs: [
          "progress",
          "spinner",
          "skeleton",
          "skeleton-block",
          "typing-indicator",
          "message-bubble",
          "blur-in",
        ],
      },
      {
        id: "structure-utility",
        label: "Structure & Utility",
        slugs: ["accordion", "caret", "cursor", "resizable", "tabs"],
      },
    ],
  },
  {
    id: "blocks",
    label: "Blocks",
    description: "Complete scripted interface flows assembled from primitives.",
    featuredSlug: "chat-flow",
    groups: [
      {
        id: "messaging",
        label: "Messaging",
        slugs: ["chat-flow", "telegram-chat-flow", "imessage-chat-flow"],
      },
      {
        id: "product-flows",
        label: "Product Flows",
        slugs: [
          "signup-flow",
          "checkout-flow",
          "onboarding-stepper-flow",
          "ai-prompt-flow",
          "settings-toggle-flow",
        ],
      },
    ],
  },
  {
    id: "component-parts",
    label: "Component Parts",
    description:
      "Installable atoms used inside the larger menu and select primitives.",
    featuredSlug: "select-item",
    slugs: ["select-item", "dropdown-menu-item", "command-menu-item"],
  },
];

const iconTaxonomy: CatalogTaxonomySection[] = [
  {
    id: "status-feedback",
    label: "Status & feedback",
    description: "Checks, alerts, loading states, and confirmation signals.",
    featuredSlug: "icon-check-circle",
    slugs: [
      "icon-check",
      "icon-check-circle",
      "icon-x",
      "icon-alert-triangle",
      "icon-info",
      "icon-loader",
      "icon-refresh-cw",
      "icon-shield",
      "icon-help-circle",
      "icon-plus-circle",
      "icon-x-circle",
    ],
  },
  {
    id: "actions-ui",
    label: "Actions & UI",
    description:
      "Common controls for editing, navigation, and interface actions.",
    featuredSlug: "icon-settings",
    slugs: [
      "icon-search",
      "icon-bell",
      "icon-download",
      "icon-upload",
      "icon-copy",
      "icon-settings",
      "icon-trash",
      "icon-plus",
      "icon-send",
      "icon-menu",
      "icon-more-horizontal",
      "icon-maximize",
      "icon-layout-grid",
      "icon-pencil",
      "icon-share-2",
      "icon-filter",
      "icon-eye",
      "icon-eye-off",
      "icon-save",
      "icon-link",
      "icon-bookmark",
      "icon-lock",
      "icon-key",
      "icon-log-out",
    ],
  },
  {
    id: "media-playback",
    label: "Media & playback",
    description: "Playback, audio, capture, and visual media controls.",
    featuredSlug: "icon-play",
    slugs: [
      "icon-play",
      "icon-pause",
      "icon-skip-forward",
      "icon-volume-2",
      "icon-volume-x",
      "icon-mic",
      "icon-video",
      "icon-camera",
      "icon-image",
    ],
  },
  {
    id: "people-communication",
    label: "People & communication",
    description: "Profiles, teams, messages, contact, and inbox states.",
    featuredSlug: "icon-message-circle",
    slugs: [
      "icon-user",
      "icon-users",
      "icon-user-plus",
      "icon-mail",
      "icon-message-circle",
      "icon-phone",
      "icon-at-sign",
      "icon-inbox",
    ],
  },
  {
    id: "time-planning",
    label: "Time & planning",
    description: "Dates, clocks, timers, and scheduling.",
    featuredSlug: "icon-calendar",
    slugs: ["icon-calendar", "icon-clock", "icon-timer"],
  },
  {
    id: "files-dev",
    label: "Files & dev",
    description: "Documents, folders, code, terminals, and infrastructure.",
    featuredSlug: "icon-code",
    slugs: [
      "icon-home",
      "icon-folder",
      "icon-file-text",
      "icon-code",
      "icon-terminal",
      "icon-database",
      "icon-cloud",
      "icon-globe",
    ],
  },
  {
    id: "devices-theme",
    label: "Devices & theme",
    description: "Screens, devices, and light or dark appearance.",
    featuredSlug: "icon-monitor",
    slugs: ["icon-monitor", "icon-smartphone", "icon-sun", "icon-moon"],
  },
  {
    id: "commerce",
    label: "Commerce",
    description: "Payments, products, offers, packages, and rewards.",
    featuredSlug: "icon-shopping-cart",
    slugs: [
      "icon-shopping-cart",
      "icon-credit-card",
      "icon-dollar-sign",
      "icon-tag",
      "icon-package",
      "icon-gift",
      "icon-wallet",
    ],
  },
  {
    id: "charts-data",
    label: "Charts & data",
    description: "Activity, targets, trends, and visualization.",
    featuredSlug: "icon-bar-chart-3",
    slugs: [
      "icon-activity",
      "icon-bar-chart-3",
      "icon-target",
      "icon-trending-down",
      "icon-trending-up",
    ],
  },
  {
    id: "emotion-accents",
    label: "Emotion & accents",
    description: "Reactions, celebrations, achievements, and visual emphasis.",
    featuredSlug: "icon-sparkles",
    slugs: [
      "icon-heart",
      "icon-rocket",
      "icon-trophy",
      "icon-award",
      "icon-crown",
      "icon-gem",
      "icon-star",
      "icon-sparkles",
      "icon-zap",
      "icon-flame",
      "icon-thumbs-up",
      "icon-party-popper",
    ],
  },
  {
    id: "arrows-navigation",
    label: "Arrows & navigation",
    description: "Directional movement, chevrons, and external navigation.",
    featuredSlug: "icon-arrow-right",
    slugs: [
      "icon-arrow-right",
      "icon-arrow-left",
      "icon-arrow-up",
      "icon-arrow-down",
      "icon-external-link",
      "icon-chevron-up",
      "icon-chevron-down",
      "icon-chevron-left",
      "icon-chevron-right",
    ],
  },
];

export const catalogTaxonomy: Partial<
  Record<Exclude<CatalogCategory, "all">, CatalogTaxonomySection[]>
> = {
  components: componentTaxonomy,
  primitives: primitiveTaxonomy,
  icons: iconTaxonomy,
};

const taxonomyBySlug = new Map<string, CatalogTaxonomy>();

for (const [category, sections] of Object.entries(catalogTaxonomy) as Array<
  [Exclude<CatalogCategory, "all">, CatalogTaxonomySection[]]
>) {
  for (const section of sections) {
    for (const slug of section.slugs ?? []) {
      if (taxonomyBySlug.has(slug)) {
        throw new Error(`Duplicate catalog taxonomy entry: ${slug}`);
      }
      taxonomyBySlug.set(slug, { category, section });
    }
    for (const group of section.groups ?? []) {
      for (const slug of group.slugs) {
        if (taxonomyBySlug.has(slug)) {
          throw new Error(`Duplicate catalog taxonomy entry: ${slug}`);
        }
        taxonomyBySlug.set(slug, { category, section, group });
      }
    }
  }
}

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
  const taxonomy = taxonomyBySlug.get(entry.item.name);
  if (taxonomy) return taxonomy.category;
  if (entry.item.tags.includes("ui") || entry.item.tags.includes("primitive")) {
    return "primitives";
  }
  return "components";
}

export function taxonomyFor(entry: CatalogEntry) {
  return taxonomyBySlug.get(entry.item.name);
}

export function taxonomySearchTerms(entry: CatalogEntry) {
  const taxonomy = taxonomyFor(entry);
  return taxonomy ? [taxonomy.section.label, taxonomy.group?.label ?? ""] : [];
}

export function catalogDescriptor(entry: CatalogEntry) {
  const taxonomy = taxonomyFor(entry);
  if (!taxonomy) return categoryDescription(categoryFor(entry));
  return [taxonomy.section.label, taxonomy.group?.label]
    .filter(Boolean)
    .join(" · ");
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
