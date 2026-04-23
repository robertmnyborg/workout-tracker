"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useProfile } from "@/lib/profile-context";
import { MacroChart } from "@/components/meals/MacroChart";

type Point = {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type Target = { calories: number; protein: number; carbs: number; fat: number };

export default function MealsProgressPage() {
  const { activeProfile } = useProfile();
  const [data, setData] = useState<Point[]>([]);
  const [target, setTarget] = useState<Target | null>(null);
  const [days, setDays] = useState(30);

  const load = useCallback(async () => {
    if (!activeProfile) return;
    const [pRes, tRes] = await Promise.all([
      fetch(`/api/meals/progress?profileId=${activeProfile.id}&days=${days}`),
      fetch(`/api/nutrition/targets?profileId=${activeProfile.id}`),
    ]);
    setData(await pRes.json());
    setTarget(await tRes.json());
  }, [activeProfile, days]);

  useEffect(() => {
    load();
  }, [load]);

  if (!activeProfile) return <div className="text-muted">Select a profile.</div>;
  if (!target) {
    return (
      <div className="text-sm text-muted">
        Set up your nutrition targets first via <Link href="/meals" className="text-accent">Meals</Link>.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/meals" className="text-xs text-muted hover:text-foreground">
            ← Meals
          </Link>
          <h1 className="text-2xl font-bold text-foreground mt-1">Macro Progress</h1>
        </div>
        <div className="flex gap-1">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                days === d
                  ? "bg-primary text-white"
                  : "text-muted hover:text-foreground border border-border"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </header>

      <ChartCard title="Calories" unit="kcal">
        <MacroChart data={data} dataKey="calories" label="Calories" unit="kcal" color="#1a3a5c" target={target.calories} />
      </ChartCard>

      <ChartCard title="Protein" unit="g">
        <MacroChart data={data} dataKey="protein" label="Protein" unit="g" color="#4a90d9" target={target.protein} />
      </ChartCard>

      <ChartCard title="Carbs" unit="g">
        <MacroChart data={data} dataKey="carbs" label="Carbs" unit="g" color="#6b839e" target={target.carbs} />
      </ChartCard>

      <ChartCard title="Fat" unit="g">
        <MacroChart data={data} dataKey="fat" label="Fat" unit="g" color="#5b9bd5" target={target.fat} />
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  unit,
  children,
}: {
  title: string;
  unit: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <span className="text-xs text-muted">{unit}</span>
      </div>
      {children}
    </div>
  );
}
