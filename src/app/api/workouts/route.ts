import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "10");
  const weekStart = searchParams.get("weekStart");
  const weekEnd = searchParams.get("weekEnd");

  const where = weekStart && weekEnd
    ? {
        date: {
          gte: new Date(weekStart),
          lte: new Date(weekEnd),
        },
      }
    : {};

  const sessions = await prisma.workoutSession.findMany({
    where,
    include: {
      programDay: true,
      setLogs: {
        include: { exercise: true },
      },
    },
    orderBy: { date: "desc" },
    take: limit,
  });

  return NextResponse.json(sessions);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { programDayId, notes } = body;

  const session = await prisma.workoutSession.create({
    data: {
      programDayId,
      notes,
      startedAt: new Date(),
    },
    include: {
      programDay: {
        include: {
          sections: {
            orderBy: { order: "asc" },
            include: {
              exercises: {
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
      setLogs: true,
    },
  });

  return NextResponse.json(session, { status: 201 });
}
