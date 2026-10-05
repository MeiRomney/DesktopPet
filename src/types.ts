import type { Pose } from './reactions';

export type Obj = { id: number; emoji: string; name: string; x: number; y: number };
export type Reply = { ok: boolean; pose?: Pose; says?: string; error?: string };
export type Rect = { x: number; y: number; w: number; h: number };

// Where the pet roams: anywhere, inside a drawn box, or on the edges (the taskbar, the top of the focused app).
export type RoamMode = 'free' | 'box' | 'edges';
export type EdgeCfg = { on: boolean; screen: boolean; apps: boolean };
/** The focused app window, in overlay coordinates. */
export type WinRect = Rect & { maximized: boolean; fullscreen: boolean };

// The bridge exposed to the page by electron/preload.cjs
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
      onActiveWindow(cb: (w: WinRect | null) => void): () => void;
    };
  }
}
