import { useEffect, useRef } from "react";

export function PreviewVideo({ src, poster }: { src: string; poster: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const syncPlayback = () => {
      if (!visible || reducedMotion.matches) {
        video.pause();
        return;
      }
      if (video.getAttribute("src") !== src) video.src = src;
      void video.play().catch(() => undefined);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting && entry.intersectionRatio >= 0.35;
        syncPlayback();
      },
      { threshold: [0, 0.35] },
    );
    observer.observe(video);
    reducedMotion.addEventListener("change", syncPlayback);
    return () => {
      observer.disconnect();
      reducedMotion.removeEventListener("change", syncPlayback);
      video.pause();
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
    />
  );
}
