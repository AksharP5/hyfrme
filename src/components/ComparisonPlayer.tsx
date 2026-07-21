import { useEffect, useRef, useState } from "react";

type ViewMode = "side-by-side" | "wipe";

type ComparisonPlayerProps = {
  referenceSrc: string;
  portSrc: string;
  square?: boolean;
};

const formatTime = (seconds: number) => `${seconds.toFixed(2)}s`;

export function ComparisonPlayer({
  referenceSrc,
  portSrc,
  square = false,
}: ComparisonPlayerProps) {
  const referenceRef = useRef<HTMLVideoElement>(null);
  const portRef = useRef<HTMLVideoElement>(null);
  const syncFrameRef = useRef<number | null>(null);
  const [view, setView] = useState<ViewMode>("side-by-side");
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(2);
  const [currentTime, setCurrentTime] = useState(0);
  const [wipe, setWipe] = useState(50);

  const setBothTimes = (time: number) => {
    const boundedTime = Math.min(Math.max(time, 0), duration);
    if (referenceRef.current) referenceRef.current.currentTime = boundedTime;
    if (portRef.current) portRef.current.currentTime = boundedTime;
    setCurrentTime(boundedTime);
  };

  const waitForPlayable = (video: HTMLVideoElement) => {
    if (video.readyState >= 3) return Promise.resolve();
    return new Promise<void>((resolve) => {
      video.addEventListener("canplay", () => resolve(), { once: true });
    });
  };

  const seekVideo = (video: HTMLVideoElement, time: number) => {
    if (Math.abs(video.currentTime - time) < 0.002) return Promise.resolve();
    return new Promise<void>((resolve) => {
      video.addEventListener("seeked", () => resolve(), { once: true });
      video.currentTime = time;
    });
  };

  const stopSyncLoop = () => {
    if (syncFrameRef.current === null) return;
    cancelAnimationFrame(syncFrameRef.current);
    syncFrameRef.current = null;
  };

  const syncPlayback = () => {
    const reference = referenceRef.current;
    const port = portRef.current;
    if (!reference || !port || port.paused) {
      syncFrameRef.current = null;
      return;
    }

    const drift = reference.currentTime - port.currentTime;
    if (Math.abs(drift) < 0.004) {
      reference.playbackRate = 1;
    } else {
      reference.playbackRate = Math.min(1.5, Math.max(0.5, 1 - drift * 8));
    }
    syncFrameRef.current = requestAnimationFrame(syncPlayback);
  };

  const pauseBoth = () => {
    stopSyncLoop();
    referenceRef.current?.pause();
    if (referenceRef.current) referenceRef.current.playbackRate = 1;
    portRef.current?.pause();
    setPlaying(false);
  };

  const changeView = (nextView: ViewMode) => {
    pauseBoth();
    setView(nextView);
  };

  const togglePlayback = async () => {
    const reference = referenceRef.current;
    const port = portRef.current;
    if (!reference || !port) return;

    if (playing) {
      pauseBoth();
      return;
    }

    const targetTime = currentTime >= duration - 0.02 ? 0 : currentTime;

    try {
      await Promise.all([waitForPlayable(reference), waitForPlayable(port)]);
      await Promise.all([
        seekVideo(reference, targetTime),
        seekVideo(port, targetTime),
      ]);
      setCurrentTime(targetTime);
      await Promise.all([reference.play(), port.play()]);
      setPlaying(true);
      stopSyncLoop();
      syncFrameRef.current = requestAnimationFrame(syncPlayback);
    } catch {
      pauseBoth();
    }
  };

  const handlePortTimeUpdate = () => {
    const reference = referenceRef.current;
    const port = portRef.current;
    if (!reference || !port) return;

    setCurrentTime(port.currentTime);
  };

  useEffect(
    () => () => {
      if (syncFrameRef.current !== null) {
        cancelAnimationFrame(syncFrameRef.current);
      }
    },
    [],
  );

  const handleLoadedMetadata = () => {
    const referenceDuration = referenceRef.current?.duration;
    const portDuration = portRef.current?.duration;
    const finiteDurations = [referenceDuration, portDuration].filter(
      (value): value is number => Number.isFinite(value),
    );

    if (finiteDurations.length > 0) {
      setDuration(Math.min(...finiteDurations));
    }
  };

  const video = (
    kind: "reference" | "port",
    className?: string,
    style?: React.CSSProperties,
  ) => (
    <video
      ref={kind === "reference" ? referenceRef : portRef}
      className={className}
      style={style}
      src={kind === "reference" ? referenceSrc : portSrc}
      muted
      playsInline
      preload="auto"
      onLoadedMetadata={handleLoadedMetadata}
      onTimeUpdate={kind === "port" ? handlePortTimeUpdate : undefined}
      onEnded={kind === "port" ? pauseBoth : undefined}
      aria-label={
        kind === "reference"
          ? "Remocn reference render"
          : "HyperFrames port render"
      }
    />
  );

  return (
    <div className={`comparison-player${square ? " is-square" : ""}`}>
      <div className="comparison-toolbar">
        <div className="segmented-control" aria-label="Comparison view">
          <button
            type="button"
            aria-pressed={view === "side-by-side"}
            onClick={() => changeView("side-by-side")}
          >
            Side by side
          </button>
          <button
            type="button"
            aria-pressed={view === "wipe"}
            onClick={() => changeView("wipe")}
          >
            Wipe
          </button>
        </div>
        <span className="sync-status">
          <span aria-hidden="true" /> synchronized renders
        </span>
      </div>

      {view === "side-by-side" ? (
        <div className="comparison-grid">
          <div className="render-panel">
            <div className="render-label">
              <span>Reference</span>
              <strong>Remocn</strong>
            </div>
            {video("reference")}
          </div>
          <div className="render-panel">
            <div className="render-label">
              <span>Port</span>
              <strong>HyperFrames</strong>
            </div>
            {video("port")}
          </div>
        </div>
      ) : (
        <div className="wipe-view">
          <div className="wipe-label wipe-label-left">Remocn</div>
          <div className="wipe-label wipe-label-right">HyperFrames</div>
          {video("reference", "wipe-video")}
          {video("port", "wipe-video wipe-video-port", {
            clipPath: `inset(0 ${100 - wipe}% 0 0)`,
          })}
          <div
            className="wipe-line"
            style={{ left: `${wipe}%` }}
            aria-hidden="true"
          >
            <span />
          </div>
          <input
            className="wipe-input"
            type="range"
            min="0"
            max="100"
            value={wipe}
            onChange={(event) => setWipe(Number(event.target.value))}
            aria-label="Move comparison wipe"
          />
        </div>
      )}

      <div className="transport">
        <button className="play-button" type="button" onClick={togglePlayback}>
          <span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span>
          {playing ? "Pause" : "Play"}
        </button>
        <input
          type="range"
          min="0"
          max={duration}
          step="0.001"
          value={Math.min(currentTime, duration)}
          onChange={(event) => {
            pauseBoth();
            setBothTimes(Number(event.target.value));
          }}
          aria-label="Seek both renders"
        />
        <span className="timecode">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
