import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { parseTargetReps, roundToNearest } from "@/lib/utils";

export type SetRecommendation = {
  exerciseId: string;
  setNumber: number;
  previousWeight: number | null;
  previousReps: number | null;
  suggestedWeight: number | null;
  suggestedReps: number | null;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const programDayId = searchParams.get("programDayId");
  const profileId = searchParams.get("profileId");

  if (!programDayId) {
    return NextResponse.json(
      { error: "programDayId is required" },
      { status: 400 }
    );
  }

  // Find the most recent completed session for this program day
  const where: Record<string, unknown> = {
    programDayId,
    completedAt: { not: null },
  };
  if (profileId) {
    where.profileId = profileId;
  }

  const lastSession = await prisma.workoutSession.findFirst({
    where,
    orderBy: { date: "desc" },
    include: {
      setLogs: {
        include: {
          exercise: true,
        },
      },
    },
  });

  if (!lastSession || lastSession.setLogs.length === 0) {
    return NextResponse.json([]);
  }

  // Group set logs by exercise
  const logsByExercise = new Map<string, typeof lastSession.setLogs>();
  for (const log of lastSession.setLogs) {
    const existing = logsByExercise.get(log.exerciseId) || [];
    existing.push(log);
    logsByExercise.set(log.exerciseId, existing);
  }

  const recommendations: SetRecommendation[] = [];

  for (const [exerciseId, logs] of logsByExercise) {
    const exercise = logs[0].exercise;
    const targetReps = parseTargetReps(exercise.reps);

    // Check if all completed sets met or exceeded target reps
    const completedLogs = logs.filter((l) => l.completed);
    const allSetsMetTarget =
      completedLogs.length > 0 &&
      completedLogs.length >= exercise.sets &&
      (targetReps === null ||
        completedLogs.every((l) => l.reps !== null && l.reps >= targetReps));

    for (const log of logs) {
      let suggestedWeight: number | null = null;

      if (log.weight !== null) {
        if (allSetsMetTarget) {
          // Progress: +5% rounded to nearest 2.5 lbs, minimum +2.5 lbs
          const increased = log.weight * 1.05;
          suggestedWeight = roundToNearest(increased);
          if (suggestedWeight <= log.weight) {
            suggestedWeight = log.weight + 2.5;
          }
        } else {
          // Maintain: same weight
          suggestedWeight = log.weight;
        }
      }

      recommendations.push({
        exerciseId,
        setNumber: log.setNumber,
        previousWeight: log.weight,
        previousReps: log.reps,
        suggestedWeight,
        suggestedReps: log.reps,
      });
    }
  }

  return NextResponse.json(recommendations);
}
