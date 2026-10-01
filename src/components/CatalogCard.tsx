import { useState } from "react";
import {
  type CatalogEntry,
  cardDescription,
  catalogDescriptor,
  categoryFor,
} from "../catalog";
import { CatalogArtwork } from "./CatalogArtwork";

type CatalogCardProps = {
  entry: CatalogEntry;
};

export function CatalogCard({ entry }: CatalogCardProps) {
  const [previewing, setPreviewing] = useState(false);
  const category = categoryFor(entry);
  const isIcon = category === "icons";

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
        <CatalogArtwork entry={entry} previewing={previewing} />
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
