import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { startOfDay, endOfDay, subDays, format } from "date-fns";
import { parseLocalDate } from "@/lib/meal-dates";
import { COMPLIANCE_TAGS } from "@/lib/meal-constants";

// Returns weekly compliance: for each tag, count of DISTINCT days in last 7
// where profile logged any food carrying that tag.
export async function GET(request: NextRequest) {
  const sp = new URL(request.url).searchParams;
  const profileId = sp.get("profileId");
  const dateStr = sp.get("date");

  if (!profileId) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 });
  }

  const end = parseLocalDate(dateStr);
  const windowStart = startOfDay(subDays(end, 6));
  const windowEnd = endOfDay(end);

  // Pull all meal log items in window with their foods' tags + parent log's date
  const items = await prisma.mealLogItem.findMany({
    where: {
      mealLog: { profileId, date: { gte: windowStart, lte: windowEnd } },
    },
    select: {
      mealLog: { select: { date: true } },
      food: { select: { tags: true } },
    },
  });

  // For each tag → set of date strings (YYYY-MM-DD)
  const hits = new Map<string, Set<string>>();
  for (const item of items) {
    const dayKey = format(item.mealLog.date, "yyyy-MM-dd");
    for (const t of item.food.tags) {
      if (!hits.has(t)) hits.set(t, new Set());
      hits.get(t)!.add(dayKey);
    }
  }

  const result = COMPLIANCE_TAGS.map((c) => {
    const actual = hits.get(c.tag)?.size ?? 0;
    return {
      tag: c.tag,
      label: c.label,
      target: c.target,
      actual,
      met: actual >= c.target,
      appliesTo: c.appliesTo,
    };
  });

  return NextResponse.json(result);
}
