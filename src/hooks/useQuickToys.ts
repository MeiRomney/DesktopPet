import { useEffect, useState } from "react";
import { ITEMS } from "../reactions";

type Pair = [string, string];
const DEFAULT: Pair = ["🔫", "🗡️"];

const read = (raw: string | null): Pair => {
  try {
    const a = JSON.parse(raw || "null");
    if (
      Array.isArray(a) &&
      a.length === 2 &&
      a[0] !== a[1] &&
      a.every((e) => ITEMS.some(([x]) => x === e))
    )
      return [a[0], a[1]];
  } catch {
    /* use the default */
  }
  return DEFAULT;
};

/** The two toys shown on the pet menu. Picking a third replaces the older choice. */
export function useQuickToys() {
  const [quick, setQuick] = useState<Pair>(() =>
    read(localStorage.getItem("quickToys")),
  );
  useEffect(() => {
    const h = (e: StorageEvent) => {
      if (e.key === "quickToys") setQuick(read(e.newValue));
    };
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  }, []);
  const pick = (emoji: string) => {
    if (quick.includes(emoji)) return;
    const next: Pair = [quick[1], emoji];
    setQuick(next);
    localStorage.setItem("quickToys", JSON.stringify(next));
  };
  return { quick, pick };
}
