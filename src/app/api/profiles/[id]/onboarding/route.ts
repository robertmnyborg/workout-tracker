import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { BODY_AREAS, GOALS } from "../../../../../../corpus/schema";
import { LIFT_AGES, PLYO_AGES } from "@/lib/engine/athlete";

const inches = z.number().min(0).max(60).nullable();
const Body = z.object({
  goal: z.string().trim().max(200).nullable(),
  goalFocus: z.array(z.enum(GOALS)),
  athlete: z.object({
    plyoAge: z.enum(PLYO_AGES),
    liftAge: z.enum(LIFT_AGES),
    standingVert: inches,
    approachVert: inches,
    sport: z.string().trim().max(40).nullable(),
    sportPerWeek: z.number().int().min(0).max(14),
    sportJumping: z.boolean(),
    tendonHistory: z.array(z.enum(BODY_AREAS)),
    sessionMinutes: z.number().int().min(5).max(180),
  }),
});

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await prisma.profile.findUniqueOrThrow({ where: { id }, select: { goal: true, goalFocus: true, athlete: true } });
  return NextResponse.json(p);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { goal, goalFocus, athlete } = parsed.data;
  await prisma.profile.update({ where: { id }, data: { goal: goal || null, goalFocus, athlete } });
  return NextResponse.json({ ok: true });
}
