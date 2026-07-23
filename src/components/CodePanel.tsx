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

function Source({
  source,
  sourceUrl,
  filename,
  copyLabel = "Copy code",
}: {
  source: string;
  sourceUrl?: string;
  filename: string;
  copyLabel?: string;
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
            {copied === "source" ? "Copied" : copyLabel}
          </button>
          {sourceUrl ? (
            <a href={sourceUrl} target="_blank" rel="noreferrer">
              GitHub ↗
            </a>
          ) : null}
        </div>
      </div>
      <pre className="source-code">
        <code>{source}</code>
      </pre>
    </div>
  );
}

export const CodePanel = { Source };
