import { useEffect, useState } from "react";

/** Mute = the pet never shows speech bubbles. Saved, and synced between the pet window and the control panel. */
export function useMute() {
  const [muted, setMuted] = useState(
    () => localStorage.getItem("muted") === "1",
  );
  useEffect(() => {
    const h = (e: StorageEvent) => {
      if (e.key === "muted") setMuted(e.newValue === "1");
    };
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  }, []);
  const toggleMute = () => {
    const n = !muted;
    setMuted(n);
    localStorage.setItem("muted", n ? "1" : "0");
  };
  return { muted, toggleMute };
}
