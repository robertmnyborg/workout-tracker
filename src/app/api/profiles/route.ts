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

  // A new phone or browser runs first-time setup with the same names; reuse those profiles
  // instead of creating a second "Robert" whose history is split from the first.
  const existing = await prisma.profile.findFirst({
    where: { name: { equals: name.trim(), mode: "insensitive" } },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return NextResponse.json(existing);

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
