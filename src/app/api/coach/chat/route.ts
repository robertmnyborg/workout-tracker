// One chat turn: a message (read by Claude) or a manual edit from Adjust, then the engine rebuilds the plan.
// A conversation is one CheckIn row, updated every turn, so outside activity is counted once.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildCoachPlan } from "@/lib/coach/build";
import { parseCheckIn } from "@/lib/coach/parse";
import type { CheckIn } from "@/lib/engine/plan";

interface Body { profileId: string; checkIn: CheckIn; checkInId?: string; message?: string }

export async function POST(request: NextRequest) {
  const { profileId, checkIn: current, checkInId, message } = (await request.json()) as Body;
  if (!profileId || !current) return NextResponse.json({ error: "profileId and checkIn are required" }, { status: 400 });

  let checkIn = current;
  let summary: string | null = null;
  let goal: string | null = null;
  if (message?.trim()) {
    const profile = await prisma.profile.findUniqueOrThrow({ where: { id: profileId } });
    try {
      const { summary: s, goal: g, goalFocus, ...parsed } = await parseCheckIn(message, current, profile.goal);
      checkIn = parsed;
      summary = s;
      if (g) {
        goal = g;
        await prisma.profile.update({ where: { id: profileId }, data: { goal: g, goalFocus } });
      }
    } catch (e) {
      // No subscription token on this host, or Claude could not read the message: Adjust still works.
      return NextResponse.json({ error: (e as Error).message }, { status: 503 });
    }
  }

  const plan = await buildCoachPlan(profileId, checkIn, checkInId);
  const prior = checkInId ? await prisma.checkIn.findUnique({ where: { id: checkInId } }) : null;
  const data = {
    rawText: [prior?.rawText, message?.trim()].filter(Boolean).join("\n") || null,
    energy: checkIn.energy, soreness: checkIn.soreness, sleep: checkIn.sleep ?? null,
    painAreas: checkIn.painAreas, focus: checkIn.focus, minutes: checkIn.minutes,
    outsideActivity: (checkIn.outsideActivity ?? []) as object[], override: !!checkIn.override, plan: plan as object,
  };
  const saved = prior
    ? await prisma.checkIn.update({ where: { id: prior.id }, data })
    : await prisma.checkIn.create({ data: { profileId, ...data } });
  return NextResponse.json({ checkInId: saved.id, checkIn, summary, goal, plan });
}
