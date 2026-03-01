import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { exerciseId, setNumber, weight, reps, completed, notes } = body;

  // Upsert: update if exists, create if not
  const existing = await prisma.setLog.findFirst({
    where: {
      workoutSessionId: id,
      exerciseId,
      setNumber,
    },
  });

  let setLog;
  if (existing) {
    setLog = await prisma.setLog.update({
      where: { id: existing.id },
      data: { weight, reps, completed, notes },
    });
  } else {
    setLog = await prisma.setLog.create({
      data: {
        workoutSessionId: id,
        exerciseId,
        setNumber,
        weight,
        reps,
        completed,
        notes,
      },
    });
  }

  return NextResponse.json(setLog, { status: existing ? 200 : 201 });
}
