import { getUserNow } from "./utils";

/** "2026-10-24" -> UTC midnight of that calendar date (timezone-free storage). */
export function ymdToUtc(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** The user's (Pacific) calendar date as YYYY-MM-DD. */
export function userTodayYmd(): string {
  const n = getUserNow();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

/** Day number in a day-sequenced program: 0 on the start date. */
export function programDayNumber(startDate: Date, todayYmd = userTodayYmd()): number {
  return Math.round((ymdToUtc(todayYmd).getTime() - startDate.getTime()) / 86_400_000);
}
