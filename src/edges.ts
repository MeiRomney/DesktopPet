import type { Rect, WinRect } from './types';
import { clamp } from './utils';

/**
 * Edges mode geometry. The pet always stands upright, so it only ever walks on "rails": horizontal lines it can
 * put its feet on (the top of the taskbar, the top edge of the focused app window).
 * `fixed` is the y of the surface the feet touch; `a`..`b` is how far along x it runs.
 */
export type Rail = { id: string; fixed: number; a: number; b: number; weight: number };

const GAP = 2;
const BUBBLE_ROOM = 56; // free space above the pet for its speech bubble when it stands on a window

/** All the places the pet may stand right now. `wa` is the screen minus the taskbar; `app` is the focused window. */
export function buildRails(wa: Rect, app: WinRect | null, W: number, H: number, cfg: { screen: boolean; apps: boolean }): Rail[] {
  const rails: Rail[] = [];
  const bottom = wa.y + wa.h, right = wa.x + wa.w;

  if (cfg.apps && app && !app.fullscreen) {
    const x0 = Math.max(app.x, wa.x), x1 = Math.min(app.x + app.w, right);
    // Stands ON the window's top edge, so it needs a whole pet-height of free room above the window. It never covers the app.
    if (app.y - wa.y >= H + BUBBLE_ROOM + GAP && x1 - x0 >= W) rails.push({ id: 'appTop', fixed: app.y, a: x0, b: x1, weight: 3 });
  }
  if (cfg.screen || rails.length === 0) { // there is always somewhere to stand
    rails.push({ id: 'floor', fixed: bottom, a: wa.x, b: right, weight: 5 }); // on top of the taskbar
  }
  return rails;
}

/** Where the pet's center may be along a rail (it keeps its whole body on the rail). */
export const railRange = (r: Rail, W: number): [number, number] => {
  const lo = r.a + W / 2;
  return [lo, Math.max(lo, r.b - W / 2)];
};
export const tOf = (r: Rail, u: number, W: number) => { const [lo, hi] = railRange(r, W); return lo + u * (hi - lo); }; // u: 0..1 along the rail
export const uOf = (r: Rail, t: number, W: number) => { const [lo, hi] = railRange(r, W); return hi > lo ? clamp((t - lo) / (hi - lo), 0, 1) : 0.5; };

/** The pet's top-left corner when its center is at position t on a rail, feet on the surface. */
export function poseAt(r: Rail, t: number, W: number, H: number) {
  const s = clamp(t, ...railRange(r, W));
  return { x: s - W / 2, y: r.fixed - H, t: s };
}

export function pickWeighted(rails: Rail[]): Rail {
  let n = Math.random() * rails.reduce((a, r) => a + r.weight, 0);
  for (const r of rails) { n -= r.weight; if (n <= 0) return r; }
  return rails[rails.length - 1];
}

/** The rail closest to a point (the pet's center), used to snap it back to an edge after you drop it. */
export function nearestRail(rails: Rail[], cx: number, cy: number, W: number, H: number): { rail: Rail; t: number } {
  let best = { rail: rails[0], t: cx }, bestD = Infinity;
  for (const r of rails) {
    const p = poseAt(r, cx, W, H);
    const d = Math.hypot(p.x + W / 2 - cx, p.y + H / 2 - cy);
    if (d < bestD) { bestD = d; best = { rail: r, t: p.t }; }
  }
  return best;
}
