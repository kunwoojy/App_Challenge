import { useEffect, useRef, useState } from "react";

// Plays an ordered list of {src, alt, caption} frames one at a time,
// like a slow filmstrip — used to "shift" through fingerspelled letters
// or a multi-frame whole-word sign.
function SignPlayer({ frames }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(700);
  const timerRef = useRef(null);

  // Reset to the start whenever the underlying sentence changes.
  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [frames]);

  useEffect(() => {
    if (!playing || frames.length === 0) return undefined;
    timerRef.current = setInterval(() => {
      setIndex((prev) => {
        if (prev >= frames.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, speedMs);
    return () => clearInterval(timerRef.current);
  }, [playing, speedMs, frames.length]);

  if (frames.length === 0) {
    return <p className="empty-hint">Type something to see it signed.</p>;
  }

  const current = frames[Math.min(index, frames.length - 1)];

  const restart = () => {
    setIndex(0);
    setPlaying(true);
  };

  return (
    <div className="sign-player">
      <div className="sign-stage">
        <img src={current.src} alt={current.alt} className="sign-stage-img" />
        <p className="sign-caption">{current.caption}</p>
      </div>

      <div className="sign-controls">
        <button
          className="key-btn"
          onClick={() => (index >= frames.length - 1 ? restart() : setPlaying((p) => !p))}
        >
          {index >= frames.length - 1 ? "Replay" : playing ? "Pause" : "Play"}
        </button>
        <button
          className="key-btn key-btn--ghost"
          onClick={() => {
            setPlaying(false);
            setIndex((i) => Math.max(0, i - 1));
          }}
          disabled={index === 0}
        >
          Prev
        </button>
        <button
          className="key-btn key-btn--ghost"
          onClick={() => {
            setPlaying(false);
            setIndex((i) => Math.min(frames.length - 1, i + 1));
          }}
          disabled={index >= frames.length - 1}
        >
          Next
        </button>

        <label className="speed-label">
          Speed
          <input
            type="range"
            min={300}
            max={1500}
            step={100}
            value={speedMs}
            onChange={(e) => setSpeedMs(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="sign-filmstrip">
        {frames.map((f, i) => (
          <button
            key={i}
            className={`filmstrip-thumb ${i === index ? "filmstrip-thumb--active" : ""}`}
            onClick={() => {
              setPlaying(false);
              setIndex(i);
            }}
            aria-label={f.caption}
          >
            <img src={f.src} alt="" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default SignPlayer;
