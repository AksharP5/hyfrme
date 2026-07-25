import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from "react";
import {
  catalog,
  type CatalogCategory,
  type CatalogEntry,
  cardDescription,
  categoryDescription,
  categoryFor,
  categoryLabels,
  type RegistryItem,
} from "./catalog";
import { CatalogCard } from "./components/CatalogCard";
import { CodePanel } from "./components/CodePanel";
import { Customizer } from "./components/Customizer";
import { FamilySection, type LandingFamily } from "./components/FamilySection";
import { InstallPanel } from "./components/InstallPanel";
import { LandingHero } from "./components/LandingHero";
import { LivePreview } from "./components/LivePreview";
import { ShowcaseDetailPage, ShowcasesPage } from "./components/Showcases";
import { VariableTable } from "./components/VariableTable";
import {
  buildInstallCommands,
  buildUsageSnippet,
  defaultValues,
  parseCompositionVariables,
  type CustomValues,
  valuesFromUrl,
  writeValuesToUrl,
} from "./lib/customization";
import { showcases } from "./showcases";

const ComparisonPlayer = lazy(() =>
  import("./components/ComparisonPlayer").then((module) => ({
    default: module.ComparisonPlayer,
  })),
);

const githubUrl = "https://github.com/AksharP5/hyfrme";
const cliPackage = "hyfrme@latest";
const installAllCommand = `npx ${cliPackage} add --all`;
const catalogCategories = Object.keys(categoryLabels) as CatalogCategory[];
const categoryOrder = catalogCategories.filter(
  (category): category is Exclude<CatalogCategory, "all"> => category !== "all",
);
const catalogCategoryCounts = Object.fromEntries(
  catalogCategories.map((candidate) => [
    candidate,
    candidate === "all"
      ? catalog.length
      : catalog.filter((entry) => categoryFor(entry) === candidate).length,
  ]),
) as Record<CatalogCategory, number>;

function categoryFromUrl(): CatalogCategory {
  const category = new URLSearchParams(window.location.search).get("category");
  return catalogCategories.includes(category as CatalogCategory)
    ? (category as CatalogCategory)
    : "all";
}

