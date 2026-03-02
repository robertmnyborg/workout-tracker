import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { startOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "10");
  const weekStart = searchParams.get("weekStart");
  const weekEnd = searchParams.get("weekEnd");
  const profileId = searchParams.get("profileId");

  const where: Record<string, unknown> = {};

  if (weekStart && weekEnd) {
    where.date = {
      gte: new Date(weekStart),
      lte: new Date(weekEnd),
    };
  }

  if (profileId) {
    where.profileId = profileId;
  }

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
  const { programDayId, profileId, notes } = body;

  if (!profileId) {
    return NextResponse.json(
      { error: "profileId is required" },
      { status: 400 }
    );
  }

  // Find-or-create: check for existing active session today
  const todayStart = startOfDay(new Date());
  const existing = await prisma.workoutSession.findFirst({
    where: {
      profileId,
      programDayId,
      completedAt: null,
      date: { gte: todayStart },
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

  if (existing) {
    return NextResponse.json(existing);
  }

  const session = await prisma.workoutSession.create({
    data: {
      programDayId,
      profileId,
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
