// Built-in Grade 1 (uncontracted) English Braille, following UEB conventions.
// Grade 2 is handled by liblouis (see liblouis.js).
//
// Six-dot cell layout:
//   1 4
//   2 5
//   3 6

const DOT_BIT = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16, 6: 32 };

export function dotsToMask(dots) {
  return dots.reduce((m, d) => m | DOT_BIT[d], 0);
}
export function maskToDots(mask) {
  return [1, 2, 3, 4, 5, 6].filter((d) => mask & DOT_BIT[d]);
}
// Unicode braille starts at U+2800 and uses the same bit order.
export function maskToUnicode(mask) {
  return String.fromCodePoint(0x2800 + mask);
}
export function unicodeToMask(ch) {
  const cp = ch.codePointAt(0);
  if (cp < 0x2800 || cp > 0x28ff) return null;
  return cp - 0x2800;
}

// --- Letters ---------------------------------------------------------------
const BASE_A_J = {
  a: [1], b: [1, 2], c: [1, 4], d: [1, 4, 5], e: [1, 5],
  f: [1, 2, 4], g: [1, 2, 4, 5], h: [1, 2, 5], i: [2, 4], j: [2, 4, 5],
};
const order = Object.keys(BASE_A_J);
const letters = { ...BASE_A_J };
"klmnopqrst".split("").forEach((l, i) => (letters[l] = [...BASE_A_J[order[i]], 3]));
"uvxyz".split("").forEach((l, i) => (letters[l] = [...BASE_A_J[order[i]], 3, 6]));
letters.w = [2, 4, 5, 6];

// --- Indicators ------------------------------------------------------------
const NUMBER_SIGN = [3, 4, 5, 6];
const CAPITAL_SIGN = [6];
const CAPITAL_WORD = [[6], [6]];
const GRADE1_LETTER = [5, 6]; // ends a number so "1a" isn't read as "11"
const digitLetters = { 1: "a", 2: "b", 3: "c", 4: "d", 5: "e", 6: "f", 7: "g", 8: "h", 9: "i", 0: "j" };
const letterToDigit = Object.fromEntries(Object.entries(digitLetters).map(([d, l]) => [l, d]));

// --- Punctuation (each entry is a list of cells; some marks take two) ------
const PUNCT = {
  ",": [[2]],
  ";": [[2, 3]],
  ":": [[2, 5]],
  ".": [[2, 5, 6]],
  "!": [[2, 3, 5]],
  "?": [[2, 3, 6]],
  "'": [[3]],
  "-": [[3, 6]],
  "\u2014": [[6], [3, 6]], // em dash
  "\u2013": [[6], [3, 6]], // en dash (UEB dash)
  "(": [[5], [1, 2, 6]],
  ")": [[5], [3, 4, 5]],
  "/": [[4, 5, 6], [3, 4]],
};
const QUOTE_OPEN = [[2, 3, 6]];
const QUOTE_CLOSE = [[3, 5, 6]];

export const LETTER_DOTS = letters;
export const PUNCT_DOTS = PUNCT;
export const NUMBER_SIGN_DOTS = NUMBER_SIGN;
export const CAPITAL_SIGN_DOTS = CAPITAL_SIGN;
export const DIGIT_LETTERS = digitLetters;

const isAsciiLetter = (c) => /^[A-Za-z]$/.test(c ?? "");
const isDigit = (c) => /^[0-9]$/.test(c ?? "");
const isSpace = (c) => c === " " || c === "\t";

function makeCell(dots, sourceChar = "") {
  const mask = dotsToMask(dots);
  return { mask, dots, unicode: maskToUnicode(mask), sourceChar };
}
const blankCell = (src = " ") => makeCell([], src);
const breakCell = () => ({ ...makeCell([], "\n"), unicode: "\n", lineBreak: true });

// Normalise typographic characters so they encode like their plain versions.
function normalise(text) {
  return text.replace(/[\u2018\u2019]/g, "'").replace(/\r/g, "");
}

function isSupported(ch) {
  return (
    isAsciiLetter(ch) || isDigit(ch) || ch === " " || ch === "\t" || ch === "\n" ||
    ch === '"' || ch === "\u201C" || ch === "\u201D" || Boolean(PUNCT[ch])
  );
}

// Characters the Grade 1 engine can't encode (they are skipped).
export function unsupportedChars(text) {
  return [...new Set(Array.from(normalise(text)).filter((c) => !isSupported(c)))];
}

// --- English -> Braille (Grade 1) ------------------------------------------
export function englishToBrailleCells(rawText) {
  const chars = Array.from(normalise(rawText));
  const cells = [];
  const push = (cellList, src) => cellList.forEach((d, i) => cells.push(makeCell(d, i === 0 ? src : "")));
  let numberMode = false;

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];

    if (ch === "\n") { cells.push(breakCell()); numberMode = false; continue; }
    if (isSpace(ch)) { cells.push(blankCell(ch)); numberMode = false; continue; }

    if (isDigit(ch)) {
      if (!numberMode) { cells.push(makeCell(NUMBER_SIGN, "#")); numberMode = true; }
      cells.push(makeCell(letters[digitLetters[ch]], ch));
      continue;
    }

    if (isAsciiLetter(ch)) {
      // A letter a-j right after a number needs the grade 1 indicator.
      if (numberMode && /[a-jA-J]/.test(ch)) cells.push(makeCell(GRADE1_LETTER, ""));
      numberMode = false;

      const upper = ch !== ch.toLowerCase();
      if (upper && isAsciiLetter(chars[i + 1]) && chars[i + 1] !== chars[i + 1].toLowerCase()) {
        // Two or more capitals in a row: one capitals-word indicator for the whole word.
        push(CAPITAL_WORD, "^^");
        let j = i;
        while (isAsciiLetter(chars[j])) {
          cells.push(makeCell(letters[chars[j].toLowerCase()], chars[j]));
          j++;
        }
        i = j - 1;
        continue;
      }
      if (upper) cells.push(makeCell(CAPITAL_SIGN, "^"));
      cells.push(makeCell(letters[ch.toLowerCase()], ch));
      continue;
    }

    if (ch === '"' || ch === "\u201C" || ch === "\u201D") {
      const prev = chars[i - 1];
      const opening =
        ch === "\u201C" || (ch === '"' && (prev === undefined || /\s|\(|-/.test(prev)));
      push(opening ? QUOTE_OPEN : QUOTE_CLOSE, ch);
      numberMode = false;
      continue;
    }

    if (PUNCT[ch]) {
      // Commas and periods inside a number ("1,000", "3.5") keep number mode.
      const keepNumber = (ch === "," || ch === ".") && numberMode && isDigit(chars[i + 1]);
      push(PUNCT[ch], ch);
      numberMode = keepNumber;
      continue;
    }
    // Unsupported character: skipped (see unsupportedChars()).
    numberMode = false;
  }
  return cells;
}

