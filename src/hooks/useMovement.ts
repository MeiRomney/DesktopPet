import { useEffect } from 'react';
import { idleLine } from '../reactions';
import type { Rect } from '../types';
import { clamp } from '../utils';
import type { PetCore } from './usePetCore';
import type { Speech } from './useSpeech';

/** Walking, running away, and wandering around on its own. */
export function useMovement(c: PetCore, speech: Speech, activeZone: Rect | null) {
  const { S, walkId, dims, bounds, size, setFacing, setMoveMs, setStride, setPos, setPose, rail, edgeStep, drag, objDrag, hovering, busy } = c;
  const { showBubble } = speech;

  // Move to exactly (x, y): no clamping. Edges mode uses this directly.
  const glide = (x: number, y: number, o: { speed?: number; then?: () => void } = {}) => {
    const { speed = 70, then } = o;
    const p = S.current.pos;
    const id = ++walkId.current;
    const ms = Math.max(350, (Math.hypot(x - p.x, y - p.y) / speed) * 1000); // walks ~70 px/s, runs ~260 px/s
    setFacing(x < p.x ? -1 : 1); setMoveMs(ms); setStride(true); setPos({ x, y });
    window.setTimeout(() => { if (walkId.current !== id) return; setMoveMs(0); then?.(); }, ms);
  };

  // Walk somewhere on the desktop, inside the allowed area.
  const walkTo = (x: number, y: number, then?: () => void, speed = 70) => {
    const b = bounds();
    rail.current = null; // no longer on an edge
    glide(clamp(x, b.minX, b.maxX), clamp(y, b.minY, b.maxY), { speed, then });
  };

  // Run to the screen corner that is farthest from the object.
  const flee = (ox: number, oy: number) => {
    const { W, H } = dims();
    const b = bounds();
    const spots: [number, number][] = [[b.minX, b.minY], [b.maxX, b.minY], [b.minX, b.maxY], [b.maxX, b.maxY]];
    let best = spots[0], far = -1;
    for (const [sx, sy] of spots) {
      const d = Math.hypot(sx + W / 2 - ox, sy + H / 2 - oy);
      if (d > far) { far = d; best = [sx, sy]; }
    }
    setPose('scared');
    walkTo(best[0], best[1], () => setPose('neutral'), 260);
  };

  // Wander around the desktop on its own; wave or mutter a line now and then. No AI here.
  useEffect(() => {
    let t: number;
    const loop = () => {
      t = window.setTimeout(() => {
        if (!drag.current && !objDrag.current && !hovering.current && !busy.current && !S.current.open) {
          if (Math.random() < 0.3) { setPose('wave'); window.setTimeout(() => setPose('neutral'), 2000); }
          else {
            if (S.current.edges && edgeStep.current) edgeStep.current(); // Edges mode: patrol the edges (see useEdges)
            else {
              const b = bounds();
              walkTo(b.minX + Math.random() * (b.maxX - b.minX), S.current.zone ? b.minY + Math.random() * (b.maxY - b.minY) : window.innerHeight * (0.4 + Math.random() * 0.5));
            }
            if (Math.random() < 0.3) showBubble(idleLine(), 3500);
          }
        }
        loop();
      }, 5000 + Math.random() * 8000);
    };
    loop();
    return () => window.clearTimeout(t);
  }, []);

  // After the size or zone changes, walk the pet back into the allowed area if it is outside.
  useEffect(() => {
    if (S.current.edges) return; // Edges mode places the pet on an edge itself
    const b = bounds(), p = S.current.pos;
    const nx = clamp(p.x, b.minX, b.maxX), ny = clamp(p.y, b.minY, b.maxY);
    if (nx !== p.x || ny !== p.y) walkTo(nx, ny);
  }, [size, activeZone]);

  return { walkTo, glide, flee };
}
export type Movement = ReturnType<typeof useMovement>;
