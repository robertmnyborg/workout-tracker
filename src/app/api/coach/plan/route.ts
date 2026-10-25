import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildCoachPlan } from "@/lib/coach/build";
import type { CheckIn } from "@/lib/engine/plan";

export async function POST(request: NextRequest) {
  const { profileId, checkIn, rawText } = (await request.json()) as { profileId: string; checkIn: CheckIn; rawText?: string };
  if (!profileId || !checkIn) return NextResponse.json({ error: "profileId and checkIn are required" }, { status: 400 });
  const plan = await buildCoachPlan(profileId, checkIn);
  const saved = await prisma.checkIn.create({
    data: {
      profileId, rawText: rawText ?? null, energy: checkIn.energy, soreness: checkIn.soreness, sleep: checkIn.sleep ?? null,
      painAreas: checkIn.painAreas, focus: checkIn.focus, minutes: checkIn.minutes, plan: plan as object,
    },
  });
  return NextResponse.json({ checkInId: saved.id, plan });
}
