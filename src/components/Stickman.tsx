import type { Pose } from "../reactions";
import { INK } from "../constants";
import type { Eyes } from "../types";

const DEFAULT_EYES: Eyes = {
  size: 1,
  pupil: 1,
  gap: 22,
  pupilColor: INK,
  track: true,
};

// Chunky blob character: thick outline, big head, tube limbs, white eyes with pupils glancing sideways.
// uid keeps the SVG clip-path ids unique when the character is drawn twice (the pet and the control panel preview).
export function Stickman({
  pose,
  color,
  w,
  h,
  eyes = DEFAULT_EYES,
  uid = "pet",
}: {
  pose: Pose;
  color: string;
  w: number;
  h: number;
  eyes?: Eyes;
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

  // Among Us style legs: plain stubby legs with no separate foot.
  const legs = [
    [37, "legL"],
    [63, "legR"],
  ] as const;
  // Among Us style legs: plain stubby legs, straight sides, flat rounded-off bottoms, no separate foot.
  const stump = (x: number) =>
    `M${x - 10.5} 124 H${x + 10.5} V164 Q${x + 10.5} 172 ${x + 2.5} 172 H${x - 2.5} Q${x - 10.5} 172 ${x - 10.5} 164 Z`;

  // Body and arms are drawn in two passes (ink, then color) so they read as one silhouette.
  const bodyAndArms = (ink: boolean) => (
    <>
      <path
        d={BODY}
        fill={ink ? INK : color}
        stroke={ink ? INK : "none"}
        strokeWidth="10"
      />
      {arms.map((d, i) => (
        <path
          key={d}
          className={i === 0 ? "arm armL" : "arm armR"}
          d={d}
          stroke={ink ? INK : color}
          strokeWidth={ink ? 21 : 11}
        />
      ))}
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
            r={1.2 * Math.min(eyes.pupil, 1.3)}
            fill="#fff"
            stroke="none"
          />
        </g>
      </g>
    </g>
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
    >
      <ellipse
        cx="50"
        cy="175"
        rx="20"
        ry="2.5"
        fill="rgba(0,0,0,.18)"
        stroke="none"
      />
      {bodyAndArms(true)}
      {/* Each leg keeps its own outline, so when one passes over the other the line shows between them. */}
      {legs.map(([x, cls]) => (
        <g key={cls} className={`legGap ${cls === "legL" ? "gapL" : "gapR"}`}>
          <g className={`leg ${cls}`}>
            <path d={stump(x)} fill={INK} stroke={INK} strokeWidth="10" />
            <path d={stump(x)} fill={color} stroke="none" />
          </g>
        </g>
      ))}
      {bodyAndArms(false)}
      <circle cx="50" cy="45" r="40" fill={color} />
      <g className="face">
        {eye(39, "eyeL")}
        {eye(61, "eyeR")}
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
    </svg>
  );
}
