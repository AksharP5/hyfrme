export type LandingFamily = {
  title: string;
  description: string;
  href: string;
  countLabel: string;
  preview: string;
  previewAlt: string;
  presentation?: "icon" | "showcase";
};

type FamilySectionProps = {
  families: LandingFamily[];
};

export function FamilySection({ families }: FamilySectionProps) {
  return (
    <section className="family-section" aria-labelledby="families-title">
      <header className="family-heading">
        <span className="section-kicker">What&apos;s inside</span>
        <h2 id="families-title">Five families. One timeline.</h2>
        <p>
          Start with the kind of motion you need, then customize and install
          only the source you want.
        </p>
      </header>

      <div className="family-grid">
        {families.map((family) => (
          <a
            className={`family-card${
              family.presentation ? ` is-${family.presentation}` : ""
            }`}
            href={family.href}
            key={family.title}
            aria-label={`Explore ${family.title}`}
          >
            <span className="family-card-preview">
              <img
                src={family.preview}
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
        ))}
      </div>
    </section>
  );
}
