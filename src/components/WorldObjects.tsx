import type { MouseEvent as ReactMouseEvent } from 'react';
import type { Obj } from '../types';

type Hover = { onMouseEnter(): void; onMouseLeave(): void };

/** The emoji objects lying on the desktop. Click to remove, drag to move. */
export function WorldObjects({ objs, hover, onDown }: { objs: Obj[]; hover: Hover; onDown(e: ReactMouseEvent, o: Obj): void }) {
  return (
    <>
      {objs.map((o) => (
        <div key={o.id} className="obj" title="Click to remove, drag to move" style={{ left: o.x, top: o.y }} onMouseDown={(e) => onDown(e, o)} {...hover}>{o.emoji}</div>
      ))}
    </>
  );
}
