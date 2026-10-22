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
  catalogSources,
  catalogTaxonomy,
  type CatalogCategory,
  type CatalogEntry,
  type CatalogSource,
  type CatalogTaxonomyGroup,
  type CatalogTaxonomySection,
  cardDescription,
  categoryFor,
  categoryLabels,
  taxonomyFor,
  taxonomySearchTerms,
} from "./catalog";
import { CatalogCard } from "./components/CatalogCard";
import { CatalogArtwork } from "./components/CatalogArtwork";
import { NotFoundPage } from "./components/NotFoundPage";
import { decodeSlug } from "./lib/routes";

const ComponentEditor = lazy(() =>
  import("./components/ComponentEditor").then((module) => ({
    default: module.ComponentEditor,
  })),
);
const catalogCategories = Object.keys(categoryLabels) as CatalogCategory[];
const catalogBySlug = new Map(
  catalog.map((entry) => [entry.item.name, entry] as const),
);

type SourceFilter = "all" | CatalogSource["id"];
const sourceFilters = [{ id: "all", label: "All" }, ...catalogSources] as const;

function sourceFromUrl(search = window.location.search): SourceFilter {
  const source = new URLSearchParams(search).get("source");
  return (
    catalogSources.find((candidate) => candidate.id === source)?.id ?? "all"
  );
}

function slugsForSection(section: CatalogTaxonomySection) {
  return section.slugs ?? section.groups?.flatMap((group) => group.slugs) ?? [];
}

function entriesForSlugs(slugs: string[]) {
  return slugs
    .map((slug) => catalogBySlug.get(slug))
    .filter((entry): entry is CatalogEntry => Boolean(entry));
}

function taxonomySectionsFor(
  category: CatalogCategory,
  source: SourceFilter = "all",
) {
  if (category === "all" && source !== "hyperframes") return [];
  const sections =
    category === "all"
      ? [
          ...(catalogTaxonomy.components ?? []),
          ...(catalogTaxonomy.templates ?? []),
        ]
      : (catalogTaxonomy[category] ?? []);
  if (sections.length === 0) return [];
  const assigned = new Set(sections.flatMap(slugsForSection));
  const ungrouped = catalog.filter(
    (entry) =>
      categoryFor(entry) === category && !assigned.has(entry.item.name),
  );
  const allSections =
    ungrouped.length === 0
      ? sections
      : [
          ...sections,
          {
            id: "more",
            label: `More ${categoryLabels[category].toLowerCase()}`,
            description:
              "Newly added blocks awaiting a more specific collection.",
            featuredSlug: ungrouped[0].item.name,
            slugs: ungrouped.map((entry) => entry.item.name),
          },
        ];
  if (source === "all") return allSections;
  const matchesSource = (slug: string) =>
    catalogBySlug.get(slug)?.source.id === source;
  return allSections.flatMap((section) => {
    const slugs = section.slugs?.filter(matchesSource);
    const groups = section.groups
      ?.map((group) => ({ ...group, slugs: group.slugs.filter(matchesSource) }))
      .filter((group) => group.slugs.length > 0);
    const names = slugs ?? groups?.flatMap((group) => group.slugs) ?? [];
    return names.length
      ? [{ ...section, slugs, groups, featuredSlug: names[0] }]
      : [];
  });
}

function visibleCategories(source: SourceFilter) {
  return source === "hyperframes"
    ? (["all", "components", "templates"] as const)
    : catalogCategories;
}

function categoryLabel(category: CatalogCategory, source: SourceFilter) {
  if (source !== "hyperframes") return categoryLabels[category];
  return category === "all"
    ? "All HyperFrames"
    : category === "components"
      ? "Catalog"
      : categoryLabels[category];
}

