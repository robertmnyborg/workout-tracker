// Glue between the database and the pure engine: library + BAT day + history -> plan with doses.
import { prisma } from "../prisma";
import type { CorpusExercise } from "../../../corpus/schema";
import type { Goal } from "../../../corpus/schema";
import { athleteAllows, buildPlan, estimateMinutes, readiness, type CheckIn, type LibItem, type Plan, type PlanItem } from "../engine/plan";
import { nextDose, type PastSession } from "../engine/progression";
import { assessRecovery, EXPLOSIVE, LOADING, outsideEvents, region, suggestFocus, type LoadEvent, type OutsideActivity, type Recovery } from "../engine/recovery";
import { daysAgo, programDayNumber } from "../program-day";
import { athleteLimits, type Athlete } from "../engine/athlete";
import { blockPhase, testDue, type Phase } from "../engine/phase";

/** Where the profile is in its jump block, and how long since the last jump test. */
async function jumpState(profile: { id: string; jumpBlockStart: Date | null }): Promise<{ phase?: Phase; sinceTest: number | null }> {
  const last = await prisma.jumpTest.findFirst({ where: { profileId: profile.id }, orderBy: { date: "desc" } });
  return {
    phase: profile.jumpBlockStart ? blockPhase(programDayNumber(profile.jumpBlockStart)) : undefined,
    sinceTest: last ? programDayNumber(last.date) : null,
  };
}

const UNKNOWN_ATHLETE: Athlete = { plyoAge: "none", liftAge: "none", standingVert: null, approachVert: null,
  sport: null, sportPerWeek: 0, sportJumping: false, tendonHistory: [], sessionMinutes: 30 };

export type CoachItem = PlanItem & { weight: number | null; progression: string; swapTo?: string };
export type CoachPlan = Omit<Plan, "blocks"> & { blocks: { name: string; items: CoachItem[] }[]; batDay: number | null };

async function batItems(profileId: string, library: Map<string, CorpusExercise>): Promise<{ day: number | null; items: PlanItem[] }> {
  const e = await prisma.programEnrollment.findFirst({
    where: { profileId, active: true, program: { corpusId: "bat-28day" } },
  });
  if (!e) return { day: null, items: [] };
  const n = programDayNumber(e.startDate);
  const day = await prisma.programDay.findFirst({
    where: { programId: e.programId, dayNumber: n },
    include: { sections: { include: { exercises: { orderBy: { order: "asc" } } } } },
  });
  if (!day) return { day: null, items: [] };
  const exercises = day.sections.flatMap((s) => s.exercises).filter((x) => x.libraryId);
  // The protocol states the day's length; split it across the day's movements.
  const dayMinutes = parseInt(day.totalTime ?? "") || 0;
  const items = exercises.map((x) => {
    const lib = library.get(x.libraryId!)!;
    const dose = { sets: x.sets, reps: x.reps, holdSeconds: x.holdSeconds ?? undefined };
    const minutes = dayMinutes ? Math.max(1, Math.round(dayMinutes / exercises.length)) : estimateMinutes(lib, dose);
    return { exerciseId: lib.id, name: lib.name, dose, minutes, why: `BAT Day ${n}` };
  });
  return { day: n, items };
}

/** Completed sessions containing this library exercise, newest first. */
async function history(profileId: string, libraryId: string): Promise<PastSession[]> {
  const sessions = await prisma.workoutSession.findMany({
    where: { profileId, completedAt: { not: null }, setLogs: { some: { exercise: { libraryId } } } },
    orderBy: { date: "desc" },
    take: 3,
    include: { setLogs: { where: { exercise: { libraryId } }, include: { exercise: true } } },
  });
  return sessions.map((s) => ({
    date: s.date.toISOString(),
    targetSets: s.setLogs[0].exercise.sets,
    targetReps: s.setLogs[0].exercise.reps,
    sets: s.setLogs.map((l) => ({ weight: l.weight, reps: l.reps, completed: l.completed })),
  }));
}

async function loadLibrary() {
  const rows = await prisma.libraryExercise.findMany();
  return new Map(rows.map((r) => [r.id, r.data as unknown as CorpusExercise]));
}

/** Last 7 days of logged sessions and outside activity, as load events. `skipCheckIn` = the live conversation. */
async function recentEvents(profileId: string, library: Map<string, CorpusExercise>, skipCheckIn?: string): Promise<LoadEvent[]> {
  const since = new Date(Date.now() - 8 * 86_400_000);
  const [sessions, checkIns] = await Promise.all([
    prisma.workoutSession.findMany({
      where: { profileId, completedAt: { not: null }, date: { gte: since } },
      include: { setLogs: { where: { completed: true }, include: { exercise: true } } },
    }),
    prisma.checkIn.findMany({ where: { profileId, date: { gte: since }, id: skipCheckIn ? { not: skipCheckIn } : undefined } }),
  ]);
  const events: LoadEvent[] = [];
  for (const s of sessions) {
    const d = daysAgo(s.date);
    for (const id of new Set(s.setLogs.map((l) => l.exercise.libraryId).filter(Boolean) as string[])) {
      const e = library.get(id);
      if (e) events.push({ daysAgo: d, label: e.name, category: e.category, region: region(e.bodyAreas), intensity: e.intensity });
    }
  }
  for (const c of checkIns) events.push(...outsideEvents((c.outsideActivity as OutsideActivity[] | null) ?? [], daysAgo(c.date)));
  return events.filter((e) => e.daysAgo >= 0 && e.daysAgo <= 6);
}

