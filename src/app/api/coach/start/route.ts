import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { CoachPlan } from "@/lib/coach/build";

// Turn a saved plan into a program day so the existing workout logger (sets, timer, history) handles it.
export async function POST(request: NextRequest) {
  const { checkInId } = await request.json();
  const checkIn = await prisma.checkIn.findUnique({ where: { id: checkInId } });
  if (!checkIn) return NextResponse.json({ error: "Unknown check-in" }, { status: 404 });
  const plan = checkIn.plan as unknown as CoachPlan;

  const program =
    (await prisma.program.findUnique({ where: { corpusId: "coach" } })) ??
    (await prisma.program.create({ data: { corpusId: "coach", name: "Coach Sessions", description: "Sessions built from daily check-ins." } }));
  const last = await prisma.programDay.findFirst({ where: { programId: program.id }, orderBy: { dayNumber: "desc" } });

  const day = await prisma.programDay.create({
    data: {
      programId: program.id,
      dayNumber: (last?.dayNumber ?? 0) + 1,
      name: `Coach · ${checkIn.focus.join(" + ")}`,
      focus: plan.notes.join(" ") || null,
      totalTime: `${plan.minutes} min`,
      sections: {
        create: plan.blocks.map((b, i) => ({
          name: b.name,
          type: { Alignment: "alignment", Prep: "activation", Main: "main", Finisher: "cooldown" }[b.name] ?? "main",
          order: i + 1,
          exercises: {
            create: b.items.map((it, j) => ({
              name: it.name, order: j + 1, libraryId: it.exerciseId,
              sets: it.dose.sets ?? 1, reps: it.dose.reps ?? (it.dose.durationMin ? `${it.dose.durationMin} min` : "1"),
              holdSeconds: it.dose.holdSeconds ?? null,
              description: [it.weight ? `Suggested: ${it.weight} lb` : null, it.progression, it.why].filter(Boolean).join(" · "),
            })),
          },
        })),
      },
    },
  });
  return NextResponse.json({ dayId: day.id });
}
