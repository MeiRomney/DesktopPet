import { useEffect, useRef, useState } from "react";
import type { Pose } from "./reactions";
import {
  ITEMS,
  idleLine,
  nearPose,
  react as scripted,
  visit,
} from "./reactions";

type Obj = { id: number; emoji: string; name: string; x: number; y: number };
type Reply = { ok: boolean; pose?: Pose; says?: string; error?: string };

declare global {
  interface Window {
    api: {
      clickThrough(on: boolean): void;
      react(e: string): Promise<Reply>;
      look(): Promise<Reply>;
      remember(t: string): void;
      hide(): void;
    };
  }
}

const BASE_W = 72,
  BASE_H = 128; // pet size in px at 100% (SVG viewBox is 100 x 178)
const COLORS = ["#43474f", "#e5566d", "#4a90e2", "#2fbf71", "#f0a030"]; // body colors; first is the default charcoal
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), hi);

const INK = "#111";
const SCARY = ["a gun", "a sword", "a bomb"]; // the pet runs away from these when you bring them close
const APPROACH = ["a cake", "a piano", "a cat"]; // the pet walks over to these when you leave them somewhere
const WEAPONS = ["a gun", "a sword"]; // these always appear to the right of the pet, at head level
type Rect = { x: number; y: number; w: number; h: number };
const rectFrom = (a: { x: number; y: number }, x: number, y: number): Rect => ({
  x: Math.min(a.x, x),
  y: Math.min(a.y, y),
  w: Math.abs(x - a.x),
  h: Math.abs(y - a.y),
});
const FLEE_LINES = [
  "Keep that away from me!",
  "Nope nope nope!",
  "I am out of here!",
  "Not coming near that!",
];

// Chunky blob character: thick outline, big head, tube limbs, white eyes with pupils glancing sideways.
function Stickman({
  pose,
  color,
  w,
  h,
}: {
  pose: Pose;
  color: string;
  w: number;
  h: number;
}) {
  const up = pose === "scared" || pose === "shocked" || pose === "happy";
  const wide = pose === "scared" || pose === "shocked";
  const rx = wide ? 8.5 : 7,
    ry = wide ? 11.5 : 9.5,
    pr = pose === "shocked" ? 3 : 4.2;
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
  const eye = (cx: number) => (
    <g key={cx}>
      <ellipse
        cx={cx}
        cy="48"
        rx={rx}
        ry={ry}
        fill="#fff"
        stroke={INK}
        strokeWidth="3"
      />
      <clipPath id={`eyeclip-${cx}`}>
        <ellipse cx={cx} cy="48" rx={rx} ry={ry} />
      </clipPath>
      <g clipPath={`url(#eyeclip-${cx})`}>
        <g className="pupil">
          <circle cx={cx} cy="48" r={pr} fill={INK} stroke="none" />
          <circle cx={cx - 0.9} cy="46" r="1.2" fill="#fff" stroke="none" />
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
      {eye(39)}
      {eye(61)}
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
    </svg>
  );
}

