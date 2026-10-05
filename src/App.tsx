import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { COLORS } from './constants';
import { Panel } from './components/Panel';
import { SpeechBubbles } from './components/SpeechBubbles';
import { Stickman } from './components/Stickman';
import { WorldObjects } from './components/WorldObjects';
import { ZoneBox, ZoneOverlay } from './components/ZoneOverlay';
import { useEdges } from './hooks/useEdges';
import { useInteractions } from './hooks/useInteractions';
import { useMovement } from './hooks/useMovement';
import { usePetCore } from './hooks/usePetCore';
import { usePupilTracking } from './hooks/usePupilTracking';
import { useSpeech } from './hooks/useSpeech';
import { useZone } from './hooks/useZone';
import { clamp } from './utils';

const PANEL_W = 236;

export default function App() {
  const zone = useZone();
  const core = usePetCore(zone.active, zone.edges.on);
  const speech = useSpeech(core);
  const move = useMovement(core, speech, zone.active);
  const act = useInteractions(core, speech, move);
  useEdges(core, move, zone.edges);
  usePupilTracking(core);

  const [color, setColor] = useState(COLORS[0]);
  const [text, setText] = useState('');
  const { pos, pose, open, setOpen, objs, facing, moveMs, stride, setStride, size, changeSize, W, H, wrapRef, hover, S } = core;

  const send = () => {
    const t = text.trim();
    if (!t) return;
    setText('');
    speech.showUserBubble(t);
    if (/\b(go away|leave|hide|bye)\b/i.test(t)) {
      speech.say(`The user told you to leave: "${t}"`).then(() => window.setTimeout(() => window.api.hide(), 2500));
      return;
    }
    speech.say(`The user said to you: "${t}"`);
  };

  // The pet's box on screen.
  const vl = pos.x, vt = pos.y, vw = W, vh = H;

  // The panel normally opens below the pet. On the taskbar there is no room below, so it opens beside the pet instead.
  const panelEl = useRef<HTMLDivElement>(null);
  const [panelH, setPanelH] = useState(260);
  useLayoutEffect(() => { const h = panelEl.current?.offsetHeight; if (open && h && Math.abs(h - panelH) > 1) setPanelH(h); });
  let panelPlace: CSSProperties | undefined;
  let lift = 0; // how far the pet's speech bubble must rise to clear a panel that sticks up beside the pet
  if (open) {
    const vw2 = window.innerWidth, vh2 = window.innerHeight;
    if (vt + vh + 6 + panelH <= vh2) {
      panelPlace = { left: clamp(pos.x + W / 2 - PANEL_W / 2, 8, vw2 - PANEL_W - 8) - pos.x, top: vt + vh + 6 - pos.y };
    } else {
      const toRight = vl + vw + 8 + PANEL_W <= vw2;
      const left = clamp(toRight ? vl + vw + 8 : vl - 8 - PANEL_W, 8, vw2 - PANEL_W - 8);
      const top = clamp(vt + vh - panelH, 8, vh2 - panelH - 8);
      panelPlace = { left: left - pos.x, top: top - pos.y };
      lift = Math.max(0, vt - top);
    }
  }

  const wrapStyle = {
    left: pos.x, top: pos.y, width: W, '--lift': `${lift}px`, // --lift: raises the speech bubble clear of a panel that sticks up beside the pet
    transition: moveMs ? `left ${moveMs}ms cubic-bezier(0.45, 0, 0.55, 1), top ${moveMs}ms cubic-bezier(0.45, 0, 0.55, 1)` : 'none',
  } as CSSProperties;

  return (
    <>
      {zone.active && (open || zone.flash) && <ZoneBox rect={zone.active} />}
      <WorldObjects objs={objs} hover={hover} onDown={act.objDown} />
      <div ref={wrapRef} className="wrap" {...hover} style={wrapStyle}>
        <SpeechBubbles says={speech.says} userSays={speech.userSays} thinking={speech.thinking} side={pos.x > 230 ? 'left' : 'right'} />
        <div
          className={`pet ${pose}${stride ? ' walking' : ''}`} onMouseDown={act.down}
          onAnimationIteration={(e) => { if (e.animationName.startsWith('step') && S.current.moveMs === 0) setStride(false); }}
        >
          <div style={{ transform: `scaleX(${facing})` }}><Stickman pose={pose} color={color} w={W} h={H} /></div>
        </div>
        {open && (
          <Panel
            color={color} onColor={setColor}
            look={speech.look} onToggleLook={speech.toggleLook} onLookNow={() => speech.lookAround(true)}
            size={size} onSize={changeSize}
            mode={zone.mode}
            onMode={(m) => { if (m === 'box' && !zone.zone) { setOpen(false); zone.startZone(); } else zone.setMode(m); }}
            zone={zone.zone} onSetZone={() => { setOpen(false); zone.startZone(); }} onClearZone={zone.clearZone}
            edgeScreen={zone.edges.screen} edgeApps={zone.edges.apps} onToggleEdge={zone.toggleEdge}
            panelRef={panelEl} placed={panelPlace}
            onSpawn={act.spawn}
            text={text} onText={setText} onSend={send}
          />
        )}
      </div>
      {zone.drawing && <ZoneOverlay draft={zone.draft} onDown={zone.onDown} onMove={zone.onMove} onUp={zone.onUp} />}
    </>
  );
}
