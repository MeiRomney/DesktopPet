import type { ReactNode } from "react";
import { INK } from "../constants";
import type { Look, HairId } from "../characters";
import { hairTones } from "../colors";
import type { Tones } from "../colors";

/**
 * All hair drawing. Coordinates are the head's (circle centered 50,45, radius 40).
 *
 * Every hair piece goes through <Mass>, which paints it the way the reference artwork is painted:
 *   1. base colour + ink outline
 *   2. a top-lit gradient (lighter crown, darker ends)
 *   3. a rim light on the top edges and a soft inner shadow all around
 *   4. strands drawn as clumps: a cast shadow, a dark line and a light line next to each other
 * On top of that the fringe casts a shadow on the face, has a glossy shine, and some styles get flyaway tufts.
 *
 * BackHair is drawn behind the head and body, FrontHair on top of the head (cap, fringe, locks, braids).
 */

const TIE = "#ff6b8b";
const TOP = "M8 44 C2 -14 98 -14 92 44";

type Circ = [number, number, number];
/** One piece of hair: a path (d) or a union of circles (c), plus optional strand lines. */
type Item = { d?: string; c?: Circ[]; strands?: string; streak?: boolean };

// ---------------------------------------------------------------- fringes (the part that lies on the forehead)
const FRINGE_JAG = `${TOP} L86 32 L78 38 L72 24 L64 34 L56 22 L48 34 L40 24 L32 36 L24 28 L16 38 L10 34 Z`;
const FRINGE_SOFT = `${TOP} L90 30 Q50 42 10 30 Z`;
const SPIKY =
  "M8 44 L2 24 L14 26 L8 6 L24 16 L30 -6 L42 10 L52 -10 L62 10 L74 -6 L78 16 L92 6 L86 26 L98 24 L92 44 L86 32 L78 38 L72 24 L64 34 L56 22 L48 34 L40 24 L32 36 L24 28 L16 38 L10 34 Z";
const FRINGE_BLUNT = `${TOP} L91 28 L9 28 Z`;
const FRINGE_CURLY = `${TOP} Q86 30 80 36 Q74 22 66 32 Q58 20 50 30 Q42 20 34 32 Q26 22 20 36 Q14 30 8 44 Z`;
const FRINGE_PIXIE = `${TOP} L92 26 Q70 18 52 34 Q36 22 8 32 Z`;
const CURTAIN = `${TOP} L91 46 Q82 44 70 28 Q60 18 50 24 Q40 18 30 28 Q18 44 9 46 Z`;
const SWEEP = `${TOP} L90 36 Q76 44 58 24 Q40 40 10 36 Z`;
const SHAGGY = `${TOP} L91 36 L86 30 L80 37 L73 26 L65 36 L57 24 L49 36 L41 26 L33 37 L25 28 L17 36 L11 31 Z`;
const MESSY =
  "M8 44 C0 18 8 2 24 -2 L30 -12 L40 -4 L50 -14 L60 -4 L72 -12 L76 0 L90 4 C98 18 94 32 92 44 L88 30 L82 38 L76 26 L68 36 L60 22 L50 34 L42 22 L34 36 L26 26 L18 38 L12 30 Z";
const SIDE = `${TOP} L90 34 Q80 24 62 14 Q50 30 28 32 L10 38 Z`;
const UNDERCUT =
  "M18 36 C8 4 34 -14 54 -12 C78 -12 94 6 82 36 Q70 20 50 22 Q32 22 18 36 Z";
const EMO = `${TOP} L93 56 L86 40 L74 30 L56 36 L44 28 L30 38 L20 30 L14 56 L8 44 Z`;
const AFRO =
  "M10 40 C6 8 30 -4 50 -4 C70 -4 94 8 90 40 Q70 22 50 24 Q30 22 10 40 Z";
const MULLET = `${TOP} L90 36 L82 26 L74 38 L66 22 L58 34 L50 20 L42 34 L34 22 L26 38 L18 26 L10 36 Z`;
const SLEEK =
  "M10 40 C6 6 30 -6 50 -6 C70 -6 94 6 90 40 Q70 24 50 28 Q30 24 10 40 Z";
// new
const TOUSLED =
  "M8 44 C0 16 10 -2 28 -4 C36 -14 62 -14 72 -6 C90 0 100 24 92 44 Q88 36 84 42 Q80 26 72 34 Q66 18 58 34 Q52 20 46 36 Q40 22 32 38 Q26 26 20 42 Q16 34 8 44 Z";
const CURTAINS =
  "M8 46 C0 14 20 -8 50 -8 C80 -8 100 14 92 46 Q88 40 80 30 Q70 18 52 24 L50 18 L48 24 Q30 18 20 30 Q12 40 8 46 Z";
const QUIFF =
  "M9 44 C3 20 10 4 24 -2 C30 -24 62 -32 78 -12 C94 -4 98 26 91 44 L86 32 L80 36 L72 24 Q54 14 36 30 L28 26 L20 38 L14 34 Z";
