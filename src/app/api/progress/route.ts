import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const exerciseId = searchParams.get("exerciseId");
  const profileId = searchParams.get("profileId");

  if (!exerciseId) {
    // Return all exercises that have been logged (filtered by profile if provided)
    const where: Record<string, unknown> = {
      setLogs: { some: profileId ? { workoutSession: { profileId } } : {} },
    };

    const exercises = await prisma.exercise.findMany({
      where,
      select: {
        id: true,
        name: true,
        sectionId: true,
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(exercises);
  }

  // Return set logs for a specific exercise over time
  const logWhere: Record<string, unknown> = {
    exerciseId,
    completed: true,
  };
  if (profileId) {
    logWhere.workoutSession = { profileId };
  }

  const logs = await prisma.setLog.findMany({
    where: logWhere,
    include: {
      workoutSession: {
        select: { date: true },
      },
    },
    orderBy: {
      workoutSession: { date: "asc" },
    },
  });

  // Group by session date and calculate stats
  const sessionMap = new Map<
    string,
    { date: string; maxWeight: number; totalVolume: number; sets: number }
  >();

  for (const log of logs) {
    const dateKey = log.workoutSession.date.toISOString().split("T")[0];
    const existing = sessionMap.get(dateKey) || {
      date: dateKey,
      maxWeight: 0,
      totalVolume: 0,
      sets: 0,
    };

    const weight = log.weight || 0;
    const reps = log.reps || 0;

    existing.maxWeight = Math.max(existing.maxWeight, weight);
    existing.totalVolume += weight * reps;
    existing.sets += 1;
    sessionMap.set(dateKey, existing);
  }

  const progress = Array.from(sessionMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Personal bests
  const personalBests = {
    maxWeight: Math.max(...progress.map((p) => p.maxWeight), 0),
    maxVolume: Math.max(...progress.map((p) => p.totalVolume), 0),
  };

  return NextResponse.json({ progress, personalBests });
}
