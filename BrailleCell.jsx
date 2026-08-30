// Renders one 6-dot braille cell as raised/embossed dots.
// dots: array of active dot numbers (1-6), positions:
//   1 4
//   2 5
//   3 6

const POSITIONS = {
  1: { col: 0, row: 0 },
  4: { col: 1, row: 0 },
  2: { col: 0, row: 1 },
  5: { col: 1, row: 1 },
  3: { col: 0, row: 2 },
  6: { col: 1, row: 2 },
};

function BrailleCell({ dots = [], size = "md", interactive = false, onToggleDot }) {
  const active = new Set(dots);
  return (
    <div className={`bcell bcell--${size}`}>
      {[1, 2, 3, 4, 5, 6].map((d) => {
        const pos = POSITIONS[d];
        const isOn = active.has(d);
        return (
          <button
            type="button"
            key={d}
            className={`bdot ${isOn ? "bdot--on" : ""} ${interactive ? "bdot--interactive" : ""}`}
            style={{ gridColumn: pos.col + 1, gridRow: pos.row + 1 }}
            onClick={interactive ? () => onToggleDot(d) : undefined}
            disabled={!interactive}
            aria-pressed={isOn}
            aria-label={`dot ${d}`}
            tabIndex={interactive ? 0 : -1}
          />
        );
      })}
    </div>
  );
}

export default BrailleCell;
