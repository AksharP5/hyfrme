import { useEffect, useMemo, useState } from "react";
import {
  catalog,
  type CatalogCategory,
  type CatalogEntry,
  cardDescription,
  categoryDescription,
  categoryFor,
  categoryLabels,
} from "./catalog";
import { CatalogCard } from "./components/CatalogCard";
import { CodePanel } from "./components/CodePanel";
import { ComparisonPlayer } from "./components/ComparisonPlayer";
import { Customizer } from "./components/Customizer";
import { InstallPanel } from "./components/InstallPanel";
import { LivePreview } from "./components/LivePreview";
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

const githubUrl = "https://github.com/AksharP5/hyfrme";
const cliUrl = "https://hyfrme.vercel.app/cli";
const catalogCategories = Object.keys(categoryLabels) as CatalogCategory[];
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

function Header() {
  return (
    <header className="site-header">
      <a className="wordmark" href="/" aria-label="Hyfrme home">
        <span className="wordmark-glyph" aria-hidden="true">
          hf
        </span>
        hyfrme
      </a>
      <nav className="library-navigation" aria-label="Component categories">
        <a href="/?category=components#catalog">Components</a>
        <a href="/?category=primitives#catalog">Primitives</a>
        <a href="/?category=shaders#catalog">Shaders</a>
        <a href="/?category=icons#catalog">Icons</a>
      </nav>
      <nav className="utility-navigation" aria-label="Project links">
        <a href={githubUrl} target="_blank" rel="noreferrer">
          GitHub <ArrowIcon />
        </a>
      </nav>
    </header>
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
    document.title = "Hyfrme — customizable motion for HyperFrames";
  }, []);

  const selectCategory = (next: CatalogCategory) => {
    setCategory(next);
    const url = new URL(window.location.href);
    if (next === "all") url.searchParams.delete("category");
    else url.searchParams.set("category", next);
    window.history.replaceState(null, "", url);
  };

  return (
    <>
      <section className="catalog-intro">
        <p className="eyebrow">Open-source motion library</p>
        <h1>Motion blocks you can make your own.</h1>
        <p>
          Preview, customize, and install production-ready HyperFrames
          components without leaving the browser.
        </p>
        <a className="hero-action" href="#catalog">
          Browse {catalog.length} components <span aria-hidden="true">↓</span>
        </a>
      </section>

      <section className="catalog-section" id="catalog">
        <div className="catalog-heading">
          <div>
            <span className="section-kicker">Library</span>
            <h2>Find your next motion</h2>
          </div>
          <label className="catalog-search">
            <span>Search</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search components…"
            />
          </label>
        </div>

        <div className="catalog-filters" aria-label="Filter components">
          {catalogCategories.map((candidate) => (
            <button
              type="button"
              key={candidate}
              aria-pressed={category === candidate}
              onClick={() => selectCategory(candidate)}
            >
              {categoryLabels[candidate]}
              <span>{catalogCategoryCounts[candidate]}</span>
            </button>
          ))}
          <span className="result-count">{filtered.length} shown</span>
        </div>

        {filtered.length > 0 ? (
          <div
            className={`catalog-grid${category === "icons" ? " is-icons" : ""}`}
          >
            {filtered.map((entry) => (
              <CatalogCard
                entry={entry}
                cliUrl={cliUrl}
                key={entry.item.name}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No components found</h3>
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
    </>
  );
}

function DetailPage({ entry }: { entry: CatalogEntry }) {
  const [source, setSource] = useState("");
  const [values, setValues] = useState<CustomValues>({});
  const [tab, setTab] = useState<"preview" | "code">("preview");
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
    cliUrl,
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
    entry.loadSource().then((nextSource) => {
      if (active) setSource(nextSource);
    });
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
    <article className="detail-page">
      <a className="back-link" href="/#catalog">
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
          <span>
            {entry.item.dimensions.width} × {entry.item.dimensions.height} ·{" "}
            {entry.item.duration.toFixed(1)}s
          </span>
        </div>

        {tab === "preview" ? (
          source ? (
            <LivePreview
              item={entry.item}
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
            copyLabel="Copy usage"
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

      <section className="detail-section usage-section">
        <div className="detail-section-heading">
          <div>
            <span className="section-kicker">Usage</span>
            <h2>Drop it into your composition</h2>
          </div>
          <p>
            The installer writes the block to <code>compositions/</code>. This
            is the complete host markup.
          </p>
        </div>
        <CodePanel.Source
          source={usageSnippet}
          filename="index.html"
          copyLabel="Copy usage"
        />
      </section>

      {variables.length > 0 ? (
        <section className="detail-section variables-section">
          <div className="detail-section-heading">
            <div>
              <span className="section-kicker">Variables</span>
              <h2>Everything you can change</h2>
            </div>
            <p>
              Use the controls above, the installer’s <code>--set</code>{" "}
              options, or <code>data-variable-values</code> in your host.
            </p>
          </div>
          <VariableTable variables={variables} values={effectiveValues} />
        </section>
      ) : null}

      <details className="verification-details">
        <summary>
          <span>
            <span className="section-kicker">Port verification</span>
            <strong>Measured against the original Remocn render</strong>
          </span>
          <span>
            {(entry.parity.result.meanSsim * 100).toFixed(3)}% match ·{" "}
            {entry.parity.result.frameCount} frames
          </span>
          <span>View comparison ↓</span>
        </summary>
        <div className="verification-body">
          <div className="detail-section-heading">
            <p>
              This technical evidence is kept out of the primary install flow.
              It is here for maintainers and anyone auditing the port.
            </p>
            <a href={upstreamUrl} target="_blank" rel="noreferrer">
              Original source <ArrowIcon />
            </a>
          </div>
          <ComparisonPlayer
            referenceSrc={`/previews/${entry.item.name}/remocn.mp4`}
            portSrc={`/previews/${entry.item.name}/hyperframes.mp4`}
            square={
              entry.item.dimensions.width === entry.item.dimensions.height
            }
          />
        </div>
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
      <a href="/#catalog">Browse all components</a>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <span>Hyfrme</span>
      <p>Open-source motion blocks for HyperFrames.</p>
      <div>
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

  return (
    <div className="page-shell">
      <Header />
      <main>
        {entry ? (
          <DetailPage entry={entry} />
        ) : isComponentPath ? (
          <NotFoundPage />
        ) : (
          <CatalogPage />
        )}
      </main>
      <Footer />
    </div>
  );
}
