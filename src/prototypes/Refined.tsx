import { useEffect, useRef, useState } from "react";
import {
  catalog,
  categoryFor,
  categoryLabels,
  type CatalogCategory,
  type CatalogEntry,
} from "../catalog";
import { prototypeCategories, prototypeNavigation } from "./data";
import "./refined.css";

const byName = new Map(catalog.map((entry) => [entry.item.name, entry]));
function entriesFor(names: string[]) {
  return names.map((name) => {
    const entry = byName.get(name);
    if (!entry) throw new Error(`Missing homepage preview: ${name}`);
    return entry;
  });
}

const heroEntries = entriesFor([
  "before-after",
  "screen-lift",
  "snapcn-moodboard-reveal",
  "snapcn-phone-frame",
  "shader-caustics",
]);
const featuredEntries = entriesFor([
  "snapcn-card-rail",
  "screen-lift",
  "snapcn-moodboard-reveal",
  "snapcn-type-morph",
  "before-after",
  "shader-liquid-metal",
  "snapcn-phone-frame",
  "snapcn-orbit-gallery",
  "shader-smoke-ring",
]);
const installers = {
  npm: "npx hyfrme@latest add screen-lift",
  pnpm: "pnpm dlx hyfrme@latest add screen-lift",
  yarn: "yarn dlx hyfrme@latest add screen-lift",
  bun: "bunx hyfrme@latest add screen-lift",
};

function MotionLink({
  entry,
  autoPlay = false,
  enabled = true,
  className = "",
}: {
  entry: CatalogEntry;
  autoPlay?: boolean;
  enabled?: boolean;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovering, setHovering] = useState(false);
  const [failed, setFailed] = useState(false);
  const root = `/previews/${entry.item.name}`;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || failed) return;
    let visible = false;
    const sync = () => {
      if (!visible || !enabled || document.hidden || (!autoPlay && !hovering)) {
        video.pause();
        return;
      }
      if (!video.getAttribute("src")) video.src = `${root}/hyperframes.mp4`;
      void video.play().catch(() => undefined);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.2 },
    );
    observer.observe(video);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      video.pause();
    };
  }, [root, autoPlay, enabled, hovering, failed]);

  return (
    <a
      href={`/components/${entry.item.name}`}
      className={`rf-motion ${className}`}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
      aria-label={`Open ${entry.item.title}`}
    >
      <div className="rf-motion-picture">
        {failed ? (
          <img src={`${root}/thumbnail.webp`} alt="" loading="lazy" />
        ) : (
          <video
            ref={videoRef}
            poster={`${root}/thumbnail.webp`}
            muted
            playsInline
            loop
            preload="none"
            aria-hidden="true"
            onError={() => setFailed(true)}
          />
        )}
        <span className="rf-open" aria-hidden="true">
          ↗
        </span>
      </div>
      <div className="rf-motion-caption">
        <span>{entry.item.title}</span>
        <span>{entry.source.label}</span>
      </div>
    </a>
  );
}

