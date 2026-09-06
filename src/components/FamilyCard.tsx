import { mediaUrl } from "../media";
import { useEffect, useRef } from "react";

export type LandingFamily = {
  title: string;
  description: string;
  href: string;
  countLabel: string;
  previewVideo: string;
  previewPoster: string;
  previewAlt: string;
  presentation?: "icon" | "primitive" | "showcase";
};

type FamilyCardProps = {
  family: LandingFamily;
};

export function FamilyCard({ family }: FamilyCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const src = mediaUrl(family.previewVideo);
    let visible = false;

    const syncPlayback = () => {
      if (visible && !reducedMotion.matches) {
        if (video.getAttribute("src") !== src) video.src = src;
        void video.play().catch(() => undefined);
      } else {
        video.pause();
      }
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
  }, [family.previewVideo]);

  return (
    <a
      className={`family-card${
        family.presentation ? ` is-${family.presentation}` : ""
      }`}
      href={family.href}
      aria-label={`Explore ${family.title}`}
    >
      <span className="family-card-preview">
        <video
          ref={videoRef}
          poster={family.previewPoster}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
        />
        <img
          src={family.previewPoster}
          alt={family.previewAlt}
          loading="lazy"
        />
      </span>
      <span className="family-card-copy">
        <span>
          <small>{family.countLabel}</small>
          <strong>{family.title}</strong>
          <span aria-hidden="true">↗</span>
        </span>
        <p>{family.description}</p>
      </span>
    </a>
  );
}
