import { useEffect, useRef, useState } from 'react';

type Pose = 'neutral' | 'happy' | 'scared' | 'angry' | 'sad' | 'shocked';
type Obj = { id: number; emoji: string; name: string; x: number; y: number };
type Reply = { ok: boolean; pose?: Pose; says?: string; error?: string };

declare global {
  interface Window {
    api: { clickThrough(on: boolean): void; react(e: string): Promise<Reply>; hide(): void };
  }
}

const ITEMS: [string, string][] = [
  ['🔫', 'a gun'], ['🗡️', 'a sword'], ['🍰', 'a cake'],
  ['🎹', 'a piano'], ['💣', 'a bomb'], ['🐱', 'a cat'],
];

function Stickman({ pose }: { pose: Pose }) {
  const up = pose === 'scared' || pose === 'shocked' || pose === 'happy';
  const bigEyes = pose === 'scared' || pose === 'shocked';
  const mouths: Record<Pose, string> = {
    neutral: 'M42 34 h16', happy: 'M40 31 q10 12 20 0', scared: 'M41 39 q9 -8 18 0',
    angry: 'M41 38 q9 -6 18 0', sad: 'M41 38 q9 -7 18 0', shocked: 'M46 33 a4 5 0 1 0 8 0 a4 5 0 1 0 -8 0',
  };
  return (
    <svg viewBox="0 0 100 150" width="100" height="150" fill="none" stroke="#1b1b1f" strokeWidth="4" strokeLinecap="round">
      <circle cx="50" cy="25" r="20" fill="#fff" />
      <circle cx="42" cy="22" r={bigEyes ? 3.5 : 2} fill="#1b1b1f" />
      <circle cx="58" cy="22" r={bigEyes ? 3.5 : 2} fill="#1b1b1f" />
      {pose === 'angry' && <path strokeWidth="3" d="M37 14 l10 4 M63 14 l-10 4" />}
      {pose === 'sad' && <path strokeWidth="3" d="M37 18 l10 -4 M63 18 l-10 -4" />}
      <path strokeWidth="3" d={mouths[pose]} />
      <path d="M50 45 V95 M50 95 L32 140 M50 95 L68 140" />
      <path d={up ? 'M50 58 L26 34 M50 58 L74 34' : 'M50 58 L26 82 M50 58 L74 82'} />
    </svg>
  );
}

export default function App() {
  const [pos, setPos] = useState({ x: window.innerWidth - 240, y: window.innerHeight - 280 });
  const [pose, setPose] = useState<Pose>('neutral');
  const [says, setSays] = useState('');
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [objs, setObjs] = useState<Obj[]>([]);
  const drag = useRef<{ dx: number; dy: number; sx: number; sy: number; moved: boolean } | null>(null);
  const timer = useRef<number>();

  // Let clicks through everywhere except over the pet and its UI.
  const hover = {
    onMouseEnter: () => window.api.clickThrough(false),
    onMouseLeave: () => { if (!drag.current) window.api.clickThrough(true); },
  };

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const d = drag.current;
      if (!d) return;
      if (Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) > 4) d.moved = true;
      if (d.moved) setPos({ x: e.clientX - d.dx, y: e.clientY - d.dy });
    };
    const up = () => {
      const d = drag.current;
      drag.current = null;
      if (d && !d.moved) setOpen((o) => !o); // a click (not a drag) toggles the panel
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, []);

  const down = (e: React.MouseEvent) => {
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y, sx: e.clientX, sy: e.clientY, moved: false };
  };

  // Every event goes to the local model. The reflex pose shows instantly while it thinks.
  const say = async (event: string, reflex?: Pose) => {
    if (reflex) setPose(reflex);
    const r = await window.api.react(event);
    setPose(r.ok ? r.pose! : 'sad');
    setSays(r.ok ? r.says! : `No brain found. Is Ollama running? (${r.error})`);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSays(''), 7000);
  };

  const spawn = (emoji: string, name: string) => {
    setObjs((o) => [...o, { id: Date.now(), emoji, name, x: pos.x - 90, y: pos.y + 40 }]);
    say(`The user placed ${name} ${emoji} next to you.`, 'shocked');
  };

  const use = (o: Obj) => {
    setObjs((l) => l.map((x) => (x.id === o.id ? { ...x, x: pos.x + 30, y: pos.y + 40 } : x)));
    window.setTimeout(() => { setObjs((l) => l.filter((x) => x.id !== o.id)); window.api.clickThrough(true); }, 350);
    say(`The user just used ${o.name} ${o.emoji} on you!`, 'scared');
  };

  const send = () => {
    const t = text.trim();
    if (!t) return;
    setText('');
    if (/\b(go away|leave|hide|bye)\b/i.test(t)) {
      say(`The user told you to leave: "${t}"`).then(() => window.setTimeout(() => window.api.hide(), 2500));
      return;
    }
    say(`The user said to you: "${t}"`);
  };

  return (
    <>
      {objs.map((o) => (
        <div key={o.id} className="obj" style={{ left: o.x, top: o.y }} onClick={() => use(o)} {...hover}>{o.emoji}</div>
      ))}
      <div className="wrap" style={{ left: pos.x, top: pos.y }} {...hover}>
        {says && <div className="bubble">{says}</div>}
        <div className={`pet ${pose}`} onMouseDown={down}><Stickman pose={pose} /></div>
        {open && (
          <div className="panel">
            <div className="items">
              {ITEMS.map(([e, n]) => <button key={e} title={n} onClick={() => spawn(e, n)}>{e}</button>)}
            </div>
            <input
              value={text} autoFocus placeholder="Say something, or tell it to leave"
              onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
            />
          </div>
        )}
      </div>
    </>
  );
}
