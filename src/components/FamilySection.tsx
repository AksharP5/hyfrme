import { FamilyCard, type LandingFamily } from "./FamilyCard";

export type { LandingFamily } from "./FamilyCard";

type FamilySectionProps = {
  families: LandingFamily[];
};

export function FamilySection({ families }: FamilySectionProps) {
  return (
    <section className="family-section" aria-labelledby="families-title">
      <header className="family-heading">
        <span className="section-kicker">Browse by category</span>
        <h2 id="families-title">Start with the motion you need.</h2>
        <p>
          Each path opens a focused catalog with live previews and installable
          source for your HyperFrames timeline.
        </p>
      </header>

      <div className="family-grid">
        {families.map((family) => (
          <FamilyCard family={family} key={family.title} />
        ))}
      </div>
    </section>
  );
}
