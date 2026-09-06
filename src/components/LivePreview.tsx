import { mediaUrl } from "../media";
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

type HtmlInCanvasElement = HTMLCanvasElement & {
  captureElementImage?: unknown;
  requestPaint?: unknown;
};

type HtmlInCanvasContext = CanvasRenderingContext2D & {
  drawElementImage?: unknown;
};

function supportsHtmlInCanvas() {
  const canvas = document.createElement("canvas") as HtmlInCanvasElement;
  const context = canvas.getContext("2d") as HtmlInCanvasContext | null;

  return (
    typeof context?.drawElementImage === "function" &&
    typeof canvas.requestPaint === "function" &&
    typeof canvas.captureElementImage === "function" &&
    "transferControlToOffscreen" in HTMLCanvasElement.prototype
  );
}

export function LivePreview({ item, source, values }: LivePreviewProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [htmlInCanvasSupported] = useState(supportsHtmlInCanvas);
  const isIcon = item.tags.includes("icon");
  const usesRenderedPreview =
    item.tags.includes("html-in-canvas") && !htmlInCanvasSupported;
  const document = useMemo(
    () =>
      usesRenderedPreview
        ? ""
        : buildPreviewDocument(source, item, values, isIcon),
    [isIcon, item, source, usesRenderedPreview, values],
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
    if (usesRenderedPreview) {
      const video = videoRef.current;
      if (!video) return;
      if (video.paused) void video.play().catch(() => setPaused(true));
      else video.pause();
      return;
    }

    const currentTimeline = timeline();
    if (!currentTimeline) return;
    if (paused) currentTimeline.play();
    else currentTimeline.pause();
    setPaused((current) => !current);
  };

  const replay = () => {
    if (usesRenderedPreview) {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = 0;
      void video.play().catch(() => setPaused(true));
      return;
    }

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
      {usesRenderedPreview ? (
        <video
          ref={videoRef}
          src={mediaUrl(`/previews/${item.name}/hyperframes.mp4`)}
          poster={`/previews/${item.name}/thumbnail.png`}
          muted
          autoPlay
          loop
          playsInline
          preload="auto"
          aria-label={`${item.title} rendered preview`}
          onLoadedData={(event) => setPaused(event.currentTarget.paused)}
          onPlay={() => setPaused(false)}
          onPause={() => setPaused(true)}
        />
      ) : (
        <iframe
          ref={frameRef}
          title={`${item.title} customized preview`}
          srcDoc={document}
          sandbox="allow-scripts allow-same-origin"
          onLoad={() => setPaused(false)}
        />
      )}
      <span className="live-indicator">
        <span aria-hidden="true" />
        {usesRenderedPreview ? "Rendered preview" : "Live preview"}
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
