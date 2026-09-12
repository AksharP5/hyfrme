import { CopyButton } from "./CopyButton";

type LandingHeroProps = {
  installCommand: string;
};

const featuredComponents = [
  {
    name: "chat-to-preview-layout",
    title: "Chat to Preview Layout",
    label: "UI choreography",
  },
  {
    name: "matrix-decode",
    title: "Matrix Decode",
    label: "Typography",
  },
  {
    name: "icon-sparkles",
    title: "Sparkles",
    label: "Animated icons",
  },
] as const;

export function LandingHero({ installCommand }: LandingHeroProps) {
  return (
    <section className="landing-hero" aria-labelledby="landing-title">
      <div className="landing-hero-copy">
        <h1 id="landing-title">
          Cinematic motion,
          <br />
          ready to own.
        </h1>
        <p>
          Browse production-ready animations, customize them live, and install
          the source directly into your HyperFrames project.
        </p>
        <div className="landing-actions">
          <a
            className="landing-primary-action"
            href="/components?category=components"
          >
            Browse components <span aria-hidden="true">→</span>
          </a>
          <CopyButton
            className="landing-install-command"
            value={installCommand}
            label="Copy command to install all components"
            copiedLabel="Install-all command copied"
          >
            <span className="landing-install-label">
              <span className="copy-default">Install all</span>
              <span className="copy-success">Copied</span>
            </span>
            <code>{installCommand}</code>
            <span className="landing-copy-icon copy-default" aria-hidden="true">
              ⧉
            </span>
            <span className="landing-copy-icon copy-success" aria-hidden="true">
              ✓
            </span>
          </CopyButton>
        </div>
        <div className="landing-proof" aria-label="Hyfrme benefits">
          <span>Customize before install</span>
          <span>Source and assets included</span>
          <span>Visual parity tested</span>
        </div>
      </div>

      <div className="landing-preview-grid" aria-label="Featured components">
        {featuredComponents.map((component) => (
          <a
            className="landing-preview-card"
            href={`/components/${component.name}`}
            key={component.name}
            aria-label={`Open ${component.title}`}
          >
            <video
              src={`/previews/${component.name}/hyperframes.mp4`}
              poster={`/previews/${component.name}/thumbnail.png`}
              muted
              autoPlay
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
            />
            <span>
              <small>{component.label}</small>
              <strong>{component.title}</strong>
              <span aria-hidden="true">↗</span>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