const CROP =
  "M10 44 C4 12 22 -6 50 -6 C78 -6 96 12 90 44 Q86 30 76 26 Q50 14 24 26 Q14 30 10 44 Z";
const BOWL = "M7 50 C0 -12 100 -12 93 50 L91 32 Q50 40 9 32 Z";

const FRINGES: Partial<Record<HairId, string>> = {
  spiky: SPIKY,
  bob: FRINGE_SOFT,
  long: FRINGE_SOFT,
  twintails: FRINGE_SOFT,
  wavy: FRINGE_SOFT,
  twinbuns: FRINGE_SOFT,
  braid: FRINGE_SOFT,
  hime: FRINGE_BLUNT,
  curly: FRINGE_CURLY,
  pixie: FRINGE_PIXIE,
  layered: CURTAIN,
  twinbraids: FRINGE_SOFT,
  drills: FRINGE_SOFT,
  halfup: SWEEP,
  wolf: SHAGGY,
  messy: MESSY,
  sidepart: SIDE,
  undercut: UNDERCUT,
  emo: EMO,
  afro: AFRO,
  mullet: MULLET,
  manbun: SLEEK,
  tousled: TOUSLED,
  curtains: CURTAINS,
  quiff: QUIFF,
  crop: CROP,
  bowl: BOWL,
};

// ---------------------------------------------------------------- strand lines on the fringe
const STR_JAG =
  "M24 8 Q20 20 24 28 M38 4 Q34 16 38 28 M52 3 Q52 14 50 26 M66 4 Q70 16 64 28 M78 8 Q82 20 76 30";
const STR_SOFT =
  "M20 12 Q16 22 16 31 M34 6 Q30 20 28 33 M50 4 Q50 18 50 35 M66 6 Q70 20 72 33 M80 12 Q84 22 84 31";
const STRANDS_FRONT: Partial<Record<HairId, string>> = {
  short: STR_JAG,
  ponytail: STR_JAG,
  bun: STR_JAG,
  sidepony: STR_JAG,
  spiky:
    "M22 26 Q20 14 14 8 M36 24 Q36 10 30 0 M52 22 Q52 8 50 -4 M68 24 Q66 10 72 0 M82 26 Q82 14 88 8",
  bob: STR_SOFT,
  long: STR_SOFT,
  twintails: STR_SOFT,
  wavy: STR_SOFT,
  twinbuns: STR_SOFT,
  braid: STR_SOFT,
  twinbraids: STR_SOFT,
  drills: STR_SOFT,
  hime: "M22 8 Q20 18 20 27 M36 5 Q35 16 35 27 M50 4 V27 M64 5 Q65 16 65 27 M78 8 Q80 18 80 27",
  curly: "M26 14 Q28 24 26 32 M50 8 Q52 20 50 28 M74 14 Q72 24 74 32",
  pixie:
    "M24 10 Q22 20 18 30 M40 6 Q40 18 36 30 M60 8 Q72 14 86 24 M72 4 Q82 10 90 20",
  layered:
    "M74 8 Q82 24 86 42 M62 6 Q72 20 76 34 M26 8 Q18 24 14 42 M38 6 Q28 20 24 34 M50 4 V18",
  halfup:
    "M20 12 Q18 24 14 34 M34 6 Q32 20 26 36 M50 4 Q56 16 60 28 M70 8 Q78 18 86 32",
  wolf: "M22 10 Q20 22 18 32 M36 6 Q34 20 32 34 M50 4 Q50 18 50 33 M64 6 Q66 20 66 34 M78 10 Q80 22 82 32",
  messy:
    "M24 6 Q22 20 26 28 M40 2 Q38 16 42 24 M54 0 Q56 14 52 28 M68 4 Q70 18 66 30 M82 10 Q84 22 80 32",
  sidepart:
    "M66 12 Q74 6 80 4 M60 18 Q72 16 84 26 M46 24 Q36 22 24 30 M34 14 Q24 20 16 32 M70 22 Q80 26 86 34",
  undercut:
    "M28 24 Q34 4 48 -4 M44 20 Q50 2 62 -6 M60 20 Q68 4 76 4 M72 24 Q80 10 82 12",
  emo: "M18 14 Q16 34 16 52 M82 14 Q84 34 84 52 M36 8 Q32 22 32 34 M64 8 Q66 22 62 32",
  afro: "M22 20 Q26 8 34 4 M44 14 Q46 4 54 0 M62 18 Q68 6 76 6 M30 28 Q28 20 22 24",
  mullet:
    "M26 8 Q22 20 26 32 M40 4 Q38 18 42 30 M56 2 Q56 16 52 28 M70 6 Q72 20 66 30",
  manbun:
    "M50 -4 V24 M36 -2 Q32 12 22 32 M64 -2 Q68 12 78 32 M24 6 Q20 18 14 34",
  tousled:
    "M22 6 Q16 20 22 34 M34 0 Q28 16 32 30 M46 -4 Q44 14 46 32 M60 -4 Q64 14 58 32 M72 0 Q80 14 74 32 M84 8 Q88 22 82 34 M30 14 Q40 24 44 36",
  curtains:
    "M24 4 Q14 20 16 38 M36 0 Q26 16 28 32 M64 0 Q74 16 72 32 M76 4 Q86 20 84 38 M50 -4 V16 M20 14 Q30 24 36 30 M80 14 Q70 24 64 30",
  quiff:
    "M30 -4 Q44 -14 64 -12 M26 6 Q42 -6 70 -2 M32 16 Q50 4 76 8 M40 26 Q56 14 80 20 M22 28 Q18 36 16 40 M84 26 Q88 34 86 38",
  crop: "M22 10 Q40 2 62 6 M18 20 Q40 12 70 16 M16 30 Q22 24 30 24 M84 30 Q78 24 70 24 M50 -2 Q50 6 52 12",
  bowl: "M20 4 Q16 18 16 30 M34 0 Q32 16 32 32 M50 -2 V34 M66 0 Q68 16 68 32 M80 4 Q84 18 84 30",
};

