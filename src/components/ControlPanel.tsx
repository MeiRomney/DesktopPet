import { useState } from "react";
import type { ReactNode } from "react";
import { COLORS } from "../constants";
import { ITEMS } from "../reactions";
import type { Pose } from "../reactions";
import type { RoamMode } from "../types";
import type { Appearance } from "../hooks/useAppearance";
import type { LookEvery } from "../hooks/useLookSettings";
import type { useQuickToys } from "../hooks/useQuickToys";
import type { useZone } from "../hooks/useZone";
import { Stickman } from "./Stickman";
import { EMOTES } from "../emotes";
import { useDanceSettings } from "../hooks/useDanceSettings";
import type { DanceMode } from "../hooks/useDanceSettings";

type Zone = ReturnType<typeof useZone>;
type Dance = ReturnType<typeof useDanceSettings>;
export type CameraApi = {
  look: boolean;
  toggleLook(): void;
  lookEvery: LookEvery;
  setLookEvery(v: LookEvery): void;
  thinking: boolean;
  lookNow(): void;
};

type Props = {
  appearance: Appearance;
  camera: CameraApi;
  zone: Zone;
  size: number;
  onEmote(id: string): void;
  dance: Dance;
  danceLeft: number | null;
  onDanceOff(seconds: number, ids: string[]): void;
  onDanceStop(): void;
  onSize(v: number): void;
  quick: ReturnType<typeof useQuickToys>;
  onSpawn(emoji: string, name: string): void;
  onStartZone(): void;
};

// ---- Small building blocks used by every tab ----
const Section = ({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) => (
  <section className="cpSection">
    <h3>{title}</h3>
    {hint && <p className="cpHint">{hint}</p>}
    {children}
  </section>
);

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  show,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange(v: number): void;
  show?: (v: number) => string;
}) {
  return (
    <label className="cpSlider">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <output>{show ? show(value) : value}</output>
    </label>
  );
}

const Toggle = ({
  on,
  onChange,
  label,
  desc,
}: {
  on: boolean;
  onChange(): void;
  label: string;
  desc?: string;
}) => (
  <button
    className="cpToggle"
    role="switch"
    aria-checked={on}
    onClick={onChange}
  >
    <span className={`cpSwitch${on ? " on" : ""}`}>
      <i />
    </span>
    <span>
      <b>{label}</b>
      {desc && <small>{desc}</small>}
    </span>
  </button>
);

