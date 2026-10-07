import { useEffect, useState } from "react";
import { COLORS, INK } from "../constants";
import type { Eyes } from "../types";

export const DEFAULT_EYES: Eyes = {
  size: 1,
  pupil: 1,
  gap: 22,
  pupilColor: INK,
  track: true,
};

const readEyes = (raw: string | null): Eyes => {
  try {
    return { ...DEFAULT_EYES, ...JSON.parse(raw || "{}") };
  } catch {
    return DEFAULT_EYES;
  }
};

/** How the pet looks: body color and eyes. Saved on this computer, and synced between the two windows. */
export function useAppearance() {
  const [color, setColorState] = useState(
    () => localStorage.getItem("color") || COLORS[0],
  );
  const [eyes, setEyesState] = useState<Eyes>(() =>
    readEyes(localStorage.getItem("eyes")),
  );

  useEffect(() => {
    const h = (e: StorageEvent) => {
      if (e.key === "color") setColorState(e.newValue || COLORS[0]);
      if (e.key === "eyes") setEyesState(readEyes(e.newValue));
    };
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  }, []);

  const setColor = (c: string) => {
    setColorState(c);
    localStorage.setItem("color", c);
  };
  const setEyes = (patch: Partial<Eyes>) =>
    setEyesState((e) => {
      const n = { ...e, ...patch };
      localStorage.setItem("eyes", JSON.stringify(n));
      return n;
    });
  const resetEyes = () => {
    setEyesState(DEFAULT_EYES);
    localStorage.removeItem("eyes");
  };

  return { color, setColor, eyes, setEyes, resetEyes };
}
export type Appearance = ReturnType<typeof useAppearance>;
