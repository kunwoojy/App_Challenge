// English -> ASL sign sequence — no image files required.
//
// Every sign is described as data (handshape, movement, body location) and
// drawn by <SignPlayer /> as an inline SVG diagram plus written instructions.
// Nothing here points at /public/signs, so there are no broken images.
//
// Body-location coordinates use the 200 x 240 figure drawn in SignPlayer:
//   forehead (100,36)  temple (132,44)  chin (100,88)  chest (100,140)
//   neutral (100,175)  right-side (150,125)

const LOC = {
  forehead: [100, 36],
  temple: [132, 44],
  chin: [100, 88],
  chest: [100, 140],
  chestLeft: [82, 138],
  neutral: [100, 175],
  side: [150, 125],
  out: [165, 60],
};

// ---- Fingerspelling alphabet (handshape descriptions) ---------------------
const LETTER_INFO = {
  a: "Fist with the thumb resting against the side of the index finger.",
  b: "Flat hand, fingers together pointing up, thumb folded across the palm.",
  c: "Fingers and thumb curved to form the shape of a C.",
  d: "Index finger points up; the other fingers curl to touch the thumb.",
  e: "Fingertips curled down toward the thumb, thumb tucked underneath.",
  f: "Index finger and thumb touch to make a circle; other three fingers stand up.",
  g: "Index finger and thumb point sideways, parallel, like a small pinch.",
  h: "Index and middle fingers point sideways together, thumb tucked.",
  i: "Fist with the pinky finger pointing up.",
  j: "Pinky up like I, then trace a J in the air.",
  k: "Index and middle fingers up in a V, thumb resting between them.",
  l: "Index finger up and thumb out to form an L.",
  m: "Fist with the thumb tucked under the first three fingers.",
  n: "Fist with the thumb tucked under the first two fingers.",
  o: "All fingertips curve down to touch the thumb, forming an O.",
  p: "Like K, but the hand points down.",
  q: "Like G, but the hand points down.",
  r: "Index and middle fingers crossed, others held down.",
  s: "Fist with the thumb wrapped across the front of the fingers.",
  t: "Fist with the thumb poking up between the index and middle fingers.",
  u: "Index and middle fingers up and held together.",
  v: "Index and middle fingers up and spread apart in a V.",
  w: "Index, middle, and ring fingers up and spread; thumb holds the pinky.",
  x: "Fist with the index finger bent into a hook.",
  y: "Thumb and pinky extended, the middle three fingers curled in.",
  z: "Index finger points out and traces a Z in the air.",
};

function letterFrame(letter) {
  return {
    kind: "letter",
    letter: letter.toUpperCase(),
    title: `Letter ${letter.toUpperCase()}`,
    handshape: LETTER_INFO[letter],
    movement: letter === "j" || letter === "z" ? "Trace the letter shape in the air." : "Hold still.",
    alt: `Fingerspelled letter ${letter.toUpperCase()}: ${LETTER_INFO[letter]}`,
  };
}

export const LETTER_SIGNS = Object.fromEntries(
  "abcdefghijklmnopqrstuvwxyz".split("").map((l) => [l, letterFrame(l)])
);

// ---- Whole-word signs ---------------------------------------------------------
// motion.type: "line" (from -> to) | "circle" (around `from`) | "tap" (small repeat at `from`) | "hold"
// hands: 1 = dominant hand only, 2 = both hands
function sign(title, handshape, movement, motion, hands = 1) {
  return { kind: "sign", title, handshape, movement, motion, hands, alt: `${title}: ${handshape} ${movement}` };
}

