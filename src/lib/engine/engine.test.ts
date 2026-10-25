import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPlan, readiness, type CheckIn, type LibItem } from "./plan";
import { nextDose, type PastSession } from "./progression";

const ex = (id: string, o: Partial<LibItem>): LibItem => ({
  id, name: id, category: "strength", bodyAreas: ["full-body"], goals: ["strength"],
  intensity: 3, impact: "none", defaultDose: { sets: 3, reps: "8" }, source: { kind: "trainer", ref: "t" }, ...o,
});

const lib: LibItem[] = [
  ex("body-breathing", { category: "breathing", bodyAreas: ["ribs"], goals: ["posture"], intensity: 1, defaultDose: { durationMin: 5 }, source: { kind: "bat", ref: "b" } }),
  ex("wall-reach", { category: "alignment", bodyAreas: ["shoulder", "lumbar"], goals: ["posture"], intensity: 1, defaultDose: { sets: 2, reps: "5" }, source: { kind: "bat", ref: "b" } }),
  ex("ta-march", { category: "stability", bodyAreas: ["core", "lumbar"], goals: ["stability", "pain-relief"], intensity: 2, defaultDose: { sets: 2, reps: "15" }, source: { kind: "pt", ref: "p" } }),
  ex("ankle-mob", { category: "mobility", bodyAreas: ["ankle-foot"], goals: ["mobility", "jump"], intensity: 2, defaultDose: { sets: 2, reps: "5" } }),
  ex("depth-jump", { category: "plyometric", bodyAreas: ["knee", "ankle-foot"], goals: ["jump", "power"], intensity: 5, impact: "high", defaultDose: { sets: 4, reps: "3" } }),
  ex("back-squat", { bodyAreas: ["knee", "pelvis-hip"], goals: ["strength", "jump"], intensity: 4, defaultDose: { sets: 4, reps: "5" } }),
  ex("deadlift", { bodyAreas: ["lumbar", "pelvis-hip"], goals: ["strength"], intensity: 4 }),
  ex("wall-test", { category: "assessment", goals: ["posture"], intensity: 1 }),
];

const fresh: CheckIn = { energy: 5, soreness: 1, sleep: 5, painAreas: [], focus: ["jump"], minutes: 45 };
const ids = (p: ReturnType<typeof buildPlan>) => p.blocks.flatMap((b) => b.items.map((i) => i.exerciseId));

test("readiness: pain costs a point, clamps to 1-5", () => {
  assert.equal(readiness(fresh), 5);
  assert.equal(readiness({ ...fresh, painAreas: ["knee"] }), 4);
  assert.equal(readiness({ ...fresh, energy: 1, soreness: 5, sleep: 1, painAreas: ["lumbar"] }), 1);
});

test("fresh jump day: alignment first, plyos allowed, within budget, deterministic", () => {
  const p = buildPlan(fresh, lib);
  assert.equal(p.blocks[0].name, "Alignment");
  assert.ok(ids(p).includes("depth-jump"));
  assert.ok(p.minutes <= fresh.minutes);
  assert.deepEqual(buildPlan(fresh, lib), p);
});

test("assessments never get scheduled by the engine", () => {
  assert.ok(!ids(buildPlan(fresh, lib)).includes("wall-test"));
});

test("knee pain: no high impact, no loading the knee, gentle work stays", () => {
  const p = buildPlan({ ...fresh, painAreas: ["knee"] }, lib);
  assert.equal(p.allowHighImpact, false);
  assert.ok(!ids(p).includes("depth-jump"));
  assert.ok(!ids(p).includes("back-squat"));
});

test("wrecked day: recovery only, no main block", () => {
  const p = buildPlan({ energy: 1, soreness: 5, sleep: 2, painAreas: ["lumbar"], focus: ["strength"], minutes: 20 }, lib);
  assert.ok(p.maxIntensity <= 2);
  assert.ok(!p.blocks.some((b) => b.name === "Main"));
  assert.ok(ids(p).includes("ta-march"));
  assert.ok(!ids(p).includes("deadlift"));
});

test("BAT day items are kept as given and come first", () => {
  const bat = [{ exerciseId: "wall-reach", name: "Wall reach", dose: { sets: 3, reps: "8" }, minutes: 6, why: "BAT day 12" }];
  const p = buildPlan(fresh, lib, bat);
  assert.deepEqual(p.blocks[0].items, bat);
  assert.equal(ids(p).filter((i) => i === "wall-reach").length, 1);
});

const s = (weight: number, reps: number, done = true): PastSession =>
  ({ date: "2026-10-01", targetSets: 3, targetReps: "8", sets: [0, 1, 2].map(() => ({ weight, reps, completed: done })) });

test("load: hit target -> +5% rounded, min +2.5", () => {
  assert.equal(nextDose("load", { sets: 3, reps: "8" }, [s(200, 8)], 4).weight, 210);
  assert.equal(nextDose("load", { sets: 3, reps: "8" }, [s(20, 8)], 4).weight, 22.5);
});

test("load: missed -> repeat; stalled twice -> deload 10% and half the sets", () => {
  assert.equal(nextDose("load", { sets: 3, reps: "8" }, [s(200, 6)], 4).weight, 200);
  const d = nextDose("load", { sets: 4, reps: "8" }, [s(200, 6), s(200, 7)], 4);
  assert.equal(d.weight, 180);
  assert.equal(d.sets, 2);
});

