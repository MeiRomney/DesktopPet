import type { ReactNode } from "react";
import type { Pose } from "../reactions";
import { INK, BODY_SCALE as S, VB_H, FEET_Y } from "../constants";
import type { Eyes } from "../types";
import { DEFAULT_LOOK } from "../characters";
import type { Look, ShirtId, ShoeId } from "../characters";
import { BackHair, FrontHair } from "./Hair";
import { lum, mix, shade, tint } from "../colors";

const DEFAULT_EYES: Eyes = {
  size: 1,
  pupil: 1,
  gap: 22,
  pupilColor: INK,
  track: true,
};
const SLEEVE: Record<ShirtId, number> = {
  none: 0,
  tank: 0,
  tee: 38,
  stripe: 38,
  polo: 36,
  long: 92,
  hoodie: 92,
  crop: 38,
  sailor: 38,
  dress: 0,
  sweater: 92,
  offshoulder: 92,
  halter: 0,
  blazer: 92,
  jacket: 92,
  gakuran: 92,
  jersey: 92,
  cardigan: 92,
};
/** Garments worn over the waistband (they cover the top of the pants). The rest are tucked in. */
const OUTER: ShirtId[] = [
  "hoodie",
  "jersey",
  "jacket",
  "blazer",
  "gakuran",
  "cardigan",
  "sweater",
];
const OUTER_BOTTOM = 132;

const GOLD = "#f1d27a";

// Shirt: flares out below the chest so it covers the hips. Not clipped to the body.
const SHIRT =
  "M36 80 C27 92 22 102 23 112 C19 122 20 132 22 138 Q50 148 78 138 C80 132 81 122 77 112 C78 102 73 92 64 80 Z";
const SHIRT_CLIP =
  "M30 82 C26 94 20 116 24 134 Q31 148 50 148 Q69 148 76 136 C80 116 74 94 70 82 Z";

const SKIRT_D =
  "M23.5 110 C20 119 8 130 6 149 Q18 155 30 149 Q40 155 50 150 Q60 155 70 149 Q82 155 94 149 C92 130 80 119 76.5 110 Z";
const SKIRT_HEM =
  "M6 149 Q18 155 30 149 Q40 155 50 150 Q60 155 70 149 Q82 155 94 149";
const MINI_D =
  "M19 118 C15 126 9 136 4 146 Q16 151 28 146 Q39 151 50 147 Q61 151 72 146 Q84 151 96 146 C91 136 85 126 81 118 Z";

/**
 * Chibi proportions (see constants.ts): the head, hair, face and hats are drawn at full size, while the torso,
 * arms, clothes and legs are drawn in their ORIGINAL coordinates inside groups that are shrunk by BODY_SCALE.
 * Everything inside keeps its own local coordinates, so the CSS pivots (arms 33/88, legs 37/116, head 50/82)
 * and every outfit path still line up. Only the .upper hip pivot is in outer coordinates (see emotes.css).
 *  - BODY_T shrinks the body about the neck (50, 82), so the shoulders stay tucked under the chin.
 *  - LEG_T shrinks the legs so the feet land on FEET_Y.
 *  - sw(n) gives a stroke width that still looks like n after the shrink, so outlines match the head's.
 */
const sw = (n: number) => Math.round((n / S) * 100) / 100;
const BODY_T = `translate(${(50 * (1 - S)).toFixed(2)} ${(82 * (1 - S)).toFixed(2)}) scale(${S})`;
const LEG_T = `translate(${(50 * (1 - S)).toFixed(2)} ${(FEET_Y - 172 * S).toFixed(2)}) scale(${S})`;

/** A soft line used for folds, seams, stitching. Widths are "visual" (see sw). */
const ln = (
  d: string,
  stroke: string,
  w = 1.8,
  o = 0.5,
  extra: Record<string, unknown> = {},
) => (
  <path
    d={d}
    fill="none"
    stroke={stroke}
    strokeWidth={sw(w)}
    strokeOpacity={o}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...extra}
  />
);
/** Vertical rib ticks (knitted collars, hems, cuffs). */
const ribs = (d: string, stroke: string, w: number, o = 0.4) =>
  ln(d, stroke, w, o, {
    strokeLinecap: "butt",
    strokeDasharray: `${sw(1.1)} ${sw(2.1)}`,
  });

type Ctx = {
  c: string; // main colour
  dk: string; // dark line colour
  md: string; // slightly darker body (ribbing, collars)
  lt: string; // light tone
  tr: string; // trim / accent
  inn: string; // inner garment
  skin: string;
  top: number;
  bot: number;
};

