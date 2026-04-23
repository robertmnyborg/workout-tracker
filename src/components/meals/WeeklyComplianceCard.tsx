"use client";

export type ComplianceRow = {
  tag: string;
  label: string;
  target: number;
  actual: number;
  met: boolean;
  appliesTo: "both" | "western" | "asian";
};

type Props = {
  rows: ComplianceRow[];
  activePlanName?: string | null;
};

export function WeeklyComplianceCard({ rows, activePlanName }: Props) {
  const isAsian = (activePlanName ?? "").toLowerCase().includes("asian");
  const scope = isAsian ? "asian" : "western";
  const filtered = rows.filter((r) => r.appliesTo === "both" || r.appliesTo === scope);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Weekly Non-Negotiables</h3>
        <span className="text-xs text-muted">last 7 days</span>
      </div>
      <ul className="space-y-2">
        {filtered.map((r) => (
          <li key={r.tag} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-xs ${
                  r.met ? "bg-green-500/20 text-green-600" : "bg-background text-muted"
                }`}
                aria-hidden
              >
                {r.met ? "✓" : ""}
              </span>
              <span className="text-sm text-foreground truncate">{r.label}</span>
            </div>
            <span className={`text-xs shrink-0 ${r.met ? "text-green-600" : "text-muted"}`}>
              {r.actual} / {r.target}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
