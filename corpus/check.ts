// Validates corpus/library/*.json and corpus/programs/*.json against schema.ts.
// Exits 1 with every problem listed. Run: npm run corpus:check
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BODY_AREAS, CATEGORIES, GOALS, SOURCE_KINDS,
  type CorpusExercise, type ProgramFile,
} from "./schema";

const root = join(__dirname);
const errors: string[] = [];
const err = (where: string, msg: string) => errors.push(`${where}: ${msg}`);

const readDir = (dir: string) =>
  readdirSync(join(root, dir))
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ file: `${dir}/${f}`, data: JSON.parse(readFileSync(join(root, dir, f), "utf8")) }));

const ids = new Map<string, string>();
const all: CorpusExercise[] = [];

for (const { file, data } of readDir("library")) {
  if (!Array.isArray(data)) { err(file, "must be an array"); continue; }
  for (const e of data as CorpusExercise[]) {
    const w = `${file}#${e.id}`;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.id ?? "")) err(w, "id must be kebab-case");
    if (ids.has(e.id)) err(w, `duplicate id (also in ${ids.get(e.id)})`);
    ids.set(e.id, file);
    for (const k of ["name", "setup", "execution"] as const)
      if (!e[k] || typeof e[k] !== "string") err(w, `missing ${k}`);
    for (const k of ["aliases", "cues", "errors", "equipment", "contraindications", "bodyAreas", "goals"] as const)
      if (!Array.isArray(e[k])) err(w, `${k} must be an array`);
    if (!SOURCE_KINDS.includes(e.source?.kind)) err(w, `bad source.kind ${e.source?.kind}`);
    if (!e.source?.ref) err(w, "missing source.ref");
    if (!CATEGORIES.includes(e.category)) err(w, `bad category ${e.category}`);
    e.bodyAreas?.forEach((b) => BODY_AREAS.includes(b) || err(w, `bad bodyArea ${b}`));
    e.goals?.forEach((g) => GOALS.includes(g) || err(w, `bad goal ${g}`));
    if (!e.bodyAreas?.length) err(w, "needs at least one bodyArea");
    if (!e.goals?.length) err(w, "needs at least one goal");
    if (![1, 2, 3, 4, 5].includes(e.intensity)) err(w, `bad intensity ${e.intensity}`);
    if (!["none", "low", "high"].includes(e.impact)) err(w, `bad impact ${e.impact}`);
    if (!["load", "reps", "hold", "complexity", "none"].includes(e.progression?.method))
      err(w, `bad progression.method ${e.progression?.method}`);
    if (typeof e.defaultDose !== "object") err(w, "missing defaultDose");
    all.push(e);
  }
}

for (const e of all) {
  for (const k of ["easier", "harder"] as const) {
    const ref = e.progression?.[k];
    if (ref && !ids.has(ref)) err(e.id, `progression.${k} -> unknown id ${ref}`);
  }
}

for (const { file, data } of readDir("programs")) {
  const p = data as ProgramFile;
  if (!p.id || !p.name || !Array.isArray(p.days)) { err(file, "needs id, name, days[]"); continue; }
  for (const d of p.days)
    for (const it of d.items ?? [])
      if (!ids.has(it.exerciseId)) err(`${file} day ${d.dayNumber}`, `unknown exerciseId ${it.exerciseId}`);
}

const by = (k: (e: CorpusExercise) => string) =>
  Object.entries(all.reduce<Record<string, number>>((a, e) => ((a[k(e)] = (a[k(e)] ?? 0) + 1), a), {}))
    .map(([n, c]) => `${n}:${c}`).join(" ");

console.log(`${all.length} exercises | source ${by((e) => e.source.kind)} | category ${by((e) => e.category)}`);
if (errors.length) {
  console.error(`\n${errors.length} problems:\n` + errors.join("\n"));
  process.exit(1);
}
console.log("corpus OK");