export function Refined() {
  const [dark, setDark] = useState(false);
  const [playing, setPlaying] = useState(
    () => !matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [category, setCategory] = useState<CatalogCategory>("all");
  const [query, setQuery] = useState("");
  const [installer, setInstaller] = useState<keyof typeof installers>("npm");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const searchRef = useRef<HTMLInputElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const mobileMenu = useRef<HTMLDetailsElement>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const categoryEntries = catalog.filter(
    (entry) => category === "all" || categoryFor(entry) === category,
  );
  const filtered = categoryEntries.filter((entry) =>
    `${entry.item.title} ${entry.item.name} ${entry.item.tags.join(" ")}`
      .toLowerCase()
      .includes(normalizedQuery),
  );
  const displayed =
    category === "all" && !normalizedQuery
      ? featuredEntries
      : filtered.slice(0, 12);

  useEffect(() => {
    document.title = "Hyfrme · Motion components for HyperFrames";
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document
          .getElementById("rf-library")
          ?.scrollIntoView({ behavior: "instant" });
        searchRef.current?.focus({ preventScroll: true });
      }
      if (event.key === "Escape" && mobileMenu.current)
        mobileMenu.current.open = false;
    };
    document.addEventListener("keydown", onKeyDown);
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => setPlaying(!reducedMotion.matches);
    reducedMotion.addEventListener("change", syncMotionPreference);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      reducedMotion.removeEventListener("change", syncMotionPreference);
    };
  }, []);

  const moveGallery = (direction: number) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({
      left: direction * Math.min(rail.clientWidth * 0.65, 650),
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };
  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(installers[installer]);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  };

  return (
    <div className="rf-page" data-theme={dark ? "dark" : "light"}>
      <a className="rf-skip" href="#rf-library">
        Skip to components
      </a>
      <header className="rf-header">
        <a className="rf-brand" href="/" aria-label="Hyfrme home">
          <span className="rf-brand-symbol" aria-hidden="true">
            hf
          </span>
          hyfrme
        </a>
        <nav className="rf-navigation" aria-label="Library navigation">
          {prototypeNavigation.map((item) => (
            <a key={item.label} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="rf-utilities">
          <button
            type="button"
            className="rf-theme"
            aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
            onClick={() => setDark(!dark)}
          >
            <span aria-hidden="true" />
            {dark ? "Light" : "Dark"}
          </button>
          <a
            className="rf-github"
            href="https://github.com/AksharP5/hyfrme"
            target="_blank"
            rel="noreferrer"
          >
            GitHub <span aria-hidden="true">↗</span>
          </a>
          <details ref={mobileMenu} className="rf-mobile-menu">
            <summary>
              Menu <span aria-hidden="true">+</span>
            </summary>
            <nav aria-label="Mobile library navigation">
              {prototypeNavigation.map((item) => (
                <a key={item.label} href={item.href}>
                  {item.label}
                </a>
              ))}
            </nav>
          </details>
        </div>
      </header>

      <main>
        <section className="rf-hero" aria-labelledby="rf-title">
          <h1 id="rf-title">
            Your next video,
            <br />
            already in motion.
          </h1>
          <p>
            Copy-paste motion components for HyperFrames.
            <br className="rf-desktop-break" /> Preview a scene, customize it,
            and keep the source.
          </p>
          <div className="rf-actions">
            <a className="rf-button rf-primary" href="#rf-library">
              Browse components <span aria-hidden="true">→</span>
            </a>
            <a className="rf-button rf-secondary" href="#rf-start">
              Get started <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>

        <section className="rf-gallery" aria-label="Featured motion components">
          <div className="rf-gallery-track" ref={railRef}>
            {heroEntries.map((entry, index) => (
              <MotionLink
                entry={entry}
                autoPlay={index === 1}
                enabled={playing}
                key={entry.item.name}
                className={`rf-hero-tile rf-hero-tile-${index}`}
              />
            ))}
          </div>
          <div className="rf-gallery-bottom rf-container">
            <p>A few things you can make with Hyfrme.</p>
            <div>
              <button
                type="button"
                className="rf-playback"
                onClick={() => setPlaying(!playing)}
                aria-pressed={playing}
              >
                <span
                  className={playing ? "rf-pause" : "rf-play"}
                  aria-hidden="true"
                />
                {playing ? "Pause previews" : "Play previews"}
              </button>
              <span className="rf-control-divider" />
              <button
                type="button"
                className="rf-gallery-arrow"
                onClick={() => moveGallery(-1)}
                aria-label="Previous previews"
              >
                ←
              </button>
              <button
                type="button"
                className="rf-gallery-arrow"
                onClick={() => moveGallery(1)}
                aria-label="Next previews"
              >
                →
              </button>
            </div>
          </div>
        </section>

        <section
          className="rf-library rf-container"
          id="rf-library"
          aria-labelledby="rf-library-title"
        >
          <div className="rf-section-heading">
            <h2 id="rf-library-title">Find your next scene.</h2>
            <p>Start with a finished component. Change everything you need.</p>
          </div>
          <div className="rf-library-tools">
            <div
              className="rf-filters"
              role="group"
              aria-label="Filter components"
            >
              <button
                type="button"
                onClick={() => setCategory("all")}
                aria-pressed={category === "all"}
              >
                Featured <span>{featuredEntries.length}</span>
              </button>
              {prototypeCategories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={category === item.id}
                  onClick={() => setCategory(item.id)}
                >
                  {item.label}
                  <span>{item.count}</span>
                </button>
              ))}
            </div>
            <label className="rf-search">
              <span className="rf-search-icon" aria-hidden="true" />
              <span className="rf-sr-only">Search components</span>
              <input
                ref={searchRef}
                type="search"
                placeholder="Search components…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <kbd>⌘ K</kbd>
            </label>
          </div>
          {normalizedQuery && (
            <p className="rf-results" role="status">
              {filtered.length} {filtered.length === 1 ? "result" : "results"}{" "}
              for “{query.trim()}”
            </p>
          )}
          {displayed.length > 0 ? (
            <div className="rf-grid">
              {displayed.map((entry) => (
                <MotionLink
                  key={entry.item.name}
                  entry={entry}
                  enabled={playing}
                />
              ))}
            </div>
          ) : (
            <div className="rf-empty">
              <h3>No matching components.</h3>
              <p>Try a different name or category.</p>
              <button
                className="rf-button rf-secondary"
                type="button"
                onClick={() => {
                  setCategory("all");
                  setQuery("");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
          <a
            className="rf-all-components"
            href={
              category === "all"
                ? "/components"
                : `/components?category=${category}`
            }
          >
            View all {categoryEntries.length}{" "}
            {category === "all"
              ? "components"
              : categoryLabels[category].toLowerCase()}{" "}
            <span aria-hidden="true">→</span>
          </a>
        </section>

        <section
          className="rf-start rf-container"
          id="rf-start"
          aria-labelledby="rf-start-title"
        >
          <div className="rf-start-copy">
            <h2 id="rf-start-title">
              A good starting point.
              <br />
              The rest is yours.
            </h2>
            <p>
              Every component installs as editable HTML and assets in your
              HyperFrames project.
            </p>
            <ol>
              <li>
                <strong>Find the right shot.</strong>
                <span>Browse the library and preview the motion.</span>
              </li>
              <li>
                <strong>Make it your own.</strong>
                <span>Adjust the supported variables in the browser.</span>
              </li>
              <li>
                <strong>Take it into your project.</strong>
                <span>
                  Install the files, then edit any part of the source.
                </span>
              </li>
            </ol>
          </div>
          <div className="rf-install">
            <div className="rf-install-preview">
              <img
                src="/previews/screen-lift/thumbnail.webp"
                alt="Screen Lift component preview"
                loading="lazy"
              />
              <a href="/components/screen-lift">
                Screen Lift <span>Hyfrme original ↗</span>
              </a>
            </div>
            <div className="rf-install-code">
              <div
                className="rf-install-tabs"
                role="group"
                aria-label="Package manager"
              >
                {(
                  Object.keys(installers) as Array<keyof typeof installers>
                ).map((name) => (
                  <button
                    type="button"
                    key={name}
                    aria-pressed={installer === name}
                    onClick={() => {
                      setInstaller(name);
                      setCopyStatus("idle");
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <div className="rf-command">
                <code>{installers[installer]}</code>
                <button
                  type="button"
                  onClick={() => void copyCommand()}
                  aria-label="Copy install command"
                >
                  {copyStatus === "copied"
                    ? "Copied"
                    : copyStatus === "error"
                      ? "Retry"
                      : "Copy"}
                </button>
              </div>
              <span className="rf-copy-status" aria-live="polite">
                {copyStatus === "copied"
                  ? "Command copied to clipboard."
                  : copyStatus === "error"
                    ? "Could not copy. Select and copy the command above."
                    : "Run in your HyperFrames project."}
              </span>
            </div>
          </div>
        </section>
      </main>

      <footer className="rf-footer rf-container">
        <div>
          <a className="rf-brand" href="/">
            hyfrme
          </a>
          <p>Motion components for HyperFrames.</p>
        </div>
        <nav aria-label="Footer navigation">
          <a href="/showcases">Showcases</a>
          <a
            href="https://github.com/AksharP5/hyfrme"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
          <a
            href="https://github.com/AksharP5/hyfrme/blob/main/THIRD_PARTY_NOTICES.md"
            target="_blank"
            rel="noreferrer"
          >
            Attributions ↗
          </a>
        </nav>
        <p className="rf-credit">
          Hyfrme originals, alongside ports from{" "}
          <a href="https://remocn.dev" target="_blank" rel="noreferrer">
            Remocn
          </a>{" "}
          and{" "}
          <a href="https://snapcn.dev" target="_blank" rel="noreferrer">
            Snapcn
          </a>
          .
        </p>
      </footer>
    </div>
  );
}
