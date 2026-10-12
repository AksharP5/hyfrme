import { useState } from "react";
import { Brand, Footer, Navigation, Preview } from "./shared";
import { prototypeComponents, prototypeCategories } from "./data";
import "./reel.css";

const scenes = [
  prototypeComponents[1],
  prototypeComponents[0],
  prototypeComponents[2],
  prototypeComponents[3],
];

export function Reel() {
  const [selected, setSelected] = useState(0);
  const scene = scenes[selected];

  return (
    <div className="p2-page reel-page">
      <div className="reel-wrap">
        <header className="p2-header reel-header">
          <Brand />
          <Navigation />
          <a
            className="reel-github"
            href="https://github.com/AksharP5/hyfrme"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
        </header>
        <main>
          <section className="reel-room" aria-labelledby="reel-title">
            <div className="reel-intro">
              <h1 id="reel-title">
                Your next
                <br />
                opening shot.
              </h1>
              <p>
                Motion for HyperFrames.
                <br />
                Preview a scene, then take
                <br className="reel-desktop-break" /> it into your project.
              </p>
              <a href="/components" className="reel-library">
                Explore the library <span aria-hidden="true">↗</span>
              </a>
              <div className="reel-current">
                <span>In the frame</span>
                <strong>{scene.title}</strong>
                <span>
                  {scene.source} · {scene.duration}s
                </span>
              </div>
            </div>
            <div className="reel-projection">
              <div className="reel-screen">
                <Preview
                  key={scene.slug}
                  slug={scene.slug}
                  title={scene.title}
                  autoPlay
                />
              </div>
              <div className="reel-transport">
                <span>
                  0{selected + 1} <span className="reel-count">/ 04</span>
                </span>
                <a href={scene.href}>
                  Use {scene.title} <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
            <div
              className="reel-contact"
              role="group"
              aria-label="Choose a scene"
            >
              {scenes.map((item, index) => (
                <button
                  key={item.slug}
                  type="button"
                  aria-pressed={selected === index}
                  onClick={() => setSelected(index)}
                >
                  <div className="reel-thumb">
                    <img src={item.poster} alt="" />
                    <span aria-hidden="true">0{index + 1}</span>
                  </div>
                  <span className="reel-thumb-title">{item.title}</span>
                </button>
              ))}
            </div>
          </section>
          <section
            className="reel-directory"
            aria-labelledby="reel-directory-title"
          >
            <h2 id="reel-directory-title">The rest of the picture.</h2>
            <div>
              {prototypeCategories.map((category) => (
                <a key={category.id} href={category.href}>
                  <span>
                    {category.label}
                    <sup>{category.count}</sup>
                  </span>
                  <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </div>
  );
}