// ---------------------------------------------------------------- what is on the torso, per shirt (torso coordinates)
const teeNeck = (x: Ctx) => (
  <>
    <path d="M40 80 Q50 91 60 80 Z" fill={x.skin} stroke="none" />
    {ln("M39.5 80 Q50 93 60.5 80", x.dk, 4.5, 0.85)}
    {ln("M41 81 Q50 90.5 59 81", x.lt, 1.2, 0.7)}
  </>
);
const SHIRT_DRAW: Record<ShirtId, (x: Ctx, look: Look) => ReactNode> = {
  none: () => null,
  tee: (x) => (
    <>
      {teeNeck(x)}
      {ln("M27 98 q5 3 8 11 M73 98 q-5 3 -8 11", x.dk, 1.6, 0.4)}
      {ln("M44 104 q6 3 12 0", x.dk, 1.4, 0.3)}
    </>
  ),
  long: (x) => (
    <>
      {teeNeck(x)}
      {ln("M27 98 q5 3 8 11 M73 98 q-5 3 -8 11", x.dk, 1.6, 0.4)}
      {ln("M44 104 q6 3 12 0", x.dk, 1.4, 0.3)}
    </>
  ),
  stripe: (x) => (
    <>
      {teeNeck(x)}
      {[90, 98, 106, 114, 122, 130].map((y) => (
        <path
          key={y}
          d={`M10 ${y} Q50 ${y + 3} 90 ${y}`}
          fill="none"
          stroke={x.tr}
          strokeOpacity={0.85}
          strokeWidth="4"
        />
      ))}
      {ln("M27 98 q5 3 8 11 M73 98 q-5 3 -8 11", x.dk, 1.6, 0.35)}
    </>
  ),
  polo: (x) => (
    <>
      <path d="M40 80 L50 97 L60 80 Z" fill={x.skin} stroke="none" />
      <path
        d="M38 79 L50 98 L41 100 L31 86 Z"
        fill={x.lt}
        stroke={x.dk}
        strokeWidth={sw(1.8)}
        strokeLinejoin="round"
      />
      <path
        d="M62 79 L50 98 L59 100 L69 86 Z"
        fill={x.lt}
        stroke={x.dk}
        strokeWidth={sw(1.8)}
        strokeLinejoin="round"
      />
      {ln("M50 98 V114", x.dk, 2, 0.7)}
      <circle
        cx="50"
        cy="103"
        r="1.5"
        fill={tint(x.c, 0.7)}
        stroke={x.dk}
        strokeWidth={sw(0.8)}
      />
      <circle
        cx="50"
        cy="109"
        r="1.5"
        fill={tint(x.c, 0.7)}
        stroke={x.dk}
        strokeWidth={sw(0.8)}
      />
      <circle
        cx="65"
        cy="101"
        r="2.6"
        fill={x.tr}
        stroke={x.dk}
        strokeWidth={sw(1)}
      />
      {ln("M27 98 q5 3 8 11", x.dk, 1.6, 0.35)}
    </>
  ),
  hoodie: (x) => (
    <>
      <path d="M39 80 Q50 95 61 80 Z" fill={x.skin} stroke="none" />
      {/* hood bunched around the neck */}
      {ln("M30 81 Q50 108 70 81", x.dk, 10.5, 0.9)}
      {ln("M30 81 Q50 108 70 81", x.md, 8.5, 1)}
      {ln("M33 80 Q50 100 67 80", x.lt, 1.6, 0.6)}
      {/* drawstrings */}
      {ln("M44 97 Q42 108 44 118", x.tr, 1.9, 0.95)}
      {ln("M56 97 Q58 108 56 118", x.tr, 1.9, 0.95)}
      <circle cx="44" cy="119" r="1.6" fill={x.dk} stroke="none" />
      <circle cx="56" cy="119" r="1.6" fill={x.dk} stroke="none" />
      {/* kangaroo pocket */}
      <path
        d="M31 111 H69 L73 126 H27 Z"
        fill={shade(x.c, 0.05)}
        fillOpacity={0.9}
        stroke={x.dk}
        strokeOpacity={0.7}
        strokeWidth={sw(1.8)}
        strokeLinejoin="round"
      />
      {ln("M33 113 H67", x.lt, 1.2, 0.35)}
      {ln("M31 111 L28 125 M69 111 L72 125", x.dk, 2, 0.5)}
      {ln("M26 100 q5 3 7 9 M74 100 q-5 3 -7 9", x.dk, 1.6, 0.35)}
    </>
  ),
  jersey: (x) => (
    <>
      <path d="M41 80 Q50 90 59 80 Z" fill={x.skin} stroke="none" />
      {/* stand collar */}
      {ln("M36 80 Q50 102 64 80", x.dk, 9, 0.9)}
      {ln("M36 80 Q50 102 64 80", x.md, 7, 1)}
      {ln("M38 80 Q50 98 62 80", x.lt, 1.3, 0.5)}
      {/* chest bands in the accent colour */}
      {ln("M16 103 Q50 114 84 103", x.tr, 4.2, 0.95)}
      {ln("M15 111 Q50 122 85 111", x.tr, 2.6, 0.95)}
      {/* zip */}
      {ln("M50 96 V132", x.dk, 2.4, 0.8)}
      {ln("M50 96 V132", x.lt, 1.1, 0.9, {
        strokeDasharray: `${sw(1)} ${sw(1.3)}`,
      })}
      <rect
        x="48.4"
        y="94"
        width="3.2"
        height="6"
        rx="1"
        fill={x.lt}
        stroke={x.dk}
        strokeWidth={sw(1)}
      />
      {/* zip pockets */}
      {ln("M31 119 L29 129 M69 119 L71 129", x.dk, 1.8, 0.6)}
      {ln("M26 99 q5 3 7 9 M74 99 q-5 3 -7 9", x.dk, 1.6, 0.35)}
      {/* ribbed hem */}
      <rect
        x="10"
        y={OUTER_BOTTOM - 7}
        width="80"
        height="7"
        fill={x.md}
        stroke="none"
      />
      {ribs(`M10 ${OUTER_BOTTOM - 3.5} H90`, x.dk, 6.5, 0.4)}
      {ln(`M10 ${OUTER_BOTTOM - 7} H90`, x.dk, 1.8, 0.6)}
    </>
  ),
  jacket: (x) => {
    const tie = mix(x.c, "#1b1b2a", 0.55);
    const band = mix(x.tr, "#c8303a", 0.45);
    return (
      <>
        {/* what is under the jacket: vest, red waistband, shirt collar and a tie */}
        <path
          d="M41 82 Q38 110 39 150 H61 Q62 110 59 82 Z"
          fill={x.inn}
          stroke="none"
        />
        <path
          d="M41 82 Q38 110 39 150 H61 Q62 110 59 82 Z"
          fill={shade(x.inn, 0.5)}
          fillOpacity={0.12}
          stroke="none"
        />
        <rect x="38" y="116" width="24" height="9" fill={band} stroke="none" />
        {ln("M38 116 H62", shade(band, 0.4), 1.4, 0.7)}
        <path
          d="M42 80 Q50 91 58 80 Z"
          fill={shade(x.skin, 0.1)}
          stroke="none"
        />
        <path
          d="M41 80 L50 93 L44 95 L37 85 Z"
          fill="#f4f1f1"
          stroke={x.dk}
          strokeWidth={sw(1.5)}
          strokeLinejoin="round"
        />
        <path
          d="M59 80 L50 93 L56 95 L63 85 Z"
          fill="#f4f1f1"
          stroke={x.dk}
          strokeWidth={sw(1.5)}
          strokeLinejoin="round"
        />
        <path
          d="M47.5 91 H52.5 L52 95 H48 Z"
          fill={tie}
          stroke={x.dk}
          strokeWidth={sw(1)}
          strokeLinejoin="round"
        />
        <path
          d="M48 95 H52 L53.5 112 L50 118 L46.5 112 Z"
          fill={tie}
          stroke={x.dk}
          strokeWidth={sw(1.2)}
          strokeLinejoin="round"
        />
        <path
          d="M46.5 112 L50 118 L53.5 112 L50 109.5 Z"
          fill={x.tr}
          stroke={x.dk}
          strokeWidth={sw(1)}
          strokeLinejoin="round"
        />
        {/* hood lying on the shoulders, piped in the accent colour */}
        <path
          d="M32 83 Q50 73 68 83 L65 90 Q50 81 35 90 Z"
          fill={x.md}
          stroke={x.dk}
          strokeWidth={sw(1.6)}
          strokeLinejoin="round"
          opacity={0.0}
        />
        {ln("M33 84 Q50 75 67 84", x.dk, 5.6, 0.9)}
        {ln("M33 84 Q50 75 67 84", x.md, 4, 1)}
        {ln("M34 86 Q41 92 41 98", x.tr, 2.2, 0.95)}
        {ln("M66 86 Q59 92 59 98", x.tr, 2.2, 0.95)}
        {/* piped front edges */}
        {ln("M41 83 Q38 110 39 132", x.dk, 6.2, 0.95)}
        {ln("M59 83 Q62 110 61 132", x.dk, 6.2, 0.95)}
        {ln("M41 83 Q38 110 39 132", x.tr, 4.2, 1)}
        {ln("M59 83 Q62 110 61 132", x.tr, 4.2, 1)}
        {/* hem bands */}
        <path
          d={`M10 ${OUTER_BOTTOM - 7} H38 V${OUTER_BOTTOM + 1} H10 Z`}
          fill={shade(x.c, 0.55)}
          stroke="none"
        />
        <path
          d={`M62 ${OUTER_BOTTOM - 7} H90 V${OUTER_BOTTOM + 1} H62 Z`}
          fill={shade(x.c, 0.55)}
          stroke="none"
        />
        {ln(
          `M10 ${OUTER_BOTTOM - 7.5} H38 M62 ${OUTER_BOTTOM - 7.5} H90`,
          x.tr,
          2.2,
          0.95,
        )}
        {/* creases */}
        {ln("M24 98 q4 5 3 14 M76 98 q-4 5 -3 14", x.dk, 1.6, 0.45)}
        {ln("M27 113 q5 2 9 0 M73 113 q-5 2 -9 0", x.dk, 1.4, 0.35)}
      </>
    );
  },
  blazer: (x) => (
    <>
      <path d="M40 80 L50 114 L60 80 Z" fill={x.inn} stroke="none" />
      <path
        d="M40 80 L50 114 L60 80 Z"
        fill="#000"
        fillOpacity={0.06}
        stroke="none"
      />
      <path d="M41 80 Q50 90 59 80 Z" fill={x.skin} stroke="none" />
      <path
        d="M40 80 L46.5 89 L50 85 Z"
        fill={x.inn}
        stroke={x.dk}
        strokeWidth={sw(1.3)}
        strokeLinejoin="round"
      />
      <path
        d="M60 80 L53.5 89 L50 85 Z"
        fill={x.inn}
        stroke={x.dk}
        strokeWidth={sw(1.3)}
        strokeLinejoin="round"
      />
      {/* tie */}
      <path
        d="M47.5 86 H52.5 L52 91 H48 Z"
        fill={x.tr}
        stroke={x.dk}
        strokeWidth={sw(1)}
        strokeLinejoin="round"
      />
      <path
        d="M48 91 H52 L54 108 L50 113 L46 108 Z"
        fill={x.tr}
        stroke={x.dk}
        strokeWidth={sw(1.2)}
        strokeLinejoin="round"
      />
      {ln("M48.3 98 L53.4 100 M48 104 L53.7 106", x.dk, 1.2, 0.4)}
      {/* lapels */}
      <path
        d="M34 81 L40 80 L49 113 L42 117 L29 95 L30 87 Z"
        fill={x.c}
        stroke={x.dk}
        strokeWidth={sw(1.8)}
        strokeLinejoin="round"
      />
      <path
        d="M66 81 L60 80 L51 113 L58 117 L71 95 L70 87 Z"
        fill={x.c}
        stroke={x.dk}
        strokeWidth={sw(1.8)}
        strokeLinejoin="round"
      />
      {ln("M33 85 L29.5 94 M67 85 L70.5 94", x.lt, 1.4, 0.6)}
      {ln("M30 92 L37 94 L39 88 M70 92 L63 94 L61 88", x.dk, 1.4, 0.6)}
      {/* centre overlap, gold buttons */}
      {ln(`M50 114 V${OUTER_BOTTOM}`, x.dk, 2, 0.7)}
      <circle
        cx="50"
        cy="119"
        r="2.3"
        fill={GOLD}
        stroke={x.dk}
        strokeWidth={sw(1)}
      />
      <circle
        cx="50"
        cy="126"
        r="2.3"
        fill={GOLD}
        stroke={x.dk}
        strokeWidth={sw(1)}
      />
      {/* breast pocket with a crest, hip flaps */}
      <path
        d="M24 104 H37 V111 H24 Z"
        fill="none"
        stroke={x.dk}
        strokeOpacity={0.7}
        strokeWidth={sw(1.5)}
        strokeLinejoin="round"
      />
      <path
        d="M24 104 L26 101 L35 101 L37 104 Z"
        fill={x.inn}
        stroke="none"
        opacity={0.9}
      />
      <circle
        cx="30.5"
        cy="108"
        r="1.7"
        fill={x.tr}
        stroke={x.dk}
        strokeWidth={sw(0.8)}
      />
      {ln("M22 123 H35 M65 123 H78", x.dk, 2.2, 0.65)}
      {ln("M22 125 H35 M65 125 H78", x.lt, 1, 0.3)}
      {ln("M22 99 q-3 5 -1 12 M78 99 q3 5 1 12", x.dk, 1.5, 0.35)}
    </>
  ),
  gakuran: (x) => (
    <>
      <path d="M42 80 Q50 89 58 80 Z" fill={x.skin} stroke="none" />
      {/* stand collar with a pale liner */}
      <path
        d="M35 80 L38 94 Q50 100 62 94 L65 80 Q50 92 35 80 Z"
        fill={x.c}
        stroke={x.dk}
        strokeWidth={sw(1.8)}
        strokeLinejoin="round"
      />
      {ln("M37 82 Q50 94 63 82", "#f4f1f1", 2, 0.9)}
      <circle
        cx="41"
        cy="91"
        r="1.9"
        fill={x.tr}
        stroke={x.dk}
        strokeWidth={sw(0.8)}
      />
      <circle
        cx="59"
        cy="91"
        r="1.9"
        fill={x.tr}
        stroke={x.dk}
        strokeWidth={sw(0.8)}
      />
      {/* button placket */}
      {ln(`M50 97 V${OUTER_BOTTOM}`, x.dk, 2, 0.7)}
      {[102, 110, 118, 126].map((y) => (
        <g key={y}>
          <circle
            cx="50"
            cy={y}
            r="2.3"
            fill={x.tr}
            stroke={x.dk}
            strokeWidth={sw(1)}
          />
          <circle
            cx="49.3"
            cy={y - 0.7}
            r="0.6"
            fill="#fff"
            stroke="none"
            opacity={0.8}
          />
        </g>
      ))}
      {/* shoulder seams and hip pockets */}
      {ln("M30 86 Q35 90 38 98 M70 86 Q65 90 62 98", x.dk, 1.6, 0.45)}
      {ln("M24 121 H38 M62 121 H76", x.dk, 2.2, 0.7)}
      {ln("M24 123 H38 M62 123 H76", x.lt, 1, 0.25)}
      {ln("M31 100 Q35 111 32 120", x.lt, 2, 0.15)}
      {ln("M22 99 q-3 5 -1 12 M78 99 q3 5 1 12", x.dk, 1.5, 0.35)}
    </>
  ),
  cardigan: (x) => (
    <>
      <path d="M40 80 L50 118 L60 80 Z" fill={x.inn} stroke="none" />
      <path d="M41 80 Q50 90 59 80 Z" fill={x.skin} stroke="none" />
      {ln("M41 81 Q50 92 59 81", shade(x.inn, 0.18), 3, 0.9)}
      {/* knitted front bands */}
      {ln("M38 80 L50 118 L62 80", x.dk, 7, 0.75)}
      {ln(`M50 118 V${OUTER_BOTTOM}`, x.dk, 7, 0.75)}
      {ln("M38 80 L50 118 L62 80", x.md, 5.4, 1)}
      {ln(`M50 118 V${OUTER_BOTTOM}`, x.md, 5.4, 1)}
      {ribs("M38 80 L50 118 L62 80", x.dk, 5, 0.3)}
      <circle
        cx="50"
        cy="122"
        r="2.1"
        fill={x.tr}
        stroke={x.dk}
        strokeWidth={sw(1)}
      />
      <circle
        cx="50"
        cy="129"
        r="2.1"
        fill={x.tr}
        stroke={x.dk}
        strokeWidth={sw(1)}
      />
      {/* patch pockets */}
      <path
        d="M24 113 H37 V124 Q30.5 127 24 124 Z"
        fill={shade(x.c, 0.06)}
        stroke={x.dk}
        strokeOpacity={0.7}
        strokeWidth={sw(1.5)}
        strokeLinejoin="round"
      />
      <path
        d="M63 113 H76 V124 Q69.5 127 63 124 Z"
        fill={shade(x.c, 0.06)}
        stroke={x.dk}
        strokeOpacity={0.7}
        strokeWidth={sw(1.5)}
        strokeLinejoin="round"
      />
      {/* ribbed hem */}
      <rect
        x="10"
        y={OUTER_BOTTOM - 7}
        width="80"
        height="7"
        fill={x.md}
        stroke="none"
      />
      {ribs(`M10 ${OUTER_BOTTOM - 3.5} H90`, x.dk, 6.5, 0.4)}
      {ln(`M10 ${OUTER_BOTTOM - 7} H90`, x.dk, 1.8, 0.6)}
      {ln("M24 99 q-3 5 -1 11 M76 99 q3 5 1 11", x.dk, 1.5, 0.35)}
    </>
  ),
  sweater: (x) => (
    <>
      <path d="M40 80 Q50 92 60 80 Z" fill={x.skin} stroke="none" />
      {/* rolled neck */}
      {ln("M37 80 Q50 99 63 80", x.dk, 9.5, 0.9)}
      {ln("M37 80 Q50 99 63 80", x.md, 8, 1)}
      {ribs("M37 80 Q50 99 63 80", x.dk, 8, 0.32)}
      {ln("M40 80 Q50 95 60 80", x.lt, 1.2, 0.5)}
      {/* cable knit */}
      {[36, 50, 64].map((cx) => (
        <g key={cx}>
          {ln(
            `M${cx} 100 q3.5 3 0 6 q-3.5 3 0 6 q3.5 3 0 6 q-3.5 3 0 6 q3.5 3 0 6`,
            x.dk,
            1.7,
            0.45,
          )}
          {ln(
            `M${cx - 1.6} 100 q3.5 3 0 6 q-3.5 3 0 6 q3.5 3 0 6 q-3.5 3 0 6 q3.5 3 0 6`,
            x.lt,
            1.3,
            0.55,
          )}
        </g>
      ))}
      {ln("M43 100 V130 M57 100 V130", x.dk, 1.2, 0.3)}
      <rect
        x="10"
        y={OUTER_BOTTOM - 7}
        width="80"
        height="7"
        fill={x.md}
        stroke="none"
      />
      {ribs(`M10 ${OUTER_BOTTOM - 3.5} H90`, x.dk, 6.5, 0.4)}
      {ln(`M10 ${OUTER_BOTTOM - 7} H90`, x.dk, 1.8, 0.6)}
      {ln("M24 99 q-3 5 -1 11 M76 99 q3 5 1 11", x.dk, 1.5, 0.35)}
    </>
  ),
  tank: (x) => (
    <>
      <path d="M36 80 Q50 106 64 80 Z" fill={x.skin} stroke="none" />
      {ln("M35.5 80 Q50 108 64.5 80", x.dk, 3, 0.85)}
      {ln("M37 81 Q50 105 63 81", x.lt, 1.1, 0.6)}
      {ln("M25 88 Q31 98 28 112 M75 88 Q69 98 72 112", x.dk, 1.8, 0.45)}
      {ln("M44 104 q6 3 12 0", x.dk, 1.4, 0.3)}
    </>
  ),
  crop: (x) => (
    <>
      {teeNeck(x)}
      {ln("M27 98 q5 3 8 9 M73 98 q-5 3 -8 9", x.dk, 1.6, 0.4)}
      {ln(`M10 ${x.bot - 6} Q50 ${x.bot - 1} 90 ${x.bot - 6}`, x.tr, 2.2, 0.9)}
    </>
  ),
  sailor: (x) => {
    const stripe = lum(x.tr) > 200 ? shade(x.tr, 0.3) : "#ffffff";
    return (
      <>
        <path
          d="M40 80 L50 106 L60 80 Z"
          fill={shade(x.c, 0.08)}
          stroke="none"
        />
        <path d="M42 80 Q50 90 58 80 Z" fill={x.skin} stroke="none" />
        {/* big square collar with two stripes */}
        <path
          d="M30 82 L50 108 L70 82 L62 79 L50 95 L38 79 Z"
          fill={x.tr}
          stroke={x.dk}
          strokeWidth={sw(1.6)}
          strokeLinejoin="round"
        />
        {ln("M33 84 L50 105 L67 84", stripe, 1.3, 0.95)}
        {ln("M36 82.5 L50 100.5 L64 82.5", stripe, 1.1, 0.95)}
        {/* neckerchief */}
        <path
          d="M50 102 L40 98 L39 111 Z"
          fill={x.inn}
          stroke={x.dk}
          strokeWidth={sw(1.4)}
          strokeLinejoin="round"
        />
        <path
          d="M50 102 L60 98 L61 111 Z"
          fill={x.inn}
          stroke={x.dk}
          strokeWidth={sw(1.4)}
          strokeLinejoin="round"
        />
        <circle
          cx="50"
          cy="102"
          r="3.1"
          fill={x.inn}
          stroke={x.dk}
          strokeWidth={sw(1.4)}
        />
        {ln("M27 98 q5 3 8 9", x.dk, 1.6, 0.35)}
      </>
    );
  },
  dress: (x) => (
    <>
      <path
        d="M38 80 Q44 94 50 89 Q56 94 62 80 Z"
        fill={x.skin}
        stroke="none"
      />
      {ln("M37.5 80 Q44 97 50 91 Q56 97 62.5 80", x.tr, 2.6, 0.95)}
      {ln("M40 96 Q43 102 41 108 M60 96 Q57 102 59 108", x.dk, 1.5, 0.3)}
      {/* waist ribbon with a bow */}
      <rect x="10" y="102" width="80" height="6" fill={x.tr} stroke="none" />
      {ln("M10 102 H90 M10 108 H90", x.dk, 1.2, 0.35)}
      <path
        d="M50 105 L38 98 L38 112 Z M50 105 L62 98 L62 112 Z"
        fill={x.tr}
        stroke={x.dk}
        strokeWidth={sw(1.4)}
        strokeLinejoin="round"
      />
      <circle
        cx="50"
        cy="105"
        r="3"
        fill={x.tr}
        stroke={x.dk}
        strokeWidth={sw(1.4)}
      />
    </>
  ),
  offshoulder: (x) => (
    <>
      {/* ruffled neckline */}
      <path
        d={`M10 92 ${"q5 -8 10 0 ".repeat(8)}V99 H10 Z`}
        fill={x.lt}
        stroke={x.dk}
        strokeWidth={sw(1.5)}
        strokeLinejoin="round"
      />
      {ln("M10 99 H90", x.dk, 1.6, 0.5)}
      {ln(
        "M15 93 V98 M25 93 V98 M35 93 V98 M45 93 V98 M55 93 V98 M65 93 V98 M75 93 V98 M85 93 V98",
        x.dk,
        1.1,
        0.3,
      )}
      {ln("M44 108 q6 3 12 0", x.dk, 1.4, 0.3)}
    </>
  ),
  halter: (x) => (
    <>
      <path d="M44 88 L50 98 L56 88 Z" fill={x.skin} stroke="none" />
      {ln("M42 79 L45.5 93 M58 79 L54.5 93", x.dk, 5.6, 0.9)}
      {ln("M42 79 L45.5 93 M58 79 L54.5 93", x.c, 4, 1)}
      <circle
        cx="50"
        cy="98"
        r="2.8"
        fill="none"
        stroke={x.tr}
        strokeWidth={sw(2)}
      />
      {ln(`M10 ${x.bot - 3} Q50 ${x.bot + 2} 90 ${x.bot - 3}`, x.tr, 2, 0.9)}
      {ln("M44 100 q6 3 12 0", x.dk, 1.4, 0.3)}
    </>
  ),
};

