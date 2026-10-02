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

const W = 72,
  H = 128; // pet size in px (SVG viewBox is 100 x 178)
const COLORS = ["#43474f", "#e5566d", "#4a90e2", "#2fbf71", "#f0a030"]; // body colors; first is the default charcoal
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), hi);

const INK = "#111";

// Chunky blob character: thick outline, big head, tube limbs, white eyes with pupils glancing sideways.
function Stickman({ pose, color }: { pose: Pose; color: string }) {
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

  // Among Us style legs: plain stubby legs, straight sides, flat rounded-off bottoms, no separate foot.
  const legs = [
    [37, "legL"],
    [63, "legR"],
  ] as const;
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
      <circle cx={cx + 1.5} cy="48.5" r={pr} fill={INK} stroke="none" />
      <circle cx={cx + 0.6} cy="46.5" r="1.2" fill="#fff" stroke="none" />
    </g>
  );
  return (
    <svg
      viewBox="0 0 100 178"
      width={W}
      height={H}
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
  const [facing, setFacing] = useState<1 | -1>(1);
  const [moveMs, setMoveMs] = useState(0); // >0 while walking by itself
  const [stride, setStride] = useState(false); // leg animation on; ends at a stride boundary
  const [look, setLook] = useState(() => localStorage.getItem("look") === "1"); // off until you turn it on

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
  const walkId = useRef(0);
  const near = useRef<number | null>(null);
  const hovering = useRef(false);
  const busy = useRef(false);
  const lookOn = useRef(look);
  const S = useRef({ pos, open, objs, moveMs });
  S.current = { pos, open, objs, moveMs };
  lookOn.current = look;

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

  // AI use #1: replying when you text it.
  const say = async (event: string) => {
    busy.current = true;
    setThinking(true);
    const r = await window.api.react(event);
    busy.current = false;
    setThinking(false);
    setPose(r.ok ? r.pose! : "sad");
    showBubble(
      r.ok ? r.says! : `No brain found. Is Ollama running? (${r.error})`,
    );
  };

  // AI use #2: an occasional glance at the desktop (vision model).
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

  const walkTo = (x: number, y: number, then?: () => void) => {
    const p = S.current.pos;
    const id = ++walkId.current;
    const nx = clamp(x, 0, window.innerWidth - W);
    const ny = clamp(y, 40, window.innerHeight - H - 8);
    const ms = Math.max(500, (Math.hypot(nx - p.x, ny - p.y) / 70) * 1000); // ~70 px/s
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

  const use = (o: Obj) => {
    hovering.current = false;
    setObjs((l) => l.filter((x) => x.id !== o.id));
    window.api.clickThrough(true);
    const r = scripted(o.emoji, "use");
    sayLocal(
      r.pose,
      r.says,
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
        const dist = Math.hypot(
          nx + 22 - (p.x + W / 2),
          ny + 22 - (p.y + H / 2),
        );
        const emoji = S.current.objs.find((o) => o.id === od.id)?.emoji ?? "";
        if (dist < 130 && near.current !== od.id) {
          near.current = od.id;
          setFacing(nx < p.x ? -1 : 1);
          setPose(nearPose(emoji));
        } else if (dist >= 130 && near.current === od.id) {
          near.current = null;
          setPose("neutral");
        }
      }
    };
    const up = () => {
      const d = drag.current,
        od = objDrag.current;
      drag.current = null;
      objDrag.current = null;
      near.current = null;
      if (d) {
        if (d.moved) setPose("neutral");
        else setOpen((o) => !o);
      } // a click toggles the panel
      if (od && od.moved) {
        const o = S.current.objs.find((x) => x.id === od.id),
          p = S.current.pos;
        if (!o) return;
        if (Math.hypot(o.x + 22 - (p.x + W / 2), o.y + 22 - (p.y + H / 2)) < 70)
          use(o); // dropped on the pet
        else
          walkTo(o.x - W, o.y + 44 - H, () => {
            const r = visit(o.emoji);
            sayLocal(
              r.pose,
              r.says,
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
              walkTo(
                Math.random() * (window.innerWidth - W),
                window.innerHeight * (0.4 + Math.random() * 0.5),
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
    const x = clamp(
      pos.x + (pos.x > window.innerWidth / 2 ? -60 : 80),
      0,
      window.innerWidth - 50,
    );
    setObjs((o) => [
      ...o,
      { id: Date.now(), emoji, name, x, y: pos.y + H - 50 },
    ]);
    const r = scripted(emoji, "spawn");
    sayLocal(r.pose, r.says, `The user placed ${name} ${emoji} next to me.`);
  };

  const send = () => {
    const t = text.trim();
    if (!t) return;
    setText("");
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
      {objs.map((o) => (
        <div
          key={o.id}
          className="obj"
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
          transition: moveMs
            ? `left ${moveMs}ms cubic-bezier(0.45, 0, 0.55, 1), top ${moveMs}ms cubic-bezier(0.45, 0, 0.55, 1)`
            : "none",
        }}
      >
        {says && <div className="bubble">{says}</div>}
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
            <Stickman pose={pose} color={color} />
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
                    ? "Glancing at my screen now and then (click to stop)"
                    : "Let it glance at my screen now and then"
                }
                aria-pressed={look}
                onClick={toggleLook}
              >
                👀
              </button>
              <button
                className="chip"
                title="Look at my screen right now"
                onClick={() => lookAround(true)}
              >
                📸
              </button>
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
    </>
  );
}
