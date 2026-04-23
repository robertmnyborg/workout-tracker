import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const profileId = new URL(request.url).searchParams.get("profileId");
  if (!profileId) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 });
  }
  const plans = await prisma.mealPlan.findMany({
    where: { profileId },
    include: {
      meals: {
        orderBy: { order: "asc" },
        include: {
          items: {
            orderBy: { order: "asc" },
            include: { food: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(plans);
}