/** What sits at the end of the sleeve (ribbing, trim) */
const CUFF: Partial<Record<ShirtId, { len: number; col: (x: Ctx) => string }>> =
  {
    tee: { len: 5, col: (x) => x.dk },
    stripe: { len: 5, col: (x) => x.tr },
    polo: { len: 6, col: (x) => x.md },
    crop: { len: 5, col: (x) => x.dk },
    sailor: { len: 7, col: (x) => x.tr },
    long: { len: 8, col: (x) => x.md },
    hoodie: { len: 10, col: (x) => x.md },
    jersey: { len: 10, col: (x) => x.md },
    jacket: { len: 11, col: (x) => x.tr },
    blazer: { len: 7, col: (x) => x.md },
    gakuran: { len: 7, col: (x) => x.tr },
    cardigan: { len: 10, col: (x) => x.md },
    sweater: { len: 10, col: (x) => x.md },
    offshoulder: { len: 10, col: (x) => x.md },
  };

// ---------------------------------------------------------------- shoes (leg coordinates)
const shoeTop = (t: ShoeId) =>
  t === "boots" ? 147 : t === "sneakers" ? 156 : 160;
const shoePath = (x: number, t: ShoeId) => {
  const top = shoeTop(t);
  return `M${x - 12} ${top} H${x + 12} V166 Q${x + 14.5} 167 ${x + 14.5} 171 Q${x + 14.5} 175.5 ${x + 9} 175.5 H${x - 9} Q${x - 14.5} 175.5 ${x - 14.5} 171 Q${x - 14.5} 167 ${x - 12} 166 Z`;
};

