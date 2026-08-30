import { useMemo, useState } from "react";
import BrailleCell from "../BrailleCell";
import {
  englishToBrailleCells,
  cellsToUnicode,
  brailleToEnglish,
  dotsToMask,
  maskToUnicode,
} from "../braille";

function CopyButton({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  };
  return (
    <button className="copy-btn" onClick={handleCopy} disabled={!text}>
      {copied ? "Copied" : label}
    </button>
  );
}

function EnglishToBraille() {
  const [text, setText] = useState("Congressional App Challenge");
  const cells = useMemo(() => englishToBrailleCells(text), [text]);
  const unicode = useMemo(() => cellsToUnicode(cells), [cells]);

  return (
    <div className="panel">
      <div className="field">
        <label htmlFor="eng-input">English text</label>
        <textarea
          id="eng-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          rows={3}
        />
      </div>

      <div className="field">
        <div className="field-label-row">
          <span className="field-label">Embossed output</span>
        </div>
        <div className="emboss-tray">
          {cells.length === 0 && <span className="empty-hint">Dots will appear here as you type</span>}
          {cells.map((cell, i) => (
            <BrailleCell key={i} dots={cell.dots} size="md" />
          ))}
        </div>
      </div>

      <div className="field">
        <div className="field-label-row">
          <span className="field-label">Unicode braille</span>
          <CopyButton text={unicode} />
        </div>
        <div className="unicode-strip">{unicode || "\u00A0"}</div>
      </div>
    </div>
  );
}

function BrailleToEnglish() {
  const [sequence, setSequence] = useState("");
  const [dots, setDots] = useState([]);
  const english = useMemo(() => brailleToEnglish(sequence), [sequence]);

  const toggleDot = (d) => {
    setDots((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const commitCell = () => {
    const mask = dotsToMask(dots);
    setSequence((s) => s + maskToUnicode(mask));
    setDots([]);
  };

  const addSpace = () => {
    setSequence((s) => s + " ");
    setDots([]);
  };

  const backspace = () => {
    setSequence((s) => s.slice(0, -1));
  };

  const clearAll = () => {
    setSequence("");
    setDots([]);
  };

  return (
    <div className="panel">
      <div className="field">
        <div className="field-label-row">
          <span className="field-label">Compose a cell</span>
        </div>
        <div className="composer">
          <BrailleCell dots={dots} size="lg" interactive onToggleDot={toggleDot} />
          <div className="composer-actions">
            <button className="key-btn" onClick={commitCell}>
              Add cell
            </button>
            <button className="key-btn key-btn--ghost" onClick={addSpace}>
              Space
            </button>
            <button className="key-btn key-btn--ghost" onClick={backspace}>
              Backspace
            </button>
            <button className="key-btn key-btn--ghost" onClick={clearAll}>
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="field">
        <label htmlFor="brl-input">Braille sequence</label>
        <textarea
          id="brl-input"
          className="braille-font"
          value={sequence}
          onChange={(e) => setSequence(e.target.value)}
          placeholder="Click dots above, or paste unicode braille here…"
          rows={3}
        />
      </div>

      <div className="field">
        <div className="field-label-row">
          <span className="field-label">English translation</span>
          <CopyButton text={english} />
        </div>
        <div className="unicode-strip unicode-strip--result">{english || "\u00A0"}</div>
      </div>
    </div>
  );
}

function App() {
  const [mode, setMode] = useState("e2b");

  return (
    <div className="app">
      <header className="header">
        <p className="eyebrow">Congressional App Challenge</p>
        <h1 className="title">Braille Bench</h1>
        <p className="subtitle">
          A two-way workbench for translating between English and Grade&nbsp;1 (uncontracted) Braille.
        </p>
      </header>

      <div className="lever-row" role="tablist" aria-label="Translation direction">
        <button
          role="tab"
          aria-selected={mode === "e2b"}
          className={`lever ${mode === "e2b" ? "lever--active" : ""}`}
          onClick={() => setMode("e2b")}
        >
          English <span className="lever-arrow">&rarr;</span> Braille
        </button>
        <button
          role="tab"
          aria-selected={mode === "b2e"}
          className={`lever ${mode === "b2e" ? "lever--active" : ""}`}
          onClick={() => setMode("b2e")}
        >
          Braille <span className="lever-arrow">&rarr;</span> English
        </button>
      </div>

      <main className="plate">
        <div className="plate-sweep" aria-hidden="true" />
        {mode === "e2b" ? <EnglishToBraille /> : <BrailleToEnglish />}
      </main>

      <footer className="footer">
        Grade&nbsp;1 only — one cell per letter. The capital sign (dot&nbsp;6) marks the next letter as
        uppercase; the number sign (dots&nbsp;3‑4‑5‑6) starts a run of digits.
      </footer>
    </div>
  );
}

export default App;
