import { useEffect, useState } from "react";

export type PomoSettings = {
  focus: number; // minutes
  short: number;
  long: number;
  rounds: number; // focus sessions before a long break
  auto: boolean; // start the next phase by itself
  quiet: boolean; // no spontaneous speech while focusing
};
export const DEFAULT_POMO: PomoSettings = {
  focus: 25,
  short: 5,
  long: 15,
  rounds: 4,
  auto: true,
  quiet: true,
};

const KEY = "pomoSettings";
const num = (v: unknown, lo: number, hi: number, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : d;
};
const read = (raw: string | null): PomoSettings => {
  try {
    const j = JSON.parse(raw || "{}");
    return {
      focus: num(j.focus, 1, 120, 25),
      short: num(j.short, 1, 60, 5),
      long: num(j.long, 1, 60, 15),
      rounds: num(j.rounds, 2, 8, 4),
      auto: j.auto !== false,
      quiet: j.quiet !== false,
    };
  } catch {
    return DEFAULT_POMO;
  }
};
export const readPomoSettings = () => read(localStorage.getItem(KEY));

/** Pomodoro settings, saved on this computer and synced between the pet window and the control panel. */
export function usePomodoroSettings() {
  const [settings, setState] = useState(readPomoSettings);
  useEffect(() => {
    const h = (e: StorageEvent) => {
      if (e.key === KEY) setState(read(e.newValue));
    };
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  }, []);
  const update = (patch: Partial<PomoSettings>) =>
    setState((s) => {
      const n = { ...s, ...patch };
      localStorage.setItem(KEY, JSON.stringify(n));
      return n;
    });
  return { settings, update };
}
