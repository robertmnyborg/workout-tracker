// Glue between the database and the pure engine: library + BAT day + history -> plan with doses.
import { prisma } from "../prisma";
import type { CorpusExercise } from "../../../corpus/schema";
import { buildPlan, estimateMinutes, readiness, type CheckIn, type LibItem, type Plan, type PlanItem } from "../engine/plan";
import { nextDose, type PastSession } from "../engine/progression";
import { programDayNumber } from "../program-day";

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

export async function buildCoachPlan(profileId: string, checkIn: CheckIn): Promise<CoachPlan> {
  const rows = await prisma.libraryExercise.findMany();
  const library = new Map(rows.map((r) => [r.id, r.data as unknown as CorpusExercise]));
  const bat = await batItems(profileId, library);
  const plan = buildPlan(checkIn, [...library.values()] as LibItem[], bat.items);
  const r = readiness(checkIn);

  const blocks = await Promise.all(plan.blocks.map(async (b) => ({
    name: b.name,
    items: await Promise.all(b.items.map(async (it): Promise<CoachItem> => {
      const lib = library.get(it.exerciseId)!;
      // BAT days are prescribed by the protocol; don't progress them.
      if (b.name === "Alignment" && bat.items.length) return { ...it, weight: null, progression: "Protocol dose" };
      const base = { sets: it.dose.sets ?? 1, reps: it.dose.reps ?? "1", holdSeconds: it.dose.holdSeconds };
      const next = nextDose(lib.progression.method, base, await history(profileId, lib.id), r, lib.progression);
      const swap = next.swapTo ? library.get(next.swapTo) : undefined;
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
