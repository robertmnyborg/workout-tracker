import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const plan = await prisma.mealPlan.findUnique({ where: { id } });
  if (!plan) return NextResponse.json({ error: "not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.mealPlan.updateMany({
      where: { profileId: plan.profileId },
      data: { isActive: false },
    }),
    prisma.mealPlan.update({ where: { id }, data: { isActive: true } }),
  ]);

  return NextResponse.json({ ok: true });
}
