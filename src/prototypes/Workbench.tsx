import { useState } from "react";
import {
  prototypeCategories,
  prototypeComponents,
  prototypeNavigation,
  prototypeTotal,
} from "./data";

const workbenchItems = [
  prototypeComponents[0],
  prototypeComponents[2],
  prototypeComponents[1],
  prototypeComponents[4],
];

export function Workbench() {
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(false);
  const component = workbenchItems[selected];

  return (
    <div className="proto-page workbench">
      <header className="workbench-header">
        <a className="workbench-wordmark" href="/" aria-label="Hyfrme home">
          <span>hf</span> hyfrme
        </a>
        <span className="workbench-header-note">THE OPEN MOTION WORKSPACE</span>
        <nav aria-label="Library navigation">
          {prototypeNavigation.map((item) => (
            <a href={item.href} key={item.label}>
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <main className="workbench-layout">
        <aside className="workbench-sidebar">
          <div>
            <span className="workbench-index">
              LIBRARY / {prototypeTotal} BLOCKS
            </span>
            <h1>Find your next frame.</h1>
            <p>
              Browse real motion, inspect the result, then take the source into
              HyperFrames.
            </p>
          </div>
          <nav aria-label="Browse categories">
            {prototypeCategories.map((category, index) => (
              <a href={category.href} key={category.id}>
                <span>0{index + 1}</span>
                <strong>{category.label}</strong>
                <span>{category.count}</span>
              </a>
            ))}
          </nav>
          <a className="workbench-all" href="/components">
            Open full library <span aria-hidden="true">↗</span>
          </a>
        </aside>

        <section
          className="workbench-stage"
          aria-label="Selected component preview"
        >
          <div className="workbench-toolbar">
            <span>PREVIEW / {String(selected + 1).padStart(2, "0")}</span>
            <span>
              {component.source.toUpperCase()} / {component.kind.toUpperCase()}
            </span>
          </div>
          <div className="workbench-screen">
            {playing ? (
              <video
                src={component.video}
                poster={component.poster}
                muted
                autoPlay
                loop
                playsInline
                aria-hidden="true"
              />
            ) : (
              <img src={component.poster} alt="" aria-hidden="true" />
            )}
            <button
              className="workbench-play"
              type="button"
              aria-pressed={playing}
              onClick={() => setPlaying((current) => !current)}
            >
              {playing ? "Show still" : "Play preview"}
            </button>
          </div>
          <div className="workbench-details">
            <div>
              <span>SELECTED BLOCK</span>
              <h2>{component.title}</h2>
              <p>{component.summary}</p>
            </div>
            <a href={component.href}>
              Open component <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="workbench-select-heading">
            <span>SWITCH PREVIEW</span>
            <span>CHOOSE A BLOCK BELOW</span>
          </div>
          <div
            className="workbench-selector"
            role="group"
            aria-label="Preview a component"
          >
            {workbenchItems.map((item, index) => (
              <button
                type="button"
                aria-pressed={selected === index}
                onClick={() => {
                  setSelected(index);
                  setPlaying(false);
                }}
                key={item.slug}
              >
                <img src={item.poster} alt="" />
                <span>
                  <small>
                    0{index + 1} / {item.kind}
                  </small>
                  <strong>{item.title}</strong>
                </span>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
