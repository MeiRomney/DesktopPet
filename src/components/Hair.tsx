import { INK } from "../constants";
import type { Look, HairId } from "../characters";

/**
 * All hair drawing. Coordinates are the head's (circle centered 50,45, radius 40), same as before.
 * BackHair is drawn behind the head and body, FrontHair on top of the head (cap, fringe, locks, braids).
 * Every style gets: a soft shadow under the fringe, strand lines (in a tone derived from the hair color) and a glossy shine.
 */

const TIE = "#ff6b8b";
const TOP = "M8 44 C2 -14 98 -14 92 44";

// ---- fringes (the part of the hair that lies on the forehead) ----
const FRINGE_JAG = `${TOP} L86 32 L78 38 L72 24 L64 34 L56 22 L48 34 L40 24 L32 36 L24 28 L16 38 L10 34 Z`;
const FRINGE_SOFT = `${TOP} L90 30 Q50 42 10 30 Z`;
const SPIKY =
  "M8 44 L2 24 L14 26 L8 6 L24 16 L30 -6 L42 10 L52 -10 L62 10 L74 -6 L78 16 L92 6 L86 26 L98 24 L92 44 L86 32 L78 38 L72 24 L64 34 L56 22 L48 34 L40 24 L32 36 L24 28 L16 38 L10 34 Z";
const FRINGE_BLUNT = `${TOP} L91 28 L9 28 Z`;
const FRINGE_CURLY = `${TOP} Q86 30 80 36 Q74 22 66 32 Q58 20 50 30 Q42 20 34 32 Q26 22 20 36 Q14 30 8 44 Z`;
const FRINGE_PIXIE = `${TOP} L92 26 Q70 18 52 34 Q36 22 8 32 Z`;
// new
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
};

// ---- strand lines on the fringe ----
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
};

