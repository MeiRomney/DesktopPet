import { useState } from "react";
import { EMOTES } from "../emotes";

export const DEFAULT_DANCE_SECS = 60;
export type DanceMode = "all" | "custom";
const ALL_IDS: string[] = EMOTES.map((e) => e.id);

const readSecs = (v: string | null) => {
  const n = Number(v);
  return n >= 10 && n <= 300 ? n : DEFAULT_DANCE_SECS;
};
const readMix = (raw: string | null): string[] => {
  try {
    const a = JSON.parse(raw || "null");
    if (Array.isArray(a)) return a.filter((id) => ALL_IDS.includes(id));
  } catch {
    /* use all */
  }
  return ALL_IDS;
};

/** Dance-off settings: the duration you last set (default 1:00) and which moves are in the mix. Saved on this computer. */
export function useDanceSettings() {
  const [secs, setSecsState] = useState(() =>
    readSecs(localStorage.getItem("danceSecs")),
  );
  const [mode, setModeState] = useState<DanceMode>(() =>
    localStorage.getItem("danceMode") === "custom" ? "custom" : "all",
  );
  const [mix, setMixState] = useState<string[]>(() =>
    readMix(localStorage.getItem("danceMix")),
  );

  const setSecs = (v: number) => {
    setSecsState(v);
    localStorage.setItem("danceSecs", String(v));
  };
  const setMode = (m: DanceMode) => {
    setModeState(m);
    localStorage.setItem("danceMode", m);
  };
  const saveMix = (m: string[]) => {
    setMixState(m);
    localStorage.setItem("danceMix", JSON.stringify(m));
  };
  const toggle = (id: string) =>
    saveMix(mix.includes(id) ? mix.filter((x) => x !== id) : [...mix, id]);

  // "All moves" always means every move that exists, including ones added later.
  const ids = mode === "all" ? ALL_IDS : mix;
  return {
    secs,
    setSecs,
    mode,
    setMode,
    mix,
    toggle,
    selectAll: () => saveMix(ALL_IDS),
    clear: () => saveMix([]),
    ids,
  };
}
