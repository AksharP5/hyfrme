import { useEffect, useRef, useState } from "react";

type CopiedValue = "command" | "source" | null;

function useCopy() {
  const [copied, setCopied] = useState<CopiedValue>(null);
  const resetTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    },
    [],
  );

  const copy = async (value: string, kind: Exclude<CopiedValue, null>) => {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setCopied(null), 1600);
  };

  return { copied, copy };
}

function Install({ command }: { command: string }) {
  const { copied, copy } = useCopy();

  return (
    <aside className="install-card">
      <span className="section-kicker">Install</span>
      <h2>Add to HyperFrames</h2>
      <p>Run this inside your HyperFrames project.</p>
      <div className="command-row">
        <code>{command}</code>
        <button type="button" onClick={() => copy(command, "command")}>
          {copied === "command" ? "Copied" : "Copy"}
        </button>
      </div>
      <small>The component is copied into your project, so you own it.</small>
    </aside>
  );
}

function Source({
  source,
  sourceUrl,
  filename,
}: {
  source: string;
  sourceUrl: string;
  filename: string;
}) {
  const { copied, copy } = useCopy();

  return (
    <div className="source-panel">
      <div className="source-toolbar">
        <span>
          <span className="source-dot" aria-hidden="true" />
          {filename}
        </span>
        <div>
          <button type="button" onClick={() => copy(source, "source")}>
            {copied === "source" ? "Copied" : "Copy source"}
          </button>
          <a href={sourceUrl} target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
        </div>
      </div>
      <pre className="source-code">
        <code>{source}</code>
      </pre>
    </div>
  );
}

export const CodePanel = { Install, Source };
