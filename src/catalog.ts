export type RegistryFile = {
  path: string;
  target: string;
  type: string;
};

import catalogData from "./generated/catalog-data.json";

export type RegistrySummary = (typeof catalogData)[number]["item"];

export type RegistryItem = RegistrySummary & {
  files: RegistryFile[];
};

export type ParitySummary = {
  slug: string;
  origin: { repository: string; commit: string; source: string };
  artifacts: { referenceVideo: string; hyperframesVideo: string };
  result: {
    frameCount: number;
    meanSsim: number;
    pass: boolean;
  };
};

export const catalogSources = [
  {
    id: "remocn",
    label: "Remocn",
    repository: "https://github.com/Remocn/remocn",
  },
  {
    id: "snapcn",
    label: "Snapcn",
    repository: "https://github.com/snapcndev/snapcn",
  },
] as const;

export type CatalogSource = (typeof catalogSources)[number];

export type CatalogEntry = {
  item: RegistrySummary;
  source: CatalogSource;
  loadDetails: () => Promise<{ item: RegistryItem; parity: ParitySummary }>;
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
        slugs: ["backdrop", "stage"],
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
      {
        id: "device-frames",
        label: "Device Frames",
        slugs: ["snapcn-phone-frame", "snapcn-laptop-frame"],
      },
      {
        id: "screen-captures",
        label: "Screen Captures",
        slugs: ["snapcn-screen-recording"],
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
          "sheen-slide-in",
          "squeeze-in",
          "fog-rise",
          "stretch-in",
          "shader-text-reveal",
          "snapcn-text-reveal",
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
          "outline-fill-track-text",
          "snapcn-text-highlight",
          "snapcn-text-select",
        ],
      },
      {
        id: "dynamic-text",
        label: "Dynamic Text",
        slugs: [
          "typewriter",
          "hand-count",
          "slot-machine-roll",
          "inline-word-roll",
          "number-wheel",
          "rolling-number",
          "rolodex-flip",
          "value-swap",
          "word-stream",
          "word-push",
          "caret-swap",
        ],
      },
      {
        id: "hero-display",
        label: "Hero & Display",
        slugs: [
          "infinite-marquee",
          "perspective-marquee",
          "shadow-sweep-text",
          "snapcn-punch-lines",
        ],
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
          "typed-split-wipe",
          "gradient-scale-cut-text",
          "snapcn-text-rewrite",
          "snapcn-text-swap",
          "snapcn-word-flip",
          "snapcn-type-morph",
        ],
      },
      {
        id: "kinetic",
        label: "Kinetic",
        slugs: [
          "short-slide-right",
          "kinetic-center-build",
          "short-slide-down",
          "zoom-words",
          "centered-word-build",
          "inline-pill-takeover",
          "rush-type",
          "extrude-pop",
          "kinetic-morph-text",
          "kinetic-warp",
          "gooey-morph",
          "perspective-squeeze",
          "type-fossil",
          "snapcn-text-swell",
          "snapcn-text-build",
        ],
      },
      {
        id: "captions",
        label: "Captions",
        slugs: ["snapcn-word-captions", "snapcn-karaoke-captions"],
      },
    ],
  },
  {
    id: "logos",
    label: "Logos",
    description: "Logo entrances, image reveals, and animated wordmarks.",
    featuredSlug: "snapcn-logo-flicker",
    slugs: [
      "logo-enter",
      "snapcn-logo-assemble",
      "snapcn-logo-flicker",
      "snapcn-logo-drift",
      "snapcn-block-wordmark",
      "snapcn-wordmark-cut",
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
          "snapcn-terminal-simulator",
        ],
      },
      {
        id: "data-system",
        label: "Data & System",
        slugs: ["animated-line-chart", "animated-bar-chart"],
      },
      {
        id: "workflows",
        label: "Workflows",
        slugs: ["snapcn-status-cycle"],
      },
      {
        id: "paper-scrapbook",
        label: "Paper & Scrapbook",
        slugs: ["paper-sticker", "polaroid", "check-list"],
      },
    ],
  },
  {
    id: "ai",
    label: "AI",
    description:
      "Chat composers, search prompts, answers, and agent workflows.",
    featuredSlug: "claude-chat",
    groups: [
      {
        id: "chat-composers",
        label: "Chat Composers",
        slugs: ["claude-chat", "chat-gpt", "v0"],
      },
      {
        id: "coding-agents",
        label: "Agent Workflows",
        slugs: ["claude-code", "opencode", "snapcn-agent-steps"],
      },
      {
        id: "search-prompts",
        label: "Search & Prompts",
        slugs: [
          "search-reveal",
          "snapcn-search-typing",
          "snapcn-prompt-send",
          "snapcn-prompt-zoom",
        ],
      },
      {
        id: "answers",
        label: "Answers",
        slugs: ["snapcn-answer-stream", "snapcn-answer-highlight"],
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
          "page-turn",
          "lens-zoom",
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
          "shader-seam",
          "shader-spiral-pass",
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
    description: "Milestones, social proof, profiles, and follower growth.",
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
        id: "followers",
        label: "Followers",
        slugs: ["snapcn-follower-rush"],
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
        slugs: ["confetti", "radial-burst"],
      },
      {
        id: "paper-ink",
        label: "Paper & Ink",
        slugs: ["paper-wobble", "ink-arrow", "scribble-circle", "crumple-toss"],
      },
      {
        id: "interaction",
        label: "Interaction",
        slugs: ["simulated-cursor", "cursor-gravity", "snapcn-cursor-track"],
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
    label: "Scenes",
    description:
      "Full scenes composed from reusable motion and interface blocks.",
    featuredSlug: "live-code-compilation",
    groups: [
      {
        id: "hero-outro",
        label: "Hero & Outro",
        slugs: [
          "ecosystem-constellation",
          "infinite-bento-pan",
          "snapcn-announce-title",
        ],
      },
      {
        id: "product-showcases",
        label: "Product Showcases",
        slugs: [
          "live-code-compilation",
          "snapcn-hero-launch",
          "release-teaser",
          "brand-guidelines",
          "workflow-console",
          "launch-anything",
          "fomo-limit-orders",
        ],
      },
      {
        id: "galleries",
        label: "Galleries",
        slugs: ["reel", "snapcn-orbit-gallery", "snapcn-moodboard-reveal"],
      },
      {
        id: "data-teams",
        label: "Data & Teams",
        slugs: ["snapcn-count-grid", "snapcn-roster-grant"],
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
          "snapcn-input",
          "field",
          "select",
          "select-menu",
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
        slugs: [
          "accordion",
          "caret",
          "snapcn-caret",
          "cursor",
          "resizable",
          "tabs",
        ],
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

export const catalog: CatalogEntry[] = catalogData
  .map(({ item, sourceRepository }) => {
    const blockRoot = `/registry/blocks/${encodeURIComponent(item.name)}`;
    const source = catalogSources.find(
      (candidate) => candidate.repository === sourceRepository,
    );
    if (!source) {
      throw new Error(
        `Unknown source repository for ${item.name}: ${sourceRepository}`,
      );
    }
    return {
      item,
      source,
      loadDetails: async () =>
        (await (
          await fetchRequired(`${blockRoot}/catalog.json`)
        ).json()) as Awaited<ReturnType<CatalogEntry["loadDetails"]>>,
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
  const taxonomy = taxonomyBySlug.get(entry.item.name);
  if (taxonomy) return taxonomy.category;
  if (entry.item.tags.includes("icon")) return "icons";
  if (
    entry.item.name.startsWith("shader-") ||
    entry.item.tags.includes("shader") ||
    entry.item.tags.includes("shaders")
  )
    return "shaders";
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
    .replace(/, ported from (?:Remocn|Snapcn) for HyperFrames\.$/, ".");
}
