import { useState } from "react";
import {
  prototypeComponents,
  prototypeNavigation,
  prototypeTotal,
} from "./data";

const [moodboard, screenLift, beforeAfter, cardRail] = prototypeComponents;
const reel = [moodboard, beforeAfter, cardRail];

export function Cinema() {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="proto-page cinema">
      <section className="cinema-stage" aria-labelledby="cinema-title">
        {playing ? (
          <video
            className="cinema-stage-media"
            src={screenLift.video}
            poster={screenLift.poster}
            muted
            autoPlay
            loop
            playsInline
            aria-hidden="true"
          />
        ) : (
          <img
            className="cinema-stage-media"
            src={screenLift.poster}
            alt=""
            aria-hidden="true"
          />
        )}
        <div className="cinema-stage-shade" aria-hidden="true" />
        <header className="cinema-header">
          <a className="cinema-wordmark" href="/" aria-label="Hyfrme home">
            hyfrme
          </a>
          <nav aria-label="Library navigation">
            {prototypeNavigation.map((item) => (
              <a href={item.href} key={item.label}>
                {item.label}
              </a>
            ))}
          </nav>
          <a className="cinema-header-link" href="/components">
            Explore library ↗
          </a>
        </header>
        <div className="cinema-stage-copy">
          <span className="cinema-eyeline">
            THE OPEN MOTION LIBRARY / {prototypeTotal} BLOCKS
          </span>
          <h1 id="cinema-title">
            Give the frame
            <br />a feeling.
          </h1>
          <p>
            Motion with a point of view. Preview it, tune it, and make the
            source yours.
          </p>
          <div className="cinema-actions">
            <a className="cinema-primary" href="/components">
              Explore the library <span aria-hidden="true">↗</span>
            </a>
            <a className="cinema-secondary" href={screenLift.href}>
              View this block <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
        <div className="cinema-stage-caption">
          <span>NOW PLAYING / 01</span>
          <strong>{screenLift.title}</strong>
          <span>{screenLift.kind}</span>
        </div>
        <button
          className="cinema-play"
          type="button"
          aria-pressed={playing}
          onClick={() => setPlaying((current) => !current)}
        >
          {playing ? "Show still" : "Play motion"}
        </button>
      </section>

      <main>
        <section className="cinema-reel" aria-labelledby="cinema-reel-title">
          <div className="cinema-reel-heading">
            <div>
              <span>CURATED FROM THE LIBRARY</span>
              <h2 id="cinema-reel-title">A few ways in.</h2>
            </div>
            <a href="/components">See all blocks ↗</a>
          </div>
          <div className="cinema-reel-grid">
            {reel.map((component, index) => (
              <a href={component.href} key={component.slug}>
                <img src={component.poster} alt="" loading="lazy" />
                <div>
                  <span>
                    0{index + 1} / {component.kind}
                  </span>
                  <strong>{component.title}</strong>
                  <span aria-hidden="true">↗</span>
                </div>
              </a>
            ))}
          </div>
        </section>
        <section className="cinema-closing">
          <p>From first frame to final render, the source stays with you.</p>
          <a href="/components">Find your next scene ↗</a>
        </section>
      </main>
    </div>
  );
}
