import { NextRequest, NextResponse } from "next/server";
import { coachOpening } from "@/lib/coach/build";

export async function GET(request: NextRequest) {
  const profileId = request.nextUrl.searchParams.get("profileId");
  if (!profileId) return NextResponse.json({ error: "profileId is required" }, { status: 400 });
  return NextResponse.json(await coachOpening(profileId));
}
