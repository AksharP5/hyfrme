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
  classification: string;
  result: {
    frameCount: number;
    meanSsim: number;
    minSsim: number;
    p05Ssim: number;
    p95Ssim: number;
    pass: boolean;
  };
};

type CatalogEntry = {
  item: RegistryItem;
  parity: Parity;
  loadSource: () => Promise<string>;
};

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
  .sort((left, right) => {
    if (left.item.name === "soft-blur-in") return -1;
    if (right.item.name === "soft-blur-in") return 1;
    return left.item.title.localeCompare(right.item.title);
  });

const githubUrl = "https://github.com/AksharP5/hyfrme";
const rawRoot =
  "https://raw.githubusercontent.com/AksharP5/hyfrme/main/registry/blocks";
const featured = catalog.find((entry) => entry.item.name === "soft-blur-in")!;

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

const classificationLabel = (classification: string) =>
  classification === "mechanical-port"
    ? "Native mechanical port"
    : "Compiled source port";

const installCommandFor = (entry: CatalogEntry) => {
  const directories = [
    ...new Set(
      entry.item.files.map((file) =>
        file.target.split("/").slice(0, -1).join("/"),
      ),
    ),
  ].filter(Boolean);
  const commands =
    directories.length > 0 ? [`mkdir -p ${directories.join(" ")}`] : [];
  for (const file of entry.item.files) {
    commands.push(
      `curl -fsSL ${rawRoot}/${entry.item.name}/${file.path} -o ${file.target}`,
    );
  }
  return commands.join("\n");
};

