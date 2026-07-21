import { CodePanel } from "./components/CodePanel";
import { ComparisonPlayer } from "./components/ComparisonPlayer";
import parity from "../parity/soft-blur-in.json";
import registryItem from "../registry/blocks/soft-blur-in/registry-item.json";
import sourceCode from "../registry/blocks/soft-blur-in/soft-blur-in.html?raw";

const githubUrl = "https://github.com/AksharP5/hyfrme";
const blockUrl = `${githubUrl}/blob/main/registry/blocks/soft-blur-in/soft-blur-in.html`;
const upstreamUrl = `https://github.com/Remocn/remocn/blob/${parity.origin.commit}/${parity.origin.source}`;
const rawBase =
  "https://raw.githubusercontent.com/AksharP5/hyfrme/main/registry/blocks/soft-blur-in";
const installCommand = `mkdir -p compositions assets/fonts
curl -fsSL ${rawBase}/soft-blur-in.html -o compositions/soft-blur-in.html
curl -fsSL ${rawBase}/Geist-SemiBold.woff2 -o assets/fonts/Geist-SemiBold.woff2`;

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

export function App() {
  return (
    <div className="page-shell">
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Hyfrme home">
          <span className="wordmark-glyph" aria-hidden="true">
            hf
          </span>
          hyfrme
        </a>
        <nav aria-label="Main navigation">
          <a href="#catalog">Catalog</a>
          <a href="#compare">Compare</a>
          <a href="#method">Method</a>
        </nav>
        <a
          className="github-link"
          href={githubUrl}
          target="_blank"
          rel="noreferrer"
        >
          GitHub <ArrowIcon />
        </a>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span>Open source</span>
              <span>Port lab 001</span>
            </div>
            <h1>
              Frames should survive the <em>framework.</em>
            </h1>
            <p className="hero-lede">
              Hyfrme rebuilds Remocn motion components as native HyperFrames
              blocks—and publishes the visual proof beside every port.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#compare">
                Inspect the first port <span aria-hidden="true">↓</span>
              </a>
              <a
                className="button button-secondary"
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
              >
                Read the source <ArrowIcon />
              </a>
            </div>
          </div>
          <div className="hero-proof" aria-label="First port fidelity summary">
            <div className="proof-heading">
              <span>soft-blur-in</span>
              <span className="verified-badge">verified</span>
            </div>
            <video
              src="/previews/soft-blur-in/hyperframes.mp4"
              muted
              autoPlay
              loop
              playsInline
              aria-label="Soft Blur In verified HyperFrames render"
            />
            <div className="proof-metrics">
              <div>
                <span>Mean SSIM</span>
                <strong>{parity.result.meanSsim.toFixed(6)}</strong>
              </div>
              <div>
                <span>Frames tested</span>
                <strong>{parity.result.frameCount}</strong>
              </div>
              <div>
                <span>Worst frame</span>
                <strong>{parity.result.minSsim.toFixed(6)}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="ticker" aria-label="Project principles">
          <span>Source-visible</span>
          <span aria-hidden="true">◆</span>
          <span>Frame-measured</span>
          <span aria-hidden="true">◆</span>
          <span>HyperFrames-native</span>
          <span aria-hidden="true">◆</span>
          <span>MIT licensed</span>
        </section>

        <section className="catalog-section" id="catalog">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Catalog / 001</span>
              <h2>Available blocks</h2>
            </div>
            <p>
              Nothing enters the catalog until the HyperFrames render passes a
              pinned, frame-by-frame comparison.
            </p>
          </div>

          <a className="catalog-row" href="#compare">
            <div className="catalog-index">01</div>
            <div className="catalog-preview">
              <video
                src="/previews/soft-blur-in/hyperframes.mp4"
                muted
                autoPlay
                loop
                playsInline
                aria-label="Soft Blur In HyperFrames preview"
              />
            </div>
            <div className="catalog-name">
              <span>Typography / entrance</span>
              <h3>{registryItem.title}</h3>
            </div>
            <div className="catalog-score">
              <span>Parity</span>
              <strong>{(parity.result.meanSsim * 100).toFixed(3)}%</strong>
            </div>
            <div className="catalog-arrow" aria-hidden="true">
              →
            </div>
          </a>

          <div className="queue-row">
            <span>Next on the bench</span>
            <div>
              <span>number-wheel</span>
              <span>terminal-simulator</span>
              <span>focus-pull</span>
            </div>
          </div>
        </section>

        <section className="compare-section" id="compare">
          <div className="component-heading">
            <div>
              <span className="section-kicker">Port / 001</span>
              <h2>{registryItem.title}</h2>
            </div>
            <div className="component-tags">
              {registryItem.tags.slice(0, 3).map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>

          <ComparisonPlayer
            referenceSrc="/previews/soft-blur-in/remocn.mp4"
            portSrc="/previews/soft-blur-in/hyperframes.mp4"
          />

          <div className="port-details">
            <div className="port-description">
              <span className="section-kicker">What was preserved</span>
              <h3>Same motion. Native timeline.</h3>
              <p>
                Per-character timing, blur, vertical travel, typography, and the
                source cubic Bézier are rebuilt in a seek-safe GSAP timeline.
                The canonical 1280×720 fixture differs by less than two tenths
                of one percent on average across all 60 frames.
              </p>
              <a href={upstreamUrl} target="_blank" rel="noreferrer">
                Inspect the pinned Remocn source <ArrowIcon />
              </a>
            </div>
            <dl className="spec-list">
              <div>
                <dt>Classification</dt>
                <dd>Mechanical port</dd>
              </div>
              <div>
                <dt>Canvas</dt>
                <dd>1280 × 720</dd>
              </div>
              <div>
                <dt>Runtime</dt>
                <dd>2.00s / 30 fps</dd>
              </div>
              <div>
                <dt>Gate</dt>
                <dd>0.95 mean SSIM</dd>
              </div>
              <div>
                <dt>Result</dt>
                <dd className="pass-value">
                  Pass / {parity.result.meanSsim.toFixed(6)}
                </dd>
              </div>
            </dl>
          </div>

          <CodePanel
            source={sourceCode}
            installCommand={installCommand}
            sourceUrl={blockUrl}
          />
        </section>

        <section className="method-section" id="method">
          <div className="section-heading method-heading">
            <div>
              <span className="section-kicker">The fidelity contract</span>
              <h2>Proof, not “looks close.”</h2>
            </div>
            <p>
              Every port carries its source commit, fixture, implementation
              class, rendered artifacts, and pass/fail measurement in the repo.
            </p>
          </div>
          <ol className="method-grid">
            <li>
              <span>01</span>
              <h3>Pin</h3>
              <p>
                Freeze the upstream commit, props, font, canvas, fps, and
                duration.
              </p>
            </li>
            <li>
              <span>02</span>
              <h3>Translate</h3>
              <p>
                Map the source timing to deterministic HyperFrames and GSAP
                primitives.
              </p>
            </li>
            <li>
              <span>03</span>
              <h3>Render</h3>
              <p>
                Produce both videos from the same fixture and color pipeline.
              </p>
            </li>
            <li>
              <span>04</span>
              <h3>Measure</h3>
              <p>
                Compare every frame, publish the score, and document any gap.
              </p>
            </li>
          </ol>
        </section>
      </main>

      <footer>
        <a className="wordmark footer-wordmark" href="#top">
          hyfrme
        </a>
        <p>
          An independent MIT-licensed project. Remocn and HyperFrames remain
          their respective projects.
        </p>
        <div>
          <a href={githubUrl} target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
          <a
            href={`${githubUrl}/blob/main/THIRD_PARTY_NOTICES.md`}
            target="_blank"
            rel="noreferrer"
          >
            Attributions ↗
          </a>
        </div>
      </footer>
    </div>
  );
}