// ---------------------------------------------------------------- pants (leg coordinates)
const PANTS_LEG_FULL = ["jeans", "slacks", "cargo"];

// Chunky blob character: thick outline, big head, tube limbs, white eyes with pupils glancing sideways.
// Rig layers (see emotes.css): .upper = hips+torso+arms+head, .head = head, .armL/.armR, .legL/.legR.
// Hair, hats and clothes live inside those layers so they move with the part they are worn on.
// uid keeps the SVG clip-path ids unique when the character is drawn more than once.
export function Stickman({
  pose,
  color,
  w,
  h: _h, // the height always follows the width now (the viewBox is 100 x VB_H)
  eyes = DEFAULT_EYES,
  look = DEFAULT_LOOK,
  uid = "pet",
  armsDown = false,
}: {
  pose: Pose;
  color: string;
  w: number;
  h: number;
  eyes?: Eyes;
  look?: Look;
  uid?: string;
  armsDown?: boolean;
}) {
  const up = pose === "scared" || pose === "shocked" || pose === "happy";
  const wide = pose === "scared" || pose === "shocked";
  const rx = (wide ? 8.5 : 7) * eyes.size,
    ry = (wide ? 11.5 : 9.5) * eyes.size,
    pr = (pose === "shocked" ? 3 : 4.2) * eyes.pupil;
  const gap = Math.max(eyes.gap, 2 * rx + 2); // the eyes never overlap, however big they get
  const mouths: Record<Pose, string> = {
    neutral: "M49 64 q5 4 10 0",
    happy: "M42 61 q8 10 16 0",
    scared: "M45 68 q5 -6 10 0",
    angry: "M44 68 q6 -5 12 0",
    sad: "M45 68 q5 -5 10 0",
    wave: "M45 62 q6 6 12 0",
    shocked: "M46 64 a4 5.5 0 1 0 8 0 a4 5.5 0 1 0 -8 0",
  };
  const BODY =
    "M36 80 C26 94 20 116 26 134 Q31 148 50 148 Q69 148 74 134 C80 116 74 94 64 80 Z";
  const down = ["M33 88 Q14 106 17 128", "M67 88 Q86 106 83 128"];
  // Raised arms are aimed so that, after the body shrink, the hands end up beside the (bigger) head instead of behind it.
  const raised = ["M33 88 Q6 86 -10 62", "M67 88 Q94 86 110 62"];
  const arms = armsDown
    ? down
    : pose === "wave"
      ? [down[0], raised[1]]
      : up
        ? raised
        : down;
  const legs = [
    [37, "legL"],
    [63, "legR"],
  ] as const;
  // Among Us style legs: plain stubby legs, straight sides, flat rounded-off bottoms, no separate foot.
  // The top is narrower and tucked up inside the body, so it never shows as a square corner when the body moves.
  const stump = (x: number) =>
    `M${x - 6} 112 H${x + 6} C${x + 6} 122 ${x + 10.5} 122 ${x + 10.5} 132 V164 Q${x + 10.5} 172 ${x + 2.5} 172 H${x - 2.5} Q${x - 10.5} 172 ${x - 10.5} 164 V132 C${x - 10.5} 122 ${x - 6} 122 ${x - 6} 112 Z`;

  const bodyClip = `body-${uid}`;
  const shirtClip = `shirt-${uid}`;
  const pantsEdge = `pantsedge-${uid}`;
  const topClip = `bodytop-${uid}`;
  const legClip = (x: number) => `leg-${uid}-${x}`;
  const shoeClip = (x: number) => `shoe-${uid}-${x}`;
  const legGrad = (x: number) => `lg-${uid}-${x}`;
  const shadeId = `sh-${uid}`;
  const hc = { fill: look.hatColor, stroke: INK, strokeWidth: 4 };
  const sleeve = SLEEVE[look.shirt];
  const outer = OUTER.includes(look.shirt);

  // Colours the shirt is painted with
  const sc = look.shirt === "none" ? color : look.shirtColor;
  const ctx: Ctx = {
    c: sc,
    dk: lum(sc) > 215 ? shade(sc, 0.5) : shade(sc, 0.55),
    md: shade(sc, 0.14),
    lt: tint(sc, 0.35),
    tr: look.trimColor,
    inn: look.innerColor,
    skin: color,
    top: look.shirt === "offshoulder" ? 92 : look.shirt === "halter" ? 88 : 76,
    bot:
      look.shirt === "crop"
        ? 108
        : look.shirt === "offshoulder" || look.shirt === "halter"
          ? 106
          : outer
            ? OUTER_BOTTOM
            : 140,
  };
  const shirtPath = (b: number, t: number) =>
    `M10 ${t} H90 V${b - 3} Q50 ${b + 5} 10 ${b - 3} Z`;

  const bodyOnly = (ink: boolean) => (
    <path
      d={BODY}
      fill={ink ? INK : color}
      stroke={ink ? INK : "none"}
      strokeWidth={sw(10)}
    />
  );

  // Drawn on top of the body and the shirt, so the arms stay visible when they swing in front of the torso.
  const shoulderFill =
    look.shirt === "none" ||
    look.shirt === "offshoulder" ||
    look.shirt === "halter"
      ? color
      : look.shirtColor;
  const cuff = CUFF[look.shirt];
  const armsLayer = (
    <>
      {/* 1. arm outlines */}
      {arms.map((d, i) => (
        <path
          key={`ai${i}`}
          className={i === 0 ? "arm armL" : "arm armR"}
          d={d}
          stroke={INK}
          strokeWidth={sw(22)}
        />
      ))}

      {/* 2. cover patch: hides the outline that sits over the top of the body.
        It doesn't rotate, so it stays put while the arms swing. */}
      <g clipPath={`url(#${topClip})`}>
        <rect
          x="24"
          y="84"
          width="24"
          height="15"
          fill={shoulderFill}
          stroke="none"
        />
        <rect
          x="48"
          y="84"
          width="24"
          height="15"
          fill={shoulderFill}
          stroke="none"
        />
      </g>

      {/* 3. colored arms, on top of the patch */}
      {arms.map((d, i) => (
        <path
          key={`ac${i}`}
          className={i === 0 ? "arm armL" : "arm armR"}
          d={d}
          stroke={color}
          strokeWidth={sw(12)}
        />
      ))}
      {/* soft shading on the underside of the bare arm */}
      {arms.map((d, i) => (
        <path
          key={`ash${i}`}
          className={i === 0 ? "arm armL" : "arm armR"}
          d={d}
          pathLength="100"
          stroke={shade(color, 0.3)}
          strokeOpacity={0.25}
          strokeWidth={sw(3.5)}
          transform="translate(0 0)"
        />
      ))}

      {sleeve > 0 && (
        <>
          {arms.map((d, i) => (
            <path
              key={`s${i}`}
              className={i === 0 ? "arm armL" : "arm armR"}
              d={d}
              pathLength="100"
              strokeDasharray={`${sleeve} 100`}
              strokeLinecap="butt"
              stroke={look.shirtColor}
              strokeWidth={sw(12.8)}
            />
          ))}
          {/* a fold across the arm where it bends, and a darker underside */}
          {sleeve >= 90 &&
            arms.map((d, i) => (
              <path
                key={`cr${i}`}
                className={i === 0 ? "arm armL" : "arm armR"}
                d={d}
                pathLength="100"
                strokeDasharray="1.5 100"
                strokeDashoffset={-50}
                strokeLinecap="butt"
                stroke={ctx.dk}
                strokeOpacity={0.4}
                strokeWidth={sw(11.5)}
              />
            ))}
          {look.shirt === "jersey" &&
            arms.map((d, i) => (
              <path
                key={`st${i}`}
                className={i === 0 ? "arm armL" : "arm armR"}
                d={d}
                pathLength="100"
                strokeDasharray={`${sleeve - 10} 100`}
                strokeLinecap="butt"
                stroke={look.trimColor}
                strokeWidth={sw(3.2)}
              />
            ))}
          {cuff &&
            arms.map((d, i) => (
              <g key={`cu${i}`}>
                <path
                  className={i === 0 ? "arm armL" : "arm armR"}
                  d={d}
                  pathLength="100"
                  strokeDasharray={`${cuff.len} 100`}
                  strokeDashoffset={-(sleeve - cuff.len)}
                  strokeLinecap="butt"
                  stroke={cuff.col(ctx)}
                  strokeWidth={sw(13.6)}
                />
                <path
                  className={i === 0 ? "arm armL" : "arm armR"}
                  d={d}
                  pathLength="100"
                  strokeDasharray="1.2 100"
                  strokeDashoffset={-(sleeve - cuff.len)}
                  strokeLinecap="butt"
                  stroke={ctx.dk}
                  strokeOpacity={0.7}
                  strokeWidth={sw(13.6)}
                />
              </g>
            ))}
          {/* fills the round top of the arm. It sits on the pivot, so it doesn't move when the arm rotates */}
          <circle
            cx="33"
            cy="88"
            r={sw(6.2)}
            fill={look.shirtColor}
            stroke="none"
          />
          <circle
            cx="67"
            cy="88"
            r={sw(6.2)}
            fill={look.shirtColor}
            stroke="none"
          />
        </>
      )}
    </>
  );

  const skirt = (d: string, c: string, pleats: boolean, hemTrim?: string) => {
    const dk = shade(c, 0.5);
    return (
      <g>
        <path d={d} fill={c} stroke="none" />
        <clipPath id={`${uid}-sk-${c.slice(1)}-${pleats ? 1 : 0}`}>
          <path d={d} />
        </clipPath>
        <g clipPath={`url(#${uid}-sk-${c.slice(1)}-${pleats ? 1 : 0})`}>
          {/* waistband */}
          <rect
            x="0"
            y="108"
            width="100"
            height="6"
            fill={shade(c, 0.14)}
            stroke="none"
          />
          {/* alternate pleats are shaded, so the folds read as folds */}
          <path
            d="M36 114 Q33 134 28 152 H50 Q47 134 46 114 Z M64 114 Q67 134 72 152 H50 Q53 134 54 114 Z M14 124 Q10 138 6 152 H22 Q22 138 24 120 Z M86 124 Q90 138 94 152 H78 Q78 138 76 120 Z"
            fill="#000"
            fillOpacity={pleats ? 0.13 : 0.1}
            stroke="none"
          />
          <path
            d="M40 114 Q37 134 33 152 M50 114 V152 M60 114 Q63 134 67 152 M25 118 Q20 134 16 152 M75 118 Q80 134 84 152"
            fill="none"
            stroke={dk}
            strokeWidth={sw(1.8)}
            strokeOpacity={0.4}
          />
          <path
            d="M43 114 Q41 130 38 146 M57 114 Q59 130 62 146"
            fill="none"
            stroke={tint(c, 0.5)}
            strokeWidth={sw(1.4)}
            strokeOpacity={0.35}
          />
          {ln("M0 114 H100", dk, 1.6, 0.55)}
        </g>
        {hemTrim && (
          <path
            d={SKIRT_HEM}
            fill="none"
            stroke={INK}
            strokeWidth={sw(5.6)}
            strokeLinecap="round"
          />
        )}
        {hemTrim && (
          <path
            d={SKIRT_HEM}
            fill="none"
            stroke={hemTrim}
            strokeWidth={sw(3.6)}
            strokeLinecap="round"
          />
        )}
        <path d={d.replace(" Z", "")} fill="none" strokeWidth={sw(2.5)} />
      </g>
    );
  };

  // ---------------------------------------------------------------- the clothes on the torso
  const pc = look.pantsColor;
  const pdk = shade(pc, 0.5);
  const hasPants = ["shorts", "jeans", "slacks", "cargo", "jogger"].includes(
    look.pants,
  );
  const dressLike = look.shirt === "dress";
  const shirtNode =
    look.shirt !== "none" ? (
      <g clipPath={`url(#${bodyClip})`}>
        <path d={shirtPath(ctx.bot, ctx.top)} fill={ctx.c} stroke="none" />
        <path
          d={shirtPath(ctx.bot, ctx.top)}
          fill={`url(#${shadeId})`}
          stroke="none"
        />
        <ellipse
          cx="38"
          cy="94"
          rx="11"
          ry="8"
          fill="#fff"
          fillOpacity={0.1}
          stroke="none"
        />
        {SHIRT_DRAW[look.shirt](ctx, look)}
        {ln(
          `M10 ${ctx.bot - 3} Q50 ${ctx.bot + 4} 90 ${ctx.bot - 3}`,
          ctx.dk,
          2.2,
          0.55,
        )}
      </g>
    ) : null;

  const pantsTorso = hasPants ? (
    <>
      <g clipPath={`url(#${pantsEdge})`}>
        <path
          d={SHIRT_CLIP}
          fill={pc}
          stroke={pc}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </g>
      <g clipPath={`url(#${bodyClip})`}>
        <rect x="10" y="122" width="80" height="40" fill={pc} stroke="none" />
        <rect
          x="10"
          y="122"
          width="80"
          height="40"
          fill={`url(#${shadeId})`}
          stroke="none"
        />
        {/* waistband */}
        {look.pants === "jogger" || look.pants === "shorts" ? (
          <>
            <rect
              x="10"
              y="122"
              width="80"
              height="6"
              fill={shade(pc, 0.16)}
              stroke="none"
            />
            {ln("M10 128 H90", pdk, 1.6, 0.6)}
            {ln(
              "M45 125 Q47 133 44 139 M55 125 Q53 133 56 139",
              tint(pc, 0.5),
              1.6,
              0.8,
            )}
            <circle
              cx="50"
              cy="125"
              r="1.9"
              fill={tint(pc, 0.45)}
              stroke={pdk}
              strokeWidth={sw(0.9)}
            />
          </>
        ) : (
          <>
            <rect
              x="10"
              y="122"
              width="80"
              height="5.5"
              fill={look.pants === "slacks" ? "#1b1b1f" : "#3b2a20"}
              stroke="none"
            />
            <rect
              x="45.5"
              y="121.2"
              width="9"
              height="7"
              rx="1.2"
              fill="none"
              stroke={GOLD}
              strokeWidth={sw(1.8)}
            />
            {ln("M10 127.5 H90", "#000", 1.2, 0.4)}
          </>
        )}
        {ln("M50 130 V151", pdk, 2, 0.55)}
        {/* front pockets */}
        {ln(
          "M22 130 Q32 131 38 146 M78 130 Q68 131 62 146",
          look.pants === "jeans" ? tint(pc, 0.5) : pdk,
          1.6,
          0.65,
          look.pants === "jeans"
            ? { strokeDasharray: `${sw(1.8)} ${sw(1.5)}` }
            : {},
        )}
        {look.pants === "cargo" && (
          <>
            <rect
              x="12"
              y="136"
              width="10"
              height="9"
              fill={shade(pc, 0.06)}
              stroke={pdk}
              strokeOpacity={0.7}
              strokeWidth={sw(1.4)}
            />
            <rect
              x="78"
              y="136"
              width="10"
              height="9"
              fill={shade(pc, 0.06)}
              stroke={pdk}
              strokeOpacity={0.7}
              strokeWidth={sw(1.4)}
            />
            <circle
              cx="17"
              cy="138.5"
              r="1.1"
              fill={tint(pc, 0.5)}
              stroke="none"
            />
            <circle
              cx="83"
              cy="138.5"
              r="1.1"
              fill={tint(pc, 0.5)}
              stroke="none"
            />
          </>
        )}
        {ln("M30 141 q5 3 9 0 M70 141 q-5 3 -9 0", pdk, 1.4, 0.4)}
      </g>
    </>
  ) : null;

  const skirtNode =
    look.pants === "skirt"
      ? skirt(SKIRT_D, pc, true)
      : look.pants === "mini"
        ? skirt(MINI_D, pc, false)
        : null;

  const torsoClothes = (
    <>
      {!outer && shirtNode}
      {pantsTorso}
      {dressLike && skirt(SKIRT_D, look.shirtColor, true, look.trimColor)}
      {skirtNode}
      {outer && shirtNode}
      {/* the head shades the top of the chest */}
      <g clipPath={`url(#${bodyClip})`}>
        <ellipse
          cx="50"
          cy="82"
          rx="16"
          ry="7"
          fill="#000"
          fillOpacity={0.14}
          stroke="none"
        />
      </g>
    </>
  );

  const eye = (cx: number, id: string) => (
    <g key={id}>
      <ellipse
        cx={cx}
        cy="48"
        rx={rx}
        ry={ry}
        fill="#fff"
        stroke={INK}
        strokeWidth="3"
      />
      <clipPath id={`eyeclip-${uid}-${id}`}>
        <ellipse cx={cx} cy="48" rx={rx} ry={ry} />
      </clipPath>
      <g clipPath={`url(#eyeclip-${uid}-${id})`}>
        <g className="pupil">
          <circle cx={cx} cy="48" r={pr} fill={eyes.pupilColor} stroke="none" />
          <circle
            cx={cx - 0.9}
            cy="46"
            r={(look.anime ? 1.8 : 1.2) * Math.min(eyes.pupil, 1.3)}
            fill="#fff"
            stroke="none"
          />
          {look.anime && (
            <circle
              cx={cx + 2}
              cy="51.5"
              r={0.9 * Math.min(eyes.pupil, 1.3)}
              fill="#fff"
              stroke="none"
            />
          )}
        </g>
      </g>
      {look.anime && (
        <path
          d={`M${cx - rx - 1.5} ${48 - ry + 4} Q${cx} ${48 - ry - 3} ${cx + rx + 1.5} ${48 - ry + 4}`}
          strokeWidth="3.5"
        />
      )}
    </g>
  );

  const shine = (
    <path
      d="M18 22 Q50 8 82 22"
      fill="none"
      stroke="#fff"
      strokeOpacity=".28"
      strokeWidth="3"
    />
  );
  const hat = (
    <>
      {look.hat === "cap" && (
        <g>
          <path
            d="M11 32 C9 -8 91 -8 89 32 Q98 31 101 37 Q78 44 50 36 Q30 34 11 32 Z"
            {...hc}
          />
          <path d="M16 31 Q50 37 84 31" fill="none" strokeWidth="2.5" />
          <path
            d="M50 -5 Q46 14 40 33 M50 -5 Q54 14 60 33"
            fill="none"
            stroke={INK}
            strokeOpacity=".35"
            strokeWidth="1.8"
          />
          <path
            d="M30 6 Q46 -2 66 4"
            fill="none"
            stroke="#fff"
            strokeOpacity=".35"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M86 34 Q96 37 99 38"
            fill="none"
            stroke={INK}
            strokeOpacity=".3"
            strokeWidth="2"
          />
          <circle cx="50" cy="1" r="2.5" fill={INK} stroke="none" />
        </g>
      )}
      {look.hat === "beanie" && (
        <g>
          <path d="M11 31 C9 -12 91 -12 89 31 Z" {...hc} />
          <path d="M10 20 Q50 26 90 20 L89 31 Q50 37 11 31 Z" {...hc} />
          <path
            d="M16 23 V32 M24 24 V34 M32 25 V35 M40 26 V36 M48 26 V36 M56 26 V36 M64 26 V35 M72 25 V34 M80 24 V32"
            stroke={INK}
            strokeOpacity=".3"
            strokeWidth="1.6"
          />
          <path
            d="M24 8 Q46 -6 70 4"
            fill="none"
            stroke="#fff"
            strokeOpacity=".3"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="50" cy="-6" r="7" {...hc} />
          <path
            d="M45 -9 q5 -3 9 0 M46 -4 q4 2 8 0"
            fill="none"
            stroke="#fff"
            strokeOpacity=".4"
            strokeWidth="1.6"
          />
        </g>
      )}
      {look.hat === "tophat" && (
        <g>
          <ellipse cx="50" cy="12" rx="36" ry="6" {...hc} />
          <path
            d="M30 12 V-24 Q30 -28 34 -28 H66 Q70 -28 70 -24 V12 Z"
            {...hc}
          />
          <path
            d="M30 2 H70 V10 H30 Z"
            fill="#fff"
            fillOpacity=".4"
            stroke="none"
          />
          <path
            d="M30 2 H70 M30 10 H70"
            stroke={INK}
            strokeOpacity=".5"
            strokeWidth="1.5"
          />
          <path
            d="M36 -22 V-2"
            stroke="#fff"
            strokeOpacity=".4"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M20 14 Q50 20 80 14"
            fill="none"
            stroke={INK}
            strokeOpacity=".25"
            strokeWidth="2"
          />
        </g>
      )}
      {look.hat === "crown" && (
        <g>
          <path
            d="M20 22 L16 -2 L33 10 L50 -8 L67 10 L84 -2 L80 22 Z"
            {...hc}
            strokeLinejoin="round"
          />
          <path
            d="M20 17 H80"
            stroke={INK}
            strokeOpacity=".4"
            strokeWidth="1.8"
          />
          <path
            d="M22 14 L19 2 M50 -2 V8"
            stroke="#fff"
            strokeOpacity=".45"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle
            cx="50"
            cy="10"
            r="3"
            fill="#e5566d"
            stroke={INK}
            strokeWidth="1.2"
          />
          <circle
            cx="32"
            cy="16"
            r="2.5"
            fill="#4a90e2"
            stroke={INK}
            strokeWidth="1.2"
          />
          <circle
            cx="68"
            cy="16"
            r="2.5"
            fill="#4a90e2"
            stroke={INK}
            strokeWidth="1.2"
          />
          <circle
            cx="16"
            cy="-2"
            r="2.4"
            fill="#fff"
            stroke={INK}
            strokeWidth="1.2"
          />
          <circle
            cx="50"
            cy="-8"
            r="2.4"
            fill="#fff"
            stroke={INK}
            strokeWidth="1.2"
          />
          <circle
            cx="84"
            cy="-2"
            r="2.4"
            fill="#fff"
            stroke={INK}
            strokeWidth="1.2"
          />
        </g>
      )}
      {look.hat === "ears" && (
        <g>
          <path d="M16 22 L18 -8 L42 8 Z" {...hc} strokeLinejoin="round" />
          <path d="M84 22 L82 -8 L58 8 Z" {...hc} strokeLinejoin="round" />
          <path d="M22 14 L23 0 L35 8 Z" fill="#ffb3c7" stroke="none" />
          <path d="M78 14 L77 0 L65 8 Z" fill="#ffb3c7" stroke="none" />
          <path
            d="M20 14 L21 4 M80 14 L79 4"
            stroke="#fff"
            strokeOpacity=".4"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </g>
      )}
      {look.hat === "party" && (
        <g>
          <path d="M30 14 L50 -34 L70 14 Z" {...hc} strokeLinejoin="round" />
          <path
            d="M38 -5 L62 -5 M34 5 L66 5"
            stroke="#fff"
            strokeOpacity=".6"
            strokeWidth="3"
          />
          <path
            d="M42 -14 L45 -22 M52 -20 L55 -10"
            stroke="#fff"
            strokeOpacity=".4"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="50" cy="-34" r="5" fill="#fff" strokeWidth="3" />
          <path
            d="M30 14 Q50 19 70 14"
            fill="none"
            stroke={INK}
            strokeOpacity=".3"
            strokeWidth="2"
          />
        </g>
      )}
      {look.hat === "bow" && (
        <g>
          <path
            d="M68 4 L46 -8 L46 16 Z M68 4 L90 -8 L90 16 Z"
            {...hc}
            strokeLinejoin="round"
          />
          <path
            d="M60 2 L50 -3 M76 2 L86 -3"
            stroke={INK}
            strokeOpacity=".35"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M50 -4 V4 M86 -4 V4"
            stroke="#fff"
            strokeOpacity=".4"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle cx="68" cy="4" r="5" {...hc} />
          <circle
            cx="66.5"
            cy="2.5"
            r="1.4"
            fill="#fff"
            fillOpacity=".6"
            stroke="none"
          />
        </g>
      )}
      {look.hat === "flower" && (
        <g>
          {[
            [76, 2],
            [84, 8],
            [81, 17],
            [71, 17],
            [68, 8],
          ].map(([x, y]) => (
            <circle
              key={`${x}${y}`}
              cx={x}
              cy={y}
              r="6"
              fill={look.hatColor}
              stroke={INK}
              strokeWidth="3"
            />
          ))}
          {[
            [76, 0],
            [83, 6],
            [80, 15],
            [72, 15],
            [69, 6],
          ].map(([x, y]) => (
            <circle
              key={`h${x}${y}`}
              cx={x}
              cy={y}
              r="1.6"
              fill="#fff"
              fillOpacity=".5"
              stroke="none"
            />
          ))}
          <circle
            cx="76"
            cy="10"
            r="5"
            fill="#f0a030"
            stroke={INK}
            strokeWidth="3"
          />
          <circle
            cx="74.5"
            cy="8.5"
            r="1.3"
            fill="#fff"
            fillOpacity=".6"
            stroke="none"
          />
        </g>
      )}
      {look.hat === "witch" && (
        <g>
          <ellipse cx="50" cy="14" rx="46" ry="8" {...hc} />
          <path
            d="M26 12 C34 -4 42 -20 46 -40 Q58 -44 66 -34 C62 -20 68 0 74 12 Z"
            {...hc}
            strokeLinejoin="round"
          />
          <path
            d="M30 4 Q50 10 70 4 L72 10 Q50 16 28 10 Z"
            fill="#fff"
            fillOpacity=".4"
            stroke="none"
          />
          <path
            d="M30 4 Q50 10 70 4 M28 10 Q50 16 72 10"
            fill="none"
            stroke={INK}
            strokeOpacity=".5"
            strokeWidth="1.5"
          />
          <rect
            x="45"
            y="5"
            width="10"
            height="8"
            rx="1.5"
            fill="none"
            stroke="#f1d27a"
            strokeWidth="2.2"
          />
          <path
            d="M40 -10 Q42 -24 46 -34"
            fill="none"
            stroke="#fff"
            strokeOpacity=".3"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M8 14 Q50 22 92 14"
            fill="none"
            stroke={INK}
            strokeOpacity=".25"
            strokeWidth="2"
          />
        </g>
      )}
      {look.hat === "phones" && (
        <g>
          <path d="M12 44 C8 -6 92 -6 88 44" fill="none" strokeWidth="5" />
          <path
            d="M14 36 C14 4 86 4 86 36"
            fill="none"
            stroke="#fff"
            strokeOpacity=".28"
            strokeWidth="2"
          />
          <rect x="2" y="36" width="14" height="26" rx="6" {...hc} />
          <rect x="84" y="36" width="14" height="26" rx="6" {...hc} />
          <rect
            x="5"
            y="40"
            width="5"
            height="18"
            rx="2.5"
            fill="#fff"
            fillOpacity=".3"
            stroke="none"
          />
          <rect
            x="90"
            y="40"
            width="5"
            height="18"
            rx="2.5"
            fill="#fff"
            fillOpacity=".3"
            stroke="none"
          />
        </g>
      )}
      {look.hat === "horns" && (
        <g>
          <path
            d="M18 24 C6 14 8 -4 22 -8 C16 2 20 12 30 16 Z"
            {...hc}
            strokeLinejoin="round"
          />
          <path
            d="M82 24 C94 14 92 -4 78 -8 C84 2 80 12 70 16 Z"
            {...hc}
            strokeLinejoin="round"
          />
          <path
            d="M16 16 C13 8 14 2 18 -2 M84 16 C87 8 86 2 82 -2"
            fill="none"
            stroke="#fff"
            strokeOpacity=".4"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      )}
    </>
  );

  // ---------------------------------------------------------------- legs: pants, socks and shoes
  const legDetail = (x: number, cls: string) => {
    const out = x < 50 ? -1 : 1; // which side is the outside of the leg
    const lc = legClip(x);
    return (
      <g key={cls} className={`legGap ${cls === "legL" ? "gapL" : "gapR"}`}>
        <g className={`leg ${cls}`}>
          <path d={stump(x)} fill={INK} stroke={INK} strokeWidth={sw(10)} />
          <path d={stump(x)} fill={color} stroke="none" />
          {/* a little shading on the bare leg */}
          <g clipPath={`url(#${lc})`}>
            <rect
              x={x - 12}
              y="112"
              width="24"
              height="62"
              fill={`url(#${legGrad(x)})`}
              stroke="none"
              opacity={0.7}
            />
          </g>

          {look.pants !== "none" &&
            look.pants !== "skirt" &&
            look.pants !== "mini" && (
              <g clipPath={`url(#${lc})`}>
                {PANTS_LEG_FULL.includes(look.pants) && (
                  <rect
                    x={x - 12}
                    y="100"
                    width="24"
                    height="74"
                    fill={pc}
                    stroke="none"
                  />
                )}
                {look.pants === "shorts" && (
                  <rect
                    x={x - 12}
                    y="100"
                    width="24"
                    height="52"
                    fill={pc}
                    stroke="none"
                  />
                )}
                {look.pants === "jogger" && (
                  <rect
                    x={x - 12}
                    y="100"
                    width="24"
                    height="52"
                    fill={pc}
                    stroke="none"
                  />
                )}
                <rect
                  x={x - 12}
                  y="100"
                  width="24"
                  height="74"
                  fill={`url(#${legGrad(x)})`}
                  stroke="none"
                />
                {/* knee and thigh creases */}
                {ln(
                  `M${x - 8} ${look.pants === "shorts" ? 133 : 139} q4 3 8 1 M${x + 1} ${look.pants === "shorts" ? 138 : 146} q4 -1 7 2`,
                  pdk,
                  1.5,
                  0.45,
                )}
                {ln(`M${x - 6} 124 q5 2 10 0`, pdk, 1.3, 0.3)}
                {look.pants === "jeans" && (
                  <>
                    {ln(
                      `M${x + out * 8.8} 118 V152`,
                      tint(pc, 0.5),
                      1.2,
                      0.75,
                      { strokeDasharray: `${sw(1.8)} ${sw(1.5)}` },
                    )}
                    {/* turned-up cuff */}
                    <rect
                      x={x - 12}
                      y="149"
                      width="24"
                      height="7"
                      fill={tint(pc, 0.12)}
                      stroke="none"
                    />
                    {ln(
                      `M${x - 12} 149 H${x + 12} M${x - 12} 156 H${x + 12}`,
                      pdk,
                      1.6,
                      0.6,
                    )}
                  </>
                )}
                {look.pants === "slacks" && (
                  <>
                    {ln(`M${x} 118 V158`, pdk, 1.3, 0.35)}
                    {ln(`M${x} 118 V158`, tint(pc, 0.5), 1.1, 0.25, {
                      transform: "translate(1.6 0)",
                    })}
                    {ln(`M${x - 12} 157 H${x + 12}`, pdk, 1.6, 0.6)}
                  </>
                )}
                {look.pants === "cargo" && (
                  <>
                    <rect
                      x={x + (out < 0 ? -10 : 0)}
                      y="128"
                      width="10"
                      height="13"
                      fill={shade(pc, 0.06)}
                      stroke={pdk}
                      strokeOpacity={0.75}
                      strokeWidth={sw(1.4)}
                    />
                    {ln(`M${x + (out < 0 ? -10 : 0)} 132 h10`, pdk, 1.3, 0.6)}
                    <circle
                      cx={x + (out < 0 ? -5 : 5)}
                      cy="134.5"
                      r="1.2"
                      fill={tint(pc, 0.5)}
                      stroke={pdk}
                      strokeWidth={sw(0.6)}
                    />
                    <rect
                      x={x - 12}
                      y="152"
                      width="24"
                      height="5"
                      fill={shade(pc, 0.12)}
                      stroke="none"
                    />
                    {ln(`M${x - 12} 152 H${x + 12}`, pdk, 1.4, 0.6)}
                  </>
                )}
                {look.pants === "shorts" && (
                  <>
                    <rect
                      x={x - 12}
                      y="146"
                      width="24"
                      height="6"
                      fill={shade(pc, 0.12)}
                      stroke="none"
                    />
                    {ln(
                      `M${x - 12} 146 H${x + 12} M${x - 12} 152 H${x + 12}`,
                      pdk,
                      1.5,
                      0.6,
                    )}
                  </>
                )}
                {look.pants === "jogger" &&
                  ln(
                    `M${x - 9} 136 q9 4 18 0 M${x - 7} 144 q7 3 14 0`,
                    pdk,
                    1.4,
                    0.4,
                  )}
              </g>
            )}
          {/* joggers are gathered at the ankle in a bulging cuff */}
          {look.pants === "jogger" && (
            <g>
              <path
                d={`M${x - 11} 147 Q${x - 15} 153 ${x - 11.5} 160 H${x + 11.5} Q${x + 15} 153 ${x + 11} 147 Z`}
                fill={shade(pc, 0.06)}
                stroke={INK}
                strokeWidth={sw(3.6)}
                strokeLinejoin="round"
              />
              {ln(
                `M${x - 11} 152 q11 4 22 0 M${x - 9} 157 q9 3 18 0`,
                pdk,
                1.4,
                0.55,
              )}
              {ln(`M${x - 8} 149 q8 -1 15 0`, tint(pc, 0.5), 1.2, 0.35)}
            </g>
          )}

          {look.socks && (
            <>
              <rect
                x={x - 12}
                y={look.thighHigh ? 122 : 136}
                width="24"
                height="40"
                fill={look.socksColor}
                stroke="none"
                clipPath={`url(#${lc})`}
              />
              <g clipPath={`url(#${lc})`}>
                {ln(
                  `M${x - 11} ${look.thighHigh ? 123 : 137} H${x + 11} M${x - 11} ${look.thighHigh ? 127 : 141} H${x + 11}`,
                  "#fff",
                  2.2,
                  0.7,
                )}
                <rect
                  x={x - 12}
                  y={look.thighHigh ? 122 : 136}
                  width="24"
                  height="40"
                  fill={`url(#${legGrad(x)})`}
                  stroke="none"
                />
              </g>
            </>
          )}
          {look.garter && x === 63 && (
            <>
              <path
                d={`M${x - 12} 130 H${x + 12}`}
                stroke="#2b2b33"
                strokeWidth={sw(4)}
                clipPath={`url(#${lc})`}
              />
              <circle
                cx={x + 3}
                cy="130"
                r="1.6"
                fill={GOLD}
                stroke="none"
                clipPath={`url(#${lc})`}
              />
            </>
          )}

          {look.shoes !== "none" && (
            <g>
              <path
                d={shoePath(x, look.shoes)}
                fill={look.shoesColor}
                stroke={INK}
                strokeWidth={sw(3.8)}
                strokeLinejoin="round"
              />
              <g clipPath={`url(#${shoeClip(x)})`} stroke="none">
                {shoeDetail(x, look.shoes, look.shoesColor)}
                <rect
                  x={x - 16}
                  y="150"
                  width="32"
                  height="30"
                  fill={`url(#${legGrad(x)})`}
                />
              </g>
              <path
                d={shoePath(x, look.shoes)}
                fill="none"
                stroke={INK}
                strokeWidth={sw(3.8)}
                strokeLinejoin="round"
              />
            </g>
          )}
        </g>
      </g>
    );
  };

  const shoeDetail = (x: number, t: ShoeId, sc: string) => {
    const sole = t === "sneakers" ? "#ffffff" : shade(sc, 0.55);
    const sdk = shade(sc, 0.5);
    const lace = lum(sc) > 190 ? shade(sc, 0.35) : "#f4f1f1";
    return (
      <>
        <rect x={x - 16} y="169.5" width="32" height="8" fill={sole} />
        <path
          d={`M${x - 16} 169.5 H${x + 16}`}
          stroke={INK}
          strokeWidth={sw(1.6)}
        />
        {t === "sneakers" && (
          <>
            <ellipse cx={x} cy="168" rx="9.5" ry="4" fill={tint(sc, 0.4)} />
            <path
              d={`M${x - 9.5} 168 Q${x} 163 ${x + 9.5} 168`}
              fill="none"
              stroke={INK}
              strokeOpacity=".55"
              strokeWidth={sw(1.4)}
            />
            <rect
              x={x - 4.5}
              y="154"
              width="9"
              height="5"
              rx="1.5"
              fill={tint(sc, 0.55)}
            />
            <path
              d={`M${x - 5} 159 L${x + 5} 163 M${x + 5} 159 L${x - 5} 163`}
              stroke={lace}
              strokeWidth={sw(1.4)}
              strokeLinecap="round"
            />
            <path
              d={`M${x - 9} 158 Q${x - 11} 163 ${x - 9} 166`}
              fill="none"
              stroke="#fff"
              strokeOpacity=".5"
              strokeWidth={sw(1.6)}
              strokeLinecap="round"
            />
          </>
        )}
        {t === "boots" && (
          <>
            <rect
              x={x - 14}
              y="146"
              width="28"
              height="6"
              fill={tint(sc, 0.2)}
            />
            <path
              d={`M${x - 14} 152 H${x + 14}`}
              stroke={INK}
              strokeOpacity=".6"
              strokeWidth={sw(1.5)}
            />
            <path
              d={`M${x - 5} 155 L${x + 5} 158.5 M${x + 5} 155 L${x - 5} 158.5 M${x - 5} 160.5 L${x + 5} 164 M${x + 5} 160.5 L${x - 5} 164`}
              stroke={lace}
              strokeWidth={sw(1.3)}
              strokeLinecap="round"
            />
            <ellipse cx={x} cy="168" rx="10" ry="3.6" fill={tint(sc, 0.12)} />
            <path
              d={`M${x - 10} 168 Q${x} 163.5 ${x + 10} 168`}
              fill="none"
              stroke={INK}
              strokeOpacity=".5"
              strokeWidth={sw(1.4)}
            />
            <path
              d={`M${x - 10} 149 V163`}
              stroke="#fff"
              strokeOpacity=".25"
              strokeWidth={sw(2)}
              strokeLinecap="round"
            />
          </>
        )}
        {t === "loafers" && (
          <>
            <rect
              x={x - 14}
              y="162"
              width="28"
              height="4"
              fill={shade(sc, 0.14)}
            />
            <path
              d={`M${x - 14} 162 H${x + 14} M${x - 14} 166 H${x + 14}`}
              stroke={sdk}
              strokeWidth={sw(1.3)}
            />
            <path
              d={`M${x - 3.5} 164 L${x} 161.6 L${x + 3.5} 164 L${x} 166.4 Z`}
              fill={tint(sc, 0.35)}
              stroke={sdk}
              strokeWidth={sw(1)}
            />
            <path
              d={`M${x - 9} 161 Q${x} 159 ${x + 9} 161`}
              fill="none"
              stroke="#fff"
              strokeOpacity=".4"
              strokeWidth={sw(1.6)}
              strokeLinecap="round"
            />
          </>
        )}
        {t === "maryjane" && (
          <>
            <rect
              x={x - 14}
              y="162.5"
              width="28"
              height="3.6"
              fill={shade(sc, 0.14)}
            />
            <path
              d={`M${x - 14} 162.5 H${x + 14} M${x - 14} 166 H${x + 14}`}
              stroke={sdk}
              strokeWidth={sw(1.3)}
            />
            <circle
              cx={x + 6.5}
              cy="164.3"
              r="1.7"
              fill={GOLD}
              stroke={sdk}
              strokeWidth={sw(0.9)}
            />
            <path
              d={`M${x - 9} 161 Q${x} 159 ${x + 9} 161`}
              fill="none"
              stroke="#fff"
              strokeOpacity=".5"
              strokeWidth={sw(1.6)}
              strokeLinecap="round"
            />
          </>
        )}
      </>
    );
  };

  return (
    <svg
      viewBox={`0 0 100 ${VB_H}`}
      width={w}
      height={(w * VB_H) / 100}
      fill="none"
      stroke={INK}
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ overflow: "visible" }}
    >
      <defs>
        <clipPath id={bodyClip}>
          <path d={SHIRT_CLIP} />
        </clipPath>
        <clipPath id={shirtClip}>
          <path d={SHIRT} />
        </clipPath>
        <clipPath id={pantsEdge}>
          <rect x="0" y="124" width="100" height="40" />
        </clipPath>
        <clipPath id={topClip}>
          <path d={BODY} />
          <rect x="30" y="66" width="40" height="18" />
        </clipPath>
        {/* soft side shading for the shirt and pants */}
        <linearGradient
          id={shadeId}
          gradientUnits="userSpaceOnUse"
          x1="14"
          y1="0"
          x2="86"
          y2="0"
        >
          <stop offset="0" stopColor="#000" stopOpacity=".3" />
          <stop offset=".24" stopColor="#000" stopOpacity="0" />
          <stop offset=".72" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".3" />
        </linearGradient>
        {legs.map(([x]) => (
          <g key={x}>
            <clipPath id={legClip(x)}>
              <path d={stump(x)} />
            </clipPath>
            <clipPath id={shoeClip(x)}>
              <path
                d={shoePath(x, look.shoes === "none" ? "sneakers" : look.shoes)}
              />
            </clipPath>
            <linearGradient
              id={legGrad(x)}
              gradientUnits="userSpaceOnUse"
              x1={x - 11}
              y1="0"
              x2={x + 11}
              y2="0"
            >
              <stop
                offset="0"
                stopColor="#000"
                stopOpacity={x < 50 ? ".16" : ".08"}
              />
              <stop offset=".3" stopColor="#000" stopOpacity="0" />
              <stop offset=".62" stopColor="#000" stopOpacity="0" />
              <stop
                offset="1"
                stopColor="#000"
                stopOpacity={x < 50 ? ".08" : ".2"}
              />
            </linearGradient>
          </g>
        ))}
      </defs>
      <ellipse
        className="shadow"
        cx="50"
        cy={FEET_Y + 2.5}
        rx="17"
        ry="2.5"
        fill="rgba(0,0,0,.18)"
        stroke="none"
      />
      <g className="upper">
        <g className="head">
          <BackHair look={look} uid={uid} />
        </g>
        <g transform={BODY_T} strokeWidth={sw(5)}>
          {bodyOnly(true)}
        </g>
      </g>
      {/* Each leg keeps its own outline, so when one passes over the other the line shows between them. */}
      <g transform={LEG_T} strokeWidth={sw(5)}>
        {legs.map(([x, cls]) => legDetail(x, cls))}
      </g>
      <g className="upper">
        <g transform={BODY_T} strokeWidth={sw(5)}>
          {bodyOnly(false)}
          {torsoClothes}
          {armsLayer}
        </g>
        <g className="head">
          <circle cx="50" cy="45" r="40" fill={color} />
          {look.hair !== "none" && (
            <g className="hair">
              <FrontHair look={look} uid={uid} />
            </g>
          )}
          <g className="face">
            {look.anime && (
              <>
                <ellipse
                  cx="29"
                  cy="60"
                  rx="6"
                  ry="3.5"
                  fill="#ff8fa3"
                  fillOpacity=".55"
                  stroke="none"
                />
                <ellipse
                  cx="71"
                  cy="60"
                  rx="6"
                  ry="3.5"
                  fill="#ff8fa3"
                  fillOpacity=".55"
                  stroke="none"
                />
              </>
            )}
            {eye(50 - gap / 2, "eyeL")}
            {eye(50 + gap / 2, "eyeR")}
            {pose === "angry" && (
              <path strokeWidth="4" d="M28 31 l18 6 M72 31 l-18 6" />
            )}
            {pose === "sad" && (
              <path strokeWidth="4" d="M28 37 l18 -6 M72 37 l-18 -6" />
            )}
            <path
              strokeWidth="3.5"
              d={mouths[pose]}
              fill={pose === "shocked" ? INK : "none"}
            />
          </g>
          <g className="hat">{hat}</g>
        </g>
      </g>
    </svg>
  );
}
