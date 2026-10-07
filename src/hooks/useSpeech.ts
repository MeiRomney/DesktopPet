import { useEffect, useRef, useState } from "react";
import type { Pose } from "../reactions";
import { AI_CHANCE } from "../constants";
import type { PetCore } from "./usePetCore";

export type LookEvery = "often" | "normal" | "rare";
export const LOOK_RANGES: Record<LookEvery, [number, number]> = {
  often: [2, 4],
  normal: [8, 15],
  rare: [20, 40],
}; // minutes

/** Everything the pet says: bubbles, scripted lines, and the AI (chat replies, random reactions, screen glances). */
export function useSpeech(c: PetCore) {
  const { setPose, busy, S, drag, objDrag, hovering } = c;
  const [says, setSays] = useState("");
  const [thinking, setThinking] = useState(false);
  const [userSays, setUserSays] = useState(""); // what you just typed, shown for a few seconds
  const [look, setLook] = useState(() => localStorage.getItem("look") === "1"); // off until you turn it on
  const [lookEvery, setLookEveryState] = useState<LookEvery>(() => {
    const v = localStorage.getItem("lookEvery");
    return v === "often" || v === "rare" ? v : "normal";
  });
  const lookRange = useRef(lookEvery);
  lookRange.current = lookEvery;
  const setLookEvery = (v: LookEvery) => {
    setLookEveryState(v);
    localStorage.setItem("lookEvery", v);
  };
  const bubbleTimer = useRef<number>();
  const userTimer = useRef<number>();
  const lookOn = useRef(look);
  lookOn.current = look;

  const showBubble = (t: string, ms = 7000) => {
    setSays(t);
    window.clearTimeout(bubbleTimer.current);
    bubbleTimer.current = window.setTimeout(() => setSays(""), ms);
  };

  // Your own message, shown beside the pet for a few seconds.
  const showUserBubble = (t: string) => {
    setUserSays(t);
    window.clearTimeout(userTimer.current);
    userTimer.current = window.setTimeout(() => setUserSays(""), 4500);
  };

  // Scripted reaction: instant, free, and logged to memory so chat can refer to it later.
  const sayLocal = (p: Pose, t: string, memory?: string) => {
    setPose(p);
    showBubble(t, 5000);
    if (memory) window.api.remember(memory);
  };

  // AI use #1: replying when you text it (and the random AI moments below). onFail lets background calls
  // fall back quietly when Ollama is not running; your own messages always show the error.
  const say = async (event: string, onFail?: () => void) => {
    busy.current = true;
    setThinking(true);
    const r = await window.api.react(event);
    busy.current = false;
    setThinking(false);
    if (!r.ok && onFail) {
      onFail();
      return;
    }
    setPose(r.ok ? r.pose! : "sad");
    showBubble(
      r.ok ? r.says! : `No brain found. Is Ollama running? (${r.error})`,
    );
  };

  // AI use #2: about 1 in 4 object reactions is answered by the AI instead of the scripted line.
  const reactTo = (
    r: { pose: Pose; says: string },
    event: string,
    memory: string,
  ) => {
    if (Math.random() < AI_CHANCE && !busy.current) {
      setPose(r.pose);
      say(event, () => sayLocal(r.pose, r.says, memory)); // AI is off or failed: use the scripted line
    } else sayLocal(r.pose, r.says, memory);
  };

  // AI use #4: an occasional glance at the desktop (vision model).
  const lookAround = async (manual: boolean) => {
    if (busy.current) return;
    busy.current = true;
    setThinking(true);
    const r = await window.api.look();
    busy.current = false;
    setThinking(false);
    if (r.ok) {
      setPose(r.pose!);
      showBubble(r.says!, 9000);
    } else if (manual) {
      setPose("sad");
      showBubble(`I could not look. Is the vision model pulled? (${r.error})`);
    }
  };

  const toggleLook = () => {
    const n = !look;
    setLook(n);
    localStorage.setItem("look", n ? "1" : "0");
  };

  // Every 8-15 minutes, if you enabled it, take a glance at the desktop.
  useEffect(() => {
    let t: number;
    const loop = () => {
      t = window.setTimeout(
        () => {
          if (
            lookOn.current &&
            !S.current.open &&
            !drag.current &&
            !objDrag.current
          )
            lookAround(false);
          loop();
        },
        (() => {
          const [a, b] = LOOK_RANGES[lookRange.current];
          return (a + Math.random() * (b - a)) * 60000;
        })(),
      );
    };
    loop();
    return () => window.clearTimeout(t);
  }, []);

  // AI use #3: every couple of minutes, at a random moment, it says something spontaneous.
  useEffect(() => {
    let t: number;
    const loop = () => {
      t = window.setTimeout(
        () => {
          if (
            !drag.current &&
            !objDrag.current &&
            !hovering.current &&
            !busy.current &&
            !S.current.open
          )
            say(
              "You are idle and nobody is talking to you. Say something spontaneous: a thought, a joke, or something you remember.",
              () => {},
            );
          loop();
        },
        120000 + Math.random() * 180000,
      );
    };
    loop();
    return () => window.clearTimeout(t);
  }, []);

  return {
    says,
    userSays,
    thinking,
    look,
    toggleLook,
    lookEvery,
    setLookEvery,
    showBubble,
    showUserBubble,
    sayLocal,
    say,
    reactTo,
    lookAround,
  };
}
export type Speech = ReturnType<typeof useSpeech>;
