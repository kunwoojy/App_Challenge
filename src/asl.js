// English -> ASL sign sequence.
//
// Two kinds of "signs" are supported:
//   1. Whole-word signs — a word or short phrase (up to 3 words) that has a
//      dedicated sign, shown as one or more image frames in sequence.
//   2. Fingerspelling — used automatically for any word that isn't in the
//      whole-word dictionary, showing one image per letter.
//
// All image paths point at /public/signs/... — replace those placeholder
// SVGs with real, licensed photos/illustrations of the actual signs to make
// this production-ready. The data shape (an ordered list of {src, alt}
// frames) does not need to change when you do.

function letterFrame(letter) {
  return {
    src: `/signs/letters/${letter}.svg`,
    alt: `Fingerspelled letter ${letter.toUpperCase()}`,
  };
}

export const LETTER_SIGNS = Object.fromEntries(
  "abcdefghijklmnopqrstuvwxyz".split("").map((l) => [l, letterFrame(l)])
);

// Word/phrase -> ordered list of frames. Add entries here as you get real
// assets; multi-frame entries render as a short "shifting image" sequence
// to approximate simple motion.
export const WORD_SIGNS = {
  hello: [
    { src: "/signs/words/hello/1.svg", alt: "Sign for HELLO, frame 1" },
    { src: "/signs/words/hello/2.svg", alt: "Sign for HELLO, frame 2" },
  ],
  "thank you": [{ src: "/signs/words/thank-you/1.svg", alt: "Sign for THANK YOU" }],
  please: [{ src: "/signs/words/please/1.svg", alt: "Sign for PLEASE" }],
  sorry: [{ src: "/signs/words/sorry/1.svg", alt: "Sign for SORRY" }],
  yes: [{ src: "/signs/words/yes/1.svg", alt: "Sign for YES" }],
  no: [{ src: "/signs/words/no/1.svg", alt: "Sign for NO" }],
  love: [
    { src: "/signs/words/love/1.svg", alt: "Sign for LOVE, frame 1" },
    { src: "/signs/words/love/2.svg", alt: "Sign for LOVE, frame 2" },
  ],
  friend: [{ src: "/signs/words/friend/1.svg", alt: "Sign for FRIEND" }],
  help: [{ src: "/signs/words/help/1.svg", alt: "Sign for HELP" }],
  name: [{ src: "/signs/words/name/1.svg", alt: "Sign for NAME" }],
  good: [{ src: "/signs/words/good/1.svg", alt: "Sign for GOOD" }],
  vote: [
    { src: "/signs/words/vote/1.svg", alt: "Sign for VOTE, frame 1" },
    { src: "/signs/words/vote/2.svg", alt: "Sign for VOTE, frame 2" },
  ],
  congress: [{ src: "/signs/words/congress/1.svg", alt: "Sign for CONGRESS" }],
};

const MAX_PHRASE_LEN = 3;

function normalizeToken(token) {
  return token.toLowerCase().replace(/[^a-z']/g, "");
}

// Turn a sentence into an ordered list of "steps". Each step is either a
// whole-word sign (mode: "sign") or a fingerspelled word (mode: "fingerspell"),
// and always carries a `frames` array of {src, alt, caption}.
export function englishToSignSteps(text) {
  const rawTokens = text.trim().split(/\s+/).filter(Boolean);
  const normTokens = rawTokens.map(normalizeToken);
  const steps = [];

  let i = 0;
  while (i < rawTokens.length) {
    let matchLen = 0;
    let matchFrames = null;
    let matchLabel = "";

    const maxLen = Math.min(MAX_PHRASE_LEN, rawTokens.length - i);
    for (let len = maxLen; len >= 1; len--) {
      const phrase = normTokens.slice(i, i + len).join(" ");
      if (WORD_SIGNS[phrase]) {
        matchLen = len;
        matchFrames = WORD_SIGNS[phrase];
        matchLabel = phrase;
        break;
      }
    }

    if (matchFrames) {
      const wordText = rawTokens.slice(i, i + matchLen).join(" ");
      steps.push({
        word: wordText,
        mode: "sign",
        frames: matchFrames.map((f, idx) => ({
          ...f,
          caption:
            matchFrames.length > 1
              ? `${matchLabel.toUpperCase()} (${idx + 1}/${matchFrames.length})`
              : matchLabel.toUpperCase(),
        })),
      });
      i += matchLen;
      continue;
    }

    const normWord = normTokens[i];
    if (!normWord) {
      // Pure punctuation with nothing spellable — skip it.
      i += 1;
      continue;
    }

    steps.push({
      word: rawTokens[i],
      mode: "fingerspell",
      frames: normWord.split("").map((letter) => ({
        ...LETTER_SIGNS[letter],
        caption: letter.toUpperCase(),
      })),
    });
    i += 1;
  }

  return steps;
}

// Flatten steps into a single ordered list of frames for the player,
// keeping a back-reference to which step/word each frame belongs to.
export function flattenSteps(steps) {
  const frames = [];
  steps.forEach((step, stepIndex) => {
    step.frames.forEach((frame, frameIndex) => {
      frames.push({ ...frame, stepIndex, frameIndex, word: step.word, mode: step.mode });
    });
  });
  return frames;
}