// ---------------------------------------------------------------- flyaway tufts (small locks that stick out of the silhouette)
const TOPFLICK = "M42 4 C40 -8 50 -18 64 -14 C56 -9 54 -2 56 4 Z";
const TOPFLICK2 = "M30 2 C26 -8 34 -16 44 -14 C38 -10 38 -4 40 2 Z";
const SIDEFLICK = "M10 40 C2 38 -4 44 -6 52 C2 50 8 52 12 58 Z";
type Fly = { d: string; mirror?: boolean };
const FLY: Partial<Record<HairId, Fly[]>> = {
  tousled: [{ d: TOPFLICK }],
  messy: [{ d: TOPFLICK2 }, { d: SIDEFLICK, mirror: true }],
  short: [{ d: TOPFLICK }],
  wolf: [{ d: SIDEFLICK }, { d: SIDEFLICK, mirror: true }],
  pixie: [{ d: TOPFLICK2 }],
  sidepart: [{ d: TOPFLICK2 }],
  halfup: [{ d: TOPFLICK }],
  curtains: [{ d: TOPFLICK }],
  bowl: [],
  quiff: [{ d: SIDEFLICK, mirror: true }],
};

// ---------------------------------------------------------------- back shapes
const BOB_BACK = "M6 40 C4 -10 96 -10 94 40 V70 Q94 80 84 80 H16 Q6 80 6 70 Z";
const LONG_BACK =
  "M6 40 C4 -10 96 -10 94 40 V112 Q94 124 82 124 H18 Q6 124 6 112 Z";
const WAVY_BACK =
  "M6 40 C4 -10 96 -10 94 40 V104 Q94 112 86 108 Q80 120 72 110 Q66 120 58 111 Q50 122 42 111 Q34 120 28 110 Q20 120 14 108 Q6 112 6 104 Z";
const LAYERED_BACK =
  "M6 40 C4 -10 96 -10 94 40 V108 Q98 118 90 128 L80 116 L72 130 L62 118 L50 132 L38 118 L28 130 L20 116 L10 128 Q2 118 6 108 Z";
const WOLF_BACK =
  "M6 40 C4 -10 96 -10 94 40 V90 L88 84 L84 102 L74 88 L66 100 L58 88 L50 102 L42 88 L34 100 L26 88 L16 102 L12 84 L6 90 Z";
const SHORT_BACK =
  "M6 40 C4 -10 96 -10 94 40 V74 Q94 80 86 80 H14 Q6 80 6 74 Z";
const MULLET_BACK =
  "M8 40 C6 -10 94 -10 92 40 L94 96 Q92 112 78 108 L50 118 L22 108 Q8 112 6 96 Z";
const TOUSLE_BACK =
  "M6 40 C4 -10 96 -10 94 40 L103 52 L93 55 L99 67 L88 61 L89 73 L78 62 L70 70 L62 60 L38 60 L30 70 L22 62 L11 73 L12 61 L1 67 L7 55 L-3 52 Z";
const CURT_BACK = "M6 42 C4 -10 96 -10 94 42 V68 Q94 74 86 72 H14 Q6 74 6 68 Z";
const BOWL_BACK = "M6 46 C4 -10 96 -10 94 46 V62 Q94 68 86 66 H14 Q6 68 6 62 Z";

const LONG_ST =
  "M12 64 Q10 92 14 118 M22 80 Q20 100 24 120 M34 88 Q32 104 34 122 M66 88 Q68 104 66 122 M78 80 Q80 100 76 120 M88 64 Q90 92 86 118";

/** Drill curls: stacked, shrinking loops with a swirl line each. */
const DRILL_C: Circ[] = [
  [12, 62, 13],
  [8, 78, 12],
  [12, 93, 10.5],
  [14, 106, 8.5],
  [15, 117, 6],
  [88, 62, 13],
  [92, 78, 12],
  [88, 93, 10.5],
  [86, 106, 8.5],
  [85, 117, 6],
];
const swirls = (cs: Circ[]) =>
  cs
    .map(
      ([x, y, r]) =>
        `M${x - r * 0.6} ${y - r * 0.15} Q${x} ${y - r * 0.95} ${x + r * 0.6} ${y - r * 0.15} M${x - r * 0.5} ${y + r * 0.35} Q${x} ${y + r * 0.8} ${x + r * 0.5} ${y + r * 0.35}`,
    )
    .join(" ");

