import type { Pose } from "./reactions";

export type ToyActDef = {
  id: string;
  ms: number;
  pose: Pose;
  armsDown: boolean;
  fx?: string;
};

/** Keyed by the toy's name (see ITEMS in reactions.ts). */
export const TOY_ACTS: Record<string, ToyActDef> = {
  "a cake": { id: "cake", ms: 3300, pose: "happy", armsDown: true }, // eats it, bite by bite
  "a cat": { id: "cat", ms: 3600, pose: "happy", armsDown: true, fx: "💕" }, // pets it
  "a piano": {
    id: "piano",
    ms: 3000,
    pose: "shocked",
    armsDown: true,
    fx: "💫",
  }, // squashed flat
  "a bomb": { id: "bomb", ms: 3200, pose: "scared", armsDown: true, fx: "💥" }, // boom, soot
  "a gun": { id: "gun", ms: 2600, pose: "shocked", armsDown: false, fx: "💥" }, // hands up, pew
  "a sword": {
    id: "sword",
    ms: 2400,
    pose: "scared",
    armsDown: true,
    fx: "✨",
  }, // ducks the slash
};
