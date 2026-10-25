"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/profile-context";
import { BODY_AREAS, GOALS } from "../../../corpus/schema";
import type { CheckIn } from "@/lib/engine/plan";
import type { CoachPlan } from "@/lib/coach/build";

const DEFAULT: CheckIn = { energy: 3, soreness: 3, sleep: 3, painAreas: [], focus: ["jump"], minutes: 30 };
const label = (s: string) => s.replace("-", " ");

function Scale({ name, value, onChange, low, high }: { name: string; value: number; onChange: (n: number) => void; low: string; high: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium">{name}</span>
        <span className="text-muted">{low} → {high}</span>
      </div>
      <div className="bg-background border border-border rounded-lg p-1 flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => onChange(n)}
            className={`flex-1 py-1.5 text-sm rounded-md ${n === value ? "bg-primary text-white" : "text-muted"}`}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function Chips<T extends string>({ name, options, selected, onToggle }: { name: string; options: readonly T[]; selected: T[]; onToggle: (v: T) => void }) {
  return (
    <div>
      <div className="text-sm font-medium mb-1">{name}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button key={o} onClick={() => onToggle(o)}
            className={`px-2.5 py-1 rounded-lg text-xs border ${selected.includes(o) ? "bg-primary text-white border-primary" : "border-border text-muted"}`}>
            {label(o)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Coach() {
  const router = useRouter();
  const { activeProfile } = useProfile();
  const activeProfileId = activeProfile?.id ?? null;
  const [text, setText] = useState("");
  const [checkIn, setCheckIn] = useState<CheckIn>(DEFAULT);
  const [summary, setSummary] = useState<string | null>(null);
  const [result, setResult] = useState<{ checkInId: string; plan: CoachPlan } | null>(null);
  const [busy, setBusy] = useState<"read" | "plan" | "start" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<CheckIn>) => { setCheckIn((c) => ({ ...c, ...patch })); setResult(null); };
  const toggle = <K extends "painAreas" | "focus">(k: K, v: CheckIn[K][number]) =>
    set({ [k]: (checkIn[k] as string[]).includes(v) ? (checkIn[k] as string[]).filter((x) => x !== v) : [...checkIn[k], v] } as Partial<CheckIn>);

  const post = async (url: string, body: object) => {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Request failed");
    return json;
  };

  const run = async (kind: "read" | "plan" | "start", fn: () => Promise<void>) => {
    setBusy(kind); setError(null);
    try { await fn(); } catch (e) { setError((e as Error).message); }
    setBusy(null);
  };

  const read = () => run("read", async () => {
    const { summary: s, ...parsed } = await post("/api/coach/parse", { text });
    setSummary(s);
    set({ ...DEFAULT, ...parsed, sleep: parsed.sleep ?? DEFAULT.sleep });
  });
  const plan = () => run("plan", async () => setResult(await post("/api/coach/plan", { profileId: activeProfileId, checkIn, rawText: text || undefined })));
  const start = () => run("start", async () => {
    const { dayId } = await post("/api/coach/start", { checkInId: result!.checkInId });
    router.push(`/workout/${dayId}`);
  });

  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold">Coach</h1>
        <p className="text-muted text-sm mt-0.5">Say how you feel and what you want to work on. The plan comes from your BAT, PT and training library.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3}
          placeholder="Slept 5 hours, lower back is tight, want to work on my vertical. About 40 minutes."
          className="w-full bg-background border border-border rounded-lg p-3 text-sm resize-none" />
        <button onClick={read} disabled={!text.trim() || busy !== null}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-white disabled:opacity-50">
          {busy === "read" ? "Reading…" : "Read it"}
        </button>
        {summary && <p className="text-sm text-muted">{summary}</p>}
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <Scale name="Energy" value={checkIn.energy} onChange={(energy) => set({ energy })} low="drained" high="great" />
        <Scale name="Soreness" value={checkIn.soreness} onChange={(soreness) => set({ soreness })} low="none" high="very sore" />
        <Scale name="Sleep" value={checkIn.sleep ?? 3} onChange={(sleep) => set({ sleep })} low="bad" high="great" />
        <Chips name="Pain" options={BODY_AREAS} selected={checkIn.painAreas} onToggle={(v) => toggle("painAreas", v)} />
        <Chips name="Focus" options={GOALS} selected={checkIn.focus} onToggle={(v) => toggle("focus", v)} />
        <label className="flex items-center gap-2 text-sm">
          <span className="font-medium">Minutes</span>
          <input type="number" min={5} max={120} value={checkIn.minutes}
            onChange={(e) => set({ minutes: Number(e.target.value) || 30 })}
            className="w-20 bg-background border border-border rounded-lg px-2 py-1" />
        </label>
        <button onClick={plan} disabled={!activeProfileId || checkIn.focus.length === 0 || busy !== null}
          className="w-full py-2 rounded-lg text-sm font-semibold bg-primary text-white disabled:opacity-50">
          {busy === "plan" ? "Building…" : "Build my session"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result && (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">{result.plan.minutes} min session</h2>
            <span className="text-sm text-muted">Readiness {result.plan.readiness}/5</span>
          </div>
          {result.plan.notes.map((n) => <p key={n} className="text-sm text-muted">{n}</p>)}
          {result.plan.blocks.map((b) => (
            <div key={b.name} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-2 border-b border-border text-sm font-semibold">
                {b.name === "Alignment" && result.plan.batDay !== null ? `Alignment · BAT Day ${result.plan.batDay}` : b.name}
              </div>
              <ul className="divide-y divide-border">
                {b.items.map((it) => (
                  <li key={it.exerciseId} className="px-4 py-2.5">
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="font-medium">{it.name}</span>
                      <span className="text-muted whitespace-nowrap tabular-nums">
                        {[it.dose.sets && `${it.dose.sets} ×`, it.dose.reps, it.dose.holdSeconds && `${it.dose.holdSeconds}s hold`, it.weight && `@ ${it.weight} lb`].filter(Boolean).join(" ")}
                      </span>
                    </div>
                    <div className="text-xs text-muted mt-0.5">{it.progression}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <button onClick={start} disabled={busy !== null}
            className="w-full py-2.5 rounded-lg text-sm font-semibold bg-primary text-white disabled:opacity-50">
            {busy === "start" ? "Starting…" : "Start this session"}
          </button>
        </div>
      )}
    </div>
  );
}
