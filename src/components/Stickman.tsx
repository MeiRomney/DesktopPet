import type { Pose } from "../reactions";
import { INK, BODY_SCALE as S, VB_H, FEET_Y } from "../constants";
import type { Eyes } from "../types";
import { DEFAULT_LOOK } from "../characters";
import type { Look, ShirtId } from "../characters";
import { BackHair, FrontHair } from "./Hair";

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
  crop: 38,
  sailor: 38,
  dress: 0,
  sweater: 92,
  offshoulder: 92,
  halter: 0,
};
// Shirt: flares out below the chest so it covers the hips. Not clipped to the body.
const SHIRT =
  "M36 80 C27 92 22 102 23 112 C19 122 20 132 22 138 Q50 148 78 138 C80 132 81 122 77 112 C78 102 73 92 64 80 Z";
const SHIRT_HEM =
  "M23 112 C19 122 20 132 22 138 Q50 148 78 138 C80 132 81 122 77 112"; // outline of the flared part only
const SHIRT_CLIP =
  "M30 82 C26 94 20 116 24 134 Q31 148 50 148 Q69 148 76 136 C80 116 74 94 70 82 Z";

const SKIRT_D =
  "M23.5 110 C20 119 8 130 6 149 Q18 155 30 149 Q40 155 50 150 Q60 155 70 149 Q82 155 94 149 C92 130 80 119 76.5 110 Z";
