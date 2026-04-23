import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  const foods = await prisma.food.findMany({
    where: q
      ? { name: { contains: q, mode: "insensitive" } }
      : undefined,
    orderBy: { name: "asc" },
    take: 25,
  });
  return NextResponse.json(foods);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    name,
    brand,
    caloriesPer100g,
    proteinPer100g,
    carbsPer100g,
    fatPer100g,
    defaultServingGrams,
    defaultServingLabel,
    tags,
  } = body;

  if (!name || caloriesPer100g == null || proteinPer100g == null || carbsPer100g == null || fatPer100g == null) {
    return NextResponse.json(
      { error: "name and all per-100g macros are required" },
      { status: 400 }
    );
  }

  try {
    const food = await prisma.food.create({
      data: {
        name: String(name).trim(),
        brand: brand?.trim() || null,
        caloriesPer100g: Number(caloriesPer100g),
        proteinPer100g: Number(proteinPer100g),
        carbsPer100g: Number(carbsPer100g),
        fatPer100g: Number(fatPer100g),
        defaultServingGrams: defaultServingGrams != null ? Number(defaultServingGrams) : null,
        defaultServingLabel: defaultServingLabel?.trim() || null,
        tags: Array.isArray(tags) ? tags : [],
      },
    });
    return NextResponse.json(food, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const existing = await prisma.food.findUnique({ where: { name: String(name).trim() } });
      return NextResponse.json(
        { error: "Food with this name already exists", existing },
        { status: 409 }
      );
    }
    throw e;
  }
}
