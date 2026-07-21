import { useState } from "react";

type CodePanelProps = {
  source: string;
  installCommand: string;
  sourceUrl: string;
  filename: string;
  fileCount: number;
};

type CopiedValue = "source" | "install" | null;

export function CodePanel({
  source,
  installCommand,
  sourceUrl,
  filename,
  fileCount,
}: CodePanelProps) {
  const [copied, setCopied] = useState<CopiedValue>(null);

  const copy = async (value: string, kind: Exclude<CopiedValue, null>) => {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1600);
  };

  return (
    <div className="code-stack">
      <div className="install-card">
        <div>
          <span className="section-kicker">Install manually</span>
          <p>
            {fileCount === 1 ? "One standalone file" : `${fileCount} files`}, no
            registry switching. Run from a HyperFrames project.
          </p>
        </div>
        <button type="button" onClick={() => copy(installCommand, "install")}>
          {copied === "install" ? "Copied" : "Copy command"}
        </button>
        <pre>
          <code>{installCommand}</code>
        </pre>
      </div>

      <details className="source-panel">
        <summary>
          <span>
            <span className="source-dot" aria-hidden="true" />
            {filename}
          </span>
          <span>View source</span>
        </summary>
        <div className="source-actions">
          <button type="button" onClick={() => copy(source, "source")}>
            {copied === "source" ? "Copied" : "Copy source"}
          </button>
          <a href={sourceUrl} target="_blank" rel="noreferrer">
            Open on GitHub ↗
          </a>
        </div>
        <pre className="source-code">
          <code>{source}</code>
        </pre>
      </details>
    </div>
  );
}
