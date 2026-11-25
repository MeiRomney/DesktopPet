import { useEffect, useRef, useState } from "react";
import { nextAt, readReminders, saveReminders } from "../reminders";
import type { Reminder, Repeat } from "../reminders";

/** The reminder list, saved on this computer and synced between the pet window and the control panel. */
export function useReminders() {
  const [list, setList] = useState<Reminder[]>(readReminders);
  useEffect(() => {
    const h = (e: StorageEvent) => {
      if (e.key === "reminders") setList(readReminders());
    };
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  }, []);

  const commit = (l: Reminder[]) => {
    const sorted = [...l].sort((a, b) => a.at - b.at);
    setList(sorted);
    saveReminders(sorted);
  };
  const add = (text: string, at: number, repeat: Repeat) =>
    commit([...readReminders(), { id: Date.now(), text, at, repeat }]);
  const remove = (id: number) =>
    commit(readReminders().filter((r) => r.id !== id));

  return { list, add, remove };
}

/** Pet window only: checks every second and fires what is due. One-off reminders are removed, repeating ones move to their next time.
 *  Reminders that came due while the app was closed fire once on start (late = true). */
export function useReminderAlarm(onFire: (r: Reminder, late: boolean) => void) {
  const cb = useRef(onFire);
  cb.current = onFire;
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const all = readReminders();
      const due = all.filter((r) => r.at <= now);
      if (!due.length) return;
      const rest = all.filter((r) => r.at > now);
      for (const r of due) {
        const n = nextAt(r, now);
        if (n) rest.push({ ...r, at: n });
      }
      saveReminders(rest);
      // several at once: space them out so each bubble can be read
      due.forEach((r, i) =>
        window.setTimeout(() => cb.current(r, now - r.at > 60_000), i * 6000),
      );
    };
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, []);
}
