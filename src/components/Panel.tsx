import { COLORS } from '../constants';
import { ITEMS } from '../reactions';
import type { CSSProperties, Ref } from 'react';
import type { Rect, RoamMode } from '../types';

type Props = {
  color: string; onColor(c: string): void;
  look: boolean; onToggleLook(): void; onLookNow(): void;
  size: number; onSize(v: number): void;
  mode: RoamMode; onMode(m: RoamMode): void;
  zone: Rect | null; onSetZone(): void; onClearZone(): void;
  edgeScreen: boolean; edgeApps: boolean; onToggleEdge(k: 'screen' | 'apps'): void;
  panelRef: Ref<HTMLDivElement>; placed?: CSSProperties; // placed = where to put the card when there is no room below the pet
  onSpawn(emoji: string, name: string): void;
  text: string; onText(t: string): void; onSend(): void;
};

const MODES: [RoamMode, string, string][] = [
  ['free', 'Free', 'Wander anywhere on the screen'],
  ['box', 'Box', 'Stay inside a rectangle you draw'],
  ['edges', 'Edges', 'Stay on the edges: on the taskbar and on top of the app you are using'],
];

/** The control card that opens when you click the pet. */
export function Panel({ color, onColor, look, onToggleLook, onLookNow, size, onSize, mode, onMode, zone, onSetZone, onClearZone, edgeScreen, edgeApps, onToggleEdge, panelRef, placed, onSpawn, text, onText, onSend }: Props) {
  return (
    <div ref={panelRef} className={`panel${placed ? ' placed' : ''}`} style={placed}>
      <div className="toys">
        {ITEMS.map(([e, n]) => <button key={e} className="toy" title={`Drop ${n}`} onClick={() => onSpawn(e, n)}>{e}</button>)}
      </div>
      <div className="row">
        <div className="swatches">
          {COLORS.map((c) => (
            <button
              key={c} className={`swatch${c === color ? ' sel' : ''}`} style={{ backgroundColor: c }}
              title="Change color" aria-label={`Color ${c}`} aria-pressed={c === color} onClick={() => onColor(c)}
            />
          ))}
        </div>
        <button className={`chip${look ? ' on' : ''}`} title={look ? 'Auto-look is ON: it glances at my screen every 8-15 minutes (click to turn off)' : 'Auto-look is OFF: click to let it glance at my screen every 8-15 minutes'} aria-label="Auto-look at my screen" aria-pressed={look} onClick={onToggleLook}>👀</button>
        <button className="chip" title="Look now: glance at my screen once" aria-label="Look at my screen now" onClick={onLookNow}>📸</button>
      </div>
      <div className="sizeRow">
        <span className="sizeS" aria-hidden="true">A</span>
        <input type="range" min="0.6" max="1.8" step="0.05" value={size} title="Pet size" aria-label="Pet size" onChange={(e) => onSize(Number(e.target.value))} />
        <span className="sizeL" aria-hidden="true">A</span>
      </div>
      <div className="roam">
        <div className="seg" role="group" aria-label="Where the pet roams">
          {MODES.map(([m, label, tip]) => (
            <button key={m} className={`segBtn${mode === m ? ' on' : ''}`} aria-pressed={mode === m} title={tip} onClick={() => onMode(m)}>{label}</button>
          ))}
        </div>
        {mode === 'box' && zone && (
          <div className="zoneRow">
            <button className="pill" title="Draw a new rectangle; the pet will stay inside it" onClick={onSetZone}>Redraw box</button>
            <button className="pill" aria-label="Remove box" title="Remove the box" onClick={onClearZone}>✕</button>
          </div>
        )}
        {mode === 'edges' && (
          <>
            <div className="zoneRow">
              <button className={`pill${edgeScreen ? ' on' : ''}`} aria-pressed={edgeScreen} title="Walk along the top of the taskbar" onClick={() => onToggleEdge('screen')}>Taskbar</button>
              <button className={`pill${edgeApps ? ' on' : ''}`} aria-pressed={edgeApps} title="Stand on top of the window you are using (only where there is free room above it)" onClick={() => onToggleEdge('apps')}>App tops</button>
            </div>
            <div className="hint">Always upright, stays off your work area, and hides while a fullscreen app is open.</div>
          </>
        )}
      </div>
      <div className="chat">
        <input
          value={text} autoFocus placeholder="Say something"
          onChange={(e) => onText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSend()}
        />
        <button className="send" title="Send" aria-label="Send" onClick={onSend}>↑</button>
      </div>
    </div>
  );
}
