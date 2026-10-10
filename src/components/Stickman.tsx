import type { Pose } from "../reactions";
import { INK } from "../constants";
import type { Eyes } from "../types";
import { DEFAULT_LOOK } from "../characters";
import type { Look, ShirtId } from "../characters";

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
  long: 92,
  hoodie: 92,
};
const TOP = "M8 44 C2 -14 98 -14 92 44";
const FRINGE_JAG = `${TOP} L86 32 L78 38 L72 24 L64 34 L56 22 L48 34 L40 24 L32 36 L24 28 L16 38 L10 34 Z`;
const FRINGE_SOFT = `${TOP} L90 30 Q50 42 10 30 Z`;
const SPIKY =
  "M8 44 L2 24 L14 26 L8 6 L24 16 L30 -6 L42 10 L52 -10 L62 10 L74 -6 L78 16 L92 6 L86 26 L98 24 L92 44 L86 32 L78 38 L72 24 L64 34 L56 22 L48 34 L40 24 L32 36 L24 28 L16 38 L10 34 Z";
// Shirt: flares out below the chest so it covers the hips. Not clipped to the body.
const SHIRT =
  "M36 80 C27 92 22 102 23 112 C19 122 20 132 22 138 Q50 148 78 138 C80 132 81 122 77 112 C78 102 73 92 64 80 Z";
const SHIRT_HEM =
  "M23 112 C19 122 20 132 22 138 Q50 148 78 138 C80 132 81 122 77 112"; // outline of the flared part only
const SHIRT_CLIP =
  "M30 82 C26 94 20 116 24 134 Q31 148 50 148 Q69 148 76 136 C80 116 74 94 70 82 Z";