function taxonomyHref(
  category: CatalogCategory,
  section?: CatalogTaxonomySection,
  group?: CatalogTaxonomyGroup,
  source: SourceFilter = sourceFromUrl(),
) {
  const params = new URLSearchParams();
  if (category !== "all") params.set("category", category);
  if (section) params.set("section", section.id);
  if (group) params.set("group", group.id);
  if (source !== "all") params.set("source", source);
  return `/components${params.size ? `?${params}` : ""}`;
}

function categoryFromUrl(search = window.location.search): CatalogCategory {
  const category = new URLSearchParams(search).get("category");
  const categories: readonly CatalogCategory[] = visibleCategories(
    sourceFromUrl(search),
  );
  return categories.includes(category as CatalogCategory)
    ? (category as CatalogCategory)
    : "all";
}

function slugFromPath() {
  const match = window.location.pathname.match(/^\/components\/([^/]+)\/?$/);
  return match ? decodeSlug(match[1]) : null;
}

type LibrarySidebarProps = {
  activeCategory: CatalogCategory;
  source?: SourceFilter;
  activeSection?: string;
  activeGroup?: string;
  currentEntry?: CatalogEntry;
  onSelectCategory?: (
    category: CatalogCategory,
    event: MouseEvent<HTMLAnchorElement>,
  ) => void;
};

