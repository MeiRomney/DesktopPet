import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ControlPanel } from "./components/ControlPanel";
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
import { useSpeech } from "./hooks/useSpeech";
import { useZone } from "./hooks/useZone";
import { clamp } from "./utils";

const PANEL_W = 236; // width of the small pet menu

export default function App() {
  const zone = useZone();
  const core = usePetCore(zone.active, zone.edges.on);
  const speech = useSpeech(core);
  const move = useMovement(core, speech, zone.active);
  const act = useInteractions(core, speech, move);
  useEdges(core, move, zone.edges);
  const appearance = useAppearance();
  usePupilTracking(core, appearance.eyes);

  const [text, setText] = useState("");
  const [controlOpen, setControlOpen] = useState(false); // the control panel (tray menu or Ctrl+Alt+O)
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
    size,
    changeSize,
    W,
    H,
    wrapRef,
    hover,
    S,
  } = core;

  useEffect(
    () =>
      window.api.onOpenControl(() => {
        setOpen(false);
        setControlOpen(true);
      }),
    [],
  );
  const closeControl = () => {
    core.hovering.current = false;
    window.api.clickThrough(true);
    setControlOpen(false);
  };
  const beginZone = () => {
    core.hovering.current = false;
    zone.startZone();
  }; // the panel hides while you draw
  const closeMenu = () => {
    core.hovering.current = false;
    window.api.clickThrough(true);
    setOpen(false);
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

  // The pet's box on screen.
  const vl = pos.x,
    vt = pos.y,
    vw = W,
    vh = H;

  // The panel normally opens below the pet. On the taskbar there is no room below, so it opens beside the pet instead.
  const panelEl = useRef<HTMLDivElement>(null);
  const [panelH, setPanelH] = useState(260);
  useLayoutEffect(() => {
    const h = panelEl.current?.offsetHeight;
    if (open && h && Math.abs(h - panelH) > 1) setPanelH(h);
  });
  let panelPlace: CSSProperties | undefined;
  let lift = 0; // how far the pet's speech bubble must rise to clear a panel that sticks up beside the pet
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
    "--lift": `${lift}px`, // --lift: raises the speech bubble clear of a panel that sticks up beside the pet
    transition: moveMs
      ? `left ${moveMs}ms cubic-bezier(0.45, 0, 0.55, 1), top ${moveMs}ms cubic-bezier(0.45, 0, 0.55, 1)`
      : "none",
  } as CSSProperties;

  return (
    <>
      {zone.active && (open || controlOpen || zone.flash) && (
        <ZoneBox rect={zone.active} />
      )}
      <WorldObjects objs={objs} hover={hover} onDown={act.objDown} />
      <div ref={wrapRef} className="wrap" {...hover} style={wrapStyle}>
        <SpeechBubbles
          says={speech.says}
          userSays={speech.userSays}
          thinking={speech.thinking}
          side={pos.x > 230 ? "left" : "right"}
        />
        <div
          className={`pet ${pose}${stride ? " walking" : ""}`}
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
            onSpawn={act.spawn}
            text={text}
            onText={setText}
            onSend={send}
            onClose={closeMenu}
          />
        )}
      </div>
      {controlOpen && !zone.drawing && (
        <ControlPanel
          appearance={appearance}
          speech={speech}
          zone={zone}
          size={size}
          onSize={changeSize}
          onSpawn={act.spawn}
          onStartZone={beginZone}
          onClose={closeControl}
          hover={hover}
        />
      )}
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