const BACK: Partial<Record<HairId, Item[]>> = {
  bob: [
    {
      d: BOB_BACK,
      streak: true,
      strands:
        "M10 50 Q9 64 11 76 M16 56 Q15 66 16 77 M84 56 Q85 66 84 77 M90 50 Q91 64 89 76 M22 62 Q22 72 24 79 M78 62 Q78 72 76 79",
    },
  ],
  long: [{ d: LONG_BACK, streak: true, strands: LONG_ST }],
  hime: [{ d: LONG_BACK, streak: true, strands: LONG_ST }],
  halfup: [{ d: LONG_BACK, streak: true, strands: LONG_ST }],
  layered: [
    {
      d: LAYERED_BACK,
      streak: true,
      strands:
        "M12 64 Q10 92 14 118 M22 80 Q20 102 22 122 M34 90 Q32 108 36 124 M50 92 V126 M66 90 Q68 108 64 124 M78 80 Q80 102 78 122 M88 64 Q90 92 86 118",
    },
  ],
  wolf: [
    {
      d: WOLF_BACK,
      streak: true,
      strands:
        "M12 60 Q10 78 14 92 M22 70 Q20 84 24 96 M34 76 Q32 88 36 96 M66 76 Q68 88 64 96 M78 70 Q80 84 76 96 M88 60 Q90 78 86 92",
    },
  ],
  wavy: [
    {
      d: WAVY_BACK,
      streak: true,
      strands:
        "M12 64 Q8 82 14 100 M24 80 Q18 94 26 106 M76 80 Q82 94 74 106 M88 64 Q92 82 86 100 M40 90 Q36 100 42 108 M60 90 Q64 100 58 108",
    },
  ],
  twintails: [
    {
      d: "M16 34 C-6 40 -12 92 6 112 C20 100 26 70 26 46 Z",
      strands: "M10 50 Q2 78 8 104 M17 54 Q12 78 14 100 M22 50 Q20 70 18 92",
    },
    {
      d: "M84 34 C106 40 112 92 94 112 C80 100 74 70 74 46 Z",
      strands: "M90 50 Q98 78 92 104 M83 54 Q88 78 86 100 M78 50 Q80 70 82 92",
    },
  ],
  ponytail: [
    {
      d: "M76 16 C108 18 112 70 92 100 C92 78 86 58 76 46 Z",
      strands: "M88 24 Q100 50 94 88 M82 30 Q92 56 90 90 M96 34 Q104 56 98 80",
    },
  ],
  bun: [
    {
      c: [[50, -4, 13]],
      strands: "M42 -8 Q50 -14 58 -8 M44 0 Q50 5 56 0 M40 -2 Q42 -10 46 -12",
    },
  ],
  twinbuns: [
    { c: [[20, 4, 13]], strands: "M13 0 Q20 -7 27 0 M14 8 Q20 12 26 8" },
    { c: [[80, 4, 13]], strands: "M73 0 Q80 -7 87 0 M74 8 Q80 12 86 8" },
  ],
  curly: [
    {
      c: [
        [22, 2, 16],
        [50, -8, 16],
        [78, 2, 16],
        [8, 34, 14],
        [92, 34, 14],
        [50, 30, 44],
      ],
      strands:
        "M16 -2 Q22 -8 30 -4 M44 -12 Q50 -16 58 -12 M70 -4 Q78 -8 84 -2 M2 30 Q6 24 12 28 M88 28 Q94 24 98 30 M34 14 Q40 8 46 12 M56 12 Q62 8 68 14",
    },
  ],
  sidepony: [
    {
      d: "M24 16 C-8 18 -12 70 8 100 C8 78 14 58 24 46 Z",
      strands: "M10 28 Q-2 56 8 90 M17 30 Q8 56 12 84 M4 40 Q-4 62 4 84",
    },
  ],
  twinbraids: [
    { d: SHORT_BACK, strands: "M10 52 Q9 66 11 76 M90 52 Q91 66 89 76" },
  ],
  drills: [
    { d: SHORT_BACK, strands: "M10 52 Q9 66 11 76 M90 52 Q91 66 89 76" },
    { c: DRILL_C.slice(0, 5), strands: swirls(DRILL_C.slice(0, 5)) },
    { c: DRILL_C.slice(5), strands: swirls(DRILL_C.slice(5)) },
  ],
  emo: [
    {
      d: SHORT_BACK,
      strands:
        "M10 52 Q9 66 11 76 M90 52 Q91 66 89 76 M18 56 Q17 68 19 78 M82 56 Q83 68 81 78",
    },
  ],
  afro: [
    {
      c: [
        [4, 28, 14],
        [10, 5, 14],
        [27, -12, 14],
        [50, -18, 14],
        [73, -12, 14],
        [90, 5, 14],
        [96, 28, 14],
        [8, 52, 14],
        [92, 52, 14],
        [50, 28, 46],
      ],
      strands:
        "M14 8 Q20 0 28 2 M38 -8 Q46 -12 54 -8 M64 0 Q72 -4 80 4 M6 30 Q10 24 16 26 M84 26 Q90 24 94 30 M2 50 Q6 44 12 48 M88 48 Q94 44 98 50 M24 -14 Q30 -20 38 -16 M60 -20 Q68 -22 74 -16",
    },
  ],
  mullet: [
    {
      d: MULLET_BACK,
      strands:
        "M14 70 Q12 90 16 104 M26 84 Q24 100 28 110 M50 90 V116 M74 84 Q76 100 72 110 M86 70 Q88 90 84 104 M38 92 Q36 104 40 112 M62 92 Q64 104 60 112",
    },
  ],
  manbun: [
    { d: SHORT_BACK, strands: "M10 52 Q9 66 11 76 M90 52 Q91 66 89 76" },
    {
      c: [[50, -10, 13]],
      strands:
        "M42 -14 Q50 -20 58 -14 M44 -6 Q50 -2 56 -6 M40 -8 Q42 -16 46 -18",
    },
  ],
  tousled: [
    {
      d: TOUSLE_BACK,
      strands:
        "M10 52 Q8 62 12 70 M20 56 Q18 66 22 74 M32 62 Q30 70 34 74 M68 62 Q70 70 66 74 M80 56 Q82 66 78 74 M90 52 Q92 62 88 70",
    },
  ],
  curtains: [
    {
      d: CURT_BACK,
      strands:
        "M10 52 Q9 62 11 70 M16 56 Q15 64 17 71 M84 56 Q85 64 83 71 M90 52 Q91 62 89 70",
    },
  ],
  bowl: [
    {
      d: BOWL_BACK,
      strands:
        "M10 54 Q9 60 11 65 M16 56 Q15 62 17 66 M84 56 Q85 62 83 66 M90 54 Q91 60 89 65",
    },
  ],
};

