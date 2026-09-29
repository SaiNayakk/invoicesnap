/**
 * Invoice dates are calendar dates (YYYY-MM-DD) in India time. All day maths
 * goes through here so "overdue" means the same thing on the server (UTC) and
 * in the browser.
 */

const IST_OFFSET_MS = 330 * 60_000;
const DAY = 86_400_000;

/** Today's date in India, or the date of `at`. */
export function todayIST(at: Date | number = Date.now()): string {
  return new Date(+at + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export function addDays(d: string, n: number): string {
  return new Date(Date.parse(`${d}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
}

/** Whole days from a to b (b later = positive). Accepts dates or ISO timestamps. */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${dateOf(b)}T00:00:00Z`) - Date.parse(`${dateOf(a)}T00:00:00Z`)) / DAY);
}

/** YYYY-MM-DD of a date or timestamp, in India time. */
export function dateOf(v: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const t = Date.parse(v.includes("T") || v.endsWith("Z") ? v : v.replace(" ", "T") + "Z");
  return Number.isNaN(t) ? v.slice(0, 10) : todayIST(t);
}

export function formatDay(d: string, withYear = false): string {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}), timeZone: "UTC" })
    .format(new Date(`${dateOf(d)}T00:00:00Z`));
}

/** Indian financial year label and bounds for a date: 2026-09-28 -> FY 2026-27. */
export function financialYear(d: string) {
  const y = Number(d.slice(0, 4));
  const start = Number(d.slice(5, 7)) >= 4 ? y : y - 1;
  return { label: `${start}-${String(start + 1).slice(2)}`, start: `${start}-04-01`, end: `${start + 1}-03-31` };
}
