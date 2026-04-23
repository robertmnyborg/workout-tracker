import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { dayRange, parseLocalDate } from "@/lib/meal-dates";

export async function GET(request: NextRequest) {
  const sp = new URL(request.url).searchParams;
  const profileId = sp.get("profileId");
  const dateStr = sp.get("date");

  if (!profileId) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 });
  }

  const where: Record<string, unknown> = { profileId };
  if (dateStr) {
    where.date = dayRange(dateStr);
  }

  const meals = await prisma.mealLog.findMany({
    where,
    include: {
      items: {
        include: { food: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(meals);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { profileId, date, mealType, title } = body;

  if (!profileId || !mealType) {
    return NextResponse.json(
      { error: "profileId and mealType required" },
      { status: 400 }
    );
  }

  const logDate = parseLocalDate(date);

  const meal = await prisma.mealLog.create({
    data: {
      profileId,
      date: logDate,
      mealType,
      title: title ?? null,
    },
    include: { items: { include: { food: true } } },
  });

  return NextResponse.json(meal, { status: 201 });
}