// ---------------------------------------------------------------- painting
/** The gradient every hair piece shares (lit crown, darker ends). Drawn in head coordinates so all pieces agree. */
function Grad({ id, t }: { id: string; t: Tones }) {
  return (
    <linearGradient
      id={id}
      gradientUnits="userSpaceOnUse"
      x1="0"
      y1="-14"
      x2="0"
      y2="128"
    >
      <stop offset="0" stopColor={t.top} />
      <stop offset="0.36" stopColor={t.base} />
      <stop offset="1" stopColor={t.bot} />
    </linearGradient>
  );
}

/** Strands as clumps: a soft cast shadow, a dark line, a light line beside it and a broad glossy band. */
function Strands({ d, t }: { d: string; t: Tones }) {
  return (
    <g fill="none" strokeLinecap="round">
      <path
        d={d}
        stroke={t.light}
        strokeWidth={6.5}
        strokeOpacity={0.16}
        transform="translate(-2.6 -0.6)"
      />
      <path
        d={d}
        stroke={t.deep}
        strokeWidth={5.2}
        strokeOpacity={0.36}
        transform="translate(1.5 1.9)"
      />
      <path d={d} stroke={t.line} strokeWidth={1.9} strokeOpacity={0.9} />
      <path
        d={d}
        stroke={t.light}
        strokeWidth={1.5}
        strokeOpacity={0.7}
        transform="translate(-1.5 -0.9)"
      />
    </g>
  );
}

type MassProps = {
  id: string;
  gid: string;
  t: Tones;
  d?: string;
  c?: Circ[];
  strands?: string;
  children?: ReactNode;
};
function Mass({ id, gid, t, d, c, strands, children }: MassProps) {
  const shape = (grow = 0) =>
    d ? (
      <path d={d} />
    ) : (
      c!.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r + grow} />)
    );
  return (
    <g>
      {/* outline + base colour */}
      {d ? (
        <path
          d={d}
          fill={t.base}
          stroke={INK}
          strokeWidth={4}
          strokeLinejoin="round"
        />
      ) : (
        <>
          <g fill={INK} stroke="none">
            {shape(2)}
          </g>
          <g fill={t.base} stroke="none">
            {shape()}
          </g>
        </>
      )}
      <clipPath id={id}>{shape()}</clipPath>
      <g clipPath={`url(#${id})`} stroke="none">
        <rect x="-60" y="-60" width="220" height="260" fill={`url(#${gid})`} />
        {d && (
          <>
            {/* rim light on the top edges: light stroke, then the shape shifted down covers all but the top sliver */}
            <path
              d={d}
              fill="none"
              stroke={t.light}
              strokeWidth={8}
              strokeOpacity={0.55}
            />
            <path d={d} fill={`url(#${gid})`} transform="translate(0 3.2)" />
            {/* soft inner shadow all around */}
            <path
              d={d}
              fill="none"
              stroke={t.deep}
              strokeWidth={8}
              strokeOpacity={0.18}
            />
          </>
        )}
        {strands && <Strands d={strands} t={t} />}
        {children}
      </g>
      {d && (
        <path
          d={d}
          fill="none"
          stroke={INK}
          strokeWidth={4}
          strokeLinejoin="round"
        />
      )}
    </g>
  );
}

