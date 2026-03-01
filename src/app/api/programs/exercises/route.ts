import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { sectionId, name, description, sets, reps, order } = body;

  const exercise = await prisma.exercise.create({
    data: { sectionId, name, description, sets, reps, order },
  });

  return NextResponse.json(exercise, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, ...data } = body;

  const exercise = await prisma.exercise.update({
    where: { id },
    data,
  });

  return NextResponse.json(exercise);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  await prisma.exercise.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
