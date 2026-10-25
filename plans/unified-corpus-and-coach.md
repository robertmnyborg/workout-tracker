# Unified corpus + plain-language coach (approved 2026-10-24)

1. **Corpus** — `corpus/library/*.json` (BAT, PT, trainer, YouTube) + `corpus/programs/*.json` +
   `corpus/principles/*.md`. Typed by `corpus/schema.ts`, gated by `npm run corpus:check`.
2. **BAT 28-day in the app** — additive import (`npm run corpus:import`, never `prisma db seed`, which wipes
   profiles and logs). `LibraryExercise` table, `Exercise.libraryId`, `ProgramEnrollment` (start date ->
   day N). Today view stacks the BAT day on top of the weekly schedule.
3. **Engine** — deterministic code in `src/lib/engine/`: readiness gate (energy/soreness/sleep -> max
   intensity), pain-area exclusions, time budget, focus goals, per-exercise progression (load/reps/hold/
   complexity, deload after low readiness or two missed sessions). Tests via `node:test`.
4. **Coach** — `/coach`: free text -> Claude extracts a typed check-in (tool use) -> engine builds the plan
   from library ids only -> start session. Claude never picks exercises or loads.

Safety: migrations are additive and generated with `prisma migrate diff` against the live Neon DB.
