// Standing limits from the onboarding answers: how much jumping a session may hold and which
// drills are unlocked. Pure. Sources are in corpus/principles/yt-jump.md.
import type { BodyArea, Dose } from "../../../corpus/schema";
import type { Rule } from "./recovery";

export const PLYO_AGES = ["none", "lt2m", "2to6m", "6to12m", "1y+"] as const;
export const LIFT_AGES = ["none", "lt6m", "6mto2y", "2y+"] as const;
export type PlyoAge = (typeof PLYO_AGES)[number];
export type LiftAge = (typeof LIFT_AGES)[number];

export interface Athlete {
  plyoAge: PlyoAge;
  liftAge: LiftAge;
  standingVert: number | null; // inches
  approachVert: number | null;
  sport: string | null; // "basketball"
  sportPerWeek: number; // sessions
  sportJumping: boolean;
  tendonHistory: BodyArea[];
  sessionMinutes: number;
}

export type Level = "beginner" | "intermediate" | "advanced";

export interface AthleteLimits {
  level: Level;
  contactCap: number; // foot contacts per session
  highCap: number; // of which high-intensity
  depthUnlocked: boolean;
  noFastLifting: boolean;
  mechanicsFirst: boolean;
  primerAreas: BodyArea[]; // tendon history: isometric primer before jumping
  rules: Rule[];
}

// CSCS 5th edition per-session contacts by plyo training age (TMS, zLXua2DzQ1o @ 1:39-3:20, 4:44, 9:07).
const CAPS: Record<Level, { total: number; high: number }> = {
  beginner: { total: 100, high: 0 },
  intermediate: { total: 120, high: 20 },
  advanced: { total: 150, high: 30 },
};

const level = (a: PlyoAge): Level =>
  a === "none" || a === "lt2m" ? "beginner" : a === "1y+" ? "advanced" : "intermediate";

const TENDON_AREAS: BodyArea[] = ["knee", "ankle-foot"];

export function athleteLimits(a: Athlete): AthleteLimits {
  const lv = level(a.plyoAge);
  const cap = CAPS[lv];
  const rules: Rule[] = [{
    text: `Jump training age ${lv}: at most ${cap.total} foot contacts a session, ${cap.high ? `${cap.high} of them high intensity` : "none of them high intensity"}.`,
    source: "TMS, zLXua2DzQ1o @ 1:39-3:20 (CSCS 5th ed.; yt-jump rule 2)",
  }];

  // Depth jumps are level 4: after 6+ months of plyos and a strength base (TMS, _YudFDcW_Iw @ 2:44; 1CFAZfxEkoQ @ 7:04).
  const depthUnlocked = PLYO_AGES.indexOf(a.plyoAge) >= PLYO_AGES.indexOf("6to12m") && LIFT_AGES.indexOf(a.liftAge) >= LIFT_AGES.indexOf("6mto2y");
  if (!depthUnlocked) rules.push({
    text: "Depth jumps stay locked until 6+ months of jump training and 6+ months of lifting.",
    source: "TMS, _YudFDcW_Iw @ 2:44 and 1CFAZfxEkoQ @ 7:04 (yt-jump rule 4)",
  });

  // Jerk budget: heavy court volume is the high bucket; a tendon history means only one bucket runs high.
  const court = a.sportJumping ? a.sportPerWeek : 0;
  const noFastLifting = court >= 3 || (court >= 2 && a.tendonHistory.some((b) => TENDON_AREAS.includes(b)));
  if (noFastLifting) rules.push({
    text: `${a.sport ?? "Sport"} ${a.sportPerWeek}x a week fills the fast-loading budget: no fast lifts (swings, contrast circuits); trap bar jumps to a box are fine.`,
    source: "PJF, mNbpZ9-7XM0 @ 2:50-5:18 and AR1JI0RFsbQ @ 3:36 (yt-jump rule 3)",
  });

  const gap = a.standingVert != null && a.approachVert != null ? a.approachVert - a.standingVert : null;
  const mechanicsFirst = gap != null && gap < 4;
  if (mechanicsFirst) rules.push({
    text: `Your approach adds ${gap} in over standing; under 4 in points to approach mechanics, so approach drills come first.`,
    source: "PJF, wrF0h4YadvM @ 2:04-2:29 (yt-jump rule 5)",
  });

  const primerAreas = a.tendonHistory.filter((b) => TENDON_AREAS.includes(b));
  if (primerAreas.length) rules.push({
    text: `${primerAreas.join(" and ")} history: an isometric hold (Spanish squat) goes before any jumping.`,
    source: "PJF, 6oBTSuxggLc @ 5:00-6:40 (yt-jump rule 12)",
  });

  return { level: lv, contactCap: cap.total, highCap: cap.high, depthUnlocked, noFastLifting, mechanicsFirst, primerAreas, rules };
}

/** Foot contacts in a dose: sets x top rep count, doubled for "each side/leg". Timed work counts 0. */
export function contacts(d: Dose): number {
  const m = d.reps?.match(/\d+/g);
  if (!m || /s$|sec|min/.test(d.reps!.trim())) return 0;
  const reps = Math.max(...m.slice(0, 2).map(Number));
  return (d.sets ?? 1) * reps * (/each/.test(d.reps!) ? 2 : 1);
}
