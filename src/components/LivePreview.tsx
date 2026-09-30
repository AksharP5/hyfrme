import { useEffect, useMemo, useRef, useState } from "react";
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

type PreviewWindow = Window & {
  __timelines?: Record<string, PreviewTimeline>;
  __hyfrmeSyncPreviewMedia?: () => void;
};

function supportsHtmlInCanvas() {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  return Boolean(
    context &&
    "drawElementImage" in context &&
    typeof context.drawElementImage === "function" &&
    "requestPaint" in canvas &&
    typeof canvas.requestPaint === "function" &&
    "captureElementImage" in canvas &&
    typeof canvas.captureElementImage === "function" &&
    "transferControlToOffscreen" in canvas,
  );
}

export function LivePreview({ item, source, values }: LivePreviewProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const isIcon =
    item.type !== "hyperframes:component" && item.tags.includes("icon");
  const nativeViewport = item.tags.includes("app-ui");
  const rendered = useMemo(
    () => item.tags.includes("html-in-canvas") && !supportsHtmlInCanvas(),
    [item],
  );
  const document = useMemo(
    () =>
      rendered
        ? ""
        : buildPreviewDocument(source, item, values, isIcon, nativeViewport),
    [isIcon, item, source, values, rendered, nativeViewport],
  );

  useEffect(() => {
    if (!nativeViewport || !containerRef.current) return;
    const element = containerRef.current;
    const observer = new ResizeObserver(() => {
      setViewportSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [nativeViewport]);

  const viewportScale = nativeViewport
    ? Math.min(
        viewportSize.width / (item.dimensions?.width ?? 1920),
        viewportSize.height / (item.dimensions?.height ?? 1080),
      )
    : 1;

  useEffect(() => {
    setError(null);
    const receiveError = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (
        event.data?.type === "hyfrme-preview-error" &&
        typeof event.data.message === "string"
      ) {
        setError(event.data.message);
        if (event.data.paused === true) setPaused(true);
      }
    };
    window.addEventListener("message", receiveError);
    return () => window.removeEventListener("message", receiveError);
  }, [document, item.name]);

  const previewWindow = () =>
    frameRef.current?.contentWindow as PreviewWindow | null;
  const timeline = () => previewWindow()?.__timelines?.[item.compositionId];

  const togglePlayback = () => {
    if (videoRef.current) {
      setError(null);
      if (videoRef.current.paused) {
        void videoRef.current
          .play()
          .catch((error: Error) => setError(error.message));
      } else videoRef.current.pause();
      return;
    }
    const currentTimeline = timeline();
    const animations = previewWindow()?.document.getAnimations() ?? [];
    if (!currentTimeline && animations.length === 0) return;
    setError(null);
    if (paused) {
      currentTimeline?.play();
      animations.forEach((animation) => animation.play());
    } else {
      currentTimeline?.pause();
      animations.forEach((animation) => animation.pause());
    }
    previewWindow()?.__hyfrmeSyncPreviewMedia?.();
    setPaused((current) => !current);
  };

  const replay = () => {
    if (videoRef.current) {
      setError(null);
      videoRef.current.currentTime = 0;
      void videoRef.current
        .play()
        .catch((error: Error) => setError(error.message));
      return;
    }
    const currentTimeline = timeline();
    const animations = previewWindow()?.document.getAnimations() ?? [];
    if (!currentTimeline && animations.length === 0) return;
    setError(null);
    currentTimeline?.restart();
    animations.forEach((animation) => {
      animation.currentTime = 0;
      animation.play();
    });
    previewWindow()?.__hyfrmeSyncPreviewMedia?.();
    setPaused(false);
  };

  const enterFullscreen = () => {
    void containerRef.current?.requestFullscreen();
  };

  return (
    <div
      ref={containerRef}
      className={`live-preview${isIcon ? " is-icon" : ""}${nativeViewport ? " is-app-ui" : ""}`}
      data-component-slug={item.name}
    >
      {rendered ? (
        <video
          ref={videoRef}
          aria-label={`${item.title} rendered preview with default settings`}
          src={item.preview.video ?? undefined}
          poster={item.preview.poster ?? undefined}
          autoPlay
          loop
          muted
          playsInline
          onPlay={() => setPaused(false)}
          onPause={() => setPaused(true)}
          onError={() => setError("Unable to load rendered preview.")}
        />
      ) : (
        <iframe
          ref={frameRef}
          title={`${item.title} customized preview`}
          srcDoc={document}
          sandbox="allow-scripts allow-same-origin"
          style={
            nativeViewport
              ? {
                  position: "absolute",
                  width: item.dimensions?.width ?? 1920,
                  height: item.dimensions?.height ?? 1080,
                  transformOrigin: "top left",
                  transform: `translate(${(viewportSize.width - (item.dimensions?.width ?? 1920) * viewportScale) / 2}px, ${(viewportSize.height - (item.dimensions?.height ?? 1080) * viewportScale) / 2}px) scale(${viewportScale})`,
                }
              : undefined
          }
          onLoad={() => setPaused(false)}
        />
      )}
      <span className="live-indicator">
        <span aria-hidden="true" />{" "}
        {rendered ? "Rendered preview" : "Live preview"}
      </span>
      {rendered && !error ? (
        <p className="preview-notice">
          This browser cannot preview this effect live. Showing default
          settings.
        </p>
      ) : null}
      {error ? (
        <div className="preview-error" role="alert">
          {error}
        </div>
      ) : null}
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
