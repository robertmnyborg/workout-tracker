import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const profiles = await prisma.profile.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(profiles);
}

export async function POST(request: NextRequest) {
  const { name } = await request.json();

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const profile = await prisma.profile.create({
    data: { name: name.trim() },
  });

  return NextResponse.json(profile, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const { id, name } = await request.json();

  if (!id || !name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "id and name are required" },
      { status: 400 }
    );
  }

  const profile = await prisma.profile.update({
    where: { id },
    data: { name: name.trim() },
  });

  return NextResponse.json(profile);
}
