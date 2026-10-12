import { useEffect, useRef, useState } from "react";
import { prototypeNavigation } from "./data";

export function Brand({ className = "" }: { className?: string }) {
  return (
    <a className={`p2-wordmark ${className}`} href="/" aria-label="Hyfrme home">
      hyfrme
    </a>
  );
}

export function Navigation({ className = "" }: { className?: string }) {
  return (
    <nav className={`p2-nav ${className}`} aria-label="Library navigation">
      {prototypeNavigation.map((item) => (
        <a key={item.label} href={item.href}>
          {item.label}
        </a>
      ))}
    </nav>
  );
}

export function Preview({
  slug,
  title,
  className = "",
  autoPlay = false,
}: {
  slug: string;
  title: string;
  className?: string;
  autoPlay?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const manual = useRef<boolean | null>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let disposed = false;
    const sync = () => {
      const requested = manual.current ?? (autoPlay && !reduced.matches);
      if (!visible || !requested || document.hidden) {
        video.pause();
        return;
      }
      if (!video.getAttribute("src"))
        video.src = `/previews/${slug}/hyperframes.mp4`;
      void video.play().catch(() => {
        if (!disposed) setPlaying(false);
      });
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.15 },
    );
    observer.observe(video);
    reduced.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      disposed = true;
      observer.disconnect();
      reduced.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      video.pause();
    };
  }, [slug, autoPlay]);

  const toggle = () => {
    const video = ref.current;
    if (!video) return;
    manual.current = video.paused;
    if (!video.paused) {
      video.pause();
      return;
    }
    if (!video.getAttribute("src"))
      video.src = `/previews/${slug}/hyperframes.mp4`;
    void video.play().catch(() => setFailed(true));
  };

  return (
    <div className={`p2-preview ${className}`}>
      <video
        ref={ref}
        poster={`/previews/${slug}/thumbnail.webp`}
        muted
        loop
        playsInline
        preload="none"
        aria-label={`${title} motion preview`}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setFailed(true)}
      />
      {failed ? (
        <a className="p2-play" href={`/components/${slug}`}>
          Open preview ↗
        </a>
      ) : (
        <button
          type="button"
          className="p2-play"
          onClick={toggle}
          aria-label={`${playing ? "Pause" : "Play"} ${title}`}
          aria-pressed={playing}
        >
          <span
            className={playing ? "p2-pause-symbol" : "p2-play-symbol"}
            aria-hidden="true"
          />
          {playing ? "Pause" : "Play"}
        </button>
      )}
    </div>
  );
}

export function Footer({ className = "" }: { className?: string }) {
  return (
    <footer className={`p2-footer ${className}`}>
      <Brand />
      <span>Motion for HyperFrames. Source included.</span>
      <a
        href="https://github.com/AksharP5/hyfrme"
        target="_blank"
        rel="noreferrer"
      >
        GitHub ↗
      </a>
    </footer>
  );
}
