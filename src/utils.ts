import type { Rect } from './types';

export const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** The rectangle spanned by a start point and the current pointer position. */
export const rectFrom = (a: { x: number; y: number }, x: number, y: number): Rect => ({
  x: Math.min(a.x, x), y: Math.min(a.y, y), w: Math.abs(x - a.x), h: Math.abs(y - a.y),
});