test("load: jump capped at +10 lb on heavy lifts", () => {
  assert.equal(nextDose("load", { sets: 3, reps: "8" }, [s(300, 8)], 4).weight, 310);
});

test("low readiness lightens today only, sets unchanged", () => {
  const d = nextDose("load", { sets: 3, reps: "8" }, [s(200, 8)], 2);
  assert.equal(d.weight, 180);
  assert.equal(d.sets, 3);
});

test("complexity: three clean sessions -> harder; low readiness -> easier", () => {
  const links = { easier: "box-jump", harder: "depth-jump" };
  assert.equal(nextDose("complexity", { sets: 3, reps: "5" }, [s(0, 8), s(0, 8), s(0, 8)], 4, links).swapTo, "depth-jump");
  assert.equal(nextDose("complexity", { sets: 3, reps: "5" }, [s(0, 8)], 4, links).swapTo, undefined);
  assert.equal(nextDose("complexity", { sets: 3, reps: "5" }, [s(0, 8)], 1, links).swapTo, "box-jump");
});

test("reps and hold progress by fixed steps", () => {
  assert.equal(nextDose("reps", { sets: 2, reps: "15" }, [{ ...s(0, 15), targetReps: "15" }], 4).reps, "17");
  assert.equal(nextDose("hold", { sets: 2, reps: "1", holdSeconds: 30 }, [{ ...s(0, 1), targetReps: "1" }], 4).holdSeconds, 35);
});

test("jump day: explosive work capped, strength still programmed", () => {
  const many = [...lib, ...[1, 2, 3, 4].map((i) => ex(`bound-${i}`, { category: "plyometric", goals: ["jump"], intensity: 4, impact: "high", defaultDose: { sets: 2, reps: "5" } }))];
  const p = buildPlan({ ...fresh, minutes: 60 }, many);
  const main = p.blocks.find((b) => b.name === "Main")!.items.map((i) => i.exerciseId);
  assert.ok(main.filter((i) => i === "depth-jump" || i.startsWith("bound-")).length <= 2);
  assert.ok(main.includes("back-squat"));
});

// --- recovery ---
import { assessRecovery, outsideEvents, suggestFocus, type LoadEvent } from "./recovery";

const ev = (daysAgo: number, o: Partial<LoadEvent>): LoadEvent => ({ daysAgo, label: "x", category: "strength", region: "lower", intensity: 4, ...o });
const libUp = [...lib, ex("bench-press", { bodyAreas: ["shoulder", "elbow-wrist"], goals: ["strength"], intensity: 4 })];

test("recovery: jumps yesterday -> no plyos today, legs rest, cited", () => {
  const rec = assessRecovery([ev(1, { category: "plyometric", intensity: 5 })]);
  assert.equal(rec.noExplosive, true);
  assert.deepEqual(rec.restRegions, ["lower"]);
  assert.ok(rec.rules.every((r) => r.source.length > 0));
  const p = buildPlan(fresh, lib, [], rec);
  assert.ok(!ids(p).includes("depth-jump"));
  assert.ok(!ids(p).includes("back-squat"));
});

test("recovery: two jump days this week caps explosive work", () => {
  const rec = assessRecovery([ev(3, { category: "plyometric", region: null }), ev(5, { category: "power", region: null })]);
  assert.equal(rec.noExplosive, true);
  assert.equal(assessRecovery([ev(3, { category: "plyometric", region: null })]).noExplosive, false);
});

test("recovery: legs yesterday -> strength focus trains upper body", () => {
  const rec = assessRecovery([ev(1, {})]);
  const p = buildPlan({ ...fresh, focus: ["strength"] }, libUp, [], rec);
  assert.ok(ids(p).includes("bench-press"));
  assert.ok(!ids(p).includes("back-squat"));
});

test("recovery: an hour of basketball today -> no jumps, no heavy legs, no extra conditioning", () => {
  const rec = assessRecovery(outsideEvents([{ kind: "basketball", minutes: 60, hard: true, jumping: true }], 0));
  assert.equal(rec.noExplosive, true);
  assert.equal(rec.noConditioning, true);
  assert.ok(rec.restRegions.includes("lower"));
  assert.deepEqual(suggestFocus(["jump"], rec), ["posture"]);
});

test("recovery: full-body loading rests when any region rests", () => {
  const full = [...libUp, ex("bb-complex", { bodyAreas: ["full-body"], goals: ["strength"], intensity: 3 })];
  assert.ok(!ids(buildPlan({ ...fresh, focus: ["strength"] }, full, [], assessRecovery([ev(1, {})]))).includes("bb-complex"));
  assert.ok(ids(buildPlan({ ...fresh, focus: ["strength"] }, full)).includes("bb-complex"));
});

test("recovery: override keeps the plan but reports the rules", () => {
  const rec = assessRecovery([ev(1, { category: "plyometric", intensity: 5 })]);
  const p = buildPlan({ ...fresh, override: true }, lib, [], rec);
  assert.ok(ids(p).includes("depth-jump"));
  assert.equal(p.rules.length, rec.rules.length);
});

test("recovery: old or light work does not block", () => {
  const rec = assessRecovery([ev(2, {}), ev(1, { category: "mobility", intensity: 2 })]);
  assert.deepEqual(rec, { noExplosive: false, noConditioning: false, restRegions: [], rules: [] });
  assert.deepEqual(suggestFocus(["jump", "power"], rec), ["jump", "power"]);
});