// ---- helpers ----
const hex = (c: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(c);
  const n = m ? parseInt(m[1], 16) : 0x3b2a20;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
/** Strand tone: darker than the hair, or lighter when the hair is already very dark. */
export function strandTone(c: string) {
  const [r, g, b] = hex(c);
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  const f = (v: number) =>
    Math.round(lum < 70 ? v + (255 - v) * 0.3 : v * 0.7)
      .toString(16)
      .padStart(2, "0");
  return `#${f(r)}${f(g)}${f(b)}`;
}

// ---- BACK: behind the head and body ----
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

export function BackHair({ look }: { look: Look }) {
  const hp = { fill: look.hairColor, stroke: INK, strokeWidth: 4 };
  const tone = strandTone(look.hairColor);
  const st = {
    fill: "none",
    stroke: tone,
    strokeWidth: 1.8,
    strokeOpacity: 0.6,
  };
  const h = look.hair;
  return (
    <>
      {look.streak &&
        ["long", "hime", "wavy", "bob", "layered", "halfup", "wolf"].includes(
          h,
        ) && (
          <>
            <path
              d="M8 50 V104 H18 V50 Z"
              fill={look.streakColor}
              stroke="none"
            />
            <path
              d="M92 50 V104 H82 V50 Z"
              fill={look.streakColor}
              stroke="none"
            />
          </>
        )}
      {h === "bob" && (
        <>
          <path d={BOB_BACK} {...hp} />
          <path
            d="M10 50 Q9 64 11 76 M16 56 Q15 66 16 77 M84 56 Q85 66 84 77 M90 50 Q91 64 89 76"
            {...st}
          />
        </>
      )}
      {(h === "long" || h === "hime" || h === "halfup") && (
        <>
          <path d={LONG_BACK} {...hp} />
          <path
            d="M12 64 Q10 92 14 118 M22 80 Q20 100 24 120 M34 88 Q32 104 34 122 M66 88 Q68 104 66 122 M78 80 Q80 100 76 120 M88 64 Q90 92 86 118"
            {...st}
          />
        </>
      )}
      {h === "layered" && (
        <>
          <path d={LAYERED_BACK} {...hp} />
          <path
            d="M12 64 Q10 92 14 118 M22 80 Q20 102 22 122 M34 90 Q32 108 36 124 M50 92 V126 M66 90 Q68 108 64 124 M78 80 Q80 102 78 122 M88 64 Q90 92 86 118"
            {...st}
          />
        </>
      )}
      {h === "wolf" && (
        <>
          <path d={WOLF_BACK} {...hp} />
          <path
            d="M12 60 Q10 78 14 92 M22 70 Q20 84 24 96 M34 76 Q32 88 36 96 M66 76 Q68 88 64 96 M78 70 Q80 84 76 96 M88 60 Q90 78 86 92"
            {...st}
          />
        </>
      )}
      {h === "wavy" && (
        <>
          <path d={WAVY_BACK} {...hp} />
          <path
            d="M12 64 Q8 82 14 100 M24 80 Q18 94 26 106 M76 80 Q82 94 74 106 M88 64 Q92 82 86 100"
            {...st}
          />
        </>
      )}
      {h === "twintails" && (
        <>
          <path d="M16 34 C-6 40 -12 92 6 112 C20 100 26 70 26 46 Z" {...hp} />
          <path
            d="M84 34 C106 40 112 92 94 112 C80 100 74 70 74 46 Z"
            {...hp}
          />
          <path
            d="M10 50 Q2 78 8 104 M17 54 Q12 78 14 100 M90 50 Q98 78 92 104 M83 54 Q88 78 86 100"
            {...st}
          />
        </>
      )}
      {h === "ponytail" && (
        <>
          <path d="M76 16 C108 18 112 70 92 100 C92 78 86 58 76 46 Z" {...hp} />
          <path d="M88 24 Q100 50 94 88 M82 30 Q92 56 90 90" {...st} />
        </>
      )}
      {h === "bun" && <circle cx="50" cy="-4" r="13" {...hp} />}
      {h === "twinbuns" && (
        <>
          <circle cx="20" cy="4" r="13" {...hp} />
          <circle cx="80" cy="4" r="13" {...hp} />
          <path d="M14 -2 Q20 -6 26 -2 M74 -2 Q80 -6 86 -2" {...st} />
        </>
      )}
      {h === "curly" && (
        <>
          {[
            [22, 2, 16],
            [50, -8, 16],
            [78, 2, 16],
            [8, 34, 14],
            [92, 34, 14],
          ].map(([x, y, r]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r={r} {...hp} />
          ))}
          <circle cx="50" cy="30" r="44" fill={look.hairColor} stroke="none" />
          <path
            d="M16 -2 Q22 -8 30 -4 M44 -12 Q50 -16 58 -12 M70 -4 Q78 -8 84 -2 M2 30 Q6 24 12 28 M88 28 Q94 24 98 30"
            {...st}
          />
        </>
      )}
      {h === "sidepony" && (
        <>
          <path d="M24 16 C-8 18 -12 70 8 100 C8 78 14 58 24 46 Z" {...hp} />
          <path d="M10 28 Q-2 56 8 90 M17 30 Q8 56 12 84" {...st} />
        </>
      )}
      {/* ---- new ---- */}
      {h === "twinbraids" && <path d={SHORT_BACK} {...hp} />}
      {h === "drills" && (
        <>
          <path d={SHORT_BACK} {...hp} />
          {/* two drill curls: stacked, shrinking loops */}
          {[
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
          ].map(([x, y, r]) => (
            <g key={`${x}${y}`}>
              <circle cx={x} cy={y} r={r} {...hp} />
              <path
                d={`M${x - r * 0.6} ${y - r * 0.2} Q${x} ${y - r * 0.9} ${x + r * 0.6} ${y - r * 0.2}`}
                {...st}
              />
            </g>
          ))}
        </>
      )}
      {h === "emo" && (
        <>
          <path d={SHORT_BACK} {...hp} />
          <path d="M10 52 Q9 66 11 76 M90 52 Q91 66 89 76" {...st} />
        </>
      )}
      {h === "afro" && (
        <>
          {[
            [4, 28],
            [10, 5],
            [27, -12],
            [50, -18],
            [73, -12],
            [90, 5],
            [96, 28],
            [8, 52],
            [92, 52],
          ].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="14" {...hp} />
          ))}
          <circle cx="50" cy="28" r="46" fill={look.hairColor} stroke="none" />
          <path
            d="M14 8 Q20 0 28 2 M38 -8 Q46 -12 54 -8 M64 0 Q72 -4 80 4 M6 30 Q10 24 16 26 M84 26 Q90 24 94 30"
            {...st}
          />
        </>
      )}
      {h === "mullet" && (
        <>
          <path d={MULLET_BACK} {...hp} />
          <path
            d="M14 70 Q12 90 16 104 M26 84 Q24 100 28 110 M50 90 V116 M74 84 Q76 100 72 110 M86 70 Q88 90 84 104"
            {...st}
          />
        </>
      )}
      {h === "manbun" && (
        <>
          <path d={SHORT_BACK} {...hp} />
          <circle cx="50" cy="-10" r="13" {...hp} />
          <path d="M42 -14 Q50 -20 58 -14 M44 -6 Q50 -2 56 -6" {...st} />
          <path d="M42 4 H58" stroke={TIE} strokeWidth="4" />
        </>
      )}
    </>
  );
}

