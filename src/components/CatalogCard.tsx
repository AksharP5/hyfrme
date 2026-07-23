import { useState } from "react";
import {
  type CatalogEntry,
  cardDescription,
  categoryDescription,
  categoryFor,
} from "../catalog";
import { buildInstallCommand } from "../lib/customization";
import { CopyButton } from "./CopyButton";

type CatalogCardProps = {
  entry: CatalogEntry;
  cliUrl: string;
};

export function CatalogCard({ entry, cliUrl }: CatalogCardProps) {
  const [previewing, setPreviewing] = useState(false);
  const category = categoryFor(entry);
  const isIcon = category === "icons";
  const previewRoot = `/previews/${entry.item.name}`;
  const componentUrl = `/components/${entry.item.name}`;
  const installCommand = buildInstallCommand(cliUrl, entry.item.name, [], {});

  const preview = (
    <>
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
      <span className="preview-hint">
        {isIcon ? "Click to copy" : "Hover to play"}
      </span>
    </>
  );

  return (
    <article
      className={`catalog-card${isIcon ? " is-icon" : ""}`}
      data-component-slug={entry.item.name}
      data-previewing={previewing ? "true" : "false"}
      onPointerEnter={() => setPreviewing(true)}
      onPointerLeave={() => setPreviewing(false)}
      onFocus={() => setPreviewing(true)}
      onBlur={() => setPreviewing(false)}
    >
      {isIcon ? (
        <CopyButton
          className="catalog-card-preview preview-copy-button"
          value={installCommand}
          label={`Copy ${entry.item.title} install command`}
          copiedLabel="Command copied"
        >
          {preview}
        </CopyButton>
      ) : (
        <a
          className="catalog-card-preview"
          href={componentUrl}
          aria-label={`Customize ${entry.item.title}`}
        >
          {preview}
        </a>
      )}

      <div className="catalog-card-copy">
        <span>{categoryDescription(category)}</span>
        <a href={componentUrl}>{entry.item.title}</a>
        <p>{cardDescription(entry)}</p>
        <div className="card-actions">
          <CopyButton
            className="card-copy-button"
            value={installCommand}
            label="Copy install"
          />
          <a href={componentUrl}>
            Customize <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </article>
  );
}
