// Grade 1 (uncontracted) English Braille — dot patterns, encoding, and decoding.
// Six-dot cell layout (standard braille numbering):
//   1 4
//   2 5
//   3 6

const DOT_BIT = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16, 6: 32 };

// Convert an array of dot numbers -> integer bitmask (0-63)
export function dotsToMask(dots) {
  return dots.reduce((m, d) => m | DOT_BIT[d], 0);
}

// Convert an integer bitmask -> array of dot numbers
export function maskToDots(mask) {
  return [1, 2, 3, 4, 5, 6].filter((d) => mask & DOT_BIT[d]);
}

// Unicode braille patterns start at U+2800 and use the same bit order
// (dot1=bit0, dot2=bit1, dot3=bit2, dot4=bit3, dot5=bit4, dot6=bit5).
export function maskToUnicode(mask) {
  return String.fromCodePoint(0x2800 + mask);
}
export function unicodeToMask(ch) {
  const cp = ch.codePointAt(0);
  if (cp < 0x2800 || cp > 0x28ff) return null;
  return cp - 0x2800;
}

// --- Letters -------------------------------------------------------------
const BASE_A_J = {
  a: [1],
  b: [1, 2],
  c: [1, 4],
  d: [1, 4, 5],
  e: [1, 5],
  f: [1, 2, 4],
  g: [1, 2, 4, 5],
  h: [1, 2, 5],
  i: [2, 4],
  j: [2, 4, 5],
};

const letters = {};
for (const [letter, dots] of Object.entries(BASE_A_J)) {
  letters[letter] = dots; // a-j
}
// k-t: a-j pattern + dot 3
const order = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
const kToT = "klmnopqrst".split("");
kToT.forEach((letter, idx) => {
  letters[letter] = [...BASE_A_J[order[idx]], 3];
});
// u,v,x,y,z: a-e pattern + dot 3 + dot 6 (w is irregular)
const uToZNoW = "uvxyz".split("");
uToZNoW.forEach((letter, idx) => {
  letters[letter] = [...BASE_A_J[order[idx]], 3, 6];
});
letters.w = [2, 4, 5, 6];

// --- Numbers (number-sign + a-j) -----------------------------------------
const NUMBER_SIGN = [3, 4, 5, 6];
const digitLetters = { 1: "a", 2: "b", 3: "c", 4: "d", 5: "e", 6: "f", 7: "g", 8: "h", 9: "i", 0: "j" };

// --- Punctuation & indicators ---------------------------------------------
const punctuation = {
  ",": [2],
  ";": [2, 3],
  ":": [2, 5],
  ".": [2, 5, 6],
  "!": [2, 3, 5],
  "?": [2, 3, 6],
  "'": [3],
  "-": [3, 6],
  "(": [1, 2, 3, 5, 6],
  ")": [1, 2, 3, 5, 6],
  '"': [2, 3, 6],
};

const CAPITAL_SIGN = [6];

// Reverse lookup: mask -> { type, value }
const maskToSymbol = new Map();
for (const [letter, dots] of Object.entries(letters)) {
  maskToSymbol.set(dotsToMask(dots), { type: "letter", value: letter });
}
for (const [char, dots] of Object.entries(punctuation)) {
  if (!maskToSymbol.has(dotsToMask(dots))) {
    maskToSymbol.set(dotsToMask(dots), { type: "punct", value: char });
  }
}
maskToSymbol.set(dotsToMask(CAPITAL_SIGN), { type: "capital" });
maskToSymbol.set(dotsToMask(NUMBER_SIGN), { type: "number" });
maskToSymbol.set(0, { type: "space" });

export const LETTER_DOTS = letters;
export const PUNCT_DOTS = punctuation;
export const NUMBER_SIGN_DOTS = NUMBER_SIGN;
export const CAPITAL_SIGN_DOTS = CAPITAL_SIGN;
export const DIGIT_LETTERS = digitLetters;

// A single "cell" the UI can render: { mask, dots, char (source char, optional) }
function makeCell(dots, sourceChar) {
  const mask = dotsToMask(dots);
  return { mask, dots, unicode: maskToUnicode(mask), sourceChar };
}

// --- English -> Braille ---------------------------------------------------
export function englishToBrailleCells(text) {
  const cells = [];
  let numberMode = false;

  for (const rawChar of text) {
    const char = rawChar;

    if (char === " " || char === "\n" || char === "\t") {
      numberMode = false;
      cells.push(makeCell([], char));
      continue;
    }

    if (/[0-9]/.test(char)) {
      if (!numberMode) {
        cells.push(makeCell(NUMBER_SIGN, "#"));
        numberMode = true;
      }
      const letter = digitLetters[char];
      cells.push(makeCell(letters[letter], char));
      continue;
    }
    numberMode = false;

    const lower = char.toLowerCase();
    if (/[a-z]/.test(lower)) {
      if (char !== lower) {
        cells.push(makeCell(CAPITAL_SIGN, "^"));
      }
      cells.push(makeCell(letters[lower], char));
      continue;
    }

    if (punctuation[char]) {
      cells.push(makeCell(punctuation[char], char));
      continue;
    }

    // Unknown character: render as an empty cell placeholder
    cells.push(makeCell([], char));
  }

  return cells;
}

export function englishToUnicodeBraille(text) {
  return englishToBrailleCells(text)
    .map((c) => c.unicode)
    .join("");
}

// --- Braille -> English ----------------------------------------------------
// Accepts a string of Unicode braille characters (U+2800-U+28FF) and spaces.
export function brailleToEnglish(input) {
  let out = "";
  let numberMode = false;
  let capitalizeNext = false;

  for (const ch of input) {
    if (ch === " " || ch === "\n" || ch === "\t") {
      out += " ";
      numberMode = false;
      capitalizeNext = false;
      continue;
    }

    const mask = unicodeToMask(ch);
    if (mask === null) continue; // ignore stray characters
    if (mask === 0) {
      out += " ";
      numberMode = false;
      capitalizeNext = false;
      continue;
    }

    const symbol = maskToSymbol.get(mask);
    if (!symbol) {
      out += "?";
      continue;
    }

    if (symbol.type === "number") {
      numberMode = true;
      continue;
    }
    if (symbol.type === "capital") {
      capitalizeNext = true;
      continue;
    }
    if (symbol.type === "letter") {
      if (numberMode) {
        const digitEntry = Object.entries(digitLetters).find(([, l]) => l === symbol.value);
        out += digitEntry ? digitEntry[0] : "?";
      } else {
        out += capitalizeNext ? symbol.value.toUpperCase() : symbol.value;
      }
      capitalizeNext = false;
      continue;
    }
    if (symbol.type === "punct") {
      out += symbol.value;
      numberMode = false;
      capitalizeNext = false;
      continue;
    }
  }

  return out;
}

export function cellsToUnicode(cells) {
  return cells.map((c) => c.unicode).join("");
}
