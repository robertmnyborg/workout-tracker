# Corpus extraction brief (shared by all extraction agents)

Goal: one exercise library the app (and later an AI planner) pulls from. Every distinct movement becomes ONE
record in `corpus/library/<source>.json` (a JSON array), typed by `corpus/schema.ts` (`CorpusExercise`).
Programs (ordered day plans) go in `corpus/programs/<id>.json` (`ProgramFile`), referencing exercise ids.

Rules
- Read `corpus/schema.ts` first. Use ONLY its enum values for category, bodyAreas, goals, impact, progression.method.
- Faithful to source: setup/execution/cues/errors come from the source text. Do not invent cues. If the source
  has no errors list, use []. Keep the coach's specific cues (they are the value).
- id: kebab-case of the clearest name. Put alternate names in aliases.
- intensity (systemic stress, used to gate sessions when the user feels bad):
  1 breathing/gentle reset, 2 mobility/low-load stability, 3 moderate strength or conditioning,
  4 heavy strength or explosive power, 5 max-effort plyometrics / sprint / max lifts.
- impact: high = jumps, bounds, sprints, landings; low = walking, step-ups, light hops; none otherwise.
- progression.easier/harder: only link ids that exist in YOUR file (cross-file links are added later).
- contraindications: only when the source says so, or the obvious one (e.g. depth jumps: "acute knee/ankle pain").
- source.ref: path relative to repo root or URL, plus section/lesson if useful.
- Validate: `cd ~/Projects/personal/workout-tracker && npm run -s corpus:check`. It must print "corpus OK"
  (other agents' files may appear; only fix problems in YOUR files). Do not edit schema.ts or check.ts.
- Do NOT touch the database, prisma/, or src/. Do NOT run prisma seed (it wipes user data).
