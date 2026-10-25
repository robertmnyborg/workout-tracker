// What you trained recently decides what today can load. Pure: the coach feeds it events from
// logged sessions and from outside activity ("an hour of basketball") mentioned in check-ins.
import type { BodyArea, Category, Goal } from "../../../corpus/schema";

export type Region = "lower" | "upper" | "core";

export interface LoadEvent {
  daysAgo: number; // 0 = today
  label: string;
  category: Category;
  region: Region | null;
  intensity: number;
}

export interface OutsideActivity {
  kind: string; // "basketball", "run", "hike"
  minutes: number;
  hard: boolean;
  jumping: boolean;
}

export interface Rule {
  text: string;
  source: string;
}

export interface Recovery {
  noExplosive: boolean;
  noConditioning: boolean;
  restRegions: Region[];
  rules: Rule[];
}

const LOWER: BodyArea[] = ["knee", "pelvis-hip", "ankle-foot"];
const UPPER: BodyArea[] = ["shoulder", "elbow-wrist", "thoracic", "neck"];
// Hard jump work: max jumps, fast lifts, approach/dunk sessions (PJF's "jerk budget" buckets).
export const EXPLOSIVE = new Set<Category>(["plyometric", "power", "skill"]);
export const hardJump = (e: { category: Category; intensity: number }) => EXPLOSIVE.has(e.category) && e.intensity >= 4;
export const LOADING = new Set<Category>(["strength", "power", "plyometric"]);

/** Primary region an exercise loads: legs win over arms, arms over trunk. */
export function region(bodyAreas: BodyArea[]): Region | null {
  if (bodyAreas.some((b) => LOWER.includes(b))) return "lower";
  if (bodyAreas.some((b) => UPPER.includes(b))) return "upper";
  if (bodyAreas.includes("core") || bodyAreas.includes("lumbar")) return "core";
  return null;
}

/** Sport and cardio outside the app, as load events. Jumping sport counts as a jump session; hard sport loads the legs. */
export function outsideEvents(acts: OutsideActivity[], daysAgo: number): LoadEvent[] {
  return acts.flatMap((a) => [
    ...(a.jumping ? [{ daysAgo, label: a.kind, category: "plyometric" as const, region: null, intensity: a.hard ? 5 : 4 }] : []),
    { daysAgo, label: `${a.kind} ${a.minutes} min`, category: "conditioning" as const, region: a.hard ? "lower" as const : null, intensity: a.hard ? 4 : 2 },
  ]);
}

const REGION_NAME: Record<Region, string> = { lower: "Legs", upper: "Upper body", core: "Core" };
const when = (d: number) => (d === 0 ? "earlier today" : "yesterday");

export function assessRecovery(events: LoadEvent[]): Recovery {
  const rules: Rule[] = [];
  const recent = events.filter((e) => e.daysAgo <= 1);

  const lastExplosive = recent.find(hardJump);
  const explosiveDays = new Set(events.filter((e) => hardJump(e) && e.daysAgo >= 1 && e.daysAgo <= 6).map((e) => e.daysAgo));
  let noExplosive = false;
  if (lastExplosive) {
    noExplosive = true;
    rules.push({
      text: `Hard jumping ${when(lastExplosive.daysAgo)} (${lastExplosive.label}): no max jumps or fast lifts today. Keep 48 hours between hard jump days; slow strength and easy drills are fine.`,
      source: "PJF, NF658w-s8io @ 7:40 and mNbpZ9-7XM0 @ 1:10; TMS, 1CFAZfxEkoQ @ 3:02 (yt-jump rules 1, 8)",
    });
  } else if (explosiveDays.size >= 2) {
    noExplosive = true;
    rules.push({
      text: `${explosiveDays.size} hard jump days in the last week already: the default is 2 a week (e.g. Mon + Thu).`,
      source: "PJF, NF658w-s8io @ 7:40; Nippard, cPsy38pkZzE @ 14:43 (yt-jump rule 1, yt-athletic rule 11)",
    });
  }

  const rest = new Set<Region>();
  for (const e of recent) {
    if (!e.region || rest.has(e.region)) continue;
    if (LOADING.has(e.category) && e.intensity >= 3) {
      rest.add(e.region);
      rules.push({
        text: `${REGION_NAME[e.region]} trained ${when(e.daysAgo)} (${e.label}): no loading it again today.`,
        source: "RP, QlZPCJJOUfQ (yt-programming rule 24: no back-to-back clustering)",
      });
    } else if (e.category === "conditioning" && e.intensity >= 4 && e.region === "lower" && e.daysAgo === 0) {
      // Same day only: the day after basketball, slow heavy strength is fine (PJF, mNbpZ9-7XM0 @ 1:10).
      rest.add("lower");
      rules.push({
        text: `Hard ${e.label} earlier today: no heavy leg lifting today. Keep hard cardio and heavy legs on separate days.`,
        source: "RP, 2nbDIrDnBjY @ 42:12 (yt-athletic rule 7)",
      });
    }
  }

  const conditionedToday = events.find((e) => e.daysAgo === 0 && e.category === "conditioning");
  if (conditionedToday) {
    rules.push({
      text: `Already did ${conditionedToday.label} today: no extra conditioning. Sport volume plus training on top adds up.`,
      source: "RP, 2nbDIrDnBjY @ 44:36 (yt-athletic)",
    });
  }

  return { noExplosive, noConditioning: !!conditionedToday, restRegions: [...rest], rules };
}

/** What to work on today given the standing goal and what needs rest. */
export function suggestFocus(goalFocus: Goal[], rec: Recovery): Goal[] {
  const legsOk = !rec.restRegions.includes("lower");
  const out = new Set<Goal>();
  for (const g of goalFocus.length ? goalFocus : (["strength"] as Goal[])) {
    if ((g === "jump" || g === "power") && rec.noExplosive) out.add(legsOk ? "strength" : "posture");
    else if (g === "conditioning" && rec.noConditioning) out.add("mobility");
    else if (g === "strength" && rec.restRegions.length === 3) out.add("mobility");
    else out.add(g);
  }
  return [...out];
}
