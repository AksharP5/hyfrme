import { type ReactNode, useEffect, useRef, useState } from "react";

type CopyButtonProps = {
  value: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  onCopied?: () => void;
  children?: ReactNode;
  showIcon?: boolean;
};

export function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  className,
  onCopied,
  children,
  showIcon = true,
}: CopyButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const copied = status === "copied";
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const handleCopy = async () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      setStatus("failed");
      return;
    }
    setStatus("copied");
    onCopied?.();
    timer.current = window.setTimeout(() => setStatus("idle"), 1600);
  };

  return (
    <button
      className={className}
      type="button"
      onClick={handleCopy}
      aria-live="polite"
      data-copied={copied ? "true" : "false"}
    >
      {status === "failed" ? (
        <span role="alert">Copy failed. Try again.</span>
      ) : children ? (
        <>
          {children}
          <span className="sr-only" aria-live="polite">
            {copied ? copiedLabel : label}
          </span>
        </>
      ) : (
        <>
          {showIcon ? (
            <span aria-hidden="true">{copied ? "✓" : "⧉"}</span>
          ) : null}
          {copied ? copiedLabel : label}
        </>
      )}
    </button>
  );
}
