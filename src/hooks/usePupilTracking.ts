import { useEffect, useRef } from "react";
import type { Eyes } from "../types";
import type { PetCore } from "./usePetCore";

export function usePupilTracking(c: PetCore, eyes: Eyes) {
  const { wrapRef, S } = c;
  const cfg = useRef(eyes);
  cfg.current = eyes;

  // The pupils follow the mouse (unless you turned that off). The overlay still receives mouse moves while it lets clicks pass through.
  useEffect(() => {
    const m = { x: 0, y: 0, seen: false };
    const onMove = (e: MouseEvent) => {
      m.x = e.clientX;
      m.y = e.clientY;
      m.seen = true;
    };
    window.addEventListener("mousemove", onMove);
    const t = window.setInterval(() => {
      const el = wrapRef.current;
      if (!el) return;
      const pupils = el.querySelectorAll<SVGGElement>(".pupil");
      if (!cfg.current.track) {
        pupils.forEach((p) => {
          p.style.transform = "";
        });
        return;
      } // back to the default sideways glance
      if (!m.seen) return;
      const r = el.getBoundingClientRect(),
        k = r.width / 100; // px per SVG unit
      const dx = m.x - (r.left + 50 * k),
        dy = m.y - (r.top + 48 * k); // from the middle of the eyes to the mouse
      const dist = Math.hypot(dx, dy),
        f = Math.min(1, dist / 160); // looks all the way once the mouse is ~160px away
      const e = Math.max(cfg.current.size, 0.7); // bigger eyes give the pupils more room to move
      const ox = dist > 1 ? (dx / dist) * f * S.current.facing * 2.6 * e : 0; // facing flips the whole pet
      const oy = dist > 1 ? (dy / dist) * f * 4.2 * e : 0;
      pupils.forEach((p) => {
        p.style.transform = `translate(${ox.toFixed(2)}px, ${oy.toFixed(2)}px)`;
      });
    }, 40);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.clearInterval(t);
    };
  }, []);
}
