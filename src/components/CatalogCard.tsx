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
  const category = categoryFor(entry);
  const isIcon = category === "icons";
  const previewRoot = `/previews/${entry.item.name}`;

  return (
    <a
      className={`catalog-card${isIcon ? " is-icon" : ""}`}
      href={`/components/${entry.item.name}`}
      data-component-slug={entry.item.name}
      data-previewing={previewing ? "true" : "false"}
      onPointerEnter={() => setPreviewing(true)}
      onPointerLeave={() => setPreviewing(false)}
      onFocus={() => setPreviewing(true)}
      onBlur={() => setPreviewing(false)}
      aria-label={`Open ${entry.item.title}`}
    >
      <span className="catalog-card-preview">
        {previewing ? (
          <video
            src={`${previewRoot}/hyperframes.mp4`}
            poster={`${previewRoot}/thumbnail.png`}
            muted
            autoPlay
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          />
        ) : (
          <img src={`${previewRoot}/thumbnail.png`} alt="" loading="lazy" />
        )}
      </span>
      <span className="catalog-card-copy">
        <span>{catalogDescriptor(entry)}</span>
        <strong>{entry.item.title}</strong>
        <small>{cardDescription(entry)}</small>
      </span>
    </a>
  );
}
