// Unified exercise corpus. One record per distinct movement, across every source
// (BAT alignment, PT routines, trainer lifting/jump program, YouTube coaching).
// `npm run corpus:check` validates every file in corpus/library and corpus/programs.

export const CATEGORIES = [
  "assessment", // self-tests, measurement only
  "breathing",
  "alignment", // BAT-style posture / structural reset
  "mobility",
  "stability", // PT motor control, stabilizers
  "strength",
  "power", // explosive lifts, med-ball, Olympic derivatives
  "plyometric", // jumps, bounds, reactive
  "conditioning",
  "skill", // jump technique, approach mechanics
] as const;

export const BODY_AREAS = [
  "neck", "thoracic", "ribs", "shoulder", "elbow-wrist", "lumbar",
  "pelvis-hip", "knee", "ankle-foot", "core", "full-body",
] as const;

export const GOALS = [
  "posture", "mobility", "stability", "strength", "power", "jump",
  "conditioning", "recovery", "pain-relief",
] as const;

export const SOURCE_KINDS = ["bat", "pt", "trainer", "youtube"] as const;

export type Category = (typeof CATEGORIES)[number];
export type BodyArea = (typeof BODY_AREAS)[number];
export type Goal = (typeof GOALS)[number];

export interface Dose {
  sets?: number;
  reps?: string; // "8-10", "15 each side", "45 seconds"
  holdSeconds?: number;
  durationMin?: number;
  frequency?: string; // "2x daily", "3x weekly"
}

export interface CorpusExercise {
  id: string; // kebab-case, unique across the whole corpus
  name: string;
  aliases: string[];
  source: { kind: (typeof SOURCE_KINDS)[number]; ref: string }; // ref = file path or URL
  category: Category;
  bodyAreas: BodyArea[];
  goals: Goal[];
  equipment: string[]; // [] = none
  position?: string; // supine, standing, quadruped, wall...
  setup: string;
  execution: string;
  cues: string[];
  errors: string[];
  why?: string;
  defaultDose: Dose;
  intensity: 1 | 2 | 3 | 4 | 5; // systemic stress: 1 = breathing, 5 = max-effort jumps/lifts
  impact: "none" | "low" | "high";
  progression: {
    method: "load" | "reps" | "hold" | "complexity" | "none";
    easier?: string; // exercise id
    harder?: string; // exercise id
  };
  contraindications: string[];
  videoUrl?: string;
}

export interface ProgramFile {
  id: string;
  name: string;
  description: string;
  source: { kind: (typeof SOURCE_KINDS)[number]; ref: string };
  days: {
    dayNumber: number;
    name: string;
    focus?: string;
    minutes?: number;
    items: { exerciseId: string; dose: Dose; notes?: string }[];
  }[];
}
