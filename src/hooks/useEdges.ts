import { useEffect, useRef } from 'react';
import type { EdgeCfg, Rect, WinRect } from '../types';
import { buildRails, nearestRail, pickWeighted, poseAt, railRange, tOf, uOf } from '../edges';
import type { Rail } from '../edges';
import type { PetCore } from './usePetCore';
import type { Movement } from './useMovement';

/**
 * Edges mode: the pet stays on the edges instead of the middle of the screen, so it stays out of the way of whatever
 * you are working on. It always stands upright: it walks along the top of the taskbar, and stands on top of the
 * focused app's window (only where there is free room above it, so it never covers the app).
 * It steps aside completely when a fullscreen app is in front (the window hides in electron/main.cjs).
 */
export function useEdges(c: PetCore, move: Movement, cfg: EdgeCfg) {
  const { S, size, dims, rail, afterDrag, edgeStep, drag, objDrag, hovering } = c;
  const app = useRef<WinRect | null>(null); // the focused app window, kept up to date by the main process
  const wa = useRef<Rect>({ x: 0, y: 0, w: window.innerWidth, h: window.innerHeight }); // screen minus the taskbar
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;

  const refreshArea = async () => { try { wa.current = await window.api.workArea(); } catch { /* keep the last one */ } };
  const world = () => {
    const { W, H } = dims();
    const list = buildRails(wa.current, app.current, W, H, cfgRef.current);
    return { W, H, list, byId: new Map(list.map((r) => [r.id, r])) };
  };

  // Walk to a spot t on a rail. Same rail: a normal walk. A different rail (taskbar <-> window top): a quick scamper.
  const goTo = (r: Rail, t: number, speed: number) => {
    const { W, H } = dims();
    const p = poseAt(r, t, W, H);
    rail.current = { id: r.id, u: uOf(r, p.t, W) };
    move.glide(p.x, p.y, { speed });
  };

  // Pick an edge (favoring the taskbar) and a spot on it, then walk there.
  const wander = async () => {
    await refreshArea();
    if (drag.current || objDrag.current || hovering.current || S.current.open) return;
    const { W, list } = world();
    const target = pickWeighted(list);
    const [lo, hi] = railRange(target, W);
    let t = lo + Math.random() * (hi - lo);
    const cur = rail.current;
    if (cur && cur.id === target.id) { // same edge: make it a proper stroll, not a shuffle
      const here = tOf(target, cur.u, W);
      if (Math.abs(t - here) < 90) t = Math.min(hi, Math.max(lo, here + (Math.random() < 0.5 ? -1 : 1) * (150 + Math.random() * 250)));
    }
    goTo(target, t, cur && cur.id === target.id ? 85 : 200);
  };

  // Go to the closest edge. Used when Edges mode turns on, after the size changes, and after you drop the pet.
  const snap = async () => {
    await refreshArea();
    const { W, H, list } = world();
    const p = S.current.pos;
    const { rail: r, t } = nearestRail(list, p.x + W / 2, p.y + H / 2, W, H);
    goTo(r, t, 260);
  };

  // The pet is standing on the app and the app moved, resized, or lost focus: stay on it, or drop back to the taskbar.
  const follow = () => {
    const cur = rail.current;
    if (!cur || cur.id !== 'appTop' || drag.current || objDrag.current) return;
    const { W, H, byId } = world();
    const r = byId.get(cur.id);
    if (!r) { snap(); return; }
    const p = poseAt(r, tOf(r, cur.u, W), W, H);
    move.glide(p.x, p.y, { speed: 500 });
  };

  // Follow the focused window while Edges mode is on.
  useEffect(() => {
    if (!cfg.on) return;
    window.api.trackWindows(true);
    const off = window.api.onActiveWindow((w) => { app.current = w; follow(); });
    return () => { off(); window.api.trackWindows(false); app.current = null; };
  }, [cfg.on]);

  // Turn on / change what counts as an edge / change size: (re)settle on an edge.
  useEffect(() => {
    edgeStep.current = cfg.on ? wander : null;
    afterDrag.current = cfg.on ? snap : null;
    if (cfg.on) snap();
    else rail.current = null;
  }, [cfg.on, cfg.screen, cfg.apps, size]);
}
