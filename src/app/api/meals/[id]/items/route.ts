import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST /api/meals/[id]/items — add an item to a meal log
// Body: { foodId, grams }
// Server computes macro snapshot from Food's per-100g values
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: mealLogId } = await params;
  const body = await request.json();
  const { foodId, grams } = body;

  if (!foodId || grams == null) {
    return NextResponse.json(
      { error: "foodId and grams required" },
      { status: 400 }
    );
  }

  const food = await prisma.food.findUnique({ where: { id: foodId } });
  if (!food) {
    return NextResponse.json({ error: "food not found" }, { status: 404 });
  }

  const ratio = Number(grams) / 100;
  const macro = {
    calories: Math.round(food.caloriesPer100g * ratio * 10) / 10,
    protein: Math.round(food.proteinPer100g * ratio * 10) / 10,
    carbs: Math.round(food.carbsPer100g * ratio * 10) / 10,
    fat: Math.round(food.fatPer100g * ratio * 10) / 10,
  };

  const maxOrder = await prisma.mealLogItem.findFirst({
    where: { mealLogId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const item = await prisma.mealLogItem.create({
    data: {
      mealLogId,
      foodId,
      grams: Number(grams),
      order: (maxOrder?.order ?? -1) + 1,
      ...macro,
    },
    include: { food: true },
  });

  return NextResponse.json(item, { status: 201 });
}
