export type Repeat = "none" | "daily" | "weekly";
export type Reminder = { id: number; text: string; at: number; repeat: Repeat };

const KEY = "reminders";

export const readReminders = (): Reminder[] => {
  try {
    const a = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(a)) return [];
    return a.filter(
      (r) =>
        r &&
        typeof r.text === "string" &&
        Number.isFinite(r.at) &&
        Number.isFinite(r.id) &&
        ["none", "daily", "weekly"].includes(r.repeat),
    );
  } catch {
    return [];
  }
};

export const saveReminders = (l: Reminder[]) =>
  localStorage.setItem(KEY, JSON.stringify(l));

/** The next time a repeating reminder fires after `now` (null for one-off reminders). Uses calendar days, so DST doesn't shift it. */
export function nextAt(r: Reminder, now: number): number | null {
  if (r.repeat === "none") return null;
  const d = new Date(r.at);
  const step = r.repeat === "daily" ? 1 : 7;
  while (d.getTime() <= now) d.setDate(d.getDate() + step);
  return d.getTime();
}