const beadArcs = (x: number, y: number, r: number, mirror = false) => {
  const X = (v: number) => (mirror ? 100 - v : v);
  return `M${X(x - r * 0.6)} ${y - r * 0.2} Q${X(x)} ${y - r * 0.9} ${X(x + r * 0.6)} ${y - r * 0.2} M${X(x - r * 0.45)} ${y + r * 0.35} Q${X(x)} ${y + r * 0.75} ${X(x + r * 0.45)} ${y + r * 0.35}`;
};

/** A hair tie / ribbon knot with a tiny highlight. */
const Tie = ({ x, y, r = 4.5 }: { x: number; y: number; r?: number }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={TIE} stroke={INK} strokeWidth={3} />
    <circle
      cx={x - r * 0.3}
      cy={y - r * 0.3}
      r={r * 0.28}
      fill="#fff"
      fillOpacity={0.7}
      stroke="none"
    />
  </g>
);

// ---- BACK: behind the head and body
export function BackHair({ look, uid = "pet" }: { look: Look; uid?: string }) {
  const items = BACK[look.hair];
  if (!items) return null;
  const t = hairTones(look.hairColor);
  const gid = `${uid}-hbg`;
  return (
    <>
      <defs>
        <Grad id={gid} t={t} />
      </defs>
      {items.map((it, i) => (
        <Mass
          key={i}
          id={`${uid}-hb${i}`}
          gid={gid}
          t={t}
          d={it.d}
          c={it.c}
          strands={it.strands}
        >
          {look.streak && it.streak && (
            <>
              <path
                d="M2 50 V110 H20 V50 Z"
                fill={look.streakColor}
                fillOpacity={0.95}
              />
              <path
                d="M80 50 V110 H98 V50 Z"
                fill={look.streakColor}
                fillOpacity={0.95}
              />
              <Strands
                d="M10 52 Q8 80 12 106 M90 52 Q92 80 88 106"
                t={hairTones(look.streakColor)}
              />
            </>
          )}
        </Mass>
      ))}
      {look.hair === "manbun" && (
        <path d="M42 4 H58" stroke={TIE} strokeWidth={4} />
      )}
    </>
  );
}

