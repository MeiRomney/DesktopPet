import { useEffect, useState } from "react";
import { clamp } from "../utils";

const read = (v: string | null) => clamp(Number(v) || 1, 0.6, 1.8);

/** Pet size (1 = default). Saved, and kept in sync between the pet window and the control panel window. */
export function useSize() {
  const [size, setSize] = useState(() => read(localStorage.getItem("size")));
  useEffect(() => {
    const h = (e: StorageEvent) => {
      if (e.key === "size") setSize(read(e.newValue));
    };
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  }, []);
  const changeSize = (v: number) => {
    setSize(v);
    localStorage.setItem("size", String(v));
  };
  return { size, changeSize };
}
