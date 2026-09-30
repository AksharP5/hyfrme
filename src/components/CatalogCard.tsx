import { useState } from "react";
import {
  type CatalogEntry,
  cardDescription,
  catalogDescriptor,
  categoryFor,
} from "../catalog";

type CatalogCardProps = {
  entry: CatalogEntry;
};

export function CatalogCard({ entry }: CatalogCardProps) {
  const [previewing, setPreviewing] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const category = categoryFor(entry);
  const isIcon = category === "icons";
  const { poster, video } = entry.item.preview;

  return (
    <a
      className={`catalog-card${isIcon ? " is-icon" : ""}`}
      href={`/components/${entry.item.name}`}
      data-component-slug={entry.item.name}
      data-source={entry.source.id}
      data-previewing={previewing ? "true" : "false"}
      onPointerEnter={() => setPreviewing(true)}
      onPointerLeave={() => setPreviewing(false)}
      onFocus={() => setPreviewing(true)}
      onBlur={() => setPreviewing(false)}
      aria-label={`Open ${entry.item.title}`}
    >
      <span className="catalog-card-preview">
        {previewing && video && !videoFailed ? (
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
        ) : poster && !posterFailed ? (
          <img
            src={poster}
            alt=""
            loading="lazy"
            onError={() => setPosterFailed(true)}
          />
        ) : (
          <span className="source-preview">
            <span aria-hidden="true">&lt;/&gt;</span>
            <strong>{entry.item.title}</strong>
            <small>
              {entry.item.type === "hyperframes:component"
                ? "HTML snippet"
                : "HTML composition"}
            </small>
          </span>
        )}
      </span>
      <span className="catalog-card-copy">
        <span className="catalog-card-meta">
          <span>{catalogDescriptor(entry)}</span>
          <span className="source-badge">{entry.source.label}</span>
        </span>
        <strong>{entry.item.title}</strong>
        <small>{cardDescription(entry)}</small>
      </span>
    </a>
  );
}