function LibrarySidebar({
  activeCategory,
  source = sourceFromUrl(),
  activeSection,
  activeGroup,
  currentEntry,
  onSelectCategory,
}: LibrarySidebarProps) {
  const taxonomy = currentEntry ? taxonomyFor(currentEntry) : undefined;
  const resolvedSection = taxonomy?.section.id ?? activeSection;
  const resolvedGroup = taxonomy?.group?.id ?? activeGroup;
  const sections = taxonomySectionsFor(activeCategory, source);
  const sourceEntries = catalog.filter(
    (entry) => source === "all" || entry.source.id === source,
  );
  const selectedSection = sections.find(
    (section) => section.id === resolvedSection,
  );
  const fallbackEntries =
    activeCategory === "all"
      ? []
      : catalog.filter((entry) => categoryFor(entry) === activeCategory);

  return (
    <aside className="library-sidebar">
      <nav aria-label="Library navigation">
        <span className="sidebar-label">Library</span>
        <a
          className={activeCategory === "all" ? "is-active" : ""}
          href={taxonomyHref("all", undefined, undefined, source)}
          onClick={(event) => onSelectCategory?.("all", event)}
        >
          <span>{categoryLabel("all", source)}</span>
          <small>{sourceEntries.length}</small>
        </a>
        {visibleCategories(source)
          .filter((category) => category !== "all")
          .map((category) => (
            <a
              className={activeCategory === category ? "is-active" : ""}
              href={taxonomyHref(category, undefined, undefined, source)}
              key={category}
              onClick={(event) => onSelectCategory?.(category, event)}
            >
              <span>{categoryLabel(category, source)}</span>
              <small>
                {
                  sourceEntries.filter(
                    (entry) => categoryFor(entry) === category,
                  ).length
                }
              </small>
            </a>
          ))}
      </nav>
      {sections.length > 0 ? (
        <nav className="sidebar-taxonomy" aria-label="Browse this category">
          <span className="sidebar-label">Browse</span>
          {sections.map((section) => (
            <div className="sidebar-taxonomy-section" key={section.id}>
              <a
                className={resolvedSection === section.id ? "is-active" : ""}
                href={taxonomyHref(activeCategory, section, undefined, source)}
              >
                <span>{section.label}</span>
                <small>{slugsForSection(section).length}</small>
              </a>
              {resolvedSection === section.id && section.groups ? (
                <div className="sidebar-taxonomy-groups">
                  {section.groups.map((group) => (
                    <a
                      className={resolvedGroup === group.id ? "is-active" : ""}
                      href={taxonomyHref(
                        activeCategory,
                        section,
                        group,
                        source,
                      )}
                      key={group.id}
                    >
                      <span>{group.label}</span>
                      <small>{group.slugs.length}</small>
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {currentEntry && selectedSection ? (
            <div className="sidebar-entry-list">
              {(
                selectedSection.groups ?? [
                  {
                    id: selectedSection.id,
                    label: selectedSection.label,
                    slugs: selectedSection.slugs ?? [],
                  },
                ]
              ).map((group) => (
                <div key={group.id}>
                  <span className="sidebar-group-label">{group.label}</span>
                  {entriesForSlugs(group.slugs).map((entry) => (
                    <a
                      className={
                        entry.item.name === currentEntry.item.name
                          ? "is-current"
                          : ""
                      }
                      href={`/components/${entry.item.name}`}
                      key={entry.item.name}
                    >
                      {entry.item.title}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          ) : null}
        </nav>
      ) : currentEntry ? (
        <nav className="sidebar-components" aria-label="Components in category">
          <span className="sidebar-label">
            {categoryLabels[categoryFor(currentEntry)]}
          </span>
          {fallbackEntries.map((entry) => (
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
  const [search, setSearch] = useState(() => window.location.search);
  const category = categoryFromUrl(search);
  const source = sourceFromUrl(search);
  const taxonomySections = taxonomySectionsFor(category, source);
  const urlParams = new URLSearchParams(search);
  const selectedSection = taxonomySections.find(
    (section) => section.id === urlParams.get("section"),
  );
  const selectedGroup = selectedSection?.groups?.find(
    (group) => group.id === urlParams.get("group"),
  );
  const matchingEntries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return catalog.filter((entry) => {
      const matchesCategory =
        category === "all" || categoryFor(entry) === category;
      const entryTaxonomy = taxonomyFor(entry);
      const matchesSection =
        !selectedSection ||
        entryTaxonomy?.section.id === selectedSection.id ||
        slugsForSection(selectedSection).includes(entry.item.name);
      const matchesGroup =
        !selectedGroup ||
        entryTaxonomy?.group?.id === selectedGroup.id ||
        selectedGroup.slugs.includes(entry.item.name);
      const matchesQuery =
        !normalized ||
        [
          entry.item.name,
          entry.item.title,
          entry.item.description,
          entry.source.label,
          ...entry.item.tags,
          ...taxonomySearchTerms(entry),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      return matchesCategory && matchesSection && matchesGroup && matchesQuery;
    });
  }, [category, query, selectedGroup, selectedSection]);
  const filtered = matchingEntries.filter(
    (entry) => source === "all" || entry.source.id === source,
  );

  useEffect(() => {
    document.title = "Hyfrme — motion components for HyperFrames";
  }, []);

  const selectFilters = (
    nextCategory: CatalogCategory,
    nextSource: SourceFilter,
  ) => {
    const categories: readonly CatalogCategory[] =
      visibleCategories(nextSource);
    const next = categories.includes(nextCategory) ? nextCategory : "all";
    const url = new URL(window.location.href);
    url.searchParams.delete("section");
    url.searchParams.delete("group");
    if (next === "all") {
      url.searchParams.delete("category");
    } else {
      url.searchParams.set("category", next);
    }
    if (nextSource === "all") url.searchParams.delete("source");
    else url.searchParams.set("source", nextSource);
    window.history.replaceState(null, "", url);
    setSearch(url.search);
  };

  const selectedLabel = selectedGroup
    ? selectedGroup.label
    : selectedSection
      ? selectedSection.label
      : category === "all"
        ? categoryLabel("all", source)
        : categoryLabel(category, source);
  const selectedDescription =
    selectedGroup?.description ??
    selectedSection?.description ??
    {
      all: "Browse, customize, and install every open-source Hyfrme block.",
      components:
        "Choose a focused motion family, then narrow it down by technique.",
      primitives:
        "Timeline-driven interface components, complete flows, and installable parts.",
      shaders:
        "Procedural backgrounds, textures, distortions, and GPU-driven motion.",
      icons: "Familiar Lucide shapes re-authored as deterministic motion.",
      templates:
        "Complete HyperFrames projects. Install a template and make it yours.",
    }[category];
  const filteredNames = new Set(filtered.map((entry) => entry.item.name));
  const queryActive = query.trim().length > 0;

  const renderGrid = (entries: CatalogEntry[]) => (
    <div className={`catalog-grid${category === "icons" ? " is-icons" : ""}`}>
      {entries.map((entry) => (
        <CatalogCard entry={entry} key={entry.item.name} />
      ))}
    </div>
  );

  const renderTaxonomySection = (section: CatalogTaxonomySection) => {
    const groups = section.groups ?? [
      {
        id: section.id,
        label: section.label,
        slugs: section.slugs ?? [],
      },
    ];
    const visibleGroups = groups
      .filter((group) => !selectedGroup || group.id === selectedGroup.id)
      .map((group) => ({
        group,
        entries: entriesForSlugs(group.slugs).filter((entry) =>
          filteredNames.has(entry.item.name),
        ),
      }))
      .filter(({ entries }) => entries.length > 0);

    if (visibleGroups.length === 0) return null;
    return (
      <section className="catalog-section" key={section.id}>
        {!selectedSection || queryActive ? (
          <header className="catalog-section-heading">
            <div>
              <h2>{section.label}</h2>
              <p>{section.description}</p>
            </div>
            <a href={taxonomyHref(category, section)}>
              View {section.label.toLowerCase()}{" "}
              <span aria-hidden="true">→</span>
            </a>
          </header>
        ) : null}
        <div className="catalog-groups">
          {visibleGroups.map(({ group, entries }) => (
            <section className="catalog-group" key={group.id}>
              {groups.length > 1 && !selectedGroup ? (
                <header className="catalog-group-heading">
                  <h3>{group.label}</h3>
                  <a href={taxonomyHref(category, section, group)}>
                    {entries.length} {entries.length === 1 ? "block" : "blocks"}
                    <span aria-hidden="true">→</span>
                  </a>
                </header>
              ) : null}
              {renderGrid(entries)}
            </section>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="docs-layout" id="catalog">
      <LibrarySidebar
        activeCategory={category}
        source={source}
        activeSection={selectedSection?.id}
        activeGroup={selectedGroup?.id}
        onSelectCategory={(next, event) => {
          if (
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
          )
            return;
          event.preventDefault();
          selectFilters(next, source);
        }}
      />
      <section className="catalog-page">
        <header className="page-heading">
          <span className="section-kicker">
            {selectedSection
              ? `${categoryLabels[category]} · ${selectedSection.label}`
              : "Hyfrme library"}
          </span>
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

        <div
          className="source-filters"
          role="group"
          aria-label="Filter by source"
        >
          <span>Source</span>
          {sourceFilters.map((candidate) => (
            <button
              type="button"
              key={candidate.id}
              aria-pressed={source === candidate.id}
              onClick={() => selectFilters(category, candidate.id)}
            >
              {candidate.label}
              <span>
                {candidate.id === "all"
                  ? matchingEntries.length
                  : matchingEntries.filter(
                      (entry) => entry.source.id === candidate.id,
                    ).length}
              </span>
            </button>
          ))}
        </div>

        <div className="mobile-filters" aria-label="Filter components">
          {visibleCategories(source).map((candidate) => (
            <button
              type="button"
              key={candidate}
              aria-pressed={category === candidate}
              onClick={() => selectFilters(candidate, source)}
            >
              {categoryLabel(candidate, source)}
            </button>
          ))}
        </div>

        {taxonomySections.length > 0 ? (
          <nav className="mobile-taxonomy" aria-label="Browse this category">
            {selectedSection?.groups
              ? selectedSection.groups.map((group) => (
                  <a
                    className={
                      selectedGroup?.id === group.id ? "is-active" : ""
                    }
                    href={taxonomyHref(category, selectedSection, group)}
                    key={group.id}
                  >
                    {group.label}
                  </a>
                ))
              : taxonomySections.map((section) => (
                  <a
                    className={
                      selectedSection?.id === section.id ? "is-active" : ""
                    }
                    href={taxonomyHref(category, section)}
                    key={section.id}
                  >
                    {section.label}
                  </a>
                ))}
          </nav>
        ) : null}

        {filtered.length > 0 ? (
          taxonomySections.length > 0 &&
          !selectedSection &&
          !queryActive &&
          source === "all" &&
          category !== "icons" ? (
            <div className="taxonomy-overview">
              {taxonomySections.map((section) => {
                const count = slugsForSection(section).length;
                const featured = catalogBySlug.get(section.featuredSlug);
                if (!featured) return null;
                return (
                  <a
                    className="taxonomy-card"
                    href={taxonomyHref(category, section)}
                    key={section.id}
                  >
                    <span className="taxonomy-card-preview">
                      <CatalogArtwork entry={featured} />
                    </span>
                    <span className="taxonomy-card-copy">
                      <small>
                        {count} {count === 1 ? "block" : "blocks"}
                      </small>
                      <strong>{section.label}</strong>
                      <p>{section.description}</p>
                      <span>
                        Browse <span aria-hidden="true">→</span>
                      </span>
                    </span>
                  </a>
                );
              })}
            </div>
          ) : taxonomySections.length > 0 ? (
            <div className="catalog-sections">
              {(selectedSection ? [selectedSection] : taxonomySections).map(
                renderTaxonomySection,
              )}
            </div>
          ) : (
            renderGrid(filtered)
          )
        ) : (
          <div className="empty-state">
            <h2>No components found</h2>
            <p>Try another search or clear the active filter.</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                selectFilters("all", "all");
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

function DetailPage({
  entry,
  cliPackage,
}: {
  entry: CatalogEntry;
  cliPackage: string;
}) {
  const category = categoryFor(entry);
  const entryTaxonomy = taxonomyFor(entry);
  const neighboringEntries = entryTaxonomy?.group
    ? entriesForSlugs(entryTaxonomy.group.slugs)
    : entryTaxonomy
      ? entriesForSlugs(slugsForSection(entryTaxonomy.section))
      : catalog.filter((candidate) => categoryFor(candidate) === category);
  const entryIndex = neighboringEntries.findIndex(
    (candidate) => candidate.item.name === entry.item.name,
  );
  const previousEntry =
    entryIndex > 0 ? neighboringEntries[entryIndex - 1] : null;
  const nextEntry =
    entryIndex >= 0 && entryIndex < neighboringEntries.length - 1
      ? neighboringEntries[entryIndex + 1]
      : null;

  return (
    <div className="docs-layout detail-layout">
      <LibrarySidebar
        activeCategory={category}
        currentEntry={entry}
        source={
          entry.source.id === "hyperframes" ? "hyperframes" : sourceFromUrl()
        }
      />
      <article className="detail-page">
        <a
          className="back-link"
          href={
            entryTaxonomy
              ? taxonomyHref(
                  entryTaxonomy.category,
                  entryTaxonomy.section,
                  entryTaxonomy.group,
                  entry.source.id === "hyperframes"
                    ? "hyperframes"
                    : sourceFromUrl(),
                )
              : `/components?category=${category}`
          }
        >
          <span aria-hidden="true">←</span>{" "}
          {entryTaxonomy?.group?.label ??
            entryTaxonomy?.section.label ??
            categoryLabels[category]}
        </a>

        <Suspense
          fallback={
            <div className="preview-loading">Loading component editor…</div>
          }
        >
          <ComponentEditor entry={entry} cliPackage={cliPackage} />
        </Suspense>

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

export function CatalogPages({ cliPackage }: { cliPackage: string }) {
  const slug = slugFromPath();
  const entry = slug ? catalogBySlug.get(slug) : undefined;
  if (entry) return <DetailPage entry={entry} cliPackage={cliPackage} />;
  if (/^\/components\/?$/.test(window.location.pathname))
    return <CatalogPage />;
  return <NotFoundPage />;
}
