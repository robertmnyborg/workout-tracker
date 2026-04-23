import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { startOfDay, subDays, format } from "date-fns";

// GET /api/meals/progress?profileId=X&days=30
// Returns daily macro totals across a rolling window, oldest → newest
export async function GET(request: NextRequest) {
  const sp = new URL(request.url).searchParams;
  const profileId = sp.get("profileId");
  const days = Math.min(90, Math.max(1, Number(sp.get("days") ?? 30)));

  if (!profileId) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 });
  }

  const today = new Date();
  const windowStart = startOfDay(subDays(today, days - 1));

  const items = await prisma.mealLogItem.findMany({
    where: {
      mealLog: { profileId, date: { gte: windowStart } },
    },
    select: {
      calories: true,
      protein: true,
      carbs: true,
      fat: true,
      mealLog: { select: { date: true } },
    },
  });

  // Bucket by YYYY-MM-DD
  type Bucket = { calories: number; protein: number; carbs: number; fat: number };
  const buckets = new Map<string, Bucket>();
  for (let i = 0; i < days; i++) {
    const key = format(subDays(today, days - 1 - i), "yyyy-MM-dd");
    buckets.set(key, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }

  for (const it of items) {
    const key = format(it.mealLog.date, "yyyy-MM-dd");
    const b = buckets.get(key);
    if (!b) continue;
    b.calories += it.calories;
    b.protein += it.protein;
    b.carbs += it.carbs;
    b.fat += it.fat;
  }

  const result = Array.from(buckets.entries()).map(([date, b]) => ({
    date,
    calories: Math.round(b.calories),
    protein: Math.round(b.protein),
    carbs: Math.round(b.carbs),
    fat: Math.round(b.fat),
  }));

  return NextResponse.json(result);
}
