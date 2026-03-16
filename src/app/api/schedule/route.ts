import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const weekNumber = parseInt(
    request.nextUrl.searchParams.get("week") || "1"
  );

  const schedule = await prisma.weekSchedule.findUnique({
    where: { weekNumber },
    include: {
      entries: {
        orderBy: [{ dayOfWeek: "asc" }, { order: "asc" }],
        include: {
          programDay: {
            include: {
              program: { select: { name: true } },
              sections: {
                orderBy: { order: "asc" },
                include: {
                  exercises: { orderBy: { order: "asc" } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!schedule) {
    return NextResponse.json(null, { status: 404 });
  }

  return NextResponse.json(schedule);
}
