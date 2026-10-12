import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./round-two.css";
import "./picker.css";
import { Refined } from "./Refined";
import { Cut } from "./Cut";
import { Reel } from "./Reel";
import { Index } from "./Index";
import { Type } from "./Type";
import { Lens } from "./Lens";

const variants = [
  { name: "Cut", Component: Cut },
  { name: "Reel", Component: Reel },
  { name: "Index", Component: Index },
  { name: "Type", Component: Type },
  { name: "Lens", Component: Lens },
] as const;

function initialVariant() {
  const requested = Number(
    new URLSearchParams(window.location.search).get("v"),
  );
  return Number.isInteger(requested) &&
    requested >= 1 &&
    requested <= variants.length
    ? requested - 1
    : 0;
}

function PrototypePicker() {
  const [active, setActive] = useState(initialVariant);
  const [revision, setRevision] = useState(0);
  const pickerRef = useRef<HTMLElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const select = (index: number) => {
    if (index < 0 || index >= variants.length) return;
    setActive(index);
    setRevision((current) => current + 1);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  useLayoutEffect(() => {
    const picker = pickerRef.current;
    const highlight = highlightRef.current;
    const item = itemRefs.current[active];
    if (!picker || !highlight || !item) return;

    const moveHighlight = () => {
      highlight.style.width = `${item.offsetWidth}px`;
      highlight.style.transform = `translateX(${item.offsetLeft}px)`;
    };
    moveHighlight();
    window.addEventListener("resize", moveHighlight);
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() =>
        picker.setAttribute("data-ready", ""),
      );
    });
    return () => {
      window.removeEventListener("resize", moveHighlight);
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [active]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("v", String(active + 1));
    window.history.replaceState(null, "", url);
  }, [active]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.matches("input, textarea, select") || target.isContentEditable)
      )
        return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const number = Number.parseInt(event.key, 10);
      if (number >= 1 && number <= variants.length) select(number - 1);
      else if (event.key === "ArrowRight")
        select((active + 1) % variants.length);
      else if (event.key === "ArrowLeft")
        select((active - 1 + variants.length) % variants.length);
      else if (event.key === "r" || event.key === "R")
        setRevision((current) => current + 1);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active]);

  const Variant = variants[active].Component;

  return (
    <>
      <div id="stage" key={`${active}-${revision}`}>
        <Variant />
      </div>
      <nav
        className="proto-picker"
        aria-label="Prototype variants"
        ref={pickerRef}
      >
        <span
          className="proto-picker-highlight"
          aria-hidden="true"
          ref={highlightRef}
        />
        {variants.map((variant, index) => (
          <button
            className="proto-picker-item"
            data-active={active === index ? "" : undefined}
            aria-current={active === index ? "true" : undefined}
            onClick={() => select(index)}
            ref={(item) => {
              itemRefs.current[index] = item;
            }}
            key={variant.name}
          >
            {variant.name}
          </button>
        ))}
        <span className="proto-picker-divider" aria-hidden="true" />
        <button
          className="proto-picker-item proto-picker-replay"
          aria-label="Replay animation (R)"
          onClick={() => setRevision((current) => current + 1)}
        >
          ↻
        </button>
      </nav>
    </>
  );
}

const previousRound =
  new URLSearchParams(window.location.search).get("round") === "2";
createRoot(document.getElementById("root")!).render(
  previousRound ? <PrototypePicker /> : <Refined />,
);
