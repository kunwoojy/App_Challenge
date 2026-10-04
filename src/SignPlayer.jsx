import { useEffect, useRef, useState } from "react";

// Inline SVG figure: head + shoulders, with a marker showing where the hand
// is and an arrow/ring showing how it moves. No image files needed.
function SignFigure({ motion, hands }) {
  const { type, from, to } = motion;
  const [fx, fy] = from;
  const [tx, ty] = to || from;
  return (
    <svg viewBox="0 0 200 240" className="sign-stage-img" role="img" aria-label="Hand position and movement diagram">
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="var(--pine)" />
        </marker>
      </defs>
      <circle cx="100" cy="58" r="32" fill="none" stroke="var(--ink-soft)" strokeWidth="2" />
      <line x1="100" y1="90" x2="100" y2="104" stroke="var(--ink-soft)" strokeWidth="2" />
      <path d="M40 235 Q42 108 100 104 Q158 108 160 235" fill="none" stroke="var(--ink-soft)" strokeWidth="2" />

      {type === "line" && (
        <line x1={fx} y1={fy} x2={tx} y2={ty} stroke="var(--pine)" strokeWidth="3" strokeDasharray="5 4" markerEnd="url(#arrowhead)" />
      )}
      {type === "circle" && (
        <circle cx={fx} cy={fy} r="20" fill="none" stroke="var(--pine)" strokeWidth="3" strokeDasharray="5 4" />
      )}
      {type === "tap" && (
        <>
          <line x1={fx} y1={fy - 16} x2={fx} y2={fy + 16} stroke="var(--pine)" strokeWidth="3" strokeDasharray="3 3" />
          <text x={fx + 12} y={fy - 14} fontSize="12" fill="var(--pine-deep)" fontFamily="var(--font-mono)">x2</text>
        </>
      )}

      <circle cx={fx} cy={fy} r="9" fill="var(--brass)" stroke="var(--brass-dark)" strokeWidth="2" />
      {hands === 2 && <circle cx={200 - fx} cy={fy} r="9" fill="var(--brass)" stroke="var(--brass-dark)" strokeWidth="2" />}
    </svg>
  );
}

function LetterCard({ letter }) {
  const file = letter.toLowerCase() + ".png";
  return (
    <img
      src={import.meta.env.BASE_URL + "signs/letters/" + file}
      alt={"Fingerspelled letter " + letter}
      className="sign-stage-img"
    />
  );
}

function SignPlayer({ frames }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(1100);
  const timerRef = useRef(null);

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
  const atEnd = index >= frames.length - 1;

  return (
    <div className="sign-player">
      <div className="sign-stage" aria-live="polite">
        {current.kind === "letter" ? (
          <LetterCard letter={current.letter} />
        ) : (
          <SignFigure motion={current.motion} hands={current.hands} />
        )}
        <p className="sign-caption">{current.caption}</p>
        <p className="sign-desc">
          <strong>Handshape:</strong> {current.handshape}
        </p>
        <p className="sign-desc">
          <strong>Movement:</strong> {current.movement}
        </p>
      </div>

      <div className="sign-controls">
        <button
          className="key-btn"
          onClick={() => {
            if (atEnd) {
              setIndex(0);
              setPlaying(true);
            } else {
              setPlaying((p) => !p);
            }
          }}
        >
          {atEnd ? "Replay" : playing ? "Pause" : "Play"}
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
          disabled={atEnd}
        >
          Next
        </button>

        <label className="speed-label">
          Speed
          <input
            type="range"
            min={400}
            max={2000}
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
            {f.kind === "letter" ? f.letter : f.frameIndex + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

export default SignPlayer;