// const MINI_D =
//   "M20.5 110 C16 120 13 130 10 146 Q20 152 30 146 Q40 152 50 147 Q60 152 70 146 Q80 152 90 146 C87 130 84 120 79.5 110 Z";
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
  const pantsClip = `pants-${uid}`;
  const shirtClip = `shirt-${uid}`;
  const pantsEdge = `pantsedge-${uid}`;
  const topClip = `bodytop-${uid}`;
  const legClip = (x: number) => `leg-${uid}-${x}`;
  const hc = { fill: look.hatColor, stroke: INK, strokeWidth: 4 };
  const sleeve = SLEEVE[look.shirt];

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

  const skirt = (d: string, c: string, detail: boolean) => (
    <g>
      <path d={d} fill={c} stroke="none" />
      {detail && (
        <>
          <path
            d="M36 118 Q33 134 29 149 Q40 155 50 150 Q47 134 46 118 Z M64 118 Q67 134 71 149 Q60 155 50 150 Q53 134 54 118 Z"
            fill="#000"
            fillOpacity=".1"
            stroke="none"
          />
          <path
            d="M36 118 Q33 134 29 149 M50 120 V150 M64 118 Q67 134 71 149"
            fill="none"
            strokeWidth={sw(2)}
            strokeOpacity=".4"
          />
        </>
      )}
      <path d={d.replace(" Z", "")} fill="none" strokeWidth={sw(2.5)} />
    </g>
  );

  // Clothes on the torso. Lives inside the second .upper, so it moves with the body.
  // Sleeves reuse the arm classes so they swing with the arms.
  const shirtTop =
    look.shirt === "offshoulder" ? 92 : look.shirt === "halter" ? 88 : 76;
  const shirtBottom =
    look.shirt === "crop"
      ? 108
      : look.shirt === "offshoulder" || look.shirt === "halter"
        ? 106
        : 140;
  const torsoClothes = (
    <>
      {look.shirt !== "none" && (
        <g clipPath={`url(#${bodyClip})`}>
          <rect
            x="10"
            y={shirtTop}
            width="80"
            height={shirtBottom - shirtTop}
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
            <path d="M36 122 Q50 130 64 122" strokeWidth={sw(2.5)} />
          )}
          {!["tank", "offshoulder", "halter"].includes(look.shirt) && (
            <path d="M40 80 Q50 90 60 80" strokeWidth={sw(2.5)} />
          )}
          {look.shirt === "halter" && (
            <path
              d="M40 82 L43 90 M60 82 L57 90"
              stroke={look.shirtColor}
              strokeWidth="3"
            />
          )}
          <path d={`M10 ${shirtBottom} H90`} strokeWidth={sw(2.5)} />
          {look.shirt === "sailor" && (
            <>
              <path
                d="M33 84 L50 104 L67 84 L61 82 L50 94 L39 82 Z"
                fill="#fff"
                strokeWidth={sw(2.5)}
              />
              <path
                d="M50 104 L40 98 L40 110 Z M50 104 L60 98 L60 110 Z"
                fill="#e5566d"
                strokeWidth={sw(2)}
              />
            </>
          )}
          {look.shirt === "sweater" && (
            <path
              d="M34 82 Q50 94 66 82 V88 Q50 100 34 88 Z"
              fill={look.shirtColor}
              strokeWidth={sw(2.5)}
            />
          )}
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
            <path d="M10 122 H90 M50 138 V150" strokeWidth={sw(3.5)} />
          </g>
        </>
      )}

      {look.shirt === "dress" && skirt(SKIRT_D, look.shirtColor, true)}
      {look.pants === "skirt" && skirt(SKIRT_D, look.pantsColor, true)}
      {look.pants === "mini" && skirt(MINI_D, look.pantsColor, false)}

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
            strokeWidth={sw(2)}
            strokeOpacity=".4"
          />
          {/* outline: sides and hem only, open at the top */}
          <path
            d="M23.5 110 C20 119 8 130 6 149 Q18 155 30 149 Q40 155 50 150 Q60 155 70 149 Q82 155 94 149 C92 130 80 119 76.5 110"
            fill="none"
            strokeWidth={sw(2.5)}
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
      {look.hat === "bow" && (
        <g>
          <path d="M68 4 L46 -8 L46 16 Z M68 4 L90 -8 L90 16 Z" {...hc} />
          <circle cx="68" cy="4" r="5" {...hc} />
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
          <circle
            cx="76"
            cy="10"
            r="5"
            fill="#f0a030"
            stroke={INK}
            strokeWidth="3"
          />
        </g>
      )}
      {look.hat === "witch" && (
        <g>
          <ellipse cx="50" cy="14" rx="46" ry="8" {...hc} />
          <path
            d="M26 12 C34 -4 42 -20 46 -40 Q58 -44 66 -34 C62 -20 68 0 74 12 Z"
            {...hc}
          />
          <path
            d="M30 4 Q50 10 70 4 L72 10 Q50 16 28 10 Z"
            fill="#fff"
            fillOpacity=".4"
            stroke="none"
          />
        </g>
      )}
      {look.hat === "phones" && (
        <g>
          <path d="M12 44 C8 -6 92 -6 88 44" fill="none" strokeWidth="5" />
          <rect x="2" y="36" width="14" height="26" rx="6" {...hc} />
          <rect x="84" y="36" width="14" height="26" rx="6" {...hc} />
        </g>
      )}
      {look.hat === "horns" && (
        <g>
          <path d="M18 24 C6 14 8 -4 22 -8 C16 2 20 12 30 16 Z" {...hc} />
          <path d="M82 24 C94 14 92 -4 78 -8 C84 2 80 12 70 16 Z" {...hc} />
        </g>
      )}
    </>
  );

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
        cy={FEET_Y + 2.5}
        rx="17"
        ry="2.5"
        fill="rgba(0,0,0,.18)"
        stroke="none"
      />
      <g className="upper">
        <g className="head">
          <BackHair look={look} />
        </g>
        <g transform={BODY_T} strokeWidth={sw(5)}>
          {bodyOnly(true)}
        </g>
      </g>
      {/* Each leg keeps its own outline, so when one passes over the other the line shows between them. */}
      <g transform={LEG_T} strokeWidth={sw(5)}>
        {legs.map(([x, cls]) => (
          <g key={cls} className={`legGap ${cls === "legL" ? "gapL" : "gapR"}`}>
            <g className={`leg ${cls}`}>
              <path d={stump(x)} fill={INK} stroke={INK} strokeWidth={sw(10)} />
              <path d={stump(x)} fill={color} stroke="none" />
              {look.pants === "jeans" && (
                <>
                  <path d={stump(x)} fill={look.pantsColor} stroke="none" />
                  <path
                    d={`M${x - 10.5} 163 H${x + 10.5}`}
                    strokeWidth={sw(2.5)}
                  />
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
              {look.socks && (
                <>
                  <rect
                    x={x - 12}
                    y={look.thighHigh ? 122 : 136}
                    width="24"
                    height="40"
                    fill={look.socksColor}
                    stroke="none"
                    clipPath={`url(#${legClip(x)})`}
                  />
                  <path
                    d={`M${x - 10.5} 136 H${x + 10.5}`}
                    stroke="#fff"
                    strokeOpacity=".7"
                    strokeWidth={sw(3)}
                  />
                </>
              )}
              {look.garter && x === 63 && (
                <path
                  d={`M${x - 12} 130 H${x + 12}`}
                  stroke="#2b2b33"
                  strokeWidth={sw(4)}
                  clipPath={`url(#${legClip(x)})`}
                />
              )}
            </g>
          </g>
        ))}
      </g>
      <g className="upper">
        <g transform={BODY_T} strokeWidth={sw(5)}>
          {bodyOnly(false)}
          {/* {armsLayer} */}
          {torsoClothes}
          {armsLayer}
        </g>
        <g className="head">
          <circle cx="50" cy="45" r="40" fill={color} />
          {look.hair !== "none" && (
            <g className="hair">
              <FrontHair look={look} />
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