function slugFromPath() {
  const match = window.location.pathname.match(/^\/components\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

function StarIcon() {
  return <span aria-hidden="true">☆</span>;
}

function Header() {
  return (
    <header className="site-header">
      <a className="wordmark" href="/" aria-label="Hyfrme home">
        <span className="wordmark-glyph" aria-hidden="true">
          hf
        </span>
        hyfrme
      </a>
      <nav className="library-navigation" aria-label="Library navigation">
        {categoryOrder.map((category) => (
          <a href={`/components?category=${category}`} key={category}>
            {categoryLabels[category]}
          </a>
        ))}
        <a href="/showcases">Showcases</a>
      </nav>
      <nav className="utility-navigation" aria-label="Project links">
        <a
          className="github-star-link"
          href={githubUrl}
          target="_blank"
          rel="noreferrer"
        >
          <StarIcon /> Star on GitHub
        </a>
      </nav>
    </header>
  );
}

type LibrarySidebarProps = {
  activeCategory: CatalogCategory;
  currentEntry?: CatalogEntry;
  onSelectCategory?: (
    category: CatalogCategory,
    event: MouseEvent<HTMLAnchorElement>,
  ) => void;
};

function LibrarySidebar({
  activeCategory,
  currentEntry,
  onSelectCategory,
}: LibrarySidebarProps) {
  const activeEntries =
    activeCategory === "all"
      ? []
      : catalog.filter((entry) => categoryFor(entry) === activeCategory);

  return (
    <aside className="library-sidebar">
      <nav aria-label="Library navigation">
        <span className="sidebar-label">Library</span>
        <a
          className={activeCategory === "all" ? "is-active" : ""}
          href="/components"
          onClick={(event) => onSelectCategory?.("all", event)}
        >
          <span>All components</span>
          <small>{catalogCategoryCounts.all}</small>
        </a>
        {categoryOrder.map((category) => (
          <a
            className={activeCategory === category ? "is-active" : ""}
            href={`/components?category=${category}`}
            key={category}
            onClick={(event) => onSelectCategory?.(category, event)}
          >
            <span>{categoryLabels[category]}</span>
            <small>{catalogCategoryCounts[category]}</small>
          </a>
        ))}
      </nav>
      {currentEntry ? (
        <nav className="sidebar-components" aria-label="Components in category">
          <span className="sidebar-label">
            {categoryLabels[categoryFor(currentEntry)]}
          </span>
          {activeEntries.map((entry) => (
            <a
              className={
                entry.item.name === currentEntry.item.name ? "is-current" : ""
              }
              href={`/components/${entry.item.name}`}
              key={entry.item.name}
            >
              {entry.item.title}
            </a>
          ))}
        </nav>
      ) : null}
    </aside>
  );
}

function CatalogPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CatalogCategory>(categoryFromUrl);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return catalog.filter((entry) => {
      const matchesCategory =
        category === "all" || categoryFor(entry) === category;
      const matchesQuery =
        !normalized ||
        [
          entry.item.name,
          entry.item.title,
          entry.item.description,
          ...entry.item.tags,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  useEffect(() => {
    document.title = "Hyfrme — motion components for HyperFrames";
  }, []);

  const selectCategory = (next: CatalogCategory) => {
    setCategory(next);
    const url = new URL(window.location.href);
    if (next === "all") url.searchParams.delete("category");
    else url.searchParams.set("category", next);
    window.history.replaceState(null, "", url);
  };

  const selectedLabel =
    category === "all" ? "Components" : categoryLabels[category];
  const selectedDescription =
    category === "all"
      ? "Browse, customize, and install open-source motion for HyperFrames."
      : `Browse every ${categoryLabels[category].toLowerCase()} block available in Hyfrme.`;

  return (
    <div className="docs-layout" id="catalog">
      <LibrarySidebar
        activeCategory={category}
        onSelectCategory={(next, event) => {
          event.preventDefault();
          selectCategory(next);
        }}
      />
      <section className="catalog-page">
        <header className="page-heading">
          <span className="section-kicker">Hyfrme library</span>
          <h1>{selectedLabel}</h1>
          <p>{selectedDescription}</p>
        </header>

        <div className="catalog-tools">
          <label className="catalog-search">
            <span className="sr-only">Search components</span>
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter components…"
            />
          </label>
          <span>{filtered.length} results</span>
        </div>

        <div className="mobile-filters" aria-label="Filter components">
          {catalogCategories.map((candidate) => (
            <button
              type="button"
              key={candidate}
              aria-pressed={category === candidate}
              onClick={() => selectCategory(candidate)}
            >
              {categoryLabels[candidate]}
            </button>
          ))}
        </div>

        {filtered.length > 0 ? (
          <div
            className={`catalog-grid${category === "icons" ? " is-icons" : ""}`}
          >
            {filtered.map((entry) => (
              <CatalogCard entry={entry} key={entry.item.name} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2>No components found</h2>
            <p>Try another search or clear the active filter.</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                selectCategory("all");
              }}
            >
              Show all components
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function HomePage() {
  useEffect(() => {
    document.title = "Hyfrme — motion components for HyperFrames";
  }, []);

  const families: LandingFamily[] = [
    {
      title: "Motion components",
      description:
        "Cinematic text, charts, reveals, and scene-ready motion blocks.",
      href: "/components?category=components",
      countLabel: `${catalogCategoryCounts.components} blocks`,
      preview: "/previews/matrix-decode/thumbnail.png",
      previewAlt: "Matrix Decode motion component",
    },
    {
      title: "UI primitives",
      description:
        "Buttons, inputs, dialogs, and product UI animated on the frame.",
      href: "/components?category=primitives",
      countLabel: `${catalogCategoryCounts.primitives} blocks`,
      preview: "/previews/button/thumbnail.png",
      previewAlt: "Animated button primitive",
    },
    {
      title: "Shaders",
      description:
        "Procedural backgrounds, distortions, wipes, and GPU-driven texture.",
      href: "/components?category=shaders",
      countLabel: `${catalogCategoryCounts.shaders} blocks`,
      preview: "/previews/shader-swirl/thumbnail.png",
      previewAlt: "Procedural swirl shader",
    },
    {
      title: "Animated icons",
      description:
        "Familiar Lucide shapes re-authored as deterministic motion.",
      href: "/components?category=icons",
      countLabel: `${catalogCategoryCounts.icons} blocks`,
      preview: "/previews/icon-sparkles/thumbnail.png",
      previewAlt: "Animated sparkles icon",
      presentation: "icon",
    },
    {
      title: "Showcases",
      description:
        "Finished films showing how the building blocks compose into stories.",
      href: "/showcases",
      countLabel: `${showcases.length} films`,
      preview: showcases[0]?.posterUrl ?? "",
      previewAlt: showcases[0]?.title ?? "Hyfrme showcase",
      presentation: "showcase",
    },
  ];

  return (
    <>
      <LandingHero
        componentCount={catalog.length}
        installCommand={installAllCommand}
      />
      <FamilySection families={families} />
    </>
  );
}

function DetailPage({ entry }: { entry: CatalogEntry }) {
  const [source, setSource] = useState("");
  const [previewItem, setPreviewItem] = useState<RegistryItem | null>(null);
  const [values, setValues] = useState<CustomValues>({});
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [verificationOpen, setVerificationOpen] = useState(false);
  const variables = useMemo(() => parseCompositionVariables(source), [source]);
  const defaults = useMemo(() => defaultValues(variables), [variables]);
  const effectiveValues = useMemo(
    () => ({ ...defaults, ...values }),
    [defaults, values],
  );
  const category = categoryFor(entry);
  const upstreamUrl = `https://github.com/Remocn/remocn/blob/${entry.parity.origin.commit}/${entry.parity.origin.source}`;
  const customized = variables.some(
    (variable) => effectiveValues[variable.id] !== variable.default,
  );
  const installCommands = buildInstallCommands(
    cliPackage,
    entry.item.name,
    variables,
    effectiveValues,
  );
  const usageSnippet = buildUsageSnippet(
    entry.item,
    variables,
    effectiveValues,
  );
  const entryIndex = catalog.findIndex(
    (candidate) => candidate.item.name === entry.item.name,
  );
  const previousEntry = entryIndex > 0 ? catalog[entryIndex - 1] : null;
  const nextEntry =
    entryIndex >= 0 && entryIndex < catalog.length - 1
      ? catalog[entryIndex + 1]
      : null;

  useEffect(() => {
    let active = true;
    document.title = `${entry.item.title} — Hyfrme`;
    setSource("");
    setPreviewItem(null);
    Promise.all([entry.loadSource(), entry.loadItem()]).then(
      ([nextSource, nextItem]) => {
        if (!active) return;
        setSource(nextSource);
        setPreviewItem(nextItem);
      },
    );
    return () => {
      active = false;
    };
  }, [entry]);

  useEffect(() => {
    if (variables.length > 0) setValues(valuesFromUrl(variables));
  }, [variables]);

  const changeValue = (id: string, value: string | number | boolean) => {
    setValues((current) => {
      const next = { ...current, [id]: value };
      writeValuesToUrl(variables, next);
      return next;
    });
  };

  const resetValues = () => {
    setValues(defaults);
    writeValuesToUrl(variables, defaults);
  };

  return (
    <div className="docs-layout detail-layout">
      <LibrarySidebar activeCategory={category} currentEntry={entry} />
      <article className="detail-page">
        <a className="back-link" href="/components">
          <span aria-hidden="true">←</span> All components
        </a>

        <header className="detail-header">
          <span className="section-kicker">
            {categoryDescription(category)} · {entry.item.name}
          </span>
          <h1>{entry.item.title}</h1>
          <p>{cardDescription(entry)}</p>
        </header>

        <section className="component-workbench" aria-label="Component editor">
          <div className="workbench-tabs" role="tablist" aria-label="View">
            <div>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "preview"}
                onClick={() => setTab("preview")}
              >
                Preview
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "code"}
                onClick={() => setTab("code")}
              >
                Code
              </button>
            </div>
            <span>
              {entry.item.dimensions.width} × {entry.item.dimensions.height} ·{" "}
              {entry.item.duration.toFixed(1)}s
            </span>
          </div>

          {tab === "preview" ? (
            source && previewItem ? (
              <LivePreview
                item={previewItem}
                source={source}
                values={effectiveValues}
              />
            ) : (
              <div className="preview-loading">Loading live preview…</div>
            )
          ) : (
            <CodePanel.Source
              source={usageSnippet}
              filename="index.html"
              copyLabel="Copy code"
            />
          )}

          {variables.length > 0 ? (
            <Customizer
              item={entry.item}
              variables={variables}
              values={effectiveValues}
              onChange={changeValue}
              onReset={resetValues}
              shareUrl={window.location.href}
            />
          ) : null}
        </section>

        <InstallPanel commands={installCommands} customized={customized} />

        {variables.length > 0 ? (
          <section className="detail-section variables-section">
            <div className="detail-section-heading">
              <div>
                <h2>Props</h2>
                <p>
                  The installer bakes your current values in as the new
                  defaults. You can keep changing them in HyperFrames.
                </p>
              </div>
            </div>
            <VariableTable variables={variables} values={effectiveValues} />
          </section>
        ) : null}

        <details
          className="verification-details"
          onToggle={(event) => setVerificationOpen(event.currentTarget.open)}
        >
          <summary>
            <span>
              Verified against Remocn ·{" "}
              {(entry.parity.result.meanSsim * 100).toFixed(3)}% match
            </span>
            <span>{entry.parity.result.frameCount} frames</span>
            <span aria-hidden="true">↓</span>
          </summary>
          {verificationOpen ? (
            <div className="verification-body">
              <div className="verification-copy">
                <p>
                  Synchronized renders of the pinned upstream source and this
                  HyperFrames port.
                </p>
                <a href={upstreamUrl} target="_blank" rel="noreferrer">
                  Original source <ArrowIcon />
                </a>
              </div>
              <Suspense
                fallback={
                  <div className="preview-loading">
                    Loading comparison player…
                  </div>
                }
              >
                <ComparisonPlayer
                  referenceSrc={`/previews/${entry.item.name}/remocn.mp4`}
                  portSrc={`/previews/${entry.item.name}/hyperframes.mp4`}
                  square={
                    entry.item.dimensions.width === entry.item.dimensions.height
                  }
                />
              </Suspense>
            </div>
          ) : null}
        </details>

        <nav className="component-pagination" aria-label="More components">
          {previousEntry ? (
            <a href={`/components/${previousEntry.item.name}`}>
              <span>← Previous</span>
              <strong>{previousEntry.item.title}</strong>
            </a>
          ) : (
            <span />
          )}
          {nextEntry ? (
            <a href={`/components/${nextEntry.item.name}`}>
              <span>Next →</span>
              <strong>{nextEntry.item.title}</strong>
            </a>
          ) : null}
        </nav>
      </article>
    </div>
  );
}

function NotFoundPage() {
  useEffect(() => {
    document.title = "Component not found — Hyfrme";
  }, []);

  return (
    <section className="not-found">
      <span className="section-kicker">404</span>
      <h1>That component is not here.</h1>
      <a href="/components">Browse all components</a>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <span>Hyfrme</span>
      <p>Open-source motion blocks for HyperFrames.</p>
      <div>
        <a href="/showcases">Showcases</a>
        <a href={githubUrl} target="_blank" rel="noreferrer">
          GitHub <ArrowIcon />
        </a>
        <a
          href={`${githubUrl}/blob/main/THIRD_PARTY_NOTICES.md`}
          target="_blank"
          rel="noreferrer"
        >
          Attributions <ArrowIcon />
        </a>
      </div>
    </footer>
  );
}

export function App() {
  const slug = slugFromPath();
  const entry = slug
    ? catalog.find((candidate) => candidate.item.name === slug)
    : null;
  const isComponentPath = window.location.pathname.startsWith("/components/");
  const showcaseMatch = window.location.pathname.match(
    /^\/showcases\/([^/]+)\/?$/,
  );
  const showcase = showcaseMatch
    ? showcases.find(
        (candidate) => candidate.slug === decodeURIComponent(showcaseMatch[1]),
      )
    : null;
  const isShowcasesIndex = /^\/showcases\/?$/.test(window.location.pathname);
  const isShowcasePath = window.location.pathname.startsWith("/showcases/");
  const isCatalogIndex = /^\/components\/?$/.test(window.location.pathname);
  const isHome = /^\/$/.test(window.location.pathname);

  return (
    <div className="page-shell">
      <Header />
      <main>
        {showcase ? (
          <ShowcaseDetailPage showcase={showcase} />
        ) : isShowcasesIndex ? (
          <ShowcasesPage />
        ) : isShowcasePath ? (
          <NotFoundPage />
        ) : entry ? (
          <DetailPage entry={entry} />
        ) : isCatalogIndex ? (
          <CatalogPage />
        ) : isComponentPath ? (
          <NotFoundPage />
        ) : isHome ? (
          <HomePage />
        ) : (
          <NotFoundPage />
        )}
      </main>
      <Footer />
    </div>
  );
}