// Chunky blob character: thick outline, big head, tube limbs, white eyes with pupils glancing sideways.
// Rig layers (see emotes.css): .upper = hips+torso+arms+head, .head = head, .armL/.armR, .legL/.legR.
// Hair, hats and clothes live inside those layers so they move with the part they are worn on.
// uid keeps the SVG clip-path ids unique when the character is drawn more than once.
export function Stickman({
  pose,
  color,
  w,
  h,
  eyes = DEFAULT_EYES,
  look = DEFAULT_LOOK,
  uid = "pet",
}: {
  pose: Pose;
  color: string;
  w: number;
  h: number;
  eyes?: Eyes;
  look?: Look;
  uid?: string;
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
  const raised = ["M33 88 Q16 80 14 62", "M67 88 Q84 80 86 62"];
  const arms = pose === "wave" ? [down[0], raised[1]] : up ? raised : down;

  const legs = [
    [37, "legL"],
    [63, "legR"],
  ] as const;
  // Among Us style legs: plain stubby legs, straight sides, flat rounded-off bottoms, no separate foot.
  // The top is narrower and tucked up inside the body, so it never shows as a square corner when the body moves.
  const stump = (x: number) =>
    `M${x - 6} 112 H${x + 6} C${x + 6} 122 ${x + 10.5} 122 ${x + 10.5} 132 V164 Q${x + 10.5} 172 ${x + 2.5} 172 H${x - 2.5} Q${x - 10.5} 172 ${x - 10.5} 164 V132 C${x - 10.5} 122 ${x - 6} 122 ${x - 6} 112 Z`;

  const bodyClip = `body-${uid}`;
  const pantsClip = `pants-${uid}`;
  const shirtClip = `shirt-${uid}`;
  const pantsEdge = `pantsedge-${uid}`;
  const topClip = `bodytop-${uid}`;
  const legClip = (x: number) => `leg-${uid}-${x}`;
  const hp = { fill: look.hairColor, stroke: INK, strokeWidth: 4 };
  const hc = { fill: look.hatColor, stroke: INK, strokeWidth: 4 };
  const sleeve = SLEEVE[look.shirt];
  const TIE = "#ff6b8b";

  // Hair behind the head and body (drawn inside a .head group so it moves with the head)
  const backHair = (
    <>
      {look.hair === "bob" && (
        <path
          d="M6 40 C4 -10 96 -10 94 40 V70 Q94 80 84 80 H16 Q6 80 6 70 Z"
          {...hp}
        />
      )}
      {look.hair === "long" && (
        <path
          d="M6 40 C4 -10 96 -10 94 40 V112 Q94 124 82 124 H18 Q6 124 6 112 Z"
          {...hp}
        />
      )}
      {look.hair === "twintails" && (
        <>
          <path d="M16 34 C-6 40 -12 92 6 112 C20 100 26 70 26 46 Z" {...hp} />
          <path
            d="M84 34 C106 40 112 92 94 112 C80 100 74 70 74 46 Z"
            {...hp}
          />
        </>
      )}
      {look.hair === "ponytail" && (
        <path d="M76 16 C108 18 112 70 92 100 C92 78 86 58 76 46 Z" {...hp} />
      )}
      {look.hair === "bun" && <circle cx="50" cy="-4" r="13" {...hp} />}
    </>
  );
  // Fringe and top of the hair, over the head
  const frontHair = look.hair !== "none" && (
    <>
      <path
        d={
          look.hair === "spiky"
            ? SPIKY
            : ["bob", "long", "twintails"].includes(look.hair)
              ? FRINGE_SOFT
              : FRINGE_JAG
        }
        {...hp}
      />
      <path
        d="M26 14 Q40 6 56 8"
        fill="none"
        stroke="#fff"
        strokeOpacity=".4"
        strokeWidth="4"
      />
      {look.hair === "twintails" && (
        <>
          <circle cx="18" cy="38" r="4.5" fill={TIE} strokeWidth="3" />
          <circle cx="82" cy="38" r="4.5" fill={TIE} strokeWidth="3" />
        </>
      )}
      {look.hair === "ponytail" && (
        <circle cx="80" cy="18" r="4.5" fill={TIE} strokeWidth="3" />
      )}
    </>
  );

  const bodyOnly = (ink: boolean) => (
    <path
      d={BODY}
      fill={ink ? INK : color}
      stroke={ink ? INK : "none"}
      strokeWidth="10"
    />
  );

  // Drawn on top of the body and the shirt, so the arms stay visible when they swing in front of the torso.
  const shoulderFill = look.shirt !== "none" ? look.shirtColor : color;
  const armsLayer = (
    <>
      {/* 1. arm outlines */}
      {arms.map((d, i) => (
        <path
          key={`ai${i}`}
          className={i === 0 ? "arm armL" : "arm armR"}
          d={d}
          stroke={INK}
          strokeWidth="20"
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
          strokeWidth="11"
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
              strokeWidth="12"
            />
          ))}
          {/* fills the round top of the arm. It sits on the pivot, so it doesn't move when the arm rotates */}
          <circle cx="33" cy="88" r="6" fill={look.shirtColor} stroke="none" />
          <circle cx="67" cy="88" r="6" fill={look.shirtColor} stroke="none" />
        </>
      )}
    </>
  );

  // Clothes on the torso. Lives inside the second .upper, so it moves with the body.
  // Sleeves reuse the arm classes so they swing with the arms.
  const torsoClothes = (
    <>
      {look.shirt !== "none" && (
        <g clipPath={`url(#${bodyClip})`}>
          <rect
            x="10"
            y="76"
            width="80"
            height="64"
            fill={look.shirtColor}
            stroke="none"
          />
          {look.shirt === "stripe" &&
            [90, 100, 110, 120, 130].map((y) => (
              <path
                key={y}
                d={`M10 ${y} H90`}
                stroke="#fff"
                strokeOpacity=".55"
                strokeWidth="4"
              />
            ))}
          {look.shirt === "hoodie" && (
            <path d="M36 122 Q50 130 64 122" strokeWidth="2.5" />
          )}
          {look.shirt !== "tank" && (
            <path d="M40 80 Q50 90 60 80" strokeWidth="2.5" />
          )}
          <path d="M10 140 H90" strokeWidth="2.5" />
        </g>
      )}

      {(look.pants === "shorts" || look.pants === "jeans") && (
        <>
          <g clipPath={`url(#${pantsEdge})`}>
            <path
              d={SHIRT_CLIP}
              fill={look.pantsColor}
              stroke={look.pantsColor}
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </g>
          <g clipPath={`url(#${bodyClip})`}>
            <rect
              x="10"
              y="122"
              width="80"
              height="40"
              fill={look.pantsColor}
              stroke="none"
            />
            <path d="M10 122 H90 M50 138 V150" strokeWidth="3.5" />
          </g>
        </>
      )}

      {look.pants === "skirt" && (
        <g>
          {/* fill: the top edge sits inside the body, so it has no outline */}
          <path
            d="M23.5 110 C20 119 8 130 6 149 Q18 155 30 149 Q40 155 50 150 Q60 155 70 149 Q82 155 94 149 C92 130 80 119 76.5 110 Z"
            fill={look.pantsColor}
            stroke="none"
          />
          {/* soft fold shading */}
          <path
            d="M36 118 Q33 134 29 149 Q40 155 50 150 Q47 134 46 118 Z M64 118 Q67 134 71 149 Q60 155 50 150 Q53 134 54 118 Z"
            fill="#000"
            fillOpacity=".1"
            stroke="none"
          />
          {/* pleat lines */}
          <path
            d="M36 118 Q33 134 29 149 M50 120 V150 M64 118 Q67 134 71 149"
            fill="none"
            strokeWidth="2"
            strokeOpacity=".4"
          />
          {/* outline: sides and hem only, open at the top */}
          <path
            d="M23.5 110 C20 119 8 130 6 149 Q18 155 30 149 Q40 155 50 150 Q60 155 70 149 Q82 155 94 149 C92 130 80 119 76.5 110"
            fill="none"
            strokeWidth="2.5"
          />
        </g>
      )}
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

  const hat = (
    <>
      {look.hat === "cap" && (
        <g>
          <path
            d="M11 32 C9 -8 91 -8 89 32 Q98 31 101 37 Q78 44 50 36 Q30 34 11 32 Z"
            {...hc}
          />
          <path d="M16 31 Q50 37 84 31" fill="none" strokeWidth="2.5" />
          <circle cx="50" cy="1" r="2.5" fill={INK} stroke="none" />
        </g>
      )}
      {look.hat === "beanie" && (
        <g>
          <path d="M11 31 C9 -12 91 -12 89 31 Z" {...hc} />
          <path d="M10 20 Q50 26 90 20 L89 31 Q50 37 11 31 Z" {...hc} />
          <circle cx="50" cy="-6" r="7" {...hc} />
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
        </g>
      )}
      {look.hat === "crown" && (
        <g>
          <path
            d="M20 22 L16 -2 L33 10 L50 -8 L67 10 L84 -2 L80 22 Z"
            {...hc}
          />
          <circle cx="50" cy="10" r="3" fill="#e5566d" stroke="none" />
          <circle cx="32" cy="16" r="2.5" fill="#4a90e2" stroke="none" />
          <circle cx="68" cy="16" r="2.5" fill="#4a90e2" stroke="none" />
        </g>
      )}
      {look.hat === "ears" && (
        <g>
          <path d="M16 22 L18 -8 L42 8 Z" {...hc} />
          <path d="M84 22 L82 -8 L58 8 Z" {...hc} />
          <path d="M22 14 L23 0 L35 8 Z" fill="#ffb3c7" stroke="none" />
          <path d="M78 14 L77 0 L65 8 Z" fill="#ffb3c7" stroke="none" />
        </g>
      )}
      {look.hat === "party" && (
        <g>
          <path d="M30 14 L50 -34 L70 14 Z" {...hc} />
          <path
            d="M38 -5 L62 -5 M34 5 L66 5"
            stroke="#fff"
            strokeOpacity=".6"
            strokeWidth="3"
          />
          <circle cx="50" cy="-34" r="5" fill="#fff" strokeWidth="3" />
        </g>
      )}
    </>
  );

  return (
    <svg
      viewBox="0 0 100 178"
      width={w}
      height={h}
      fill="none"
      stroke={INK}
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ overflow: "visible" }}
    >
      <defs>
        <clipPath id={bodyClip}>
          {/* <path d={BODY} /> */}
          <path d={SHIRT_CLIP} />
        </clipPath>
        <clipPath id={bodyClip}>
          <path d={BODY} />
          <rect x="24" y="130" width="52" height="24" />
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
        {legs.map(([x]) => (
          <clipPath key={x} id={legClip(x)}>
            <path d={stump(x)} />
          </clipPath>
        ))}
      </defs>
      <ellipse
        className="shadow"
        cx="50"
        cy="175"
        rx="20"
        ry="2.5"
        fill="rgba(0,0,0,.18)"
        stroke="none"
      />
      <g className="upper">
        <g className="head">{backHair}</g>
        {bodyOnly(true)}
      </g>
      {/* Each leg keeps its own outline, so when one passes over the other the line shows between them. */}
      {legs.map(([x, cls]) => (
        <g key={cls} className={`legGap ${cls === "legL" ? "gapL" : "gapR"}`}>
          <g className={`leg ${cls}`}>
            <path d={stump(x)} fill={INK} stroke={INK} strokeWidth="10" />
            <path d={stump(x)} fill={color} stroke="none" />
            {look.pants === "jeans" && (
              <>
                <path d={stump(x)} fill={look.pantsColor} stroke="none" />
                <path d={`M${x - 10.5} 163 H${x + 10.5}`} strokeWidth="2.5" />
              </>
            )}
            {look.pants === "shorts" && (
              <rect
                x={x - 12}
                y="100"
                width="24"
                height="52"
                fill={look.pantsColor}
                stroke="none"
                clipPath={`url(#${legClip(x)})`}
              />
            )}
          </g>
        </g>
      ))}
      <g className="upper">
        {bodyOnly(false)}
        {torsoClothes}
        {armsLayer}
        <g className="head">
          <circle cx="50" cy="45" r="40" fill={color} />
          {frontHair && <g className="hair">{frontHair}</g>}
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
