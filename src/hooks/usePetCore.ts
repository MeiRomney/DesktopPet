import { useRef, useState } from "react";
import type { Pose } from "../reactions";
import type { Obj, Rect } from "../types";
import { BASE_H, BASE_W } from "../constants";
import { useSize } from "./useSize";

/** The pet's position, pose and size, plus the refs and helpers every other hook shares. */
export function usePetCore(activeZone: Rect | null, edgesOn: boolean) {
  const [pos, setPos] = useState({
    x: window.innerWidth - 240,
    y: window.innerHeight - 380,
  });
  const [pose, setPose] = useState<Pose>("neutral");
  const [open, setOpen] = useState(false);
  const [objs, setObjs] = useState<Obj[]>([]);
  const [facing, setFacing] = useState<1 | -1>(1);
  const [moveMs, setMoveMs] = useState(0); // >0 while walking by itself
  const [stride, setStride] = useState(false); // leg animation on; ends at a stride boundary

  const { size, changeSize } = useSize();
  const sz = useRef(size);
  sz.current = size;
  const dims = () => ({ W: BASE_W * sz.current, H: BASE_H * sz.current }); // always current, even in old closures
  const W = BASE_W * size,
    H = BASE_H * size;

  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    dx: number;
    dy: number;
    sx: number;
    sy: number;
    moved: boolean;
  } | null>(null);
  const objDrag = useRef<{
    id: number;
    dx: number;
    dy: number;
    sx: number;
    sy: number;
    moved: boolean;
  } | null>(null);
  const walkId = useRef(0);
  const near = useRef<number | null>(null);
  const lastFlee = useRef(0);
  const hovering = useRef(false);
  const busy = useRef(false);
  const rail = useRef<{ id: string; u: number } | null>(null); // the edge it stands on, and how far along (0..1); null = off the edges
  const afterDrag = useRef<(() => void) | null>(null); // Edges mode: called after you drop the pet
  const edgeStep = useRef<(() => void) | null>(null); // Edges mode: picks the next place to walk to
  const S = useRef({
    pos,
    open,
    objs,
    moveMs,
    zone: activeZone,
    facing,
    edges: edgesOn,
  });
  S.current = {
    pos,
    open,
    objs,
    moveMs,
    zone: activeZone,
    facing,
    edges: edgesOn,
  };

  // Where the pet may stand (its top-left corner): inside the zone if one is on, otherwise anywhere on screen.
  const bounds = () => {
    const { W, H } = dims();
    const z = S.current.zone;
    if (!z)
      return {
        minX: 0,
        minY: 40,
        maxX: window.innerWidth - W,
        maxY: window.innerHeight - H - 8,
      };
    const minX = z.w >= W ? z.x : z.x + (z.w - W) / 2,
      minY = z.h >= H ? z.y : z.y + (z.h - H) / 2;
    return {
      minX,
      minY,
      maxX: z.w >= W ? z.x + z.w - W : minX,
      maxY: z.h >= H ? z.y + z.h - H : minY,
    };
  };

  // Let clicks through everywhere except over the pet, its panel and objects.
  const hover = {
    onMouseEnter: () => {
      hovering.current = true;
      window.api.clickThrough(false);
    },
    onMouseLeave: () => {
      hovering.current = false;
      if (!drag.current && !objDrag.current) window.api.clickThrough(true);
    },
  };

  return {
    pos,
    setPos,
    pose,
    setPose,
    open,
    setOpen,
    objs,
    setObjs,
    facing,
    setFacing,
    moveMs,
    setMoveMs,
    stride,
    setStride,
    rail,
    afterDrag,
    edgeStep,
    size,
    changeSize,
    sz,
    dims,
    W,
    H,
    wrapRef,
    drag,
    objDrag,
    walkId,
    near,
    lastFlee,
    hovering,
    busy,
    S,
    bounds,
    hover,
  };
}
export type PetCore = ReturnType<typeof usePetCore>;
