import { useEffect } from 'react';
import type { PetCore } from './usePetCore';

export function usePupilTracking(c: PetCore) {
  const { wrapRef, S } = c;

  // The pupils follow the mouse. (The overlay still receives mouse moves while it lets clicks pass through.)
  useEffect(() => {
    const m = { x: 0, y: 0, seen: false };
    const onMove = (e: MouseEvent) => { m.x = e.clientX; m.y = e.clientY; m.seen = true; };
    window.addEventListener('mousemove', onMove);
    const t = window.setInterval(() => {
      const el = wrapRef.current;
      if (!m.seen || !el) return;
      const r = el.getBoundingClientRect(), k = r.width / 100; // px per SVG unit
      const dx = m.x - (r.left + 50 * k), dy = m.y - (r.top + 48 * k); // from the middle of the eyes to the mouse
      const dist = Math.hypot(dx, dy), f = Math.min(1, dist / 160); // looks all the way once the mouse is ~160px away
      const ox = dist > 1 ? (dx / dist) * f * S.current.facing * 2.6 : 0; // facing flips the whole pet
      const oy = dist > 1 ? (dy / dist) * f * 4.2 : 0;
      el.querySelectorAll<SVGGElement>('.pupil').forEach((p) => { p.style.transform = `translate(${ox.toFixed(2)}px, ${oy.toFixed(2)}px)`; });
    }, 40);
    return () => { window.removeEventListener('mousemove', onMove); window.clearInterval(t); };
  }, []);
}
