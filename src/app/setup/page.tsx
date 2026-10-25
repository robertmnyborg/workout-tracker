"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/profile-context";
import type { Athlete, LiftAge, PlyoAge } from "@/lib/engine/athlete";
import type { BodyArea, Goal } from "../../../corpus/schema";

const PLYO: [PlyoAge, string][] = [["none", "Never"], ["lt2m", "Under 2 months"], ["2to6m", "2-6 months"], ["6to12m", "6-12 months"], ["1y+", "A year or more"]];
const LIFT: [LiftAge, string][] = [["none", "Never"], ["lt6m", "Under 6 months"], ["6mto2y", "6 months to 2 years"], ["2y+", "2+ years"]];
const FOCUS: [Goal, string][] = [["jump", "Jump higher"], ["strength", "Strength"], ["power", "Power"], ["posture", "Posture"], ["mobility", "Mobility"], ["conditioning", "Conditioning"]];
const TENDON: [BodyArea, string][] = [["knee", "Knees (patellar tendon)"], ["ankle-foot", "Ankles or Achilles"], ["lumbar", "Lower back"], ["pelvis-hip", "Hips"], ["shoulder", "Shoulders"]];

const BLANK: Athlete = { plyoAge: "none", liftAge: "none", standingVert: null, approachVert: null, sport: null, sportPerWeek: 0, sportJumping: true, tendonHistory: [], sessionMinutes: 30 };
const labelOf = <T,>(opts: [T, string][], v: T) => opts.find(([k]) => k === v)?.[1] ?? "";
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const num = (s: string) => (s.trim() === "" ? null : Number(s));
const input = "bg-card border border-border rounded px-2 py-1.5 text-sm";

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

interface Answers { goal: string; focus: Goal[]; a: Athlete }
interface Step {
  ask: string;
  why: string;
  answer: (x: Answers) => string; // the "You" line once answered
  ready: (x: Answers) => boolean;
  blank?: (x: Answers) => boolean; // unanswered but allowed: the button says Skip
  form: (x: Answers, set: (p: Partial<Athlete>) => void, setX: (p: Partial<Answers>) => void) => React.ReactNode;
}

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

const STEPS: Step[] = [
  {
    ask: "What are you training for?",
    why: "This sets the focus I suggest on days you don't name one.",
    answer: (x) => [x.goal.trim(), x.focus.map((f) => labelOf(FOCUS, f)).join(", ")].filter(Boolean).join(". "),
    ready: (x) => x.focus.length > 0,
    form: (x, _, setX) => (
      <>
        <Options options={FOCUS} value={x.focus} multi onPick={(v) => setX({ focus: toggle(x.focus, v) })} />
        <input value={x.goal} onChange={(e) => setX({ goal: e.target.value })} placeholder="In your words, optional: dunk by summer" className={`${input} w-full mt-3`} />
      </>
    ),
  },
  {
    ask: "How long have you trained jumps and lifted weights, consistently?",
    why: "Jump history sets how many foot contacts and hard landings a session can hold. Depth jumps unlock after 6+ months of both.",
    answer: (x) => `Jumps: ${labelOf(PLYO, x.a.plyoAge).toLowerCase()}. Lifting: ${labelOf(LIFT, x.a.liftAge).toLowerCase()}.`,
    ready: () => true,
    form: (x, set) => (
      <div className="space-y-3">
        <div><div className="text-xs text-muted mb-1.5">Jump training or plyometrics</div><Options options={PLYO} value={[x.a.plyoAge]} onPick={(plyoAge) => set({ plyoAge })} /></div>
        <div><div className="text-xs text-muted mb-1.5">Lifting</div><Options options={LIFT} value={[x.a.liftAge]} onPick={(liftAge) => set({ liftAge })} /></div>
      </div>
    ),
  },
  {
    ask: "What's your vertical? Reach-to-touch, chalk on a wall.",
    why: "If a run-up adds less than 4 inches over standing, approach mechanics come first. Skip it if you don't know; the weekly test on Progress fills it in.",
    answer: (x) => (x.a.standingVert == null && x.a.approachVert == null ? "Don't know yet."
      : `Standing ${x.a.standingVert ?? "?"} in, approach ${x.a.approachVert ?? "?"} in.`),
    ready: () => true,
    blank: (x) => x.a.standingVert == null && x.a.approachVert == null,
    form: (x, set) => (
      <div className="flex flex-wrap gap-4">
        <label className="text-sm">Standing <input type="number" inputMode="decimal" min={0} max={60} value={x.a.standingVert ?? ""} onChange={(e) => set({ standingVert: num(e.target.value) })} className={`${input} w-20 ml-1`} /> in</label>
        <label className="text-sm">Approach <input type="number" inputMode="decimal" min={0} max={60} value={x.a.approachVert ?? ""} onChange={(e) => set({ approachVert: num(e.target.value) })} className={`${input} w-20 ml-1`} /> in</label>
      </div>
    ),
  },
  {
    ask: "Do you play a sport each week?",
    why: "Court time draws on the same tendon budget as jumps and fast lifts. 3+ jumping sessions a week means no fast lifting in here.",
    answer: (x) => (x.a.sportPerWeek ? `${cap(x.a.sport?.trim() || "sport")} ${x.a.sportPerWeek}x a week${x.a.sportJumping ? ", with jumping" : ""}.` : "No."),
    ready: () => true,
    form: (x, set) => (
      <div className="flex flex-wrap items-center gap-3">
        <input value={x.a.sport ?? ""} onChange={(e) => set({ sport: e.target.value })} placeholder="e.g. basketball" className={`${input} w-40`} />
        <label className="text-sm"><input type="number" min={0} max={14} value={x.a.sportPerWeek} onChange={(e) => set({ sportPerWeek: Number(e.target.value) || 0 })} className={`${input} w-16 mr-1`} />times a week</label>
        <label className="text-sm flex items-center gap-1.5"><input type="checkbox" checked={x.a.sportJumping} onChange={(e) => set({ sportJumping: e.target.checked })} />involves jumping</label>
      </div>
    ),
  },
  {
    ask: "Any past tendon or joint trouble?",
    why: "Knee or Achilles history adds an isometric hold before jumping, and with 2+ sport sessions a week it rules out fast lifting.",
    answer: (x) => (x.a.tendonHistory.length ? x.a.tendonHistory.map((b) => labelOf(TENDON, b)).join(", ") + "." : "None."),
    ready: () => true,
    form: (x, set) => <Options options={TENDON} value={x.a.tendonHistory} multi onPick={(v) => set({ tendonHistory: toggle(x.a.tendonHistory, v) })} />,
  },
];

