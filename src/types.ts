import type { Pose } from "./reactions";

export type Obj = {
  id: number;
  emoji: string;
  name: string;
  x: number;
  y: number;
};
export type Reply = {
  ok: boolean;
  pose?: Pose;
  says?: string;
  error?: string;
  code?: string;
};
export type Rect = { x: number; y: number; w: number; h: number };

export type AiMode = "off" | "ollama" | "key";
export type AiProvider = "anthropic" | "openai";
export type AiSettings = {
  mode: AiMode;
  provider: AiProvider;
  model: string;
  hasKey: boolean;
};
export type OllamaState = "missing" | "stopped" | "running";
export type AiStatus = {
  ollama: { state: OllamaState; hasChat: boolean; hasVision: boolean };
  models: { chat: string; vision: string };
  cameraReady: boolean;
  cameraReason: string;
};
export type AiPullProgress = {
  model: string;
  status: string;
  completed: number;
  total: number;
};

// Where the pet roams: anywhere, inside a drawn box, or on the edges (the taskbar, the top of the focused app).
export type RoamMode = "free" | "box" | "edges" | "stay";
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
  | { type: "emote"; id: string }
  | { type: "danceOff"; seconds: number; ids: string[] }
  | { type: "danceTick"; on: boolean; left: number }
  | { type: "danceStop" }
  | { type: "thinking"; on: boolean }
  | { type: "runOut" }
  | { type: "runIn" }
  | { type: "shortcut"; action: "emote" | "dance" | "toys" | "mute" }
  | { type: "petVisible"; on: boolean };

declare global {
  interface Window {
    api: {
      clickThrough(on: boolean): void;
      react(e: string): Promise<Reply>;
      look(): Promise<Reply>;
      remember(t: string): void;
      hide(): void;
      petLeft(): void;
      petVisible(): Promise<boolean>;
      togglePet(): void;
      toggleControl(): void;
      workArea(): Promise<Rect>;
      trackWindows(on: boolean): void;
      openControl(): void;
      bus: { send(m: BusMsg): void; on(cb: (m: BusMsg) => void): () => void };
      onActiveWindow(cb: (w: WinRect | null) => void): () => void;
      ai: {
        getSettings(): Promise<AiSettings>;
        update(
          p: Partial<{
            mode: AiMode;
            provider: AiProvider;
            model: string;
            apiKey: string;
          }>,
        ): Promise<AiSettings>;
        status(): Promise<AiStatus>;
        openDownload(): void;
        startOllama(): Promise<void>;
        pullModels(): Promise<{ ok: boolean; error?: string }>;
        test(): Promise<{ ok: boolean; says?: string; error?: string }>;
        onProgress(cb: (p: AiPullProgress) => void): () => void;
      };
    };
  }
}
