import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const meal = await prisma.mealLog.update({
    where: { id },
    data: {
      title: body.title ?? undefined,
      mealType: body.mealType ?? undefined,
    },
  });
  return NextResponse.json(meal);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.mealLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
