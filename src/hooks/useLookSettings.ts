import { useEffect, useState } from "react";

export type LookEvery = "often" | "normal" | "rare";
export const LOOK_RANGES: Record<LookEvery, [number, number]> = {
  often: [2, 4],
  normal: [8, 15],
  rare: [20, 40],
}; // minutes
const readEvery = (v: string | null): LookEvery =>
  v === "often" || v === "rare" ? v : "normal";

/** The screen-glance settings (on/off and how often), shared by the pet window and the control panel window. */
export function useLookSettings() {
  const [look, setLook] = useState(() => localStorage.getItem("look") === "1");
  const [lookEvery, setEveryState] = useState<LookEvery>(() =>
    readEvery(localStorage.getItem("lookEvery")),
  );
  useEffect(() => {
    const h = (e: StorageEvent) => {
      if (e.key === "look") setLook(e.newValue === "1");
      if (e.key === "lookEvery") setEveryState(readEvery(e.newValue));
    };
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  }, []);
  const toggleLook = () => {
    const n = !look;
    setLook(n);
    localStorage.setItem("look", n ? "1" : "0");
  };
  const setLookEvery = (v: LookEvery) => {
    setEveryState(v);
    localStorage.setItem("lookEvery", v);
  };
  return { look, toggleLook, lookEvery, setLookEvery };
}