function Choice<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: [T, string][];
  onChange(v: T): void;
}) {
  return (
    <div className="seg" role="group">
      {options.map(([v, label]) => (
        <button
          key={String(v)}
          className={`segBtn${v === value ? " on" : ""}`}
          aria-pressed={v === value}
          onClick={() => onChange(v)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange(c: string): void;
}) {
  const custom = !COLORS.includes(value);
  return (
    <div className="cpSwatches">
      {COLORS.map((c) => (
        <button
          key={c}
          className={`swatch${c === value ? " sel" : ""}`}
          style={{ backgroundColor: c }}
          aria-label={`Color ${c}`}
          aria-pressed={c === value}
          onClick={() => onChange(c)}
        />
      ))}
      <label
        className={`swatch custom${custom ? " sel" : ""}`}
        style={custom ? { backgroundColor: value } : undefined}
        title="Pick any color"
      >
        {!custom && "+"}
        <input
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#43474f"}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}

// ---- Live preview: click it to cycle through expressions ----
const POSES: Pose[] = ["neutral", "happy", "scared", "angry", "sad", "shocked"];
function Preview({ a }: { a: Appearance }) {
  const [i, setI] = useState(0);
  return (
    <button
      className="cpPreview"
      title="Click to preview other expressions"
      onClick={() => setI((i + 1) % POSES.length)}
    >
      <Stickman
        pose={POSES[i]}
        color={a.color}
        eyes={{ ...a.eyes, track: false }}
        w={54}
        h={96}
        uid="preview"
      />
    </button>
  );
}

// ---- Tabs ----
function ColorsTab({ a }: { a: Appearance }) {
  return (
    <>
      <Preview a={a} />
      <Section
        title="Body color"
        hint="Pick a preset or choose any color you like."
      >
        <ColorPicker value={a.color} onChange={a.setColor} />
      </Section>
    </>
  );
}

function EyesTab({ a }: { a: Appearance }) {
  const { eyes, setEyes } = a;
  return (
    <>
      <Preview a={a} />
      <Section title="Eyes">
        <Slider
          label="Eye size"
          min={0.7}
          max={1.5}
          step={0.05}
          value={eyes.size}
          onChange={(v) => setEyes({ size: v })}
          show={(v) => `${Math.round(v * 100)}%`}
        />
        <Slider
          label="Pupil size"
          min={0.5}
          max={1.6}
          step={0.05}
          value={eyes.pupil}
          onChange={(v) => setEyes({ pupil: v })}
          show={(v) => `${Math.round(v * 100)}%`}
        />
        <Slider
          label="Spacing"
          min={14}
          max={34}
          step={1}
          value={eyes.gap}
          onChange={(v) => setEyes({ gap: v })}
          show={(v) => String(v)}
        />
      </Section>
      <Section title="Pupil color">
        <ColorPicker
          value={eyes.pupilColor}
          onChange={(c) => setEyes({ pupilColor: c })}
        />
      </Section>
      <Section title="Behavior">
        <Toggle
          on={eyes.track}
          onChange={() => setEyes({ track: !eyes.track })}
          label="Follow my mouse"
          desc="The pupils look wherever your cursor is."
        />
      </Section>
      <button className="pill" onClick={a.resetEyes}>
        Reset eyes
      </button>
    </>
  );
}

const EVERY: [LookEvery, string][] = [
  ["often", "Often"],
  ["normal", "Normal"],
  ["rare", "Rarely"],
];
const EVERY_TEXT: Record<LookEvery, string> = {
  often: "about every 2-4 minutes",
  normal: "about every 8-15 minutes",
  rare: "about every 20-40 minutes",
};
function CameraTab({ s }: { s: CameraApi }) {
  return (
    <>
      <Section
        title="Screen glance"
        hint="The pet takes a look at a screenshot of your primary monitor and comments on it. The screenshot only goes to your local Ollama and is never saved."
      >
        <Toggle
          on={s.look}
          onChange={s.toggleLook}
          label="Auto-look"
          desc={
            s.look
              ? `On: it glances ${EVERY_TEXT[s.lookEvery]}.`
              : "Off: it never looks unless you ask."
          }
        />
        <div className="cpRow">
          <span>How often</span>
          <Choice
            value={s.lookEvery}
            options={EVERY}
            onChange={s.setLookEvery}
          />
        </div>
        <p className="cpHint">
          A new frequency applies after the current wait finishes.
        </p>
      </Section>
      <Section title="Right now">
        <button
          className="pill"
          disabled={s.thinking}
          onClick={() => s.lookNow()}
        >
          {s.thinking ? "Looking..." : "📸 Look now"}
        </button>
        <p className="cpHint">
          Needs the vision model: <code>ollama pull gemma3:4b</code>
        </p>
      </Section>
    </>
  );
}

const DANCE_MODES: [DanceMode, string][] = [
  ["all", "All moves"],
  ["custom", "My mix"],
];
const fmtTime = (v: number) =>
  `${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`;

function EmotesTab({
  dance,
  left,
  onEmote,
  onDanceOff,
  onDanceStop,
}: {
  dance: Dance;
  left: number | null;
  onEmote(id: string): void;
  onDanceOff(s: number, ids: string[]): void;
  onDanceStop(): void;
}) {
  const running = left !== null;
  const picked = dance.ids.length;
  const canStart = !running && picked >= 2;
  return (
    <>
      <Section
        title="Dance-off"
        hint="The pet chains random moves for as long as you choose, never the same move twice in a row."
      >
        {left !== null ? (
          <div className="cpSlider">
            <span>Time left</span>
            <div className="cpBar">
              <i
                style={{
                  width: `${Math.min(100, (left / dance.secs) * 100)}%`,
                }}
              />
            </div>
            <output>{fmtTime(left)}</output>
          </div>
        ) : (
          <Slider
            label="Duration"
            min={10}
            max={300}
            step={10}
            value={dance.secs}
            onChange={dance.setSecs}
            show={fmtTime}
          />
        )}
        <div className="zoneRow">
          <button
            className="pill on"
            disabled={!canStart}
            onClick={() => onDanceOff(dance.secs, dance.ids)}
          >
            🔥 Start dance-off
          </button>
          <button className="pill" onClick={onDanceStop}>
            ■ Stop
          </button>
        </div>
        {!running && picked < 2 && (
          <p className="cpHint">Pick at least 2 moves for the mix.</p>
        )}
      </Section>
      <Section
        title="Moves in the dance-off"
        hint="Use every move, or build your own mix."
      >
        <Choice
          value={dance.mode}
          options={DANCE_MODES}
          onChange={dance.setMode}
        />
        {dance.mode === "custom" && (
          <>
            <div
              className="cpToys"
              style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
            >
              {EMOTES.map((e) => (
                <button
                  key={e.id}
                  className={`pill${dance.mix.includes(e.id) ? " on" : ""}`}
                  aria-pressed={dance.mix.includes(e.id)}
                  disabled={running}
                  onClick={() => dance.toggle(e.id)}
                >
                  {e.icon} {e.label}
                </button>
              ))}
            </div>
            <div className="zoneRow">
              <button
                className="pill"
                disabled={running}
                onClick={dance.selectAll}
              >
                Select all
              </button>
              <button className="pill" disabled={running} onClick={dance.clear}>
                Clear
              </button>
              <span className="cpHint">
                {dance.mix.length} of {EMOTES.length} selected
              </span>
            </div>
          </>
        )}
      </Section>
      <Section
        title="Single moves"
        hint="Click one and the pet dances for a few seconds."
      >
        <div
          className="cpToys"
          style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
        >
          {EMOTES.map((e) => (
            <button key={e.id} className="pill" onClick={() => onEmote(e.id)}>
              {e.icon} {e.label}
            </button>
          ))}
        </div>
      </Section>
    </>
  );
}

const SIZES: [number, string][] = [
  [0.6, "Tiny"],
  [0.8, "Small"],
  [1, "Normal"],
  [1.4, "Big"],
  [1.8, "Huge"],
];
function SizeTab({
  a,
  size,
  onSize,
}: {
  a: Appearance;
  size: number;
  onSize(v: number): void;
}) {
  return (
    <>
      <Preview a={a} />
      <Section title="Pet size">
        <Slider
          label="Size"
          min={0.6}
          max={1.8}
          step={0.05}
          value={size}
          onChange={onSize}
          show={(v) => `${Math.round(v * 100)}%`}
        />
        <div className="zoneRow">
          {SIZES.map(([v, label]) => (
            <button
              key={label}
              className={`pill${Math.abs(size - v) < 0.01 ? " on" : ""}`}
              onClick={() => onSize(v)}
            >
              {label}
            </button>
          ))}
        </div>
      </Section>
    </>
  );
}

const MODES: [RoamMode, string][] = [
  ["free", "Free"],
  ["box", "Box"],
  ["edges", "Edges"],
];
const MODE_TEXT: Record<RoamMode, string> = {
  free: "Wanders anywhere on the screen.",
  box: "Stays inside a rectangle you draw.",
  edges:
    "Stays on the taskbar and on top of the app you are using. Always upright, never covers your work area, and hides while a fullscreen app is open.",
};
function ZoneTab({ z, onStartZone }: { z: Zone; onStartZone(): void }) {
  const onMode = (m: RoamMode) => {
    if (m === "box" && !z.zone) onStartZone();
    else z.setMode(m);
  };
  return (
    <>
      <Section title="Where the pet roams" hint={MODE_TEXT[z.mode]}>
        <Choice value={z.mode} options={MODES} onChange={onMode} />
      </Section>
      {z.mode === "box" && (
        <Section title="Box">
          <div className="zoneRow">
            <button className="pill" onClick={onStartZone}>
              {z.zone ? "Redraw box" : "Draw box"}
            </button>
            {z.zone && (
              <button className="pill" onClick={z.clearZone}>
                Remove box ✕
              </button>
            )}
          </div>
          <p className="cpHint">
            The panel hides while you draw. Press Esc to cancel.
          </p>
        </Section>
      )}
      {z.mode === "edges" && (
        <Section title="Which edges" hint="At least one stays on.">
          <div className="zoneRow">
            <button
              className={`pill${z.edges.screen ? " on" : ""}`}
              aria-pressed={z.edges.screen}
              onClick={() => z.toggleEdge("screen")}
            >
              Taskbar
            </button>
            <button
              className={`pill${z.edges.apps ? " on" : ""}`}
              aria-pressed={z.edges.apps}
              onClick={() => z.toggleEdge("apps")}
            >
              App tops
            </button>
          </div>
        </Section>
      )}
    </>
  );
}

function ToysTab({
  onSpawn,
  quick,
}: {
  onSpawn(emoji: string, name: string): void;
  quick: Props["quick"];
}) {
  return (
    <>
      <Section
        title="Toys"
        hint="Drop an object next to the pet, then drag it around. Dropping one on the pet uses it."
      >
        <div className="cpToys">
          {ITEMS.map(([e, n]) => (
            <button
              key={e}
              className="toy big"
              title={`Drop ${n}`}
              onClick={() => onSpawn(e, n)}
            >
              {e}
            </button>
          ))}
        </div>
      </Section>
      <Section
        title="Pet menu shortcuts"
        hint="Choose the two toys that show on the pet menu when you click the pet. Picking a new one replaces the older choice."
      >
        <div className="cpToys">
          {ITEMS.map(([e, n]) => (
            <button
              key={e}
              className={`toy big pick${quick.quick.includes(e) ? " on" : ""}`}
              aria-pressed={quick.quick.includes(e)}
              title={`Show ${n} on the pet menu`}
              onClick={() => quick.pick(e)}
            >
              {e}
            </button>
          ))}
        </div>
      </Section>
    </>
  );
}

function SoonTab({ title, text }: { title: string; text: string }) {
  return (
    <div className="cpSoon">
      <div className="cpSoonBadge">Coming soon</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

// ---- The tab list. To add a feature later: add a line here and a small component above. ----
type Tab = {
  id: string;
  icon: string;
  label: string;
  render(p: Props): ReactNode;
};
const TABS: (Tab | "divider")[] = [
  {
    id: "colors",
    icon: "🎨",
    label: "Colors",
    render: (p) => <ColorsTab a={p.appearance} />,
  },
  {
    id: "eyes",
    icon: "👀",
    label: "Eyes",
    render: (p) => <EyesTab a={p.appearance} />,
  },
  {
    id: "camera",
    icon: "📸",
    label: "Camera",
    render: (p) => <CameraTab s={p.camera} />,
  },
  {
    id: "size",
    icon: "📏",
    label: "Size",
    render: (p) => <SizeTab a={p.appearance} size={p.size} onSize={p.onSize} />,
  },
  {
    id: "zone",
    icon: "🗺️",
    label: "Zone",
    render: (p) => <ZoneTab z={p.zone} onStartZone={p.onStartZone} />,
  },
  {
    id: "toys",
    icon: "🧸",
    label: "Toys",
    render: (p) => <ToysTab onSpawn={p.onSpawn} quick={p.quick} />,
  },
  {
    id: "emotes",
    icon: "💃",
    label: "Emotes",
    render: (p) => (
      <EmotesTab
        dance={p.dance}
        left={p.danceLeft}
        onEmote={p.onEmote}
        onDanceOff={p.onDanceOff}
        onDanceStop={p.onDanceStop}
      />
    ),
  },
  "divider",
  {
    id: "characters",
    icon: "🐾",
    label: "Characters",
    render: () => (
      <SoonTab
        title="Characters"
        text="Pick a different pet, or make your own with custom bodies, hats and faces."
      />
    ),
  },
  {
    id: "pomodoro",
    icon: "🍅",
    label: "Pomodoro",
    render: () => (
      <SoonTab
        title="Pomodoro timer"
        text="Focus sessions with breaks, and your pet cheering you on."
      />
    ),
  },
  {
    id: "reminders",
    icon: "🔔",
    label: "Reminders",
    render: () => (
      <SoonTab
        title="Reminders"
        text="Your pet taps you on the shoulder when something is due."
      />
    ),
  },
  {
    id: "alarms",
    icon: "⏰",
    label: "Alarms",
    render: () => (
      <SoonTab title="Alarms" text="Wake-up calls and scheduled alerts." />
    ),
  },
  {
    id: "settings",
    icon: "⚙️",
    label: "Settings",
    render: () => (
      <SoonTab
        title="General settings"
        text="Startup, hotkeys, AI model and more."
      />
    ),
  },
];

/** The control panel. It fills its own window, so the title bar, minimize, maximize, resize and close are the system's. */
export function ControlPanel(props: Props) {
  const [tab, setTab] = useState("colors");
  const current =
    TABS.find((t): t is Tab => t !== "divider" && t.id === tab) ??
    (TABS[0] as Tab);
  return (
    <div className="cp">
      <nav className="cpNav">
        {TABS.map((t, i) =>
          t === "divider" ? (
            <div key={i} className="cpDivider">
              Soon
            </div>
          ) : (
            <button
              key={t.id}
              className={`cpTab${t.id === current.id ? " on" : ""}`}
              aria-current={t.id === current.id}
              onClick={() => setTab(t.id)}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ),
        )}
      </nav>
      <div className="cpContent">{current.render(props)}</div>
    </div>
  );
}
