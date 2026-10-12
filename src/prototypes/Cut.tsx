import { Brand, Footer, Navigation, Preview } from "./shared";
import { prototypeComponents, prototypeTotal } from "./data";
import "./cut.css";

const [moodboard, screen, , , swirl] = prototypeComponents;

export function Cut() {
  return (
    <div className="p2-page cut-page">
      <div className="cut-wrap">
        <header className="p2-header cut-header">
          <Brand />
          <Navigation />
        </header>
        <main>
          <section className="cut-hero" aria-labelledby="cut-title">
            <div className="cut-copy">
              <h1 id="cut-title">
                Make it
                <br />
                <span>move.</span>
              </h1>
              <p>
                Motion components for HyperFrames.
                <br />
                Find your shot. Make the source yours.
              </p>
              <a className="cut-cta" href="/components">
                Explore {prototypeTotal} components{" "}
                <span aria-hidden="true">↗</span>
              </a>
            </div>
            <figure className="cut-feature">
              <Preview slug={moodboard.slug} title={moodboard.title} />
              <figcaption>
                <a href={moodboard.href}>
                  {moodboard.title} <span aria-hidden="true">↗</span>
                </a>
                <span>{moodboard.source}</span>
              </figcaption>
            </figure>
          </section>

          <section
            className="cut-collection"
            aria-labelledby="cut-collection-title"
          >
            <a className="cut-screen" href={screen.href}>
              <img
                src={screen.poster}
                alt="Screen Lift, a phone screen with messages suspended in depth"
                loading="lazy"
              />
              <span className="cut-caption">
                <strong>{screen.title}</strong>
                <span>Hyfrme original ↗</span>
              </span>
            </a>
            <div className="cut-collection-copy">
              <h2 id="cut-collection-title">
                A little motion.
                <br />A different feeling.
              </h2>
              <p>
                Scenes, shaders, and the small details that make a frame worth
                watching. Ready to edit in your own project.
              </p>
              <a className="cut-shader" href={swirl.href}>
                <img
                  src={swirl.poster}
                  alt="Swirl shader, an abstract spiral in muted violet"
                  loading="lazy"
                />
                <span>
                  {swirl.title} <span aria-hidden="true">↗</span>
                </span>
              </a>
            </div>
          </section>
          <section className="cut-source">
            <h2>Take the whole thing.</h2>
            <p>The HTML. The assets. The freedom to change it.</p>
            <a href="/components?category=components">
              Find a component <span aria-hidden="true">↗</span>
            </a>
          </section>
        </main>
        <Footer />
      </div>
    </div>
  );
}