export function englishToUnicodeBraille(text) {
  return cellsToUnicode(englishToBrailleCells(text));
}

export function cellsToUnicode(cells) {
  return cells.map((c) => c.unicode).join("");
}

// Turn a Unicode braille string (e.g. liblouis output) into renderable cells.
export function unicodeToCells(str) {
  const cells = [];
  for (const ch of str) {
    if (ch === "\n") { cells.push(breakCell()); continue; }
    if (ch === " " || ch === "\t") { cells.push(blankCell(ch)); continue; }
    const mask = unicodeToMask(ch);
    if (mask === null) continue;
    cells.push(mask === 0 ? blankCell(ch) : { ...makeCell(maskToDots(mask), ""), unicode: ch });
  }
  return cells;
}

// --- Braille -> English (Grade 1) ------------------------------------------
const SPACE = -1;
const NEWLINE = -2;

const SINGLE = new Map();
for (const [l, d] of Object.entries(letters)) SINGLE.set(dotsToMask(d), { t: "letter", v: l });
for (const [ch, seq] of Object.entries(PUNCT)) {
  if (seq.length === 1 && !SINGLE.has(dotsToMask(seq[0]))) SINGLE.set(dotsToMask(seq[0]), { t: "punct", v: ch });
}
SINGLE.set(dotsToMask(CAPITAL_SIGN), { t: "capital" });
SINGLE.set(dotsToMask(NUMBER_SIGN), { t: "number" });
SINGLE.set(dotsToMask(GRADE1_LETTER), { t: "grade1" });
SINGLE.set(dotsToMask(QUOTE_CLOSE[0]), { t: "punct", v: '"' });
SINGLE.set(dotsToMask(QUOTE_OPEN[0]), { t: "quoteOrQuestion" });

const DOUBLE = new Map();
DOUBLE.set(`${dotsToMask([6])},${dotsToMask([6])}`, { t: "capsWord" });
for (const [ch, seq] of Object.entries(PUNCT)) {
  if (seq.length === 2 && ch !== "\u2013") {
    DOUBLE.set(`${dotsToMask(seq[0])},${dotsToMask(seq[1])}`, { t: "punct", v: ch });
  }
}

export function brailleToEnglish(input) {
  const tokens = [];
  for (const ch of input) {
    if (ch === "\n") { tokens.push(NEWLINE); continue; }
    if (ch === " " || ch === "\t") { tokens.push(SPACE); continue; }
    const mask = unicodeToMask(ch);
    if (mask === null) continue; // ignore stray characters
    tokens.push(mask === 0 ? SPACE : mask);
  }

  let out = "";
  let numberMode = false;
  let capitalizeNext = false;
  let capsWord = false;
  const atBoundary = () => out === "" || /[\s(]$/.test(out);
  const emit = (s) => { out += capsWord ? s.toUpperCase() : s; };

  for (let i = 0; i < tokens.length; i++) {
    const m = tokens[i];
    if (m === SPACE || m === NEWLINE) {
      out += m === SPACE ? " " : "\n";
      numberMode = capitalizeNext = capsWord = false;
      continue;
    }

    const pair = i + 1 < tokens.length && tokens[i + 1] >= 0 ? DOUBLE.get(`${m},${tokens[i + 1]}`) : null;
    if (pair) {
      i++;
      if (pair.t === "capsWord") { capsWord = true; continue; }
      out += pair.v;
      numberMode = capitalizeNext = capsWord = false;
      continue;
    }

    const sym = SINGLE.get(m);
    if (!sym) { out += "\uFFFD"; continue; }

    switch (sym.t) {
      case "number": numberMode = true; break;
      case "capital": capitalizeNext = true; break;
      case "grade1": numberMode = false; break;
      case "letter":
        if (numberMode && letterToDigit[sym.v]) {
          out += letterToDigit[sym.v];
        } else {
          numberMode = false;
          out += capitalizeNext ? sym.v.toUpperCase() : capsWord ? sym.v.toUpperCase() : sym.v;
        }
        capitalizeNext = false;
        break;
      case "quoteOrQuestion":
        out += atBoundary() ? '"' : "?";
        numberMode = capitalizeNext = false;
        capsWord = false;
        break;
      case "punct":
        out += sym.v;
        if (!(numberMode && (sym.v === "," || sym.v === "."))) numberMode = false;
        capitalizeNext = false;
        if (sym.v !== "'") capsWord = false;
        break;
      default:
        break;
    }
  }
  return out;
}
