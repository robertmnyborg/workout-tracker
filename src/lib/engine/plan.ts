// Deterministic session builder. Same check-in + library + history => same plan.
// The AI layer only produces a CheckIn; it never picks exercises or loads.
import type { BodyArea, CorpusExercise, Dose, Goal } from "../../../corpus/schema";
import { hardJump, LOADING, region, type OutsideActivity, type Recovery, type Rule } from "./recovery";

export interface CheckIn {
  energy: number; // 1-5
  soreness: number; // 1-5 (5 = very sore)
  sleep?: number; // 1-5
  painAreas: BodyArea[];
  focus: Goal[];
  minutes: number;
  outsideActivity?: OutsideActivity[]; // sport or cardio already done today
  override?: boolean; // user insists despite recovery rules: they become warnings
}

export interface PlanItem {
  exerciseId: string;
  name: string;
  dose: Dose;
  minutes: number;
  why: string;
}

export interface PlanBlock {
  name: "Alignment" | "Prep" | "Main" | "Finisher";
  items: PlanItem[];
}

export interface Plan {
  readiness: number;
  maxIntensity: number;
  allowHighImpact: boolean;
  minutes: number;
  blocks: PlanBlock[];
  notes: string[];
  rules: Rule[]; // recovery rules that shaped (or, on override, would have shaped) today
}

export type LibItem = Pick<
  CorpusExercise,
  "id" | "name" | "category" | "bodyAreas" | "goals" | "intensity" | "impact" | "defaultDose" | "source"
>;

/** Bad days pull everything down; any pain costs one point. */
export function readiness(c: CheckIn): number {
  const sleep = c.sleep ?? c.energy;
  const base = Math.round((c.energy + (6 - c.soreness) + sleep) / 3);
  return Math.max(1, Math.min(5, base - (c.painAreas.length ? 1 : 0)));
}

const MAX_INTENSITY: Record<number, number> = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 5 };
const IMPACT_SENSITIVE: BodyArea[] = ["knee", "ankle-foot", "lumbar", "pelvis-hip"];
// Low-intensity categories allowed on a painful area (PT prescribes stability work for lumbar pain).
const GENTLE = new Set(["breathing", "alignment", "mobility", "stability"]);

/** Minutes an exercise takes at a dose, including rest. */
export function estimateMinutes(e: LibItem, d: Dose): number {
  if (d.durationMin) return d.durationMin;
  const sets = d.sets ?? 1;
  const perSet = e.intensity >= 4 ? 2.5 : e.intensity === 3 ? 2 : 1;
  return Math.max(1, Math.round(sets * perSet + (d.holdSeconds ?? 0) * sets / 60));
}

function safe(e: LibItem, c: CheckIn, maxIntensity: number, allowHighImpact: boolean): boolean {
  if (e.category === "assessment") return false;
  if (e.intensity > maxIntensity) return false;
  if (e.impact === "high" && !allowHighImpact) return false;
  const hurts = e.bodyAreas.some((b) => c.painAreas.includes(b));
  // A painful area still gets gentle work (that is the PT/BAT point), never loading.
  return !hurts || (GENTLE.has(e.category) && e.intensity <= 2) || tendonIso(e);
}

// Isometric/slow tendon loading for a painful joint (Spanish squat holds for a cranky knee):
// PJF, 6oBTSuxggLc @ 5:00-9:55 and AR1JI0RFsbQ @ 4:00 (yt-jump rule 12).
const tendonIso = (e: LibItem) =>
  e.category === "strength" && e.impact === "none" && e.intensity <= 3 && e.goals.includes("pain-relief");

const SOURCE_RANK: Record<string, number> = { bat: 0, pt: 1, trainer: 2, youtube: 3 };

function rank(pool: LibItem[], score: (e: LibItem) => number): LibItem[] {
  return [...pool].sort(
    (a, b) =>
      score(b) - score(a) ||
      SOURCE_RANK[a.source.kind] - SOURCE_RANK[b.source.kind] ||
      a.id.localeCompare(b.id)
  );
}

/** Low readiness drops a set; never below 1. */
function scaleDose(d: Dose, r: number): Dose {
  if (r > 2 || !d.sets) return d;
  return { ...d, sets: Math.max(1, d.sets - 1) };
}

function fill(
  block: PlanBlock["name"], ranked: LibItem[], budget: number, r: number,
  used: Set<string>, why: (e: LibItem) => string, limit = 6
): PlanBlock {
  const items: PlanItem[] = [];
  let spent = 0;
  for (const e of ranked) {
    if (used.has(e.id) || items.length >= limit) continue;
    const dose = scaleDose(e.defaultDose, r);
    const m = estimateMinutes(e, dose);
    if (spent + m > budget) continue;
    items.push({ exerciseId: e.id, name: e.name, dose, minutes: m, why: why(e) });
    used.add(e.id);
    spent += m;
  }
  return { name: block, items };
}

// Body areas each focus loads; prep work targets these.
const FOCUS_AREAS: Partial<Record<Goal, BodyArea[]>> = {
  jump: ["ankle-foot", "knee", "pelvis-hip", "core"],
  power: ["pelvis-hip", "core", "ankle-foot"],
  strength: ["pelvis-hip", "knee", "shoulder", "core"],
  posture: ["thoracic", "ribs", "pelvis-hip", "neck"],
  conditioning: ["ankle-foot", "knee", "pelvis-hip"],
};

