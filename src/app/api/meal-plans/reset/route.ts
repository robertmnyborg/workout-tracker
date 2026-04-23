import { NextRequest, NextResponse } from "next/server";
import { seedPlansForProfile } from "@/lib/meal-plan-templates";

// Reseeds Western + Asian plan templates for a profile.
// Wipes existing plan templates but preserves meal logs (MealLog has no FK to plans).
export async function POST(request: NextRequest) {
  const profileId = new URL(request.url).searchParams.get("profileId");
  if (!profileId) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 });
  }
  await seedPlansForProfile(profileId, true);
  return NextResponse.json({ ok: true });
}
