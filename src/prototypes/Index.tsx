import { useState } from "react";
import {
  catalog,
  categoryFor,
  categoryLabels,
  type CatalogCategory,
} from "../catalog";
import { prototypeCategories, prototypeTotal } from "./data";
import { Brand, Navigation, Preview } from "./shared";
import "./index.css";

const selectedNames = [
  "snapcn-moodboard-reveal",
  "shader-liquid-metal",
  "snapcn-type-morph",
  "screen-lift",
  "snapcn-reel-collage",
  "before-after",
];

const selectedEntries = selectedNames.flatMap((name) => {
  const entry = catalog.find(({ item }) => item.name === name);
  return entry ? [entry] : [];
});

export function Index() {
  const [category, setCategory] = useState<CatalogCategory>("all");
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState("light");
  const matchingEntries = catalog.filter(
    (entry) =>
      (category === "all" || categoryFor(entry) === category) &&
      `${entry.item.title} ${entry.item.tags.join(" ")}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const entries =
    category === "all" && !query.trim()
      ? selectedEntries
      : matchingEntries.slice(0, 8);

  return (
    <div className="p2-page index-page" data-theme={theme}>
      <header className="index-header">
        <Brand className="index-brand" />
        <Navigation className="index-nav" />
        <button
          className="index-theme-toggle"
          type="button"
          aria-pressed={theme === "dark"}
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          {theme === "light" ? "Dark view" : "Light view"}
        </button>
      </header>

      <main className="index-main">
        <section className="index-intro" aria-labelledby="index-title">
          <h1 id="index-title">The motion index.</h1>
          <p>
            Editable motion for HyperFrames. Preview a block. Take the source.
          </p>
        </section>

        <section className="index-archive" aria-label="Motion library">
          <aside className="index-sidebar">
            <div className="index-sidebar-inner">
              <div className="index-sidebar-title">
                The index <span>{prototypeTotal}</span>
              </div>
              <div
                className="index-filters"
                role="group"
                aria-label="Filter library"
              >
                <button
                  className={
                    category === "all"
                      ? "index-filter index-filter-active"
                      : "index-filter"
                  }
                  aria-pressed={category === "all"}
                  onClick={() => setCategory("all")}
                  type="button"
                >
                  <span>Selected</span>
                  <span>{String(selectedEntries.length).padStart(2, "0")}</span>
                </button>
                {prototypeCategories.map((item) => (
                  <button
                    key={item.id}
                    className={
                      category === item.id
                        ? "index-filter index-filter-active"
                        : "index-filter"
                    }
                    aria-pressed={category === item.id}
                    onClick={() => setCategory(item.id)}
                    type="button"
                  >
                    <span>{item.label}</span>
                    <span>{item.count}</span>
                  </button>
                ))}
              </div>
              <div className="index-sidebar-note">
                <p>
                  Remocn, Snapcn,
                  <br />
                  and Hyfrme originals.
                </p>
                <a href="/components">View the full library ↗</a>
              </div>
            </div>
          </aside>

          <div className="index-content">
            <div className="index-toolbar">
              <span className="index-results" aria-live="polite">
                {query.trim()
                  ? `${matchingEntries.length} results`
                  : category === "all"
                    ? "A few worth a look"
                    : categoryLabels[category]}
              </span>
              <label className="index-search">
                <span className="index-search-label">Search the library</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search motion"
                />
                <span aria-hidden="true">↗</span>
              </label>
            </div>

            <div className="index-grid" key={category}>
              {entries.map((entry, position) => (
                <article className="index-entry" key={entry.item.name}>
                  <Preview
                    slug={entry.item.name}
                    title={entry.item.title}
                    className={`index-preview index-preview-${position % 4}`}
                  />
                  <a
                    className="index-entry-caption"
                    href={`/components/${entry.item.name}`}
                  >
                    <span className="index-entry-number">
                      {String(position + 1).padStart(2, "0")}
                    </span>
                    <span className="index-entry-title">
                      {entry.item.title}
                    </span>
                    <span className="index-entry-source">
                      {entry.source.label}
                    </span>
                    <span className="index-entry-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </a>
                </article>
              ))}
            </div>
            {!entries.length && (
              <div className="index-empty">
                <h2>No motion found.</h2>
                <p>Try a component name or a different category.</p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setCategory("all");
                  }}
                >
                  Reset filters ↗
                </button>
              </div>
            )}
            {entries.length > 0 && category !== "all" && (
              <a
                className="index-more"
                href={`/components?category=${category}`}
              >
                Explore all {categoryLabels[category].toLowerCase()}{" "}
                <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        </section>
      </main>

      <footer className="index-footer">
        <span>Made for HyperFrames.</span>
        <span>The source is yours.</span>
        <a href="https://github.com/AksharP5/hyfrme">Contribute to Hyfrme ↗</a>
      </footer>
    </div>
  );
}
