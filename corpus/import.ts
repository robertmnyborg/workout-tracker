// Additive import of the corpus into the database. Safe to re-run.
// - Upserts every library record into LibraryExercise.
// - Creates day-sequenced programs (BAT 28-day) that don't exist yet; never rebuilds one with logged sessions.
// - Links existing seeded Exercise rows to library ids by name/alias.
// Never deletes profiles, sessions or set logs (unlike prisma/seed.ts).
// Run: npm run corpus:import
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import type { CorpusExercise, Dose, ProgramFile } from "./schema";

const prisma = new PrismaClient();
const dir = (d: string) => join(__dirname, d);
const load = <T>(d: string): T[] =>
  readdirSync(dir(d)).filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(dir(d), f), "utf8")) as T);

// Programs that become app programs. The trainer programs are already seeded; PT routines live in warm-ups.
const IMPORT_PROGRAMS = ["bat-28day"];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function repsText(d: Dose): string {
  if (d.reps) return d.reps;
  if (d.durationMin) return `${d.durationMin} min`;
  if (d.holdSeconds) return `${d.holdSeconds} seconds`;
  return "1";
}

async function main() {
  const library = load<CorpusExercise[]>("library").flat();
  const byId = new Map(library.map((e) => [e.id, e]));

  for (const e of library) {
    const row = {
      name: e.name, category: e.category, sourceKind: e.source.kind, intensity: e.intensity,
      impact: e.impact, bodyAreas: e.bodyAreas, goals: e.goals, data: e as object,
    };
    await prisma.libraryExercise.upsert({ where: { id: e.id }, create: { id: e.id, ...row }, update: row });
  }
  console.log(`library: ${library.length} upserted`);

  for (const p of load<ProgramFile>("programs").filter((p) => IMPORT_PROGRAMS.includes(p.id))) {
    const existing = await prisma.program.findUnique({
      where: { corpusId: p.id },
      include: { days: { include: { _count: { select: { workoutSessions: true } } } } },
    });
    if (existing?.days.some((d) => d._count.workoutSessions > 0)) {
      console.log(`program ${p.id}: has logged sessions, left as is`);
      continue;
    }
    if (existing) await prisma.program.delete({ where: { id: existing.id } });

    const program = await prisma.program.create({ data: { name: p.name, description: p.description, corpusId: p.id } });
    for (const d of p.days) {
      await prisma.programDay.create({
        data: {
          programId: program.id, dayNumber: d.dayNumber, name: d.name, focus: d.focus ?? null,
          totalTime: d.minutes ? `${d.minutes} min` : null,
          sections: d.items.length ? {
            create: [{
              name: "Alignment", type: "alignment", order: 1,
              exercises: {
                create: d.items.map((it, i) => {
                  const lib = byId.get(it.exerciseId)!;
                  const extra = [it.dose.frequency, it.notes].filter(Boolean).join(" · ");
                  return {
                    name: lib.name, order: i + 1, libraryId: lib.id,
                    sets: it.dose.sets ?? 1, reps: repsText(it.dose), holdSeconds: it.dose.holdSeconds ?? null,
                    description: [lib.execution, extra].filter(Boolean).join("\n\n"),
                  };
                }),
              },
            }],
          } : undefined,
        },
      });
    }
    console.log(`program ${p.id}: created with ${p.days.length} days`);
  }

  // Link seeded exercises to the library by name or alias.
  const index = new Map<string, string>();
  for (const e of library) for (const n of [e.name, ...e.aliases]) if (!index.has(norm(n))) index.set(norm(n), e.id);
  const unlinked = await prisma.exercise.findMany({ where: { libraryId: null }, select: { id: true, name: true } });
  const missing = new Set<string>();
  let linked = 0;
  for (const x of unlinked) {
    const id = index.get(norm(x.name));
    if (!id) { missing.add(x.name); continue; }
    await prisma.exercise.update({ where: { id: x.id }, data: { libraryId: id } });
    linked++;
  }
  console.log(`linked ${linked} existing exercises; unmatched names: ${missing.size ? [...missing].join(" | ") : "none"}`);
}

main().finally(() => prisma.$disconnect());
