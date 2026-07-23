import { type ReactNode, useEffect, useRef, useState } from "react";

type CopyButtonProps = {
  value: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  onCopied?: () => void;
  children?: ReactNode;
};

export function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  className,
  onCopied,
  children,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    onCopied?.();
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      className={className}
      type="button"
      onClick={handleCopy}
      aria-live="polite"
      data-copied={copied ? "true" : "false"}
    >
      {children ? (
        <>
          {children}
          <span className="sr-only" aria-live="polite">
            {copied ? copiedLabel : label}
          </span>
        </>
      ) : (
        <>
          <span aria-hidden="true">{copied ? "✓" : "⧉"}</span>
          {copied ? copiedLabel : label}
        </>
      )}
    </button>
  );
}
