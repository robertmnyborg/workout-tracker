import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { dayRange } from "@/lib/meal-dates";

export async function GET(request: NextRequest) {
  const sp = new URL(request.url).searchParams;
  const profileId = sp.get("profileId");
  const dateStr = sp.get("date");

  if (!profileId) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 });
  }

  const agg = await prisma.mealLogItem.aggregate({
    where: {
      mealLog: {
        profileId,
        date: dayRange(dateStr),
      },
    },
    _sum: { calories: true, protein: true, carbs: true, fat: true },
  });

  return NextResponse.json({
    calories: Math.round((agg._sum.calories ?? 0) * 10) / 10,
    protein: Math.round((agg._sum.protein ?? 0) * 10) / 10,
    carbs: Math.round((agg._sum.carbs ?? 0) * 10) / 10,
    fat: Math.round((agg._sum.fat ?? 0) * 10) / 10,
  });
}