const DAY = (d: number) => (d === 0 ? "Today" : d === 1 ? "Yesterday" : `${d} days ago`);
const REGION = { lower: "legs", upper: "upper body", core: "core" } as const;

/** One line per day: "Yesterday: jumps, legs. 3 days ago: basketball 60 min." */
function describe(events: LoadEvent[]): string {
  const byDay = new Map<number, Set<string>>();
  for (const e of [...events].sort((a, b) => a.daysAgo - b.daysAgo)) {
    const tag = EXPLOSIVE.has(e.category) && e.intensity >= 4 ? "jumps"
      : LOADING.has(e.category) && e.region ? REGION[e.region]
      : e.category === "conditioning" ? e.label : null;
    if (tag) byDay.set(e.daysAgo, (byDay.get(e.daysAgo) ?? new Set()).add(tag));
  }
  return [...byDay].map(([d, tags]) => `${DAY(d)}: ${[...tags].join(", ")}.`).join(" ");
}

export interface Opening { message: string; suggestedFocus: Goal[]; goal: string | null; recovery: Recovery; minutes: number | null; onboarded: boolean }

/** The coach's first message: what you did, your goal, what it suggests, then the question. */
export async function coachOpening(profileId: string): Promise<Opening> {
  const [profile, library] = await Promise.all([prisma.profile.findUniqueOrThrow({ where: { id: profileId } }), loadLibrary()]);
  const events = await recentEvents(profileId, library);
  const recovery = assessRecovery(events);
  const suggestedFocus = suggestFocus(profile.goalFocus as Goal[], recovery);
  const { phase, sinceTest } = await jumpState(profile);
  const lines = [
    describe(events) || "Nothing logged in the last week.",
    profile.goal ? `Your goal: ${profile.goal}.` : "No standing goal yet. Tell me one, like \"my goal is to dunk\".",
    `I'd suggest ${suggestedFocus.join(" + ")} today${recovery.rules.length ? `, because:\n${recovery.rules.map((r) => `• ${r.text}`).join("\n")}` : "."}`,
    ...(phase ? [phase.rule.text] : []),
    ...(phase && testDue(sinceTest)
      ? [`Jump test due${sinceTest === null ? "" : ` (last one ${sinceTest} days ago)`}: after your usual warm-up, 3 standing and 3 approach jumps, chalk on a wall. Log the best on Progress.`]
      : []),
    ...(profile.athlete ? [] : ["I don't know your jump history yet, so jump volume uses beginner limits. Answer the 5 setup questions to change that."]),
    "How are you feeling, and how much time do you have?",
  ];
  const athlete = profile.athlete as Athlete | null;
  return { message: lines.join("\n\n"), suggestedFocus, goal: profile.goal, recovery, minutes: athlete?.sessionMinutes ?? null, onboarded: !!athlete };
}

export async function buildCoachPlan(profileId: string, checkIn: CheckIn, skipCheckIn?: string): Promise<CoachPlan> {
  const [library, profile] = await Promise.all([loadLibrary(), prisma.profile.findUniqueOrThrow({ where: { id: profileId } })]);
  // No answers yet: beginner limits, the safe default for an unknown jump history.
  const limits = athleteLimits((profile.athlete as Athlete | null) ?? UNKNOWN_ATHLETE);
  const bat = await batItems(profileId, library);
  const events = await recentEvents(profileId, library, skipCheckIn);
  const recovery = assessRecovery([...events, ...outsideEvents(checkIn.outsideActivity ?? [], 0)]);
  const { phase } = await jumpState(profile);
  const plan = buildPlan(checkIn, [...library.values()] as LibItem[], bat.items, recovery, limits, phase);
  const r = readiness(checkIn);

  const blocks = await Promise.all(plan.blocks.map(async (b) => ({
    name: b.name,
    items: await Promise.all(b.items.map(async (it): Promise<CoachItem> => {
      const lib = library.get(it.exerciseId)!;
      // BAT days are prescribed by the protocol; don't progress them.
      if (b.name === "Alignment" && bat.items.length) return { ...it, weight: null, progression: "Protocol dose" };
      const base = { sets: it.dose.sets ?? 1, reps: it.dose.reps ?? "1", holdSeconds: it.dose.holdSeconds };
      const next = nextDose(lib.progression.method, base, await history(profileId, lib.id), r, lib.progression);
      const target = next.swapTo ? library.get(next.swapTo) : undefined;
      // A harder variation that the onboarding limits lock (depth jumps for a beginner) waits.
      if (target && !athleteAllows(target as LibItem, limits))
        return { ...it, weight: null, progression: "Ready for the harder variation once it unlocks; repeat this dose." };
      const swap = target;
      return {
        ...it,
        ...(swap ? { exerciseId: swap.id, name: swap.name } : {}),
        dose: { ...it.dose, sets: next.sets, reps: next.reps, holdSeconds: next.holdSeconds },
        weight: next.weight,
        progression: next.reason,
        swapTo: next.swapTo,
      };
    })),
  })));

  return { ...plan, blocks, batDay: bat.day };
}
