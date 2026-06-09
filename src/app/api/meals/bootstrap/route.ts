import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { seedPlansForProfile } from "@/lib/meal-plan-templates";

// Bootstrap a profile's meal tracking:
// - creates NutritionTarget using Male or Female preset (or custom values)
// - seeds Western + Asian plan templates
// Called on first /meals visit for a profile that has no target yet.
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { profileId, preset, custom } = body;

  if (!profileId) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 });
  }

  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) {
    return NextResponse.json(
      { error: "Profile not found. Refresh the page to re-sync your profile." },
      { status: 404 }
    );
  }

  const presets: Record<"male" | "female", { calories: number; protein: number; carbs: number; fat: number }> = {
    male: { calories: 2900, protein: 215, carbs: 325, fat: 87 },
    female: { calories: 2000, protein: 145, carbs: 200, fat: 65 },
  };

  let data: { calories: number; protein: number; carbs: number; fat: number };
  if (custom) {
    data = {
      calories: Math.round(Number(custom.calories)),
      protein: Math.round(Number(custom.protein)),
      carbs: Math.round(Number(custom.carbs)),
      fat: Math.round(Number(custom.fat)),
    };
  } else if (preset === "male" || preset === "female") {
    data = presets[preset as "male" | "female"];
  } else {
    return NextResponse.json(
      { error: "preset (male|female) or custom {calories,protein,carbs,fat} required" },
      { status: 400 }
    );
  }

  await prisma.nutritionTarget.upsert({
    where: { profileId },
    create: { profileId, ...data },
    update: data,
  });

  // Only seed plans if none exist
  const existing = await prisma.mealPlan.count({ where: { profileId } });
  if (existing === 0) {
    await seedPlansForProfile(profileId, true);
  }

  return NextResponse.json({ ok: true });
}
