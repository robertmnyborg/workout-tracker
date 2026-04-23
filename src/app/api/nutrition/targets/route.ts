import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const profileId = new URL(request.url).searchParams.get("profileId");
  if (!profileId) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 });
  }
  const target = await prisma.nutritionTarget.findUnique({ where: { profileId } });
  return NextResponse.json(target);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { profileId, calories, protein, carbs, fat } = body;
  if (!profileId) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 });
  }
  const data = {
    calories: Math.round(Number(calories)),
    protein: Math.round(Number(protein)),
    carbs: Math.round(Number(carbs)),
    fat: Math.round(Number(fat)),
  };
  const target = await prisma.nutritionTarget.upsert({
    where: { profileId },
    create: { profileId, ...data },
    update: data,
  });
  return NextResponse.json(target);
}
