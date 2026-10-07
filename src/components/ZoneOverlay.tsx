import type { MouseEvent as ReactMouseEvent } from 'react';
import type { Rect } from '../types';

/** The dashed outline of the pet's zone. */
export function ZoneBox({ rect, drawing = false }: { rect: Rect; drawing?: boolean }) {
  return <div className={`zoneBox${drawing ? ' drawing' : ''}`} style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }} />;
}

/** Full-screen layer shown while you drag out a new zone. */
export function ZoneOverlay({ draft, onDown, onMove, onUp }: {
  draft: Rect | null;
  onDown(e: ReactMouseEvent): void;
  onMove(e: ReactMouseEvent): void;
  onUp(e: ReactMouseEvent): void;
}) {
  return (
    <div className="zoneOverlay" onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}>
      <div className="zoneHint">Drag to draw the pet's zone. Esc to cancel.</div>
      {draft && <ZoneBox rect={draft} drawing />}
    </div>
  );
}
