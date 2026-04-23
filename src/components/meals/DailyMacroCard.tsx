"use client";

type Target = { calories: number; protein: number; carbs: number; fat: number };
type Totals = Target;

function Bar({
  label,
  actual,
  target,
  unit,
  color,
}: {
  label: string;
  actual: number;
  target: number;
  unit: string;
  color: string;
}) {
  const pct = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
  const over = target > 0 && actual > target;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs font-medium text-muted uppercase tracking-wide">
          {label}
        </span>
        <span className="text-sm">
          <span className={`font-semibold ${over ? "text-red-500" : "text-foreground"}`}>
            {Math.round(actual)}
          </span>
          <span className="text-muted"> / {target} {unit}</span>
        </span>
      </div>
      <div className="h-2 bg-background rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: over ? "#ef4444" : color }}
        />
      </div>
    </div>
  );
}

export function DailyMacroCard({
  target,
  totals,
}: {
  target: Target;
  totals: Totals;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <Bar label="Calories" actual={totals.calories} target={target.calories} unit="kcal" color="#1a3a5c" />
      <Bar label="Protein" actual={totals.protein} target={target.protein} unit="g" color="#4a90d9" />
      <Bar label="Carbs" actual={totals.carbs} target={target.carbs} unit="g" color="#6b839e" />
      <Bar label="Fat" actual={totals.fat} target={target.fat} unit="g" color="#5b9bd5" />
    </div>
  );
}