export default function Setup() {
  const router = useRouter();
  const { activeProfile } = useProfile();
  const id = activeProfile?.id;
  const [x, setXState] = useState<Answers>({ goal: "", focus: ["jump"], a: BLANK });
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const current = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    setStep(0);
    fetch(`/api/profiles/${id}/onboarding`).then((r) => r.json()).then((p: { goal: string | null; goalFocus: Goal[]; athlete: Athlete | null }) => {
      setXState({ goal: p.goal ?? "", focus: p.goalFocus.length ? p.goalFocus : ["jump"], a: p.athlete ?? BLANK });
    });
  }, [id]);
  useEffect(() => { current.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [step]);

  const setX = (p: Partial<Answers>) => setXState((s) => ({ ...s, ...p }));
  const set = (p: Partial<Athlete>) => setXState((s) => ({ ...s, a: { ...s.a, ...p } }));
  const last = step === STEPS.length - 1;

  const next = async () => {
    if (!last) return setStep(step + 1);
    setSaving(true); setError(null);
    const res = await fetch(`/api/profiles/${id}/onboarding`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal: x.goal.trim() || null, goalFocus: x.focus, athlete: { ...x.a, sport: x.a.sport?.trim() || null } }),
    });
    if (res.ok) return router.push("/coach");
    setError((await res.json()).error ?? "Could not save");
    setSaving(false);
  };

  if (!id) return <p className="text-sm text-muted">Pick a profile first.</p>;
  const s = STEPS[step];

  return (
    <div className="max-w-xl">
      <div className="sticky top-[93px] sm:top-[53px] z-10 bg-background pt-1 pb-3">
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-normal">Setup</h1>
          <span className="text-xs text-muted tabular">Question {step + 1} of {STEPS.length}</span>
        </div>
        <div className="flex gap-1 mt-2" aria-hidden>
          {STEPS.map((_, i) => <div key={i} className={`h-1 flex-1 rounded-sm ${i <= step ? "bg-teal" : "bg-border"}`} />)}
        </div>
      </div>

      <div className="divide-y divide-border">
        {STEPS.slice(0, step).map((done, i) => (
          <div key={i} className="py-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1">Coach</div>
            <div className="text-sm text-heading">{done.ask}</div>
            <div className="flex items-baseline justify-between gap-3 mt-2">
              <div className="text-sm text-muted"><span className="text-[11px] font-bold uppercase tracking-wider mr-2">You</span>{done.answer(x)}</div>
              <button onClick={() => setStep(i)} className="text-xs underline text-muted hover:text-heading shrink-0">Change</button>
            </div>
          </div>
        ))}

        <div ref={current} className="py-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1">Coach</div>
          <div className="text-sm text-heading">{s.ask}</div>
          <p className="text-xs text-muted mt-1 mb-3">{s.why}</p>
          {s.form(x, set, setX)}
          {error && <p className="text-sm text-danger mt-3">{error}</p>}
          <div className="flex gap-2 mt-4">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="px-4 py-2 rounded text-sm border border-border text-foreground">Back</button>
            )}
            <button onClick={next} disabled={!s.ready(x) || saving}
              className="flex-1 py-2 rounded text-sm font-medium bg-primary text-on-primary disabled:opacity-50">
              {last ? (saving ? "Saving…" : "Finish and go to Coach") : s.blank?.(x) ? "Skip" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
