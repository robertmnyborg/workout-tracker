import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ymdToUtc } from "@/lib/program-day";

// Start (or restart) a day-sequenced program for a profile. Day 0 = startDate.
export async function POST(request: NextRequest) {
  const { profileId, corpusId, startDate } = await request.json();
  if (!profileId || !corpusId || !startDate) {
    return NextResponse.json({ error: "profileId, corpusId and startDate are required" }, { status: 400 });
  }
  const program = await prisma.program.findUnique({ where: { corpusId } });
  if (!program) return NextResponse.json({ error: `No program ${corpusId}` }, { status: 404 });

  const start = ymdToUtc(startDate);
  const enrollment = await prisma.programEnrollment.upsert({
    where: { profileId_programId: { profileId, programId: program.id } },
    create: { profileId, programId: program.id, startDate: start },
    update: { startDate: start, active: true },
  });
  return NextResponse.json(enrollment, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  await prisma.programEnrollment.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ ok: true });
}
