import { useMemo, useRef, useState } from "react";
import type { RegistryItem } from "../catalog";
import { buildPreviewDocument, type CustomValues } from "../lib/customization";

type LivePreviewProps = {
  item: RegistryItem;
  source: string;
  values: CustomValues;
};

type PreviewTimeline = {
  pause: () => void;
  play: () => void;
  restart: () => void;
};

export function LivePreview({ item, source, values }: LivePreviewProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const isIcon = item.tags.includes("icon");
  const document = useMemo(
    () => buildPreviewDocument(source, item, values, isIcon),
    [isIcon, item, source, values],
  );

  const timeline = () => {
    const previewWindow = frameRef.current?.contentWindow as
      | (Window & {
          __timelines?: Record<string, PreviewTimeline>;
        })
      | null;
    return previewWindow?.__timelines?.[item.name];
  };

  const togglePlayback = () => {
    const currentTimeline = timeline();
    if (!currentTimeline) return;
    if (paused) currentTimeline.play();
    else currentTimeline.pause();
    setPaused((current) => !current);
  };

  const replay = () => {
    timeline()?.restart();
    setPaused(false);
  };

  const enterFullscreen = () => {
    void containerRef.current?.requestFullscreen();
  };

  return (
    <div
      ref={containerRef}
      className={`live-preview${isIcon ? " is-icon" : ""}`}
    >
      <iframe
        ref={frameRef}
        title={`${item.title} customized preview`}
        srcDoc={document}
        sandbox="allow-scripts allow-same-origin"
        onLoad={() => setPaused(false)}
      />
      <span className="live-indicator">
        <span aria-hidden="true" /> Live preview
      </span>
      <div className="preview-controls">
        <button type="button" onClick={togglePlayback}>
          <span aria-hidden="true">{paused ? "▶" : "Ⅱ"}</span>
          {paused ? "Play" : "Pause"}
        </button>
        <button type="button" onClick={replay}>
          <span aria-hidden="true">↺</span>
          Replay
        </button>
        <button type="button" onClick={enterFullscreen}>
          <span aria-hidden="true">⛶</span>
          Fullscreen
        </button>
      </div>
    </div>
  );
}
