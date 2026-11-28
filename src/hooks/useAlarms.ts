import { useEffect, useRef, useState } from "react";
import { hhmm, minuteKey, readAlarms, saveAlarms } from "../alarms";
import type { Alarm } from "../alarms";

/** The alarm list, saved on this computer and synced between the pet window and the control panel. */
export function useAlarms() {
  const [list, setList] = useState<Alarm[]>(readAlarms);
  useEffect(() => {
    const h = (e: StorageEvent) => {
      if (e.key === "alarms") setList(readAlarms());
    };
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  }, []);

  const commit = (l: Alarm[]) => {
    const sorted = [...l].sort((a, b) => a.time.localeCompare(b.time));
    setList(sorted);
    saveAlarms(sorted);
  };
  const add = (time: string, label: string, days: number[]) =>
    commit([
      ...readAlarms(),
      { id: Date.now(), time, label, days, on: true, last: "" },
    ]);
  const toggle = (id: number) =>
    commit(readAlarms().map((a) => (a.id === id ? { ...a, on: !a.on } : a)));
  const remove = (id: number) =>
    commit(readAlarms().filter((a) => a.id !== id));

  return { list, add, toggle, remove };
}

/** Pet window only. Every second, rings any alarm whose time is now. One-off alarms switch themselves off afterwards. */
export function useAlarmClock(onRing: (a: Alarm) => void) {
  const cb = useRef(onRing);
  cb.current = onRing;
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const t = hhmm(now);
      const key = minuteKey(now);
      const all = readAlarms();
      const due = all.filter(
        (a) =>
          a.on &&
          a.time === t &&
          a.last !== key &&
          (a.days.length === 0 || a.days.includes(now.getDay())),
      );
      if (!due.length) return;
      saveAlarms(
        all.map((a) =>
          due.includes(a) ? { ...a, last: key, on: a.days.length > 0 } : a,
        ),
      );
      due.forEach((a) => cb.current(a));
    };
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, []);
}
