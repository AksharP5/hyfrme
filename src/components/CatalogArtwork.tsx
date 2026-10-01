import { useState } from "react";
import type { CatalogEntry } from "../catalog";

export function CatalogArtwork({
  entry,
  previewing = false,
}: {
  entry: CatalogEntry;
  previewing?: boolean;
}) {
  const [posterFailed, setPosterFailed] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const { poster, video } = entry.item.preview;

  if (previewing && video && !videoFailed) {
    return (
      <video
        src={video}
        poster={posterFailed ? undefined : (poster ?? undefined)}
        onError={() => setVideoFailed(true)}
        muted
        autoPlay
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      />
    );
  }

  if (poster && !posterFailed) {
    return (
      <img
        src={poster}
        alt=""
        loading="lazy"
        onError={() => setPosterFailed(true)}
      />
    );
  }

  return (
    <span className="source-preview">
      <span aria-hidden="true">&lt;/&gt;</span>
      <strong>{entry.item.title}</strong>
      <small>
        {entry.item.type === "hyperframes:component"
          ? "HTML snippet"
          : "HTML composition"}
      </small>
    </span>
  );
}
