import { useState } from "react";
import { prototypeComponents, prototypeTotal } from "./data";
import { Brand, Navigation, Preview } from "./shared";
import "./lens.css";

const reel = [
  prototypeComponents[0],
  prototypeComponents[1],
  prototypeComponents[2],
  prototypeComponents[4],
];

export function Lens() {
  const [selected, setSelected] = useState(reel[1].slug);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const component = reel.find((item) => item.slug === selected) ?? reel[1];
  const command = `npx hyfrme@latest add ${component.slug}`;
  const select = (slug: typeof selected) => {
    setSelected(slug);
    setCopyStatus("idle");
  };
  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  };

  return (
    <div className="p2-page lens-page">
      <div className="lens-shell">
        <header className="lens-header">
          <Brand className="lens-brand" />
          <Navigation className="lens-navigation" />
        </header>

        <main>
          <section className="lens-intro" aria-labelledby="lens-title">
            <h1 id="lens-title">
              Choose your
              <br />
              next scene.
            </h1>
            <div className="lens-intro-side">
              <p>
                Motion components for HyperFrames. Preview, customize, and
                install the HTML.
              </p>
              <a href="/components" className="lens-library-link">
                Explore {prototypeTotal} components
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </section>

          <section
            className="lens-gallery"
            aria-label="Explore component previews"
          >
            {reel.map((item) => {
              const active = item.slug === selected;
              return (
                <article
                  key={item.slug}
                  className={`lens-panel${active ? " is-selected" : ""}`}
                >
                  <div className="lens-panel-media">
                    {active ? (
                      <Preview
                        slug={item.slug}
                        title={item.title}
                        className="lens-preview"
                        autoPlay
                      />
                    ) : (
                      <button
                        className="lens-poster-button"
                        type="button"
                        aria-label={`Preview ${item.title}`}
                        onClick={() => select(item.slug)}
                      >
                        <img src={item.poster} alt="" />
                      </button>
                    )}
                  </div>
                  <button
                    className="lens-panel-label"
                    type="button"
                    aria-pressed={active}
                    onClick={() => select(item.slug)}
                  >
                    <span className="lens-panel-title">{item.title}</span>
                    <span className="lens-panel-indicator" aria-hidden="true">
                      {active ? "−" : "+"}
                    </span>
                  </button>
                </article>
              );
            })}
          </section>

          <div className="lens-selection" aria-live="polite">
            <p>
              <span>{component.source}</span>
              <span>{component.duration}s preview</span>
            </p>
            <a href={component.href}>
              Customize {component.title} <span aria-hidden="true">↗</span>
            </a>
          </div>

          <section className="lens-source" aria-labelledby="lens-source-title">
            <div>
              <h2 id="lens-source-title">The source is yours.</h2>
              <p>Install the HTML. Edit it in your project.</p>
            </div>
            <div className="lens-install">
              <button
                type="button"
                className="lens-command"
                onClick={copyCommand}
                aria-label={`Copy install command for ${component.title}`}
              >
                <code>{command}</code>
                <span aria-live="polite">
                  {copyStatus === "copied"
                    ? "Copied"
                    : copyStatus === "error"
                      ? "Retry copy"
                      : "Copy"}
                </span>
              </button>
              {copyStatus === "error" && (
                <p className="lens-copy-error" role="status">
                  Copy failed. Select the command to copy it manually.
                </p>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
