import { CopyButton } from "./CopyButton";

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
  return (
    <div className="source-panel">
      <div className="source-toolbar">
        <span>
          <span className="source-dot" aria-hidden="true" />
          {filename}
        </span>
        <div>
          <CopyButton value={source} label={copyLabel} showIcon={false} />
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
