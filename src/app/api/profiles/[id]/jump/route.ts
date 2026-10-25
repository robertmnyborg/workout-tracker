// Weekly jump tests and the 12-week block clock.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { blockPhase } from "@/lib/engine/phase";
import { programDayNumber, userTodayYmd, ymdToUtc } from "@/lib/program-day";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const [profile, tests] = await Promise.all([
    prisma.profile.findUniqueOrThrow({ where: { id }, select: { jumpBlockStart: true } }),
    prisma.jumpTest.findMany({ where: { profileId: id }, orderBy: { date: "asc" } }),
  ]);
  const start = profile.jumpBlockStart;
  return NextResponse.json({ blockStart: start, phase: start ? blockPhase(programDayNumber(start)) : null, tests });
}

const inches = z.number().min(1).max(60).nullable();
const Test = z.object({ standing: inches, approach: inches, date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() })
  .refine((t) => t.standing !== null || t.approach !== null, "Enter at least one jump");

/** Log a test. One per day: a second entry the same day replaces the first. */
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const parsed = Test.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const date = ymdToUtc(parsed.data.date ?? userTodayYmd());
  await prisma.jumpTest.deleteMany({ where: { profileId: id, date } });
  const test = await prisma.jumpTest.create({ data: { profileId: id, date, standing: parsed.data.standing, approach: parsed.data.approach } });
  return NextResponse.json(test, { status: 201 });
}

/** Start a new 12-week block today. */
export async function PUT(_: NextRequest, { params }: Ctx) {
  const { id } = await params;
  await prisma.profile.update({ where: { id }, data: { jumpBlockStart: ymdToUtc(userTodayYmd()) } });
  return NextResponse.json({ ok: true });
}
