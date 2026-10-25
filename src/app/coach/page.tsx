"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/profile-context";
import { BODY_AREAS, GOALS } from "../../../corpus/schema";
import type { CheckIn } from "@/lib/engine/plan";
import type { CoachPlan } from "@/lib/coach/build";
import type { Goal } from "../../../corpus/schema";

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
            className={`flex-1 py-1.5 text-sm rounded-md ${n === value ? "bg-primary text-on-primary" : "text-muted"}`}>
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
            className={`px-2.5 py-1 rounded-lg text-xs border ${selected.includes(o) ? "bg-primary text-on-primary border-primary" : "border-border text-muted"}`}>
            {label(o)}
          </button>
        ))}
      </div>
    </div>
  );
}

interface Msg { role: "coach" | "user"; text: string; plan?: CoachPlan }

function PlanCard({ plan, onStart, busy }: { plan: CoachPlan; onStart?: () => void; busy: boolean }) {
  return (
    <div className="mt-3 space-y-3">
      <div className="bg-card border border-border rounded">
        <div className="flex items-baseline justify-between px-4 py-3 border-b border-border">
          <h3 className="text-base">{plan.minutes} minutes</h3>
          <span className="text-xs text-muted tabular">Readiness {plan.readiness}/5</span>
        </div>
        {plan.blocks.map((b) => (
          <section key={b.name}>
            <div className="px-4 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider">
              {b.name === "Alignment" && plan.batDay !== null ? `Alignment, BAT day ${plan.batDay}` : b.name}
            </div>
            <ul>
              {b.items.map((it) => (
                <li key={it.exerciseId} className="px-4 py-2 border-b border-border last:border-b-0">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-heading">{it.name}</span>
                    <span className="text-muted whitespace-nowrap tabular">
                      {[it.dose.sets && `${it.dose.sets} ×`, it.dose.reps, it.dose.holdSeconds && `${it.dose.holdSeconds}s hold`, it.weight && `@ ${it.weight} lb`].filter(Boolean).join(" ")}
                    </span>
                  </div>
                  {!it.progression.startsWith("First time") && <div className="text-xs text-muted mt-0.5">{it.progression}</div>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      {(plan.rules.length > 0 || plan.notes.length > 0) && (
        <details className="text-xs text-muted">
          <summary className="cursor-pointer">Why this session ({plan.rules.length + plan.notes.length})</summary>
          <ul className="mt-2 space-y-2">
            {plan.rules.map((r) => (
              <li key={r.text}>
                <div className="text-foreground">{r.text}</div>
                <div>{r.source}</div>
              </li>
            ))}
            {plan.notes.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </details>
      )}
      {onStart && (
        <button onClick={onStart} disabled={busy}
          className="w-full py-2.5 rounded text-sm font-medium bg-primary text-on-primary disabled:opacity-50">
          {busy ? "Starting…" : "Start this session"}
        </button>
      )}
    </div>
  );
}

export default function Coach() {
  const router = useRouter();
  const { activeProfile } = useProfile();
  const profileId = activeProfile?.id ?? null;
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [goal, setGoal] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState<CheckIn>(DEFAULT);
  const [checkInId, setCheckInId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<"chat" | "start" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adjust, setAdjust] = useState(false);
  const [onboarded, setOnboarded] = useState(true);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileId) return;
    setMsgs([]); setCheckInId(null); setError(null);
    fetch(`/api/coach/opening?profileId=${profileId}`).then((r) => r.json()).then((o: { message: string; suggestedFocus: Goal[]; goal: string | null; minutes: number | null; onboarded: boolean }) => {
      setGoal(o.goal);
      setOnboarded(o.onboarded);
      setCheckIn({ ...DEFAULT, focus: o.suggestedFocus, minutes: o.minutes ?? DEFAULT.minutes });
      setMsgs([{ role: "coach", text: o.message }]);
    });
  }, [profileId]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  const turn = async (message?: string, edited?: CheckIn) => {
    if (!profileId) return;
    if (message) setMsgs((m) => [...m, { role: "user", text: message }]);
    setBusy("chat"); setError(null); setText("");
    try {
      const res = await fetch("/api/coach/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, checkIn: edited ?? checkIn, checkInId, message }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      setCheckIn(json.checkIn); setCheckInId(json.checkInId);
      if (json.goal) setGoal(json.goal);
      setMsgs((m) => [...m, { role: "coach", text: json.summary ?? "Rebuilt with your changes.", plan: json.plan }]);
    } catch (e) { setError((e as Error).message); }
    setBusy(null);
  };

  const start = async () => {
    setBusy("start"); setError(null);
    try {
      const res = await fetch("/api/coach/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ checkInId }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      router.push(`/workout/${json.dayId}`);
    } catch (e) { setError((e as Error).message); setBusy(null); }
  };

  const edit = (patch: Partial<CheckIn>) => setCheckIn((c) => ({ ...c, ...patch }));
  const toggle = <K extends "painAreas" | "focus">(k: K, v: CheckIn[K][number]) =>
    edit({ [k]: (checkIn[k] as string[]).includes(v) ? (checkIn[k] as string[]).filter((x) => x !== v) : [...checkIn[k], v] } as Partial<CheckIn>);
  const lastPlan = msgs.map((m, i) => (m.plan ? i : -1)).reduce((a, b) => Math.max(a, b), -1);

  return (
    <div className="max-w-xl flex flex-col gap-3">
      <div>
        <h1 className="text-xl font-normal">Coach</h1>
        <p className="text-muted text-xs mt-0.5">
          {goal ? `Goal: ${goal}` : "No goal set"} · <Link href="/setup" className="underline">{onboarded ? "Edit setup answers" : "Answer setup questions"}</Link>
        </p>
      </div>

      <div className="divide-y divide-border">
        {msgs.map((m, i) => (
          <div key={i} className="py-4 first:pt-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1">{m.role === "user" ? "You" : "Coach"}</div>
            <div className={`text-sm whitespace-pre-wrap ${m.role === "user" ? "text-muted" : "text-heading"}`}>{m.text}</div>
            {m.plan && <PlanCard plan={m.plan} busy={busy === "start"} onStart={i === lastPlan && checkInId ? start : undefined} />}
          </div>
        ))}
        {busy === "chat" && <div className="py-4 text-sm text-muted">Building the session…</div>}
        {!profileId && <p className="py-4 text-sm text-muted">Pick a profile first.</p>}
        <div ref={end} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-card border border-border rounded p-2 flex gap-2 items-end sticky bottom-2">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && text.trim() && !busy) { e.preventDefault(); turn(text.trim()); } }}
          placeholder="e.g. played basketball for an hour, 30 min left, want jump work"
          className="flex-1 bg-background border border-border rounded-lg p-2 text-sm resize-none" />
        <button onClick={() => turn(text.trim())} disabled={!text.trim() || busy !== null || !profileId}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-primary text-on-primary disabled:opacity-50">Send</button>
      </div>

      <button onClick={() => setAdjust((a) => !a)} className="text-sm text-muted self-start underline">
        {adjust ? "Hide settings" : "Edit settings"}
      </button>
      {adjust && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <Scale name="Energy" value={checkIn.energy} onChange={(energy) => edit({ energy })} low="drained" high="great" />
          <Scale name="Soreness" value={checkIn.soreness} onChange={(soreness) => edit({ soreness })} low="none" high="very sore" />
          <Scale name="Sleep" value={checkIn.sleep ?? 3} onChange={(sleep) => edit({ sleep })} low="bad" high="great" />
          <Chips name="Pain" options={BODY_AREAS} selected={checkIn.painAreas} onToggle={(v) => toggle("painAreas", v)} />
          <Chips name="Focus" options={GOALS} selected={checkIn.focus} onToggle={(v) => toggle("focus", v)} />
          <label className="flex items-center gap-2 text-sm">
            <span className="font-medium">Minutes</span>
            <input type="number" min={5} max={120} value={checkIn.minutes}
              onChange={(e) => edit({ minutes: Number(e.target.value) || 30 })}
              className="w-20 bg-background border border-border rounded-lg px-2 py-1" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!checkIn.override} onChange={(e) => edit({ override: e.target.checked })} />
            Train through recovery rules
          </label>
          <button onClick={() => turn(undefined, checkIn)} disabled={!profileId || checkIn.focus.length === 0 || busy !== null}
            className="w-full py-2 rounded-lg text-sm font-semibold bg-primary text-on-primary disabled:opacity-50">
            Rebuild session
          </button>
        </div>
      )}
    </div>
  );
}
