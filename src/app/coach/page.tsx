"use client";

import { useEffect, useRef, useState } from "react";
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

interface Msg { role: "coach" | "user"; text: string; plan?: CoachPlan }

function PlanCard({ plan, onStart, busy }: { plan: CoachPlan; onStart?: () => void; busy: boolean }) {
  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-semibold">{plan.minutes} min session</span>
        <span className="text-muted">Readiness {plan.readiness}/5</span>
      </div>
      {plan.rules.map((r) => (
        <div key={r.text} className="text-xs border-l-2 border-primary pl-2">
          <div>{r.text}</div>
          <div className="text-muted mt-0.5">Source: {r.source}</div>
        </div>
      ))}
      {plan.notes.map((n) => <p key={n} className="text-xs text-muted">{n}</p>)}
      {plan.blocks.map((b) => (
        <div key={b.name} className="bg-background border border-border rounded-lg overflow-hidden">
          <div className="px-3 py-1.5 border-b border-border text-xs font-semibold">
            {b.name === "Alignment" && plan.batDay !== null ? `Alignment · BAT Day ${plan.batDay}` : b.name}
          </div>
          <ul className="divide-y divide-border">
            {b.items.map((it) => (
              <li key={it.exerciseId} className="px-3 py-2">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="font-medium">{it.name}</span>
                  <span className="text-muted whitespace-nowrap tabular-nums">
                    {[it.dose.sets && `${it.dose.sets} ×`, it.dose.reps, it.dose.holdSeconds && `${it.dose.holdSeconds}s hold`, it.weight && `@ ${it.weight} lb`].filter(Boolean).join(" ")}
                  </span>
                </div>
                {!it.progression.startsWith("First time") && <div className="text-xs text-muted mt-0.5">{it.progression}</div>}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {onStart && (
        <button onClick={onStart} disabled={busy}
          className="w-full py-2 rounded-lg text-sm font-semibold bg-primary text-white disabled:opacity-50">
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
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileId) return;
    setMsgs([]); setCheckInId(null); setError(null);
    fetch(`/api/coach/opening?profileId=${profileId}`).then((r) => r.json()).then((o: { message: string; suggestedFocus: Goal[]; goal: string | null }) => {
      setGoal(o.goal);
      setCheckIn({ ...DEFAULT, focus: o.suggestedFocus });
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
        <h1 className="text-2xl font-bold">Coach</h1>
        <p className="text-muted text-sm mt-0.5">{goal ? `Goal: ${goal}` : "No standing goal yet"}</p>
      </div>

      <div className="space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            <div className={m.role === "user"
              ? "bg-primary text-white rounded-xl rounded-br-sm px-3 py-2 text-sm max-w-[85%] whitespace-pre-wrap"
              : "bg-card border border-border rounded-xl rounded-bl-sm px-3 py-2 text-sm whitespace-pre-wrap"}>
              {m.text}
              {m.plan && <PlanCard plan={m.plan} busy={busy === "start"} onStart={i === lastPlan && checkInId ? start : undefined} />}
            </div>
          </div>
        ))}
        {busy === "chat" && <div className="text-sm text-muted">Coach is thinking (10-20 seconds)…</div>}
        {!profileId && <p className="text-sm text-muted">Pick a profile first.</p>}
        <div ref={end} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-card border border-border rounded-xl p-2 flex gap-2 items-end sticky bottom-2">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && text.trim() && !busy) { e.preventDefault(); turn(text.trim()); } }}
          placeholder="Played an hour of basketball, knees feel fine, 30 minutes left. Want to work on my jump."
          className="flex-1 bg-background border border-border rounded-lg p-2 text-sm resize-none" />
        <button onClick={() => turn(text.trim())} disabled={!text.trim() || busy !== null || !profileId}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-primary text-white disabled:opacity-50">Send</button>
      </div>

      <button onClick={() => setAdjust((a) => !a)} className="text-sm text-muted self-start underline">
        {adjust ? "Hide adjust" : "Adjust settings by hand"}
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
            className="w-full py-2 rounded-lg text-sm font-semibold bg-primary text-white disabled:opacity-50">
            Rebuild session
          </button>
        </div>
      )}
    </div>
  );
}
