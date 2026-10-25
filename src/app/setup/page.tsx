"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/profile-context";
import type { Athlete, LiftAge, PlyoAge } from "@/lib/engine/athlete";
import type { BodyArea, Goal } from "../../../corpus/schema";

const PLYO: [PlyoAge, string][] = [["none", "Never"], ["lt2m", "Under 2 months"], ["2to6m", "2-6 months"], ["6to12m", "6-12 months"], ["1y+", "A year or more"]];
const LIFT: [LiftAge, string][] = [["none", "Never"], ["lt6m", "Under 6 months"], ["6mto2y", "6 months to 2 years"], ["2y+", "2+ years"]];
const FOCUS: [Goal, string][] = [["jump", "Jump higher"], ["strength", "Strength"], ["power", "Power"], ["posture", "Posture"], ["mobility", "Mobility"], ["conditioning", "Conditioning"]];
const TENDON: [BodyArea, string][] = [["knee", "Knees (patellar tendon)"], ["ankle-foot", "Ankles or Achilles"], ["lumbar", "Lower back"], ["pelvis-hip", "Hips"], ["shoulder", "Shoulders"]];

const BLANK: Athlete = { plyoAge: "none", liftAge: "none", standingVert: null, approachVert: null, sport: null, sportPerWeek: 0, sportJumping: true, tendonHistory: [], sessionMinutes: 30 };

function Options<T extends string>({ options, value, onPick, multi }: { options: [T, string][]; value: T[]; onPick: (v: T) => void; multi?: boolean }) {
  return (
    <div role={multi ? "group" : "radiogroup"} className="flex flex-wrap gap-2">
      {options.map(([v, label]) => (
        <button key={v} type="button" role={multi ? "checkbox" : "radio"} aria-checked={value.includes(v)} onClick={() => onPick(v)}
          className={`px-3 py-1.5 rounded text-sm border ${value.includes(v) ? "bg-primary text-on-primary border-primary" : "border-border text-foreground hover:border-primary"}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

function Question({ n, title, why, children }: { n: number; title: string; why: string; children: React.ReactNode }) {
  return (
    <section className="py-5 border-b border-border">
      <h2 className="text-base">{n}. {title}</h2>
      <p className="text-xs text-muted mt-0.5 mb-3">{why}</p>
      {children}
    </section>
  );
}

const num = (s: string) => (s.trim() === "" ? null : Number(s));
const input = "bg-card border border-border rounded px-2 py-1.5 text-sm";

export default function Setup() {
  const router = useRouter();
  const { activeProfile } = useProfile();
  const id = activeProfile?.id;
  const [goal, setGoal] = useState("");
  const [focus, setFocus] = useState<Goal[]>(["jump"]);
  const [a, setA] = useState<Athlete>(BLANK);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/profiles/${id}/onboarding`).then((r) => r.json()).then((p: { goal: string | null; goalFocus: Goal[]; athlete: Athlete | null }) => {
      setGoal(p.goal ?? "");
      if (p.goalFocus.length) setFocus(p.goalFocus);
      setA(p.athlete ?? BLANK);
    });
  }, [id]);

  const set = (patch: Partial<Athlete>) => setA((x) => ({ ...x, ...patch }));
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const save = async () => {
    setSaving(true); setError(null);
    const res = await fetch(`/api/profiles/${id}/onboarding`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal: goal.trim() || null, goalFocus: focus, athlete: { ...a, sport: a.sport?.trim() || null } }),
    });
    if (res.ok) return router.push("/coach");
    setError((await res.json()).error ?? "Could not save");
    setSaving(false);
  };

  if (!id) return <p className="text-sm text-muted">Pick a profile first.</p>;

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-normal">Setup, {activeProfile?.name}</h1>
      <p className="text-sm text-muted mt-1">Seven questions. Each one sets a limit the coach uses when it builds a session. Change them any time.</p>

      <Question n={1} title="What are you training for?" why="Sets the default focus when you don't name one.">
        <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. dunk by summer" className={`${input} w-full mb-3`} />
        <Options options={FOCUS} value={focus} multi onPick={(v) => setFocus((f) => toggle(f, v))} />
      </Question>

      <Question n={2} title="How long have you done jump training or plyometrics consistently?"
        why="Sets how many foot contacts a session can hold and how many of them can be hard landings (CSCS guidelines via The Movement System).">
        <Options options={PLYO} value={[a.plyoAge]} onPick={(plyoAge) => set({ plyoAge })} />
      </Question>

      <Question n={3} title="How long have you lifted weights consistently?"
        why="Depth jumps unlock only with 6+ months of jump training and a strength base.">
        <Options options={LIFT} value={[a.liftAge]} onPick={(liftAge) => set({ liftAge })} />
      </Question>

      <Question n={4} title="What is your vertical jump?"
        why="Measure reach-to-touch with chalk on a wall. If the approach jump adds less than 4 inches, approach mechanics come first (PJF). Leave blank if you don't know.">
        <div className="flex gap-4">
          <label className="text-sm">Standing <input type="number" inputMode="decimal" min={0} max={60} value={a.standingVert ?? ""} onChange={(e) => set({ standingVert: num(e.target.value) })} className={`${input} w-20 ml-1`} /> in</label>
          <label className="text-sm">Approach <input type="number" inputMode="decimal" min={0} max={60} value={a.approachVert ?? ""} onChange={(e) => set({ approachVert: num(e.target.value) })} className={`${input} w-20 ml-1`} /> in</label>
        </div>
      </Question>

      <Question n={5} title="Do you play a sport each week?"
        why="Court time spends the same tendon budget as jumps and fast lifts. 3+ jumping sessions a week means no fast lifting (PJF).">
        <div className="flex flex-wrap items-center gap-3">
          <input value={a.sport ?? ""} onChange={(e) => set({ sport: e.target.value })} placeholder="e.g. basketball" className={`${input} w-40`} />
          <label className="text-sm"><input type="number" min={0} max={14} value={a.sportPerWeek} onChange={(e) => set({ sportPerWeek: Number(e.target.value) || 0 })} className={`${input} w-16 mr-1`} />times a week</label>
          <label className="text-sm flex items-center gap-1.5"><input type="checkbox" checked={a.sportJumping} onChange={(e) => set({ sportJumping: e.target.checked })} />involves jumping</label>
        </div>
      </Question>

      <Question n={6} title="Any past tendon or joint trouble?"
        why="Knee or Achilles history adds an isometric hold before jumping. With 2+ jumping sport sessions a week, it also rules out fast lifting (PJF).">
        <Options options={TENDON} value={a.tendonHistory} multi onPick={(v) => set({ tendonHistory: toggle(a.tendonHistory, v) })} />
      </Question>

      <Question n={7} title="How long is a usual session?" why="The coach starts from this; you can still say '10 minutes' on the day.">
        <label className="text-sm"><input type="number" min={5} max={180} value={a.sessionMinutes} onChange={(e) => set({ sessionMinutes: Number(e.target.value) || 30 })} className={`${input} w-20 mr-1`} />minutes</label>
      </Question>

      {error && <p className="text-sm text-danger mt-4">{error}</p>}
      <button onClick={save} disabled={saving || focus.length === 0}
        className="mt-5 w-full py-2.5 rounded text-sm font-medium bg-primary text-on-primary disabled:opacity-50">
        {saving ? "Saving…" : "Save and go to Coach"}
      </button>
    </div>
  );
}
