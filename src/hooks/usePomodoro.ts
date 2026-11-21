import { useEffect, useRef } from "react";
import type { PomoAction, PomoPhase, PomoState } from "../types";
import { readPomoSettings } from "./usePomodoroSettings";
import type { PomoSettings } from "./usePomodoroSettings";

export const phaseSecs = (p: PomoPhase, s: PomoSettings) =>
  60 * (p === "focus" ? s.focus : p === "short" ? s.short : s.long);
export const idleState = (s: PomoSettings, round = 0): PomoState => ({
  phase: "focus",
  running: false,
  started: false,
  left: s.focus * 60,
  total: s.focus * 60,
  round,
});
export const fmtClock = (v: number) =>
  `${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`;

type Callbacks = {
  onStart(phase: PomoPhase, fresh: boolean): void;
  onPhaseEnd(from: PomoPhase, to: PomoPhase, round: number): void;
  onReset(): void;
  onChange(s: PomoState): void;
};

/**
 * The Pomodoro timer. It lives in the pet window. The state is kept in a ref (not React state) so the pet does not
 * re-render every second; the badge subscribes to it, and every change is also sent to the control panel.
 */
export function usePomodoro(cb: Callbacks) {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  const state = useRef<PomoState>(idleState(readPomoSettings()));
  const listeners = useRef(new Set<(s: PomoState) => void>());
  const endAt = useRef(0);
  const timer = useRef<number>();

  const commit = (n: PomoState) => {
    state.current = n;
    listeners.current.forEach((f) => f(n));
    window.api.bus.send({ type: "pomoTick", state: n });
    cbRef.current.onChange(n);
  };
  const stop = () => window.clearInterval(timer.current);

  // Moves to the next phase. skipped = you pressed Skip (no celebration, and a skipped focus does not count).
  const advance = (skipped: boolean) => {
    const s = state.current;
    if (!s.started) return;
    const cfg = readPomoSettings();
    let round = s.round;
    let next: PomoPhase;
    if (s.phase === "focus") {
      if (!skipped) round += 1;
      next = !skipped && round % cfg.rounds === 0 ? "long" : "short";
    } else next = "focus";
    const total = phaseSecs(next, cfg);
    const running = skipped ? s.running : cfg.auto;
    stop();
    commit({ phase: next, running, started: true, left: total, total, round });
    if (running) {
      endAt.current = Date.now() + total * 1000;
      run();
    }
    if (!skipped) cbRef.current.onPhaseEnd(s.phase, next, round);
  };

  const tick = () => {
    const s = state.current;
    if (!s.running) return;
    const left = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
    if (left === 0) advance(false);
    else if (left !== s.left) commit({ ...s, left });
  };
  const run = () => {
    stop();
    timer.current = window.setInterval(tick, 250);
  };

  const toggle = () => {
    const s = state.current;
    if (s.running) {
      stop();
      commit({
        ...s,
        running: false,
        left: Math.max(1, Math.ceil((endAt.current - Date.now()) / 1000)),
      });
      return;
    }
    let n = s;
    if (!s.started) {
      const total = phaseSecs("focus", readPomoSettings());
      n = { ...s, left: total, total, started: true };
    }
    endAt.current = Date.now() + n.left * 1000;
    commit({ ...n, running: true });
    run();
    cbRef.current.onStart(n.phase, !s.started);
  };
  const reset = () => {
    stop();
    commit(idleState(readPomoSettings()));
    cbRef.current.onReset();
  };

  const command = (a: PomoAction) => {
    if (a === "toggle") toggle();
    else if (a === "skip") advance(true);
    else if (a === "reset") reset();
    else commit(state.current); // "sync": the control panel just opened and wants the current state
  };

  useEffect(() => {
    // changing the durations while the timer has not started updates the clock
    const h = (e: StorageEvent) => {
      if (e.key === "pomoSettings" && !state.current.started)
        commit(idleState(readPomoSettings()));
    };
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("storage", h);
      stop();
    };
  }, []);

  return {
    get: () => state.current,
    subscribe: (f: (s: PomoState) => void) => {
      listeners.current.add(f);
      return () => {
        listeners.current.delete(f);
      };
    },
    command,
  };
}
export type Pomo = ReturnType<typeof usePomodoro>;
