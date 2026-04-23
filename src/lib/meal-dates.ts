import { startOfDay, endOfDay } from "date-fns";

/**
 * Parse a YYYY-MM-DD string as a LOCAL date (midnight in local tz).
 * Fallback to current local midnight if input missing.
 *
 * Why: `new Date("2026-04-22")` parses as UTC midnight, which in negative-offset
 * timezones (e.g. US Pacific) maps to the PREVIOUS calendar day locally. We
 * want the date string to represent the calendar day the user picked, not a
 * UTC moment.
 */
export function parseLocalDate(ymd?: string | null): Date {
  if (!ymd) return startOfDay(new Date());
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd);
  if (!m) return startOfDay(new Date(ymd));
  const [, y, mo, d] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d));
}

export function dayRange(ymd?: string | null) {
  const d = parseLocalDate(ymd);
  return { gte: startOfDay(d), lte: endOfDay(d) };
}
