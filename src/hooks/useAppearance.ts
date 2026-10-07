import { useState } from "react";
import { COLORS, INK } from "../constants";
import type { Eyes } from "../types";

export const DEFAULT_EYES: Eyes = {
  size: 1,
  pupil: 1,
  gap: 22,
  pupilColor: INK,
  track: true,
};

/** How the pet looks: body color and eyes. Saved on this computer, so it survives restarts. */
export function useAppearance() {
  const [color, setColorState] = useState(
    () => localStorage.getItem("color") || COLORS[0],
  );
  const [eyes, setEyesState] = useState<Eyes>(() => {
    try {
      return {
        ...DEFAULT_EYES,
        ...JSON.parse(localStorage.getItem("eyes") || "{}"),
      };
    } catch {
      return DEFAULT_EYES;
    }
  });

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
