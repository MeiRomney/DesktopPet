import { useEffect, useState } from "react";
import { COLORS, INK } from "../constants";
import type { Eyes } from "../types";
import { CHARACTERS, DEFAULT_LOOK } from "../characters";
import type { Look } from "../characters";

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
const readLook = (raw: string | null): Look => {
  try {
    return { ...DEFAULT_LOOK, ...JSON.parse(raw || "{}") };
  } catch {
    return DEFAULT_LOOK;
  }
};

/** How the pet looks: body/skin color, eyes, hair and clothes. Saved on this computer, synced between the two windows. */
export function useAppearance() {
  const [color, setColorState] = useState(
    () => localStorage.getItem("color") || COLORS[0],
  );
  const [eyes, setEyesState] = useState<Eyes>(() =>
    readEyes(localStorage.getItem("eyes")),
  );
  const [look, setLookState] = useState<Look>(() =>
    readLook(localStorage.getItem("lookStyle")),
  );
  const [character, setCharacterState] = useState(
    () => localStorage.getItem("character") || "stick",
  );

  useEffect(() => {
    const h = (e: StorageEvent) => {
      if (e.key === "color") setColorState(e.newValue || COLORS[0]);
      if (e.key === "eyes") setEyesState(readEyes(e.newValue));
      if (e.key === "lookStyle") setLookState(readLook(e.newValue));
      if (e.key === "character") setCharacterState(e.newValue || "stick");
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
  const setLook = (patch: Partial<Look>) =>
    setLookState((l) => {
      const n = { ...l, ...patch };
      localStorage.setItem("lookStyle", JSON.stringify(n));
      return n;
    });

  // A character is a preset: it loads skin, eyes, hair and outfit, and you can still change each one afterwards.
  const applyCharacter = (id: string) => {
    const c = CHARACTERS.find((x) => x.id === id);
    if (!c) return;
    const e = { ...DEFAULT_EYES, ...c.eyes },
      l = { ...DEFAULT_LOOK, ...c.look };
    setColor(c.color);
    setEyesState(e);
    localStorage.setItem("eyes", JSON.stringify(e));
    setLookState(l);
    localStorage.setItem("lookStyle", JSON.stringify(l));
    setCharacterState(id);
    localStorage.setItem("character", id);
  };

  return {
    color,
    setColor,
    eyes,
    setEyes,
    resetEyes,
    look,
    setLook,
    character,
    applyCharacter,
  };
}
export type Appearance = ReturnType<typeof useAppearance>;
