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

      <section className="showcase-meta" aria-label="Showcase details">
        <div className="showcase-meta-primary">
          <span className="section-kicker">The build</span>
          <h2>Remocn composition. HyperFrames clock.</h2>
          <p>
            This port preserves the original 1280 × 720 staging, 30 fps
            timeline, scene order, transitions, typography, and shader treatment
            while handing frame ownership to HyperFrames.
          </p>
          <div className="showcase-actions">
            <a href={showcase.sourceUrl} target="_blank" rel="noreferrer">
              HyperFrames source <ArrowIcon />
            </a>
            <a href={showcase.originUrl} target="_blank" rel="noreferrer">
              Pinned Remocn source <ArrowIcon />
            </a>
          </div>
        </div>

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
          <div>
            <dt>Frames</dt>
            <dd>{showcase.durationInFrames.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Parity</dt>
            <dd>
              {showcase.meanSsim === null
                ? "Pending render"
                : `${(showcase.meanSsim * 100).toFixed(3)}% SSIM`}
            </dd>
          </div>
        </dl>
      </section>

      <section className="showcase-components">
        <span className="section-kicker">Remocn building blocks</span>
        <div>
          {showcase.components.map((component) => (
            <a href={`/components/${component}`} key={component}>
              {component}
            </a>
          ))}
        </div>
      </section>
    </article>
  );
}
