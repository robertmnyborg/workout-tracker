import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { grams } = body;

  if (grams == null) {
    return NextResponse.json({ error: "grams required" }, { status: 400 });
  }

  const item = await prisma.mealLogItem.findUnique({
    where: { id },
    include: { food: true },
  });
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });

  const ratio = Number(grams) / 100;
  const updated = await prisma.mealLogItem.update({
    where: { id },
    data: {
      grams: Number(grams),
      calories: Math.round(item.food.caloriesPer100g * ratio * 10) / 10,
      protein: Math.round(item.food.proteinPer100g * ratio * 10) / 10,
      carbs: Math.round(item.food.carbsPer100g * ratio * 10) / 10,
      fat: Math.round(item.food.fatPer100g * ratio * 10) / 10,
    },
    include: { food: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.mealLogItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
