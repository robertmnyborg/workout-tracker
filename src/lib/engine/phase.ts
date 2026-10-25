// The 12-week jump block and the weekly jump test. Pure. Phases follow The Movement System's
// program (TMS, 1CFAZfxEkoQ; corpus/principles/yt-jump.md rule 5).
import type { Dose } from "../../../corpus/schema";
import type { Rule } from "./recovery";
import type { LibItem } from "./plan";

export const BLOCK_WEEKS = 12;

export interface Phase {
  week: number; // 1-based week of the block
  phase: 1 | 2 | 3 | null; // null = block finished
  rule: Rule;
}

const SRC = "TMS, 1CFAZfxEkoQ";

/** Week of the block from days since its start (0 = start day). */
export function blockPhase(daysSinceStart: number): Phase {
  const week = Math.floor(daysSinceStart / 7) + 1;
  if (week <= 4) return { week, phase: 1, rule: {
    text: `Jump block week ${week} of 12, phase 1: build muscle. Strength sets of 8-12, loaded jumps (dumbbells at 10-15% of bodyweight), easy plyos.`,
    source: `${SRC} @ 0:28-2:46`,
  } };
  if (week <= 8) return { week, phase: 2, rule: {
    text: `Jump block week ${week} of 12, phase 2: strength sets of 6-8 and harder plyos.`,
    source: `${SRC} @ 5:29-7:19`,
  } };
  if (week <= BLOCK_WEEKS) return { week, phase: 3, rule: {
    text: `Jump block week ${week} of 12, phase 3: the most specific work. Unloaded and band-assisted jumps with short ground contact first; staying here longer than 4 weeks plateaus.`,
    source: `${SRC} @ 7:19-8:38`,
  } };
  return { week, phase: null, rule: {
    text: "The 12-week jump block is done: retest, then start a new block on Progress.",
    source: `${SRC} @ 9:01`,
  } };
}

const STRENGTH_REPS: Partial<Record<1 | 2 | 3, string>> = { 1: "8-12", 2: "6-8" };

/** Phase dose: strength rep ranges for phases 1-2. Holds and timed work keep their dose. */
export function phaseDose(p: Phase | undefined, e: LibItem, d: Dose): Dose {
  const reps = p?.phase && STRENGTH_REPS[p.phase];
  // Only plain rep counts ("5", "8-10", "6 each leg"); timed work, steps and pyramids keep their dose.
  const m = d.reps?.match(/^\d+(?:-\d+)?( each (?:side|leg|arm))?$/);
  if (!reps || e.category !== "strength" || d.holdSeconds || !m) return d;
  return { ...d, reps: reps + (m[1] ?? "") };
}

/** Ranking bonus: what each phase puts first. */
export function phaseBoost(p: Phase | undefined, e: LibItem): number {
  switch (p?.phase) {
    case 1: return e.category === "power" ? 2 : e.category === "plyometric" && e.intensity <= 3 ? 1 : 0;
    case 2: return e.category === "plyometric" && e.intensity >= 4 ? 2 : 0;
    case 3: return (e.category === "plyometric" || e.category === "skill") && e.intensity >= 4 ? 2 : 0;
    default: return 0;
  }
}

/** Test at the start of each week, same warm-up every time (TMS, 1CFAZfxEkoQ @ 7:27; 11uS8bwkfcc @ 1:32). */
export const testDue = (daysSinceLastTest: number | null) => daysSinceLastTest === null || daysSinceLastTest >= 7;
