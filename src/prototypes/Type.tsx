import { useState } from "react";
import { Brand, Footer, Navigation, Preview } from "./shared";
import { prototypeTotal } from "./data";
import { catalog } from "../catalog";
import "./type.css";

const scenes = [
  "shader-smoke-ring",
  "shader-liquid-metal",
  "shader-caustics",
].map((slug) => {
  const entry = catalog.find(({ item }) => item.name === slug);
  if (!entry) throw new Error(`Missing prototype component: ${slug}`);
  return {
    slug,
    title: entry.item.title,
    source: entry.source.label,
    href: `/components/${slug}`,
  };
});

export function Type() {
  const [selected, setSelected] = useState(0);
  const scene = scenes[selected];
  return (
    <div className="p2-page type-page">
      <div className="type-wrap">
        <header className="p2-header type-header">
          <Brand />
          <Navigation />
        </header>
        <main>
          <section className="type-poster" aria-labelledby="type-title">
            <div className="type-headline">
              <h1 id="type-title">
                ALL
                <br />
                IN MOTION<span className="type-period">.</span>
              </h1>
              <div className="type-note">
                <p>
                  {prototypeTotal} motion components.
                  <br />
                  Built for HyperFrames.
                  <br />
                  Yours to pull apart.
                </p>
                <a href="/components">
                  Find your next shot <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
            <div className="type-player">
              <div className="type-player-title">
                <span>
                  {scene.title} / {scene.source}
                </span>
                <a href={scene.href}>Get the source ↗</a>
              </div>
              <Preview
                key={scene.slug}
                slug={scene.slug}
                title={scene.title}
                autoPlay
              />
              <div
                className="type-selector"
                role="group"
                aria-label="Choose motion preview"
              >
                {scenes.map((item, index) => (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => setSelected(index)}
                    aria-pressed={selected === index}
                  >
                    <span>0{index + 1}</span>
                    {item.title}
                    <span aria-hidden="true">
                      {selected === index ? "↗" : "+"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
          <section
            className="type-ownership"
            aria-labelledby="type-ownership-title"
          >
            <h2 id="type-ownership-title">
              GOOD BONES.
              <br />
              YOUR FINISH.
            </h2>
            <div>
              <p>
                Start with a working scene. Change the type, timing, colors, and
                content. Every component comes with its source.
              </p>
              <a href="/components?category=primitives">
                Explore the primitives <span aria-hidden="true">↗</span>
              </a>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </div>
  );
}
