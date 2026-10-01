import { useEffect, useRef, useState } from "react";
import type { Pose } from "./reactions.js";
import {
  ITEMS,
  idleLine,
  nearPose,
  react as scripted,
  visit,
} from "./reactions.js";

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

const W = 96; // pet width in px
const COLORS = ["#1b1b1f", "#ff4d4d", "#4da6ff", "#2fbf71", "#ffb02e"];
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), hi);

function Stickman({ pose, color }: { pose: Pose; color: string }) {
  const up = pose === "scared" || pose === "shocked" || pose === "happy";
  const bigEyes = pose === "scared" || pose === "shocked";
  const mouths: Record<Pose, string> = {
    neutral: "M46 44 q4 3 8 0",
    happy: "M44 42 q6 8 12 0",
    scared: "M45 48 q5 -6 10 0",
    angry: "M45 48 q5 -4 10 0",
    sad: "M45 48 q5 -5 10 0",
    wave: "M45 42 q5 5 10 0",
    shocked: "M47 45 a3 4 0 1 0 6 0 a3 4 0 1 0 -6 0",
  };
  const arms =
    pose === "wave"
      ? "M50 66 L36 74 M50 66 L66 50"
      : up
        ? "M50 66 L34 52 M50 66 L66 52"
        : "M50 66 L36 74 M50 66 L64 74";
  return (
    <svg
      viewBox="0 0 100 100"
      width={W}
      height={W}
      fill="none"
      stroke={color}
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse
        cx="50"
        cy="97"
        rx="18"
        ry="3.5"
        fill="rgba(0,0,0,.18)"
        stroke="none"
      />
      <path d="M50 60 V78" />
      <path className="leg legL" d="M50 78 L41 93" />
      <path className="leg legR" d="M50 78 L59 93" />
      <path d={arms} />
      <path d="M50 8 q-3 -6 4 -8" strokeWidth="3" />
      <circle cx="50" cy="34" r="26" fill="#fff" />
      <ellipse
        cx="40"
        cy="34"
        rx={bigEyes ? 4 : 3.2}
        ry={bigEyes ? 5.5 : 4}
        fill={color}
        stroke="none"
      />
      <ellipse
        cx="60"
        cy="34"
        rx={bigEyes ? 4 : 3.2}
        ry={bigEyes ? 5.5 : 4}
        fill={color}
        stroke="none"
      />
      <circle cx="41" cy="32.3" r="1.3" fill="#fff" stroke="none" />
      <circle cx="61" cy="32.3" r="1.3" fill="#fff" stroke="none" />
      <ellipse
        cx="31"
        cy="43"
        rx="4.5"
        ry="2.8"
        fill="#ff9fb0"
        opacity=".75"
        stroke="none"
      />
      <ellipse
        cx="69"
        cy="43"
        rx="4.5"
        ry="2.8"
        fill="#ff9fb0"
        opacity=".75"
        stroke="none"
      />
      {pose === "angry" && (
        <path strokeWidth="3" d="M33 24 l11 4 M67 24 l-11 4" />
      )}
      {pose === "sad" && (
        <path strokeWidth="3" d="M33 27 l11 -4 M67 27 l-11 -4" />
      )}
      <path strokeWidth="2.8" d={mouths[pose]} />
    </svg>
  );
}

export default function App() {
  const [pos, setPos] = useState({
    x: window.innerWidth - 240,
    y: window.innerHeight - 280,
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
  const S = useRef({ pos, open, objs });
  S.current = { pos, open, objs };
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
    const ny = clamp(y, 40, window.innerHeight - 110);
    const ms = Math.max(500, (Math.hypot(nx - p.x, ny - p.y) / 70) * 1000); // ~70 px/s
    setFacing(nx < p.x ? -1 : 1);
    setMoveMs(ms);
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
        const dist = Math.hypot(nx + 22 - (p.x + W / 2), ny + 22 - (p.y + 50));
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
        if (Math.hypot(o.x + 22 - (p.x + W / 2), o.y + 22 - (p.y + 50)) < 70)
          use(o); // dropped on the pet
        else
          walkTo(o.x - 60, o.y - 40, () => {
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
      pos.x + (pos.x > window.innerWidth / 2 ? -90 : 110),
      0,
      window.innerWidth - 50,
    );
    setObjs((o) => [...o, { id: Date.now(), emoji, name, x, y: pos.y + 40 }]);
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
            ? `left ${moveMs}ms linear, top ${moveMs}ms linear`
            : "none",
        }}
      >
        {says && <div className="bubble">{says}</div>}
        {thinking && <div className="thinking">...</div>}
        <div
          className={`pet ${pose}${moveMs ? " walking" : ""}`}
          onMouseDown={down}
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
