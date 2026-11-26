export type Alarm = {
  id: number;
  time: string; // "HH:MM", 24h
  label: string;
  days: number[]; // 0 = Sun ... 6 = Sat. Empty = rings once (the next time the clock hits `time`), then turns itself off.
  on: boolean;
  last: string; // the minute it last rang, so it can't ring twice in the same minute
};

const KEY = "alarms";

export const readAlarms = (): Alarm[] => {
  try {
    const a = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(a)) return [];
    return a.filter(
      (x) =>
        x &&
        Number.isFinite(x.id) &&
        typeof x.time === "string" &&
        /^\d{2}:\d{2}$/.test(x.time) &&
        Array.isArray(x.days) &&
        x.days.every(
          (d: unknown) =>
            Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6,
        ),
    );
  } catch {
    return [];
  }
};
export const saveAlarms = (l: Alarm[]) =>
  localStorage.setItem(KEY, JSON.stringify(l));

const pad = (n: number) => String(n).padStart(2, "0");
export const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const minuteKey = (d: Date) =>
  `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${hhmm(d)}`;

export const DAY_ORDER: [number, string][] = [
  [1, "Mon"],
  [2, "Tue"],
  [3, "Wed"],
  [4, "Thu"],
  [5, "Fri"],
  [6, "Sat"],
  [0, "Sun"],
];
export const WEEKDAYS = [1, 2, 3, 4, 5];
export const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

export function fmtDays(days: number[]): string {
  const s = [...days].sort().join();
  if (!days.length) return "Once";
  if (s === [...EVERY_DAY].join()) return "Every day";
  if (s === WEEKDAYS.join()) return "Weekdays";
  if (s === "0,6") return "Weekends";
  return DAY_ORDER.filter(([d]) => days.includes(d))
    .map(([, n]) => n)
    .join(" ");
}
