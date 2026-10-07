import type { Pose } from "./reactions";

export type Obj = {
  id: number;
  emoji: string;
  name: string;
  x: number;
  y: number;
};
export type Reply = { ok: boolean; pose?: Pose; says?: string; error?: string };
export type Rect = { x: number; y: number; w: number; h: number };

// Where the pet roams: anywhere, inside a drawn box, or on the edges (the taskbar, the top of the focused app).
export type RoamMode = "free" | "box" | "edges";
export type EdgeCfg = { on: boolean; screen: boolean; apps: boolean };
/** The focused app window, in overlay coordinates. */
export type WinRect = Rect & { maximized: boolean; fullscreen: boolean };

/** Eye customization. size/pupil are multipliers (1 = default), gap is the distance between the eye centers in SVG units. */
export type Eyes = {
  size: number;
  pupil: number;
  gap: number;
  pupilColor: string;
  track: boolean;
};

/** Messages between the control panel window and the pet window (relayed by the main process). */
export type BusMsg =
  | { type: "spawn"; emoji: string; name: string }
  | { type: "drawZone" }
  | { type: "zoneDone" }
  | { type: "lookNow" }
  | { type: "thinking"; on: boolean };

declare global {
  interface Window {
    api: {
      clickThrough(on: boolean): void;
      react(e: string): Promise<Reply>;
      look(): Promise<Reply>;
      remember(t: string): void;
      hide(): void;
      workArea(): Promise<Rect>;
      trackWindows(on: boolean): void;
      openControl(): void;
      bus: { send(m: BusMsg): void; on(cb: (m: BusMsg) => void): () => void };
      onActiveWindow(cb: (w: WinRect | null) => void): () => void;
    };
  }
}
