import { useEffect, useState } from "react";
import { fmtClock } from "../hooks/usePomodoro";
import type { Pomo } from "../hooks/usePomodoro";

/** The little clock above the pet. Render it BEFORE <SpeechBubbles />: the CSS lifts the bubble above it. */
export function PomodoroBadge({ pomo }: { pomo: Pomo }) {
  const [s, setS] = useState(pomo.get());
  useEffect(() => {
    setS(pomo.get());
    return pomo.subscribe(setS);
  }, []);
  if (!s.started) return null;
  const focus = s.phase === "focus";
  return (
    <div
      className={`pomoBadge${focus ? "" : " brk"}${s.running ? "" : " paused"}`}
    >
      {s.running ? (focus ? "🍅" : "☕") : "⏸"} {fmtClock(s.left)}
    </div>
  );
}