export function App() {
  const [query, setQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState(featured.item.name);
  const [selectedSource, setSelectedSource] = useState("");
  const selected =
    catalog.find((entry) => entry.item.name === selectedSlug) ?? featured;
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return catalog;
    return catalog.filter((entry) =>
      [
        entry.item.name,
        entry.item.title,
        entry.item.description,
        ...entry.item.tags,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [query]);

  useEffect(() => {
    let active = true;
    setSelectedSource("");
    selected.loadSource().then((source) => {
      if (active) setSelectedSource(source);
    });
    return () => {
      active = false;
    };
  }, [selected]);

  const select = (slug: string) => {
    setSelectedSlug(slug);
    window.setTimeout(
      () => document.getElementById("compare")?.scrollIntoView(),
      0,
    );
  };
  const blockUrl = `${githubUrl}/blob/main/registry/blocks/${selected.item.name}/${selected.item.name}.html`;
  const upstreamUrl = `https://github.com/Remocn/remocn/blob/${selected.parity.origin.commit}/${selected.parity.origin.source}`;
  const isIcon = selected.item.tags.includes("icon");
  const isCompiled = selected.parity.classification === "compiled-source-port";

  return (
    <div className="page-shell">
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Hyfrme home">
          <span className="wordmark-glyph" aria-hidden="true">
            hf
          </span>
          hyfrme
        </a>
        <nav aria-label="Main navigation">
          <a href="#catalog">Catalog</a>
          <a href="#compare">Compare</a>
          <a href="#method">Method</a>
        </nav>
        <a
          className="github-link"
          href={githubUrl}
          target="_blank"
          rel="noreferrer"
        >
          GitHub <ArrowIcon />
        </a>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span>Open source</span>
              <span>{catalog.length} verified ports</span>
            </div>
            <h1>
              Frames should survive the <em>framework.</em>
            </h1>
            <p className="hero-lede">
              Hyfrme ports Remocn motion components into standalone HyperFrames
              blocks—and publishes the frame-by-frame proof beside every one.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#catalog">
                Browse {catalog.length} ports <span aria-hidden="true">↓</span>
              </a>
              <a
                className="button button-secondary"
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
              >
                Read the source <ArrowIcon />
              </a>
            </div>
          </div>
          <div
            className="hero-proof"
            aria-label="Featured port fidelity summary"
          >
            <div className="proof-heading">
              <span>{featured.item.name}</span>
              <span className="verified-badge">verified</span>
            </div>
            <video
              src={`/previews/${featured.item.name}/hyperframes.mp4`}
              muted
              autoPlay
              loop
              playsInline
              aria-label={`${featured.item.title} verified HyperFrames render`}
            />
            <div className="proof-metrics">
              <div>
                <span>Mean SSIM</span>
                <strong>{featured.parity.result.meanSsim.toFixed(6)}</strong>
              </div>
              <div>
                <span>Frames tested</span>
                <strong>{featured.parity.result.frameCount}</strong>
              </div>
              <div>
                <span>Catalog</span>
                <strong>{catalog.length} passing</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="ticker" aria-label="Project principles">
          <span>Source-visible</span>
          <span aria-hidden="true">◆</span>
          <span>Frame-measured</span>
          <span aria-hidden="true">◆</span>
          <span>HyperFrames-ready</span>
          <span aria-hidden="true">◆</span>
          <span>MIT licensed</span>
        </section>

        <section className="catalog-section" id="catalog">
          <div className="section-heading">
            <div>
              <span className="section-kicker">
                Catalog / {String(catalog.length).padStart(3, "0")}
              </span>
              <h2>Verified blocks</h2>
            </div>
            <p>
              Nothing enters this catalog until the HyperFrames render passes a
              pinned, frame-by-frame comparison against Remocn.
            </p>
          </div>

          <div className="catalog-tools">
            <label htmlFor="catalog-search">Search ports</label>
            <input
              id="catalog-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try loader, arrow, status…"
            />
            <span>{filtered.length} results</span>
          </div>

          <div className="catalog-grid">
            {filtered.map((entry, index) => (
              <button
                className="catalog-card"
                type="button"
                key={entry.item.name}
                onClick={() => select(entry.item.name)}
              >
                <span className="catalog-card-index">
                  {String(index + 1).padStart(3, "0")}
                </span>
                <span className="catalog-card-preview">
                  <img
                    src={`/previews/${entry.item.name}/thumbnail.png`}
                    alt=""
                    loading="lazy"
                  />
                </span>
                <span className="catalog-card-copy">
                  <span>
                    {entry.item.tags.includes("icon")
                      ? "Animated icon"
                      : entry.item.tags.includes("typography")
                        ? "Typography / effect"
                        : "Composition / data"}
                  </span>
                  <strong>{entry.item.title}</strong>
                </span>
                <span className="catalog-card-score">
                  {(entry.parity.result.meanSsim * 100).toFixed(3)}%
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="compare-section" id="compare">
          <div className="component-heading">
            <div>
              <span className="section-kicker">
                Selected / {selected.item.name}
              </span>
              <h2>{selected.item.title}</h2>
            </div>
            <div className="component-tags">
              {selected.item.tags.slice(0, 3).map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>

          <ComparisonPlayer
            key={selected.item.name}
            referenceSrc={`/previews/${selected.item.name}/remocn.mp4`}
            portSrc={`/previews/${selected.item.name}/hyperframes.mp4`}
            square={
              selected.item.dimensions.width === selected.item.dimensions.height
            }
          />

          <div className="port-details">
            <div className="port-description">
              <span className="section-kicker">What was preserved</span>
              <h3>
                {isIcon
                  ? "Same paths. Same frame math."
                  : isCompiled
                    ? "Same component. Same frame math."
                    : "Same motion. Native timeline."}
              </h3>
              <p>
                {isIcon
                  ? "The original SVG paths, props, easing, interpolation, spring behavior, and action timing are compiled into a deterministic HyperFrames-controlled block. The canonical render is measured across every source frame."
                  : isCompiled
                    ? "The original React component, editable controls, Remotion frame math, typography, and source timing are bundled into a deterministic runtime driven by the HyperFrames GSAP clock. The canonical render is measured across every source frame."
                    : "Per-character timing, blur, vertical travel, typography, and the source cubic Bézier are rebuilt in a seek-safe GSAP timeline and measured across the complete fixture."}
              </p>
              <a href={upstreamUrl} target="_blank" rel="noreferrer">
                Inspect the pinned Remocn source <ArrowIcon />
              </a>
            </div>
            <dl className="spec-list">
              <div>
                <dt>Classification</dt>
                <dd>{classificationLabel(selected.parity.classification)}</dd>
              </div>
              <div>
                <dt>Canvas</dt>
                <dd>
                  {selected.parity.fixture.width} ×{" "}
                  {selected.parity.fixture.height}
                </dd>
              </div>
              <div>
                <dt>Runtime</dt>
                <dd>
                  {selected.item.duration.toFixed(2)}s /{" "}
                  {selected.parity.fixture.fps} fps
                </dd>
              </div>
              <div>
                <dt>Frames</dt>
                <dd>{selected.parity.result.frameCount}</dd>
              </div>
              <div>
                <dt>Result</dt>
                <dd className="pass-value">
                  Pass / {selected.parity.result.meanSsim.toFixed(6)}
                </dd>
              </div>
            </dl>
          </div>

          <CodePanel
            source={selectedSource || "Loading source…"}
            installCommand={installCommandFor(selected)}
            sourceUrl={blockUrl}
            filename={`${selected.item.name}.html`}
            fileCount={selected.item.files.length}
          />
        </section>

        <section className="method-section" id="method">
          <div className="section-heading method-heading">
            <div>
              <span className="section-kicker">The fidelity contract</span>
              <h2>Proof, not “looks close.”</h2>
            </div>
            <p>
              Every port carries its source commit, fixture, implementation
              class, rendered artifacts, and pass/fail measurement in the repo.
            </p>
          </div>
          <ol className="method-grid">
            <li>
              <span>01</span>
              <h3>Pin</h3>
              <p>
                Freeze the upstream commit, props, canvas, fps, and duration.
              </p>
            </li>
            <li>
              <span>02</span>
              <h3>Translate</h3>
              <p>Map source timing to deterministic HyperFrames primitives.</p>
            </li>
            <li>
              <span>03</span>
              <h3>Render</h3>
              <p>
                Produce both videos from the same fixture and color pipeline.
              </p>
            </li>
            <li>
              <span>04</span>
              <h3>Measure</h3>
              <p>
                Compare every frame, publish the score, and document any gap.
              </p>
            </li>
          </ol>
        </section>
      </main>

      <footer>
        <a className="wordmark footer-wordmark" href="#top">
          hyfrme
        </a>
        <p>
          An independent MIT-licensed project. Remocn and HyperFrames remain
          their respective projects.
        </p>
        <div>
          <a href={githubUrl} target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
          <a
            href={`${githubUrl}/blob/main/THIRD_PARTY_NOTICES.md`}
            target="_blank"
            rel="noreferrer"
          >
            Attributions ↗
          </a>
        </div>
      </footer>
    </div>
  );
}
