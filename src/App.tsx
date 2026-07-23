import { useEffect, useMemo, useState } from "react";
import { CodePanel } from "./components/CodePanel";
import { ComparisonPlayer } from "./components/ComparisonPlayer";

type RegistryFile = {
  path: string;
  target: string;
  type: string;
};

type RegistryItem = {
  name: string;
  title: string;
  description: string;
  tags: string[];
  dimensions: { width: number; height: number };
  duration: number;
  files: RegistryFile[];
};

type Parity = {
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

type CatalogEntry = {
  item: RegistryItem;
  parity: Parity;
  loadSource: () => Promise<string>;
};

type CatalogCategory = "all" | "icons" | "typography" | "ui" | "scenes";

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

const catalog = Object.entries(registryModules)
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

const githubUrl = "https://github.com/AksharP5/hyfrme";
const cliUrl = "https://hyfrme.vercel.app/cli";

const categoryFor = (entry: CatalogEntry): Exclude<CatalogCategory, "all"> => {
  if (entry.item.tags.includes("icon")) return "icons";
  if (
    entry.item.tags.includes("typography") ||
    entry.item.tags.includes("effect")
  ) {
    return "typography";
  }
  if (entry.item.tags.includes("ui") || entry.item.tags.includes("primitive")) {
    return "ui";
  }
  return "scenes";
};

const categoryLabels: Record<CatalogCategory, string> = {
  all: "All",
  icons: "Icons",
  typography: "Typography",
  ui: "UI",
  scenes: "Scenes",
};

const categoryDescription = (category: Exclude<CatalogCategory, "all">) =>
  ({
    icons: "Animated icon",
    typography: "Type & text",
    ui: "UI primitive",
    scenes: "Scene & data",
  })[category];

const cardDescription = (entry: CatalogEntry) =>
  entry.item.description
    .replace(
      / Compiled for deterministic HyperFrames playback by Hyfrme\.$/,
      "",
    )
    .replace(/, ported from Remocn for HyperFrames\.$/, ".");

const slugFromPath = () => {
  const match = window.location.pathname.match(/^\/components\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
};

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
      <nav aria-label="Main navigation">
        <a href="/#catalog">Components</a>
        <a href={githubUrl} target="_blank" rel="noreferrer">
          GitHub <ArrowIcon />
        </a>
      </nav>
    </header>
  );
}

function CatalogCard({ entry }: { entry: CatalogEntry }) {
  const [previewing, setPreviewing] = useState(false);
  const category = categoryFor(entry);
  const previewRoot = `/previews/${entry.item.name}`;

  return (
    <a
      className="catalog-card"
      href={`/components/${entry.item.name}`}
      data-component-slug={entry.item.name}
      data-previewing={previewing ? "true" : "false"}
      onPointerEnter={() => setPreviewing(true)}
      onPointerLeave={() => setPreviewing(false)}
      onFocus={() => setPreviewing(true)}
      onBlur={() => setPreviewing(false)}
      aria-label={`Open ${entry.item.title}`}
    >
      <span className="catalog-card-preview">
        {previewing ? (
          <video
            src={`${previewRoot}/hyperframes.mp4`}
            poster={`${previewRoot}/thumbnail.png`}
            muted
            autoPlay
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          />
        ) : (
          <img src={`${previewRoot}/thumbnail.png`} alt="" loading="lazy" />
        )}
        <span className="preview-hint">Hover to play</span>
      </span>
      <span className="catalog-card-copy">
        <span>{categoryDescription(category)}</span>
        <strong>{entry.item.title}</strong>
        <span className="card-description">{cardDescription(entry)}</span>
        <span className="card-arrow" aria-hidden="true">
          ↗
        </span>
      </span>
    </a>
  );
}

function CatalogPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CatalogCategory>("all");
  const categories = Object.keys(categoryLabels) as CatalogCategory[];
  const categoryCounts = useMemo(
    () =>
      Object.fromEntries(
        categories.map((candidate) => [
          candidate,
          candidate === "all"
            ? catalog.length
            : catalog.filter((entry) => categoryFor(entry) === candidate)
                .length,
        ]),
      ) as Record<CatalogCategory, number>,
    [],
  );
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
    document.title = "Hyfrme — motion blocks for HyperFrames";
  }, []);

  return (
    <>
      <section className="catalog-intro">
        <span className="status-pill">Remocn motion · HyperFrames runtime</span>
        <h1>Cinematic components for HyperFrames.</h1>
        <p>
          {catalog.length} Remocn animations, rebuilt frame-for-frame as
          standalone HyperFrames blocks. Hover to preview, then open any block
          to compare and install it.
        </p>
      </section>

      <section className="catalog-section" id="catalog">
        <div className="catalog-heading">
          <div>
            <span className="section-kicker">Component library</span>
            <h2>Browse everything</h2>
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
          {categories.map((candidate) => (
            <button
              type="button"
              key={candidate}
              aria-pressed={category === candidate}
              onClick={() => setCategory(candidate)}
            >
              {categoryLabels[candidate]}
              <span>{categoryCounts[candidate]}</span>
            </button>
          ))}
          <span className="result-count">{filtered.length} shown</span>
        </div>

        {filtered.length > 0 ? (
          <div className="catalog-grid">
            {filtered.map((entry) => (
              <CatalogCard entry={entry} key={entry.item.name} />
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
                setCategory("all");
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
  const category = categoryFor(entry);
  const blockUrl = `${githubUrl}/blob/main/registry/blocks/${entry.item.name}/${entry.item.name}.html`;
  const upstreamUrl = `https://github.com/Remocn/remocn/blob/${entry.parity.origin.commit}/${entry.parity.origin.source}`;
  const installCommand = `npx ${cliUrl} add ${entry.item.name}`;

  useEffect(() => {
    let active = true;
    document.title = `${entry.item.title} — Hyfrme`;
    entry.loadSource().then((nextSource) => {
      if (active) setSource(nextSource);
    });
    return () => {
      active = false;
    };
  }, [entry]);

  return (
    <article className="detail-page">
      <a className="back-link" href="/#catalog">
        <span aria-hidden="true">←</span> All components
      </a>

      <header className="detail-header">
        <div>
          <span className="section-kicker">
            {categoryDescription(category)} · {entry.item.name}
          </span>
          <h1>{entry.item.title}</h1>
          <p>{cardDescription(entry)}</p>
          <div className="detail-meta">
            <span>Verified against Remocn</span>
            <span>{entry.item.duration.toFixed(1)}s</span>
            <span>
              {entry.item.dimensions.width} × {entry.item.dimensions.height}
            </span>
          </div>
        </div>

        <CodePanel.Install command={installCommand} />
      </header>

      <section className="detail-section">
        <div className="detail-section-heading">
          <div>
            <span className="section-kicker">Comparison</span>
            <h2>Remocn and HyperFrames</h2>
          </div>
          <a href={upstreamUrl} target="_blank" rel="noreferrer">
            Original source <ArrowIcon />
          </a>
        </div>
        <ComparisonPlayer
          referenceSrc={`/previews/${entry.item.name}/remocn.mp4`}
          portSrc={`/previews/${entry.item.name}/hyperframes.mp4`}
          square={entry.item.dimensions.width === entry.item.dimensions.height}
        />
        <p className="parity-note">
          Verified across {entry.parity.result.frameCount} frames ·{" "}
          {(entry.parity.result.meanSsim * 100).toFixed(3)}% visual match
        </p>
      </section>

      <section className="detail-section code-section">
        <div className="detail-section-heading">
          <div>
            <span className="section-kicker">Source</span>
            <h2>Own the code</h2>
          </div>
          <p>
            The installer copies these files into your project. Edit everything.
          </p>
        </div>
        <CodePanel.Source
          source={source || "Loading source…"}
          sourceUrl={blockUrl}
          filename={`${entry.item.name}.html`}
        />
      </section>
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
