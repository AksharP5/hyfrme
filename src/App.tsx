import { Component, lazy, Suspense, useEffect, type ReactNode } from "react";
import { categoryLabels, type CatalogCategory } from "./catalog-categories";
import catalogCategoryCounts from "./generated/catalog-counts.json";
import { FamilySection, type LandingFamily } from "./components/FamilySection";
import { LandingHero } from "./components/LandingHero";
import { NotFoundPage } from "./components/NotFoundPage";
import { ShowcaseDetailPage, ShowcasesPage } from "./components/Showcases";
import { showcases } from "./showcases";
import { decodeSlug } from "./lib/routes";

const CatalogPages = lazy(() =>
  import("./CatalogPages").then((module) => ({ default: module.CatalogPages })),
);
const githubUrl = "https://github.com/AksharP5/hyfrme";
const cliPackage = "hyfrme@latest";
const installAllCommand = `npx ${cliPackage} add --all`;
const categoryOrder = (Object.keys(categoryLabels) as CatalogCategory[]).filter(
  (category) => category !== "all",
);

class CatalogBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="empty-state" role="alert">
        <h1>Components couldn't load</h1>
        <button type="button" onClick={() => window.location.reload()}>
          Reload
        </button>
      </section>
    );
  }
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
      previewVideo: "/previews/matrix-decode/hyperframes.mp4",
      previewPoster: "/previews/matrix-decode/thumbnail.webp",
      previewAlt: "Matrix Decode motion component",
    },
    {
      title: "UI primitives",
      description:
        "Buttons, inputs, dialogs, and product UI animated on the frame.",
      href: "/components?category=primitives",
      countLabel: `${catalogCategoryCounts.primitives} blocks`,
      previewVideo: "/previews/button/hyperframes.mp4",
      previewPoster: "/previews/button/thumbnail.webp",
      previewAlt: "Animated button primitive",
      presentation: "primitive",
    },
    {
      title: "Shaders",
      description:
        "Procedural backgrounds, distortions, wipes, and GPU-driven texture.",
      href: "/components?category=shaders",
      countLabel: `${catalogCategoryCounts.shaders} blocks`,
      previewVideo: "/previews/shader-swirl/hyperframes.mp4",
      previewPoster: "/previews/shader-swirl/thumbnail.webp",
      previewAlt: "Procedural swirl shader",
    },
    {
      title: "Animated icons",
      description:
        "Familiar Lucide shapes re-authored as deterministic motion.",
      href: "/components?category=icons",
      countLabel: `${catalogCategoryCounts.icons} blocks`,
      previewVideo: "/previews/icon-sparkles/hyperframes.mp4",
      previewPoster: "/previews/icon-sparkles/thumbnail.webp",
      previewAlt: "Animated sparkles icon",
      presentation: "icon",
    },
    {
      title: "Templates",
      description:
        "Complete official HyperFrames projects, ready to edit and render.",
      href: "/components?category=templates&source=hyperframes",
      countLabel: `${catalogCategoryCounts.templates} templates`,
      previewVideo: "/previews/hyperframes-swiss-grid/hyperframes.mp4",
      previewPoster: "/previews/hyperframes-swiss-grid/thumbnail.webp",
      previewAlt: "Official Swiss Grid template",
    },
    {
      title: "Showcases",
      description:
        "Finished films showing how the building blocks compose into stories.",
      href: "/showcases",
      countLabel: `${showcases.length} films`,
      previewVideo: showcases[0]?.previewUrl ?? "",
      previewPoster: showcases[0]?.posterUrl ?? "",
      previewAlt: showcases[0]?.title ?? "Hyfrme showcase",
      presentation: "showcase",
    },
  ];

  return (
    <>
      <LandingHero installCommand={installAllCommand} />
      <FamilySection families={families} />
    </>
  );
}

function Footer() {
  return (
    <footer>
      <a className="footer-brand" href="/" aria-label="Hyfrme home">
        Hyfrme
      </a>
      <p>Open-source motion blocks for HyperFrames.</p>
      <nav className="footer-links" aria-label="Footer navigation">
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
      </nav>
    </footer>
  );
}

export function App() {
  const showcaseMatch = window.location.pathname.match(
    /^\/showcases\/([^/]+)\/?$/,
  );
  const showcaseSlug = showcaseMatch ? decodeSlug(showcaseMatch[1]) : null;
  const showcase = showcaseSlug
    ? showcases.find((candidate) => candidate.slug === showcaseSlug)
    : null;
  const isShowcasesIndex = /^\/showcases\/?$/.test(window.location.pathname);
  const isShowcasePath = window.location.pathname.startsWith("/showcases/");
  const isCatalogPath = /^\/components(?:\/|$)/.test(window.location.pathname);
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
        ) : isCatalogPath ? (
          <CatalogBoundary>
            <Suspense
              fallback={
                <div className="preview-loading" role="status">
                  Loading components…
                </div>
              }
            >
              <CatalogPages cliPackage={cliPackage} />
            </Suspense>
          </CatalogBoundary>
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