export default function App() {
  const [pos, setPos] = useState({
    x: window.innerWidth - 240,
    y: window.innerHeight - 380,
  });
  const [pose, setPose] = useState<Pose>("neutral");
  const [color, setColor] = useState(COLORS[0]);
  const [says, setSays] = useState("");
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [objs, setObjs] = useState<Obj[]>([]);
  const [thinking, setThinking] = useState(false);
  const [userSays, setUserSays] = useState(""); // what you just typed, shown for a few seconds
  const [facing, setFacing] = useState<1 | -1>(1);
  const [moveMs, setMoveMs] = useState(0); // >0 while walking by itself
  const [stride, setStride] = useState(false); // leg animation on; ends at a stride boundary
  const [look, setLook] = useState(() => localStorage.getItem("look") === "1"); // off until you turn it on

  const [size, setSize] = useState(() =>
    clamp(Number(localStorage.getItem("size")) || 1, 0.6, 1.8),
  ); // 1 = default
  const sz = useRef(size);
  sz.current = size;
  const dims = () => ({ W: BASE_W * sz.current, H: BASE_H * sz.current }); // always current, even in old closures
  const W = BASE_W * size,
    H = BASE_H * size;

  // Optional zone: when on, the pet only moves around inside this rectangle.
  const [zone, setZone] = useState<Rect | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("zone") || "null");
    } catch {
      return null;
    }
  });
  const [zoneOn, setZoneOn] = useState(
    () => localStorage.getItem("zoneOn") === "1",
  );
  const [drawing, setDrawing] = useState(false);
  const [draft, setDraft] = useState<Rect | null>(null);
  const [flash, setFlash] = useState(false); // briefly shows the zone outline after you set or toggle it
  const zStart = useRef<{ x: number; y: number } | null>(null);
  const flashTimer = useRef<number>();

  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    dx: number;
    dy: number;
    sx: number;
    sy: number;
    moved: boolean;
  } | null>(null);
  const objDrag = useRef<{
    id: number;
    dx: number;
    dy: number;
    sx: number;
    sy: number;
    moved: boolean;
  } | null>(null);
  const bubbleTimer = useRef<number>();
  const userTimer = useRef<number>();
  const walkId = useRef(0);
  const near = useRef<number | null>(null);
  const lastFlee = useRef(0);
  const hovering = useRef(false);
  const busy = useRef(false);
  const lookOn = useRef(look);
  const activeZone = zoneOn ? zone : null;
  const S = useRef({ pos, open, objs, moveMs, zone: activeZone, facing });
  S.current = { pos, open, objs, moveMs, zone: activeZone, facing };
  lookOn.current = look;

  // Where the pet may stand (its top-left corner): inside the zone if one is on, otherwise anywhere on screen.
  const bounds = () => {
    const { W, H } = dims();
    const z = S.current.zone;
    if (!z)
      return {
        minX: 0,
        minY: 40,
        maxX: window.innerWidth - W,
        maxY: window.innerHeight - H - 8,
      };
    const minX = z.w >= W ? z.x : z.x + (z.w - W) / 2,
      minY = z.h >= H ? z.y : z.y + (z.h - H) / 2;
    return {
      minX,
      minY,
      maxX: z.w >= W ? z.x + z.w - W : minX,
      maxY: z.h >= H ? z.y + z.h - H : minY,
    };
  };

  // Let clicks through everywhere except over the pet, its panel and objects.
  const hover = {
    onMouseEnter: () => {
      hovering.current = true;
      window.api.clickThrough(false);
    },
    onMouseLeave: () => {
      hovering.current = false;
      if (!drag.current && !objDrag.current) window.api.clickThrough(true);
    },
  };

  const showBubble = (t: string, ms = 7000) => {
    setSays(t);
    window.clearTimeout(bubbleTimer.current);
    bubbleTimer.current = window.setTimeout(() => setSays(""), ms);
  };

  // Scripted reaction: instant, free, and logged to memory so chat can refer to it later.
  const sayLocal = (p: Pose, t: string, memory?: string) => {
    setPose(p);
    showBubble(t, 5000);
    if (memory) window.api.remember(memory);
  };

  // AI use #1: replying when you text it (and the random AI moments below). onFail lets background calls
  // fall back quietly when Ollama is not running; your own messages always show the error.
  const say = async (event: string, onFail?: () => void) => {
    busy.current = true;
    setThinking(true);
    const r = await window.api.react(event);
    busy.current = false;
    setThinking(false);
    if (!r.ok && onFail) {
      onFail();
      return;
    }
    setPose(r.ok ? r.pose! : "sad");
    showBubble(
      r.ok ? r.says! : `No brain found. Is Ollama running? (${r.error})`,
    );
  };

  // AI use #2: about 1 in 4 object reactions is answered by the AI instead of the scripted line.
  const AI_CHANCE = 0.25;
  const reactTo = (
    r: { pose: Pose; says: string },
    event: string,
    memory: string,
  ) => {
    if (Math.random() < AI_CHANCE && !busy.current) {
      setPose(r.pose);
      say(event, () => sayLocal(r.pose, r.says, memory)); // AI is off or failed: use the scripted line
    } else sayLocal(r.pose, r.says, memory);
  };

  // AI use #4: an occasional glance at the desktop (vision model).
  const lookAround = async (manual: boolean) => {
    if (busy.current) return;
    busy.current = true;
    setThinking(true);
    const r = await window.api.look();
    busy.current = false;
    setThinking(false);
    if (r.ok) {
      setPose(r.pose!);
      showBubble(r.says!, 9000);
    } else if (manual) {
      setPose("sad");
      showBubble(`I could not look. Is the vision model pulled? (${r.error})`);
    }
  };

  const toggleLook = () => {
    const n = !look;
    setLook(n);
    localStorage.setItem("look", n ? "1" : "0");
  };

  const walkTo = (x: number, y: number, then?: () => void, speed = 70) => {
    const { W, H } = dims();
    const p = S.current.pos;
    const id = ++walkId.current;
    const b = bounds();
    const nx = clamp(x, b.minX, b.maxX);
    const ny = clamp(y, b.minY, b.maxY);
    const ms = Math.max(350, (Math.hypot(nx - p.x, ny - p.y) / speed) * 1000); // walks ~70 px/s, runs ~260 px/s
    setFacing(nx < p.x ? -1 : 1);
    setMoveMs(ms);
    setStride(true);
    setPos({ x: nx, y: ny });
    window.setTimeout(() => {
      if (walkId.current !== id) return;
      setMoveMs(0);
      then?.();
    }, ms);
  };

  // Run to the screen corner that is farthest from the object.
  const flee = (ox: number, oy: number) => {
    const { W, H } = dims();
    const b = bounds();
    const spots: [number, number][] = [
      [b.minX, b.minY],
      [b.maxX, b.minY],
      [b.minX, b.maxY],
      [b.maxX, b.maxY],
    ];
    let best = spots[0],
      far = -1;
    for (const [sx, sy] of spots) {
      const d = Math.hypot(sx + W / 2 - ox, sy + H / 2 - oy);
      if (d > far) {
        far = d;
        best = [sx, sy];
      }
    }
    setPose("scared");
    walkTo(best[0], best[1], () => setPose("neutral"), 260);
  };

  const use = (o: Obj) => {
    hovering.current = false;
    setObjs((l) => l.filter((x) => x.id !== o.id));
    window.api.clickThrough(true);
    reactTo(
      scripted(o.emoji, "use"),
      `The user dragged ${o.name} ${o.emoji} onto you and used it on you!`,
      `The user dragged ${o.name} ${o.emoji} onto me and used it on me.`,
    );
  };

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const d = drag.current,
        od = objDrag.current;
      if (d) {
        if (
          !d.moved &&
          Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) > 4
        ) {
          d.moved = true;
          setPose("shocked");
        }
        if (d.moved) setPos({ x: e.clientX - d.dx, y: e.clientY - d.dy });
      } else if (od) {
        if (
          !od.moved &&
          Math.abs(e.clientX - od.sx) + Math.abs(e.clientY - od.sy) > 3
        )
          od.moved = true;
        if (!od.moved) return;
        const nx = e.clientX - od.dx,
          ny = e.clientY - od.dy;
        setObjs((l) =>
          l.map((o) => (o.id === od.id ? { ...o, x: nx, y: ny } : o)),
        );
        const p = S.current.pos;
        const { W, H } = dims();
        const dist = Math.hypot(
          nx + 22 - (p.x + W / 2),
          ny + 22 - (p.y + H / 2),
        );
        const ob = S.current.objs.find((o) => o.id === od.id);
        const emoji = ob?.emoji ?? "";
        if (ob && SCARY.includes(ob.name)) {
          if (dist < 240 * sz.current && Date.now() - lastFlee.current > 500) {
            lastFlee.current = Date.now();
            flee(nx + 22, ny + 22);
            if (near.current !== od.id) {
              near.current = od.id;
              sayLocal(
                "scared",
                FLEE_LINES[Math.floor(Math.random() * FLEE_LINES.length)],
                `The user chased me with ${ob.name} ${emoji}, so I ran away.`,
              );
            }
          } else if (dist >= 240 * sz.current && near.current === od.id)
            near.current = null;
        } else if (dist < 130 * sz.current && near.current !== od.id) {
          near.current = od.id;
          setFacing(nx < p.x ? -1 : 1);
          setPose(nearPose(emoji));
        } else if (dist >= 130 * sz.current && near.current === od.id) {
          near.current = null;
          setPose("neutral");
        }
      }
    };
    const up = () => {
      const { W, H } = dims();
      const d = drag.current,
        od = objDrag.current;
      drag.current = null;
      objDrag.current = null;
      near.current = null;
      if (d) {
        if (d.moved) {
          setPose("neutral");
          if (S.current.zone) {
            // you dragged it out of its zone: it walks back in
            const b = bounds(),
              p = S.current.pos;
            const nx = clamp(p.x, b.minX, b.maxX),
              ny = clamp(p.y, b.minY, b.maxY);
            if (nx !== p.x || ny !== p.y) walkTo(nx, ny);
          }
        } else setOpen((o) => !o);
      } // a click toggles the panel
      if (od && !od.moved) {
        // a plain click on an object makes it disappear
        hovering.current = false;
        setObjs((l) => l.filter((x) => x.id !== od.id));
        window.api.clickThrough(true);
      }
      if (od && od.moved) {
        const o = S.current.objs.find((x) => x.id === od.id),
          p = S.current.pos;
        if (!o) return;
        if (
          Math.hypot(o.x + 22 - (p.x + W / 2), o.y + 22 - (p.y + H / 2)) <
          70 * sz.current
        )
          use(o); // dropped on the pet
        else if (APPROACH.includes(o.name))
          walkTo(o.x - W, o.y + 44 - H, () => {
            reactTo(
              visit(o.emoji),
              `You walked over to ${o.name} ${o.emoji} that the user left on the desktop.`,
              `I walked over to ${o.name} ${o.emoji} that the user left on the desktop.`,
            );
          });
      }
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, []);

  // Wander around the desktop on its own; wave or mutter a line now and then. No AI here.
  useEffect(() => {
    let t: number;
    const loop = () => {
      t = window.setTimeout(
        () => {
          if (
            !drag.current &&
            !objDrag.current &&
            !hovering.current &&
            !busy.current &&
            !S.current.open
          ) {
            if (Math.random() < 0.3) {
              setPose("wave");
              window.setTimeout(() => setPose("neutral"), 2000);
            } else {
              const b = bounds();
              walkTo(
                b.minX + Math.random() * (b.maxX - b.minX),
                S.current.zone
                  ? b.minY + Math.random() * (b.maxY - b.minY)
                  : window.innerHeight * (0.4 + Math.random() * 0.5),
              );
              if (Math.random() < 0.3) showBubble(idleLine(), 3500);
            }
          }
          loop();
        },
        5000 + Math.random() * 8000,
      );
    };
    loop();
    return () => window.clearTimeout(t);
  }, []);

  // Every 8-15 minutes, if you enabled it, take a glance at the desktop.
  useEffect(() => {
    let t: number;
    const loop = () => {
      t = window.setTimeout(
        () => {
          if (
            lookOn.current &&
            !S.current.open &&
            !drag.current &&
            !objDrag.current
          )
            lookAround(false);
          loop();
        },
        8 * 60000 + Math.random() * 7 * 60000,
      );
    };
    loop();
    return () => window.clearTimeout(t);
  }, []);

  // AI use #3: every couple of minutes, at a random moment, it says something spontaneous.
  useEffect(() => {
    let t: number;
    const loop = () => {
      t = window.setTimeout(
        () => {
          if (
            !drag.current &&
            !objDrag.current &&
            !hovering.current &&
            !busy.current &&
            !S.current.open
          )
            say(
              "You are idle and nobody is talking to you. Say something spontaneous: a thought, a joke, or something you remember.",
              () => {},
            );
          loop();
        },
        120000 + Math.random() * 180000,
      );
    };
    loop();
    return () => window.clearTimeout(t);
  }, []);

  // After the size or zone changes, walk the pet back into the allowed area if it is outside.
  useEffect(() => {
    const b = bounds(),
      p = S.current.pos;
    const nx = clamp(p.x, b.minX, b.maxX),
      ny = clamp(p.y, b.minY, b.maxY);
    if (nx !== p.x || ny !== p.y) walkTo(nx, ny);
  }, [size, zoneOn, zone]);

  // Esc cancels drawing a zone.
  useEffect(() => {
    if (!drawing) return;
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      zStart.current = null;
      setDrawing(false);
      setDraft(null);
      window.api.clickThrough(true);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [drawing]);

  // The pupils follow the mouse. (The overlay still receives mouse moves while it lets clicks pass through.)
  useEffect(() => {
    const m = { x: 0, y: 0, seen: false };
    const onMove = (e: MouseEvent) => {
      m.x = e.clientX;
      m.y = e.clientY;
      m.seen = true;
    };
    window.addEventListener("mousemove", onMove);
    const t = window.setInterval(() => {
      const el = wrapRef.current;
      if (!m.seen || !el) return;
      const r = el.getBoundingClientRect(),
        k = r.width / 100; // px per SVG unit
      const dx = m.x - (r.left + 50 * k),
        dy = m.y - (r.top + 48 * k); // from the middle of the eyes to the mouse
      const dist = Math.hypot(dx, dy),
        f = Math.min(1, dist / 160); // looks all the way once the mouse is ~160px away
      const ox = dist > 1 ? (dx / dist) * f * S.current.facing * 2.6 : 0; // facing flips the whole pet
      const oy = dist > 1 ? (dy / dist) * f * 4.2 : 0;
      el.querySelectorAll<SVGGElement>(".pupil").forEach((p) => {
        p.style.transform = `translate(${ox.toFixed(2)}px, ${oy.toFixed(2)}px)`;
      });
    }, 40);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.clearInterval(t);
    };
  }, []);

  const down = (e: React.MouseEvent) => {
    const r = wrapRef.current!.getBoundingClientRect(); // grab it where it visually is, mid-walk or not
    walkId.current++;
    setMoveMs(0);
    setStride(false);
    setPos({ x: r.left, y: r.top });
    drag.current = {
      dx: e.clientX - r.left,
      dy: e.clientY - r.top,
      sx: e.clientX,
      sy: e.clientY,
      moved: false,
    };
  };

  const objDown = (e: React.MouseEvent, o: Obj) => {
    e.stopPropagation();
    objDrag.current = {
      id: o.id,
      dx: e.clientX - o.x,
      dy: e.clientY - o.y,
      sx: e.clientX,
      sy: e.clientY,
      moved: false,
    };
  };

  const spawn = (emoji: string, name: string) => {
    let x = clamp(
      pos.x + (pos.x > window.innerWidth / 2 ? -60 : 80),
      0,
      window.innerWidth - 50,
    );
    let y = pos.y + H - 50;
    if (WEAPONS.includes(name)) {
      // right of the pet, level with its head
      const r = wrapRef.current!.getBoundingClientRect();
      x = clamp(r.left + W + 12, 0, window.innerWidth - 50);
      y = r.top + (45 / 178) * H - 22;
      setFacing(1);
    }
    setObjs((o) => [...o, { id: Date.now(), emoji, name, x, y }]);
    reactTo(
      scripted(emoji, "spawn"),
      `The user placed ${name} ${emoji} next to you.`,
      `The user placed ${name} ${emoji} next to me.`,
    );
  };

  const flashZone = () => {
    setFlash(true);
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(false), 2500);
  };
  const startZone = () => {
    setOpen(false);
    setDraft(null);
    setDrawing(true);
    window.api.clickThrough(false);
  };
  const finishZone = (r: Rect) => {
    setDrawing(false);
    setDraft(null);
    window.api.clickThrough(true);
    if (r.w < 80 || r.h < 80) return; // too small: ignore
    setZone(r);
    setZoneOn(true);
    localStorage.setItem("zone", JSON.stringify(r));
    localStorage.setItem("zoneOn", "1");
    flashZone();
  };
  const toggleZone = () => {
    const n = !zoneOn;
    setZoneOn(n);
    localStorage.setItem("zoneOn", n ? "1" : "0");
    flashZone();
  };
  const clearZone = () => {
    setZone(null);
    setZoneOn(false);
    localStorage.removeItem("zone");
    localStorage.setItem("zoneOn", "0");
  };

  const changeSize = (v: number) => {
    setSize(v);
    localStorage.setItem("size", String(v));
  };

  const send = () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    setUserSays(t);
    window.clearTimeout(userTimer.current);
    userTimer.current = window.setTimeout(() => setUserSays(""), 4500);
    if (/\b(go away|leave|hide|bye)\b/i.test(t)) {
      say(`The user told you to leave: "${t}"`).then(() =>
        window.setTimeout(() => window.api.hide(), 2500),
      );
      return;
    }
    say(`The user said to you: "${t}"`);
  };

  return (
    <>
      {activeZone && (open || flash) && (
        <div
          className="zoneBox"
          style={{
            left: activeZone.x,
            top: activeZone.y,
            width: activeZone.w,
            height: activeZone.h,
          }}
        />
      )}
      {objs.map((o) => (
        <div
          key={o.id}
          className="obj"
          title="Click to remove, drag to move"
          style={{ left: o.x, top: o.y }}
          onMouseDown={(e) => objDown(e, o)}
          {...hover}
        >
          {o.emoji}
        </div>
      ))}
      <div
        ref={wrapRef}
        className="wrap"
        {...hover}
        style={{
          left: pos.x,
          top: pos.y,
          width: W,
          transition: moveMs
            ? `left ${moveMs}ms cubic-bezier(0.45, 0, 0.55, 1), top ${moveMs}ms cubic-bezier(0.45, 0, 0.55, 1)`
            : "none",
        }}
      >
        {says && <div className="bubble">{says}</div>}
        {userSays && (
          <div className={`userBubble ${pos.x > 230 ? "left" : "right"}`}>
            {userSays}
          </div>
        )}
        {thinking && <div className="thinking">...</div>}
        <div
          className={`pet ${pose}${stride ? " walking" : ""}`}
          onMouseDown={down}
          onAnimationIteration={(e) => {
            if (e.animationName.startsWith("step") && S.current.moveMs === 0)
              setStride(false);
          }}
        >
          <div style={{ transform: `scaleX(${facing})` }}>
            <Stickman pose={pose} color={color} w={W} h={H} />
          </div>
        </div>
        {open && (
          <div className="panel">
            <div className="toys">
              {ITEMS.map(([e, n]) => (
                <button
                  key={e}
                  className="toy"
                  title={`Drop ${n}`}
                  onClick={() => spawn(e, n)}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="row">
              <div className="swatches">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    className={`swatch${c === color ? " sel" : ""}`}
                    style={{ backgroundColor: c }}
                    title="Change color"
                    aria-label={`Color ${c}`}
                    aria-pressed={c === color}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
              <button
                className={`chip${look ? " on" : ""}`}
                title={
                  look
                    ? "Auto-look is ON: it glances at my screen every 8-15 minutes (click to turn off)"
                    : "Auto-look is OFF: click to let it glance at my screen every 8-15 minutes"
                }
                aria-label="Auto-look at my screen"
                aria-pressed={look}
                onClick={toggleLook}
              >
                👀
              </button>
              <button
                className="chip"
                title="Look now: glance at my screen once"
                aria-label="Look at my screen now"
                onClick={() => lookAround(true)}
              >
                📸
              </button>
            </div>
            <div className="sizeRow">
              <span className="sizeS" aria-hidden="true">
                A
              </span>
              <input
                type="range"
                min="0.6"
                max="1.8"
                step="0.05"
                value={size}
                title="Pet size"
                aria-label="Pet size"
                onChange={(e) => changeSize(Number(e.target.value))}
              />
              <span className="sizeL" aria-hidden="true">
                A
              </span>
            </div>
            <div className="zoneRow">
              <button
                className="pill"
                title="Draw a rectangle on screen; the pet will stay inside it"
                onClick={startZone}
              >
                {zone ? "Redraw zone" : "Set a zone"}
              </button>
              {zone && (
                <button
                  className={`pill${zoneOn ? " on" : ""}`}
                  aria-pressed={zoneOn}
                  title="Turn the zone on or off"
                  onClick={toggleZone}
                >
                  {zoneOn ? "Zone on" : "Zone off"}
                </button>
              )}
              {zone && (
                <button
                  className="pill"
                  aria-label="Remove zone"
                  title="Remove zone"
                  onClick={clearZone}
                >
                  ✕
                </button>
              )}
            </div>
            <div className="chat">
              <input
                value={text}
                autoFocus
                placeholder="Say something"
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <button
                className="send"
                title="Send"
                aria-label="Send"
                onClick={send}
              >
                ↑
              </button>
            </div>
          </div>
        )}
      </div>
      {drawing && (
        <div
          className="zoneOverlay"
          onMouseDown={(e) => {
            zStart.current = { x: e.clientX, y: e.clientY };
            setDraft({ x: e.clientX, y: e.clientY, w: 0, h: 0 });
          }}
          onMouseMove={(e) => {
            if (zStart.current)
              setDraft(rectFrom(zStart.current, e.clientX, e.clientY));
          }}
          onMouseUp={(e) => {
            const a = zStart.current;
            zStart.current = null;
            if (a) finishZone(rectFrom(a, e.clientX, e.clientY));
          }}
        >
          <div className="zoneHint">
            Drag to draw the pet's zone. Esc to cancel.
          </div>
          {draft && (
            <div
              className="zoneBox drawing"
              style={{
                left: draft.x,
                top: draft.y,
                width: draft.w,
                height: draft.h,
              }}
            />
          )}
        </div>
      )}
    </>
  );
}
