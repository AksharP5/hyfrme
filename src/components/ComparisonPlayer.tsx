import { useRef, useState } from "react";

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

  const pauseBoth = () => {
    referenceRef.current?.pause();
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

    if (currentTime >= duration - 0.02) setBothTimes(0);
    reference.currentTime = port.currentTime;

    try {
      await Promise.all([reference.play(), port.play()]);
      setPlaying(true);
    } catch {
      pauseBoth();
    }
  };

  const handlePortTimeUpdate = () => {
    const reference = referenceRef.current;
    const port = portRef.current;
    if (!reference || !port) return;

    setCurrentTime(port.currentTime);
    if (Math.abs(reference.currentTime - port.currentTime) > 0.05) {
      reference.currentTime = port.currentTime;
    }
  };

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
      preload="metadata"
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
