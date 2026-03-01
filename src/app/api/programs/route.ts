import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const program = await prisma.program.findFirst({
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

  return NextResponse.json(program);
}