// ---- FRONT: on top of the head
export function FrontHair({ look, uid = "pet" }: { look: Look; uid?: string }) {
  const h = look.hair;
  if (h === "none") return null;
  const t = hairTones(look.hairColor);
  const gid = `${uid}-hfg`;
  let n = 0;
  const nid = () => `${uid}-hf${n++}`;
  const fringe = FRINGES[h] ?? FRINGE_JAG;
  const strands = STRANDS_FRONT[h];
  const hp = {
    fill: t.base,
    stroke: INK,
    strokeWidth: 3,
    strokeLinejoin: "round" as const,
  };

  // ---- pieces that sit behind the fringe
  const braidLock = (
    X: (v: number) => number,
    d: string,
    ls: string,
    beads: Circ[],
    tie: [number, number],
    mirror: boolean,
  ) => (
    <>
      <Mass id={nid()} gid={gid} t={t} d={d} strands={ls} />
      <Mass
        id={nid()}
        gid={gid}
        t={t}
        c={beads.map(([x, y, r]) => [X(x), y, r] as Circ)}
        strands={beads.map(([x, y, r]) => beadArcs(x, y, r, mirror)).join(" ")}
      />
      <Tie x={X(tie[0])} y={tie[1]} r={3.5} />
    </>
  );

  return (
    <>
      <defs>
        <Grad id={gid} t={t} />
        <clipPath id={`${uid}-hfhead`}>
          <circle cx="50" cy="45" r="40" />
        </clipPath>
      </defs>

      {/* ahoge: a tapered tuft that curls up from the crown */}
      {look.ahoge && (
        <g>
          <path
            d="M45 10 C38 -12 56 -32 80 -16 C64 -17 57 -8 57 10 Z"
            {...hp}
          />
          <path
            d="M49 6 C46 -10 58 -20 72 -17"
            fill="none"
            stroke={t.light}
            strokeWidth={1.6}
            strokeOpacity={0.8}
          />
          <path
            d="M52 8 C53 -6 62 -12 72 -12"
            fill="none"
            stroke={t.line}
            strokeWidth={1.2}
            strokeOpacity={0.7}
          />
        </g>
      )}

      {h === "braid" &&
        braidLock(
          (v) => v,
          "M90 22 C102 40 100 64 92 78 L72 72 C80 62 82 46 78 22 Z",
          "M88 30 Q95 50 88 70 M81 30 Q85 48 80 64",
          [
            [82, 82, 7.5],
            [82, 95, 7],
            [81, 107, 6.5],
            [80, 118, 5.5],
          ],
          [80, 125],
          false,
        )}
      {h === "twinbraids" &&
        [1, -1].map((s) => {
          const X = (v: number) => (s === 1 ? v : 100 - v);
          return (
            <g key={s}>
              {braidLock(
                X,
                `M${X(10)} 36 C${X(2)} 50 ${X(4)} 70 ${X(12)} 80 L${X(30)} 72 C${X(24)} 62 ${X(22)} 48 ${X(24)} 34 Z`,
                `M${X(14)} 40 Q${X(7)} 56 ${X(14)} 74 M${X(21)} 40 Q${X(17)} 54 ${X(22)} 66`,
                [
                  [18, 82, 8],
                  [17, 95, 7.5],
                  [18, 107, 7],
                  [19, 118, 6],
                ],
                [19, 126],
                s === -1,
              )}
            </g>
          );
        })}
      {h === "emo" && (
        <>
          <Mass
            id={nid()}
            gid={gid}
            t={t}
            d="M8 44 L6 70 Q12 78 18 66 L20 44 Z"
            strands="M12 48 Q11 62 13 72"
          />
          <Mass
            id={nid()}
            gid={gid}
            t={t}
            d="M92 44 L94 70 Q88 78 82 66 L80 44 Z"
            strands="M88 48 Q89 62 87 72"
          />
        </>
      )}
      {h === "mullet" && (
        <>
          <Mass
            id={nid()}
            gid={gid}
            t={t}
            d="M8 44 L6 68 L16 60 L16 44 Z"
            strands="M11 48 Q10 58 12 64"
          />
          <Mass
            id={nid()}
            gid={gid}
            t={t}
            d="M92 44 L94 68 L84 60 L84 44 Z"
            strands="M89 48 Q90 58 88 64"
          />
        </>
      )}
      {h === "layered" && (
        <>
          <Mass
            id={nid()}
            gid={gid}
            t={t}
            d="M9 44 Q4 64 8 84 Q16 76 18 56 L18 44 Z"
            strands="M10 52 Q8 66 10 78 M14 50 Q13 62 14 72"
          />
          <Mass
            id={nid()}
            gid={gid}
            t={t}
            d="M91 44 Q96 64 92 84 Q84 76 82 56 L82 44 Z"
            strands="M90 52 Q92 66 90 78 M86 50 Q87 62 86 72"
          />
        </>
      )}
      {(h === "curtains" || h === "wolf") && (
        <>
          {/* long sideburns in front of the ears */}
          <Mass
            id={nid()}
            gid={gid}
            t={t}
            d="M9 44 Q5 56 8 68 Q15 62 17 50 L17 44 Z"
            strands="M11 48 Q9 58 11 64"
          />
          <Mass
            id={nid()}
            gid={gid}
            t={t}
            d="M91 44 Q95 56 92 68 Q85 62 83 50 L83 44 Z"
            strands="M89 48 Q91 58 89 64"
          />
        </>
      )}

      {/* flyaway tufts */}
      {(FLY[h] ?? []).map((f, i) => (
        <path
          key={i}
          d={f.d}
          {...hp}
          transform={f.mirror ? "matrix(-1 0 0 1 100 0)" : undefined}
        />
      ))}

      {/* the fringe throws a soft shadow on the forehead */}
      <g clipPath={`url(#${uid}-hfhead)`} stroke="none">
        <path
          d={fringe}
          transform="translate(0 7)"
          fill="#5a3320"
          fillOpacity={0.1}
        />
        <path
          d={fringe}
          transform="translate(0 3.5)"
          fill="#5a3320"
          fillOpacity={0.2}
        />
      </g>

      <Mass id={nid()} gid={gid} t={t} d={fringe} strands={strands}>
        {look.streak && (
          <>
            <path
              d="M24 0 Q14 22 20 46 L33 44 Q31 24 40 2 Z"
              fill={look.streakColor}
            />
            <path
              d="M76 0 Q86 22 80 46 L67 44 Q69 24 60 2 Z"
              fill={look.streakColor}
            />
            <Strands
              d="M26 6 Q20 24 24 40 M74 6 Q80 24 76 40"
              t={hairTones(look.streakColor)}
            />
          </>
        )}
        {/* glossy shine */}
        <path
          d="M24 16 Q40 3 62 8"
          fill="none"
          stroke={t.shine}
          strokeOpacity={0.34}
          strokeWidth={3.4}
          strokeLinecap="round"
        />
        <path
          d="M68 10 Q74 12 78 16"
          fill="none"
          stroke={t.shine}
          strokeOpacity={0.3}
          strokeWidth={2.4}
          strokeLinecap="round"
        />
        <circle cx="31" cy="12" r="1.3" fill="#fff" fillOpacity={0.75} />
      </Mass>

      {h === "undercut" && (
        <g clipPath={`url(#${uid}-hfhead)`}>
          {/* shaved sides: darker, with fine stubble lines */}
          <path
            d="M9 44 C6 28 9 20 17 17 L20 38 Z"
            fill={t.deep}
            fillOpacity=".5"
            stroke="none"
          />
          <path
            d="M91 44 C94 28 91 20 83 17 L80 38 Z"
            fill={t.deep}
            fillOpacity=".5"
            stroke="none"
          />
          <path
            d="M11 40 L16 24 M14 42 L18 28 M89 40 L84 24 M86 42 L82 28"
            stroke={t.line}
            strokeWidth={1}
            strokeOpacity={0.7}
            fill="none"
          />
        </g>
      )}
      {h === "sidepart" && (
        <path
          d="M62 14 Q65 8 67 3"
          fill="none"
          stroke={INK}
          strokeWidth="2.5"
        />
      )}

      {h === "twintails" && (
        <>
          <Tie x={18} y={38} />
          <Tie x={82} y={38} />
        </>
      )}
      {h === "drills" && (
        <>
          <Tie x={18} y={42} />
          <Tie x={82} y={42} />
        </>
      )}
      {h === "ponytail" && <Tie x={80} y={18} />}
      {h === "sidepony" && <Tie x={20} y={18} />}
      {h === "halfup" && (
        <g fill={TIE} stroke={INK} strokeWidth="3" strokeLinejoin="round">
          <path d="M50 2 L34 -6 L34 12 Z M50 2 L66 -6 L66 12 Z" />
          <circle cx="50" cy="3" r="4" />
        </g>
      )}
      {h === "hime" && (
        <>
          <Mass
            id={nid()}
            gid={gid}
            t={t}
            d="M8 40 V96 Q8 104 16 104 Q24 104 24 96 V52 Z"
            strands="M14 56 V94 M18 56 V96 M11 60 V98"
          />
          <Mass
            id={nid()}
            gid={gid}
            t={t}
            d="M92 40 V96 Q92 104 84 104 Q76 104 76 96 V52 Z"
            strands="M86 56 V94 M82 56 V96 M89 60 V98"
          />
        </>
      )}

      {/* ---- clips */}
      {look.clip === "star" && (
        <path
          d="M24 19 L26.4 24.8 L32.6 25.2 L27.8 29.2 L29.3 35.3 L24 32 L18.7 35.3 L20.2 29.2 L15.4 25.2 L21.6 24.8 Z"
          fill={look.clipColor}
          stroke={INK}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      )}
      {look.clip === "heart" && (
        <path
          d="M76 36 C64 28 68 18 76 24 C84 18 88 28 76 36 Z"
          fill={look.clipColor}
          stroke={INK}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      )}
      {look.clip === "flower" && (
        <g>
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
            return (
              <circle
                key={`o${i}`}
                cx={74 + Math.cos(a) * 7}
                cy={26 + Math.sin(a) * 7}
                r="6.2"
                fill={INK}
                stroke="none"
              />
            );
          })}
          <circle cx="74" cy="26" r="9" fill={INK} stroke="none" />
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
            return (
              <circle
                key={`p${i}`}
                cx={74 + Math.cos(a) * 7}
                cy={26 + Math.sin(a) * 7}
                r="4.4"
                fill={look.clipColor}
                stroke="none"
              />
            );
          })}
          <circle cx="74" cy="26" r="7" fill={look.clipColor} stroke="none" />
          <circle
            cx="74"
            cy="26"
            r="2.6"
            fill="#f6c24a"
            stroke={INK}
            strokeWidth="1.3"
          />
          <path
            d="M69 20 Q72 17 76 18"
            fill="none"
            stroke="#fff"
            strokeOpacity=".5"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </g>
      )}
      {look.clip === "x" && (
        <>
          <path
            d="M16 22 l12 12 M28 22 l-12 12"
            stroke={INK}
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M16 22 l12 12 M28 22 l-12 12"
            stroke={look.clipColor}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </>
      )}
      {look.clip === "pins" && (
        <>
          <path
            d="M18 20 L26 32 M24 18 L32 30"
            stroke={INK}
            strokeWidth="6.5"
            strokeLinecap="round"
          />
          <path
            d="M18 20 L26 32 M24 18 L32 30"
            stroke={look.clipColor}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      )}
      {look.clip === "bunny" && (
        <g strokeWidth="2.5">
          <ellipse cx="74" cy="20" rx="3" ry="7" fill={look.clipColor} />
          <ellipse cx="82" cy="20" rx="3" ry="7" fill={look.clipColor} />
          <circle cx="78" cy="31" r="8" fill={look.clipColor} />
          <circle cx="75" cy="30" r="1.3" fill={INK} stroke="none" />
          <circle cx="81" cy="30" r="1.3" fill={INK} stroke="none" />
        </g>
      )}
      {look.clip === "ribbons" && (
        <g fill={look.clipColor} strokeWidth="3" strokeLinejoin="round">
          <path d="M22 8 L8 0 L8 16 Z M22 8 L36 0 L36 16 Z" />
          <path d="M78 8 L64 0 L64 16 Z M78 8 L92 0 L92 16 Z" />
          <circle cx="22" cy="8" r="3.5" />
          <circle cx="78" cy="8" r="3.5" />
        </g>
      )}
    </>
  );
}
