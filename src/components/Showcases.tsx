import { useEffect, useRef } from "react";
import type { Showcase } from "../showcases";
import { showcases } from "../showcases";

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

function formatDuration(seconds: number) {
  const rounded = Math.round(seconds);
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`;
}

function ShowcaseCard({ showcase }: { showcase: Showcase }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const play = () => {
    void videoRef.current?.play();
  };

  const pause = () => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    videoRef.current.currentTime = 0;
  };

  return (
    <article
      className="showcase-card"
      onMouseEnter={play}
      onMouseLeave={pause}
      onFocus={play}
      onBlur={pause}
    >
      <a
        className="showcase-card-media"
        href={`/showcases/${showcase.slug}`}
        aria-label={`Watch ${showcase.title}`}
      >
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="metadata"
          poster={showcase.posterUrl}
          src={showcase.previewUrl}
        />
        <span className="showcase-play" aria-hidden="true">
          ▶
        </span>
        <span className="showcase-duration">
          {formatDuration(showcase.duration)}
        </span>
      </a>
      <div className="showcase-card-copy">
        <div>
          <a href={`/showcases/${showcase.slug}`}>{showcase.title}</a>
          <p>{showcase.description}</p>
        </div>
        <span>
          by{" "}
          <a href={showcase.author.url} target="_blank" rel="noreferrer">
            @{showcase.author.name}
          </a>
        </span>
      </div>
    </article>
  );
}

export function ShowcasesPage() {
  useEffect(() => {
    document.title = "Showcases — Hyfrme";
  }, []);

  return (
    <section className="showcases-page">
      <header className="showcases-hero">
        <span className="section-kicker">Made with HyperFrames</span>
        <h1>Showcases</h1>
        <p>
          Six Remocn films, translated frame-for-frame to HyperFrames. The
          timing is deterministic, the rendered source lives here, and no
          Remotion runtime ships with it.
        </p>
      </header>
      <div className="showcase-grid">
        {showcases.map((showcase) => (
          <ShowcaseCard showcase={showcase} key={showcase.slug} />
        ))}
      </div>
    </section>
  );
}

export function ShowcaseDetailPage({ showcase }: { showcase: Showcase }) {
  useEffect(() => {
    document.title = `${showcase.title} — Hyfrme`;
  }, [showcase]);

  return (
    <article className="showcase-detail">
      <a className="showcase-back" href="/showcases">
        <span aria-hidden="true">←</span> All showcases
      </a>

      <header className="showcase-detail-header">
        <div>
          <span className="section-kicker">Made with HyperFrames</span>
          <h1>{showcase.title}</h1>
        </div>
        <p>{showcase.description}</p>
      </header>

      <div className="showcase-player">
        <video
          controls
          playsInline
          preload="metadata"
          poster={showcase.posterUrl}
          src={showcase.previewUrl}
        />
      </div>

      <section className="showcase-info" aria-label="Showcase information">
        <dl>
          <div>
            <dt>Creator</dt>
            <dd>
              <a href={showcase.author.url} target="_blank" rel="noreferrer">
                @{showcase.author.name}
              </a>
            </dd>
          </div>
          <div>
            <dt>Runtime</dt>
            <dd>{formatDuration(showcase.duration)}</dd>
          </div>
        </dl>

        <nav className="showcase-source-links" aria-label="Showcase source">
          <a href={showcase.sourceUrl} target="_blank" rel="noreferrer">
            View HyperFrames source <ArrowIcon />
          </a>
          <a href={showcase.originUrl} target="_blank" rel="noreferrer">
            View original Remocn source <ArrowIcon />
          </a>
        </nav>
      </section>
    </article>
  );
}
