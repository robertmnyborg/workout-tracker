import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const programs = await prisma.program.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: {
          sections: {
            orderBy: { order: "asc" },
            include: {
              exercises: {
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
    },
  });

  return NextResponse.json(programs);
}
