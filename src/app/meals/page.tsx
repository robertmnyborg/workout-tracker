"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format, addDays, startOfDay } from "date-fns";
import { useProfile } from "@/lib/profile-context";
import { DailyMacroCard } from "@/components/meals/DailyMacroCard";
import { MealSection, type MealLog } from "@/components/meals/MealSection";
import { WeeklyComplianceCard, type ComplianceRow } from "@/components/meals/WeeklyComplianceCard";
import { BootstrapPrompt } from "@/components/meals/BootstrapPrompt";
import { MEAL_TYPES } from "@/lib/meal-constants";

type Target = { calories: number; protein: number; carbs: number; fat: number };
type Totals = Target;

type MealPlan = {
  id: string;
  name: string;
  isActive: boolean;
  meals: Array<{
    id: string;
    mealType: string;
    title: string;
    variant: number;
    items: Array<{
      food: { name: string };
      gramsMale: number;
      gramsFemale: number;
      notes: string | null;
    }>;
  }>;
};

export default function MealsPage() {
  const { activeProfile, hydrated } = useProfile();
  const [date, setDate] = useState(() => startOfDay(new Date()));
  const [target, setTarget] = useState<Target | null>(null);
  const [totals, setTotals] = useState<Totals>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [compliance, setCompliance] = useState<ComplianceRow[]>([]);
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const dateStr = format(date, "yyyy-MM-dd");
  const isToday = dateStr === format(new Date(), "yyyy-MM-dd");
  const profileId = activeProfile?.id;

  const load = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    const [tRes, mRes, sRes, cRes, pRes] = await Promise.all([
      fetch(`/api/nutrition/targets?profileId=${profileId}`),
      fetch(`/api/meals?profileId=${profileId}&date=${dateStr}`),
      fetch(`/api/meals/totals?profileId=${profileId}&date=${dateStr}`),
      fetch(`/api/meals/weekly-compliance?profileId=${profileId}&date=${dateStr}`),
      fetch(`/api/meal-plans?profileId=${profileId}`),
    ]);
    const [t, m, s, c, p] = await Promise.all([
      tRes.json(),
      mRes.json(),
      sRes.json(),
      cRes.json(),
      pRes.json(),
    ]);
    setTarget(t);
    setMeals(m);
    setTotals(s);
    setCompliance(c);
    setPlans(p);
    setLoading(false);
  }, [profileId, dateStr]);

  useEffect(() => {
    load();
  }, [load]);

  if (!hydrated) return null;
  if (!activeProfile) {
    return (
      <div className="text-center py-12 text-muted">
        Create a profile to start meal tracking.
      </div>
    );
  }

  if (!loading && !target) {
    return (
      <div className="py-8">
        <BootstrapPrompt
          profileId={activeProfile.id}
          profileName={activeProfile.name}
          onDone={load}
        />
      </div>
    );
  }

  const activePlan = plans.find((p) => p.isActive) ?? null;
  const profileIsFemale = activeProfile.name.toLowerCase().match(/female|she|her/);

  // Build plan suggestions grouped by meal type from active plan
  const planByMealType = new Map<string, MealPlan["meals"]>();
  if (activePlan) {
    for (const m of activePlan.meals) {
      const arr = planByMealType.get(m.mealType) ?? [];
      arr.push(m);
      planByMealType.set(m.mealType, arr);
    }
  }

  const buildSuggestions = (mealType: string) => {
    const mealsForType = planByMealType.get(mealType) ?? [];
    return mealsForType.slice(0, 2).map((m) => ({
      title: m.title,
      items: m.items.slice(0, 3).map((it) => ({
        name: it.food.name,
        grams: profileIsFemale ? it.gramsFemale : it.gramsMale,
        notes: it.notes ?? undefined,
      })),
    }));
  };

  const logByType = new Map<string, MealLog>();
  for (const m of meals) logByType.set(m.mealType, m);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Meals</h1>
        <div className="flex items-center gap-1">
          <Link
            href="/meals/plans"
            className="px-3 py-1.5 text-xs text-muted hover:text-foreground border border-border rounded-lg"
          >
            Plans
          </Link>
          <Link
            href="/meals/foods"
            className="px-3 py-1.5 text-xs text-muted hover:text-foreground border border-border rounded-lg"
          >
            Foods
          </Link>
          <Link
            href="/meals/progress"
            className="px-3 py-1.5 text-xs text-muted hover:text-foreground border border-border rounded-lg"
          >
            Progress
          </Link>
        </div>
      </header>

      <div className="flex items-center justify-between bg-card border border-border rounded-lg px-3 py-2">
        <button
          onClick={() => setDate(addDays(date, -1))}
          className="px-3 py-1 text-sm text-muted hover:text-foreground"
        >
          ←
        </button>
        <div className="text-sm font-medium text-foreground">
          {format(date, "EEEE, MMM d")}
          {isToday && <span className="ml-2 text-xs text-accent">today</span>}
        </div>
        <button
          onClick={() => setDate(addDays(date, 1))}
          disabled={isToday}
          className="px-3 py-1 text-sm text-muted hover:text-foreground disabled:opacity-30"
        >
          →
        </button>
      </div>

      {target && (
        <DailyMacroCard target={target} totals={totals} />
      )}

      <WeeklyComplianceCard rows={compliance} activePlanName={activePlan?.name} />

      <div className="space-y-3">
        {MEAL_TYPES.map((mt) => (
          <MealSection
            key={mt}
            mealType={mt}
            profileId={activeProfile.id}
            date={dateStr}
            log={logByType.get(mt) ?? null}
            suggestions={buildSuggestions(mt)}
            onMutate={load}
          />
        ))}
      </div>

      {activePlan && (
        <div className="text-xs text-center text-muted py-4">
          Active plan: <span className="text-foreground">{activePlan.name}</span>
        </div>
      )}
    </div>
  );
}
