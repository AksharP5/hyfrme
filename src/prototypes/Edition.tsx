import {
  prototypeCategories,
  prototypeComponents,
  prototypeNavigation,
  prototypeTotal,
} from "./data";

const [moodboard, , beforeAfter, cardRail] = prototypeComponents;

export function Edition() {
  return (
    <div className="proto-page edition">
      <header className="edition-header">
        <a className="edition-wordmark" href="/" aria-label="Hyfrme home">
          hyfrme<span>.</span>
        </a>
        <nav className="edition-navigation" aria-label="Library navigation">
          {prototypeNavigation.map((item) => (
            <a href={item.href} key={item.label}>
              {item.label}
            </a>
          ))}
        </nav>
        <a className="edition-header-link" href="/components">
          The library <span aria-hidden="true">↗</span>
        </a>
      </header>

      <main>
        <section className="edition-opening">
          <div className="edition-opening-label">
            <span>HF / 001</span>
            <span>AN OPEN MOTION LIBRARY</span>
          </div>
          <h1>
            Motion you can
            <br />
            make your own<span>.</span>
          </h1>
          <div className="edition-opening-bottom">
            <p>
              Choose a block. Shape the details. Take the HTML and assets into
              your HyperFrames project.
            </p>
            <a href="/components">
              Explore {prototypeTotal} blocks <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>

        <section
          className="edition-feature"
          aria-labelledby="edition-feature-title"
        >
          <div className="edition-section-line">
            <span>01 / SELECTED MOTION</span>
            <span>TAKE THE SOURCE, KEEP THE CONTROL</span>
          </div>
          <div className="edition-feature-grid">
            <a className="edition-feature-media" href={moodboard.href}>
              <img src={moodboard.poster} alt="" aria-hidden="true" />
              <span>VIEW BLOCK ↗</span>
            </a>
            <div className="edition-feature-copy">
              <span className="edition-overline">
                FEATURED / {moodboard.source}
              </span>
              <h2 id="edition-feature-title">{moodboard.title}</h2>
              <p>{moodboard.summary}</p>
              <a className="edition-feature-action" href={moodboard.href}>
                Open the component <span aria-hidden="true">↗</span>
              </a>
              <div className="edition-more">
                <a href={beforeAfter.href}>
                  <span>02</span>
                  <strong>{beforeAfter.title}</strong>
                  <span aria-hidden="true">↗</span>
                </a>
                <a href={cardRail.href}>
                  <span>03</span>
                  <strong>{cardRail.title}</strong>
                  <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section
          className="edition-categories"
          aria-labelledby="edition-categories-title"
        >
          <div className="edition-section-line">
            <span>02 / FIND YOUR STARTING POINT</span>
            <span>THE WHOLE LIBRARY, OPEN TO YOU</span>
          </div>
          <h2 id="edition-categories-title">Browse by medium.</h2>
          <div className="edition-category-list">
            {prototypeCategories.map((category, index) => (
              <a href={category.href} key={category.id}>
                <span>0{index + 1}</span>
                <strong>{category.label}</strong>
                <small>{category.count} blocks</small>
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </section>
      </main>
      <footer className="edition-footer">
        <span>HYFRME / OPEN SOURCE MOTION</span>
        <a href="/showcases">See it in motion ↗</a>
      </footer>
    </div>
  );
}
