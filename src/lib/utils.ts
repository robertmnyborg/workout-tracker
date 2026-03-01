import { startOfWeek, endOfWeek, format, parseISO } from "date-fns";

export function getCurrentWeekRange() {
  const now = new Date();
  return {
    start: startOfWeek(now, { weekStartsOn: 1 }),
    end: endOfWeek(now, { weekStartsOn: 1 }),
  };
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d, yyyy");
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "h:mm a");
}

export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Parse target reps from exercise rep string.
 * "8-10" → 10, "6" → 6, "45 seconds" → null (time-based)
 */
export function parseTargetReps(reps: string): number | null {
  const cleaned = reps.trim().toLowerCase();
  if (cleaned.includes("second") || cleaned.includes("sec") || cleaned.includes("min")) {
    return null;
  }
  const rangeMatch = cleaned.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (rangeMatch) {
    return parseInt(rangeMatch[2]);
  }
  const singleMatch = cleaned.match(/^(\d+)$/);
  if (singleMatch) {
    return parseInt(singleMatch[1]);
  }
  return null;
}

/**
 * Round a weight to the nearest increment (default 2.5 lbs).
 */
export function roundToNearest(value: number, increment: number = 2.5): number {
  return Math.round(value / increment) * increment;
}
