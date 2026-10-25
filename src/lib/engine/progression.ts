// Per-exercise progression from logged history. Pure function; the API feeds it SetLogs.
import { parseTargetReps, roundToNearest } from "../utils";

export type Method = "load" | "reps" | "hold" | "complexity" | "none";

export interface PastSession {
  date: string; // ISO
  sets: { weight: number | null; reps: number | null; completed: boolean }[];
  targetSets: number;
  targetReps: string; // "8-10", "15", "45 seconds"
}

export interface Next {
  sets: number;
  reps: string;
  weight: number | null;
  holdSeconds?: number;
  swapTo?: string; // exercise id (complexity method)
  reason: string;
}

/** Did the session hit every prescribed set at the top of the rep target? */
export function hitTarget(s: PastSession): boolean {
  const done = s.sets.filter((x) => x.completed);
  const top = parseTargetReps(s.targetReps);
  return done.length >= s.targetSets && (top === null || done.every((x) => (x.reps ?? 0) >= top));
}

const topWeight = (s: PastSession) =>
  Math.max(0, ...s.sets.filter((x) => x.completed && x.weight !== null).map((x) => x.weight as number)) || null;

/**
 * history: newest first. readiness: 1-5 from today's check-in.
 * Rules: hit target -> progress; missed twice in a row or readiness <= 2 -> deload 10%; else repeat.
 */
export function nextDose(
  method: Method,
  base: { sets: number; reps: string; holdSeconds?: number },
  history: PastSession[],
  readiness: number,
  links: { easier?: string; harder?: string } = {}
): Next {
  const repeat = (reason: string, weight: number | null = null): Next =>
    ({ sets: base.sets, reps: base.reps, weight, holdSeconds: base.holdSeconds, reason });
  const last = history[0];
  if (!last) return repeat("First time: start at the prescribed dose.");

  const w = topWeight(last);
  const missedTwice = history.length >= 2 && !hitTarget(history[0]) && !hitTarget(history[1]);

  // A stall (two non-improving sessions while trying) earns a real deload: RP halves sets and drops load
  // (corpus/principles/yt-programming.md). A bad day only scales today's session.
  if (missedTwice) {
    const why = "Stalled two sessions running";
    if (method === "complexity" && links.easier)
      return { ...repeat(`${why}: regress to the easier variation.`), swapTo: links.easier };
    const sets = Math.max(1, Math.ceil(base.sets / 2));
    return { ...repeat(`${why}: deload, half the sets${w ? ", 10% lighter" : ""}.`, w ? roundToNearest(w * 0.9) : w), sets };
  }
  if (readiness <= 2) {
    const why = `Readiness ${readiness}/5, today only`;
    if (method === "complexity" && links.easier)
      return { ...repeat(`${why}: use the easier variation.`), swapTo: links.easier };
    if (method === "load" && w) return repeat(`${why}: 10% lighter.`, roundToNearest(w * 0.9));
    return { ...repeat(`${why}: one set fewer.`, w), sets: Math.max(1, base.sets - 1) };
  }

  if (!hitTarget(last)) return repeat("Target not hit last time: repeat the dose.", w);

  switch (method) {
    case "load": {
      if (!w) return repeat("Hit target. Log a weight to start load progression.");
      // +5%, but at least 2.5 lb and at most 10 lb: 5% of a 300 lb squat is a 15 lb jump, too big a step.
      const up = Math.min(Math.max(roundToNearest(w * 1.05), w + 2.5), w + 10);
      return repeat(`Hit every set last time: +${up - w} lb.`, up);
    }
    case "reps": {
      const top = parseTargetReps(base.reps);
      return top === null
        ? repeat("Hit target: repeat.", w)
        : { ...repeat(`Hit target: +2 reps.`, w), reps: String(top + 2) };
    }
    case "hold": {
      const h = (base.holdSeconds ?? 20) + 5;
      return { ...repeat("Hit target: +5 s hold.", w), holdSeconds: h };
    }
    case "complexity": {
      const streak = history.slice(0, 3).filter(hitTarget).length;
      if (streak === 3 && links.harder)
        return { ...repeat("Three clean sessions: progress to the harder variation."), swapTo: links.harder };
      return repeat(`Clean session ${streak}/3 before progressing.`, w);
    }
    default:
      return repeat("Maintenance movement: same dose.", w);
  }
}
