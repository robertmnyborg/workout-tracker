"use client";

import { useCallback, useEffect, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "@/lib/theme-context";
import type { Phase } from "@/lib/engine/phase";

interface Test { id: string; date: string; standing: number | null; approach: number | null }
interface Jump { blockStart: string | null; phase: Phase | null; tests: Test[] }

// Validated pair (dataviz validate_palette.js): blue = standing, orange = approach.
const COLORS = { light: { standing: "#2a78d6", approach: "#eb6834" }, dark: { standing: "#3987e5", approach: "#d95926" } };
const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const delta = (a: number | null | undefined, b: number | null | undefined) =>
  a == null || b == null ? null : Math.round((b - a) * 10) / 10;
const signed = (n: number | null) => (n === null ? "–" : `${n > 0 ? "+" : ""}${n} in`);
const num = (s: string) => (s.trim() === "" ? null : Number(s));

export function JumpTestCard({ profileId }: { profileId: string }) {
  const { theme } = useTheme();
  const [data, setData] = useState<Jump | null>(null);
  const [standing, setStanding] = useState("");
  const [approach, setApproach] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"chart" | "table">("table");

  const load = useCallback(() => {
    fetch(`/api/profiles/${profileId}/jump`).then((r) => r.json()).then((j: Jump) => {
      setData(j);
      if (j.tests.length >= 3) setView("chart");
    });
  }, [profileId]);
  useEffect(load, [load]);

  const save = async () => {
    setError(null);
    const res = await fetch(`/api/profiles/${profileId}/jump`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ standing: num(standing), approach: num(approach) }),
    });
    if (!res.ok) return setError((await res.json()).error ?? "Could not save");
    setStanding(""); setApproach(""); load();
  };

  const startBlock = async () => {
    await fetch(`/api/profiles/${profileId}/jump`, { method: "PUT" });
    load();
  };

  if (!data) return null;
  const { phase, tests } = data;
  const first = tests[0], last = tests[tests.length - 1];
  const c = COLORS[theme];
  const input = "bg-background border border-border rounded px-2 py-1.5 text-sm w-20";

  return (
    <section className="bg-card border border-border rounded">
      <div className="flex items-baseline justify-between gap-3 px-4 py-3 border-b border-border">
        <h2 className="text-base">Jump test</h2>
        {phase?.phase ? (
          <span className="text-xs text-muted tabular">Week {phase.week} of 12 · phase {phase.phase}</span>
        ) : (
          <button onClick={startBlock} className="text-xs underline text-muted hover:text-heading">
            {phase ? "Block done. Start a new 12-week block" : "Start a 12-week block"}
          </button>
        )}
      </div>

      <div className="px-4 py-3 space-y-3">
        {phase && <p className="text-xs text-muted">{phase.rule.text}</p>}
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">Standing <input type="number" inputMode="decimal" step="0.5" value={standing} onChange={(e) => setStanding(e.target.value)} className={input} /> in</label>
          <label className="text-sm">Approach <input type="number" inputMode="decimal" step="0.5" value={approach} onChange={(e) => setApproach(e.target.value)} className={input} /> in</label>
          <button onClick={save} disabled={!standing && !approach} className="px-3 py-1.5 rounded text-sm font-medium bg-primary text-on-primary disabled:opacity-50">Log today</button>
        </div>
        <p className="text-xs text-muted">Once a week, after your usual warm-up: 3 tries each, reach-to-touch with chalk on a wall, log the best. Expect up to 1-2 in a month.</p>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>

      {tests.length > 0 && (
        <div className="border-t border-border">
          <div className="flex items-center justify-between px-4 pt-3">
            <span className="text-xs text-muted">
              Since {day(first.date)}: standing {signed(delta(first.standing, last.standing))}, approach {signed(delta(first.approach, last.approach))}
            </span>
            {tests.length >= 2 && (
              <div className="flex text-xs border border-border rounded">
                {(["chart", "table"] as const).map((v) => (
                  <button key={v} onClick={() => setView(v)} aria-pressed={view === v}
                    className={`px-2 py-0.5 capitalize ${view === v ? "bg-primary text-on-primary" : "text-muted"}`}>{v}</button>
                ))}
              </div>
            )}
          </div>

          {view === "chart" && tests.length >= 2 ? (
            <div className="h-56 px-2 py-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tests.map((t) => ({ ...t, label: day(t.date) }))} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={theme === "dark" ? "#2a2a3e" : "#e1e0d9"} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--color-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[(m: number) => Math.floor(m - 1), (m: number) => Math.ceil(m + 1)]} allowDecimals={false} tick={{ fontSize: 11, fill: "var(--color-muted)" }} axisLine={false} tickLine={false} unit='"' />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4, background: "var(--color-card)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
                    formatter={(v, name) => [`${v} in`, name]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} iconType="plainline"
                    formatter={(v) => <span style={{ color: "var(--color-foreground)" }}>{v}</span>} />
                  <Line name="Standing" dataKey="standing" stroke={c.standing} strokeWidth={2} dot={{ r: 4, fill: c.standing }} connectNulls isAnimationActive={false} />
                  <Line name="Approach" dataKey="approach" stroke={c.approach} strokeWidth={2} dot={{ r: 4, fill: c.approach }} connectNulls isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <table className="w-full text-sm mt-2">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-left">
                  <th className="px-4 py-1.5 font-bold">Date</th>
                  <th className="px-4 py-1.5 font-bold text-right">Standing</th>
                  <th className="px-4 py-1.5 font-bold text-right">Approach</th>
                  <th className="px-4 py-1.5 font-bold text-right">Gap</th>
                </tr>
              </thead>
              <tbody>
                {[...tests].reverse().map((t) => (
                  <tr key={t.id} className="border-t border-border">
                    <td className="px-4 py-1.5 whitespace-nowrap">{day(t.date)}</td>
                    <td className="px-4 py-1.5 text-right">{t.standing ?? "–"}</td>
                    <td className="px-4 py-1.5 text-right">{t.approach ?? "–"}</td>
                    <td className="px-4 py-1.5 text-right text-muted">{signed(delta(t.standing, t.approach))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  );
}
