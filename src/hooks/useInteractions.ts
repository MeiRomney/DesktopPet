import { useEffect } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { nearPose, react as scripted, visit } from "../reactions";
import { APPROACH, FLEE_LINES, SCARY, WEAPONS } from "../constants";
import type { Obj } from "../types";
import { clamp } from "../utils";
import type { PetCore } from "./usePetCore";
import type { Speech } from "./useSpeech";
import type { Movement } from "./useMovement";

/** Mouse interactions: dragging the pet and objects, dropping objects, and how the pet reacts to them. */
export function useInteractions(c: PetCore, speech: Speech, move: Movement) {
  const {
    pos,
    setPos,
    setPose,
    setOpen,
    setObjs,
    setFacing,
    setMoveMs,
    setStride,
    rail,
    afterDrag,
    drag,
    objDrag,
    walkId,
    near,
    lastFlee,
    hovering,
    S,
    sz,
    dims,
    W,
    H,
    wrapRef,
    bounds,
  } = c;
  const { sayLocal, reactTo } = speech;
  const { walkTo, flee } = move;

  const use = (o: Obj) => {
    hovering.current = false;
    setObjs((l) => l.filter((x) => x.id !== o.id));
    window.api.clickThrough(true);
    reactTo(
      scripted(o.emoji, "use"),
      `The user dragged ${o.name} ${o.emoji} onto you and used it on you!`,
      `The user dragged ${o.name} ${o.emoji} onto me and used it on me.`,
    );
  };

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const d = drag.current,
        od = objDrag.current;
      if (d) {
        if (
          !d.moved &&
          Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) > 4
        ) {
          d.moved = true;
          setPose("shocked");
        }
        if (d.moved) setPos({ x: e.clientX - d.dx, y: e.clientY - d.dy });
      } else if (od) {
        if (
          !od.moved &&
          Math.abs(e.clientX - od.sx) + Math.abs(e.clientY - od.sy) > 3
        )
          od.moved = true;
        if (!od.moved) return;
        const nx = e.clientX - od.dx,
          ny = e.clientY - od.dy;
        setObjs((l) =>
          l.map((o) => (o.id === od.id ? { ...o, x: nx, y: ny } : o)),
        );
        const p = S.current.pos;
        const { W, H } = dims();
        const dist = Math.hypot(
          nx + 22 - (p.x + W / 2),
          ny + 22 - (p.y + H / 2),
        );
        const ob = S.current.objs.find((o) => o.id === od.id);
        const emoji = ob?.emoji ?? "";
        if (ob && SCARY.includes(ob.name)) {
          if (dist < 240 * sz.current && Date.now() - lastFlee.current > 500) {
            lastFlee.current = Date.now();
            flee(nx + 22, ny + 22);
            if (near.current !== od.id) {
              near.current = od.id;
              sayLocal(
                "scared",
                FLEE_LINES[Math.floor(Math.random() * FLEE_LINES.length)],
                `The user chased me with ${ob.name} ${emoji}, so I ran away.`,
              );
            }
          } else if (dist >= 240 * sz.current && near.current === od.id)
            near.current = null;
        } else if (dist < 130 * sz.current && near.current !== od.id) {
          near.current = od.id;
          setFacing(nx < p.x ? -1 : 1);
          setPose(nearPose(emoji));
        } else if (dist >= 130 * sz.current && near.current === od.id) {
          near.current = null;
          setPose("neutral");
        }
      }
    };
    const up = () => {
      const { W, H } = dims();
      const d = drag.current,
        od = objDrag.current;
      drag.current = null;
      objDrag.current = null;
      near.current = null;
      if (d) {
        if (d.moved) {
          setPose("neutral");
          if (S.current.stay)
            localStorage.setItem("stayPos", JSON.stringify(S.current.pos));
          if (S.current.zone) {
            // you dragged it out of its zone: it walks back in
            const b = bounds(),
              p = S.current.pos;
            const nx = clamp(p.x, b.minX, b.maxX),
              ny = clamp(p.y, b.minY, b.maxY);
            if (nx !== p.x || ny !== p.y) walkTo(nx, ny);
          } else if (S.current.edges) afterDrag.current?.(); // Edges mode: it hurries to the nearest edge
        } else setOpen((o) => !o);
      } // a click toggles the panel
      if (od && !od.moved) {
        // a plain click on an object makes it disappear
        hovering.current = false;
        setObjs((l) => l.filter((x) => x.id !== od.id));
        window.api.clickThrough(true);
      }
      if (od && od.moved) {
        const o = S.current.objs.find((x) => x.id === od.id),
          p = S.current.pos;
        if (!o) return;
        if (
          Math.hypot(o.x + 22 - (p.x + W / 2), o.y + 22 - (p.y + H / 2)) <
          70 * sz.current
        )
          use(o); // dropped on the pet
        else if (APPROACH.includes(o.name) && !S.current.stay)
          walkTo(o.x - W, o.y + 44 - H, () => {
            reactTo(
              visit(o.emoji),
              `You walked over to ${o.name} ${o.emoji} that the user left on the desktop.`,
              `I walked over to ${o.name} ${o.emoji} that the user left on the desktop.`,
            );
          });
      }
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, []);

  const down = (e: ReactMouseEvent) => {
    const r = wrapRef.current!.getBoundingClientRect(); // grab it where it visually is, mid-walk or not
    walkId.current++;
    rail.current = null;
    setMoveMs(0);
    setStride(false);
    setPos({ x: r.left, y: r.top });
    drag.current = {
      dx: e.clientX - r.left,
      dy: e.clientY - r.top,
      sx: e.clientX,
      sy: e.clientY,
      moved: false,
    };
  };

  const objDown = (e: ReactMouseEvent, o: Obj) => {
    e.stopPropagation();
    objDrag.current = {
      id: o.id,
      dx: e.clientX - o.x,
      dy: e.clientY - o.y,
      sx: e.clientX,
      sy: e.clientY,
      moved: false,
    };
  };

  const spawn = (emoji: string, name: string) => {
    let x = clamp(
      pos.x + (pos.x > window.innerWidth / 2 ? -60 : 80),
      0,
      window.innerWidth - 50,
    );
    let y = pos.y + H - 50;
    if (WEAPONS.includes(name)) {
      // right of the pet, level with its head
      const r = wrapRef.current!.getBoundingClientRect();
      x = clamp(r.left + W + 12, 0, window.innerWidth - 50);
      y = r.top + (45 / 178) * H - 22;
      setFacing(1);
    }
    setObjs((o) => [...o, { id: Date.now(), emoji, name, x, y }]);
    reactTo(
      scripted(emoji, "spawn"),
      `The user placed ${name} ${emoji} next to you.`,
      `The user placed ${name} ${emoji} next to me.`,
    );
  };

  return { down, objDown, spawn };
}
