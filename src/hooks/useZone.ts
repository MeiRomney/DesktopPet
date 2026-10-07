import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { Rect, RoamMode } from "../types";
import { rectFrom } from "../utils";

/** Where the pet roams: free, inside a drawn box (the saved rectangle), or along the edges. Also drawing a new box on screen. */
export function useZone() {
  const [zone, setZone] = useState<Rect | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("zone") || "null");
    } catch {
      return null;
    }
  });
  const [mode, setModeState] = useState<RoamMode>(() => {
    // older versions only stored zoneOn
    const m = localStorage.getItem("roamMode");
    return m === "free" || m === "box" || m === "edges"
      ? m
      : localStorage.getItem("zoneOn") === "1"
        ? "box"
        : "free";
  });
  const [edgeScreen, setEdgeScreen] = useState(
    () => localStorage.getItem("edgeScreen") !== "0",
  ); // taskbar + screen sides
  const [edgeApps, setEdgeApps] = useState(
    () => localStorage.getItem("edgeApps") !== "0",
  ); // borders of the focused app
  const [drawing, setDrawing] = useState(false);
  const [draft, setDraft] = useState<Rect | null>(null);
  const [flash, setFlash] = useState(false); // briefly shows the zone outline after you set or toggle it
  const zStart = useRef<{ x: number; y: number } | null>(null);
  const flashTimer = useRef<number>();
  const active = mode === "box" ? zone : null; // the box the pet has to respect right now

  const flashZone = () => {
    setFlash(true);
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(false), 2500);
  };
  const startZone = () => {
    setDraft(null);
    setDrawing(true);
    window.api.clickThrough(false);
  };
  const finishZone = (r: Rect) => {
    setDrawing(false);
    setDraft(null);
    window.api.clickThrough(true);
    if (r.w < 80 || r.h < 80) return; // too small: ignore
    setZone(r);
    localStorage.setItem("zone", JSON.stringify(r));
    setMode("box");
  };
  const setMode = (m: RoamMode) => {
    setModeState(m);
    localStorage.setItem("roamMode", m);
    if (m === "box") flashZone();
  };
  const clearZone = () => {
    setZone(null);
    localStorage.removeItem("zone");
    if (mode === "box") setMode("free");
  };
  // What counts as an edge. At least one stays on, otherwise the pet would have nowhere to stand.
  const toggleEdge = (k: "screen" | "apps") => {
    const s = k === "screen" ? !edgeScreen : edgeScreen,
      a = k === "apps" ? !edgeApps : edgeApps;
    if (!s && !a) return;
    setEdgeScreen(s);
    setEdgeApps(a);
    localStorage.setItem("edgeScreen", s ? "1" : "0");
    localStorage.setItem("edgeApps", a ? "1" : "0");
  };

  // The control panel is another window: its changes (and the box you drew from here) arrive as storage events.
  useEffect(() => {
    const h = (e: StorageEvent) => {
      if (e.key === "zone") {
        try {
          setZone(JSON.parse(e.newValue || "null"));
        } catch {
          setZone(null);
        }
      } else if (
        e.key === "roamMode" &&
        (e.newValue === "free" ||
          e.newValue === "box" ||
          e.newValue === "edges")
      ) {
        setModeState(e.newValue);
        if (e.newValue === "box") flashZone();
      } else if (e.key === "edgeScreen") setEdgeScreen(e.newValue !== "0");
      else if (e.key === "edgeApps") setEdgeApps(e.newValue !== "0");
    };
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  }, []);

  // Esc cancels drawing a zone.
  useEffect(() => {
    if (!drawing) return;
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      zStart.current = null;
      setDrawing(false);
      setDraft(null);
      window.api.clickThrough(true);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [drawing]);

  // Mouse handlers for the full-screen drawing layer.
  const onDown = (e: ReactMouseEvent) => {
    zStart.current = { x: e.clientX, y: e.clientY };
    setDraft({ x: e.clientX, y: e.clientY, w: 0, h: 0 });
  };
  const onMove = (e: ReactMouseEvent) => {
    if (zStart.current)
      setDraft(rectFrom(zStart.current, e.clientX, e.clientY));
  };
  const onUp = (e: ReactMouseEvent) => {
    const a = zStart.current;
    zStart.current = null;
    if (a) finishZone(rectFrom(a, e.clientX, e.clientY));
  };

  const edges = { on: mode === "edges", screen: edgeScreen, apps: edgeApps };
  return {
    zone,
    mode,
    setMode,
    edges,
    toggleEdge,
    active,
    drawing,
    draft,
    flash,
    startZone,
    clearZone,
    onDown,
    onMove,
    onUp,
  };
}
