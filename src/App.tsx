import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { PetMenu } from "./components/PetMenu";
import { SpeechBubbles } from "./components/SpeechBubbles";
import { Stickman } from "./components/Stickman";
import { WorldObjects } from "./components/WorldObjects";
import { ZoneBox, ZoneOverlay } from "./components/ZoneOverlay";
import { useAppearance } from "./hooks/useAppearance";
import { useEdges } from "./hooks/useEdges";
import { useInteractions } from "./hooks/useInteractions";
import { useMovement } from "./hooks/useMovement";
import { usePetCore } from "./hooks/usePetCore";
import { usePupilTracking } from "./hooks/usePupilTracking";
import { useQuickToys } from "./hooks/useQuickToys";
import { useSpeech } from "./hooks/useSpeech";
import { useZone } from "./hooks/useZone";
import type { BusMsg } from "./types";
import { clamp } from "./utils";
import { EMOTES, DANCE_LINES } from "./emotes";

const PANEL_W = 236; // width of the small pet menu

export default function App() {
  const zone = useZone();
  const core = usePetCore(zone.active, zone.edges.on, zone.mode === "stay");
  const speech = useSpeech(core);
  const move = useMovement(core, speech, zone.active);
  const act = useInteractions(core, speech, move);
  useEdges(core, move, zone.edges);
  const appearance = useAppearance();
  usePupilTracking(core, appearance.eyes);
  const quick = useQuickToys();

  const [text, setText] = useState("");
  const [emote, setEmote] = useState<string | null>(null);
  const emoteTimer = useRef<number>();
  const tickTimer = useRef<number>();
  const sendTick = (on: boolean, left: number) =>
    window.api.bus.send({ type: "danceTick", on, left });
  const dancing = useRef(false);
  const {
    pos,
    pose,
    open,
    setOpen,
    objs,
    facing,
    moveMs,
    stride,
    setStride,
    W,
    H,
    wrapRef,
    hover,
    S,
  } = core;

  // Commands from the control panel window.
  const onCmd = useRef<(m: BusMsg) => void>(() => {});
  onCmd.current = (m) => {
    if (m.type === "spawn") act.spawn(m.emoji, m.name);
    else if (m.type === "lookNow") speech.lookAround(true);
    else if (m.type === "emote") playEmote(m.id);
    else if (m.type === "danceOff") startDanceOff(m.seconds, m.ids);
    else if (m.type === "danceStop") stopDance();
    else if (m.type === "drawZone") {
      core.hovering.current = false;
      setOpen(false);
      zone.startZone();
    }
  };
  useEffect(() => window.api.bus.on((m) => onCmd.current(m)), []);

  // freeze in place the moment Stay is switched on
  useEffect(() => {
    if (zone.mode !== "stay" || !core.wrapRef.current) return;
    const r = core.wrapRef.current.getBoundingClientRect();
    core.walkId.current++;
    core.rail.current = null;
    core.setMoveMs(0);
    core.setStride(false);
    core.setPos({ x: r.left, y: r.top });
    localStorage.setItem("stayPos", JSON.stringify({ x: r.left, y: r.top }));
  }, [zone.mode]);

  const freezePet = () => {
    // stop any walk right where the pet visually is
    const r = core.wrapRef.current!.getBoundingClientRect();
    core.walkId.current++;
    core.rail.current = null;
    core.setMoveMs(0);
    core.setStride(false);
    core.setPos({ x: r.left, y: r.top });
    core.busy.current = true; // pauses wandering and spontaneous speech
    core.setOpen(false);
  };

  const stopDance = () => {
    window.clearTimeout(emoteTimer.current);
    window.clearInterval(tickTimer.current);
    sendTick(false, 0); // the control panel resets its duration display
    dancing.current = false;
    setEmote(null);
    core.setPose("neutral");
    core.busy.current = false;
  };

  const playEmote = (id: string) => {
    const e = EMOTES.find((x) => x.id === id);
    if (!e) return;
    freezePet();
    window.clearTimeout(emoteTimer.current);
    window.clearInterval(tickTimer.current);
    sendTick(false, 0);
    dancing.current = false; // a single move cancels a running dance-off
    core.setPose(e.pose);
    setEmote(null); // drop the class first so the same move restarts from frame 0 if clicked again
    window.setTimeout(() => setEmote(id), 30);
    emoteTimer.current = window.setTimeout(stopDance, e.ms + 30);
  };

  // Dance-off: chain random moves from the chosen mix (never the same one twice in a row) until the time is up.
  const startDanceOff = (seconds: number, ids: string[]) => {
    window.clearTimeout(emoteTimer.current);
    window.clearInterval(tickTimer.current);
    freezePet();
    dancing.current = true;
    const picked = EMOTES.filter((e) => ids.includes(e.id));
    const mix = picked.length ? picked : [...EMOTES];
    const end = Date.now() + seconds * 1000;
    let last = "",
      shown = seconds;
    sendTick(true, seconds);
    tickTimer.current = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      if (left !== shown) {
        shown = left;
        sendTick(true, left);
      }
    }, 200);
    const next = () => {
      if (!dancing.current) return;
      const left = end - Date.now();
      // only moves that finish (almost) before the time runs out
      const pool = mix.filter(
        (e) => (e.id !== last || mix.length === 1) && e.ms <= left + 300,
      );
      if (!pool.length) {
        // no move fits in the remaining seconds: strike a pose until the clock hits zero
        setEmote(null);
        core.setPose("happy");
        speech.showBubble("Mic drop.", 3000);
        emoteTimer.current = window.setTimeout(stopDance, Math.max(0, left));
        return;
      }
      const e = pool[Math.floor(Math.random() * pool.length)];
      last = e.id;
      core.setPose(e.pose);
      setEmote(e.id);
      if (Math.random() < 0.5)
        speech.showBubble(
          DANCE_LINES[Math.floor(Math.random() * DANCE_LINES.length)],
          2500,
        );
      emoteTimer.current = window.setTimeout(next, e.ms);
    };
    speech.showBubble("Dance-off time. Try to keep up.", 2500);
    next();
  };

  // Tell the control panel when the pet is busy, and when you finished (or cancelled) drawing a box.
  useEffect(() => {
    window.api.bus.send({ type: "thinking", on: speech.thinking });
  }, [speech.thinking]);
  const wasDrawing = useRef(false);
  useEffect(() => {
    if (wasDrawing.current && !zone.drawing)
      window.api.bus.send({ type: "zoneDone" });
    wasDrawing.current = zone.drawing;
  }, [zone.drawing]);

  const closeMenu = () => {
    core.hovering.current = false;
    window.api.clickThrough(true);
    setOpen(false);
  };
  const openPanel = () => {
    closeMenu();
    window.api.openControl();
  };

  const send = () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    speech.showUserBubble(t);
    if (/\b(go away|leave|hide|bye)\b/i.test(t)) {
      speech
        .say(`The user told you to leave: "${t}"`)
        .then(() => window.setTimeout(() => window.api.hide(), 2500));
      return;
    }
    speech.say(`The user said to you: "${t}"`);
  };

  const vl = pos.x,
    vt = pos.y,
    vw = W,
    vh = H;

  // The menu normally opens below the pet. On the taskbar there is no room below, so it opens beside the pet.
  const panelEl = useRef<HTMLDivElement>(null);
  const [panelH, setPanelH] = useState(100);
  useLayoutEffect(() => {
    const h = panelEl.current?.offsetHeight;
    if (open && h && Math.abs(h - panelH) > 1) setPanelH(h);
  });
  let panelPlace: CSSProperties | undefined;
  let lift = 0;
  if (open) {
    const vw2 = window.innerWidth,
      vh2 = window.innerHeight;
    if (vt + vh + 6 + panelH <= vh2) {
      panelPlace = {
        left: clamp(pos.x + W / 2 - PANEL_W / 2, 8, vw2 - PANEL_W - 8) - pos.x,
        top: vt + vh + 6 - pos.y,
      };
    } else {
      const toRight = vl + vw + 8 + PANEL_W <= vw2;
      const left = clamp(
        toRight ? vl + vw + 8 : vl - 8 - PANEL_W,
        8,
        vw2 - PANEL_W - 8,
      );
      const top = clamp(vt + vh - panelH, 8, vh2 - panelH - 8);
      panelPlace = { left: left - pos.x, top: top - pos.y };
      lift = Math.max(0, vt - top);
    }
  }

  const wrapStyle = {
    left: pos.x,
    top: pos.y,
    width: W,
    "--lift": `${lift}px`,
    transition: moveMs
      ? `left ${moveMs}ms cubic-bezier(0.45, 0, 0.55, 1), top ${moveMs}ms cubic-bezier(0.45, 0, 0.55, 1)`
      : "none",
  } as CSSProperties;

  return (
    <>
      {zone.active && (open || zone.flash) && <ZoneBox rect={zone.active} />}
      <WorldObjects objs={objs} hover={hover} onDown={act.objDown} />
      <div ref={wrapRef} className="wrap" {...hover} style={wrapStyle}>
        <SpeechBubbles
          says={speech.says}
          userSays={speech.userSays}
          thinking={speech.thinking}
          side={pos.x > 230 ? "left" : "right"}
        />
        <div
          className={`pet ${pose}${stride ? " walking" : ""}${emote ? ` emote emote-${emote}` : ""}`}
          onMouseDown={act.down}
          onAnimationIteration={(e) => {
            if (e.animationName.startsWith("step") && S.current.moveMs === 0)
              setStride(false);
          }}
        >
          <div style={{ transform: `scaleX(${facing})` }}>
            <Stickman
              pose={pose}
              color={appearance.color}
              eyes={appearance.eyes}
              w={W}
              h={H}
            />
          </div>
        </div>
        {open && (
          <PetMenu
            panelRef={panelEl}
            placed={panelPlace}
            quick={quick.quick}
            onSpawn={act.spawn}
            onOpenPanel={openPanel}
            text={text}
            onText={setText}
            onSend={send}
            onClose={closeMenu}
          />
        )}
      </div>
      {zone.drawing && (
        <ZoneOverlay
          draft={zone.draft}
          onDown={zone.onDown}
          onMove={zone.onMove}
          onUp={zone.onUp}
        />
      )}
    </>
  );
}