// Explosive work caps (contacts add up fast); the rest of the main block is strength.
const CATEGORY_CAP: Record<string, number> = { plyometric: 2, power: 1, skill: 1 };

const MAIN_CATEGORIES: Partial<Record<Goal, string[]>> = {
  jump: ["plyometric", "power", "strength", "skill"],
  power: ["power", "plyometric"],
  strength: ["strength"],
  conditioning: ["conditioning"],
};

/**
 * Build a session. `alignment` = today's BAT day items when enrolled; they go first, untouched,
 * because the protocol's day order is the point of the 28 days.
 */
export function buildPlan(c: CheckIn, library: LibItem[], alignment: PlanItem[] = [], recovery?: Recovery): Plan {
  const r = readiness(c);
  const maxIntensity = MAX_INTENSITY[r];
  const rec = recovery && !c.override ? recovery : undefined;
  const allowHighImpact = r >= 4 && !c.painAreas.some((p) => IMPACT_SENSITIVE.includes(p)) && !rec?.noExplosive;
  const pool = library.filter((e) => safe(e, c, maxIntensity, allowHighImpact));
  const used = new Set<string>(alignment.map((i) => i.exerciseId));
  const notes: string[] = [];

  const mainCats = new Set(c.focus.flatMap((g) => MAIN_CATEGORIES[g] ?? []));
  if (rec?.noConditioning) mainCats.delete("conditioning");
  // Full-body loading (complexes, cleans) touches every region, so any resting region rules it out.
  const rested = (e: LibItem) => (!!rec?.noExplosive && hardJump(e)) || !!rec && LOADING.has(e.category) &&
    (e.bodyAreas.includes("full-body") ? rec.restRegions.length > 0 : rec.restRegions.includes(region(e.bodyAreas)!));
  if (recovery?.rules.length && c.override) notes.push("You chose to train through the recovery rules; they are warnings today.");
  const recoveryDay = r <= 2 || mainCats.size === 0;
  if (r <= 2) notes.push(`Readiness ${r}/5: capped at intensity ${maxIntensity}, one set fewer, no jumping.`);
  if (c.painAreas.length) notes.push(`Pain in ${c.painAreas.join(", ")}: only gentle work touches those areas.`);

  const blocks: PlanBlock[] = [];
  if (alignment.length) blocks.push({ name: "Alignment", items: alignment });
  else {
    const align = rank(
      pool.filter((e) => e.category === "breathing" || e.category === "alignment"),
      (e) => e.bodyAreas.filter((b) => c.painAreas.includes(b)).length * 2 + (e.goals.includes("posture") ? 1 : 0)
    );
    blocks.push(fill("Alignment", align, Math.min(10, Math.round(c.minutes * 0.25)), r, used,
      () => "Daily alignment reset", 3));
  }

  const left = () => c.minutes - blocks.flatMap((b) => b.items).reduce((s, i) => s + i.minutes, 0);
  const focusAreas = new Set<BodyArea>([...c.painAreas, ...c.focus.flatMap((g) => FOCUS_AREAS[g] ?? [])]);
  const prepBudget = recoveryDay ? left() : Math.min(left(), Math.round(c.minutes * 0.2));
  const prep = rank(
    pool.filter((e) => e.category === "mobility" || e.category === "stability" ||
      (tendonIso(e) && e.bodyAreas.some((b) => c.painAreas.includes(b)))),
    (e) => (tendonIso(e) ? 3 : 0) + e.goals.filter((g) => c.focus.includes(g)).length + e.bodyAreas.filter((b) => focusAreas.has(b)).length
  );
  blocks.push(fill("Prep", prep, prepBudget, r, used,
    (e) => e.goals.some((g) => c.focus.includes(g)) ? `Supports ${c.focus.join("/")}` : "Stability prep", recoveryDay ? 8 : 4));

  if (!recoveryDay) {
    const ranked = rank(
      pool.filter((e) => mainCats.has(e.category) && !rested(e)),
      (e) => e.goals.filter((g) => c.focus.includes(g)).length * 2 + e.bodyAreas.filter((b) => focusAreas.has(b)).length
    );
    // Explosive work first while fresh (capped per category), then strength.
    const taken: Record<string, number> = {};
    const explosive = ranked.filter((e) => e.category in CATEGORY_CAP && (taken[e.category] = (taken[e.category] ?? 0) + 1) <= CATEGORY_CAP[e.category]);
    const main = [...explosive, ...ranked.filter((e) => !(e.category in CATEGORY_CAP))];
    blocks.push(fill("Main", main, Math.max(0, left()), r, used,
      (e) => `${e.category} for ${c.focus.join("/")}`));
    if (!main.length) notes.push("Recovery rules leave nothing to load for this focus today, so it is alignment and prep only.");
  } else if (mainCats.size) {
    notes.push("Main block skipped: recovery day. Come back to it when readiness is 3+.");
  }

  const total = blocks.flatMap((b) => b.items).reduce((s, i) => s + i.minutes, 0);
  return { readiness: r, maxIntensity, allowHighImpact, minutes: total, blocks: blocks.filter((b) => b.items.length), notes, rules: recovery?.rules ?? [] };
}
