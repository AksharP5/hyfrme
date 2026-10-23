import { PreviewVideo } from "./PreviewVideo";

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
  return (
    <a
      className={`family-card${
        family.presentation ? ` is-${family.presentation}` : ""
      }`}
      href={family.href}
      aria-label={`Explore ${family.title}`}
    >
      <span className="family-card-preview">
        <PreviewVideo src={family.previewVideo} poster={family.previewPoster} />
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
