let ctx: AudioContext | null = null;

/** A quick triple beep. Call it on an interval to make an alarm ring. */
export function beep() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const c = ctx;
    const t0 = c.currentTime;
    [0, 0.18, 0.36].forEach((off) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "square";
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, t0 + off);
      g.gain.exponentialRampToValueAtTime(0.12, t0 + off + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + off + 0.14);
      o.connect(g).connect(c.destination);
      o.start(t0 + off);
      o.stop(t0 + off + 0.15);
    });
  } catch {
    /* no audio available: the bubble and notification still show */
  }
}