export const WORD_SIGNS = {
  hello: [
    sign("HELLO (1/2)", "Flat hand, fingers together, palm facing out.", "Touch fingertips to the side of your forehead, like a salute.", { type: "hold", from: LOC.temple }),
    sign("HELLO (2/2)", "Same flat hand.", "Move the hand outward and away from your head.", { type: "line", from: LOC.temple, to: LOC.out }),
  ],
  "thank you": [
    sign("THANK YOU", "Flat hand, fingers together, palm facing you.", "Touch fingertips to your chin, then move the hand forward and down, palm turning up.", { type: "line", from: LOC.chin, to: [104, 128] }),
  ],
  please: [
    sign("PLEASE", "Flat hand, palm facing your body.", "Rub the hand in a circle on your chest.", { type: "circle", from: LOC.chest }),
  ],
  sorry: [
    sign("SORRY", "Fist (A handshape).", "Rub the fist in a circle on your chest.", { type: "circle", from: LOC.chest }),
  ],
  yes: [
    sign("YES", "Fist (S handshape) held in front of you.", "Nod the fist up and down like a head nodding.", { type: "tap", from: LOC.side }),
  ],
  no: [
    sign("NO", "Index and middle fingers extended, thumb out.", "Snap the index and middle fingers to the thumb, twice.", { type: "tap", from: LOC.side }),
  ],
  love: [
    sign("LOVE (1/2)", "Both hands in fists.", "Bring both fists to your chest.", { type: "hold", from: LOC.chest }, 2),
    sign("LOVE (2/2)", "Both fists, wrists crossed.", "Cross your wrists and hug the fists against your chest.", { type: "line", from: LOC.chestLeft, to: LOC.chest }, 2),
  ],
  friend: [
    sign("FRIEND (1/2)", "Both index fingers curled into hooks.", "Hook the right index finger over the left, palms facing you.", { type: "hold", from: LOC.neutral }, 2),
    sign("FRIEND (2/2)", "Both index fingers hooked.", "Flip so the left hooks over the right.", { type: "circle", from: LOC.neutral }, 2),
  ],
  help: [
    sign("HELP", "Right hand a fist with thumb up, resting on your open left palm.", "Lift both hands upward together.", { type: "line", from: LOC.neutral, to: LOC.chest }, 2),
  ],
  name: [
    sign("NAME", "Both hands in an H shape (index and middle fingers extended together).", "Tap the right H across the left H, twice.", { type: "tap", from: LOC.neutral }, 2),
  ],
  good: [
    sign("GOOD", "Flat hand, fingers together, palm facing you.", "Touch fingertips to your chin, then move the hand down into your other palm.", { type: "line", from: LOC.chin, to: LOC.neutral }),
  ],
  vote: [
    sign("VOTE (1/2)", "F handshape: thumb and index finger touching, other fingers up.", "Hold the hand in front of you, above your other hand.", { type: "hold", from: [120, 130] }),
    sign("VOTE (2/2)", "Same F handshape.", "Tap the hand downward, as if dropping a ballot.", { type: "line", from: [120, 130], to: [120, 165] }),
  ],
};

const MAX_PHRASE_LEN = 3;

function normalizeToken(token) {
  return token.toLowerCase().replace(/[^a-z']/g, "");
}

// Turn a sentence into an ordered list of steps: whole-word signs
// (mode "sign") or fingerspelled words (mode "fingerspell").
export function englishToSignSteps(text) {
  const rawTokens = text.trim().split(/\s+/).filter(Boolean);
  const normTokens = rawTokens.map(normalizeToken);
  const steps = [];

  let i = 0;
  while (i < rawTokens.length) {
    let matchLen = 0;
    let matchFrames = null;

    const maxLen = Math.min(MAX_PHRASE_LEN, rawTokens.length - i);
    for (let len = maxLen; len >= 1; len--) {
      const phrase = normTokens.slice(i, i + len).join(" ");
      if (WORD_SIGNS[phrase]) {
        matchLen = len;
        matchFrames = WORD_SIGNS[phrase];
        break;
      }
    }

    if (matchFrames) {
      steps.push({
        word: rawTokens.slice(i, i + matchLen).join(" "),
        mode: "sign",
        frames: matchFrames.map((f) => ({ ...f, caption: f.title })),
      });
      i += matchLen;
      continue;
    }

    const normWord = normTokens[i];
    if (!normWord) {
      i += 1;
      continue;
    }

    steps.push({
      word: rawTokens[i],
      mode: "fingerspell",
      frames: normWord
        .split("")
        .filter((l) => LETTER_SIGNS[l])
        .map((letter) => ({ ...LETTER_SIGNS[letter], caption: letter.toUpperCase() })),
    });
    i += 1;
  }

  return steps;
}

export function flattenSteps(steps) {
  const frames = [];
  steps.forEach((step, stepIndex) => {
    step.frames.forEach((frame, frameIndex) => {
      frames.push({ ...frame, stepIndex, frameIndex, word: step.word, mode: step.mode });
    });
  });
  return frames;
}