// ---- FRONT: on top of the head ----
export function FrontHair({ look }: { look: Look }) {
  const h = look.hair;
  if (h === "none") return null;
  const hp = { fill: look.hairColor, stroke: INK, strokeWidth: 4 };
  const tone = strandTone(look.hairColor);
  const st = {
    fill: "none",
    stroke: tone,
    strokeWidth: 1.8,
    strokeOpacity: 0.6,
  };
  const fringe = FRINGES[h] ?? FRINGE_JAG;
  const strands = STRANDS_FRONT[h];
  return (
    <>
      {look.ahoge && (
        <>
          <path
            d="M50 4 C46 -12 60 -22 68 -12"
            fill="none"
            stroke={INK}
            strokeWidth="9"
          />
          <path
            d="M50 4 C46 -12 60 -22 68 -12"
            fill="none"
            stroke={look.hairColor}
            strokeWidth="4.5"
          />
        </>
      )}
      {h === "braid" && (
        <>
          {/* the lock starts inside the hair cap, so it reads as part of the same hair */}
          <path
            d="M90 22 C102 40 100 64 92 78 L72 72 C80 62 82 46 78 22 Z"
            {...hp}
          />
          {[
            [82, 82, 7.5],
            [82, 95, 7],
            [81, 107, 6.5],
            [80, 118, 5.5],
          ].map(([x, y, r]) => (
            <circle key={y} cx={x} cy={y} r={r} {...hp} />
          ))}
          <circle cx="80" cy="125" r="3.5" fill={TIE} strokeWidth="3" />
        </>
      )}
      {h === "twinbraids" &&
        [1, -1].map((s) => {
          const X = (x: number) => (s === 1 ? x : 100 - x);
          return (
            <g key={s}>
              <path
                d={`M${X(10)} 36 C${X(2)} 50 ${X(4)} 70 ${X(12)} 80 L${X(30)} 72 C${X(24)} 62 ${X(22)} 48 ${X(24)} 34 Z`}
                {...hp}
              />
              {[
                [18, 82, 8],
                [17, 95, 7.5],
                [18, 107, 7],
                [19, 118, 6],
              ].map(([x, y, r]) => (
                <g key={y}>
                  <circle cx={X(x)} cy={y} r={r} {...hp} />
                  <path
                    d={`M${X(x - r * 0.5)} ${y - r * 0.3} Q${X(x)} ${y - r * 0.8} ${X(x + r * 0.5)} ${y - r * 0.3}`}
                    {...st}
                  />
                </g>
              ))}
              <circle cx={X(19)} cy="126" r="3.5" fill={TIE} strokeWidth="3" />
            </g>
          );
        })}
      {h === "emo" && (
        <>
          {/* long side locks */}
          <path d="M8 44 L6 70 Q12 78 18 66 L20 44 Z" {...hp} />
          <path d="M92 44 L94 70 Q88 78 82 66 L80 44 Z" {...hp} />
        </>
      )}
      {h === "mullet" && (
        <>
          <path d="M8 44 L6 68 L16 60 L16 44 Z" {...hp} />
          <path d="M92 44 L94 68 L84 60 L84 44 Z" {...hp} />
        </>
      )}
      {h === "layered" && (
        <>
          {/* face-framing locks */}
          <path d="M9 44 Q4 64 8 84 Q16 76 18 56 L18 44 Z" {...hp} />
          <path d="M91 44 Q96 64 92 84 Q84 76 82 56 L82 44 Z" {...hp} />
        </>
      )}
      {/* soft shadow the fringe casts on the forehead */}
      <path
        d={fringe}
        transform="translate(0 3)"
        fill="#000"
        fillOpacity=".12"
        stroke="none"
      />
      <path d={fringe} {...hp} />
      {h === "undercut" && (
        <>
          {/* shaved sides */}
          <path
            d="M9 44 C6 28 9 20 17 17 L20 38 Z"
            fill={tone}
            fillOpacity=".5"
            stroke="none"
          />
          <path
            d="M91 44 C94 28 91 20 83 17 L80 38 Z"
            fill={tone}
            fillOpacity=".5"
            stroke="none"
          />
        </>
      )}
      {h === "sidepart" && (
        <path
          d="M62 14 Q65 8 67 3"
          fill="none"
          stroke={INK}
          strokeWidth="2.5"
        />
      )}
      {strands && <path d={strands} {...st} />}
      {/* glossy shine */}
      <path
        d="M24 16 Q40 4 62 8"
        fill="none"
        stroke="#fff"
        strokeOpacity=".4"
        strokeWidth="4"
      />
      <path
        d="M68 10 Q74 12 78 16"
        fill="none"
        stroke="#fff"
        strokeOpacity=".3"
        strokeWidth="3"
      />
      {h === "twintails" && (
        <>
          <circle cx="18" cy="38" r="4.5" fill={TIE} strokeWidth="3" />
          <circle cx="82" cy="38" r="4.5" fill={TIE} strokeWidth="3" />
        </>
      )}
      {h === "drills" && (
        <>
          <circle cx="18" cy="42" r="4.5" fill={TIE} strokeWidth="3" />
          <circle cx="82" cy="42" r="4.5" fill={TIE} strokeWidth="3" />
        </>
      )}
      {h === "ponytail" && (
        <circle cx="80" cy="18" r="4.5" fill={TIE} strokeWidth="3" />
      )}
      {h === "halfup" && (
        <g fill={TIE} strokeWidth="3">
          <path d="M50 2 L34 -6 L34 12 Z M50 2 L66 -6 L66 12 Z" />
          <circle cx="50" cy="3" r="4" />
        </g>
      )}
      {h === "hime" && (
        <>
          <path d="M8 40 V96 Q8 104 16 104 Q24 104 24 96 V52 Z" {...hp} />
          <path d="M92 40 V96 Q92 104 84 104 Q76 104 76 96 V52 Z" {...hp} />
          <path d="M14 56 V94 M18 56 V96 M82 56 V96 M86 56 V94" {...st} />
        </>
      )}
      {h === "sidepony" && (
        <circle cx="20" cy="18" r="4.5" fill={TIE} strokeWidth="3" />
      )}
      {look.streak && (
        <>
          <path
            d="M30 6 Q20 22 24 40 L33 38 Q31 24 38 8 Z"
            fill={look.streakColor}
            stroke="none"
          />
          <path
            d="M70 6 Q80 22 76 40 L67 38 Q69 24 62 8 Z"
            fill={look.streakColor}
            stroke="none"
          />
        </>
      )}
      {look.clip === "star" && (
        <path
          d="M24 19 L26.4 24.8 L32.6 25.2 L27.8 29.2 L29.3 35.3 L24 32 L18.7 35.3 L20.2 29.2 L15.4 25.2 L21.6 24.8 Z"
          fill={look.clipColor}
          stroke={INK}
          strokeWidth="2.5"
        />
      )}
      {look.clip === "heart" && (
        <path
          d="M76 36 C64 28 68 18 76 24 C84 18 88 28 76 36 Z"
          fill={look.clipColor}
          stroke={INK}
          strokeWidth="2.5"
        />
      )}
      {look.clip === "x" && (
        <>
          <path d="M16 22 l12 12 M28 22 l-12 12" stroke={INK} strokeWidth="7" />
          <path
            d="M16 22 l12 12 M28 22 l-12 12"
            stroke={look.clipColor}
            strokeWidth="3.5"
          />
        </>
      )}
      {look.clip === "pins" && (
        <>
          <path
            d="M18 20 L26 32 M24 18 L32 30"
            stroke={INK}
            strokeWidth="6.5"
          />
          <path
            d="M18 20 L26 32 M24 18 L32 30"
            stroke={look.clipColor}
            strokeWidth="3"
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
        <g fill={look.clipColor} strokeWidth="3">
          <path d="M22 8 L8 0 L8 16 Z M22 8 L36 0 L36 16 Z" />
          <path d="M78 8 L64 0 L64 16 Z M78 8 L92 0 L92 16 Z" />
          <circle cx="22" cy="8" r="3.5" />
          <circle cx="78" cy="8" r="3.5" />
        </g>
      )}
    </>
  );
}
